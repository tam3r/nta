var http = require('http');

var port = 1337;

http.createServer(function(req, res) {
	var body = "<html><body><h1 style='color: red'>Hello world</h1></body></html>"
	res.writeHead(200, {
		'Content-Length': body.length,
		'Content-Type': 'text/html' 
	});
	res.end(body);
}).listen(port);