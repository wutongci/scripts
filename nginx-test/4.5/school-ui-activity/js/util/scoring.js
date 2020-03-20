define([
], function () {
	'use strict';

	var BASE_ASR_SCORE = 70;

	function findById(array, id) {
		var index;
		var length = array.length;
		for (index = 0; index < length; ++index) {
			var element = array[index];
			if (element._id && element._id === id) {
				return element;
			}
		}
		return undefined;
	}

	// ASR_MIN_PASSED_QUESTIONS_RATE and BASE_ASR_SCORE happen to both be "70%" at the moment
	// but they have different purposes and may have different values in the future

	return {
		ASR_MIN_PASSED_QUESTIONS_RATE: 0.7,
		BASE_ASR_SCORE: BASE_ASR_SCORE,
		findById: findById,
		isPhraseCorrect: function(phrase) {
			return phrase.score >= BASE_ASR_SCORE;
		},
		isWordCorrect: function(word) {
			return word.score >= BASE_ASR_SCORE;
		},
		isQuestionOptionCorrect: function (json, question, selectedOptionId) {
			var solution = findById(json.scoring[question.collection], question.id);
			var solutionOption = findById(solution.options, selectedOptionId);
			return Boolean(solutionOption.selected);
		}
	};
});
