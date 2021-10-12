var Filter = require('bad-words-plus');
const anchorme = require("anchorme").default

module.exports.onMessage = async(client, message) => {
    let modules = client.serverSettings.get(message.guild.id, "modules");
    if (!modules["moderation"].enabled) {
        return;
    }
    // if (message.guild.owner.user.id == message.author.id) {
    //     return;
    // }

    let muted = client.serverSettings.get(message.guild.id, "muted");
    if (muted[message.author.id]) {
        message.guild.channels.cache.forEach((channel) => {
            if (channel.type != "text") {
                return;
            }

            channel.updateOverwrite(message.author, {
                SEND_MESSAGES: false
            });
        });
        message.delete();
        return;
    }

    const warningTimeout = 1000 * 60 * client.serverSettings.get(message.guild.id, "warningTimeout");

    var filter = new Filter();
    var customfilter = new Filter({ emptyList: true });
    let customWords = client.serverSettings.get(message.guild.id, "customProfanity");
    customfilter.addWords(...customWords);
    let warnings = client.serverSettings.get(message.guild.id, "warnings." + message.author.id);
    let muteWarnings = client.serverSettings.get(message.guild.id, "muteWarnings");
    let kickWarnings = client.serverSettings.get(message.guild.id, "kickWarnings");
    let banWarnings = client.serverSettings.get(message.guild.id, "banWarnings");
    if (!warnings) {
        warnings = [];
    }

    var warningsCount = 0;

    for (let i = 0; i < warnings.length; i++) {
        let warningDate = new Date(warnings[i].time);
        if (((new Date) - warningDate) < warningTimeout) {
            warningsCount++;
        }
    }

    const oWarningCount = warningsCount;
    var reason;
    const urlList = anchorme.list(message.content);
    var urlListFiltered = [];
    var inviteList = [];

    for (let i = 0; i < urlList.length; i++) {
        if (client.serverSettings.get(message.guild.id, "strictUrlFilter")) {
            urlListFiltered.push(urlList[i]);
        } else if (urlList[i].protocol != undefined && (urlList[i].protocol.toLowerCase() == "https://" || urlList[i].protocol.toLowerCase() == "http://")) {
            urlListFiltered.push(urlList[i]);
        }
        if (urlList[i].host == "discord.gg" && urlList[i].path) {
            inviteList.push(urlList[i]);
        }
    }

    if (filter.isProfane(message.content) && client.serverSettings.get(message.guild.id, "modProfanity")) {
        warningsCount++;
        reason = "Profanity";
    } else if (customfilter.isProfane(message.content) && client.serverSettings.get(message.guild.id, "modCustomProfanity")) {
        warningsCount++;
        reason = "Custom Profanity";
    } else if (message.content == message.content.toUpperCase() && message.content.length > 4 && client.serverSettings.get(message.guild.id, "modCaps")) {
        warningsCount++;
        reason = "Caps";
    } else if (inviteList.length && client.serverSettings.get(message.guild.id, "modInvite")) {
        warningsCount++;
        reason = "Invite";
    } else if (urlListFiltered.length && client.serverSettings.get(message.guild.id, "modUrl")) {
        warningsCount++;
        reason = "URL";
    }

    if (warningsCount != oWarningCount) {
        warnings.push({
            time: new Date,
            reason: "Profanity",
            content: message.content
        });
        let warningEmbed = {
    		"content": "",
    		"embed": {
    		  "title": "Warning",
    		  "color": 3942134,
    		  "timestamp": new Date().toISOString(),
    		  "fields": [
                  {
                      name: "Server",
                      value: message.guild.name
                  },
                  {
                      name: "Reason",
                      value: reason
                  },
                  {
                      name: "Content",
                      value: message.content
                  },
                  {
                      name: "Recent Warnings",
                      value: warningsCount
                  }
              ]
    		}
        }
        let logsChannelID = client.serverSettings.get(message.guild.id, "logsChannel");
        if (logsChannelID) {
            let logsChannel = message.guild.channels.cache.find((channel) => channel.id == logsChannelID);
            if (logsChannel) {
                let logEmbed = {
                    "content": "",
                    "embed": {
                      "title": "Warned User",
                      "color": 3942134,
                      "timestamp": new Date().toISOString(),
                      "fields": [
                          {
                              name: "User",
                              value: message.author.username + "#" + message.author.discriminator
                          },
                          {
                              name: "Reason",
                              value: reason
                          },
                          {
                              name: "Content",
                              value: message.content
                          }
                      ]
                    }
                }
                logsChannel.send(logEmbed)
            }
        }

        client.serverSettings.set(message.guild.id, warnings, "warnings." + message.author.id);
        if (warningsCount >= banWarnings) {
            try {
                await message.author.send(`You have been banned from "${message.guild.name}"`);
                message.guild.members.ban(message.author.id);
            } catch(e) {}
            return;
        } else if (warningsCount >= kickWarnings) {
            try {
                await message.author.send(`You have been kicked from "${message.guild.name}"`);
                message.guild.members.kick(message.author.id);
            } catch(e) {}
            return;
        } else if (warningsCount >= muteWarnings) {
            message.guild.channels.cache.forEach((channel) => {
                if (channel.type != "text") {
                    return;
                }

                channel.updateOverwrite(message.author, {
                    SEND_MESSAGES: false
                });
            });
            message.author.send(`You have been muted in "${message.guild.name}"`)
            if (client.serverSettings.get(message.guild.id, "muted." + message.author.id) == undefined) {
                client.serverSettings.set(message.guild.id, new Date, "muted." + message.author.id);
            }
            return;
        }
        message.author.send(warningEmbed);
        message.delete();
    }
};

module.exports.onRun = async(client) => {
    setInterval(() => {
        client.guilds.cache.forEach((guild) => {
            let muted = client.serverSettings.get(guild.id, "muted");
            let muteLength = 60 * 1000 * client.serverSettings.get(guild.id, "muteLength");
            for (let user in muted) {
                try {
                    if (muted[user]) {
                        if ((new Date) - (new Date(muted[user])) > muteLength) {
                            muted[user] = undefined;
                            let memObj = guild.members.cache.find((member) => member.user.id == user);
                            if (!memObj) {
                                muted[user] = undefined;
                                return;
                            }
                            let userObj = memObj.user;
                            guild.channels.cache.forEach((channel) => {
                                if (channel.type != "text") {
                                    return;
                                }

                                channel.updateOverwrite(userObj, {
                                    SEND_MESSAGES: true
                                });
                            });
                        }
                    }
                } catch(e) {
                    console.log(e);
                }
            }
        })
    }, 1000)
};
