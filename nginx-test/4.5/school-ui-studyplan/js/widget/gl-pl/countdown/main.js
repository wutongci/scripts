define(["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    "use strict";

    var DAYOFWEEK_ARR = [
        ["Sunday", "78946"],
        ["Monday", "78940"],
        ["Tuesday", "78941"],
        ["Wednesday", "78942"],
        ["Thusday", "78943"],
        ["Friday", "78944"],
        ["Saterday", "78945"]
    ];
    var MONTH_ARR = [
        ["January", "77396"],
        ["February", "77397"],
        ["March", "77398"],
        ["April", "77399"],
        ["May", "77400"],
        ["June", "77401"],
        ["July", "77402"],
        ["August", "77403"],
        ["September", "77404"],
        ["October", "77405"],
        ["November", "77406"],
        ["December", "77407"]
    ];

    return Widget.extend({
        "disableEnter": function() {
            var me = this;
            if (me.countdownScoreboard) {
                me.countdownScoreboard.disableEnter();
            }
        },
        "renderDate": function(startTime, isDay) {
            var me = this;
            if (!startTime) {
                return;
            }

            var strTime;
            var strDay;

            if (startTime.minute > 9) {
                strTime = startTime.hour + ":" + startTime.minute;
            } else {
                strTime = startTime.hour + ":0" + startTime.minute;
            }

            if(isDay){
                // Display full date
                me.publish("query", [
                    "blurb!" + DAYOFWEEK_ARR[startTime.dayOfWeek][1],
                    "blurb!" + MONTH_ARR[(startTime.month - 1)][1]
                ]).spread(function(startWeek, startMonth) {
                    var _startWeek = startWeek.translation;
                    var _startMonth = startMonth.translation;
                    strDay = _startWeek + " " + _startMonth + " " + startTime.day;
                    // Render Template
                    me.html(template, {
                        time: strTime,
                        day: strDay,
                        timezone: startTime.timezone
                    });
                });
            }
            else{
                me.publish("query", ["blurb!103048"]).spread(function(day) {
                    // Render
                    strDay = day.translation || "Today";
                    me.html(template, {
                        time: strTime,
                        day: strDay,
                        timezone: startTime.timezone
                    });
                });
            }

        }
    });
});
