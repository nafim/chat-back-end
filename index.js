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

// redisClient.del('#general_history', function(err, reply) {
//     console.log(reply);
// });




const port = 4000;

const server = app.listen(port, () => {
    console.log(`chat server listening at http://localhost:${port}`);
});

// set up socket io connection
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    },
});

// const rooms = {}

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
            console.log(`added ${username} to set`)
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
    console.log(`${username} has connected`);
    addUser({ username, room })
    socket.join(room);
    socket.to(room).emit("Alert", `${username} has joined`);

    // get the history of the room once socket has joined
    redisClient.lrange(`${room}_history`, 0, -1, function(err, history) {
        if (err) {
            console.error(error);
        }
        // parse json
        parsedHistory = history.map((data) => JSON.parse(data))
        io.to(socket.id).emit("history", {history: parsedHistory});
        console.log(parsedHistory);
    })

    emitRoomData(room);

    socket.on("sendMessage", (message_txt) => {
            const new_message = createMessage(username, message_txt);
            socket.to(room).emit("Message", new_message);

            // add the message to the history of the room
            const room_history = `${room}_history`;
            redisClient.rpush(room_history, JSON.stringify(new_message), function(err, numMsgs) {
                if (numMsgs > process.env.NUM_MESSAGES_FETCHED) {
                    redisClient.lpop(room_history)
                }
            })
    })

    socket.on("disconnect", () => {
        console.log(`${username} has disconnected`)
        emitRoomData(room);
    })
})

function emitRoomData(roomName) {
    if (!roomName) throw Error(`Invalid room name: ${roomName}`)

    const room = io.sockets.adapter.rooms.get(roomName);
    if (!room) return;
    
    var numUsers = room.size;
    if (numUsers === undefined) throw Error('numUsers not defined.')
    console.log('numUsers', numUsers);
    io.to(roomName).emit("roomData", {
        roomName,
        numUsers
    })
}