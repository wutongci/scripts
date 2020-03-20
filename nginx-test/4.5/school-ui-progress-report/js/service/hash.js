define([
	"when",
	"troopjs-ef/component/service",
	"troopjs-browser/route/uri"
], function (when, Service, URI) {
	"use strict";

	var ROUTE = "_route";

	function string2uri(hash) {
		return URI(hash);
	}

	function uri2string(uri) {
		var result = "";
		if (uri.path) {
			result += uri.path.toString();
		}
		if (uri.query) {
			result += "?" + uri.query.toString();
		}
		return result;
	}

	return Service.extend({
		"displayName": "school-ui-progress-report/service/navigate",

		"hub:memory/route": function onRoute(uri) {
			var me = this;

			if (!(me[ROUTE] && uri && me[ROUTE].toString() === uri.toString())) {
				me.publish("navigate", uri2string(uri));
			}
		},

		"hub/navigate": function (hash) {
			var me = this;
			return me.publish("navigation/verify", string2uri(hash)).spread(function (hash) {
				me[ROUTE] = string2uri(hash);
				return me.publish("route/set", me[ROUTE]).then(function () {
					return me.publish("navigate/to", me[ROUTE]);
				});
			});
		}
	});
});
