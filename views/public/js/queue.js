window.addEventListener("load", () => {
    var socket = io('https://' + location.hostname);
    socket.on("nextSong", (guild) => {
        location.reload();
    });
});
