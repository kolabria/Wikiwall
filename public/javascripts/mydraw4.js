$(document).ready(function(){
  
  now.name = prompt("What's your name?", "");  
  
  var myPath3;
  
  now.recStart = function(){
    myPath3 = new Path();
    myPath3.strokeColor = 'red';
//    console.log("StartLine");
  }
 
  now.recPoint = function(spot){
    myPath3.add(spot);
//    console.log("Point");
  }
  
  now.recEnd = function(){
    myPath3.simplify();
//    console.log("EndLine");
  }

});

    // Create a Paper.js Path to draw a line into it:
    var path = new Path();
    // Give the stroke a color
    path.strokeColor = 'black';
    var start = new Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note the plus operator on Point objects.
    // PaperScript does that for us, and much more!
    path.lineTo(start + [ 100, -50 ]);


var myPath4;

function onMouseDown(event) {
    myPath4 = new Path();
    myPath4.strokeColor = 'red';
    now.sendStart();
}

function onMouseDrag(event) {
    myPath4.add(event.point);
    now.sendPoint(event.point);
}

function onMouseUp(event) {
    myPath4.simplify();
    now.sendEnd();
}

function onFrame(event) {
    // make visible
    if (!(view.isVisible())){
       view.activate();
    }
}

