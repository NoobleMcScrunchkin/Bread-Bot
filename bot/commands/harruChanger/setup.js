var names = ["Daddy", "Ancestor", "Parent", "Predecessor", "Begetter", "Origin", "Pa", "Padre", "Papa", "Pop", "Progenitor", "Sire", "Source", "Forebearer", "Procreator", "Old Man", "Papa", "Pop", "Pappy", "Dad", "Papi", "Papa John", "Mark", "Harry Potter"];

module.exports = async(client, guild) => {
	if (client.serverSettings.get(guild.id, "harruList") == undefined) {
		client.serverSettings.set(guild.id, names, "harruList")
	}

	await client.serverSettings.set(guild.id, {
		harruList: {title: "Harru Names", description: "Names for Harold", type: "list"},
	}, "modules.harruChanger.properties");
}
