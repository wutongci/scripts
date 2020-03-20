define([
	"when",
	"jquery",
	"moment",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/moment-language",
	"school-ui-studyplan/module",
	"school-ui-studyplan/utils/client-storage",
	"template!./index.html"
], function (when, $, Moment, Widget, momentLang, module, clientStorage, template) {
	"use strict";

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
		useLegacyUnitId: true
	}, module.config() || {});

	var $ELEMENT = "$element";

	var STATUS_DROPOUT = "dropout";
	var STATUS_NEVERTAKE = "nevertake";
	var STATUS_PENDING = "pending";
	var STATUS_ATTENDED = "attended";

	var STATUS_WELCOME = "welcome";
	var STATUS_OPTIONAL_MSG_GL = "optional_msg_gl";

	var STATUS_LEFT_EARLY = "leftearly";

	var STATUS_START_NOT_YET = "notyet";
	var STATUS_START_IN_COUNTDOWN = "incountdown";
	var STATUS_START_STARTED = "started";

	var TOPIC_PIC_PATH = MODULE_CONFIG.cacheServer + "/_imgs/evc/gl/topic/100x100/";
	var GL_DEFAULT_PIC = MODULE_CONFIG.cacheServer + "/_imgs/evc/gl/gl_default_100x100.jpg";

	var CONTEXT_DEFER = "_context_promise";

	var WIDGET_COUNTDOWN = "school-ui-studyplan/widget/gl-pl/countdown/gl",
		WIDGET_CLASS_STATUS = "school-ui-studyplan/widget/gl-pl/class-status/gl",
		WIDGET_CREDIT = "school-ui-studyplan/widget/gl-pl/credit/gl",
		WIDGET_FEEDBACK_GL = "school-ui-studyplan/widget/gl-pl/feedback/gl",
		WIDGET_FEEDBACK_PENDING = "school-ui-studyplan/widget/gl-pl/feedback-pending/main",
		WIDGET_ENTER_CLASS = "school-ui-studyplan/widget/gl-pl/enter-class/gl",
		WIDGET_TERMS_CONDITIONS = "school-ui-studyplan/widget/gl-pl/terms-and-conditions/main";

	var SEL_ACTIVITY_CONTAINER = ".evc-studyplan-activity-container",
		SEL_INFO_CONTAINER = ".evc-studyplan-class-info",
		SEL_ENTER_CLASS = ".ets-sp-glpl-enter-class";

	var CLS_GAP_2X = "evc-studyplan-gap-2x text-center",
		CLS_GAP = "evc-studyplan-gap-block",
		CLS_ENTER_CLASS = "ets-sp-glpl-enter-class",
		CLS_NONE = "ets-none",
		CLS_TC = "evc-studyplan-activity-tc";

	var UNIT_ID = "_unit_id";

	var UNIT_ID_KEY = MODULE_CONFIG.useLegacyUnitId ? "legacyUnitId" : "templateUnitId"

	function createWidget(widgetName, appendToContainer, classNames) {
		var me = this;
		return $("<div>").attr("data-weave", widgetName + "(unitId)")
			.addClass(classNames || "")
			.data("unitId", me[UNIT_ID])
			.appendTo(me[$ELEMENT].find(appendToContainer))
			.weave();
	}

	return Widget.extend(function ($element, name, item) {
		if (!item && !item.properties) {
			return;
		}
		var me = this;
		me.closeOptionalTips = clientStorage.getLocalStorage("gl_tips") === "closed";
		me[CONTEXT_DEFER] = when.defer();
	}, {
		"hub:memory/load/unit": function (unit) {
			var me = this;
			if (!unit || !unit[UNIT_ID_KEY]) {
				return;
			}
			me.unitId = unit[UNIT_ID_KEY];

			// Check the student whether is first come or not
			me.publish("query", ["member_site_setting!evc;FirstTimeStudyPlanGL"]).spread(function (data) {
				if (!data) {
					return;
				}
				if (data.value.toString() === "true") {
					me.publish("studyplan/evc/gl/load");
				} else {
					me.html(template, { statusCode: STATUS_WELCOME });
				}
			});

		},
		"hub:memory/studyplan/evc/gl/start-status": function (status) {
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
		"hub/studyplan/evc/gl/load": function () {
			var me = this;
			me[UNIT_ID] = me.unitId;
			me.publish("query", ["glstatus!" + me.unitId, "glclass!" + me.unitId]).spread(function success(statusData, glClass) {
				if (!statusData) {
					return;
				}

				var statusCode = statusData.statusCode.toLowerCase();
				var feedback = statusData.feedback;
				// nevertake
				// dropout
				// pending
				// attended
				var status = {
					"unitId": me.unitId,
					"statusCode": statusCode,
					"teacherId": feedback.teacherId || "",
					"feedbackId": feedback.feedbackId || "",
					"topic": {},
					"feedback": feedback || {}
				};

				if (statusCode === STATUS_PENDING || statusCode === STATUS_ATTENDED) {
					var topic = feedback.topic;
					if (topic) {
						status.topic = {
							"topic": topic.topicBlurb,
							"description": topic.descriptionBlurb,
							"image": (TOPIC_PIC_PATH + topic.topicImageUrl) || GL_DEFAULT_PIC
						};
					}
				}

				var evcServerCode = glClass && glClass.evcServerCode || '';
				// Adobe classroom: "cn1" or "us1", otherwise "EvcCN1" or "EvcUS1"
				var isAdobeClassroom = evcServerCode.toLowerCase().indexOf('evc') < 0;
				if (!isAdobeClassroom) {
					// simulate techcheck passed
					clientStorage.setSessionStorage("techcheck_state", "passed");
				}

				// Render
				var renderData = statusData;
				$.extend(true, renderData, { unitId: me.unitId });
				me.html(template, renderData).then(function () {

					me[$ELEMENT].find(SEL_INFO_CONTAINER).empty();
					me[$ELEMENT].find(SEL_ACTIVITY_CONTAINER).empty();

					//start time
					me.publish("studyplan/evc/gl/start-time", new Date(glClass.countDown.classStartTime || 0).getTime());

					// Publish status
					me.publish("studyplan/evc/gl/status", status);

					//clear the class status as not yet
					me.publish("studyplan/evc/gl/start-status", STATUS_START_NOT_YET);

					// Publish status to show optional msg
					if (!me.closeOptionalTips) {
						me.publish("studyplan/evc/gl/notification", {
							"statusCode": STATUS_OPTIONAL_MSG_GL
						});
					}

					// Publish status to show msg in the status bar
					if (statusCode === STATUS_DROPOUT) {
						if (!feedback.entryDate) {
							return;
						}
						when.all([
							me[CONTEXT_DEFER].promise,
							me.query("blurb!568599")
						]).spread(function (contextResults, queryResults) {
							var context = contextResults[0];
							var moment = Moment(feedback.entryDate);
							moment.lang(momentLang[context.cultureCode.toLowerCase()]);

							var blurbDropout = queryResults[0];
							var msg = blurbDropout.translation;
							msg = msg.replace("%%date%%", moment.format("YYYY-MM-DD")).replace("%%time%%", moment.format("HH:mm"));

							me.publish("studyplan/evc/gl/notification", {
								"statusCode": STATUS_LEFT_EARLY,
								"link": "http://www.ef.com",
								"msg": msg
							});
						});
					}

					switch (statusCode.toLowerCase()) {
						case STATUS_NEVERTAKE:
						case STATUS_DROPOUT:
							createWidget.call(me, WIDGET_COUNTDOWN, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_CLASS_STATUS, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_ENTER_CLASS, SEL_INFO_CONTAINER, CLS_GAP + " " + CLS_ENTER_CLASS + " " + CLS_NONE);
							createWidget.call(me, WIDGET_CREDIT, SEL_ACTIVITY_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_TERMS_CONDITIONS, SEL_ACTIVITY_CONTAINER, CLS_TC);
							break;
						case STATUS_PENDING:
							createWidget.call(me, WIDGET_FEEDBACK_PENDING, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
							createWidget.call(me, WIDGET_CREDIT, SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						case STATUS_ATTENDED:
							createWidget.call(me, WIDGET_FEEDBACK_GL, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
							createWidget.call(me, WIDGET_CREDIT, SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						default:
							break;
					}

				});

			});
		},
		"hub:memory/context": function (context) {
			context && this[CONTEXT_DEFER].resolve([context]);
		}
	});
});
