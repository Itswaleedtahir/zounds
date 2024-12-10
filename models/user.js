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
        type: Number,
        default: null
    },
    email: {
        type: String,
        required: true
    },
    image:{
        type: String
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: Number,
        default: null
    },
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
