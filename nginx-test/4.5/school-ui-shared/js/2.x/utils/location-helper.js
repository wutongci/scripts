define([], function () {
	//constructor
	function LocationHelper(initHref) {
		var me = this;
		if (!(me instanceof LocationHelper)) {
			return new LocationHelper(initHref);
		}

		me.link = document.createElement('a');
		if (initHref) {
			me.link.href = initHref;
		}
	}

	//common function
	LocationHelper.prototype.getUrl = function () {
		return this.link.href;
	};

	LocationHelper.prototype.toString = LocationHelper.prototype.getUrl;
	LocationHelper.prototype.valueOf = LocationHelper.prototype.getUrl;

	//href
	LocationHelper.prototype.getHref = LocationHelper.prototype.getUrl;
	LocationHelper.prototype.setHref = function (value) {
		var me = this;
		me.link.href = value;
		return me;
	};

	//protocol
	LocationHelper.prototype.getProtocol = function () {
		return this.link.protocol;
	};
	LocationHelper.prototype.setProtocol = function (value) {
		var me = this;
		me.link.protocol = value;
		return me;
	};

	//host
	LocationHelper.prototype.getHost = function () {
		return this.link.host;
	};
	LocationHelper.prototype.setHost = function (value) {
		var me = this;
		me.link.host = value;
		return me;
	};

	//hostname
	LocationHelper.prototype.getHostname = function () {
		return this.link.hostname;
	};
	LocationHelper.prototype.setHostname = function (value) {
		var me = this;
		me.link.hostname = value;
		return me;
	};

	//port
	LocationHelper.prototype.getPort = function () {
		return this.link.port;
	};
	LocationHelper.prototype.setPort = function (value) {
		var me = this;
		me.link.port = value;
		return me;
	};

	//pathname
	LocationHelper.prototype.getPathname = function () {
		return this.link.pathname;
	};
	LocationHelper.prototype.setPathname = function (value) {
		var me = this;
		me.link.pathname = value;
		return me;
	};

	//search
	LocationHelper.prototype.getSearch = function () {
		return this.link.search;
	};
	LocationHelper.prototype.setSearch = function (value) {
		var me = this;
		me.link.search = value;
		return me;
	};

	//hash
	LocationHelper.prototype.getHash = function () {
		return this.link.hash;
	};
	LocationHelper.prototype.setHash = function (value) {
		var me = this;
		me.link.hash = value;
		return me;
	};

	return LocationHelper;
});
