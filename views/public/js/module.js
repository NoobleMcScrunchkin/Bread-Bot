window.addEventListener("load", () => {
    document.addEventListener("click", (e) => {
        if (e.target.className == "propInp") {
            return;
        }
        clearAuto();
    })
});

function clearAuto() {
    let autos = document.getElementsByClassName("autoSelect");
    for (let i = 0; i < autos.length; i++) {
        autos[i].style.display = "none";
    }
}

function roleAuto(inp, e, userID, guildID) {
    if (window.innerWidth <= 600) {
        inp.blur();
    }
    let roleInp = document.getElementById(inp.parentElement.id + "inp");
    if (e) {
        if (!String.fromCharCode(event.keyCode).match(/(\w|\s)/g) && inp.value.replace("@", "") != "" && e.which != 8)
            return
        else
            inp.style.color = "white";
    }
    clearAuto();
    roleInp.innerHTML = "";
    let i = 0;
    rolesArr.forEach((role) => {
        if (role.name.toLowerCase().startsWith(inp.value.toLowerCase().replace("@", ""))) {
            let roleDiv = document.createElement("div");
            roleDiv.className = "autoDiv";
            roleDiv.style.cursor = "pointer";
            if (!i) {
                roleDiv.style.borderTop = "none";
                i++;
            }
            roleDiv.onclick = () => {
                setField(inp.parentElement.id, role.id, userID, guildID);
            }
            let roleB = document.createElement("b");
            roleB.style.color = `#${role.color.toString(16)}`;
            roleB.textContent = "@" + role.name;
            roleDiv.appendChild(roleB)
            roleInp.appendChild(roleDiv);
        }
    });
    if (roleInp.innerHTML == "") {
        let roleDiv = document.createElement("div");
        roleDiv.className = "autoDiv";
        let roleB = document.createElement("b");
        roleB.textContent = "No roles found";
        roleDiv.appendChild(roleB)
        roleInp.appendChild(roleDiv);
    }
    document.getElementById(inp.parentElement.id + "inpSel").style.display = "inline-block";
}

function textChannelAuto(inp, e, userID, guildID) {
    if (window.innerWidth <= 600) {
        inp.blur();
    }
    let channelInp = document.getElementById(inp.parentElement.id + "inp");
    if (e) {
        if (!String.fromCharCode(event.keyCode).match(/(\w|\s)/g) && inp.value.replace("@", "") != "" && e.which != 8)
            return
        else
            inp.style.color = "white";
    }
    clearAuto();
    channelInp.innerHTML = "";
    let i = 0;
    channelsArr.forEach((channel) => {
        if (channel.name.toLowerCase().startsWith(inp.value.toLowerCase().replace("#", ""))) {
            let channelDiv = document.createElement("div");
            channelDiv.className = "autoDiv";
            channelDiv.style.cursor = "pointer";
            if (!i) {
                channelDiv.style.borderTop = "none";
                i++;
            }
            channelDiv.onclick = () => {
                setField(inp.parentElement.id, channel.id, userID, guildID);
            }
            let channelB = document.createElement("b");
            channelB.textContent = "#" + channel.name;
            channelDiv.appendChild(channelB)
            channelInp.appendChild(channelDiv);
        }
    });
    if (channelInp.innerHTML == "") {
        let channelDiv = document.createElement("div");
        channelDiv.className = "autoDiv";
        let channelB = document.createElement("b");
        channelB.textContent = "No channels found";
        channelDiv.appendChild(channelB)
        channelInp.appendChild(channelDiv);
    }
    document.getElementById(inp.parentElement.id + "inpSel").style.display = "inline-block";
}

function setField(prop, value, userID, guildID) {
    let body = {
        "field": prop,
        "value": value
    }
    fetch('/server/' + userID + '/' + guildID + '/setField', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    }).then(() => {location.reload()});
}
