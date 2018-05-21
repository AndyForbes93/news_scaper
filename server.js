var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
const methodOverride = require("method-override");


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
  defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
  extended: true
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/scraperDB");

// Routes
// A GET route for scraping the thehockeynews website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.thehockeynews.com/section/news/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    $("li.story").each(function (i, element) {
      // Save an empty result object
      var result = {};
      result.image = $(element).find(".img-responsive").attr("src");
      result.title = $(element).find(".story-title").text();
      result.link = $(element).find("a").attr("href");
      console.log(result);

      db.Article.create(result).then(function (dbArticle) {
        // console.log(dbArticle);
      }).catch(function (err) {
        //  return res.json(err);
      });
    });
    // If we were able to successfully scrape and save an Article, redirect to dashboard
    res.redirect("/");
  });
});

//dashboard page that displays all scraped articles
app.get("/", function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      let foundArticle = [];
      dbArticle.forEach(article => {
        let viewArticle = {
          'title': article.title,
          'image': article.image.split("#")[1],
          'link': "http://www.thehockeynews.com/" + article.link,
          'id': article._id,
          'rated': article.rated
        }
        //console.log(foundArticle.rated);
        if (viewArticle.rated == false) {
          foundArticle.push(viewArticle);
        }
        // console.log(foundArticle);
      });
      // If we were able to successfully find Articles, render them on dashboard
      res.render("dashboard", {
        article: foundArticle
      });
    });
});
//displays articles with a rating
app.get("/rating", function (req, res) {
  db.Article.find({}).populate("rate")
    .then(function (dbArticle) {
      let foundArticle = [];
      dbArticle.forEach(article => {
        db.Rate.findOne({
          _id: article.rate
        }).then(function (dbRate) {

          let viewArticle = {
            'title': article.title,
            'image': article.image.split("#")[1],
            'rated': article.rated,
            'id': article._id,
            'body': dbRate.body,
            'rating': dbRate.rating,
            'name': dbRate.name
          }
          //console.log(foundArticle.rated);
          if (viewArticle.rated == true) {
            foundArticle.push(viewArticle);
          }
        });
        // console.log(foundArticle);
      });
      // If we were able to successfully find Articles, render them on ratin page
      res.render("ratingView", {
        article: foundArticle
      });
    });
});

// Route for saving/updating an Article's associated Rating
app.post("/rating/", function (req, res) {
  // Create a new note and pass the req.body to the entry
  let rating = {
    name: req.body.name,
    body: req.body.comment,
    rating: req.body.rating,
    id: req.body.id
  };
  console.log(rating);
  db.Rate.create(rating).then(function (dbRate) {
    return db.Article.findOneAndUpdate({
      _id: rating.id
    }, {
      rate: dbRate._id,
      rated: true
    }, {
      new: true
    });
  }).then(function (dbArticle) {
    if(dbArticle.rated == true){
      dbArticle.rated = false
    }
     res.redirect("/rating");
  });
});


app.post("/rating/:id", function (req, res) {
  let id = req.params.id;
  console.log(req.params.id);
  db.Article.findOneAndUpdate({
    _id: id
  }, {
    $set: {
      rated: false
    }
  }, {
    new: false
  }).then(function (dbArticle) {
    db.Rate.findOneAndRemove({
      _id: dbArticle.rate
    } , function (err,rate){
      res.redirect("/rating");
    });
  });
});


// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});