define(["troopjs-core/component/gadget",
    "jquery",
    "when",
    "moment",
    "school-ui-studyplan/module"
], function(Gadget, $, when, Moment, module) {
    'use strict';

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
	}, module.config() || {});

    // TODO: Cache Server
    var TOPIC_PIC_PATH = MODULE_CONFIG.cacheServer + "/_imgs/evc/gl/topic/100x100/"

    return Gadget.extend(function(unitId) {
        var me = this;
        me.unitId = unitId;
    }, {
        "get": function() {
            var me = this;
            var deferred = when.defer();
            // Get lesson data by eTroop
            me.publish("query", ["glclass!" + me.unitId]).spread(function(data) {
                if (!data) {
                    deferred.reject();
                }
                var topic = data.topic;
                var countDown = data.countDown;
                var room = data.room;

                // Generate a new object to resolve
                var lesson = {};
                // Read & find GL lesson
                lesson.lessonInfo = {
                    "topic": topic.topicBlurb,
                    "description": topic.descriptionBlurb,
                    "image": TOPIC_PIC_PATH + topic.topicImageUrl
                };
                lesson.countdown = {
                    "timeIn": countDown.secondsLeftForStart,
                    "timeOut": countDown.secondsLeftForEnter,
                    "startTime": Moment(countDown.classStartTime).valueOf(),
                    "hasClassScheduled": countDown.hasClassScheduled
                };
                // TODO:
                lesson.classroom = {
                    "global": room.global,
                    "local": room.local
                };

				lesson.topicId = data.topic.topicId;

                // Resolve generated lesson
                deferred.resolve(lesson);
            });
            // Return a promise
            return deferred.promise;
        }
    });
});
