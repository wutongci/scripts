define([
	"school-ui-progress-report/widget/shared/state-circle/main"
], function (StateCircleWidget) {
	"use strict";

	return StateCircleWidget.extend({
		"hub:memory/progress-report/ge/state-circle/selected": function (selectedId) {
			this.setSelected(selectedId);
		},
		"hub:memory/progress-report/ge/state-circle/hovered": function (hoveredId) {
			this.setHovered(hoveredId);
		}
	});
});
