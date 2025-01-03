const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const artistMessageSchema = new Schema({
    label_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dashboarduser',
        required: false
    },
   artist_id:{
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
   },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const ArtistMessage = mongoose.model('ArtistMessage', artistMessageSchema);
module.exports = ArtistMessage;
