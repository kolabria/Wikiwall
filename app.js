

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
  , User = require('./models/user')
  , Box = require('./models/box')
  , Iwall = require('./models/iwall.js')
  , Meeting = require('./models/meeting.js')
  , xml2js = require('xml2js')
  , request = require('request')  //http request library
  , useragent = require('useragent'); 

var wwDatabase = 'beta1';    // name of wikiwall database

var https = require('https');
var http = require('http');

var MongoStore = require('connect-mongo')(express);

/**
* Initialize Variables and Global Database
**/

var port = process.env.SEC_SERV_PORT || 8000;
var hostname = process.env.SERV_HOSTNAME || 'localhost';
if (process.env.JSLIB_COMP == "true"){  // check if should used compressed wall.js libary 
	var jslibcomp = true;
}
else {
	var jslibcomp = false;
}

var db;
var boxes = {};
var shares = {};
var users = {};

var sslPath = process.env.APP_PATH || '';
//var ssDir = __dirname + '/public/uploads/';

if (hostname == "www.kolabria.com") {  // use signed certificate on public server 
  var options = {		
    ca:   fs.readFileSync(__dirname+'/ssl/sub.class1.server.ca.pem'),
    key:  fs.readFileSync(__dirname+'/ssl/ssl.key'),
    cert: fs.readFileSync(__dirname+'/ssl/ssl.crt')
  };
  var wwDatabase = 'beta1';    // name of wikiwall database
}
else {
  var options = {
    key: fs.readFileSync(sslPath+'privatekey.pem'),
    cert: fs.readFileSync(sslPath+'certificate.pem')
  };
  var wwDatabase = 'cdb13';    // name of wikiwall database
}

var app = module.exports = express.createServer(options);

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

Mongoose.connect('mongodb://localhost/'+wwDatabase);


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


app.listen(port);
console.log("Express secure server listening on port %d in %s mode", port, app.settings.env);


/**********************  open server config *****/ 
var app_open = express.createServer();

app_open.configure(function(){
  app_open.set('views', __dirname + '/views');
  app_open.set('view engine', 'jade');
  app_open.use(express.bodyParser());
  app_open.use(express.methodOverride());
  app_open.use(express.cookieParser());
  app_open.use(express.session({ 
      secret: 'galaxy quest'
    , store: new MongoStore({
	    db: 'myDb'
      }) 
  }));
  app_open.use(app_open.router);
  app_open.use(express.static(__dirname + '/public'));
});

app_open.configure('development', function(){
  app_open.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app_open.configure('production', function(){
  app_open.use(express.errorHandler()); 
});

var open_port = process.env.SERV_PORT || 8888;; 


app_open.listen(open_port);
console.log("Express open server listening on port %d in %s mode", open_port, app_open.settings.env);
console.log("hostname: ",hostname);

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

app_open.dynamicHelpers({
  messages: require('express-messages-bootstrap') // allow for flash messages
  , base: function(req,res){
  	return req.header('host')
  }
});

app_open.helpers({
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
        res.redirect('/ulogin');
      }
    });
  }
  else if (req.session.user_id) {
    User.findById(req.session.user_id, function(err, user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/ulogin');
      }
    });
  }
  else {
    res.redirect('/ulogin');
  }
};

function requiresSysLogin(req,res,next){
  if (req.session.sys_id) {
    next();
  } else {
    res.redirect('/slogin');
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

app_open.get('/', function(req,res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolabria - Sharing Visual Ideas')
  res.render('index',{});
});


app_open.get('/about', function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - About')
    res.render('about',{});
})
app_open.get('/contact', function(req, res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - Contact')
    res.render('contact',{});

})
app_open.post('/contact', function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - Contact')


})
app_open.get('/product', function(req,res){
	res.local('layout', 'sitelayout')
	res.local('title' , 'Kolabria - Product')
    res.render('product',{});

})

app_open.post('/ulogin', function(req, res){
	console.log("User Login - email: "+req.body.user.Email+" password: "+req.body.user.password);
	User.findOne({ Email: req.body.user.Email }, function(err, user) {
	  if (user && user.authenticate(req.body.user.password,user.password)) {
	    req.session.user_id = user.id;
        if (user.freeAcct) {
	      Iwall.find({ user_id: user.id}, function(err, walls) {
		    if(err) console.log(err);
		    if (walls.length >=1) {
			//console.log('remove free wall');
              walls[0].remove();
            }
		  });
	    }
      	res.redirect('https://'+hostname+':'+port+'/userwalls');
	  } else {
	  	user = {}
	  	res.local('layout', 'sitelayout');
  		res.local('title', 'Kolbria - User Login')
	  	req.flash('error',err || 'Invalid email or Password');
	    res.render('ulogin',{
	      user: {Email : req.body.user.Email}
	    });
	  }
	});
});
// redirects all remaining pages to secure site 
app_open.get('*', function(req,res){
  res.redirect('https://'+hostname+':'+port+ req.path);
});

app_open.post('*', function(req,res){
  res.redirect('https://'+hostname+':'+port+ req.path);
});

//Todo Remove?
app.get('/tindex', function(req,res){
  //res.local('layout', false);
  var ie = useragent.is(req.headers['user-agent']).ie;
  var version = useragent.is(req.headers['user-agent']).version;
//  console.log(' user agent: ', req.headers['user-agent']);
//  console.log('ie: '+ie+' version: '+useragent.is(req.headers['user-agent']).version);
  res.local('layout', 'sitelayout');
  res.render('tindex',{
    title: 'Kolabria', ie: ie, version: version	
  });
})

