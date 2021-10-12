const osu = require("../.tools/osu.js")

module.exports.help = "Stop tracking specified osu user";
module.exports.args = ["<Account Name / ID>"];

module.exports.command = async(client, args, message) => {
	if (!args[0]) {
		message.reply("Please provide and Account Name or ID");
		return;
	}

	args = [args.join(" ")];

	osu.getPlayerStats(args[0]).then((result) => {
		if (!result) {
			message.reply("Player not found");
			return;
		}

		var track = client.serverSettings.get(message.guild.id, "osuTrack");

		if (!(result.user_id in track)) {
			message.reply("Not tracking " + result.username);
			return;
		}

		delete track[result.user_id];
		client.serverSettings.set(message.guild.id, track, "osuTrack");
		message.reply("Stopped tracking " + result.username);
	});
}
