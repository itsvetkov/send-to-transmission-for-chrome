/* 
 * Copyright 2012, Ilya Tsvetkov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the Software), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software,  and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * The software is provided as is, without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and noninfringement. In no event shall the
 * authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising from,
 * out of or in connection with the software or the use or other dealings in
 * the software.
 */

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