const express = require("express");
const app = express.Router();
const { authenticateGetJWT } = require("../middlewares/authentication");
const jwt = require('jsonwebtoken');



app.get('/getToken',
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