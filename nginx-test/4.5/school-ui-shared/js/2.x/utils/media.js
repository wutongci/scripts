define([], function () {
	"use strict";

	function findErrorName(error) {
		var code = error && error.code || null;
		var result = typeof code === 'number' ? String(code) : null;
		var ME = window.MediaError || {};
		Object.keys(ME).some(function (name) {
			if (name.indexOf('MEDIA_') === 0 && ME[name] === code) {
				result = name;
				return true;
			}
			return false;
		});
		return result;
	}

	return {
		findErrorName: findErrorName
	};
});
