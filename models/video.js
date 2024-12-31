"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var videoSchema = new Schema({
    song_id: {
        type: Schema.Types.ObjectId,
        ref: 'Song',
        required: true
    },
    lyricsFile:{
        type:String,
    },
    title: {
        type: String,
        required: true
    },
    duration: {
        type: String,  // Time stored as a string, e.g., 'HH:mm:ss'
        required: true
    },
    file_path: {
        type: String,
        required: true
    },
    resolution: {
        type: String,
        required: true
    },
    video_format: {
        type: String,
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

module.exports = mongoose.model('Video', videoSchema);
