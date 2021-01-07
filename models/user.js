const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    banned: {
        type: Boolean,
        required: true
    }
});

var User = mongoose.model("User", UserSchema);

module.exports = User;