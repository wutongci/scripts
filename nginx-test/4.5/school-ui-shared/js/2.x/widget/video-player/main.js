define([
	"when",
	"logger",
	"../../utils/performance",
	"mediaelement-plugin-ef",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/browser-check",
	"school-ui-shared/utils/media",
	"school-ui-shared/utils/hub-memory",
	"school-ui-shared/utils/location-helper",
	"template!./video-player.html"
], function videoPlayerModule(
	when,
	Logger,
	performanceUtils,
	mejs,
	Widget,
	browserCheck,
	Media,
	HubMemory,
	LocationHelper,
	tTemplate
) {
	"use strict";

	var $ELEMENT = "$element";
	var $ = mejs.$;

	var CLS_VP_PLAYED = "ets-vp-played";

	var SEL_VP = ".ets-vp";
	var SEL_OVERLAY_PLAY = ".mejs-overlay-play";
	var SEL_CONTROLS_BUTTON_PLAYPAUSE = "mejs-controls .mejs-playpause-button";
	var SEL_CONTAINTER = ".mejs-container";

	var ME_DEFAULT_FEATURES_BEFORE = ["playpause", "current", "progress", "duration", "IgnoreKeyEvent"];
	var ME_DEFAULT_FEATURES_AFTER = ["volume"];

	var MODE_NATIVE = "native";

	var logIdGenerator = 1000;

	function mediaPlayerLog(message) {
		var me = this;
		var mode = (me.videoInstance && me.videoInstance.media) ? me.videoInstance.media.pluginType : 'unknown';
		var finalMessage = me._logPrefix + ' mode=' + mode + ' ' + message;
		Logger.log(finalMessage);
	}

	function initPlayer() {
		var me = this;
		var customOptions = $.extend(true, {}, me._options);

		//init mep
		var translationPromise = getTranslations.call(me);
		var renderPromise = me.html(tTemplate, me._videoInfo);

		return when.all([
			translationPromise,
			renderPromise
		]).spread(function (translations) {
			return me._finalized ?
				when.resolve() :
				initMediaelementPlayer.call(me, customOptions, translations, me._onSuccess);
		}).catch(function (ex) {
			ex.player && ex.player.controls && ex.player.controls.show();

			var message = 'Error.Init ';
			if (ex.canPlayType) {
				message += 'CanPlayType=' + ex.canPlayType('video/mp4');
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
					Logger.log('Video play() exception: ' + String(error) + '\n' + src);
				});
			}
			return promise;
		};
	}

	function initMediaelementPlayer(customOptions, translations, cbOnSuccess) {
		var me = this;

		return when.promise(function (resolve, reject) { //handle exceptions
			var videoOptions = {
				mode: MODE_NATIVE,
				plugins: [],
				pauseOtherPlayers: (typeof customOptions.pauseOtherPlayers === 'boolean' ? customOptions.pauseOtherPlayers : true),
				alwaysShowControls: true,
				startVolume: 0.8,
				success: function (mediaElement, domElement, player) {
					mediaElement.play = wrapPlayToHandleRejection(mediaElement.play);

					var $container = $(domElement).closest(SEL_CONTAINTER);

					//add attribute data-at-id for automation testing
					var $playButton = $container.find(SEL_OVERLAY_PLAY);
					$playButton.attr("data-at-id", "btn-video-start");

					var $playPauseButton = $container.find(SEL_CONTROLS_BUTTON_PLAYPAUSE);
					$playPauseButton.attr("data-at-id", "btn-video-playpause");

					mediaElement.addEventListener("error", function (e) {
						var message = e.message || Media.findErrorName(mediaElement.error) || String(e);
						var url = e.src || (me._videoInfo.video && me._videoInfo.video.url) || '';

						//for Frontend log
						var mode = mediaElement.pluginType || "";
						Logger.log("Error loading video " + mode + " for " + url + ": " + message);

						//for Media log
						var perfLog = performanceUtils.getLogMessage();
						if (perfLog) {
							mediaPlayerLog.call(me, 'Error.Media.Perfs ' + perfLog);
						}
						mediaPlayerLog.call(me, 'Error.Media ' + message);
					}, false);

					mediaElement.addEventListener('play', function handleFirstPlay() {
						me[$ELEMENT].addClass(CLS_VP_PLAYED);
						mediaElement.removeEventListener('play', handleFirstPlay);
					}, false);

					me._logDefer.resolver.resolve();

					cbOnSuccess && cbOnSuccess.apply(me, arguments);

					resolve();
				},
				error: reject
			};

			customOptions.features = ME_DEFAULT_FEATURES_BEFORE.concat(customOptions.features || []).concat(ME_DEFAULT_FEATURES_AFTER);

			me.videoInstance = new mejs.MediaElementPlayer(
				me[$ELEMENT].find(SEL_VP)[0],
				$.extend({}, videoOptions, customOptions, translations)
			);
		});
	}

	function getTranslations() {
		var me = this;

		var translations = {
			playpauseText: '470485',
			muteText: '469863',
			tracksText: '469864',
			fullscreenText: '470489',
			qualityText: '469865',
			tracksOnText: '480847',
			tracksOffText: '480848',
			outOfTimeRangeText: '468588'
		};

		var blurbPrefix = "blurb!";
		var translationNames = Object.keys(translations);
		var blurbIds = [];

		translationNames.forEach(function (name, index) {
			//use keys[index] instead of key.push to make code easier to understand
			blurbIds[index] = blurbPrefix + translations[name];
		});

		return me.query(blurbIds).then(function (blurbs) {
			blurbs.forEach(function (blurb, index) {
				translations[translationNames[index]] = blurb.translation;
			});
			return translations;
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
		var mediaUrl = me._videoInfo.video && me._videoInfo.video.url.replace(/ /g, '%20') || '';
		var browser = browserCheck.browser + '/' + parseInt(browserCheck.actualVersionOfCompatibility || browserCheck.version, 10);
		if (!me._logid) {
			me._logid = (new Date().getTime()) + '.' + (logIdGenerator++);
		}

		me._logPrefix = [
			'NewMediaPlayer video',
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

	return Widget.extend(
		/**
		 * Constructor
		 * @param {Object}    $el
		 * @param {Object}    module
		 * @param {Object}    videoInfo (video, scripts, stopPoints)
		 * @param {Function}  onSuccess
		 * @param {Object}    options
		 */
		function Ctor($el, module, videoInfo, options, onSuccess) {
			var me = this;
			me._videoInfo = videoInfo;
			me._onSuccess = onSuccess;
			me._options = options;
			me._finalized = false;
			me.videoInstance = null;
			updateLogPrefix.call(me);

			me._logDefer = when.defer();
			me._logDefer.promise.then(function (message) {
				message && mediaPlayerLog.call(me, message);
			});
		}, {
			"sig/start": function onStart() {
				var me = this;
				initPlayer.call(me);
			},
			"sig/stop": function () {
				var me = this;
				me._finalized = true;
				if (me.videoInstance) {
					me.videoInstance.pause();
					me.videoInstance.remove();
					me.videoInstance = null;
				}
			},
			"play": function () {
				var me = this;
				me.videoInstance.media.play();
			}
		});
});
