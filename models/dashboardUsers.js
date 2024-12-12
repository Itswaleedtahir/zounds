"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var user = new Schema({
    firstName: {
        type: String,
        default: null
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdBy:{
         type: Schema.Types.ObjectId, // Assuming references to Artist documents
        ref: 'Dashboarduser'
    },
    lastName: {
        type: String,
        default: null
    },
    otp: {
        type: Number,
        default: null
    },
    user_role: {
        type: Schema.Types.ObjectId, // Assuming references to Artist documents
        ref: 'Role'
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

module.exports = mongoose.model('Dashboarduser', user);
