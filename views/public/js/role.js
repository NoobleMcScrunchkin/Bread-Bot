function setPerm(com, value, userID, guildID, roleID) {
    let body = {
        "field": com,
        "value": value
    }
    fetch('/server/' + userID + '/' + guildID + '/role/' + roleID + '/setPerm', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    }).then(() => {location.reload()});
}
