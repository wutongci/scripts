define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./index.html"
], function($, Widget, template) {
	"use strict";

	var PL_BOOK_URL = "/school/evc/pl/unitaligned";
	var KEY = "SP";
	return Widget.extend(function($element, widgetName, unitId) {
		var me = this;
		// get parameters
		me.unitId = unitId;
	}, {
		"sig/start": function() {
			var me = this;

			if (!me.unitId) {
				return;
			}

			var tempData = {};
			tempData.bookUrl = PL_BOOK_URL +
				"/" + me.unitId +
				"?source=" + encodeURIComponent(location.href) +
				"&key=" + KEY +
				"#booking";

			me.html(template, tempData);
		},
		"dom:.btn-default/click": function skipCp(){
			var me = this;
			me.publish("studyplan/sequence/navigate/goal");
		}
	});
});
