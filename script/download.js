TXT_CUSTOM_LOCATION_LABEL = 'Custom';

var Bytes = (function() {
    var symbols = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    var names = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    var classes = [];

    function autoSymbol(bytes) {
        var i = 0;
        var multiplier = 1;
        var last = classes.length - 1;
        while (bytes >= 1000 * multiplier && i < last) {
            multiplier *= 1024;
            ++i;
        }
        return new classes[i](bytes);
    }

    var bytesNamespace = {
        autoSymbol: autoSymbol
    };

    var prototype = {
        convert: function(symbol) {
            return new symbol(this._bytes);
        },
        normalize: function() {
            return autoSymbol(this._bytes);
        },
        getBytes: function() {
            return this._bytes;
        },
        toFixed: function(digits) {
            return this._value.toFixed(digits);
        },
        valueOf: function() {
            return this._value;
        },
        toString: function() {
            return [this._value.toFixed((this.getMultiplier() > 1) ? 2 : 0), this.getSymbol()].join('\u00A0');
        }
    };

    for ( var i = 0, multiplier = 1; i < symbols.length; ++i, multiplier *= 1024) {
        sizeClass = (function(multiplier) {
            return function(bytes) {
                this._bytes = bytes;
                this._value = bytes / multiplier;
            };
        })(multiplier);

        sizeClass.prototype = Object.create(prototype);
        sizeClass.prototype.constructor = sizeClass;

        sizeClass.prototype.getSymbol = sizeClass.getSymbol = (function(symbol) {
            return function() {
                return symbol;
            };
        })(symbols[i]);
        sizeClass.prototype.getMultiplier = sizeClass.getMultiplier = (function(multiplier) {
            return function() {
                return multiplier;
            };
        })(multiplier);

        if (i == 0) {
            sizeClass.prototype.toFixed = function(digits) {
                return this._value.toFixed();
            };
        }

        bytesNamespace[names[i]] = sizeClass;
        classes.push(sizeClass);
    }

    return bytesNamespace;
})();

function LocationsController() {
    this._defaultPath = '';

    this._select = document.getElementById('params-location');
    this._input = document.getElementById('params-path');

    this._optionCustom = this._select.appendChild(document.createElement('option'));
    this._optionCustom.classList.add('custom');
    this._optionCustom.text = TXT_CUSTOM_LOCATION_LABEL;

    var controller = this;

    function whenSelected(event) {
        controller.showCustomPath();
    }
    this._select.addEventListener('change', whenSelected, false);
    this._select.addEventListener('keyup', whenSelected, false);

    function whenEdited(event) {
        controller._optionCustom.selected = true;
    }
    this._input.addEventListener('input', whenEdited, false);
}

LocationsController.prototype.showCustomPath = function(option) {
    option = option || this._select.options[this._select.selectedIndex];
    if (!option.classList.contains('custom')) {
        if (option.classList.contains('default'))
            this._input.value = this._defaultPath;
        else
            this._input.value = this._select.value;
    }
};

/**
 * @param {Location}
 *        location
 * @param {boolean}
 *        selected
 * @returns {void}
 */
LocationsController.prototype.appendLocation = function(location, selected) {
    var option = this._select.insertBefore(document.createElement('option'), this._optionCustom);

    if (location.isDefault())
        option.classList.add('default');
    else
        option.value = location.getPath();
    option.text = location.getDescription();

    if (selected) {
        option.selected = true;
        this.showCustomPath(option);
    }
};

LocationsController.prototype.setDefaultPath = function(path) {
    this._defaultPath = path.toString();

    if (this._select.options[this._select.selectedIndex].classList.contains('default'))
        this._input.value = this._defaultPath;
};

LocationsController.prototype.getPath = function() {
    var option = this._select.options[this._select.selectedIndex];

    if (option.classList.contains('custom'))
        return this._input.value;

    if (option.classList.contains('default'))
        return null;

    return option.value;
};

