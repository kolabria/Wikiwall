var mongoose = require('mongoose').Mongoose;

mongoose.model('Wall',{
  properties: ['title', 'wall_id','user_id'],

  indexes: [ 'title', ],
  
  getters: {
	id: function(){
		return this._id.toHexString();
	}
  }
});

exports.Wall = function(db) {
	 return db.model('Wall');
};

