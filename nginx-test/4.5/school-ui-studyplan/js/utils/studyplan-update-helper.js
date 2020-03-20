define([
	"school-ui-shared/utils/update-command"
], function UpdateHelperUtilModule(UpdateCommand) {
	"use strict";

	var API_STUDYPLAN_CTEATE = "campusstudyplan/campus_student_unit_studyplan/CreateStudyPlan";
	var API_STUDYPLAN_RESTART = "campusstudyplan/campus_student_unit_studyplan/RestartCurrentStudyPlan";

	return {
		createStudyplan: function onCreateStudyplan(data) {
			return UpdateCommand.update(API_STUDYPLAN_CTEATE, data);
		},
		restartStudyplan: function onCancelStudyplan(data) {
			return UpdateCommand.update(API_STUDYPLAN_RESTART, data);
		}
	};
});
