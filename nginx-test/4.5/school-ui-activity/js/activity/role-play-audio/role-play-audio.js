define([
	"jquery",
	"jquery.ui",
	"poly",
	"troopjs-ef/component/widget",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./role-play-audio.html",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states"
], function ($, ui$, poly, Widget, Scoring, Interaction, tTemplate, ratingSouceType, MSGType, ASRUIStatus) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_ACT_BODY = ".ets-act-rpa-bd",
		SEL_AUDIO = ".ets-ap",
		SEL_MAIN = ".ets-act-rpa-main",
		SEL_SIDE = ".ets-act-rpa-side",
		SEL_IMAGE = ".ets-act-rpa-image img",
		SEL_QUESTION = ".ets-act-rpa-question",
		SEL_ANSWER = ".ets-act-rpa-answer",
		SEL_BTN_START = ".ets-act-rpa-audio-start",
		SEL_BTN_REPLAY = ".ets-act-rpa-btn-replay",
		SEL_BTN_SKIP = ".ets-act-rpa-btn-skip",
		SEL_QUESTIONS = ".ets-act-rpa-questions",
		SEL_QUESTION_ACTIVE = ".ets-act-rpa-question.ets-active",
		SEL_QUESTION_NUMBER = ".ets-act-rpa-questions h4 strong",
		SEL_ASR_CONTAINER = ".ets-act-rpa-mic > div",
		SEL_RPA_MIC = ".ets-act-rpa-mic",
		SEL_AUDIO_CONTROL = ".ets-act-rpa-audio-control",
		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		CLS_CORRECT = "ets-correct",
		CLS_INCORRECT = "ets-incorrect",
		CLS_DISABLED = "ets-disabled",
		CLS_NONE = "ets-none",
		CLS_ACTIVE = "ets-active",
		CLS_SELECT_MODE = "ets-select-mode",
		FEEDBACK_DELAY = 1500,
		asrMode = ratingSouceType["ASR_SPEAKING"];

	var HUB_ASR_SET = "asr/ui/setting",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference";

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	function Ctor() {
		var me = this;
		me.answerMode = {};
		me.questionShown = false;
		me.isLastQuestion = false;
		me.isFirstQuestion = true;
		me.totalQuestions = {};
		/*Total question numbers*/
		me.currentQuestion = {};
		/*Current question*/
		me.currentQuestionIndex = {};
		me.$currentQuestion = {};
		me.correctCount = {};
		me.incorrectCount = {};
		me.correctRequired = {};
		me.asrDisabled = false;
		me.timeouts = [];
	}

	// # Render
	function render() {
		var me = this;
		var data = this._json;

		this.totalQuestions = this._json.content.questions.length;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		me.correctRequired = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * me.totalQuestions);
		me.correctCount = 0;
		me.incorrectCount = me.totalQuestions;

		return this.html(tTemplate, {data: data, correctRequired: me.correctRequired})
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * 1. Enable droppable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = this.$element,
			enableASRSwitch = !me.asrDisabled
				&& !me._json.asrDisabled
				&& window.location.search.indexOf("non-asr") < 0;

		me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.questions[0], {
			asrFallbackType: "SELECT",
			asrFallbackCb: switchAnswerMode.bind(me, "SELECT"),
			needResetASRFailedTimes: true,
			asrEnableTip: true
		});

		//Bind Start
		$el.find(SEL_BTN_START).click(function () {
			start.call(me);
		});

		$el.find(SEL_BTN_REPLAY).click(function () {
			if (!me.audioControlEnabled) {
				return;
			}
			me.publish("asr/ui/playback", false);
			replay.call(me);
		});

		$el.find(SEL_BTN_SKIP).click(function () {
			if (!me.audioControlEnabled) {
				return;
			}
			me.publish("asr/ui/playback", false);
			if (me.isNonGraded()) {
				moveOn.call(me);
			} else {
				me.publishSkipInteraction(me.currentQuestionIndex);
			}
		});

		//Init Activity
		init.call(me);

		if (!enableASRSwitch) {
			switchAnswerMode.call(me, "SELECT");
			asrMode = ratingSouceType["ASR_SELECTION"];
		}

		//Set current question index
		me.currentQuestionIndex = 0;

		//Set current question
		me.currentQuestion = me._json.content.questions[me.currentQuestionIndex];

		//Set current question jquery object
		me.$currentQuestion = $el.find(SEL_QUESTION_ACTIVE);

		$el.find(SEL_IMAGE).filter(function () {
			return $(this).data("index") == 0;
		}).show();
	}

	function onASRRecognized(asrResult) {
		var me = this;

		if (asrResult && asrResult.length > 0) {
			var $selectedOption = $(me.$currentQuestion.find(SEL_ANSWER).filter(function () {
				return $(this).data('id').split('_')[1] == asrResult[0].index;
			})[0]);
			var optionId = $selectedOption.data('id');

			//For non-grade activities, no check answer, mark correct and move on.
			if (me.isNonGraded()) {
				$selectedOption.addClass(CLS_CORRECT);
				disableRecord.call(me);

				var moveOnTimeout = setTimeout(function () {
					moveOn.call(me);
				}, FEEDBACK_DELAY);

				me.timeouts.push(moveOnTimeout);

				me.correctCount++;
				me.incorrectCount--;
			} else if (asrResult[0].score < 100) {
				//below threshold
				showASRMessage.call(me, "INCORRECT_PRONUN");
			} else {
				var correct = me.checkAnswer(me.currentQuestionIndex, optionId);
				me.displayInteractionResult(correct, $selectedOption, asrResult);
			}
		}
	}

	function switchAnswerMode(mode) {
		var me = this,
			$el = this.$element;

		switch (mode) {
			case 'ASR':
				me.answerMode = 'ASR';
				$el.find(SEL_ASR_CONTAINER).removeClass(CLS_NONE);
				$el.find(SEL_QUESTIONS).removeClass(CLS_SELECT_MODE);
				$el.find(SEL_QUESTIONS + " li").unbind('click');
				me._super.scoringType('asr');
				break;
			case 'SELECT':
			default:
				me.answerMode = 'SELECT';
				$el.find(SEL_ASR_CONTAINER).addClass(CLS_NONE);
				$el.find(SEL_QUESTIONS).addClass(CLS_SELECT_MODE);
				$el.find(SEL_QUESTIONS + " li").click(function () {
					onClickOption.call(me, $(this));
				});
				me._super.scoringType('default');
				break;
		}
	}

	function onClickOption($selectedOption) {
		var me = this;

		if ($selectedOption.hasClass(CLS_DISABLED) || me.optionFreezed) {
			return;
		}

		var optionId = $selectedOption.data("id");

		disableAudioControl.call(me);

		//For non-grade activities, no check answer, mark correct and move on.
		if (me.isNonGraded()) {
			me.optionFreezed = true;
			$selectedOption.addClass(CLS_CORRECT);
			disableRecord.call(me);

			var moveOnTimeout = setTimeout(function () {
				moveOn.call(me);
			}, FEEDBACK_DELAY);

			me.timeouts.push(moveOnTimeout);

			me.correctCount++;
			me.incorrectCount--;
		} else {
			var correct = me.checkAnswer(me.currentQuestionIndex, optionId);
			me.displayInteractionResult(correct, $selectedOption);
		}
	}

	function showQuestion() {
		var me = this,
			$el = this.$element;

		if (!me.questionShown) {
			me.questionShown = true;
			me.optionFreezed = false;
			if (me.isFirstQuestion) {
				$el.find(SEL_MAIN).animate({left: "0"}, 300);
				$el.find(SEL_SIDE).animate({right: "0"}, 300);
				me.isFirstQuestion = false;
			} else {
				//in ie8 , animation fadeout or fadein will cause png image has a black border.
				(navigator.userAgent.indexOf('MSIE 8.0') > 0) ?
					$el.find(SEL_SIDE).show() :
					$el.find(SEL_SIDE).fadeIn('slow');
			}
			$el.find(SEL_RPA_MIC).show();
		}
	}

	function hideQuestion() {
		var me = this,
			$el = this.$element;

		if (me.questionShown) {
			me.questionShown = false;
			//in ie8 , animation fadeout or fadein will cause png image has a black border.
			(navigator.userAgent.indexOf('MSIE 8.0') > 0) ?
				$el.find(SEL_SIDE).hide() :
				$el.find(SEL_SIDE).fadeOut('slow');
			$el.find(SEL_RPA_MIC).hide();
		}
	}

	function onSectionEnd() {
		var me = this,
			$el = this.$element;

		if (me.currentQuestionIndex < me.totalQuestions) {
			$el.find(SEL_AUDIO).trigger('player/pause');
			enableRecord.call(me);
			showQuestion.call(me);
			enableAudioControl.call(me);
			//for automation test
			$el.find(SEL_QUESTION + "[data-order=" + (me.currentQuestionIndex + 1) + "]")
				.attr("data-at-status", "shown");
		} else {
			me.actStarted = false;
			disableAudioControl.call(me);
		}

	}

	function enableAudioControl() {
		var me = this,
			$el = this.$element;
		$el.find(SEL_AUDIO_CONTROL).removeClass(CLS_DISABLED);
		me.audioControlEnabled = true;
	}

	function disableAudioControl() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_AUDIO_CONTROL).addClass(CLS_DISABLED);
		me.audioControlEnabled = false;
	}

	function enableRecord() {
		this.publish("asr/enable");

	}

	function disableRecord() {
		this.publish("asr/disable");

	}

	function start() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_AUDIO).trigger('player/play');
		$el.find(SEL_BTN_START).hide(0);
		me.actStarted = true;

		disableRecord.call(me);
		disableAudioControl.call(me);
		hideQuestion.call(me);
	}

	function replay() {
		var me = this,
			$el = this.$element;

		if (!me.audioControlEnabled) {
			return;
		}

		me.$currentQuestion = $el.find(SEL_QUESTION_ACTIVE);
		$el.find(SEL_AUDIO).trigger('player/play', me.currentQuestion.audio.url);

		disableRecord.call(me);
		disableAudioControl.call(me);
	}


	function moveOn() {
		var me = this,
			$el = this.$element;

		if (me.currentQuestionIndex + 1 < me.totalQuestions) {
			me.currentQuestionIndex++;
			me.currentQuestion = me._json.content.questions[me.currentQuestionIndex];

			var nextQuestionTimeout = setTimeout(function () {
				//Moveon to next question
				me.$currentQuestion.removeClass(CLS_ACTIVE).next().addClass(CLS_ACTIVE);
				me.$currentQuestion = me.$currentQuestion.next();

				$el.find(SEL_QUESTION_NUMBER).text(me.currentQuestionIndex + 1);
			}, 500);

			me.timeouts.push(nextQuestionTimeout);

			$el.find(SEL_IMAGE).hide();
			$el.find(SEL_IMAGE).filter(function () {
				return $(this).data("index") == me.currentQuestionIndex;
			}).show();

			$el.find(SEL_AUDIO).trigger('player/play', me.currentQuestion.audio.url);
			me.publish(HUB_ASR_SET,
				onASRRecognized.bind(me),
				me.currentQuestion,
				{
					asrEnableTip: true
				});

			disableRecord.call(me);
			disableAudioControl.call(me);
			hideQuestion.call(me);

		} else {
			var nonGraded = me.isNonGraded();

			var passed;
			if (nonGraded) {
				passed = true;
			} else {
				passed = me.correctCount >= me.correctRequired;
				me._json.content._isCorrect = passed;
			}

			$el.find(SEL_ACT_BODY).fadeOut(300, function () {
				$(this).addClass(CLS_NONE).removeAttr('style');
				viewSummary.call(me, passed);
			});


			if (nonGraded) {
				me._item.answered(true);
			} else {
				me._item.completed(true);
			}
		}
	}

	var init = function () {
		var me = this,
			$el = this.$element;
		$el.find(SEL_QUESTION).removeClass(CLS_ACTIVE);
		$el.find(SEL_QUESTION + ":first").addClass(CLS_ACTIVE);
		$el.find(SEL_BTN_START).show(0);
		$el.find(SEL_QUESTION_NUMBER).text("1");
		this.actStarted = false;
		disableRecord.call(me);

		disableAudioControl.call(me);
	};

	function viewSummary(passed) {
		var me = this,
			$el = this.$element;

		//Render activity summary widget
		$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
			.data("settings",
			{
				passed: passed,
				correctNum: me.correctCount,
				skippedNum: me.incorrectCount,
				passNum: me.correctRequired
			})
			.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
			.weave();

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	function showASRMessage(msgType) {
		this.publish("asr/show/message", MSGType[msgType]);
	}


	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			//Clear timeouts when finalize
			$.each(this.timeouts, function (i, timeout) {
				window.clearTimeout(timeout);
			});
		},
		"sig/start": function () {
			var me = this;

			return me.query(CCL_ASR_ENABLED)
				.spread(function (asrEnabledCcl) {
					me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');
				});
		},
		"hub/activity/template/rpa/load": function (parent, options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;

			me._super = parent;

			// set instant feedback off
			me._item.instantFeedback(true);

			return me.signal('render');
		},
		"hub/asr/ui/states/changed": function (state) {
			var me = this;
			if (!state || !me.actStarted) return;
			switch (state) {
				case ASRUIStatus.RECORDING:
				case ASRUIStatus.PROCESSING:
				case ASRUIStatus.PREPARING:
				case ASRUIStatus.DISABLE:
					disableAudioControl.call(me);
					break;
				default:
					enableAudioControl.call(me);
					break;
			}
		},
		"hub/rating/sourceType": function () {
			return [asrMode];
		},
		"dom:.ets-ap/media/ended": function() {
			onSectionEnd.call(this);
		},
		checkAnswer: function (questionIndex, optionId) {
			var me = this;
			var interaction = Interaction.makeChoiceInteraction(me._json, questionIndex, optionId);
			var promise = me._super.publishInteraction(interaction);

			if (interaction.correct) {
				me.correctCount++;
				me.incorrectCount--;

				var moveOnTimeout = setTimeout(function () {
					promise.then(function(){
						moveOn.call(me);
					});
				}, FEEDBACK_DELAY);

				me.timeouts.push(moveOnTimeout);
			}

			return interaction.correct;
		},
		publishSkipInteraction: function(questionIndex) {
			var me = this;
			var questionId = me._json.content.questions[questionIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			me._super.publishInteraction(interaction)
				.then(function () {
					moveOn.call(me);
				});
		},
		displayInteractionResult: function (correct, $selectedOption, asrResult) {
			var me = this;

			me.optionFreezed = true;

			if (correct) {
				$selectedOption.addClass(CLS_CORRECT);
				disableRecord.call(me);
			} else {
				$selectedOption.addClass(CLS_INCORRECT);

				if (asrResult && !asrResult._hasError) {
					showASRMessage.call(me, "INCORRECT_ANSWER");
				}

				var retryTimeout = setTimeout(function () {
					$selectedOption.removeClass(CLS_INCORRECT).addClass(CLS_DISABLED);
					me.optionFreezed = false;

					if (!asrResult) {
						enableAudioControl.call(me);
					}
				}, FEEDBACK_DELAY);

				me.timeouts.push(retryTimeout);
			}
		},
		isNonGraded: function () {
			return this._super.type() == 3;
		}
	};

	return Widget.extend(Ctor, methods);
});
