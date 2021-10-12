const fs = require('fs');
const path = require('path');

module.exports.help = "Displays this message";

var descs = {};
const commandDir = __dirname + "/../"
const getDirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
const dirs = getDirs(commandDir);

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
			descs[fileName] = require(commandDir + dir + "/" + file);
			descs[fileName].cmdModule = dir;
		});
	});
});

module.exports.command = async(client, args, message) => {
	var fields = [];
	let modules = client.serverSettings.get(message.guild.id, "modules");
	for (let command in descs) {
		if (!modules[descs[command].cmdModule].enabled || descs[command].command == undefined) {
			continue;
		}

		var field = {
			"name": "!command",
			"value": "command",
			"inline": false
		};

		var argsS = "";
		if (descs[command].args) {
			for (let i = 0; i < descs[command].args.length; i++) {
				argsS += " " + descs[command].args[i];
			}
		}
		field.name = client.serverSettings.get(message.guild.id, "prefix") + command + argsS;
		field.value = descs[command].help;
		fields.push(field);
	}

	var embedHelp = {
		"content": "",
		"embed": {
		  "title": "Help",
		  "color": 3942134,
		  "timestamp": new Date().toISOString(),
		  "fields": fields
		}
	};
	message.channel.send(embedHelp)
}
