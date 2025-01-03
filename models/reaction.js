const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reactionSchema = new Schema({
    message_id: {
        type: Schema.Types.ObjectId,
        ref: 'ArtistMessage',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    emoji: {
        type: String, // Unicode representation of the emoji
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Reaction = mongoose.model('Reaction', reactionSchema);
module.exports = Reaction;
