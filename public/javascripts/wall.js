now.ready(function(){
  if (!wallInit){	
	// remove objects from project 
	for (i=0; i< paper.project.layers.length; i++){
		paper.project.layers[i].removeChildren();
	}
	// remove list of active users 
	jQuery('#users').find('ul').empty();
  }
  else {
    wallInit = false;
  }
  now.wallId = wallId;
  now.name = name;
  now.companyId = companyId;
  now.browser = $.ua.browser.name; //$.ua.browser.name;   set to chrome for testing
  now.bversion = $.ua.browser.version;
  now.mode = mode;

  window.skipRTCMultiConnectionLogs = true;  //  put here for now

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
    // register for master-slave connection
   now.mslink(mode);
  
  }

  var events = 0;
// default values for pen
  var color = 'black';
  var width = 6;
  var scribd_doc;
  var usernames = [];  // array of current users on the wall 
  var master = false;
  var slave = false;
  var remoteEvent = false;
  var zoomAreaActive = false;
  var masterSlaveScale;

  var worker = new Worker('/javascripts/worker.js');
  worker.addEventListener('message', function(e){
    pen.path.add(e.data);
    now.shareUpdateDraw(e.data,paper.project.activeLayer.index);
  }, false);


console.log('viewing mode:',mode);
console.log('start stuff');
console.log('View Size heigt: ',paper.view.size.height );
console.log('view size width: ', paper.view.size.width );

console.log('view origin:('+paper.view.bounds.x+','+paper.view.bounds.y+')');
console.log('view bottom right:('+paper.view.bounds.width+','+paper.view.bounds.height+')');

//console.log('project heigt: ',paper.project.activeLayer.bounds.height );
//console.log('project width: ', paper.project.activeLayer.bounds.width );
//console.log('project top: ',paper.project.activeLayer.bounds.top);
//console.log('project top: ',paper.project.activeLayer.bounds.right);
//console.log('project top: ',paper.project.activeLayer.bounds.bottom);
//console.log('project top: ',paper.project.activeLayer.bounds.left);

if (mode=='slave'){
  // now.sendMSMsg('connect');
  setTimeout(function(){now.sendMSMsg('connect');},1000);  // added delay since message sometimes missed on master 
//  better to to send and wait for response - if don't get response resend 
}

if ($.ua.browser.name != 'Chrome' && mode != 'slave'){
	alert("Google Chrome is required for for all features to function correctly. Please switch browers for an optimal experience. ");
}


now.recMSMsg = function(msg,data){
 console.log('recMSMsg: mode: ',mode ); 
 if (mode == 'master') {
	  switch (msg){
		case 'connect':
		  console.log('slave connected');
	  	  var data = { height: paper.view.size.height, width: paper.view.size.width} 
		  console.log('View Size heigt: ',paper.view.size.height );
		  console.log('view size width: ', paper.view.size.width );
		  // send size of master view
		  now.sendMSMsg('viewSize',data);	
		break;
		case 'reqViewSize':
		  var data = { height: paper.view.size.height, width: paper.view.size.width} 
		  // send size of master view
		  now.sendMSMsg('viewSize',data);
		break;
		case 'quit':
		  console.log('recieved quit from slave');
		  window.location.assign('/host/list');
		break;
		case 'select':
		  console.log('recieved select from slave');
		  remoteEvent = true; 
		  jQuery('.tool[value=Select]').click();
		  //jQuery('.tool[value=Select]').addClass('btn-info');
		break;
		case 'pen':
		  console.log('recieved pen from slave');
		  remoteEvent = true; 
		  jQuery('.tool[value=Pen]').click();
		break;
		case 'nav':
		  console.log('recieved nav from slave');
		  remoteEvent = true; 
		  jQuery('.btn-info').removeClass('btn-info');
		  jQuery('.tool[value=Nav]').addClass('btn-info');
		  //jQuery('.tool[value=Nav]').click();
		break;
		case 'color':
		  console.log('recieved color from slave');
		  remoteEvent = true; 
		  jQuery('.btn[title=Colors]').dropdown();
		  jQuery('.color[value="'+data+'"]').click();
		break;
		case 'scroll':
		  console.log('recieved scroll from slave');
		  paper.view.scrollBy(data)
          paper.view.draw();
		break;
		case 'zoomin':
		  console.log('recieved zoomin from  slave');
		  remoteEvent = true; 
		  jQuery('.tool[value=ZoomIn]').click();
		break;
		case 'zoomout':
		  console.log('recieved zoomout from  slave');
		  remoteEvent = true; 
		  jQuery('.tool[value=ZoomOut]').click();
		break;
		case 'center':
		  console.log('recieved center from  slave');
		  remoteEvent = true; 
		  jQuery('.tool[value=Center]').click();
		break;
		case 'showUsers':
		  console.log('recieved zoomout from  slave');
		  remoteEvent = true; 
		  jQuery('#users').click();
		break;
		case 'zoomAreaStart':
		  console.log('Slave has activated zoom area');
		 // var path = new Path(points);
	    //path.strokeColor = p.color;
	    //path.strokeWidth = p.width;
	    //path.opacity = p.opacity;
	    //path.name = p._id;
	      //var from = new Point(20, 20);
		  //var to = new Point(80, 80);
		  //var path = new Path.Rectangle(from, to);
		  var point = new Point(data.x, data.y);
		  var size = new Size(data.width, data.height);
		  var path = new Path.Rectangle(point, size);
		  path.strokeColor = 'grey';
		  path.dashArray = [10, 4];
		  path.strokeWidth = 5;
		  //path.fillColor = 'blue';
		  //path.opacity = 0.25;
		  path.name = 'slave';
		  paper.view.draw();
		break;
		case 'zoomAreaStop':
		  console.log('Slave has deactivated zoom area');
		  //paper.project.layers[layer].children['slave'].remove();
		  paper.project.activeLayer.children['slave'].remove();
		  paper.view.draw();
		break;
		case 'zoomAreaMove':
		  paper.project.activeLayer.children['slave'].remove();  // remove old path and draw new one
		  var point = new Point(data.x, data.y);
		  var size = new Size(data.width, data.height);
		  var path = new Path.Rectangle(point, size);
		  path.strokeColor = 'grey';
		  path.dashArray = [10, 4];
		  path.strokeWidth = 5;
		  //path.fillColor = 'blue';
		  //path.opacity = 0.25;
		  path.name = 'slave';
		  paper.view.draw();
		break;
		case 'users':
		  console.log('recieved users from slave');
		  $('#usersDd').dropdown('toggle');
		break;
		case 'vconf':
		  console.log('recieved vconf from slave');
		  $('#vconfDd').dropdown('toggle');
		break;
		case 'sScreen':
		  console.log('recieved sScreen from slave');
		  $('#ShareScreenDd').dropdown('toggle');
		break;
		case 'openShareLink':
		  console.log('recieved openShareLink from slave');
		  $('#shareLink').modal();
		break;
		case 'closeShareLink':
		  console.log('recieved sScreen from slave');
		  $('#shareLink').modal('hide');
		break;
		case 'startVC':
		  console.log('recieved start VC from slave');
		  jQuery('#vconf li').click();
		break;
		case 'stopVC':
		  console.log('recieved stop VC from slave');
		  remoteVCStop = true; 
		  jQuery('#vconf li').click();
		break;
		case 'startSS':
		  console.log('recieved start SS from slave');
		  jQuery('#ShareScreen li').click();
		break;
		case 'stopSS':
		  console.log('recieved stop SS from slave');
		  jQuery('#ShareScreen li').click();
		break;
		case 'sizeSS':
		  console.log('recieved size SS from slave');
		  jQuery("#ShareScreen li[data-value='ssSize']").click();
		break;
		case 'captureSS':
		  console.log('recieved capture SS from slave');
		  jQuery("#ShareScreen li[data-value='ssCapture']").click();
		break;
		case 'SSControlSnap':
		   jQuery('#videoSnap'+data).click();
		break;
        case 'SSControlDrag':
           //console.log('recieved ssControlDrag: index: '+data.index+' top: '+data.top+' left: '+data.left);
           $('#screen-content'+ data.index).css({
              'top': data.top,
              'left': data.left
            });
        break; 
        case 'SSControlResize':
        //   console.log('recieved ssControlResize: index: '+data.index+' width: '+data.width+' heigh: '+data.height);
            $('#screen-content'+ data.index).width(data.width);
            $('#screen-content'+ data.index).height(data.height);
            $('#screen-video'+ data.index).width(data.width);
            $('#screen-video'+ data.index).height(data.height);
        break;
        case 'audioCallClicked':
             audioRemoteClick = true;
             $('#audioCall').click();
             break;
        case 'audioControlDrag':
             $("#audioarea").css({
               'top': data.top,
               'left': data.left
             });
             break;
        case 'makeAudioCall':
             console.log('recieved makeAudioCall from slave');
             remoteMakeAudioCall = true;
             makeAudioCall();
             break;
        case 'HangUpAudioCall':
             console.log('recieved HangUpAudioCall from slave' );
             remoteHangUpAudio = true;
             hangUpAudio();
             break;
        case 'addPeopleAudio':
            console.log('recieved addPeopleAudio');
            remoteAddPeopleAudio = true;
            audioAddPeople();
            break;
        case 'addPersonAudio':
            console.log('recieved addPersonAudio');
            remoteAddPersonAudio = true;
            audioAddPerson();
            break;
        case 'videoControlDrag':
                $("#videoconf").css({
                  'top': data.top,
                  'left': data.left
                });
            break;
     }
  }
  if (mode == 'slave') {
	  switch (msg){
		case 'viewSize':	  	  
		  console.log('Master View Size height: ',data.height );
		  console.log('Master view size width: ', data.width );
		  // adjust view to match master 
		  console.log('height ratio: ',paper.view.size.height/data.height);
		  console.log('width ratio: ',paper.view.size.width/data.width);
		  var rHeight = paper.view.size.height/data.height;
		  var rWidth = paper.view.size.width/data.width;
	console.log('scale ratio: height: '+rHeight+' width: '+rWidth);
		  var scale = Math.min((paper.view.size.height/data.height),(paper.view.size.width/data.width));
	      paper.view.zoom = paper.view.zoom * scale ;
	
	      pan.v = new Point()
	    console.log('---before ---');
		console.log('slave:view origin:('+paper.view.bounds.x+','+paper.view.bounds.y+')');
		console.log('slave:view bottom right:('+paper.view.bounds.width+','+paper.view.bounds.height+')');
	
	      console.log('slave: bounds x: ',paper.view.bounds.x);
          //pan.v.x = (0-paper.view.bounds.x); // / Math.min((paper.view.size.height/data.height),(paper.view.size.width/data.width));
      
 console.log('scale: ',scale);
         if (rHeight >= rWidth) {
			pan.v.x = (0-paper.view.bounds.x) * scale; 
	        pan.v.y = 0;
         }
         else {
	        pan.v.x = 0;
			pan.v.y = (0-paper.view.bounds.y) * scale;     
         }
          
          
          console.log('scroll by: ',pan.v);
          paper.view.scrollBy(pan.v)
          paper.view.draw();
		console.log('---after ---');
		console.log('slave:view origin:('+paper.view.bounds.x+','+paper.view.bounds.y+')');
		console.log('slave:view bottom right:('+paper.view.bounds.width+','+paper.view.bounds.height+')');
		break;
		
		case 'quit':
		  window.location.assign('/host/list');
		break;
		case 'select':
		  console.log('recieved select from master');
		  remoteEvent = true; 
		  //jQuery('.tool[value=Select]').addClass('btn-info');
		  jQuery('.tool[value=Select]').click();
		break;
		case 'pen':
		  console.log('recieved pen from master');
		  remoteEvent = true; 
		  jQuery('.tool[value=Pen]').click();
		break;
		case 'nav':
		  console.log('recieved nav from  master');
		  remoteEvent = true; 
		  jQuery('.btn-info').removeClass('btn-info');
		  jQuery('.tool[value=Nav]').addClass('btn-info');
		  //jQuery('.tool[value=Nav]').click();
		break;
		case 'zoomin':
		  console.log('recieved zoomin from  master');
		  remoteEvent = true; 
		  jQuery('.tool[value=ZoomIn]').click();
		break;
		case 'zoomout':
		  console.log('recieved zoomout from  master');
		  remoteEvent = true; 
		  jQuery('.tool[value=ZoomOut]').click();
		break;
		case 'center':
		  console.log('recieved center from  master');
		  remoteEvent = true; 
		  jQuery('.tool[value=Center]').click();
		break;
		case 'color':
		  console.log('recieved color from  master');
		  remoteEvent = true; 
		   jQuery('.btn[title=Colors]').dropdown();
		  jQuery('.color[value="'+data+'"]').click();
		break;
		case 'scroll':
		  console.log('recieved scroll from  master');
		  paper.view.scrollBy(data)
          paper.view.draw();
		break;
		case 'initSSControl':
		  masterSlaveScale = Math.min(data.wiw /window.innerWidth,data.wih/window.innerHeight); //  need to scale to window size some time.
		  
		  console.log('recieved initSSControl from master');
		  var i = data.index; 
		  jQuery('#ssarea1').append('<div id="screen-content'+i+'"></div>');
		
		  jQuery('#screen-content'+i).append('<div class="srceen-background"></div><div class="vidInfo"><h4 class="screenInfo">'+data.name+'</h4><button id="videoSnap'+i+'" type="button value="snap" class="btn-large videoSnapBtn" ><i class="icon-camera"></i></button></div>');
	      jQuery('#videoSnap'+i).click(function(e){
		     console.log('clicked video capture');
			 
		    // send capture message to master
		     now.sendMSMsg('SSControlSnap',i);
	      });
		  $( '#screen-content'+i ).resizable({  
			  // need to send message on resize to master
		      aspectRatio: 16 / 9
		    }).draggable(	{
				    drag: function (e, ui) {
					   // send message to master on move 
					   //console.log('top: '+ui.position.top+' left: '+ui.position.left);
					     var data = {index: i, top: ui.position.top, left: ui.position.left};
					     now.sendMSMsg('SSControlDrag',data);
				    }
				});
			$( '#screen-content'+i ).bind({
				    resize: function(e,ui) {
					     //console.log('resizing: ui ',);
					     var data = {index: i, width: ui.size.width, height: ui.size.height};
					     now.sendMSMsg('SSControlResize',data);
				       }
			});		
		  $('#screen-content'+i ).css('z-index','90');
		break;
        case 'SSControlDrag':
           //console.log('recieved ssControlDrag: index: '+data.index+' top: '+data.top+' left: '+data.left);
           $('#screen-content'+ data.index).css({
              'top': data.top,
              'left': data.left
            });
        break; 
        case 'SSControlResize':
        //   console.log('recieved ssControlResize: index: '+data.index+' width: '+data.width+' heigh: '+data.height);
            $('#screen-content'+ data.index).width(data.width);
            $('#screen-content'+ data.index).height(data.height);

        break;
        case 'endSSControl':
             console.log('recieved endSSControl index: ',data);
             jQuery('#ssarea'+data).empty(); 
        break;
        case 'audioCallClicked':
              audioRemoteClick = true;
              $('#audioCall').click();
        break;
        case 'audioControlDrag':
             $("#audioarea").css({
               'top': data.top,
               'left': data.left
             });
             break;
        case 'makeAudioCall':
             console.log('recieved makeAudioCall ');
             remoteMakeAudioCall = true;
             makeAudioCall();
             break;
        case 'HangUpAudioCall':
             console.log('recieved HangUpAudioCall' );
             remoteHangUpAudio = true;
             hangUpAudio();
             break;
        case 'addPeopleAudio':
            console.log('recieved addPeopleAudio');
            remoteAddPeopleAudio = true;
            audioAddPeople();
            break;
        case 'addPersonAudio':
            console.log('recieved addPersonAudio');
            remoteAddPersonAudio = true;
            audioAddPerson();
            break;
        case 'videoControlDrag':
                $("#videoconf").css({
                  'top': data.top,
                  'left': data.left
                });
            break;
        case 'videoControlResize':
               console.log('recieved video control resize: ',data);
               $('#videoconf').width(data.width);
               $('#videoconf').height(data.height);
            break;
        case 'recRemoteVideoCall':
              $("#videoconf").addClass("videocontainer")
                  .width($(window).width()/3)
                  .draggable({
                    drag: function (e, ui) {
                       var data = {top: ui.position.top, left: ui.position.left};
                       now.sendMSMsg('videoControlDrag',data);
                     }
                 });
                 jQuery('#vcCall').html('<h4>HangUp</h4>');
                 VCActive = true;
            break;
		case 'stopVC':
		  console.log('recieved stop VC from master');
		  remoteVCStop = true; 
		  jQuery('#vconf li').click();
		  break;
		case 'audioCallAddParticipant':
		      $('#audioTable tr:last').after('<tr class="user '+data.streamid+'"><td style="font-weight:bold">'+data.userid+'</td><td>Connected</td><td><a class="btn btn-small">Mute</a></td><td><a class="btn btn-small">Hold </a></td></tr>');
		   break;
		case 'audioCallDelParticipant':
		   caller = jQuery('#audioarea').find('.'+data.streamid);
	       if (caller.length){
	         jQuery(caller).detach()
	       }
		   break;

		
	  }
   }  
}





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
    var windowPosX = ((select.target.item.bounds.topLeft.x-paper.view.bounds.topLeft.x+select.target.item.bounds.width)*paper.view.zoom);
    var windowPosY = (select.target.item.bounds.topLeft.y-paper.view.bounds.topLeft.y)*paper.view.zoom;
    jQuery('button').filter('.delete-object').css({left:windowPosX,top:windowPosY});
  }

  debugShowRect = function(itemName,item){
	console.log(itemName+': ('+item.left+','+item.top+') - ('+item.width+','+item.height+')');
  }
  scrollNav = function(){
	console.log('scrollNav');
    c.addClass('nav');
    nw.show();
    //Get current Viewport bounds
    var windowTop = paper.view.bounds.top;
    var windowRight = paper.view.bounds.right;
    var windowBottom = paper.view.bounds.bottom - (55 / paper.view.zoom);
    var windowLeft = paper.view.bounds.left;
    //Get Active Paper bounds (drawn objects)
    var paperTop = Math.floor(paper.project.activeLayer.bounds.top)-20;
    var paperRight = Math.ceil(paper.project.activeLayer.bounds.right)+20;
    var paperBottom = Math.ceil(paper.project.activeLayer.bounds.bottom); //- (55 / paper.view.zoom))+20;
    var paperLeft = Math.floor(paper.project.activeLayer.bounds.left)-20;
    //Calculate bounds of viewable area (viewport + paper)
    var navTop = Math.min(windowTop,paperTop) * 1.5;   // scale to make bounds bigger than paper.  
    var navRight = Math.max(windowRight, paperRight) * 1.5;
    var navBottom = Math.max(windowBottom, paperBottom) * 1.5;
    var navLeft = Math.min(windowLeft, paperLeft) * 1.5 ;
    //Get current width and height of viewport
    var windowLength = paper.view.bounds.width;
    var windowHeight = paper.view.bounds.height - (55 / paper.view.zoom);  // to adjust for the tool bar at bottom of window
    //Get the width and height of viewable area
    var navLength = navRight - navLeft;
    var navHeight = navBottom - navTop;
    //Calculate ratios for view square and movement calculations  200 & 150 are size of navWindow in wall.css
    var rLength = navLength / 200;    
    var rHeight = navHeight / 150;     
    var canvas;
              
    //Set the original position of the drag event. 
    //The Drag event doesn't record previous position, just original, this is need to keep track of last position.
    var originalPosition = {
      top  : false,
      left : false
    }

// debug stuff
   debugShowRect('Window',paper.view.bounds);
   debugShowRect('Active Layer',paper.project.activeLayer.bounds);
    console.log('Window: ('+paper.view.bounds.left+','+paper.view.bounds.top+') - ('+paper.view.bounds.width+','+paper.view.bounds.height+')');
    console.log('Active Layer:('+paper.project.activeLayer.bounds.left+','+paper.project.activeLayer.bounds.top+') - ('+paper.project.activeLayer.bounds.width+','+paper.project.activeLayer.bounds.height+')' );

   console.log('Bottom: '+paper.view.bounds.bottom+' Height: '+paper.view.size.height);

   // console.log('windowTop: ', windowTop);
   // console.log('windowRight: ', windowRight);
   // console.log('windowBottom: ', windowBottom);
  //  console.log('windowLeft: ', windowLeft);

  //  console.log('View Size heigt: ',paper.view.size.height );
  //  console.log('view size width: ', paper.view.size.width );

  //  console.log('PaperTop: ', paperTop);
  //  console.log('PaperRigh: ', paperRight);
  //  console.log('PaperBottom: ', paperBottom);
  //  console.log('PaperLeft: ', paperLeft);

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
          if (!zoomAreaActive) {
            now.sendMSMsg('scroll', pan.v);  // send action to paired screen
            //console.log('sending scroll msg');
          }
          else {
	        var data = { x: paper.view.bounds.left, y: paper.view.bounds.top, height: (paper.view.size.height - (55 / paper.view.zoom)), width: paper.view.size.width}; // 55 is height of the tool bar
		    now.sendMSMsg('zoomAreaMove',data);
          }
        },
        stop: function(event, ui){
          //Clear the original position
          originalPosition.left = false;
          originalPosition.top = false;
        }
      });
  }

  //image loading
  loadImage = function(id, position, src, callback){
    var image = document.createElement('img');
    image.src = src
    image.onload = function(){
      raster = new Raster(image);
      raster.name = id
      raster.position = position
      paper.view.draw();
      jQuery('#alerts').children().detach();
      callback();
    }
  }

  //path loading
  loadPoints = function(p,callback){
    points = new Array();
    for (n in p.description){
      points.push(JSON.parse(p.description[n]));
    }
    var path = new Path(points);
    path.strokeColor = p.color;
    path.strokeWidth = p.width;
    path.opacity = p.opacity;
    path.name = p._id;
    callback();
  }
