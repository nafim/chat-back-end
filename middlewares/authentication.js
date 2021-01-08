const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require("../models/user");


// socket middlewares
authenticateUniqueUsername = (socket, next) => {
    const { username, room } = socket.handshake.query;
    redisClient.sismember(`${room}_users`, username, function(err, alreadyExist) {
        if (err) {
            const err = new Error("Database error");
            err.data = { logOut: false };
            return next(err);
        }
        if (alreadyExist) {
            const err = new Error("This username is already in the room");
            err.data = { logOut: false };
            return next(err);
        }
        redisClient.sadd(`${room}_users`, username);
        return next();
    })
}

authenticateSocketJWT = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        const err = new Error("Authentication Error");
        err.data = { logOut: true };
        return next(err);
    }
    // verify token
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
        // err or decoded error
        if (err || !decoded) {
            const err = new Error("Authentication Error");
            err.data = { logOut: true };
            return next(err);
        }
        socket.request.email = decoded.sub;
        next();
    });
}

authenticateUser = (socket, next) => {
    User.findOne({email: socket.request.email}, function(err, user) {
        if (err) {
            const err = new Error("Authentication Error");
            err.data = { logOut: false };
            return next(err);
        }
        if (!user) {
            const err = new Error("User not found");
            err.data = { logOut: true };
            return next(err);
        }
        if (user.banned) {
            const err = new Error("User is banned");
            err.data = { logOut: true };
            return next(err);
        }
        socket.request.user = user;
        return next();
    });
}

// api middlewares
authenticateGetJWT = (req, res, next) => {
    passport.authenticate('jwt', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(200).json({"error": 'Invalid token'});
        req.user = user;
        return next();
    })(req, res, next);
}

module.exports = {authenticateSocketJWT, authenticateGetJWT, authenticateUser, authenticateUniqueUsername};