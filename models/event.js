"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var eventSchema = new Schema({
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
   isActive:{
    type: Boolean,
    default: false
   },
   title:{
    type:String,
    required: true
   },
   venue:{
    type:String,
    required: true
   },
   date:{
    type:String,
    required: true
   },
   time:{
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
   image:{
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

module.exports = mongoose.model('Events', eventSchema);
