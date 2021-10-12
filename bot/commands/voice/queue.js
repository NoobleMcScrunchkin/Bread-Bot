let { baseUrl } = require("../../../settings.js");
module.exports.help = "Shows current queue";

module.exports.command = async(client, args, message) => {
	var queue = client.serverSettings.get(message.guild.id, "queue");
	var currentSong = client.serverSettings.get(message.guild.id, "currentSong");
	if (!queue[0] && !currentSong) {
		message.reply("No songs in the Queue");
		return;
	}
	var fields = []
	if (currentSong) {
		fields.push({
			"name": "Current Song: " + currentSong.title,
			"value": currentSong.content,
			"inline": false
		});
	}
	for (let i in queue) {
		var field = {
			"name": "!command",
			"value": "command",
			"inline": false
		};
		field.name = "#" + (parseInt(i) + 1) + ": " + queue[i].title;
		field.value = queue[i].content;
		fields.push(field);
	}

	var embedQueue = {
		"content": "",
		"embed": {
		  "title": "Queue",
		  url: baseUrl + '/queue/' + message.guild.id,
		  "color": 3942134,
		  "timestamp": new Date().toISOString(),
		  "fields": fields
		}
	};

	message.channel.send(embedQueue);
	// message.channel.send(baseUrl + '/queue/' + message.guild.id)
}
