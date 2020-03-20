define([
	"jquery",
	"troopjs-ef/component/widget"
], function ($, Widget) {
	"use strict";

	var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

	return Widget.extend(function (path, $element, page) {
		this.page = page;
	}, {
		"sig/start": function () {
			var me = this;

			me.query(MSS_LEVEL_TEST_VERSION).spread(function (mssLevelTestVersion) {
				var levelTestWidget = "school-ui-progress-report/widget/container/ge/level-test/";

				var levelTestVersion = parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);
				if (levelTestVersion === 1) {
					levelTestWidget += "legacy/main('" + me.page + "')";
				}
				else {
					levelTestWidget += "platform2/main('" + me.page + "')";
				}

				var $widget = $('<div></div>', {
					"data-weave": levelTestWidget
				});
				me.$element.replaceWith($widget);
				$widget.weave();
			});
		}
	});
});
