define([
	"poly",
	"troopjs-ef/component/gadget"
], function (poly, Gadget) {

	var localStorage = window.localStorage;

	var FEEDBACK_IDS = "_progress_report_viewed_feedback_ids";
	var ID_SEPARATOR = ",";

	return Gadget.create(function () {
			this.loadIds();
		},
		{
			"loadIds": function () {
				this[FEEDBACK_IDS] = localStorage.getItem(FEEDBACK_IDS) || ID_SEPARATOR;
			},
			"saveIds": function () {
				localStorage.setItem(FEEDBACK_IDS, this[FEEDBACK_IDS]);
			},
			"isNewId": function (id) {
				var checkId = ID_SEPARATOR + id.toString() + ID_SEPARATOR;
				return this[FEEDBACK_IDS].indexOf(checkId) === -1;
			},
			"addIds": function (ids) {
				var me = this;
				var newIds = [];

				ids.forEach(function (id) {
					me.isNewId(id) && newIds.push(id);
				});

				if (newIds.length) {
					me[FEEDBACK_IDS] = ID_SEPARATOR + newIds.join(ID_SEPARATOR) + me[FEEDBACK_IDS];
					me.saveIds();
				}
			}
		}
	);
});
