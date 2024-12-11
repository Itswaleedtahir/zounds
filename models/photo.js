"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var photoSchema = new Schema({
    label_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dashboarduser',
        required: true
    },
   img_url:{
    type:String
   },
   title:{
    type:String
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

module.exports = mongoose.model('Photo', photoSchema);
