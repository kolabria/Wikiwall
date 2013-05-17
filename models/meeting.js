var Mongoose = require('mongoose')
  , Schema = Mongoose.Schema
  , ObjectId = Schema.ObjectId;



 var meetingSchema = new Schema({
    wallId: ObjectId
  , ownerId: ObjectId
  , startTime: Date
  , stopTime: Date
  , currentParticipants: Number
  , maxParticipants: Number
  , vcUsed: Boolean
  , ssUsed: Boolean
  , active: Boolean
  , fromUser: Boolean
  , fromBox: Boolean
  , fromURL: Boolean
  , fromJoin: Boolean
  , ssCapture: Boolean
  , embeddedImage: Boolean
 });

meetingSchema
.virtual('id')
.get(function() {
  return this._id.toHexString();
});

 module.exports = Mongoose.model('Meeting',meetingSchema);