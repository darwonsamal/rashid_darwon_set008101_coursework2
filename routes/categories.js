var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('localhost/blogmachine');


var categories = db.get('categories');


// GET METHODS



// shows posts that have that specific category
router.get('/show/:category', function(req, res, next)
{
	var posts = db.get('posts');

	posts.find({category: req.params.category},{},function(err, posts)
	{
		res.render('index',
		{
  			title : req.params.category,
  			posts: posts
  	});
	});
});

// renders the addcategory page
router.get('/add', function(req, res, next)
{
	res.render('addcategory',
	{
  		'title': 'Add Category'
	});
});

// POST METHODS


// responsible for adding a category
router.post('/add', function(req, res, next)
{
	categories.findOne({name : req.body.name}, function(err, categories)
	{
			// if category already exists throw error
			if(Boolean(categories))
			{

				req.checkBody('name').myCustomFunc(req.body.name).withMessage('Category already exists');
			}
		  // Get Form Values
		  var name = req.body.name;

		  	// Form Validation
			req.checkBody('name','Name field is required').notEmpty();

			// Check Errors
			var errors = req.validationErrors();

			if(errors)
			{
				res.render('addcategory',
				{
					"errors": errors,
					user: req.app.locals.loggedInUser
				});
			}
			else
			{
				var categoriesInsert = db.get('categories');
				// insert new category into the database
				categoriesInsert.insert(
				{
					"name": name,
				},
				function(err, post)
				{
					if(err)
					{
						res.send(err);
					}
					else
					{
						req.flash('success','Category Added');
						res.location('/');
						res.redirect('/');
					}
				});
			}
	});
	/*
  // Get Form Values
  var name = req.body.name;

  	// Form Validation
	req.checkBody('name','Name field is required').notEmpty();

	// Check Errors
	var errors = req.validationErrors();

	if(errors)
	{
		res.render('addcategory',
		{
			"errors": errors
		});
	}
	else
	{

		// insert new category into the database
		categories.insert(
		{
			"name": name,
		},
		function(err, post)
		{
			if(err)
			{
				res.send(err);
			}
			else
			{
				req.flash('success','Category Added');
				res.location('/');
				res.redirect('/');
			}
		});
	}
	*/
});

module.exports = router;
