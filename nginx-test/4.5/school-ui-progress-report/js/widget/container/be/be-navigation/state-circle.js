define([
	"school-ui-progress-report/widget/shared/state-circle/main"
], function (StateCircleWidget) {
	"use strict";

	return StateCircleWidget.extend({
		"hub:memory/progress-report/spin/state-circle/selected": function (selectedId) {
			this.setSelected(selectedId);
		}
	});
});
