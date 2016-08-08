var request = require('request');
var processData = require('./mS_procD');

var sportsDict = {
    "football": "1",
    "tennis": "2",
    "basketball": "3",
    "hockey": "4",
    "volleyball": "12"
};

var outLive = initOut();
var outAll = initOut();


function initOut() {
    var initObj = {};
    
    Object.keys(sportsDict).forEach(function setV(item) {
        initObj[item] = {"noData": true};
    });
    return initObj;
}


function getData(sportName) {
    var reqOptions = {
        url: 'http://d.scoreboard.com/ru/x/feed/f_' + sportsDict[sportName] + '_0_3_ru_1',
        headers: {"X-Fsign":"SW9D1eZo"}
    };
    
    request(reqOptions, function then(error, response, body) {
        if (!error && response.statusCode == 200) {
            outLive[sportName] = processData(body).live;
            outAll[sportName] = processData(body).all;
            
        } else console.log(error)
    });
}


function getDataAll() {
    Object.keys(sportsDict).forEach(getData);
}


module.exports.getData = getDataAll;
module.exports.liveData = outLive; 
module.exports.allData = outAll; 
