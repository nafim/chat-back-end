var socket = require('socket.io-client')('http://localhost:4000', {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzbnJhaG1hbjIwMTBAZ21haWwuY29tIiwiYXVkIjoiY2hhdC5uYWZpbXJhaG1hbi5jb20iLCJpYXQiOjE2MTAwNTQwMzcsImV4cCI6MTYxMjY0NjAzN30.m8b9UuMRfhGJWjDCpBaoduE6r1S2WvlxOPtaWusKhAE"
    },
    query: {
        "username": "a",
        "room": "room1"

    }
});
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
    console.log(err); // true
    console.log(err.message); // show the error message
});

socket.on('Message', function(data){
    console.log('Received: ' + data.text);
});
socket.on('disconnect', function(){
    console.log("disconnected")
});
