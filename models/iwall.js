var Mongoose = require('mongoose')
  , Schema = Mongoose.Schema
  , ObjectId = Schema.ObjectId;

 var iwallSchema = new Schema({
    name: {type: String,trim:true}
  , company_id: ObjectId
  , defaultWall_ID: {type: ObjectId} 
  , shareURL: {type: String,trim:true}
  , user_id: ObjectId
  , PIN: String 
 });

iwallSchema
.virtual('id')
.get(function() {
  return this._id.toHexString();
});

 module.exports = Mongoose.model('Iwall',iwallSchema);