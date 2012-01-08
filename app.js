
/**
 * Module dependencies.
 */

var express = require('express');
//var mongoose = require('mongoose'),
//    db;
var port = process.env.VCAP_APP_PORT || 3000;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

//  db = mongoose.connect('mongodb://localhost/wwall');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// database setup 


// Wall = require('./models.js').Wall(db);  old way to do it. 
//var Schema = mongoose.Schema,
  //  ObjectId = Schema.ObjectId;

//var wallSchema = new Schema({
//	title   : String,
//	wall_id : String,
//	user_id : String
//});

//mongoose.model('Wall',wallSchema);
//var Wall = mongoose.model('Wall');
// or 
// var myWalls = mongoose.model('Wall',wallSchema);

//var oneWall = new Wall();

//oneWall.title = 'brain stuff';
//oneWall.wall_id = '1';
//oneWall.user_id = 'bob 121';

//oneWall.save(function (err){
	//
//});

//Wall.find({},function (err,mw){
//	if(err) {throw err;}
 //	mw.forEach(function(oneWall){
//		console.log(oneWall.title);
//	});	
//});

var walls = require('./wall');

console.log('walls: '+ walls.all[1].name);


// Routes

app.get('/', function(req, res){
  res.local('/', false);
  res.render('index', {
    title: 'Kolabria'
    });
});

app.get('/login', function(req, res){
  res.local('login', false);
  res.render('login', {
    title: 'wikiwall'
    });
});
app.get('/draw', function(req, res){
  res.local('layout', false);
  res.render('draw', {
    title: 'wikiwall'
    });
});
app.get('/draw2', function(req, res){
  res.local('layout', false);
  res.render('draw2', {
    title: 'wikiwall'
    });
});
app.get('/draw4', function(req, res){
  res.local('layout', false);
  res.render('draw4', {
    title: 'wikiwall'
    });
});
//  stuff used for test - remove later
//var users = [
//   { name: 'bob', age: 23, title: 'big bird'},
//   { name: 'fred', age: 33, title: 'wallbanger'}
// ];

