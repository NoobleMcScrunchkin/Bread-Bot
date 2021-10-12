module.exports = async(client, guild) => {
    if (client.serverSettings.get(guild.id, "modProfanity") == undefined) {
		client.serverSettings.set(guild.id, false, "modProfanity");
	}
    if (client.serverSettings.get(guild.id, "modCustomProfanity") == undefined) {
		client.serverSettings.set(guild.id, false, "modCustomProfanity");
	}
    if (client.serverSettings.get(guild.id, "customProfanity") == undefined) {
		client.serverSettings.set(guild.id, [], "customProfanity");
	}
    if (client.serverSettings.get(guild.id, "modCaps") == undefined) {
		client.serverSettings.set(guild.id, false, "modCaps");
	}
    if (client.serverSettings.get(guild.id, "modUrl") == undefined) {
		client.serverSettings.set(guild.id, false, "modUrl");
	}
    if (client.serverSettings.get(guild.id, "strictUrlFilter") == undefined) {
		client.serverSettings.set(guild.id, false, "strictUrlFilter");
	}
    if (client.serverSettings.get(guild.id, "modInvite") == undefined) {
		client.serverSettings.set(guild.id, false, "modInvite");
	}
    if (client.serverSettings.get(guild.id, "muteWarnings") == undefined) {
		client.serverSettings.set(guild.id, 3, "muteWarnings");
	}
    if (client.serverSettings.get(guild.id, "kickWarnings") == undefined) {
		client.serverSettings.set(guild.id, 10, "kickWarnings");
	}
    if (client.serverSettings.get(guild.id, "banWarnings") == undefined) {
		client.serverSettings.set(guild.id, 20, "banWarnings");
	}
    if (client.serverSettings.get(guild.id, "warningTimeout") == undefined) {
		client.serverSettings.set(guild.id, 30, "warningTimeout");
	}
    if (client.serverSettings.get(guild.id, "muteLength") == undefined) {
		client.serverSettings.set(guild.id, 10, "muteLength");
	}
    if (client.serverSettings.get(guild.id, "warnings") == undefined) {
		client.serverSettings.set(guild.id, {}, "warnings");
	}
    if (client.serverSettings.get(guild.id, "muted") == undefined) {
		client.serverSettings.set(guild.id, {}, "muted");
	}

	await client.serverSettings.set(guild.id, {
		modProfanity: {title: "Profanity Filter", description: "", type: "boolean"},
		modCustomProfanity: {title: "Custom Profanity Filter", description: "", type: "boolean"},
		customProfanity: {title: "Custom Profanity Phrases/Words", description: "Custom words to be filtered by the bot.", type: "list"},
		modCaps: {title: "Caps Filter", description: "", type: "boolean"},
        modInvite: {title: "Invite Filter", description: "", type: "boolean"},
		modUrl: {title: "URL Filter", description: "", type: "boolean"},
		strictUrlFilter: {title: "Strict URL Identification", description: "", type: "boolean"},
        warningTimeout: {title: "Warning Timeout", description: "How many minutes a warning is valid for.", type: "integer"},
		muteWarnings: {title: "Mute Warnings", description: "Number of warnings a user can have until they are muted.", type: "integer"},
		kickWarnings: {title: "Kick Warnings", description: "Number of warnings a user can have until they are kicked.", type: "integer"},
		banWarnings: {title: "Ban Warnings", description: "Number of warnings a user can have until they are banned.", type: "integer"},
		muteLength: {title: "Mute Length", description: "Length of automatic mute in minutes.", type: "integer"},
	}, "modules.moderation.properties");
};
