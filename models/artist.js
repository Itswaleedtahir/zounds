"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var artistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: null
    },
    userId: {
        type: Schema.Types.ObjectId, // Assuming references to Artist documents
        ref: 'Dashboarduser'
    },
    profile_picture: {
        type: String,
        default: ""
    },
    label_id:{
         type: Schema.Types.ObjectId, // Assuming references to Artist documents
        ref: 'Dashboarduser'
    },
    isDeleted:{
        type:Boolean,
        default:false
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

module.exports = mongoose.model('Artist', artistSchema);
