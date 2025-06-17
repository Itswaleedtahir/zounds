"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var audioSchema = new Schema({
    song_id: {
        type: Schema.Types.ObjectId,
        ref: 'Song',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    audio_quality: {
        type: String,
        // enum: ['128kbps', '256kbps', '312kbps', 'lossless'],
        required: false
    },
    lyricsFile:{
        type:String,
    },
    file_path: {
        type: String,
        required: true
    },
    bit_rate: {
        type: Number,
        required: false
    },
    file_size: {
        type: mongoose.Decimal128, // Using Decimal128 for precision in storing file size
        required: false
    },
    duration: {
        type: String, // Mongoose doesn't have a TIME type, so you should use String if you keep it in 'HH:mm:ss' format, or Number for seconds.
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

module.exports = mongoose.model('Audio', audioSchema);
