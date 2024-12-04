"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var artistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: null
    },
    profile_picture: {
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
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Artist', artistSchema);
