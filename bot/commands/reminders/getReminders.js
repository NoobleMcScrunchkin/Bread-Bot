module.exports.help = "Display remiders";

module.exports.command = async(client, args, message) => {
    let reminders = await client.serverSettings.get(message.guild.id, "reminders");

    if (!reminders.length) {
        message.reply("No reminders.");
        return;
    }

    var fields = [];
    for (let reminder in reminders) {
        let content = reminders[reminder].content;
        let remindDate = new Date(reminders[reminder].date);
        let repeat = reminders[reminder].repeat;
        fields.push({
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
        });
    }

    var embedReminder = {
        "content": "",
        "embed": {
          "title": "Reminders",
          "color": 3942134,
          "timestamp": new Date().toISOString(),
          "fields": fields
        }
    };
    message.channel.send(embedReminder);
}
