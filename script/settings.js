function Location(label, path) {
	this._label = label.toString();
	this._path = path != null ? path.toString() : '';
}

Location.prototype.isDefault = function() {
	return this._path == '';
};

Location.prototype.getLabel = function() {
	return this._label;
};

Location.prototype.getLongLabel = function() {
	return this._label;
};

Location.prototype.getDescription = function() {
	return this._label;
};

Location.prototype.getPath = function() {
	return this._path;
};

function Settings() {
    if (typeof localStorage.verConfig === 'undefined' || localStorage.verConfig < 5) {
        if (typeof localStorage.server === 'undefined') localStorage.server = 'http://localhost:9091/transmission/rpc';
        if (typeof localStorage.username === 'undefined') localStorage.username = '';
        if (typeof localStorage.password === 'undefined') localStorage.password = '';
        if (typeof localStorage.locations === 'undefined') localStorage.locations = '[]';
        
        localStorage.verConfig = 5;
    }
    
    this.server = localStorage.server;
    this.username = localStorage.username;
    this.password = localStorage.password;
    
    this.locations = this.getLocations();
}

Settings.prototype.getLocations = function() {
	var locations = localStorage.locations
			? JSON.parse(localStorage.locations)
			: [];
	var result = [];
	var def = false;
	for (var i = 0, location; location = locations[i]; ++i) {
		def = def || location.path.toString() == '';
		result.push(new Location(location.label, location.path));
	}
	if (!result.length || !def)
		result.push(new Location('Default', ''));
	return result;
};

Settings.prototype.save = function() {
    localStorage.server = this.server;
    localStorage.username = this.username;
    localStorage.password = this.password;
    
    var locations = [];
    for (var i = 0, location; location = this.locations[i]; ++i) {
        locations.push({ label: location.getLabel(), path: location.getPath() });
    }
    localStorage.locations = JSON.stringify(locations);
};