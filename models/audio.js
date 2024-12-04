"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var audioSchema = new Schema({
    song_id: {
        type: Schema.Types.ObjectId,
        ref: 'Song',
        required: true
    },
    audio_quality: {
        type: String,
        enum: ['128kbps', '192kbps', '320kbps', 'lossless'],
        required: true
    },
    file_path: {
        type: String,
        required: true
    },
    bit_rate: {
        type: Number,
        required: true
    },
    file_size: {
        type: mongoose.Decimal128, // Using Decimal128 for precision in storing file size
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

module.exports = mongoose.model('Audio', audioSchema);
