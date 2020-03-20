/**
 * @class omniture tracker
 * Send omniture tracking info
 */
define(['./etvt', '../base/main'], function OmnitureTrackerModule(etvt, Widget) {
	"use strict";

	return Widget.extend({
		scope: 'e12_etvt',
		_onSend: function onSend(data, track) {
			if (!track.uri) {
				return;
			}

			// Change hash to path format, and can let back-end save data to DB.
			// After back-end framework update, will be deleted.
			var loc = window.location;
			etvt.send(loc.protocol + '//' + loc.host + loc.pathname + (loc.pathname.substr(loc.pathname.length - 1) === "/" ? loc.hash.replace('#', '') : loc.hash.replace('#', '/')) + (loc.search ? loc.search : ''));
		}
	});
});
