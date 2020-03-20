define([
	"jquery",
	"troopjs-ef/component/widget"
], function ($, Widget) {
	"use strict";
	var ITEM_DATA = "_item_data";

	return Widget.extend(function ($element, path, itemData) {
		this[ITEM_DATA] = itemData;
	}, {
		"sig/start": function () {
			var me = this;

			return me.publish("school/interface/studyplan/pl20-container-widget",
				"school-ui-studyplan/widget/gl-pl/privatelesson/main").spread(function (widgetPath) {

				$("<div></div>", {
					"data-weave": widgetPath + "(itemData)",
					data: {
						itemData: me[ITEM_DATA]
					}
				}).appendTo(me.$element).weave();
			});
		}
	});
});
