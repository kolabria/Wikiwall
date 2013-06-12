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
  now.browser = $.ua.browser.name; 
  now.bversion = $.ua.browser.version;
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
// default values for pen
  var color = 'black';
  var width = 6;
  var scribd_doc;
  var usernames = [];  // array of current users on the wall 
  var xOffset = 0;


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
    var windowPosX = ((select.target.item.bounds.topLeft.x-paper.view.bounds.topLeft.x+select.target.item.bounds.width)*paper.view.zoom)+xOffset;
    var windowPosY = (select.target.item.bounds.topLeft.y-paper.view.bounds.topLeft.y)*paper.view.zoom;
    jQuery('button').filter('.delete-object').css({left:windowPosX,top:windowPosY});
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

  //image loading
  loadImage = function(id, position, src, callback){
    var image = document.createElement('img');
    image.src = src
    image.onload = function(){
      raster = new Raster(image);
      raster.name = id
      raster.position = position
      paper.view.draw();
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

function getURIformcanvas() {
    var ImageURItoShow = "";
    var canvasFromScreen = document.getElementById("imageView");
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


function ssCapture() {
    var screen = document.getElementById("screen-video");
    var canvasDraw = document.getElementById('imageView');
    var w = canvasDraw.width;
    var h = canvasDraw.height;
    var ctxDraw = canvasDraw.getContext('2d');

    ctxDraw.clearRect(0, 0, w, h);
    ctxDraw.drawImage(screen, 0, 0, w, h);
    ctxDraw.save();
    
	getURIformcanvas();	 
}
function ssMax(){
    if (!VCActive) {
      console.log("toolbar height: ",jQuery('header').css("height"));
      screenWidth = screenStream.mediaElement.width;
      console.log('width:'+screenStream.mediaElement.width+' : '+screenWidth);
      screenHeight = screenStream.mediaElement.height;
      console.log('window w:h - ',window.innerWidth,":",window.innerHeight);
      console.log('toobar: ',jQuery('header').height());
      screenStream.mediaElement.width = window.innerWidth;  
      var sh = window.innerHeight - jQuery('header').height()-4;  // give a 4px buffer 
      console.log('new screen h',sh);
      screenStream.mediaElement.height = sh;
      var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
      // jQuery('canvas').css({top:newTop+'px'});	
      jQuery('canvas').css('z-index','-1');	
      jQuery('screen-container').css('left','100'); 
    }
    else {
	  console.log('start ss with VC active');
	  screenWidth = screenStream.mediaElement.width;
	  screenHeight = screenStream.mediaElement.height;
	  screenStream.mediaElement.width = window.innerWidth/3*2; 
	  var sh = window.innerHeight - jQuery('header').height()-4;  // give a 4px buffer 
      console.log('new screen h',sh);
      screenStream.mediaElement.height = sh;
      var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
      //jQuery('canvas').css({top:newTop+'px'});
      console.log('screen width: ',window.innerWidth);
      //screenStream.mediaElement.style.left="200px";
      jQuery('canvas').css('z-index','-1');	
      jQuery('#screen-content').css({left:window.innerWidth/3}); //css({left:vWidth+10})

    }
}

function ssMin() {
    console.log('width, height ',screenWidth,' ',screenHeight);
	screenStream.mediaElement.width =screenWidth;  
	screenStream.mediaElement.height =screenHeight;
	var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
    jQuery('canvas').css({top:newTop+'px'});	
}

function ssBack(){  // put the screen sharing behind the whiteboard
   //jQuery('canvas').css({top:0});
   jQuery('canvas').css('z-index','1');
   jQuery('screen-container').css('z-index','-1');	
}
function ssFront(){  // move whiteboard down for screen sharing view
	//var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
    //jQuery('canvas').css({top:newTop+'px'});
   jQuery('canvas').css('z-index','-1');
   jQuery('screen-container').css('z-index','1');
}

var isScreenShareInitiator = false;
var screenShareActive = false;
var screenSession;
var screenFull = false; 
var screenCapture = false;
var screenStream;
var screenSizeX = 200;
var screenSizeY = 200; 
var screenWidth, screenHeight;
var screenConnection = new RTCMultiConnection(wallId+'screen');
screenConnection.session = 'only-screen';
screenConnection.direction = 'one-way';
// screenConnection.firebase = 'kolabria;

screenConnection.onNewSession = function (session) {      
      console.log('onNewSession-screen: ', session); 
       if (!isScreenShareInitiator) {
	     //jQuery('canvas').css({top:500});
	     //jQuery('#ssarea').append('<p>Screen <button id="sr-plus">+</button> <button id="sr-minus">-</button>   <button id="sr-full">Full Screen</button> <button id="sr-small">Small</button>   <button id="sCapture" style="width: 64px;border:solid 2px #ccc;">Capture</button><section id="screen-container"></section><div id="container" style="border:none"><canvas id="imageView" style="display:none; left: 0; top: 0; z-index: 0;border:none" width="700" height="400"></canvas></div>');
         jQuery('#ssarea').append('<section id="screen-container"></section><div id="container" style="border:none"><canvas id="imageView" style="display:none; left: 0; top: 0; z-index: 0;border:none" width="1300" height="731"></canvas></div>');

        // var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
        // jQuery('canvas').css({top:newTop+'px'});
         screenSession = session;
         screenConnection.join(session);
         screenShareActive = true;
         jQuery('#ssShare').html('<h4>Close</h4>');
         //setScreenControls();
       }
       //document.getElementById('open-screen').innerHTML="View Screen"; 
       screenSession = session;
};

screenConnection.onstream = function (stream) {
   console.log('Screen onstream:',stream);
   var screen = document.createElement('div');
   screen.className = 'screen-container';
   screen.id = 'screen-content';
   screen.appendChild(stream.mediaElement);
   stream.mediaElement.id = 'screen-video';
   if (stream.type === 'local') {
      screenStream = stream;
      document.getElementById('screen-container').appendChild(screen);
      stream.mediaElement.width = screenSizeX;  
      stream.mediaElement.height = screenSizeY;
      //var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
      //jQuery('canvas').css({top:newTop+'px'});
   }
   if (stream.type === 'remote') {
      screenStream = stream;
      document.getElementById('screen-container').appendChild(screen);
      stream.mediaElement.width = screenSizeX ;  
      stream.mediaElement.height = screenSizeY ;
      
      //var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
      //jQuery('canvas').css({top:newTop+'px'});
   }
   ssMax();   
   screenFull = true;
};

screenConnection.onUserLeft = function(userid) {
	console.log('Left - userid: ',userid);
	jQuery('#ssarea').empty();
    jQuery('canvas').css({top:0+'px'});   
    screenShareActive = false;
    jQuery('#ssShare').html('<h4>Share Screen</h4>');
};
jQuery('#ShareScreen li').click(function(e){
 // e.stopImmediatePropagation(); //Two clicks are fired, this is a patch, need to find reason why.
  var li = jQuery(this);
  cl = li.attr('data-value');
  //console.log('clicked vconf button cl: ',cl);
  switch(cl){
      case 'ssShare':  
        if (!screenShareActive){  // open screen share session
	        var browserNotChrome = false;
	        var badPeople = " ";
	        console.log('usernames length: ',usernames.length);
	        for (i=0; i < usernames.length; i++){
		      console.log('name: '+usernames[i].name+' browser: '+usernames[i].browser);
		      if (usernames[i].browser != "Chrome") {
			    browserNotChrome = true; 
			    badPeople = badPeople+usernames[i].name+' , ';
		      }
	        }
	        if (browserNotChrome) {
		     window.alert('Chrome is needed for this function.  The following people are using a browser other than Chrome: '+ badPeople);
		     break; 
        	}
          console.log('Open Screen');
          //jQuery('canvas').css({top:500});
          jQuery('#ssarea').append('<section id="screen-container"></section><div id="container" style="border:none"><canvas id="imageView" style="display:none; left: 0; top: 0; z-index: 0;border:none" width="1300" height="731"></canvas></div>');
          var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
          //jQuery('canvas').css({top:newTop+'px'});       
          screenConnection.open(wallId+'screen');  
          isScreenShareInitiator = true;  
          screenShareActive = true;
          jQuery('#ssShare').html('<h4>Close</h4>');
          now.actionMeeting(wallId, name, 'goSS');
        }
        else {  // close screen share session
          
          screenConnection.leave();
          ssBack();
          jQuery('#ssarea').empty();
          //jQuery('canvas').css({top:0+'px'});
		//var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
        //  jQuery('canvas').css({top:newTop+'px'});
         
          //screenConnection = new RTCMultiConnection(wallId+'screen');
          //isScreenShareInitiator = false;        
          screenShareActive = false;
          jQuery('#ssShare').html('<h4>Share Screen</h4>');
        }
        
        break;
     case 'ssSize':  //  resize screen size
        if (screenFull) {
	      //ssMin();
	      ssBack();
          jQuery('#ssSize').html('<h4>Show</h4>');
          screenFull = false;
        }
        else {
          //ssMax();
          ssFront();
          jQuery('#ssSize').html('<h4>Hide</h4>');
          screenFull = true; 
        }
        break;
     case 'ssCapture':   // capture screen image to whiteboard 
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
        break;
  }
});


now.screenCapture = function(cmd){
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

//sst:27px vct:0px newT: 27px0px
function setScreenControls() {
	document.getElementById('sr-full').disabled = false;
    document.getElementById('sr-small').disabled = true;
	document.getElementById('sr-plus').onclick = function () {
			screenStream.mediaElement.width +=50;  
			screenStream.mediaElement.height +=50;
			var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
	        jQuery('canvas').css({top:newTop+'px'});
	};
	document.getElementById('sr-minus').onclick = function () {
			screenStream.mediaElement.width -=50;  
			screenStream.mediaElement.height -=50;
			var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
	        jQuery('canvas').css({top:newTop+'px'});
	};
	document.getElementById('sr-full').onclick = function () {
		    // console.log("ssarea height: ",jQuery('#ssarea').css("height"));
		    console.log("toolbar height: ",jQuery('header').css("height"));
			screenWidth = screenStream.mediaElement.width;
			console.log('width:'+screenStream.mediaElement.width+' : '+screenWidth);
			screenHeight = screenStream.mediaElement.height;
			screenStream.mediaElement.width = window.innerWidth; 
		    var sh = window.innerHeight - jQuery('#toobar').height();
		    console.log('new screen h',sh);
			screenStream.mediaElement.height = sh;
			var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
	        jQuery('canvas').css({top:newTop+'px'});
            document.getElementById('sr-full').disabled = true;
            document.getElementById('sr-small').disabled = false;			
	};
	document.getElementById('sr-small').onclick = function () {
		    console.log('width, height ',screenWidth,' ',screenHeight);
			screenStream.mediaElement.width =screenWidth;  
			screenStream.mediaElement.height =screenHeight;
			var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
	        jQuery('canvas').css({top:newTop+'px'});
	        document.getElementById('sr-full').disabled = false;
	        document.getElementById('sr-small').disabled = true;
	};
	document.getElementById('sCapture').onclick = function () {
      ssCapture();
  };
}

openCloseSS = function (){
  if (!screenShareActive){
    console.log('Open Screen');
    //jQuery('canvas').css({top:500});
    jQuery('#ssarea').append('<p>Screen <button id="sr-plus">+</button> <button id="sr-minus">-</button>   <button id="sr-full">Full Screen</button> <button id="sr-small">Small</button>   <button id="sCapture" style="width: 64px;border:solid 2px #ccc;">Capture</button><section id="screen-container"></section><div id="container" style="border:none"><canvas id="imageView" style="display:none; left: 0; top: 0; z-index: 0;border:none" width="700" height="500"></canvas></div>');
    var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
    jQuery('canvas').css({top:newTop+'px'});
    setScreenControls();         
	screenConnection.open(wallId+'screen');  
	isScreenShareInitiator = true;  
	screenShareActive = true;
  }
  else {  // close screen sharing 
    jQuery('canvas').css({top:0});
    jQuery('#ssarea').empty();
    screenConnection.leave();
    //screenConnection = new RTCMultiConnection(wallId+'screen');
    //isScreenShareInitiator = false;        
    screenShareActive = false;
  }
}


/*************** video conferencing functions *************/
var isVCInitiator = false;
var VCActive = false;
var VCSession;
var localVCStream;
var remoteVCStreams = new Array();
var remoteVideoSize = 200;

var VCSizeX = 200;
var VCSizeY = 200; 
var VCWidth, VCHeight;
var VCConnection = new RTCMultiConnection(wallId+'VC');
VCConnection.session = 'audio + video';


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
	  //console.log('vHeight 1: ',vHeight);
	  //vHeight = vHeight + (vHeight/2)/numRemotes; 
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
	  xOffset = vWidth+10;
	  jQuery('canvas').css({left:vWidth+10});  // readjust canvas positioning so don't have wasted space 
    }	
}

VCConnection.onNewSession = function (session) {      
      console.log('onNewSession-VC: ', session); 
       if (!isVCInitiator) {
	     //jQuery('canvas').css({top:500, left:200});  //160
	     //jQuery('#videoconf').append('<p>Local<button id="lv-plus">+</button> <button id="lv-minus">-</button> Remote   <button id="rv-plus">+</button> <button id="rv-minus">-</button><section id="remote-videos-container"></section><section id="local-video-container"></section>');
         jQuery('#videoconf').append('<section id="remote-videos-container"></section><section id="local-video-container"></section>');
	    
         var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
         //jQuery('canvas').css({top:newTop+'px'});
         var middle = $(window).width()/2;
         jQuery('canvas').css({left:middle});
         VCSession = session;
         VCConnection.join(session);
         //setVCControls();
         VCActive = true;
         jQuery('#vcCall').html('<h4>HangUp</h4>');
       }
       //document.getElementById('open-screen').innerHTML="View Screen"; 
       VCSession = session;
};

VCConnection.onstream = function (stream) {
	console.log('Video onstream:',stream);
	var video = document.createElement('div');
	video.className = 'video-container';
	video.id = stream.userid; 
	console.log('stream id: ',stream.userid);
	video.appendChild(stream.mediaElement);
    if (stream.type === 'local') {
        localStream = stream;
       document.getElementById('local-video-container').appendChild(video);
        //document.getElementById('local-video-container').appendChild(stream.mediaElement);
        var middle = $(window).width()/2;
        stream.mediaElement.width = middle/2 ;  
		stream.mediaElement.height = middle/2/1.7778;
		stream.mediaElement.muted = true; 
		sizeVideo();
		var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
        //jQuery('canvas').css({top:newTop+'px'});
    }
    if (stream.type === 'remote') {
        remoteVCStreams.push(stream);
        var remoteVideosContainer = document.getElementById('remote-videos-container');
        remoteVideosContainer.appendChild(video, remoteVideosContainer.firstChild);
        //remoteVideosContainer.appendChild(stream.mediaElement, remoteVideosContainer.firstChild);
        var videosize = ($(window).width()/2*3)/4;
		stream.mediaElement.width = videosize ;
		stream.mediaElement.height = videosize/1.7778;
		 
		sizeVideo();
        //stream.mediaElement.width = remoteVideoSize ;   //keep for video window controls
		//stream.mediaElement.height = remoteVideoSize ;
		var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
        //jQuery('canvas').css({top:newTop+'px'});
 
    }
};


VCConnection.onUserLeft = function(userid) {
	console.log('Left - userid: ',userid);
	var video = document.getElementById(userid);
	if(video) video.parentNode.removeChild(video);
};

function setVCControls() {
	  document.getElementById('lv-plus').onclick = function () {
			localStream.mediaElement.width +=100;  
			localStream.mediaElement.height +=100;
			var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
	        jQuery('canvas').css({top:newTop+'px'});
	  };
	  document.getElementById('lv-minus').onclick = function () {
			localStream.mediaElement.width -=100;  
			localStream.mediaElement.height -=100;
			var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
	        jQuery('canvas').css({top:newTop+'px'});
	  };
	  document.getElementById('rv-plus').onclick = function () {
		for (i=0; i<remoteVCStreams.length; i++){
			remoteVCStreams[i].mediaElement.width +=100;  
			remoteVCStreams[i].mediaElement.height +=100;
		}
		remoteVideoSize = remoteVCStreams[i-1].mediaElement.height;	
		var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
        jQuery('canvas').css({top:newTop+'px'});
	  };
	  document.getElementById('rv-minus').onclick = function () {
		for (i=0; i<remoteVCStreams.length; i++){
			remoteVCStreams[i].mediaElement.width -=100;  
			remoteVCStreams[i].mediaElement.height -=100;
		}
		remoteVideoSize = remoteVCStreams[i-1].mediaElement.height;
		var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
        jQuery('canvas').css({top:newTop+'px'});
	  };
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
		      if (usernames[i].browser != "Chrome") {
			    browserNotChrome = true; 
			    badPeople = badPeople+usernames[i].name+' , ';
		      }
	        }
	        if (browserNotChrome) {
		     window.alert('Chrome is needed for this function.  The following people are using a browser other than Chrome: '+ badPeople);
		     break; 
        	}
	      	console.log('Open VC');
	        //jQuery('#videoconf').append('<p>Local<button id="lv-plus">+</button> <button id="lv-minus">-</button> Remote   <button id="rv-plus">+</button> <button id="rv-minus">-</button><section id="remote-videos-container"></section><section id="local-video-container"></section>');
	        jQuery('#videoconf').append('<section id="remote-videos-container"></section><section id="local-video-container"></section>');

	        var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
	        //jQuery('canvas').css({top:newTop+'px'});
	        // by default split screen in two - video - whiteboard
	        var middle = $(window).width()/2;
	        xOffset = middle;
	        jQuery('canvas').css({left:middle});
	        //setVCControls();         
	        VCConnection.open(wallId+'VC');  
	        isVCInitiator = true;  
	        VCActive = true;
	        jQuery('#vcCall').html('<h4>HangUp</h4>');
	        now.actionMeeting(wallId, name, 'goVC');
        }
        else {
	        jQuery('canvas').css({top:0, left:0});
	        jQuery('#videoconf').empty();
	        VCConnection.leave();
	        //VCConnection = new RTCMultiConnection(wallId+'VC');
	        //isVCInitiator = false;        
	        VCActive = false;
	        jQuery('#vcCall').html('<h4>Call</h4>');
	        xOffset = 0;
        }
        break;
     case 'vcFull':
        
        break;
     case 'vcSplit':

        break;
  }
})


