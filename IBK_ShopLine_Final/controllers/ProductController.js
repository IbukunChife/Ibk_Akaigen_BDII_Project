const mongoose = require('mongoose');

const Product = mongoose.model('Product');
const neo4j = require('neo4j-driver').v1;
// config DataBase Neo4j
const dbs = require('../config/Neo4j').Neo4jURI;
const us = require('../config/Neo4j').User;
const ps = require('../config/Neo4j').Pass;
// Neo4j connection
const Neo4jdriver = neo4j.driver(dbs, neo4j.auth.basic(us, ps));
const Neo4jsession = Neo4jdriver.session();

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
        Neo4jsession.run('CREATE(n:Produto{title:{product_title}}) RETURN n.title', {
                product_id: product._id,
                product_title: product.title
            })
            .then(function(result) {
                console.log(result);
                Neo4jsession.close();
            })
            .catch(function(err) {
                console.log(err);
            });

        //return res.json(product);
        res.redirect('/');
    },

    async update(req, res) {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        // return res.json(product);
        res.redirect('/admin');
    },

    async destroy(req, res) {
        await Product.findByIdAndRemove(req.params.id);
        res.redirect('/admin');
    }
};