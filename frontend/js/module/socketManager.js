let socket = io();

socket.on("redirect", (url) => {
    window.location.href = url;
});

socket.on("error", (error) => {
    console.log("Error : ", error);
});

socket.on("displayNames", (p1, p2) => {
    console.log("Game started with players : ", p1, p2);
    document.getElementById("player1").innerHTML = p1;
    document.getElementById("player2").innerHTML = p2;
});

socket.on("gameUpdate", (grid, playerTurn) => {
    document.getElementById("restart").disabled = true;
    const cells = document.querySelectorAll(".cell");
    for (let i = 0; i < 9; i++) {
        cells[i].innerHTML = grid[i] == undefined ? "" : grid[i];
    }
    document.getElementById("status").innerHTML = playerTurn + "'s turn";
});

socket.on("gameFinished", (winner) => {
    document.getElementById("restart").disabled = false;
    if (winner == "draw") {
        console.log("Game finished, draw");
        document.getElementById("status").innerHTML = "Draw";
    } else {
        console.log("Game finished, winner : ", winner);
        document.getElementById("status").innerHTML = winner + " won";
    }
});

function emit(event, data) {
    console.log("Emitting " + event + " with data " + data);
    socket.emit(event, data);
}

export default {
    emit,
};
