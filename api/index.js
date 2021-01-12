const express = require('express');
const app = express.Router();

// passport configuration
const passport = require('passport');
const User = require('../models/user');

// implement JWT strategy
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;
opts.audience = process.env.JWT_TOKEN_AUDIENCE;
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({email: jwt_payload.sub}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            // create a new account
            const user = new User({
                email: jwt_payload.sub,
                banned: false
            });
            // save new account
            user.save(function (err, user) {
                if (err) next(err);
                return done(null, user);
            });
        }
    });
}));

app.use(require('./sendVerificationEmail'));
app.use(require('./getToken'));

module.exports = app;