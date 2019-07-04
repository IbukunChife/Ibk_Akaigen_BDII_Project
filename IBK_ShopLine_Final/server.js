const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const requireDir = require('require-dir');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');


var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
var User = require('./models/User');

// Configure the local strategy for use by Passport.
passport.use(
    new LocalStrategy({
        usernameField: 'email'
    }, (email, password, done) => {
        // Match user
        User.findOne({
            email: email
        }).then(user => {
            if (!user) {
                return done(null, false, {
                    message: 'That email is not registered'
                });
            }

            // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Password incorrect'
                    });
                }
            });
        });
    })
);
// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

//Iniciando o App
const app = express();
//Config
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

//Middleware static files
app.use(express.static(path.join(__dirname, '/public')));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//Iniciando e Testando o DB
// const mongo_uri = 'mongodb://localhost:27017/didier';
const mongo_uri = 'mongodb+srv://ibukun_23:a.361051@ibkshop-0f1fs.mongodb.net/test?retryWrites=true';

mongoose.connect(mongo_uri, {
    useNewUrlParser: true
}, function(err) {
    if (err) {
        throw err;
    } else {
        console.log(`Successfully connected to ${mongo_uri}`);
    }
});

requireDir('./models');

//"use" aceita todos os tipos de requisição
app.use('/api', require("./routes"));
app.use('/', require("./views/routes"));


const PORT = "4000";
app.listen(PORT, () => {
    console.log('Running Server on Port ' + PORT);
});