app.get('/t2index', function(req,res){
  // res.local('layout', 'tvindex');
  res.local('layout', 'sitelayout');
  res.render('t2index',{
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

// user registration 
app.get('/uregister', function(req,res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolbria - User Register')
  res.render('uregister',{
    user: new User()	//needed?
  });
})

app.post('/uregister.:format?', function(req, res){
  var user = new User(req.body.user);

  function userSaveFailed() {
    req.flash('warn', 'Account creation failed');
    console.log('account creation failed for: ',req.body.user.Email);
    res.render('uregister', {
      locals: { title: 'Register', user: user }
    });
  }
  if (req.body.accttype == 'free'){
	user.freeAcct = true;

    user.save(function(err) {
      if (err) return userSaveFailed();
      req.flash('info', 'Your account has been created');
      console.log('Account Created');

      switch (req.params.format) {
        case 'json':
          res.send(user.toObject());
        	break;

        default:
          req.session.user_id = user.id;
          res.redirect('/userwalls');
        	break;
      }
    });
  }
  else {
    if (req.body.authcode == 'MapleLeaf') {
		user.freeAcct = false;
	    user.save(function(err) {
	      if (err) return userSaveFailed();
	      req.flash('info', 'Your account has been created');
	      console.log('Account Created');

	      switch (req.params.format) {
	        case 'json':
	          res.send(user.toObject());
	        	break;

	        default:
	          req.session.user_id = user.id;
	          res.redirect('/userwalls');
	        	break;
	      }
	    });
    }
    else {
	   req.flash('error', 'Invalid authentication code');
	   res.redirect('/uregister');
    }
  }
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
   // check browser type
   var ie = useragent.is(req.headers['user-agent']).ie;
  //  console.log('/join - user agent: ', req.headers['user-agent']);
  //  console.log('/join - ie: '+ie+' version: '+useragent.is(req.headers['user-agent']).version);
   console.log('Wall name: '+req.body.room+' PIN: '+req.body.code);
   res.local('layout', 'userdraw');
   Iwall.findOne({name: req.body.room}, function(err, wall) {
     if(err) console.log(err);
     if(!wall) {
		req.flash('error',"Invalid Wall Name");
		res.redirect('/join');  
     }
	 else {
	     //is a wall	- check PIN
	     //console.log('join: good room');
		 if (wall.PIN == req.body.code) {
			//console.log('join: good PIN');
			joinMeeting(wall.id,req.body.name, 'join');
	        res.render('draw', {
		      title: 'Kolabria - '+wall.name, wall: wall, userName: req.body.name, ie: ie, jslibcomp: jslibcomp 
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
app.get('/ulogin', function(req, res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolbria - User Login')
  res.render('ulogin', {
    user: {}
  });
});

app.post('/ulogin', function(req, res){
	console.log("User Login - email: "+req.body.user.Email+" password: "+req.body.user.password);
	User.findOne({ Email: req.body.user.Email }, function(err, user) {
	  if (user && user.authenticate(req.body.user.password,user.password)) {
	    req.session.user_id = user.id;
        if (user.freeAcct) {
	      Iwall.find({ user_id: user.id}, function(err, walls) {
		    if(err) console.log(err);
		    if (walls.length >=1) {
			//console.log('remove free wall');
              walls[0].remove();
            }
		  });
	    }
      	res.redirect('/userwalls');
	  } else {
		if (user){
			console.log('ulogin - cannot find user: ',req.body.user.Email);
		}
		else console.log('ulogin - invalid authentication: 'req.body.user.Email);
	  	user = {}
	  	res.local('layout', 'sitelayout');
  		res.local('title', 'Kolbria - User Login')
	  	req.flash('error',err || 'Invalid  email or Password');
	    res.render('ulogin',{
	      user: {Email : req.body.user.Email}
	    });
	  }
	});
});



app.get('/slogin', function(req, res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolbria - System Login')
  res.render('slogin', {
    user: {}
  });
});

app.post('/slogin', function(req, res){
	console.log("System Login - email: "+req.body.user.Email+" password: "+req.body.user.password);
	if (req.body.user.Email == "ted_judge@radiobeam.ca" && req.body.user.password == "DarthVadar1977") {
		req.session.sys_id = 99;
      	res.redirect('/sysadmin');
	}
	else {
	  user = {}
	  res.local('layout', 'sitelayout');
  	  res.local('title', 'Kolbria - System Login')
	  req.flash('error','Invalid Username or Password');
	  res.render('slogin',{
	    user: {Email : req.body.user.Email}
	  });
	}
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
	User.findById(req.session.user_id, function(err, user) {
	  if (user) {
	    Box.find({ company_id: req.session.user_id}, function(err, boxes) {
			if(err){
			   console.log(err);
			}
			res.local('layout', 'uloginlayout');
		    res.render('controllers', {
		      title: 'Kolabria'
		      , user: user
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
					w.company_id = req.session.user_id;
					w.PIN = newPIN();
					w.name = req.body.box_name;
					b.name = req.body.box_name;
				    b.company_id = req.session.user_id;
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
		User.findById(req.session.user_id, function(err, user) {
		  if (user) {
		    Box.find({ company_id: req.session.user_id}, function(err, boxes) {
				  if(err){
				    console.log(err);
				  }
				  res.local('layout', 'uloginlayout');
			      res.render('controllers', {
			       title: 'Kolabria'
			       , user: user
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
	res.local('layout', 'uloginlayout');
	User.findById(req.session.user_id, function(err, user){
	  if (user) {
	    //console.log('Edit Box: ID -N  ', req.params.id);
	    Box.findOne({id: req.params.id}, function(err, box){
	      if (err) console.log(err);
	      if (box){
			    res.render('editbox', {
			      title: 'Kolabria'
			      , user: user
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
	User.findById(req.session.user_id, function(err, user) {
	  if (user) {
	    console.log('Edit Box: ID -  ', req.params.id);
	    Box.findOne({id: req.params.id}, function(err, box) {
	    	if(err) console.log(err);
	      if (box){
		      box.name = req.body.box_name;
		      box.save(function(err) {
			  	  if (err) console.log(' Box edit box update failed');
		      });
		      res.local('layout', 'uloginlayout');
			  	res.render('editbox', {
		        title: 'Kolabria'
		        , user: user
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
	User.findById(req.session.user_id, function(err, user){
		if (user) {
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
						res.local('layout', 'uloginlayout');
						res.render('editbox', {
					        title: 'Kolabria'
					        , user: user
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
	User.findById(req.session.user_id, function(err, user) {
	  if (user) {
	    //console.log('Edit Box share: ID -  ', req.params.id);
	    //console.log('Edit Box unshare: Box id to remove: ', req.params.sb);
	    Box.findOne({id: req.params.id}, function(err, box) {
	      if(err) console.log(err);
	      if (box){
			  for (i=0; i++ ; i<box.shareList.length){  //  this is wrong and doesn't work properly
				 if (box.shareList[i].boxID == req.params.sb){
					break;
			     }
			  }
			  box.shareList[i-1].remove();  // proabrly wrong too 
		      box.save(function(err) {
			    	if (err) console.log(' Box edit box update failed');
		      });
		      res.local('layout', 'uloginlayout');
			  	res.render('editbox', {
		        title: 'Kolabria'
		        , user: user
		        , box: box
		        , shareList: box.shareList
		      });
		    }
		  });
	    }
	});
});

/**
* User Views
**/
app.get('/userwalls', requiresLogin, function(req,res){	
	var w;
	User.findById(req.session.user_id, function(err, user) {
	    if (user) {
		  if (!user.freeAcct) {
			Iwall.find({ user_id: req.session.user_id}, function(err, walls) {
				  if(err){
				    console.log(err);
				  }
                  res.local('layout', 'uloginlayout');
		          res.render('userwalls', {
		             title: 'Kolabria'
		           , user: user
		           , walls: walls
		           , hostname: hostname
	              });
	        });
	      }
	      else {
		    Iwall.find({ user_id: req.session.user_id}, function(err, walls) {
			  if(err){
			    console.log(err);
			  } 
			  if (walls.length == 0) {
	              w = new Iwall();
			      w.user_id = req.session.user_id;
				  w.company_id = w.user_id;
				  w.PIN = newPIN();
				  w.name = user.name+newPIN();
			      w.defaultWall_ID = w.id;
			      w.shareURL = (Math.random() * 1000 << 1000);
			      w.createdOn = new Date();
			      w.timesOpened = 0;
				  w.save(function(err) {
				    if (err) console.log('New wall add failed');
				  });
	          }
	          else {
		        w = walls[0];
	          }
			  res.local('layout', 'uloginlayout');
			  res.render('fuwall', {
		         title: 'Kolabria'
		       , user: user
		       , wall: w
		       , hostname: hostname
	          });
			});
          }
	    }	
	});
});

// add new user wall
app.post('/userwalls.:format?', requiresLogin, function(req,res){
	User.findById(req.session.user_id, function(err, user){
	  if (user) {
		//console.log('user: ',user.name);
		if (user.numWalls) {
		  user.numWalls=user.numWalls+1;
	    }
	    else
	      user.numWalls = 1;
		user.save(function(err){
			if(err) console.log('userwall count save fail');
		});
	  }
	});
	var w = new Iwall();
	w.user_id = req.session.user_id;
	w.company_id = w.user_id;
	w.PIN = newPIN();
	w.name = req.body.wall_name;
    w.defaultWall_ID = w.id;
    w.shareURL = (Math.random() * 1000 << 1000);
    w.createdOn = new Date();
    w.timesOpened = 0;
	w.save(function(err) {
	  if (err) console.log('New wall add failed',err);
	});
	res.redirect('/userwalls');
});

// called to delete wall from each user who it is shared with
removeSharedWith = function(sharers, wallId){
// find each sharer and remove wall from Shared with me
  for (i=0;i<sharers.length;i++) {
	User.findOne({Email: sharers[i]},function(err,suser){
	  if (err) console.log(err);
	  if (suser){
		  for (i=0; i<=suser.SharedWithMe.length ; i++){  
			 if (suser.SharedWithMe[i].wallID == wallId){
				suser.SharedWithMe.splice(i,1);
				suser.save(function(err){
					if(err) console.log('Could not remove (save error) shared wall from user',err);
				});
				break;
		     }
		  }
	  }
	});
  }
}

removePubedTo = function(pubedTo, wallId) {
	for (i=0;i<pubedTo.length; i++){
			Box.findOne({name: pubedTo[i]},function(err,box){
			  if (err) console.log(err);
			  if (box){
				  for (i=0; i<=box.pubList.length ; i++){  
					 if (box.pubList[i].wallID == wallId){
						box.pubList.splice(i,1);
						box.save(function(err){
							if(err) console.log('Could not remove (save error) shared wall from user',err);
						});
						break;
				     }
				  }
			  }
			});
		}
	}

// remove user wall
app.delete('/userwalls/:id.:format?', requiresLogin, function(req,res){
  console.log('Remove User Wall: ID -  ', req.params.id);
  User.findById(req.session.user_id, function(err, user){
    if (user) {
	  user.numWalls=user.numWalls-1;
	  user.save(function(err){
		if(err) console.log('userwall count save fail');
	  });
    }
  });
  Iwall.findById(req.params.id, function (err, wall){
	if(err) console.log(err);
	if(wall){
		//  remove from all shared users list of sharedWithMe list 
		removeSharedWith(wall.userSharedWith,req.params.id);
		// remove from all boxes pubList 
		removePubedTo(wall.publishedTo, req.params.id);
		deleteWall(req.params.id);  // delete drawing wall and paths
		wall.remove();
	}
  });
  res.redirect('/userwalls');
});

// edit user wall info 	
app.get('/userwalls/:id.:format?/edit', requiresLogin, function(req,res){      
	res.local('layout', 'uloginlayout');
	User.findById(req.session.user_id, function(err, user){
	  if (user) {
	    Iwall.findById(req.params.id, function(err, wall){
	      if (err) console.log(err);
	      if (wall){
			    res.render('editwall', {
			      title: 'Kolabria'
			      , user: user
			      , wall: wall
			      , userList: wall.userSharedWith
			    });
		    }
		  });
	  }
	});
	//TODO redirect to error page
});

// edit wallinfo - update wall name	
app.put('/userwalls/:id.:format?', requiresLogin, function(req,res){ 
	console.log('wall id: ',req.params.id);
	res.local('layout', 'uloginlayout');
	User.findById(req.session.user_id, function(err, user){ 
	  if (user) { 
		Iwall.findById(req.params.id, function(err, wall){
	      if (err) console.log(err);
	      if (wall){
		        wall.name = req.body.wall_name;
		        wall.save((function(err) {
				  	  if (err) console.log(' Wall edit wall update failed');
			    }));
			    res.render('editwall', {
			      title: 'Kolabria'
			      , user: user
			      , wall: wall
			      , userList: wall.userSharedWith
			    });
		  }
		});
	  }
	});
});

//Box.findOne({id: req.params.id}, function(err, box) {
//	Box.findOne({name: req.body.data}
		
//  share wall with another user 
app.put('/userwalls/:id.:format?/share', requiresLogin, function(req,res){ 
	console.log('adding user email: ',req.body.data);
	res.local('layout', 'uloginlayout');
	User.findById(req.session.user_id, function(err, user){ 
	  if (user) { 
		Iwall.findById(req.params.id, function(err, wall){
	      if (err) console.log(err);
	      if (wall){
		    if (wall.userSharedWith.indexOf(req.body.data) == -1) {  // check to see if already sharing with this use
			    // add user email to shared wall list and add wallid to User list of walls shared with that user 
			    User.findOne({Email: req.body.data},function(err,suser){
				  if (err) console.log(err);
				  if (suser){
					suser.SharedWithMe.push({wallID: wall.id, wallName: wall.name});
					//console.log('User to share with: ',suser);
					suser.save(function(err){
						if(err) console.log('Could not save new shared wall with user',err);
					});
					wall.userSharedWith.push(req.body.data);
			        wall.save((function(err) {
						  if (err) console.log(' Wall edit wall update failed');
				    }));
				    res.redirect('/userwalls/'+req.params.id+'/edit');
				  }
				  else {  
					// error if user doesn't exist.
					console.log('User not found');
					req.flash('error',"No user registed by that email");
					res.render('editwall', {
				      title: 'Kolabria'
				      , user: user
				      , wall: wall
				      , userList: wall.userSharedWith
				    });
				  }
			    });			
		    }
		    else {
				req.flash('error',"Wall already shared with this user");
				res.render('editwall', {
			      title: 'Kolabria'
			      , user: user
			      , wall: wall
			      , userList: wall.userSharedWith
			    });
		    }
		  }
		  else res.redirect('/userwalls/'+req.params.id+'/edit');
		});
	  }
	  else res.redirect('/userwalls/'+req.params.id+'/edit');
	});
});


// Remove user from sharing wall 
app.delete('/userwalls/:id.:format?/unshare/:email', requiresLogin, function(req,res){ 
	//console.log('user to remove: ',req.params.email);
	res.local('layout', 'uloginlayout');
	User.findById(req.session.user_id, function(err, user){ 
	  if (user) { 
		Iwall.findById(req.params.id, function(err, wall){
	      if (err) console.log(err);
	      if (wall){
		    // remove user email to shared wall list and remove wallid to User list of walls shared with that user 
		    //console.log('length of share list: ',wall.userSharedWith.length);
		    for (i=0; i <= wall.userSharedWith.length; i++){
		      if (wall.userSharedWith[i] == req.params.email){
			    //console.log('Removing: ',wall.userSharedWith[i]);
			    wall.userSharedWith.splice(i,1);
			    wall.save((function(err) {
					  if (err) console.log(' Wall edit wall update failed');
			    }));
			    break;
		      }	
	    	}
	        User.findOne({Email: req.params.email},function(err,suser){
			  if (err) console.log(err);
			  if (suser){
				  for (i=0; i<=suser.SharedWithMe.length ; i++){  
					 if (suser.SharedWithMe[i].wallID == wall.id){
						suser.SharedWithMe.splice(i,1);
						suser.save(function(err){
							if(err) console.log('Could not remove (save error) shared wall from user',err);
						});
						break;
				     }
				  }
			  }
			});
		    res.render('editwall', {
		      title: 'Kolabria'
		      , user: user
		      , wall: wall
		      , userList: wall.userSharedWith
		    });
		  }
		});
	  }
	});
});

//  publish wall to a box 
app.put('/userwalls/:id.:format?/publish', requiresLogin, function(req,res){ 
	console.log('box id to publish to: ',req.body.data);
	res.local('layout', 'uloginlayout');
	User.findById(req.session.user_id, function(err, user){ 
	  if (user) { 
		Iwall.findById(req.params.id, function(err, wall){
	      if (err) console.log(err);
	      if (wall){
		    if (wall.publishedTo.indexOf(req.body.data) == -1) {  // check to see if already published to this box
			    // add user email to shared wall list and add wallid to User list of walls shared with that user 
			    Box.findOne({name: req.body.data},function(err,box){
				  if (err) console.log(err);
				  if (box){
					box.pubList.push({wallID: wall.id, wallName: wall.name});
					//console.log('User to share with: ',suser);
					box.save(function(err){
						if(err) console.log('Could not save new published wall to box',err);
					});
					wall.publishedTo.push(req.body.data);
			        wall.save((function(err) {
						  if (err) console.log(' Wall edit publish to box update failed');
				    }));
				    res.redirect('/userwalls/'+req.params.id+'/edit');
				  }
				  else {  
					// error if user doesn't exist.
					console.log('User not found');
					req.flash('error',"No Controller registed by that name");
					res.render('editwall', {
				      title: 'Kolabria'
				      , user: user
				      , wall: wall
				      , userList: wall.userSharedWith
				    });
				  }
			    });			
		    }
		    else {
				req.flash('error',"Wall already published");
				res.render('editwall', {
			      title: 'Kolabria'
			      , user: user
			      , wall: wall
			      , userList: wall.userSharedWith
			    });
		    }
		  }
		  else res.redirect('/userwalls/'+req.params.id+'/edit');
		});
	  }
	  else res.redirect('/userwalls/'+req.params.id+'/edit');
	});
});


// Remove controller  from published wall 
app.delete('/userwalls/:id.:format?/unpublish/:name', requiresLogin, function(req,res){ 
	//console.log('user to remove: ',req.params.email);
	res.local('layout', 'uloginlayout');
	User.findById(req.session.user_id, function(err, user){ 
	  if (user) { 
		Iwall.findById(req.params.id, function(err, wall){
	      if (err) console.log(err);
	      if (wall){
		    // remove user email to shared wall list and remove wallid to User list of walls shared with that user 
		    //console.log('length of share list: ',wall.userSharedWith.length);
		    for (i=0; i <= wall.publishedTo.length; i++){
		      if (wall.publishedTo[i] == req.params.name){
			    //console.log('Removing: ',wall.userSharedWith[i]);
			    wall.publishedTo.splice(i,1);
			    wall.save((function(err) {
					  if (err) console.log(' Wall edit wall update failed');
			    }));
			    break;
		      }	
	    	}
	        Box.findOne({name: req.params.name},function(err,box){
			  if (err) console.log(err);
			  if (box){
				  for (i=0; i<=box.pubList.length ; i++){  
					 if (box.pubList[i].wallID == wall.id){
						box.pubList.splice(i,1);
						box.save(function(err){
							if(err) console.log('Could not remove (save error) shared wall from user',err);
						});
						break;
				     }
				  }
			  }
			});
		    res.render('editwall', {
		      title: 'Kolabria'
		      , user: user
		      , wall: wall
		      , userList: wall.userSharedWith
		    });
		  }
		});
	  }
	});
});

// Change user password
app.get('/account', requiresLogin, function(req,res){	
	User.findById(req.session.user_id, function(err, user) {
	  if (user) {
			res.local('layout', 'uloginlayout');
		    res.render('account', {
		      title: 'Kolabria'
		      , user: user
	      });
	  }
	});
});

app.post('/account', requiresLogin, function(req,res){	
	User.findById(req.session.user_id, function(err, user) {
	  if (user) {
		if (user && user.authenticate(req.body.currentPwd,user.password)) {
			if (req.body.newPwd == req.body.confirmPwd)
			{
			  user.password = req.body.newPwd;
			  user.save(function(err) {
			    if (err) console.log('Password updated failed');
			  });
			  req.flash('success',"Password Updated");  // this shouldn't be an error 
			  res.redirect('/account');
		    }
		    else {
			  req.flash('error',"New Passwords don't match");
			  res.redirect('/account');
		    }
		}
		else {
			req.flash('error',"Old Password Incorrect");
			res.redirect('/account');
		}
	  }
	});
});

// upgrade from free to paid account 

app.post('/acct-upgrade', requiresLogin, function(req,res){	
	User.findById(req.session.user_id, function(err, user) {
	  if (user) {
		if (req.body.authcode == 'MapleLeaf') {
			user.freeAcct = false;
		    user.save(function(err) {
		      if (err) return userSaveFailed();
		      req.flash('success', 'Your account has been upgraded');
		      console.log('Account Created');
		      res.redirect('/account');
		    });
		}
		else {
			req.flash('error',"Invalid Code");
			res.redirect('/account');
		}
	  }
    });
});
/**
* Controller list of published walls 
**/
app.get('/host/list', function(req,res){
	if (bid = getBoxFromUA(req.headers['user-agent'])){
	//	console.log('Box ID: ',bid);
		Box.findOne({ id: bid} , function(err, box) {
		//	console.log(box);
		  if(err) console.log(err);
		  if (box) {
			res.local('layout', 'boxlayout'); 
			res.render('boxwalls',{ 
			  	title: 'Host Wall"', box: box, ie: false
		    });
		  } 
		  else {    //	box not found  
            console.log("Bad BID: ", bid);
		    res.local('layout', false); 
		    res.render('apperror',{ bid: bid});
		  }
	  });	
	}
});

// remove published wall from box
app.delete('/published/:id.:format?/', function(req,res){
	if (bid = getBoxFromUA(req.headers['user-agent'])){
	//	console.log('Box ID: ',bid);
		Box.findOne({ id: bid} , function(err, box) {
		//	console.log(box);
		  if(err) console.log(err);
		  if (box){
			  for (i=0; i<=box.pubList.length ; i++){  
				 if (box.pubList[i].wallID == req.params.id){
					box.pubList.splice(i,1);
					box.save(function(err){
						if(err) console.log('Could not remove (save error) shared wall from user',err);
					});
					break;
			     }
			  }
			  Iwall.findOne({ _id: req.params.id}, function(err, wall) {
			    if (err) console.log(err)
			    if (wall) {
					for (i=0; i <= wall.publishedTo.length; i++){
					  if (wall.publishedTo[i] == box.name){
					    //console.log('Removing: ',wall.userSharedWith[i]);
					    wall.publishedTo.splice(i,1);
					    wall.save((function(err) {
							  if (err) console.log(' Wall edit wall update failed');
					    }));
					    break;
					  }	
					}
		    	}
		      });
		   }  
		   res.redirect('/host/list/');  
	  });	
	}
});

// create a new wall on the box
app.get('/host/list/new', function(req,res){
	if (bid = getBoxFromUA(req.headers['user-agent'])){
		console.log('create new wall for - Box ID: ',bid);
		Box.findOne({ id: bid} , function(err, box) {
		//	console.log(box);
		  if(err) console.log(err);
		  if (box){
			var pin = newPIN();
			var w = new Iwall();
			w.user_id = box.oid;
			w.company_id = box.oid;
			w.PIN = pin;
			var d = new Date();
			//w.name = box.name+' - '+d.toUTCString();  // 
			w.name = box.name+'-'+d.getMonth()+'/'+d.getDate()+'/'+d.getFullYear()+'-'+(Math.floor((Math.random()*100)+1));   
		    w.defaultWall_ID = w.id;
		    w.shareURL = (Math.random() * 1000 << 1000);
		    w.createdOn = new Date();
		    w.timesOpened = 0;
		   // console.log('new wall ID: ',w.id);
		   // console.log('new wall: ',w);
			w.save(function(err) {
			  if (err) console.log('New wall add failed: ',err);
			});
			box.localList.push({wallID: w.id, wallName: w.name, PIN: pin });
			//console.log('User to share with: ',suser);
			box.save(function(err){
				if(err) console.log('Could not save new local wall to box',err);
			});			
			
		    res.redirect('/host/list/');
		  }
		  else {
			console.log("Bad BID: ", bid);
			res.local('layout', false); 
			res.render('apperror',{ bid: bid});
	      }
	  });	
	}
});

// remove local wall from box
app.delete('/host/list/:id.:format?/', function(req,res){
	if (bid = getBoxFromUA(req.headers['user-agent'])){
	//	console.log('Box ID: ',bid);
		Box.findOne({ id: bid} , function(err, box) {
		//	console.log(box);
		  if(err) console.log(err);
		  if (box){
			  for (i=0; i<=box.localList.length ; i++){  
				 if (box.localList[i].wallID == req.params.id){
					box.localList.splice(i,1);
					box.save(function(err){
						if(err) console.log('Could not remove (save error) shared wall from user',err);
					});
					break;
			     }
			  }
			  Iwall.findById(req.params.id, function (err, wall){
				if(err) console.log(err);
				if(wall){
					wall.remove();
				}
				deleteWall(req.params.id);
			  });
		   }  
		   res.redirect('/host/list/');  
	  });	
	}
});
//  Assign local wall to a user
// remove local wall from box
app.post('/host/list/:id.:format?/assign', function(req,res){
	if (bid = getBoxFromUA(req.headers['user-agent'])){
	//	console.log('Box ID: ',bid);
		Box.findOne({ id: bid} , function(err, box) {
		//	console.log(box);
		  if(err) console.log(err);
		  if (box){
			  Iwall.findById(req.params.id, function (err, wall){
				if(err) console.log(err);
				if(wall){
					console.log('email to assign wall: ',req.body.email);
					User.findOne({ Email: req.body.email }, function(err, user) {
						if (user) {
							if (user.numWalls) {
							  user.numWalls=user.numWalls+1;
						    }
						    else
						      user.numWalls = 1;
							user.save(function(err){
							  if(err) console.log('userwall count save fail');
							});
							box.pubList.push({wallID: wall.id, wallName: wall.name});
							//console.log('User to share with: ',suser);
							box.save(function(err){
								if(err) console.log('Could not save new published wall to box',err);
							});
							console.log("user found");
							wall.user_id = user.id;  // assign wall to this user
							wall.company_id = user.id;					
							wall.publishedTo.push(box.name);
					        wall.save((function(err) {
								  if (err) console.log(' wall save failed: assign to user: ',err);
						    }));
						    for (i=0; i<=box.localList.length ; i++){  
							  if (box.localList[i].wallID == req.params.id){
							    box.localList.splice(i,1);
								box.save(function(err){
									if(err) console.log('Assign: removeing local wall',err);
								});
								break;
						      }
						    }
						    res.redirect('/host/list/');  
						}
						else{
							console.log("user not found");
							req.flash('error',"Unable to find assignee");
							res.redirect('/host/list/');  
						}
					});
				}
			  });

		   }  
		   
	  });	
	}
});

app.post('/host/list/:id.:format?/rename', function(req,res){
	console.log('rename local wall- wallid:',req.params.id,' new name: ',req.body.wallName);
	if (bid = getBoxFromUA(req.headers['user-agent'])){
		Box.findOne({ id: bid} , function(err, box) {
		  if(err) console.log(err);
		  if (box){	
			  Iwall.findById(req.params.id, function (err, wall){
				if(err) console.log(err);
				if(wall){
					for (i=0; i<=box.localList.length ; i++){  
					  if (box.localList[i].wallID == req.params.id){
					    box.localList[i].wallName = req.body.wallName;
						box.save(function(err){
							if(err) console.log('Rename: local wall',err);
						});
						break;
				      }
				    }
				    wall.name = req.body.wallName;
					wall.save((function(err) {
						  if (err) console.log(' wall save failed: assign to user: ',err);
				    }));
				}
			  });
	      }
	    res.redirect('/host/list/'); 
	    });
    }
});

//  draw from list of walls on box 

app.get('/published/:id.:format?/draw', function(req,res){  
  res.local('layout', 'publishdraw'); 
  res.local('title', 'Published Wall'); 
  bid = req.headers['user-agent'].substr(req.headers['user-agent'].search("WWA"));
//	console.log('Box ID: ',bid);
  Box.findOne({ id: bid}, function(err, rbox) {
    if (err) console.log(err)
    //console.log("wall name: ",req.params.id);
    Iwall.findOne({ _id: req.params.id}, function(err, wall) {
	    if (err) console.log(err)
	    if (wall) {
		  	//console.log('wall: ',wall);
		    wall.lastOpened = new Date();
		    wall.timesOpened = wall.timesOpened +1;
			wall.save(function(err) {
			  if (err) console.log('New wall add failed: ',err);
			});
			joinMeeting(wall.id,rbox.name,'box');
		    res.render('draw',{
		    	 wall: wall , rbox: rbox , ie: false, jslibcomp: jslibcomp
	    	});
    	}
        else {
	     req.flash('error',"Unable to open WikiWall");
	     res.redirect('/host/list/');  
	    }  
    });		
  });
});

//  ********  sys admin view *********
app.get('/sysadmin', requiresSysLogin, function(req,res){	
	User.find({}, function(err, users) {
	  if(err) console.log(err);
	    Box.find({}, function(err, boxes) {
			if(err) console.log(err);
			var totalPaths=0;
			var avg = 0; 
			Wall.find({},function(err,walls){
				if(err) console.log(err);
				if (walls){
					for (i=0; i < walls.length; i++){
						totalPaths = totalPaths + walls[i].paths.length;	
					}
				}
				avg = totalPaths / walls.length;
				Meeting.find({},function(err,meetings){
					if (err) console.log(err);
					res.local('layout', 'uloginlayout');
			        res.render('sysadmin', {
			           title: 'Kolabria'
			          , user: 'sysadmin'
			          , users: users
			          , boxes: boxes
			          , avgPath: avg
			          , meetings: meetings
		            });
				})
	         });
	    });	
	});
});

app.delete('/sysadmin/user/:id.:format?/', requiresSysLogin, function(req,res){
   //console.log('remove user: ',req.params.id);
   // find user and remove
   // remove all iwalls, walls, shared with, published 
  User.findById(req.params.id, function(err, user){
    if (user) {
	  console.log('user id:',user.id);
	  Iwall.find({user_id: user.id},function(err,walls){
		if (walls){
		//	console.log('walls found: ', walls.length);
			var cnt = walls.length;
			for (i=0; i < cnt ; i++){
				console.log('wall to remove',walls[i].id);
				console.log('index: '+i+' lenght: '+cnt);
				var userSharedWith = walls[i].userSharedWith;
				console.log('shared with: ',userSharedWith);
				var wallId = walls[i].id;
				var publishedTo = walls[i].publishedTo;
				console.log('share list length: ', userSharedWith.length);
				if (userSharedWith.length >0)  removeSharedWith(userSharedWith,wallId);
				// remove from all boxes pubList 
				if (publishedTo.length > 0) removePubedTo(publishedTo, wallId);
				deleteWall(wallId);  // delete drawing wall and paths
				walls[i].remove();
			}	
		}
	  });
	  user.remove();
	  req.flash('error',"User Removed");
	  res.redirect('/sysadmin/'); 
    }
    else {
	  req.flash('error',"Unable to remove user");
	  res.redirect('/sysadmin/'); 
    }
  });
});

// show details about walls for a user 

app.get('/sysadmin/:id.:format?/details', requiresSysLogin, function(req,res){
 // console.log('user details: ',req.params.id);
  User.findById(req.params.id, function(err, user){
    if (user) {
      Iwall.find({user_id: req.params.id},function(err,walls){
        if (walls){
	      	Meeting.find({ownerId: req.params.id},function(err,meetings){
				if (err) console.log(err);
				//console.log('walls found: ', walls.length);
	            res.local('layout', 'uloginlayout');
	            res.render('syswalldetails', {
	               title: 'Kolabria'
	              , walls: walls
	              , user: user
	              , meetings: meetings
	            });
			});
	    }
      });
    }
  });
});


joinMeeting = function(wallId, name, from){
	//console.log('joinMeeting- wId: '+wallId+' name: '+name);	
	Meeting.find({wallId: wallId})
	.where('active').equals(true)
	.exec(function(err,m){
		if (err) console.log(err);
		if (m.length >0) {
			// found active meeting so add participant
			//console.log('found an existing meeting', m[0]);
			m[0].currentParticipants=m[0].currentParticipants+1;
			m[0].maxParticipants=m[0].maxParticipants+1;
			switch (from){
				case 'user': 
				  m[0].fromUser = true;
				  break;
				case 'box': 
				  m[0].fromBox = true;
				  break;
				case 'url': 
				  m[0].fromURL = true;
				  break;
				case 'join': 
				  m[0].fromJoin = true;
				  break;
			}
			m[0].save(function(err) {
			  if (err) console.log('meeting add participant failed: ',err);
			});
		}
		else {
			// no active meeting so start one. 
			//console.log('create a new meeting');
			Iwall.findById(wallId, function (err, wall) { 
				if (err) console.log(err);
				if (wall) {
					var nm = new Meeting();
					nm.active = true;
					nm.wallId = wallId;
					
					nm.ownerId = wall.user_id;
					console.log('ownerId: ',nm.ownerId);
					nm.currentParticipants = 1;
					nm.maxParticipants = 1;
					switch (from){
						case 'user': 
						  nm.fromUser = true;
						  break;
						case 'box': 
						  nm.fromBox = true;
						  break;
						case 'url': 
						  nm.fromURL = true;
						  break;
						case 'join': 
						  nm.fromJoin = true;
						  break;
					}
					nm.startTime = new Date();

					nm.save(function(err) {
					  if (err) console.log('new meeting save failed: ',err);
					});
				}
			});
		}
	});	
}
leaveMeeting = function(wallId, name){
	//console.log('leaveMeeting- wId: '+wallId+' name: '+name);	
	Meeting.find({wallId: wallId})
	.where('active').equals(true)
	.exec(function(err,m){
		if (err) console.log(err);
		if (m.length >0) {
			// found active meeting so delete participant
			//console.log('found an existing meeting', m[0]);
			if (m[0].currentParticipants > 1) {
				m[0].currentParticipants=m[0].currentParticipants-1;
			}
			else{
				//  if last participant then end meeting
				m[0].currentParticipants=0;
				m[0].active = false;
				m[0].stopTime = new Date();
			}
			m[0].save(function(err) {
			  if (err) console.log('meeting add participant failed: ',err);
			});
		}
		else {
			console.log('leaveMeeting: no active meeting found');
		}
	});	
}




/**
* Drawing Views
**/
// user draw view  
app.get('/user/:id.:format?/draw', function(req,res){
  var ie = useragent.is(req.headers['user-agent']).ie;
  console.log(" wall id:  ",req.params.id);
  res.local('layout', 'userdraw'); 
  if (req.session.user_id) {
	User.findById(req.session.user_id, function(err, user) {
		if (user){
			Iwall.findById(req.params.id, function (err, wall) {
			  if(err) console.log(err);
			  if(wall){
				wall.lastOpened = new Date();
				wall.timesOpened = wall.timesOpened +1; 
				wall.save(function(err) {
				  if (err) console.log('New wall add failed: ',err);
				});
				joinMeeting(wall.id,user.name,'user');
				res.render('draw',
				   	{ 
					title: 'Kolabria', wall: wall, userName: user.name, ie: ie, jslibcomp: jslibcomp 
			      });
			  }
			  else console.log("can't find wall");
		    });	
		}
	  });
  }
  else {
	req.flash('error',"Login session expired");
    res.redirect('/ulogin');		
  }
  
});

// join a shared user wall 

app.get('/suw/:wurl.:format?', function(req,res){
  res.local('layout', 'sitelayout');
  res.local('title', 'Kolabria - Join A Wall')
  res.render('joinuserwall',{
    wurl: req.params.wurl
  });
});


app.post('/suw', function(req,res){
	var ie = useragent.is(req.headers['user-agent']).ie;
	res.local('layout', 'userdraw'); 
	console.log(' shareURL: ',req.body.wurl);
	console.log(' name:', req.body.name);
	Iwall.findOne({ shareURL: req.body.wurl}, function(err, wall) {
	  if(err) console.log(err);
	  if(wall){
	    wall.lastOpened = new Date();
	    wall.timesOpened = wall.timesOpened +1;
		wall.save(function(err) {
			  if (err) console.log('New wall add failed: ',err);
		});
		joinMeeting(wall.id,req.body.name,'url');
		res.render('draw',
		   	{ 
			title: 'Kolabria', wall: wall, userName: req.body.name, ie: ie, jslibcomp: jslibcomp 
	      });
	  }
	  else console.log("can't find wall");
    });
});




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
    // console.log('Box Id: ',getBoxFromUA(req.headers['user-agent']));
	if (bid = getBoxFromUA(req.headers['user-agent'])){
	//	console.log('Box ID: ',bid);
		Box.findOne({ id: bid} , function(err, box) {
		//	console.log(box);
		  if(err){
			console.log(err);  // this doesn't work  - need to fix at some point - doesn't work since if no BID then never gets here
              // this doesn't work  - need to fix at some point 
                        console.log("Bad BID: ", bid);
			res.local('layout', false); 
			res.render('apperror',{ bid: bid});
		  } 
		  else {
		//	console.log('Box: ',box); 
			res.local('layout', 'hostappliance'); 
			res.local('title', 'Host Wall')
			res.render('draw',{ 
			  	box: box, ie: false, jslibcomp: jslibcomp
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

// drawing view from box shared wall list
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
	    	 hbox: hbox , rbox: rbox , ie: false, jslibcomp: jslibcomp
    	});
    });		
	});
});
// drawing view from boxes pub list 
app.get('/published/:id.:format?/draw', function(req,res){  
  res.local('layout', 'publishdraw'); 
  res.local('title', 'Published Wall'); 
  bid = req.headers['user-agent'].substr(req.headers['user-agent'].search("WWA"));
//	console.log('Box ID: ',bid);
  Box.findOne({ id: bid}, function(err, rbox) {
    if (err) console.log(err)
    //console.log("wall name: ",req.params.id);
    Iwall.findOne({ _id: req.params.id}, function(err, wall) {
	    if (err) console.log(err)
	    if (wall) {
		  	//console.log('wall: ',wall);
		    wall.lastOpened = new Date();
		    wall.timesOpened = wall.timesOpened +1;
			wall.save(function(err) {
			  if (err) console.log('New wall add failed: ',err);
			});
			joinMeeting(wall.id,rbox.name,'box');
		    res.render('draw',{
		    	 wall: wall , rbox: rbox , ie: false, jslibcomp: jslibcomp
	    	});
    	}
        else {
	     req.flash('error',"Unable to open WikiWall");
	     res.redirect('/host/list/');  
	    }  
    });		
  });
});

app.post('/fileUpload/:cId.:format?/:wallId', function(req,res){
	   // console.log("companyId: "+req.params.cId+" wallId: "+req.params.wallId);
	var extractedData = "";
	var parser = new xml2js.Parser({explicitArray: false});
//	var urla = 'http://api.scribd.com/api?method=docs.uploadFromUrl&url=http%3A%2F%2Fpoints.kolabria.com%2Fuploads%2F';
	var urla = 'http://api.scribd.com/api?method=docs.uploadFromUrl&url=http%3A%2F%2Fwww.kolabria.com%2Fuploads%2F';
	var urlb = '&doc_type=';
	var urlc = '&access=private&api_key=piz0wdlic7ofzxpd2ewg';
	var fileName = req.header('x-file-name');
	var fileType = fileName.substr(fileName.lastIndexOf(".")+1,3);
	
	console.log('fileUpload - filename: '+fileName+' fileType: '+fileType);
	    var uploadDir = __dirname + '/public/uploads/';
	    uploadFile(req, uploadDir, function(data) {
        if(data.success) {
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 200);
            if (fileType == 'ppt' || fileType == 'pdf'){
			  request( urla+fileName+urlb+fileType+urlc, function (error, response, body) {
			    if (!error && response.statusCode == 200) {
			      //console.log(body) 
				  parser.parseString(body, function(err,result){
				    if (!err){
			          extractedData = result.rsp;
			          var docId = extractedData['doc_id'];
			          var key = extractedData['access_key'];
				    //  console.log('extractedData: ',extractedData );
				      console.log('key: '+key);
				      console.log('doc_id: ',extractedData['doc_id']);
				      nowjs.getGroup('c'+req.params.cId+'u'+req.params.wallId).now.addFiles(fileName,docId,key);
                      scibdDocStatus(uploadDir,fileName, docId,key, req.params.cId,req.params.wallId );
                      
			        }
				  });
			    }
			  })
		    }
            
        }
        else
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 404);
    });	
});

var removeFile = function(uploadDir,fileName){
	fs.unlink(uploadDir+fileName, function (err) {
	  if (err) throw err;
	  console.log('successfully deleted fileName');
	});
};
var uploadFile = function(req, targetdir, callback) {
    // Direct async xhr stream data upload, yeah baby.
    if(req.xhr) {
        var fName = req.header('x-file-name');
            fSize = req.header('x-file-size'),
            fType = req.header('x-file-type'),
            ws    = fs.createWriteStream(targetdir + fName);

       //console.log('uploadFile - fType: '+fType);

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

var scibdDocStatus = function(uploadDir,fileName,docId,key, cId, wId){
	// check on status of uploaded document and signal to client it is ready to view
	var urla = 'http://api.scribd.com/api?method=docs.getConversionStatus&doc_id='
	var urlb = '&api_key=piz0wdlic7ofzxpd2ewg'
	var tId;
	console.log('scribdDocStatus - fileName: '+fileName+' docId: '+docId);
	tId = setInterval(function() {
		var extractedData = "";
		var parser = new xml2js.Parser({explicitArray: false});		
		request( urla+docId+urlb, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
			    console.log(body)
				parser.parseString(body, function(err,result){
				    if (!err){
			          extractedData = result.rsp;
			        //  console.log('scribdDocStatus - result: ',result);
			
			        //  console.log("scribdDosStatus - extractedData",extractedData);
			          var tstatus = extractedData['$'];
			          console.log('scribddocStatus - tstatus: '+tstatus+' stat: '+tstatus['stat']);
			          
			          if (tstatus['stat']== "ok"){
				          var status = extractedData['conversion_status'];
				          switch (status){
					      case "ERROR":
					         // send some sort of error message
					         console.log("scribdDocStatus: Error",body);
					         clearInterval(tId);
					         break;
					      case "PROCESSING":
					        console.log("scribdDocStatus: Processing ..");
					         break;
					         // keep going 
					      case "DISPLAYABLE":
					      case "DONE":
					         // stop timer and send tell client can display 
					         console.log("scribdDocStatus: Done");
					         clearInterval(tId);
					         removeFile(uploadDir,fileName);   // remove local copy of file
					         setTimeout(function(){
						       nowjs.getGroup('c'+cId+'u'+wId).now.enableView(fileName,docId, key);
					         },15000);
					         break; 
				          }
			          }
			          else {  
				           console.log("scribdDocStatus: fail or something else",body);
				           clearInterval(tId);     
			          }
			        }
					else{
                         console.log('scribdDocStatus - parsing error', body);
			             clearInterval(tId);
			        }
	    		});
	        }
			else{
				console.log('scribdDocStatus - Error or non OK resp', body);
			       clearInterval(tId);
			}
	    });
	},10000);       
}


app.get('/images/:file', function(req,res){

});
app.post('/images', function(req,res){

});

app.get('/sdestroy', function(req, res){
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/ulogin');
});



//Now.JS initialization

var nowjs = require("now");
var everyone = nowjs.initialize(app, {port: port});


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
  var browser = this.now.browser;
  var bversion = this.now.bversion; 
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

  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(client).now.pushUser(name, client, browser, bversion);
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(client).getUsers(function(users){
    async.forEach(users, function(item, callback){
      nowjs.getClient(item, function(){
        usernames.push({
            name: this.now.name
            , id: this.user.clientId
            , browser: this.now.browser
            , bversion: this.now.bversion
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

everyone.now.sendImage = function(src,player, position, callback){
  boxID = this.now.boxID;
  companyId = this.now.companyId;
  wallId = this.now.wallId;
  clientId = this.user.clientId;
   Path.create({
    layer: player
    , opacity: 1 //For now, make variable later
    , description: {file: src, position:{x:position._x, y:position._y}}
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
  	  nowjs.getGroup('c'+companyId+'u'+wallId).exclude(clientId).now.receiveFilesCanvas(player, src, position, doc._id);
      callback(doc._id);
    });
  });
}

nowjs.on('disconnect', function(){
//	console.log('now disconnect');
	
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.pullUser(this.now.name, this.user.clientId);
  delete boxes[this.now.boxID];
  leaveMeeting(this.now.wallId,this.now.name);
});

everyone.now.serverLog = function(msg){
	var name = this.now.name;
        var d = new Date();
	console.log(d+"  Remote Log from: "+name+" msg: "+msg);
	
}

// power point viewer
everyone.now.sendViewerOpen = function(doc,key){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.viewerOpen(doc,key);
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

everyone.now.sendScreenCapture = function(cmd){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.screenCapture(cmd);
}
everyone.now.sendVideoConf = function(){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.videoConf();
}

everyone.now.actionMeeting = function(wallId, name, action){
//	console.log('ActionMeeting- wId: '+wallId+' name: '+name+' Action:'+action);	
	Meeting.find({wallId: wallId})
	.where('active').equals(true)
	.exec(function(err,m){
		if (err) console.log(err);
		if (m.length >0) {
			switch (action){
				case 'goVC':
				  m[0].vcUsed = true;
				  break;
				case 'goSS':
				  m[0].ssUsed = true;
				  break;
				case 'goSSCapture':
				  m[0].ssCapture = true;
				  break;
				case 'goEImg':
				  m[0].embeddedImage = true;
				  break;
			}		
			m[0].save(function(err) {
			  if (err) console.log('meeting add action failed: ',err);
			});
		}
		else {
			console.log('actionMeeting: no active meeting found');
		}
	});	
}
