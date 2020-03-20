define([
	"jquery",
	"troopjs-ef/component/widget",
	"when",
	"school-ui-shared/utils/typeid-parser",
	"template!./launcher.html"
], function WrapperModule($, Widget, When, typeidParser, tLauncher) {

	var TARGET = "target";
	var $ELEMENT = "$element";
	var ACT_CONTENT = "activityContent";

	return Widget.extend(function ($element, name, option) {
		var me = this;
		me._json = option[ACT_CONTENT];
		me[TARGET] = option[TARGET];
		me._option = option;
	}, {
		"sig/start": function initialize() {
			var me = this;
			return me
				.html(tLauncher)
				.then(function () {
					return me[$ELEMENT]
						.find(".ets-act-bd-activity")
						.data("option", me._option)
						.attr("data-at-id", "activity-container")
						.attr("data-at-activity-id", typeidParser.parseId(me._option.act_id))
						.attr("data-weave", me[TARGET] + "(option)")
						.weave();
				});
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			delete me._json;
			delete me._option;
		}
	});
});
