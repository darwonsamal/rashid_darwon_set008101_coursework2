var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: './public/images'});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeauth');
var fs = require('fs');
var bcrypt = require('bcryptjs');
const _ = require("lodash");



var User = require('../models/user');

var loggedInUser;
var userID;

var checkUsername = false;
var checkEmail = false;

var users   = db.get('users');




function checkUsername()
{
  checkUsername = true;
}


function checkEmail()
{
  checkEmail = true;
}

/* GET users listing. */
router.get('/', function(req, res, next)
{
  res.send('respond with a resource');
});

router.get('/myprofile/:id', function(req, res, next)
{

  users.find({_id: db.id(req.params.id)}, {}, function(err, users)
  {
    if(err)
		{
			throw err;
		}
    req.app.locals.loggedInUser = users[0];

    res.render('myprofile', {users : req.app.locals.loggedInUser});
  });

});

router.get('/register', function(req, res, next)
{
  res.render('register',{title:'Register'});
});

router.get('/login', function(req, res, next)
{
  res.render('login', {title:'Login'});
});

router.get('/edituser/:id', function(req, res, next)
{

  users.find({'_id': db.id(req.params.id)}, {}, function(err, users)
  {
    if(err)
    {
      throw err;
    }

    req.app.locals.profileimage = users[0].profileimage;

    userID = users[0]._id;

    res.render('editprofile',
    {
      'users': users
    });
  });
});

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

router.get('/deleteuser/:id',  function(req, res, next)
{
  var posts = db.get('posts');
	posts.remove({username: loggedInUser.username});
  users.remove({_id: req.params.id});
  req.flash('success', 'Your profile has been deleted');
  res.location('/users/login');
  res.redirect('/users/login');
});


router.post('/edituser', upload.single('mainimage') , function(req, res, next)
{

  // Form Validator
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('email','Email field is required').notEmpty();
  req.checkBody('email','Email is not valid').isEmail();

  // Check Errors
  var errors = req.validationErrors();


  if(errors)
  {
  	res.render('editprofile',
    {
  		errors: errors,
      users: req.app.locals.loggedInUser
  	});
  }
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
      profileimage = req.app.locals.profileimage;
    }

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
          console.log(userID);
      }
    });

  }
});


router.post('/updatepassword',  upload.single('mainimage'), function(req, res, next)
{

    // Form Validator
    req.checkBody('password','Name field is required').notEmpty();
    req.checkBody('password','Password should at least have one uppercase character , one lower case character, one special character, one digit and must be between 8 and 20 characters long').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/);

    req.checkBody('confirmpassword','Email field is required').equals(req.body.password);


    // Check Errors
    var errors = req.validationErrors();


    if(errors)
    {
    	res.render('editpassword',
      {
    		errors: errors,
        users: req.app.locals.loggedInUser
    	});
    }
    else
    {
      var password = bcrypt.hashSync(req.body.password);

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
            console.log(password);
        }
      });

    }
});




router.post('/login', passport.authenticate('local',{failureRedirect:'/users/login', failureFlash: 'Invalid username or password'}),
function(req, res)
{
    var posts = db.get('posts');
    req.app.locals.username = req.body.username;
    req.app.locals.loggedInUser = loggedInUser;
    req.flash('success', 'You are now logged in');
    res.redirect('/');
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done){
  User.getUserByUsername(username, function(err, user){
    if(err) throw err;
    if(!user){
      return done(null, false, {message: 'Unknown User'});
    }

    User.comparePassword(password, user.password, function(err, isMatch){
      if(err) return done(err);
      if(isMatch){

        loggedInUser = user;
        return done(null, user);
      } else {
        return done(null, false, {message:'Invalid Password'});
      }
    });
  });
}));


router.post('/register', upload.single('profileimage') ,function(req, res, next)
{
  users.findOne({username: req.body.username}, function(err, users)
  {

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;


    if(req.file){
      console.log('Uploading File...');
      var profileimage = req.file.filename;
    } else {
      console.log('No File Uploaded...');
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


    req.checkBody('username').custom(value => {
      return new Promise((resolve, reject) => {
        users.findOne({username: req.body.username}, function(err, users)
        {

          console.log("entered");
          if(err)
          {
            reject(new Error('Error'));
          }
          if(users[0] != null)
          {
            console.log("username already exists");
            reject(new Error('Username Already Exists'));
          }
          resolve(true);
        });
      });
    });

    var errors = req.validationErrors();

    /*
    if(users[0] !== null)
    {
      console.log("username exists");
      req.checkBody('username').myCustomFunc(username).withMessage('Username is already taken');
    }
    */



    // Check Errors


    if(errors)
    {
      res.render('register',
      {
        errors: errors
      });
    }
    else
    {
      var newUser = new User({
        name: name,
        email: email,
        username: username,
        password: password,
        profileimage: profileimage
      });

      console.log(newUser);

      User.createUser(newUser, function(err, user){
        if(err) throw err;
      });

      req.flash('success', 'You are now registered and can login');

      res.location('/');
      res.redirect('/');
    }

  });

});

router.get('/logout', function(req, res){
  req.logout();
  userID = "";

  req.flash('success', 'You are now logged out');
  res.redirect('/users/login');
});

module.exports = router;
