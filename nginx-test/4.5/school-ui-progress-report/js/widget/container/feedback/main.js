define([
	"jquery",
	"json2",
	"moment",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"template!./feedback.html"
], function ($, JSON, Moment, Widget, loom, weave, tFeedback) {
	"use strict";

	var $ELEMENT = "$element";
	var INIT_DATA = "_init_data";

	var SEL_FEEDBACK_BODY = ".ets-pr-feedback tbody";
	var SEL_PAGINATION = ".ets-pr-pagination";

	return Widget.extend(function ($element, path, initData) {
		this[INIT_DATA] = initData;
	}, {
		"sig/start": function () {
			var me = this;
			var feedbacks = me[INIT_DATA].feedbacks;

			var selectedItem;
			if (me[INIT_DATA].fb_id) {
				var itemData = me[INIT_DATA].fb_id.split("_");
				selectedItem = {
					typeCode: itemData[0],
					feedbackId: itemData[1]
				};
			}

			me[$ELEMENT].html(tFeedback());
			me[$ELEMENT].find(SEL_FEEDBACK_BODY).data("selectedItem", selectedItem);
			me[$ELEMENT].find(SEL_PAGINATION).data("items", feedbacks).data("selectedItem", selectedItem);
			return me.weave();
		}
	});
});
