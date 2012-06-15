
/**
 * Module dependencies.
 */

var express = require('express')
  , _ = require('underscore') //underscore.js adds some array and object functions
  , Mongoose = require('mongoose') //db interface
  , nowjs = require('now') // Websockets library
  , async = require('async') // Library to reduce callbacks
  //db definitions
  , Path = require('./models/path')
  , Wall = require('./models/wall')
  , Images = require('./models/images')
  , Company = require('./models/company')
  , Box = require('./models/box')
  , Iwall = require('./models/iwall.js')

var port = process.env.VCAP_APP_PORT || 8000;
var app = module.exports = express.createServer();
var db;
var boxes = {};
var shares = {};
var users = {};
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Middleware
app.dynamicHelpers({
  messages: require('express-messages') // allow for flash messages
});

app.helpers({
  _:require('underscore') // make underscore available to clientside
})

// login middleware

function requiresLogin(req,res,next){
  if (req.session.company_id) {
    Company.findById(req.session.company_id, function(err, company) {
      if (company) {
        req.currentCompany = company;
        next();
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.redirect('/login');
  }
};

function requiresBoxID(req,res,next){
	console.log('BoxAuth - User-Agent: ' + req.headers['user-agent']);
	bid = req.headers['user-agent'].substr(req.headers['user-agent'].search("WWA"));
  if (req.session.boxID) {
    Company.findById(req.session.company_id, function(err, company) {
      if (company) {
        req.currentCompany = company;
        next();
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.redirect('/login');
  }
};

function getBoxFromUA(ua){
	if (i = ua.search("WWA")) {
		BoxID = ua.substr(i);
		return BoxID;
	}
	return null;
}



// Database

Mongoose.connect('mongodb://localhost/cdb4');



// Routes not needed as it will be handled by python

//For testing
app.get('/', function(req,res){
  res.local('layout', false);
  res.render('index',{ company: new Company()});
});
app.get('/tindex', function(req,res){
  //res.local('layout', false);
  res.render('tindex',{
    title: 'Kolabria'	
  });
})

app.get('/wall/:id', function(req, res){
  //id refers to either _id or name?
  var wall_id = req.params.id;
  //find wall in db & get wall and paths
  res.render('wall', {});
});
app.get('/test', function(req,res){
  res.render('test',{});
});
app.get('/clientuser', function(req,res){
  res.render('clientuser',{});
});
app.get('/clientappliance', function(req,res){
  res.render('clientappliance',{});
});
app.get('/hostappliance', function(req,res){
  res.render('hostappliance',{});
})

app.get('/images/:file', function(req,res){

})
app.post('/images', function(req,res){

})

app.get('/register', function(req,res){
  res.local('layout', false);
  res.render('register',{
    title: 'Register', company: new Company()	
  });
})

app.get('/login', function(req, res){
  res.local('layout', false);
  res.render('login', {
    title: 'Login', company: new Company()
    });
});

app.get('/join', function(req,res){
  res.local('layout', false);
  res.render('join',{
    title: 'Kolabria', company: new Company()
  });
})

app.post('/join', function(req,res){
 console.log('Join -- name: '+req.body.name + ' room: '+req.body.room+' code: '+req.body.code);
  	Box.findOne({ name: req.body.room}, function(err, box) {
		 if(err){
		    console.log(err);
		  }
		if (box) {
			// console.log('Join-- box.PIN', box.PIN);
			  if (box.PIN == req.body.code) {
				  res.render('clientuser', {
			        title: 'Kolabria', box: box, userName: req.body.name
		          });
			  }
		} 	
     });	
})

app.get('/about', function(req,res){

})
app.get('/contact', function(req, res){

})
app.post('/contact', function(req,res){

})
app.get('/product', function(req,res){

})

//For Blog if needed, maybe look if there is already a node blog out there that works
app.get('/blog.:format?', function(req,res){

});
app.get('/blog/:title.:format?',function(req,res){

})
app.post('/blog', function(req,res){

})

//app.post('/join', function(req,res){
// console.log('Join -- name: '+req.body.name + ' room: '+req.body.room+' code: '+req.body.code);
//  	Box.find({ name: "dog"}, function(err, box) {
//		 if(err){
//		    console.log(err);
//		  }
//		  console.log('Join-- box.PIN', box.PIN);
//		  if (box.PIN == req.body.code) {
//			  res.render('clienuser', {
//		        title: 'Kolabria', box: box, userName: req.body.name
//	          });
//		  }
//     });	
//})


app.post('/login', function(req, res){
	Company.findOne({ adminEmail: req.body.company.adminEmail }, function(err, company) {
	    if (company && company.authenticate(req.body.company.password,company.password)) {
	      req.session.company_id = company.id;
          res.redirect('/controllers');
	    } else {
		  console.log('Login failed');
	      //req.flash('warn', 'Login Failed');
	      res.redirect('/login');
	    }
	  });
});

app.post('/register.:format?', function(req, res){
  var company = new Company(req.body.company);

  function companySaveFailed() {
   // req.flash('warn', 'Account creation failed');
    console.log('account creation failed');
    res.render('register', {
      locals: { title: 'Register', company: company }
    });
  }

  company.save(function(err) {
    if (err) return companySaveFailed();

   // req.flash('info', 'Your account has been created');
    console.log('Account Created');

    switch (req.params.format) {
      case 'json':
        res.send(company.toObject());
      break;

      default:
        req.session.company_id = company.id;
        res.redirect('/controllers');
    }
  });
});

app.get('/controllers', requiresLogin, function(req,res){	
	Company.findById(req.session.company_id, function(err, company) {
	    if (company) {
	      Box.find({ company_id: req.session.company_id}, function(err, boxes) {
			 if(err){
			    console.log(err);
			  }
			  res.local('layout', false);
		      res.render('controllers', {
		        title: 'Kolabria', company: company , boxes: boxes
	          });
	       });	
	    }});
});

//Path.findOne({_id:pathId}, function(err,doc){
  // if(err){
    // console.log(err);
     //this.now.tError('Could Not Delete');
  // }
  // doc.remove();
 // });

// Wall PIN generator TODO move outside of routes
function newPIN(){
	return Math.floor(Math.random() * 9000) + 1000;
}


// add new box
app.post('/controllers.:format?', requiresLogin, function(req,res){
	//console.log('Add new box');
	var b = new Box();
	var w = new Iwall();
	w.company_id = req.session.company_id;
	w.PIN = newPIN();
	w.name = req.body.box_name;
	w.save(function(err) {
	      if (err) console.log('New wall add failed');
	   });
	
    function boxSaveFailed() {
      console.log('New box add  failed');
      res.redirect('/controllers');
    }
    b.name = req.body.box_name;
    b.company_id = req.session.company_id;
    b.id = req.body.box_id;
    b.defaultWall_ID = w.id; 
    b.PIN = w.PIN;
    console.log('default wall id: ',b.defaultWall_ID);
	b.save(function(err) {
	      if (err) return boxSaveFailed();
	   });

	
	//console.log('Added Box name: ', req.body.box_name);
	Company.findById(req.session.company_id, function(err, company) {
	    if (company) {
	      Box.find({ company_id: req.session.company_id}, function(err, boxes) {
			 if(err){
			    console.log(err);
			  }
			  res.local('layout', false);
		      res.render('controllers', {
		        title: 'Kolabria', company: company , boxes: boxes
	          });
	       });	
	    }});
});
// remove box
app.get('/controllers/:id.:format?/remove', requiresLogin, function(req,res){
    console.log('Remove Box: ID -  ', req.params.id);
    async.waterfall([
        function(callback){
            Box.findOne({ id: req.params.id}, function(err, box) {
                callback(null, box);
            });
        },
        function(box, callback){
            Iwall.findById(box.defaultWall_ID, function (err, wall) {
                callback(null, box, wall);
            });
        }
    ],function(err, box, wall){
	    if(err){
		    console.log(err);
		  }
        wall.remove();
        box.remove();
        res.redirect('/controllers');
    });
});

// edit box info 	
app.get('/controllers/:id.:format?/edit', requiresLogin, function(req,res){      res.local('layout', false);
	Company.findById(req.session.company_id, function(err, company) {
	    if (company) {
	      console.log('Edit Box: ID -N  ', req.params.id);
	      Box.findOne({id: req.params.id}, function(err, box) {
	        if(err){
			    console.log(err);
		    }
	        if (box){
		         res.local('layout', false);
			     res.render('editbox', {
			        title: 'Kolabria', company: company, box: box, shareList: box.shareList
			      });
		    }
		  });
	    }
	});
});

// edit box info - update box name	
app.post('/controllers/:id.:format?/edit', requiresLogin, function(req,res){
	Company.findById(req.session.company_id, function(err, company) {
	    if (company) {
	      console.log('Edit Box: ID -  ', req.params.id);
	      Box.findOne({id: req.params.id}, function(err, box) {
	        if(err){
			    console.log(err);
		    }
	        if (box){
		      box.name = req.body.box_name;
		      box.save(function(err) {
			    if (err) console.log(' Box edit box update failed');
		      });
		      res.local('layout', false);
			  res.render('editbox', {
		        title: 'Kolabria', company: company, box: box, shareList: box.shareList
		      });
		    }
		  });
	    }
	});
});

// Edit box info - add box to share list 	
app.post('/controllers/:id.:format?/share', requiresLogin, function(req,res){
	Company.findById(req.session.company_id, function(err, company) {
	    if (company) {
	      console.log('Edit Box share: ID -  ', req.params.id);
	      console.log('Edit Box share: Box id to add: ', req.body.data);
	      Box.findOne({id: req.params.id}, function(err, box) {
	        if(err){
			    console.log(err);
		    }
	        if (box){
		      box.shareList.push(req.body.data );
		      box.save(function(err) {
			    if (err) console.log(' Box edit box update failed');
		      });
		      res.local('layout', false);
			  res.render('editbox', {

		        title: 'Kolabria', company: company, box: box, shareList: box.shareList
		      });
		    }
		  });
	    }
	});
});

//  Edit box info - remove box from share list 
app.get('/controllers/:id.:format?/unshare/:sb', requiresLogin, function(req,res){
	Company.findById(req.session.company_id, function(err, company) {
	    if (company) {
	      console.log('Edit Box share: ID -  ', req.params.id);
	      console.log('Edit Box unshare: Box id to remove: ', req.params.sb);
	      Box.findOne({id: req.params.id}, function(err, box) {
	        if(err){
			    console.log(err);
		    }
	        if (box){
		      
		      box.shareList.splice(box.shareList.indexOf(req.params.sb),1 );
		      box.save(function(err) {
			    if (err) console.log(' Box edit box update failed');
		      });
		      res.local('layout', false);
			  res.render('editbox', {
		        title: 'Kolabria', company: company, box: box, shareList: box.shareList
		      });
		    }
		  });
	    }
	});
});

// host appliance draw view test
app.get('/host/:id.:format?/draw', function(req,res){
	console.log('Draw - Box ID  ', req.params.id);
	Box.findOne({ id: req.params.id}, function(err, box) {
	   if(err){
	     console.log(err);
	   }
       res.local('layout', false); 
	   res.render('hostappliance',{ box: box   
       });
    });
});
// host appliance draw view test using user agent
app.get('/host/draw', function(req,res){
	console.log('User-Agent: ' + req.headers['user-agent']);
//	bid = req.headers['user-agent'].substr(req.headers['user-agent'].search("WWA"));
	if (bid = getBoxFromUA(req.headers['user-agent'])){
		console.log('Box ID: ',bid);
		Box.findOne({ id: bid} , function(err, box) {
		   if(err){
		     console.log(err);
		   }
	       res.local('layout', false); 
		   res.render('hostappliance',{ box: box   
	       });
	    });	
	}
});


app.get('/trash/:id.:format?', function(req,res){
	if (bid = getBoxFromUA(req.headers['user-agent'])){
		var w = new Iwall();  // create a new wall
		console.log('Trash - Box ID  ', req.params.id);
		Box.findOne({ id: req.params.id}, function(err, box) {
		   if(err){
		     console.log(err);
		   }
		   if (box){
		     console.log("Trash - Box dwall: ", box.defaultWall_ID);
		     Iwall.findById(box.defaultWall_ID, function (err, wall) {
		        if(err){
			       console.log(err);
			     }
			     if(wall) {
			       console.log("Trash - wall id: ", wall.id);
			       wall.remove(); //remove old wall
			       w.company_id = box.company_id;
			       w.PIN = newPIN();
			       w.name = box.name;
			       box.defaultWall_ID = w.id;
			       box.PIN = w.PIN 
			       console.log('Trash - new wall PIN: ', box.PIN, w.PIN);
			       w.save(function(err) {
			        if (err) console.log(' Trash - New wall add failed');
		           });
		           box.save(function(err) {
			        if (err) console.log(' Trash - box update failed');
		           });
			     }	   
		     });
	       }
	       res.redirect('/host/draw');	
	       //res.local('layout', false); 
		   //res.render('hostappliance',{ box: box   
	       // });
	    });		
	} 
});
app.get('/connect/:id', function(req,res){  

	console.log('ID  ', req.params.id);
//	console.log('ID  ', req.params.name);
	
	console.log('User-Agent: ' + req.headers['user-agent']);
	bid = req.headers['user-agent'].substr(req.headers['user-agent'].search("WWA"));
	console.log('Box ID: ',bid);
	Box.findOne({ id: bid}, function(err, rbox) {
      if(err){
	    console.log(err);
	  }
      Box.findOne({ id: req.params.id}, function(err, hbox) {
	    if(err){
	      console.log(err);
	    }
        res.local('layout', false); 
	    res.render('clientappliance',{ hbox: hbox,rbox: rbox 
        });
      });		
	});
});


app.get('/sdestroy', function(req, res){
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/login');
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);

//Now.JS initialization

var nowjs = require("now");
var everyone = nowjs.initialize(app);


//Functions
uploadImage = function(){

}
//Two Main types of now.js functions
//1. DB functions to be called after all manipulations on a path/object has been completed
//2. Inter-Client functions that offer realtime updates between clients. 


//Inter Client

//modify so that only applicable clients are sent this info
//have an activeWall with an _id and an array of now.js client id's
//group is named 'c'+companyId+'w'+wallId. Theoretically wallId should be enough as the chances of having multiple unique wallId's is almost 0, however why take chances?


//start drawing
everyone.now.shareStartDraw = function(color,width,start,layer){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.startDraw(color,width,start,this.user.clientId,layer);
}

//add points
everyone.now.shareUpdateDraw = function(point,layer){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.updateDraw(point,this.user.clientId,layer);
}

//move object
everyone.now.sendMoveItem = function(layer, pathId, delta){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.updateMove(layer,pathId,delta);
}

//delete path
everyone.now.sendDeleteItem = function(layer, pathId){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.removePath(layer,pathId);
  deletePath(pathId);
}

//DB functions
//wallId will reference the _id ObjectRef of the wall object
//pathId will reference the _id ObjectRef of the path object

//called after sendEnd to save newPath (after vector simplification has run)
everyone.now.newPath = function(path,pcolor,pwidth,player,callback){
  client = this.user.clientId;
  var wallId = this.now.wallId
  var companyId = this.now.companyId
  //create new path
  Path.create({
    layer: player
    , color: pcolor
    , width: pwidth
    , opacity: 1 //For now, make variable later
    , description: path
  },function(err,doc){
    if(err){
      console.log(err)
      nowjs.getClient(client, function(){
        this.now.tError('Could Not Save');
      });
    }

    //update wall
    Wall.update({
      _id: wallId //hard coded for now
    },{
      $push:{paths:doc._id}
    },{upsert:true},function(err,w){
      if(err){
        console.log(err)
        nowjs.getClient(client, function(){
          this.now.tError('Could Not Save');
        });
      }
      nowjs.getGroup('c'+companyId+'u'+wallId).exclude(client).now.endDraw(player,client,doc._id); //newName = _id
      callback(doc._id);
    });
  });
  
}
//called when path is deleted, not exposed, as it gets called from the exposed sendDeleteItem
deletePath = function(pathId){
  Path.findOne({_id:pathId}, function(err,doc){
    if(err){
      console.log(err);
      this.now.tError('Could Not Delete');
    }
    doc.remove();
  });
}
//called after a move has been completed
everyone.now.updatePath = function(pathId,path){
  Path.update({
    _id:pathId
  },
  {
    description:path
  },{},function(err,doc){
    if(err){
      console.log(err);
      this.now.tError('Could Not Save');
    }
  });
  //update path in db
}
//initial load (data sent with page request)
everyone.now.initWall = function(callback){
  //initialize connection
  Mongoose.connect('mongodb://localhost/'+this.now.companyId);
  var client = this.user.clientId;
  var name = this.now.name;
  var wallId = this.now.wallId;
  var usernames = [];
    //add this user to a group      
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).addUser(client);
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(client).now.pushUser(name, client);
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(client).getUsers(function(users){
    async.forEach(users, function(item, callback){
      nowjs.getClient(item, function(){
        usernames.push({
            name: this.now.name
            , id: this.user.clientId
          });
        callback();
      })
    }, function(err){
      Wall.findOne({_id:wallId}).populate('paths').run(function(err,doc){
        if(err){
          console.log(err);
          nowjs.getClient(client, function(){
            this.now.tError('Could not connect to Wall');
          });
        }
        callback(doc, usernames);
      });
    });
  });
  //get info from db
}
//register appliance
everyone.now.register = function(cb){
  client = this.user.clientId
  id = this.now.boxID
  name = this.now.name
  sharedWith = [];
  boxes[id] = {
    connectionID: client
    , boxName : name
  }
  async.series([
    function(callback){
      _.each(shares, function(v,k){
        if(_.find(v, function(x){
          return x == id
        })){
          sharedWith.push({id:k,name:boxes[k].boxName})
        }
      });
      callback(null);
    }
  ], 
  function(err){
    cb(shares[id], sharedWith);
  })
}
    
//On Share wall
everyone.now.shareWall = function(target){
  var boxID = this.now.boxID; 
  var name = this.now.name
  var id = boxes[target].connectionID;
  if(!_.isArray(shares[boxID])){
    shares[boxID] = []
  }
  shares[boxID].push(target);
  nowjs.getClient(id, function(){
    this.now.share(boxID, name);
  });
}

everyone.now.clear = function(callback){
  boxID = this.now.boxID;
  companyId = this.now.companyId;
  wallId = this.now.wallId;
  clientId = this.user.clientId;
  //TODO wipe wall
  //TODO create new wall
  //TODO call clientId context redirect to wall page
  //TODO wipe images
  async.series([
    function(cb){
      nowjs.getGroup('c'+companyId+'u'+wallId).exclude(clientId).now.quit();
      cb(null)
    }
    , function(cb){
      _.each(shares[boxID], function(v){
        nowjs.getClient(boxes[v].connectionID, function(){
          this.now.unshare(boxID)
        });
      })
      cb(null)
    }
  ],function(err){
    delete shares[boxID];
    callback();
  });
}


nowjs.on('disconnect', function(){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.pullUser(this.now.name, this.user.clientId);
  delete boxes[this.now.boxID];
});