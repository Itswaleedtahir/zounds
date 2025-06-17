var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    firstName: {
        type: String,
        default: null
    },
    lastName: {
        type: String,
        default: null
    },
    dob: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        default: null
    },
    zipCode: {
        type: String,
        default: null
    },
    email: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        default: null
    },
    profile_img: { type: String, default: null },
    isVerified: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        default: null
    },
    appleId: {
        type: String,
        default: null
    },
    preferencesSet: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('User', userSchema);
