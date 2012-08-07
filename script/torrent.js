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

/*global Bencode:false*/

/**
 * @constructor
 * @param {String} url
 */
function Torrent(url) {
    this._url = url;
    this._magnet = !!url.match(/^\s*magnet:/i);
    this._blob = null;
    this._data = null;
}

Torrent.prototype.isMagnetLink = function() {
    return this._magnet;
};

Torrent.prototype.isValid = function() {
    return this._magnet || this._data;
};

Torrent.prototype.getUrl = function() {
    return this._url;
};

Torrent.prototype.loadBlob = function(callback) {
    var request = new XMLHttpRequest();
    request.open('GET', this._url, true);
    request.responseType = 'blob';

    var torrent = this;
    request.onload = function(event) {
        if (this.status === 200) {
            torrent._blob = this.response;
        }
        callback();
    };
    request.send();
};

Torrent.prototype.parseBlob = function(callback) {
    var reader = new FileReader();
    var torrent = this;

    reader.onload = function(event) {
        try {
            torrent._data = Bencode.decode(reader.result, {
                'info': {
                    'pieces': null
                }
            });
        } catch (error) {
            torrent._data = null;
        }
        callback();
    };

    reader.readAsBinaryString(this._blob);
};

Torrent.prototype.getEncodedMetaInfo = function(callback) {
    var reader = new FileReader();

    reader.onload = function(event) {
        var comma = this.result.indexOf(',');
        callback(this.result.slice(comma + 1));
    };

    reader.readAsDataURL(this._blob);
};

Torrent.prototype.load = function(callback) {
    var torrent = this;

    torrent.loadBlob(function() {
        torrent.parseBlob(function() {
            callback();
        });
    });
};

Torrent.loadFromUrl = function(url, callback) {
    var torrent = new Torrent(url);

    if (!torrent.isMagnetLink()) {
        torrent.load(function() {
            callback(torrent);
        });
    } else {
        callback(torrent);
    }
};
