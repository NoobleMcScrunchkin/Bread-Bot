const osu = require("../.tools/osu.js")

module.exports.help = "Get stats of an osu! player";
module.exports.args = ["<Account Name / ID>"];

module.exports.command = async(client, args, message) => {
	if (!args[0]) {
		message.reply("Please provide and Account Name or ID");
		return;
	}

	osu.getPlayerStats(args[0]).then((result) => {
		if (!result) {
			message.reply("Player not found");
			return;
		}

		var fields = [
			{
				"name": "Username",
				"value": result.username,
				"inline": true
			},
			{
				"name": "ID",
				"value": result.user_id,
				"inline": true
			},
			{
				"name": "Country",
				"value": result.country,
				"inline": true
			},
			{
				"name": "\u200B",
				"value": "\u200B",
				"inline": false
			},
			{
				"name": "Total Score",
				"value": result.total_score,
				"inline": true
			},
			{
				"name": "Level",
				"value": parseFloat(result.level).toFixed(2),
				"inline": true
			},
			{
				"name": "Accuracy",
				"value": parseFloat(result.accuracy).toFixed(2),
				"inline": true
			},
			{
				"name": "Play Count",
				"value": result.playcount,
				"inline": true
			},
			{
				"name": "\u200B",
				"value": "\u200B",
				"inline": false
			},
			{
				"name": "Ranked Score",
				"value": result.ranked_score,
				"inline": true
			},
			{
				"name": "PP",
				"value": result.pp_raw,
				"inline": true
			},
			{
				"name": "Rank",
				"value": result.pp_rank,
				"inline": true
			},
			{
				"name": "Country Rank",
				"value": result.pp_country_rank,
				"inline": true
			},
			{
				"name": "\u200B",
				"value": "\u200B",
				"inline": false
			},
			{
				"name": "300 Count",
				"value": result.count300,
				"inline": true
			},
			{
				"name": "100 Count",
				"value": result.count100,
				"inline": true
			},
			{
				"name": "50 Count",
				"value": result.count50,
				"inline": true
			},
			{
				"name": "\u200B",
				"value": "\u200B",
				"inline": false
			},
			{
				"name": "SSH Count",
				"value": result.count_rank_ssh,
				"inline": true
			},
			{
				"name": "SS Count",
				"value": result.count_rank_ss,
				"inline": true
			},
			{
				"name": "SH Count",
				"value": result.count_rank_sh,
				"inline": true
			},
			{
				"name": "S Count",
				"value": result.count_rank_s,
				"inline": true
			},
			{
				"name": "A Count",
				"value": result.count_rank_a,
				"inline": true
			},
		];


		var embedOsu = {
			"content": "",
			"embed": {
				"title": "osu!stats",
				"author": {
					name: result.username,
					icon_url: "http://s.ppy.sh/a/" + result.user_id,
					url: "https://osu.ppy.sh/users/" + result.user_id
				},
				"color": 3942134,
				"timestamp": new Date().toISOString(),
				"fields": fields
			}
		};

		message.channel.send(embedOsu);
	});
}
