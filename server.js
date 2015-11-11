var http = require('http');
var KTGetXMLData = require('./utils/yaFeed');

var port = process.env.PORT || 1337;

var yandexSportFeed = new KTGetXMLData('http://news.yandex.ru/sport.rss');

//yandexSportFeed.getData();

setInterval(function() {yandexSportFeed.getData(); console.log("renewed")}, 500000)

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
			res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
			res.end("{\"data\":" + JSON.stringify(yandexSportFeed.data) + "}");
			break;
		default: 
			res.writeHead(404, {'content-Type': 'text/html'});
			res.end();
			break;
	}

}).listen(port);