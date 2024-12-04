"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var songSchema = new Schema({
    album_id: {
        type: Schema.Types.ObjectId,
        ref: 'Album',
        required: true
    },
    genre_id:{
        type: Schema.Types.ObjectId,
        ref: 'Album',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    duration: {
        type: String, // Mongoose doesn't have a TIME type, so you should use String if you keep it in 'HH:mm:ss' format, or Number for seconds.
        required: true
    },
    song_type: {
        type: String,
        enum: ['video', 'audio'],
        required: true
    },
    file_path: {
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

module.exports = mongoose.model('Song', songSchema);
