define([
	"jquery",
	"logger",
	"troopjs-ef/component/widget"
], function ($, Logger, Widget) {
	"use strict";

	var $ELEMENT = "$element";
	var PROP_TEST_RESULTS_WIDGET = "_testResultsWidget";

	return Widget.extend(function ($element, path, testResultsWidget) {
		this[PROP_TEST_RESULTS_WIDGET] = testResultsWidget;
	}, {
		"sig/start": function () {
			var me = this;
			var widgetPath = me[PROP_TEST_RESULTS_WIDGET];
			if (widgetPath) {
				var $widget = $("<div></div>", {
					"data-weave": widgetPath
				});

				$widget.appendTo(me[$ELEMENT]).weave();
			}
			else {
				Logger.log("Progress Report: test results widget not found.")
			}
		}
	});
});
