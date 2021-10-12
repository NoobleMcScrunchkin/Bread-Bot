const playT = require("../.tools/play.js");
const ytdl = require("ytdl-core");
const https = require('https');
var socket = require('socket.io-client')('http://localhost:5000');

module.exports.args = ["<Video URL>"];
module.exports.help = "Play Content from YouTube";

module.exports.command = async(client, args, message) => {
	if (args[0] == undefined) {
		message.reply("URL not provided");
		return;
	}

	var connection = client.voice.connections.get(message.guild.id);

	if (connection && connection.channel.id != message.member.voice.channel.id) {
		message.reply("You are not in the voice channel.")
		return;
	}

	try {
		var options = {method: 'GET', host: "img.youtube.com", port: 443, path: "/vi/" + ytdl.getVideoID(args[0]) + "/0.jpg"};
    } catch(e) {
		message.reply("Invalid YouTube URL");
		return;
	}
	var req = https.request(options, function(r) {
        if (r.statusCode != 200) {
			message.reply("Invalid YouTube URL");
			return;
		} else {
			ytdl.getBasicInfo(args[0]).then((result) => {
				var title = result.videoDetails.title;
				var queue = client.serverSettings.get(message.guild.id, "queue");
				queue.push({type: "yt", content: args[0], title: title, id: ytdl.getVideoID(args[0])});
				client.serverSettings.set(message.guild.id, queue, "queue");
				var con = client.voice.connections.get(message.guild.id);
				socket.emit("nextSong", {guild: message.guild.id});
				if (!con || !con.dispatcher) {
					message.reply("Playing now");
					playT.play(client, message);
				} else {
					message.reply("Added to queue");
				}
			});
		}
    });
	req.end();
}
