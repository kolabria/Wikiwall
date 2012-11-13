

/**
 * Module dependencies.
 **/

var express = require('express')
  , _ = require('underscore') //underscore.js adds some array and object functions
  , Mongoose = require('mongoose') //db interface
  , nowjs = require('now') // Websockets library
  , async = require('async') // Library to reduce callbacks
  , fs = require('fs')  // file system library
  //db definitions
  , Path = require('./models/path')
  , Wall = require('./models/wall')
  , Images = require('./models/images')
  , Company = require('./models/company')
  , Box = require('./models/box')
  , Iwall = require('./models/iwall.js');

var MongoStore = require('connect-mongo')(express);

/**
* Initialize Variables and Global Database
**/

var port = process.env.VCAP_APP_PORT || 8000;
var app = module.exports = express.createServer();
var db;
var boxes = {};
var shares = {};
var users = {};



//need to assign this to a db variable?

// need to have array of db variables with company id as index
// this needs to be intitiallized when server started 
// sombething like  
//   for each company  
//   db[companyID] = mongoose.createConnection('mongodb://localhost/companyID)

//  When use db locally must use correct db
//   for wall drawing within each function assign locally
//    var Wall = db[companyID].model('Wall')

// when create new company, must create new db for that company 

Mongoose.connect('mongodb://localhost/cdb13');


/**
* Configuration
**/

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ 
      secret: 'galaxy quest'
    , store: new MongoStore({
	    db: 'myDb'
      }) 
  }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

/**
* Middleware
**/

app.dynamicHelpers({
  messages: require('express-messages-bootstrap') // allow for flash messages
  , base: function(req,res){
  	return req.header('host')
  }
});

app.helpers({
  _:require('underscore') // make underscore available to clientside
})

/**
* Login Middleware
**/

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

/**
* Helper Functions
**/

function getBoxFromUA(ua){
	if (i = ua.search("WWA")) {
		BoxID = ua.substr(i);
		return BoxID;
	}
	return null;
}

// Wall PIN generator 
function newPIN(){
	return Math.floor(Math.random() * 9000) + 1000;
}

function uploadFile(){

}

/**
* Tests Routes
**/

app.get('/wall/:id', function(req, res){
  //id refers to either _id or name?
  var wall_id = req.params.id;
  //find wall in db & get wall and paths
  res.render('wall', {});
});
app.get('/test', function(req,res){
  res.local('layout', false);
  res.render('test',{});
});
app.post('/test', function(req,res){

});
app.get('/clientuser', function(req,res){
  //render a Join room view
  res.render('join',{});
});
app.post('/clientuser', function(req,res){
	//Validate the Pin and Box
	//Get the active WallID and companyId
	//Send companyID, wallID, username to the view.
  res.local('layout', 'clientuser');
	res.render('draw',{});
});
app.get('/clientappliance', function(req,res){
	//Make sure this is an appliance
	//Find box to connect to validate that the wall has been shared with this device
	//Get the active wallID and companyId
	//Send companyID, wallID, and this box ID (and boxname).
  res.local('layout', 'clientappliance');
  res.render('draw',{});
});
app.get('/hostappliance', function(req,res){
	//Make sure this is an appliance
	//Find the active wallID and company ID, for this box (and boxname)
	//Send companyId, wallId, boxname, and this box ID.
	res.local('layout', 'hostappliance');
  res.render('draw',{});
})
app.get('/apperror', function(req,res){
	var bid = "WWAblahblah"; 
	res.local('layout', false); 
	res.render('apperror',{bid: bid});
   // res.render('test',{});    
});


/**
* Site Routes
**/

app.get('/', function(req,res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolabria - Sharing Visual Ideas')
  res.render('index',{});
});


//Todo Remove?
app.get('/tindex', function(req,res){
  //res.local('layout', false);
  res.render('tindex',{
    title: 'Kolabria'	
  });
})

app.get('/register', function(req,res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolbria - Register')
  res.render('register',{
    company: new Company()	//needed?
  });
})

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
      	break;
    }
  });
});

app.get('/join', function(req,res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolabria - Join A Session')
  res.render('join',{
    company: new Company() //needed?
  });
});


