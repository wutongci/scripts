define([
	"troopjs-ef/component/widget",
	"school-ui-studyplan/utils/client-storage",
	"template!./class-status.html"
], function (Widget, clientStorage, tClassStatus) {

	var CASE = {
		tckNoPass: {
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "656134", en : "Classroom is open but you cannot enter", classname : "evc-studyplan-blue"}
		},
		tckPassed: {
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "568579", en : "Classroom is open", classname : "evc-studyplan-blue"}
		}
	};

	var STATUS_START_STARTED = "started";

	return Widget.extend({
		"hub:memory/studyplan/evc/gl/start-status": function (status) {
			var me = this;
			var subCase = clientStorage.getSessionStorage("techcheck_state") === "passed" ? CASE.tckPassed : CASE.tckNoPass;
			if (status === STATUS_START_STARTED) {
				me.html(tClassStatus, subCase.OPEN);
			}
			else {
				me.html(tClassStatus, subCase.CLOSED);
			}
		}
	});
});
