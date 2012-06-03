now.ready(function(){
	now.register(function(shared,shares){
		//loop through shares
		//change style of shared
	});
	now.share = function(host, name){
		//add this share to the list of shares.
		//run alert function
		alert(name + ' Has shared a wall with you');
	}
	now.unshare = function(host){
		//find box in shares with that id and remove it.
	}
	now.sharedTo = function(box){
		jQuery('#shareTo').find('.'+k).addClass('active');
	}
	jQuery('#shareTo').click(function(){
		var id = 1//get id from element clicked
		//add class to clicked share. 
		now.shareWall(id);
	});
});
