define(["troopjs-ef/component/widget",
	"jquery",
	"template!./index.html"
], function(Widget, $, template) {
	"use strict";

	var CP20_BOOK_URL = "/school/evc/pl/cp20/";

	return Widget.extend(function($element, widgetName, unitId) {
		var me = this;
		// get parameters
		me.unitId = unitId;
	}, {
		"hub:memory/studyplan/evc/cp20/enter-token": function(token) {
			var me = this;
			var tempData = {};

			if (!me.unitId) {
				return;
			}

			me.query("evc_url_resource!current").spread(function(data){
				tempData.bookUrl = data.studyPlanUrls.CP20Booking.replace("{unitId}", me.unitId)
					.replace("{source}", window.encodeURIComponent(window.location.href))
					.replace("{token}", (token ? token : ""));

				me.html(template, tempData);
			});
		},

		"dom:.btn-default/click": function skipCp(){
			var me = this;
			me.publish("studyplan/sequence/navigate/goal");
		}
	});
});
