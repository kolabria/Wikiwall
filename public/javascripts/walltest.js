now.ready(function(){
  now.wallId = wallId;
  now.name = name;
  now.companyId = companyId;
  if(typeof boxID != 'undefined'){
    now.boxID = boxID
    now.register(function(shared,shares){
      if(shared){
        for(i = 0; i < shared.length; i++){
          jQuery('#shareTo').find('[data-value='+shared[i]+']').children('i').addClass('icon-ok');
        }
      }
      if(shares){
        for(i = 0; i < shares.length; i++){
          jQuery('#walls').find('ul').append('<li class="'+shares[i].id+'"><a href="/connect/'+shares[i].id+'">'+shares[i].name+'</a></li>');
        }
      }
    });
  }

  var events = 0;
  var color = 'black';
  var width = 2;

  var worker = new Worker('/javascripts/worker.js');
  worker.addEventListener('message', function(e){
    pen.path.add(e.data);
    now.shareUpdateDraw(e.data,paper.project.activeLayer.index);
  }, false);

  /******** HELPER FUNCTIONS *******/

  //Serialize for save
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

  //Alerts
  gAlert = function(message){
    jQuery('<div class="alert fade in">'+message+'</div>')
      .appendTo('#alerts')
      .delay(2000).slideUp(300, function(){
        $(this).detach();
      })
  }

  //Convert Canvas to SVG
  exportCanvas = function(){
    var canvas = document.getElementById("myCanvas"), ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;
    var data;
    //store the current globalCompositeOperation
    var compositeOperation = ctx.globalCompositeOperation;
    //get the current ImageData for the canvas.
    data = ctx.getImageData(0, 0, w, h);
    //set to draw behind current content
    ctx.globalCompositeOperation = "destination-over";
    //set background color
    ctx.fillStyle = 'white';
    //draw background / rect on entire canvas
    ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation = compositeOperation;
    canvas.toBlob(function(blob) {
      saveAs(blob, wallId+".png");
    });
  }
  
  updateDelete = function(){
    var windowPosX = (select.target.item.bounds.topLeft.x-paper.view.bounds.topLeft.x+select.target.item.bounds.width)*paper.view.zoom
    var windowPosY = (select.target.item.bounds.topLeft.y-paper.view.bounds.topLeft.y)*paper.view.zoom
    jQuery('button').filter('.delete-object').css({left:windowPosX,top:windowPosY})
  }

  scrollNav = function(){
  console.log('scrollNav');
    c.addClass('nav');
    nw.show();
    //Get current Viewport bounds
    var windowTop = paper.view.bounds.top;
    var windowRight = paper.view.bounds.right;
    var windowBottom = paper.view.bounds.bottom;
    var windowLeft = paper.view.bounds.left;
    //Get Active Paper bounds (drawn objects)
    var paperTop = Math.floor(paper.project.activeLayer.bounds.top)-20;
    var paperRight = Math.ceil(paper.project.activeLayer.bounds.right)+20;
    var paperBottom = Math.ceil(paper.project.activeLayer.bounds.bottom)+20;
    var paperLeft = Math.floor(paper.project.activeLayer.bounds.left)-20;
    //Calculate bounds of viewable area (viewport + paper)
    var navTop = Math.min(windowTop,paperTop);
    var navRight = Math.max(windowRight, paperRight);
    var navBottom = Math.max(windowBottom, paperBottom);
    var navLeft = Math.min(windowLeft, paperLeft);
    //Get current width and height of viewport
    var windowLength = paper.view.bounds.width;
    var windowHeight = paper.view.bounds.height
    //Get the width and height of viewable area
    var navLength = navRight - navLeft
    var navHeight = navBottom - navTop
    //Calculate ratios for view square and movement calculations
    var rLength = navLength / 200;
    var rHeight = navHeight / 150;           
    var canvas
              
    //Set the original position of the drag event. 
    //The Drag event doesn't record previous position, just original, this is need to keep track of last position.
    var originalPosition = {
      top  : false,
      left : false
    }

// debug stuff

//    console.log('windowTop: ', windowTop);
//    console.log('windowRight: ', windowRight);
//    console.log('windowBottom: ', windowBottom);
//    console.log('windowLeft: ', windowLeft);

//    console.log('View Size heigt: ',paper.view.size.height );
//    console.log('view size width: ', paper.view.size.width );

//    console.log('PaperTop: ', paperTop);
//    console.log('PaperRigh: ', paperRight);
//    console.log('PaperBottom: ', paperBottom);
//    console.log('PaperLeft: ', paperLeft);

   // console.log('windowBottom: ', windowBottom);
  //  console.log('windowLeft: ', windowLeft);


    jQuery('#view')
      .width(windowLength / rLength)
      .height(windowHeight / rHeight)
      .css({
        top : (windowTop-navTop)/rHeight,
        left : (windowLeft-navLeft)/rLength
      })
      .draggable({
        containment:"parent",
        drag: function(event, ui){
          //if the original path isn't set, set it to original position
          if(originalPosition.left === false && originalPosition.top === false){
            originalPosition.left = ui.originalPosition.left
            originalPosition.top = ui.originalPosition.top
          }
          //Calculate distance moved
          offsetLeft = ui.position.left - originalPosition .left
          offsetTop = ui.position.top - originalPosition.top
          //Set original position to current position
          originalPosition.left = ui.position.left 
          originalPosition.top = ui.position.top  
          //Move the view
          pan.v = new Point()
          pan.v.x = offsetLeft * rLength * paper.view.zoom;
          pan.v.y = offsetTop * rHeight * paper.view.zoom;
          paper.view.scrollBy(pan.v)
          paper.view.draw();
        },
        stop: function(event, ui){
          //Clear the original position
          originalPosition.left = false;
          originalPosition.top = false;
        }
      });
  }


  /******** NOW functions *******/

  //populate the canvas
  now.initWall(function(d, users){
    //convert database info into paperjs object
    //go through all elements and rebuild
    if(d){
      for(x in d.paths){
        var p = d.paths[x];
        if(!paper.project.layers[p.layer]){
          new Layer();
        }
        paper.project.layers[p.layer].activate();
        if(p.description.file){
          var image = document.createElement('img');
          image.onload = function(){
            image.src = p.description.file
            raster = new Raster(image);
            raster.name = p._id
            raster.position = p.description.position
          }
        }else{
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
    }
    for(i = 0; i < users.length;i++){
      jQuery('#users').find('ul').append('<li class="'+users[i].id+'">'+users[i].name+'</li>');
    }
    paper.view.draw();//refresh canvas
  });

  now.pushUser = function(username, clientId){
    jQuery('#users').find('ul').append('<li class="'+clientId+'">'+username+'</li>');
    gAlert(username+' has joined')
  }
  now.pullUser = function(username, clientId){
    users = jQuery('#users').find('.'+clientId);
    if (users.length){
      jQuery(users).detach()
      gAlert(username + 'Has Left the chat');
    }
  }
  now.quit = function(){
    window.location = jQuery('.navbar').find('.quit').attr('href');
  }
  now.share = function(host, name){
    jQuery('#walls').find('ul').append('<li class="'+host+'"><a href="/connect/'+host+'">'+name+'</a></li>');
    //add this share to the list of shares.
    gAlert(name + ' Has shared a wall with you');
  }
  now.unshare = function(host){
    //find box in shares with that id and remove it.
    console.log(host)
    jQuery('#walls').find('.'+host).detach();
  }
  now.sharedTo = function(box){
    jQuery('#shareTo').find('[value='+k+']').addClass('active');
  }

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
    events++
    if(events = 4){
      events = 0;
      paper.view.draw();
    }
  }

  now.endDraw = function(layer,pathname,newname){
    paper.project.layers[layer].children[pathname].simplify(10)
    paper.project.layers[layer].children[pathname].name = newname;
    paper.view.draw(); //refresh canvas
  }
  
  //move an object
  now.updateMove = function(layer,pathname,delta){
    //if the item is selected, move the delete button with it
    if(paper.project.layers[layer].children[pathname].selected){
      updateDelete();
    }
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


  /****** Tool Definitions ********/

  tool.distanceThreshhold = 10;
  //Pen Tool
  var pen = new Tool();
  pen.onMouseDown = function(event){
    pen.path = new Path();
    pen.path.strokeColor = color;
    pen.path.strokeWidth = 2;
    pen.path.add(event.point);
    now.shareStartDraw(color,width,event.point,paper.project.activeLayer.index);
  }
  pen.onMouseUp = function(event){
    pen.path.simplify(10);
    x = pen.path.segments;
    var segs = serializePath(x);
    now.newPath(segs,color,pen.path.strokeWidth,paper.project.activeLayer.index,function(name){
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
      jQuery('button').filter('.delete-object').detach();
    }
    select.target = project.hitTest(event.point, {stroke:true,segments:true,tolerance:2});
    if(select.target){
      var windowPosX = (select.target.item.bounds.topLeft.x-paper.view.bounds.topLeft.x+select.target.item.bounds.width)*paper.view.zoom
      var windowPosY = (select.target.item.bounds.topLeft.y-paper.view.bounds.topLeft.y)*paper.view.zoom
      select.target.item.selected = true;
      jQuery('canvas').after('<button onClick="" class="close delete-object" style="position:absolute;left:'+windowPosX+'px;top:'+windowPosY+'px;">&times;</button>');
    }
  }
  select.onMouseDrag = function(event){
    if(select.target){
      select.target.item.position.x += event.delta.x;
      select.target.item.position.y += event.delta.y;
      now.sendMoveItem(paper.project.activeLayer.index,select.target.item.name,event.delta);
      paper.view.draw(); //refresh canvas
      updateDelete();    
    }
  }
  select.onMouseUp = function(event){
    if(select.target){
      x = select.target.item.segments;
      var raster = false;
      //test if it's a path or a raster
      if(x === "undefined"){
        var data = serializePath(x);
      }else{
        raster = true;
        var data = {x: select.target.item.position._x, y: select.target.item.position._y};
      }
      //need to test if image, before sending to node. 
      now.updatePath(select.target.item.name,raster,data);
    }
  }

  /******** Event listeners ******/
  //File Drag

  
  //keymap
  jQuery(document).keydown(function(event){
    switch (event.which) {
      case 80:
        //p for pen?
        jQuery('.tool[value=Pen]').click();
        break;
      case 46:
        //delete for delete?
        event.preventDefault();
        jQuery('.delete-object').click();
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
        updateDelete();
        paper.view.scrollBy({x:-10,y:0});
        paper.view.draw();
        break;
      case 38: //up
        updateDelete();
        paper.view.scrollBy({x:0,y:-10});
        paper.view.draw();
        break;
      case 39: //right
        updateDelete();
        paper.view.scrollBy({x:10,y:0});
        paper.view.draw();
        break;
      case 40: //down
        updateDelete();
        paper.view.scrollBy({x:0,y:10});
        paper.view.draw();
        break;
    }
  });

  
  //delete
  jQuery(document).on('click','.delete-object',function(){ 
    if(select.target.item.remove()){
      jQuery('button').filter('.delete-object').detach();
      paper.view.draw();
    }
    now.sendDeleteItem(paper.project.activeLayer.index,select.target.item.name);
  });

  //Share To
  jQuery('#shareTo li').click(function(e){
    e.stopImmediatePropagation(); //Two clicks are fired, this is a patch, need to find reason why.
    var li = jQuery(this);
    cl = li.attr('data-value');
    if(li.find('.icon-ok').length < 1){
      now.shareWall(cl);
      li.find('i').addClass('icon-ok')
    }
  })

  //Change tool or color
  jQuery('#toolbar').add('#navWindow').add('#functions').click(function(e){
    var obj = jQuery(e.target);
    var t = obj.attr('value');
    var cl = obj.attr('class');
    c = jQuery('#myCanvas').removeClass();
    if(e.currentTarget.id != 'navWindow'){
      nw = jQuery('#navWindow').hide();
    }
    if(select.target){
      select.target.item.selected = false
      jQuery('button').filter('.delete-object').detach();
      paper.view.draw();
    }
    if(/.*tool.*/.test(cl)){
      switch(t){
        case 'Nav':
          scrollNav();       
          break;
        case 'ZoomOut':
          paper.view.zoom = paper.view.zoom /2;
          scrollNav();
          break;
        case 'ZoomIn':
          paper.view.zoom = paper.view.zoom * 2;
          scrollNav();
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
          scrollNav();
          break;
        case 'Export':
          exportCanvas();
          break;
      }
    }else if(/.*color.*/.test(cl)){
      color = t
      jQuery('.tool[value=Pen]').click();
    }else if(/.*share.*/.test(cl)){
      switch(t){
        case 'Share': 
          //no longer needed handled via CSS, call kept incase of additional functionality       
          break;
        case 'Shared':
          //no longer needed handled via CSS, call kept incase of additional functionality
          break;
        case 'Users':
          //no longer needed handled via CSS, call kept incase of additional functionality
          break;
      }
    }else{
      if(/.*clear.*/.test(cl)){
        now.clear(function(){
          return true;
        });
      }
    }
  });
  //functional with hit testing and everything
  //progress meter of some sort required
  function processFiles(file){
    if(file && typeof FileReader !== "undefined"){
      if((/image/i).test(file.type)){
        var reader = new FileReader();
        reader.onload = function(e){
          var raster;
          var image = document.createElement('img');
          image.onload = function(){
            raster = new Raster(image);
            raster.position = view.center;
            paper.view.draw();
          }
          file.src = image.src = e.target.result;
          now.sendFile(file, paper.project.activeLayer.index, view.center, function(name){
            raster.name = name;
          });
        }
        reader.readAsDataURL(file);
      }
    }
  }
  now.receiveFilesCanvas = function(layer, file, position, name){
    var image = document.createElement('img');
    image.src = file
    paper.project.layers[layer].activate();
    image.onload = function(){
      raster = new Raster(image);
      raster.name = name
      raster.position.x = position._x
      raster.position.y = position._y
      paper.view.draw();
    }
  }
  //File Testing
  jQuery('#myCanvas').on('drop', function(e){
    e.stopPropagation();
    e.preventDefault();
    var file = e.originalEvent.dataTransfer.files[0];
    processFiles(file);
  })
  jQuery('.tool[value=Pen]').click();
});

  
