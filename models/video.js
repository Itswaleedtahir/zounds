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
        type: String, 
        required: true
    },
    file_path: {
        type: String,
        required: true
    },
    thumbnail:{
        type:String,
        default:""
    },
    resolution: {
        type: String,
        required: false
    },
    video_format: {
        type: String,
        required: false
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
