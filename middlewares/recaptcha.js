const axios = require("axios");
const FormData = require('form-data');

const validateRecaptcha = (req, res, next) => {
    // recaptcha check
    const bodyFormData = new FormData();
    bodyFormData.append('secret', process.env.RECAPTCHA_SECRET);
    bodyFormData.append('response', req.body['token']);
    axios.post("https://www.google.com/recaptcha/api/siteverify", bodyFormData, {
        headers: bodyFormData.getHeaders()
    })
    .then(res => {
        req.recaptchaVerified = res.data.success;
        next();
    })
    .catch(err => next(err));
};

module.exports = validateRecaptcha;