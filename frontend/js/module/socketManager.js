import Home from "../home.js";
import Game from "../game.js";

let socket = io();

socket.on("redirect", (url) => {
    window.location.href = url;
});

socket.on("error", (error) => {
    console.error("Error : ", error);
});

/* ---------------------------------- HOME ---------------------------------- */
socket.on("updateRooms", (rooms) => Home.updateRooms(rooms));
socket.on("updateScoreboard", (players) => Home.updateScoreboard(players));

/* ---------------------------------- GAME ---------------------------------- */
socket.on("displayNames", (p1, p2) => Game.displayNames(p1, p2));
socket.on("gameUpdate", (grid, playerTurn) => Game.gameUpdate(grid, playerTurn));
socket.on("gameFinished", (winner) => Game.gameFinished(winner));

/* ---------------------------------- OTHER --------------------------------- */
//! Oui M. Capiod, cette ligne est pour vous. Je vous avais prévenu dans le rapport du TP.
socket.on("rickroll", () => {
    window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
});

function emit(event, data) {
    console.log("Emitting " + event + " with data " + data);
    if (socket.disconnected) {
        console.error("Socket is disconnected");
        return;
    }
    socket.emit(event, data);
}

export default {
    emit,
};