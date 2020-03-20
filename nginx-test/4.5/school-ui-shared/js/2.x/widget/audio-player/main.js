define([
	'jquery',
	'when',
	'logger',
	"../../utils/performance",
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check",
	'school-ui-shared/utils/media',
	'school-ui-shared/utils/hub-memory',
	'school-ui-shared/utils/location-helper',
	'school-ui-shared/utils/audio-output',
	'mediaelement-and-player'
], function audioPlayerModule($,
                              when,
                              Logger,
                              performanceUtils,
                              Widget,
                              browserCheck,
                              Media,
                              HubMemory,
                              LocationHelper,
                              AudioOutput,
                              mejs) {
	"use strict";

	var $ELEMENT = '$element';

	var SEL_CONTAINER = '.mejs-container';
	var SEL_BTN_PLAY = '.mejs-play';

	var CLS_CONTROLS_PLAYING = 'mejs-controls-playing';

	var EVENTS_TO_FORWARD = [
		'play', 'playing', 'pause', 'ended'
	];
	var FORWARDED_EVENT_PREFIX = 'media/';
	var MODE_NATIVE = "native";

	var blankAudio = 'data:audio/mpeg;base64,SUQzAwAAAAAAI1RTU0UAAAAPAAAATGF2ZjU3LjQxLjEwMAAAAAAAAAAAAAAA/+NAwAAAAAAAAAAAAEluZm8AAAAPAAAABwAABoYAPz8/Pz8/Pz8/Pz8/Pz9fX19fX19fX19fX19fX39/f39/f39/f39/f39/n5+fn5+fn5+fn5+fn5+fv7+/v7+/v7+/v7+/v7/f39/f39/f39/f39/f3///////////////////AAAAAExhdmM1Ny40OAAAAAAAAAAAAAAAACQAAAAAAAAAAAaGYncOXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/jQMQAAAADSAAAAABMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/40LEOwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jQsQ7AAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+NCxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/40LEOwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jQsQ7AAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+NCxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

	var logIdGenerator = 1000;

	function mediaPlayerLog(message) {
		var me = this;
		var mode = me.audioInstance ? me.audioInstance.media.pluginType : 'unknown';
		var finalMessage = me._logPrefix + ' mode=' + mode + ' ' + message;
		Logger.log(finalMessage);
	}

	function mediaPlayerLogAudioOutput(message) {
		var me = this;
		var logPrefix = me._logPrefix;
		var mode = me.audioInstance ? me.audioInstance.media.pluginType : 'unknown';

		var promiseHasAudioOutput = AudioOutput.hasAudioOutput()
		.then(function (result) {
			return 'HasOutput=' + result;
		})
		.otherwise(function (error) {
			return 'FailedToGetOutput=' + (error.message || String(error)).replace(/\s+/g, '_');
		});

		var promiseCanPlayAudio = AudioOutput.canPlayAudio()
		.then(function (result) {
			return 'CanPlayMedia=' + result;
		})
		.otherwise(function (error) {
			return 'FailedToPlayMedia=' + (error.message || String(error)).replace(/\s+/g, '_');
		});

		when.all([promiseHasAudioOutput, promiseCanPlayAudio]).spread(function (hasAudioOutput, canPlayAudio) {
			var finalMessage = logPrefix + ' mode=' + mode + ' ' + hasAudioOutput + ' ' + canPlayAudio + ' ' + message;
			Logger.log(finalMessage);
		});
	}

	function bindMediaElement(mediaElement, domElement, player) {
		function _onStartPlay() {
			me.publish('audio/event/play', mediaElement);
			player.controls.addClass(CLS_CONTROLS_PLAYING);
		}

		function _onStopPlay(){
			player.controls.removeClass(CLS_CONTROLS_PLAYING);
		}

		var me = this;
		var $domElement = $(domElement);

		mediaElement.addEventListener('play', _onStartPlay);
		mediaElement.addEventListener('pause', _onStopPlay);
		mediaElement.addEventListener('ended', _onStopPlay);

		EVENTS_TO_FORWARD.forEach(function (eventName) {
			// var listener = $domElement.trigger.bind($domElement, FORWARDED_EVENT_PREFIX + eventName);
			var listener = function () {
				$domElement.trigger(FORWARDED_EVENT_PREFIX + eventName);
			};
			mediaElement.addEventListener(eventName, listener, false);
		});

		var onError = function (e) {
			if (me._preloadFix) {
				return;
			}

			var message = e.message || Media.findErrorName(mediaElement.error) || String(e);
			var url = e.src || me._audioUrl || '';

			//for Frontend log
			var mode = mediaElement.pluginType || "";
			Logger.log("Error loading audio " + mode + " for " + url + ": " + message);

			//for Media log
			var perfLog = performanceUtils.getLogMessage();
			if (perfLog) {
				mediaPlayerLog.call(me, 'Error.Media.Perfs ' + perfLog);
			}
			mediaPlayerLogAudioOutput.call(me, 'Error.Media ' + message);
		};
		mediaElement.addEventListener('error', onError, false);
	}

	function initPlayer() {
		var me = this;
		var customOptions = $.extend(true, {}, me._audioOptions);

		//init mep
		var audio = me[$ELEMENT].get(0);
		if (!audio.src) {
			me._preloadFix =
				(browserCheck.browser === 'msie' && parseInt(browserCheck.version) > 9 ) ||
				browserCheck.browser === 'edge';

			if (me._preloadFix) {
				audio.src = blankAudio;
			}
			else {
				audio.src = audio.attributes['data-src'].value;
			}
		}

		return (me._finalized ?
				when.resolve() :
				initMediaelementPlayer.call(me, customOptions)
		).catch(function (ex) {
			ex.player && ex.player.controls && ex.player.controls.show();

			var message = 'Error.Init ';
			if (ex.canPlayType) {
				message += 'CanPlayType=' + ex.canPlayType('audio/mpeg');
			}
			else if (ex.error) {
				message += ex.error;
			}
			else if (ex.message) {
				message += ex.message;
			}
			else {
				message += String(ex);
			}
			me._logDefer.resolver.resolve(message);
			throw ex;
		});
	}

	function wrapPlayToHandleRejection(play) {
		return function playWithHandledRejection() {
			var mediaElement = this;
			var promise = play.apply(mediaElement, arguments);
			if (promise) {
				when(promise).catch(function (error) {
					if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
						if (error.code === DOMException.ABORT_ERR) {
							// ignore
							return;
						}
					}
					var nodes = [mediaElement].concat(
						Array.prototype.slice.call(mediaElement.querySelectorAll('source')));
					var src = nodes.map(function (node) {
						return node.src;
					}).join(', ');
					Logger.log('Audio play() exception: ' + String(error) + '\n' + src);
				});
			}
			return promise;
		};
	}

	function initMediaelementPlayer(customOptions) {
		var me = this;

		return when.promise(function (resolve, reject) { //handle exceptions
			me.audioInstance = new mejs.MediaElementPlayer(me[$ELEMENT].get(0), {
				mode: MODE_NATIVE,
				plugins: [],
				pauseOtherPlayers: (typeof customOptions.pauseOtherPlayers === 'boolean' ? customOptions.pauseOtherPlayers : true),
				alwaysShowControls: (typeof customOptions.alwaysShowControls === 'boolean' ? customOptions.alwaysShowControls : true),
				playpauseText: '',
				success: function (mediaElement, domElement, player) {
					mediaElement.play = wrapPlayToHandleRejection(mediaElement.play);

					var $domElement = $(domElement);
					$domElement.closest(SEL_CONTAINER).css("display", "inline-block");

					if (me._preloadFix) {
						me[$ELEMENT].closest(SEL_CONTAINER).find(SEL_BTN_PLAY).one('click', me._onFirstTimePlay = function onFirstTimePlay(e) {
							me._preloadFix = false;
							e.stopImmediatePropagation();
							var src = $domElement.data("src");
							me._audioUrl = src;
							updateLogPrefix.call(me);

							mediaElement.pause();
							mediaElement.setSrc(src);
							mediaElement.play();
						});
					}

					bindMediaElement.call(me, mediaElement, domElement, player);

					me._logDefer.resolver.resolve();

					resolve();
				},
				error: reject
			});
		});
	}

	function updateLogPrefix() {
		var me = this;
		var $el = me[$ELEMENT];

		var course = HubMemory.readMemory('load/course');
		var level = HubMemory.readMemory('load/level');
		var activity = HubMemory.readMemory('load/activity');
		var activityOption = $el.closest('.ets-act-bd-activity').data('option');
		var activityContent = activityOption && activityOption.activityContent;

		var courseTypeCode = course && course.courseTypeCode || '';
		var levelId = level && (level.templateLevelId || level.id) || '';    //templateLevelId for platform 2, id for platform 1
		var levelCode = level && (level.levelCode || level.levelNo) || '';
		var activityId = activity && (activity.templateActivityId || activity.id) || '';    //templateActivityId for platform 2, id for platform 1
		var activityTemplateCode = activityContent && activityContent.templateCode || '';
		var mediaUrl = me._audioUrl.replace(/ /g, '%20');
		var browser = browserCheck.browser + '/' + parseInt(browserCheck.actualVersionOfCompatibility || browserCheck.version, 10);
		if (!me._logid) {
			me._logid = (new Date().getTime()) + '.' + (logIdGenerator++);
		}

		me._logPrefix = [
			'NewMediaPlayer audio',
			'courseTypeCode=' + courseTypeCode,
			'level=' + levelId,
			'levelCode=' + courseTypeCode + '_' + levelCode,
			'activity=' + activityId,
			'activityType=' + activityTemplateCode,
			'url=' + mediaUrl,
			'browser=' + browser,
			'logid=' + me._logid
		].join(' ');
	}

	return Widget.extend(function () {
		var me = this;
		me._finalized = false;
		me._audioOptions = me[$ELEMENT].data();
		me._audioUrl = me[$ELEMENT].data('src') || me[$ELEMENT].get(0).src;
		me.audioInstance = null;
		updateLogPrefix.call(me);

		me._preloadFix = false;

		me._logDefer = when.defer();
		me._logDefer.promise.then(function (message) {
			message && mediaPlayerLog.call(me, message);
		});
	}, {
		"sig/start": function onStart() {
			var me = this;
			return initPlayer.call(me);
		},
		'sig/stop': function () {
			var me = this;
			me._finalized = true;
			me.audioInstance.pause();
			me.audioInstance = null;
		},

		"hub/audio/event/play": function (sourceMediaElement) {
			var me = this;

			// on another audio-player plays
			if (me.audioInstance
				&& sourceMediaElement !== me.audioInstance.media
				&& me.audioInstance.media.currentTime > 0
			) {
				// force reset current time to match previous behaviour
				me.audioInstance.media.setCurrentTime(0);
				me.audioInstance.media.pause();
			}
		},

		"dom/player/play": function play($event, src) {
			var me = this;
			if (me.audioInstance) {
				if (src) {
					if (me._preloadFix) {
						me._preloadFix = false;
						me._onFirstTimePlay && me[$ELEMENT].closest(SEL_CONTAINER).find(SEL_BTN_PLAY).unbind('click', me._onFirstTimePlay);
					}

					me._audioUrl = src;
					updateLogPrefix.call(me);

					me.audioInstance.media.pause();
					me.audioInstance.media.setSrc(src);
					me.audioInstance.media.load();
				}
				me.audioInstance.media.play();
			}
		},
		"dom/player/pause": function pause() {
			var me = this;
			if (me.audioInstance) {
				me.audioInstance.media.pause();
			}
		},
		"dom/player/seek": function seek($event, seekedTime) {
			var me = this;
			if (me.audioInstance) {
				var paused = me.audioInstance.media.paused;
				me.audioInstance.media.setCurrentTime(seekedTime);
				if (paused) {
					me.audioInstance.media.pause();
				}
			}
		},
		"dom/player/end": function end() {
			var me = this;
			if (me.audioInstance) {
				me.audioInstance.media.setCurrentTime(0);
				me.audioInstance.media.pause();
			}
		},
		"dom/player/volume": function setVolume($event, volumeInfo) {
			var me = this;
			if (me.audioInstance) {
				me.audioInstance.media.setVolume(volumeInfo.volume);

				if (typeof volumeInfo.muted === 'boolean') {
					me.audioInstance.media.setMuted(volumeInfo.muted);
				}
			}
		}
	});
});
