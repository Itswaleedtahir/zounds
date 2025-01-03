"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var likeSongSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    song_id: {
        type: Schema.Types.ObjectId, // Assuming references to Genre documents
        ref: 'Song'
    },
    album_id:{
         type: Schema.Types.ObjectId, // Assuming references to Genre documents
        ref: 'Album'
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

module.exports = mongoose.model('likeSong', likeSongSchema);
