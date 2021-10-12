module.exports = async(client, guild) => {
    if (client.serverSettings.get(guild.id, "remindersChannel") == undefined) {
        client.serverSettings.set(guild.id, "", "remindersChannel");
    }
    if (client.serverSettings.get(guild.id, "reminders") == undefined) {
        client.serverSettings.set(guild.id, [], "reminders");
    }

    await client.serverSettings.set(guild.id, {
		remindersChannel: {title: "Reminder Channel", description: "Channel for reminder anouncments", type: "textChannel"},
	}, "modules.reminders.properties");
}
