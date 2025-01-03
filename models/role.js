"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var actionSchema = new Schema({
    role:{
        type: String,
        enum: ['SUPER_ADMIN', 'LABEL', 'SUPER_ADMIN_STAFF', 'LABEL_STAFF', 'ARTIST'], // Allowed roles
        required:true
    },
    Permissions:[{
         type: Schema.Types.ObjectId, // Assuming references to Artist documents
        ref: 'Action'
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

module.exports = mongoose.model('Role', actionSchema);
