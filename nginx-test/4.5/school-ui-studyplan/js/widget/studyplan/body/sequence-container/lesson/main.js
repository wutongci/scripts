/**
 * A widget that contains a lesson
 *
 * @class lesson
 */
define([
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"jquery.gudstrap",
	"poly",
	"template!./lesson.html"
], function LessonModule($, Widget, progressState, Parser, $GUD, poly, tLesson) {
	"use strict";

	var $ELEMENT = "$element";

	var STUDYPLAN_ITEM = "_studyplan_item";
	var LESSON = "_lesson";

	var SEL_MOB_MODAL_STARTED = ".ets-mob-modal-started",
		SEL_MOB_MODAL_PASSED = ".ets-mob-modal-passed",
		SEL_MOB_MODAL = ".ets-mob-modal";

	/**
	 * Render the widget UI
	 *
	 * @api private
	 */
	function doRender(lesson) {
		var me = this;

		if (!lesson) {
			return;
		}

		var renderData = {
			lesson: lesson,
			physicalLesson: me[STUDYPLAN_ITEM].properties.templateLessonId,
			pcScore: 0,
			pcHasPassed: false,
			mobHasStarted: false,
			mobHasPassed: false
		};

		return me.query("student_lesson_progress!template_lesson;" + me[STUDYPLAN_ITEM].properties.templateLessonId + ".detail").spread(function (lessonDetail) {
			lessonDetail.detail.items.forEach(function (e, i) {
				switch (e.sourceTypeCode) {
					case "PCLesson":
						renderData.pcScore = e.score;
						renderData.pcHasPassed = progressState.hasPassed(e.state);
						break;

					case "MOBLesson":
						renderData.mobHasStarted = progressState.hasStarted(e.state);
						renderData.mobHasPassed = progressState.hasPassed(e.state);
						break;
				}
			});

			return me.html(tLesson, renderData);
		});
	}

	return Widget.extend(function($element, path, itemData){
		var me = this;
		me[STUDYPLAN_ITEM] = itemData;
	},{
		"hub:memory/load/lesson": function onLesson(lesson) {
			var me = this;

			if(lesson) {
				me.query("pc_student_lesson_map!" + me[STUDYPLAN_ITEM].properties.templateLessonId + ".lesson").spread(function(lessonMap){
					// make sure the widget listen from just correct lessonId
					if(lessonMap.lesson.templateLessonId === lesson.templateLessonId) {
						doRender.call(me, me[LESSON] = lesson);
					}
				});
			}

		},

		"hub/lesson/renderer": function onLessonRerender(){
			var me = this;

			doRender.call(me, me[LESSON]);
		},

		"hub/activity/update/progress": function () {
			var me = this;

			me.publish("lesson/renderer");
		},
		"dom:.ets-mob-tip-started/click": function () {
			var me = this;
			me[$ELEMENT].find(SEL_MOB_MODAL_STARTED).modal("show");
		},
		"dom:.ets-mob-tip-passed/click": function () {
			var me = this;
			me[$ELEMENT].find(SEL_MOB_MODAL_PASSED).modal("show");
		},
		"dom:.ets-btn-modal-close/click": function () {
			var me = this;
			me[$ELEMENT].find(SEL_MOB_MODAL).modal("hide");
		}
	});
});
