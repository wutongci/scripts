define([
	'require',
	'jquery',
	'when',
	'troopjs-ef/component/service',
	'./asr-states',
	'asr-core'
], function (
	require,
	$,
	when,
	Service,
	FlashStates,
	html5AsrRecorder
) {
	var RECORDER = '_recorder';

	var TOPIC_ASR_SUCCESS = "asr/record/success";
	var TOPIC_ASR_PLAYBACK_STATUS_CHANGED = "asr/playback/status/changed";

	function publishAsrRecordEvent() {
		var me = this;
		var args = Array.prototype.slice.call(arguments);
		me.publish(TOPIC_ASR_SUCCESS, args);
	}

	function record(
		guid,
		host,
		contextXml,
		ignoredCallback,
		studentId,
		activityId,
		disableScoreRecording,
		audioElement
	) {
		var me = this;

		return html5AsrRecorder.startClientRecording({
			basename: guid,
			files: [
				{
					filename: guid + '.context',
					content: contextXml
				}
			],
			onlyPlayback: Boolean(disableScoreRecording),
			audioElement: audioElement
		}).then(function (startResult) {
			publishAsrRecordEvent.call(me, FlashStates.START, guid);
			return startResult.resultPromise.then(function (result) {
				publishAsrRecordEvent.call(me, FlashStates.COMPLETE, guid);

				if (disableScoreRecording) {
					publishAsrRecordEvent.call(me, FlashStates.FEEDBACK, null);
					return;
				}

				var endRecordingTimestamp = Date.now();
				var encodeTime = 0;
				if (result.timers) {
					endRecordingTimestamp = result.timers.endRecording || endRecordingTimestamp;
					encodeTime = (result.timers.zip || endRecordingTimestamp) - endRecordingTimestamp;
				}

				var url = host
					+ "/evalzip.ashx"
					+ "?guid=" + guid
					+ "&student_id=" + studentId
					+ "&activity_id=" + activityId;
				me.publish('ajax', {
					type: 'POST',
					url: url,
					contentType: 'application/zip',
					data: result.zip,
					processData: false,
					dataType: 'text'
				})
					.then(function (responseArray) {
						var totalTime = Date.now() - endRecordingTimestamp;
						publishAsrRecordEvent.call(me, FlashStates.FEEDBACK, {
							result: responseArray[0],
							totalTime: totalTime,
							encodeTime: encodeTime,
							audioDuration: result.duration,
							audioSize: result.zip.size
						});
					}, function (jqXHR, textStatus, errorThrown) {
						publishAsrRecordEvent.call(me, FlashStates.FAILED, errorThrown);
					});
			});
		}, function (error) {
			publishAsrRecordEvent.call(me, FlashStates.ERROR, error);
		});
	}

	function initServerHtml5Asr() {
		var me = this;
		var recorder = $.extend({}, html5AsrRecorder);
		recorder.startClientRecording = function (
			guid,
			host,
			contextXml,
			ignoredCallback,
			studentId,
			activityId,
			disableScoreRecording
		) {
			record.call(me,
				guid,
				host,
				contextXml,
				ignoredCallback,
				studentId,
				activityId,
				disableScoreRecording,
				null // audio element
			);
		};
		recorder.testClientRecording = function (
			guid,
			host,
			contextXml,
			ignoredCallback,
			studentId,
			activityId,
			disableScoreRecording,
			audioUrl
		) {
			var audioElement = document.createElement('audio');
			audioElement.controls = false;
			audioElement.preload = 'auto';
			audioElement.muted = true;
			audioElement.addEventListener('ended', function () {
				document.body.removeChild(audioElement);
			});
			audioElement.addEventListener('error', function (error) {
				document.body.removeChild(audioElement);
				publishAsrRecordEvent.call(me, FlashStates.ERROR, error);
			});
			audioElement.addEventListener('canplaythrough', function onCanPlayThrough() {
				audioElement.removeEventListener('canplaythrough', onCanPlayThrough);
				audioElement.pause();
				setTimeout(function () {
					audioElement.muted = false;
					audioElement.currentTime = 0;
					record.call(me,
						guid,
						host,
						contextXml,
						ignoredCallback,
						studentId,
						activityId,
						disableScoreRecording,
						audioElement
					);
				}, 0);
			});
			audioElement.src = audioUrl;
			document.body.appendChild(audioElement);
			audioElement.play(); // start loading
		};
		recorder.startClientPlayback = function () {
			me.publish(TOPIC_ASR_PLAYBACK_STATUS_CHANGED, 'START');
			html5AsrRecorder.startClientPlayback()
				.then(function () {
					me.publish(TOPIC_ASR_PLAYBACK_STATUS_CHANGED, 'COMPLETE');
				});
		};
		this[RECORDER] = recorder;
	}


	return Service.extend({
		'sig/start': function () {
			return initServerHtml5Asr.call(this);
		},
		getRecorder: function () {
			return this[RECORDER];
		}
	});
});
