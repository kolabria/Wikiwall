//User
/*
  Name
  email
  password
  
*/
var Mongoose = require("mongoose")
  , Schema = Mongoose.Schema
  , ObjectId = Schema.ObjectId

var crypto = require('crypto');

var SharedWall = new Schema({
    wallID     : String
  , wallName   : String
});

function validatePresenceOf(value) {
    return value && value.length;
}

var UserSchema = new Schema({
	name: {type: String,trim:true}
  ,	Email: { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } }
  , hashed_password: String
  , salt: String
  , Pwd: {type: String}
  , SharedWithMe: [SharedWall]
  , freeAcct: Boolean
  , numWalls: Number 
  , company: String
  , phone: String
  , beta: Boolean
  , createdOn: Date
  , lastLogin: Date
  , timesLogin: Number
});


UserSchema
.virtual('id')
.get(function() {
  return this._id.toHexString();
});

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() { return this._password; });

UserSchema.method('authenticate', function(plainText) {
  return this.encryptPassword(plainText) === this.hashed_password;
});

UserSchema.method('makeSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

UserSchema.method('encryptPassword', function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});



module.exports = Mongoose.model('User',UserSchema);