var Mongoose = require('mongoose')
  , Schema = Mongoose.Schema
  , ObjectId = Schema.ObjectId;

var ShareWall = new Schema({
    boxID     : String
  , boxName   : String
});

 var boxSchema = new Schema({
    id: {type: String ,index: { unique: true } } 
  , name: {type: String,trim:true}
  , company_id: ObjectId
  , defaultWall_ID: {type: ObjectId}   // , default: '4f47be322f8b522d303f1fef'
  , PIN: String
  , shareList: [ShareWall]
 });

boxSchema
.virtual('oid')
.get(function() {
  return this._id.toHexString();
});

 module.exports = Mongoose.model('Box',boxSchema);