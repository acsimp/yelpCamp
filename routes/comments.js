var express = require("express");
// with this we are swapping "app" for "router"
//mergeParams from campgrounds and comments so that inside comment route we can access :id
var router  = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");



//NEW COMMENT
//isLoggedIn function (created at the bottom) prevents user for creating a comment without loggin in
router.get("/new", middleware.isLoggedIn, function(req, res){
    //find campground by ID 
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {campground: campground});
        }
    });
});

// CREATE COMMENT
//isLoggedIn prevents comments from Postman for example without a login
router.post("/", middleware.isLoggedIn, function(req, res){
    //look up campground with id
   Campground.findById(req.params.id, function(err, campground){
       if(err){
           console.log(err);
           res.redirect("/campgrounds");
       }else{
           Comment.create(req.body.comment, function(err, comment){
               if(err){
                   req.flash("error", "Something went wrong");
                   console.log(err);
               }else{
                   //add username and id to comment
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   //save comment
                   comment.save();
                   campground.comments.push(comment._id);
                   campground.save();
                   req.flash("success", "Successfully added comment");
                   res.redirect("/campgrounds/" + campground._id);
               }
           });
       }
   });
});

// EDIT COMMENT
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground) {
            req.flash("error", "No campground found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.redirect("back");
            } else {
                //id is already available from app.js due to the prefix route files
                res.render("comments/edit", {campground_id: req.params.id, comment: foundComment, back: req.params.id});       
            } 
        });
    });
});

// UPDATE comment
// remember route is prefixed in app.js 
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});


// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/campgrounds/" + req.params.id);
    
        }
    });
    });



// =========
module.exports = router;