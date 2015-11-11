var parseString = require('xml2js').parseString;

var request = require('request');

var monthE2R = {'Jan': 'января',
				'Feb': 'февраля',
				'Mar': 'марта',
				'Apr': 'апреля',
				'May': 'мая',
				'Jun': 'июня',
				'Jul': 'июля',
				'Aug': 'августа',
				'Sep': 'сентября',
				'Oct': 'октября',
				'Nov': 'ноября',
				'Dec': 'декабря'
};

function compareDates(a, b) {
	var first = new Date(a.pubDate);
	var second = new Date(b.pubDate)
	return second - first;
}
				
function KTGetXMLData(source) {
	this.source = source;
	this.data = {};
	processData(this);
}

KTGetXMLData.prototype.getData = function(callback) {
	processData(this, callback);
};

function processData(obj, callback) {
	request.get(obj.source, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			parseString(body, {explicitArray: false, ignoreAttrs: true}, 
				function(err, result) {
					obj.data = temp = result.rss.channel.item;
					temp.sort(compareDates);
					var currentDate = "";
					for (i = 0; i < temp.length; i++) {
						
						dateSrc = temp[i].pubDate.split(" ");
						temp[i].pubDateStr = dateSrc[0] + ' ' + monthE2R[dateSrc[1]];
						temp[i].pubTimeStr = dateSrc[3].slice(0, 5);
				
						if (currentDate !== temp[i].pubDateStr) {
							currentDate = temp[i].pubDateStr;
							temp[i].newDate = "true";
						} else {
							temp[i].newDate = "false";
						} 
						
						delete temp[i].guid;
						delete temp[i].link;
						delete temp[i].pubDate;
					}
				}
			);
		} else {
			obj.data = "Ошибка загрузки новостей\n";
		}
		if (typeof callback === "function") callback();
	});
}



module.exports = KTGetXMLData;

