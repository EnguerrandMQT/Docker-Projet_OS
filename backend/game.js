module.exports = class Morpion{
    constructor(roomId){
        this.roomId = roomId;
        this.players = [];
        this.turn = 0;
        this.cells = [];
        for(let i = 0; i < 9; i++){
            this.cells.push(undefined);
        }
    }
    addPlayer(playerInfo){
        this.players.push(playerInfo);
    }

    isPlayerTurn(uuid){
        return this.players[this.turn].uuid == uuid;
    }

    getNbPlayers(){
        return this.players.length;
    }

    isCellEmpty(cellId){
        return this.cells[cellId] == undefined;
    }

    // the array could look like this:
    // [x, o, x,
    //  o, x, o,
    //  x, undefined, undefined ]
    // return the winner if there is one, undefined otherwise
    isFinished(){
        // check if there is a winner
        // check horizontal
        for(let i = 0; i < 9; i += 3){
            if(this.cells[i] != undefined && this.cells[i] == this.cells[i + 1] && this.cells[i] == this.cells[i + 2]){
                return this.cells[i] == "x" ? this.players[0]: this.players[1];
            }
        }
        // check vertical
        for(let i = 0; i < 3; i++){
            if(this.cells[i] != undefined && this.cells[i] == this.cells[i + 3] && this.cells[i] == this.cells[i + 6]){
                return this.cells[i] == "x" ? this.players[0]: this.players[1];
            }
        }
        // check diagonal
        if(this.cells[0] != undefined && this.cells[0] == this.cells[4] && this.cells[0] == this.cells[8]){
            return this.cells[0] == "x" ? this.players[0]: this.players[1];
        }
        if(this.cells[2] != undefined && this.cells[2] == this.cells[4] && this.cells[2] == this.cells[6]){
            return this.cells[2] == "x" ? this.players[0]: this.players[1];
        }
        // check if the grid is full
        for(let i = 0; i < 9; i++){
            if(this.cells[i] == undefined) return undefined;
        }
        return "draw";
    }

    play(cellId){
        this.cells[cellId] = this.turn == 0 ? "x" : "o";
        this.turn = (this.turn + 1) % 2;
        return this.isFinished();
    }

    restart(){
        this.cells = [];
        for(let i = 0; i < 9; i++){
            this.cells.push(undefined);
        }
        this.turn = 0;
    }

    getPlayerTurn(){
        return this.players[this.turn];
    }

    getGrid(){
        return this.cells;
    }

    
}