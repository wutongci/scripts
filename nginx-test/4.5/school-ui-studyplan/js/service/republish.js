define([
	"jquery",
	"troopjs-ef/component/service",
	"school-ui-shared/utils/typeid-parser",
	"poly"
], function studyplanRepublish($, Service, Parser, poly) {
	"use strict";

	return Service.extend({
		// hack for summary page of activity container
		"hub/load/requests": function (requests) {
			var _requests = {};

			if(!requests) {
				return;
			}

			Object.keys(requests).forEach(function (key) {
				var value = requests[key];
				_requests[key] = (key === "activity" && value === "summary")
					? {
					"value": value,
					"load": false
				}
					: value;
			});

			return [ _requests ];
		},

		// re-publish to start/load
		"hub/load/results": function(results){
			if(results.activity && results.activity.templateActivityId) {
				this.publish("start/load/activity", {id: results.activity.templateActivityId});
			}
		},

		// re-publish to load step summary
		"hub:memory/load/activity": function(activity){
			if(activity == "summary") {
				this.publish("load/step/summary");
			}
		}
	});
});
