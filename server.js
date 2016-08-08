var KTGetXMLData = require('./utils/yaFeed'),
    myScoreData  = require('./utils/mS_getD'),
    express      = require('express'),
    request      = require('request');

var app = express(),
    port = process.env.PORT || 1337,
    yandexSportFeed = new KTGetXMLData('http://news.yandex.ru/sport.rss');
    
myScoreData.getData();

setInterval(function renewData() {
  yandexSportFeed.getData();
}, 1000*60*10);

setInterval(function renewData(){
  myScoreData.getData();
 }, 1000*30);

app.get('/app/news', function ya_sport(req, res) {
  res.jsonp({"data": yandexSportFeed.data, "hasNews": yandexSportFeed.hasNews});
});

app.get('/app/live', function live_data(req, res) {
  res.jsonp(myScoreData.liveData);
});

app.get('/app/feed/all', function live_data(req, res) {
  res.jsonp(myScoreData.allData);
});

app.listen(port);

// http.createServer(function(req, res) {
//   var body = "<html><body><h1 style='color: red'>Hello world</h1></body></html>"
//   pathname = url.parse(req.url, true).pathname;
//   wrapper = url.parse(req.url, true).query.callback
  
//   switch (pathname) {
//     case "/":   
//       res.writeHead(200, {
//         'Content-Length': body.length,
//         'Content-Type': 'text/html' 
//       });
//       res.end(body);
//       break;
//     case "/app":
//       res.writeHead(200, {'content-Type': 'text/plain'});
//       res.end("раз два раз");
//       break;
//     case "/app/feed":
//       res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
//       resString = wrapper ? wrapper + "({\"data\":" + JSON.stringify(yandexSportFeed.data) + "})" 
//                 : "{\"data\":" + JSON.stringify(yandexSportFeed.data) + "}";
//       res.end(resString);
//       break;
//     default: 
//       res.writeHead(404, {'content-Type': 'text/html'});
//       res.end();
//       break;
//   }

// }).listen(port);