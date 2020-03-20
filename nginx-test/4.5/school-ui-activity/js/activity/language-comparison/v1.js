define([
	"jquery",
	"when",
	"poly",
	"school-ui-activity/activity/base/main",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./language-comparison.html",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states",
	"school-ui-shared/utils/update-helper",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/enum/activity-event-type"
], function MultipleChoiceModule($, when, poly, Widget, Scoring, Interaction, tTemplate, ratingSourceType, MSGType, ASRUIStatus, updateHelper, parser, activityEventType) {
	"use strict";

	// declare variables
	var CLS_NONE = "ets-none",
		CLS_WRONG = 'ets-wrong',
		CLS_CORRECT = 'ets-correct',
		CLS_DISABLED = "ets-disabled",
		CLS_AWAY = "ets-away";

	var SEL_BTN_SKIP = ".ets-act-lnc-skip",
		SEL_AUDIO = ".ets-ap",
		SEL_LNC_RECORD = ".ets-ap-lnc-record",
		SEL_LNC_PLAY_TIP = ".ets-act-lnc-play-tip",
		SEL_LNC_RECORD_TIP = ".ets-act-lnc-record-tip",
		SEL_LNC_RECORD_CONTENT = ".ets-act-lnc-record-content",
		SEL_LNC_RECORD_MSG_CONTAINER = ".ets-act-lnc-record-msg-container",
		SEL_LNC_RECORD_MSG_CONTENT = ".ets-act-lnc-record-msg-content",

		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		SEL_LNC_NUMBER_CURRENT = '.ets-act-lnc-number-current',
		SEL_LNC_NUMBER_TOTAL = '.ets-act-lnc-number-total',
		SEL_LNC_MAIN = ".ets-act-lnc-main",
		SEL_LNC_PLAY_TRANSLATION = ".ets-act-lnc-play-translation",
		SEL_LNC_RECORD_MSG_TTITLE_CONTENT_CORRECT = ".ets-act-lnc-record-msg-title-content-correct",
		SEL_LNC_RECORD_MSG_TTITLE_CONTENT_WRONG = ".ets-act-lnc-record-msg-title-content-wrong";

	var IS_CORRECT = "_isCorrect",
		IS_QUESTION_PASSED,
		PROP_ID = "_id";

	var ACT_ID = "act_id",
		ACT_TEMPLATE_ID = "act_template_id";

	var MAP_ABTEST_EVENTTYPE = {
		"V1": activityEventType["lngCompRetryTimesV1"],
		"V2": activityEventType["lngCompRetryTimesV2"]
	};

	var MAP_ABTEST_EVENTATTR = {
		"pass": "|pass",
		"fail": "|fail",
		"skip": "|skip",
		"warning": "|warning",
		"broken": "|broken"
	};

	var HUB_ASR_SET = "asr/ui/setting",
		HUB_ASR_DISABLE = "asr/disable",
		HUB_ASR_STOP_PLAYBACK = "asr/stopPlayback",
		HUB_ASR_PLAYBACK = "asr/startPlayback",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference";

	var WIDGET_PATH_AUDIO_SHELL = "school-ui-activity/shared/audio/audio-shell";

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	/**
	 * Shuffle origin json data
	 */
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length() - 1);

		me.items().instantFeedback(true);

		return me.html(tTemplate, me._json).then(function () {
			onRendered.call(me);
		});
	}

	/**
	 * On activity rendered:
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = me.$element,
			phrases = me._json.content.phrases[me.index()],
			text = phrases.text,
			translation = phrases.translation;

		me._firstTimePlay = true;
		me._firstTimeRecord = true;
		me._playMediaElement = "";
		me._recordMediaElement = "";
		me._asrState = 'NORMAL';
		//Remove English translation if viewing site in English
		if (text.replace(/\’/g, "'") === translation.replace(/\’/g, "'")) {
			$el.find(SEL_LNC_PLAY_TRANSLATION).hide();
		}

		$el.find(SEL_BTN_SKIP).click(function () {
			if ($(this).hasClass(CLS_DISABLED)) {
				return;
			}
			logActEvent.call(me, "skip");
			if (me.index() + 1 !== me.length()) {
				me.publishSkipInteraction(me.index())
					.then(function(){
						me.publish("asr/ui/playback", false);
						me.nextStep();
					});
			}
		});
		if (me.index() != 0) {
			$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_AWAY);
		}
		renderQuestionNumber.call(me);
		if (me.asrDisabled || window.location.search.indexOf("non-asr") > 0) {
			$el.find(SEL_BTN_SKIP).addClass(CLS_DISABLED);
			$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_NONE);
			me._json.content[IS_CORRECT] = true;
			me.index(me.length() - 1);
			me.completed(true);
			me.publish("asr/disable");
		} else {
			$el.find(SEL_LNC_PLAY_TIP).removeClass(CLS_NONE);
			//set ASR recording data
			me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.phrases[me.index()], {
				asrFallbackType: Widget.ASR_FALLBACK_TYPE.NEXT,
				asrFallbackCb: function () {
					$el.find(SEL_BTN_SKIP).addClass(CLS_DISABLED);
					me._json.content[IS_CORRECT] = true;
					me.index(me.length() - 1);
					me.completed(true);
				},
				needResetASRFailedTimes: true
			});
		}
	}

	//Question number
	function renderQuestionNumber() {
		var me = this,
			$el = me.$element;
		$el.find(SEL_LNC_NUMBER_CURRENT).text(me.index() + 1);
		$el.find(SEL_LNC_NUMBER_TOTAL).text(me.length() - 1);
	}

	//ASR recognize success
	function onASRRecognized(asrResult, guid) {
		if (asrResult._hasError) return;

		var me = this,
			$el = me.$element,
			recordMsg = "",
			$skipButton = $el.find(SEL_BTN_SKIP),
			$recordContent = $el.find(SEL_LNC_RECORD_CONTENT),
			$msgContainer = $el.find(SEL_LNC_RECORD_MSG_CONTAINER),
			$msgTips = $el.find(SEL_LNC_RECORD_TIP),
			phraseIndex = me.index();

		var phraseResult = asrResult[0];

		var correct = this.checkAnswer(phraseIndex, phraseResult);

		var words = phraseResult.words;
		if (!words) return;

		for (var wordIndex = 0; wordIndex < words.length; wordIndex++) {
			var wordCorrect = Scoring.isWordCorrect(words[wordIndex]);
			recordMsg += "<span class='" + (wordCorrect ? '' : CLS_WRONG) + "'>" + words[wordIndex].word + "</span>";
		}

		$el.find(SEL_LNC_RECORD_MSG_CONTENT).html(recordMsg);

		$msgTips.addClass(CLS_AWAY);

		if (correct) {
			//passed
			$skipButton.addClass(CLS_DISABLED);
			$recordContent.removeClass(CLS_WRONG).addClass(CLS_CORRECT);
			$el.find(SEL_LNC_RECORD_MSG_TTITLE_CONTENT_CORRECT).removeClass(CLS_NONE);
			$el.find(SEL_LNC_RECORD_MSG_TTITLE_CONTENT_WRONG).addClass(CLS_NONE);
		} else {
			//failed
			$skipButton.removeClass(CLS_DISABLED);
			$recordContent.addClass(CLS_WRONG).removeClass(CLS_CORRECT);
			$el.find(SEL_LNC_RECORD_MSG_TTITLE_CONTENT_WRONG).removeClass(CLS_NONE);
			$el.find(SEL_LNC_RECORD_MSG_TTITLE_CONTENT_CORRECT).addClass(CLS_NONE);
		}
		record.call(me, guid);
		$msgContainer.removeClass(CLS_AWAY);

		logActEvent.call(me, "passOrFail");
	}

	//record player init when first time and reset record src
	function record(guid) {
		var me = this, $record = me.$element.find(SEL_LNC_RECORD);

		$record
			.unweave()
			.then(function () {
				return $record
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

	//Come to last question
	function comeToLast() {
		var me = this;
		var totalLength = me.length() - 1;//since there is a fake summary page there,so here need to subtract 1
		var passNum = me._answersCorrectness.reduce(function (count, correct) {
			return correct ? count + 1 : count;
		}, 0);
		var failNum = totalLength - passNum;
		var passNeedNum = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * totalLength);
		var isPassed = passNum >= passNeedNum;

		viewSummary.call(me, isPassed, passNum, failNum, passNeedNum);

		me._json.content._isCorrect = isPassed;
		return completeItem.call(me, true);
	}

	//setup summary page,including isPassed?
	//pass number, fail number ,and how many correct answers will be pass
	function viewSummary(passed, correctNum, skippedNum, passNum) {
		var me = this,
			$el = me.$element;

		me.$element.find(SEL_LNC_MAIN).fadeOut(300, function () {
			//Render activity summary widget
			$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
				.data("settings",
				{
					passed: passed,
					correctNum: correctNum,
					skippedNum: skippedNum,
					passNum: passNum
				})
				.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
				.weave();
		});

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	//item complete status change
	function completeItem(status) {
		var me = this;
		var itemIndex = me.index();
		var answeredPromise = me.items(itemIndex).answeredPromise(status);
		var completedPromise = me.items(itemIndex).completedPromise(status);
		return when.all([answeredPromise, completedPromise]);
	}

	function logActEvent(eventAttr) {
		var me = this;
		var phraseIndex = me.index();
		var phrase = me._json.content.phrases[phraseIndex];
		var isCurrentQuestionPassed = Boolean(me._answersCorrectness[phraseIndex]);
		if (IS_QUESTION_PASSED[phraseIndex]) {
			if (eventAttr === "passOrFail") {
				eventAttr = isCurrentQuestionPassed ? "pass" : "fail";
			}
			updateHelper.logActEvent({
				"activityId": parser.parseId(me[ACT_TEMPLATE_ID] || me[ACT_ID]),
				"eventDescr": phrase[PROP_ID] + MAP_ABTEST_EVENTATTR[eventAttr],
				"eventTypeId": MAP_ABTEST_EVENTTYPE[me.feedbackVersion]
			});
		}
		if (isCurrentQuestionPassed) {
			IS_QUESTION_PASSED[phraseIndex] = isCurrentQuestionPassed;
		}
	}

	var extendOptions = {
		"sig/initialize": function onInitialize() {
			var me = this,
				itemsLength = me._json.content.phrases.length;
			me.scoringType(Widget.SCORING_TYPE.ASR);

			/*
			 *since there is a summary page there, and deal with it as a item like other question
			 *so fake a item here.
			 */
			me.length(itemsLength + 1);
		},
		"sig/render": function onRender() {
			if (this.index() >= this.length() - 1) return;
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			if (me._summaryTimer > 0) {
				window.clearTimeout(me._summaryTimer);
			}
		},
		"sig/start": function () {
			var me = this;

			me.query(CCL_ASR_ENABLED).spread(function (asrEnabledCcl) {
				me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');

				IS_QUESTION_PASSED = [];
			});
		},
		checkAnswer: function (phraseIndex, phraseResult) {
			var me = this;
			var correct = Scoring.isPhraseCorrect(phraseResult);

			me._answersCorrectness[phraseIndex] = correct;

			this.publishInteraction(Interaction.makeAsrInteraction(correct, phraseResult._id))
				.then(function () {
					completeItem.call(me, correct);
				});

			return correct;
		},
		publishSkipInteraction: function (phraseIndex) {
			var me = this;
			var questionId = me._json.content.phrases[phraseIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			return me.publishInteraction(interaction)
				.then(function () {
					completeItem.call(me, true);
				});
		},
		nextStep: function onNextStep() {
			var index = this.index(),
				me = this;

			me.publish(HUB_ASR_DISABLE);

			if (index > me.length() - 2) {
				return when.resolve();
			} else if (index === me.length() - 2) {
				return me.indexPromise(index + 1)
					.then(comeToLast.bind(me));
			} else {
				return me.indexPromise(index + 1)
					.then(function () {
						return me.publish(HUB_ASR_STOP_PLAYBACK);
					})
					.then(function () {
						return me.signal('render');
					});
			}
		},
		"hub/asr/ui/states/changed": function (state) {
			if (!state) return;
			var me = this,
				$el = me.$element,
				$skipButton = $el.find(SEL_BTN_SKIP);

			me._asrState = state;

			function layoutBack() {
				$el.find(SEL_LNC_RECORD_MSG_CONTAINER).addClass(CLS_AWAY);
				$skipButton.removeClass(CLS_DISABLED);
			}

			// asr status
			switch (state) {
				case ASRUIStatus.NORMAL:
					if (me._firstTimePlay === false) {
						$el.find(SEL_LNC_RECORD_TIP).removeClass(CLS_AWAY);
					}
					$skipButton.removeClass(CLS_DISABLED);
					break;
				case ASRUIStatus.RECORDING:
				case ASRUIStatus.PROCESSING:
					$skipButton.addClass(CLS_DISABLED);
					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					break;
				case ASRUIStatus.PREPARING:
					me.items(me.index()).answered(false);
					$skipButton.addClass(CLS_DISABLED);

					if (me._firstTimeRecord) {
						me._firstTimeRecord = false;
					}

					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					$el.find(SEL_LNC_RECORD_MSG_CONTAINER).addClass(CLS_AWAY);

					$el.find(SEL_AUDIO).trigger('player/pause');

					break;
				case ASRUIStatus.BROKEN:
					layoutBack();
					logActEvent.call(me, "broken");
					break;
				case ASRUIStatus.WARNING:
					layoutBack();
					logActEvent.call(me, "warning");
					break;
				case ASRUIStatus.HINT:
				case ASRUIStatus.ERROR:
				case ASRUIStatus.DOWN:
					layoutBack();
					break;
				case ASRUIStatus.DISABLE:
					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					break;
				default:
					break;
			}
		},
		"hub/rating/sourceType": function () {
			return [ratingSourceType["ASR_SPEAKING"]];
		},
		"dom:.ets-ap/media/play": function () {
			var me = this,
				$el = me.$element;

			// stop playback when play audio
			me.publish(HUB_ASR_STOP_PLAYBACK);

			if (me._firstTimePlay) {
				$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_AWAY);
				if (me._asrState === "NORMAL" && me._firstTimeRecord) {
					$el.find(SEL_LNC_RECORD_TIP).removeClass(CLS_AWAY);
				}
				me._firstTimePlay = false;
			}
		}
	};

	return Widget.extend(function ($element) {
		this._playMediaElement;
		this._recordMediaElement;
		this._firstTimePlay;
		this._firstTimeRecord;
		this._asrState;
		this.asrDisabled = false;
		this.feedbackVersion = $element.data("option").abtestVersion;
		this._answersCorrectness = [];
	}, extendOptions);
});
