
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
everyone.now.shareStartDraw = function(color,width,start,layer){
  nowjs.getGroup('c'+this.now.companyId+'u'+this.now.wallId).exclude(this.user.clientId).now.startDraw(color,width,start,this.user.clientId,layer);
}

//add points
everyone.now.shareUpdateDraw = function(point,layer){
  console.log(point, layer);
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