var ElementProxy = (function() {

    var template = (function() {

        function generateTemplate(directory) {
            var li = document.createElement('li');
            li.classList.add(directory ? 'directory' : 'file');

            var label = document.createElement('label');
            var checkbox = document.createElement('span');
            checkbox.classList.add('check');
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.defaultChecked = true;
            checkbox.appendChild(input);
            label.appendChild(checkbox);

            if (directory) {
                var expand = document.createElement('span');
                expand.classList.add('expand');
                label.appendChild(expand);
            }

            var size = document.createElement('span');
            size.classList.add('size');
            size.appendChild(document.createTextNode(''));

            var unit = document.createElement('span');
            unit.classList.add('symbol');
            unit.appendChild(document.createTextNode(''));
            size.appendChild(unit);

            if (directory) {
                var count = document.createElement('span');
                count.classList.add('files');
                count.appendChild(document.createTextNode(''));
                size.appendChild(count);
            }
            label.appendChild(size);

            var name = document.createElement('span');
            name.classList.add('name');
            name.appendChild(document.createTextNode(''));
            label.appendChild(name);
            li.appendChild(label);

            directory && li.appendChild(document.createElement('ul'));

            return li;
        }

        return {
            file: generateTemplate(false),
            directory: generateTemplate(true)
        };
    }());

    var expandHandler = function(event) {
        var parentClasses = this.parentNode.parentNode.classList;
        if (parentClasses.contains('collapsed')) {
            parentClasses.remove('collapsed');
        } else {
            parentClasses.add('collapsed');
        }

        var resize = document.createEvent('Event');
        resize.initEvent('resize', true, true);
        document.dispatchEvent(resize);

        event.preventDefault();
    };

    function File() {
        this._element = template.file.cloneNode(true);
        this._checkbox = this._element.childNodes[0].childNodes[0].childNodes[0];
    }

    File.prototype.isChecked = function() {
        return this._checkbox.checked;
    };

    File.prototype.setChecked = function(checked) {
        this._checkbox.checked = checked;
    };

    File.prototype.setData = function(name, size) {
        var formatedSize = Bytes.autoSymbol(size);

        var sizeElement = this._element.childNodes[0].childNodes[1];
        sizeElement.childNodes[0].data = formatedSize.toFixed(1);
        sizeElement.childNodes[1].childNodes[0].data = formatedSize.getSymbol();

        var nameElement = this._element.childNodes[0].childNodes[2];
        nameElement.title = name;
        nameElement.childNodes[0].data = name;
    };

    File.prototype.listenCheckbox = function(callback) {
        this._checkbox.addEventListener('change', callback, false);
    };

    File.prototype.appendTo = function(container) {
        container.appendChild(this._element);
    };

    function Directory() {
        this._element = template.directory.cloneNode(true);
        this._container = this._element.childNodes[1];
        this._checkbox = this._element.childNodes[0].childNodes[0].childNodes[0];

        this._element.childNodes[0].childNodes[1].addEventListener('click', expandHandler, false);
    }

    Directory.prototype.isChecked = function() {
        return this._checkbox.checked;
    };

    Directory.prototype.setChecked = function(checked) {
        this._checkbox.checked = checked;
    };

    Directory.prototype.setName = function(name) {
        var nameElement = this._element.childNodes[0].childNodes[3];
        nameElement.title = name;
        nameElement.childNodes[0].data = name;
    };

    Directory.prototype.setSize = function(total, selected) {
        var formatedSize = Bytes.autoSymbol(total);

        var sizeElement = this._element.childNodes[0].childNodes[2];
        sizeElement.childNodes[0].data = (new formatedSize.constructor(selected)).toFixed(1) + '\u2009/\u2009' +
                                         formatedSize.toFixed(1);
        sizeElement.childNodes[1].childNodes[0].data = formatedSize.getSymbol();
    };

    Directory.prototype.setFiles = function(total, selected) {
        this._element.childNodes[0].childNodes[2].childNodes[2].childNodes[0].data = selected + '\u2009/\u2009' + total;
    };

    Directory.prototype.listenCheckbox = function(callback) {
        this._checkbox.addEventListener('change', callback, false);
    };

    Directory.prototype.appendTo = function(container) {
        container.appendChild(this._element);
    };

    Directory.prototype.appendChild = function(proxy) {
        proxy.appendTo(this._container);
    };

    function RootDirectory() {
        this._container = document.getElementById('filelist');
        this._checkbox = document.getElementById('filelist-all');
    }

    RootDirectory.prototype.isChecked = function() {
        return this._checkbox.checked;
    };

    RootDirectory.prototype.setChecked = function(checked) {
        this._checkbox.checked = checked;
    };

    RootDirectory.prototype.setName = function(name) {};

    RootDirectory.prototype.setSize = function(total, selected) {
        var element = document.getElementById('attr-size');
        var formatedSize = Bytes.autoSymbol(total);

        element.textContent = formatedSize;

        if (element.classList.contains('hidden')) {
            element.classList.remove('hidden');
            element.previousElementSibling && element.previousElementSibling.classList.remove('hidden');
        }

        element = document.getElementById('filelist-total-size');
        element.textContent = (new formatedSize.constructor(selected)).toFixed(1) + '\u2009/\u2009' +
                              formatedSize.toFixed(1);
        document.getElementById('filelist-total-symbol').textContent = formatedSize.getSymbol();
    };

    RootDirectory.prototype.setFiles = function(total, selected) {
        document.getElementById('filelist-total-files').textContent = selected + '\u2009/\u2009' + total;
    };

    RootDirectory.prototype.listenCheckbox = function(callback) {
        this._checkbox.addEventListener('change', callback, false);
    };

    RootDirectory.prototype.appendTo = function() {};

    RootDirectory.prototype.appendChild = function(proxy) {
        proxy.appendTo(this._container);
    };

    return {
        File: File,
        Directory: Directory,
        RootDirectory: RootDirectory
    };
})();

