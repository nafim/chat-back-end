var socket = require('socket.io-client')('http://localhost:4000');
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
        readline.question('', (result) => {
            socket.emit('sendMessage', result);
            setTimeout(sendMessage, 500);
        });
    }
}


socket.on('connect', function(){
    // username = prompt.get(['username'], (err, result) => {
    //     consol
    // });
    socket.emit('join', {
        username: 'a',
        room: "room1"
    });
    sendMessage();
});



socket.on('Message', function(data){
    console.log('Received: ' + data.text);
});
socket.on('disconnect', function(){
    console.log("disconnected")
}); 
