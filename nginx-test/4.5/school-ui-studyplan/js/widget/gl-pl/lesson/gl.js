define(["jquery",
    "./main",
    "../grouplesson/service"
], function($, LessonBase, LessonService) {
    "use strict";

    var STATUS_NEVERTAKE = "nevertake";
    var STATUS_DROPOUT = "dropout";
    var STATUS_PENDING = "pending";
    var STATUS_ATTENDED = "attended";

    return LessonBase.extend({
        "hub/studyplan/evc/gl/status": function(status) {
            var me = this;
            if (!status || !status.statusCode || !status.unitId) {
                return;
            }
            var statusCode = status.statusCode;
            var unitId = status.unitId;
            var renderData = {};
            var lessonInfo;
            var teacherId;

            // Set Default value
            renderData.changeTopicTitle = false;

            // The student entered into the GL
            if (statusCode === STATUS_PENDING || statusCode === STATUS_ATTENDED) {
                if (!status.topic) {
                    return;
                }

                lessonInfo = status.topic;
                teacherId = status.teacherId;

                renderData.lessonInfo = lessonInfo;

                // Change topic title from "Next Class" to "Class Topic"
                renderData.changeTopicTitle = true;

                if(teacherId){
                    // Load teacher profile
                    me.publish("query", ["teacherprofile!" + teacherId]).spread(function(dataProfile) {
                        if (!dataProfile) {
                            return;
                        }
                        renderData.profile = {
                            "imageUrl": dataProfile.imageUrl,
                            "link": dataProfile.pageUrl,
                            "nickname": dataProfile.displayName
                        };
                        // Render
                        me.render(renderData);
                    });
                }
                else{
                    // Render
                    me.render(renderData);
                }

            } else {
                // Load Current GL
                new LessonService(unitId).get().then(function(dataLesson) {
                    if (!dataLesson || !dataLesson.lessonInfo) {
                        return;
                    }
                    renderData.lessonInfo = dataLesson.lessonInfo;
                    // Render
                    me.render(renderData);

					// Publish topic ID for omniture enter class tracking
					me.publish("studyplan/evc/gl/topicId", dataLesson.topicId);
                });
            }
        }
    });
});
