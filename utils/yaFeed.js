var parseString = require('xml2js').parseString;

var request = require('request');

function compareDates(a, b) {
    var first = new Date(a.pubDate);
    var second = new Date(b.pubDate)
    return second - first;
}
                
function KTGetXMLData(source) {
    this.source = source;
    this.data = [];
    this.hasNews = false;
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
                    
                    obj.hasNews = true;
                    obj.data = result.rss.channel.item;
                    obj.data.sort(compareDates);
                    obj.data.forEach(function normalise(item) {
                        var dateSrc = new Date(item.pubDate);
                        item.pubDate = dateSrc.getTime();
                        
                        delete item.guid;
                        delete item.link;
                    })
                }
            );
        } else {
            obj.data = ["Ошибка загрузки новостей\n"];
        }
        if (typeof callback === "function") callback();
    });
}



module.exports = KTGetXMLData;

