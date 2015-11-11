var http = require('http');

var port = process.env.PORT || 1337;

var parseString = require('xml2js').parseString;

var request = require('request');

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
		case "/app/feed":
			request.get('http://news.yandex.ru/sport.rss', function (error, response, body) {
				if (!error && response.statusCode == 200) {
					res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
					parseString(body, {explicitArray: false, ignoreAttrs: true}, 
						function (err, result) {
							outJSON = JSON.stringify({"data": result.rss.channel.item});
							res.end(outJSON);
						}
					);
				}
			});
			break;
		default: 
			res.writeHead(404, {'content-Type': 'text/html'});
			res.end();
			break;
	}

}).listen(port);