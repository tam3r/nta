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
    "37": "Прерван (футбол)",
    "38": "Перерыв (футбол)",
    "46": "Перерыв (хоккей)",
    "54": "Техническое поражение"
};

var settings = {
    "timeToStart": 30, //minutes until match start to add match to results
    "timeSinceStart": 180, //minutes after their start ended matches are deleted from results 
    "timeUntilERO": 5 //minutes after start time match is considered end-result only
}

var oD; //output
var currentCountry;
var currentTournament;
var currentEvent;
var currentTime;


function processData(rawData, sportName) {
    var splitData = rawData.match(/¬(~ZA|~AA|A[C-HJKM]|B[A-L]|W[A-C])÷(.+?)(?=¬)/g);
    
    oD = {};
    currentCountry = "";
    currentTournament = "";
    currentEvent = 0;
    currentTime = (new Date()).getTime();
    splitData.forEach(propr2Json);
    checkPreviousEvent();
    checkPreviousTournament();
    checkCountries();
    return Object.keys(oD).length == 0 ? {"noData": true} : oD;
}


function setProp(propStr) {
    var rawName = propStr.slice(1, 3);
    var rawValue = propStr.slice(4);
    var propName = keyDict[rawName];
    var propValue = rawValue;
    var target = oD[currentCountry][currentTournament][currentEvent];
        
    target[propName] = propValue;    
    if (propName === "status") target.statusTxt = statDict[rawValue];
    else if (propName === "startTime") target.startTime *= 1000;
}
    
    
function propr2Json(item) {
    if (item.match(/~ZA/)) {    //ZA means new tournament
        checkPreviousEvent();
        checkPreviousTournament();
        var delimPos = item.indexOf(":");
        
        currentCountry = item.slice(5, delimPos);
        currentTournament = item.slice(delimPos + 1).trimLeft();
        currentEvent = -1;
                     
        if (oD.hasOwnProperty(currentCountry) === false)
            oD[currentCountry] = {};
            
        oD[currentCountry][currentTournament] = [];
        
    } else if (item.match(/~AA/)) { //AA means new event
       	checkPreviousEvent();
        currentEvent++;
        oD[currentCountry][currentTournament].push({});
        
    } else {
        setProp(item);
    }
}


function checkPreviousEvent() {
    
    //previous event is deleted if not live and meets one of the following:
    //1) it started more than 3 hours ago 
    //2) start time was 5 minutes ago   
    //3) starts in more than 30 minutes
    if (currentEvent === -1 || currentCountry === "") return;
    
    var event = oD[currentCountry][currentTournament][currentEvent];
    var eventStart = (new Date(event.startTime)).getTime();
    var startTimeDiff = currentTime - eventStart; 
    var timeToStart = -settings['timeToStart'] * 60 * 1000;
    var timeSinceStart = settings['timeSinceStart'] * 60 * 1000;
    var timeUntilERO = settings['timeUntilERO'] * 60 * 1000;
    var isLive = (event.status > 10 && event.status < 25);
    
  //if (startTimeDiff < 0 && startTimeDiff > timeToStart && event.status === "1")
    if ((startTimeDiff < 0 && startTimeDiff < timeToStart && !isLive) ||
        (startTimeDiff > 0 && startTimeDiff > timeUntilERO && !isLive) || 
        (startTimeDiff > 0 && startTimeDiff > timeSinceStart && !isLive)) {
            
        oD[currentCountry][currentTournament].pop();
        currentEvent--;
    }
}

//если матч перенесен, то проблемы

function checkPreviousTournament() {
    if (currentTournament === "") return;
    if (oD[currentCountry][currentTournament].length === 0)
        delete oD[currentCountry][currentTournament];
}

function checkCountries() {
    for (country in oD) {
        if (Object.keys(oD[country]).length === 0)
            delete oD[country];
    }
}


module.exports = processData;