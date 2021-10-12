const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const FormData = require('form-data');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const express = require('express');
const cookieParser = require('cookie-parser');
let sessStore = require('express-session');
var store = new sessStore.MemoryStore();
const session = require('express-session')({
	secret: "87of78yuhnj54435fujhdg",
	resave: true,
	store: store,
	saveUninitialized: true
});
const { ShardingManager } = require('discord.js');
const { clientID, clientSecret, redirectUri, guildRedirectUri, token, privateKeyDir, certificateDir } = require('./settings.js');

var guildSession = {};
var queueSessions = {};

var privIO = require('socket.io')(5000);
privIO.on("connection", (socket) => {
	socket.on("chatMsg", (msg => {
		for (let user in guildSession[msg.guildID]) {
			store.get(guildSession[msg.guildID][user], (error, result) => {
				if (result && Object.keys(io.to(result.socketID).connected).length) {
					io.to(result.socketID).emit("chatMsg", msg);
				}
			});
		}
	}));
	socket.on("nextSong", (guild => {
		for (let user in queueSessions[guild.guild]) {
			store.get(queueSessions[guild.guild][user], (error, result) => {
				if (result && Object.keys(io.to(result.socketID).connected).length) {
					io.to(result.socketID).emit("nextSong", guild);
				}
			});
		}
	}));
});


const manager = new ShardingManager('./bot/index.js', { token: token });
manager.spawn();
manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));

var privateKey = fs.readFileSync(privateKeyDir);
var certificate = fs.readFileSync(certificateDir);

var credentials = {key: privateKey, cert: certificate};

var app = express();

var httpsServer = https.createServer(credentials, app)
var httpServer = http.createServer(function (req, res) {
	try {
		res.writeHead(301, { "Location": "https://" + req.headers['host'].replace(80,443) + req.url });
	} catch(e) {}
	res.end();
});
httpsServer.listen(443);
httpServer.listen(80);
io = require("socket.io")(httpsServer),

app.set('view engine', 'pug');

function ensureToken(req, res, next) {
	if (!req.session.token) {
		res.writeHead(302, {
			'Location': '/logout'
		});
		res.end();
	} else {
		next();
	}
}

function alwaysRun(req, res, next) {
	if (req.session.guilds == undefined) {
		req.session.guilds = {}
	}
	next();
}

app.use(session);

var sharedsession = require("express-socket.io-session");

io.use(sharedsession(session, {
		autoSave: true,
		secret: "e9098f90uhfd9h0df",
		resave: true,
		saveUninitialized: true
	})
);

app.use(cookieParser());

app.use(express.json());

app.use('/public', express.static('views/public'));

app.use(alwaysRun);

io.on("connection", function(socket) {
	socket.handshake.session.socketID = socket.id;
	socket.handshake.session.save();

	socket.on('disconnect', function() {
		for (let guild in guildSession) {
			let index = guildSession[guild].indexOf(socket.handshake.session.id);
			if (index > -1) {
				guildSession[guild].splice(index, 1);
			}
		}
	});
});

app.get('/', async function(req, res){
	let user;
	if (req.session.token) {
		if (!req.session.user) {
			user = await getUser(req.session.token.tokenType, req.session.token.accessToken);
		} else {
			user = req.session.user;
		}
	}
	res.render("index", {login: !req.session.token, clientID: clientID, user: user, redirectUri: redirectUri});
});

app.get('/about', async function(req, res){
	let user;
	if (req.session.token) {
		if (!req.session.user) {
			user = await getUser(req.session.token.tokenType, req.session.token.accessToken);
		} else {
			user = req.session.user;
		}
	}
	res.render("about", {login: !req.session.token, clientID: clientID, user: user, redirectUri: redirectUri});
});

app.get('/logout', function(req, res){
	res.cookie("accessToken", "");
	res.cookie("tokenType", "");
	req.session.destroy();
	res.writeHead(302, {
		'Location': '/'
	});
	res.end();
});

app.get('/discordOAuth2', function(req, res){
	const urlObj = url.parse(req.url, true);
	const code = urlObj.query.code;
	if (code) {
		getToken(code).then((response) => {
			req.session.token = {
				accessToken: response.access_token,
				tokenType: response.token_type
			};
			res.cookie("accessToken", response.access_token);
			res.cookie("tokenType", response.token_type);
			req.session.validGuilds = {};
			return req;
		}).then((req) => {
			getUser(req.session.token.tokenType, req.session.token.accessToken).then((response) => {
				req.session.user = response;

				res.writeHead(302, {
					'Location': '/servers'
				});
				res.end();
			});
		});
	}
});

