const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const preferenceSchema = new Schema({
    name:{
        type:String,
        required:true
    }
}, { timestamps: true });

const preference = mongoose.model('preferenceContent', preferenceSchema);
module.exports = preference