define([
], function () {
	"use strict";

	var performance = window.performance;
	var HAS_PERFORMANCE_API = Boolean(
		performance
		&& typeof performance.getEntries === 'function'
		&& window.PerformanceResourceTiming
	);

	if (HAS_PERFORMANCE_API) {
		if (typeof performance.clearResourceTimings === 'function'
			&& typeof performance.setResourceTimingBufferSize === 'function') {
			performance.onresourcetimingbufferfull = (function (onresourcetimingbufferfull) {
				if (performance.getEntries().length < 1000) {
					performance.setResourceTimingBufferSize(1000);
				}
				onresourcetimingbufferfull.apply(this, arguments);
				performance.clearResourceTimings();
			})(performance.onresourcetimingbufferfull || function () {});
		}
	}

	return {
		"getLogMessage": function () {
			if (HAS_PERFORMANCE_API) {
				var perfs = {
					timing: performance.timing,
					entries: performance.getEntries().slice(-50),
				};
				return JSON.stringify(perfs, function (key, value) {
					if (typeof value === 'number') {
						return Number(value.toFixed(3));
					}
					if (typeof value === 'string') {
						return value.replace(/\s/g, '~');
					}
					return value;
				});
			}
			return '';
		}
	};
});
