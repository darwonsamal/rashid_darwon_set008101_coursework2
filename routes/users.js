var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: './public/images'});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var db = require('monk')('localhost/blogmachine');
var fs = require('fs');
var bcrypt = require('bcryptjs');
const _ = require("lodash");

var User = require('../models/user');

var loggedInUser;
var userID;

var users   = db.get('users');


// GET METHOD

// get users
router.get('/', function(req, res, next)
{
  res.send('respond with a resource');
});

// responsible for rendering my profile page
router.get('/myprofile/:id', function(req, res, next)
{

  users.find({_id: db.id(req.app.locals.loggedInUser._id)}, {}, function(err, users)
  {

    if(err)
		{
			throw err;
		}

    req.app.locals.loggedInUser = users[0];

    res.render('myprofile', {users : req.app.locals.loggedInUser, title: 'My Profile'});
  });
});

// responsible for rendering the register page
router.get('/register', function(req, res, next)
{
  res.render('register',{title:'Register'});
});

// responsible for rendering login page
router.get('/login', function(req, res, next)
{
  res.render('login', {title:'Login'});
});

// responsible for rendering the edit page
router.get('/edituser/:id', function(req, res, next)
{

  // FIND user just in case.
  users.find({'_id': db.id(req.params.id)}, {}, function(err, users)
  {
    if(err)
    {
      throw err;
    }

    req.app.locals.profileimage = users[0].profileimage;

    userID = users[0]._id;
    req.app.locals.loggedInUser = users[0];

    res.render('editprofile',
    {
      'user': users
    });
  });
});

// responsible for rendering editpassword page
router.get('/updatepassword/:id', function(req, res, next)
{

  users.find({'_id': db.id(req.params.id)}, {}, function(err, users)
  {
    if(err)
    {
      throw err;
    }


    userID = req.params.id;

    res.render('editpassword',
    {
      'users': users
    });
  });
});

// responsible for deleting users profile and its posts
router.get('/deleteuser/:id',  function(req, res, next)
{
  var posts = db.get('posts');
  //remove all posts
	posts.remove({username: loggedInUser.username});
  //remove user
  users.remove({_id: req.params.id});

  // logout
  req.logout();
  req.flash('success', 'Your profile has been deleted');
  res.location('/users/login');
  res.redirect('/users/login');
});


// responsible for logging user out of website
router.get('/logout', function(req, res)
{
  req.logout();
  userID = "";

  req.flash('success', 'You are now logged out');
  res.redirect('/users/login');
});

// POST METHODS

//responsible for updating users profile
router.post('/edituser', upload.single('mainimage') , function(req, res, next)
{

  // Form Validator
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('email','Email field is required').notEmpty();
  req.checkBody('email','Email is not valid').isEmail();

  // Check Errors
  var errors = req.validationErrors();

  // if error render page again with errors
  if(errors)
  {

  	res.render('editprofile',
    {
  		errors: errors,
      user: req.app.locals.loggedInUser
  	});
  }
  //success update profile
  else
  {
    var name = req.body.name;
    var email = req.body.email;

    var profileimage;

    if(req.file)
    {
      profileimage = req.file.filename;

    }
    else
    {
      // if user wants original photo
      profileimage = req.app.locals.profileimage;
    }

    //update user
    users.update(
    {
      "_id": userID
    },
    {
      $set:
      {
        "name": name,
        "email": email,
        "profileimage": profileimage
      }
    }, function(err, doc)
    {
      if(err)
      {
        throw err;
      }
      else
      {

          req.flash('success', 'Your profile has been updated');
          res.location('/users/myprofile/' + userID);
          res.redirect('/users/myprofile/' + userID);

          req.app.locals.profileimage = "";
          userID = "";

      }
    });

  }
});

