module.exports.help = "Remove a reminder";
module.exports.args = ["<ID>"];

multiIndexOfContent = function (arr, el) {
    var idxs = [];
    for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i].content === el) {
            idxs.unshift(i);
        }
    }
    return idxs;
};

module.exports.command = async(client, args, message) => {
    let reminders = client.serverSettings.get(message.guild.id, "reminders");

    if (!args[0]) {
        message.reply("Reminder not provided");
        return;
    }

    let content = args.join(" ");

    let remindersI = multiIndexOfContent(reminders, content);

    for (let i in remindersI) {
        reminders.splice(remindersI[i], 1);
    }

    client.serverSettings.set(message.guild.id, reminders, "reminders");

    message.reply("Reminders removed");
}