app.get('/servers', async function(req, res) {
	if (req.session.token) {
		getServers(req.session.token.tokenType, req.session.token.accessToken, req).then(async (userGuilds) => {
			if (userGuilds == 429) {
				setTimeout(() => {
					res.writeHead(302, {
						'Location': '/servers'
					});
					res.end();
				}, 1000);
			} else if (!userGuilds) {
				res.writeHead(302, {
					'Location': `/logout`
				});
				res.end();
			} else {
				let botGuildsArr = await manager.broadcastEval(`
					let guilds = [];
					this.guilds.cache.forEach((guild) => {
						guilds.push(guild.id);
					})
					Promise.resolve(guilds);
				`);
				let botGuilds = [].concat.apply([], botGuildsArr).filter(Boolean);
				res.render("servers", { userGuilds: userGuilds, botGuilds: botGuilds, user: req.session.user, login: false, clientID: clientID, redirectUri: guildRedirectUri });
			}
		});
	} else {
		res.writeHead(302, {
			'Location': `https://discord.com/api/oauth2/authorize?client_id=${clientID}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email%20guilds`
		});
		res.end();
	}
});

app.get("/queue/:guildID", async function(req, res) {
	let queueArr = await manager.broadcastEval(`
		let guild = this.guilds.cache.get("${req.params.guildID}");
		if (guild) {
			let queue = this.serverSettings.get("${req.params.guildID}", "queue");
			let currentSong = this.serverSettings.get("${req.params.guildID}", "currentSong");
			if (!queue[0] && !currentSong) {
				Promise.resolve({guild: guild.name});
			} else {
				Promise.resolve({
					currentSong: currentSong,
					queue: queue,
					guild: guild.name
				});
			}
		}
	`);
	let queue = [].concat.apply([], queueArr).filter(Boolean)[0];
	if (queueSessions[req.params.guildID] == undefined) {
		queueSessions[req.params.guildID] = [];
	}
	queueSessions[req.params.guildID].push(req.session.id);
	if (queue) {
		res.render("queue", {queue: queue, login: !req.session.user});
	} else {
		res.writeHead(302, {
			location: "/"
		});
	}
	res.end();
});

app.use(ensureToken);

app.get('/server/:userID/:guildID', function(req, res) {
	validateUserGuild(req.params.userID, req.params.guildID, req).then(async (valid) => {
		if (valid) {
			let channelsIDArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let channels = guild.channels.cache.filter(channel => channel.type === "text");
					let channelIDs = []
					channels.forEach((channel) => {
						channelIDs.push({id: channel.id, name: channel.name});
					});
					Promise.resolve(channelIDs);
				}
			`);
			let channelIDs = [].concat.apply([], channelsIDArr).filter(Boolean);

			let rolesArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let roles = [];
					guild.roles.cache.forEach((role) => {
						role.id;
						if (!role.managed)
						roles.push(role)
					})
					Promise.resolve(roles);
				}
			`);
			roles = [].concat.apply([], rolesArr).filter(Boolean);

			let modulesArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let res = this.serverSettings.get("${req.params.guildID}", "modules");
					Promise.resolve(res);
				}
			`);
			let modules = [].concat.apply([], modulesArr).filter(Boolean)[0];

			let guild = req.session.guilds[req.params.guildID];

			if (channelsIDArr == undefined || modules == undefined || guild == undefined || roles == undefined) {
				res.writeHead(302, {
					'Location': '/servers'
				});
			} else {
				res.render('server', {modules: modules, user: req.session.user, guild: guild, channels: channelIDs, roles: roles})
			}
		} else {
			res.writeHead(302, {
				'Location': '/servers'
			});
		}
		res.end();
	});
});

app.post('/server/:userID/:guildID/setModule', function(req, res) {
	validateUserGuild(req.params.userID, req.params.guildID, req).then(async(valid) => {
		if (valid && (req.body.value == true || req.body.value == false) && req.body.module && req.body.module != "base") {
			let value = req.body.value;
			if (await manager.broadcastEval(`Promise.resolve(this.serverSettings.get("${req.params.guildID}", "modules.${req.body.module}"));`) != undefined) {
				await manager.broadcastEval(`this.serverSettings.set("${req.params.guildID}", ${value}, "modules.${req.body.module}.enabled");`)
				res.writeHead(200);
			} else {
				res.writeHead(200);
			}
		} else {
			res.writeHead(400);
		}
		res.end();
	});
});

app.post('/server/:userID/:guildID/sendMsg', (req, res) => {
	validateUserGuild(req.params.userID, req.params.guildID, req).then(async (valid) => {
		if (valid && typeof req.body.msg == "string" && req.body.msg) {
			let send = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let channel = guild.channels.cache.find(channel => channel.id === "${req.body.channel}" && channel.type === "text");
					if (channel) {
						channel.send("${req.body.msg}");
						Promise.resolve(1);
					} else {
						Promise.resolve(0);
					}
				} else {
					Promise.resolve(0);
				}
			`)
			if (!send) {
				res.writeHead(400);
			} else {
				res.writeHead(200);
			}
		} else {
			res.writeHead(400);
		}
		res.end();
	});
});

