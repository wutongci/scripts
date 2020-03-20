define([
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-group-lesson";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				// if we use custom mark in PL, add this code
				//me[RENDER_DATA].customMark.push("...");
				me[RENDER_DATA].topic = me.query("blurb!638118").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		}
	})
});
