define([
	"when",
	"jquery",
	"client-tracking",
	"troopjs-ef/component/widget",
	"template!./main.html"
], function (when, $, ct, Widget, tButton) {
	"use strict";

	var SEL_SP = ".ets-sp-study";
	var CLS_UO_WIDGET = "ets-uo-widget";

	function showUnitOverview() {
		var me = this;

		$("." + CLS_UO_WIDGET).remove();
		var $widgetUniOverview = $('<div></div>', {
			"class": CLS_UO_WIDGET,
			"data-weave": "school-ui-shared/widget/unit-overview/modal-container/main(templateUnitid)"
		});

		return me._dfdUnit.promise.then(function (unit) {
			return $widgetUniOverview
				.data('templateUnitid', unit.templateUnitId)
				.insertAfter($(SEL_SP))
				.weave();
		});
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			me._dfdUnit = when.defer();
			me.html(tButton);
		},
		"hub:memory/load/unit": function (unit) {
			var me = this;

			//if switched to another unit, need to generate a new defer for unit data
			if (me._dfdUnit.promise.inspect().state !== "pending") {
				me._dfdUnit = when.defer();
			}

			me._dfdUnit.resolve(unit);
		},
		"dom:button/click": function () {
			ct.useraction({
				"action.unitOverviewClick": "1"
			});

			var me = this;
			showUnitOverview.call(me);
		}
	});
});
