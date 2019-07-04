const mongoose = require('mongoose');

const User = mongoose.model('User');
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
        const users = await User.find();
        return res.json(users);
    },

    async show(req, res) {
        const user = await User.findById(req.params.id);
        return res.json(user);
    },

    async store(req, res) {
        const user = await User.create(req.body);
        user.save(function(err) {
            if (err) {
                //res.status(500)
                //.send("Error registering new user please try again.");
                return res.redirect('/register');
            } else {
                //res.status(200).json("Welcome to the IBK ShopLine!");
                Neo4jsession.run('CREATE(n:Cliente{email:{user_email}}) RETURN n.id', {
                        user_email: user.email
                    })
                    .then(function(result) {
                        console.log(result);
                        Neo4jsession.close();
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
                return res.redirect('/login');
            }
        });
    },

    async update(req, res) {
        // "new:true = retorna o produto já com os novos valores"
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        return res.json(user);
    },

    async destroy(req, res) {
        await User.findByIdAndRemove(req.params.id);
        // return res.json('Deleted');
        return res.redirect('/cliente');
    },

    async addCart(req, res) {
        const user = await User.findById(req.params.id);
        const product = req.params.product;
        const cart = user.cart;
        let count = 1;

        for (var i = 0; i < cart.length; i++) {
            if (cart[i].product === product) {
                count = cart[i].amout + 1;
            }
        }

        const cartChangeRemove = await User.findByIdAndUpdate(
            req.params.id, {
                $pull: {
                    cart: {
                        "product": product
                    }
                }
            }, {
                new: true
            }
        );

        const detalhesProduct = await Product.findById(req.params.product);

        const cartChangeAdd = await User.findByIdAndUpdate(
            req.params.id, {
                $addToSet: {
                    cart: {
                        "product": product,
                        "amout": count,
                        "title": detalhesProduct.title,
                        "price": detalhesProduct.price,
                        "images": detalhesProduct.images
                    }
                }
            }, {
                new: true
            }
        );

        //const newUser = await User.findById(req.params.id);
        return res.redirect('/cart');

    },

    async remCart(req, res) {
        const user = await User.findById(req.params.id);
        const product = req.params.product;
        const cart = user.cart;
        let count;

        for (var i = 0; i < cart.length; i++) {
            if (cart[i].product === product) {
                count = cart[i].amout - 1;
            }
        }

        const cartChangeRemove = await User.findByIdAndUpdate(
            req.params.id, {
                $pull: {
                    cart: {
                        "product": product
                    }
                }
            }, {
                new: true
            }
        );

        if (count > 0) {
            const detalhesProduct = await Product.findById(req.params.product);

            const cartChangeAdd = await User.findByIdAndUpdate(
                req.params.id, {
                    $addToSet: {
                        cart: {
                            "product": product,
                            "amout": count,
                            "title": detalhesProduct.title,
                            "price": detalhesProduct.price,
                            "images": detalhesProduct.images
                        }
                    }
                }, {
                    new: true
                }
            );
        }

        //const newUser = await User.findById(req.params.id);
        return res.redirect('/cart');
    },

    async finalizarCompra(req, res) {
        const user = await User.findById(req.params.id);
        const cart = user.cart;

        for (var i = 0; i < cart.length; i++) {

            const cartChangeAdd = await User.findByIdAndUpdate(
                req.params.id, {
                    $addToSet: {
                        bought: {
                            "product": cart[i].product
                        }
                    }
                }, {
                    new: true
                }
            );
            let cliente_email = user.email;
            let title_product = await Product.findById(cart[i].product);
            let title = title_product.title;

            await Neo4jsession.run('MATCH (n:Cliente{email:{cliente_email}}),(m:Produto{title:{title}}) MERGE (n)<-[b:BOUGHT]->(m) RETURN b', {
                    cliente_email: cliente_email,
                    title: title
                })
                .then(function(result) {
                    console.log(result);
                    Neo4jsession.close();
                })
                .catch(function(err) {
                    console.log(err);
                });

            const cartChangeRemove = await User.findByIdAndUpdate(
                req.params.id, {
                    $pull: {
                        cart: {
                            "product": cart[i].product
                        }
                    }
                }, {
                    new: true
                }
            );

        }

        //const newUser = await User.findById(req.params.id);
        return res.redirect('/cart');

    },
};