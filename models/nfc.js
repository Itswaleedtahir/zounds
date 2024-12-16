"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var nfcSchema = new Schema({
    label_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dashboarduser',
        required: false
    },
    album_id: {
        type: Schema.Types.ObjectId,
        ref: 'Album',
        required: false
    },
   token:{
    type:String
   },
   code:{
    type:String
   },
   activationDate:{
    type:String
   },
   status:{
    type: String
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

module.exports = mongoose.model('NFC', nfcSchema);
