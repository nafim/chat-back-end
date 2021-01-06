const express = require('express');
const app = express();
require('dotenv').config();
app.use("/api", require('./api'));

// import redis
const redis = require('redis');
redisClient = redis.createClient({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_ENDPOINT,
    auth_pass: process.env.REDIS_PASSWORD
});
const redisAdapter = require('socket.io-redis');
redisAdapter({ host: process.env.REDIS_ENDPOINT, port: process.env.REDIS_PORT });

redisClient.on('connect', () => {   
    global.console.log("connected");
});

redisClient.set("rooms", JSON.stringify(['room1', 'room2', 'room3']));         
redisClient.get("rooms", function (err, reply) {
        global.console.log(reply.toString())
})

redisClient.sismember('tags', "one", function(err, reply) {
    console.log(reply);
});


const port = 4000;

const server = app.listen(port, () => {
    console.log(`chat server listening at http://localhost:${port}`);
});

// set up socket io connection
const io = require('socket.io')(server);


// functions regarding users
function addUser ({id, username, room}) {
    const room_key = `${room}_users`;
    const socket_id = `${id}_socketid`;

    // check if username is already in the room
    redisClient.sismember(room_key, function(err, isMember) {
        if (isMember) {
            return console.error("already member");
        }
        // add user to list of users for this room
        redisClient.sadd([room_key, username], function(err, reply) {
            console.log("added username to set")
        });
        // mapping between this socketid and username/room
        redisClient.hmset(socket_id, {
            'username': username,
            'room': room
        });
        
    });
}

function idToUsernameAndRoom (id) {
    const socket_id = `${id}_socketid`;
    redisClient.hgetall(socket_id, function(err, userData) {
        return userData;
    });
}

function removeUser(id) {
    const socket_id = `${id}_socketid`;
    redisClient.hgetall(socket_id, function(err, userData) {
        const room = userData.room;
        const username = userData.username;
        // remove user from room's set of users
        redisClient.srem(`${room}_users`, username);

        // remove the socket_id
        redisClient.del(socket_id, function(err, reply) {
            console.log(reply);
        });
    });

    const userData = idToUsernameAndRoom(id);
    const room = userData.room;
    const username = userData.username;
    rooms[room].users = rooms[room].users.filter(user => user !== username);
    sockets = sockets.filter(socket => socket.id !== id);
    return userData;
}

function usersInRoom(room) {
    const room_key = `${room}_users`;
    redisClient.smembers(room_key, function(err, users) {
        return users;
    });
}

// functions regarding messages
function createMessage(username, text) {
    return {
        username,
        text,
        timeStamp: new Date().getTime()
    }
}

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
