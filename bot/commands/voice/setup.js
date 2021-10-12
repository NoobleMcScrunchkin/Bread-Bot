module.exports = async(client, guild) => {
	client.serverSettings.set(guild.id, [], "queue");
	client.serverSettings.set(guild.id, undefined, "currentSong");
	if (client.serverSettings.get(guild.id, "volume") == undefined) {
		client.serverSettings.set(guild.id, 1, "volume");
	}
}