/***************  screen sharing functions *************/

function getURIfromcanvas(i) {
    var ImageURItoShow = "";
    var canvasFromScreen = document.getElementById('imageView'+i);
    if (canvasFromScreen.getContext) {
        var ctx = canvasFromScreen.getContext("2d"); // Get the context for the canvas.canvasFromVideo.
        var ImageURItoShow = canvasFromScreen.toDataURL("image/png");
        now.sendImage(ImageURItoShow, paper.project.activeLayer.index, view.center, function(name){
          loadImage(name, view.center, ImageURItoShow, function(){
            paper.view.draw();
          });
        });
    }
   // var imgs = document.getElementById("imgs");
   // imgs.appendChild(Canvas2Image.convertToImage(canvasFromVideo, 300, 200, 'png'));
}


function ssCapture(i) {
	//  to get a clear capture need large canvas but large image to insert. 
	//  todo - make canvas larger ie1300x730  and then scale down with add to paperjs  
    var screen = document.getElementById('screen-video'+i);
    var canvasDraw = document.getElementById('imageView'+i);
    var w = canvasDraw.width;
    var h = canvasDraw.height;
    console.log('ssCapture: width: '+w+' height: '+h);
    var ctxDraw = canvasDraw.getContext('2d');

    ctxDraw.clearRect(0, 0, w, h);
    ctxDraw.drawImage(screen, 0, 0, w, h);
    ctxDraw.save();
    
	getURIfromcanvas(i);	 
}
function ssMax(i){
	  var screenWidth, screenHeight;
       $('#screen-content'+i ).show();

     // screenStream[i].mediaElement.width = 500;  
     // screenStream[i].mediaElement.height = 282;
      screenStream[i].mediaElement.width = $(window).width()/4;
      screenStream[i].mediaElement.height = ($(window).width()/4)/1.77;  // have 16:9 aspect ratio
 
      console.log('ssMax - video height: '+$('#screen-video'+i).height()+' width: '+$('#screen-video'+i).width());
      
	  
      jQuery('#screen-content'+i).width($(window).width()/4);
      jQuery('#screen-content'+i).height(($(window).width()/4)/1.77);  // have 16:9 aspect ratio

	  jQuery('#screen-content'+i).append('<div class="srceen-background"></div><div class="vidInfo"><h4 class="screenInfo">'+screenName[i]+'</h4><button id="videoSnap'+i+'" type="button value="snap" class="btn-mini videoSnapBtn" ><i class="icon-camera"></i></button></div>');
      jQuery('#videoSnap'+i).click(function(e){
	     console.log('clicked video capture');
	    ssCapture(i);
		gAlert('Screen Image Captured');
      });
      x=jQuery('#screen-video'+i).position();
      console.log('ssMax - screen-video position: top: '+x.top+' left: '+x.left);
      //$('#screen-content1').addClass('resizable');

	  $( '#screen-content'+i )
	    .resizable({
	      alsoResize: '#screen-video'+i,
	      aspectRatio: 16 / 9
	    })
		.draggable(	{
			    drag: function (e, ui) {
				     var data = {index: i, top: ui.position.top, left: ui.position.left};
				     now.sendMSMsg('SSControlDrag',data);
			    }
			});
		$( '#screen-content'+i ).bind({
			    resize: function(e,ui) {
				     //console.log('resizing: ui ',);
				     var data = {index: i, width: ui.size.width, height: ui.size.height};
				     now.sendMSMsg('SSControlResize',data);
			       }
		});
	  $('#screen-content'+i ).css('z-index','90');

	  
	  
	// send info to set up ss control on slave
		
	  var data = {index: i, name:screenName[i], width: 500, height: 282, top: x.top, left: x.left, wiw: window.innerWidth , wih: window.innerHeight }; 
	  now.sendMSMsg('initSSControl',data);

}

