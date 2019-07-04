const express = require('express');
const routes = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Product = mongoose.model('Product');
const User = mongoose.model('User');

const neo4j = require('neo4j-driver').v1;
// config DataBase Neo4j
const dbs = require('../config/Neo4j').Neo4jURI;
const us = require('../config/Neo4j').User;
const ps = require('../config/Neo4j').Pass;
// Neo4j connection
const Neo4jdriver = neo4j.driver(dbs, neo4j.auth.basic(us, ps));
const Neo4jsession = Neo4jdriver.session();


//HOME
routes.get('/', (req, res) => {
    if (req.user) {
        // console.log(' userparam ' + req.user.email);
        var Title_arr = [];
        Neo4jsession
            .run('MATCH (n:Cliente{email:{user_email}})-[:BOUGHT]->(m:Produto),(x:Cliente),(y:Produto) WHERE(x:Cliente) -[:BOUGHT]-> (m:Produto) and (x)<>(n) and (x)-[:BOUGHT]-> (y) and(y) <> (m) RETURN y ', {
                user_email: req.user.email
            })
            .then(function(result) {
                result.records.forEach(function(record) {
                    Title_arr.push({
                        title: record._fields[0].properties.title
                    });
                });
                Neo4jsession.close();
                Product.find(function(err, prod) {
                    if (err) {
                        console.log(err);
                    } else {
                        const rcom_prod = [];
                        for (let i = 0; i < prod.length; i++) {
                            for (let j = 0; j < Title_arr.length; j++) {
                                if (Title_arr[j].title == prod[i].title) {
                                    rcom_prod.push(prod[i]);
                                }
                            }
                        }
                        // console.log('rcom' + rcom_prod);
                        res.render('pages/home', {
                            user: req.user,
                            products: prod,
                            recomendation: rcom_prod
                        });
                    }
                });
            })
            .catch(function(err) {
                console.log(err);
            });
        // console.log('title' + Title_arr);
    } else {
        Product.find(function(err, products) {
            if (err) {
                console.log(err);
            } else {
                res.render('pages/home', {
                    user: req.user,
                    products: products,
                    recomendation: {}
                });
            }
        });
    }
});

//CADASTRAR PRODUTO
routes.get('/produto/cadastrar',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        res.render('pages/cadastrarProduto', {
            user: req.user
        });
    });


//REMOVER PRODUTO
routes.get('/produto/remover',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        Product.find(function(err, products) {
            if (err) {
                console.log(err);
            } else {
                res.render('pages/removerProduto', {
                    user: req.user,
                    products: products
                });
            }
        })
    });

//ATUALIZAR PRODUTO
routes.get('/produto/atualizar/:id',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        Product.findById(req.params.id, function(err, product) {
            if (err) {
                console.log(err);
            } else {
                res.render('pages/AtualizarProduto', {
                    user: req.user,
                    product: product
                });
            }
        })
    });

// //CLIENTE para terminar
routes.get('/cliente',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        User.find(function(err, usuarios) {
            if (err) {
                console.log(err);
            } else {
                res.render('pages/cliente', {
                    user: req.user,
                    usuarios: usuarios
                });
            }
        });
    });

//REMOVER CLIENTE
routes.get('/cliente/remover',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        User.find(function(err, usuarios) {
            if (err) {
                console.log(err);
            } else {
                res.render('pages/removerClient', {
                    user: req.user,
                    usuarios: usuarios
                });
            }
        });
    });



//LOGIN
routes.get('/login', (req, res) => {
    res.render('pages/login', {
        user: req.user
    });
});

routes.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login'
    }),
    function(req, res) {
        let admin = req.user.isAdmin;
        if (admin) {
            res.redirect('/admin');
        } else {
            res.redirect('/');
        }
    });



//LOGOUT
routes.get('/logout', isLoggedIn, (req, res) => {
    req.logout();
    res.redirect('/');
});

//Cart
routes.get('/cart',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        let cart = req.user.cart;
        let total = 0;
        for (let i = 0; i < cart.length; i++) {
            total = total + (cart[i].price * cart[i].amout);
        }
        //res.json(total);
        res.render('pages/cart', {
            user: req.user,
            totalCart: total
        });
    });

//LISTA CARINHO
routes.get('/listCartUser/:id',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        User.findById(req.params.id, function(err, user_cart) {
            if (err) {
                console.log(err);
            } else {
                res.render('pages/ListCart', {
                    user: req.user,
                    user_cart: user_cart
                });
            }
        })
    });

// LISTAR PRODUCTO COMPRADOS
routes.get('/listBoughtUser/:id',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        User.findById(req.params.id, function(err, user_bought) {
            if (err) {
                console.log(err);
            } else {
                Product.find(function(err, product) {
                    if (err) {
                        console.log(err);
                    } else {
                        let buy = [];
                        for (let i = 0; i < product.length; i++) {
                            for (let j = 0; j < user_bought.bought.length; j++) {
                                if (user_bought.bought[j].product == product[i].id) {
                                    buy.push(product[i]);
                                }
                            }
                        }
                        console.log(product);
                        console.log(buy);
                        res.render('pages/ListBought', {
                            user: req.user,
                            user_bought: user_bought,
                            buy: buy
                        });
                    }
                });
            }
        });
    });

//REGISTER
//HOME
routes.get('/register', (req, res) => {
    res.render('pages/register', {
        user: req.user
    });
})

//PROFILE
routes.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        res.render('pages/profile', {
            user: req.user
        });
    });

//ADMIN
routes.get('/admin',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        Product.find(function(err, products) {
            if (err) {
                console.log(err);
            } else {
                res.render('pages/admin', {
                    user: req.user,
                    products: products
                });
            }
        }); // res.render('pages/admin', { user: req.user });
    }
);

routes.get('/produto/description', );


module.exports = routes;

//route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.status(400).json({
        'message': 'access denied'
    });
}