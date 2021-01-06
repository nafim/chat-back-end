const express = require('express');
const app = express();
require('dotenv').config();
app.use(require('./api'));

const port = 4000;

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
  });

const server = app.listen(port, () => {
    console.log(`chat server listening at http://localhost:${port}`);
});

rooms = {
    room1: {
        users: []
    },
    room2: {
        users: []
    },
    room3: {
        users: []
    }
}

sockets = [
]

// functions regarding users
function addUser ({id, username, room}) {
    rooms[room].users.push({id, username});
    sockets.push({id, username, room});
}

function idToUsernameAndRoom (id) {
    socketData = sockets.find((socket) => {
        return socket.id === id
    })
    return {username: socketData.username, room: socketData.room};
}

function removeUser(id) {
    const userData = idToUsernameAndRoom(id);
    const room = userData.room;
    const username = userData.username;
    rooms[room].users = rooms[room].users.filter(user => user !== username);
    sockets = sockets.filter(socket => socket.id !== id);
    return userData;
}

function usersInRoom(room) {
    return rooms[room].users;
}

// functions regarding messages
function createMessage(username, text) {
    return {
        username,
        text,
        timeStamp: new Date().getTime()
    }
}

// set up socket io connection
const io = require('socket.io')(server);

io.on("connection", (socket) => {
    socket.on("join", (data) => {
        console.log("connected")
        addUser({ id: socket.id, username: data.username, room: data.room })

        socket.join(data.room)
        socket.to(data.room).emit("Alert", `${data.username} has joined!`);

        io.to(data.room).emit("roomData", {
            room: data.room,
            users: usersInRoom(data.room)
        })
        console.log(rooms)
        console.log(sockets)
    })

    socket.on("sendMessage", (message_txt) => {
        console.log(message_txt);
        const userData = idToUsernameAndRoom(socket.id);
        const room = userData.room;
        const username = userData.username;
        io.to(room).emit("Message", createMessage(username, message_txt));
    })

    socket.on("disconnect", () => {
        const userData = removeUser(socket.id);
        const room = userData.room;

        console.log(rooms)
        console.log(sockets)
        if (userData) {
            io.to(room).emit("roomData", {
                room: room,
                users: usersInRoom(room)
            })
        }
    })
})
