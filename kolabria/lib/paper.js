// add point to an existing path
pathAddPoint = function(p){
  var i = this.len
  this.point[i] = p;
  this.len++;
} 

// adds path to a view - method
viewAddPath = function(path){
  var i = this.len
  this.path[i] = path;
  this.len++;
  return i;
}  
           
// creates a point          
drawPoint = function(x,y){
  this.x = x;
  this.y = y;
}

// create a draw path
drawPath = function(color,width,p){
  this.color = color;
  this.width = width;
  this.point = p;
  this.len = 1;
  this.addPoint = pathAddPoint;
}

// creates an image
viewImage = function(img){
	this.image = img;
}

// adds image to a view - method
viewAddImage = function(img){
  var i = this.ilen
  this.image[i] = img;
  this.ilen++;
  console.log("ViewAddimage"); 
  return i;
}

// creates a view 
drawView = function(){
  var p = new drawPoint(0,0);
  var npath = new drawPath("blue", p);
  this.path = npath;
  this.len = 0;
  this.image = new viewImage('filler');
  this.ilen = 0;
  this.addPath = viewAddPath;
  this.addImage = viewAddImage;
  }

// add a view to allWalls object 
wallAddView = function(view){
  var i = this.len
  this.wallView[i] = view;
  this.len++;
  console.log("wallAddView");
  return i;	
}

wallNewPath = function(wallIndex,start,color,width){
	var view = this.wallView[wallIndex];
	var npath = new drawPath(color, width, start);
	var i = view.addPath(npath);
	return i; 
}
wallNewImage = function(wallIndex,image){
	var view = this.wallView[wallIndex];
	var nimage = new viewImage(image);
	var i = view.addImage(nimage);
	return i; 
}

wallAddPathPoint = function(wallIndex,pathIndex, point){
	var view = this.wallView[wallIndex];
	var npath = view.path[pathIndex];
	npath.addPoint(point);
}

module.exports.wikiWalls = function(){
  // put a dumby mainView in the new wallview
  this.wallView = new drawView();
  this.len = 0;
  this.addView = wallAddView; //  create new wall
  this.newPath = wallNewPath;  //  creating and new path within specific wall
  this.newImage = wallNewImage; // add a new image to the specific wall 
  this.addPathPoint = wallAddPathPoint;  //  add point to existing path of a specific wall
}

/*
http://chatttr.com/scripts/chatttr.js
has info about storing and rebuilding paths adn other objects, look at importString/exportString
*/