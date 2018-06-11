var express = require("express");
// with this we are swapping "app" for "router"
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var dotenv_var      = require('dotenv').config();

 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


//INDEX - show all campgrounds
router.get("/", function(req, res){
    var perPage = 6;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    //fuzzy search
    var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        Campground.find({ $or: [ {name: regex}, {description: regex}, { price: regex }, {"author.username": regex } ]}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allCampgrounds){
            Campground.count({name: regex}).exec(function (err, count) {
        
        if(err){
            console.log(err);
            res.redirect("back");

        } else {
            if(allCampgrounds.length < 1){
                noMatch = "No campgrounds match that query, please try again.";
            } 
          res.render("campgrounds/index",{
              campgrounds:allCampgrounds, 
              currentUser: req.user, 
              noMatch: noMatch,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
          });
        }
    });
});

    } else{
    //get all campgrounds from the db
    Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allCampgrounds){
        Campground.count().exec(function (err, count) {
        if(err){
            console.log(err);
        } else {
          res.render("campgrounds/index",{
              campgrounds:allCampgrounds,
              currentUser: req.user,
              noMatch: noMatch,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false
                    });
                }
            });
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    console.log("process.env.GEOCODER_API_KEY is " + process.env.GEOCODER_API_KEY);
    //get data from form and add to array
    var name  = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc  = req.body.description;
    //create new object
    var author = {
        id: req.user._id,
        username:req.user.username
    };
    
    geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    
    
    var newCampground = {name: name, image: image, description: desc, author: author, price: price, location: location, lat: lat, lng: lng};
    //create a new campground and save to database
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
                //redirect back to campgrounds
                //  res.redirect("/campgrounds/");
            //render show template with that campground
            res.render("campgrounds/show", {campground: newlyCreated});
        }
    });
});
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID and populate with comment content not just id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground) {
            req.flash("error", "No campground found");
            return res.redirect("back");
        } else {
        res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});

// UPDATE campground route
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, location: location, lat: lat, lng: lng, price: req.body.price};
    //find and update campground
    Campground.findByIdAndUpdate(req.params.id, newData, function(err, campground){        
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
        //redirect to show page
        req.flash("success","Successfully Updated!");
        res.redirect("/campgrounds/" + req.params.id);
        }
    });
});
});

// DESTROY Campground Route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});

// part of fuzzy search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//exporting "router"
module.exports = router;