// # Task Module
define([
	'jquery',
	'jquery.ui',
	'jquery.gudstrap', //for tooltip
	'poly',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	'template!./typing-table.html',
	'school-ui-activity/shared/typing-helper/main',
	'json2',
	'school-ui-activity/shared/toggle-slide/main'
], function ($, ui$, gud$, poly, when, Widget, Scoring, Interaction, tTptMain, TypingHelper, JSON) {
	"use strict";

	var _canCheckAnswer,
		_timeOutToRemoveIncorrect,
		CLS_HIGHLIGHT = 'ets-act-tpt-h',
		CLS_CORRECT = 'ets-act-tpt-c',
		CLS_INCORRECT = 'ets-act-tpt-ic',
		CLS_EXAMPLE = 'ets-act-tpt-e',
		CLS_NONE = 'ets-none',
		SEL_TABLE = '.ets-act-tpt-t',
		SEL_NORMAL = '.ets-act-tpt-n',
		SEL_INCORRECT = '.' + CLS_INCORRECT,
		SEL_EXAMPLE = '.' + CLS_EXAMPLE,
		SEL_TXT = '.ets-act-tpt-txt',
		SEL_INPUT = 'input',
		EVT_TXTCHANGE = 'EFTextChange',
		NUM_CELL_WIDTH = 190,
		NUM_SIDE_CELL_WIDTH = 3,
		NUM_CALLBACK_DELAY = 1500;

	/**
	 * Get correct answer from scoring text with gap's data-id
	 */
	function getAnswerFromScoring(id) {
		var answer = null;
		$.each(this._json._correctAns, function (i, gap) {
			if (gap._id == id) {
				answer = gap.txt;
				return false;
			}
		});
		return answer;
	}

	function render() {
		var me = this;
		return me.html(tTptMain, me._json)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this;
		initTableWidth.call(me);
		initInputFocusHandler.call(me);
		initInputChangeHandler.call(me);
		initTextSelectHandler.call(me);
		initTableCellHoverHandler.call(me);
		//functions for only grade mode
		if (me._hasScoring) {
			initExampleClickHandler.call(me);
		}
	}

	/**
	 * Set table to fixed width to avoid single long text break down table layout
	 */
	function initTableWidth() {
		var me = this,
			$ROOT = me.$element,
			$table = $ROOT.find(SEL_TABLE),
			table = me._json.tables[me._json.curPage],
			cols = table[table.length - 1] && table[table.length - 1].length;
		$table.css({
			width: cols * NUM_CELL_WIDTH + NUM_SIDE_CELL_WIDTH * 2
		});
	}

	/**
	 * Bind focus & blur events to input elements
	 */
	function initInputFocusHandler() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_INPUT).bind('focus', function () {
			$(this).parent().addClass(CLS_HIGHLIGHT);
		}).bind('blur', function () {
			$(this).parent().removeClass(CLS_HIGHLIGHT);
		});
	}

	/**
	 * Bind value change event to input elements
	 */
	function initInputChangeHandler() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_INPUT).bind(EVT_TXTCHANGE, computeAnsweredNumber.bind(me));
	}

	/**
	 * Disable text selection
	 */
	function initTextSelectHandler() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_TXT).attr('unselectable', 'on').attr('onselectstart', 'return false;');
	}

	/**
	 * Add tooltip to correct and example answer
	 */
	function initTableCellHoverHandler() {
		$(SEL_NORMAL).find(SEL_TXT).tooltip({
			animation: true,
			trigger: 'hover'
		});
	}

	/**
	 * Example text click handler
	 */
	function initExampleClickHandler() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_TABLE).delegate(SEL_EXAMPLE, 'click', function () {
			me.publish("activity/widget/toggleslide/toggle");
		});
	}

	/**
	 * Compute answered number to decide whether to enable check answer button
	 * @api private
	 */
	function computeAnsweredNumber() {
		var me = this,
			$ROOT = me.$element,
			item = me._item,
			answeredNumber = 0;
		$ROOT.find(SEL_INPUT).each(function () {
			$.trim($(this).val()) && answeredNumber++;
		});
		answeredNumber < me._json.content.items[me._json.curPage].gaps.length ?
			item.answered(false) : item.answered(true);
	}

	/**
	 * Toggle correct answer
	 * @param show
	 * @api private
	 */
	function toggleCorrectAnswer(show) {
		window.clearTimeout(_timeOutToRemoveIncorrect);
		var me = this,
			item = me._item;
		if (show) {
			showCorrectAnswer.call(me);
			_canCheckAnswer = item.answered();
			item.answered(false);
		} else {
			hideCorrectAnswer.call(me);
			item.answered(_canCheckAnswer);
		}
	}

	/**
	 * Show Correct Answer
	 * @api private
	 */
	function showCorrectAnswer() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_NORMAL).each(function () {
			var $cell = $(this);
			if (!($cell.hasClass(CLS_CORRECT))) {
				$cell.addClass(CLS_EXAMPLE);
				$cell.find(SEL_INPUT).addClass(CLS_NONE);
				var answer = getAnswerFromScoring.call(me, $cell.find(SEL_INPUT).data('id'));
				$cell.find(SEL_TXT).text(answer).removeClass(CLS_NONE).attr('data-original-title', answer);
			}
		});
	}

	/**
	 * Hide correct answer
	 * @api private
	 */
	function hideCorrectAnswer() {
		var me = this,
			$ROOT = me.$element,
			$example = $ROOT.find(SEL_EXAMPLE).removeClass(CLS_EXAMPLE);
		$example.find(SEL_TXT).addClass(CLS_NONE);
		$example.find(SEL_INPUT).removeClass(CLS_NONE);
		removeIncorrectAnswer.call(me);
	}

	/*
	 * Remove incorrect style,call when after check answer and hide correct answer
	 * 1.hide span
	 * 2.clear and show input
	 * 3.remove incorrect class
	 */
	function removeIncorrectAnswer() {
		var me = this,
			$ROOT = me.$element,
			$incorrect = $ROOT.find(SEL_INCORRECT);
		$incorrect.find(SEL_TXT).addClass(CLS_NONE);
		var $input = $incorrect.find(SEL_INPUT);
		$input.removeClass(CLS_NONE);
		$input.val('');
		$incorrect.removeClass(CLS_INCORRECT);
	}

	function Ctor() {
	}

	var methods = {
		'sig/render': function onRender() {
			return when.all([
				render.call(this),
				TypingHelper.readyPromise
			]);
		},
		'sig/finalize': function onFinalize() {
			window.clearTimeout(_timeOutToRemoveIncorrect);
		},
		'hub/activity/template/typing-table/load': function onTemplateLoad(options) {
			var me = this;
			me._json = options.json;
			me._super = options._super;
			me._item = options.item;
			me._isLastItem = options.isLastItem;
			me._hasScoring = options.hasScoring;
			me._json._originalScoring = JSON.stringify(me._json.scoring);
			return me.signal('render');
		},
		'hub/activity/correctanswer/show': function onCorrectAnswerShow(show) {
			toggleCorrectAnswer.call(this, show);
		},
		'hub/activity/check/answer': function () {
			var me = this;
			var $element = me.$element;
			var caseSensitive = me._json.content.evalLogic && (me._json.content.evalLogic == 2);
			var allCorrect = true;

			var gapIds = [];

			$element.find(SEL_INPUT).each(function (i, input) {
				var $input = $(input);
				var gapId = $input.data('id');
				var itemIndex = me._json.curPage;
				var inputText = TypingHelper.cleanTypingAnswer($input.val());
				var answerText = inputText;
				if (!caseSensitive) {
					answerText = answerText.toLowerCase();
				}

				var solution = Scoring.findById(me._json.scoring.items[itemIndex].gaps, gapId);
				var solutionTexts = TypingHelper.prepareTypingSolution(solution.txt);

				var correct = solutionTexts.indexOf(answerText) >= 0;
				allCorrect = allCorrect && correct;

				me.displayInputCorrectness($input, inputText, correct);

				gapIds.push(gapId);
			});

			gapIds.sort();
			var interaction = Interaction.makeTypingInteraction(allCorrect, gapIds.join('+'));
			var promise = me.publish("typing-table/interaction", interaction);

			if (allCorrect) {
				if (me._isLastItem) {
					me._json.content._isCorrect = true;
				}
				me.publish("activity/widget/toggleslide/show", false);
				promise.then(function () {
					me._item.completed(true);
				});
			} else {
				me.publish("activity/widget/toggleslide/show", {
					show: true,
					style: {
						marginRight: ($element.width() - $element.find(SEL_TABLE).width()) / 2
					}
				});
				me._item.answered(false);
				//Remove Incorrect style
				_timeOutToRemoveIncorrect = window.setTimeout(function () {
					removeIncorrectAnswer.call(me);
				}, NUM_CALLBACK_DELAY);
			}
		},
		displayInputCorrectness: function ($input, inputText, correct) {
			var $cell = $input.parent();
			$cell.find(SEL_TXT)
				.text(inputText)
				.removeClass(CLS_NONE)
				.attr('data-original-title', inputText);
			if (correct) {
				$cell.removeClass(CLS_INCORRECT).addClass(CLS_CORRECT);
			} else {
				$cell.addClass(CLS_INCORRECT);
			}
		},
		'hub/activity/template/typing-table/show-non-graded-feedback': function () {
			var me = this;
			var $element = me.$element;
			$element.find(SEL_INPUT).each(function (i, input) {
				var $input = $(input);
				var inputText = TypingHelper.cleanTypingAnswer($input.val());
				me.displayInputCorrectness($input, inputText, true);
			});
		}
	};
	return Widget.extend(Ctor, methods);
});
