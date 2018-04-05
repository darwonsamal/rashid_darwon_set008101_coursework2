var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: './public/images'});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeauth');
var fs = require('fs');

var User = require('../models/user');

var loggedInUser;
var userID;

var users   = db.get('users');

/* GET users listing. */
router.get('/', function(req, res, next)
{
  res.send('respond with a resource');
});

router.get('/myprofile', function(req, res, next)
{
  res.render('myprofile', {users : loggedInUser});
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

          req.app.locals.profileimage = "";
          userID = "";
          console.log(req.app.locals.loggedInUser);
          req.flash('success', 'Your profile has been updated');
          res.render('myprofile',
          {
            users: req.app.locals.loggedInUser
          });
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


router.post('/updatepassword', function(req, res, next)
{
  var password = req.body.password;
  var confirmPassword = req.body.confirmpassword;
  console.log(password);
  // Form Validator

  req.checkBody('password', 'Password field is required').notEmpty();
  req.checkBody('confirmpassword','You need to confirm password').equals(req.body.password);

  // Check Errors
  var errors = req.validationErrors();
  console.log(errors);

  if(errors)
  {
    console.log(req.app.locals.loggedInUser);
    res.render('editpassword',
    {
  		errors: errors,
      users: req.app.locals.loggedInUser
  	});
  }
  else
  {
    /*

    users.find({'_id': db.id(userID)}, {}, function(err, users)
    {
      if(err)
      {
        throw err;
      }

      users[0].password = password;

    //  User.updateUserPassword(users[0], function(err, user)
      //{
      //  if(err) throw err;
    //  });

      console.log(users[0].password);
    });

*/
  }
});

router.post('/register', upload.single('profileimage') ,function(req, res, next) {
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
  req.checkBody('password2','Passwords do not match').equals(req.body.password);

  // Check Errors
  var errors = req.validationErrors();

  if(errors){
  	res.render('register', {
  		errors: errors
  	});
  } else{
  	var newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password,
      profileimage: profileimage
    });

    User.createUser(newUser, function(err, user){
      if(err) throw err;
    });

    req.flash('success', 'You are now registered and can login');

    res.location('/');
    res.redirect('/');
  }
});

router.get('/logout', function(req, res){
  req.logout();
  userID = "";

  req.flash('success', 'You are now logged out');
  res.redirect('/users/login');
});

module.exports = router;
