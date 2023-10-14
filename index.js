const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const session = require("express-session")({
    // CIR2-chat encode in sha256
    secret: "eb8fcc253281389225b4f7872f2336918ddc7f689e1fc41b64d5c4f378cdc438",
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 2 * 60 * 60 * 1000,
        secure: false,
    },
});
const sharedsession = require("express-socket.io-session");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
const uuid = require("uuid");
const Morpion = require("./backend/game.js");
const bdd = require("./backend/db/bdd.js");
const BDD = new bdd();

/**** Project configuration ****/

const jsonParser = bodyParser.json();

// Init of express, to point our assets
app.use(express.static(__dirname + "/frontend/"));
app.use(session);
app.use(jsonParser);

io.use(
    sharedsession(session, {
        // Session automatically change if changement
        autoSave: true,
    })
);

// Routes

app.get("/", (req, res) => {
    if (req.session.username == null) res.redirect("/login");
    else res.sendFile(__dirname + "/frontend/html/game.html");
});

app.get("/login", (req, res) => {
    if (req.session.username != null) res.redirect("/");
    else res.sendFile(__dirname + "/frontend/html/login.html");
});

// check if the username is not undefined or null or NaN or false or true
const isUsernameAuthorized = (value) => {
    if (value == undefined || value == null || value == false || value == true) {
        throw new Error("Username is not authorized");
    }
    return true;
};

app.post(
    "/login",
    body("login")
        .isString()
        .isLength({
            min: 3,
            max: 40,
        })
        .trim()
        .escape()
        .custom(isUsernameAuthorized),
    (req, res) => {
        const login = req.body.login;

        // Error management
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("ERROR");
            console.log(errors);
            return res.status(400).json({
                errors: errors.array(),
            });
        } else {
            // Store login
            req.session.username = login;
            req.session.uuid = uuid.v4();
            req.session.save();
            BDD.getPlayerByUsername(login)
                .then((result) => {
                    if (result == null || result.length == 0) {
                        console.log("Player doesn't exist");
                        BDD.createPlayer(req.session.uuid, login)
                            .then((result) => {
                                console.log("New player created");
                                res.sendStatus(200); // OK
                            })
                            .catch((err) => {
                                console.log("Error while creating player");
                                console.log(err.message);
                                res.sendStatus(500); // Internal server error
                            });
                    } else {
                        console.log("Player already exists : " + result.username + " // " + result.id);
                        req.session.uuid = result.id;
                        req.session.save();
                        res.sendStatus(200); // OK
                    }
                })
                .catch((err) => {
                    console.log("Error while getting player by username");
                    console.log(err.message);
                    res.sendStatus(500); // Internal server error
                });
        }
    }
);

/* --------------------------------- SOCKET --------------------------------- */
let allRooms = [];
let allGames = [];
let idCounter = 0;