function ssBack(){  // put the screen sharing behind the whiteboard
   jQuery('canvas').css('z-index','1');
   jQuery('screen-container').css('z-index','-1');	
}
function ssFront(){  // move whiteboard down for screen sharing view
   jQuery('canvas').css('z-index','-1');
   jQuery('screen-container').css('z-index','1');
}

var screenStream =[];
var screenName =[];


var isScreenShareInitiator = [];
isScreenShareInitiator[1] = false;
isScreenShareInitiator[2] = false;
isScreenShareInitiator[2] = false;
var maxNumSS = 3;
var screenShareActive = false;

var screenFull = true;   // get rid of when remove other button stuff 
var screenCapture = false;  // dito 

var ssConnections = 0;  // index to screen connections
var myssConnection = 0;  //  connection intiaited by this client

var screenConnection1 = new RTCMultiConnection();
screenConnection1.session = {
    screen: true
};
screenConnection1.direction = 'one-way';
screenConnection1.enableSessionReinitiation = false;
screenConnection1.firebase = 'kolabria';

screenConnection1.onNewSession = function (session) { 
	if (mode != 'slave') {      
      console.log('onNewSession-screen 1: ', session); 
       if (!isScreenShareInitiator[1]) {
         
         jQuery('#ssarea1').append('<div id="screen-content1"></div><div id="captureArea1" style="border:none"><canvas id="imageView1" class="imageView" width="1000" height="560"></canvas></div>');
         screenName[1] = session.extra.name;
         screenConnection1.join(session);
       }
       else{
	     screenShareActive = true;
         jQuery('#ssShare').html('<h4>Close</h4>');
       }
    }
};

