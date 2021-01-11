const supertest = require("supertest");
const app = require('../app');
const request = supertest(app);
const jwt = require('jsonwebtoken');
require('dotenv').config();


describe('getToken endpoint tests', () => {
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

