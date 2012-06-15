//Companies
/*
  Name
  admin email
  admin password
  controllers[]
*/
var Mongoose = require("mongoose")
  , Schema = Mongoose.Schema
  , ObjectId = Schema.ObjectId

var crypto = require('crypto');

function validatePresenceOf(value) {
    return value && value.length;
}

var CompanySchema = new Schema({
	name: {type: String,trim:true}
  ,	adminEmail: { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } }
  , hashed_password: String
  , salt: String
  , adminPwd: {type: String}
});


CompanySchema
.virtual('id')
.get(function() {
  return this._id.toHexString();
});

CompanySchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() { return this._password; });

CompanySchema.method('authenticate', function(plainText) {
  return this.encryptPassword(plainText) === this.hashed_password;
});

CompanySchema.method('makeSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

CompanySchema.method('encryptPassword', function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

CompanySchema.pre('save', function(next) {
  if (!validatePresenceOf(this.password)) {
    next(new Error('Invalid password'));
  } else {
    next();
  }
});

module.exports = Mongoose.model('Company',CompanySchema);