// walls: walls.all
app.get('/walltest', function(req, res){
  console.log('walls: '+ walls.all[1].name);
  res.render('walltest', { locals: {walls: walls.all, title: 'walltest' }}
);
});
app.get('/walltest2/:id', function(req, res){
  var wall_id = req.params.id;
  console.log('walltest2: '+ wall_id);
  
  res.render('walltest2', { locals: {wall_id: wall_id, title: walls.all[wall_id-1].name }}
);
});
app.get('/draw5/:id', function(req, res){
  var wall_id = req.params.id;
  var twall = walls.find(req.params.id);
  console.log('draw5: '+ wall_id);
  res.local('layout', false);  
  res.render('draw5', { locals: {wall_id: wall_id, title: twall.name, quitLink: '/walls/'  }}
);
});
app.get('/appdraw5/:id', function(req, res){
  var wall_id = req.params.id;
  var twall = walls.find(req.params.id);
  console.log('draw5: '+ wall_id);
  res.local('layout', false);  
  res.render('draw5', { locals: {wall_id: wall_id, title: twall.name, quitLink:  '/appwalls/' }}
);
});
app.get('/walls', function(req, res){
  res.local('layout', false);
  res.render('walls', { locals: {walls: walls.all
  }});
});
app.post('/walls', function(req, res){
  if (req.body.desc){
    var wdesc = req.body.desc;	
  }  
  if (req.body.wallname){
    var wname = req.body.wallname;
    var nwall = walls.new();
    nwall.name = wname;
    nwall.description = wdesc;
    nwall.date = 'Today';
	var mainView3 = new drawView();
	index = wikiWalls.addView(mainView3);
	console.log("created new wikiWall view - index: ",index);
	nwall.paper_ref = index+1;
	var id = walls.insert(nwall);
	console.log("wallPost: created new wall: id",id);
  }
  res.local('layout', false);
  res.render('walls', { locals: {walls: walls.all
  }});
});
app.get('/appwalls', function(req, res){
  res.local('layout', false);
  res.render('appwalls', { locals: {walls: walls.all, title: 'WikiWall List'
  }});
});
app.get('/newwall', function(req, res){
  res.local('layout', false);
  res.render('newwall', { locals: {fname: 'empty' , fdesc: 'empty'
  }});
});
app.get('/newwall2', function(req, res){
	var d = new Date();
    var nwall = walls.new();
    var d2 = d.toString();
    d2 = d2.slice(0,d2.search('G'));
    nwall.name = d2;
    nwall.description = '';
    nwall.date = 'Today';
	var mainView3 = new drawView();
	index = wikiWalls.addView(mainView3);
	console.log("created new wikiWall view - index: ",index);
	nwall.paper_ref = index+1;
	var id = walls.insert(nwall);
	console.log("appwall new wall: created new wall: id",id);
  res.local('layout', false);
  res.render('appwalls', { locals: {walls: walls.all, title: 'WikiWall List'
  }});
});
app.get('/editinfo/:id', function(req, res){
  var wall_id = req.params.id;
  var twall = walls.find(req.params.id);
  console.log('edit info: '+ wall_id);
  res.local('layout', false);  
  res.render('editinfo', { locals: {wall_id: wall_id, title: twall.name, desc: twall.description }}
);
});
app.post('/editinfo/:id', function(req, res){
  var wall_id = req.params.id;
  var twall = walls.find(req.params.id);
  twall.name = req.body.wallname;
  twall.description= req.body.desc;
  console.log('edit info- update: '+ wall_id);
  res.local('layout', false);  
  res.render('editinfo', { locals: {wall_id: wall_id, title: twall.name, desc: twall.description }}
);
});
app.post('/newwall', function(req, res){
  if (req.body.wallname){
	var wname = req.body.wallname;
  }
  if (req.body.desc){
    var wdesc = req.body.desc;	
  }
  res.local('layout', false);
  res.render('newwall', { locals: {fname: wname , fdesc:  wdesc
  }});
});
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var nowjs = require("now");
//var everyone = require("now").initialize(app);
var everyone = nowjs.initialize(app);


// add point to an existing path
function pathAddPoint(p){
  var i = this.len
  this.point[i]=p;
  this.len++;
//  console.log("Point" + p.x + " : " + p.y); 
} 

// adds path to a view - method
function viewAddPath(path){
  var i = this.len
  this.path[i]=path;
  this.len++;
  //console.log("ViewAddPath"); 
  return i;
}             
// creates a point          
function drawPoint(x,y){
  this.x=x;
  this.y=y;
}

// create a draw path
function drawPath(color,width,p){
  this.color=color;
  this.width=width;
  this.point= p;
  this.len=1;
  this.addPoint=pathAddPoint;
}
// creates an image
function viewImage(img){
	this.image=img;
	//  add some stuff for the position of the image 
}
// adds image to a view - method
function viewAddImage(img){
  var i = this.ilen
  this.image[i]=img;
  this.ilen++;
  console.log("ViewAddimage"); 
  return i;
}

// creates a view 
function drawView(){
  //  put a dumby path in the new view
  var p = new drawPoint(0,0);
  var npath = new drawPath("blue", p);
  this.path= npath;
  this.len=0;
  this.image = new viewImage('filler');
  this.ilen = 0;
  this.addPath=viewAddPath;
  this.addImage=viewAddImage;
  }
// add a view to allWalls object 
function wallAddView(view){
  var i = this.len
  this.wallView[i]=view;
  this.len++;
  console.log("wallAddView");
  return i;	
}

function wallDelete(index){
  //  remove an existing wall from the list of wall 
  // todo - trouble is to remove from middle - look at array stuff
  console.log("WallRemoveView");	
}

