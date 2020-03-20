define(["troopjs-browser/component/widget",
    "jquery",
    "troopjs-ef/command/service",
    "troopjs-data/cache/component",
    "school-ui-studyplan/widget/gl-pl/popupbox/main",
    "template!./index.html"
], function(Widget, $, CommandService, Cache, Popupbox, template) {
    "use strict";

    var STATUS_START_STARTED = "started";

    var CSS_CLASS_POPUP_CONTAINER = ".ets-sp-init";
    var COMMAND;

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

    function eventsHandling($el, eType, callback) {
        var hooked = false;
        return {
            'unhook': function() {
                $el.unbind(eType);
                hooked = false;
            },
            'hook': function() {
                if (hooked) {
                    return;
                }
                $el.bind(eType, callback);
                hooked = true;
            }
        };
    }

    return Widget.extend(function() {
        
    }, {
        "hub:memory/studyplan/evc/cp20/status": function(dataLesson) {
            var me = this;

            if (!dataLesson || !dataLesson.bookedClass || !dataLesson.bookedClass.classId) {
                return;
            }

            me.classId = dataLesson.bookedClass.classId;

            // Return while class already open.
            if(dataLesson.countdown.timeIn <= 0){
                return;
            }
            // Render
            me.html(template);
            me.showNotice(dataLesson);
        },
        "showNotice": function(dataLesson) {
            var me = this;
            var $me = me.$element;
            var $cancel = $me.find(".evc-studyplan-cancel-btn");

            var cancelTime = dataLesson.suggestedCancelTime;
            var timezone = "UTC " + cancelTime.timezone;

            var strTime;

            if (cancelTime.minute > 9) {
                strTime = cancelTime.hour + ":" + cancelTime.minute;
            } else {
                strTime = cancelTime.hour + ":0" + cancelTime.minute;
            }

            me.publish("query", [
                "blurb!" + DAYOFWEEK_ARR[cancelTime.dayOfWeek][1],
                "blurb!" + MONTH_ARR[(cancelTime.month - 1)][1],
                "blurb!" + "639584"
            ]).spread(function(cancelWeek, cancelMonth, cancelContext) {

                var _cancelWeek = cancelWeek.translation;
                var _cancelMonth = cancelMonth.translation;
                var notice = cancelContext.translation;

                // show the cancel notice (start time > 1 day)
                var canceltime = strTime + ", " + _cancelWeek + " " + _cancelMonth + " " + cancelTime.day;
                notice = notice.replace("%%Canceltime%%", canceltime).replace("%%timezone%%", timezone);

                // init tooltips
                $cancel.attr("title", notice);
                $cancel.tooltip();

            });
        },
        "hub:memory/studyplan/evc/cp20/start-status": function(status) {
            var me = this;
            var $me = me.$element;
            status === STATUS_START_STARTED && $me.remove();
        },
        "dom:[data-action=cancelBooking]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;
            var msg = $me.find(".studyplan-cancel-confirm").html();

            // Popup form init
            me.popupbox = new Popupbox({
                el: CSS_CLASS_POPUP_CONTAINER,
                zIndex: 160,
                msg: msg,
                bgColor: "#fff",
                closeble: true,
                closeButtonHide: true
            });
            me.popupbox.open().then(function($popup) {
                // Event Handling
                var $keepBooking = $popup.find("button[data-action='keepBooking']");
                eventsHandling($keepBooking, 'click', function(e) {
                    e.preventDefault();
                    me.popupbox.close();
                }).hook();

                var $confirmCancel = $popup.find("button[data-action='confirmCancel']");
                eventsHandling($confirmCancel, 'click', function(e) {
                    e.preventDefault();
                    me.popupbox.close();
                    var args = {
                        "classId": me.classId
                    };
                    me.publish("/commands/classes/cancel", args).then(function() {
                        // Publish cancel status to school
                        me.publish("studyplan/sequence/update");
                        // Reload current studyplan content
                        me.publish("studyplan/sequence-container/reload");
                    });
                }).hook();
            });
        }
    });
});
