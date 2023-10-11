import logger from './module/logger.js';

let form = document.getElementById('loginForm');
let input = document.getElementById('username');

// Envoi du login via le module de connexion
form.addEventListener('submit', e => {
    e.preventDefault();
    logger.sendLogin(input.value);
});