openCloseVC = function (){
  if (!VCActive){
    console.log('Open VC');
   // jQuery('#ssarea').append('<p>Screen <button id="sr-plus">+</button> <button id="sr-minus">-</button>   <button id="sr-full">Full Screen</button> <button id="sr-small">Small</button>   <button id="sCapture" style="width: 64px;border:solid 2px #ccc;">Capture</button><section id="screen-container"></section><div id="container" style="border:none"><canvas id="imageView" style="display:none; left: 0; top: 0; z-index: 0;border:none" width="700" height="500"></canvas></div>');
    //jQuery('canvas').css({top:500, left:200});  //160
    jQuery('#videoconf').append('<p>Local<button id="lv-plus">+</button> <button id="lv-minus">-</button> Remote   <button id="rv-plus">+</button> <button id="rv-minus">-</button><section id="local-video-container"></section><section id="remote-videos-container"></section>');
    var newTop = jQuery('#ssarea').height() + jQuery('#videoconf').height();
    //jQuery('canvas').css({top:newTop+'px'});
    jQuery('canvas').css({left:300});
    setVCControls();         
	VCConnection.open(wallId+'VC');  
	isVCInitiator = true;  
	VCActive = true;
  }
  else {  // close VC    
    jQuery('canvas').css({top:0, left:0});
    jQuery('#videoconf').empty();
    VCConnection.leave();
    //screenConnection = new RTCMultiConnection(wallId+'screen');
    //isScreenShareInitiator = false;        
    VCActive = false;
  }
}




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
      });
    }
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
	pen.path.add(event.point);
    now.shareUpdateDraw(event.point,paper.project.activeLayer.index);
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

window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};

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
      var windowPosX = ((select.target.item.bounds.topLeft.x-paper.view.bounds.topLeft.x+select.target.item.bounds.width)*paper.view.zoom)+xOffset;
      var windowPosY = (select.target.item.bounds.topLeft.y-paper.view.bounds.topLeft.y)*paper.view.zoom;
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
        //c for center?   comment out since command c activates
       // jQuery('.tool[value=Center]').click();
       // console.log('center');
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
  })

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
          obj.addClass('btn-info');
          c.addClass('crosshair');
          pen.activate();
          break;
        case 'Select':
          obj.addClass('btn-info');
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
  $('#shareLink').modal();	
}
 
shareLinkClose = function(){
	$('#shareLink').modal('hide');
 }


