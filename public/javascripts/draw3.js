paper.install(window);
   // Keep global references to both tools, so the HTML
   // links below can access them.
var tool1, tool2, tool3;
var myZoom;
var zoomLevel = 2;
var newZoom;
var start = new Point();
var color = 'black';
function changeColor(newValue){
   color = newValue;
}
function makeZoom(value){
  //console.log('zoom level:'+ zoomLevel + 'value:'+value);
  if (zoomLevel > value) {
     paper.project.activeLayer.scale((zoomLevel-value)/2);
     //console.log('shrink');
  }
  if (zoomLevel < value) {
     paper.project.activeLayer.scale((value - zoomLevel)+1);
 // console.log('enlarge');
   }
   zoomLevel = value;
   paper.view.draw();
}
var arrayZoom = {
    make: makeZoom
};
window.onload = function() {
  paper.setup('myCanvas');            
   // Create two drawing tools.
   // tool1 will draw straight lines,
   // tool2 will draw clouds.
  // Both share the mouseDown event:
  var path;
  function onMouseDown(event) {
      path = new Path();
      path.strokeColor = color;
      path.add(event.point);
  }
  tool1 = new Tool();
  tool1.onMouseDown = onMouseDown;
  tool1.onMouseDrag = function(event) {
     path.add(event.point);
  }
  tool3 = new Tool();
   // tool3.minDistance = 20;
  tool3.onMouseDown = function(event) {
     start = event.point;
  }
  tool3.onMouseDrag = function(event) {
     // Use to pan around view
     // move distance since last event
     var move = new Point();
     move.x = start.x - event.point.x;
     move.y = start.x - event.point.y;
     view.scrollBy(move);
     start = event.point; 
  }
  myZoom = arrayZoom;
  function onFrame(event) {
    // make visible
     if (!(view.isVisible())){
        view.activate();
      }
   }
}
