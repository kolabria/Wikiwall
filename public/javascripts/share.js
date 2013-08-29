//  script for screen sharing with ps1

console.log("display id:",displayId);

var master; 
var videoID;
var screen = new Screen(displayId);

var screensPreview = document.getElementById('screens-preview');

// on getting each new screen
screen.onaddstream = function(e) {
	console.log('add stream');
	if (e.type == "local" ) {
      var button = document.createElement('button');
      button.innerHTML = 'Stop Sharing Screen';
      button.onclick = function() {
          screen.leave();
          this.disabled = true;
          document.getElementById('share-screen').disabled = false;
      };  
      screensPreview.appendChild(button);
      now.sendShareStart();
    }
    else {
	  now.sendShareJoin(name); 
    }
    screensPreview.appendChild(document.createElement('hr'));
    screensPreview.appendChild(e.video);
    e.video.focus();
    console.log('event: ',e);
    videoID = e.userid;
    //if (e.type == "local" ) { 
     // document.getElementById('share-screen').disabled = true;
   // }
};

// using firebase for signaling
screen.firebase = 'signaling';

// if someone leaves; just remove his screen
screen.onuserleft = function(userid) {
	console.log('user left - userid:'+userid);
    var video = document.getElementById(userid);
    if (video && video.parentNode) video.parentNode.innerHTML = '';
    now.sendShareEnd(userid);
};

// check pre-shared screens
screen.check();

now.recShareJoin = function(n){
// if master then add name to participants list
  //if (master){
     console.log("viewer joined:",n);	
  //}
}

now.recShareLeave = function(n){
// remove name from list of participants
  if (master){
	
  }	
}

now.recShareStart = function(n){
// 
  if (!master){
	console.log("reload page");
	location.reload();
  }	
}

now.recShareEnd = function(uid){
	//  if not master then remove video from wall 
	// do we need to reset stuff? 
  console.log('recShareEnd - userid:',uid);
  if (!master){
	var video = document.getElementById(videoID);
    if (video && video.parentNode) video.parentNode.innerHTML = '';
    location.reload();
  }
}




