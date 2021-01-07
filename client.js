var socket = require('socket.io-client')('http://localhost:4000?username=a&room=room1');
var username = 'a1';
var room = "room1" ;
var message = "hi";
var ready=false;

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});


function sendMessage() {
    if (socket.connected) {
        readline.question('>', (result) => {
            socket.emit('sendMessage', result);
            setTimeout(sendMessage, 500);
        });
    }
}


socket.on('connect', function(){

    sendMessage();
});

// if this happens connection is refused, need to manually reconnect again
socket.on("connect_error", (err) => {
    console.log(err instanceof Error); // true
    console.log(err.message); // show the error message
});

socket.on('Message', function(data){
    console.log('Received: ' + data.text);
});
socket.on('disconnect', function(){
    console.log("disconnected")
}); 
