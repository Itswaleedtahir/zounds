"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var newsSchema = new Schema({
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
    type:String
   },
   news:{
    type:String
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

module.exports = mongoose.model('News', newsSchema);
