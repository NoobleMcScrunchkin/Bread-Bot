window.addEventListener("load", () => {
    document.addEventListener("click", (e) => {
        if (e.target.className == "propInp") {
            return;
        }
        clearAuto();
    });
    let messagesDiv = document.getElementById("messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    var socket = io('https://' + location.hostname);

    messagesDiv.children[messagesDiv.children.length - 1].style.borderBottom = "0px solid white";

    socket.on("chatMsg", (msg) => {
        if (msg.channel != location.href.split(/(\\|\/)/g).pop()) {
            return;
        }
        messagesDiv.children[messagesDiv.children.length - 1].style.borderBottom = "2px solid #444";
        let messageDiv = document.createElement("div");
        messageDiv.className = "message";
        let messageAv = document.createElement("div");
        messageAv.className = "avatar";
        if (msg.author.avatar) {
            messageAv.style.backgroundImage = `url(https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png?size=128)`
        }
        let messageUser = document.createElement("div");
        messageUser.className = "username";
        let messageUserB = document.createElement("b");
        messageUserB.textContent = msg.author.username + "#" + msg.author.discriminator;
        messageUser.appendChild(messageUserB);
        let messageCont = document.createElement("div");
        messageCont.className = "messageContent";
        let content = msg.content;
        if (content == "" && msg.embedTitle != "") {
            content = msg.embedTitle;
        }
        content = content.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1'>$1</a>");
        messageCont.innerHTML = content;
        for (let attach in msg.attachments) {
            if (msg.attachments[attach].attachment.match(/\.(jpeg|jpg|gif|png)$/) == null) {
                let msgAtt = document.createElement("div");
                let splits = msg.attachments[attach].attachment.split("/")
                msgAtt.textContent = splits[splits.length - 1];
                msgAtt.onclick = () => {
                    location.href = msg.attachments[attach].attachment;
                }
                messageCont.appendChild(msgAtt);
            } else {
                let msgImg = document.createElement("img");
                msgImg.src = msg.attachments[attach].attachment;
                msgImg.onload = () => {
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    messagesDiv.children[messagesDiv.children.length - 1].style.borderBottom = "0px solid white";
                }
                messageCont.appendChild(msgImg);
            }
        }

        messageDiv.appendChild(messageAv);
        messageDiv.appendChild(messageUser);
        messageDiv.appendChild(messageCont);
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        messagesDiv.children[messagesDiv.children.length - 1].style.borderBottom = "0px solid white";
    });
});

function clearAuto() {
    let autos = document.getElementsByClassName("autoSelect");
    for (let i = 0; i < autos.length; i++) {
        autos[i].style.display = "none";
    }
}

function sendMsg(userID, guildID) {
    let msg = document.getElementById("msgInp");
    let len = msg.children.length;
    while (msg.children.length != 0) {
        if (msg.children[0].getAttribute("value")) {
            msg.replaceChild(document.createTextNode(msg.children[0].getAttribute("value").toString()), msg.children[0]);
        }
    }
    msg.textContent = msg.textContent.replace(/\r\n|\r|\n/g,"\\n");
    if (!msg.textContent) {
        return;
    }
    let body = {
        "channel": location.href.split(/(\\|\/)/g).pop(),
        "msg": msg.textContent
    }
    fetch('/server/' + userID + '/' + guildID + '/sendMsg', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    msg.innerHTML = "";
}

var childLength = 1;

function handleType(inp, event) {
    if (event.keyCode == 13 && !event.shiftKey) {
        return;
    } else if (((getWord().includes("@") && (getCharacterPrecedingCaret(inp) != " " && getCharacterPrecedingCaret(inp) != "" && getCharacterPrecedingCaret(inp) != "\n")) || event.key == "@") && event.which != 32 && !(event.which == 8 && childLength != inp.children.length) && !(event.which == 8 && getCharacterPrecedingCaret(inp) == " ")) {
        let autoInpChannels = document.getElementById("inpSelChannels");
        autoInpChannels.innerHTML = "";
        document.getElementById("inpTitleChannels").style.display = "none";
        autoInpChannels.style.display = "none";
        let autoInpUsers = document.getElementById("inpSelUsers");
        autoInpUsers.innerHTML = "";
        document.getElementById("inpTitleUsers").style.display = "none";
        autoInpUsers.style.display = "none";
        for (let user in usersArr) {
            if (!(usersArr[user].username.toLowerCase()).includes(getWord().replace("@", "").replace(" ", "").toLowerCase())) {
                continue;
            }
            document.getElementById("inpTitleUsers").style.display = "block";
            autoInpUsers.style.display = "block";
            let userDom = document.createElement("div");
            userDom.className = "autoDiv";
            userDom.onclick = () => {
                removeCurrentWord();
                insertAtCaret("@" + usersArr[user].username, "<@" + usersArr[user].id + ">", false, inp);
            };
            userDomB = document.createElement("b");
            userDomB.textContent = usersArr[user].username + "#" + usersArr[user].discriminator;
            userDom.appendChild(userDomB);
            autoInpUsers.appendChild(userDom)
        }

        let autoInpRoles = document.getElementById("inpSelRoles");
        document.getElementById("inpTitleRoles").style.display = "none";
        autoInpRoles.style.display = "none";
        autoInpRoles.innerHTML = "";
        for (let role in rolesArr) {
            if (!(rolesArr[role].name.toLowerCase()).includes(getWord().replace("@", "").replace(" ", "").toLowerCase())) {
                continue;
            }
            document.getElementById("inpTitleRoles").style.display = "block";
            autoInpRoles.style.display = "block";
            let roleDom = document.createElement("div");
            roleDom.className = "autoDiv";
            roleDom.onclick = () => {
                removeCurrentWord();
                insertAtCaret("@" + rolesArr[role].name, "<@&" + rolesArr[role].id + ">", rolesArr[role].color.toString(16), inp);
            };
            roleDomB = document.createElement("b");
            roleDomB.textContent = rolesArr[role].name;
            roleDomB.style.color = `#${rolesArr[role].color.toString(16)}`;
            roleDom.appendChild(roleDomB);
            autoInpRoles.appendChild(roleDom)
        }
        document.getElementById("inpSel").style.display = "inline-block";
    } else if (((getWord().includes("#") && (getCharacterPrecedingCaret(inp) != " " && getCharacterPrecedingCaret(inp) != "" && getCharacterPrecedingCaret(inp) != "\n")) || event.key == "#") && event.which != 32 && !(event.which == 8 && childLength != inp.children.length) && !(event.which == 8 && getCharacterPrecedingCaret(inp) == " ")) {
        let autoInpRoles = document.getElementById("inpSelRoles");
        document.getElementById("inpTitleRoles").style.display = "none";
        autoInpRoles.style.display = "none";
        autoInpRoles.innerHTML = "";
        let autoInpUsers = document.getElementById("inpSelUsers");
        autoInpUsers.innerHTML = "";
        document.getElementById("inpTitleUsers").style.display = "none";
        autoInpUsers.style.display = "none";
        let autoInpChannels = document.getElementById("inpSelChannels");
        autoInpChannels.innerHTML = "";
        document.getElementById("inpTitleChannels").style.display = "none";
        autoInpChannels.style.display = "none";
        for (let channel in channelsArr) {
            console.log(channelsArr[channel])
            if (!(channelsArr[channel].name.toLowerCase()).includes(getWord().replace("#", "").replace(" ", "").toLowerCase())) {
                continue;
            }
            document.getElementById("inpTitleChannels").style.display = "block";
            autoInpChannels.style.display = "block";
            let channelDom = document.createElement("div");
            channelDom.className = "autoDiv";
            channelDom.onclick = () => {
                removeCurrentWord();
                insertAtCaret("#" + channelsArr[channel].name, "<#" + channelsArr[channel].id + ">", false, inp);
            };
            channelDomB = document.createElement("b");
            channelDomB.textContent = channelsArr[channel].name;
            channelDom.appendChild(channelDomB);
            autoInpChannels.appendChild(channelDom);
        }
        document.getElementById("inpSel").style.display = "inline-block";
    } else {
        document.getElementById("inpSel").style.display = "none";
    }
    childLength = inp.children.length;
}

function handleSend(inp, event, userID, guildID) {
    if (event.keyCode == 13 && !event.shiftKey) {
        event.preventDefault();
        sendMsg(userID, guildID)
    } else if (event.keyCode == 9) {
        event.preventDefault();
        if (document.getElementById("inpTitleUsers").style.display != "none" && document.getElementById("inpTitleUsers").style.display != "") {
            for (let user in usersArr) {
                if (!(usersArr[user].username.toLowerCase()).includes(getWord().replace("@", "").replace(" ", "").toLowerCase())) {
                    continue;
                }
                removeCurrentWord();
                insertAtCaret("@" + usersArr[user].username, "<@" + usersArr[user].id + ">", false, inp);
                return;
            }
        }
        if (document.getElementById("inpTitleRoles").style.display != "none" && document.getElementById("inpTitleRoles").style.display != "") {
            for (let role in rolesArr) {
                if (!(rolesArr[role].name.toLowerCase()).includes(getWord().replace("@", "").replace(" ", "").toLowerCase())) {
                    continue;
                }
                removeCurrentWord();
                insertAtCaret("@" + rolesArr[role].name, "<@&" + rolesArr[role].id + ">", rolesArr[role].color.toString(16), inp);
                return;
            }
        }
        if (document.getElementById("inpTitleChannels").style.display != "none" && document.getElementById("inpTitleChannels").style.display != "") {
            for (let channel in channelsArr) {
                if (!(channelsArr[channel].name.toLowerCase()).includes(getWord().replace("#", "").replace(" ", "").toLowerCase())) {
                    continue;
                }
                removeCurrentWord();
                insertAtCaret("#" + channelsArr[channel].name, "<#" + channelsArr[channel].id + ">", false, inp);
                return;
            }
        }
    }
}

function insertAtCaret(name, id, colour, container) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            let span = document.createElement("span");
            span.setAttribute("value", id);
            span.textContent = name;
            let randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            let uniqid = randLetter + Date.now();
            span.id = uniqid;
            if (colour) {
                span.style.color = "#" + colour;
                span.style.background = "#" + colour + "22";
            }
            let beforeStr = getCharacterPrecedingCaret(container);
            if (beforeStr !== " " && beforeStr !== "" && !beforeStr) {
                range.insertNode( document.createTextNode(" ") );
                range.setStart(container, range.endOffset);
            }
            range.insertNode( span );
            range.setStart(container, range.endOffset);
            range.insertNode( document.createTextNode(" ") );
            range.setStart(container, range.endOffset);
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
}

function getCharacterPrecedingCaret(containerEl) {
    var precedingChar = "", sel, range, precedingRange;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount > 0) {
            range = sel.getRangeAt(0).cloneRange();
            range.collapse(true);
            range.setStart(containerEl, 0);
            precedingChar = range.toString().slice(-1);
        }
    }
    return precedingChar;
}

function removeCurrentWord() {
    var sel = "";
    if (window.getSelection && (sel = window.getSelection()).modify) {
        var selectedRange = sel.getRangeAt(0);
        sel.collapseToStart();
        sel.modify("move", "backward", "word");
        sel.modify("move", "backward", "character");
        sel.modify("extend", "forward", "word");
        sel.modify("extend", "forward", "word");
        sel.deleteFromDocument();

        sel.removeAllRanges();
        sel.addRange(selectedRange);
    }
}

function getWord() {
    var sel, word = "";
    if (window.getSelection && (sel = window.getSelection()).modify) {
        var selectedRange = sel.getRangeAt(0);
        sel.collapseToStart();
        sel.modify("move", "backward", "word");
        sel.modify("move", "backward", "character");
        sel.modify("extend", "forward", "word");
        sel.modify("extend", "forward", "word");

        word = sel.toString();

        sel.removeAllRanges();
        sel.addRange(selectedRange);
    }
    return word;
}
