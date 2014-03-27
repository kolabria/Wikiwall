//temporary links
/*
  link - url extention for link
  creation time 
*/
var Mongoose = require("mongoose")
  , Schema = Mongoose.Schema
  , ObjectId = Schema.ObjectId


var TempLinksSchema = new Schema({
	link: {type: String,trim:true}
  , creation: Date
  , userId: ObjectId  
});


TempLinksSchema
.virtual('id')
.get(function() {
  return this._id.toHexString();
});


module.exports = Mongoose.model('TempLinks',TempLinksSchema);