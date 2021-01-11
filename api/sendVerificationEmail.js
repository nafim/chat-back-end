const express = require("express");
const app = express.Router();
const { body, validationResult } = require('express-validator');
const pug = require("pug");
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");
const jwt = require('jsonwebtoken');
const { validateRecaptcha } = require('../middlewares/recaptcha');

// set email based rate limiter
const rateLimit = require("express-rate-limit");
const apiLimiterUsingEmail = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minute window
    max: 5, // start blocking after 5 requests
    keyGenerator: function (req) {
        return req.body.email;
    },
    message:
    "Too many attempts for this email, please try again after half an hour",
    handler: function (req, res, ) {
        res.status(200).send(options.message);
    }
});


app.post('/sendVerificationEmail',
    apiLimiterUsingEmail,
    body('email').isEmail(),
    validateRecaptcha,
    (req, res, next) => {
        // recaptcha check
        if (!req.recaptchaVerified) {
            res.status(200).json({"error": 'Failed recaptcha check'})
        }

        const errors = validationResult(req);
        // valid email check
        if (errors.mapped().email) {
            res.status(200).json({"error": 'Invalid email'})
        } else {
            sendEmail(req.body.email, (err) => {
                if (err) {
                    return next(err);
                } else {
                    res.status(200).json({"success": 'Verification email has been sent'});
                }
            });
        }
    }
);

function sendEmail(email, cb) {
    const token = jwt.sign({
        sub: email,
        aud: process.env.JWT_TOKEN_AUDIENCE},
        process.env.JWT_SECRET,
        {
            expiresIn: '15m'
        }
    )
    
    const mailgunAuth = {
        auth: {
            api_key: process.env.MAILGUN_KEY,
            domain: process.env.EMAIL_DOMAIN
        }
    };
    const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));
    const verificationLink = `${process.env.LANDINGPAGE}/verify?token=${token}`;
    const html = pug.renderFile("views/verificationEmail.pug", {verificationLink});
    const mailOptions = {
        from: `admin@${process.env.EMAIL_DOMAIN}`,
        to: email,
        subject: "Zoom Chat Email Verification",
        html: html
    };
    smtpTransport.sendMail(mailOptions, function (error, response) {
        console.error(error);
        console.log(response);
        return cb(error);
    });
}


module.exports = app;