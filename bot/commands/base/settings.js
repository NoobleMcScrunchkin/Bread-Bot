const convertTo = require('type-convert');
const roleT = require("../.tools/role.js");

module.exports.args = ["<set / get>", "<Option>", "<Value>"];
module.exports.help = "Change a setting";

module.exports.command = (client, args, msg) => {
	if(!msg.guild) {
		msg.reply('This isn\'t a server.');
		return;
	}

	if(args.length < 2) {
		msg.reply("Invalid number of arguments.");
		return;
	}

	const gset = args.shift().toLowerCase();
	var setting = args.shift();

	var baseSetting = setting.split(".")[0];


	if(gset == 'get') {
		msg.reply(`That setting is \`${client.serverSettings.get(msg.guild.id, setting)}\``);
		return;
	}
	else if(gset == 'set') {
		const prevValue = client.serverSettings.get(msg.guild.id, setting);
		if(prevValue === undefined) {
			msg.reply('Setting does not exist');
			return;
		}

		let editable = client.serverSettings.get(msg.guild.id, "editable");

		if (!editable.includes(baseSetting)) {
			msg.reply("That setting cannot be modified");
			return;
		}

		if ((setting == "role" || setting == "adminRole") && roleT.getRoleFromMention(args[0], msg.guild)) {
			if (setting == "adminRole" && msg.member.user.id != msg.guild.ownerID) {
				msg.reply(roleT.config.noPerm);
				return;
			}
			if ((setting == "role" && roleT.getRoleFromMention(args[0], msg.guild).id == client.serverSettings.get(msg.guild.id, "adminRole")) || (setting == "adminRole" && roleT.getRoleFromMention(args[0], msg.guild).id == client.serverSettings.get(msg.guild.id, "role"))) {
				msg.reply(roleT.config.equalRole);
				return;
			}
			client.serverSettings.set(msg.guild.id, roleT.getRoleFromMention(args[0], msg.guild).id, setting);
			msg.reply(roleT.config.roleSet + roleT.getRoleFromMention(args[0], msg.guild).name);
		} else if (baseSetting == "modules") {
			const value = (args.join(' ') == "true");
			client.serverSettings.set(msg.guild.id, value, setting);
			msg.reply(`Set \`${setting}\` to \`${value}\``);
		} else {
			const value = convertTo(prevValue, args.join(' '));

			if(!value && value != 0) {
				msg.reply('Invalid value.');
				return;
			}

			client.serverSettings.set(msg.guild.id, value, setting);
			msg.reply(`Set \`${setting}\` to \`${value}\``);
		}
	} else {
			msg.reply('Second argument must be either set or get');
	}
}
