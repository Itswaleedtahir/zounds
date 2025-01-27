"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var songSchema = new Schema({
    label_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dashboarduser',
        required: true
    },
    genre_id:{
        type: Schema.Types.ObjectId,
        ref: 'Genre',
        required: true
    },
    song_type: {
        type: String,
        enum: ['video', 'audio'],
        required: true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    likedBy:[{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [] 
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Song', songSchema);
