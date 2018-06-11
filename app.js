var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride = require("method-override"),
    Campground      = require("./models/campground"),
    Comment         = require("./models/comment"),
    User            = require("./models/user"),
    // upperCaseFirst  = require('upper-case-first'),
    dotenv_var      = require('dotenv').config(),
    seedDB          = require("./seeds");

//requiring routes
var commentRoutes       = require("./routes/comments"),
    campgroundRoutes    = require("./routes/campgrounds"),
    indexRoutes         = require("./routes/index");

mongoose.connect("mongodb://localhost/yelp_camp_v12");
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
//seedDB(); //seed the database
app.use(flash());

//passport configuration
app.use(require("express-session")({
    secret: process.env.SECRET_KEY,
    //secret:"Once again Rusty winds cutes dog!",
    resave: false,
    saveUninitialized: false
}));
app.locals.moment = require('moment');
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware - pass currentUser to all templates. Anything in res.locals is available inside templates
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// use the route files that we have required with a prefix that will be added to all routes in that file.
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/", indexRoutes);

app.use(function(req, res, next) {
    res.status(404);
    res.render("404");
});

// caching disabled for every route
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

//====================================================
//tell express to listen for requests (start server)
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The YelpCamp Server has started!");
    console.log("process.env.GEOCODER_API_KEY is " + process.env.GEOCODER_API_KEY);
    console.log("process.env.SECRET_KEY is " + process.env.SECRET_KEY);
});

// AIzaSyD1oQHGmok51r3xDT10mXnrvZO6AxIHHt0 - google maps api key
// AIzaSyBVd0PHun0qqtsXz8q4BSBsha6w63F2lvM
// export GEOCODER_API_KEY=your-key-here