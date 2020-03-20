define([
	'jquery',
	'when',
	'troopjs-ef/component/widget',
	'../guid',
	'template!./asr-debug.html'
], function asrDebugModule($, when, Widget, guid, tAsrDebug) {
	'use strict';

	var $ELEMENT = "$element";

	var CCL_SCHOOL_ASR_RECORDER = "ccl!'school.serverasr.nonstreaming.flash.relativepath'";

	var pronsXML,
		activityCb,
		asr_option;

	return Widget.extend({
		"hub:memory/asr/inited": function asrInited(recorderService) {
			var me = this;
			me.recorderService = recorderService;

			/*
			 var asrErrCdMapping = {
			 80  : 'NO_VOICE',
			 3   : 'VOICE_TOO_SLOW',
			 4   : 'VOICE_TOO_FAST',
			 5   : 'VOICE_TOO_LOW',
			 85  : 'VOICE_TOO_LOW', //the same ad '5',
			 6   : 'VOICE_TOO_HIGH',
			 86  : 'VOICE_TOO_HIGH' //the same ad '6',
			 7   : 'CAN_NOT_RECOGNIZE',
			 8   : 'CAN_NOT_RECOGNIZE'
			 };
			 */

			var asrErrCdMapping = [
				{
					code: 80,
					msg: 'NO_VOICE'
				},
				{
					code: 85,
					msg: 'VOICE_TOO_LOW'
				},
				{
					code: 6,
					msg: 'VOICE_TOO_HIGH'
				},
				{
					code: 86,
					msg: 'VOICE_TOO_HIGH'
				},
				{
					code: 61,
					msg: 'GET_RESULT_TIMEOUT'
				},
				{
					code: 1,
					msg: 'DICTIONARY_ERROR'
				}
			];

			me.html(tAsrDebug, asrErrCdMapping);
		},

		"hub:memory/asr/debuggerTool": function (cb, option) {
			pronsXML = option.pronsXML;
			activityCb = cb;
			asr_option = option;
		},

		"dom:.asr-debug-submit/click": function (event) {
			var me = this;
			var g = guid();

			me.publish("asr/set/guid", g);
			me.publish("asr/set/callback", activityCb, g);
			me.publish("asr/set/source", asr_option, g);

			var $button = $(event.currentTarget);
			var errorcode = $button.data('errorcode');

			var testOptionsPromise;
			if (errorcode) {
				testOptionsPromise = me.query(CCL_SCHOOL_ASR_RECORDER)
					.spread(function (ccl) {
						var folder = ccl.value.replace("recorder.swf", "");
						return me.publish("ajax", {
							url: folder + errorcode + ".txt"
						}).then(function (xml) {
							return {
								xml: xml,
								audioUrl: folder + errorcode + ".wav"
							};
						});
					});
			} else if (pronsXML) {
				testOptionsPromise = when.resolve({
					xml: pronsXML,
					audioUrl: me[$ELEMENT].find("#correctAnswerUrl").val()
				});
			} else {
				return;
			}

			testOptionsPromise.then(function (testOptions) {
				me.publish("asr/service/setting", {
					pronsXML: testOptions.xml
				});

				me.recorderService.getRecorder().testClientRecording(
					g,
					'/asr/handlers',
					testOptions.xml,
					"ASR.asrHubProxy",
					88888888,
					99999999,
					false,
					testOptions.audioUrl);
			});
		}
	});
});
