import SocketManager from './module/socketManager.js';


const cells = document.querySelectorAll('.cell');

cells.forEach(cell => {
    cell.addEventListener('click', handleClick);
});

document.getElementById("restart").addEventListener('click', () => {
    SocketManager.emit('restart');
});

document.getElementById("quit").addEventListener('click', () => {
    SocketManager.emit('quit');
});

function handleClick(e) {
    const cell = e.target;
    console.log(cell);
    SocketManager.emit('play', cell.id);
}