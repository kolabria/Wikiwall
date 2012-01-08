var sys = require("sys"),  
    http = require("http"),  
    url = require("url"),  
    path = require("path"),  
    fs = require("fs");  
  
var server = http.createServer(function(request, response) {  
    var uri = url.parse(request.url).pathname;  
    var filename = path.join(process.cwd(), uri);  
    path.exists(filename, function(exists) {  
        if(!exists) {  
            response.writeHead(404, {"Content-Type": "text/plain"});  
            response.write("404 Not Found\n");  
            response.end();  
            return;  
        }  
  
        fs.readFile(filename, "binary", function(err, file) {  
            if(err) {  
                response.writeHead(500, {"Content-Type": "text/plain"});  
                response.write(err + "\n");  
                response.end();  
                return;  
            }  
  
            response.writeHead(200);  
            response.write(file, "binary");  
            response.end();  
        });  
    });  
});
server.listen(8080);  
  
sys.puts("Server running at http://localhost:8080/");

var everyone = require("now").initialize(server);


everyone.connected(function(){
  console.log("Joined: " + this.now.name);
});


everyone.disconnected(function(){
  console.log("Left: " + this.now.name);
});

everyone.now.sendStart = function(){
 //    console.log("StartLine");
     everyone.now.recStart();};

everyone.now.sendPoint = function(spot){
  //   console.log("Point");
     everyone.now.recPoint(spot);};
     
everyone.now.sendEnd = function(){
  //   console.log("EndLine");
     everyone.now.recEnd();};


