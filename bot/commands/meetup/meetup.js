const convertTo = require('type-convert');

module.exports.args = ["<Place>|<Date>"];
module.exports.help = "Organise a meetup";

async function prepareHostQueue(r, user) {
	const message = await user.send(`Would you like to be a main or backup host?`);

	message.react('Ⓜ️');
	message.react('🅱️');

	const collected = await message.awaitReactions((r2, user2) => !user2.bot && (r2.emoji.name == 'Ⓜ️' || r2.emoji.name == '🅱️'), {max: 1});

	const main = collected.first().emoji.name == 'Ⓜ️';

	user.send(`I've added you to the ${main ? 'main' : 'backup'} host queue!`);

	const meetup = r.client.meetups[r.message.id];
	if(main) {
		meetup.mainHostQueue.push(user);
	}
	else {
		meetup.backupHostQueue.push(user);
	}
}

async function rearrange(r, user) {
	const meetup = r.client.meetups[r.message.id]

	if(user.id !== meetup.creator.id)
		return;

	const dmChannel = await user.createDM();
	dmChannel.send(`What date would you like to use? Current date \`${meetup.date}\``);

	const collectedMessage = await dmChannel.awaitMessages((m) => !m.author.bot, {max:1});
	const message = collectedMessage.first();

	const confirmationMessage = await dmChannel.send(`Is \`${message.content}\` correct?`);
	confirmationMessage.react('✅');
	confirmationMessage.react('❌');
	const confirmReact = await confirmationMessage.awaitReactions((r2, u) => !u.bot && (r2.emoji.name == '✅' || r2.emoji.name == '❌'), {max: 1});
	if(confirmReact.first().emoji.name === '❌') {
		rearrange(r, user);
		return;
	}

	dmChannel.send(`The date has been changed!`);


	meetup.date = message.content;

	meetup.message.edit({
		"embed": {
		  "title": "Wanna meetup?",
		  "description": `${meetup.creator.username} wants to arrange a meet-up. If you wish to see who's coming please use the command \`meetupinfo ${message.id}\`\r\n	If you are coming react with ✅\r\n	If you are not coming react with ❌\r\n	If you can host react with 🏠\r\nIf you made this meet-up;\r\n	to rearrange the date react with 📅\r\n	to pick the host react with <:bisc:664570084257431552>`,
		  "color": 3942134,
		  "timestamp": new Date().toISOString(),
		  "author": {
			"name": `${meetup.creator.username}`,
			"icon_url": meetup.creator.avatarURL()
		  },
		  "thumbnail": {
			"url": "https://cdn.discordapp.com/attachments/645390844735520780/722772918349594624/2023f426fbf789461d6300f202e6b5fe.png"
		  },
		  "fields": [
			{
				"name": "Place",
				"value": !!meetup.place ? meetup.place : 'A place',
				"inline": true
			},
			{
				"name": "Date",
				"value": !!meetup.date ? meetup.date : 'A date',
				"inline": true
			},
		  ]
		}
	});

	meetup.attending.forEach((v) => {
		v.send(`Hi! The date for the meet-up you are attending has changed to \`${meetup.date}\`!`);
	});
}

async function onCollect(r, user) {
	const meetup = r.client.meetups[r.message.id];
	if(!meetup)
		return;

	switch(r.emoji.name) {
		case '🏠': {
			prepareHostQueue(r, user);
			break;
		}
		case '✅': {
			if(!meetup.attending.includes(user)) {
				meetup.attending.push(user);
				meetup.notAttending = meetup.notAttending.filter((v) => v.id != user.id);
				user.send(`I have marked you as attending the meet-up (:  If you change your mind just react with ❌ on the meet-up.`);
			}
			break;
		}
		case '❌': {
			if(!meetup.notAttending.includes(user)) {
				meetup.notAttending.push(user);
				meetup.attending = meetup.attending.filter((v) => v.id != user.id);
				user.send(`I have marked you as not attending the meet-up (:  If you change your mind just react with ✅ on the meet-up.`);
			}
			break;
		}
		case '📅': {
			rearrange(r, user);
			break;
		}
		case '🛑': {
			if(user.id != meetup.creator.id) {
				return;
			}
			meetup.message.delete();
			r.client.meetups[r.message.id] = null;
			break;
		}
		case '🕵️': {
			if(user.id != meetup.creator.id) {
				return;
			}
			onEnd.bind(r.client)(meetup.message);
		}
	}
	if (r.client.meetups[r.message.id])
	r.users.remove(user.id);
}

