define([
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/browser-check",
	"template!./callout.html"
], function (poly, Widget, browserCheck, template) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_CALLOUT = "ets-pr-callout";

	var SEL_POINTER = ".ets-pr-callout-pointer";

	return Widget.extend(function () {
	}, {
		"sig/start": function () {
			var me = this;
			me[$ELEMENT].addClass(CLS_CALLOUT);
			return me.html(template, {
				isIE8: browserCheck.browser === "msie" && parseInt(browserCheck.version) === 8
			});
		},
		"pointerTo": function ($target) {
			var me = this;
			var $pointer = me[$ELEMENT].find(SEL_POINTER);
			if ($target && $target.length > 0) {
				var centeringOffset = $target.width() / 2 - $pointer.width() / 2;
				var left = $target.offset().left - $pointer.offsetParent().offset().left;

				$pointer.show().css("left", Math.round(left + centeringOffset) + "px");
			} else {
				$pointer.hide();
			}
		}
	});
});
