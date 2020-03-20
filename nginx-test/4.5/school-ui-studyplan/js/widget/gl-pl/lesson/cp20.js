define(["jquery",
    "./main",
    "template!./index.html"
], function($, LessonBase, template) {
    "use strict";

    var STATUS_NEVERTAKE = "nevertake";
    var STATUS_BOOKED = "booked";
    var STATUS_DROPOUT = "dropout";
    var STATUS_PENDING = "pending";
    var STATUS_ATTENDED = "attended";

    return LessonBase.extend({
        "hub/studyplan/evc/cp20/status": function(lesson) {
            var me = this;

            if (!lesson) {
                return;
            }

            var status = lesson.status;
            var statusCode = status.statusCode;
            var teacherId = "";
            var renderData = {};

            renderData.lessonInfo = lesson.lessonInfo;
            renderData.changeTopicTitle = false;

            if (statusCode === STATUS_ATTENDED || statusCode === STATUS_PENDING) {
                if (!lesson.feedback) {
                    return;
                }
                teacherId = lesson.feedback.teacherId;
                renderData.changeTopicTitle = true;

            } else if (statusCode === STATUS_BOOKED) {
                if (!lesson.bookedClass) {
                    return;
                }
                teacherId = lesson.bookedClass.teacherId;
            }

            // Show the teacher profile when student booked the class
            if (teacherId && teacherId > 0) {
                // Load teacher profile
                me.publish("query", ["teacherprofile!" + teacherId]).spread(function(dataProfile) {
                    if (!dataProfile) {
                        return;
                    }
                    // Append to template data
                    renderData.profile = {
                        "imageUrl": dataProfile.imageUrl,
                        "link": "",   //dataProfile.pageUrl not work for some partners, see SPC-5951
                        "nickname": dataProfile.displayName
                    };
                    // Render
                    me.render(renderData);
                });
            } else {
                me.render(renderData);
            }
        }
    });
});
