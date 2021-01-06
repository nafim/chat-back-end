const express = require("express");
const app = express.Router();

// set up redis client

const redis = require('redis');
redisClient = redis.createClient({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_ENDPOINT,
    auth_pass: process.env.REDIS_PASSWORD
});

history = [{
    user: "",
    message: "",
    timestamp: "",
}]

app.get('/getRoom',
    (req, res) => {
        const room = req.query.room;
        // get the history from redis client
        redisClient.lrange(`${room}_history`, 0, -1, function(err, history) {
            if (err) {
                return res.status(500).json({ error: "Something went wrong" });
            }
            res.status(200).json({ history });
        });
    }
)

module.exports = app;