app.post('/server/:userID/:guildID/setField', (req, res) => {
	validateUserGuild(req.params.userID, req.params.guildID, req).then(async (valid) => {
		if (valid && typeof req.body.field == "string" && req.body.value != undefined) {
			let value = "";
			let valueDoub = "";
			if (typeof req.body.value == "string") {
				value = req.body.value.replace(/"/g, `\\"`);
				valueDoub = value.replace(/"/g, `\\"`);
			} else if (typeof req.body.value == "boolean") {
				value = req.body.value;
			} else {
				res.writeHead(400);
				res.end();
				return;
			}
			let field = req.body.field.replace(/"/g, `\\"`);
			let send = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let modules = this.serverSettings.get("${req.params.guildID}", "modules");
					Object.keys(modules).forEach((modKey) => {
						let mod = modules[modKey];
						if (mod.properties["${field}"] != undefined) {
							if (mod.properties["${field}"].type == "role") {
								if (guild.roles.cache.get("${value}")) {
									this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", "${valueDoub}", "${field}")');
								}
								return;
							} else if (mod.properties["${field}"].type == "textChannel") {
								if (guild.channels.cache.find((channel) => channel.id == "${value}" && channel.type == "text")) {
									this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", "${valueDoub}", "${field}")');
								}
								return;
							} else if (mod.properties["${field}"].type == "text") {
								if ("${field}" != "prefix" || ("${field}" == "prefix" && "${value}" != "")) {
									this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", "${valueDoub}", "${field}")');
								}
								return;
							} else if (mod.properties["${field}"].type == "list") {
								let list = "${value}".split(/[,]+/);
								let listStr = "[";
								for (let str in list) {
									if (list[str].trim() != "")
									listStr += "\\"" + list[str].trim().replace(/"/g, '\\\\"') + "\\",";
								}
								listStr += "]";
								this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", ' + listStr + ', "${field}")');
								return;
							} else if (mod.properties["${field}"].type == "boolean") {
								if ("${value}".toLowerCase() == "true" || "${value}".toLowerCase() == "false") {
									this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", ' + ("${value}".toLowerCase() == "true") + ', "${field}")');
								}
								return;
							} else if (mod.properties["${field}"].type == "integer") {
								if (!isNaN(parseInt("${value}"))) {
									this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", parseInt("${value}"), "${field}")');
								}
								return;
							}
						}
					});
				}
			`);
		} else {
			res.writeHead(400);
		}
		res.end();
	});
});

app.post('/server/:userID/:guildID/role/:role/setPerm', (req, res) => {
	validateUserGuild(req.params.userID, req.params.guildID, req).then(async (valid) => {
		if (valid && typeof req.body.field == "string" && req.body.value != undefined) {
			let value;
			if (typeof req.body.value == "boolean") {
				value = req.body.value;
			} else {
				res.writeHead(400);
				res.end();
				return;
			}
			let field = req.body.field.replace(/"/g, ``);
			let send = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild && this.commands["${field}"] != undefined && this.commands["${field}"].command) {
					if (this.serverSettings.get("${req.params.guildID}", "permissions.${req.params.role}") == undefined) {
						this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", {}, "permissions.${req.params.role}")');
					}
					this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", ("${value}".toLowerCase() == "true"), "permissions.${req.params.role}.${field}")');
				}
			`);
		} else {
			res.writeHead(400);
		}
		res.end();
	});
});

app.get('/server/:userID/:guildID/module/:module', (req, res) => {
	validateUserGuild(req.params.userID, req.params.guildID, req).then(async (valid) => {
		if (valid) {
			let modulesArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let res = this.serverSettings.get("${req.params.guildID}", "modules");
					Promise.resolve(res);
				}
			`);
			let modules = [].concat.apply([], modulesArr).filter(Boolean)[0];

			let rolesArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let roles = []
					guild.roles.cache.forEach((role) => {
						if (!role.managed && role.id != guild.roles.everyone.id)
						roles.push(role)
					})
					Promise.resolve(roles);
				}
			`);
			roles = [].concat.apply([], rolesArr).filter(Boolean);

			let textChannelsArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let channels = []
					guild.channels.cache.forEach((channel) => {
						if (channel.type == "text")
						channels.push(channel);
					})
					Promise.resolve(channels);
				}
			`);
			textChannels = [].concat.apply([], textChannelsArr).filter(Boolean);

			let fieldsArr = await manager.broadcastEval(`
				let fields = Object.keys(this.serverSettings.get('${req.params.guildID}', "modules.${req.params.module}.properties"));
				let props = {};
				try {
					fields.forEach((field) => {
						props[field] = this.serverSettings.get('${req.params.guildID}', field);
					})
				} catch(e) {}
				Promise.resolve(props);
			`);
			let fields = [].concat.apply([], fieldsArr).filter(Boolean)[0];

			if (modules[req.params.module]) {
				res.render("module", { moduleProp: modules[req.params.module], module: req.params.module, guild: req.session.guilds[req.params.guildID], user: req.session.user, roles: roles, fields: fields, textChannels: textChannels })
			} else {
				res.writeHead(302, {
					location: `/server/${req.params.userID}/${req.params.guildID}`
				});
			}
			res.end();
		}
	});
});

