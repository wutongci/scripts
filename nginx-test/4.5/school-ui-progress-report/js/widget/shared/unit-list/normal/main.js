define([
	"jquery",
	"when",
	"underscore",
	"../base",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/utils/progress-state"
], function ($, when, _, BaseWidget, typeidParser, progressState) {
	"use strict";

	var CONTEXT = "_context";
	var PAGE = "_page";
	var LEVEL = "_level";

	var LINK_TYPE_E13 = "e13";
	var LINK_TYPE_STUDYPLAN = "studyplan";
	var CCL_LESSON_LINK_TYPE = "ccl!'school.ui.progress.report.lesson.link.type'";

	function setActualLessonId(mergedLesson) {
		var progress = mergedLesson.progress;
		var progressItems = progress.detail.items;
		if (progressItems.length === 1) {
			mergedLesson.actualLessonId = 'student_lesson!' + progressItems[0].sourceProgressId;
		}
		else if (progressState.notStarted(progress.state)) {    //not started
			mergedLesson.actualLessonId = mergedLesson.id
		}
		else if (!progressState.hasPassed(progress.state)) {    //in progress
			var actualLessonProgress = progressItems.reduce(function (prev, curr) {
				return prev.startDate <= curr.startDate ? prev : curr;
			});
			mergedLesson.actualLessonId = 'student_lesson!' + actualLessonProgress.sourceProgressId;
		}
		else {  //finished
			var finishedLessonProgress = progressItems.filter(function (item) {
				return progressState.hasPassed(item.state);
			});

			if (finishedLessonProgress.length === 1) {
				actualLessonProgress = finishedLessonProgress[0];
			}
			else {
				actualLessonProgress = finishedLessonProgress.reduce(function (prev, curr) {
					return prev.completionDate <= curr.completionDate ? prev : curr;
				});
			}
			mergedLesson.actualLessonId = 'student_lesson!' + actualLessonProgress.sourceProgressId;
		}

		return mergedLesson.actualLessonId;
	}


	function getE13LessonLinks(level) {
		var me = this;
		var links = {};
		var course = level.parent;
		var units = level.children;
		var lessonMapPromises = [];

		units.filter(function (unit) {
			return !progressState.notStarted(unit.progress.state);
		}).forEach(function (unit) {
			unit.children.forEach(function (lesson) {
				lessonMapPromises.push(me.query("pc_student_lesson_map!" + lesson.templateLessonId).spread(function (lessonMap) {
					//url format: /school/studyunit#school/{studentCourseId}/{studentCourseId}/{studentLevelId}/{studentUnitId}/{pc-studentLessonId}
					var url = "/school/studyunit#school" +
						"/" + course.studentCourseId +
						"/" + course.studentCourseId +
						"/" + level.studentLevelId +
						"/" + unit.studentUnitId +
						"/" + typeidParser.parseId(lessonMap.lesson.id);
					links[lesson.studentLessonId] = url;
				}));
			});
		});

		return when.all(lessonMapPromises).then(function () {
			return links;
		});
	}

	function getStudyplanLessonLinks(level) {
		var me = this;
		var links = {};
		var units = level.children;

		var studyplansQ = units.filter(function (unit) {
			return !progressState.notStarted(unit.progress.state);
		}).map(function (unit) {
			return "student_unit_studyplan!" + unit.templateUnitId + ".studyPlan.items,.studentUnit";
		});
		return me.query(studyplansQ).then(function (unitStudyplans) {
			unitStudyplans && unitStudyplans.forEach(function (unitStudyplan) {
				var unit = unitStudyplan.studentUnit;
				var studyplan = unitStudyplan.studyPlan;

				unit.children.forEach(function (lesson) {
					var studyplanId = typeidParser.parseId(studyplan.id);
					var studyplanItemId = typeidParser.parseId(studyplan.items.filter(function (studyplanItem) {
						return studyplanItem.properties.templateLessonId === lesson.templateLessonId;
					})[0].id);

					//url format: /school/studyplan#study/{studyplannId}/{studyplanItemId}
					var url = "/school/studyplan#study" +
						"/" + studyplanId +
						"/" + studyplanItemId;
					links[lesson.studentLessonId] = url;
				});
			});

			return links;
		});
	}

	function getLessonLinks(level) {
		/* expected returned structure:
		{
			"lessonid_1_of_unit_1": "link url",
			"lessonid_2_of_unit_1": "link url",
			"lessonid_3_of_unit_1": "link url",
			"lessonid_4_of_unit_1": "link url",

			"lessonid_1_of_unit_2": "link url",
			"lessonid_2_of_unit_2": "link url",
			"lessonid_3_of_unit_2": "link url",
			"lessonid_4_of_unit_2": "link url"
		 }
		*/
		var me = this;
		return me.query(CCL_LESSON_LINK_TYPE).spread(function (cclLessonLinkType) {
			if (cclLessonLinkType.value === LINK_TYPE_E13) {
				return getE13LessonLinks.call(me, level);
			}
			else if (cclLessonLinkType.value === LINK_TYPE_STUDYPLAN) {
				return getStudyplanLessonLinks.call(me, level);
			}
			else {
				return {};
			}
		});
	}

	function hookArchiveUnit(units, archiveUnits) {
		archiveUnits && units.forEach(function (unit) {
			var archiveUnit = _.find(archiveUnits, function (archiveUnit) {
				return unit.unitNo === archiveUnit.unitNo
			});
			if (archiveUnit) {
				archiveUnit.children && archiveUnit.children.length && archiveUnit.children.sort(function (prevLesson, currLesson) {
					return prevLesson.lessonNo - currLesson.lessonNo;
				});
				unit.archiveUnit = archiveUnit;
			}
		});
	}

	return BaseWidget.extend({
		"hub:memory/context": function (context) {
			var me = this;
			me.render(me[CONTEXT] = context, me[LEVEL]);
		},
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;
			if (me[PAGE] === page) {
				var level = $.extend({}, data.level);
				level.children = $.extend([], level.children);

				var archiveLevel = data.archiveLevel && data.archiveLevel.e13;
				hookArchiveUnit(level.children, archiveLevel && archiveLevel.children);

				var actualLessonQueries = [];

				level.children.forEach(function (unit) {
					for (var lessonIndex = 0; lessonIndex < unit.children.length; lessonIndex++) {
						unit.children[lessonIndex] = $.extend({}, unit.children[lessonIndex]);
						var actualLessonId = setActualLessonId(unit.children[lessonIndex]);
						actualLessonId && actualLessonQueries.push(actualLessonId);
					}
				});

				var actualLessonQueriesPromise = actualLessonQueries.length ?
					me.query(actualLessonQueries) :
					when.resolve([]);

				when.all([
					actualLessonQueriesPromise,
					getLessonLinks.call(me, level)
				]).spread(function (actualLessons, lessonLinks) {
					level.children.forEach(function (unit) {
						unit.children.forEach(function (lesson) {
							//attach actualLesson Object
							if (lesson.actualLessonId) {
								lesson.actualLesson = actualLessons.filter(function (actualLesson) {
									return actualLesson.id === lesson.actualLessonId;
								});
								if (lesson.actualLesson.length) {
									lesson.actualLesson = lesson.actualLesson[0];
								}
							}

							//attach lesson link
							var lessonLink = lessonLinks[lesson.studentLessonId];
							if (lessonLink) {
								lesson.lessonLink = lessonLink;
							}
						});
					});

					me.render(me[CONTEXT], me[LEVEL] = level);
				});

			}
		}
	});
});
