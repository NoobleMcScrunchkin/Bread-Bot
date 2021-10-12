module.exports = async(client, guild) => {
	if (client.serverSettings.get(guild.id, "logsChannel") == undefined) {
		client.serverSettings.set(guild.id, "", "logsChannel");
	}
	if (client.serverSettings.get(guild.id, "permissions") == undefined) {
		client.serverSettings.set(guild.id, {}, "permissions");
	}

	await client.serverSettings.set(guild.id, {
		prefix: {title: "Prefix", description: "Prefix to be used on the server", type: "text"},
		logsChannel: {title: "Logs Channel", description: "Channel for logging activities on the server", type: "textChannel"}
	}, "modules.base.properties");
}
