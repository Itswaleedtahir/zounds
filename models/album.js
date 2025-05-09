"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var albumSchema = new Schema({
    artist_id: [{
        type: Schema.Types.ObjectId,  // Referencing Artist model
        ref: 'Artist',
        required: true
    }],
    label_id: [{
        type: Schema.Types.ObjectId,  // Referencing Artist model
        ref: 'Dashboarduser',
        required: true
    }],
    songs_id:[{
        type: Schema.Types.ObjectId,  // Referencing Artist model
        ref: 'Song',
        required: true
    }],
    photos_id:[{
        type: Schema.Types.ObjectId,  // Referencing Artist model
        ref: 'Photo',
        required: true
    }],
    title: {
        type: String,
        required: true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    isFeatured: {
        type:Boolean,
        default:false
    },
    release_date: {
        type: Date,
        required: true
    },
    description:{
        type:String,
        default:""
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
