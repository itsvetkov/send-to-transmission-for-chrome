/*global Bencode:false WebKitBlobBuilder:false*/

/**
 * @constructor
 * @param {String} url
 */
function Torrent(url) {
    this._url = url;
    this._magnet = !!url.match(/^\s*magnet:/i);
    this._blob = null;
    this._buffer = null;
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
    request.responseType = 'arraybuffer';

    var torrent = this;
    request.onload = function(event) {
        if (this.status === 200) {
            torrent._buffer = this.response;
            var blobBuilder = new WebKitBlobBuilder();
            blobBuilder.append(this.response);
            torrent._blob = blobBuilder.getBlob();
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
