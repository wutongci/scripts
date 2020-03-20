define([
	'./scoring'
], function (Scoring) {
	'use strict';

	var PROP_CORRECT = 'correct';
	var PROP_ID = 'id';
	var PROP_ANSWER_ID = 'answerId';

	function newInteraction(correct, interactionId) {
		var interaction = {};
		interaction[PROP_CORRECT] = Boolean(correct);
		interaction[PROP_ID] = interactionId;
		return interaction;
	}

	return {
		makeMatchingInteraction: function (correct, solutionId, otherId) {
			var interaction = newInteraction(correct, solutionId);
			interaction[PROP_ANSWER_ID] = otherId;
			return interaction;
		},
		makeChoiceInteraction: function (json, questionIndex, selectedOptionId, questionCollection) {
			questionCollection = questionCollection || 'questions';
			var currentQuestion = json.content[questionCollection][questionIndex];
			var questionId = currentQuestion._id;
			var correct = Scoring.isQuestionOptionCorrect(json, {
				id: questionId,
				collection: questionCollection
			}, selectedOptionId);

			var interaction = newInteraction(correct, questionId);
			interaction[PROP_ANSWER_ID] = selectedOptionId;
			return interaction;
		},
		makeGroupingInteraction: function (correct, groupId, itemId) {
			var interaction = newInteraction(correct, itemId);
			interaction[PROP_ANSWER_ID] = groupId;
			return interaction;
		},
		makeSequencingInteraction: function (correct, sequenceId) {
			return newInteraction(correct, sequenceId);
		},
		makeTextSelectInteraction: function (correct, phraseId, optionIndex, wordId) {
			var interactionId;
			if (typeof optionIndex === 'number') {
				interactionId = [phraseId, optionIndex];
			} else {
				interactionId = phraseId;
			}
			var interaction = newInteraction(correct, interactionId);
			interaction[PROP_ANSWER_ID] = wordId;
			return interaction;
		},
		makeSubmitWritingInteraction: function () {
			return newInteraction(true, "Writing");
		},
		makeAlreadySubmittedWritingInteraction: function () {
			return newInteraction(true, "Writing");
		},
		makeAsrInteraction: function (correct, phraseId) {
			return newInteraction(correct, phraseId);
		},
		makeAsrFallbackInteraction: function (correct, phraseId) {
			return newInteraction(correct, phraseId);
		},
		makeTypingInteraction: function (correct, gapId) {
			return newInteraction(correct, gapId);
		},
		makeSkipInteraction: function(questionId) {
			return newInteraction(false, questionId);
		}
	};
});
