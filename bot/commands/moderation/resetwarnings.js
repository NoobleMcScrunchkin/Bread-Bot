const roleT = require("../.tools/role.js");

module.exports.help = "Resets warnings for a user";
module.exports.args = ["<User Mention>"];

module.exports.command = async(client, args, message) => {
    if(!message.member.roles.member._roles.includes(client.serverSettings.get(message.guild.id, "adminRole")) && message.member.user.id != message.guild.ownerID) {
        message.reply('Sorry, you don\'t have permission to do that.');
		return;
    }

	if (!args[0]) {
		message.reply("Please provide a user");
		return;
	}

    let user = roleT.getUserFromMention(args[0], client);

    if (user) {
        client.serverSettings.set(message.guild.id, [], "warnings." + user.id);
        message.reply("Warnings reset for " + user.username + "#" + user.discriminator);
        let logsChannelID = client.serverSettings.get(message.guild.id, "logsChannel");
        if (logsChannelID) {
            let logsChannel = message.guild.channels.cache.find((channel) => channel.id == logsChannelID);
            if (logsChannel) {
                let logEmbed = {
            		"content": "",
            		"embed": {
            		  "title": "Warnings Reset",
            		  "color": 3942134,
            		  "timestamp": new Date().toISOString(),
            		  "fields": [
                          {
                              name: "User Reset",
                              value:  user.username + "#" + user.discriminator
                          },
                          {
                              name: "Command Issuer",
                              value: message.author.username + "#" + message.author.discriminator
                          }
                      ]
            		}
                }
                logsChannel.send(logEmbed)
            }
        }
    } else {
        message.reply("Invalid User");
    }

}
