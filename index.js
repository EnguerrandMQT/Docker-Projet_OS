const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const session = require("express-session")({
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

const jsonParser = bodyParser.json();

app.use(express.static(__dirname + "/frontend/"));
app.use(session);
app.use(jsonParser);

io.use(
    sharedsession(session, {
        autoSave: true,
    })
);

/* --------------------------------- ROUTES --------------------------------- */

// login page
app.get("/", (req, res) => {
    if (req.session.uuid != null) res.redirect("/home");
    else res.sendFile(__dirname + "/frontend/html/login.html");
});

// home page
app.get("/home", (req, res) => {
    if (req.session.uuid == null) res.redirect("/");
    else res.sendFile(__dirname + "/frontend/html/home.html");
});

// game page
app.get("/game", (req, res) => {
    if (req.session.uuid == null) res.redirect("/");
    else res.sendFile(__dirname + "/frontend/html/game.html");
});

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
let idCounter = 0;

io.on("connection", (socket) => {
    const username = socket.handshake.session.username;
    const uuid = socket.handshake.session.uuid;

    if (username == undefined || uuid == undefined) {
        console.log("SOCKET // User  not logged in, redirecting to login page");
        socket.emit("redirect", "/");
        return;
    }
    const roomId = socket.handshake.session.roomId;
    console.log(username + " connected");
    io.emit("updateRooms", allRooms);
    BDD.getScoreboard().then((result) => {
        io.emit("updateScoreboard", result);
    }).catch((err) => {
        console.log("SOCKET // Error while getting scoreboard");
        console.log(err.message);
        socket.emit("error", "Error while getting scoreboard");
    });

    if (roomId != undefined) {
        console.log("SOCKET // User is link to a room, updating session and sending game data");
        socket.join(roomId);

        const game = allRooms.find((room) => room.id == roomId).game;
        if (game == undefined) return;
        if (game.getNbPlayers() == 1)
            io.to(roomId).emit("displayNames", game.players[0].username, "Waiting for player...");
        else if (game.getNbPlayers() == 2) {
            io.to(roomId).emit("displayNames", game.players[0].username, game.players[1].username);
            io.to(roomId).emit("gameUpdate", game.getGrid(), game.getPlayerTurn().username);
        }
    }

    socket.on("getScoreboard", () => {
        BDD.getScoreboard().then((result) => {
            console.log("SOCKET // Sending scoreboard");
            socket.emit("updateScoreboard", result);
        }).catch((err) => {
            console.log("SOCKET // Error while getting scoreboard");
            console.log(err.message);
            socket.emit("error", "Error while getting scoreboard");
        });
    });

    socket.on("createRoom", () => {
        console.log("CREATE ROOM");
        socket.handshake.session.roomId = idCounter;
        let newGame = new Morpion(idCounter);
        newGame.addPlayer({ username, uuid });
        let newRoom = {
            id: idCounter,
            players: [uuid],
            game: newGame,
        };
        allRooms.push(newRoom);
        socket.emit("redirect", "/game");

        io.emit("updateRooms", allRooms);
        idCounter++;
    });

    socket.on("joinRoom", (roomId) => {
        console.log("JOIN ROOM");
        if (roomId == undefined) return;
        const room = allRooms.find((room) => room.id == roomId);
        if (room == undefined) return;
        if (room.game == undefined) return;
        if (room.players.length >= 2) return;
        room.players.push(uuid);

        room.game.addPlayer({ username, uuid });
        socket.handshake.session.roomId = roomId;
        socket.handshake.session.save();
        socket.emit("redirect", "/game");
    });

    socket.on("play", (cellId) => {
        console.log("PLAY");
        if (socket.handshake.session.roomId == undefined) return;
        
        // Handle errors
        const game = allRooms.find((room) => room.id == roomId).game;
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
                if (winner == game.players[0]) BDD.addLoss(game.players[1].uuid);
                else BDD.addLoss(game.players[0].uuid);
                
                if(winner.username == "Pierre" || winner.username == "pierre"){
                    const playersInRoom = io.sockets.adapter.rooms.get(roomId);
                    for (const p of playersInRoom) {
                        const playerSocket = io.sockets.sockets.get(p);
                        if(playerSocket.handshake.session.uuid == winner.uuid){
                            playerSocket.emit("rickroll");
                        }
                    }
                }
            }
            return;
        }
        return io.to(roomId).emit("gameUpdate", game.getGrid(), game.getPlayerTurn().username);
    });

    socket.on("restart", () => {
        console.log("RESTART");
        console.log(socket.handshake.session.roomId);
        if (socket.handshake.session.roomId == undefined) return;
        const roomId = socket.handshake.session.roomId;

        // Handle errors
        const game = allRooms.find((room) => room.id == roomId).game;
        if (!game) return socket.emit("error", "Room not found");
        if (game.getNbPlayers() != 2) return socket.emit("error", "Not enough players");
        if (!game.isFinished()) return socket.emit("error", "Game not finished");

        // Restart
        console.log(username + " restarted the game");
        game.restart();
        io.to(roomId).emit("gameUpdate", game.getGrid(), game.getPlayerTurn().username);
    });

    socket.on("quit", () => {
        console.log("QUIT");
        if (socket.handshake.session.roomId == undefined) return;
        const roomId = socket.handshake.session.roomId;

        // Handle errors
        const game = allRooms.find((room) => room.id == roomId)?.game;
        if (!game) return socket.emit("error", "Room not found");

        if (!game.isFinished() && game.getGrid().some((cell) => cell != undefined)) {
            console.log("Adding loss to " + username, socket.handshake.session.uuid);
            BDD.addLoss(socket.handshake.session.uuid);
            if (game.players[0].uuid == socket.handshake.session.uuid) BDD.addWin(game.players[1].uuid);
            else BDD.addWin(game.players[0].uuid);

            BDD.getScoreboard().then((result) => {
                io.emit("updateScoreboard", result);
            }).catch((err) => {
                console.log("SOCKET // Error while getting scoreboard");
                console.log(err.message);
                socket.emit("error", "Error while getting scoreboard");
            });
        }

        const playersInRoom = io.sockets.adapter.rooms.get(roomId);
        for (const p of playersInRoom) {
            const playerSocket = io.sockets.sockets.get(p);
            playerSocket.handshake.session.roomId = undefined;
            playerSocket.handshake.session.save();
            playerSocket.leave(roomId);
            playerSocket.emit("redirect", "/home");
        }
        allRooms = allRooms.filter((room) => room.id != roomId);
        io.emit("updateRooms", allRooms);

    });

    socket.on("disconnect", () => {
        console.log(username + " disconnected");
    });
});

http.listen(4200, () => {
    console.log("Server is listening on port 4200");
});
