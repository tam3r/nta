var parseString = require('xml2js').parseString;

var request = require('request');

var monthE2R = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа',
  'сентября', 'октября', 'ноября', 'декабря'];

function compareDates(a, b) {
    var first = new Date(a.pubDate);
    var second = new Date(b.pubDate)
    return second - first;
}
                
function KTGetXMLData(source) {
    this.source = source;
    this.data = "Пожалуйста, обновите страницу\n";
    processData(this);
    console.log("created instance");
}

KTGetXMLData.prototype.getData = function(callback) {
    processData(this, callback);
};

function processData(obj, callback) {
    request.get(obj.source, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            parseString(body, {explicitArray: false, ignoreAttrs: true}, 
                function(err, result) {
                    obj.data = result.rss.channel.item;
                    obj.data.sort(compareDates);
                    var currentDate = "";
                    obj.data.forEach(function normalise(item) {
                        var dateSrc = new Date(item.pubDate);
                        item.pubDateStr = dateSrc.getDate() + ' ' + monthE2R[dateSrc.getMonth()];
                        var minutes = '0' + dateSrc.getMinutes();
                        item.pubTimeStr = dateSrc.getHours() + ':' + minutes.slice(-2);
                
                        if (currentDate !== item.pubDateStr) {
                            currentDate = item.pubDateStr;
                            item.newDate = "true";
                        } else {
                            item.newDate = "false";
                        } 
                        
                        delete item.guid;
                        delete item.link;
                        delete item.pubDate;
                    })
                }
            );
        } else {
            obj.data = "Ошибка загрузки новостей\n";
        }
        if (typeof callback === "function") callback();
    });
}



module.exports = KTGetXMLData;

