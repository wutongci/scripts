define(["jquery",
    "./main",
    "school-ui-studyplan/module"
], function($, FeedbackBase, module) {
    "use strict";

    // Use () because it doesn't need URI encoding
    var FEEDBACK_ID_PLACEHOLDER = '(FEEDBACK_ID)';

    var CP20 = 'detail/cp20';

	var MODULE_CONFIG = $.extend(true, {
		progressReportUrl: "/school/progressreport",
		teacherFeedbackHash: "#teacher-feedback?fb_id=EVC_" + FEEDBACK_ID_PLACEHOLDER,
	}, module.config() || {});

    return FeedbackBase.extend({
        "hub:memory/studyplan/evc/cp20/status": function(lesson) {
            var me = this;

            if (!lesson || !lesson.feedback || !lesson.customizedStartTime) {
                return;
            }

            var feedback = lesson.feedback;
            var customizedStartTime = lesson.customizedStartTime;
            var year = customizedStartTime.year;
            var month = customizedStartTime.month;
            var day = customizedStartTime.day;

            var url = MODULE_CONFIG.progressGoals + CP20;
            // Render
            me.render({
                url: url,
                year: year,
                month: month,
                day: day
            });
        }
    });
});
