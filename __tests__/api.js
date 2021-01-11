const supertest = require("supertest");
const app = require('../app');
const request = supertest(app);

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

describe('getToken endpoint tests', () => {
    beforeAll(async () => {
        await mongoose.connect(global.__MONGO_URI__, { useNewUrlParser: true, useCreateIndex: true }, (err) => {
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

    it('getToken with valid token', async () => {
        const testEmail = 'test@test.com';
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
    })
})

