define([
	"jquery",
	"when",
	"underscore",
	"troopjs-ef/component/widget",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./text-select.html",
	"./const",
	'school-ui-activity/util/activity-util',
	"jquery.jscrollpane",
	"jquery.mousewheel"
], function TextSelectModule($, when, _, Widget, Scoring, Interaction, tTextSelect, CONST, Util) {
	"use strict";

	var UNDEF;
	var $ELEMENT = "$element";

	var RE_TAG = /<\w+[^>]*>|<\/\w+>/;
	var RE_ONE_CHAR_WORD = /[\w~@#$%^&*]+/;
	var RE_BORDER_CHAR = /^[()[\]]$/;
	var RE_BORDER_BEG_CHAR = /^[(\[]$/;
	var RE_PUNCTUATION = /^[.?;:!]$/;
	var RE_AMP = /&/g;
	var RE_LT = /</g;
	var RE_GT = />/g;

	var TAG_SPAN = "span";
	var EMPTY = "";
	var SPACE = " ";

	var SWITCH_ANSWERS_NUM = "rolling-number/switch-answers-num";
	var TOPIC_TOGGLESLIDE_SHOW = "activity/widget/toggleslide/show";

	var MIN_PHRASE_HEIGHT = 100;

	var SLASH = CONST.SLASH;
	var DOUBLE_SLASH = CONST.DOUBLE_SLASH;
	var RE_SLASH = new RegExp(SLASH, 'g');
	var IS_ANY_MODE = "_isAnyMode";
	var IS_GRADE_MODE = "_isGradeMode";
	var HAS_SHARED_AUDIO = "_hasSharedAudio";
	var ACTIVITY_CONTENT = "_activityContent";

	var DOT = ".";

	/* dom data name */
	var DATA_PHRASE_ID = "phraseId";
	var DATA_WORD_ID = "wordId";
	var DATA_WORD_INDEX = "wordIndex";
	var DATA_OTHER_INDEX = "otherIndex";
	var DATA_OPTION_GROUP_INDEX = "option-group-index";

	/* dom attr name */
	var ATTR_DATA_OPTION_GROUP_INDEX = "data-" + DATA_OPTION_GROUP_INDEX;

	/* CSS class */
	var CLS_OPTION = "ets-option";
	var CLS_SELECTED = "ets-selected";
	var CLS_CORRECT = "ets-correct";
	var CLS_INCORRECT = "ets-incorrect";
	var CLS_DISABLED = "ets-disabled";
	var CLS_DOING = "ets-doing";
	var CLS_SOME_SEPARATOR = "ets-some-separator";
	var CLS_SOME_BORDER = "ets-some-border";
	var CLS_PUNCTUATION = "ets-punctuation";
	var CLS_MIN_HEIGHT = "ets-min-height";
	var CLS_CHECKING = 'ets-checking';
	var CLS_CHK_CORRECT = 'ets-chk-correct';
	var CLS_CHK_DISABLED = 'ets-chk-disabled';

	/* CSS selector */
	var SEL_TSL_VIEW_MAIN = ".ets-act-tsl-view-main";
	var SEL_TSL_PHRASE = ".ets-act-tsl-phrase";
	var SEL_OPTION = DOT + CLS_OPTION;
	var SEL_SELECTED = DOT + CLS_SELECTED;
	var SEL_CORRECT = DOT + CLS_CORRECT;
	var SEL_INCORRECT = DOT + CLS_INCORRECT;
	var SEL_PHRASE = '.ets-act-tsl-text';
	var SEL_DOING = DOT + CLS_DOING;
	var SEL_SOME_SEPARATOR = DOT + CLS_SOME_SEPARATOR;
	var SEL_CHECKING = DOT + CLS_CHECKING;
	var SEL_PARENT_TEXT_SELECT = '.ets-act-tsl';
	var SEL_AR = '.ets-ar';

	/* widget data keys */
	var ITEM = "_item";
	var QUESTION_PHRASE_INDEX = "_questionPhraseIndex";
	var QUESTION_PHRASE_COUNT = "_questionPhraseCount";
	var ANSWER_COUNT = "_answerCount";
	var SELECT_COUNT = "_selectCount";
	var ANSWER_COUNT_BY_PHRASE = "_answerCountByPhrase";
	var SELECT_COUNT_BY_PHRASE = "_selectCountByPhrase";
	var IS_CORRECT = "_isCorrect";

	var SEPARATOR_ELEMENT = '<' + TAG_SPAN + ' class="' + CLS_SOME_SEPARATOR + '">' + SLASH + '</' + TAG_SPAN + '>';
	var SEPARATOR_WORD = {_id: '', _index: -1, txt: SLASH};

	var BORDER_END_CHAR_LIST = {
		'(': ')',
		'[': ']'
	};

	var _timeoutToChangeScrollbarAlphaFirst,
		_timeoutToChangeScrollbarAlphaSecond;

	/*!
	 * make phrase by content phrase
	 *
	 * NOTE: depend on widget instance, answer count may be changed
	 */
	function makePhrase(phrase, isAnyMode) {
		var me = this;
		var output = {
			step: 1,
			joinedAnswerCount: 0
		};
		var wordHtml = '', words = phrase.items, wordCount = words.length;
		var step = 1;

		for (var wordIndex = 0; wordIndex < wordCount; wordIndex += step) {
			output.step = step = 1;
			var word = words[wordIndex];

			if (!isAnyMode && RE_BORDER_BEG_CHAR.test(word.txt)) {
				wordHtml += makeOptionWord.call(me, words, wordIndex, wordCount, isAnyMode, output);
				step = output.step;
			} else {
				wordHtml += makeWord(word._id, word.txt, wordIndex, isAnyMode);
			}
		}

		var joinedAnswerCount = output.joinedAnswerCount;
		if (joinedAnswerCount > 0) {
			me[ANSWER_COUNT] -= joinedAnswerCount;
		}
		return wordHtml;
	}

	//make Logical word which may be combined by continues word objects
	function makeWord(wordId, wordText, wordIndex, isAnyMode, otherIndex, hasSeparator) {
		if (!wordText) {
			return '';
		}
		wordText = String(wordText);

		if (!isAnyMode && wordText === SLASH) {
			return SEPARATOR_ELEMENT;
		}

		if (RE_TAG.test(wordText)) {
			return wordText;
		}

		var separatorIndex = -1;
		if (!isAnyMode && wordText !== DOUBLE_SLASH && (separatorIndex = wordText.indexOf(SLASH)) !== -1) {
			if (wordText.indexOf(SLASH, separatorIndex + 1) !== -1) {
				// ignore if text contains many slashes
				separatorIndex = -1;
			} else {
				wordText = wordText.replace(SLASH, '');
			}
		}

		var className = '';
		var isOneChar = wordText.length === 1;
		var isPunctuation = isOneChar && RE_PUNCTUATION.test(wordText);

		if (isAnyMode) {
			if (!isOneChar || wordText === SLASH || RE_ONE_CHAR_WORD.test(wordText)) {
				className = CLS_OPTION;
			}
		} else if (hasSeparator && RE_BORDER_CHAR.test(wordText)) {
			className = CLS_SOME_BORDER;
		}
		if (isPunctuation && className === '') {
			className = CLS_PUNCTUATION;
		}
		var otherIndexAttr = otherIndex ? ' data-other-index="' + otherIndex + '"' : '';

		wordText = wordText.replace(RE_AMP, "&amp;").replace(RE_LT, "&lt;").replace(RE_GT, "&gt;");
		var html = '<' + TAG_SPAN + ' class="' + className + '" data-at-id="' + wordId + '" data-word-id="' + wordId + '" data-word-index="' + wordIndex + '"' + otherIndexAttr + '>' + wordText + '</' + TAG_SPAN + '>';

		var prefixSpace = isPunctuation ? '' : SPACE;
		if (separatorIndex === -1) {
			return prefixSpace + html;
		}
		else if (separatorIndex === 0) {
			return prefixSpace + SEPARATOR_ELEMENT + SPACE + html;
		}
		else if (separatorIndex > 0) {
			return prefixSpace + html + SPACE + SEPARATOR_ELEMENT;
		}
	}

	/*!
	 * make option word for given word scenario
	 *
	 * NOTE: depend on widget instance, it will update output joinedAnswerCount to fix answer count
	 *
	 */
	function makeOptionWord(words, wordIndex, wordCount, isAnyMode, output) {
		var me = this, html = '';

		/*!
		 * join option word together
		 *
		 * @param {Array} words, phrase words
		 * @param {Integer} index, given word border start index
		 * @param {Integer} wordCount, phrase words count
		 * @param {Boolean} isAnyMode
		 * @param {Object} output, output value
		 *
		 * NOTE: it will update output step for loop
		 *
		 * i.e.
		 * [ {txt:"("}, {txt:"lots"}, {txt:"of"}, {txt:"/"}, {txt:"a"}, {txt:"lot"}, {txt:")"} ] ->
		 * [
		 *  [{txt:"("}],
		 *  [{txt:"lots"}, {txt:"of"}],
		 *  [{txt:"/"}],
		 *  [{txt:"a"}, {txt:"lot"}],
		 *  [{txt:")"}]
		 * ]
		 */
		function joinOptionWord(words, startWordIndex, wordCount, isAnyMode, output) {
			// the words[startWordIndex] should be the border start char
			var word = words[startWordIndex];
			var text = word.txt;
			var BORDER_END_CHAR = BORDER_END_CHAR_LIST[text];

			output.step = output.step || 1;
			word._index = startWordIndex; // set word index
			var optionGroups = [[word]];
			var optionWordIndex = 1; // start index is 1, 0 is used by border start char
			var hasSeparator;

			for (var i = startWordIndex + 1; i < wordCount; i++) {
				output.step++;
				word = words[i];
				text = word.txt;
				word._index = i;

				if (text === BORDER_END_CHAR) {
					optionGroups[++optionWordIndex] = [word];
					break;
				}

				// ignore html tag
				if (RE_TAG.test(text)) {
					continue;
				}

				var isSeparator = text === SLASH;
				var separatorIndex = text.indexOf(SLASH);

				if (isSeparator) {
					hasSeparator = true;
				}

				if (!isSeparator && separatorIndex !== -1) {
					word.txt = text.replace(RE_SLASH, '');
				}

				if (isSeparator) {
					if (optionGroups[optionWordIndex]) {
						optionWordIndex++;
					}
					optionGroups[optionWordIndex] = [word];
					optionWordIndex++;
				}
				else if (separatorIndex === 0) {
					optionWordIndex++;
					optionGroups[optionWordIndex] = [SEPARATOR_WORD];
					optionWordIndex++;
					optionGroups[optionWordIndex] = [word];
				}
				else {
					if (!optionGroups[optionWordIndex]) {
						optionGroups[optionWordIndex] = [];
					}
					optionGroups[optionWordIndex].push(word);
					if (separatorIndex > 0) {
						optionWordIndex++;
						optionGroups[optionWordIndex] = [SEPARATOR_WORD];
						optionWordIndex++;
					}
				}
			}

			if (!hasSeparator && optionGroups.length > 1) {
				/* recover joined word for has brackets but no separator case
				 * transfer FROM
				 * [
				 *  [{txt:"("}],
				 *  [{txt:"lots"}, {txt:"of"}, {txt:"words"}],
				 *  [{txt:")"}]
				 * ]
				 * TO
				 * [
				 *  [{txt:"("}], [{txt:"lots"}], [{txt:"of"}], [{txt:"words"}], [{txt:")"}]
				 * ]
				 */
				//ES6 syntax:
				//optionGroups = [optionGroups[0], ...optionGroups[1].map(w=>[w]), ...optionGroups.slice(2) ];
				optionGroups = [optionGroups[0]].concat(optionGroups[1].map(function (word) {
					return [word];
				})).concat(optionGroups.slice(2));
			}
			optionGroups.hasSeparator = hasSeparator;
			return optionGroups;
		}

		var joinedAnswerCount = 0;
		var optionGroupItems = joinOptionWord(words, wordIndex, wordCount, isAnyMode, output);
		optionGroupItems.forEach(function (optionGroupItem) {
			var text = '', optionWordsBuffer = [], answerWordIndexes = [];
			optionGroupItem.forEach(function (word) {
				if (isAnswerWord.call(me, word._id)) {
					optionWordsBuffer.unshift(word);
					answerWordIndexes.push(word._index);
				} else {
					optionWordsBuffer.push(word);
				}
				text += SPACE + word.txt;
			});
			if (answerWordIndexes.length > 1) {
				joinedAnswerCount += answerWordIndexes.length - 1;
			}

			// get the last joined word(first element in array)'s id and index as selected word's id and index
			var joinedWord = optionWordsBuffer[0];
			if (joinedWord) {
				text = text.trim();
				html += makeWord(joinedWord._id, text, joinedWord._index, isAnyMode, answerWordIndexes.slice(0, -1).join(","), optionGroupItems.hasSeparator);
			}
		});
		output.joinedAnswerCount += joinedAnswerCount;
		return html;
	}

	/*!
	 * check if word is answer or not by word id
	 *
	 * NOTE: depend on widget instance
	 */
	function isAnswerWord(wordId) {
		var me = this;
		var scoring = me[ACTIVITY_CONTENT].scoring, isAnswer = false;
		if (!scoring) {
			return isAnswer;
		}

		$.each(scoring.phrases || [], function (i, phrase) {
			$.each(phrase.items || [], function (j, word) {
				if (word._id === wordId) {
					isAnswer = true;
					return false;
				}
			});
			if (isAnswer) {
				return false;
			}
		});
		return isAnswer;
	}

	function resetRemainingAnswersCount() {
		var me = this;
		var $el = me[$ELEMENT];
		var remaingCount = me[ANSWER_COUNT] - me[SELECT_COUNT];
		$el.closest(SEL_PARENT_TEXT_SELECT).find(SEL_AR)
			.trigger(SWITCH_ANSWERS_NUM, { action: "reset", step: remaingCount });
	}

	/*!
	 * Called after activity rendered
	 *
	 * @api private
	 */
	function onRendered() {
		var me = this;
		var $widget = me[$ELEMENT];

		var $tslViewMain = $widget.find(SEL_TSL_VIEW_MAIN);
		var $phraseItems = $tslViewMain.find(SEL_TSL_PHRASE);

		// DONT change the following calling order
		if (!me[IS_ANY_MODE]) {
			initSomeMode($phraseItems);
		}
		if ($phraseItems.length === 1 && $phraseItems.height() < MIN_PHRASE_HEIGHT) {
			$phraseItems.addClass(CLS_MIN_HEIGHT);
		}
		initScrollPanel($tslViewMain);
	}

	/*!
	 * add word class and option num for given word
	 */
	function initSomeMode($phraseItems) {
		var $separators = $phraseItems.find(SEL_SOME_SEPARATOR);
		$separators.next().add($separators.prev()).addClass(CLS_OPTION);
		var $words = $phraseItems.find(SEL_OPTION);   //make sure elements order is same as DOM's

		// set option group index for given words
		var groupIndex = 0;
		$words.each(function (i, word) {
			var $word = $(word);
			$word.attr(ATTR_DATA_OPTION_GROUP_INDEX, groupIndex);
			//option group may have border, and may have not.
			//so only keep groupIndex unchanged if found a separator
			if (!$word.next().hasClass(CLS_SOME_SEPARATOR)) {
				groupIndex++;
			}
		});
		var groupCount = groupIndex;

		for (var i = 0; i < groupCount; i++) {
			var $groupWords = $words.filter('[' + ATTR_DATA_OPTION_GROUP_INDEX + '=' + i + ']');
			if ($groupWords.length <= 1) {
				continue;
			}
			// shuffle option group words
			var $groupWordWrappers = $groupWords.wrap('<span></span>').parent();
			var shuffledWords = _.shuffle($groupWords.toArray());
			for (var groupWordIndex = 0; groupWordIndex < shuffledWords.length; groupWordIndex++) {
				var $wrapper = $groupWordWrappers.eq(groupWordIndex);
				var newElement = shuffledWords[groupWordIndex];
				$wrapper.empty().append(newElement);
			}
			$groupWords.unwrap();
		}
	}

	function initScrollPanel($pane) {
		$pane.one('jsp-initialised', function () {
			var $dragbar = $pane.find('.jspDrag');

			_timeoutToChangeScrollbarAlphaFirst = setTimeout(function () {
				Util.blink.call($, $dragbar);
			}, 5000);

			_timeoutToChangeScrollbarAlphaSecond = setTimeout(function () {
				Util.blink.call($, $dragbar);
			}, 30000);

			$pane.one('jsp-scroll-y', function () {
				clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
				clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
			});
		});

		$pane.jScrollPane({
			enableKeyboardNavigation: false,
			autoReinitialise: false
		});
	}

	function isOption($word) {
		return $word.hasClass(CLS_OPTION) && $word.data(DATA_WORD_ID);
	}

	return Widget.extend({
		'sig/finalize': function onFinalize() {
			window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
		},

		/**
		 * @param {Object} data {activity, hasSharedAudio, isMultiType, isGradeMode, isAnyMode, questionPhraseCount, questionPhraseIndex, item}
		 */
		"hub/activity/text-select/render": function render(data) {
			var me = this;
			if (me.isAnswerShown) {
				me.publish("activity/widget/toggleslide/toggle");
				me.isAnswerShown = false;
			}

			me[HAS_SHARED_AUDIO] = data.hasSharedAudio;
			me[ITEM] = data.item;
			me[ACTIVITY_CONTENT] = data.activityContent;
			me[IS_GRADE_MODE] = data.isGradeMode;
			me[IS_ANY_MODE] = data.isAnyMode;
			me[QUESTION_PHRASE_COUNT] = data.questionPhraseCount;
			me[QUESTION_PHRASE_INDEX] = data.questionPhraseIndex;

			// reset activity status before render
			me._reset(me[QUESTION_PHRASE_INDEX]);

			// export makePhrase function
			data.makePhrase = makePhrase;

			// calculate render phrases
			var questionPhrases = (data.activityContent.content || {}).phrases || [];
			var renderQuestionPhrases = data.isMultiType ? [questionPhrases[data.questionPhraseIndex]] : questionPhrases.slice(0, data.questionPhraseCount);
			if (renderQuestionPhrases.length > 1 && data.activityContent.filterOptions.random) {
				renderQuestionPhrases = _.shuffle(renderQuestionPhrases);
			}
			return me.html(tTextSelect, $.extend({
				renderQuestionPhrases: renderQuestionPhrases
			}, data)).then(function () {
				// reset answer reamin after phrase rendered(answer count may be fixed by joining)
				resetRemainingAnswersCount.call(me);
				onRendered.call(me);
			});
		},

		"hub/activity/check/answer": function () {
			var me = this;
			if (!me[ITEM].instantFeedback()) {
				me[$ELEMENT].find(SEL_SELECTED).each(function (i, wd) {
					var $word = $(wd);
					var $phrase = $word.closest(SEL_PHRASE);
					var optionIndex = $word.data(DATA_OPTION_GROUP_INDEX);
					var phraseId = $phrase.data(DATA_PHRASE_ID);
					var wordId = $word.data('word-id');
					var correct = me.checkAnswer(phraseId, optionIndex, wordId);
					me.displayInteractionResult(correct, $phrase, $word);
				});
				me._updateAnsweredState();
				me.publish(TOPIC_TOGGLESLIDE_SHOW, { show: !me[ITEM].completed() });
			}
		},

		"hub/activity/correctanswer/show": function (show) {
			var me = this;
			me.isAnswerShown = show;
			var $phrases = me[$ELEMENT].find(SEL_PHRASE);
			if (show) {
				$phrases
					.filter(SEL_DOING)
					.removeClass(CLS_DOING)
					.addClass(CLS_CHECKING)
					.each(function (ip, phraseNode) {
						var $phrase = $(phraseNode);
						var phraseId = $phrase.data(DATA_PHRASE_ID);
						var solution = Scoring.findById(me[ACTIVITY_CONTENT].scoring.phrases, phraseId);
						$phrase.find(SEL_OPTION).each(function (iw, wordNode) {
							var $word = $(wordNode);
							var wordId = $word.data('word-id');
							var solutionWord = Scoring.findById(solution.items, wordId);
							var correct = Boolean(solutionWord);
							$word.addClass(correct ? CLS_CHK_CORRECT : CLS_CHK_DISABLED);
						});
					});
			} else {
				$phrases
					.filter(SEL_CHECKING)
					.removeClass(CLS_CHECKING)
					.addClass(CLS_DOING)
					.find(SEL_OPTION)
					.removeClass(CLS_CHK_CORRECT)
					.removeClass(CLS_CHK_DISABLED);
			}
		},

		/**
		 *reset activity status variable
		 */
		_reset: function onReset(questionPhraseIndex) {
			var me = this;
			me[SELECT_COUNT] = 0;
			me[ANSWER_COUNT] = 0;
			me[SELECT_COUNT_BY_PHRASE] = {};
			me[ANSWER_COUNT_BY_PHRASE] = {};

			var isCountAll = questionPhraseIndex === -1 || questionPhraseIndex === UNDEF,
				activityContent = me[ACTIVITY_CONTENT], scoring = activityContent.scoring;
			var questionPhrases = activityContent.content.phrases || [];
			var index = isCountAll ? 0 : questionPhraseIndex,
				endIndex = isCountAll ? me[QUESTION_PHRASE_COUNT] - 1 : questionPhraseIndex;
			for (; index <= endIndex; index++) {
				var questionPhraseId = questionPhrases[index]._id;
				me[SELECT_COUNT_BY_PHRASE][questionPhraseId] = 0;
				if (scoring) {
					$.each(scoring.phrases || [], function (i, scoringPhrase) {
						if (scoringPhrase._id === questionPhraseId) {
							var scoringWordCount = scoringPhrase.items.length;
							me[ANSWER_COUNT] += scoringWordCount;
							me[ANSWER_COUNT_BY_PHRASE][questionPhraseId] = scoringWordCount;
							return false;
						}
					});
				} else {
					me[ANSWER_COUNT] += 1;
					me[ANSWER_COUNT_BY_PHRASE][questionPhraseId] = 1;
				}
			}
		},

		/**
		 * get phrase answer selector array
		 */
		_getAnswerSelector: function onGetAnswerSelector(phraseIndex, excludeWordId) {
			var me = this;
			var activityContent = me[ACTIVITY_CONTENT], scoring = activityContent.scoring, selector = [];
			if (scoring) {
				var phraseId = activityContent.content.phrases[phraseIndex]._id,
					isIncludeAll = excludeWordId === UNDEF;
				$.each(scoring.phrases || [], function (i, scoringPhrase) {
					if (scoringPhrase._id === phraseId) {
						$.each(scoringPhrase.items || [], function (i, word) {
							if (isIncludeAll || word._id !== excludeWordId) {
								selector.push('[data-word-id="' + word._id + '"]');
							}
						});
						return false;
					}
				});
			}
			return selector;
		},

		/**
		 * disable other option words when correct option is selected
		 */
		_disableOtherOption: function onDisableOtherOption($phrase, optionSelector) {
			$phrase
				.find(SEL_OPTION)
				.filter(optionSelector)
				.not(SEL_CORRECT)
				.addClass(CLS_DISABLED);
		},

		_isSelectableWord: function isSelectableWord($word) {
			return !(
				$word.hasClass(CLS_CORRECT) ||
				$word.hasClass(CLS_DISABLED) ||
				$word.hasClass(CLS_INCORRECT)
			);
		},

		_coundRemainingAnswers: function () {
			var me = this;
			var selectedAndCorrectCount = me[$ELEMENT].find([SEL_SELECTED, SEL_CORRECT].join(',')).length;
			return Math.max(0, me[ANSWER_COUNT] - selectedAndCorrectCount);
		},

		_updateAnsweredState: function updateAnsweredState() {
			var me = this;
			var $el = me[$ELEMENT];
			var remainingAnswers = me._coundRemainingAnswers();
			me[ITEM].answered(remainingAnswers === 0);
			$el.closest(SEL_PARENT_TEXT_SELECT).find(SEL_AR)
				.trigger(SWITCH_ANSWERS_NUM, { action: "set", step: remainingAnswers });
		},

		handleSelectText: function onSelectText($phrase, $word) {
			var me = this;
			var phraseId = $phrase.data(DATA_PHRASE_ID);
			var isGradeMode = me[IS_GRADE_MODE];
			var isAnyMode = me[IS_ANY_MODE];
			if (isGradeMode && isAnyMode && !$word.hasClass(CLS_SELECTED)) {
				var remainingAnswers = me._coundRemainingAnswers();
				if (remainingAnswers === 0) {
					return;
				}
			}
			me.disablePreviousIncorrectSelection($phrase, $word);
			if (!me[ITEM].instantFeedback()) { // prevent immediate feedback
				$word.toggleClass(CLS_SELECTED);
				var $siblings = $word.siblings(SEL_OPTION).filter(me.getOptionSelector($word));
				$siblings.removeClass(CLS_SELECTED);
				me._updateAnsweredState();
				return;
			}

			var wordId = $word.data('word-id');
			var correct;
			if (isGradeMode) {
				var optionIndex = $word.data(DATA_OPTION_GROUP_INDEX);
				correct = me.checkAnswer(phraseId, optionIndex, wordId);
			} else {
				correct = true;
				me[SELECT_COUNT] += 1;
				if (me[SELECT_COUNT] >= me[ANSWER_COUNT]) {
					me[ITEM].completed(true);
				}
			}
			me.displayInteractionResult(correct, $phrase, $word);
			me._updateAnsweredState();
		},

		checkAnswer: function (phraseId, optionIndex, wordId) {
			var me = this;
			var solution = Scoring.findById(me[ACTIVITY_CONTENT].scoring.phrases, phraseId);
			var solutionWord = Scoring.findById(solution.items, wordId);
			var correct = Boolean(solutionWord);
			var interaction = Interaction.makeTextSelectInteraction(correct, phraseId, optionIndex, wordId);
			var promise = me.publish("text-select/interaction", interaction);
			if (correct) {
				me[SELECT_COUNT] += 1;
				me[SELECT_COUNT_BY_PHRASE][phraseId] += 1;
				if (me[SELECT_COUNT] >= me[ANSWER_COUNT]) {
					me[ACTIVITY_CONTENT].content[IS_CORRECT] = true;
					promise.then(function(){
						me[ITEM].completed(true);
					});
				}
			}
			return correct;
		},

		displayInteractionResult: function (correct, $phrase, $word) {
			var me = this;

			me.disableCompletedPhrase($phrase);
			$word.removeClass(CLS_SELECTED);

			if (correct) {
				$word.addClass(CLS_CORRECT);
				if (!me[IS_ANY_MODE]) {
					me._disableOtherOption($phrase, me.getOptionSelector($word));
				}
			} else {
				$word.addClass(CLS_INCORRECT);
			}
		},

		disablePreviousIncorrectSelection: function ($phrase, $word) {
			var me = this;
			if (me[IS_ANY_MODE]) {
				$phrase
					.find(CONST.SEL_WORD)
					.filter(SEL_INCORRECT)
					.removeClass(CONST.CLS_INCORRECT)
					.addClass(CONST.CLS_DISABLED);
			} else {
				$phrase
					.find(CONST.SEL_WORD)
					.filter(me.getOptionSelector($word))
					.filter(SEL_INCORRECT)
					.removeClass(CONST.CLS_INCORRECT)
					.addClass(CONST.CLS_DISABLED);
			}
		},

		disableCompletedPhrase: function ($phrase) {
			var me = this;
			var phraseId = $phrase.data(DATA_PHRASE_ID);
			var selectCount = me[SELECT_COUNT_BY_PHRASE][phraseId];
			var answerCount = me[ANSWER_COUNT_BY_PHRASE][phraseId];
			if (selectCount === answerCount) {
				$phrase.removeClass(CONST.CLS_DOING);
			}
		},

		getOptionSelector: function ($word) {
			return "[" + ATTR_DATA_OPTION_GROUP_INDEX + "='" + $word.data(DATA_OPTION_GROUP_INDEX) + "']";
		},

		"dom:.ets-act-tsl-text/click": function onSelect($event) {
			var $word = $($event.target);
			if (!isOption($word)) {
				return;
			}

			var me = this;
			var $phrase = $($event.currentTarget);
			var phraseIndex = $phrase.data('phraseIndex');

			if ($phrase.hasClass(CLS_DOING) && me._isSelectableWord($word)) {
				var wordIndex = $word.data(DATA_WORD_INDEX);
				me.handleSelectText($phrase, $word, phraseIndex, wordIndex);
			}
		}
	});
});
