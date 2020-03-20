define([
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/enum/studyplan-item-state",
	"template!./locked.html"
], function ($, Widget, stateParser, stduyplanItemState, tLocked) {
	"use strict";
	var ITEM_DATA = "_item_data";

	return Widget.extend(function ($element, path, itemData) {
		this[ITEM_DATA] = itemData;
	}, {
		"sig/start": function () {
			var me = this;
			if (!me[ITEM_DATA] && !me[ITEM_DATA].progress) return;
			return me.query(me[ITEM_DATA].progress.id).spread(function (data) {
				var state = stateParser.parseFlag(stduyplanItemState, data.state);
				if (state.Locked) {
					return me.publish("school/interface/studyplan/cp20-locked-widget").spread(function (widgetPath) {
						if (widgetPath) {
							$("<div></div>", {
								"data-weave": widgetPath + "(itemData)",
								data: {
									itemData: me[ITEM_DATA]
								}
							}).appendTo(me.$element).weave();
						} else {
							return me.html(tLocked, {
								itemData: me[ITEM_DATA]
							});
						}
					});
				}
				else {

					return me.publish("school/interface/studyplan/cp20-container-widget",
						"school-ui-studyplan/widget/gl-pl/checkpoint20/main").spread(function (widgetPath) {

						$("<div></div>", {
							"data-weave": widgetPath + "(itemData)",
							data: {
								itemData: me[ITEM_DATA]
							}
						}).appendTo(me.$element).weave();
					});
				}

			});
		},
		//next lesson on locked page
		"dom:[data-action=takeNext]/click": function () {
			this.publish("studyplan/sequence/navigate/suggest-item");
		}
	});
});
