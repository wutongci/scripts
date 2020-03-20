define([
	'require',
	'jquery',
	'when',
	'troopjs-ef/component/service',
	'school-ui-shared/utils/browser-check',
	'school-ui-activity/util/ccl-cache-server',
	'./asr-logger'
], function (
	require,
	$,
	when,
	Service,
	browserCheck,
	CCL_CACHE_SERVER,
	ASRLogger
) {
	var CONTAINER = '_asrFlashContainer';
	var RECORDER = '_recorder';

	var FLASH_CONTAINER_ID = 'ets-asr-recorder';
	var CLS_RECORDER = 'asr-recorder';
	var SEL_RECORDER = '#asr-recorder';

	var FLASH_HIDDEN_WIDTH = "500", FLASH_HIDDEN_HEIGHT = "500";

	var CCL_ASR_NON_STREAMING_FLASH_RELATIVE_PATH = 'ccl!"school.serverasr.nonstreaming.flash.relativepath"';

	var	TOPIC_ASR_SUCCESS = "asr/record/success";
	var	TOPIC_ASR_FAIL = "asr/record/failed";
	var	TOPIC_ASR_PLAYBACK_STATUS_CHANGED = "asr/playback/status/changed";

	function getCacheServer() {
		var me = this;
		return me.query(CCL_CACHE_SERVER).spread(function (cclCacheServer) {
			return cclCacheServer && cclCacheServer.value || '';
		});
	}

	function getFlashRelativePath() {
		var me = this;
		return me.query(CCL_ASR_NON_STREAMING_FLASH_RELATIVE_PATH)
			.spread(function (flashRelativePathCcl) {
				return flashRelativePathCcl && flashRelativePathCcl.value;
			});
	}

	function requireSwfObject() {
		return when.promise(function (resolve) {
			require(['swfobject'], resolve);
		});
	}

	function initServerFlashAsr($container) {
		var me = this;

		var ASR = window.ASR = window.ASR || {};

		/**
		 * ASR recording proxy hub used to handle events callback from flash
		 */
		ASR.asrHubProxy = function () {
			var args = [].slice.call(arguments, 0);
			if (args.length) {
				// TODO: this hub name is confusing, as it really
				// meant to hanle a "recording status" notification (failure, error, etc),
				// instead of saying the recording is *really* success
				me.publish(TOPIC_ASR_SUCCESS, args);
			} else {
				me.publish(TOPIC_ASR_FAIL);
			}
		};

		/*
		 * New method for new Server ASR recording flow, in the new flow there have a client mode,
		 * that means when ASR playback don't need send request.
		 *  @param {String} status is ASR player internal status
		 */
		ASR.playStatusCallback = function (status) {
			me.publish(TOPIC_ASR_PLAYBACK_STATUS_CHANGED, status);
		};

		return when.all([
			getCacheServer.call(me),
			getFlashRelativePath.call(me),
			requireSwfObject()
		]).spread(function (cacheServer, flashRelativePath, swfobject) {
			$container.append($('<div></div>', { id: FLASH_CONTAINER_ID }));

			var initFunctionName = 'asrRecorderInit';
			var promise = when.promise(function(resolve){
				window[initFunctionName] = resolve;
			});

			var swfversionstr = "10.0.0",
				xiswfurlstr = "playerproductinstall.swf",
				flashvars = {
					init: initFunctionName
				},
				params = {},
				attributes = {};

			var flashUrl = cacheServer + flashRelativePath;
			/**
			 *  In IE, we have a known SPC-2568, if flash file is cached,
			 *  then the recorder re-init will always failed.
			 */
			if (browserCheck.browser === 'msie') {
				flashUrl += '?' + (+new Date);
			}

			//create flash for record
			//for version detection, set to min. required flash player version, or 0 (or 0.0.0), for no version detection.
			params.quality = "high";
			params.bgcolor = "#ffffff";
			params.allowscriptaccess = "always";
			params.allowfullscreen = "true";
			params.allowDomain = "true";
			params.wmode = "transparent";
			attributes.id = CLS_RECORDER;
			attributes.name = CLS_RECORDER;
			attributes.align = "middle";
			swfobject.embedSWF(
				flashUrl,
				FLASH_CONTAINER_ID,
				FLASH_HIDDEN_WIDTH, FLASH_HIDDEN_HEIGHT,
				swfversionstr,
				xiswfurlstr,
				flashvars,
				params,
				attributes,
				function flashCb(event) {
					me[RECORDER] = event.ref;
				});
			//javascript enabled so display the flashcontent div in case it is not replaced with a swf object. -->
			swfobject.createCSS(SEL_RECORDER, "display:block;text-align:left;");
			//end flash for record

			return promise;
		})
			.otherwise(function (e) {
				ASRLogger.log("Server ASR Exception:" + (e && e.stack) || e);
				throw e;
			});
	}

	return Service.extend({
		'sig/start': function () {
			return initServerFlashAsr.call(this, this[CONTAINER]);
		},
		setContainer: function (container) {
			this[CONTAINER] = container;
		},
		getRecorder: function() {
			return this[RECORDER];
		},
		"hub/asr/flash/init/append-to": function ($container) {
			var me = this;
			if ($container) {
				me[CONTAINER].find(SEL_RECORDER).remove();
				$container.append('<div id="ets-asr-recorder"></div>');
				initServerFlashAsr.call(me, $container);
			}
		}
	});
});
