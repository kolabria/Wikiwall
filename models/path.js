//Paths
/*
PathIndex?
Stroke Color
Stroke Width
Stroke 
Segments []
  point
  handleIn
  handleOut

*/
var Mongoose = require('mongoose')
  , Schema = Mongoose.Schema;

 var pathSchema = new Schema({
 	color: String
 	, width: Number
 	, opacity: {type:Number,min:0,max:1,default:1}
 	, description: {} // schemaless type
 });

 module.exports = Mongoose.model('Path',pathSchema);