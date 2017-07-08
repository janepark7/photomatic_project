const sql = require("../utility/sql");
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const Photos = require("./photos");
const Comments = require("./comments");

function hashUserPassword(user) {
	if (user.password) {
	return bcrypt.genSalt()
		.then(function(salt) {
			console.log(salt);
			return bcrypt.hash(user.password, salt);
		}).then(function(hashedPW) {
			user.password = hashedPW;
		});
	}
}


const User = sql.define("user", {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	username: {
		type: Sequelize.STRING(100),
		notNull: true,
	},
	password: {
		type: Sequelize.STRING(1000),
		notNull: true,
	},
}, {
	hooks: {
		beforeCreate: hashUserPassword,
		beforeUpdate: hashUserPassword,
	},
});

User.hasMany(Photos);
User.hasMany(Comments);

User.signup = function(req) {
	return User.create({
		username : req.body.username,
		password : req.body.password,
	})
	.then(function(user) {
		req.session.userid = user.id;
		return user;
	});
};

User.login = function(req) {
	return User.findOne({
		where: {
			username: req.body.username,
		},
	})
	.then(function(user) {
		if (user) {
			return user.comparePassword(req.body.password).then(function(valid) {
					if (valid) {
						req.session.userid = user.get("id");
						return user;
					}
					else {
						throw new Error("Incorrect password");
					}
			});
		}
		else {
			throw new Error("Username not found. Have you signed up for an account?");
		}
	});
};


User.prototype.comparePassword = function(pw) {
	return bcrypt.compare(pw, this.get("password"));
};

module.exports = User;
