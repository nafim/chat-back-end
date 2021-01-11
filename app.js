const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// set app to trust proxy
app.set('trust proxy', 1);

app.use(bodyParser.json());
app.use(cors());
app.use("/api", require('./api'));

// error handler for api calls
const notFoundHandler = (req, res, next) => {
    return res.status(404).json({error: "Endpoint not found"});
};

const errorHandler = (err, req, res, next) => {
    return res.status(500).json({error: "Something went wrong, please try again"});
};

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;