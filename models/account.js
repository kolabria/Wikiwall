//Accounts
/*
  Account/company name
  admin user id
  acct type  0-  free, paid, beta, trial  
  Assigment URL
  user limit
  creation date
*/
var Mongoose = require("mongoose")
  , Schema = Mongoose.Schema
  , ObjectId = Schema.ObjectId


var AccountSchema = new Schema({
	acctName: {type: String,trim:true}
  , adminUserId: ObjectId
  , acctType: Number
  , acctUserLimit: Number
  , shareURL: {type: String,trim:true}
  , createdOn: Date    
});


AccountSchema
.virtual('id')
.get(function() {
  return this._id.toHexString();
});


module.exports = Mongoose.model('Account',AccountSchema);