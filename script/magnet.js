
var query = /(?:\w|[!$&'()*+,-.\/:;=?@~]|\%[a-fA-F0-9]{2})/;

function parseMagnet(magnet) {
    var paramExpr = /^(?:\s*magnet\:\?|\&)((?:\w|[!$'()*+,-.\/:;?@~]|\%[a-fA-F0-9]{2})+)(?:\=((?:\w|[!$'()*+,-.\/:;=?@~]|\%[a-fA-F0-9]{2})*))?(?=&|\s*$)/;
    var indexExpr = /(.+)\.(\d+)$/;
    var match;
    var topics = [];
    var map = {};
    var index;
    var topic;
    var defaultTopic = null;
    var name;
    var value;
    
    while ((match = paramExpr.exec(magnet))) {
        name = decodeURIComponent(match[1]);
        value = decodeURIComponent(match[2]);
        magnet = magnet.slice(match[0].length);
        if ((match = indexExpr.exec(name))) {
            name = match[1];
            index = parseInt(match[2], 10);
            topic = map[index];
            if (!topic) {
                topics.push(topic = map[index] = []);
            }
        } else {
            topic = defaultTopic;
            if (!topic) {
                topics.push(topic = defaultTopic = []);
            }
        }
        topic.push({
            name: name,
            value: value
        });
    }
    return topics;
}