screenConnection1.onstream = function (stream) {
 if (mode != 'slave') { 
   ssConnections++;   //increment number of active connections
   console.log('Screen onstream 1:',stream);
   $('#screen-content1').append(stream.mediaElement);
   screenStream[1] = stream;
   stream.mediaElement.id = 'screen-video1';
   stream.mediaElement.controls = false;
   screenName[1] = stream.extra.name;
   ssMax(1);   
 }
};

// remove video if someone leaves
screenConnection1.onstreamended = function(e) {
	if (mode != 'slave') {
	  ssConnections--;  //  reduce number of active connections 
	  console.log('ss stream ended 1: share screen ended');
	  jQuery('#ssarea1').empty();  
	  now.sendMSMsg('endSSControl',1);
    }
};


var screenConnection2 = new RTCMultiConnection();
screenConnection2.session = {
    screen: true
};
screenConnection2.direction = 'one-way';
screenConnection2.enableSessionReinitiation = false;
screenConnection2.firebase = 'kolabria';

screenConnection2.onNewSession = function (session) { 
	if (mode != 'slave') {      
      console.log('onNewSession-screen 2: ', session); 
       if (!isScreenShareInitiator[2]) {
         console.log('onNewSession-screen 2: step 2'); 
         jQuery('#ssarea2').append('<div id="screen-content2"></div><div id="captureArea2" style="border:none"><canvas id="imageView2" class="imageView" width="1000" height="560"></canvas></div>');
         screenName[2] = session.extra.name;
         screenConnection2.join(session);
       }
       else{
	     screenShareActive = true;
         jQuery('#ssShare').html('<h4>Close</h4>');
       }
    }
};


screenConnection2.onstream = function (stream) {
 if (mode != 'slave') { 
   ssConnections++;   //increment number of active connections
   console.log('Screen onstream 2:',stream);
   $('#screen-content2').append(stream.mediaElement);
   screenStream[2] = stream;
   stream.mediaElement.id = 'screen-video2';
   stream.mediaElement.controls = false;
   screenName[2] = stream.extra.name;
   ssMax(2);   
 }
};

// remove video if someone leaves
screenConnection2.onstreamended = function(e) {
	if (mode != 'slave') {
	  ssConnections--;  //  reduce number of active connections 
	  console.log('ss stream ended 2: share screen ended');
	  jQuery('#ssarea2').empty();  //I need to remove more than just parent but what?
	  now.sendMSMsg('endSSControl',2);
    }
};


var screenConnection3 = new RTCMultiConnection();
screenConnection3.session = {
    screen: true
};
screenConnection3.direction = 'one-way';
screenConnection3.enableSessionReinitiation = false;
screenConnection3.firebase = 'kolabria';

screenConnection3.onNewSession = function (session) { 
	if (mode != 'slave') {      
      console.log('onNewSession-screen 3: ', session); 
       if (!isScreenShareInitiator[3]) {
         
         jQuery('#ssarea3').append('<div id="screen-content3"></div><div id="captureArea3" style="border:none"><canvas id="imageView3" class="imageView" width="1000" height="560"></canvas></div>');
         screenName[3] = session.extra.name;
         screenConnection3.join(session);
       }
       else{
	     screenShareActive = true;
         jQuery('#ssShare').html('<h4>Close</h4>');
       }
    }
};

screenConnection3.onstream = function (stream) {
 if (mode != 'slave') { 
   ssConnections++;   //increment number of active connections
   console.log('Screen onstream 1:',stream);
   $('#screen-content3').append(stream.mediaElement);
   screenStream[3] = stream;
   stream.mediaElement.id = 'screen-video3';
   stream.mediaElement.controls = false;
   screenName[3] = stream.extra.name;
   ssMax(3);   
 }
};

// remove video if someone leaves
screenConnection3.onstreamended = function(e) {
	if (mode != 'slave') {
	  ssConnections--;  //  reduce number of active connections 
	  console.log('ss stream ended 3: share screen ended');
	  jQuery('#ssarea3').empty();  
	  now.sendMSMsg('endSSControl',3);
    }
};

jQuery('#ShareScreen li').click(function(e){
 // e.stopImmediatePropagation(); //Two clicks are fired, this is a patch, need to find reason why.
  var li = jQuery(this);
  cl = li.attr('data-value');
  switch(cl){
      case 'ssShare':  
        if (!screenShareActive){  // open screen share session
	        var browserNotChrome = false;
	        var badPeople = " ";
	        console.log('usernames length: ',usernames.length);
	        for (i=0; i < usernames.length; i++){
		      console.log('name: '+usernames[i].name+' browser: '+usernames[i].browser+' mode: '+usernames[i].mode);
		      if (usernames[i].browser != "Chrome" && usernames[i].mode == 'master') { 
			    browserNotChrome = true; 
			    badPeople = badPeople+usernames[i].name+' , ';
		      }
	        }
	        if (browserNotChrome) {
		     window.alert('Chrome is needed for this function.  The following people are using a browser other than Chrome: '+ badPeople);
		     break; 
        	}
          if (mode != 'slave'){
	        if (ssConnections < maxNumSS) {
               console.log('Open Screen - index: ',ssConnections);
               var i = myssConnection = ssConnections+1;
               jQuery('#ssarea'+i).append('<div id="screen-content'+i+'"></div><div id="captureArea'+i+'" style="border:none"><canvas id="imageView'+i+'" class="imageView" width="1000" height="560"></canvas></div>');
              // jQuery('#ssarea'+i).append('<section id="screen-container'+i+'"></section><div id="container'+i+'" style="border:none"><canvas id="imageView'+i+'" class="imageView" width="1000" height="560"></canvas></div>');
               $('#screen-content'+i ).hide();
               switch (myssConnection){
	             case 1:
	                 screenConnection1.extra = {
				       name: name,
				     };     
	                 screenConnection1.open('screen1'+wallId);
	               break;
	              case 2:
	                 screenConnection2.extra = {
				       name: name,
				     };     
	                 screenConnection2.open('screen2'+wallId);
	               break;
	               case 3:
	                 screenConnection3.extra = {
				       name: name,
				     };     
	                 screenConnection3.open('screen3'+wallId);
	               break;
               }
                isScreenShareInitiator[myssConnection] = true;  
            
               now.actionMeeting(wallId, name, 'goSS');  // log action on server 
               screenShareActive = true;
	           jQuery('#ssShare').html('<h4>Close</h4>');
            }
            else {
	           console.log("maximum number of ss reached: connections",ssConnections);
	           alert('Maximum number of screens have already been shared');
            }
          }
          else {
	         now.sendMSMsg('startSS');
	         screenShareActive = true;
             jQuery('#ssShare').html('<h4>Close</h4>');
          }
        }
        else {  // close screen share session
          if ( mode != 'slave') { 
	        console.log('close Screen',myssConnection);
	        switch (myssConnection){
	           case 1:
                   screenConnection1.leave();
                   screenConnection1.close();
	               break;
	           case 2:
                  screenConnection2.leave();
                  screenConnection2.close();
	              break;
	           case 3:
                  screenConnection3.leave();
                  screenConnection3.close();
	              break;
            }
            isScreenShareInitiator[myssConnection] = false;
            screenShareActive = false;
          }
          else {
            now.sendMSMsg('stopSS');
          }
          screenShareActive = false;
          jQuery('#ssShare').html('<h4>Share Screen</h4>');
        }
        
        break;
     case 'ssSize':  //  resize screen size
        if (mode != 'slave'){
          if (screenFull) {
	        ssBack();
            jQuery('#ssSize').html('<h4>Show</h4>');
            screenFull = false;
          }
          else {
            ssFront();
            jQuery('#ssSize').html('<h4>Hide</h4>');
            screenFull = true; 
          }
        }
        else {
          if (screenFull) {
            jQuery('#ssSize').html('<h4>Show</h4>');
            screenFull = false;
          }
          else {
            jQuery('#ssSize').html('<h4>Hide</h4>');
            screenFull = true; 
          }
	      now.sendMSMsg('sizeSS');
        }
        break;
     case 'ssCapture':   // capture screen image to whiteboard 
        if (mode != 'slave'){
          if (!screenCapture) {
	        ssBack();
	        ssCapture();
            jQuery('#ssCapture').html('<h4>Release</h4>');
            screenCapture = true;
            now.sendScreenCapture('capture');
            now.actionMeeting(wallId, name, 'goSSCapture');
          }
          else {
	        ssFront();
	        jQuery('#ssCapture').html('<h4>Capture</h4>');
	        screenCapture = false; 
	        now.sendScreenCapture('release');
          }
        }
        else {
          if (!screenCapture) {
            jQuery('#ssCapture').html('<h4>Release</h4>');
            screenCapture = true;
          }
          else {
	        jQuery('#ssCapture').html('<h4>Capture</h4>');
	        screenCapture = false; 
          }
	      now.sendMSMsg('captureSS');
        }
        break;
  }
});

