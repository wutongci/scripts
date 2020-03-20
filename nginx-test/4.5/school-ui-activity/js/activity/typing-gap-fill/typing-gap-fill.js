// # Task Module
define([
	'jquery',
	'jquery.ui',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"school-ui-shared/utils/browser-check",
	'template!./typing-gap-fill.html',
	'school-ui-activity/util/activity-util',
	'school-ui-activity/shared/typing-helper/main',
	'jquery.jscrollpane',
	'jquery.mousewheel',
	'json2',
	'school-ui-activity/shared/toggle-slide/main'
], function mpaMain($, ui$, poly, when, Widget, Scoring, Interaction, browserCheck, tTpg, Util, TypingHelper) {
	"use strict";

	var _canCheckAnswer;
	var _timeOutToRemoveIncorrect;
	var _timeoutToChangeSize;
	var _timeoutToCheckHeight;
	var _timeoutToChangeScrollbarAlphaFirst;
	var _timeoutToChangeScrollbarAlphaSecond;
	var _ISIE = browserCheck.browser === "msie";

	var CLS_HIGHLIGHT = 'ets-act-tpg-h';
	var CLS_INCORRECT = 'ets-act-tpg-ic';
	var CLS_CORRECT = 'ets-act-tpg-sc';
	var CLS_EXAMPLE = 'ets-act-tpg-e';
	var CLS_NONE = 'ets-act-tpg-none';
	var CLS_NOAUDIO = 'ets-act-tpg-noaudio';
	var SEL_MAIN = '.ets-act-tpg-main';
	var SEL_SHADOW = '.ets-act-tpg-shadow';
	var SEL_INPUT = 'input';
	var SEL_TXT = '.ets-act-tpg-txt';
	var SEL_NORMAL = '.ets-act-tpg-n';
	var SEL_EXAMPLE = '.ets-act-tpg-e';
	var SEL_INCORRECT = '.ets-act-tpg-ic';
	var EVT_TXTCHANGE = 'EFTextChange';

	var DATA_CLIENT_X = '_clientX';
	var DATA_SCROLL_LEFT = '_scrollLeft';

	var fixIERenderProxy = function () {
	};

	// fixScrollBarPositionProxy is to fix bug SPC-220
	var fixScrollBarPositionProxy = function () {
	};

	var computeAnsweredNumberProxy = function () {
	};


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

	/**
	 * Templating and render
	 * @api private
	 */
	function render() {
		var me = this;
		// Render widget
		return me.html(tTpg, me._json)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered
	 */
	function onRendered() {
		var me = this;
		initScrollPane.call(me);
		initInputFocusHandler.call(me);
		initInputChangeHandler.call(me);
		initTextSelectHandler.call(me);

		//functions for only grade mode
		if (me._hasScoring) {
			initExampleClickHandler.call(me);
		}
		fixIERenderProxy = fixIERender.bind(me.$element.find(SEL_MAIN));
		fixScrollBarPositionProxy = fixScrollBarPosition.bind(me.$element.find(SEL_MAIN));

		if (me._json.isGradeMode) {
			me.append('<div class="ets-act-tpg-b" data-weave="school-ui-activity/shared/toggle-slide/main"></div>');
		}
	}

	function initScrollPanelEvent($pane) {
		var dragBarSelector = '.jspDrag',
			jspaneSelector = '.jspPane',
			eventScroll = 'jsp-scroll-y',
			eventInitialed = 'jsp-initialised';
		return $pane.bind(eventInitialed, function () {
			$pane.unbind(eventInitialed);
			var $dragbar = $pane.find(dragBarSelector);
			_timeoutToChangeScrollbarAlphaFirst = setTimeout(function () {
				Util.blink.call($, $dragbar);
			}, 5000);

			_timeoutToChangeScrollbarAlphaSecond = setTimeout(function () {
				Util.blink.call($, $dragbar);
			}, 30000);

			$pane.bind(eventScroll, function () {
				$pane.unbind(eventScroll);
				window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
				window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
			});
			var height = $pane.find(jspaneSelector).height();

			function checkHeight() {
				var newHeight = $pane.find(jspaneSelector).height();
				if (parseInt(newHeight) != parseInt(height)) {
					$pane.jScrollPane();
				}
				height = newHeight;
				_timeoutToCheckHeight = setTimeout(checkHeight, 100);
			}

			_timeoutToCheckHeight = setTimeout(checkHeight, 100);
		});
	}

	function initScrollPane() {
		var me = this,
			$ROOT = me.$element;
		var $pane = $ROOT.find(SEL_MAIN);
		var noAudio = $ROOT.parent().hasClass(CLS_NOAUDIO);
		var contentHeight = $pane.height();
		var contentMaxHeight = 430 - (me._hasScoring ? 61 : 0) - (noAudio ? 0 : 85);
		if (contentHeight > contentMaxHeight) {
			$pane.css('height', contentMaxHeight - 22);
			$ROOT.find(SEL_SHADOW).show();
		} else {
			$pane.css('height', contentMaxHeight);
		}
		initScrollPanelEvent($pane).jScrollPane();
	}

	function initInputFocusHandler() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_INPUT).bind('focus', function () {
			$(this).closest(SEL_NORMAL).addClass(CLS_HIGHLIGHT);
		}).bind('blur', function () {
			$(this).closest(SEL_NORMAL).removeClass(CLS_HIGHLIGHT);
		});
	}

	function initInputChangeHandler() {
		var me = this,
			$ROOT = me.$element;
		computeAnsweredNumberProxy = computeAnsweredNumber.bind(me);
		$ROOT.find(SEL_INPUT).bind(EVT_TXTCHANGE, onTextChange);
		$ROOT.find(SEL_NORMAL).delegate('input', 'keydown keypress', function (e) {
			e.stopPropagation();
		})
	}

	function initTextSelectHandler() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_TXT).attr('unselectable', 'on').attr('onselectstart', 'return false;');
	}

	function initExampleClickHandler() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_MAIN).delegate(SEL_EXAMPLE, 'click', function () {
			me.publish("activity/widget/toggleslide/toggle");
		});
	}

	function changeInputSize($inputEle) {
		var value = $inputEle.val();

		function changeSize($inputEle, expands) {
			fixIERenderProxy();
			var inputEle = $inputEle.get(0),
				size = parseInt((inputEle.getAttribute && inputEle.getAttribute('size')) || inputEle.size);
			if (!size || (expands && size == 20) || (!expands && size == 10)) {
				fixScrollBarPositionProxy();
				return;
			}
			$inputEle.attr('size', expands ? ++size : --size);
			_timeoutToChangeSize = setTimeout(function () {
				changeSize($inputEle, expands);
			}, 15);
		}

		var isExpanded = $inputEle.data('expand');
		if ((isExpanded && value.length <= 10) || (!isExpanded && value.length > 10)) {
			$inputEle.data('expand', !isExpanded);
			clearTimeout(_timeoutToChangeSize);
			changeSize($inputEle, !isExpanded);
		}
	}

	function onTextChange() {
		changeInputSize($(this));
		computeAnsweredNumberProxy();
	}

	function fixScrollBarPosition() {
		try {
			this.data('jsp').scrollByY(0);
		} catch (ignored) {
			// ignore exception
		}
	}

	function computeAnsweredNumber() {
		var me = this,
			$ROOT = me.$element,
			item = me._item,
			answeredNumber = 0,
			$inputEles = $ROOT.find(SEL_INPUT);
		$inputEles.each(function () {
			var value = $.trim($(this).val());
			if (value) {
				answeredNumber++;
			}
		});
		answeredNumber < $inputEles.length ? item.answered(false) : item.answered(true);
	}

	function toggleCorrectAnswer(show) {
		var me = this,
			item = me._item;
		window.clearTimeout(_timeOutToRemoveIncorrect);
		if (show) {
			showCorrectAnswer.call(me);
			_canCheckAnswer = item.answered();
			item.answered(false);
		} else {
			hideCorrectAnswer.call(me);
			item.answered(_canCheckAnswer);
		}
	}

	function showCorrectAnswer() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_NORMAL).each(function () {
			var $gap = $(this);
			if (!($gap.hasClass(CLS_CORRECT))) {
				$gap.addClass(CLS_EXAMPLE);
				var answerId = $gap.find(SEL_INPUT).addClass(CLS_NONE).data('id');
				$gap.find(SEL_TXT).text(getAnswerFromScoring.call(me, answerId)).removeClass(CLS_NONE);
			}
		});
	}

	function hideCorrectAnswer() {
		var me = this,
			$ROOT = me.$element,
			$example = $ROOT.find(SEL_EXAMPLE).removeClass(CLS_EXAMPLE);
		$example.find(SEL_TXT).addClass(CLS_NONE);
		$example.find(SEL_INPUT).removeClass(CLS_NONE);
		removeIncorrectAnswer.call(me);
	}

	function removeIncorrectAnswer() {
		var me = this,
			$ROOT = me.$element,
			$incorrect = $ROOT.find(SEL_INCORRECT);
		$incorrect.find('span').addClass(CLS_NONE);
		var $input = $incorrect.find(SEL_INPUT);
		$input.removeClass(CLS_NONE).data('expand', 0).attr('size', 10);
		$input.val('');
		$incorrect.removeClass(CLS_INCORRECT);
		fixIERenderProxy();
	}

	function fixIERender() {
		if (!_ISIE) {
			return;
		}
		/**
		 * IE is ugly, will not rerender all elements of dom tree, use addClass to force rerender
		 **/
		this.addClass('notExists');
	}

	function _onTouchStart($evt) {
		var touch = $evt.originalEvent.touches[0];

		var $input = $($evt.currentTarget);
		$input
			.data(DATA_CLIENT_X, touch.clientX)
			.data(DATA_SCROLL_LEFT, $input.scrollLeft());
	}

	function _onTouchEnd($evt) {
		var $input = $($evt.currentTarget);
		$input.removeData([DATA_CLIENT_X, DATA_SCROLL_LEFT]);
	}

	function _onTouchMove($evt) {
		$evt.preventDefault();

		var touch = $evt.originalEvent.touches[0];
		var currentX = touch.clientX;

		var $input = $($evt.currentTarget);
		var startX = $input.data(DATA_CLIENT_X);
		var startScrollLeft = $input.data(DATA_SCROLL_LEFT);
		if (startX === undefined || startScrollLeft === undefined) {
			return;
		}

		var changedX = currentX - startX;
		$input.scrollLeft(startScrollLeft - changedX);
	}

	function fixTextScrollforIOS() {
		var me = this;
		me.$element
			.on('touchstart', '.ets-act-tpg-input', _onTouchStart)
			.on('touchend', '.ets-act-tpg-input', _onTouchEnd)
			.on('touchmove', '.ets-act-tpg-input', _onTouchMove);
	}

	return Widget.extend({
		'sig/start': function () {
			if (browserCheck.os === 'ios') {
				fixTextScrollforIOS.call(this);
			}
		},
		'sig/finalize': function onFinalize() {
			window.clearTimeout(_timeOutToRemoveIncorrect);
			window.clearTimeout(_timeoutToCheckHeight);
			window.clearTimeout(_timeoutToChangeSize);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
			_canCheckAnswer = null;
			var me = this;
			me.audioPlayer && me.audioPlayer.pause();
		},
		'sig/render': function onRender() {
			return when.all([
				render.call(this),
				TypingHelper.readyPromise
			]);
		},
		'hub/activity/template/typing-gap-fill/load': function onTemplateLoad(options) {
			var me = this;
			me._json = options.json;
			me._item = options.item;
			me._super = options._super;
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

			var inputIds = [];

			var scoringGaps = me._json.scoring.items.reduce(function(list, item) {
				return list.concat(item.gaps);
			}, []);

			$element.find(SEL_INPUT).each(function (i, input) {
				var $input = $(input);
				var inputId = $input.data('id');
				var inputText = TypingHelper.cleanTypingAnswer($input.val());
				var answerText = inputText;
				if (!caseSensitive) {
					answerText = answerText.toLowerCase();
				}

				var solution = Scoring.findById(scoringGaps, inputId);
				var solutionTexts = TypingHelper.prepareTypingSolution(solution.txt);

				var correct = solutionTexts.indexOf(answerText) >= 0;
				allCorrect = allCorrect && correct;

				me.displayInputCorrectness($input, inputText, correct);

				inputIds.push(inputId);
			});

			inputIds.sort();
			var interaction = Interaction.makeTypingInteraction(allCorrect, inputIds.join('+'));
			var promise = me.publish("typing-gap-fill/interaction", interaction);

			if (allCorrect) {
				me._json.content._isCorrect = true;
				me.publish("activity/widget/toggleslide/show", false);
				promise.then(function () {
					me._item.completed(true);
				});
			} else {
				me.publish("activity/widget/toggleslide/show", {
					show: true
				});
				me._item.answered(false);
				//Remove Incorrect style
				_timeOutToRemoveIncorrect = window.setTimeout(function () {
					removeIncorrectAnswer.call(me);
				}, 2500);
			}
		},
		displayInputCorrectness: function ($input, inputText, correct) {
			var $cell = $input.closest(SEL_NORMAL);
			$input.addClass(CLS_NONE);
			if (correct) {
				var $span = $('<span>').text(inputText);
				$cell.removeClass().addClass(CLS_CORRECT).empty().append($span);
			} else {
				$cell.find(SEL_TXT).text(inputText).removeClass(CLS_NONE);
				$cell.addClass(CLS_INCORRECT);
			}
		},
		'hub/activity/template/typing-gap-fill/show-non-graded-feedback': function () {
			var me = this;
			var $element = me.$element;
			$element.find(SEL_INPUT).each(function (i, input) {
				var $input = $(input);
				var inputText = TypingHelper.cleanTypingAnswer($input.val());
				me.displayInputCorrectness($input, inputText, true);
			});
		}
	});
});
