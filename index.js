const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
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
function addUser({username, room}) {
    const room_key = `${room}_users`;

    // check if username is already in the room
    redisClient.sismember(room_key, function(err, isMember) {
        if (isMember) {
            return console.error("already member");
        }
        // add user to list of users for this room
        redisClient.sadd([room_key, username], function(err, reply) {
            console.log("added username to set")
        });
        // // mapping between this socketid and username/room
        // redisClient.hmset(socket_id, {
        //     'username': username,
        //     'room': room
        // });
        
    });
}

// function idToUsernameAndRoom (id) {
//     const socket_id = `${id}_socketid`;
//     redisClient.hgetall(socket_id, function(err, userData) {
//         return userData;
//     });
// }

function removeUser(username, room) {
    redisClient.srem(`${room}_users`, username, function(err, reply) {
        console.log("removed user from list");
    });
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
    const { username, room } = socket.handshake.query;
    addUser({ username, room })
    socket.join(room);

    io.to(room).emit("roomData", {
        room: room,
        users: usersInRoom(room)
    })

    socket.on("sendMessage", (message_txt) => {
            io.to(room).emit("Message", createMessage(username, message_txt));
    })

    socket.on("disconnect", () => {
        removeUser(socket.id);
        io.to(room).emit("roomData", {
            room: room,
            users: usersInRoom(room)
        })
    })
})
