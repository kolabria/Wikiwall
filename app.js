
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , _ = require('extend') //underscore.js adds some array and object functions
  , mongoose = require('mongoose') //db interface
  , nowjs = require('now') // Websockets library
  , async = require('async') // Library to reduce callbacks
  //db definitions
  , path = require('./models/path')
  , wall = require('./models/wall')
  , text = require('./models/text')
  , images = require('./models/images') 

var port = process.env.VCAP_APP_PORT || 80;
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //will need cookieparse
  //will need session or redis-session
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
  messages: require('express-messages'); // allow for flash messages
});

app.helpers({
  _:require('underscore'); // make underscore available to clientside
})

// Routes not needed as it will be handled by python

//For testing
app.get('/wall/:id', function(req, res){
  //id refers to either _id or name?
  var wall_id = req.params.id;
  //find wall in db & get wall and paths
  res.render('wall', { locals: {wall_id: wall_id, title: wall.name}});
});


app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

//Now.JS initialization

var nowjs = require("now");
var everyone = nowjs.initialize(app);

//Two Main types of now.js functions
//1. DB functions to be called after all manipulations on a path/object has been completed
//2. Inter-Client functions that offer realtime updates between clients. 


//Inter Client

//modify so that only applicable clients are sent this info
//have an activeWall with an _id and an array of now.js client id's

//start drawing
everyone.now.shareStartDraw = function(wallId,color,width,start){
  client = this.user.clientId;
  everyone.now.startDraw(color,width,start,client);
}

//add points
everyone.now.shareUpdateDraw = function(wallId,point){
  client = this.user.clientId;
  everyone.now.updateDraw(point,client);
}

//move object
everyone.now.sendMoveItem = function(wallId,pathId){
  //move path on clients
}

//delete path
everyone.now.deletePath = function(wallId,pathId){
  //remove path from database --how?
  //remove path from clients
}

//DB functions
//wallId will reference the _id ObjectRef of the wall object
//pathId will reference the _id ObjectRef of the path object

//called after sendEnd to save newPath (after vector simplification has run)
everyone.now.NewPath = function(wallId,path,color,width,callback){
  client = this.user.clientId;
  //create new path
  //get _id 
  everyone.now.endDraw(client,layer,newName); //newName = _id
  callback(newName);
  //save path to db
  
}
//called after a move has been completed
everyone.new.UpdatePath = function(wallId,pathId,path){
  //update path in db
}
//called when path is deleted
everyone.new.DeletePath = function(wallId,pathId){
  //delete path in db
}
//initial load (data sent with page request)
everyone.now.initWall = function(wallId){
  //get clientId
  //get info from db
  nowjs.getClient(this.user.clientId, function(){
    this.now.init()
    //add this user to a group
  });
}