app.post('/join', function(req,res){
   // check if room (box) name is entered and valid
   // check if PIN is valid for that wall
   res.local('layout', 'clientuser');
   Box.findOne({name: req.body.room}, function(err, box) {
     if(err) console.log(err);
     if(!box) {
		req.flash('error',"Invalid Room Name");
		res.redirect('/join');  
     }
	 else {
	     //is a box	- check PIN
	     //console.log('join: good room');
		 if (box.PIN == req.body.code) {
			//console.log('join: good PIN');
			res.local('title', 'Kolabria - '+box.name)
	        res.render('draw', {
		      title: 'Kolabria', box: box, userName: req.body.name
		    });
		 }
		 else {
			req.flash('error',"Invalid PIN");
		    res.redirect('/join');		
		 }	
	 }
   });	
});

app.get('/login', function(req, res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolbria - Login')
  res.render('login', {
    company: {}
  });
});

app.post('/login', function(req, res){
	Company.findOne({ adminEmail: req.body.company.adminEmail }, function(err, company) {
	  if (company && company.authenticate(req.body.company.password,company.password)) {
	    req.session.company_id = company.id;
      	res.redirect('/controllers');
	  } else {
	  	company = {}
	  	res.local('layout', 'sitelayout');
  		res.local('title', 'Kolbria - Login')
	  	req.flash('error',err || 'Invalid Username or Password');
	    res.render('login',{
	      company: {adminEmail : req.body.company.adminEmail}
	    });
	  }
	});
});


app.get('/about', function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - About')
    res.render('about',{});
})
app.get('/contact', function(req, res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - Contact')
    res.render('contact',{});

})
app.post('/contact', function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - Contact')


})
app.get('/product', function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - Product')
    res.render('product',{});

})

//For Blog if needed, maybe look if there is already a node blog out there that works
app.get('/blog.:format?', function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - About')


});
app.get('/blog/:title.:format?',function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - About')


});
app.post('/blog', function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - About')


});
/**
* Admin Views
**/

app.get('/controllers', requiresLogin, function(req,res){	
	Company.findById(req.session.company_id, function(err, company) {
	  if (company) {
	    Box.find({ company_id: req.session.company_id}, function(err, boxes) {
				if(err){
			    console.log(err);
			  }
			  res.local('layout', 'loginlayout');
		    res.render('controllers', {
		      title: 'Kolabria'
		      , company: company
		      , boxes: boxes
	      });
	    });	
	  }
	});
});

// add new box
app.post('/controllers.:format?', requiresLogin, function(req,res){
	Box.findOne({id: req.body.box_id}, function(err, box){
	     if (box) {
		     req.flash('error','Controller already registered');
	     }
	     else {
			Box.findOne({name: req.body.box_name}, function(err, box) {
				if (box) {
                   req.flash('error',"Controller Name already used.  Chose a different name");
				}
				else {
				 	var b = new Box();
					var w = new Iwall();
					w.company_id = req.session.company_id;
					w.PIN = newPIN();
					w.name = req.body.box_name;
					b.name = req.body.box_name;
				    b.company_id = req.session.company_id;
				    b.id = req.body.box_id;
				    b.defaultWall_ID = w.id; 
				    b.PIN = w.PIN;
				    //console.log('default wall id: ',b.defaultWall_ID);
					function boxSaveFailed() {
				      console.log('New box add  failed');
				      res.redirect('/controllers');
				    }
					w.save(function(err) {
					  if (err) console.log('New wall add failed');
					});
					b.save(function(err) {
					  if (err) return boxSaveFailed();
					});	
				}
			});
	    }
		Company.findById(req.session.company_id, function(err, company) {
		  if (company) {
		    Box.find({ company_id: req.session.company_id}, function(err, boxes) {
				  if(err){
				    console.log(err);
				  }
				  res.local('layout', 'loginlayout');
			      res.render('controllers', {
			       title: 'Kolabria'
			       , company: company
			       , boxes: boxes
		      });
		    });	
		  }
	    });
	});
});




// remove box
app.delete('/controllers/:id.:format?', requiresLogin, function(req,res){
  console.log('Remove Box: ID -  ', req.params.id);
  async.waterfall([
    function(callback){
      Box.findOne({ id: req.params.id}, function(err, box) {
        callback(null, box);
      });
    }
    , function(box, callback){
      Iwall.findById(box.defaultWall_ID, function (err, wall) {
        callback(null, box, wall);
      });
    }]
    , function(err, box, wall){
	    if(err) console.log(err);
      wall.remove();
      box.remove();
      res.redirect('/controllers');
    }
  );
});

