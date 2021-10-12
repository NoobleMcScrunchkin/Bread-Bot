module.exports.help = "Create a reminder";
module.exports.args = ["<Time (GMT) ((DD:MM:)HH:MM)>", "<Repeat (none, daily, weekly, monthly)>" ,"<Reminder>"];

module.exports.onRun = async(client) => {
    var trackInt = setInterval(() => {
        let currentDate = new Date();
        client.guilds.cache.forEach(async(guild) => {
            if (client.serverSettings.get(guild.id, "modules.reminders")) {
                var reminders = client.serverSettings.get(guild.id, "reminders");
                for (let reminder in reminders) {
                    let reminderDate = new Date(reminders[reminder].date);
                    try {
                        if (currentDate.getDate() == reminderDate.getDate() && currentDate.getMonth() == reminderDate.getMonth() && currentDate.getFullYear() == reminderDate.getFullYear() && currentDate.getHours() == reminderDate.getHours() && currentDate.getMinutes() == reminderDate.getMinutes()) {
                            let chanID = client.serverSettings.get(guild.id, "remindersChannel");
                            let channel = guild.channels.cache.get(chanID);
                            await channel.send(reminders[reminder].content);
                            if (reminders[reminder].repeat == "daily") {
                                reminderDate.setDate(reminderDate.getDate() + 1);
                                reminders[reminder].date = reminderDate;
                            } else if (reminders[reminder].repeat == "weekly") {
                                reminderDate.setDate(reminderDate.getDate() + 7);
                                reminders[reminder].date = reminderDate;
                            } else if (reminders[reminder].repeat == "monthly") {
                                reminderDate.setMonth(reminderDate.getMonth() + 1);
                                reminders[reminder].date = reminderDate;
                            } else if (reminders[reminder].repeat == "none") {
                                reminders.splice(reminder, 1);
                            }

                            client.serverSettings.set(guild.id, reminders, "reminders");
                        }
                    } catch(e) {console.log(e)}
                }
            }
        });
    }, 5000)
}

module.exports.command = async(client, args, message) => {
    let channelID = client.serverSettings.get(message.guild.id, "remindersChannel");
    if (!channelID) {
        message.reply("Reminders Channel not set.");
        return;
    }

    if (args.length < 2) {
        message.reply("Invalid number of arguments");
        return;
    }

    let time = args.shift().split(":");
    let repeat = args.shift();
    let content = args.join(" ");

    if (repeat != "none" && repeat != "daily" && repeat != "weekly" && repeat != "monthly") {
        message.reply("Invalid repeat");
        return;
    }

    if (!(time.length == 5 || time.length == 2)) {
        message.reply("Invalid time.");
        return;
    }
    for(var i=0; i < time.length; i++) {
        time[i] = parseInt(time[i], 10);
        if (isNaN(time[i])) {
            message.reply("Invalid time.");
            return;
        }
    }

    let remindDate = date(time, repeat);
    if (remindDate) {
        let reminders = client.serverSettings.get(message.guild.id, "reminders");
        reminders.push({content: content, date: remindDate, repeat: repeat});
        var fields = [
            {
        		"name": "Reminder",
        		"value": content,
        		"inline": true
            },
            {
        		"name": "Date",
        		"value": `${remindDate.getDate().toString().padStart(2, "0")}/${(remindDate.getMonth() + 1).toString().padStart(2, "0")}/${remindDate.getFullYear().toString()} ${remindDate.getHours().toString().padStart(2, "0")}:${remindDate.getMinutes().toString().padStart(2, "0")} GMT`,
        		"inline": true
            },
            {
        		"name": "Repeat",
        		"value": repeat,
        		"inline": true
            },
        ];

    	var embedReminder = {
    		"content": "",
    		"embed": {
    		  "title": "Reminder",
    		  "color": 3942134,
    		  "timestamp": new Date().toISOString(),
    		  "fields": fields
    		}
    	};
        message.channel.send(embedReminder);
        client.serverSettings.set(message.guild.id, reminders, "reminders");
    } else {
        message.reply("Invalid Date");
    }
}

//(DD:MM:)HH:MM)

function date(time, repeat) {
    let currentDate = new Date();
    if (time.length == 5) {
        if ((time[4] >= 0 && time[4] <= 60) && (time[3] >= 0 && time[3] <= 24) && (time[0] > 0 && time[0] <= 31 && (time[1] == 1 || time[1] == 3 || time[1] == 5 || time[1] == 7 || time[1] == 8 || time[1] == 10 || time[1] == 12)) || (time[0] > 0 && time[0] <= 30 && (time[1] == 4 || time[1] == 6 || time[1] == 9 || time[1] == 11)) || (time[0] > 0 && ((time[0] <= 28 && (test.getFullYear() % 4 != 0)) || (time[0] <= 29 && (test.getFullYear() % 4 == 0))))) {
            let date = new Date(`${time[1]}/${time[0]}/${currentDate.getFullYear()} ${time[2]}:${time[3]}`);
            if (repeat == "daily") {
                while (date < currentDate) {
                    date.setDate(date.getDate() + 1);
                }
            } else if (repeat == "weekly") {
                while (date < currentDate) {
                    date.setDate(date.getDate() + 7);
                }
            } else if (repeat == "monthly") {
                while (date < currentDate) {
                    date.setMonth(date.getMonth() + 1);
                }
            } else if (repeat == "none" && date < currentDate) {
                return false;
            }
            return date;
        } else {
            return false;
        }
    } else {
        if ((time[1] >= 0 && time[1] <= 60) && (time[0] >= 0 && time[0] <= 24)) {
            let date = new Date(`${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()} ${time[0]}:${time[1]}`);
            if (repeat == "daily" && date < currentDate) {
                while (date < currentDate) {
                    date.setDate(date.getDate() + 1);
                }
            } else if (repeat == "weekly" && date < currentDate) {
                while (date < currentDate) {
                    date.setDate(date.getDate() + 7);
                }
            } else if (repeat == "monthly" && date < currentDate) {
                while (date < currentDate) {
                    date.setMonth(date.getMonth() + 1);
                }
            } else if (repeat == "none" && date < currentDate) {
                return false;
            }
            return date;
        } else {
            return false;
        }
    }
}
