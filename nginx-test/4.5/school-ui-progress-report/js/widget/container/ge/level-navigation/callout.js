define([
	"school-ui-progress-report/widget/shared/callout/main"
], function (CalloutWidget) {
	"use strict";

	return CalloutWidget.extend({
		"hub/progress-report/ge/callout/pointer-to": function ($target) {
			this.pointerTo($target);
		}
	});
});
