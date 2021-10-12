const roleT = require("../.tools/role.js");

module.exports.args = ["<User Mention>"];
module.exports.help = "Gives role to specified user";

module.exports.command = async(client, args, message) => {
	var roleName;

	if (message.guild.roles.cache.find(role => role.id == client.serverSettings.get(message.guild.id, "role"))) {
		roleName = message.guild.roles.cache.find(role => role.id == client.serverSettings.get(message.guild.id, "role")).name;
	} else {
		roleName = "";
	}

	if (client.serverSettings.get(message.guild.id, "role") != undefined || message.guild.roles.cache.find(role => role.id == client.serverSettings.get(message.guild.id, "role"))) {
		if (roleT.getUserFromMention(args[0], client)) {
			var member = roleT.getUserFromMention(args[0], client);
			if (message.guild.members.cache.get(member.id)._roles.includes(client.serverSettings.get(message.guild.id, "role"))) {
				message.reply(member.username + roleT.config.existingMember + roleName);
			} else {
				message.guild.members.cache.get(member.id).roles.add(client.serverSettings.get(message.guild.id, "role"));
				message.reply(member.username + roleT.config.brotherAdded + roleName);
			}
		} else {
			message.reply(roleT.config.invalidArgument);
		}
	} else {
		message.reply(roleT.config.invalidRole);
	}
}
