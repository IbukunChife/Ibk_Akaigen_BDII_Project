const mongoose = require('mongoose');

const Product = mongoose.model('Product');

module.exports = {
    async index(req, res) {
        const productd = await Product.find();
        return res.json(productd);
    },

    async show(req, res) {
        const product = await Product.findById(req.params.id);
        return res.json(product);
    },

    async store(req, res) {
        const product = await Product.create(req.body);
        //return res.json(product);
        res.redirect('/');
    },

    async update(req, res) {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        // return res.json(product);
        res.redirect('/admin');
    },

    async destroy(req, res) {
        await Product.findByIdAndRemove(req.params.id);
        res.redirect('/admin');
    }
};