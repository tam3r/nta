var http = require('http');

var port = process.env.PORT || 1337;

var parseString = require('xml2js').parseString;

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
			var xml = "<root>Hello xml2js!</root>"
			parseString(xml, function (err, result) {
				res.end(JSON.stringify(result));
			});
			break;
	}

}).listen(port);