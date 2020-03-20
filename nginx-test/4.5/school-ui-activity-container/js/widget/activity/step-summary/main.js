define([
	"jquery",
	"troopjs-ef/component/widget",
	"when",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"template!./step-summary.html",
	"poly/array",
	"poly/object"
], function StepSummaryModule($, Widget, when, progressState, parser, tStepSum) {
	"use strict";
	var $ELE = "$element",

		SEL_STEP_PASSED = "ets-ui-acc-step-status-pass",
		SEL_STEP_FAIL = "ets-ui-acc-step-status-fail",

		PROP_ID = "id",
		PROP_NOT_PASSED = "numNotPassed",
		PROP_HAS_PASSED = "hasPassed",
		PROP_PROGRESS = "pros",
		PROP_ACT_PROGRESS = "actPros",
		PROP_STEP = "step",

		IS_LAST_STEP = "isLastStep",
		IS_LESSON_PERFECT = "isLessonPerfect",
		IS_STEP_PERFECT = "isStepPerfect",
		IS_LESSON_PASSED = "isLessonPassed",

		PERFECT_SCORE = 100,
		PASS_RATE = 0.6;


	function onRender(step){
		var me = this;

		if(!step) {
			return;
		}

		return me.query(step.id + ".progress,.parent.progress,.parent.children,.children.progress").spread(function (step) {

			var ite = 0, //stat how many acts not passed in current step
				perfectScore = PERFECT_SCORE,
				actPros = [],
				isPassed,
				isLessonPerfect = true,
				stepLen,
				noop = {state: 0, children: []},
				stepId = step.id,
				steps = step.parent.children,
				lessonPros,
				passRate = PASS_RATE;

			// Is the last step of current lesson or not
			step[IS_LAST_STEP] = steps[steps.length - 1][PROP_ID] === stepId;


			// fetch current lesson progresses
			lessonPros = $.extend({}, noop, step.parent.progress);

			// for the step summary of the last step in current lesson
			step[IS_LESSON_PASSED] = progressState.hasPassed(lessonPros.state);

			// if scores of all steps in current lesson get to max score, this lesson has passed perfectly.
			steps.every(function (steps) {
				if (steps.progress.score && steps.progress.score < perfectScore) {
					isLessonPerfect = false;
					return false;
				}
				else {
					return true;
				}
			});

			// pass of fail layout showing
			me[$ELE]
				.removeClass(SEL_STEP_PASSED + " " + SEL_STEP_FAIL)
				.addClass(
					(step[PROP_HAS_PASSED] = progressState.hasPassed(step.progress.state))
						? SEL_STEP_PASSED
						: SEL_STEP_FAIL
				);

			//cached data
			stepLen = (step.children || []).length;
			if (stepLen) {
				step.children.forEach(function(act){
					if (!(isPassed = progressState.hasPassed(act.progress.state))) {
						ite++;
					}
					actPros.push(isPassed);
				});

				/*
				 Why do we use PassRate at frontend code?
				 Because we need to calculate how much activities does user finish,
				 and backend just send back state of step, frontend only know is this step pass or not.
				*/
				step[PROP_PROGRESS] = Math.floor((stepLen - ite) / stepLen * 100);
				step[PROP_NOT_PASSED] = Math.ceil(stepLen * passRate) - (stepLen - ite);
			} else {
				step[PROP_NOT_PASSED] = Math.ceil(step.children.length * passRate);
				step[PROP_PROGRESS] = step.children.length;
				isLessonPerfect = false;
			}

			step[IS_LESSON_PERFECT] = isLessonPerfect;

			//If there is no act progress,we need to build it
			if (!actPros.length) {
				stepLen = step.children.length;
				while (stepLen--) {
					actPros.push(0);
				}
			}

			step[PROP_ACT_PROGRESS] = actPros;
			step[IS_STEP_PERFECT] = step[PROP_PROGRESS] === 100;
			return me.html(tStepSum, step);
		});
	}

	return Widget.extend({
		"hub:memory/load/step": function onStep(step) {
			var me = this;
			if(step){
				onRender.call(me, me[PROP_STEP] = step);
			}
		},

		"hub/activity/update/progress" : function(){
			var me = this;
			onRender.call(me, me[PROP_STEP]);
		},

		"dom:[data-action=close]/click": function(){
			var me = this;
			me.publish("activity-container/close");
		},

		"dom:[data-action=tryagain]/click": function(){
			var me = this;
			me.publish("activity-container/tryAgain");
		},

		"dom:[data-action=nextstep]/click": function(){
			var me = this;
			me.publish("activity-container/nextStep");
		}
	});
});
