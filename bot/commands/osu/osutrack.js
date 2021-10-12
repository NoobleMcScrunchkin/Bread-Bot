const osu = require("../.tools/osu.js")

module.exports.help = "Begin tracking specified osu user";
module.exports.args = ["<Account Name / ID>"];

module.exports.onRun = async(client) => {
	var trackInt = setInterval(() => {
		client.guilds.cache.forEach(async(g) => {
			let modules = client.serverSettings.get(g.id, "modules");
			let trackChanID = client.serverSettings.get(g.id, "osuTrackChan");
			if (trackChanID) {
				let trackChan = g.channels.cache.get(trackChanID);
				let track = client.serverSettings.get(g.id, "osuTrack");
				for (let id in track) {
					best = await osu.getPlayerBest(id, client.serverSettings.get(g.id, "osuTrackCount"));
					if (!best) {
						return;
					}
					for (let i = 0; i < best.length; i++) {
						if (!track[id].plays.find(play => play.score_id == best[i].score_id)) {
							map = await osu.getBeatmap(best[i].beatmap_id);
							if (!map) {
								return;
							}
							let username = track[id].username;
							let acc = 100 * ((300 * best[i].count300) + (100 * best[i].count100) + (50 * best[i].count50)) / (300 * (parseInt(best[i].count300) + parseInt(best[i].count100) + parseInt(best[i].count50) + parseInt(best[i].countmiss)));
							let fields = [
								{
									"name": "Title",
									"value": map[0].title,
									"inline": true
								},
								{
									"name": "Artist",
									"value": map[0].artist,
									"inline": true
								},
								{
									"name": "Difficulty",
									"value": map[0].version,
									"inline": true
								},

								{
									"name": "Rank",
									"value": best[i].rank,
									"inline": true
								},
								{
									"name": "Accuracy",
									"value": acc.toFixed(2) + "%",
									"inline": true
								},
								{
									"name": "Score",
									"value": best[i].score,
									"inline": true
								},
								{
									"name": "PP",
									"value": best[i].pp,
									"inline": true
								},
								{
									"name": "Max Combo",
									"value": best[i].maxcombo,
									"inline": true
								},
								{
									"name": "\u200B",
									"value": "\u200B",
									"inline": true
								},
								{
									"name": "100",
									"value": best[i].count100,
									"inline": true
								},
								{
									"name": "50",
									"value": best[i].count50,
									"inline": true
								},
								{
									"name": "Miss",
									"value": best[i].countmiss,
									"inline": true
								},
							];
							let embedOsu = {
								"content": "",
								"embed": {
									"title": `#${i + 1} Score`,
									"author": {
										"name": username,
										"icon_url": "http://s.ppy.sh/a/" + id,
										"url": "https://osu.ppy.sh/users/" + id
									},
									"image": {
										"url": "https://b.ppy.sh/thumb/" + map[0].beatmapset_id + "l.jpg",
									},
									"color": 3942134,
									"timestamp": new Date().toISOString(),
									"fields": fields
								}
							};
							if (modules["osu"].enabled && (client.serverSettings.get(g.id, "osuTrackCount") == client.serverSettings.get(g.id, "osuTrackPrevCount"))) {
								trackChan.send(embedOsu);
							}
							track[id] = {
								plays: best,
								username: username
							};
							client.serverSettings.set(g.id, track, "osuTrack");
						}
					}
				}
			}
			if (client.serverSettings.get(g.id, "osuTrackCount") != client.serverSettings.get(g.id, "osuTrackPrevCount")) {
				client.serverSettings.set(g.id, client.serverSettings.get(g.id, "osuTrackCount"), "osuTrackPrevCount")
			}
		});
	}, 1000 * 10);
}

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

		args = [args.join(" ")]

		var track = client.serverSettings.get(message.guild.id, "osuTrack");

		if (result.user_id in track) {
			message.reply("Already tracking " + result.username);
			return;
		}

		osu.getPlayerBest(result.user_id, client.serverSettings.get(message.guild.id, "osuTrackCount")).then((best) => {
			if (best.length == 0) {
				message.reply("No scores?");
				return;
			}
			track = client.serverSettings.get(message.guild.id, "osuTrack");
			track[result.user_id] = {
				plays: best,
				username: result.username
			};
			client.serverSettings.set(message.guild.id, track, "osuTrack");

			message.reply("Tracking " + result.username + ".");
		});
	});
}
