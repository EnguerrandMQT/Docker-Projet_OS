import SocketManager from "./module/socketManager.js";

const Scoreboard = document.getElementById("scoreboardContent");
const Rooms = document.getElementById("roomsContent");

const inPage = document.getElementById("homeDiv") == null ? false : true;
console.log("inPage : ", inPage);
if (inPage) {
    console.log("Home.js");
    
    document.getElementById("createRoom").addEventListener("click", () => {
        console.log("createRoom");
        SocketManager.emit("createRoom");
    });
}

function updateScoreboard(players) {
    if(!inPage) return;
    console.log("Updating scoreboard");
    while (Scoreboard.firstChild) {
        Scoreboard.removeChild(Scoreboard.firstChild);
    }
    players.forEach((player) => {
        let div = document.createElement("div");
        let h2 = document.createElement("h2");
        h2.innerHTML = player.username;
        let p = document.createElement("p");
        p.innerHTML = "Victoires : " + player.win + "</br>Défaites : " + player.loss + "</br>Égalités : " + player.draw;
        div.appendChild(h2);
        div.appendChild(p);
        Scoreboard.appendChild(div);
    });
}

function updateRooms(rooms) {
    if(!inPage) return;
    console.log("Updating rooms");
    console.log(rooms);
    while (Rooms.firstChild) {
        Rooms.removeChild(Rooms.firstChild);
    }

    rooms.forEach((room) => {
        let div = document.createElement("div");
        if(room.players.length > 1) {
            div.innerHTML = room.game.players[0].username  + " VS " + room.game.players[1].username;
        }else{
            div.innerHTML = "<b>"+room.game.players[0].username + "</b> est en attente d'un adversaire";
        }
        div.id = room.id;
        div.addEventListener("click", () => {
            SocketManager.emit("joinRoom", room.id);
        });
        Rooms.appendChild(div);
    });
}

export default {
    updateScoreboard,
    updateRooms,
};
