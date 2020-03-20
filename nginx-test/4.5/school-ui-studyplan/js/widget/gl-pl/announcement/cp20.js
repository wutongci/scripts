define(["./main",
    "jquery",
    "../credit/service"
], function(AnnouncementBase, $, Credit) {
    'use strict';

    var CMS_ANNOUNCEMENT = "cms!School#EVC#studyPlanAnnouncement#PL_";

    return AnnouncementBase.extend({
        "sig/start": function() {
            // Check Announcement
            var me = this;
            new Credit().get("PL").then(function(dataCredit) {
                if (!dataCredit) {
                    return;
                }
                var courseInfo = dataCredit.courseInfo;
                var level = courseInfo.academicLevel;
                me.publish("query", [CMS_ANNOUNCEMENT + level]).spread(function(data) {
                    if (data.content) {
                        me.render(data.content);
                    } else {
                        me.publish("studyplan/evc/cp20/announcement/disable");
                    }
                });
            });
        }
    });
});
