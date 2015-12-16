var keyDict = {
    "ZA": "tourn", 
    "ZY": "country", 
    "AC": "status", 
    "AD": "startTime",
    "AE": "homeTeam", 
    "AF": "awayTeam", 
    "AG": "score", 
    "AH": "score", 
    "AJ": "redHome", 
    "AK": "redAway",
    "AM": "comment", 
    "AO": "statusUpdateTime",
    "BA": "scoreParts", 
    "BB": "scoreParts", 
    "BC": "scoreParts", 
    "BD": "scoreParts", 
    "BE": "scoreParts", 
    "BF": "scoreParts", 
    "BG": "scoreParts", 
    "BH": "scoreParts", 
    "BI": "scoreParts", 
    "BJ": "scoreParts", 
    "BK": "scoreParts", 
    "BL": "scoreParts",
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
var matchCount;


function processData(rawData, sportName) {
    var splitData = rawData.match(/¬(~ZA|~AA|A[C-HJKM]|B[A-L]|W[A-C])÷(.+?)(?=¬)/g);
    
    oD = {};
    currentCountry = "";
    currentTournament = "";
    currentEvent = 0;
    currentTime = (new Date()).getTime();
    matchCount = 0;
    
    if (splitData !== null) {    
        splitData.forEach(propr2Json);
        checkPreviousEvent(); //remove last event if necessary
        checkPreviousTournament(); //remove last tournament if empty
        checkCountries(); //remove all countries without matches
    } 
    
    oD.matchCount = matchCount;
    return oD;
}


function setProp(propStr) {
    var rawName = propStr.slice(1, 3);
    var rawValue = propStr.slice(4);
    var propName = keyDict[rawName];
    var propValue = rawValue;
    var target = oD[currentCountry][currentTournament][currentEvent];
    
    if (!target.hasOwnProperty(propName)) 
        target[propName] = propValue; 
        
    switch (propName) {
        case "status":
            target.statusTxt = statDict[rawValue];
            break;
        case "startTime":        
            target.startTime *= 1000;
            break;
        case "score":
        case "scoreParts":
            setScore(rawName, rawValue);
            break;
        default:
    }
}


function whatScore(keyName) { //returns [side] or [side, part], side = "home"/"away", part = 0..6
    var out = [];
    var firstLetter = keyName.charAt(0);
    var secondLetterUnicode = keyName.charCodeAt(1);
    
    out[0] = secondLetterUnicode % 2 === 0 ? "away" : "home"; 
    if (firstLetter === "B") 
        out[1] = (secondLetterUnicode - 65) >> 1;
        
    return out;
}


function setScore(keyName, keyValue) {
    var props = whatScore(keyName); 
    var target = oD[currentCountry][currentTournament][currentEvent];
    
    if (typeof props[1] === "undefined") {
        if (typeof target.score !== "object")
            target.score = {};
            
        target.score[props[0]] = keyValue;
    } else {
        if (typeof target.scoreParts !== "object") 
            target.scoreParts = [];
            
        if (typeof target.scoreParts[props[1]] === "undefined") 
            target.scoreParts[props[1]] = {};
            
        target.scoreParts[props[1]][props[0]] = keyValue;
    }
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
        matchCount++;
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
    var isLive = (event.status > 12 && event.status < 25) || 
                 (event.status > 37 && event.status < 47);
    
    if ((startTimeDiff < 0 && startTimeDiff < timeToStart && !isLive) ||
        (startTimeDiff > 0 && startTimeDiff > timeUntilERO && !isLive) || 
        (startTimeDiff > 0 && startTimeDiff > timeSinceStart && !isLive)) {
            
        oD[currentCountry][currentTournament].pop();
        currentEvent--;
        matchCount--;
    }
}

//если матч перенесен, то проблемы

function checkPreviousTournament() {
    if (currentTournament === "") return;
    if (oD[currentCountry][currentTournament].length === 0)
        delete oD[currentCountry][currentTournament];
}

function checkCountries() {
    for (country in oD)
        if (Object.keys(oD[country]).length === 0)
            delete oD[country];
}


module.exports = processData;