const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const Promise = require("promise");

module.exports.getPlayerStats = async(acc) => {
	return promise = new Promise (function(resolve, reject) {
		let xhr = new XMLHttpRequest();

		xhr.open('GET', 'https://osu.ppy.sh/api/get_user?k=c0db10948a439ea8cd6d7b22ef5650e2f84e0106&u=' + acc);

		xhr.responseType = 'json';

		xhr.send();

		xhr.addEventListener("load", function() {
			let responseObj = xhr.responseText;
			try {
				resolve(JSON.parse(responseObj)[0]);
			} catch(e) {
				resolve(0);
			}
		});
	});
}

module.exports.getPlayerBest = async(acc, lim) => {
	return promise = new Promise (function(resolve, reject) {
		let xhr = new XMLHttpRequest();

		xhr.open('GET', 'https://osu.ppy.sh/api/get_user_best?k=c0db10948a439ea8cd6d7b22ef5650e2f84e0106&u=' + acc + "&m=0&type=id&limit=" + lim);

		xhr.responseType = 'json';

		xhr.send();

		xhr.addEventListener("load", function() {
			let responseObj = xhr.responseText;
			try {
				resolve(JSON.parse(responseObj));
			} catch(e) {
				resolve(0);
			}
		});
	});
}

module.exports.getBeatmap = async(id) => {
	return promise = new Promise (function(resolve, reject) {
		let xhr = new XMLHttpRequest();

		xhr.open('GET', 'https://osu.ppy.sh/api/get_beatmaps?k=c0db10948a439ea8cd6d7b22ef5650e2f84e0106&limit=1&m=0&b=' + id);

		xhr.responseType = 'json';

		xhr.send();

		xhr.addEventListener("load", function() {
			let responseObj = xhr.responseText;
			try {
				resolve(JSON.parse(responseObj));
			} catch(e) {
				resolve(0);
			}
		});
	});
}
