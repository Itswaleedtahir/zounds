"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var shopSchema = new Schema({
    label_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dashboarduser',
        required: false
    },
   artist_id:{
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
   },
   title:{
    type:String,
    required: true
   },
   shopLink:{
    type:String,
    required: true
   },
   description:{
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

module.exports = mongoose.model('Shop', shopSchema);

