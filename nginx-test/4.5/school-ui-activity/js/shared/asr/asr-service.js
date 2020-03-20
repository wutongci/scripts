/* global ActiveXObject */
/**
 *   ASR Service Widget
 *   ASR is taken as a type of service to external,
 *   the responsiblity of this widget is to supply a uniform
 *   recorder API for different type of ASR engine, like:
 *    Local, Server.
 */
define([
	'module',
	'jquery',
	'when',
	'troopjs-ef/component/service',
	"troopjs-core/pubsub/hub",
	"school-ui-shared/utils/typeid-parser",
	'json2',
	'school-ui-shared/utils/browser-check',
	'./asr-states',
	'./asr-ui-states',
	'./asr-blurbs',
	'./asr-config',
	'./asr-logger',
	'./asr-trace',
	'./asr-trace-event-type',
	'./asr-service-failed-type',
	'./asr-service-message-type',
	'underscore'
], function ASRServiceModule(
	module,
	$,
	when,
	Service,
	Hub,
	TypeIdParser,
	JSON,
	browserCheck,
	FlashStates,
	UIStates,
	ASRBlurbs,
	ASRConfig,
	ASRLogger,
	ASRTrace,
	ASRTraceType,
	ASRFailedType,
	MSGType,
	_
) {
	"use strict";

	/*
	 * Constant variables
	 */
	var CCL_ASR_KEY = 'ccl!"school.AsrServerAddress"',
		currState,
		WARNING_TICK = 5000,
		WARNING_TIMEOUT,
		asrFailedTypes = {},
		undef;

	var SETTINGS = {
		flv: undef,
		recordMaxLength: 600000, // the max recording length is 10mins
		autostopTime: 5, //measured as seconds
		micGain: 80, //asr volume
		silenceLevel: 5, //Audio threshold
		asrServerAddress: "rtmp://speechtest.englishtown.com:1935/asrstreaming",
		asrServerResultUrl: '/asr/Evaluate.ashx', // server evluation service
		activityId: "",
		memberId: "",
		disableScoreRecording: false, // don't send recording to server for scoring

		/*Local ASR Setting*/
		beforeDelay: 5, // number of seconds (integer) to wait before start speaking
		afterDelay: 2, //number of seconds (integer) to wait after finish speaking
		level: 60, //silence level (dB) to activate actual recording(0~96)
		length: 600, //max number of seconds for recording
		asrThreshold: 70
	};

	var callbacks = {},
		source = {},

		currGUID,

		TOPIC_ASR_SERVICE_START = "asr/service/started",
		TOPIC_ASR_UI = "asr/ui/states/changed",
		TOPIC_UI = "asr/ui/",
		TOPIC_AUDIO_PLAY_COMPLETE = "audio/shell/play/complete",
		ASRTHRESHOLD_SETTING = "ccl!'school.asr.threshold.setting'";

	/**
	 * Transform XML document to jQuery dom elment
	 * @param {Object} xml is XMLDocument
	 * @returns {Object} jQuery Dom
	 */

	function xmlToJDom(xml) {
		if (!xml) {
			return $;
		}

		if (browserCheck.browser === "msie" && parseInt(browserCheck.version, 10) <= 9 && Object.prototype.toString.call(xml) === "[object String]") {
			var doc = new ActiveXObject('Microsoft.XMLDOM');
			doc.async = 'false';
			doc.loadXML(xml);
			return $(doc);
		} else {
			return $(xml);
		}
	}

	/**
	 * ASR msg code mapping from error number to error string
	 * @param {Number} errorCode is error code number
	 * @returns {String} error string
	 */

	function getMessageCode(errorCode) {
		// PC ASR version 4.3 support errorCode,
		// other early version didn't return errorCode.
		// It returns error message, goto default error handling.
		var asrErrCdMapping = {
			80: 'NO_VOICE',
			3: 'VOICE_TOO_SLOW',
			4: 'VOICE_TOO_FAST',
			5: 'VOICE_TOO_LOW',
			85: 'VOICE_TOO_LOW', //the same ad '5',
			6: 'VOICE_TOO_HIGH',
			86: 'VOICE_TOO_HIGH',//the same ad '6',
			7: 'CAN_NOT_RECOGNIZE',
			8: 'CAN_NOT_RECOGNIZE'
		};

		var result,
			errCode = parseInt(errorCode, 10);

		if (errCode) {
			result = asrErrCdMapping[errCode] && MSGType[asrErrCdMapping[errCode]] ?
				MSGType[asrErrCdMapping[errCode]] :
				"SERVER_ERROR";
		}

		return result;
	}

	/**
	 * Util function used to publish ASR warning message.
	 * @param {String} context troop component
	 * @param {String} topic
	 * @param {String} msg is warning message
	 * @returns
	 */
	function messagePublishProxy(context, type, topic, msg) {
		context.publish(TOPIC_UI + type, topic, msg);
	}

	/**
	 * Pre-process origin data to ASR understandable type
	 * @param {Object} data is source data from Activity
	 * @returns {Array} processed data
	 */

	function preProcess(data) {
		if (!data) {
			return;
		}

		var propertiesToProcess = [
				/*language comparasion*/
				"text",
				/*
				 Roleplay have special structure:
				 {
				 pronsXML: "...",
				 options: {
				 txt: '...
				 }
				 },

				 So currently ASR can not do pre-process.
				 */
				/*FlashCard Excise*/
				"txt"
			],
			ret;

		propertiesToProcess.forEach(function (propertyKey) {
			if (data[propertyKey]) {
				ret = data[propertyKey].replace(/-/g, " - ").replace(/\s+/g, " ").split(" ");
				return false;
			}
		});

		return ret;
	}

	/**
	 * Deep clone a data from a Object
	 * @param {Object} data
	 * @returns {Object} is a cloned data
	 */

	function clone(data) {
		return JSON.parse(JSON.stringify(data));
	}

	/**
	 * Process and compare ASR results before callback Acitivity
	 * @param {Object} data is ASR recognized results
	 * @param {Boolean} hasError to indicate ASR recgonized success or not
	 * @returns
	 */

	function asrCallBackProxy(data, hasError) {
		var _result = clone(data),
			txt = source[currGUID],
			callback = callbacks[currGUID];

		if (txt) {
			if (_result.length === 0) {
				txt = txt.join(" ").replace(/\s{1}-\s{1}/g, "-").split(" ");
				var _sentence = {
					sentence: txt.join(" "),
					score: 0,
					words: []
				};
				for (var i = 0; i < txt.length; i++) {
					_sentence.words.push({
						word: txt[i],
						score: 0
					});
				}
				_result.push(_sentence);
			} else {
				_result[0].sentence = txt.join(" ");
				var words = _result[0].words;
				var w = 0,
					t = 0;
				while (w < words.length && t < txt.length) {
					if (txt[t] == '-') {
						if (w > 0) {
							words[w - 1].word += '-';
						}
						t++;
						continue;
					}
					words[w].word = txt[t];
					w++;
					t++;
				}
			}
		}

		//Cause every 'source' only used once, so need delete
		delete source[currGUID];

		_result._hasError = hasError;

		if (_.isFunction(callback)) {
			callback(_result);
		}
	}


	/**
	 * Util function used to indicate to persist current state
	 * @returns {Boolean}
	 */

	function neeKeepState(state) {
		var states = [UIStates.BROKEN, UIStates.DOWN];
		return _.indexOf(states, state) > -1;
	}

	var config = $.extend({
		asrEvalzipBaseUrl: window.location.protocol + "//" + window.location.host,
		asrEvalzipPathPrefix: '/asr/handlers'
	}, module.config() || {});

	var TOPIC_ASR_CONN_FAILD = "asr/connection/failed";

	//Const
	var TOPIC_ASR_UI_RECORDING = "asr/ui/recording",
		TOPIC_ASR_RECORDING_STOP = "asr/recording/stopped";

	function trackProxy(feedback) {
		if (!feedback) {
			return;
		}

		ASRLogger.log(feedback);

		this.trace(ASRTraceType.TOTAL_TIME, feedback.totalTime)
			.trace(ASRTraceType.AUDIO_DURATION, feedback.audioDuration)
			.trace(ASRTraceType.AUDIO_ENCODE_TIME, feedback.encodeTime);
	}


	function techcheckRequest() {
		var me = this;
		return me.publish("tech-check/request", [
			{
				id: "flash-setting"
			},
			{
				id: "chrome-auth"
			}
		]);
	}

	return Service.extend(function () {
		this.state(UIStates.DISABLE);
		this.setFailedTimes(null, true);
		this.traceInstance = ASRTrace.create();
	}, {
		"displayName": "server-client",

		"sig/start": function StartASRService() {
			this.publish(TOPIC_ASR_SERVICE_START);
			this.state(UIStates.NORMAL);
			return when.all([
				ASRBlurbs.loadedPromise,
				this.traceInstance.start()
			]);
		},

		"sig/stop": function StopASRService() {
			//dispose ASR service
			callbacks = {};

			if (this.state() === UIStates.RECORDING) {
				this.stopRecord();
				this.reset();
			}
		},

		"hub:memory/asr/inited": function asrInited(recorderService) {
			//Do something when asr init finished
			this.recorderService = recorderService;
		},

		//only set setting
		"hub/asr/service/setting": function (config) {
			var me = this;
			me.setting(config);
		},

		"hub/asr/reset": function asrReset() {
			this.reset();
		},

		/**
		 *   @description
		 *   This method is used for EXTERNAL change ASR failed times.
		 *   Such as: FlashCard Excise have a requirement which need to
		 *   set a failed time when the answer is wrong.
		 *   (https://jira.englishtown.com/browse/SPC-2926)

		 *   !!!Only the ASR state is 'Normal' can set this property.

		 * @param {String} topic
		 * @param {String} newState When set a common failed type, there must provide a new state.
		 */
		"hub/asr/set/common/failed/times": function asrSetCommonFailedTimes(newState) {
			if (this.state() !== UIStates.NORMAL) {
				return;
			}

			this.state(newState, this.setFailedTimes(ASRFailedType.COMM));
		},

		"hub/asr/reset/failed/times": function asrReset() {
			var statesCheckList = [
				UIStates.PROCESSING,
				UIStates.PREPARING,
				UIStates.RECORDING
			];

			if (_.indexOf(statesCheckList, this.state()) > -1) {
				return;
			}
			this.setFailedTimes(null, true);
		},

		"hub/before/loadActivity": function () {
			this.reset();
			//Only when activity reloaded, reset this value
			this.setFailedTimes(0, true);
		},

		"hub/asr/enable": function asrEnable() {
			var me = this,
				state = me.state();

			me.GUID(null);

			/*
			 For some state like 'broken', ASR should keep
			 the state and can't be changed. This logic only
			 applied after recorded that means every reseted
			 state should not have this check.
			 */

			if (neeKeepState(state) && !me._reseted) {
				if (state === UIStates.BROKEN) {
					me.setFailedTimes(null, true);
				}

				ASRLogger.log("Can't force ASR enable, current state is: " + state);
				return;
			}

			me.state(UIStates.NORMAL);

			me._reseted = false;
			ASRLogger.log("Force ASR enable");
		},

		"hub/asr/disable": function asrDisable() {
			var me = this;

			if (me.state() === UIStates.BROKEN) {
				me.setFailedTimes(null, true);
			}

			me.GUID(null);
			clearTimeout(WARNING_TIMEOUT);
			me.state(UIStates.DISABLE);
			ASRLogger.log("Force ASR disable");
		},

		"hub/asr/isEnabled": function () {
			return this.isASREnabled();
		},

		"hub/asr/start/record": function asrStartRecord(guid, cb, option) {
			this.startRecord(guid, cb, option);
		},

		"hub/asr/stop/record": function asrStopRecord() {
			this.stopRecord();
		},
		/*
		 *  Add new hub for outside to change ASR state,
		 *   only can change when ASR warning.
		 */
		"hub/asr/show/message": function asrShowWarning(msgType) {
			var me = this;
			if (me.state() !== UIStates.NORMAL) {
				return;
			}

			me.message(msgType);
		},

		"hub/asr/startPlayback": function asrStartPlayback() {
			var state = this.state(),
				validStates = [UIStates.NORMAL, UIStates.COMMON, UIStates.HINT, UIStates.WARNING, UIStates.ERROR];

			if (this.isPlaying
				// || !this.GUID()
				|| validStates.indexOf(state) === -1) {
				return;
			}

			this.state(UIStates.DISABLE);
			this.isPlaying = true;
			this.startPlayback();
		},
		"hub/asr/stopPlayback": function asrStopPlayback() {
			//When playing asr, record state should be diabled
			if (this.state() !== UIStates.DISABLE) {
				return;
			}

			this.isPlaying = false;
			this.state(UIStates.NORMAL);
			this.stopPlayback();
		},
		"hub:memory/start/load/activity": function (activity) {
			if (!activity) {
				return;
			}
			SETTINGS.activityId = TypeIdParser.parseId(activity.id);
		},
		"hub:memory/load/level": function (levelInfo) {
			var me = this;

			if (!levelInfo) {
				return;
			}

			me.query(ASRTHRESHOLD_SETTING)
				.spread(function (configInfo) {
					//Notes : config value example {"default": 70, "levelNo": {"1" : 50, "2" : 50, "3" : 60}}
					var config = JSON.parse(configInfo.value) || { "default": 70 },
						levelNo = levelInfo.levelNo,

						CFG_TYPE = "levelNo",
						DEFAULT = "default";

					SETTINGS.asrThreshold = (config[CFG_TYPE] && config[CFG_TYPE][levelNo]) || config[DEFAULT];
				});
		},
		"hub:memory/context": function (context) {
			var me = this,
				REG_PROTOCOL = /.*?(?=\:\/\/)/i;
			SETTINGS.memberId = TypeIdParser.parseId(context.user.id);
			me.query(CCL_ASR_KEY)
				.spread(function (addr) {
					SETTINGS.asrServerAddress = addr && addr.value;

					me.defaultProtocol = SETTINGS.asrServerAddress.match(REG_PROTOCOL)[0];
				});
		},

		"hub/asr/playback/status/changed": function asrPlayBackComplete(playState) {
			switch (playState) {
				case "START":
					break;
				case "COMPLETE":
					this.isPlaying = false;
					this.state(UIStates.NORMAL);
					this.publish(TOPIC_AUDIO_PLAY_COMPLETE, this.GUID());
					break;
			}
		},

		"hub/asr/set/guid": function (guid) {
			var me = this;
			me.GUID(guid);
		},

		"hub/asr/set/callback": function (cb, guid) {
			callbacks[guid] = cb;
		},

		"hub/asr/set/source": function (option, guid) {
			source[guid] = preProcess(option);
		},

		/**
		 * Internal state machine
		 * @param {String} newState to update
		 * @param {Object} failedTimes for newState
		 * @returns {String} current ASR state
		 */
		state: function (newState, failedTimes) {
			failedTimes = failedTimes || 0;
			var me = this,
				args = [].slice.call(arguments, 0),
				isPlaying = me.isPlaying,
				isCrashed = asrFailedTypes[ASRFailedType.CRASH] > 0,
				isNormal = failedTimes < ASRConfig.LIMIT_FAILED_TIMES;

			if (newState && newState !== currState) {
				/*
				 Here is a hack for ASR failed 3 times,
				 But if ASR encountered a crash error such as
				 ASR Server down or Client Side ASR not installed.
				 So only when non-crash error happened times is more than 3
				 or ASR is not replay,then we tell student that you can
				 switch to alternative mode. If we encounte a crash error,
				 only tell student the ASR is down and shows skeleton.
				 */

				args[0] = currState = (isCrashed || isNormal || isPlaying) ? newState : (newState = UIStates.BROKEN);

				args.unshift(TOPIC_ASR_UI);
				me.publish.apply(me, args);

				/*
				 * Sometimes, ASR internal may be produce exceptions which cause
				 * the Flash stop to go on the task, so here is a way to handle
				 * this case.
				 */
				if (newState === UIStates.PROCESSING) {
					me._processTimeout = setTimeout(function () {
						me.message(MSGType.TIMEOUT);
						me.trace(ASRTraceType.UI_TIMEOUT, "UI processing timeout!");
						me.GUID(null);
					}, 30000);
				} else {
					clearTimeout(me._processTimeout);
				}
			}

			return currState;
		},

		/**
		 * Show the message box, all message show be call in this way
		 *
		 */
		message: function (type) {
			var me = this;
			var UIType;
			var failedTimes = me.setFailedTimes(ASRFailedType.MSG);

			clearTimeout(WARNING_TIMEOUT);
			type = type.toUpperCase();

			if (failedTimes >= ASRConfig.LIMIT_FAILED_TIMES) {
				type = MSGType.FALLBACK;
			}
			else {
				WARNING_TIMEOUT = setTimeout(function () {
					var state = me.state();
					if (state === UIStates.WARNING ||
						state === UIStates.ERROR) {
						me.state(UIStates.NORMAL);
					}
				}, WARNING_TICK);
			}

			switch (type) {
				case MSGType.FALLBACK:
					UIType = UIStates.BROKEN;
					break;
				case MSGType.INCORRECT_ANSWER:
					messagePublishProxy(me, "hint", ASRBlurbs.TOPIC_RETRY, ASRBlurbs.MSG_INCORRECT_ANSWER);
					UIType = UIStates.HINT;
					break;
				case MSGType.INCORRECT_PRONUN:
					messagePublishProxy(me, "hint", ASRBlurbs.TOPIC_RETRY, ASRBlurbs.MSG_INCORRECT_PRONUN);
					UIType = UIStates.HINT;
					break;
				case MSGType.VOICE_TOO_SLOW:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_TOO_SLOWLY, ASRBlurbs.MSG_TRY_FASTER);
					UIType = UIStates.WARNING;
					break;
				case MSGType.VOICE_TOO_FAST:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_TOO_FAST, ASRBlurbs.MSG_TRY_SLOWLY);
					UIType = UIStates.WARNING;
					break;
				case MSGType.VOICE_TOO_HIGH:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_TOO_HIGH, ASRBlurbs.MSG_CHECK_MIC_HIGH);
					UIType = UIStates.WARNING;
					break;
				case MSGType.VOICE_TOO_LOW:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_TOO_LOW, ASRBlurbs.MSG_CHECK_MIC_LOW);
					UIType = UIStates.WARNING;
					break;
				case MSGType.NO_VOICE:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_MIC_NO_VOICE, ASRBlurbs.MSG_CHECK_NOT_MUTE);
					UIType = UIStates.WARNING;
					break;
				case MSGType.CAN_NOT_RECOGNIZE:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_NOT_RECOGNIZE, ASRBlurbs.MSG_NOT_RECOGNIZE);
					UIType = UIStates.WARNING;
					break;
				case MSGType.TIMEOUT:
					messagePublishProxy(me, "error", ASRBlurbs.TOPIC_TECH_ERROR, ASRBlurbs.MSG_TIMEOUT);
					UIType = UIStates.ERROR;
					break;
				case MSGType.FLASH_ERROR:
					messagePublishProxy(me, "error", ASRBlurbs.TOPIC_TECH_ERROR, ASRBlurbs.MSG_FLASH_ERROR);
					UIType = UIStates.ERROR;
					break;
				case MSGType.SERVER_ERROR:
				default:
					messagePublishProxy(me, "error", ASRBlurbs.TOPIC_TECH_ERROR, ASRBlurbs.MSG_SERVER_ERROR);
					UIType = UIStates.ERROR;
					break;
			}
			if (UIType === UIStates.WARNING || UIType === UIStates.HINT) {
				//show play back button
				me.publish("asr/ui/playback", true);
			}
			else {
				me.publish("asr/ui/playback", false);
			}

			me.state(UIType);
		},

		/**
		 * Update or reset failed times for specific ASR state
		 * @param {String} failedType to set
		 * @param {Boolean} reset ASR failed times
		 * @param {Int} step for add failed times
		 * @returns {Int} all failed times
		 */
		setFailedTimes: function (failedType, reset, step) {
			var i,
				type;
			step = step || 1;

			if (failedType) {

				asrFailedTypes[failedType] += reset ? 0 : step;

			} else if (reset) {

				for (i in ASRFailedType) {

					if (_.has(ASRFailedType, i)) {
						type = ASRFailedType[i];
						asrFailedTypes[type] = 0;
					}

				}

			}

			return this.getFailedTimes();
		},

		/**
		 * Get all types of ASR failed times
		 * @return {Int} all failed times
		 */
		getFailedTimes: function () {
			var i,
				type,
				allFailedTimes = 0;

			for (i in ASRFailedType) {

				if (_.has(ASRFailedType, i)) {
					type = ASRFailedType[i];
					allFailedTimes += asrFailedTypes[type];
				}

			}

			return allFailedTimes;
		},


		/**
		 * ASR session GUID setter
		 * @param {String} id is session GUID string
		 * @return {String} current session GUID
		 */
		GUID: function (id) {
			if (!currGUID || (id !== undefined && currGUID !== id)) {
				currGUID = id;
			}

			return currGUID;
		},

		/**
		 * Recorder setting setter
		 * @param {Object} config is all options of recoder settings
		 * @return {String} current setting
		 */
		setting: function (config) {
			var me = this;
			me._settings = me._settings || _.extend({}, SETTINGS);

			return config ? _.extend(me._settings, config) : me._settings;
		},

		/**
		 * Recorder callback getter
		 * @param {String} guid is session GUID
		 * @return {Function} callback by GUID
		 */
		callback: function (guid) {
			return callbacks[guid || currGUID];
		},

		/**
		 * Record complete handler
		 * @param {Object} result recognize result from recoder
		 * @return
		 */
		"recognizeComplete": function (result) {
			if (!currGUID) {
				return;
			}

			var me = this,
				jsonResult = [],
				jXML = xmlToJDom(result),
				errorCode = jXML.attr('error') || jXML.find('TPResult').attr('error'),
				reason = jXML.attr('error') || jXML.find('TPResult').attr('reason') || "",
				threshold = SETTINGS.asrThreshold,
				answerIncorrect = 0,
				answerCorrect = 100;

			if (errorCode) {
				ASRLogger.log("Error:" + errorCode + " Reason: " + reason);
				me.message(getMessageCode(errorCode));
				asrCallBackProxy(jsonResult, true);

			} else {
				jXML.find('Sentence').each(function () {
					var jSentence = $(this),
						sentence = {
							sentence: jSentence.attr('trans'),
							index: Number(jSentence.attr('id')),
							similarity: Number(jSentence.attr('score'))
						};
					sentence.words = [];

					jSentence.find('Word').each(function () {
						var jWord = $(this);
						sentence.words.push({
							word: jWord.attr('trans'),
							similarity: Number(jWord.attr('score'))
						});
					});
					jsonResult.push(sentence);
				});

				ASRLogger.log("threshold:" + threshold);

				_.each(jsonResult, function (sentence) {
					_.each(sentence.words, function (word) {
						word.score = (word.similarity < threshold) ? answerIncorrect : answerCorrect;
					});
					sentence.score = (sentence.similarity < threshold) ? answerIncorrect : answerCorrect;

					ASRLogger.log("similarity:" + JSON.stringify(sentence));
				});

				me.state(UIStates.NORMAL);

				asrCallBackProxy(jsonResult);

				me.trace(ASRTraceType.RECORDING_COMPLETE, "RecognizeCompleted");
			}


		},

		"startRecord": function (guid, cb, option) {
			var me = this,
				setting = me.setting();
			if (!this.isASREnabled()) {
				me.state(UIStates.DOWN, me.setFailedTimes(ASRFailedType.CRASH, false, ASRConfig.LIMIT_FAILED_TIMES));
				return;
			}

			me.setting(option);

			me.state(UIStates.PREPARING);
			me.GUID(guid);
			//TODO: should pass GUID to server for every session
			callbacks[currGUID] = callbacks[currGUID] || cb;
			source[currGUID] = preProcess(option);

			//Not block UI thread
			setTimeout(function () {
				if (me.state() === UIStates.RECORDING) {
					me.stopRecord();
				} else {
					me._startTime = (new Date).getTime();
					me.trace(ASRTraceType.START, "Start");
				}

				me.trace(ASRTraceType.SEND_GRAMMAR_XML, "Send ASR grammar xml text");

				var recorder = me.recorderService && me.recorderService.getRecorder();
				if (recorder && recorder.startClientRecording) {
					recorder.startClientRecording(
						guid,
						config.asrEvalzipBaseUrl + config.asrEvalzipPathPrefix,
						setting.pronsXML,
						"ASR.asrHubProxy",
						setting.memberId,
						setting.activityId,
						setting.disableScoreRecording);
				}
				else {
					me.state(UIStates.NORMAL);
				}
			});
		},

		"stopRecord": function () {
			this.state(UIStates.PROCESSING);
			//stop curr recording instance
			this.isASREnabled() && this.recorderService.getRecorder().stopClientRecording();
		},

		"startPlayback": function () {
			this.isASREnabled() && this.recorderService.getRecorder().startClientPlayback(
				"ASR.playStatusCallback"
			);
		},

		"stopPlayback": function () {
			this.isASREnabled() && this.recorderService.getRecorder().stopClientPlayback();
		},

		"isASREnabled": function () {
			var recorder = this.recorderService && this.recorderService.getRecorder();
			var enabled = Boolean(recorder)
				&& (recorder['stopClientPlayback'] !== null);
			ASRLogger.log("Check ASR: " + enabled);
			return enabled;
		},

		"reset": function () {
			var me = this;

			clearTimeout(WARNING_TIMEOUT);
			me.GUID(null);
			me.isPlaying = false;
			me._reseted = true;
			me._settings = null;

			if (me.state() === UIStates.RECORDING) {
				me.stopRecord();
			}

			clearInterval(this._asrInterval);
			this.setFailedTimes(ASRFailedType.EVA, true);
		},

		/*
		 * Here success means flash can connect to server successfully.
		 */
		"hub/asr/record/success": function (args) {
			var currGUID = this.GUID(),
				me = this,
				status = args[0];

			if (!currGUID || !args) {
				return;
			}

			clearInterval(this._asrInterval);
			ASRLogger.log("recorder response status, state is: " + args[0] + ", message is: " + args[1]);

			/*
			 args=[statusCode,audio_id,audioBuffer16]
			 */
			switch (status) {
				case FlashStates.START:
					me.trace(ASRTraceType.READY_FOR_RECORD, me._startTime ? ((new Date).getTime() - me._startTime) : 0);
					delete me._startTime;
					me.state(UIStates.RECORDING);
					me._asrInterval = setInterval(function () {
						var recorder = me.recorderService && me.recorderService.getRecorder();
						if (!recorder || !recorder.getMicActivity) {
							clearInterval(me._asrInterval);
							return;
						}

						var _micLevel = recorder.getMicActivity();
						me.publish(TOPIC_ASR_UI_RECORDING, _micLevel);
					}, 100);
					break;
				case FlashStates.COMPLETE:

					me.publish(TOPIC_ASR_RECORDING_STOP);
					me.state(UIStates.PROCESSING);
					me.trace(ASRTraceType.COMPLETE, "Complete");
					break;
				case FlashStates.FEEDBACK:
					me.onRecordFeedback.apply(me, args);
					break;
				case FlashStates.FAILED:
					// For any asr server errors
					me.onRecordFailed.apply(me, args);
					break;
				case FlashStates.ERROR:
					// For any flash client errors
					me.message(MSGType.FLASH_ERROR);
					me.trace(ASRTraceType.FLASH_ERROR, (args[1] || "Unknown Flash Error!"));
					break;
				case FlashStates.NOMIC:
					me.state(UIStates.NORMAL);

					techcheckRequest.call(me);

					break;
				case FlashStates.UNMUTED:
					me.state(UIStates.NORMAL);
					break;
				case FlashStates.MUTED:
					me.state(UIStates.NORMAL);
					techcheckRequest.call(me);

					break;
				default:
					break;
			}
		},

		/*
		 * @param {Object} info {
		 audioSize: 13480,
		 encodeTime: 568,
		 result: "<TPResult version="1.0"><Sentence id="3" trans="TN score="34.487766"></Word></Sentence></TPResult>",
		 totalTime: 915,
		 audioDuration: 1.0681179138321995
		 }
		 */
		"onRecordFeedback": function (status, info) {
			var me = this,
				sets = me.setting(),
				cb = me.callback();

			trackProxy.call(me, info);

			// For activities with pronsXML, which means this is not a speaking challenge
			if (sets.pronsXML && info) {
				me.recognizeComplete(info.result);
			}
			// Speaking challenge only
			else {
				if (cb) {
					cb();
				}
				me.state(UIStates.NORMAL);
			}
		},

		"onRecordFailed": function () {
			var me = this;

			me.publish(TOPIC_ASR_CONN_FAILD);

			if (me.state() === UIStates.PROCESSING) {
				me.message(MSGType.FLASH_ERROR);
			}

			me.trace(ASRTraceType.SERVER_UNAVALIABLE, "ASR Server Unavaliable");
		},

		"trace": function (evtType, evtDesc) {
			this.traceInstance.log(this.GUID(), evtType, evtDesc);
			return this;
		}
	});
});
