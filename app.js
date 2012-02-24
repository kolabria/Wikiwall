
/**
 * Module dependencies.
 */

var express = require('express')
  , _ = require('extend') //underscore.js adds some array and object functions
  , Mongoose = require('mongoose') //db interface
  , nowjs = require('now') // Websockets library
  , async = require('async') // Library to reduce callbacks
  //db definitions
  , Path = require('./models/path')
  , Wall = require('./models/wall')
  , Images = require('./models/images')

var port = process.env.VCAP_APP_PORT || 8000;
var app = module.exports = express.createServer();
var db;
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
  messages: require('express-messages') // allow for flash messages
});

app.helpers({
  _:require('underscore') // make underscore available to clientside
})

// Routes not needed as it will be handled by python

//For testing
app.get('/wall/:id', function(req, res){
  //id refers to either _id or name?
  var wall_id = req.params.id;
  //find wall in db & get wall and paths
  res.render('wall', {});
});


app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);

//Now.JS initialization

var nowjs = require("now");
var everyone = nowjs.initialize(app);

//Two Main types of now.js functions
//1. DB functions to be called after all manipulations on a path/object has been completed
//2. Inter-Client functions that offer realtime updates between clients. 


//Inter Client

//modify so that only applicable clients are sent this info
//have an activeWall with an _id and an array of now.js client id's
//group is named 'c'+companyId+'w'+wallId. Theoretically wallId should be enough as the chances of having multiple unique wallId's is almost 0, however why take chances?


//start drawing
everyone.now.shareStartDraw = function(companyId, wallId,color,width,start,layer){
  console.log(nowjs.getGroup('c'+companyId+'u'+wallId).exclude(this.user.clientId))
  nowjs.getGroup('c'+companyId+'u'+wallId).exclude(this.user.clientId).now.startDraw(color,width,start,this.user.clientId,layer);
}

//add points
everyone.now.shareUpdateDraw = function(companyId, wallId,point,layer){
  nowjs.getGroup('c'+companyId+'u'+wallId).exclude(this.user.clientId).now.updateDraw(point,this.user.clientId,layer);
}

//move object
everyone.now.sendMoveItem = function(companyId, wallId,pathId){
  nowjs.getGroup('c'+companyId+'u'+wallId).exclude(this.user.clientId).now.updateMove();
}

//delete path
everyone.now.deletePath = function(companyId, wallId,pathId){
  nowjs.getGroup('c'+companyId+'u'+wallId).exclude(this.user.clientId).now.deleteObject();
}

//DB functions
//wallId will reference the _id ObjectRef of the wall object
//pathId will reference the _id ObjectRef of the path object

//called after sendEnd to save newPath (after vector simplification has run)
everyone.now.newPath = function(companyId, wallId,path,pcolor,pwidth,layer){
  //create new path
  Path.create({
    color: pcolor
    , width: pwidth
    , opacity: 1 //For now, make variable later
    , description: path
  },function(err,doc){
    if(err){
      console.log(err)
      nowjs.getClient(this.user.clientId, function(){
        this.now.tError('Could Not Save');
      });
    }
    //update wall
    Wall.update({
      _id: wallId
    },{
      $push:{paths:doc._id}
    },{},function(err,w){
      if(err){
        console.log(err)
        nowjs.getClient(this.user.clientId, function(){
          this.now.tError('Could Not Save');
        });
      }
        nowjs.getGroup('c'+companyId+'u'+wallId).exclude(this.user.clientId).now.endDraw(layer,this.user.clientId,doc._id); //newName = _id
        callback(doc._id);
    });
  });
  
}
//called after a move has been completed
everyone.now.UpdatePath = function(companyId, wallId,pathId,path){

  //update path in db
}
//called when path is deleted
everyone.now.DeletePath = function(companyId, wallId,pathId){
  //delete path in db
}
//initial load (data sent with page request)
everyone.now.initWall = function(companyId, wallId){
  console.log('connected');
  //initialize connection
  db = Mongoose.createConnection('mongodb://localhost/'+companyId);
  var client = this.user.clientId;
  nowjs.getGroup('c'+companyId+'u'+wallId).addUser(client);
  //get info from db
  Wall.findOne({_id:wallId}).populate('paths').run(function(err,doc){
    nowjs.getClient(client, function(){
      if(err){
        console.log(err);
        this.now.tError('Could not connect to Wall');
      }
      this.now.init(doc)
      //add this user to a group      
    });
  });
}