define(["troopjs-browser/component/widget",
	"when",
	"jquery",
	"school-ui-studyplan/module",
	"school-ui-studyplan/utils/client-storage",
	"school-ui-studyplan/utils/time-parser",
	"school-ui-studyplan/enum/studyplan-item-typecode",
	"template!./index.html"
], function (Widget, when, $, module, clientStorage, timeParser, spItemTypeCode, template) {
	"use strict";

    var MODULE_CONFIG = $.extend(true, {
        cacheServer: "",
        useLegacyUnitId: true
    }, module.config() || {});

    var $ELEMENT = "$element";

	var STATUS_NEVERTAKE = "nevertake";
	var STATUS_BOOKED = "booked";
	var STATUS_DROPOUT = "dropout";
	var STATUS_PENDING = "pending";
	var STATUS_ATTENDED = "attended";

	var STATUS_WELCOME = "welcome";
	var STATUS_OPTIONAL_MSG_PL = "optional_msg_pl";

	var STATUS_MISSING_CLASS = "missingclass";

	var STATUS_START_NOT_YET = "notyet";
	var STATUS_START_IN_COUNTDOWN = "incountdown";
	var STATUS_START_STARTED = "started";

	var WIDGET_COUNTDOWN = "school-ui-studyplan/widget/gl-pl/countdown/pl",
		WIDGET_CLASS_STATUS = "school-ui-studyplan/widget/gl-pl/class-status/pl",
		WIDGET_CREDIT_PL = "school-ui-studyplan/widget/gl-pl/credit/pl",
		WIDGET_CREDIT_SPPL20 = "school-ui-studyplan/widget/gl-pl/credit/sppl20",
		WIDGET_FEEDBACK_PL = "school-ui-studyplan/widget/gl-pl/feedback/pl",
		WIDGET_FEEDBACK_PENDING = "school-ui-studyplan/widget/gl-pl/feedback-pending/main",
		WIDGET_ENTER_CLASS = "school-ui-studyplan/widget/gl-pl/enter-class/pl",
		WIDGET_BOOKED = "school-ui-studyplan/widget/gl-pl/book-pl/main",
		WIDGET_CANCEL = "school-ui-studyplan/widget/gl-pl/cancel-pl/main";

	var SEL_ACTIVITY_CONTAINER = ".evc-studyplan-activity-container",
		SEL_INFO_CONTAINER = ".evc-studyplan-class-info",
		SEL_ENTER_CLASS = ".ets-sp-glpl-enter-class";

	var CLS_GAP_2X = "evc-studyplan-gap-2x text-center",
		CLS_GAP = "evc-studyplan-gap-block",
		CLS_ENTER_CLASS = "ets-sp-glpl-enter-class",
		CLS_NONE = "ets-none";

	var UNIT_ID = "_unit_id";
	var CLASS_ID = "_class_id";

	var UNIT_ID_KEY = MODULE_CONFIG.useLegacyUnitId ? "legacyUnitId" : "templateUnitId"

	var TOPIC_PIC_PATH = MODULE_CONFIG.cacheServer + "/_imgs/evc/pl/topic/100x100/";
	var PL_DEFAULT_PIC = MODULE_CONFIG.cacheServer + "/_imgs/evc/pl/pl_default_100x100.png";

	var DURATION_WAITING = 3000;

	var TIMER_WAITING = "_timer_waiting";

	var TYPE_CODE= "_type_code";
	var WIDGET_CREDIT = "_widget_credit";

	function createWidget(widgetName, appendToContainer, classNames) {
		var me = this;
		var $widgetElement = $("<div>");

		if (widgetName === WIDGET_ENTER_CLASS) {
			$widgetElement.attr("data-weave", widgetName + "(unitId, classId, spTypeCode)")
				.data("classId", me[CLASS_ID]);
		} else {
			$widgetElement.attr("data-weave", widgetName + "(unitId, spTypeCode)");
		}
		return $widgetElement
			.addClass(classNames || "")
			.data("unitId", me[UNIT_ID])
			.data('spTypeCode', me[TYPE_CODE])
			.appendTo(me.$element.find(appendToContainer))
			.weave();
	}

	return Widget.extend(function ($element, name, item) {
		var me = this;

		if (!item && !item.properties) {
			return;
		}

		me[TYPE_CODE] = item.typeCode;
		me[WIDGET_CREDIT] = me[TYPE_CODE] === spItemTypeCode.pl20 ? WIDGET_CREDIT_SPPL20 : WIDGET_CREDIT_PL;

		// Show Optional Msg
		me.closeOptionalTips = clientStorage.getLocalStorage("pl_tips") === "closed";

	}, {
		"hub:memory/load/unit": function (unit) {
			var me = this;
			if (!unit || !unit[UNIT_ID_KEY]) {
				return;
			}
			me.unitId = unit[UNIT_ID_KEY];

			// Check the student whether is first come or not
			me.publish("query", ["member_site_setting!evc;FirstTimeStudyPlanPL"]).spread(function (data) {
				if (!data) {
					return;
				}
				if (data.value.toString() === "true") {
					me.publish("studyplan/evc/pl/load");
				} else {
					me.html(template, {
						"unitId": me.unitId,
						"statusCode": STATUS_WELCOME
					});
				}
			});

		},
		"hub:memory/studyplan/evc/pl/start-status": function (status) {
			var me = this;
			switch (status) {
				case STATUS_START_NOT_YET:
					me.$element.find(SEL_ENTER_CLASS).addClass(CLS_NONE);
					break;
				case STATUS_START_IN_COUNTDOWN:
					me.$element.find(SEL_ENTER_CLASS).addClass(CLS_NONE);
					break;
				case STATUS_START_STARTED:
					me.$element.find(SEL_ENTER_CLASS).removeClass(CLS_NONE);
					break;
			}
		},
		"hub/studyplan/evc/pl/load": function () {
			var me = this;
			me[UNIT_ID] = me.unitId;

			me.publish("query", ["plclass!" + me.unitId]).spread(function success(data) {
				if (!data || !data.topic || !data.statusCode) {
					return;
				}
				var content = {};
				var topic = data.topic;
				var statusCode = data.statusCode.toLowerCase();

				// Copy & package own/customize PL class Info
				content.status = {
					"statusCode": statusCode
				};

				content.lessonInfo = {
					"topic": topic.topicBlurb,
					"description": topic.descriptionBlurb,
					"image": topic.topicImageUrl ? (TOPIC_PIC_PATH + topic.topicImageUrl) : PL_DEFAULT_PIC
				};

				content.topicId = data.topic.topicId;

				if (statusCode === STATUS_BOOKED || statusCode === STATUS_ATTENDED || statusCode === STATUS_PENDING) {
					if (!data.bookedClass || !data.bookedClass.easternStartTime) {
						return;
					}

					// Copy data
					var bookedClass = data.bookedClass;

					me[CLASS_ID] = bookedClass.classId;

					content.timezoneId = bookedClass.timezoneId;
					content.bookedClass = {
						"classId": bookedClass.classId,
						"teacherId": bookedClass.teacherId
					};
					content.customizedStartTime = timeParser.toLocalTime(
						bookedClass.easternStartTime,
						bookedClass.timeZoneOffset
					);

					if (statusCode === STATUS_BOOKED) {
						if (!bookedClass.easternSuggestedCancelTime || !data.countDown) {
							return;
						}
						var countDown = data.countDown;

						content.countdown = {
							"timeIn": countDown.secondsLeftForStart,
							"timeOut": countDown.secondsLeftForEnter
						};
						content.suggestedCancelTime = timeParser.toLocalTime(
							bookedClass.easternSuggestedCancelTime,
							bookedClass.timeZoneOffset
						);
					} else if (statusCode === STATUS_ATTENDED || statusCode === STATUS_PENDING) {
						if (!data.feedback) {
							return;
						}
						var feedback = data.feedback;
						content.feedback = {
							"feedbackId": feedback.feedbackId,
							"teacherId": feedback.teacherId,
							"entryDate": feedback.entryDate
						};
					}
				}

				// Render
				me.html(template, {
					"unitId": me.unitId,
					"statusCode": statusCode
				}).then(function () {
					me[$ELEMENT].find(SEL_INFO_CONTAINER).empty();
					me[$ELEMENT].find(SEL_ACTIVITY_CONTAINER).empty();

                    // Publish status
                    me.publish("studyplan/evc/pl/status", content);
                    // clear the class status as not yet
                    me.publish("studyplan/evc/pl/start-status", STATUS_START_NOT_YET);

					// Publish status to show optional msg
					if (!me.closeOptionalTips) {
						me.publish("studyplan/evc/pl/notification", {
							"statusCode": STATUS_OPTIONAL_MSG_PL
						});
					}

					// Publish status to show status bar
					if (statusCode === STATUS_DROPOUT) {
						me.publish("studyplan/evc/pl/notification", {
							"statusCode": STATUS_MISSING_CLASS
						});
					}

					var evcServerCode = data.bookedClass && data.bookedClass.evcServerCode || '';
					// Adobe classroom: "cn1" or "us1", otherwise "EvcCN1" or "EvcUS1"
					var isAdobeClassroom = evcServerCode.toLowerCase().indexOf('evc') < 0;
					if (!isAdobeClassroom) {
						// simulate techcheck passed
						clientStorage.setSessionStorage("techcheck_state", "passed");
					}

					switch (statusCode.toLowerCase()) {
						case STATUS_NEVERTAKE:
						case STATUS_DROPOUT:
							createWidget.call(me, WIDGET_BOOKED, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, me[WIDGET_CREDIT], SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						case STATUS_BOOKED:
							createWidget.call(me, WIDGET_COUNTDOWN, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_CLASS_STATUS, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_ENTER_CLASS, SEL_INFO_CONTAINER, CLS_GAP + " " + CLS_ENTER_CLASS + " " + CLS_NONE);
							createWidget.call(me, WIDGET_CANCEL, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, me[WIDGET_CREDIT], SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						case STATUS_PENDING:
							createWidget.call(me, WIDGET_FEEDBACK_PENDING, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
							createWidget.call(me, me[WIDGET_CREDIT], SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						case STATUS_ATTENDED:
							createWidget.call(me, WIDGET_FEEDBACK_PL, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
							createWidget.call(me, me[WIDGET_CREDIT], SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						default:
							break;
					}
				});

			});
		}
	});
});
