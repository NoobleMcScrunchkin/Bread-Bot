const osu = require("../.tools/osu.js")

module.exports.help = "Test the tracking for specified user";
module.exports.args = ["<Play Number>", "<Account Name / ID>"];

module.exports.command = async(client, args, message) => {
	if (args.length < 2) {
		message.reply("Arguments Not Provided");
		return;
	}

	let num = parseInt(args.shift());
	if (isNaN(parseInt(num))) {
		message.reply("First Argument should be integer");
		return;
	}

	if (num > client.serverSettings.get(message.guild.id, "osuTrackCount")) {
		message.reply("Not Tracking that many plays");
		return;
	}

	if (num < 1) {
		message.reply("Invalid Number");
		return;
	}

	args = [args.join(" ")];

	osu.getPlayerStats(args[0]).then((result) => {
		if (!result) {
			message.reply("Player not found");
			return;
		}

		let track = client.serverSettings.get(message.guild.id, "osuTrack");
		if (!track[result.user_id]) {
			message.reply("User not being tracked.");
			return;
		}

		if (isNaN(parseInt(num))) {
			message.reply("First Argument should be integer");
			return;
		}

		track[result.user_id].plays[num - 1].score_id = "";
		client.serverSettings.set(message.guild.id, track, "osuTrack");

		message.reply("Testing for " + result.username);
	});
}
