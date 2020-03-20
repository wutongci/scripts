define([
	'module',
	'jquery',
	'json2',
	'troopjs-ef/component/gadget',
	'school-ui-shared/utils/browser-check',
	'school-ui-shared/utils/typeid-parser',
	'./asr-logger',
	'./asr-trace-event-type'
], function ASRLogModule(
	module,
	$,
	JSON,
	Widget,
	BrowserInfo,
	TypeIdParser,
	ASRLogger,
	ASREventType
) {
	"use strict";

	var config = $.extend({
		asrLogUrl: '/services/school/courseware/LogAsrTracking.ashx',
		headers: {}
	}, module.config() || {});

	//Variables
	var activity_id,
		Browser = BrowserInfo.browser + BrowserInfo.version,
		CustomerOS = navigator.platform,
		contentType = 'application/json; charset=utf-8',
		EventLevel = 3,
		student_id,
		AJAX = 'ajax',
		Token;//asrTrackingToken;

	/*!
	 * ASR trace function
	 * {String} token : ASR session token
	 * {Number} eventType
	 * {String} eventDesc
	 */
	function trace(token, eventType, eventDesc) {
		if (!token || !this._isReady) {
			return;
		}

		var me = this,
			EventType = eventType || ASREventType.DEFAULT,
			EventDesc = eventDesc,
			ProcessGuid = token,
			asrType,
			params;
		asrType = 3;

		params = {
			'ProcessGuid': ProcessGuid,
			'student_id': student_id,
			'Activity_id': activity_id,
			'CustomerOS': CustomerOS,
			'Broswer': Browser,
			'AsrType': asrType,
			'Token': Token,
			'EventLevel': EventLevel,
			'EventType': EventType,
			'EventDesc': EventDesc
		};

		me.publish(AJAX, getOldAjaxSet(params))
			.ensure(function (response) {
				ASRLogger.log("ASR Event, type: " + EventType + ", desc: " + eventDesc + ", Response is : " + (response && response.responseText));
			});

	}

	function getOldAjaxSet(p) {

		var params = [
			'ProcessGuid=' + p.ProcessGuid,
			'student_id=' + p.student_id,
			'Activity_id=' + p.Activity_id,
			'CustomerOS=' + p.CustomerOS,
			'Broswer=' + p.Broswer,
			'NativeAsrVersion=' + p.NativeAsrVersion,
			'AsrType=' + p.AsrType,
			'Token=' + p.Token,
			'EventLevel=' + p.EventLevel,
			'EventType=' + p.EventType,
			'EventDesc=' + p.EventDesc
		].join("&");

		return {
			type: "GET",
			url: config.asrLogUrl,
			headers: config.headers,
			cache: false,
			data: params,
			processData: false,
			contentType: contentType
		};
	}

	//Constructor
	function ctor() {
		this._isReady = false;

		setPhase.call(this);
	}

	//Util functions
	function setPhase() {
		if (student_id && activity_id) {
			this._isReady = true;
		}
	}

	//Hanlders
	var Hanlders = {
		"hub:memory/context": function (context) {
			if (!context) {
				return;
			}

			student_id = TypeIdParser.parseId(context.user.id);
			setPhase.call(this);
		},
		"hub:memory/start/load/activity": function (activity) {
			if (!activity) {
				return;
			}

			activity_id = TypeIdParser.parseId(activity.id);

			setPhase.call(this);
		},
		log: trace
	};

	return Widget.extend(ctor, Hanlders);
});
