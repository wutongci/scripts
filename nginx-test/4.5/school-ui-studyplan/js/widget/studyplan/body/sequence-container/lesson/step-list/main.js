define([
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"template!./step-list.html",
	"poly"
],function($, Widget, progressState, Parser, tStepList){
	"use strict";

	var $ELEMENT = "$element";

	var HAS_PASSED = "_hasPassed",
		HAS_STARTED = "_hasStarted",
		SHOW_BUTTON = "_showButton",
		HAS_CONTINUE = "_hasContinue";

	function doRender(lesson){
		var me = this;

		if(!lesson) {
			return;
		}

		var lessonId = lesson.id;

		return me.query(lessonId + ".children.progress").spread(function(lesson) {
			var steps = lesson.children;

			steps.every(function(e, i) {
				if(!progressState.hasPassed(e.progress.state)) {
					e[SHOW_BUTTON] = true;
					return false;
				}
				else {
					return true;
				}
			});

			steps.forEach(function(e, i) {
				if(progressState.hasStarted(e.progress.state)) {
					e[SHOW_BUTTON] = true;
					e[HAS_CONTINUE] = true;
				}
			});

			return me.html(tStepList, {
				steps: steps,
				physicalLesson: me["physicalLessonId"]
			});
		});
	}

	return Widget.extend(function(){
		var me = this;
		me["physicalLessonId"] = me[$ELEMENT].data("physical-lesson-id");
	},{
		"hub:memory/load/lesson": function onLesson(lesson) {
			var me = this;

			if(!lesson) {
				return;
			}

			doRender.call(me, me.lesson = lesson);
		}
	});
});
