module.exports.help = "Sets Bot volume";
module.exports.args = ["<Volume (0-100)>"]

module.exports.command = async(client, args, message) => {
	var connection = client.voice.connections.get(message.guild.id);
	
	if (connection && connection.channel.id != message.member.voice.channel.id) {
		message.reply("You are not in the voice channel.")
		return;
	}
	
	if (!args[0]) {
		message.reply("Argument not provided");
		return;
	}
	
	var vol = parseFloat(args[0]);
	if (vol == NaN || vol > 100 || vol < 0) {
		message.reply("Please provide a number between 0 and 100.");
		return;
	}
	
	vol = vol / 100;
	
	
	if (connection && connection.dispatcher) {
		connection.dispatcher.setVolume(vol);
	}
	client.serverSettings.set(message.guild.id, vol, "volume");
	message.reply("Volume set to " + args[0] + "%.");
}