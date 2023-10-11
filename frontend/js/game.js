import SocketManager from './module/socketManager.js';


const cells = document.querySelectorAll('.cell');

cells.forEach(cell => {
    cell.addEventListener('click', handleClick);
});

function handleClick(e) {
    const cell = e.target;
    console.log(cell);
    SocketManager.emit('play', cell.id);
}