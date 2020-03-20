define([
		"school-ui-studyplan/module",
		"jquery",
		"when",
		"school-ui-shared/utils/ccl",
		"troopjs-browser/loom/config",
		"troopjs-ef/component/widget",
		"template!./course.html"
	],
	function(module, $, When, CCL, LoomConfig, Widget, tCourse) {
		"use strict";

		var CCL_ENABLE_CHANGECOURSE = "ccl!\"school.menu.changecourse.display\"";
		var CCL_ENABLE_SHOW_COURSE_NAME = "ccl!\"school.courseware.showCourseName.enable\"";
		var CCL_CHANGE_COURSE_LINK = "ccl!\"school.studyplan.changeCourse.link\"";
		var MEMBER_SETTING_CHANGE_COURSE_ENABLE = 'member_site_setting!"CampusCore;Campus.ChangeCourse.Enable"';

		var UNDEF;
		var $ELEMENT = "$element";
		var SEL_CHC_WIDGET = ".ets-sp-chc-widget";
		var SEL_UNIT_HEADER=".ets-sp-unit-hd";
		var SEL_UNIT_NAV=".ets-sp-unn";

		var MODULE_CONFIG = $.extend({
			changeCourseUrl: undefined
		}, module.config() || {});

		function render(course, level, unit) {
			var me = this;
			if(!course || !level || !unit) return;

			return me.query(
					CCL_ENABLE_CHANGECOURSE,
					CCL_ENABLE_SHOW_COURSE_NAME,
					CCL_CHANGE_COURSE_LINK,
					MEMBER_SETTING_CHANGE_COURSE_ENABLE
				).spread(function(enableChangeCourse, enableShowCourseName, changeCourseLink, memberChangeCourseEnable){
				return me.html(tCourse, {
						courseName: course.courseName,
						levelName: level.levelName,
						enableChangeCourse: CCL.indicateCCLStringValue(memberChangeCourseEnable) || CCL.indicateCCLStringValue(enableChangeCourse),
						enableShowCourseName: CCL.indicateCCLStringValue(enableShowCourseName),
						changeCourseLink: MODULE_CONFIG.changeCourseUrl || changeCourseLink.value
				}).then(function () {
					var $widget = me[$ELEMENT].find(SEL_CHC_WIDGET);
					var requiredWidth = $widget[0].scrollWidth;
					$widget.width(requiredWidth);
					me[$ELEMENT].closest(SEL_UNIT_HEADER).find(SEL_UNIT_NAV).css("padding-left", requiredWidth);
				});
			});
		}

		return Widget.extend({
			"hub:memory/load/results": function(data) {
				var me =  this;

				if( me.course === data.course
					&& me.level === data.level
					&& me.unit === data.unit) {
					return;
				}

				render.call(me, (me.course = data.course), (me.level = data.level), (me.unit = data.unit));
			},

			"dom:[data-action='switch']/click": function() {
				this.publish("toggle/course/list");
			}
		});
	});
