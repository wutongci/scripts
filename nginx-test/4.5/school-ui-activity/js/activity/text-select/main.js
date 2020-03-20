/**
 * text select main module definition
 */
define([
	"jquery",
	"poly",
	"when",
	"school-ui-activity/activity/base/main",
	"troopjs-core/component/factory",
	"template!./main.html",
	"./const"
], function TextSelectModule($, poly, when, Widget, Factory, tTemplate, CONST) {
	"use strict";

	var $ELEMENT = "$element";
	var SLASH = CONST.SLASH,
		DOUBLE_SLASH = CONST.DOUBLE_SLASH;
	var TYPE_MULTIPLE = "multiple",     //multiple select in each question(phrase)
		TYPE_SINGLE = "single",         //single select in each question(phrase)
		MODE_ANY = "any",               //select word freely
		MODE_SOME = "some";             //selected word should match answer

	/*!
	 * check text select type by scoring correct answer count
	 * if any one phrase's correct answer count is great than 1/non-grade return "multiple" else "single"
	 *
	 * @param {Object} scoring
	 * @return {String} "multiple"/"single"
	 *
	 * NOTE: call me BEFORE shuffle data
	 */
	function checkType(scoring) {
		if (!scoring) {
			return TYPE_MULTIPLE;
		}

		var type = TYPE_SINGLE;
		$.each(scoring.phrases || [], function (i, scroingPhrase) {
			if ((scroingPhrase.items || []).length > 1) {
				type = TYPE_MULTIPLE;
				return false;
			}
		});
		return type;
	}

	/*!
	 * check the 1st scoring phrase's 1st word
	 * to match content phrase word to see if it is in select any/given(some) word scenario
	 *
	 * CONDITION: correct word's prev/next/self* word is slash(/) text or not
	 *
	 * @param {Object} scoring
	 * @param {Array} phrases
	 * @return {String} "any"/"some"
	 *
	 * NOTE: this is a safer way and you had BETTER call me BEFORE shuffle data
	 */
	function checkMode(scoring, questionPhrases) {
		var mode = MODE_ANY;
		if (!scoring || !scoring.phrases || !scoring.phrases.length) {
			return mode;
		}

		function getWordNum(wordId) {
			return +("" + wordId).split("_")[2];
		}

		var scoringPhrase = scoring.phrases[0] || {};
		var scoringWords = scoringPhrase.items || [];

		var continuesScoringWordIds = [scoringWords[0]._id];

		// for continuous many answer case
		for (var index = 1; index < scoringWords.length; index++) {
			var prevScoringWordId = scoringWords[index - 1]._id;
			var nextScoringWordId = scoringWords[index]._id;

			if (getWordNum(nextScoringWordId) - getWordNum(prevScoringWordId) === 1) {
				continuesScoringWordIds.push(nextScoringWordId);
			}
			else {
				break;
			}
		}

		//if continuesScoringWordIds close to SLASH in question words, or includes SLASH, then mode=MODE_SOME
		$.each(questionPhrases || [], function (i, questionPhrase) {
			if (questionPhrase._id !== scoringPhrase._id) {
				return; //continue to next question phrase
			}

			var questionWords = questionPhrase.items, k = 0;
			$.each(questionWords || [], function (questionWordIndex, questionWord) {
				var text = questionWord.txt || "";
				if (questionWord._id === continuesScoringWordIds[k]) {
					if ((questionWords[questionWordIndex - 1] || {}).txt === SLASH ||
						(questionWords[questionWordIndex + 1] || {}).txt === SLASH ||
						(text !== SLASH && text !== DOUBLE_SLASH && text.indexOf(SLASH) >= 0)) {
						mode = MODE_SOME;
						return false;   //end question word iteration
					}
					if (++k >= continuesScoringWordIds.length) {
						return false;   //end question word iteration
					}
				}
			});
			return false;   //end question phrase iteration
		});

		return mode;
	}

	return Widget.extend({
		"sig/initialize": function () {
			var me = this;
			var activityContent = me._json || {};
			var ref = activityContent.references;
			var filterOptions = activityContent.filterOptions;
			var scoring = activityContent.scoring;
			var questionPhrases = (activityContent.content || {}).phrases || [];

			me.isGradeMode = Boolean(me.hasScoring);

			// init activity type
			me.isMultiType = TYPE_MULTIPLE === checkType(scoring);
			me.isAnyNode = MODE_ANY === checkMode(scoring, questionPhrases);
			me.hasSharedAudio = Boolean(ref && ref.aud && ref.aud.url);

			// init question count
			me.questionPhraseCount = Math.min(filterOptions.questionNo, questionPhrases.length);
			if (!me.isMultiType) {
				me.questionPhraseCount = 1;
			} else if (!me.hasScoring) {
				// set practice type for multiple and non-grade mode text select
				me.type(Widget.ACT_TYPE.PRACTICE);
			}
			var notInstantFeedback = Boolean(me.hasScoring);
			me.items().instantFeedback(!notInstantFeedback);
			me.length(me.questionPhraseCount);
		},

		"sig/render": function () {
			var me = this;
			var activityContent = me._json || {};

			// publish question number
			me.publish('activity/step/render', me.index(), me.length());

			if (!me[$ELEMENT]) {
				return;
			}

			if (!me._htmlPromise) {
				var data = {
					hasSharedAudio: me.hasSharedAudio,
					ref: activityContent.references,
					isMultiType: me.isMultiType,
					isGradeMode: me.isGradeMode
				};
				me._htmlPromise = me.html(tTemplate, data);
			}

			return me._htmlPromise.then(function () {
				var data = {
					activityContent: activityContent,
					hasSharedAudio: me.hasSharedAudio,
					isMultiType: me.isMultiType,
					isGradeMode: me.isGradeMode,
					isAnyMode: me.isAnyNode,
					questionPhraseCount: me.questionPhraseCount,
					questionPhraseIndex: me.isMultiType ? me.index() : -1,
					item: me.items()
				};
				me.publish("activity/text-select/render", data);
			});
		},

		"sig/stop": function () {
			this._htmlPromise = null;
		},

		"hub/text-select/interaction": function (interaction) {
			return this.publishInteraction(interaction);
		},

		nextStep: function onNextStep() {
			var me = this;
			if (me.index() >= me.length() - 1) {
				return when.resolve();
			}

			me.index(me.index() + 1);
			return me.signal("render");
		}
	});
});
