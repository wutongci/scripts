define([
	"jquery",
	"poly",
	"json2",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"template!./step.html"
],function($, Poly, JSON, Widget, progressState, Parser, tStep){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var $ELEMENT = "$element";

	function doRender(stepId){
		var me = this;

		if(!stepId) {
			return;
		}

		var stepQ = stepId + ".progress";
		var lessonQ = "student_lesson!template_lessson;" + me["physicalLessonId"] + ".parent.parent.parent";

		return me.query(stepQ, lessonQ).spread(function(step, lesson){

			step._hash = JSON.stringify({
				"prefix": "school",
				"enrollment": Parser.parseId(lesson.parent.parent.parent.studentCourseId),
				"course": Parser.parseId(lesson.parent.parent.parent.id),
				"level": Parser.parseId(lesson.parent.parent.id),
				"unit": Parser.parseId(lesson.parent.id),
				"lesson": Parser.parseId(step.parent.id),
				"step": Parser.parseId(step.id)
			});

			return me.html(tStep, {
				step: step,
				_showButton: !!(me["showButton"] == true),
				_hasContinue: !!(me["hasContinue"] == true),
				_isPerfect: !!(step.progress.score == 100),
				_hasPassed: progressState.hasPassed(step.progress.state)
			});
		});
	}

	return Widget.extend(function(){
		var me = this;
		me["stepId"] = me[$ELEMENT].data("id");
		me["showButton"] = me[$ELEMENT].data("show-button");
		me["hasContinue"] = me[$ELEMENT].data("has-continue");
		me["physicalLessonId"] = me[$ELEMENT].data("physical-lesson-id");
	},{
		"sig/start" : function(){
			var me = this;
			doRender.call(me, me.stepId);
		},

		"dom:.ets-sp-step/click": function routeStep(event) {
			var me = this,
				$step = $(event.currentTarget);

			me.publish("load", $.parseJSON($step.attr("data-hash")));

			return false;
		}
	});
});