//  need to modify for new way capture works.  Probably just need to relay command. 
now.screenCapture = function(cmd){
  if (mode != 'slave') { 
    if (cmd == 'capture'){
      ssBack();
      jQuery('#ssCapture').html('<h4>Release</h4>');
      screenCapture = true;
    }
    else if (cmd == 'release'){
       ssFront();
       jQuery('#ssCapture').html('<h4>Capture</h4>');
       screenCapture = false;
    }
  }
}

screenConnection1.connect('screen1'+wallId);
screenConnection2.connect('screen2'+wallId);
screenConnection3.connect('screen3'+wallId);

/*************** video conferencing functions *************/
var isVCInitiator = false;
var VCActive = false;
var VCSession;
var localVCStream;
var remoteVCStreams = new Array();
var remoteVideoSize = 200;
var remoteVCStop = false;

var VCSizeX = 200;
var VCSizeY = 200; 
var VCWidth, VCHeight;
var VCConnection = new RTCMultiConnection();
VCConnection.session = {
        audio: true,
        video: true
    };
	
var TURN = {
    url: 'turn:turn.bistri.com:80',
    credential: 'homeo',
    username: 'homeo'
   // url: 'turn:homeo@turn.bistri.com:80',
   // credential: 'homeo'
};

var iceServers = {
    iceServers: [TURN]
};
/*
if (!!navigator.webkitGetUserMedia) {
    if (parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) >= 28) {
	        TURN = {
            url: 'turn:turn.bistri.com:80',
            credential: 'homeo',
            username: 'homeo'
        };

        iceServers.iceServers = [TURN];
    }
}
*/

VCConnection.iceServers = iceServers;
VCConnection.direction = 'many-to-many'
VCConnection.enableSessionReinitiation = false;
VCConnection.firebase = 'kolabria';


sizeVideo = function() {
	// rezise local and remote video elements based on number of participants and size of window
	var vHeight;
	var vWidth;
	var areaWidth = $(window).width()/3;  // - make 1/3  - /3
	//console.log ('areaWidth: ',areaWidth);
	var areaheight = $(window).height() - jQuery('#toolbar').height();
	//console.log('areaheight: ',areaheight);
	// make local video 1/2 size of remote video
	var numRemotes = remoteVCStreams.length;
	//console.log('num remotes streams: ',numRemotes);
	if (numRemotes != 0){
	  vHeight = areaheight / (numRemotes+1); 

	  vWidth = vHeight * 1.7778;   //  HD video aspect ratio calulation
	  if (vWidth > areaWidth){
		// use area Width for sizing 
		vWidth = areaWidth;
		vHeight = vWidth /1.7778; 
      }
	
	  //console.log('Video Height: ',vHeight);
	  for (i=0; i<remoteVCStreams.length; i++){
		remoteVCStreams[i].mediaElement.width =vWidth;  
	  	remoteVCStreams[i].mediaElement.height =vHeight;
	  }
	  localStream.mediaElement.width = vWidth/2;  
	  localStream.mediaElement.height =vHeight/2;
	  jQuery('#videoconf').width(vWidth);
	  //jQuery('canvas').css({left:vWidth+10});  // readjust canvas positioning so don't have wasted space 
    }	
    var data = {width: $('#videoconf').width() , height: $('#videoconf').height()};
    now.sendMSMsg('videoControlResize',data);
}

VCConnection.onNewSession = function (session) {  
	 if (mode != 'slave') {    
        console.log('onNewSession-VC: ', session); 
         if (!isVCInitiator) {
           jQuery('#videoconf').append('<section id="remote-videos-container"></section><section id="local-video-container"></section>');
           $("#videoconf").addClass("videocontainer")
               .width($(window).width()/3)
               .draggable(	{
					    drag: function (e, ui) {
						     var data = {top: ui.position.top, left: ui.position.left};
						     now.sendMSMsg('videoControlDrag',data);
					    }
					});
         
           VCSession = session;
           VCConnection.join(session);

           VCActive = true;
           jQuery('#vcCall').html('<h4>HangUp</h4>');
           now.sendMSMsg('recRemoteVideoCall');
         }
 
         VCSession = session;
      }
};

VCConnection.onstream = function (stream) {
	if (mode != 'slave') {
	  console.log('Video onstream:',stream);
	  var video = document.createElement('div');
      video.className = 'video-container';
      video.id = stream.userid; 
      console.log('stream id: ',stream.userid);
      video.appendChild(stream.mediaElement);
      if (stream.type === 'local') {
          localStream = stream;
          document.getElementById('local-video-container').appendChild(video);
         
          var middle = $(window).width()/2;
          stream.mediaElement.width = middle/2 ;  
		  stream.mediaElement.height = middle/2/1.7778;
		  stream.mediaElement.muted = true; 
		  stream.mediaElement.controls = false;
		
		  sizeVideo();
		  var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
         
      }
      if (stream.type === 'remote') {
          remoteVCStreams.push(stream);
          var remoteVideosContainer = document.getElementById('remote-videos-container');
          remoteVideosContainer.appendChild(video, remoteVideosContainer.firstChild);
 
          var videosize = ($(window).width()/2*3)/4;
	 	  stream.mediaElement.width = videosize ;
		  stream.mediaElement.height = videosize/1.7778;
		  stream.mediaElement.controls = false;
		 
		  sizeVideo();
          //stream.mediaElement.width = remoteVideoSize ;   //keep for video window controls
	      //stream.mediaElement.height = remoteVideoSize ;
		  var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
 
      }
    }
};


VCConnection.onstreamended = function(e) {
        if (e.mediaElement.parentNode) e.mediaElement.parentNode.removeChild(e.mediaElement);
    };

VCConnection.onUserLeft = function(userid) {
	if (mode != 'slave') {
	  console.log('Left - userid: ',userid);
	  var video = document.getElementById(userid);
	  if(video) video.parentNode.removeChild(video);
    }
};
//  this doesn't do anything  I think never gets fired. 
VCConnection.onclose = function(e) {
    $("#videoconf").removeClass("videocontainer");
   console.log('VCConnection: on close');
}

jQuery('#vconf li').click(function(e){
 // e.stopImmediatePropagation(); //Two clicks are fired, this is a patch, need to find reason why.
  var li = jQuery(this);
  cl = li.attr('data-value');
  //console.log('clicked vconf button cl: ',cl);
  switch(cl){
      case 'vcCall': 
        if (!VCActive) {
	        //console.log('Browser: ',$.ua.browser.name);
	        //console.log('Browser version: ',$.ua.browser.version);
	        //console.log('Browser version: ',$.ua.browser.major);
	        var browserNotChrome = false;
	        var badPeople = " ";
	        console.log('usernames length: ',usernames.length);
	        for (i=0; i < usernames.length; i++){
		      console.log('name: '+usernames[i].name+' browser: '+usernames[i].browser);
		      if (usernames[i].browser != "Chrome"  && usernames[i].mode == 'master') {
			    browserNotChrome = true; 
			    badPeople = badPeople+usernames[i].name+' , ';
		      }
	        }
	        if (browserNotChrome) {
		     window.alert('Chrome is needed for this function.  The following people are using a browser other than Chrome: '+ badPeople);
		     break; 
        	}
              $("#videoconf").addClass("videocontainer")
			      .width($(window).width()/3)
			      .draggable({
					    drag: function (e, ui) {
						     var data = {top: ui.position.top, left: ui.position.left};
						     now.sendMSMsg('videoControlDrag',data);
					    }
					});
            if (mode != 'slave') {
	      	  console.log('Open VC');
	          
	          jQuery('#videoconf').append('<section id="remote-videos-container"></section><section id="local-video-container"></section>');			       
	          VCConnection.open('video'+wallId);  
	          isVCInitiator = true;  	          
	          now.actionMeeting(wallId, name, 'goVC');
            }
            else {
	          now.sendMSMsg('startVC');
            }
            VCActive = true;
            jQuery('#vcCall').html('<h4>HangUp</h4>');
        }
        else {

	        if (mode != 'slave') {          
	          jQuery('#videoconf').empty();
	          VCConnection.leave();
	        }
		    
	        $("#videoconf").removeClass("videocontainer");
	        VCActive = false;
	        jQuery('#vcCall').html('<h4>Call</h4>');
		    if (remoteVCStop) {	     
		       remoteVCStop = false; 
		    }
		    else {
		  	  now.sendMSMsg('stopVC');
	        }
	
        }
        break;
     case 'vcFull':
        
        break;
     case 'vcSplit':

        break;
  }
});
VCConnection.connect('video'+wallId);

/**************  audio conference call stuff *********/

