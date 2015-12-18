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
    "1": "Трансляция не началась (в тч ткр)", 
    "2": "Live",
    "3": "Завершен",
    "4": "Матч перенесен",
    "5": "Матч отменен",
    "6": "Овертайм",
    "7": "Буллиты",
    "8": "Матч завершен (отказ)",
    "10": "После доб времени (овертайма)",
    "11": "После серии пенальти (буллитов)",
    "12": "Первый тайм",
    "13": "Второй тайм",
    "14": "Первый период",
    "15": "Второй период",
    "16": "Третий период",
    "17": "Первый сет",
    "18": "Второй сет",
    "19": "Третий сет",
    "20": "Четвертый сет",
    "21": "Пятый сет",
    "22": "Первая четверть",
    "23": "Вторая четверть",
    "24": "Третья четверть",
    "25": "Четвертая четверть",
    "36": "Матч прерван",
    "37": "Матч прерван",
    "38": "Перерыв (футбол, баскетбол)",
    "43": "Задержка",
    "46": "Перерыв (хоккей)", 
    "47": "Тай брейк",
    "54": "Техническое поражение"
};

var settings = {
    "timeToStart": 160, //minutes until match start to add a match to results
    "timeSinceStart": 280, //minutes after their start ended matches are deleted from results 
    "timeUntilERO": 5 //minutes after start time a match is considered end-result only
}

var oD; //output
var currentCountry;
var currentTournament;
var currentEvent;
var currentTime;
var matchCount;


function processData(rawData, sportName) {
    var splitData = rawData.match(/¬(~ZA|~AA|A[C-HJKMO]|B[A-L]|W[A-C])÷(.+?)(?=¬)/g);
    
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
        case "statusUpdateTime":      
            target[propName] *= 1000;
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
    //3) starts in more than 60 minutes
    if (currentEvent === -1 || currentCountry === "") 
        return;
    
    var event = oD[currentCountry][currentTournament][currentEvent];
    var st = event.status;
    
    var eventStart = (new Date(event.startTime)).getTime();
    var startTimeDiff = currentTime - eventStart; 
    var timeUntilStart = -settings['timeToStart'] * 60 * 1000;
    var timeSinceStart = settings['timeSinceStart'] * 60 * 1000;
    var timeUntilERO = settings['timeUntilERO'] * 60 * 1000;
    
    var notStarted = (st === '1');
    var isNotLive = !(st === '6' || st === '7' || (st >= 12 && st <= 25));
    
    var tooLongUntilStart = (startTimeDiff < 0 && startTimeDiff < timeUntilStart);
    var endResultOnly = (startTimeDiff > 0 && startTimeDiff > timeUntilERO && notStarted);
    var notActual = (startTimeDiff > 0 && startTimeDiff > timeSinceStart && isNotLive);
    
    if (tooLongUntilStart || endResultOnly || notActual) {
        oD[currentCountry][currentTournament].pop();
        currentEvent--;
        matchCount--;
    }
}


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