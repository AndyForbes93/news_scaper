var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new NoteSchema object
// This is similar to a Sequelize model
var RateSchema = new Schema({
    name: String,
    
    body: String,
    // `body` is of type String
    rating: Number
});

// This creates our model from the above schema, using mongoose's model method
var Rate = mongoose.model("Rate", RateSchema);

// Export the Note model
module.exports = Rate;