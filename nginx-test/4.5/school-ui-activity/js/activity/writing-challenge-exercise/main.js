define([
	'jquery',
	"when",
	'school-ui-activity/activity/base/main',
	"troopjs-core/component/factory",
	'school-ui-activity/util/interaction',
	"school-ui-shared/utils/progress-state",
	"template!./main.html",
	'underscore',
	"jquery.jscrollpane",
	"jquery.mousewheel",
	'jquery.ui',
	'jquery.transit'
], function mpaMain($, when, Widget, Factory, Interaction, progressState, tWtc) {
	"use strict";

	var UNDEF,
		_currentText,
		_scrollTop,
		_currentWordsNum,
		NUM_MAX_CHARACTER = 20000,
		REG_SPLWORDS = /[,;.!:(\s)*\n\?]/g,
		SEL_INPUTAREA = '.ets-act-wtc-ip',
		SEL_TEXTAREA = 'textarea',
		SEL_EXAMPLE_TOGGLE = '.ets-act-wtc-exptg',
		SEL_EXAMPLE_CONTAINER = '.ets-act-wtc-expctn',
		SEL_EXAMPLE_TXT = '.ets-act-wtc-exptxt',
		SEL_WDSNUM_CONTAINER = '.ets-act-wtc-wdscnt',
		SEL_WDSNUM = '.ets-act-wtc-wdsnum',
		SEL_COMPARE = '.ets-act-wtc-ic',
		SEL_FEEDBACK = '.ets-act-wtc-fb-none:visible',
		SEL_FB_NOT_SMT = '.ets-act-wtc-fb-nsmtd',
		SEL_FB_SMT = '.ets-act-wtc-fb-smtd',
		SEL_FB_NOT_PASSED = '.ets-act-wtc-fb-npsd',
		SEL_FB_PASSED = '.ets-act-wtc-fb-psd',
		SEL_MODELTEXT = '.ets-act-wtc-arctn',
		CLS_WDSNUM_ERROR = "ets-act-wtc-wdscnt-error",
		CLS_WDSNUM_CORRECT = "ets-act-wtc-wdscnt-correct",
		STR_SHOW = 'show',
		STR_FAST = 'fast',
		STR_READONLY = 'readonly',
		EVT_CLICK = 'click',
		EVT_TXTCHANGE = 'EFTextChange',
		statusInfo = {
			waiting: 'WAITING',
			notPassed: 'NOPASS',
			passed: 'PASSED'
		};

	/**
	 * Templating and render
	 * @api private
	 */
	function render() {
		var me = this;
		var writingPromise = me.getWritingHist().then(function (writing_info) {
			loadHistory.call(me, writing_info);
		});
		var progressPromise = me.getProgress().then(function (act_progress) {
			loadProgress.call(me, act_progress);
		});
		var renderPromise = me.html(tWtc, me._json).then(function () {
			onRendered.call(me);
		});

		return when.all([writingPromise, progressPromise, renderPromise]);
	}

	/**
	 * On activity rendered:
	 * # Init media player
	 * # Disable text selection
	 * # Bind textarea change event
	 * # Delegate example text toggle event
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$ROOT = me.$element,
			$textarea = $ROOT.find(SEL_TEXTAREA);

		//disable text selection
		$ROOT.find('p,span').attr('unselectable', 'on').attr('onselectstart', 'return false;');
		$ROOT.find(SEL_INPUTAREA).bind('click', function () {
			$textarea.focus();
		});
		$textarea.bind(EVT_TXTCHANGE, function () {
			onTextChanged.call(me);
		});
		$ROOT.delegate(SEL_EXAMPLE_TOGGLE, EVT_CLICK, function () {
			toggleExampleText.call(me);
		});
		//JscrollPane and remove text style
		$ROOT.find(SEL_EXAMPLE_TXT).jScrollPane().find('span').removeAttr('style');
	}

	/**
	 * On textarea value change
	 * # check textarea max char length , if exceeded , don't let type
	 * # compute and refresh words count
	 * # refresh save/submit button
	 * @api private
	 */
	function onTextChanged() {
		var me = this;
		var $ROOT = me.$element;
		var $textarea = $ROOT.find(SEL_TEXTAREA);
		var tVal = $textarea.val();
		if (tVal.length > NUM_MAX_CHARACTER) {
			var min = Math.min(tVal.length, _currentText ? _currentText.length : 0);
			for (var i = 0; i < min; i++) {
				if (tVal.charAt(i) != _currentText.charAt(i)) {
					break;
				}
			}
			//i is the position will be restore
			var rangeData = {
				start: i,
				end: i
			};
			$textarea.val(_currentText);
			$textarea.scrollTop(_scrollTop);
			//use setTimeout to avoid bug of chrome,can't set cursor position immediately
			setTimeout(function () {
				setCursorPosition($textarea.get(0), rangeData);
			}, 0);
		} else {
			_currentText = tVal;
		}
		_scrollTop = $textarea.scrollTop();
		var tArr = _currentText.split(REG_SPLWORDS);
		tArr && (tArr = $.grep(tArr, function (n) {
			return $.trim(n).length > 0;
		}));
		var wordsNum = tArr ? tArr.length : 0;
		if (wordsNum != _currentWordsNum) {
			$ROOT.find(SEL_WDSNUM).text(wordsNum);
			_currentWordsNum = wordsNum;
		}
		if (me.isDefaultState) {
			if (me._json.minWordCount != undefined && me._json.maxWordCount != undefined) {
				me.items().answered(wordsNum >= me._json.minWordCount);
				if (wordsNum >= me._json.minWordCount && wordsNum <= me._json.maxWordCount) {
					$ROOT.find(SEL_WDSNUM_CONTAINER)
						.removeClass(CLS_WDSNUM_ERROR)
						.addClass(CLS_WDSNUM_CORRECT);
				}
				else {
					$ROOT.find(SEL_WDSNUM_CONTAINER)
						.removeClass(CLS_WDSNUM_CORRECT)
						.addClass(CLS_WDSNUM_ERROR);
				}
			}
			else {
				me.items().answered(wordsNum);
			}
		}

		me._json._writingContent = _currentText;
	}

	/**
	 * Toggle example text
	 * @api private
	 */
	function toggleExampleText(show, callback) {
		var me = this,
			$ROOT = me.$element,
			$eye = $ROOT.find(SEL_EXAMPLE_TOGGLE),
			$exampleText = $ROOT.find(SEL_EXAMPLE_CONTAINER).stop(),
			$indicator = $ROOT.find(SEL_MODELTEXT).stop();

		show = (show != null) ? show : ($eye.data(STR_SHOW).toString() == 'true');
		var marginLeft = show ? 0 : $exampleText.width() * -1;
		marginLeft || $indicator.hide();
		$exampleText.animate({
			'margin-left': marginLeft
		}, 300, function () {
			marginLeft && $indicator.fadeIn();
			$eye.data(STR_SHOW, !show);
			callback && callback();
		});
	}

	/**
	 * Restore cursor of textarea with position
	 * @api private
	 */
	function setCursorPosition(textarea, rangeData) {
		if (!rangeData || !textarea) return;
		if (textarea.setSelectionRange) { // W3C
			textarea.focus();
			textarea.setSelectionRange(rangeData.start, rangeData.end);
		} else if (textarea.createTextRange) { // IE
			var range = textarea.createTextRange();
			range.collapse(true);
			range.moveStart('character', rangeData.start);
			range.moveEnd('character', rangeData.end);
			range.select();
		}
	}

	function loadHistory(historyFeedback) {
		var me = this;
		me.hasHistory = historyFeedback.history && historyFeedback.history.length;
		me.isDefaultState = !me.hasHistory && historyFeedback.feedback.toUpperCase() == statusInfo.notPassed;
		me.notPassed = me.hasHistory && historyFeedback.feedback.toUpperCase() == statusInfo.notPassed;
		if (me.isDefaultState) {
			showFeedback.call(me);
			enableTextarea.call(me, true);
		} else {
			showFeedback.call(me, historyFeedback.feedback.toUpperCase());
			showHistoryText.call(me, historyFeedback.history);
			if (me.notPassed) {
				me.isDefaultState = true;
				onTextChanged.call(me);
				enableTextarea.call(me, true);
			} else {
				me.publishInteraction(Interaction.makeAlreadySubmittedWritingInteraction());
				onTextChanged.call(me);
				onActivityDone.call(me);
				me.items().completed(true);
			}
		}
	}

	function showHistoryText(historyText) {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_TEXTAREA).val(historyText);
	}

	function loadProgress(activityProgress) {
		var me = this;
		me.isActivityPassed = activityProgress && progressState.hasPassed(activityProgress.state);
	}

	/**
	 * Show feedback for grade mode
	 * @api private
	 */
	function showFeedback(state) {
		var me = this,
			$ROOT = me.$element,
			$currentFeedback = $ROOT.find(SEL_FEEDBACK);

		function callback() {
			switch (state) {
				case statusInfo.waiting:
					$ROOT.find(SEL_FB_SMT).fadeIn(STR_FAST);
					break;
				case statusInfo.notPassed:
					$ROOT.find(SEL_FB_NOT_PASSED).fadeIn(STR_FAST);
					break;
				case statusInfo.passed:
					$ROOT.find(SEL_FB_PASSED).fadeIn(STR_FAST);
					break;
				default:
					$ROOT.find(SEL_FB_NOT_SMT).fadeIn(STR_FAST);
					break;
			}
		}

		$currentFeedback.length ? $currentFeedback.fadeOut(STR_FAST, callback) : (callback());
	}

	/**
	 * Enable or disable Textarea
	 * @api private
	 */
	function enableTextarea(enable) {
		var $ROOT = this.$element,
			$textarea = $ROOT.find(SEL_TEXTAREA);
		if (enable) {
			$textarea.removeAttr(STR_READONLY);
		} else {
			$textarea.attr(STR_READONLY, STR_READONLY);
		}
		return $textarea;
	}

	/**
	 * Call when answer checked
	 * @api private
	 */
	function onComplete() {
		var me = this;
		me.publishInteraction(Interaction.makeSubmitWritingInteraction())
			.then(function () {
				onActivityDone.call(me);
				me.items().completed(true);
				me.completed(true);
				showFeedback.call(me, statusInfo.waiting);
			});
	}

	function onActivityDone() {
		var me = this,
			$ROOT = me.$element;
		enableTextarea.call(me, false);
		toggleExampleText.call(me, true, function () {
			$ROOT.find(SEL_WDSNUM_CONTAINER).hide();
			$ROOT.find(SEL_COMPARE).fadeIn();
		});
	}

	/**
	 * Filter source data
	 * @api private
	 */
	function filterData() {
		_scrollTop = 0;
		_currentText = '';
		_currentWordsNum = 0;
	}

	var extendsOption = {
		"sig/initialize": function onStart() {
			var me = this;
			me.type(Widget.ACT_TYPE.EXERCISE);
			filterData(me._json);

			var item = me.items();
			item.savable(true);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"activityCompleted": Factory.around(function (base) {
			return function () {
				if (this.isDefaultState) {
					base.apply(this, arguments);
				}
				else if (!this.isActivityPassed) {  //SPC-7453 workaround if submitted writing lost activity progress
					this._json._writingContent = UNDEF;
					base.apply(this, arguments);
				}
			};
		}),
		'hub/activity/check/answer': function () {
			if (this._json._writingContent) {
				onComplete.call(this);
			}
		}
	};
	return Widget.extend(extendsOption);
});
