"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var actionSchema = new Schema({
    resource:{
        type: String,
    },
    action:{
        type:String,
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

module.exports = mongoose.model('Action', actionSchema);

