function showChar(e){
  if(e.keyCode!=16){ // If the pressed key is anything other than SHIFT
        c = String.fromCharCode(e.keyCode);
        if(e.shiftKey){ // If the SHIFT key is down, return the ASCII code for the capital letter
            //alert("ASCII Code: "+e.keyCode+" Character: "+c);
            return c;
        }else{ // If the SHIFT key is not down, convert to the ASCII code for the lowecase letter
            c = c.toLowerCase(c);
            //alert("ASCII Code: "+c.charCodeAt(0)+" Character: "+c);
            return c;
        }
  }
}

now.ready(function(){ 
  console.log('ready: ');
  now.boxID = boxID;

  now.mslink(mode);
 $('input[type="text"]').keydown(function mirrorKey(event){
    var c = showChar(event);
    now.sendChar(this.id, c);	
  });



//  to add typing need to add keydown event to all text boxes.  id of text box should have 
//  wall id  so info can be send to match text box on other side.   
//  also need to have back space by checking on rec end and deleting last character 
});



now.recChar = function(id,c) {
  var val = $('#'+id).val();
  if(c) {
	if(c == 8);
    $('#'+id).val(val + c);
  }
};


function newWall() {	
	window.location.assign('/host/list/new');
}

function goDraw(wallId) {	
	console.log('send godraw - wallid: ',wallId);
	window.location.assign('/published/'+wallId+'/draw'); // '/published/#{lw.wallID}/draw'

	now.sendGoDraw(wallId);
}
now.reload = function(){
	window.location.reload();
}

now.recGoDraw = function(wallId){
	window.location.assign('/published/'+wallId+'/draw');
	console.log('rec godraw');
}