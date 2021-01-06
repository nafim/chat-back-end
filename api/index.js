const express = require('express');
const app = express.Router();


app.use(require('./getRoom'));

module.exports = app;