"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var genreeSchema = new Schema({
    name:{
        type: String,
    },
    picture:{
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

module.exports = mongoose.model('Genre', genreeSchema);

