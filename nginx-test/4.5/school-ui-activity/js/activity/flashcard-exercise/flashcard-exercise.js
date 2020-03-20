// # Task Module
define([
	"jquery",
	"jquery.ui",
	"poly",
	"when",
	"troopjs-ef/component/widget",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./flashcard-exercise.html",
	"school-ui-activity/shared/typing-helper/main",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states"
], function (
	$,
	ui$,
	poly,
	when,
	Widget,
	Scoring,
	Interaction,
	tTemplate,
	TypingHelper,
	ratingSouceType,
	MSGType,
	ASRUIStatus
) {
	"use strict";

	// Constants
	var HUB = 'hub/';
	var TOPIC_FLASHCARD_EXERCISE_LOAD = "activity/template/flashcardexercise/load";
	var TOPIC_ASR_STOP_PLAYBACK = "asr/stopPlayback";
	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_FCE_MAIN = ".ets-act-fce-main",
		CLS_DISABLED = "ets-disabled",
		CLS_FIRST = "ets-stack-1",
		CLS_SECOND = "ets-stack-2",
		CLS_THIRD = "ets-stack-3",
		CLS_FOURTH = "ets-stack-4",
		CLS_CANDIDATE = "ets-candidate",
		CLS_DONE = "ets-done",
		CLS_NONE = "ets-none",
		CLS_INCORRECT = "ets-incorrect",
		CLS_CORRECT = "ets-correct",
		CLS_AUDIO_ONLY = "ets-audio-only",

		SEL_ASR_CONTAINER = ".ets-act-fce-mic",
		SEL_FIRST_CARD = ".ets-act-fce-card.ets-stack-1",
		SEL_SECOND_CARD = ".ets-act-fce-card.ets-stack-2",
		SEL_THIRD_CARD = ".ets-act-fce-card.ets-stack-3",
		SEL_FOURTH_CARD = ".ets-act-fce-card.ets-stack-4",
		SEL_CANDIDATE = ".ets-act-fce-card.ets-candidate",
		SEL_BTN_SKIP = ".ets-act-fce-btn.ets-btn-skip",

		SEL_TYPING_CONTAINER = ".ets-act-fce-typing",
		SEL_TYPING_BOX = ".ets-act-fce-typing-box",
		SEL_TYPING_INPUT = ".ets-act-fce-typing-input",
		SEL_TYPING_CHECK = ".ets-act-fce-typing-check",

		SEL_AUDIO = ".ets-ap",

		SEL_WORD = ".ets-act-fce-word",

		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		SEL_COUNT_CURRENT = ".ets-act-fce-number-current",
		SEL_COUNT_TOTAL = ".ets-act-fce-number-total",

		HUB_ASR_SET = "asr/ui/setting",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference",

		SEL_CORRECT_ICON = ".ets-icon span",

		SWITCH_DELAY = 800,
		FEEDBACK_DELAY = 500;

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	// Constructor
	function Ctor() {
		this.currentCardIndex = 0;
		this.correctCount = {};
		this.incorrectCount = {};
		this.totalCards = {};
		this.$activeCard = {};
		this.$activeQuestion = {};
		this.answerMode = 'ASR';
		this.asrDisabled = false;
		this.asrMode = ratingSouceType["ASR_SPEAKING"];
	}

	// # Render
	function render() {
		var me = this;
		var flashcards = this._json.content.flashCards;

		if (!flashcards || !flashcards.length) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		me.totalCards = this._json.content.flashCards.length;

		//Init summary page card numbers
		me.correctRequired = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * me.totalCards);
		me.correctCount = 0;
		me.incorrectCount = me.totalCards;

		if (flashcards && flashcards[0] && flashcards[0].pronsXML) {
			me.hasPronsXML = true;
		}

		return me.html(tTemplate, {cards: flashcards, correctRequired: me.correctRequired});
	}

	function onRendered() {
		var me = this,
			$el = this.$element,
			enableSwitchASRMode = !me.asrDisabled
				&& !me._json.asrDisabled
				&& me.hasPronsXML
				&& window.location.search.indexOf("non-asr") < 0;

		$el.find(SEL_BTN_SKIP).click(function () {
			if ($(this).hasClass(CLS_DISABLED)) {
				return;
			}
			me.publish("asr/disable");
			me.publish("asr/ui/playback", false);
			me.publishSkipInteraction(me.currentCardIndex)
				.then(function () {
					switchCard.call(me);
					me.publish("asr/enable");
				});
		});

		me.$activeCard = $el.find(SEL_FIRST_CARD);

		$el.find(SEL_COUNT_TOTAL).text(me.totalCards);
		$el.find(SEL_COUNT_CURRENT).text(me.currentCardIndex + 1);

		me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.flashCards[me.currentCardIndex], {
			asrFallbackType: "TYPING",
			asrFallbackCb: switchAnswerMode.bind(me, "TYPING"),
			needResetASRFailedTimes: true,
			asrEnableTip: true
		});

		if (!enableSwitchASRMode) {
			switchAnswerMode.call(me, "TYPING");
			me.asrMode = ratingSouceType["ASR_TYPING"];
		}
	}


	function switchAnswerMode(mode) {
		var me = this,
			$el = this.$element;

		switch (mode) {
			case 'ASR':
				me.answerMode = 'ASR';
				$el.find(SEL_TYPING_CONTAINER).addClass(CLS_NONE);
				$el.find(SEL_ASR_CONTAINER).removeClass(CLS_NONE);
				$el.find(SEL_WORD).removeClass(CLS_AUDIO_ONLY);
				$el.find(SEL_TYPING_CHECK).unbind('click');
				$el.find(SEL_TYPING_INPUT).unbind('change');
				me._super.scoringType('asr');
				break;
			case 'TYPING':
				me.answerMode = 'TYPING';
				$el.find(SEL_ASR_CONTAINER).addClass(CLS_NONE);
				$el.find(SEL_TYPING_CONTAINER).removeClass(CLS_NONE);
				$el.find(SEL_WORD).addClass(CLS_AUDIO_ONLY);
				me._super.scoringType('default');

				$el.find(SEL_TYPING_CHECK).click(function () {
					onClickCheck.call(me);
				});

				onInputFocus.call(me);
				break;
		}
	}

	function onASRRecognized(asrResult) {
		var me = this;
		var phraseResult = asrResult[0];
		var checkResult = me.checkAnswer(me.currentCardIndex, phraseResult);
		me.displayInteractionResult(checkResult, asrResult);
	}

	function switchCard() {
		var me = this,
			$el = this.$element;

		// send pause to all audio in activity
		$el.find(SEL_AUDIO).trigger('player/pause');

		if (me.currentCardIndex + 1 >= me.totalCards) {
			$el.find(SEL_BTN_SKIP).addClass(CLS_NONE);
			me._json.content._isCorrect = me.isActivityPassed();
			me._item.completed(true);
			$el.find(SEL_FCE_MAIN).fadeOut(200, function () {
				viewSummary.call(me);
			});
		} else {
			var $firstCard = $el.find(SEL_FIRST_CARD),
				$secondCard = $el.find(SEL_SECOND_CARD),
				$thirdCard = $el.find(SEL_THIRD_CARD),
				$fourthCard = $el.find(SEL_FOURTH_CARD),
				$candidate = $($el.find(SEL_CANDIDATE).first());

			me.currentCardIndex++;

			$el.find(SEL_COUNT_CURRENT).text(me.currentCardIndex + 1);

			$firstCard.animate({left: "+=150", top: "-=100", opacity: "0"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_FIRST).addClass(CLS_DONE);
			});

			$secondCard.animate({top: "0", left: "12"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_SECOND).addClass(CLS_FIRST);
				me.$activeCard = $el.find(SEL_FIRST_CARD);
			});

			$thirdCard.animate({top: "6", left: "6"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_THIRD).addClass(CLS_SECOND);
			});

			$fourthCard.animate({top: "12", left: "0", opacity: "1"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_FOURTH).addClass(CLS_THIRD);
			});

			$candidate.removeClass(CLS_CANDIDATE).addClass(CLS_FOURTH);

			$el.find(SEL_TYPING_INPUT).removeAttr("readonly").val('');
			$el.find(SEL_TYPING_CHECK).addClass(CLS_DISABLED);

			me.publish(
				HUB_ASR_SET,
				onASRRecognized.bind(me),
				me._json.content.flashCards[me.currentCardIndex],
				{
					asrEnableTip: true
				}
			);
		}

	}

	function viewSummary() {
		var me = this,
			$el = this.$element;

		//Render activity summary widget
		$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
			.data("settings",
			{
				passed: me.isActivityPassed(),
				correctNum: me.correctCount,
				skippedNum: me.incorrectCount,
				passNum: me.correctRequired
			})
			.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
			.weave();

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	function onClickCheck() {
		var me = this,
			$el = this.$element,
			$check = $el.find(SEL_TYPING_CHECK),
			$input = $el.find(SEL_TYPING_INPUT);

		if (!this.answerMode == "TYPING" || $check.hasClass(CLS_DISABLED)) {
			return;
		}

		var answer = $input.val();
		var checkResult = me.checkTypingAnswer(me.currentCardIndex, answer);
		me.displayInteractionResult(checkResult);
	}

	function onInputFocus() {
		var me = this,
			$el = this.$element,
			$check = $el.find(SEL_TYPING_CHECK),
			$input = $el.find(SEL_TYPING_INPUT);


		$input.keyup(function (e) {
			if (e.which == 13) {
				onClickCheck.call(me);
			} else {
				if ($.trim($input.val()).length > 0) {
					$check.removeClass(CLS_DISABLED);
				} else {
					$check.addClass(CLS_DISABLED);
				}
			}
		});
	}


	var methods = {
		'sig/render': function onRender() {
			return when.all([
				render.call(this),
				TypingHelper.readyPromise
			]);
		},
		"sig/start": function () {
			var me = this;

			me.query(CCL_ASR_ENABLED).spread(function (asrEnabledCcl) {
				me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');
			});
		},
		"hub/asr/ui/states/changed": function (state) {
			if (!state) return;
			// this.state(state);
			var $el = this.$element,
				$skipButton = $el.find(SEL_BTN_SKIP);
			switch (state) {
				case ASRUIStatus.RECORDING:
				case ASRUIStatus.PROCESSING:
				case ASRUIStatus.PREPARING:
				case ASRUIStatus.DISABLE:
					$skipButton.addClass(CLS_DISABLED);
					break;
				default:
					$skipButton.removeClass(CLS_DISABLED);
					break;
			}
		},
		"hub/rating/sourceType": function () {
			return [this.asrMode];
		},
		"dom:.ets-ap/media/play": function () {
			this.publish(TOPIC_ASR_STOP_PLAYBACK);
		},
		isActivityPassed: function () {
			var me = this;
			return me.correctCount >= me.correctRequired;
		},
		checkAnswer: function (flashcardIndex, phraseResult) {
			var me = this;
			var correct = Scoring.isPhraseCorrect(phraseResult);

			if (correct) {
				me.incrementCorrectCount();
			}

			var promise = this._super.publishInteraction(
				Interaction.makeAsrInteraction(correct, phraseResult._id));

			return {
				correct: correct,
				promise: promise
			};
		},
		checkTypingAnswer: function (flashcardIndex, answer) {
			var me = this;
			var json = me._json;
			var flashcard = json.content.flashCards[flashcardIndex];
			var solution = Scoring.findById(json.scoring.flashCards, flashcard._id);
			var cleanedAnswer = TypingHelper.cleanTypingAnswer(answer).toLowerCase();
			var expectedAnswer = TypingHelper.cleanTypingAnswer(solution.answer).toLowerCase();
			var correct = (expectedAnswer === cleanedAnswer);

			if (correct) {
				me.incrementCorrectCount();
			}

			var promise = this._super.publishInteraction(
				Interaction.makeAsrFallbackInteraction(correct, flashcard._id));

			return {
				correct: correct,
				promise: promise
			};
		},
		publishSkipInteraction: function (flashcardIndex) {
			var me = this;
			var questionId = me._json.content.flashCards[flashcardIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			return me._super.publishInteraction(interaction);
		},
		incrementCorrectCount: function () {
			var me = this;
			me.correctCount++;
			me.incorrectCount--;
		},
		displayInteractionResult: function (checkResult, asrResult) {
			var me = this;
			var json = this._json;
			var $el = this.$element;
			var $typingBox = $el.find(SEL_TYPING_BOX);
			var $input = $el.find(SEL_TYPING_INPUT);
			var $correctIcon = me.$activeCard.find(SEL_CORRECT_ICON);

			if (checkResult.correct) {
				me.$activeCard.addClass(CLS_CORRECT);
				$typingBox.addClass(CLS_CORRECT);
				$input.attr("disabled", "disabled");
				me.publish("asr/disable");
				setTimeout(function () {
					checkResult.promise.then(function () {
						switchCard.call(me);
						$typingBox.removeClass(CLS_CORRECT);
						$input.removeAttr("disabled").focus();
						me.publish("asr/enable");
					});
				}, SWITCH_DELAY);
			} else {
				me.$activeCard.addClass(CLS_INCORRECT);
				$typingBox.addClass(CLS_INCORRECT);
				$input.attr("disabled", "disabled");

				if (asrResult && !asrResult._hasError) {
					me.publish("asr/show/message", MSGType.INCORRECT_PRONUN);
				}

				$correctIcon.effect('shake', {distance: 8, times: 3}, 100, function () {
					setTimeout(function () {
						me.$activeCard.removeClass(CLS_INCORRECT);
						$typingBox.removeClass(CLS_INCORRECT);
						$input.removeAttr("disabled").focus();
						//show asr message
					}, FEEDBACK_DELAY);
				});
			}
		}
	};

	methods[HUB + TOPIC_FLASHCARD_EXERCISE_LOAD] = function (parent, options) {
		var me = this;

		me._json = options.json;
		me._item = options.item;
		me._super = parent;

		me._interacted = false;
		// set instant feedback on
		me._item.instantFeedback(true);

		return me.signal('render').then(function () {
			onRendered.call(me);
		});
	};

	return Widget.extend(Ctor, methods);
});
