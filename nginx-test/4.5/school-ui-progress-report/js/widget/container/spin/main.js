define([
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"template!./spin.html"
], function ($, Widget, Load, tSpin) {
	"use strict";

	var INIT_DATA = "_init_data";
	var $ELEMENT = "$element";

	return Widget.extend(function ($element, path, initData) {
		this[INIT_DATA] = initData;
	}, {
		"sig/start": function () {
			var me = this;
			me[$ELEMENT].html(tSpin());
			me[$ELEMENT].find(".ets-pr-header-nav").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-unit-list").data("initData", me[INIT_DATA]);
			return me.weave();
		}
	});
});
