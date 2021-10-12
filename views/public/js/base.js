function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return 0;
}

function getGuilds(tokenType, accessToken) {
    return promise = new Promise (function(resolve, reject) {
        fetch('https://discordapp.com/api/users/@me/guilds', {
            headers: {
                authorization: `${tokenType} ${accessToken}`
            }
        }).then(res => res.json()).then(guilds => {
            if (guilds.message == "401: Unauthorized") {
                console.log("Unauthorized");
                setCookie("accessToken", "");
                setCookie("tokenType", "");
                resolve(0);
            } else {
                resolve(guilds);
            }
        }).catch(console.error);
    });
}

function getUser(tokenType, accessToken) {
    return promise = new Promise (function(resolve, reject) {
        fetch('https://discordapp.com/api/users/@me', {
            headers: {
                authorization: `${tokenType} ${accessToken}`
            }
        }).then(res => res.json()).then(user => {
            if (user.message == "401: Unauthorized") {
                console.log("Unauthorized");
                setCookie("accessToken", "");
                setCookie("tokenType", "");
                resolve(0);
            } else {
                resolve(user);
            }
        }).catch(console.error);
    });
}

function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(' ');
}

function showNav() {
    let nav = document.getElementById("nav");
    if (nav.style.left == "0px") {
        nav.style.left = "-50%";
    } else {
        nav.style.left = "0px";
    }
}

window.onload = () => {
    document.onclick = (e) => {
        let nav = document.getElementById("nav");
        let navB = document.getElementById("navButton");
        if (window.innerWidth <= 600 && nav.style.left == "0px" && !e.path.includes(nav) && !e.path.includes(navB)) {
            nav.style.left = "-100%";
        }
    }
}

window.addEventListener("resize", () => {
    if (window.innerWidth <= 600) {
        nav.classList.add('notransition');
        nav.style.left = "-100%";
        nav.offsetHeight;
        nav.classList.remove('notransition');
    } else {
        nav.classList.add('notransition');
        nav.style.left = "0px";
    }
})