addAudioUI = function(){
    //jQuery('#audioParticipants').append('<div id="audioarea" class="audiolist"><ul id="audioNames" style="list-style-type:circle">Audio Call Participants<li style="list-style-type:none"><hr></li></ul></div>');
    jQuery('#audioParticipants').append('<div id="audioarea" class="audiolist">
     <h3 align="center">Conference Call</h3>
    <hr>
    <table id="audioTable" cellpadding="10" cellspacing="3">
        <tr>
            <th>Name</th>
            <th>Status</th>
        </tr>
    </table>
    <br>
    <div><a onclick="makeAudioCall()" class="btn" id="AudioMakeCall" style="float:right" >Web Call </a> </div>
    <input id="callMeNumber" type="text" name="callMeNumber" placeholder="Number to call you at - coming soon"> 
    <a onclick="callMe()" class="btn">Call Me</a>
    <p> Call 1-800-555-1212 (Coming Soon)</p>
    <a class="btn" style="float:right">Add Participants </a>
   </div>');
    $( "#audioarea" ).draggable().css('z-index','90');
}

$( "#audioarea" ).draggable({
	    drag: function (e, ui) {
		     var data = {top: ui.position.top, left: ui.position.left};
		     now.sendMSMsg('audioControlDrag',data);
	    }
	});

$( "#audioarea" ).css('z-index','90');

$('#audioStopCtl').hide();
$('#audioAddPeople').hide();
$('#confCallAdd').hide();

var audioRemoteClick = false; 
var remoteMakeAudioCall = false;
var remoteHangUpAudio = false;
var remoteAddPersonAudio = false;
var remoteAddPeopleAudio = false;
var audioUIVisible = false;
var audioFistClick = true;
var audioCallActive = false;
var isAudioInitiator = false;
var audioContainer = document.getElementById('audioconf');
var audioConnection = new RTCMultiConnection();
audioConnection.session = {
        audio: true
};
audioConnection.direction = 'many-to-many'
audioConnection.enableSessionReinitiation = false;
audioConnection.firebase = 'kolabria';
//audioConnection.session = "audio";

audioConnection.userid = name;
//audioConnection.preferSCTP = false; 

audioConnection.onNewSession = function (session) {  
	 if (mode != 'slave') {    
        console.log('onNewSession-audio: ', session); 
         if (!isAudioInitiator) {
           audioConnection.join(session);
           audioCallActive = true;
           jQuery('#audioarea').show();
           $('#audioStartCtl').hide();
           $('#audioStopCtl').show();
           audioUIVisible = true;
           $('#audioCall').addClass('btn-success');
         }
      }
};


audioConnection.onstream = function(e) {
	if (mode != 'slave') { 
       console.log('audioConnection on Stream');
       audioContainer.insertBefore(e.mediaElement, audioContainer.firstChild);
       if (e.type === 'local')
          console.log('local stream');
       if (e.type === 'remote')
         console.log('remote stream');
       console.log(e.userid+' has joined audio conf: ',e.type);
       $('#audioTable tr:last').after('<tr class="user '+e.streamid+'"><td style="font-weight:bold">'+e.userid+'</td><td>Connected</td><td><a class="btn btn-small">Mute</a></td><td><a class="btn btn-small">Hold </a></td></tr>');
        //jQuery('#audioarea').find('ul').append('<li class="user '+e.streamid+'">'+e.userid+'</li>');
       var data = {streamid: e.streamid, userid: e.userid};
       now.sendMSMsg('audioCallAddParticipant',data);
     }
 };

audioConnection.onstreamended = function(e) {
	if (mode != 'slave') { 
       console.log('audioConnection stream ended');
       if (e.mediaElement.parentNode) {
           e.mediaElement.parentNode.removeChild(e.mediaElement); 
       }
       caller = jQuery('#audioarea').find('.'+e.streamid);
       if (caller.length){
         jQuery(caller).detach()
       }
       var data = {streamid: e.streamid};
       now.sendMSMsg('audioCallDelParticipant',data);
     }
 };



jQuery('#audioCall').click(function(e){
	  console.log("clickme");
      if (!audioUIVisible) {
	    jQuery('#audioarea').show();
	    audioUIVisible = true;
	  }
      else {
	    jQuery('#audioarea').hide();
	    audioUIVisible = false;
	  }
	  if (audioRemoteClick) {	     
	     audioRemoteClick = false; 
	  }
	  else {
		now.sendMSMsg('audioCallClicked');
      }
});

closeAudioModal = function(){
	$('#audioCallModal').modal('hide');
}
closeEndAudioModal = function(){
	$('#endAudioCallModal').modal('hide');
}

callMe = function(){
	alert('Comming Soon');
}

hangUpAudio = function(){
	console.log("call ended");
	if (mode != 'slave') { 
	  audioCallActive = false;
	  audioConnection.leave();
    }
	$('#audioCall').removeClass('btn-success');
	$('#audioStopCtl').hide();
	$('#audioStartCtl').show();
    $('#confCallAdd').hide();
   // $('#audioAddPeople').hide();
	if (!remoteHangUpAudio){
      now.sendMSMsg('HangUpAudioCall');
      remoteHangUpAudio = false;
	}
}
makeAudioCall = function(){
	if (mode != 'slave') { 
	  //  start a web call with other participants -  later have this phone conference bridge 
      console.log("start call");
      //$('#audioCallModal').modal('hide');
      audioCallActive = true;
      audioConnection.extra = {
         name: name,
      };
    //addAudioUI();
      audioConnection.open('audio'+wallId); 
      isAudioInitiator = true;

    }
    if (!remoteMakeAudioCall) {
      now.sendMSMsg('makeAudioCall');
      remoteMakeAudioCall = false;
    }
    $('#audioCall').addClass('btn-success');
    $('#audioStartCtl').hide();
    $('#audioStopCtl').show();
    //$('#confCallAdd').show();
}

audioAddPeople = function(){
    $('#audioAddPeople').show();
    $('#confCallAdd').hide();
    if (!remoteAddPeopleAudio){
      now.sendMSMsg('addPeopleAudio');
      remoteAddPeopleAudio = false;
   }
}

audioAddPerson = function() {
  $('#audioAddPeople').hide(); 
  $('#confCallAdd').show();
  $('#audioTable tr:last').after('<tr class="user123"><td style="font-weight:bold">Bob</td><td>Calling</td><td><a class="btn btn-small">Mute</a></td><td><a class="btn btn-small">Hold </a></td></tr>');
  if (!remoteAddPersonAudio){
	  now.sendMSMsg('addPersonAudio');
      remoteAddPersonAudio = false;
   }
}

audioConnection.connect('audio'+wallId);

/************ PPT viewer functions ********/

  pptListClose = function(){
	$('#pptList').modal('hide');
  }
  pptUploadClose = function(){
	$('#pptUpload').modal('hide');
  }

  viewerOpen = function(doc,key){
     $('#pptList').modal('hide');
     $('#pptLoad').modal();

     console.log("ViewerOpen - doc: "+doc+" key: "+key);

	  scribd_doc = scribd.Document.getDoc(doc, key);  // 82238489  82219960 95456595
     // var url = 'http://my.wikiwall.com/static/docs/important_stuff.ppt';
     // var pub_id = 'pub-75073526984173724111';
     // scribd_doc = scribd.Document.getDocFromUrl(url, pub_id);
      var onDocReady = function(e){
	    $('#pptLoad').modal('hide');
	    $('#pptShow').modal();
	    console.log("DocReady - Pages:"+scribd_doc.api.getPageCount());
      // scribd_doc.api.setPage(3);
      }
      scribd_doc.addParam('jsapi_version', 2);
      scribd_doc.addEventListener('docReady', onDocReady);
      scribd_doc.addParam('height', 470);
      scribd_doc.addParam('width', 560);
      scribd_doc.addParam('mode','slide');
      scribd_doc.write('embedded_doc');

	// need to send msg to other clients
	 now.sendViewerOpen(doc,key);
  }

  viewerClose = function(){
	 $('#pptShow').modal('hide');
	// need to send msg to other clients
	 now.sendViewerClose();
  }

  viewerNext = function(){
    //console.log("Next");
     // advance slide
    var total = scribd_doc.api.getPageCount()
    var page = parseInt(scribd_doc.api.getPage());
   // console.log('total: '+ total+' page: '+page);
    if (page < total) {
      scribd_doc.api.setPage(page+1); 
    }
    // send msg to other clients
    now.sendViewerNext();	
  }

  viewerPrev = function(){
	 // console.log("Prev");
     // go back one slide
	var page = parseInt(scribd_doc.api.getPage());
	if (page > 1) {
		scribd_doc.api.setPage(page-1); 
    }
     //  send message to other clients	
    now.sendViewerPrev();
  }

  viewerBegin = function(){
     // go to first slide
	scribd_doc.api.setPage(1); 
     //  send message to other clients	
    now.sendViewerBegin();
  }

  now.viewerOpen = function(doc,key){
 	
      $('#pptLoad').modal();
	  scribd_doc = scribd.Document.getDoc(doc, key);  // 82238489  82219960
     // var url = 'http://my.wikiwall.com/static/docs/important_stuff.ppt';
     // var pub_id = 'pub-75073526984173724111';
      
      //scribd_doc = scribd.Document.getDocFromUrl(url, pub_id);
      var onDocReady = function(e){
	    $('#pptLoad').modal('hide');
	    $('#pptShow').modal();
	    console.log("DocReady");
      // scribd_doc.api.setPage(3);
      }
      scribd_doc.addParam('jsapi_version', 2);
      scribd_doc.addEventListener('docReady', onDocReady);
      scribd_doc.addParam('height', 470);
      scribd_doc.addParam('width', 560);
      scribd_doc.addParam('mode','slide');
      scribd_doc.write('embedded_doc');
  }

  now.viewerClose = function(){
	$('#pptShow').modal('hide');
  }
  now.viewerNext = function(){
	var total = scribd_doc.api.getPageCount()
    var page = parseInt(scribd_doc.api.getPage());
    //console.log('total: '+ total+' page: '+page);
    if (page < total) {
      scribd_doc.api.setPage(page+1); 
    }
  }
  now.viewerPrev = function(){
	var page = parseInt(scribd_doc.api.getPage());
	if (page > 1) {
		scribd_doc.api.setPage(page-1); 
    }
  }

  now.viewerBegin = function(){
   // go to first slide
	scribd_doc.api.setPage(1); 
   //  send message to other clients	
  }

  now.addFiles = function(fName,fId,key){
	console.log('fName: '+fName+' fId: '+fId+' key: '+key);
   // jQuery('#presList').append('<tr class="'+fId+'"><td>'+fName+'</td><td><a onclick="javascript:viewerOpen('+fId+',\''+key+'\')" class="btn btn-primary">View</a></td> </tr>');
    jQuery('#presList').append('<tr class="'+fId+'"><td>'+fName+'</td><td>Processing ...</td> </tr>');  
  }

  now.enableView = function(fName,fId,key){
	console.log('enableView-fName: '+fName+' fId: '+fId+' key: '+key);
	sClass = '.'+fId;
	jQuery(sClass).remove();
	// put back on list with button 
	jQuery('#presList').append('<tr class="'+fId+'"><td>'+fName+'</td><td><a onclick="javascript:viewerOpen('+fId+',\''+key+'\')" class="btn btn-primary">View</a></td> </tr>');
	
  }
  /******** NOW functions *******/
  now.pushUser = function(username, clientId, browser, bversion){
    jQuery('#users').find('ul').append('<li class="'+clientId+'">'+username+'</li>');
    gAlert(username+' Has Joined');
    usernames.push({
        name: username
        , id: clientId
        , browser: browser
        , bversion: bversion
      });
  }
  now.pullUser = function(username, clientId){
    users = jQuery('#users').find('.'+clientId);
    if (users.length){
      jQuery(users).detach()
      gAlert(username + ' Has Left');
    }
    if (i=usernames.indexOf("clientId")){
	   usernames.splice(i);
    }
  }

  //populate the canvas  by calling server. 
  now.initWall(function(d, users){
    //convert database info into paperjs object
    //go through all elements and rebuild
    if(d){
      var plen = d.paths.length
      var execute = function(c){
        if(c < plen){
          var p = d.paths[c];
          //needs to go into image and points function to be more reliable
          if(!paper.project.layers[p.layer]){
            new Layer();
          }
          paper.project.layers[p.layer].activate();
          if(p.description.file){
            loadImage(p._id, p.description.position, p.description.file, function(){
              paper.view.draw();
              execute(++c);
            })
          }else{
            loadPoints(p, function(){
              paper.view.draw();
              execute(++c);
            })
          }
        }    
      }
      execute(0)
    }
    for(i = 0; i < users.length;i++){
      jQuery('#users').find('ul').append('<li class="'+users[i].id+'">'+users[i].name+'</li>');
      usernames.push({
          name: users[i].name
        , id: users[i].id
        , browser: users[i].browser
        , bversion: users[i].bversion
        , mode: users[i].mode
      });
    }
  $('#loading').detach();
    paper.view.draw();//refresh canvas
  });	
 

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
   paper.project.layers[layer].children[pathname].simplify(); // default 2.5
//	var testRect = new Rectangle(paper.project.layers[layer].children[pathname].bounds);
//	testRect.point.x = testRect.point.x - 10;
//	testRect.point.y = testRect.point.y - 10;
//	testRect.width = testRect.width + 20;
//	testRect.height = testRect.height + 20;
	
//    var sLoop = true;
//    while (sLoop){
//	    var cPath = paper.project.layers[layer].children[pathname].clone();      // make working copy 
//	    cPath.simplify();  // default 2.5
//	  if ((testRect.contains(paper.project.layers[layer].children[pathname].bounds))){  should check cPath
//		sLoop = false;  // don't need to do any more 
//		paper.project.layers[layer].children[pathname].remove();
//	    paper.project.layers[layer].children[pathname] = cPath.clone();   // copy simplified path back to original 
//	    cPath.remove();
//    }
//      else {
//	    now.serverLog("endDraw: Simplified path exceeds bounds");
//      }
//    }

 //   paper.project.layers[layer].children[pathname].simplify()  // default 2.5
 //   if (!(testRect.contains(paper.project.layers[layer].childeren[pathname].bounds))){
//	   now.serverLog("endDraw: Simplified path exceeds bounds");
//    }    
    //paper.project.layers[layer].children[pathname].smooth();
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
    pen.path.strokeWidth = width;
    pen.path.add(event.point);
    now.shareStartDraw(color,width,event.point,paper.project.activeLayer.index);
  }
  pen.onMouseUp = function(event){
	// check if simplify method creates path larger than original with buffer
	var testRect = new Rectangle(pen.path.bounds);
	testRect.point.x = testRect.point.x - 10;
	testRect.point.y = testRect.point.y - 10;
	testRect.width = testRect.width + 20;
	testRect.height = testRect.height + 20;
	
    //var sLoop = true;
    //while (sLoop){
	//  var cPath = pen.path.clone();      // make working copy 
	//    cPath.simplify();  // default 2.5
	//  if ((testRect.contains(cPath.bounds))){
	//	sLoop = false;  // don't need to do any more 
	//	pen.path.remove();
	//    pen.path = cPath.clone();   // copy simplified path back to original 
	//    cPath.remove();
    //  }
    //  else {
	//    now.serverLog("onMouseUp: Simplified path exceeds bounds");
    //  }
    //}

    pen.path.simplify(); 
    if (!(testRect.contains(pen.path.bounds))){
	now.serverLog("onMouseUp: Simplified path exceeds bounds");
    }

    x = pen.path.segments;
    if (x.length == 1){
	  // if only one segment then really a point and won't see
	// what really need to do is draw a circle at this point so have dot 
	 // console.log("onMouseUp:  0 length path ",x.length);
    }
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
  var panDeltaX;
  var panDeltaY;
  var panCnt;

  pan.onMouseDown = function (event){
    panDeltaX = 0;
    panDeltaY = 0;	
    panCnt = 0;

  }
  pan.onMouseDrag = function(event){
    pan.v = new Point();
    panDeltaX += event.delta.x;
    panDeltaY += event.delta.y;
    panCnt += (Math.abs(event.delta.x) + Math.abs(event.delta.y))

    if (panCnt >= 20) {
      pan.v.x = -panDeltaX;
      pan.v.y = -panDeltaY;
      panDeltaX = 0;
      panDeltaY = 0;
      panCnt=0;
      paper.view.scrollBy(pan.v);
    }  
  }
  pan.onMouseUp = function(event){
    paper.view.draw();
  }

window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};

