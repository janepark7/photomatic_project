const express = require ("express");
const router = express.Router();
const User = require("../models/users.js");
const Photo = require("../models/photos.js");
const Comments = require("../models/comments.js");
const renderTemplate = require("../utility/renderTemplate.js");
const BodyParser = require("body-parser");
const multer = require("multer");
const requireLoggedIn = require("../middleware/requireLoggedIn");
const renderPhoto = require("../utility/renderPhoto.js");

const Sequelize = require("sequelize");

const uploader = multer({ dest: "uploads/" });
router.use(requireLoggedIn);

router.get("/gallery", function(req, res) {
	Photo.findAll({ order: [['createdAt', 'DESC']] }).then(function(photos) {
		renderTemplate(res, "gallery", "Gallery", {
			username: req.user.get("username"),
			photos: photos,
		});
	});
});

router.get("/preview/:photoId", function(req, res) {
	Photo.findById(req.params.photoId).then(function(photo) {
		renderTemplate(res, "preview", "Preview", {
			username: req.user.get("username"),
			photo: photo,
			description: req.body.description,

		});
	});
});

// upload photo
// Render an upload form that POSTs to /docs/upload
router.get("/upload", function(req, res) {
	// renderTemplate(req, res, "Upload a File", "upload");
	renderTemplate(res, "upload", "Upload", {
	});
});

// Upload the form at GET /upload
router.post("/upload", uploader.single("file"), function(req, res) {
// Make sure they sent a file
	if (!req.file) {
		return renderTemplate(res, "upload", "Upload", {
			error: "You must choose a file to upload",
		});
	}

	// Otherwise, try an upload
	req.user.upload(req.file, req).then(function(photo) {
		res.redirect("preview/" + photo.get("id"));
	})
	.catch(function(err) {
		console.error("Something went wrong with upload", err);
		renderTemplate(res, "upload", "Upload", {
			error: "Something went wrong, please try a different file",
		});
	});
});

router.get("/photo/:photoId", function(req, res) {
	renderPhoto(res, req.params.photoId);
});

router.post("/comment", function(req,res) {
	if (!req.body.photoId || !req.body.text) {
		return res.status(500).send("Missing required comment field");
	}
	Photo.findById(req.body.photoId).then(function(photo) {
		if (photo) {
			photo.createComment({
				text: req.body.text,
			})
			.then(function() {
				res.redirect("/photo/photo/" + photo.get("id"));
			});
		}
		else {
			res.render(res, "404");
		}
	});
});

router.get("/comment/:photoId", function(req, res) {
	Photo.findById(req.params.photoId).then(function(photo) {
	renderTemplate(res, "commentForm", "Comment", {
		photo: photo,
		});
	});
});




router.get("/download/:photoId", function(req, res) {
	Photo.findById(req.params.photoId).then(function(file) {
		if (file) {
			res.download("uploads/" + file.get("id"), file.get("originalName"));
		}
		else {
			res.status(404).send("No file found");
		}
	})
	.catch(function(err) {
		console.error(err);
		res.status(500).send("Something went wrong");
	});
});





module.exports = router;
