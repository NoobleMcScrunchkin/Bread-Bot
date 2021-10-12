module.exports.args = ["<Meetup ID>"];
module.exports.help = "View meetup info";

module.exports.command = async function(client, args, msg) {
	const messageId = args.shift();
	if(!messageId) {
		msg.reply('Invalid parameters. Expected `meetupId`');
		return;
	}

	if(!client.meetups || !client.meetups[messageId]) {
		msg.reply('Invalid meetup id.');
		return;
	}

	const meetup = client.meetups[messageId];

	let comingFieldValue = '';
	for(let i = 0; i < meetup.attending.length; i++) {
		comingFieldValue += `${meetup.attending[i].username}\r\n`;
	}

	let notComingFieldValue = '';
	for(let i = 0; i < meetup.notAttending.length; i++) {
		notComingFieldValue += `${meetup.notAttending[i].username}\r\n`;
	}

	msg.channel.send({
		embed: {
			"title": "Confirmed Meetup",
			"description": ` Meetup Info`,
			"color": 3942134,
			"timestamp": new Date().toISOString(),
			"author": {
				"name": `${meetup.creator.username}`,
				"icon_url": meetup.creator.avatarURL()
			},
			  "fields": [
				{
					"name": "Place",
					"value": meetup.place,
				},
				{
					  "name": "Date",
					  "value": meetup.date,
				},
				{
					"name": "Attending",
					"value": !!comingFieldValue ? comingFieldValue : 'Noone reacted with this!',
					"inline": true
				},
				{
					"name": "Not Attending",
					"value": !!notComingFieldValue ? notComingFieldValue : 'Noone reacted with this!',
					"inline": true
				}
			  ]
		}
	})
}