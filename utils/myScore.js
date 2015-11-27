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
};

var sportsDict = {
  "football": "1",
  "tennis": "2",
  "basketball": "3",
  "hockey": "4",
  "volleyball": "12"
};

var out = initOut();

function initOut() {
  var initObj = {};
  Object.keys(sportsDict).forEach(function setV(item) {
    initObj[item] = {"noData": true};
  });
  return initObj;
}


function processData(rawData, sportName) {
  var oD = {}; //output
	var currentCountry = "";
	var currentTournament = "";
	var currentEvent = 0;
	var splitData = rawData.match(/¬(~ZA|~AA|A[C-HJKM]|B[A-L]|W[A-C])÷(.+?)(?=¬)/g);
  
	splitData.forEach(propr2Json);
  out[sportName] = oD;
	
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
  
  function propr2Json(item) {
		if (item.match(/~ZA/)) {  //ZA means new tournament
			var delimPos = item.indexOf(":");
			currentCountry = item.slice(5, delimPos);
			currentTournament = item.slice(delimPos + 1).trimLeft();
			currentEvent = -1;
      
			if (oD.hasOwnProperty(currentCountry) === false) {
				oD[currentCountry] = {};
			}
			oD[currentCountry][currentTournament] = [];
		} else if (item.match(/~AA/)) { //AA means new event
			currentEvent++;
			oD[currentCountry][currentTournament].push({});
		} else {
			setProp(item);
		}
	}
}


function getData(sportName) {
  var reqOptions = {
    url: 'http://d.myscore.ru/x/feed/f_' + sportsDict[sportName] + '_0_3_ru_1',
    headers: {"X-Fsign":"SW9D1eZo"}
  };
  
  request(reqOptions, function then(error, response, body) {
    if (!error && response.statusCode == 200) {
      processData(body, sportName);
    } else console.log(error)
  });
}


function getDataAll() {
  Object.keys(sportsDict).forEach(getData);
}


module.exports.getData = getDataAll;
module.exports.liveData = out; 
