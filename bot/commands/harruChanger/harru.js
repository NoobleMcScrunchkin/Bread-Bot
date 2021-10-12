module.exports.onRun = async(client) => {
    setInterval((e) => {
		try {
			var date = new Date();
			var day = date.getDate();
			var month = date.getMonth();
			if(date.getMinutes() === 0){
				client.guilds.cache.forEach(async (g) => {
                    var harru = g.members.cache.get("157970691126329344");
                    if (harru) {
                        if (month == 10 && (day == 24 || day == 25)) {
                            await harru.setNickname("Mark");
                        } else {
                            names = client.serverSettings.get(g.id, "harruList");
                            if (names.length == 0) {
                                return;
                            }
                            let i = 0;
                            let nickname = harru ? harru.displayName : null;
                            uniqueNames = names.filter(function(item, pos, self) {
                                return self.indexOf(item) == pos;
                            })
                            while (names[i] == nickname && uniqueNames.length > 1) {
                                i = Math.floor(Math.random() * (names.length));
                            }
                            await harru.setNickname(names[i]);
                        }
                    }
				});
			}
		} catch(e) {
            console.log(e);
        }
	}, 60000);
}
