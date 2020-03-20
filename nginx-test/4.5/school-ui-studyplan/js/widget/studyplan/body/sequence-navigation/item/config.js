define([
	"./base"
], function (Widget) {

	var ID = "_id";
	var DATA = "_data";
	var RENDER_DATA = "_render_data";

	return Widget.extend(function ($element, path, itemID) {
		var me = this;
		me[DATA] = {
			id: "config",
			typeCode: "config",
			progress: {
				state: 0
			}
		};
		me[ID] = me[DATA].id;
	}, {
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-setup";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				me[RENDER_DATA].topic = me.query("blurb!656053").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		}
	})
});