function wallNewPath(wallIndex,start,color,width){
	var view = this.wallView[wallIndex];
	var npath = new drawPath(color, width, start);
	var i = view.addPath(npath);
	return i; 
}
function wallNewImage(wallIndex,image){
	var view = this.wallView[wallIndex];
	var nimage = new viewImage(image);
	var i = view.addImage(nimage);
	return i; 
}

function wallAddPathPoint(wallIndex,pathIndex, point){
	//console.log('wallAddPoint: wallIndex',wallIndex);
	var view = this.wallView[wallIndex];
	var npath = view.path[pathIndex];
	//console.log("wallAddPoint: view length: ",view.len);
	//console.log("wallAddPoint: path length: ",npath.len);
	//console.log('wallAddPoint: pathIndex',pathIndex);
	npath.addPoint(point);
}


// object that contains all of the walls
function wikiWalls(){
	// put a dumby mainView in the new wallview
	this.wallView = new drawView();
	this.len=0;
	this.addView=wallAddView; //  create new wall
	this.newPath=wallNewPath;  //  creating and new path within specific wall
	this.newImage=wallNewImage; // add a new image to the specific wall 
	this.addPathPoint=wallAddPathPoint;  //  add point to existing path of a specific wall
//	this.movePath=wallMovePath;  //  to move an existing path within a specific wall
	this.deleteWall=wallDelete; // remove a specific wall from list of wikiwalls 
}

var wikiWalls = new wikiWalls();

// create two new walls to match walls.js array 
// normally would do this
var mainView = new drawView(); 
var index = wikiWalls.addView(mainView);
console.log("created new wikiWall view - index: ",index);

var mainView2 = new drawView();
index = wikiWalls.addView(mainView2);
console.log("created new wikiWall view - index: ",index);

var mainPath;

// nowjs.getClient(clientId, func)

everyone.connected(function(){
  console.log("Joined: clientID: " + this.user.clientId);
//  now.getClient(this.user.clientId, now.recDrawPath(mainPath));});
//  everyone.getClient(this.user.clientId, now.recDrawPath());
});
everyone.disconnected(function(){
  console.log("Left: clientID" + this.user.clientId);
});

everyone.now.sendStart = function(wallId,pathIndex,color,width,start){
     //console.log("StartLine - wallId: ", wallId);
     pathIndex = wikiWalls.newPath(wallId,start,color,width);
     //console.log("sendStart - pathIndex",pathIndex);
     // mainPath  = new drawPath(color, start);
	 nowjs.getClient(this.user.clientId, function() {
        this.now.recPathIndex(pathIndex);
     });
     everyone.now.recStart(wallId,color,width,start);};
     
everyone.now.sendPoint = function(wallId, pathIndex,spot){
  //   console.log("Point");
     // mainPath.addPoint(spot);
    // console.log("sendPoint - pathIndex",pathIndex);
     wikiWalls.addPathPoint(wallId,pathIndex,spot);
     everyone.now.recPoint(wallId,spot);};
     
everyone.now.sendEnd = function(wallId){
    //console.log("EndLine");
     //mainView.addPath(mainPath);
     //console.log("number of Paths in view: " + mainView.len); 
     everyone.now.recEnd(wallId);};

everyone.now.sendMoveItem = function(itemId,mPoint,imageFlag){
   // console.log("sendMoveItem:");
    everyone.now.recMoveItem(itemId,mPoint,imageFlag);};

everyone.now.sendImageItem = function(wallId,imageData){
    // console.log("sendImageItem:");
    wikiWalls.newImage(wallId,imageData);
    everyone.now.recMoveImage(wallId,imageData);};

//  when load is clicked on client - download mainView only to that client
// don't need to click any more - when page loads done automatically
everyone.now.download = function(wallId){
     //console.log("C Id: "+ this.user.clientId);
     nowjs.getClient(this.user.clientId, function() {
       // this.now.recDrawPath(mainPath);
        // console.log('now.download: wallId: ', wallId);
        // console.log("now.downlaod: view length: ", wikiWalls.wallView[wallId].len);
        this.now.recDrawView(wikiWalls.wallView[wallId]);
    });
};
     