app.get('/server/:userID/:guildID/role/:role', (req, res) => {
	validateUserGuild(req.params.userID, req.params.guildID, req).then(async (valid) => {
		if (valid) {
			let commandsArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let res = {};
					for (let command in this.commands) {
						if (!this.commands[command].command) {
							continue;
						}
						if (res[this.commands[command].cmdModule] == undefined) {
							res[this.commands[command].cmdModule] = {};
						}
						res[this.commands[command].cmdModule][command] = this.commands[command];
					}
					Promise.resolve(res);
				}
			`);
			let commands = [].concat.apply([], commandsArr).filter(Boolean)[0];

			let permissionsArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					if (this.serverSettings.get("${req.params.guildID}", "permissions.${req.params.role}") == undefined) {
						this.shard.broadcastEval('this.serverSettings.set("${req.params.guildID}", {}, "permissions.${req.params.role}")');
					}
					Promise.resolve(this.serverSettings.get("${req.params.guildID}", "permissions.${req.params.role}"));
				}
			`);
			let permissions = [].concat.apply([], permissionsArr).filter(Boolean)[0];

			let rolesArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let roles = []
					guild.roles.cache.forEach((role) => {
						if (!role.managed)
						roles.push(role)
					})
					Promise.resolve(roles);
				}
			`);
			roles = [].concat.apply([], rolesArr).filter(Boolean);

			if (roles.find(role => role.id == req.params.role)) {
				res.render("role", { guild: req.session.guilds[req.params.guildID], user: req.session.user, roles: roles, commands: commands, role: req.params.role, permissions: permissions, userID: req.params.userID, guildID: req.params.guildID })
			} else {
				res.writeHead(302, {
					location: `/server/${req.params.userID}/${req.params.guildID}`
				});
			}
			res.end();
		}
	});
});

app.get('/server/:userID/:guildID/channel/:channelID', (req, res) => {
	validateUserGuild(req.params.userID, req.params.guildID, req).then(async (valid) => {
		if (valid) {
			let usersArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let users = [];
					guild.members.cache.forEach((member) => {
						users.push({username: member.user.username, discriminator: member.user.discriminator, avatar: member.user.avatar, id: member.user.id});
					})
					Promise.resolve(users);
				}
			`);
			let users = [].concat.apply([], usersArr).filter(Boolean);

			let rolesArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let roles = []
					guild.roles.cache.forEach((role) => {
						if (!role.managed && role.id != guild.roles.everyone.id)
						roles.push(role)
					})
					Promise.resolve(roles);
				}
			`);
			roles = [].concat.apply([], rolesArr).filter(Boolean);

			let textChannelsArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				if (guild) {
					let channels = []
					guild.channels.cache.forEach((channel) => {
						if (channel.type == "text" && !channel.deleted)
						channels.push(channel);
					})
					Promise.resolve(channels);
				}
			`);
			textChannels = [].concat.apply([], textChannelsArr).filter(Boolean);

			thisChannel = textChannels.find((channel) => channel.id == req.params.channelID);

			let messagesArr = await manager.broadcastEval(`
				let guild = this.guilds.cache.get("${req.params.guildID}");
				var messagepush = [];
				if (guild) {
					let channel = guild.channels.cache.find((channel) => channel.id == '${req.params.channelID}');
					if (channel) {
						channel.messages.fetch({ limit: 20 }).then((messages) => {
							messages.forEach((message) => {
								let msgpushi = {
									cleanContent: message.cleanContent,
									authorID: message.author.id,
									attUrl: [],
									embedTitle: ""
								}
								if (message.embeds && message.embeds[0] && message.embeds[0].title) {
									msgpushi.embedTitle = message.embeds[0].title;
								}
								message.attachments.forEach((attachment) => {
									msgpushi.attUrl.push(attachment.url);
								})
								messagepush.push(msgpushi);
							});
							return messagepush;
						});
					}
				}
			`);
			messages = [].concat.apply([], messagesArr).filter(Boolean);

			if (thisChannel) {
				res.render("channel", {messages: messages, users: users, roles: roles, textChannels: textChannels, user: req.session.user, guild: req.session.guilds[req.params.guildID]});
			} else {
				res.writeHead(302, {
					location: `/server/${req.params.userID}/${req.params.guildID}`
				});
			}
		} else {
			res.writeHead(302, {
				location: `/server/${req.params.userID}/${req.params.guildID}`
			});
		}
		res.end();
	});
});

