const playT = require("../.tools/play.js");
var socket = require('socket.io-client')('http://localhost:5000');

module.exports.help = "Skips current song";

module.exports.command = async(client, args, message) => {
	var queue = client.serverSettings.get(message.guild.id, "queue");
	var connection = client.voice.connections.get(message.guild.id);

	if (connection && connection.channel.id != message.member.voice.channel.id) {
		message.reply("You are not in the voice channel.")
		return;
	}

	if (!connection || !connection.dispatcher) {
		message.reply("Nothing is playing.")
		return;
	}

	if (!queue[0]) {
		message.reply("Skipped.");
		client.serverSettings.set(message.guild.id, undefined, "currentSong");
		connection.disconnect();
		socket.emit("nextSong", {guild: message.guild.id});
		return;
	}
	connection.dispatcher = undefined;
	message.reply("Skipped.")
	playT.play(client, message);
}
