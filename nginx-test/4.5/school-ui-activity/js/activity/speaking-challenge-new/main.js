define([
	'jquery',
	'poly',
	'school-ui-activity/activity/base/main',
	'template!./main.html',
	'school-ui-shared/enum/rating-source-type'
], function ($, poly, Widget, tTemplate, ratingSouceType) {
	'use strict';

	var $ELEMENT = '$element';

	var ELEMENTS_CACHE = '_elementsCache';
	var AUDIO_STATE = '_audioState';
	var MODEL_AUDIO_STATE = '_audioState';

	var SEL_RIGHT = '.ets-act-spc-r';
	var SEL_ASR = '.ets-act-spc-asr';
	var SEL_MEJS = '.mejs-container';
	var SEL_RECORD = '.ets-act-record';
	var SEL_TOOLTIP = '.ets-tooltip';
	var SEL_TOOLTIP_RECORD = '.ets-tooltip-green';
	var SEL_AP = '.ets-ap';
	var ICON_VALUE = '.glyphicon-volume-up';
	var AUDIO_INPUT = '.audio-input';
	var MODEL_AUDIO_INPUT = '.model-audio-input';
	var ASR_OUTPUT = '.asr-output';
	var CLS_AP_CONTAINER = 'ets-ap-con';
	var CLS_DISABLED = 'ets-disabled';

	var HUB_ASR_SETTING = 'asr/ui/setting';
	var HUB_ASR_STOP_PLAYBACK = 'asr/stopPlayback';
	var HUB_ASR_PLAYBACK = 'asr/startPlayback';
	var WIDGET_PATH_AUDIO_SHELL = 'school-ui-activity/shared/audio/audio-shell';

	var IS_CORRECT = '_isCorrect';


	function initChainFn() {
		var me = this;
		for (var i = 0, l = arguments.length; i < l; ++i) {
			arguments[i][0].call(me, arguments[i][1]);
		}
	}


	function findElem(selector) {
		var me = this;
		var $childElement = me[ELEMENTS_CACHE][selector];
		if ($childElement) { // cached elements always have length > 0
			return $childElement;
		}
		$childElement = me[$ELEMENT].find(selector);
		if ($childElement.length > 0) {
			me[ELEMENTS_CACHE][selector] = $childElement;
		}
		return $childElement;
	}

	function setupASR() {
		var me = this;
		me.publish(HUB_ASR_SETTING, function (result, guid) {
			showRecord.call(me, guid);
		}, {
			prons: '',
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

	function toggleAudioInTooltip(isShow) {
		var me = this;

		var $elem = findElem.call(me, [AUDIO_INPUT, SEL_TOOLTIP].join(' '));
		if ($elem.length === 0) {
			return;
		}

		if (isShow && !me._isOpen) {
			$elem.fadeIn();
		} else {
			$elem.fadeOut();
		}
	}

	function toogleModelAudioInButton(isActive) {
		var me = this;

		var $elem = findElem.call(me, SEL_MEJS);

		if ($elem.length === 0) {
			return;
		}

		if (!isActive) {
			$elem.addClass('mejs-disabled');
			$elem.find('.mejs-playpause-button').children().prop('disabled', true);
		} else {
			$elem.removeClass('mejs-disabled');
			$elem.find('.mejs-playpause-button').children().prop('disabled', false);
		}
	}


	function toggleASRTooltip(isShow) {
		var me = this;

		var $elem =findElem.call(me, [SEL_ASR, SEL_TOOLTIP].join(' '));

		if ($elem.length === 0) {
			return;
		}

		if (isShow) {
			$elem.fadeIn();
		} else {
			$elem.fadeOut();
		}
	}

	function toggleModelAudioInTooltip(isShow) {
		var me = this;

		var $elem = findElem.call(me, '.tooltip-volume-up');
		if ($elem.length === 0) {
			return;
		}

		if (!isShow) {
			$elem.delay(500).fadeOut();
		} else {
			$elem.delay(500).fadeIn();
		}
	}

	function togglePauseAudio(isPause) {
		var me = this;
		var $elem = findElem.call(me, '.icon-replay-audioin');
		if ($elem.length === 0) {
			return;
		}

		if (isPause) {
			$elem.addClass('please-pause');
		} else {
			$elem.removeClass('please-pause');
		}

	}

	function toggleReplyAudio(isActive) {
		var me = this;
		var $elem = findElem.call(me, '.icon-replay-audioin');
		if ($elem.length === 0) {
			return;
		}

		if (isActive) {
			$elem.removeClass('status-disabled');
		} else {
			$elem.addClass('status-disabled');
		}
	}

	function toggleRecordTooltip(isShow) {
		var me = this;

		//init selector
		var $elem = findElem.call(me, SEL_TOOLTIP_RECORD);
		if ($elem.length === 0) {
			return;
		}

		if (isShow) {
			$elem.fadeIn();
		} else {
			$elem.fadeOut();
		}
	}

	function recordSlideOut($el) {
		var me = this;

		var $asr = findElem.call(me, SEL_ASR);
		if ($asr.length === 0) {
			return;
		}

		$el.animate({
			'margin-left': -72,
			'opacity': 1
		}, 'slow', function () {
			toggleRecordTooltip.call(me, true);
			setTimeout(function () {
				toggleRecordTooltip.call(me, false);
			}, 5000);

			$asr.css({
				'z-index': 'auto'
			});
		});

		$asr.animate({
			'margin-left': -15
		}, 'slow');
	}

	function replaceRecord(guid) {
		var me = this;

		var $record = findElem.call(me, SEL_RECORD);
		var $asr = findElem.call(me, SEL_ASR);
		if ($record.length === 0 || $asr.length === 0) {
			return;
		}

		$record.animate({
			'margin-left': -41,
			'opacity': 0.5
		}, 'slow', function () {
			$(this).children('.' + CLS_AP_CONTAINER).remove();
			me._hasRecord = false;
			showRecord.call(me, guid);
		});

		$asr.css({
			'z-index': 1
		}).animate({
			'margin-left': -38
		}, 'slow');
	}

	function createNewRecord(guid) {
		var me = this;

		var $record = findElem.call(me, SEL_RECORD);
		if ($record.length === 0) {
			return;
		}

		$record.prepend('<div class="' + CLS_AP_CONTAINER + '"></div>'); //recordered audio

		var $container = me[$ELEMENT].find('.' + CLS_AP_CONTAINER);
		$container
			.unweave()
			.then(function () {
				return $container
					.data('option', {
						'_playHandler': function () {
							me.publish(HUB_ASR_PLAYBACK);
							toggleRecordTooltip.call(me, false);
							toggleReplyAudio.call(me, false);
							toogleModelAudioInButton.call(me, false);

						},
						'_pauseHandler': function () {
							me.publish(HUB_ASR_STOP_PLAYBACK);
							toggleReplyAudio.call(me, true);
						},
						'guid': guid
					})
					.attr('data-weave', WIDGET_PATH_AUDIO_SHELL + '(option)')
					.weave();
			})
			.then(function () {
				recordSlideOut.call(me, $record); //animate recorded audio

				me._hasRecord = true;
				me.items().answered(true);
			});
	}

	function showRecord(guid) {
		var me = this;
		if (me._hasRecord) {
			replaceRecord.call(this, guid);
		} else {
			createNewRecord.call(this, guid);
		}
	}

	function animateIcon() {
		var me = this;
		var t = 800;
		var $audio = findElem.call(me, AUDIO_INPUT);
		var $asr = findElem.call(me, ASR_OUTPUT);
		if ($audio.length === 0 || $asr.length === 0) {
			return;
		}

		$audio.find('.title').fadeOut();

		if (isIE() === 8) {
			$audio.find('.swing-container').fadeOut(t);
		} else {
			$audio.find('.swing-container').hide(t);//swing animation
			$audio.find('button').addClass('transform'); //css3 animation  only for moder browser
		}

		$asr.show({duration: t, easing: 'linear'});
	}

	function isIE() {
		var myNav = navigator.userAgent.toLowerCase();
		return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1]) : false;
	}

	function toggleIcon(isActive) {
		var me = this;

		var $elem = findElem.call(me, ICON_VALUE);
		if ($elem.length === 0) {
			return;
		}

		if (isActive) {
			$elem.addClass('active');
		} else {
			$elem.removeClass('active');
		}
	}

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {
		var me = this;
		me[ELEMENTS_CACHE] = {};
		return me.html(tTemplate, me._json)
			.tap(onRendered.bind(me));
	}

	function setASRstatus(state) {
		var me = this;
		me.publish('asr/ui/states/changed', state);

		var $elem = findElem.call(me, [SEL_RECORD, SEL_AP].join(' '));

		if ($elem.length === 0) {
			return;
		}

		if (state === 'DISABLE') {
			$elem.addClass(CLS_DISABLED);
			toggleRecordTooltip.call(me, false);
		} else {
			$elem.removeClass(CLS_DISABLED);
		}
	}


	function onRendered() {
		var me = this;

		var $modelAudioContainer = me[$ELEMENT].find(MODEL_AUDIO_INPUT).find(SEL_MEJS);
		$modelAudioContainer.find('.mejs-volume-button').remove();
		$modelAudioContainer.find('.mejs-horizontal-volume-slider').remove();

		var audioContainer = me[$ELEMENT].find(AUDIO_INPUT).find(SEL_MEJS);
		audioContainer.find('.mejs-time').remove();
		audioContainer.find('.mejs-time-rail').remove();
		audioContainer.find('.mejs-volume-button').remove();
		audioContainer.find('.mejs-horizontal-volume-slider').remove();

		//init ASR
		setupASR.call(me);
	}

	// ## Constructor
	function Ctor() {
		var me = this;

		me.type(2);

		me._hasRecord = false;
		me._isOpen = false;
		me._state = '';

		me[ELEMENTS_CACHE] = {};
		me[AUDIO_STATE] = null;
		me[MODEL_AUDIO_STATE] = null;
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/stop': function onStop() {
			var me = this;
			me[ELEMENTS_CACHE] = {};

			// Stop the record if leave the activity
			var $record = me[$ELEMENT].find('.' + CLS_AP_CONTAINER);

			me.publish(HUB_ASR_STOP_PLAYBACK);
			return $record.unweave();
		},


		'hub/asr/ui/states/changed': function (state) {
			var me = this;
			me._state = state;

			if (state === 'PREPARING') {
				initChainFn.call(me, [toggleRecordTooltip, false], [toggleASRTooltip, false], [toggleReplyAudio, false]);
			}

			if (state === 'WARNING' || state === 'ERROR' || state === 'DOWN') {
				toggleASRTooltip.call(me, false);
			}

			if (state === 'RECORDING') {
				toogleModelAudioInButton.call(me, false);
			}

			if (state === 'PROCESSING') {
				toggleReplyAudio.call(me, true);
			}

			if (state === 'PREPARING' || state === 'DISABLE') {
				toggleIcon.call(me, false);
			}

			if (state === 'NORMAL') {
				initChainFn.call(me, [toogleModelAudioInButton, true], [toggleReplyAudio, true], [toggleIcon, true]);
			}
		},

		'hub/activity/epaper/expanding': function () {
			var me = this;
			initChainFn.call(me, [toggleIcon, false], [toggleASRTooltip, false], [toggleModelAudioInTooltip, false]);
		},

		'hub/activity/epaper/folding': function () {
			var me = this;
			initChainFn.call(me, [toggleIcon, true], [toggleModelAudioInTooltip, true], [toggleRecordTooltip, false]);

			if (me._state !== 'RECORDING') {
				toggleASRTooltip.call(this, true);
			}
		},

		'hub/rating/sourceType': function () {
			return [ratingSouceType['ASR_SPEAKING']];
		},

		'hub/audio/shell/play/complete': function (/*guid*/) {
			var me = this;
			toggleReplyAudio.call(me, true);
		},

		'dom:.js-toggle/click': function(event) {
			var me = this;
			var $button = $(event.currentTarget);
			if (!$button.hasClass('active')) {
				return;
			}

			var $modelPlayer = findElem.call(this, [MODEL_AUDIO_INPUT, SEL_AP].join(' '));
			findElem.call(me, SEL_RIGHT).animate(
				{'margin-left': !me._isOpen ? 453 : 0},
				{
					'duration': 'slow',
					'complete': function () {
						me._isOpen = !me._isOpen;

						if (me._isOpen) {
							$modelPlayer.trigger('player/play');
							toggleAudioInTooltip.call(me, false);
						} else {
							if (me._state !== 'RECORDING') {
								$modelPlayer.trigger('player/pause');
							}
							toggleAudioInTooltip.call(me, true);
						}

						toggleModelAudioInTooltip.call(me, !me._isOpen);

					}
				}
			);
		},
		'dom:.icon-replay-audioin/click': function (event) {
			var $button = $(event.currentTarget);
			if ($button.hasClass('status-disabled')) {
				return;
			}

			var $player = findElem.call(this, [AUDIO_INPUT, SEL_AP].join(' '));
			if ($button.hasClass('please-pause')) {
				$player.trigger('player/pause');
			} else {
				$player.trigger('player/play');
			}
		},
		'dom:.model-audio-input .ets-ap/media/play': function (event) {
			var me = this;
			me[MODEL_AUDIO_STATE] = e['type'];
			initChainFn.call(me, [setASRstatus, 'DISABLE'], [toggleASRTooltip, false], [toggleRecordTooltip, false])
		},
		'dom:.model-audio-input .ets-ap/media/pause': function (event) {
			var me = this;
			me[MODEL_AUDIO_STATE] = e['type'];
			setASRstatus.call(me, 'NORMAL');

			setTimeout(function () {
				//if the next event for audio-in not play, then appeat tooltip
				toggleASRTooltip.call(me, me[AUDIO_STATE] !== 'play');
			}, 0);
		},
		'dom:.model-audio-input .ets-ap/media/ended': function (event) {
			var me = this;
			me[MODEL_AUDIO_STATE] = e['type'];
			initChainFn.call(me, [setASRstatus, 'NORMAL'], [toggleASRTooltip, true]);
		},
		'dom:.audio-input .ets-ap/media/play': function (event) {
			var me = this;
			me[AUDIO_STATE] = event['type'];
			initChainFn.call(me, [setASRstatus, 'DISABLE'], [toggleIcon, false], [toggleModelAudioInTooltip, false], [toggleASRTooltip, false], [togglePauseAudio, true], [toggleAudioInTooltip, false]);
		},
		'dom:.audio-input .ets-ap/media/pause': function (event) {
			var me = this;
			me[AUDIO_STATE] = event['type'];
			initChainFn.call(me, [setASRstatus, 'NORMAL'], [toggleIcon, true], [toggleModelAudioInTooltip, true], [togglePauseAudio, false]);

			setTimeout(function () {
				//if the next event 'ended', dont appear tooltip
				toggleAudioInTooltip.call(me, me[AUDIO_STATE] !== 'ended');
			}, 0);

			setTimeout(function () {
				//if the next event for model-audio not play, then appeat tooltip
				toggleASRTooltip.call(me, me[MODEL_AUDIO_STATE] !== 'play')
			}, 0);
		},
		'dom:.audio-input .ets-ap/media/ended': function (event) {
			var me = this;
			me[AUDIO_STATE] = event['type'];
			initChainFn.call(me, [setASRstatus, 'NORMAL'], [toggleASRTooltip, true], [toggleIcon, true], [toggleModelAudioInTooltip, true], [togglePauseAudio, false], [toggleAudioInTooltip, false], [animateIcon, null])
		}
	};

	return Widget.extend(Ctor, methods);
});
