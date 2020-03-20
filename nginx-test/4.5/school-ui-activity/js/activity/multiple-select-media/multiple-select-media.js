define([
	'jquery',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./multiple-select-media.html'
], function MultipleSelectMediaModule($, poly, when, Widget, Interaction, tMSMedia) {
	"use strict";

	// declaire variables
	var CLS_ACT = "ets-act",
		CLS_CORRECT = "ets-correct",
		CLS_WRONG = "ets-wrong",
		CLS_DISABLED = "ets-disabled",
		CLS_ANIMATE = "ets-animate",
		CLS_NONE = "ets-none",
		CLS_MT_LAY = "ets-act-mt-lay",
		CLS_MT_SINGLE_LAY = "ets-act-mt-single-lay",
		CLS_MT_COMMON_LAY = "ets-act-mt-common-lay",
		CLS_MT_AP_CONTENT_GAP = "ets-act-mt-ap-content-gap";

	var SEL_AR = ".ets-ar",
		SEL_OPTION = ".ets-act-msm-option",
		SEL_ICON_CORRECT = ".ets-icon-correct-s",
		SEL_ICON_INCORRECT = ".ets-icon-incorrect-s",
		SEL_MSM_OPTIONS = ".ets-act-msm-options",
		SEL_ACT_MSM_CONTENT = ".ets-act-msm-content";

	var SWITCH_ANSWERS_NUM = "rolling-number/switch-answers-num";
	var HUB = 'hub/';
	var TOPIC_MULTIPLE_SELECT_MEDIA_LOAD = "activity/template/multipleselectmedia/load";

	var SHOW_CORRECTNESS_DURATION = 2000;

	// Constructor
	function Ctor() {

	}

	/**
	 * Shuffle origin json data
	 * # Templating and render
	 * @api private
	 */
	function render() {
		// TODO: Re-render according to this._json
		// Render widget
		var me = this,
			originData = me._json,
			quetionsData = originData.content.questions[me._index],
			answersScroNum = 0;

		me.optionWrongT = 0;
		me.selectIsCorrect = false;
		me._onlyOneAnswer = false;

		for (var j = 0; j < quetionsData.options.length; j++) {
			quetionsData.options[j].selected = false;
		}

		if (me._hasScoring) {
			var scoringOptions = originData.scoring.questions[me._index].options;
			for (var i = 0; i < scoringOptions.length; i++) {
				if (scoringOptions[i].selected) {
					answersScroNum++;
				}
			}
		}

		me.answersNum = Math.min(originData.filterOptions.correctOptionNo, answersScroNum);

		return me.html(tMSMedia, originData);
	}

	/**
	 * On activity rendered:
	 * # Init answers remaining
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = me.$element,
			commonAudio = me._json.references.aud;

		switch (me._optionsNum) {
			case 2 :
			case 4 :
				$el.find(SEL_MSM_OPTIONS).addClass(CLS_MT_LAY);
				break;
			case 1 :
				$el.find(SEL_MSM_OPTIONS).addClass(CLS_MT_SINGLE_LAY);
				break;
			default :
				$el.find(SEL_MSM_OPTIONS).addClass(CLS_MT_COMMON_LAY);
				break;
		}

		if (commonAudio) {
			$el.find(SEL_ACT_MSM_CONTENT).addClass(CLS_MT_AP_CONTENT_GAP);
		}

		if (!me._hasScoring || me.answersNum === 1) {
			$el.find(SEL_AR).addClass(CLS_NONE);
			me._onlyOneAnswer = true;
			return when.resolve();
		} else {
			//Init answers remainning
			return $el.find(SEL_AR)
				.data("setting", {
					length: 2
				})
				.attr("data-weave", "school-ui-activity/shared/rolling-number/main(setting)")
				.attr("data-at-id", "pnl-answer-remaining")
				.weave()
				.then(function () {
					$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "reset", step: me.answersNum });
				});
		}
	}

	var methods = ({
		'sig/finalize': function onFinalize() {
			window.clearTimeout(this._correctTimer);
			window.clearTimeout(this.optionWrongT);
		},
		"dom:.ets-act-msm-option/click": function ($event) {
			//mark json data based on user's chose
			var me = this,
				$el = me.$element,
				$opTg = $($event.currentTarget),
				$options = $el.find(SEL_OPTION),
				item = me._item;

			if ($opTg.hasClass(CLS_CORRECT) || $opTg.hasClass(CLS_WRONG) || $opTg.hasClass(CLS_DISABLED) || me.optionWrongT != 0 || me.selectIsCorrect || $opTg.hasClass(CLS_ANIMATE)) {
				return;
			}
			//non-graded mode
			if (!me._hasScoring) {
				$opTg.toggleClass(CLS_ACT);
				item.answered(true);
				if (me._index === me._length - 1) {
					item.completed(true);
					me._super.nextStep();
				}
			} else {//graded mode
				var selectOptionId = $opTg.data('answer');
				var checkResult = me.checkAnswer(selectOptionId);
				if (checkResult.correct) {
					if (!me._onlyOneAnswer) {
						$options.addClass(CLS_ANIMATE);
						$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "sub", step: 1 });
						$options.removeClass(CLS_ANIMATE);
					}

					$opTg.addClass(CLS_CORRECT);
					$opTg.find(SEL_ICON_CORRECT).removeClass(CLS_NONE);

					me.answersNum--;
					if (me.answersNum === 0) {
						me.selectIsCorrect = true;
						var isLastQuestion = (me._index === me._length - 1);
						if (isLastQuestion) {
							me._json.content._isCorrect = true;
						}
						checkResult.promise.then(function () {
							me._item.completed(true);
							me._correctTimer = setTimeout(function () {
								me._super.nextStep();
							}, isLastQuestion ? 0 : SHOW_CORRECTNESS_DURATION);
						});
					}
				} else {
					if (!me._onlyOneAnswer) {
						$options.addClass(CLS_ANIMATE);
						$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "sub", step: 1 });
						$options.removeClass(CLS_ANIMATE);
					}

					$opTg.addClass(CLS_WRONG);
					$opTg.find(SEL_ICON_INCORRECT).removeClass(CLS_NONE);
					me.optionWrongT = setTimeout(function () {
						if (!me._onlyOneAnswer) {
							$options.addClass(CLS_ANIMATE);
							$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "add", step: 1 });
							$options.removeClass(CLS_ANIMATE);
						}

						$opTg.toggleClass(CLS_DISABLED + ' ' + CLS_WRONG);
						$opTg.find(SEL_ICON_INCORRECT).addClass(CLS_NONE);
						me.optionWrongT = 0;
					}, SHOW_CORRECTNESS_DURATION);
				}
			}
		},

		checkAnswer: function (selectOptionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, me._index, selectOptionId);
			var correct = interaction.correct;

			var promise = me._super.publishInteraction(interaction);

			return {
				correct: correct,
				promise: promise
			};
		}
	});

	methods[HUB + TOPIC_MULTIPLE_SELECT_MEDIA_LOAD] = function (options) {
		var me = this;

		me._super = options._super;
		me._json = me._super._json;
		me._item = me._super.items();
		me._index = me._super.index();
		me._length = me._super.length();
		me._hasScoring = me._super.hasScoring;
		me._optionsNum = me._json.content.questions[me._index].options.length;

		return render.call(me)
			.then(onRendered.bind(me));
	};

	return Widget.extend(Ctor, methods);
});
