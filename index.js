const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const {authenticateSocketJWT, authenticateUser} = require("./middlewares/authentication");
require('dotenv').config();

app.use(bodyParser.json());
app.use(cors());
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

// Connect to mongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true 
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("we're connected!");
});

// set up socket io connection
const port = 4000;
const server = app.listen(port, () => {
    console.log(`chat server listening at http://localhost:${port}`);
});
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    },
});

// use socketio middlewares
io.use(authenticateSocketJWT);
io.use(authenticateUser);

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
    socket.join(room);
    socket.to(room).emit("Alert", `${username} has joined`);

    // give the client room data
    emitRoomData(room);

    // get the history of the room once socket has joined
    redisClient.lrange(`${room}_history`, 0, -1, function(err, history) {
        if (err) {
            io.to(socket.id).emit("history", {history: parsedHistory, error: true});;
        }
        // parse json
        parsedHistory = history.map((data) => JSON.parse(data))
        io.to(socket.id).emit("history", {history: parsedHistory, error: false});
        console.log(parsedHistory);
    })

    socket.on("sendMessage", (message_txt) => {
            const new_message = createMessage(username, message_txt);
            socket.to(room).emit("Message", new_message);

            // add the message to the history of the room
            const room_history = `${room}_history`;
            redisClient.rpush(room_history, JSON.stringify(new_message), function(err, numMsgs) {
                if (numMsgs > process.env.NUM_MESSAGES_SAVED) {
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
    if (numUsers === undefined) throw Error('numUsers not defined.');
    console.log('numUsers', numUsers);
    io.to(roomName).emit("roomData", {
        roomName,
        numUsers
    })
}