const express = require("express");
const app = express.Router();
const { authenticateGetJWT } = require("../middlewares/authentication");
const jwt = require('jsonwebtoken');

//set IP address based rate limiter
const rateLimit = require("express-rate-limit");
const apiLimiterUsingIP = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 100, // start blocking after 100 requests
    handler: function (req, res, next ) {
        Sentry.captureMessage("IP based rate limit for getToken", {
            level: "warning",
            tags: { ip: req.ip}
        });
        return res.status(200).json({ "error": "You have requested verification too many times in the last hour." });
    }
});


app.get('/getToken',
    apiLimiterUsingIP,
    authenticateGetJWT,
    (req, res) => {
        const token = jwt.sign({
            sub: req.user.email,
            aud: process.env.JWT_TOKEN_AUDIENCE},
            process.env.JWT_SECRET,
            {
                expiresIn: '720h'
            }
        )
        res.status(200).json({ token});
    }
);

module.exports = app;