app.get('/guildOAuth2', (req, res) => {
	res.write("<script>window.close()</script>")
	res.end();
});

function setUser(req, resp) {
	req.session.user = resp;
}

function validateUserGuild(userID, guildID, req) {
	return prom = new Promise(function(resolve, reject) {
		if (!req.session.validGuilds) {
			req.session.validGuilds = {};
		}
		if (req.session.validGuilds[guildID] == userID) {
			resolve(true);
		} else {
			cacheValidateUserGuild(req).then((valid) => {
				if (valid) {
					req.session.validGuilds[req.params.guildID] = req.params.userID;
					if (guildSession[req.params.guildID] == undefined) {
						guildSession[req.params.guildID] = []
					}
					guildSession[req.params.guildID].push(req.session.id);
					resolve(true);
				} else {
					resolve(false);
				}
			});
		}
	});
}

cacheValidateUserGuild = async(req) => {
	let tokenType = req.session.token.tokenType;
	let accessToken = req.session.token.accessToken;
	let userID = req.params.userID;
	let guildID = req.params.guildID;
	return promise = new Promise (function(resolve, reject) {
		getUser(tokenType, accessToken).then((response) => {
			let user = undefined;
			if (response) {
				user = response.id
			}
			return {userID: userID, guildID: guildID, user: user, tokenType: tokenType, accessToken: accessToken};
		}).then((obj) => {
			getServers(obj.tokenType, obj.accessToken, req).then((guilds) => {
				if (!obj.user || !guilds) {
					resolve(0);
				} else {
					guildIDs = [];
					for (let guild in guilds) {
						guildIDs.push(guilds[guild].id);
					}
					if (obj.userID == obj.user && guildIDs.includes(obj.guildID)) {
						resolve(1);
					} else {
						resolve(0);
					}
				}
			});
		});
	});
}

getToken = async(code) => {
	return promise = new Promise (function(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open('POST', 'https://discordapp.com/api/oauth2/token', true);

		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.responseType = 'json';

		const params = `client_id=${clientID}&client_secret=${clientSecret}&grant_type=authorization_code&redirect_uri=${redirectUri}&scope=identify%20email%20guilds&code=` + code;

		xhr.send(params);

		xhr.addEventListener("load", function() {
			let responseObj = xhr.responseText;
			resolve(JSON.parse(responseObj));
		});
	});
}

getServers = async(tokenType, accessToken, req) => {
	return promise = new Promise (function(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', 'https://discordapp.com/api/users/@me/guilds', true);

		xhr.setRequestHeader("authorization", `${tokenType} ${accessToken}`);
		xhr.responseType = 'json';

		xhr.send();

		xhr.addEventListener("load", function() {
			let responseObj = xhr.responseText;
			let guilds = JSON.parse(responseObj);
			if (xhr.status == 401) {
				resolve(0);
			} else if (xhr.status == 429) {
				resolve(429);
			} else {
				let resGuilds = [];

				for (let guild in guilds) {
					if (guilds[guild].owner) {
						req.session.guilds[guilds[guild].id] = guilds[guild];
						resGuilds.push(guilds[guild]);
					}
				}
				resolve(resGuilds);
			}
		});
	});
}

getUser = async(tokenType, accessToken) => {
	return promise = new Promise (function(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', 'https://discordapp.com/api/users/@me', true);

		xhr.setRequestHeader("authorization", `${tokenType} ${accessToken}`);
		xhr.responseType = 'json';

		xhr.send();

		xhr.addEventListener("load", function() {
			let responseObj = xhr.responseText;
			let user = JSON.parse(responseObj);

			if (user.message == "401: Unauthorized") {
				resolve(0);
				return;
			}
			resolve(user);
		});
	});
}
