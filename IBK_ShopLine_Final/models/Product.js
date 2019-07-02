const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Schema
const ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true,
        trim: true,
    },
    slug: {
        //ex: video game = video-game
        type: String,
        require: true,
        trim: true,
        index: true,
        unique: true,
    },
    description: {
        type: String,
        require: true,
    },
    price: {
        type: Number,
        require: true,
    },
    active: {
        type: Boolean,
        require: true,
        defaut: 1,
    },
    images: {
        type: String,
        require: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('Product', ProductSchema);