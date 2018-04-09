var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: './public/images' });
var mongo = require('mongodb');
var db = require('monk')('localhost/blogmachine');


router.get('/show/:id', function(req, res, next)
{
	var posts = db.get('posts');

	posts.find({'_id': db.id(req.params.id)}, {}, function(err, posts)
	{
		if(err)
		{
			throw err;
		}

		req.app.locals.postid = req.params.id;

		res.render('show',
		{
  			'posts': posts
  	});

	});
});

router.get('/add', function(req, res, next)
{
	var categories = db.get('categories');

	categories.find({},{},function(err, categories)
	{
		if(err)
		{
			throw err;
		}

		res.render('addpost',
		{
  			title: 'Add Post',
  			categories: categories
  	});
	});
});

router.get('/myposts', function(req, res, next)
{

	var posts = db.get('posts');

	posts.find({username: req.app.locals.username}, {}, function(err, posts)
	{
		if(err)
		{
			throw err;
		}

		res.render('myposts', { posts: posts, title: "My Posts" });

	});
});

router.get('/editpost/:id', function(req, res, next)
{

	var posts = db.get('posts');
	var categories = db.get('categories');

	categories.find({},{},function(err, categories)
	{
		if(err)
		{
			throw err;
		}

		posts.find({'_id': db.id(req.params.id)},{}, function(err, posts)
		{
			if(err)
			{
				throw err;
			}
			req.app.locals.mainimage = posts[0].mainimage;
			req.app.locals.postid = req.params.id;
			res.render('editpost',
			{
	  			'posts': posts,
					'categories': categories
	  	});
		});
	});

});

router.get('/deletepost/:id', function(req, res, next)
{
	var posts = db.get('posts');
	posts.remove({_id: db.id(req.params.id)});
	res.location('/posts/myposts');
	res.redirect('/posts/myposts');
});

router.post('/add', upload.single('mainimage'), function(req, res, next)
{
  // Get Form Values
  var title = req.body.title;
  var category= req.body.category;
  var body = req.body.body;
	var username = req.app.locals.username;
  var date = new Date();

  // Check Image Upload
  if(req.file)
	{
  	var mainimage = req.file.filename
  }
	else
	{
  	var mainimage = 'noimage.jpg';
  }

  	// Form Validation
	req.checkBody('title','Title field is required').notEmpty();
	req.checkBody('body', 'Body field is required').notEmpty();

	// Check Errors
	var errors = req.validationErrors();

	if(errors)
	{

		var categories = db.get('categories');

		categories.find({},{}, function(err, categories)
		{

			res.render('addpost',
			{
				errors: errors,
				categories: categories,
				user: req.app.locals.loggedInUser
			});

		});

	}

	else
	{
		var posts = db.get('posts');
		posts.insert(
	  {

			"title": title,
			"body": body,
			"category": category,
			"date": date,
			"mainimage": mainimage,
			"username" : username


		}, function(err, post)
		   {
			   	if(err)
				 	{
					 	res.send(err);
					}
					else
					{
						req.flash('success','Post Added');
						res.location('/');
						res.redirect('/');
					}
			 });
	}
});

router.post('/addcomment', function(req, res, next) {
	// Get Form Values

	//console.log(req.body.loggedInUser);
	//console.log(req.body.loggedInUser.username);
	var name = req.app.locals.username;
	var body = req.body.body;
	var commentdate = new Date();



	req.checkBody('body', 'Body field is required').notEmpty();

	// Check Errors
	var errors = req.validationErrors();

	if(errors)
	{
		console.log("error");
		var posts = db.get('posts');
		var categories = db.get('categories');
		categories.find({},{},function(err, categories)
		{
			if(err)
			{
				throw err;
			}

			posts.find({'_id': db.id(req.app.locals.postid)}, {},function(err, posts)
			{
				if(err)
				{
					throw err;
				}

				res.render('show',
				{
					  'errors': errors,
						'posts': posts,
						'categories': categories,
						'user': req.app.locals.loggedInUser
				});
			});
		});
	}
	else
	{
		var comment =
		{
			"name": name,
			"body": body,
			"commentdate": commentdate
		}

		var posts = db.get('posts');

		posts.update(
		{
			"_id": req.app.locals.postid
		},
		{
			$push:
			{
				"comments": comment
			}
		}, function(err, doc)
		   {
				 if(err)
				 {
					 throw err;
				 }
			 	else
				{

					req.flash('success', 'Comment Added');
					res.location('/posts/show/'+req.app.locals.postid);
					res.redirect('/posts/show/'+req.app.locals.postid);
					req.app.locals.postid = "";
				}
			});
	}
});



router.post('/editpost', upload.single('mainimage'), function(req, res, next)
{
  // Get Form Values
	var title = req.body.title;
  var body = req.body.body;
	var category = req.body.category;
  var postid = req.app.locals.postid;
	var mainimage;

  	// Form Validation
	req.checkBody('category','Name field is required').notEmpty();
	req.checkBody('body', 'Body field is required').notEmpty();
	req.checkBody('title', 'Title field is required').notEmpty();


	if(req.file)
	{
		mainimage = req.file.filename;
	}
	else
	{
		mainimage = req.app.locals.mainimage;
	}

	// Check Errors
	var errors = req.validationErrors();

	if(errors)
	{

		var posts = db.get('posts');
		var categories = db.get('categories');

		categories.find({},{},function(err, categories)
		{
			if(err)
			{
				throw err;
			}

			posts.find({'_id': db.id(req.app.locals.postid)}, {},function(err, posts)
			{
				if(err)
				{
					throw err;
				}

				res.render('editpost',
				{
						'posts': posts,
						'categories': categories,
						'user': req.app.locals.loggedInUser
				});
			});
		});
	}
  else
	{

		var posts = db.get('posts');

		posts.update(
		{
			"_id": postid
		},
		{
			$set:
			{
				"title" : title,
				"body" : body,
				"category" : category,
				"mainimage": mainimage
			}
		}, function(err, doc)
		{
			if(err)
			{
				throw err;
			}
			else
			{
				req.app.locals.postid = "";
				req.app.locals.mainimage = "";
				postid = "";
				req.flash('success', 'Post Edited');
				res.location('/posts/myposts/');
				res.redirect('/posts/myposts/');
			}
		});
	}
});




module.exports = router;
