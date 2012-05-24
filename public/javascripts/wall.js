now.ready(function(){
  var color = 'black';
  var width = 2;

  var worker = new Worker('/javascripts/worker.js');
  worker.addEventListener('message', function(e){
    pen.path.add(e.data);
    now.shareUpdateDraw(companyId,wallId,e.data,paper.project.activeLayer.index);
  }, false);
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
    if(d){
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
  now.removePath = function(layer,pathname){
    paper.project.layers[layer].children[pathname].remove();
    paper.view.draw();
  }
  now.tError = function(err){
    alert(err);
  }
  //Tool Definitions
  tool.distanceThreshhold = 10;
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
    worker.postMessage(event.point);
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
      jQuery('canvas').after('<i onClick="" class="icon-remove" style="left:'+windowPosX+'px;top:'+windowPosY+'px;"></i>');
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
  //keymap
  jQuery(document).keydown(function(event){
    switch (event.which) {
      case 80:
        //p for pen?
        jQuery('.tool[value=Pen]').click();
        break;
      case 46:
        //delete for delete?
        jQuery('i').click();
        break;
      case 67:
        //c for center?
        jQuery('.tool[value=Center]').click();
        console.log('center');
        break;
      case 83:
        //s for select?
        jQuery('.tool[value=Select]').click();
        break;
      case 37: //left
        paper.view.scrollBy({x:-10,y:0});
        paper.view.draw();
        break;
      case 38: //up
        paper.view.scrollBy({x:0,y:-10});
        paper.view.draw();
        break;
      case 39: //right
        paper.view.scrollBy({x:10,y:0});
        paper.view.draw();
        break;
      case 40: //down
        paper.view.scrollBy({x:0,y:10});
        paper.view.draw();
        break;
    }
  });


  //delete
  jQuery(document).on('click','i',function(){ 
    if(select.target.item.remove()){
      jQuery('i').remove();
      paper.view.draw();
    }
    now.sendDeleteItem(companyId,wallId,paper.project.activeLayer.index,select.target.item.name);
  });
  //Change tool or color
  jQuery('#toolbar').click(function(e){
    var obj = jQuery(e.target);
    var t = obj.attr('value');
    var cl = obj.attr('class');
    c = jQuery('#myCanvas').removeClass();
    if(cl == 'tool'){
      switch(t){
        case 'Nav':
          c.addClass('nav');
          nw.show('slow').css('bottom',jQuery('header').height());
          var windowTop = paper.view.bounds.top;
          var windowRight = paper.view.bounds.right;
          var windowBottom = paper.view.bounds.bottom;
          var windowLeft = paper.view.bounds.left;
          var paperTop = paper.project.activeLayer.bounds.top;
          var paperRight = paper.project.activeLayer.bounds.right;
          var paperBottom = paper.project.activeLayer.bounds.bottom;
          var paperLeft = paper.project.activeLayer.bounds.left;

          var navTop = Math.min(windowTop,paperTop);
          var navRight = Math.max(windowRight, paperRight);
          var navBottom = Math.max(windowBottom, paperBottom);
          var navLeft = Math.min(windowLeft, paperLeft);
          var windowLength = paper.view.bounds.width;
          var windowHeight = paper.view.bounds.height;
          var navLength = navRight - navLeft
          var navHeight = navBottom - navTop

          var rLength = navLength / 200;
          var rHeight = navHeight / 150;           
          var canvas
              
          var originalPosition = {
            top  : false,
            left : false
          }

          jQuery('#view')
            .width(windowLength / rLength)
            .height(windowHeight / rHeight)
            .css({
              top : (windowTop-navTop)/rHeight,
              left : (windowLeft-navLeft)/rLength
            });
              
          jQuery('#view').draggable({
            containment:"parent",
            drag: function(event, ui){
              if(originalPosition.left === false && originalPosition.top === false){
                originalPosition.left = ui.originalPosition.left
                originalPosition.top = ui.originalPosition.top
              }
              offsetLeft = ui.position.left - originalPosition .left
              offsetTop = ui.position.top - originalPosition.top
              originalPosition.left = ui.position.left 
              originalPosition.top = ui.position.top  
              pan.v = new Point()
              pan.v.x = offsetLeft * rLength * paper.view.zoom;
              pan.v.y = offsetTop * rHeight * paper.view.zoom;
              paper.view.scrollBy(pan.v)
              paper.view.draw();
            },
            stop: function(event, ui){
              originalPosition.left = false;
              originalPosition.top = false;
            }

          });
          break;
        case 'ZoomOut':
          paper.view.zoom = paper.view.zoom /2
          break;
        case 'ZoomIn':
          paper.view.zoom = paper.view.zoom * 2
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
    }else if(cl=='color'){
      color = t
      jQuery('.tool[value=Pen]').click();
    }
  });
  jQuery('.tool[value=Pen]').click();
  iOS_disableZooming();
  iOS_disableScrolling();
  window.onorientationchange = function(){
      if ( orientation == 0 ) {
        window.scrollTo(0,1);
      }  
      else if ( orientation == 90 ) {  
      }  
      else if ( orientation == -90 ) {  
      }  
      else if ( orientation == 180 ) {  
        window.scrollTo(0,1); 
      }  
   }
});

  
