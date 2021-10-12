const ytdl = require("ytdl-core");
var socket = require('socket.io-client')('http://localhost:5000');

module.exports.play = async(client, message) => {
	socket.emit("nextSong", {guild: message.guild.id});
	var connection = client.voice.connections.get(message.guild.id);
	if (!connection) {
		if (!message.member.voice.channel) {
			message.reply("You are not in a voice channel.");
			return;
		}
		connection = await message.member.voice.channel.join();
	}

	var queue = client.serverSettings.get(message.guild.id, "queue");
	client.serverSettings.set(message.guild.id, queue[0], "currentSong");
	dispatcher = connection.play(ytdl(queue[0].content, {filter: "audioonly"}));
	const vol = client.serverSettings.get(message.guild.id, "volume");
	dispatcher.setVolume(vol);
	queue.shift();
	client.serverSettings.set(message.guild.id, queue, "queue");
	dispatcher.on("finish", () => {
		queue = client.serverSettings.get(message.guild.id, "queue");
		if (queue[0]) {
			module.exports.play(client, message);
		} else {
			client.serverSettings.set(message.guild.id, undefined, "currentSong");
			socket.emit("nextSong", {guild: message.guild.id});
			connection.disconnect();
		}
	});
}
