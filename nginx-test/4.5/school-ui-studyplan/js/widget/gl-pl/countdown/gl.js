define(["jquery",
    "when",
    "./main",
    "../grouplesson/service",
    "school-ui-studyplan/widget/gl-pl/countdown-scoreboard/main",
    "template!./index.html"
], function($, when, CountdownBase, LessonService, CountdownScoreboard, template) {
    "use strict";

    var STATUS_START_NOT_YET = "notyet";
    var STATUS_START_IN_COUNTDOWN = "incountdown";
    var STATUS_START_STARTED = "started";

    return CountdownBase.extend(function($element, name, unitId) {
        var me = this;
        me.unitId = unitId;
        me.creditDeferred = when.defer();
    }, {
        "sig/start": function() {
            var me = this;
            new LessonService(me.unitId).get().then(function(dataLesson) {
                if (!dataLesson) {
                    return;
                }
                me.render(dataLesson);
            });
        },
        "sig/stop" : function(){
            var me = this;
            me.countdownScoreboard && me.countdownScoreboard.stop();
        },
        "render": function(data) {
            var me = this;
            if (!data) {
                return;
            }
            var countdownScoreboard = new CountdownScoreboard();
            var timeIn = data.countdown.timeIn;
            var timeOut = data.countdown.timeOut;
            var startTime = data.countdown.startTime;

            me.publish("studyplan/evc/gl/start-time", startTime);
            me.publish("studyplan/evc/gl/start-status", STATUS_START_IN_COUNTDOWN);

            // NO: Do not show countdown
            if (data.countdown.hasClassScheduled) {
                //detect need to show or not
                me.$element.toggleClass("evc-none", timeIn === 0);

                me.html(countdownScoreboard.$el);
                me.countdownScoreboard = countdownScoreboard.init({
                    "timeIn": timeIn,
                    "timeOut": timeOut
                }).onTimeout(function() {
                    me.publish("studyplan/evc/gl/load");
                }).onEnd(function() {
                    me.$element.addClass("evc-none");
                    me.publish("studyplan/evc/gl/start-status", STATUS_START_STARTED);
                });

            }

        }
    });
});
