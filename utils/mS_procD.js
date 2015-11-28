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

var oD = {}; //output
var currentCountry = "";
var currentTournament = "";
var currentEvent = 0;
var currentTime;


function processData(rawData, sportName) {
    var splitData = rawData.match(/¬(~ZA|~AA|A[C-HJKM]|B[A-L]|W[A-C])÷(.+?)(?=¬)/g);
    
    currentTime = (new Date()).getTime();
    oD = {};
    splitData.forEach(propr2Json);
    return oD;
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
 //     checkPreviousEvent();
        var delimPos = item.indexOf(":");
        
        currentCountry = item.slice(5, delimPos);
        currentTournament = item.slice(delimPos + 1).trimLeft();
        currentEvent = -1;
                     
        if (oD.hasOwnProperty(currentCountry) === false)
            oD[currentCountry] = {};
            
        oD[currentCountry][currentTournament] = [];
        
    } else if (item.match(/~AA/)) { //AA means new event
     //	checkPreviousEvent();
        currentEvent++;
        oD[currentCountry][currentTournament].push({});
        
    } else {
        setProp(item);
    }
}


function checkPreviousEvent() {
    
    //previous event is deleted if meets one of the following:
    //1) it started more than 3 hours ago and event has status "3" 
    //2) start time passed 5 minutes ago and event still has status "1"  
    //3) starts in more than 30 minutes
    if (currentCountry === "") return;
    
    var eventToCheck = oD[currentCountry][currentTournament][currentEvent];
    var eventStart = new Date(eventToCheck.startTime)
    
    //if ()
    
    
}


module.exports = processData;