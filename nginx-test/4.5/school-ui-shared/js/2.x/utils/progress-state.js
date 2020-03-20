define([
	"jquery",
	"school-ui-shared/enum/progress-state",
	"troopjs-ef/component/gadget"
], function ProgressStateUtilModule($, ProgressStateEnum, Gadget) {
	"use strict";

	var progressState = Gadget.create({
		notStarted: function notStarted (state) {
			return (state === ProgressStateEnum.notStarted);
		},

		hasStarted: function hasStarted (state) {
			return (state === ProgressStateEnum.started);
		},

		hasPassed: function hasPassed(state){
			return (state === ProgressStateEnum.completed);
		}
	});

	progressState.start();

	return progressState;
});