// Create a point-text item at {x: 30, y: 30}:   for dubug purposes only 
//var circle = new Path.Circle(new Point(30, 30), 10);
//circle.strokeColor = 'purple';
//circle.fillColor = 'purple';
//var text = new PointText(new Point(30, 30));
//text.fillColor = 'black';
//text.strokeColor = 'black';
//text.strikeWidth = 3;
//text.content = 'Move your mouse over the view, to see its position';
//text.characterStyle = {
  //       fontSize: 14,
    //     font: 'Lobster Two',
  //       fillColor: 'black',
  //       justification: 'left'
  //    };
//text.selected = true;

  //Select Tool
  var select = new Tool();
  select.onMouseDown = function(event){
/*	 if (event.event.detail > 1) {
	        console.log('dblclick', event.event.detail);
	        // perform your double click...
	    }
	if (event.event.button == 2) {
		console.log('right click',event,event.button);
		//event.event.preventDefault();  
		if (event.event.stopPropagation)
		            event.event.stopPropagation();

		event.event.cancelBubble = true;
	}  // test code for double click and right mouse button. 
*/	
    if(select.target){
      select.target.item.selected = false
      jQuery('button').filter('.delete-object').detach();
    }
    select.target = project.hitTest(event.point, {stroke:true,segments:true,tolerance:2});
    if(select.target){
      var windowPosX = ((select.target.item.bounds.topLeft.x-paper.view.bounds.topLeft.x+select.target.item.bounds.width)*paper.view.zoom);
      var windowPosY = (select.target.item.bounds.topLeft.y-paper.view.bounds.topLeft.y)*paper.view.zoom;
      select.target.item.selected = true;
      jQuery('canvas').after('<button onClick="" class="d-obj-close delete-object" style="position:absolute;left:'+windowPosX+'px;top:'+windowPosY+'px;">&times;</button>');
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
      //console.log("X: ",x);
      var raster = false;
      //test if it's a path or a raster
      if(x === undefined){
	//	console.log('raster');
	        raster = true;
	        var data = {x: select.target.item.position._x, y: select.target.item.position._y};
      }else{
	//    console.log('path');
	     var data = serializePath(x);
      }
      //need to test if image, before sending to node. 
      now.updatePath(select.target.item.name,raster,data);
    }
  }
 // select.onMouseMove = function(event) {    // this was for debug purposes only
	// Each time the mouse is moved, set the content of
	// the point text to describe the position of the mouse:
	//text.position = event.point;
