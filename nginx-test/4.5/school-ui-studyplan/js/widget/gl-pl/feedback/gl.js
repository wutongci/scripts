define(["jquery",
    "./main",
    "school-ui-studyplan/module"
], function($, FeedbackBase, module) {
    "use strict";

	// Use () because it doesn't need URI encoding
	var FEEDBACK_ID_PLACEHOLDER = '(FEEDBACK_ID)';
    var GL = 'detail/gl';

	var MODULE_CONFIG = $.extend(true, {
		progressReportUrl: "/school/progressreport",
		teacherFeedbackHash: "#teacher-feedback?fb_id=EVC_" + FEEDBACK_ID_PLACEHOLDER,
	}, module.config() || {});

	return FeedbackBase.extend({
        "hub:memory/studyplan/evc/gl/status": function(status) {
            var me = this;

            if(!status || !status.feedback){
                return;
            }
            var feedback = status.feedback;
            var customizedEntryDate = feedback.customizedEntryDate;

	        var url = MODULE_CONFIG.progressGoals + GL;
            var year = customizedEntryDate.year;
            var month = customizedEntryDate.month;
            var day = customizedEntryDate.day;

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