function File(parent, data) {
    this._parent = parent;

    this._name = data.name;
    this._size = data.size;
    this._index = data.index;
    this._selected = true;

    this._proxy = new ElementProxy.File();
    this._proxy.setData(this._name, this._size);
    this._proxy.listenCheckbox(this.whenChecked.bind(this));
}

File.prototype.getProxy = function() {
    return this._proxy;
};

File.prototype.getSize = function() {
    return this._size;
};

File.prototype.addUnselectedIndicesTo = function(indices) {
    !this._selected && indices.push(this._index);
};

File.prototype.setSelectedState = function(selected) {
    this._selected = selected;
    this._proxy.setChecked(selected);
};

File.prototype.whenChecked = function() {
    var selected = this._proxy.isChecked();
    this.setSelectedState(selected);
    if (selected) {
        this._parent.updateSelectionTotal(1, this._size);
    } else {
        this._parent.updateSelectionTotal(-1, -this._size);
    }
};

function Directory(parent, name) {
    this._parent = parent;

    this._directories = {};
    this._children = [];

    this._name = name;

    this._totalFiles = 0;
    this._totalSize = 0;
    this._selectedFiles = 0;
    this._selectedSize = 0;

    this._proxy = new (this._parent ? ElementProxy.Directory : ElementProxy.RootDirectory)();
    this._proxy.setName(this._name);
    this._proxy.listenCheckbox(this.whenChecked.bind(this));
}

Directory.prototype.getProxy = function() {
    return this._proxy;
};

Directory.prototype.getSubDirectory = function(name) {
    return this._directories[name];
};

Directory.prototype.appendDirectory = function(name) {
    var directory = new Directory(this, name);
    this._proxy.appendChild(directory.getProxy());

    this._directories[name] = directory;
    this._children.push(directory);

    return directory;
};

Directory.prototype.appendFile = function(data) {
    var file = new File(this, data);
    this._proxy.appendChild(file.getProxy());

    this._children.push(file);

    this._totalFiles += 1;
    this._totalSize += file.getSize();

    return file;
};

Directory.prototype.initializeTotals = function() {
    var sub;
    for (name in this._directories) {
        sub = this._directories[name];
        sub.initializeTotals();

        this._totalFiles += sub._totalFiles;
        this._totalSize += sub._totalSize;
    }
    this.setSelectionTotal(this._totalFiles, this._totalSize);
};

