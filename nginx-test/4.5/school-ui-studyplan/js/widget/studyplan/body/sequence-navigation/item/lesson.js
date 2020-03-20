define([
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[ID] && me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-lesson";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				me[RENDER_DATA].topic = me.query("campus_student_studyplan_item!" + me[ID] + ".properties").spread(function (studyPlanItem) {
					return me.query("student_lesson!template_lesson;" + studyPlanItem.properties.templateLessonId);
				}).spread(function (studentLesson) {
					return studentLesson.lessonName;
				});
			}
		}
	})
});
