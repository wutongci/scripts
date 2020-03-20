define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./cp-goal.html"
], function ($, Widget, tGoalMark) {

	return Widget.extend(function ($element, path, data) {
	}, {
		"displayName": "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/goal",
		"sig/start": function () {
			var me = this;
			me.html(tGoalMark);
		}
	});
});
