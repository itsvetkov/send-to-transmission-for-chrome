/**
 * Transmission object for interacting with remote server by PRC with parameters specified
 * @constructor
 * @param {String} url The address
 * @param {String} username The user name (optional)
 * @param {String} password The password (optional)
 */
function Transmission(url, username, password) {

    this._sid = '';
    /**
     * Server address
     * @private
     * @type {String}
     */
    this._url = url;

    /**
     * User name
     * @private
     * @type {String}
     */
    this._username = username || '';

    /**
     * Password
     * @private
     * @type {String}
     */
    this._password = password || '';
}

/**
 * Object indicating successful RPC and initialized with server response
 * @constructor
 * @param {Object} data Server response structure
 */
Transmission.Success = function(data) {
    $.extend(this, data);
};

/**
 * Object indicating RPC failure and containing textual description of its reason
 * @constructor
 * @param {String} status The description
 */
Transmission.Failure = function(status) {
    /**
     * Converts object to its string representation
     * @override
     * @returns {String} Failure reason
     */
    this.toString = function() {
        return status;
    };
};

/**
 * Object indicating RPC error and containing its textual description
 * @constructor
 * @param {String} status The description
 */
Transmission.Error = function(status) {
    /**
     * Converts object to its string representation
     * @override
     * @returns {String} Error description
     */
    this.toString = function() {
        return status;
    };
};

/**
 * @param {String} method
 * @param {Object} args
 * @param {Number} tag
 * @param {Function} callback
 */
Transmission.prototype.callMethod = function(method, args, tag, callback) {
    var data = {
        method: method
    };

    if (args != null)
        data.arguments = args;

    if (tag != null)
        data.tag = tag;

    var self = this;

    $.ajax({
        async: true,
        url: this._url,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        username: this._username,
        password: this._password,
        headers: {
            'X-Transmission-Session-Id': this._sid
        },
        data: JSON.stringify(data),
        error: function(jqXHR, textStatus, errorThrown) {
            var sid;

            if (jqXHR.status == 409 && (sid = jqXHR.getResponseHeader('X-Transmission-Session-Id'))) {
                // Set the Transmission-Session-Id on a 409
                self._sid = sid;
                self.callMethod(method, args, tag, callback);
            } else {
                callback(new Transmission.Error(textStatus));
            }
        },
        success: function(data, textStatus, jqXHR) {
            if (data && data.result && data.result == 'success')
                callback(new Transmission.Success(data.arguments ? data.arguments : null));
            else
                callback(new Transmission.Failure(data.result ? data.result : ''));
        }
    });
};

/**
 * @param {String} path
 * @param {Boolean} paused
 * @param {Array} skip
 * @param {Array} high
 * @param {Array} low
 * @returns {Object}
 */
Transmission.customizeAddTorrent = function(path, paused, skip, high, low) {
    var args = {};

    if (path)
        args['download-dir'] = path;
    if (paused)
        args['paused'] = paused;
    if (skip)
        args['files-unwanted'] = skip;
    if (high)
        args['priority-high'] = high;
    if (low)
        args['priority-low'] = low;

    return args;
};

/**
 * @param {Object} args
 * @param {Function} callback
 */
Transmission.prototype.addTorrentByArguments = function(args, callback) {
    this.callMethod('torrent-add', args, null, callback);
};

/**
 * @param {String} url
 * @param {Object} args
 * @param {Function} callback
 */
Transmission.prototype.addTorrentByMagnet = function(url, args, callback) {
    if (!args)
        args = {};

    args['filename'] = url;

    this.addTorrentByArguments(args, callback);
};

/**
 * @param {String} metainfo
 * @param {Object} args
 * @param {Function} callback
 */
Transmission.prototype.addTorrentByMetaInfo = function(metainfo, args, callback) {
    if (!args)
        args = {};

    args['metainfo'] = metainfo;

    this.addTorrentByArguments(args, callback);
};

/**
 * @param {Torrent} torrent
 * @param {Object} args
 * @param {Function} callback
 */
Transmission.prototype.addTorrent = function(torrent, args, callback) {
    if (torrent.isMagnetLink()) {
        this.addTorrentByMagnet(torrent.getUrl(), args, callback);
    } else {
        var transmission = this;

        torrent.getEncodedMetaInfo(function(metainfo) {
            transmission.addTorrentByMetaInfo(metainfo, args, callback);
        });
    }
};

/**
 * @param {Function} callback
 */
Transmission.prototype.getSession = function(callback) {
    this.callMethod('session-get', null, null, callback);
};
