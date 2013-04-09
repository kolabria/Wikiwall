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
//start screen sharing
startSS = function(){
  console.log("start screen sharing");
  var rtcMultiConnection = new RTCMultiConnection({
      session: Session.Screen,
      direction: Direction.OneWay,
      openSignalingChannel: function (config) {
          //var channel = config.channel || location.hash.replace('#', '') || 'screen-sharing-using-RTCMultiConnection';
          var channel = wallId; 
          var socket = new Firebase('https://kolabria.firebaseIO.com/' + channel);
          socket.channel = channel;
          socket.on('child_added', function (data) {
              config.onmessage && config.onmessage(data.val());
          });
          socket.send = function (data) {
              this.push(data);
          };
          config.onopen && setTimeout(config.onopen, 1);
          socket.onDisconnect().remove();
          return socket;
      },
      onRemoteStream: function (media) {
          var mediaElement = media.mediaElement;

          var localMediaStreams = document.getElementById('local-media-stream');
          localMediaStreams.insertBefore(mediaElement, localMediaStreams.firstChild);
          mediaElement.controls = false;
      },
      onLocalStream: function (media) {
          var mediaElement = media.mediaElement;
          var mainVideo = document.getElementById('local-media-stream');
          mainVideo.appendChild(mediaElement);
          mediaElement.controls = false;
      }
  });

  document.getElementById('init-RTCMultiConnection').onclick = function () {
      rtcMultiConnection.initSession();
      this.disabled = true;
      now.sendScreenShare();
  };
}

now.screenShare = function(){
     console.log('Start screen sharing');
     jQuery('canvas').css({top:500});
     jQuery('#ssarea').append('<section><h2>Share Your Screen</h2><button id="init-RTCMultiConnection" title="first person click">Open Session</button></section><table style="width: 100%; border-left: 1px solid black;"><tbody><tr><td><section id="local-media-stream"></section></td></tr></tbody></table>');

     startSS();
}