Directory.prototype.setSelectionTotal = function(files, size) {
    this._selectedFiles = files;
    this._selectedSize = size;

    this._proxy.setChecked(this._totalFiles == this._selectedFiles);
    this._proxy.setFiles(this._totalFiles, this._selectedFiles);
    this._proxy.setSize(this._totalSize, this._selectedSize);
};

Directory.prototype.updateSelectionTotal = function(files, size) {
    this.setSelectionTotal(this._selectedFiles + files, this._selectedSize + size);
    this._parent && this._parent.updateSelectionTotal(files, size);
};

Directory.prototype.setSelectedState = function(selected) {
    for ( var i = 0, child; child = this._children[i]; ++i) {
        child.setSelectedState(selected);
    }
    this.setSelectionTotal(selected ? this._totalFiles : 0, selected ? this._totalSize : 0);
};

Directory.prototype.addUnselectedIndicesTo = function(indices) {
    for ( var i = 0, child; child = this._children[i]; ++i) {
        child.addUnselectedIndicesTo(indices);
    }
};

Directory.prototype.whenChecked = function() {
    var selected = this._proxy.isChecked();

    if (this._parent) {
        if (selected) {
            this._parent.updateSelectionTotal(this._totalFiles - this._selectedFiles, this._totalSize -
                                                                                      this._selectedSize);
        } else {
            this._parent.updateSelectionTotal(-this._selectedFiles, -this._selectedSize);
        }
    }

    this.setSelectedState(selected);
};

function FileTreeController() {
    this._filetree = new Directory(null, null);
}

FileTreeController.prototype.appendFile = function(data) {
    var directory = this._filetree;
    var path = data.path;
    var name;
    while (name = path.shift(), path.length > 0) {
        directory = directory.getSubDirectory(name) || directory.appendDirectory(name);
    }
    data.name = name;
    directory.appendFile(data);
};

FileTreeController.prototype.initializeTotals = function() {
    this._filetree.initializeTotals();
};

FileTreeController.prototype.getUnselectedIndices = function() {
    var indices = [];
    this._filetree.addUnselectedIndicesTo(indices);
    return indices;
};

function PageController() {
    this.initializeSpinner();
    this.showModalProgressSpinner();

    this.initializeTabs();
    $(window).resize(this.resizeHeader.bind(this));

    this._settings = new Settings();

    this._fileTreeController = new FileTreeController();
    this._locationsController = new LocationsController();

    this._transmission = new Transmission(this._settings.server, this._settings.usename, this._settings.password);

    var locations = this._settings.locations;
    for ( var i = 0, location; location = locations[i]; ++i) {
        this._locationsController.appendLocation(location, i == 0);
    }

    var controller = this;

    this._transmission.getSession(function(result) {
        if (result instanceof Transmission.Success) {
            controller._locationsController.setDefaultPath(result['download-dir']);
        }
    });

    var url = window.location.hash.substring(1);
    Torrent.loadFromUrl(url, function(torrent) {
        if (!torrent.isValid()) {
            controller.showModalMessage('Invalid torrent', 'Not a valid torrent', 'error', ['close'], [function() {
                window.close();
            }]);
        }
        if (!torrent.isMagnetLink()) {
            controller.processTorrent(torrent._data);
        }

        $('#start').click(function() {
            controller.addTorrent(torrent, false);
        });

        $('#add').click(function() {
            controller.addTorrent(torrent, true);
        });

        $('#close').click(function() {
            window.close();
        });

        controller.hideModal();
    });
}

PageController.prototype.initializeSpinner = function() {
    var options = {
        lines: 12, // The number of lines to draw
        length: 7, // The length of each line
        width: 4, // The line thickness
        radius: 10, // The radius of the inner circle
        color: '#000', // Color #RGB or #RRGGBB
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
    };

    var container = document.getElementById('modal');
    var spinner = new Spinner(options).spin().el;

    spinner.id = 'modal-spinner';
    spinner.style.top = '50%';
    spinner.style.left = '50%';

    container.appendChild(spinner);
};

PageController.prototype.showModalMessage = function(header, message, style, buttons, actions) {
    var modalContainer = $('#modal');
    modalContainer.children().hide();
    $('#message').removeClass().addClass(style);
    $('#message-header').text(header);
    $('#message-text').text(message);
    $('#message-controls > button').hide().unbind('click');
    for ( var i = 0, length = Math.min(buttons.length, actions.length); i < length; ++i) {
        $('#message-controls > button[name="' + buttons[i] + '"]').show().click(actions[i]);
    }
    $('#message').show();
    modalContainer.show();
};

