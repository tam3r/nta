var http = require('http');

var port = process.env.PORT || 1337;

var parser = require('./node_modules/xml2json/bin/xml2json');
 
var xml = "<foo>bar</foo>";
//var json = parser.toJson(xml); //returns a string containing the JSON structure by default 

http.createServer(function(req, res) {
	var body = "<html><body><h1 style='color: red'>Hello world</h1></body></html>"
	
	switch (req.url) {
		case "/": 	
			res.writeHead(200, {
				'Content-Length': body.length,
				'Content-Type': 'text/html' 
			});
			res.end(body);
			break;
		case "/app":
			res.writeHead(200, {'content-Type': 'text/plain'});
			res.end("раз два раз");
			break;
		default: 
			res.writeHead(200, {'content-Type': 'application/json'});
			res.end(parser);
			break;
	}

}).listen(port);