define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./techcheck.html"
], function ($, Widget, tTechcheck) {
	"use strict";

	var HUB_PLUGINS_TECHCHECK_ENABLE = "plugins/tech-check/enable";

	return Widget.extend({
		"sig/start": function () {
			var me = this;

			return me.html(tTechcheck).then(function () {
				// Signal that the Tech-Check widget is ready
				return me.publish(HUB_PLUGINS_TECHCHECK_ENABLE, true);
			});
		}
	});
});
