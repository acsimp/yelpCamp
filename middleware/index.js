var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");

// all middleware goes here
var middlewareObj = {};



middlewareObj.checkCampgroundOwnership = function(req, res, next) {
    // is user logged in? 
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                req.flash("error", "Campground not found");
                res.redirect("back");
            } else {
                //does user own the campground - remember foundCampground.author.id is a mongoose object whereas req.user._id is a string so they are not equal
                if(foundCampground.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};
middlewareObj.checkCommentOwnership = function(req, res, next) {
    // is user logged in? 
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                //does user own the comment - remember foundCampground.author.id is a mongoose object whereas req.user._id is a string so they are not equal
                if(foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkUserOwnership = function(req, res, next) {
    // is user logged in? 
    if(req.isAuthenticated()){
                if(req.params.id == req.user._id) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    //flash code
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

module.exports = middlewareObj;