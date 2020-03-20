define(["jquery",
    "./main",
    "school-ui-studyplan/widget/gl-pl/countdown-scoreboard/main"
], function($, CountdownBase, CountdownScoreboard) {
    "use strict";

    var HOUR_SECONDES = 1 * 60 * 60; // 1hr

    var STATUS_START_NOT_YET = "notyet";
    var STATUS_START_IN_COUNTDOWN = "incountdown";
    var STATUS_START_STARTED = "started";

    return CountdownBase.extend({
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
            me.html(countdownScoreboard.$el);

            var timeIn = data.countdown.timeIn;
            var timeOut = data.countdown.timeOut;

            me.publish("studyplan/evc/cp20/start-status", STATUS_START_IN_COUNTDOWN);

            //detect need to show or not
            me.$element.toggleClass("evc-none", timeIn === 0);

            // Init countdown
            me.countdownScoreboard = countdownScoreboard.init({
                "timeIn": timeIn,
                "timeOut": timeOut
            }).onTimeout(function() {
                me.publish("studyplan/evc/cp20/load");
            }).onEnd(function() {
                me.$element.addClass("evc-none");
                // Publish class started.
                me.publish("studyplan/evc/cp20/start-status", STATUS_START_STARTED);
            });

        },
        "hub:memory/studyplan/evc/cp20/status": function(dataLesson) {
            var me = this;
            if (!dataLesson || !dataLesson.customizedStartTime || !dataLesson.suggestedCancelTime) {
                return;
            }
            // Properties
            me.lesson = dataLesson;
            me.customizedStartTime = dataLesson.customizedStartTime;
            me.suggestedCancelTime = dataLesson.suggestedCancelTime;
            me.timezoneId = dataLesson.timezoneId;
            me.lessonMinutesOfDay = me.customizedStartTime.hour * 60 + me.customizedStartTime.minute;
            me.lessonSecondsOfDay = me.lessonMinutesOfDay * 60;
            // Is Today?
            // All time caculation in PL in seconds
            if (dataLesson.countdown.timeIn > me.lessonSecondsOfDay) {
                me.onemoreDayLesson();
            } else if (dataLesson.countdown.timeIn > HOUR_SECONDES) {
                me.onemoreHourLesson();
            } else {
                me.render(dataLesson);
            }
        },
        "onemoreDayLesson": function() {
            var me = this;
            // Render in full-date view
            me.renderDate(me.customizedStartTime, true);
        },
        "onemoreHourLesson": function(seconds) {
            var me = this;
            seconds = seconds || me.lesson.countdown.timeIn - HOUR_SECONDES;

            // Reset timein & render as "Countdown-Scoreboard"...
            window.setTimeout(function() {
                me.render($.extend(true, me.lesson, {
                    countdown: {
                        timeIn: HOUR_SECONDES
                    }
                }));
            }, seconds * 1000);

            // Render as "Today xxx"
            me.renderDate(me.customizedStartTime);
        }
    });
});
