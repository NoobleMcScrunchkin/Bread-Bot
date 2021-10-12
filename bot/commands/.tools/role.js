module.exports.config = {
	noPerm: "You do not have permission to perform this action.",
	invalidArgument: "Invalid Argument(s) provided.",
	brotherAdded: " was successfully added to ",
	brotherRemoved: " was successfully removed from ",
	existingMember: " is already a member of ",
	notBrother: " is not a member of ",
	prefixSet: "Prefix successfully set to ",
	adminRoleSet: "Admin Role successfully set to ",
	roleSet: "Role successfully set to ",
	invalidRole: "Role not set or invalid",
	equalRole: "Role cannot be the same as Admin Role",
};

module.exports.getUserFromMention = function (mention, client) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('&')) {
			return;
		}

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
};

module.exports.getRoleFromMention = function (mention, guild) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			return;
		}

		if (mention.startsWith('&')) {
			mention = mention.slice(1);
		}

		return guild.roles.cache.get(mention);
	}
};