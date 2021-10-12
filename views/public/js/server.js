function setModule(mod, value, userID, guildID) {
    let body = {
        "module": mod,
        "value": value
    }
    fetch('/server/' + userID + '/' + guildID + '/setModule', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    }).then((resp) => {setTimeout(() => {location.reload()}, 300)});
}

function sendMsg(id, userID, guildID) {
    let msg = document.getElementById("text" + id).value;
    document.getElementById("text" + id).value = "";
    if (!msg) {
        return;
    }
    let body = {
        "channel": id,
        "msg": msg
    }
    fetch('/server/' + userID + '/' + guildID + '/sendMsg', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
}