// edit box info 	
app.get('/controllers/:id.:format?/edit', requiresLogin, function(req,res){      
	res.local('layout', 'loginlayout');
	Company.findById(req.session.company_id, function(err, company){
	  if (company) {
	    //console.log('Edit Box: ID -N  ', req.params.id);
	    Box.findOne({id: req.params.id}, function(err, box){
	      if (err) console.log(err);
	      if (box){
			    res.render('editbox', {
			      title: 'Kolabria'
			      , company: company
			      , box: box
			      , shareList: box.shareList
			    });
		    }
		  });
	  }
	});
	//TODO redirect to error page
});

// edit box info - update box name	
app.put('/controllers/:id.:format?', requiresLogin, function(req,res){
	Company.findById(req.session.company_id, function(err, company) {
	  if (company) {
	    console.log('Edit Box: ID -  ', req.params.id);
	    Box.findOne({id: req.params.id}, function(err, box) {
	    	if(err) console.log(err);
	      if (box){
		      box.name = req.body.box_name;
		      box.save(function(err) {
			  	  if (err) console.log(' Box edit box update failed');
		      });
		      res.local('layout', 'loginlayout');
			  	res.render('editbox', {
		        title: 'Kolabria'
		        , company: company
		        , box: box
		        , shareList: box.shareList
		      });
		    }
		  });
	  }
	});
});

// Edit box info - add box to share list 
// need to determine if box name or ID

app.put('/controllers/:id.:format?/share', requiresLogin, function(req,res){
	Company.findById(req.session.company_id, function(err, company){
		if (company) {
		   // console.log('Edit Box share: ID -  ', req.params.id);
		   // console.log('Edit Box share: Box id to add: ', req.body.data);
			Box.findOne({id: req.params.id}, function(err, box) {
				if(err) console.log(err);
				if (box){
					Box.findOne({name: req.body.data}, function(err,sbox){
						if(err)console.log(err);
						if (!sbox){
							req.flash('error',"Controller name not found");
							console.log('Edit Box share:  need to find sbox by ID');
						}
						else {
							box.shareList.push({boxID: sbox.id, boxName: sbox.name});
							box.save(function(err){
								if(err) console.log('Box edit box update failed',err);
							});	
						}
						res.local('layout', 'loginlayout');
						res.render('editbox', {
					        title: 'Kolabria'
					        , company: company
					        , box: box
					        , shareList: box.shareList
					    });
					});
					
				}
			});
		}
	});
});

//  Edit box info - remove box from share list 
app.delete('/controllers/:id.:format?/unshare/:sb', requiresLogin, function(req,res){
	Company.findById(req.session.company_id, function(err, company) {
	  if (company) {
	    //console.log('Edit Box share: ID -  ', req.params.id);
	    //console.log('Edit Box unshare: Box id to remove: ', req.params.sb);
	    Box.findOne({id: req.params.id}, function(err, box) {
	      if(err) console.log(err);
	      if (box){
			  for (i=0; i++ ; i<box.shareList.length){
				 if (box.shareList[i].boxID == req.params.sb){
					break;
				}
			  }
			  box.shareList[i-1].remove();
		      box.save(function(err) {
			    	if (err) console.log(' Box edit box update failed');
		      });
		      res.local('layout', 'loginlayout');
			  	res.render('editbox', {
		        title: 'Kolabria'
		        , company: company
		        , box: box
		        , shareList: box.shareList
		      });
		    }
		  });
	    }
	});
});

/**
* Drawing Views
**/

// host appliance draw view test  - old code to remove 
app.get('/host/:id.:format?/draw', function(req,res){
  res.local('layout', 'hostappliance'); 
  res.local('title', 'Host Wall')
	console.log('Draw - Box ID  ', req.params.id);
	Box.findOne({ id: req.params.id}, function(err, box) {
	  if(err) console.log(err);
	  res.render('draw',
	   	{ 
	   		box: box   
      });
  });
});
// host appliance draw view test using user agent
app.get('/host/draw', function(req,res){

//	console.log('User-Agent: ' + req.headers['user-agent']);
  //	bid = req.headers['user-agent'].substr(req.headers['user-agent'].search("WWA"));
	if (bid = getBoxFromUA(req.headers['user-agent'])){
	//	console.log('Box ID: ',bid);
		Box.findOne({ id: bid} , function(err, box) {
		//	console.log(box);
		  if(err){
			console.log(err);
              // this doesn't work  - need to fix at some point 
                        console.log("Bad BID: ", bid);
			res.local('layout', false); 
			res.render('apperror',{ bid: bid});
		  } 
		  else {
			res.local('layout', 'hostappliance'); 
			res.local('title', 'Host Wall')
			res.render('draw',{ 
			  	box: box
		    });
		  }
	  });	
	}
});

