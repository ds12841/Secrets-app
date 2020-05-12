require('dotenv').config();
const express = require('express');
const bp = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate=require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(bp.urlencoded({
    extended: true
}));
app.use(express.static('public'));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

mongoose.connect("mongodb://localhost:27017/userDB", options);
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: [String],
    mobile: Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)

const User = new mongoose.model('user', userSchema);

passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
    res.render('home');
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));
  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/login', (req, res) => {
    const user =new User({
        username:req.body.username,
        passport:req.body.password
    });
    req.logIn(user,(err)=>{
        if(!err)
            {
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");    
         });
            }        
        else
            console.log(err)

    });
});

app.get('/register', (req, res) => {
    res.render('register');
});
app.post('/register', (req, res) => {
    User.register({username:req.body.username,mobile:req.body.mobile},req.body.password,(err,user)=>{
        if(!err)
            {
            passport.authenticate("local")(req,res,function(){
                       res.redirect("/secrets");    
            });
            
        }
        else{
            console.log(err);
            res.redirect("/register");
        }
    });
});
app.get("/secrets",(req,res)=>{
    let x=[],obj=null;
    if(req.isAuthenticated())
    {
        User.find({secret:{$ne:null}},(err,founds)=>{
            if(!err)
            {
                if(founds)
                {
                    founds.forEach((data)=>{
                        for(let i=0;i<data.secret.length;i++){
                            x.push(data.secret[i]);
                        }
                    });
                    res.render("secrets",{data:x});
                }
            }
            else console.log(err);
        });
    }
    else
        res.redirect("/login");
    
});
app.get("/logout",(req,res)=>{
    req.logOut();
    res.redirect("/");
});
app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else
        res.redirect("/login");
});
app.post("/submit",(req,res)=>{
    const submittedSecret=req.body.secret;
    User.findById(req.user._id,(err,response)=>{
        if(!err){
            response.secret.push(submittedSecret);
            response.save((err)=>{
                if(!err)
                    res.redirect("/secrets");
                else
                    console.log(err);
            });
        }
        else console.log(err);
    });
});

app.listen(process.env.PORT, () => {
    console.log("Server is running on allocated port.");
});