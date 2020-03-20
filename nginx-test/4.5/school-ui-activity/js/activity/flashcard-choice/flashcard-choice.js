define([
	'jquery',
	'jquery.ui',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'school-ui-activity/util/scoring',
	'template!./flashcard-choice.html'
], function ($, ui$, poly, when, Widget, Interaction, Scoring, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";
	var HUB_REMOVE_INTRO_TITLE = "dispose/reference";

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

		SEL_AUDIO = ".ets-ap",

		SEL_FIRST_CARD = ".ets-act-fce-card.ets-stack-1",
		SEL_SECOND_CARD = ".ets-act-fce-card.ets-stack-2",
		SEL_THIRD_CARD = ".ets-act-fce-card.ets-stack-3",
		SEL_FOURTH_CARD = ".ets-act-fce-card.ets-stack-4",
		SEL_CANDIDATE = ".ets-act-fce-card.ets-candidate",
		SEL_BTN_SKIP = ".ets-act-fce-btn.ets-btn-skip",
		SEL_QUESTION = ".ets-act-fce-choice > .ets-options",

		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		SEL_COUNT_CURRENT = ".ets-act-fce-number-current",
		SEL_COUNT_TOTAL = ".ets-act-fce-number-total",

		SEL_SUMMARY_PASS = ".ets-act-fce-summary > .ets-hd > .ets-pass",
		SEL_SUMMARY_FAIL = ".ets-act-fce-summary > .ets-hd > .ets-fail",

		SEL_SUMMARY_REQUIRE_MSG = ".ets-act-fce-summary > .ets-ft > p",

		SEL_CORRECT_ICON = ".ets-icon span",

		SWITCH_DELAY = 800,
		FEEDBACK_DELAY = 500;

	// Constructor
	function Ctor() {
		this.currentCardIndex = 0;
	}

	// # Render
	function render() {
		var me = this;
		var flashcards = this._json.content.flashCards;

		this.totalCards = this._json.content.flashCards.length;

		if (!flashcards || !flashcards.length) {
			return when.reject(new Error(this.toString() + EX_JSON_FORMAT));
		}

		me.correctRequired = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * me.totalCards);
		me.correctCount = 0;
		me.incorrectCount = me.totalCards;

		me.html(tTemplate, {cards: this._json.content.flashCards, correctRequired: me.correctRequired})
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_BTN_SKIP).click(function () {
			if ($(this).hasClass(CLS_DISABLED)) {
				return;
			}
			me.publishSkipInteraction(me.currentCardIndex)
				.then(function () {
					switchCard.call(me);
				})
		});

		me.$activeCard = $el.find(SEL_FIRST_CARD);
		me.$activeQuestion = $el.find(SEL_QUESTION).filter(function () {
			return $(this).data("id") == me.$activeCard.data("id");
		});
		$el.find(SEL_QUESTION).addClass(CLS_NONE);
		me.$activeQuestion.removeClass(CLS_NONE);

		$el.find(SEL_QUESTION + " li").click(function () {
			onClickOption.call(me, $(this));
		});

		$el.find(SEL_COUNT_TOTAL).text(me.totalCards);
		$el.find(SEL_COUNT_CURRENT).text(me.currentCardIndex + 1);
	}

	function switchCard() {
		var me = this,
			$el = this.$element;

		// send pause to all audio in activity
		$el.find(SEL_AUDIO).trigger('player/pause');

		if (me.currentCardIndex + 1 >= me.totalCards) {
			$el.find(SEL_BTN_SKIP).addClass(CLS_NONE);
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
			$el.find(SEL_COUNT_TOTAL).text(me.totalCards);
			$el.find(SEL_COUNT_CURRENT).text(me.currentCardIndex + 1);


			$firstCard.animate({left: "+=150", top: "-=100", opacity: "0"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_FIRST).addClass(CLS_DONE);
				$el.find(SEL_BTN_SKIP).removeClass(CLS_DISABLED);
			});

			$secondCard.animate({top: "0", left: "12"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_SECOND).addClass(CLS_FIRST);
				if (me.currentCardIndex < me.totalCards) {
					me.$activeCard = $el.find(SEL_FIRST_CARD);
					me.$activeQuestion = $el.find(SEL_QUESTION).filter(function () {
						return $(this).data("id") == me.$activeCard.data("id");
					});
					$el.find(SEL_QUESTION).addClass(CLS_NONE);
					me.$activeQuestion.removeClass(CLS_NONE);
				}
			});

			$thirdCard.animate({top: "6", left: "6"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_THIRD).addClass(CLS_SECOND);
			});

			$fourthCard.animate({top: "12", left: "0", opacity: "1"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_FOURTH).addClass(CLS_THIRD);
			});

			$candidate.removeClass(CLS_CANDIDATE).addClass(CLS_FOURTH);
		}
	}

	function viewSummary() {
		var me = this,
			$el = this.$element;

		var passed = me.isPassed();

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);

		$(this).removeClass(CLS_NONE).removeAttr('style');

		if (passed) {
			$el.find(SEL_SUMMARY_PASS).removeClass(CLS_NONE);
			$el.find(SEL_SUMMARY_FAIL).addClass(CLS_NONE);

			$el.find(SEL_SUMMARY_REQUIRE_MSG).addClass(CLS_NONE);
		}

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
	}

	function onClickOption($selectedOption) {
		var me = this,
			$el = this.$element;

		if ($selectedOption.hasClass(CLS_DISABLED) || me.optionFreezed) {
			return;
		}

		$el.find(SEL_BTN_SKIP).addClass(CLS_DISABLED);

		var optionId = $selectedOption.data("id");
		var checkResult = me.checkAnswer(me.currentCardIndex, optionId);
		me.displayInteractionResult(checkResult, $selectedOption);
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		"hub/activity/template/flashcardchoice/load": function (options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._super = options._super;
			me._interacted = false;
			// set instant feedback on
			me._item.instantFeedback(true);

			return me.signal('render');
		},
		checkAnswer: function (questionIndex, optionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, questionIndex, optionId, 'flashCards');
			var correct = interaction.correct;

			if (correct) {
				me.correctCount++;
				me.incorrectCount--;
				me._json.content._isCorrect = me.isPassed();
			}

			var promise = me._super.publishInteraction(interaction);
			return {
				correct: correct,
				promise: promise
			};
		},
		displayInteractionResult: function (checkResult, $selectedOption) {
			var me = this;
			var $el = this.$element;
			var $correctIcon = me.$activeCard.find(SEL_CORRECT_ICON);

			me.optionFreezed = true;

			if (checkResult.correct) {
				me.$activeCard.addClass(CLS_CORRECT);
				$selectedOption.addClass(CLS_CORRECT);
				setTimeout(function () {
					checkResult.promise.then(function () {
						switchCard.call(me);
						me.optionFreezed = false;
					});
				}, SWITCH_DELAY);
			} else {
				$selectedOption.addClass(CLS_INCORRECT);
				me.$activeCard.addClass(CLS_INCORRECT);
				$correctIcon.effect('shake', {distance: 8, times: 3}, 100, function () {
					setTimeout(function () {
						me.$activeCard.removeClass(CLS_INCORRECT);
						$selectedOption.removeClass(CLS_INCORRECT).addClass(CLS_DISABLED);
						me.optionFreezed = false;
						$el.find(SEL_BTN_SKIP).removeClass(CLS_DISABLED);
					}, FEEDBACK_DELAY);
				});
			}
		},
		publishSkipInteraction: function (questionIndex) {
			var me = this;
			var questionId = me._json.content.flashCards[questionIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			return me._super.publishInteraction(interaction);
		},
		isPassed: function () {
			var me = this;
			return me.correctCount >= me.correctRequired;
		}
	};

	return Widget.extend(Ctor, methods);
});