// called to delete drawing walls and associated paths
deleteWall = function(wallId){
	// remove all paths from wall path list 
   // console.log('wallId: '+wallId);
  	Wall.findOne({_id:wallId}, function (err, w){
	 // console.log('wall to delete'+wallId);
	  if (w){
		var i = w.paths.length;
	     // console.log('paths count: '+w.paths.length);
	      for (i=0; i< w.paths.length; i++){
		     // remove assoicated path from path db
		   //   console.log('path to delete: '+w.paths[i]);
			  Path.findOne({_id:w.paths[i]}, function(err,doc){
			    if(err){
			      console.log(err);
			      this.now.tError('Could Not Delete Path');
			    }
			    doc.remove(); 
	          });
	      } 
	      w.remove();
	      if(err){
	        console.log(err);
	        this.now.tError('Could not remove Wall');
	      }	
	  }
    });	
}


//TODO move some of the functions to the now Clear function? or redirect host to this page?
app.get('/trash/:id.:format?', function(req,res){
	if (bid = getBoxFromUA(req.headers['user-agent'])){
		var w = new Iwall();  // create a new wall
		//console.log('Trash - Box ID  ', req.params.id);
		Box.findOne({ id: req.params.id}, function(err, box) {
		  if(err) console.log(err);
		  if (box){
		  //  console.log("Trash - Box dwall: ", box.defaultWall_ID);
		    // remove drawing walls
		    deleteWall(box.defaultWall_ID);
		    Iwall.findById(box.defaultWall_ID, function (err, wall) {
		      if(err) console.log(err);
			    if(wall) {
			//      console.log("Trash - wall id: ", wall.id);
			      wall.remove(); //remove old wall
			      w.company_id = box.company_id;
			      w.PIN = newPIN();
			      w.name = box.name;
			      box.defaultWall_ID = w.id;
			      box.PIN = w.PIN 
			  //    console.log('Trash - new wall PIN: ', box.PIN, w.PIN);
			      w.save(function(err) {
			        if (err) console.log(' Trash - New wall add failed');
		        });
		        box.save(function(err) {
			        if (err) console.log(' Trash - box update failed');
		        });
			     }	   
	      	res.redirect('/host/draw');	
		    });
	    }
	  });		
	}//TODO else render error page?
});

app.get('/connect/:id', function(req,res){  
  res.local('layout', 'clientappliance'); 
  res.local('title', 'Client Wall'); 
//	console.log('ID  ', req.params.id);
  //console.log('ID  ', req.params.name);
//	console.log('User-Agent: ' + req.headers['user-agent']);
	bid = req.headers['user-agent'].substr(req.headers['user-agent'].search("WWA"));
//	console.log('Box ID: ',bid);
	Box.findOne({ id: bid}, function(err, rbox) {
    if (err) console.log(err)
    Box.findOne({ id: req.params.id}, function(err, hbox) {
	    if (err) console.log(err)
	    res.render('draw',{
	    	 hbox: hbox
	    	 , rbox: rbox 
    	});
    });		
	});
});

app.post('/fileUpload', function(req,res){
	    var uploadDir = __dirname + '/public/uploads/';
	    uploadFile(req, uploadDir, function(data) {
        if(data.success)
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 200);
        else
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 404);
    });	
});

var uploadFile = function(req, targetdir, callback) {
    // Direct async xhr stream data upload, yeah baby.
    if(req.xhr) {
        var fName = req.header('x-file-name');
            fSize = req.header('x-file-size'),
            fType = req.header('x-file-type'),
            ws    = fs.createWriteStream(targetdir + fName);

        ws.on('error', function(err) {
            console.log("uploadFile() - req.xhr - could not open writestream.");
            callback({success: false, error: "Sorry, could not open writestream."});
        });
        // Writing filedata into writestream
        req.on('data', function(data) {
            ws.write(data);
        });
        req.on('end', function() {
            ws.end();
            callback({success: true});
        });
    }
};




