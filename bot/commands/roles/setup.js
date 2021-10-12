module.exports = async(client, guild) => {
	if (client.serverSettings.get(guild.id, "role") == undefined) {
		client.serverSettings.set(guild.id, "", "role");
	}

	await client.serverSettings.set(guild.id, {
		role: {title: "Role", description: "Role to assign to users", type: "role"},
	}, "modules.roles.properties");
}
