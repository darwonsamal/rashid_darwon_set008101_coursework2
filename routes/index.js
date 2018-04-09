var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('localhost/blogmachine');


// get home page once you are logged in.
router.get('/', ensureAuthenticated, function(req, res, next)
{

  var posts = db.get('posts');

	posts.find({}, {}, function(err, posts)
  {

  res.render('index', { posts: posts, title: "Home"});

  });
});

// check if req is authenticated
function ensureAuthenticated(req, res, next)
{

	if(req.isAuthenticated())
  {
		return next();
	}

	res.redirect('/users/login');

}

module.exports = router;
