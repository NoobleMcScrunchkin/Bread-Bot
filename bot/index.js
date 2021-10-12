const Discord = require('discord.js');
const Enmap = require('enmap');
const fs = require('fs');
const path = require('path');
const { token } = require('../settings.js');
var socket = require('socket.io-client')('http://localhost:5000');

const getDirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());

const client = new Discord.Client();

client.serverSettings = new Enmap({
	name: 'servers'
});

client.ensureServerSettings = function(guildId) {
	client.serverSettings.ensure(guildId, {
		prefix: '!',
		editable: ["prefix"],
		modules: {},
	})
}

client.commands = {};
const commandDir = __dirname + '/commands/';
const dirs = getDirs(commandDir);
let moduleSetups = {};

dirs.forEach((dir) => {
	if (dir.startsWith(".")) {
		return;
	}
	fs.readdir(commandDir + dir, (err, files) => {
		if(err) {
			console.log(err)
			process.exit(1);
		}
		files.forEach((file) => {
			const fileParts = file.split('.');
			fileParts.pop();
			const fileName = fileParts.join('.').toLowerCase();
			if (fileName == "setup") {
				moduleSetups[dir] = require(commandDir + dir + "/" + file);
			} else {
				client.commands[fileName] = require(commandDir + dir + "/" + file);
				client.commands[fileName].cmdModule = dir;
			}
		});

	});
});

client.on("guildCreate", async guild => {
    console.log("Joined a new guild: " + guild.name);
	await client.ensureServerSettings(guild.id);
	client.serverSettings.set(guild.id, ["prefix", "modules"], "editable");
	if (client.serverSettings.get(guild.id, "prefix") == undefined) {
		client.serverSettings.set(guild.id, "!", "prefix");
	}
	let modules = client.serverSettings.get(guild.id, "modules");
	if (!modules) {
		modules = { base: { enabled: true, properties: {} } };
	}
	for (let mod in moduleSetups) {
		moduleSetups[mod](client, guild);
		if (modules[mod] == undefined) {
			if (mod != "base")
				client.serverSettings.set(guild.id, { enabled: false, properties: {} }, "modules." + mod);
			else {
				client.serverSettings.set(guild.id, { enabled: true, properties: {} }, "modules." + mod);
			}
		}
	}
})

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);

	try {
		client.guilds.cache.forEach((guild) => {
			client.ensureServerSettings(guild.id);
			client.serverSettings.set(guild.id, ["prefix", "modules"], "editable");
			if (client.serverSettings.get(guild.id, "prefix") == undefined) {
				client.serverSettings.set(guild.id, "!", "prefix");
			}
			let modules = client.serverSettings.get(guild.id, "modules");
			for (let mod in moduleSetups) {
				moduleSetups[mod](client, guild);
				if (modules[mod] == undefined) {
					if (mod != "base")
						client.serverSettings.set(guild.id, { enabled: false, properties: {} }, "modules." + mod);
					else {
						client.serverSettings.set(guild.id, { enabled: true, properties: {} }, "modules." + mod);
					}
				}
			}
		});
	} catch(e) {
		console.error(e);
	}
	for (let command in client.commands) {
		if (client.commands[command].onRun) {
			client.commands[command].onRun(client);
		}
	}
});

client.on('messageUpdate', (oldMessage, newMessage) => {
	if (!newMessage.guild) {
		return;
	}

	client.ensureServerSettings(newMessage.guild.id);
	const prefix = client.serverSettings.get(newMessage.guild.id, 'prefix');

	if(!newMessage.content.startsWith(prefix)) {
		for (let com in client.commands) {
	 	   if (client.commands[com].onMessage) {
	 		   client.commands[com].onMessage(client, newMessage);
	 	   }
	    }
		return;
	}

	const args = newMessage.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	if(!client.commands[command] || !client.commands[command].command) {
		for (let com in commands) {
	 	   if (client.commands[com].onMessage) {
	 		   client.commands[com].onMessage(client, newMessage);
	 	   }
	    }
	}
});

client.on('message', msg => {
	let embedTitle = "";
	if (msg.embeds && msg.embeds[0] && msg.embeds[0].title) {
		embedTitle = msg.embeds[0].title
	}
	if (msg.guild)
	socket.emit("chatMsg", {
		guildID: msg.guild.id,
		channel: msg.channel.id,
		content: msg.cleanContent,
		author: msg.author,
		attachments: msg.attachments,
		embedTitle: embedTitle
	});

	if(msg.author.bot)
		return;

	if(!msg.guild) {
		return;
	}

	client.ensureServerSettings(msg.guild.id);
	const prefix = client.serverSettings.get(msg.guild.id, 'prefix');

	if(!msg.content.startsWith(prefix)) {
		for (let com in client.commands) {
			if (client.commands[com].onMessage) {
				client.commands[com].onMessage(client, msg);
			}
		}
		return;
	}

	const args = msg.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	const modules = client.serverSettings.get(msg.guild.id, "modules");

	if(client.commands[command] && client.commands[command].command) {
		if (modules[client.commands[command].cmdModule].enabled || client.commands[command].cmdModule == "base") {
			let permissions = client.serverSettings.get(msg.guild.id, "permissions");
			let gotPerm = false;
			msg.guild.roles.cache.forEach(role => {
				if (permissions[role.id] && (role.id = msg.guild.roles.everyone.id || msg.guild.members.cache.find(member => member.id == msg.author.id)._roles.includes(role.id))) {
					gotPerm = permissions[role.id][command] == true || gotPerm;
				}
			});
			if (gotPerm || msg.author.id == msg.guild.ownerID) {
				client.commands[command].command(client, args, msg);
			} else {
				msg.reply("You do not have permission to use this command.")
			}
		}
	} else {
		for (let com in client.commands) {
			if (client.commands[com].onMessage) {
				client.commands[com].onMessage(client, msg);
			}
		}
	}
});

client.login(token);
