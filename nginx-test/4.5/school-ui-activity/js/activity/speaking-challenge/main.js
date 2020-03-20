define([
	'jquery',
	'poly',
	'school-ui-activity/activity/base/main',
	"template!./main.html",
	'school-ui-shared/enum/rating-source-type'
], function ($, poly, Widget, tTemplate, ratingSouceType) {
	"use strict";

	var $ELEMENT = '$element';

	var SEL_LEFT = '.ets-act-spc-l';
	var SEL_RIGHT = '.ets-act-spc-r';
	var SEL_ASR = '.ets-act-spc-asr';
	var SEL_MEJS = '.mejs-container';
	var SEL_RECORD = '.ets-act-record';
	var SEL_TOOLTIP = '.ets-tooltip';
	var SEL_TOOLTIP_RECORD = '.ets-tooltip-green';

	var CLS_AP_CONTAINER = "ets-ap-con";

	var HUB_ASR_SETTING = "asr/ui/setting";
	var HUB_ASR_STOP_PLAYBACK = "asr/stopPlayback";
	var HUB_ASR_PLAYBACK = "asr/startPlayback";
	var WIDGET_PATH_AUDIO_SHELL = "school-ui-activity/shared/audio/audio-shell";

	var IS_CORRECT = "_isCorrect";

	function setupASR() {
		var me = this;
		me.publish(HUB_ASR_SETTING, function (result, guid) {
			showRecord.call(me, guid);
		}, {
			prons: "",
			autostopTime: 180000,
			disableScoreRecording: true,
			playback: false
		}, {
			asrFailCb: function () {
				me._json.content = {};
				me._json.content[IS_CORRECT] = true;
				me.completed(true);
			}
		});
	}

	function hideAudioTooltip() {
		var me = this;
		me._timer = window.setTimeout(function () {
			me[$ELEMENT].find([SEL_LEFT, SEL_TOOLTIP].join(' ')).fadeOut();
		}, 5000);
	}

	function hideRecordTooltip() {
		var me = this;
		me.$recordTooltip.delay(5000).fadeOut();
	}

	function showASRTooltip() {
		if (!this._ASRTooltip && this.$asrTooltip) {
			this.$asrTooltip.css('display', 'block');
			hideASRTooltip.call(this);
			this._ASRTooltip = true;
		}
	}

	function hideASRTooltip() {
		var me = this;
		me.$asrTooltip.delay(5000).fadeOut();
	}

	function showASRSection() {
		var me = this;

		if (!me._ASRShowed) {
			// ASR section will slide out after 1000 ms
			me[$ELEMENT].find(SEL_RIGHT)
				.delay(1000).animate({
					'margin-left': 110
				}, 'slow', function () {
					$(this).css('z-index', 2);
					hideASRTooltip.call(me);
				});
		}
	}

	function recordSlideOut($el) {
		var me = this;
		$el.animate({
			'margin-left': 8
		}, 'slow', function () {
			me[$ELEMENT].find(SEL_TOOLTIP_RECORD).fadeIn();
			hideRecordTooltip.call(me);
			me.$asr.css({
				'z-index': 'auto'
			});
		});

		me.$asr.animate({
			'margin-left': -61
		}, 'slow');
	}

	function replaceRecord(guid) {
		var me = this;

		me.$record.animate({
			'margin-left': -27
		}, 'slow', function () {
			$(this).children('.' + CLS_AP_CONTAINER).remove();
			me._hasRecord = false;
			showRecord.call(me, guid);
		});

		me.$asr.css({
			'z-index': 1
		}).animate({
			'margin-left': -38
		}, 'slow');
	}

	function createNewRecord(guid) {
		var me = this;

		me.$record.prepend('<div class="' + CLS_AP_CONTAINER + '"></div>');

		var $container = me[$ELEMENT].find("." + CLS_AP_CONTAINER);
		$container
			.unweave()
			.then(function () {
				return $container
					.data("option", {
						"_playHandler": function () {
							me.publish(HUB_ASR_PLAYBACK);
							me[$ELEMENT].find(SEL_TOOLTIP_RECORD).fadeOut();
						},
						"_pauseHandler": function () {
							me.publish(HUB_ASR_STOP_PLAYBACK);
						},
						"guid": guid
					})
					.attr("data-weave", WIDGET_PATH_AUDIO_SHELL + "(option)")
					.weave()
					.then(function () {
						recordSlideOut.call(me, me.$record);

						me._hasRecord = true;
						me.items().answered(true);
					});
			});
	}

	function showRecord(guid) {
		var me = this;

		if (me._hasRecord) {
			// record slides in
			replaceRecord.call(this, guid);
		} else {
			createNewRecord.call(this, guid);
		}

	}

	// # Render Method

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {
		var me = this;

		return me.html(tTemplate, me._json)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this;

		var $container = me[$ELEMENT].find(SEL_MEJS);
		me._interval = window.setInterval(function () {
			if ($container.is(':visible')) {
				hideAudioTooltip.call(me);
				window.clearInterval(me._interval);
			}
		}, 4);

		// remove unneccessary element
		$container.find('.mejs-time').remove();
		$container.find('.mejs-time-rail').remove();
		$container.find('.mejs-volume-button').remove();
		$container.find('.mejs-horizontal-volume-slider').remove();

		//asr setup
		setupASR.call(me);

		me.$record = me[$ELEMENT].find(SEL_RECORD);
		me.$asr = me[$ELEMENT].find(SEL_ASR);

		me.$asrTooltip = me[$ELEMENT].find([SEL_ASR, SEL_TOOLTIP].join(' '));
		me.$recordTooltip = me[$ELEMENT].find(SEL_TOOLTIP_RECORD);
	}

	// ## Constructor
	function Ctor() {
		var me = this;

		me.type(3);

		me._ASRShowed = false;
		me._hasRecord = false;
		me._ASRTooltip = false;
	}

	// ## methods
	var methods = {
		"sig/render": function onRender() {
			return render.call(this);
		},
		'sig/finalize': function () {
			var me = this;
			window.clearTimeout(me._timer);
			window.clearInterval(me._interval);
		},
		'sig/stop': function onStop() {
			var me = this;

			// Stop the record if leave the activity
			var $record = me[$ELEMENT].find('.' + CLS_AP_CONTAINER);

			me.publish(HUB_ASR_STOP_PLAYBACK);
			return $record.unweave();
		},

		"hub/asr/ui/states/changed": function (state) {
			var me = this;

			if (state === 'PREPARING') {
				me.$asr.find(SEL_TOOLTIP).fadeOut();
				me.$asrTooltip.hide();
				me.$recordTooltip.hide();
				me._ASRTooltip = true;
			}
		},
		'hub/activity/epaper/expanding': function () {
			showASRTooltip.call(this);
		},
		'hub/rating/sourceType': function () {
			return [ratingSouceType['ASR_SPEAKING']];
		},


		'dom:.ets-ap/media/play': function() {
			// hide tooltip
			this[$ELEMENT].find([SEL_LEFT, SEL_TOOLTIP].join(' ')).fadeOut();
			// show ASR section
			showASRSection.call(this);
		},
		'dom:.ets-ap/media/pause': function() {
			showASRTooltip.call(this);
		},
		'dom:.ets-ap/media/ended': function() {
			showASRTooltip.call(this);
		}
	};

	return Widget.extend(Ctor, methods);
});
