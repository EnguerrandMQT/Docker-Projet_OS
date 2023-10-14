import SocketManager from "./module/socketManager.js";

const Scoreboard = document.getElementById("scoreboard");
const Rooms = document.getElementById("rooms");

const inPage = document.getElementById("homeDiv") == null ? false : true;
console.log("inPage : ", inPage);
if (inPage) {
    console.log("Home.js");
    
    document.getElementById("createRoom").addEventListener("click", () => {
        console.log("createRoom");
        SocketManager.emit("createRoom");
    });
}

function updateScoreboard(scores) {
    if(!inPage) return;
    console.log("Updating scoreboard");
    console.log(scores);
    // scores.forEach((score) => {
    //     let li = document.createElement("li");
    //     li.innerHTML = score.name + " : " + score.score;
    //     Scoreboard.appendChild(li);
    // });
}

function updateRooms(rooms) {
    if(!inPage) return;
    console.log("Updating rooms");
    console.log(rooms);
    // clean Rooms
    while (Rooms.firstChild) {
        Rooms.removeChild(Rooms.firstChild);
    }

   
    rooms.forEach((room) => {
        let div = document.createElement("div");
        div.innerHTML = "Partie de : " + room.game.players[0].username;
        if(room.players.length > 1) {
            div.innerHTML = room.game.players[0].username  + " VS " + room.game.players[1].username;
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
