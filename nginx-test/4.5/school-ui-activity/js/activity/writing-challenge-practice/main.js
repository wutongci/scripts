define([
	'jquery',
	"when",
	'school-ui-activity/activity/base/main',
	"troopjs-core/component/factory",
	"school-ui-shared/utils/progress-state",
	"template!./main.html",
	'underscore',
	"jquery.jscrollpane",
	"jquery.mousewheel",
	'jquery.ui',
	'jquery.transit'
], function mpaMain($, when, Widget, Factory, progressState, tWtc) {
	"use strict";

	var UNDEF,
		_currentText,
		_scrollTop,
		_currentWordsNum,
		NUM_MAX_CHARACTER = 20000,
		REG_SPLWORDS = /[,\;.!:(\s)*\n\?]/g,
		SEL_TEXTAREA = '.ets-act-wtc-ip textarea',
		SEL_EXAMPLE_TOGGLE = '.ets-act-wtc-exptg',
		SEL_INPUTAREA = '.ets-act-wtc-ip',
		SEL_EXAMPLE_CONTAINER = '.ets-act-wtc-expctn',
		SEL_EXAMPLE_TXT = '.ets-act-wtc-exptxt',
		SEL_WDSNUM_CONTAINER = '.ets-act-wtc-wdscnt',
		SEL_WDSNUM = '.ets-act-wtc-wdsnum',
		SEL_COMPARE = '.ets-act-wtc-ic',
		SEL_MODELTEXT = '.ets-act-wtc-arctn',
		STR_SHOW = 'show',
		STR_READONLY = 'readonly',
		EVT_CLICK = 'click',
		EVT_TXTCHANGE = 'EFTextChange';

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
		$textarea.bind(EVT_TXTCHANGE, onTextChanged.bind(me));
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
			me.items().answered(wordsNum);
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
			$eye = $ROOT.find(SEL_EXAMPLE_TOGGLE).stop(),
			$exampleText = $ROOT.find(SEL_EXAMPLE_CONTAINER),
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
		onActivityDone.call(this);
		this.items().completed(true);
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

	function loadHistory(historyFeedback) {
		var me = this;
		me.hasHistory = historyFeedback.history && historyFeedback.history.length;
		me.isDefaultState = !me.hasHistory;
		if (me.isDefaultState) {
			enableTextarea.call(me, true);
		} else {
			showHistory.call(me, historyFeedback.history);
		}
	}

	function showHistory(historyText) {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_TEXTAREA).val(historyText);
		onTextChanged.call(me);
		onActivityDone.call(me);
		me.items().completed(true);
	}

	function loadProgress(activityProgress) {
		var me = this;
		me.isActivityPassed = activityProgress && progressState.hasPassed(activityProgress.state);
	}

	function retry() {
		var me = this,
			$ROOT = me.$element;
		me._json._writingContent = '';
		me.hasHistory = false;
		me.isDefaultState = true;
		me.completed(false);
		enableTextarea.call(me, true).val('').focus();
		onTextChanged.call(me);

		toggleExampleText.call(me, false, function () {
			$ROOT.find(SEL_COMPARE).hide();
			$ROOT.find(SEL_WDSNUM_CONTAINER).fadeIn();
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
			me.type(Widget.ACT_TYPE.PRACTICE);

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
					this._onAnswerChecked();
				}
				else if (!this.isActivityPassed) {  //SPC-7453 workaround if submitted writing lost activity progress
					this._json._writingContent = UNDEF;
					base.apply(this, arguments);
					this._onAnswerChecked();
				}
			};
		}),
		"retryActivity": function onRetry() {
			retry.call(this);
		},
		_onAnswerChecked: function onAnswerChecked() {
			var me = this;
			if (me._json._writingContent) {
				onComplete.call(me);
			}
		}
	};
	return Widget.extend(extendsOption);
});
