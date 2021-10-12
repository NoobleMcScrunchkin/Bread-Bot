var socket = require('socket.io-client')('http://localhost:5000');

module.exports.help = "Ends music session";

module.exports.command = async(client, args, message) => {
	var connection = client.voice.connections.get(message.guild.id);
	if (connection && (connection.channel.id != message.member.voice.channel.id && !(message.member.roles.member._roles.includes(client.serverSettings.get(message.guild.id, "adminRole")) && args[0] == "-f"))) {
		message.reply("You are not in the voice channel.")
		return;
	}

	if (!connection) {
		message.reply("Bot not in voice channel");
		return;
	}

	connection.disconnect();
	client.serverSettings.set(message.guild.id, [], "queue");
	client.serverSettings.set(message.guild.id, undefined, "currentSong");
	socket.emit("nextSong", {guild: message.guild.id});
	message.reply("Disconnected");
}
