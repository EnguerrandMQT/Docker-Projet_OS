import SocketManager from "./module/socketManager.js";

const cells = document.querySelectorAll(".cell");
const restart = document.getElementById("restart");
const quit = document.getElementById("quit");

const inPage = document.getElementById("gameDiv") == null ? false : true;
console.log("inPage : ", inPage);
if (inPage) {
    console.log("Game.js");

    cells.forEach((cell) => {
        cell.addEventListener("click", handleClick);
    });

    restart.addEventListener("click", () => {
        SocketManager.emit("restart");
    });

    quit.addEventListener("click", () => {
        SocketManager.emit("quit");
    });
}

function handleClick(e) {
    e.preventDefault();
    const cell = e.target;
    console.log(cell);
    SocketManager.emit("play", cell.id);
}

function displayNames(p1, p2) {
    if (!inPage) return;
    console.log("Game started with players : ", p1, p2);
    document.getElementById("player1").innerHTML = p1;
    document.getElementById("player2").innerHTML = p2;
}

function gameUpdate(grid, playerTurn) {
    if (!inPage) return;
    document.getElementById("restart").disabled = true;
    for (let i = 0; i < 9; i++) {
        cells[i].innerHTML = grid[i] == undefined ? "" : grid[i];
    }
    document.getElementById("status").innerHTML = playerTurn + "'s turn";
}

function gameFinished(winner) {
    if (!inPage) return;
    document.getElementById("restart").disabled = false;
    if (winner == "draw") {
        console.log("Game finished, draw");
        document.getElementById("status").innerHTML = "Draw";
    } else {
        console.log("Game finished, winner : ", winner);
        document.getElementById("status").innerHTML = winner + " won";
    }
}

export default {
    displayNames,
    gameUpdate,
    gameFinished,
};
