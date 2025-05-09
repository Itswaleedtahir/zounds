"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var playlistSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    songs: [{
        songId: {
            type: Schema.Types.ObjectId,
            ref: 'Song',
            required: true
        },
        albumId: {
            type: Schema.Types.ObjectId,
            ref: 'Album',
            required: true
        }
    }],
    title:{
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

module.exports = mongoose.model('playlist', playlistSchema);
