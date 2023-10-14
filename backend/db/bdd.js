const mysql = require("mysql2");

module.exports = class BDD {
    constructor() {
        this.con = mysql.createConnection({
            user: "localhost",
            password: "pass",
            host: "mysql",
            database: "proj_db",
        });
        this.con.connect(function (err) {
            if (err) throw err;
            console.log("DB connected!");
        });
    }
    // create a new player in the database with the given uuid and username and set his wins, losses and draws to 0
    async createPlayer(uuid, username) {
        return new Promise((resolve, reject) => {
            const query = "INSERT INTO players (id, username, win, loss, draw) VALUES (?, ?, 0, 0, 0)";
            this.con.query(query, [uuid, username], function (err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    async getPlayerByUuid(uuid) {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM players WHERE id = ?";
            this.con.query(query, [uuid], function (err, result) {
                if (err) reject(err);
                else {
                    if (result && result.length > 0) resolve(result[0]);
                    else resolve(null);
                }
            });
        });
    }

    async getPlayerByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM players WHERE username = ?";
            this.con.query(query, [username], function (err, result) {
                if (err) reject(err);
                else {
                    if (result && result.length > 0) resolve(result[0]);
                    else resolve(null);
                }
            });
        });
    }

    async getPlayers() {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM players";
            this.con.query(query, function (err, result) {
                if (err) reject(err);
                else {
                    if (result && result.length > 0) resolve(result[0]);
                    else resolve(null);
                }
            });
        });
    }

    async addWin(uuid) {
        return new Promise((resolve, reject) => {
            const query = "UPDATE players SET win = win + 1 WHERE id = ?";
            this.con.query(query, [uuid], function (err, result) {
                if (err) reject(err);
                else {
                    if (result && result.length > 0) resolve(result[0]);
                    else resolve(null);
                }
            });
        });
    }

    async addLoss(uuid) {
        return new Promise((resolve, reject) => {
            const query = "UPDATE players SET loss = loss + 1 WHERE id = ?";
            this.con.query(query, [uuid], function (err, result) {
                if (err) reject(err);
                else {
                    if (result && result.length > 0) resolve(result[0]);
                    else resolve(null);
                }
            });
        });
    }

    async addDraw(uuid) {
        return new Promise((resolve, reject) => {
            const query = "UPDATE players SET draw = draw + 1 WHERE id = ?";
            this.con.query(query, [uuid], function (err, result) {
                if (err) reject(err);
                else {
                    if (result && result.length > 0) resolve(result[0]);
                    else resolve(null);
                }
            });
        });
    }
};
