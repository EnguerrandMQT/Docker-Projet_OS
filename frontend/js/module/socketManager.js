let socket = io();

function emit(event, data) {
    console.log("Emitting " + event + " with data " + data);
    socket.emit(event, data);
}


export default {
    emit,
}