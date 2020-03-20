define([
	'jquery',
	'poly',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./multiple-choice-text.html'
], function MultipleChoiceTextModule($, poly, Widget, Interaction, tMCText) {
	"use strict";

	// declaire variables
	var CLS_ACT = "ets-act",
		CLS_CORRECT = "ets-correct",
		CLS_WRONG = "ets-wrong",
		CLS_DISABLED = "ets-disabled";

	var SEL_OPTION = ".ets-act-mct-option";

	var HUB = 'hub/';
	var TOPIC_MULTIPLE_CHOICE_TEXT_LOAD = "activity/template/multiplechoicetext/load";

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
			quetionsData = originData.content.questions[me._index];

		me.optionWrongT = 0;
		me.selectIsCorrect = false;

		for (var j = 0; j < quetionsData.options.length; j++) {
			quetionsData.options[j].selected = false;
		}

		return me.html(tMCText, originData)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * # Init answers remaining
	 * @api private
	 */
	function onRendered() {
		var me = this;

		me.answersNum = 1;
	}

	var methods = ({
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			window.clearTimeout(this._correctTimer);
			window.clearTimeout(this.optionWrongT);
		},
		"dom:.ets-act-mct-option/click": function ($event) {
			//mark json data based on user's chose
			var me = this,
				$el = me.$element,
				$opTg = $($event.currentTarget),
				$options = $el.find(SEL_OPTION),
				currentQuestion = me._json.content.questions[me._index],
				item = me._item;

			if ($opTg.hasClass(CLS_CORRECT) || $opTg.hasClass(CLS_WRONG) || $opTg.hasClass(CLS_DISABLED) || me.optionWrongT != 0 || me.selectIsCorrect) {
				return;
			}
			//non-graded mode
			if (!me._hasScoring) {
				item.answered(true);
				if (me._index === me._length - 1) {
					item.completed(true);
					me._super.nextStep();
				}

				if ($opTg.hasClass(CLS_ACT)) {
					$opTg.removeClass(CLS_ACT);
					me.answersNum++;
				} else {
					$options.removeClass(CLS_ACT);
					$opTg.addClass(CLS_ACT);
					if (me.answersNum === 0) {
						return;
					} else {
						me.answersNum--;
					}
				}
			} else {//graded mode
				var selectOptionId = $opTg.data('answer');
				var correct = me.checkAnswer(selectOptionId);
				if (correct) {
					$opTg.addClass(CLS_CORRECT);
					me.selectIsCorrect = true;
				} else {
					$opTg.addClass(CLS_WRONG);
					me.optionWrongT = setTimeout(function () {
						$opTg.toggleClass(CLS_DISABLED + ' ' + CLS_WRONG);
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

			if (correct) {
				promise.then(function () {
					var isLastQuestion = (me._index === me._length - 1);
					if (isLastQuestion) {
						me._json.content._isCorrect = true;
					}
					me._item.completed(true);
					me._correctTimer = setTimeout(function () {
						me._super.nextStep();
					}, isLastQuestion ? 0 : SHOW_CORRECTNESS_DURATION);
				});
			}

			return correct;
		}
	});

	methods[HUB + TOPIC_MULTIPLE_CHOICE_TEXT_LOAD] = function (options) {
		var me = this;

		me._super = options._super;
		me._json = me._super._json;
		me._item = me._super.items();
		me._index = me._super.index();
		me._length = me._super.length();
		me._hasScoring = me._super.hasScoring;
		me._optionsNum = me._json.content.questions[me._index].options.length;

		return me.signal('render');
	};

	return Widget.extend(Ctor, methods);
});
