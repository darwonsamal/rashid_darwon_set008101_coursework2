var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost/blogmachine');

var db = mongoose.connection;

// User Schema for USER
var UserSchema = mongoose.Schema
({
	username:
	{
		type: String,
		unique: true
	},
	password:
	{
		type: String
	},
	email:
	{
		type: String,
		required: true

	},
	name:
	{
		type: String
	},
	profileimage:
	{
		type: String
	}
});

// make user accesible to app
var User = module.exports = mongoose.model('User', UserSchema);

// USER METHODS

// return user by its object id
module.exports.getUserById = function(id, callback)
{
	User.findById(id, callback);
}

// return user by its username
module.exports.getUserByUsername = function(username, callback)
{

	User.findOne({username: username}, callback);
}

// check if typed password from log-in page for specific user is correct
module.exports.comparePassword = function(password, hash, callback)
{
	// use bcrypt to compare typed password to hashed passwrod
	bcrypt.compare(password, hash, function(err, isMatch)
	 {
		 // magic of callback
    	callback(null, isMatch);
	});
}

// method for creating a new user
module.exports.createUser = function(newUser, callback)
{
	// generate hashed password for new user
	bcrypt.genSalt(10, function(err, salt)
	{
			// hash newuser password
    	bcrypt.hash(newUser.password, salt, function(err, hash)
			{
				//assign it
   			newUser.password = hash;
				//save
   			newUser.save(callback);
    	});
	});
}

// method for updating user password. HAS NOT BEEN USED SO IGNORE THIS BUT IT ISNT FINISHED
// and I want to finish it after.

/*
module.exports.updateUserPassword = function(user, callback)
{
	bcrypt.genSalt(10, function(err , salt)
	{
		bcrypt.hash(user.password, salt, function(err, hash)
		{
			user.password = hash;

		});
	});
}
*/