io.on("connection", (socket) => {
    const username = socket.handshake.session.username;
    const uuid = socket.handshake.session.uuid;

    if (username == undefined || uuid == undefined) {
        console.log("SOCKET // User  not logged in, redirecting to login page");
        socket.emit("redirect", "/login");
        return;
    }
    console.log("SOCKET // Connection of : " + username + " // " + uuid);

    let isPlayerInRoom = false;

    allRooms.forEach((room) => {
        if (room.players.includes(uuid)) {
            console.log("Player " + username + " reconnected to room " + room.id);
            socket.handshake.session.roomId = room.id;
            socket.join(room.id);
            allGames.forEach((game) => {
                if (game.roomId == room.id) {
                    io.to(room.id).emit("displayNames", game.players[0].username, game.players[1].username);
                    io.to(room.id).emit("gameUpdate", game.getGrid(), game.getPlayerTurn().username);
                }
            });
            isPlayerInRoom = true;
            return;
        }
        if (room.players.length < 2) {
            console.log("Player " + username + " joined room " + room.id);
            room.players.push(uuid);
            allGames.forEach((game) => {
                if (game.roomId == room.id) {
                    game.addPlayer({ username, uuid });
                    socket.join(room.id);
                    io.to(room.id).emit("displayNames", game.players[0].username, game.players[1].username);
                    io.to(room.id).emit("gameUpdate", game.getGrid(), game.getPlayerTurn().username);
                }
            });
            socket.handshake.session.roomId = room.id;
            isPlayerInRoom = true;
            return;
        }
    });
    if (!isPlayerInRoom) {
        console.log("Player " + username + " created room " + idCounter);
        socket.handshake.session.roomId = idCounter;

        let newGame = new Morpion(idCounter);
        newGame.addPlayer({ username, uuid });
        allGames.push(newGame);

        let newRoom = {
            id: idCounter,
            players: [uuid],
        };
        allRooms.push(newRoom);
        socket.join(idCounter);
        idCounter++;
        //display the usernames
        io.to(newRoom.id).emit(
            "displayNames",
            newGame.players[0].username,
            newGame.players[1] == "En attente d'un 2e joueur"
        );
    }

    socket.on("play", (cellId) => {
        console.log("PLAY");
        if (socket.handshake.session.roomId == undefined) return;
        const roomId = socket.handshake.session.roomId;

        // Handle errors
        const game = allGames.find((game) => game.roomId == roomId);
        if (!game) return socket.emit("error", "Room not found");
        if (game.getNbPlayers() != 2) return socket.emit("error", "Not enough players");
        if (game.isFinished()) return socket.emit("error", "Game already finished");
        if (!game.isPlayerTurn(socket.handshake.session.uuid)) return socket.emit("error", "Not your turn");
        if (cellId < 0 || cellId > 8) return socket.emit("error", "Cell doesn't exist");
        if (!game.isCellEmpty(cellId)) return socket.emit("error", "Cell not empty");

        // Play
        console.log(username + " played on cell " + cellId);
        let winner = game.play(cellId);
        if (winner) {
            if (winner == "draw") {
                console.log("Game finished, draw");
                io.to(roomId).emit("gameUpdate", game.getGrid());
                io.to(roomId).emit("gameFinished", "draw");
                BDD.addDraw(game.players[0].uuid);
                BDD.addDraw(game.players[1].uuid);
            } else {
                console.log("Game finished, winner is " + winner.username);
                io.to(roomId).emit("gameUpdate", game.getGrid());
                io.to(roomId).emit("gameFinished", winner.username);
                BDD.addWin(winner.uuid);
                // add loss to the other player
                if (winner == game.players[0]) BDD.addLoss(game.players[1].uuid);
                else BDD.addLoss(game.players[0].uuid);
            }
            return;
        }
        return io.to(roomId).emit("gameUpdate", game.getGrid(), game.getPlayerTurn().username);
    });

    socket.on("restart", () => {
        console.log("RESTART");
        if (socket.handshake.session.roomId == undefined) return;
        const roomId = socket.handshake.session.roomId;

        // Handle errors
        const game = allGames.find((game) => game.roomId == roomId);
        if (!game) return socket.emit("error", "Room not found");
        if (game.getNbPlayers() != 2) return socket.emit("error", "Not enough players");
        if (!game.isFinished()) return socket.emit("error", "Game not finished");

        // Restart
        console.log(username + " restarted the game");
        game.restart();
        io.to(roomId).emit("gameUpdate", game.getGrid(), game.getPlayerTurn().username);
    });

    // socket.on("quit", () => {
    //     console.log("QUIT");
    //     if (socket.handshake.session.roomId == undefined) return;
    //     const roomId = socket.handshake.session.roomId;

    //     // Handle errors
    //     const game = allGames.find((game) => game.roomId == roomId);
    //     if (!game) return socket.emit("error", "Room not found");

    //     // Quit
    //     console.log(username + " quit the game");
    //     if(game.getNbPlayers() == 2){
    //         BDD.addLoss(socket.handshake.session.uuid);
    //         //add win to the other player
    //         if(game.getPlayerTurn().uuid == socket.handshake.session.uuid) BDD.addWin(game.players[1].uuid);
    //         else BDD.addWin(game.players[0].uuid);
    //     } else {

    //     }
    //     socket.leave(roomId);
    //     socket.handshake.session.roomId = undefined;
    //     socket.handshake.session.save();


    //     io.to(roomId).emit("gameFinished", game.getPlayerTurn().username == username ? game.players[1].username : game.players[0].username);
    //     BDD.addLoss(game.getPlayerTurn().uuid);
    // });

    socket.on("disconnect", () => {
        console.log(username + " disconnected");
    });
});

http.listen(4200, () => {
    console.log("Server is listening on port 4200");
});
