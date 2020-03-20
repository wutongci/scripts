define([], function () {
	return location.protocol === 'http:'
		? "ccl!'configuration.servers.cache'"
		: "ccl!'configuration.servers.cachesecure'";
});
