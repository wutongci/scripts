define([
	"jquery",
	"when",
	"poly",
	"client-tracking",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/course-type"
], function ($, when, poly, ct, Widget, courseType) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_NONE = "ets-none";
	var CLS_CONTAINER = "ets-pr-container";
	var CLS_CONTAINER_ITEM = "ets-pr-container-item";

	var COURSE = "enrollable_course";
	var ENROLL = "current_enroll";
	var FEEDBACKS= "feedbacks";
	var TEST_RESULTS_WIDGET = "test_results_widget";
	var DATA = "_data";
	var PAGENAME = "_pagename";

	function initContainer(tabName, initData) {
		var me = this;
		var widgetClass = CLS_CONTAINER + "-" + tabName;
		var $widget = me[$ELEMENT].find("." + widgetClass);
		if ($widget.length === 0) {
			$widget = $("<div/>", {
				"class": widgetClass + " " + CLS_CONTAINER_ITEM + " " + CLS_NONE,
				"data-weave": "school-ui-progress-report/widget/container/" + tabName + "/main(initData)"
			})
			.data("initData", initData)
			.appendTo(me[$ELEMENT]);

			switchContainer($widget);
			return $widget.weave();
		}
		else {
			switchContainer($widget);

			ct.pagename(me["_" + tabName + "_" + PAGENAME]);

			return when.resolve();
		}
	}

	function switchContainer($container) {
		$container.removeClass(CLS_NONE).siblings().addClass(CLS_NONE);
	}

	return Widget.extend(function(){
		var me = this;
		me[DATA] = me[$ELEMENT].data("assets");
	},{
		"hub:memory/navigate/to": function (uri) {
			var me = this;
			var tabName;

			switch (uri.path.toString()) {
				case "general-english":
					tabName = "ge";

					me[DATA][COURSE].items.forEach(function(entry, entryIndex){
						if(courseType.isGECourse(entry.courseTypeCode)) {
							initContainer.call(me, tabName, {
								"course": entry,
								"currentEnroll": me[DATA][ENROLL]
							});
						}
					});

					break;
        case "business-english":
          tabName = "be";
          var course_list = [];
          me[DATA][COURSE].items.forEach(function(entry, entryIndex){
            if(courseType.BusinessEnglish === entry.courseTypeCode) {
              course_list.push(entry);
            }
          });

          initContainer.call(me, tabName, {
            "course": course_list,
            "currentEnroll": me[DATA][ENROLL]
          });

          break;
        case "industry-english":
          tabName = "ind";
          var course_list = [];
          me[DATA][COURSE].items.forEach(function(entry, entryIndex){
            if(courseType.IndustryEnglish === entry.courseTypeCode) {
              course_list.push(entry);
            }
          });
          initContainer.call(me, tabName, {
            "course": course_list,
            "currentEnroll": me[DATA][ENROLL]
          });

          break;
				case "special-interest-courses":
					tabName = "spin";

					var course_list = [];
					me[DATA][COURSE].items.forEach(function(entry, entryIndex){
						if(courseType.isSpinCourse(entry.courseTypeCode)) {
							course_list.push(entry);
						}
					});

					initContainer.call(me, tabName, {
						"course": course_list,
						"currentEnroll": me[DATA][ENROLL]
					});

					break;
				case "teacher-feedback":
					tabName = "feedback";

					initContainer.call(me, tabName, {
						feedbacks: me[DATA][FEEDBACKS],
						"fb_id": uri.query && uri.query.fb_id
					}).then(function(){
						ct.pagename("ProgressReport:TeacherFeedback");
					});
					break;
				case "test-results":
					tabName = "test-results";

					initContainer.call(me, tabName, me[DATA][TEST_RESULTS_WIDGET]).then(function(){
						ct.pagename("ProgressReport:TestResults");
					});
					break;
			}

			return when.resolve();
		},

		"hub/tracking/pagename": function(courseType, pagename) {
			var me = this;
			me["_" + courseType + "_" + PAGENAME] = pagename;
		}
	});
});
