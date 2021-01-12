const supertest = require("supertest");

const app = require('../app');
const request = supertest(app);

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

/*
************* Test strategy for api endpoints of the chat back end *************
Test getToken
    partition on token: token valid, token not valid
    partition on username of token: username already in database, username not already in database

Test sendVerficationEmail
    partition on email: email is valid, email invalid
*/

//////////////////////////////////////////////////
//////////////////// getToken ////////////////////
//////////////////////////////////////////////////
describe('getToken endpoint tests', () => {
    beforeAll(async () => {
        await mongoose.connect(global.__MONGO_URI__, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }, (err) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
        });
    });

    afterAll(done => {
        // Closing mongoDB connection
        mongoose.connection.close()
        done()
    })

    // Cases:
    // token valid
    // user not already in database
    it('getToken with valid token', async () => {
        const testEmail = 'test1@test.com';
        const oldToken = jwt.sign({
            sub: testEmail,
            aud: process.env.JWT_TOKEN_AUDIENCE},
            process.env.JWT_SECRET,
            {
                expiresIn: '5m'
            }
        );
        const res = await request.get('/api/getToken')
        .set('Authorization', 'bearer ' + oldToken);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        const newToken = res.body.token;
        const decoded = jwt.verify(newToken, process.env.JWT_SECRET);
        expect(decoded.sub).toEqual(testEmail);
        
        // search for user in the database
        const user = await User.findOne({ email: testEmail });
        expect(user.email).toEqual(testEmail);
        expect(user.banned).toEqual(false);
    })

    // Cases:
    // token invalid
    it('getToken with invalid token', async () => {
        const testEmail = 'test2@test.com';
        const oldToken = "invalidToken";
        const res = await request.get('/api/getToken')
        .set('Authorization', 'bearer ' + oldToken);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('error');
        
        
        // user should not exist in database
        const user = await User.findOne({ email: testEmail });
        expect(user).not.toEqual(expect.anything());
    })

    // Cases:
    // user already in database
    it('getToken user in db', async () => {
        const testEmail = 'test3@test.com';
        // create a new account
        const newUser = new User({
            email: testEmail,
            banned: false
        });
        // save new account
        const savedUser = await newUser.save();
        expect(savedUser.email).toBe(testEmail);

        const oldToken = jwt.sign({
            sub: testEmail,
            aud: process.env.JWT_TOKEN_AUDIENCE},
            process.env.JWT_SECRET,
            {
                expiresIn: '10m'
            }
        );
        const res = await request.get('/api/getToken')
        .set('Authorization', 'bearer ' + oldToken);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        const newToken = res.body.token;
        const decoded = jwt.verify(newToken, process.env.JWT_SECRET);
        expect(decoded.sub).toEqual(testEmail);
        
        // search for user in the database
        const user = await User.findOne({ email: testEmail });
        expect(user.email).toEqual(testEmail);
        expect(user.banned).toEqual(false);
    })
})

///////////////////////////////////////////////////////////////
//////////////////// sendVerificationEmail ////////////////////
///////////////////////////////////////////////////////////////

// mock the recaptcha middleware
jest.mock('../middlewares/recaptcha', () => jest.fn((req, res, next) => {
    if (!req.body.token) {
        req.recaptchaVerified = false;
        next();
    } else if (req.body.token !== "validToken") {
        req.recaptchaVerified = false;
        next();
    } else {
        req.recaptchaVerified = true;
        next();
    }
}));

// mock nodemailer
const sendMailMock = jest.fn((mailOptions, cb) => {
    return cb();
})
jest.mock("nodemailer");

const nodemailer = require("nodemailer");
nodemailer.createTransport.mockReturnValue({sendMail: sendMailMock});

describe('sendVerficationEmail endpoint tests', () => {
    beforeEach( () => {
        sendMailMock.mockClear();
        nodemailer.createTransport.mockClear();
    });
    
    afterAll(done => {
        done()
    })

    // Cases:
    // email not valid
    it('sendVerificationEmail with invalid email', async () => {
        const testEmail = 'invalidEmail';

        const res = await request.post('/api/sendVerificationEmail')
        .send({
            email: testEmail,
            token: "validToken"
        })

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('error');

    })

    // Cases:
    // email valid
    it('sendVerificationEmail with valid email', async () => {
        const testEmail = 'test4@test.com';

        const res = await request.post('/api/sendVerificationEmail')
        .send({
            email: testEmail,
            token: "validToken"
        })

        expect(sendMailMock).toHaveBeenCalled();
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success');
    })

})