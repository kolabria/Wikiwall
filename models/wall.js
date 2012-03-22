//Walls
/*
  Paths []s
  Layers?
  Users - later stage
  UniqueURLs [] expires? - later Stage
  Owner - later stage
*/
var Mongoose = require("mongoose")
  , Schema = Mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Path = require('./path.js');

var wallSchema = new Schema({
	name: {type: String,trim:true}
  , paths : [{type:ObjectId, ref:'Path'}]
	//probably need to add objects
});
module.exports = Mongoose.model('Wall',wallSchema);