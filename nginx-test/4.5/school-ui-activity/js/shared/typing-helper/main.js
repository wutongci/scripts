define([
	'jquery',
	'json2',
	'underscore',
	'school-ui-shared/utils/ccl',
	'when'
], function ($, JSON, _, ccl, when) {
	"use strict";

	var helper = {};

	var cleanSpaces = function(text) {
		return $.trim(text.replace(/\s+/g, ' '));
	};

	/** adapt to multiple character
	 * like story: spc-2850 and ANATELE-1052
	 * To support multiple char in the user input answer and scoring.
	 * like char " ` " is same with " ' "  in user story spc-2850
	 * like some char looks same but with different unicode: ANATELE-1052
	 */
	var replaceRegexDict;
	var replaceRegexDictPromise = when.promise(function (resolve, reject) {
		var CCL_TYPING_REPLACE_DICT = 'ccl!"e13.activity.typing.replaceDict"';
		ccl.query(CCL_TYPING_REPLACE_DICT).spread(function (replace_JSON) {
			// transform string JSON to really JSON and Regex
			try {

				replaceRegexDict = JSON.parse(replace_JSON.value);

				if (replaceRegexDict) {
					$.each(replaceRegexDict, function (key, value) {
						var pattern;
						var flags;

						if (value.indexOf('/') == 0) {
							var lastIndex = value.lastIndexOf("/");
							pattern = value.substring(1, lastIndex);
							flags = value.substring(lastIndex + 1);
						}
						else {
							pattern = value;
						}

						replaceRegexDict[key] = new RegExp(pattern, flags);
					});

					resolve(replaceRegexDict);
				} else {
					// if this function is closed, it would not block any things.
					reject(e);
				}
			}
			catch (e) {
				// if CCL value is not correct, or some error here, it likes no this module at all,
				// Would not block any things.
				// TODO: throw up to the error log
				reject(e);
			}
		});
	});

	var replaceMultipleCharacters = function (str) {
		//Assume replaceRegexDict already loaded
		if (_.isString(str)) {
			$.each(replaceRegexDict, function (keyValue, regex) {
				str = str.replace(regex, keyValue);
			});
		}
		return str;
	};

	helper.readyPromise = replaceRegexDictPromise;

	helper.prepareTypingSolution = function prepareTypingSolution(solution) {
		return solution.split('/').map(cleanSpaces).map(replaceMultipleCharacters);
	};
	helper.cleanTypingAnswer = function prepareTypingSolution(answer) {
		return replaceMultipleCharacters(cleanSpaces(answer));
	};

	return helper;
});
