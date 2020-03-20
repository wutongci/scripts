define([
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-private-lesson";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				// if we use custom mark in PL, add this code
				me[RENDER_DATA].customMark.push(
					me.publish("school/interface/studyplan/pl20-mark-widget",
						"school-ui-studyplan/widget/gl-pl/mark/pl").spread(function (widgetPath) {
						return widgetPath;
					})
				);
				me[RENDER_DATA].topic = me.query("blurb!569833").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		}
	})
});
