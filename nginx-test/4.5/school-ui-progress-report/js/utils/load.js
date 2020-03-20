define([
	"when",
	"client-tracking",
	"school-ui-shared/enum/course-type",
	"troopjs-ef/component/gadget"
], function (when, ct, courseType, Gadget) {
	"use strict";

	var UNDEF;

	function tracking(level) {
		var me = this;
		var pagename;
		if (courseType.isGECourse(level.parent.courseTypeCode)) {
			pagename = "ProgressReport:GE:Level" + level.levelNo;
			me.publish("tracking/pagename", "ge", pagename);
		} else if (courseType.isSpinCourse(level.parent.courseTypeCode)) {
			pagename = "ProgressReport:SPIN:" + level.parent.courseTypeCode + ":" + level.templateLevelId;
			me.publish("tracking/pagename", "spin", pagename);
		}

		ct.pagename(pagename);
	}

	return Gadget.create({
		loadLevel: function (page, levelId, archiveLevelId) {
			var me = this;
			var promise = me.query([
				levelId + ".children.progress,.children.children.progress.detail,.levelTest.progress",
				archiveLevelId && archiveLevelId.e10 && archiveLevelId.e10 + ".children.progress,.children.children.progress.detail",
				archiveLevelId && archiveLevelId.e13 && archiveLevelId.e13 + ".children.progress,.children.children.progress.detail"
			]).spread(function (level, archiveE10Level, archiveE13Level) {
				me.publish("load/level", page, {
					level: level,
					archiveLevel: {
						e10: archiveE10Level,
						e13: archiveE13Level
					}
				});

				tracking.call(me, level);
			});

			me.publish("school/spinner", promise);
		}
	});
});
