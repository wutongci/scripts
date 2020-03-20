/**
 * @class omniture tracker
 * Send omniture tracking info
 */
define(['./omniture', '../base/main'], function OmnitureTrackerModule(omniture, Widget) {
	"use strict";

	return Widget.extend({
		scope: 'e12_omniture',
		_onSend: function onSend(data) {
			omniture.send(data.props);
		}
	});
});
