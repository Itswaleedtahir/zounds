"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var albumSchema = new Schema({
    artist_id: [{
        type: Schema.Types.ObjectId,  // Referencing Artist model
        ref: 'Artist',
        required: true
    }],
    songs_id:[{
        type: Schema.Types.ObjectId,  // Referencing Artist model
        ref: 'Song',
        required: true
    }],
    title: {
        type: String,
        required: true
    },
    release_date: {
        type: Date,
        required: true
    },
    cover_image: {
        type: String,
        default: null
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

module.exports = mongoose.model('Album', albumSchema);
