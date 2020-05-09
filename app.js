const https = require('https');
const http = require('http');
const express = require('express');
const bp = require('body-parser');
const ejs = require('ejs');
const _ = require('lodash');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption')

const app = express();

app.set('view engine', 'ejs');

app.use(bp.urlencoded({
    extended: true
}));
app.use(express.static('public'));

options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}
mongoose.connect("mongodb://localhost:27017/userDB", options);
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
const key="F!c@i#FdS#^c@P/^&*3n^U*&*&FcipFdScZP/3n!@#$^UFc*&^%$#ipFdScZP/3n^U";
userSchema.plugin(encrypt,{secret:key, encryptedFields:["password"]});
const User = new mongoose.model('user', userSchema);

app.get('/', (req, res) => {
    res.render('home');
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/login', (req, res) => {
    User.findOne({
        email: req.body.username
    }, (err, response) => {
        if (!err) {
            if (response) {
                if (response.password === req.body.password)
                    res.render("secrets");
                else
                    res.send("invalid password");
            } else res.send("not regis");
        } else
            res.send("err");
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});
app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save((err) => {
        if (!err)
            res.render("secrets");
        else
            res.send(err);
    })

});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running on allocated port.");
});