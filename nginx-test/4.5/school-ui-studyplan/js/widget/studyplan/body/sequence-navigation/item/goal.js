define([
	"./base"
], function (Widget) {

	var ID = "_id";
	var $ELEMENT = "$element";
	var RENDER_DATA = "_render_data";
	var ITEM_UI_STATUS = "_item_ui_status";
	var CLS_GOAL = "ets-sp-sqn-item-goal";
	var PREVIOUS_SELECTED_ID = "_previous_selected_id";
	var WIDGET_MARK_PATH = "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/";

	return Widget.extend(function ($element, path, itemID) {
		var me = this;
		me[$ELEMENT].addClass(CLS_GOAL);
	}, {
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-goal-poly";
				me[RENDER_DATA].itemBackgroundClass = "ets-icon-goal-bg";
				me[RENDER_DATA].customMark.push(WIDGET_MARK_PATH + "goal");
				me[RENDER_DATA].topic = me.query("blurb!568667").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverTitle = me.query("blurb!571166").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverContent = me.query("blurb!571167").spread(function (blurb) {
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
