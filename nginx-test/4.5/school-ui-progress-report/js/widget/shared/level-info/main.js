define([
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/enum/course-type",
	"template!./level-info.html"
], function (Widget, progressState, courseType, tLevelInfo) {
	"use strict";

	var PAGE = "_page";
	var STUDENT_ARCHIVE_CERT = "_student_archive_certificate";

	function hasLevelCertificate(level, studentCert) {
		return studentCert.items.reduce(function (prev, certItem) {
			return prev || (certItem.studentLevelId && certItem.studentLevelId === level.studentLevelId);
		}, false);
	}

	function canShowCertificate(currentLevel, studentCert, studentArchiveCert) {
		if (courseType.isGECourse(currentLevel.parent.courseTypeCode)) {
			return hasLevelCertificate(currentLevel, studentCert);
		}
		else {
			return hasLevelCertificate(currentLevel, studentCert) || studentArchiveCert.items.length;
		}
	}

	function getCompletedLessonCount(level) {
		var completedLessons = 0;
		level.children.forEach(function (unit) {
			unit.children.forEach(function (lesson) {
				progressState.hasPassed(lesson.progress.state) && completedLessons++;
			});
		});
		return completedLessons;
	}

	function getTotalLessonCount(level) {
		var totalLessons = 0;
		level.children.forEach(function (unit) {
			totalLessons += unit.children.length;
		});
		return totalLessons;
	}

	function initBlurb() {
		return {
			singleLessonLeft: {
				id: 669819,
				en: "^uncompleted^ lesson left of ^total^"
			},
			multiLessonsLeft: {
				id: 669818,
				en: "^uncompleted^ lessons left of ^total^"
			}
		};
	}

	return Widget.extend(function (path, $element, page) {
		var me = this;
		me[PAGE] = page;
	}, {
		"sig/start": function () {
			var me = this;
			return me.query("student_archive_certificate!*").spread(function (studentArchiveCert) {
				me[STUDENT_ARCHIVE_CERT] = studentArchiveCert;
			});
		},
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;
			if (me[PAGE] === page) {
				var level = data.level;

				var completedLessons = getCompletedLessonCount(level);
				var totalLessons = getTotalLessonCount(level);
				var unCompletedLessons = totalLessons - completedLessons;

				var blurbs = initBlurb();
				var blurbLessonsLeft = "blurb!" + (unCompletedLessons <= 1 ? blurbs.singleLessonLeft.id : blurbs.multiLessonsLeft.id);
				me.query([
					blurbLessonsLeft,
					"student_certificate!" + level.studentLevelId
				]).spread(function (blurbLessonsLeftResult, studentCert) {
					var lessonsLeft = blurbLessonsLeftResult.translation || blurbLessonsLeft.en;
					lessonsLeft = lessonsLeft.replace("^uncompleted^", "<span>" + unCompletedLessons + "</span>");
					lessonsLeft = lessonsLeft.replace("^total^", totalLessons);

					me.html(tLevelInfo, {
						page: page,
						level: level,
						hasLevelCertificate: hasLevelCertificate(level, studentCert),
						canShowCertificate: canShowCertificate(level, studentCert, me[STUDENT_ARCHIVE_CERT]),
						lessonsLeft: lessonsLeft,
						unCompletedLessons: unCompletedLessons,
						totalLessons: totalLessons
					});
				});
			}
		}
	});
});