//	circle.position = event.point;
//	text.bounds.x = event.point.x;
//	text.bounds.y = event.point.y;
	//console.log('text location: ('+text.position.x+','+text.position.y+')');
    //debugShowRect('text',text.bounds);
//	text.content = 'Your position is: ' + event.point.toString()+' zoom: '+paper.view.zoom.toString();
//  }

  /******** Event listeners ******/
  //File Drag

  
  //keymap
  jQuery(document).keydown(function(event){
    switch (event.which) {
      case 80:
        //p for pen?
        jQuery('.tool[value=Pen]').click();
//		console.log('View Size heigt: ',paper.view.size.height );
//		console.log('view size width: ', paper.view.size.width );

//		console.log('view origin:('+paper.view.bounds.x+','+paper.view.bounds.y+')');
//		console.log('view bottom right:('+paper.view.bounds.width+','+paper.view.bounds.height+')');
		
		console.log('view zoom: '+paper.view.zoom);

 	   debugShowRect('Window',paper.view.bounds);
	   debugShowRect('Active Layer',paper.project.activeLayer.bounds);
      case 46:
        //delete for delete?
        event.preventDefault();
        jQuery('.delete-object').click();
        break;
      case 67:
        //c for center?   comment out since command c activates
       // jQuery('.tool[value=Center]').click();
       // console.log('center');
        break;
      case 83:
        //s for select?  - also to test slave 
        jQuery('.tool[value=Select]').click();
        slave = true;
        console.log("Make slave");
        now.sendMSMsg('connect');
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
     case 77:
        master = true;
        console.log("Make Master");
    }
  });

  
  //delete
  jQuery(document).on('click','.delete-object',function(){ 
	name = select.target.item.name;
    if(select.target.item.remove()){
      jQuery('button').filter('.delete-object').detach();
      paper.view.draw();
    }
    now.sendDeleteItem(paper.project.activeLayer.index,name);
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
  });

  $("#quit_btn").click(function() {
    now.sendMSMsg('quit');
    //console.log('hit quit button 1'); 
    setTimeout(function(){window.location.assign('/host/list')},1000);  // put a delay since seem to lose message sometimes
    //window.location.assign('/host/list');
  });

  jQuery('#users').click(function(e){
	console.log('Users clicked');
	now.sendMSMsg('users');
  });

  jQuery('#vconf').click(function(e){
	console.log('vconf clicked');
	now.sendMSMsg('vconf');
  });

  jQuery('#ShareScreen').click(function(e){
	console.log('Share Screen clicked');
	now.sendMSMsg('sScreen');
  });

  jQuery('#ZoomArea').click(function(e){
	console.log('ZoomArea clicked');
	if (!zoomAreaActive){
	   zoomAreaActive = true;
	   jQuery('#ZoomArea').addClass('btn-success');
	   console.log('activate ZoomArea');
	   var data = { x: paper.view.bounds.left, y: paper.view.bounds.top, height: (paper.view.size.height - (55 / paper.view.zoom)), width: paper.view.size.width}
	   now.sendMSMsg('zoomAreaStart',data);
	// disconnect pan and zoom messages 
    }
    else {
	   console.log('deactivate ZoomArea');
	   zoomAreaActive = false;
	   jQuery('#ZoomArea').removeClass('btn-success');
	   now.sendMSMsg('zoomAreaStop');
	   now.sendMSMsg('reqViewSize');
    }
	
  });

  //Change tool or color
  jQuery('#toolbar').add('#navWindow').add('#functions').click(function(e){
    var obj = jQuery(e.target);
    jQuery('.btn-info').removeClass('btn-info');
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
          if (remoteEvent != true ) { //  send message only when a local event 
	        if (!zoomAreaActive) {
              now.sendMSMsg('nav');  // send action to paired screen
              console.log('sending nav msg');
            }
          }
          else 
             nw.hide();
             remoteEvent = false;
          break;
        case 'ZoomOut':
          paper.view.zoom = paper.view.zoom /1.25;
          scrollNav();
          if (remoteEvent != true) { //  send message only when a local event 
	        if (!zoomAreaActive) {
              now.sendMSMsg('zoomout');  // send action to paired screen
              console.log('sending zoomout msg');
            }
            else {
              var data = { x: paper.view.bounds.left, y: paper.view.bounds.top, height: (paper.view.size.height - (55 / paper.view.zoom)), width: paper.view.size.width}
              now.sendMSMsg('zoomAreaMove',data);
              console.log('zoom level: ',paper.view.zoom);
            }
          }
          else 
             nw.hide();
             remoteEvent = false;
          break;
        case 'ZoomIn':
          paper.view.zoom = paper.view.zoom * 1.25;
          scrollNav();
          if (remoteEvent != true ) { //  send message only when a local event 
	        if (!zoomAreaActive) {
              now.sendMSMsg('zoomin');  // send action to paired screen
              console.log('sending zoomin msg');
            }
            else {
              var data = { x: paper.view.bounds.left, y: paper.view.bounds.top, height: (paper.view.size.height - (55 / paper.view.zoom)), width: paper.view.size.width}
              now.sendMSMsg('zoomAreaMove',data);
              console.log('zoom level: ',paper.view.zoom);
            }
          }
          else 
             nw.hide();
             remoteEvent = false;
          break;
        case 'Pen':
          obj.addClass('btn-info');
          c.addClass('crosshair');
          pen.activate();
          if (remoteEvent != true) { //  send message only when a local event 
            now.sendMSMsg('pen');  // send action to paired screen
            console.log('sending pen msg');
          }
          else 
             remoteEvent = false;
          break;
        case 'Select':
          obj.addClass('btn-info');
          c.addClass('pointer');
          select.activate();
          if (remoteEvent != true) { //  send message only when a local event 
            now.sendMSMsg('select');  // send action to paired screen
            console.log('sending select msg');
          }
          else 
             remoteEvent = false;
         //$('.dropdown-toggle').dropdown();
         // jQuery('#color_btn').dropdown();
          break;
        case 'Center':
          var l = paper.project.activeLayer.bounds.center;
          var v = paper.view.center;
          var p = new Point(l.x - v.x,l.y - v.y);
          view.scrollBy(p);
          view.draw(); 
          scrollNav();
          if (remoteEvent != true) { //  send message only when a local event 
            now.sendMSMsg('center');  // send action to paired screen
            console.log('sending center msg');
          }
          else 
             remoteEvent = false;
          break;
        case 'Export':
          exportCanvas();
          break;
        case 'Show':
          // show powerpoint list
          $('#pptList').modal();
          //console.log("show PowerPoint");
          break;
        case 'Vconf':
          // start video conference
          //openCloseVC();
         // now.sendVideoConf();
          break;    
        case 'ShareScreen':
          // start screen sharing
           // jQuery('canvas').css({top:160});
           // jQuery('#videoconf').append('<video id="localVideo"></video><div id="remotes"></div>');
          //$('#ssdisplay').modal();
 
          //openCloseSS();
          //jQuery('#ssarea').append('<section><h3>Share Your Screen</h3><button id="init-RTCMultiConnection" title="first person click">Open Session</button></section><table style="width: 100%; border-left: 1px solid black;"><tbody><tr><td><section id="local-media-stream"></section></td></tr></tbody></table>');
          //jQuery('#ssarea').append('<section><h3>Share Your Screen</h3><button id="init-RTCMultiConnection" title="first person click">Open Session</button></section><section id="local-media-stream"></section>');
          //startSS();   
            
          break;    
        case 'Upload':
          // show powerpoint upload modal
          $('#pptUpload').modal();
          break;
      }
    }else if(/.*color.*/.test(cl)){
      color = t
      
      if (remoteEvent != true) { //  send message only when a local event 
        now.sendMSMsg('color',color);  // send action to paired screen
        console.log('sending color msg');
      }
      else {
         remoteEvent = false;
      }
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
          console.log('clicked on users');
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
	    // show message while loading image
	    jQuery('<div class="alert fade in">Loading Image <img src="../img/ajax-loader.gif"></div>').appendTo('#alerts');
        var reader = new FileReader();
        reader.onload = function(e){          
          file.src = e.target.result;
          now.sendFile(file, paper.project.activeLayer.index, view.center, function(name){
            loadImage(name, view.center, file.src, function(){})
          });
        }
        reader.readAsDataURL(file);
      }
    }
  }
  now.receiveFilesCanvas = function(layer, file, position, name){
    // show message while loading image
    jQuery('<div class="alert fade in">Loading Image <img src="../img/ajax-loader.gif"></div>').appendTo('#alerts');
    var image = document.createElement('img');
    image.src = file
    nposition = {x:position._x, y:position._y}
    paper.project.layers[layer].activate();
    loadImage(name, nposition, file, function(){});
  }
  //File Testing
  jQuery('#myCanvas').on('drop', function(e){
    e.stopPropagation();
    e.preventDefault();
    var file = e.originalEvent.dataTransfer.files[0];
    processFiles(file);
    now.actionMeeting(wallId, name, 'goEImg');
  })
  jQuery('.tool[value=Pen]').click();
});

shareLinkOpen = function(){
  now.sendMSMsg('openShareLink');
  $('#shareLink').modal();	
}
 
shareLinkClose = function(){
	now.sendMSMsg('closeShareLink');
	$('#shareLink').modal('hide');
 }