// responsible for updating password
router.post('/updatepassword',  upload.single('mainimage'), function(req, res, next)
{

    // Form Validator
    req.checkBody('password','Name field is required').notEmpty();
    req.checkBody('password','Password should at least have one uppercase character , one lower case character, one special character, one digit and must be between 8 and 20 characters long').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/);

    req.checkBody('confirmpassword','Email field is required').equals(req.body.password);


    // Check Errors
    var errors = req.validationErrors();

    // if error, render page again with errors
    if(errors)
    {
    	res.render('editpassword',
      {
    		errors: errors,
        user: req.app.locals.loggedInUser
    	});
    }
    else
    {
      // hash new password so its secure
      var password = bcrypt.hashSync(req.body.password);

      // update user
      users.update(
      {
        "_id": userID
      },
      {
        $set:
        {
          "password": password

        }
      }, function(err, doc)
      {
        if(err)
        {
          throw err;
        }
        else
        {


            req.flash('success', 'Your password has been updated');
            res.location('/users/myprofile/' + userID);
            res.redirect('/users/myprofile/' + userID);

            userID = "";

        }
      });

    }
});



// responsible for logging in. Uses passport to authenticate log-in
router.post('/login', passport.authenticate('local',{failureRedirect:'/users/login', failureFlash: 'Invalid username or password'}),
function(req, res)
{
    var posts = db.get('posts');
    req.app.locals.username = req.body.username;
    req.app.locals.loggedInUser = loggedInUser;

    req.flash('success', 'You are now logged in');
    res.redirect('/');
});

// SETTING UP PASSPORT TO BE USED FOR USER LOG-IN AUTHENTICATION

// serialze user
passport.serializeUser(function(user, done)
{
  done(null, user.id);
});

// deserializ user
passport.deserializeUser(function(id, done)
{
  // get user
  User.getUserById(id, function(err, user)
  {
    done(err, user);
  });
});

// SET UP LOCAL STRATEGY
passport.use(new LocalStrategy(function(username, password, done)
{
  // get user by its username
  User.getUserByUsername(username, function(err, user)
  {
    if(err)
    {
      throw err;
    }

    // if no exists be like
    if(!user)
    {
      return done(null, false, {message: 'User is unknown'});
    }

    // check if password is correct
    User.comparePassword(password, user.password, function(err, isMatch)
    {
      if(err)
      {
        return done(err);
      }

      // if passwords match return user and authenticate
      if(isMatch)
      {

        loggedInUser = user;
        return done(null, user);
      }
      else
      {
        return done(null, false, {message:'Invalid Password'});
      }
    });
  });
}));

// responsible for creating a new user profile
router.post('/register', upload.single('profileimage') ,function(req, res, next)
{
  // check to see if username already exists
  users.findOne({username: req.body.username}, function(err, users)
  {

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;


    if(req.file)
    {

      var profileimage = req.file.filename;
    }
    else
    {

      var profileimage = 'noimage.jpg';
    }

    // Form Validator
    req.checkBody('name','Name field is required').notEmpty();
    req.checkBody('email','Email field is required').notEmpty();
    req.checkBody('email','Email is not valid').isEmail();
    req.checkBody('username','Username field is required').notEmpty();
    req.checkBody('password','Password field is required').notEmpty();
    req.checkBody('password','Password should at least have one uppercase character , one lower case character, one special character, one digit and must be between 8 and 20 characters long').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/);
    req.checkBody('confirmpassword','Passwords do not match').equals(req.body.password);


    // check to see if username exists
    if(Boolean(users))
    {
      // if so, raise an error
      req.checkBody('username').myCustomFunc(username).withMessage('Username is already taken');
    }

    // Check Errors

    var errors = req.validationErrors();

    // if error, render screen again with errors
    if(errors)
    {
      res.render('register',
      {
        errors: errors
      });
    }
    // SUCCESS
    else
    {
      // make new user
      var newUser = new User({
        name: name,
        email: email,
        username: username,
        password: password,
        profileimage: profileimage
      });


      // add user
      User.createUser(newUser, function(err, user){
        if(err) throw err;
      });

      req.flash('success', 'You are now registered and can login');

      res.location('/');
      res.redirect('/');
    }

  });

});


module.exports = router;
