define([
	"jquery",
	"when",
	"troopjs-ef/component/widget",
	"poly"
], function studyplanHashHandle($, when, Widget, poly) {
	"use strict";

	var UNDEF;

	return Widget.extend({
		"hub/school/interface/get/activity-container/closeHash": function(){
			var me = this;

			return [{
				"prefix": "preview",
				"studyplan": 0,
				"studyplan_item": 0
			}]
		}
	});
});
