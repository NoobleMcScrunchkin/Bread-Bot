module.exports.help = "Moves bot to your current voice channel";

module.exports.command = async(client, args, message) => {
	if (!message.member.voice.channel) {
		message.reply("You are not in a voice channel.");
		return;
	}
	
	const connection = await message.member.voice.channel.join();
	message.reply("I've moved to your voice channel.")
}