PageController.prototype.showModalProgressSpinner = function() {
    var modalContainer = $('#modal');
    modalContainer.children().hide();

    $('#modal-spinner').show();
    modalContainer.show();
};

PageController.prototype.hideModal = function() {
    $('#modal').hide();
};

PageController.prototype.initializeTabs = function() {
    $('dl.tabs').children('dd').hide().first().show();
    $('dl.tabs').children('dt').click(function() {
        $(this).parent().children('dd').hide();
        $(this).parent().children('dt').removeClass('selected');
        $(this).nextUntil('dt', 'dd').show();
        $(this).addClass('selected');

        var resize = document.createEvent('Event');
        resize.initEvent('resize', true, true);
        document.dispatchEvent(resize);
    }).first().addClass('selected');
};

PageController.prototype.showTrackers = function(trackers) {
    for ( var i = 0, length = trackers.length; i < length; ++i) {
        var li = $('<li></li>').appendTo('#attr-announce');
        li.attr('title', trackers[i]);
        li.text(trackers[i]);
    }
    $('#attr-announce').parent('dd').removeClass('hidden').prev('dt').removeClass('hidden');
};

PageController.prototype.resizeHeader = function() {
    if ($('#filelist-header').is(':visible')) {
        $('#filelist-header').width(document.getElementById('filelist-container').clientWidth);
        $('#filelist-footer').width(document.getElementById('filelist-container').clientWidth);
    }
};

PageController.prototype.processTorrent = function(torrent) {
    var name = torrent.info.name;

    $('#torrent-name').text(name);
    $('#torrent-name').attr('title', name);

    if (torrent['announce-list'])
        this.showTrackers(Array.prototype.concat.apply([], torrent['announce-list']));
    else if (torrent['announce'])
        this.showTrackers([torrent['announce']]);

    if (torrent['comment']) {
        $('#attr-comment').text(torrent['comment']);
        $('#attr-comment').removeClass('hidden').prev('dt').removeClass('hidden');
    }

    if (torrent['creation date']) {
        $('#attr-date').text((new Date(1000 * torrent['creation date'])).toLocaleDateString());
        $('#attr-date').removeClass('hidden').prev('dt').removeClass('hidden');
    }

    if (torrent['created by']) {
        $('#attr-creator').text(torrent['created by']);
        $('#attr-creator').removeClass('hidden').prev('dt').removeClass('hidden');
    }

    if (torrent.info.files) {
        for ( var i = 0, file; file = torrent.info.files[i]; ++i) {
            this._fileTreeController.appendFile({
                path: file.path,
                index: i,
                size: file.length
            });
        }
    } else {
        this._fileTreeController.appendFile({
            path: [name],
            index: 0,
            size: torrent.info.length
        });
    }

    this._fileTreeController.initializeTotals();

    this.resizeHeader();
};

PageController.prototype.addTorrent = function(torrent, paused) {
    this.showModalProgressSpinner();

    var arguments = Transmission.customizeAddTorrent(this._locationsController.getPath(), paused,
                                                     this._fileTreeController.getUnselectedIndices());

    var controller = this;

    this._transmission.addTorrent(torrent, arguments, function(result) {
        if (result instanceof Transmission.Success)
            controller.showModalMessage('Torrent added', 'Torrent was successfully added to Transmission', 'green',
                                        ['close'], [function() {
                                            window.close();
                                        }]);
        else if (result instanceof Transmission.Failure && result == 'duplicate torrent')
            controller.showModalMessage('Duplicate torrent', 'This torrent has been already added to Transmission.',
                                        'error', ['close'], [function() {
                                            window.close();
                                        }]);
        else
            controller.showModalMessage('Error', 'Torrent addition failed', 'error', ['close'], [function() {
                window.close();
            }]);
    });
};

(function() {
    var controller = null;

    $(document).ready(function() {
        controller = new PageController();
    });
})();
