var waitForClose
function popupInvite(guildID, userID, clientID, redirectUri) {
    let url = `https://discord.com/api/oauth2/authorize?client_id=${clientID}&response_type=code&permissions=8&redirect_uri=${redirectUri}&scope=bot&disable_guild_select=true&guild_id=` + guildID
    invPopup = window.open(url, "discordBreadInvite", "width=500,height=800");
    if (window.focus()) {
        invPopup.focus();
    }
    if (!waitForClose) {
        waitForClose = setInterval(function() {
            if(invPopup.closed) {
                clearInterval(waitForClose);
                window.location.href = "/server/" + userID + "/" + guildID;
            }
        }, 1000);
    }
}