app.get('/images/:file', function(req,res){

});
app.post('/images', function(req,res){

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

//called when path is deleted, not exposed, as it gets called from the exposed sendDeleteItem
deletePath = function(pathId, wallId){
	// remove path from wall path list 

  if (pathId){
  	  Wall.findOne({_id:wallId}, function (err, w){
	      var i = w.paths.indexOf(pathId);
	     // console.log('Path index: ',i);
	      w.paths.splice(i,1);
	      w.save(function(err) {
		        if (err) console.log(' deletePath - failed to delete path');
	      });
	      if(err){
	        console.log(err);
	        this.now.tError('Could not remove Path');
	      }
	  });	

		// remove path from db
	  Path.findOne({_id:pathId}, function(err,doc){
	    if(err){
	      console.log(err);
	      this.now.tError('Could Not Delete');
	    }
	    doc.remove();
	  });	
  }
  else {
     console.log('ERROR - deletePath:  wallId: '+wallId+' pathId: '+pathId);	
  }
}


/**
* NOW JS function calls
* Two Main types of now.js functions
* 1. DB functions to be called after all manipulations on a path/object has been completed
* 2. Inter-Client functions that offer realtime updates between clients. 
*
* Inter Client
*
* modify so that only applicable clients are sent this info
* have an activeWall with an _id and an array of now.js client id's
* group is named 'c'+companyId+'w'+wallId. Theoretically wallId should be enough as the chances of having multiple unique wallId's is almost 0, however why take chances?
*
**/

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
  var wallId = this.now.wallId;
  //console.log('sendDelete: wallId: ', wallId);

  deletePath(pathId, wallId);
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

//called after a move has been completed
everyone.now.updatePath = function(pathId,type,path){
//	console.log('pathId: '+pathId+' type: '+type);
	if(type){
		Path.findOne({_id:pathId}, function (err, doc){
			doc.description.position=path;
			doc.markModified('description.position')
			doc.save();
	    if(err){
	      console.log(err);
	      this.now.tError('Could Not Save');
	    }
		});
	}else{
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
	}
}
//initial load (data sent with page request)
everyone.now.initWall = function(callback){
  //initialize connection
// Mongoose.connect('mongodb://localhost/'+this.now.companyId);
  var client = this.user.clientId;
  var name = this.now.name;
  var wallId = this.now.wallId;
  var usernames = [];
  
    //add this user to a group      
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).addUser(client);

// debug code - log if pushUser is missing 
  if (!this.now.pushUser){
	console.log("initWall:  pushUser does not exists");
	console.log('initWall:  client: '+client+' name: '+name+' wallId: '+wallId);
	nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).count(function (ct) {
	    console.log('initWall: group count: '+ct);
	  });
  }

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
//	console.log('initWall: find wall');
      Wall.findOne({_id:wallId}).populate('paths').exec(function(err,doc){
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
everyone.now.sendFile = function(file,player, position, callback){
  boxID = this.now.boxID;
  companyId = this.now.companyId;
  wallId = this.now.wallId;
  clientId = this.user.clientId;
   Path.create({
    layer: player
    , opacity: 1 //For now, make variable later
    , description: {file: file.src, position:{x:position._x, y:position._y}}
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
        nowjs.getClient(clientId, function(){
          this.now.tError('Could Not Save');
        });
      }
  	  nowjs.getGroup('c'+companyId+'u'+wallId).exclude(clientId).now.receiveFilesCanvas(player, file.src, position, doc._id);
      callback(doc._id);
    });
  });
}

nowjs.on('disconnect', function(){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.pullUser(this.now.name, this.user.clientId);
  delete boxes[this.now.boxID];
});

everyone.now.serverLog = function(msg){
	var name = this.now.name;
        var d = new Date();
	console.log(d+"  Remote Log from: "+name+" msg: "+msg);
	
}

// power point viewer
everyone.now.sendViewerOpen = function(doc){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.viewerOpen(doc);
}

everyone.now.sendViewerNext = function(){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.viewerNext();
}
everyone.now.sendViewerPrev = function(){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.viewerPrev();
}
everyone.now.sendViewerClose = function(){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.viewerClose();
}

everyone.now.sendViewerBegin = function(){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.viewerBegin();
}


