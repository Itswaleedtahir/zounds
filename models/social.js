"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var socialSchema = new Schema({
   artist_id:{
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
   },
   social:{
    type:String,
    required: true
   },
   socialLink:{
    type:String,
    required: true
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

module.exports = mongoose.model('social', socialSchema);
