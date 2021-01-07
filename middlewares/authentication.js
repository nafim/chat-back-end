const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require("../models/user");

authenticateSocketJWT = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) next(new Error("Authentication Error"));
    // verify token
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
        // err or decoded error
        if (err || !decoded) next(new Error("Authentication Error"));
        socket.request.email = decoded.sub;
        next();
    });
}

authenticateUser = (socket, next) => {
    User.findOne({email: socket.request.email}, function(err, user) {
        if (err) {
            next(new Error("Authentication Error"));
        }
        if (!user) {
            next(new Error("User not found"));
        }
        if (user.banned) {
            next(new Error("User is banned"));
        }
        socket.request.user = user;
        next();
    });
}

authenticateGetJWT = (req, res, next) => {
    passport.authenticate('jwt', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({"error": 'Invalid token'});
        req.user = user;
        return next();
    })(req, res, next);
}

module.exports = {authenticateSocketJWT, authenticateGetJWT, authenticateUser};