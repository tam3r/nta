var request = require('request');

var keyDict = {
  "ZA": "tourn", 
  "ZY": "country", 
  "AC": "status", 
  "AD": "startTime",
  "AE": "homeTeam", 
  "AF": "awayTeam", 
  "AG": "homeGoals", 
  "AH": "awayGoals", 
  "AJ": "redHome", 
  "AK": "redAway",
  "AM": "comment",  
  "BA": "homeGoals1stPart", 
  "BB": "awayGoals1stPart", 
  "BC": "homeGoals2ndPart", 
  "BD": "awayGoals2ndPart", 
  "BE": "homeGoals3rdPart", 
  "BF": "awayGoals3rdPart", 
  "BG": "homeGoals4thPart", 
  "BH": "awayGoals4thPart", 
  "BI": "homeGoals5thPart", 
  "BJ": "awayGoals5thPart", 
  "BK": "homeGoals6thPart", 
  "BL": "awayGoals6thPart",
  "WA": "gamePointsFirst",
  "WB": "gamePointsSecond",
  "WC": "serve"
};

var statDict = {    
  "1": "трансляция не началась (в тч ткр)", 
  "3": "Завершен",
  "4": "Перенесен",
  "5": "Отменен",
  "8": "Завершен (отказ)",
  "10": "После д.в. (овертайма)",
  "11": "После с.п. (буллитов)",
  "12": "Первый тайм",
  "13": "Второй тайм",
  "14": "Первый период",
  "15": "Второй период",
  "16": "Третий период",
  "17": "Первый сет",
  "18": "Второй сет",
  "19": "Третий сет",
  "22": "Первая четверть",
  "23": "Вторая четверть",
  "24": "Третья четверть",
  "25": "Четвертая четверть",
  "36": "Прерван (теннис)",
  "38": "Перерыв (футбол)",
  "46": "Перерыв (хоккей)",
  "54": "Техническое поражение"
}

var sportsDict = {
  "football": "1",
  "tennis": "2",
  "basketball": "3",
  "hockey": "4",
  "volleyball": "12"
}

var dataReceived = false;
// var safe = function(source) { //closure
//   var data = {"noData": true};
//   return function(source) {
//     if (typeof source === 'object') data = source;
//     return data;
//   } 
// }
// var out = safe(); //closure instance with captured data

var out = {data: {"noData": true}};

function processData(rawData) {
  var oD = {}; //output
	var currentCountry = "";
	var currentTournament = "";
	var currentEvent = 0;
	var separatedData = rawData.match(/¬(~ZA|~AA|A[C-HJKM]|B[A-L]|W[A-C])÷(.+?)(?=¬)/g);
	
	function setProp(propStr) {
		var rawName = propStr.slice(1, 3);
		var rawValue = propStr.slice(4);
		var propName = keyDict[rawName];
		var propValue = rawValue;
		var target = oD[currentCountry][currentTournament][currentEvent];
    
		target[propName] = propValue;
    
		if (propName === "status") 
			target.statusTxt = statDict[rawValue];
	}
	
	separatedData.forEach(function propr2Json(item) {
		if (item.match(/~ZA/)) {
			var delimPos = item.indexOf(":");
			currentCountry = item.slice(5, delimPos);
			currentTournament = item.slice(delimPos + 1).trimLeft();
			currentEvent = -1;
			if (oD.hasOwnProperty(currentCountry) === false) {
				oD[currentCountry] = {};
			}
			oD[currentCountry][currentTournament] = [];
		} else if (item.match(/~AA/)) {
			currentEvent++;
			oD[currentCountry][currentTournament].push({});
		} else {
			setProp(item);
		}
	})
  
  out.data = oD;
  //out(oD); //save processed data to closure instance (out)
}

var reqOptions = {
  url: 'http://d.myscore.ru/x/feed/f_1_0_3_ru_1',
  headers: {"X-Fsign":"SW9D1eZo"}
};

function getData() {
    request(reqOptions, function then(error, response, body) {
      if (!error && response.statusCode == 200) {
        processData(body);
      } else console.log(error)
    });
}

module.exports.getData = getData;
module.exports.liveData = out; //function object that returns captured data

