var keyDict = {
        "ZA": "tourn", 
        "ZY": "country", 
        "AA": "id",
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
        "BX": "currentTime",
        "WA": "gamePointsFirst",
        "WB": "gamePointsSecond",
        "WC": "serve"
    },

    statDict = {
        "1": "Трансляция не началась (в тч ткр)", 
        "2": "Live",
        "3": "Завершен",
        "4": "Матч перенесен",
        "5": "Матч отменен",
        "6": "Овертайм",
        "7": "Буллиты",
        "8": "Матч завершен (отказ)",
        "9": "Неявка",
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
        "42": "Ожидание обновления",
        "43": "Задержка",
        "46": "Перерыв (хоккей)", 
        "47": "Тай брейк",
        "48": "Тай брейк",
        "54": "Техническое поражение"
    },

    settings = {
        "timeToStart": 60, //minutes until match start to add a match to results
        "timeSinceStart": 180, //minutes after their start ended matches are deleted from results 
        "timeUntilERO": 5 //minutes after start time a match is considered end-result only
    },

    filter = {
        events: checkPreviousEvent,
        tournaments: checkPreviousTournament,
        countries: checkCountries
    },

    output,
    outAll,
    outLive, //output
    currentCountry,
    currentTournament,
    currentEvent,
    currentTime,
    matchCount;


function processData(rawData) {
    var splitData = rawData.match(/¬(~ZA|~AA|A[C-HJKMO]|B[A-LX]|W[A-C])÷(.*?)(?=¬)/g);
    
    output = {};
    outUnfiltered = {};
    outLive = {};
    currentCountry = "";
    currentTournament = "";
    currentEvent = -1;
    currentTime = Date.now();
    matchCount = 0;
    
    if (splitData !== null) {    
        splitData.forEach(propr2Json);
        syncUnfiltered();
        filter.events(); //remove last event if necessary
        filter.tournaments(); //remove last tournament if empty
        filter.countries(); //remove all countries without matches
    } 
    
    outLive.matchCount = matchCount;
    output.live = outLive;
    output.all = outUnfiltered;
    return output;
}


function propr2Json(item) {
    if (item.match(/~ZA/)) {    //ZA means new tournament
        var delimPos = item.indexOf(":");
        
        syncUnfiltered();        
        filter.events(), filter.tournaments();
        
        currentCountry = item.slice(5, delimPos);
        currentTournament = item.slice(delimPos + 1).trimLeft();
        currentEvent = -1;
                     
        if (outLive.hasOwnProperty(currentCountry) === false) {
            outLive[currentCountry] = {};
            outUnfiltered[currentCountry] = {};
        }
            
        outLive[currentCountry][currentTournament] = [];
        outUnfiltered[currentCountry][currentTournament] = [];
        
    } else if (item.match(/~AA/)) { //AA means new event
        syncUnfiltered();
       	filter.events();
        currentEvent++;
        matchCount++;
        outLive[currentCountry][currentTournament].push({id: item.slice(5)});
        
    } else {
        setProp(item);
    }
}


function setProp(propStr) {
    var rawName = propStr.slice(1, 3),
        rawValue = propStr.slice(4),
        propName = keyDict[rawName],
        propValue = rawValue,
        target = outLive[currentCountry][currentTournament][currentEvent];
    
    if (!target.hasOwnProperty(propName)) 
        target[propName] = propValue; 
        
    switch (propName) {
        case "status":
            target.statusTxt = statDict[rawValue];
            break;
        case "startTime":   
            target[propName] *= 1000;
            break;
        case "statusUpdateTime":      
            var timeSinceUpdate;
            target[propName] *= 1000;
            timeSinceUpdate = currentTime - target[propName];
            target.sinceUpdateM = Math.ceil(timeSinceUpdate / 60000);
            break;
        case "score":
        case "scoreParts":
            setScore(rawName, rawValue);
            break;
        default:
    }
}


function setScore(keyName, keyValue) {
    var props = whatScore(keyName),
        target = outLive[currentCountry][currentTournament][currentEvent];
    
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


function whatScore(keyName) { //returns [side] or [side, part], side = "home"/"away", part = 0..6
    var out = [],
        firstLetter = keyName.charAt(0),
        secondLetterUnicode = keyName.charCodeAt(1);
    
    out[0] = secondLetterUnicode % 2 === 0 ? "away" : "home"; 
    if (firstLetter === "B") 
        out[1] = (secondLetterUnicode - 65) >> 1;
        
    return out;
}


function checkPreviousEvent() {
    
    //previous event is deleted if not live and meets one of the following:
    //1) it started more than 3 hours ago 
    //2) start time was 5 minutes ago   
    //3) starts in more than 60 minutes
    if (currentEvent === -1 || currentCountry === "") 
        return;
    
    var event = outLive[currentCountry][currentTournament][currentEvent],
        st = event.status,
        
        eventStart = (new Date(event.startTime)).getTime(),
        startTimeDiff = currentTime - eventStart,
        timeUntilStart = -settings.timeToStart * 60 * 1000,
        timeSinceStart = settings.timeSinceStart * 60 * 1000,
        timeUntilERO = settings.timeUntilERO * 60 * 1000,
        
        notStarted = (st === '1'),
        isNotLive = !(st === '6' || st === '7' || (st >= 12 && st <= 25)),
        
        tooLongUntilStart = (startTimeDiff < 0 && startTimeDiff < timeUntilStart),
        endResultOnly = (startTimeDiff > 0 && startTimeDiff > timeUntilERO && notStarted),
        notActual = (startTimeDiff > 0 && startTimeDiff > timeSinceStart && isNotLive);
    
    if (tooLongUntilStart || endResultOnly || notActual) {
        outLive[currentCountry][currentTournament].pop();
        currentEvent--;
        matchCount--;
    }
}


function checkPreviousTournament() {
    if (currentTournament === "") return;
    if (outLive[currentCountry][currentTournament].length === 0)
        delete outLive[currentCountry][currentTournament];
}


function checkCountries() {
    var country;
    
    for (country in outLive)
        if (Object.keys(outLive[country]).length === 0)
            delete outLive[country];
}


function syncUnfiltered() {
    if (currentEvent >= 0) {
        var tempID = outLive[currentCountry][currentTournament].length,
            target = outUnfiltered[currentCountry][currentTournament],
            eventObj = JSON.parse(JSON.stringify(outLive[currentCountry][currentTournament][tempID - 1]));

        target.push(eventObj);
    }
}


module.exports = processData;