var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var expressValidator = require('express-validator');
var multer = require('multer');
var upload = multer({dest: './public/images'});
var flash = require('connect-flash');
var bcrypt = require('bcryptjs');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var db = mongoose.connection;

var dbMonk = require('monk')('localhost/blogmachine');

var routes = require('./routes/index');
var users = require('./routes/users');
var posts = require('./routes/posts');
var categories = require('./routes/categories')


var usersCollection = dbMonk.get('users');
var app = express();

app.locals.moment = require('moment');

// method to not display full body for each post in the home and my posts pages.
app.locals.shortenText = function(text, length)
{
  var shortenText= text.substring(0, length);
  return shortenText;
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// set favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
// set json to be used
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Handle Sessions
app.use(session(
{
  secret:'secret',
  saveUninitialized: true,
  resave: true
}));

// Passport set up
app.use(passport.initialize());
app.use(passport.session());

// Express Validator set up
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  },
  // custom validator that always returns false
  customValidators: {
     myCustomFunc: function(value)
     {
       return false;
     }
  }
}));



// set up cookie parser
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// more middlware for express
app.use(flash());
app.use(function (req, res, next)
{
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// doesnt work 100% but saves user across the website
app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});


// use my routes
app.use('/', routes);
app.use('/users', users);
app.use('/posts', posts);
app.use('/categories', categories);




// EXPRESS STUFF

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
