const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const session = require('express-session')({
    // CIR2-chat encode in sha256
    secret: 'eb8fcc253281389225b4f7872f2336918ddc7f689e1fc41b64d5c4f378cdc438',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 2 * 60 * 60 * 1000,
        secure: false
    }
});
const sharedsession = require('express-socket.io-session');
const bodyParser = require('body-parser');
const {
    body,
    validationResult
} = require('express-validator');

/**** Project configuration ****/

const jsonParser = bodyParser.json();


// Init of express, to point our assets
app.use(express.static(__dirname + '/frontend/'));
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
    if (req.session.username != null) res.redirect("/game");
    else res.sendFile(__dirname + "/frontend/html/login.html");
});

app.post(
    '/login', body('login').isLength({
        min: 3
    }).trim().escape(), (req, res) => {
        const login = req.body.login

        // Error management
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("ERROR");
            console.log(errors);
            return res.status(400).json({
                errors: errors.array()
            });
        } else {
            // Store login
            req.session.username = login;
            req.session.save()
            res.sendStatus(200);
        }
    });


io.on("connection", (socket) => {
    const username = socket.handshake.session.username;
    console.log(username + " connected");

});

http.listen(4200, () => {
    console.log("Server is listening on port 4200");
});
