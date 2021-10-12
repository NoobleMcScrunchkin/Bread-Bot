module.exports = async(client, guild) => {
	if (client.serverSettings.get(guild.id, "osuTrackChan") == undefined) {
		client.serverSettings.set(guild.id, "", "osuTrackChan")
	}
	if (client.serverSettings.get(guild.id, "osuTrack") == undefined) {
		client.serverSettings.set(guild.id, {}, "osuTrack")
	}
	if (client.serverSettings.get(guild.id, "osuTrackCount") == undefined) {
		client.serverSettings.set(guild.id, 5, "osuTrackCount")
	}
	if (client.serverSettings.get(guild.id, "osuTrackPrevCount") == undefined) {
		client.serverSettings.set(guild.id, 5, "osuTrackPrevCount")
	}

	await client.serverSettings.set(guild.id, {
		osuTrackChan: {title: "osu! Channel", description: "Channel for osu! announcements", type: "textChannel"},
		osuTrackCount: {title: "Track Count", description: "Number of top plays to track", type: "integer"},
	}, "modules.osu.properties");
}
