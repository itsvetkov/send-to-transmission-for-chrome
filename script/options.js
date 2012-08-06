var TXT_SETTINGS_SAVED = 'Settings saved';
var TXT_SERVER_OK = 'Server settings are OK';
var TXT_SERVER_FAILURE = 'Server is not responding';
var TXT_BTN_TEST = 'Test';
var TXT_BTN_CONNECTING = 'Connecting...';
var TXT_LABEL_UNAVAILABLE = 'Unavailable';

var ElementProxy = (function() {

    var template = (function() {
        function generateTemplate(custom) {
            var row = document.createElement('tr');

            var label = document.createElement('input');
            label.type = 'text';
            row.insertCell(-1).appendChild(label);

            var path = document.createElement('input');
            path.type = 'text';
            if (!custom) {
                path.disabled = true;
                path.placeholder = TXT_LABEL_UNAVAILABLE;
            }
            row.insertCell(-1).appendChild(path);

            var controls = row.insertCell(-1);

            var up = document.createElement('div');
            up.classList.add('button');
            up.classList.add('up');
            controls.appendChild(up);

            var down = document.createElement('div');
            down.classList.add('button');
            down.classList.add('down');
            controls.appendChild(down);

            if (custom) {
                var remove = document.createElement('div');
                remove.classList.add('button');
                remove.classList.add('remove');
                controls.appendChild(remove);
            }

            return row;
        }

        return {
            'default': generateTemplate(false),
            'custom': generateTemplate(true)
        };
    })();

    function DefaultPath(element, label, path) {
        this._element = (element != null) ? element : template['default'].cloneNode(true);
        this._label = this._element.childNodes[0].childNodes[0];
        this._path = this._element.childNodes[1].childNodes[0];

        label !== undefined && this.setLabel(label);
        path !== undefined && this.setPath(path);
    }

    DefaultPath.prototype.getLabel = function() {
        return this._label.value;
    };

    DefaultPath.prototype.setLabel = function(label) {
        this._label.value = label;
    };

    DefaultPath.prototype.getPath = function() {
        return this._path.value;
    };

    DefaultPath.prototype.setPath = function(path) {
        this._path.value = path;
    };

    DefaultPath.prototype.setLocation = function(location) {
        this.setLabel(location.getLabel());
    };

    DefaultPath.prototype.getLocation = function() {
        return new Location(this.getLabel());
    };

    DefaultPath.prototype.listenUp = function(callback) {
        this._element.childNodes[2].childNodes[0].addEventListener('click', callback, false);
    };

    DefaultPath.prototype.listenDown = function(callback) {
        this._element.childNodes[2].childNodes[1].addEventListener('click', callback, false);
    };

    DefaultPath.prototype.moveUp = function() {
        if (this._element.previousSibling) {
            this._element.parentNode.insertBefore(this._element, this._element.previousSibling);
        }
    };

    DefaultPath.prototype.moveDown = function() {
        if (this._element.nextSibling) {
            this._element.parentNode.insertBefore(this._element, this._element.nextSibling.nextSibling);
        }
    };

    DefaultPath.prototype.appendTo = function(container) {
        container.appendChild(this._element);
    };

    DefaultPath.prototype.remove = function() {
        if (this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
    };

    function CustomPath(element, label, path) {
        arguments[0] == null && (arguments[0] = template['custom'].cloneNode(true));
        DefaultPath.apply(this, arguments);
    }

    CustomPath.prototype = Object.create(DefaultPath.prototype);
    CustomPath.prototype.constructor = CustomPath;

    CustomPath.prototype.setLocation = function(location) {
        this.setLabel(location.getLabel());
        if (!location.isDefault())
            this.setPath(location.getPath());
    };

    CustomPath.prototype.getLocation = function() {
        return new Location(this.getLabel(), this.getPath());
    };

    CustomPath.prototype.listenRemove = function(callback) {
        this._element.childNodes[2].childNodes[2].addEventListener('click', callback, false);
    };

    return {
        DefaultPath: DefaultPath,
        CustomPath: CustomPath
    };
})();

function LocationsController() {
    this._defaultPath = null;
    this._defaultPathProxy = null;

    this._container = document.getElementById('locations');

    this._proxies = [];

    document.getElementById('new-location').addEventListener('click', this.addLocation.bind(this), false);
}

LocationsController.prototype.addLocation = function() {
    var inputLabel = document.getElementById('new-label');
    var inputPath = document.getElementById('new-path');

    var label = inputLabel.value;
    var path = inputPath.value;

    /* TODO Perfom advanced input check and feedback */
    if (!label || !path)
        return;

    this.appendLocation(new Location(label, path));
    inputLabel.value = '';
    inputPath.value = '';
};

LocationsController.prototype.appendLocation = function(location) {
    var proxy = new (location.isDefault() ? ElementProxy.DefaultPath : ElementProxy.CustomPath)(null);

    proxy.setLocation(location);
    proxy.appendTo(this._container);

    var controller = this;

    proxy.listenUp(function() {
        var proxies = controller._proxies;
        var index = proxies.indexOf(proxy);
        if (index > 0) {
            proxies[index] = proxies[index - 1];
            proxies[index - 1] = proxy;
            proxy.moveUp();
        }
    });

    proxy.listenDown(function() {
        var proxies = controller._proxies;
        var index = proxies.indexOf(proxy);
        if (index + 1 < proxies.length) {
            proxies[index] = proxies[index + 1];
            proxies[index + 1] = proxy;
            proxy.moveDown();
        }
    });

    if (!location.isDefault()) {
        proxy.listenRemove(function() {
            var proxies = controller._proxies;
            proxies.splice(proxies.indexOf(proxy), 1);
            proxy.remove();
        });
    } else {
        this._defaultPathProxy = proxy;
        if (this._defaultPath != null)
            proxy.setPath(this._defaultPath);
    }

    this._proxies.push(proxy);
};

LocationsController.prototype.setDefaultPath = function(path) {
    this._defaultPath = path.toString();
    if (this._defaultPathProxy)
        this._defaultPathProxy.setPath(this._defaultPath);
};

LocationsController.prototype.getLocations = function() {
    var locations = [];
    var proxies = this._proxies;

    for ( var i = 0, length = proxies.length; i < length; ++i) {
        locations.push(proxies[i].getLocation());
    }

    return locations;
};

function PageController() {
    this._settings = new Settings();
    this._locationsController = new LocationsController();

    $('#server').val(this._settings.server);
    $('#username').val(this._settings.username);
    $('#password').val(this._settings.password);

    for ( var i = 0, location; location = this._settings.locations[i]; ++i) {
        this._locationsController.appendLocation(location);
    }

    this.testServer(this._settings.server, this._settings.username, this._settings.password);

    var controller = this;

    $('#save').click(function(event) {
        controller.saveSettings();
    });

    $('#test').click(function(event) {
        controller.testServer($('#server').val(), $('#username').val(), $('#password').val());
    });

    $('#close').click(function(event) {
        window.close();
    });
}

PageController.prototype.showMessage = function(text, style) {
    var message = $('#message');

    if (message.hasClass('show'))
        message.removeClass().addClass('hide');
    else
        message.removeClass().addClass('show');
    message.addClass(style).text(text);

    $('#message-container').toggleClass('show').toggleClass('hide');
};

PageController.prototype.testServer = function(server, username, password) {
    $('#test').text(TXT_BTN_CONNECTING).prop('disabled', true);

    var transmission = new Transmission(server, username, password);
    var controller = this;

    transmission.getSession(function(result) {
        $('#test').text(TXT_BTN_TEST).prop('disabled', false);
        if (result instanceof Transmission.Success) {
            $('#version').removeClass('unavailable').text(result['version']);
            controller._locationsController.setDefaultPath(result['download-dir']);
            controller.showMessage(TXT_SERVER_OK, 'success');
        } else {
            $('#version').addClass('unavailable').text(TXT_LABEL_UNAVAILABLE);
            controller._locationsController.setDefaultPath('');
            controller.showMessage(TXT_SERVER_FAILURE, 'failure');
        }
    });
};

PageController.prototype.saveSettings = function() {
    this._settings.server = $('#server').val();
    this._settings.username = $('#username').val();
    this._settings.password = $('#password').val();
    this._settings.locations = this._locationsController.getLocations();
    this._settings.save();

    this.showMessage(TXT_SETTINGS_SAVED, 'success');
};

(function() {
    var controller = null;

    $(document).ready(function() {
        controller = new PageController();
    });
})();
