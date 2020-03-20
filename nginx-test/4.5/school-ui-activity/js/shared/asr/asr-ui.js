/**
 *   ASR Widget
 */
define([
	'jquery',
	'jquery.ui',
	'troopjs-ef/component/widget',
	'underscore',
	'template!./asr-ui.html',
	'./asr-ui-states',
	'./asr-blurbs',
	'./asr-config',
	'./asr-service',
	'./guid',
	'school-ui-shared/utils/browser-check'
], function ASRUI(
	$,
	$UI,
	Widget,
	_,
	tASR,
	UIStates,
	ASRBlurbs,
	ASRConfig,
	ASRService,
	guid,
	browserCheck
) {
	"use strict";

	var undef;
	var $ELEMENT = "$element";

	var CLS_ASR_DISABLE = "ets-disabled",
		CLS_ASR_RECODING = "ets-recording ",
		CLS_ASR_PREPARING = "ets-preparing ",
		CLS_ASR_PROCESSING = "ets-processing ",
		CLS_ASR_DOWN = "ets-down",
		CLS_ASR_WARNING = "ets-warning",
		CLS_ASR_ERROR = "ets-error",
		CLS_ASR_HINT = "ets-hint",
		CLS_ASR_BROKEN = "ets-broken",
		CLS_ASR = "ets-act-asr",
		CLS_TIP = "ets-tip",
		CLS_PLAYBACK_OPEN = "ets-act-open",

		ASR_FALLBACK_TYPE = "asrFallbackType",
		ASR_FALLBACK_CB = "asrFallbackCb",
		ASR_FAIL_CB = "asrFailCb",
		ASR_RESET_FAILED_TIMES = "needResetASRFailedTimes",
		ASR_ENABLE_TIP = "asrEnableTip",

		ID = "_id",

		SEL_ASR = ".ets-act-asr",
		SEL_ASR_BUTTON = ".ets-act-asr-button",
		SEL_ASR_WARN_TITLE = ".ets-warning .ets-bd > h4",
		SEL_ASR_WARN_MSG = ".ets-warning .ets-bd > p",
		SEL_ASR_ERROR_TITLE = ".ets-error .ets-bd > h4",
		SEL_ASR_ERROR_MSG = ".ets-error .ets-bd > p",
		SEL_ASR_HINT_TITLE = ".ets-hint .ets-bd > h4",
		SEL_ASR_HINT_MSG = ".ets-hint .ets-bd > p",
		SEL_INDICATOR = ".ets-act-asr-indicator span",
		SEL_ASR_DOWN_CONTENT = ".ets-down .ets-bd > p",
		SEL_ASR_BROKEN_CONTENT = ".ets-broken .ets-bd > p",
		SEL_ASR_PARPARE_MSG = ".ets-act-asr-pop.ets-message",
		SEL_PLAYBACK = ".ets-act-playback",


		TOPIC_ASR_DEBUGGERTOOL = "asr/debuggerTool",
		TOPIC_ASR_UI = "asr/ui/states/changed",
		TOPIC_CONTAINER_NEXT_ACT = "activity-container/nextActivity",
		TOPIC_ASR_ENABLE = "asr/enable",
		TOPIC_ASR_START_RECORD = "asr/start/record",
		TOPIC_ASR_STOP_RECORD = "asr/stop/record",
		TOPIC_ASR_PLAYBACK = "asr/ui/playback",
		TOPIC_ASR_INIT_APPENDTO = "asr/flash/init/append-to";


	var ENUM_ASR_FALLBACK_TYPE = {
		TYPING: "TYPING",
		SELECT: "SELECT",
		NEXT: "NEXT"
	};

	var SETTING = {
		asrFallbackType: ENUM_ASR_FALLBACK_TYPE.NEXT,
		asrFallbackCb: $.noop,
		asrFailCb: $.noop,
		needResetASRFailedTimes: false,
		asrEnableTip: false
	};

	var HANDLERS = {
		state: function (state) {
			if (state && this._state !== state) {
				this._state = state;
				this.updateUI(state);
			}
			return this._state;
		},
		option: function (option) {
			if (!this._option || (option && this._option[ID] !== option[ID])) {
				this._option = option;
			}
			return this._option || { prons: "" };
		},
		"setting": function (config) {
			var me = this;
			me._setting = me._setting || _.extend({}, SETTING);

			return config ? _.extend(me._setting, config) : me._setting;
		},
		toggleCls: function (cls) {
			var me = this;

			if (!me._$asr) {
				return;
			}
			var newCls = cls ? (CLS_ASR + " " + cls) : CLS_ASR;

			me._$asr.attr("class", newCls);
		},
		updateUI: function (state) {
			var me = this,
				setting = me.setting(),
				FALLBACK_TYPE = setting[ASR_FALLBACK_TYPE].toUpperCase();
			state = state || me.state();

			switch (state) {
				case UIStates.BROKEN:
					// case 1, fail case over 3 times
					switch (FALLBACK_TYPE) {

						case ENUM_ASR_FALLBACK_TYPE.NEXT:
							this._$brokenContent.text(ASRBlurbs.ASRAlterSkipMsg);
							break;
						case ENUM_ASR_FALLBACK_TYPE.TYPING:
						case ENUM_ASR_FALLBACK_TYPE.SELECT:
							this._$brokenContent.text(ASRBlurbs.ASRAlterMsg);
							break;
						default:
							break;
					}

					me.toggleCls(CLS_ASR_BROKEN);
					break;
				case UIStates.DISABLE:
					me.toggleCls(CLS_ASR_DISABLE, true);
					break;
				case UIStates.DOWN:
					// case 1, sudden stop record when ui is processing
					// case 2, asr is not enabled(asr funtion not found) when start record
					switch (FALLBACK_TYPE) {
						case ENUM_ASR_FALLBACK_TYPE.NEXT:
							me._$fallBackContent.text(ASRBlurbs.ASRSwitchNext);
							break;
						case ENUM_ASR_FALLBACK_TYPE.TYPING:
							me._$fallBackContent.text(ASRBlurbs.ASRSwitchTyping);
							break;
						case ENUM_ASR_FALLBACK_TYPE.SELECT:
							me._$fallBackContent.text(ASRBlurbs.ASRSwitchSelecting);
							break;
					}

					me.toggleCls(CLS_ASR_DOWN);
					if (setting[ASR_FAIL_CB]) {
						setting[ASR_FAIL_CB]();
					}
					break;
				case UIStates.NORMAL:
					me.toggleCls(setting[ASR_ENABLE_TIP] ? CLS_TIP : "");
					break;
				case UIStates.PREPARING:
					me.toggleCls(CLS_ASR_PREPARING);
					break;
				case UIStates.PROCESSING:
					me.toggleCls(CLS_ASR_PROCESSING);
					break;
				case UIStates.RECORDING:
					me.toggleCls(CLS_ASR_RECODING);
					break;
				case UIStates.WARNING:
					me.toggleCls(CLS_ASR_WARNING);
					break;
				case UIStates.ERROR:
					me.toggleCls(CLS_ASR_ERROR);
					break;
				case UIStates.HINT:
					me.toggleCls(CLS_ASR_HINT);
					break;
			}
		}
	};


	function initASREL() {
		var me = this;
		if (!me[$ELEMENT]) {
			return;
		}

		if (!me._$asr || !me._$asr.length) {
			me._$asr = me[$ELEMENT].find(SEL_ASR);
			me._$fallBackContent = me._$asr.find(SEL_ASR_DOWN_CONTENT);
			me._$brokenContent = me._$asr.find(SEL_ASR_BROKEN_CONTENT);

			me._$asr.find(SEL_ASR_PARPARE_MSG).hide();
		}

		return me._$asr;
	}

	function resetFailedTimes() {
		this.publish("asr/reset/failed/times");
	}

	function createPlayback(guid) {
		var me = this;
		var $playback_audio = $(SEL_PLAYBACK);
		var HUB_ASR_STOP_PLAYBACK = "asr/stopPlayback";
		var HUB_ASR_PLAYBACK = "asr/startPlayback";
		var WIDGET_PATH_AUDIO_SHELL = "school-ui-activity/shared/audio/audio-shell";

		$playback_audio
			.unweave()
			.then(function () {
				return $playback_audio
					.data("option", {
						"_playHandler": function () {
							me.publish(HUB_ASR_PLAYBACK);
						},
						"_pauseHandler": function () {
							me.publish(HUB_ASR_STOP_PLAYBACK);
						},
						"guid": guid
					})
					.attr("data-weave", WIDGET_PATH_AUDIO_SHELL + "(option)")
					.weave();
			});
	}

	function createDebugPanel() {
		$(".ets-asr-debug").remove();

		$("<div></div>").addClass("ets-asr-debug")
			.attr("data-weave", "school-ui-activity/shared/asr/asr-debug/main")
			.appendTo("body")
			.weave();
	}

	return Widget.extend(function () {
		var me = this;

		me.html(tASR)
			.then(function () {
				var $el = me[$ELEMENT];
				if (!$el) {
					return;
				}
				me._$indicator = $el.find(SEL_INDICATOR);

				if (ASRConfig.DEBUG_ASR_ENABLED) {
					createDebugPanel.call(me);
				}
			});
	}, {
		"sig/start": function() {
			return ASRBlurbs.loadedPromise;
		},

		"sig/stop": function () {
			this.publish("asr/reset");
		},

		"hub/asr/ui/setting": function (cb, option, config) {
			var me = this,
				setting;

			me.option(option);

			if (cb && typeof cb === "function") {
				me._asrCB = (function () {
					var asr_cb = cb || function () {};

					if (option["playback"] != false) {
						createPlayback.call(me, me._guid);
					}

					return function (result) {
						/*Add ASR Info for ASR_Scoring:
						 * >. Current recording items '_id'
						 */
						if (result && result[0]) {
							result[0][ID] = me.option()[ID];
						}

						asr_cb(result, me._guid);
					}
				})();
			}

			if (config) {
				setting = me.setting(config);
			}

			if (setting[ASR_RESET_FAILED_TIMES]) {
				resetFailedTimes.call(me);
			}

			me.updateUI();

			me.publish(TOPIC_ASR_DEBUGGERTOOL, me._asrCB, me.option());
		},

		"hub:memory/asr/service/started": function () {
			var me = this;

			initASREL.call(this);

			me.state(UIStates.NORMAL);
			me.publish(TOPIC_ASR_ENABLE);

			// we need to append the asr flash under the button for preventing power saved
			if (browserCheck.browser === "safari" &&
				parseFloat(browserCheck.version, 10) >= 7) {
				me.publish(TOPIC_ASR_INIT_APPENDTO, me[$ELEMENT].find(SEL_ASR_BUTTON));
			}
		},


		"hub/asr/ui/states/changed": function (state, failedTimes) {

			if (failedTimes !== undefined) {
				this._failedTimes = failedTimes;
			}

			this.state(state);
		},

		"hub/asr/ui/warning": function (title, msg) {
			var me = this;
			me._$asr
				.addClass(CLS_ASR_WARNING)
				.find(SEL_ASR_WARN_TITLE)
				.text(title || "")
				.end()
				.find(SEL_ASR_WARN_MSG)
				.text(msg || "");
			me.updateUI();

		},
		"hub/asr/ui/error": function (title, msg) {
			this._$asr
				.addClass(CLS_ASR_ERROR)
				.find(SEL_ASR_ERROR_TITLE)
				.text(title || "")
				.end()
				.find(SEL_ASR_ERROR_MSG)
				.text(msg || "");
		},
		"hub/asr/ui/hint": function (title, msg) {
			this._$asr
				.addClass(CLS_ASR_HINT)
				.find(SEL_ASR_HINT_TITLE)
				.text(title || "")
				.end()
				.find(SEL_ASR_HINT_MSG)
				.text(msg || "");
		},

		"hub/asr/ui/recording": function (micLevel) {
			var me = this;

			if (!me._$indicator) {
				me._$indicator = me[$ELEMENT].find(SEL_INDICATOR);
			}
			me._$indicator.css("width", micLevel + "%");
		},

		"hub/asr/ui/playback": function (toggle) {
			var me = this,
				option = me.option();

			if (option["playback"] == false) {
				return;
			}

			var $playback = me[$ELEMENT].find(SEL_PLAYBACK);

			if (toggle === undef) {
				$playback.toggleClass(CLS_PLAYBACK_OPEN);
			}
			else if (toggle === true) {
				$playback.addClass(CLS_PLAYBACK_OPEN);
			}
			else {
				$playback.removeClass(CLS_PLAYBACK_OPEN);
			}
		},

		'dom:[data-action="record"]/click': function () {
			var me = this,
				inValidState = [UIStates.PROCESSING, UIStates.PREPARING, UIStates.DISABLE],
				isASRDown = (me.state() === UIStates.DOWN) && me._failedTimes > ASRConfig.LIMIT_FAILED_TIMES - 1;

			if (_.indexOf(inValidState, me.state()) !== -1 || isASRDown) {
				return;
			}

			switch (me.state()) {
				case UIStates.WARNING:
				case UIStates.HINT:
				case UIStates.ERROR:
					me.toggleCls();
				case UIStates.COMMON:
				case UIStates.DOWN:
				case UIStates.STOP_REPLAY:
				case UIStates.NORMAL:
					me._guid = guid();
					//>>excludeStart("release", pragmas.release);
					if (window.debugAsr) {
						me.option({
							"Title": "pig",
							"pronsXML": '<?xml version="1.0"?><TPContext version="1.1"><Sentences><Sentence AVG="87.555490868151" DEV="18.831834969547" id="1" display_trans="pig" trans="LTIKN "><Word id="1" trans="LTIKN" display_trans="PIG" weight="1"/></Sentence></Sentences><NewWords><NewWord id="1" trans="LTIKN" prons="P IH G"/></NewWords><Dictionary><![CDATA[LTIKN  P IH G]]></Dictionary></TPContext>',
							"_id": -1
						});

						me._asrCB = function () {
							var $debug_audio = $(".ets-act-asr-fn-audio");
							var HUB_ASR_STOP_PLAYBACK = "asr/stopPlayback";
							var HUB_ASR_PLAYBACK = "asr/startPlayback";
							var WIDGET_PATH_AUDIO_SHELL = "school-ui-activity/shared/audio/audio-shell";

							$debug_audio
								.unweave()
								.data("option", {
									"_playHandler": function () {
										me.publish(HUB_ASR_PLAYBACK);
									},
									"_pauseHandler": function () {
										me.publish(HUB_ASR_STOP_PLAYBACK);
									},
									"guid": me._guid
								})
								.attr("data-weave", WIDGET_PATH_AUDIO_SHELL + "(option)")
								.weave();
						};
					}
					//>>excludeEnd("release");
					me.publish(TOPIC_ASR_START_RECORD, me._guid, me._asrCB, me.option());
					me.publish(TOPIC_ASR_PLAYBACK, false);
					break;
				case UIStates.RECORDING:
					me.publish(TOPIC_ASR_STOP_RECORD, me._guid);
					break;
				default :
					break;
			}
		},

		'dom:[data-action="down"]/click': function () {
			var me = this,
				setting = this.setting();

			me.toggleCls(CLS_ASR_DISABLE);
			me[$ELEMENT]
				.effect(
					'fade',
					500,
					function () {
						if (setting[ASR_FALLBACK_CB]) {
							setting[ASR_FALLBACK_CB]();
						}
					}
				).remove();
		},

		'dom:[data-action="switch"]/click': function () {
			var me = this,
				setting = me.setting(),
				FALLBACK_TYPE = setting[ASR_FALLBACK_TYPE].toUpperCase();

			switch (FALLBACK_TYPE) {
				case ENUM_ASR_FALLBACK_TYPE.NEXT:
					me.publish(TOPIC_CONTAINER_NEXT_ACT);
					break;
				case ENUM_ASR_FALLBACK_TYPE.TYPING:
				case ENUM_ASR_FALLBACK_TYPE.SELECT:
					me[$ELEMENT].find('[data-action="down"]').click();
					break;
			}
		},

		'dom:[data-action="cancel"]/click': function () {
			var me = this;
			me.state(UIStates.NORMAL);
			me.publish(TOPIC_ASR_UI, UIStates.NORMAL);
			resetFailedTimes.call(me);
		}
	}, HANDLERS);
});