async function onEnd(message) {
	const meetup = this.meetups[message.id];

	if (!meetup) {
		return;
	}

	let host = '';
	const hosts = meetup.mainHostQueue.concat(meetup.backupHostQueue);
	for(let i = 0; i < hosts.length; i++) {
		let found = false;
		for(let j = 0; j < meetup.attending.length; j++) {
			if(meetup.attending[j].id == hosts[i].id) {
				found = true;
			}
		}
		if(!found)
			continue;

		host = hosts[i];
		break;
	}

	await meetup.message.edit({
		"embed": {
		  "title": "Time to meetup",
		  "description": `${meetup.creator} has arranged a meet-up. It's not too late to ask to come though! If you wish to see who's coming please use the command\r\n\`meetupinfo ${meetup.message.id}\`\r\n	If you are coming react with ✅\r\n	If you are not coming react with ❌\r\n	If you're the meet-up creator; delete this message by reacting with 🛑`,
		  "color": 3942134,
		  "timestamp": new Date().toISOString(),
		  "author": {
			"name": `${meetup.creator.username}`,
			"icon_url": meetup.creator.avatarURL()
		  },
		  "fields": [
			{
				"name": "Place",
				"value": !!meetup.place ? meetup.place : 'A place',
				"inline": true
			  },
			  {
				"name": "Date",
				"value": !!meetup.date ? meetup.date : 'A date',
				"inline": true
			  },
			{
				name: "Host",
				"value": !!host ? host : "No host.",
				"inline": true
			}
		  ]
		}
	});

	await meetup.message.reactions.cache.each(async (x) => {
		if(x.emoji.name === '🏠' || x.emoji.name === '📅' || x.emoji.name === '🕵️') {
			try { await x.remove(); } catch(e) {}
		}
	});

	const emojis = ['✅', '❌', '🛑'];
	emojis.forEach((emoji) => {
		try { meetup.message.react(emoji); } catch(e) {}
	});

	const collector = meetup.message.createReactionCollector((r, user) => !user.bot && emojis.includes(r.emoji.name));
	collector.on('collect', onCollect);
	collector.on('end', () => {});
}

module.exports.command = async (client, args, msg) => {
	if(!msg.guild) {
		msg.reply('This must be run in a server.');
		return;
	}

	const meetupChannelId = client.serverSettings.get(msg.guild.id, 'meetupChannel');
	if(!meetupChannelId)  {
		msg.reply('Please setup the server settings first.');
		return;
	}

	const meetupChannel = msg.guild.channels.cache.get(meetupChannelId);

	const mArgs = args.join(' ').split('|');

	const place = mArgs.shift();
	const date = mArgs.shift();

	if(place === undefined || date == undefined) {
		msg.reply('Invalid parameters. Expected `place`|`date`');
		return;
	}

	const message = await meetupChannel.send('');
	message.edit({
		"content": "`Meetup Dialog`",
		"embed": {
		  "title": "Wanna meetup?",
		  "description": `${msg.author} wants to arrange a meet-up. If you wish to see who's coming please use the command \`meetupinfo ${message.id}\`\r\n	If you are coming react with ✅\r\n	If you are not coming react with ❌\r\n	If you can host react with 🏠\r\nIf you made this meet-up;\r\n	to rearrange the date react with 📅\r\n	to pick the host react with 🕵️`,
		  "color": 3942134,
		  "timestamp": new Date().toISOString(),
		  "author": {
			"name": `${msg.author.username}`,
			"icon_url": msg.author.avatarURL()
		  },
		  "thumbnail": {
			"url": "https://cdn.discordapp.com/attachments/645390844735520780/722772918349594624/2023f426fbf789461d6300f202e6b5fe.png"
		  },
		  "fields": [
			{
			  "name": "Place",
			  "value": !!place ? place : 'A place',
			  "inline": true
			},
			{
			  "name": "Date",
			  "value": !!date ? date : 'A date',
			  "inline": true
			},
		  ]
		}
	});

	const emojis = ['✅', '❌', '🏠', '📅', '🕵️', '🛑'];
	emojis.forEach((emoji) => message.react(emoji));

	const collector = message.createReactionCollector((r, user) => !user.bot && emojis.includes(r.emoji.name) || emojis.includes(r.emoji.id));
	collector.on('collect', onCollect);
	collector.on('end', onEnd.bind(client, message));

	client.meetups = client.meetups || {};

	client.meetups[message.id] = {
		mainHostQueue: [],
		backupHostQueue: [],
		attending: [],
		notAttending: [],
		creator: msg.author,
		place,
		date,
		message
	};

	msg.delete();
}
