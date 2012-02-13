
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

// Routes
app.get('/',function(req,res){
  res.redirect('/walls');
});
app.get('/walls',function(req,res){
  //get all walls
});
app.get('/wall/:id', function(req, res){
  //id refers to either _id or name?
  var wall_id = req.params.id;
  //find wall in db & get wall and paths
  res.render('wall', { locals: {wall_id: wall_id, title: wall.name}});
});
app.del('/wall/:id', function(req,res){
  //delete wall
  res.redirect('/walls');
});
app.get('/wall/:id/edit', function(req,res){
  //display edit page
    //wall name
});
app.put('/wall/:id', function(req,res){
  //update the wall information
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

//Now.JS initialization

var nowjs = require("now");
var everyone = nowjs.initialize(app);
var client = {
  //clientId :
  //
}

//Two Main types of now.js functions
//1. DB functions to be called after all manipulations on a path/object has been completed
//2. Inter-Client functions that offer realtime updates between clients. 


//Inter Client

//modify so that only applicable clients are sent this info
//have an activeWall with an _id and an array of now.js client id's

//start drawing
everyone.now.sendStart = function(wallId,color,opacity,width,start){
  everyone.now.recStart(wallId,color,opacity,width,start);
}

//add points
everyone.now.sendPoint = function(wallId,pathIndex,spot){
  everyone.now.rec.recEnd(wallId);
}

//end drawing
everyone.now.sendEnd = function(wallId){
  everyone.now.recEnd(wallId);
  //make sure to add vector simplification to clientside
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
everyone.now.NewPath = function(wallId,path){
  //create new path
  //get _id 
  //call setName(_id) on clientside to name paths
  //save path to db
}
//called after a move has been completeed
everyone.new.UpdatePath = function(wallId,pathId,path){
  //update path in db
}
//called when path is deleted
everyone.new.DeletePath = function(wallId,pathId){
  //delete path in db
}
//iniitial load (data sent with page request)
everyone.now.initWall = function(wallId){
  //get clientId
  nowjs.getClient(this.user.clientId, function(){
    //push it to array of active users for this wall
  });
}

//event listners

// on socket close, remove user from active users

