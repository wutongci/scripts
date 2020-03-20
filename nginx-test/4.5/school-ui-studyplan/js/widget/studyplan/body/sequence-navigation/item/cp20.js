define([
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";
	var ITEM_UI_STATUS = "_item_ui_status";
	var PREVIOUS_SELECTED_ID = "_previous_selected_id";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-check-point";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				// if we use custom mark in PL, add this code
				me[RENDER_DATA].customMark.push(
					me.publish("school/interface/studyplan/cp20-mark-widget",
						"school-ui-studyplan/widget/gl-pl/mark/cp20").spread(function (widgetPath) {
							return widgetPath;
						})
				);
				me[RENDER_DATA].topic = me.query("blurb!639494").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverTitle = me.query("blurb!639496").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverContent = me.query("blurb!639497").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		},
		"hub/studyplan/sequence/update": function () {
			var me = this;
			me.tryShowPopover();
		},
		"suggest": function () {
			var me = this;
			me.tryShowPopover();
		},
		"unavailable": function () {
			var me = this;
			me.tryShowPopover();
		},
		"selected": function (selected, id) {
			var me = this;

			//for continuously trigged "selected" callback
			//from clickHandler() and hub:memory/load/studyplan_item
			//make sure that process same id only once
			//otherwise notification will be shown and hidden immediately
			if (id !== me[PREVIOUS_SELECTED_ID]) {
				if (me.canShowPopover()) {
					me.tryShowPopover();
				} else {
					me.hidePopover();
				}
				me[PREVIOUS_SELECTED_ID] = id;
			}
		},
		"hub/activity/opened": function () {
			var me = this;
			me.setStoreShownId(false);
		},
		"hub/activity/closed": function () {
			var me = this;
			me.setStoreShownId(true);
			me.tryShowPopover();
		}
	})
});
