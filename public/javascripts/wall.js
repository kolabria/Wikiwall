now.ready(function(){
  var color = 'black';
  var width = 2;
  
  //helper functions
  var serializePath = function(path){
    var segs = new Array();
    x = path
    for(y in x){
      var z = {
        point:{}
        , handleIn:{}
        , handleOut:{}
      }
      z.point.x = x[y]._point._x;
      z.point.y = x[y]._point._y;
      z.handleIn.x = x[y]._handleIn._x;
      z.handleIn.y = x[y]._handleIn._y;
      z.handleOut.x = x[y]._handleOut._x;
      z.handleOut.y = x[y]._handleOut._y;
      segs.push(JSON.stringify(z));
    }
    return segs
  }

  //NOW functions
  //populate the canvas
  now.initWall(companyId, wallId, function(d){
    //convert database info into paperjs object
    //go through all elements and rebuild
    for(x in d.paths){
      var p = d.paths[x];
      if(!paper.project.layers[p.layer]){
        new Layer();
      }
      paper.project.layers[p.layer].activate();
      points = new Array();
      for (n in p.description){
        points.push(JSON.parse(p.description[n]));
      }
      var path = new Path(points);
      path.strokeColor = p.color;
      path.strokeWidth = p.width;
      path.opacity = p.opacity;
      path.name = p._id;
    }
    paper.view.draw();//refresh canvas
  });
  
  //Start of drawing
  now.startDraw = function(color,width,start,pathname,layer){
    if(!paper.project.layers[layer]){
      new Layer();
    }
    paper.project.layers[layer].activate();
    path = new Path();
    path.strokeColor = color;
    path.strokeWidth = width;
    path.add(start);
    path.name = pathname;
  }
  
  now.updateDraw = function(point,pathname,layer){
    paper.project.layers[layer].children[pathname].add(point);
    paper.view.draw(); //refresh canvas
  }

  now.endDraw = function(layer,pathname,newname){
    paper.project.layers[layer].children[pathname].simplify(10)
    paper.project.layers[layer].children[pathname].name = newname;
    paper.view.draw(); //refresh canvas
  }
  
  //move an object
  now.updateMove = function(layer,pathname,delta){
     paper.project.layers[layer].children[pathname].position.x += delta.x;
     paper.project.layers[layer].children[pathname].position.y += delta.y;
     paper.view.draw(); //refresh canvas
  }

  now.tError = function(err){
    alert(err);
  }
  //Tool Definitions

  //Pen Tool
  var pen = new Tool();
  pen.onMouseDown = function(event){
    pen.path = new Path();
    pen.path.strokeColor = color;
    pen.path.strokeWidth = 2;
    pen.path.add(event.point);
    now.shareStartDraw(companyId,wallId,color,width,event.point,paper.project.activeLayer.index);
  }
  pen.onMouseUp = function(event){
    pen.path.simplify(10);
    x = pen.path.segments;
    var segs = serializePath(x);
    now.newPath(companyId,wallId,segs,color,pen.path.strokeWidth,paper.project.activeLayer.index,function(name){
      pen.path.name = name;
    });
  }
  pen.onMouseDrag = function(event){
    pen.path.add(event.point);
    now.shareUpdateDraw(companyId,wallId,event.point,paper.project.activeLayer.index);
  }

  //Pan Tool
  var pan = new Tool();
  pan.onMouseDrag = function(event){
    pan.v = new Point()
    pan.v.x = -event.delta.x;
    pan.v.y = -event.delta.y;
    paper.view.scrollBy(pan.v);
    
  }
  pan.onMouseUp = function(event){
    paper.view.draw();
  }

  //Select Tool
  var select = new Tool();
  select.onMouseDown = function(event){
    if(select.target){
      select.target.item.selected = false
      jQuery('.icon-remove').remove();
    }
    select.target = project.hitTest(event.point, {stroke:true,segments:true,tolerance:2});
    if(select.target){
      var windowPosX = select.target.item.bounds.topLeft.x-paper.view.bounds.topLeft.x+select.target.item.bounds.width
      var windowPosY = select.target.item.bounds.topLeft.y-paper.view.bounds.topLeft.y
      select.target.item.selected = true;
      jQuery('canvas').after('<i class="icon-remove" style="left:'+windowPosX+'px;top:'+windowPosY+'px;"></i>');
    }
  }
  select.onMouseDrag = function(event){
    if(select.target){
      select.target.item.position.x += event.delta.x;
      select.target.item.position.y += event.delta.y;
      now.sendMoveItem(companyId,wallId,paper.project.activeLayer.index,select.target.item.name,event.delta);
      paper.view.draw(); //refresh canvas
      var windowPosX = select.target.item.bounds.topLeft.x-paper.view.bounds.topLeft.x+select.target.item.bounds.width
      var windowPosY = select.target.item.bounds.topLeft.y-paper.view.bounds.topLeft.y
      jQuery('i').css({left:windowPosX,top:windowPosY})
    }
  }
  select.onMouseUp = function(event){
    if(select.target){
      x = select.target.item.segments;
      var segs = serializePath(x);
      now.updatePath(companyId,wallId,select.target.item.name,segs);
    }
  }

  //Event listeners
  jQuery(document).on('click','i',function(){ 
    if(select.target.item.remove()){
      jQuery('i').remove();
    }
    //Send removal request to
  });
  //Improve Center - currently centers on activeLayer, better would take average x of all points, and average y of all points, scroll to that point
  //How to get all points?

  //Change color;

  jQuery('.color').click(function(){
    color = $(this).val();
    jQuery('.tool[value=Pen]').click();
  });
  //Change tool
  jQuery('.tool').click(function(){
    var t = $(this).val();
    c = jQuery('#myCanvas').removeClass();
    switch(t){
      case 'Pan':
        c.addClass('move');
        pan.activate();
        break;
      case 'Pen':
        c.addClass('crosshair');
        pen.activate();
        break;
      case 'Select':
        c.addClass('pointer');
        select.activate();
        break;
      case 'Center':
        var l = paper.project.activeLayer.bounds.center;
        var v = paper.view.center;
        var p = new Point(l.x - v.x,l.y - v.y);
        view.scrollBy(p);
        view.draw(); 
        break;
    }
  });
  jQuery('.tool[value=Pen]').click();
});

  
