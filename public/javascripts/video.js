/*************video conf stuff ************/
//start videoconferencing 
startVC = function(){
  console.log("start vconf");
  jQuery('canvas').css({top:160});
  jQuery('#videoconf').append('<video id="localVideo"></video><div id="remotes"></div>');
  var webrtc = new WebRTC({
    localVideoEl: 'localVideo',   
    remoteVideosEl: 'remotes',  
    autoRequestMedia: true,    
    log: true,
    url: 'http://points.kolabria.com:8888'});
  var room = wallId;
  console.log('room:',room);
  webrtc.on('readyToCall', function (){webrtc.joinRoom(room)});
}


now.videoConf = function(){
     console.log('Start video conf');
     var r=confirm("Incoming Video Call - Start?");
     if (r==true)
     {
       startVC();
      }
}


