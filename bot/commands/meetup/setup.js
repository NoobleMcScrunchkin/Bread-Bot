module.exports = async(client, guild) => {
	if (client.serverSettings.get(guild.id, "meetupChannel") == undefined) {
		client.serverSettings.set(guild.id, "", "meetupChannel")
	}

	await client.serverSettings.set(guild.id, {
		meetupChannel: {title: "Meetup Channel", description: "Channel for meetup announcements", type: "textChannel"},
	}, "modules.meetup.properties");
}
