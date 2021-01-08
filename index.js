const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const {authenticateSocketJWT, authenticateUser, authenticateUniqueUsername} = require("./middlewares/authentication");
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
    global.console.log("connected to redis");
});

// clear out remaining usernames in all rooms
redisClient.keys("*_users", function(err, keys) {
    keys.forEach(key => redisClient.del(key));
})

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
io.use(authenticateUniqueUsername);
io.use(authenticateSocketJWT);
io.use(authenticateUser);

// import chat functions
const chat = require('./chat');
chat(io);