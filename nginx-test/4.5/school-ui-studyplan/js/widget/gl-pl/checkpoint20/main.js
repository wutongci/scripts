define([
	"when",
	"jquery",
	"troopjs-browser/component/widget",
	"school-ui-studyplan/module",
	"school-ui-studyplan/utils/client-storage",
	"school-ui-studyplan/utils/time-parser",
	"template!./index.html"
], function (when, $, Widget, module, clientStorage, timeParser, template) {
	"use strict";

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
		useLegacyUnitId: true
	}, module.config() || {});

	var $ELEMENT = "$element";
	var ITEM = "_item";

	var STATUS_NEVERTAKE = "nevertake";
	var STATUS_BOOKED = "booked";
	var STATUS_DROPOUT = "dropout";
	var STATUS_PENDING = "pending";
	var STATUS_ATTENDED = "attended";

	var STATUS_WELCOME = "welcome";
	//use the same code as PL
	var STATUS_OPTIONAL_MSG_CP20 = "optional_msg_pl";

	var STATUS_START_NOT_YET = "notyet";
	var STATUS_START_IN_COUNTDOWN = "incountdown";
	var STATUS_START_STARTED = "started";

	var WIDGET_COUNTDOWN = "school-ui-studyplan/widget/gl-pl/countdown/cp20",
		WIDGET_CLASS_STATUS = "school-ui-studyplan/widget/gl-pl/class-status/cp20",
		WIDGET_FEEDBACK = "school-ui-studyplan/widget/gl-pl/feedback/cp20",
		WIDGET_FEEDBACK_PENDING = "school-ui-studyplan/widget/gl-pl/feedback-pending/main",
		WIDGET_ENTER_CLASS = "school-ui-studyplan/widget/gl-pl/enter-class/cp20",
		WIDGET_BOOKED = "school-ui-studyplan/widget/gl-pl/book-cp20/main",
		WIDGET_DROPOUT = "school-ui-studyplan/widget/gl-pl/dropout-cp20/main",
		WIDGET_CANCEL = "school-ui-studyplan/widget/gl-pl/cancel-cp20/main";

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

	function createWidget(widgetName, appendToContainer, classNames) {
		var me = this;
		var $widgetElement = $("<div>");

		if (widgetName === WIDGET_ENTER_CLASS) {
			$widgetElement.attr("data-weave", widgetName + "(unitId, classId)")
				.data("classId", me[CLASS_ID]);
		} else {
			$widgetElement.attr("data-weave", widgetName + "(unitId)");
		}
		return $widgetElement
			.addClass(classNames || "")
			.data("unitId", me[UNIT_ID])
			.appendTo(me.$element.find(appendToContainer))
			.weave();
	}

	return Widget.extend(function ($element, name, item) {
		var me = this;

		if (!item && !item.properties) {
			return;
		}

		me[ITEM] = item;

		// Show Optional Msg
		me.closeOptionalTips = clientStorage.getLocalStorage("cp20_tips") === "closed";
		// A defer for pl status, for hide skip link
		me.cpStatusDeferred = when.defer();
	}, {
		"hub:memory/load/unit": function (unit) {
			var me = this;
			if (!unit || !unit[UNIT_ID_KEY]) {
				return;
			}
			me.unitId = unit[UNIT_ID_KEY];

			me.publish("query", ["member_site_setting!evc;FirstTimeStudyPlanCP20"]).spread(function (data) {
				if (!data) {
					return;
				}
				if (data.value.toString() === "true") {
					me.publish("studyplan/evc/cp20/load");
				} else {
					me.html(template, {
						"unitId": me.unitId,
						"statusCode": STATUS_WELCOME
					});
				}
			});
		},
		"hub:memory/studyplan/evc/cp20/start-status": function (status) {
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
		"hub/studyplan/evc/cp20/load": function () {
			var me = this;
			me[UNIT_ID] = me.unitId;

			when.all([
				me.publish("query", ["checkpointstate!cp20;" + me.unitId]),
				me.publish("query", [me[ITEM].id + ".progress"])
			]).spread(function success(cpStateData, itemData) {

				var cpState = cpStateData[0];
				var item = itemData[0];

				if (!cpState || !cpState.topic || !cpState.statusCode) {
					return;
				}

				var content = {};
				var topic = cpState.topic;
				var statusCode = cpState.statusCode.toLowerCase();
				// Resolve pl status
				me.cpStatusDeferred.resolver.notify(statusCode);

				// Copy & package own/customize PL class Info
				content.status = {
					"statusCode": statusCode
				};

				content.lessonInfo = {
					"topic": topic.topicBlurbId,
					"description": topic.descBlurbId,
					"image": topic.imageUrl ? (TOPIC_PIC_PATH + topic.imageUrl) : PL_DEFAULT_PIC
				};
				if (statusCode === STATUS_BOOKED ||
					statusCode === STATUS_ATTENDED ||
					statusCode === STATUS_PENDING ||
					statusCode === STATUS_NEVERTAKE ||
					statusCode === STATUS_DROPOUT) {


					var bookedClass = cpState.bookedClass || cpState.pastClass;
					if (bookedClass && bookedClass.easternStartTime) {
						me[CLASS_ID] = bookedClass.classId;
						// Copy cpState
						content.timezoneId = bookedClass.timezoneId;
						content.bookedClass = {
							"classId": bookedClass.classId,
							"teacherId": bookedClass.teacherId
						};
						content.customizedStartTime = timeParser.toLocalTime(
							bookedClass.easternStartTime,
							bookedClass.timeZoneOffset
						);
					}

					if (statusCode === STATUS_BOOKED) {
						if (!bookedClass || !bookedClass.easternSuggestedCancelTime || !cpState.countdown) {
							return;
						}
						var countdown = cpState.countdown;

						content.countdown = {
							"timeIn": countdown.secondsLeftForStart,
							"timeOut": countdown.secondsLeftForEnter
						};
						content.suggestedCancelTime = timeParser.toLocalTime(
							bookedClass.easternSuggestedCancelTime,
							bookedClass.timeZoneOffset
						);
					} else if (statusCode === STATUS_PENDING) {
						if (!cpState.feedback) {
							return;
						}

						content.feedback = {
							"teacherId": cpState.feedback.teacherId
						};
					}
					else if (statusCode === STATUS_ATTENDED) {
						if (!cpState.feedback) {
							return;
						}
						var feedback = cpState.feedback;
						content.feedback = {
							"feedbackId": feedback.feedbackId,
							"teacherId": feedback.teacherId
						};
					}

					var evcServerCode = bookedClass && bookedClass.evcServerCode || '';
					// Adobe classroom: "cn1" or "us1", otherwise "EvcCN1" or "EvcUS1"
					var isAdobeClassroom = evcServerCode.toLowerCase().indexOf('evc') < 0;
					if (!isAdobeClassroom) {
						// simulate techcheck passed
						clientStorage.setSessionStorage("techcheck_state", "passed");
					}

					// Render
					me.html(template, {
						"unitId": me.unitId,
						"statusCode": statusCode
					}).then(function () {
						me[$ELEMENT].find(SEL_INFO_CONTAINER).empty();
						me[$ELEMENT].find(SEL_ACTIVITY_CONTAINER).empty();

					// Publish status
					me.publish("studyplan/evc/cp20/status", content);
					// clear the class status as not yet
					me.publish("studyplan/evc/cp20/start-status", STATUS_START_NOT_YET);
					// publish token
					me.publish("studyplan/evc/cp20/enter-token", item.progress.properties.token);

						// Publish status to show optional msg
						if (!me.closeOptionalTips) {
							me.publish("studyplan/evc/cp20/notification", {
								"statusCode": STATUS_OPTIONAL_MSG_CP20
							});
						}

						switch (statusCode.toLowerCase()) {
							case STATUS_NEVERTAKE:
								createWidget.call(me, WIDGET_BOOKED, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
								break;
							case STATUS_DROPOUT:
								createWidget.call(me, WIDGET_DROPOUT, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
								break;
							case STATUS_BOOKED:
								createWidget.call(me, WIDGET_COUNTDOWN, SEL_INFO_CONTAINER, CLS_GAP);
								createWidget.call(me, WIDGET_CLASS_STATUS, SEL_INFO_CONTAINER, CLS_GAP);
								createWidget.call(me, WIDGET_ENTER_CLASS, SEL_INFO_CONTAINER, CLS_GAP + " " + CLS_ENTER_CLASS + " " + CLS_NONE);
								createWidget.call(me, WIDGET_CANCEL, SEL_INFO_CONTAINER, CLS_GAP);
								break;
							case STATUS_ATTENDED:
								createWidget.call(me, WIDGET_FEEDBACK, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
								break;
							case STATUS_PENDING:
								createWidget.call(me, WIDGET_FEEDBACK_PENDING, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
								break;
							default:
								break;
						}
					});
				}

			});
		}
	});
});
