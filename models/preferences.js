"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var preferenceSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    artistsSelected: [{
        type: Schema.Types.ObjectId, // Assuming references to Artist documents
        ref: 'Artist'
    }],
    genreSelected: [{
        type: Schema.Types.ObjectId, // Assuming references to Genre documents
        ref: 'Genre'
    }],
    artistContent: [{
        type: String, // Mixed type to allow storing an array of any type
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

module.exports = mongoose.model('Preference', preferenceSchema);
