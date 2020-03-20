define([
	'jquery',
	'when',
	'troopjs-ef/component/widget',
	'./asr-service',
	'./asr-recorder-service-html5',
	'./asr-recorder-service-flash',
	'asr-core'
], function ASRInitModule(
	$,
	when,
	Widget,
	ASRService,
	Html5RecorderService,
	FlashRecorderService,
	html5AsrRecorder
) {
	"use strict";

	var $ELEMENT = "$element";

	var TOPIC_ASR_INITED = "asr/inited";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			var recorderService;
			if (html5AsrRecorder.isAvailable()) {
				recorderService = Html5RecorderService.create();
			} else {
				recorderService = FlashRecorderService.create();
				recorderService.setContainer(me[$ELEMENT])
			}
			recorderService.start()
				.then(function () {
					return me.publish(TOPIC_ASR_INITED, recorderService);
				})
				.then(function(){
					var asrService = ASRService.create();
					return asrService.start();
				});
		}
	});
});
