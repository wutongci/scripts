define([
	"jquery",
	"poly",
	"when",
	"underscore",
	"quill",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-progress-report/service/hash",
	"school-ui-shared/enum/course-type",
	"school-ui-progress-report/enum/feedback-typecode",
	"school-ui-progress-report/utils/feedback-category",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/utils/console",
	"template!./main.html"
], function (
	$,
	poly,
	when,
	_,
	Quill,
	Widget,
	loom,
	weave,
	hashService,
	courseType,
	fbType,
	fbCategoryUtil,
	Parser,
	Console,
	tMain
) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_PR_NAV = "ets-pr-navigation",
		CLS_PR_CON = "ets-pr-container";

	var SEL_PR = ".ets-pr-main";

	var WIDGET_NAV = "school-ui-progress-report/widget/navigation/main",
		WIDGET_CON = "school-ui-progress-report/widget/container/main";

	function convertArchiveWritingItem(item) {
		//reserve troop object for later expanding (.teacher)
		var detail = item.detail || {};

		$.extend(true, item, {
			isArchive: true,
			feedback_id: item.studentCourseItemArchiveId || detail.feedback_id,
			startTime: item.submitDateTime || detail.startTime, //detail.startTime has lower priority
			grade: detail.grade || item.grade,
			teacher: detail.teacher,
			title: item.topic || "",
			detail: {
				startTime: item.submitDateTime || detail.startTime, //detail.startTime has lower priority
				topic: item.topic || "",
				grade: detail.grade || item.grade,
				comment: detail.comment || "",
				correction: detail.correction || "",
				correctedTime: detail.correctedTime || ""
			}
		});

		return item;
	}

	function isLegacyEvc() {
		var me = this;
		return me.query("member_site_setting!'school;student.evc.version'").spread(function (setting) {
			return !setting || !setting.value || parseFloat(setting.value) < 2;
		});
	}

	function queryArchiveWritingFeedbacks() {
		var me = this;
		return me.query('student_archive_writing!*.items.detail')
		.spread(function (list) {
			return list.items.map(convertArchiveWritingItem);
		});
	}

	function queryLegacyFeedbacks() {
		var me = this;
		return me.query("student_feedback_list!current").spread(function (list) {
			return list.items;
		});
	}

	function queryIntegrationFeedbacks() {
		var me = this;
		return me.query("integration_student_feedback_list!current").spread(function (list) {
			// Adding a property 'feedback_id'
			// to make the items be compatible with the old feedback service
			list.items.forEach(function (item) {
				if (!item.feedback_id) {
					item.feedback_id = item.feedbackId;
				}
			});
			return list.items;
		});
	}

	function filterFeedbacks(feedbacks, types) {
		return feedbacks.filter(function (feedback) {
			return types.indexOf(feedback.typeCode) > -1;
		});
	}

	function appendWidget(data) {
		var me = this;

		var $nav = $("<div>").attr(loom.weave, WIDGET_NAV).data("assets", $.extend({}, data)).addClass(CLS_PR_NAV);
		var $con = $("<div>").attr(loom.weave, WIDGET_CON).data("assets", $.extend({}, data)).addClass(CLS_PR_CON);

		me[$ELEMENT].find(SEL_PR).empty().append($nav).append($con);
		return me.weave();
	}

	function hookArchiveCourseLevel(courses, archiveCourseName, archiveCourse) {
		archiveCourse && courses.forEach(function (course) {
			if (course.courseTypeCode === archiveCourse.courseTypeCode) {
				if (!course.archiveId) {
					course.archiveId = {};
				}
				course.archiveId[archiveCourseName] = archiveCourse.id;

				course.children.forEach(function (level) {
					if (!level.archiveId) {
						level.archiveId = {};
					}
					var archiveLevel = _.find(archiveCourse.children, function (archiveLevel) {
						return level.levelNo === archiveLevel.levelNo
					});
					if (archiveLevel) {
						level.archiveId[archiveCourseName] = archiveLevel.id;
					}
				});
			}
		});
	}

	function initQuill() {
		var SizeStyleModule = Quill.import("attributors/style/size");
		SizeStyleModule.whitelist = null; // disable size whitelisting
		Quill.register(SizeStyleModule, true);
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			initQuill();

			var widgetData = {};

			return me.html(tMain)
				.then(function () {
					// Split in multiple functions, let troop optimize and merge requests
					return when.all([
						me.loadEnrollableCourse(widgetData),
						me.loadCurrentEnrollment(widgetData),
						me.loadFeedbackList(widgetData),
						me.loadTestResults(widgetData)
					]);
				})
				.then(function () {
					return appendWidget.call(me, widgetData);
				})
				.then(function () {
					hashService().start();
				});
		},

		"loadEnrollableCourse": function (widgetData) {
			var me = this;

			/*
			archive type id description from database:
			SELECT * FROM School_0.dbo.StudentCourseItemArchiveTagType_lkp
			SELECT * FROM School_0.dbo.StudentCourseItemArchiveType_lkp
			*/
			return me.query([
				"student_enrollable_courses!*.items.children.progress",
				"student_course_archive!1;1;GE.children",
				"student_course_archive!2;7;GE.children",
				"student_course_archive!2;8;BE.children"
			]).spread(function (enrollableCourses, archiveE10GECourse, archiveE13GECourse, archiveE13BECourse) {
				//hook legacy course data (BEFORE level number mapping)
				hookArchiveCourseLevel(enrollableCourses.items, 'e10', archiveE10GECourse);
				hookArchiveCourseLevel(enrollableCourses.items, 'e13', archiveE13GECourse);
				hookArchiveCourseLevel(enrollableCourses.items, 'e13', archiveE13BECourse);

				//hook enrollment information
				var courseEnrollQ = [];
				enrollableCourses.items.forEach(function (course) {
					if (!course.isTemplate && course.studentCourseId) {
						courseEnrollQ.push("student_course_enrollment!" + course.studentCourseId)
					}
				});
				return me.query(courseEnrollQ).spread(function () {
					$.each(arguments, function (index, courseEnroll) {
						var courseEnrollId = Parser.parseId(courseEnroll.id);

						enrollableCourses.items.forEach(function (course) {
							if (course.studentCourseId === courseEnrollId) {
								course.currentEnroll = courseEnroll;
							}
						});
					});
					widgetData.enrollable_course = $.extend({}, enrollableCourses);
				});
			});
		},

		"loadCurrentEnrollment": function (widgetData) {
			var me = this;
			return me.query("student_course_enrollment!current")
				.spread(function (current_enroll) {
					widgetData.current_enroll = $.extend({}, current_enroll);
				});
		},

		"loadFeedbackList": function (widgetData) {
			var me = this;
			var queries = [
				queryArchiveWritingFeedbacks.call(me),
				queryIntegrationFeedbacks.call(me)
			];
			return isLegacyEvc.call(me).then(function(isLegacy){
				if(isLegacy){
					queries.push(queryLegacyFeedbacks.call(me));
				}
				return when.all(queries).spread(function (archiveWritingFeedbacks, integrationFeedbacks, legacyFeedbacks) {
					if(legacyFeedbacks){
						widgetData.feedbacks = [].concat(
							archiveWritingFeedbacks,
							filterFeedbacks(integrationFeedbacks, [fbType.writing]),
							filterFeedbacks(legacyFeedbacks, [fbType.gl, fbType.pl, fbType.cp20, fbType.eftv, fbType.osa])
						);
					} else {
						widgetData.feedbacks = [].concat(
							archiveWritingFeedbacks,
							integrationFeedbacks
						);
					}
					widgetData.feedbacks.forEach(function (feedback) {
						feedback.categoryCode = fbCategoryUtil.getCategoryCode(feedback.typeCode);
					});
					widgetData.feedbacks.sort(function (itemA, itemB) {
						return itemB.startTime - itemA.startTime; // sort by startTime descending
					});
				});
			});
		},

		"loadTestResults": function (widgetData) {
			var me = this;
			return me.publish("school/interface/progress-report/test-results-widget", "").then(function (widgetPath) {
				//widgetPath can be "some/widget/path" or ["some/widget/path"]
				widgetData.test_results_widget = String(widgetPath);
			});
		},

		"hub:memory/school/spinner": function showSpinner(promise) {
			var me = this;

			me.task(function (resolve, reject, progress) {
				return promise
					.then(resolve, reject, progress);
			});
		}
	});
});
