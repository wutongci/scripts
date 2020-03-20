/* global module:false */
if(typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(["jquery", "when"], function($, when) {
	"use strict";

    /*
     *  Common scoring related properties
     */
	var IS_CORRECT = "_isCorrect",
		OBJ_TOSTRING = Object.prototype.toString,
		ARRAY = "[object Array]",
		OBJECT = "[object Object]",
		EXCLUDED_PROPERTY_ARR = ["collapsed", "indexed", "expires"];

    /*
     *  ASR scoring related properties
     */
	var NUM_ASR_NOT_PASSED_ITEMS = "iNOT_PASSED",
		NUM_ASR_NEED_PASSED_ITEMS = "iNEED_PASSED",
		ASR_WORDS = "_asrWords",
		ORINGNAL_INDEX = "original_index",
		ID = "_id",
		SELECTED = "selected";

	var iBASE_LINE = 70,
		depth = 1;

	var ENUM_SCORING_TYPE = {
        /*ASR scoring type*/
		"ASR": "asr",
        /*Grouping like scoring type*/
		"GP": "grouping",
        /*Default scoring type*/
		"DEFAULT": "default"
	};

    /*
     *   Indicate whether 'o1' is sub-object of 'o2'
     */

	function isSubObj(o1, o2) {
		if(o1 === o2) {
			return true;
		}
		if(o1 === undefined || o1 === null || typeof(o1) !== "object") {
			return false;
		}
		if(o2 === undefined || o2 === null || typeof(o2) !== "object") {
			return false;
		}

		if(o1.constructor === o2.constructor) {
			if(isArray(o1)) {
				var len = o1.length;
				while(len--) {
					if(!isSubObj(o1[len], getElById(o2, getIdProp(o1[len])))) return false;
				}
			} else {
				for(var i in o1) {
                    //Somtimes, we need use '_id' or 'id' to do scoring opration,
                    //So we still need iterate '_id' and 'id' property
					if(arrayContains(EXCLUDED_PROPERTY_ARR, i)) continue;

					if(typeof(o1[i]) === "object") {
						if(!isSubObj(o1[i], o2[i])) return false;
					} else if(o1[i] !== o2[i]) {
						return false;
					}
				}
			}
			return true;
		}
		return false;
	}

    /**
    *   a is an array
        item is a string element
    */
	function arrayContains(a, item) {
		var ret = false;
		if(Array.prototype.indexOf) {
			ret = !! ~a.indexOf(item);
		} else {
			$.each(a, function(i, v) {
				if(item === v) {
					ret = true;
					return false;
				}
			});
		}
		return ret;
	}

    /**
     *  Return id or _id property of object.
     */

	function getIdProp(obj) {
		return obj["_id"] || obj["id"];
	}
    /**
     *   Assert obj is an array or not
     */

	function isArray(obj) {
		return OBJ_TOSTRING.call(obj) === ARRAY;
	}

	function isPlainObj(obj) {
		return OBJ_TOSTRING.call(obj) === OBJECT;
	}
    /*
     * Get activity property by activity type,such as "sequences","audios"
     */

	function getSameArrayProps(source, scoring) {
		if(!source || !scoring) return;
		var ret = [];
		for(var i in source) {
			if(source.hasOwnProperty(i) && scoring.hasOwnProperty(i) && isArray(source[i])) {
				ret.push(i);
			}
		}
		return ret;
	}

    /*
     *  Get Specific items from 'objArray' by object's property 'id'
     */

	function getElById(objArray, id) {
		var len = objArray.length,
			currItem;

		while(len--) {
			currItem = objArray[len];
			if(getIdProp(currItem) === id) {
				return currItem;
			}
		}
	}

    /**!
    *  Indicate have ASR scoring record or not, if have ,
       then do ASR scroing check too.

    *  Params:
    *  source {Object} current source content
    */
	function checkASRScoring(source){
		if(source && source[ASR_WORDS]){
			return source[IS_CORRECT];
		}

		return;
	}

    /*
     *  Mark 'isCorrect' flag for source content
     */
	function markJSON(currSource, currScoring) {
        //For root element, it don't need to marked here
		if(depth === 1) {
			return;
		}

		var result = true;
		if(isSubObj(currScoring, currSource) || checkASRScoring(currSource)) {
			currSource[IS_CORRECT] = true;
		} else {
			currSource[IS_CORRECT] = false;
			result = false;
		}

		depth--;

		return result;
	}

    /*
     * This function actually is used to check whether current activity have passed or not,
     *   When 70% questions have passed, then activity passed.
     *
     *   actContent {Object}
     *   actScoring {Object}
     */

	function markRoot(actContent, actScoring) {
		if(!actContent || !actScoring) return;

		var arrProps = getSameArrayProps(actContent, actScoring),
			propsLen = arrProps.length,
			len, i, iCorr = 0,
			currItem, currPorp;

		while(propsLen--) {
			currPorp = arrProps[propsLen];
			currItem = actContent[currPorp];
			len = currItem.length;

			if(currItem[IS_CORRECT]) continue;

			for(i = 0; i < len; i++) {
				if(currItem[i][IS_CORRECT]) {
					iCorr++;
				}
			}

			if(iCorr * 100 / len < iBASE_LINE) {
				actContent[IS_CORRECT] = false;
				return;
			}
		}

		actContent[IS_CORRECT] = true;
	}

    /*
        process and update jsondata
        actContent : activity content
        actScoring : activity scoring
    */
	function parse(actContent, actScoring) {
		if(!actContent || !actScoring) {
			return;
		}

        //traverse depth increase
		depth++;

		var currProp, currScoring, currSource, currId, len, result = false;
		var arrProps = getSameArrayProps(actContent, actScoring),
			arrPorpLen = arrProps.length;

		while(arrPorpLen--) {

			currProp = arrProps[arrPorpLen];
			currScoring = actScoring[currProp];
			currSource = actContent[currProp];
			len = currScoring.length;
			currSource[IS_CORRECT] = true;

			while(len--) {
				if(isPlainObj(currScoring[len])) {
					currId = getIdProp(currScoring[len]);
					parse(getElById(currSource, currId), currScoring[len]) || (currSource[IS_CORRECT] = false);
				}
			}
		}

		if(actScoring) {
			result = markJSON(actContent, actScoring);
		}

		return result;
	}

    /* ASR Scoring Logic
     *  actContent {Object} activity content node in json data
     *  actScoring {Object} activity scoring node in json data
     *  currResult {Object} Current ASR recganize result
     *      Notes:
     *          ASR Scoring have two types:
     *          1. Only have one option to recognize
     *              In this case, only need to go through ASR_Scoring logic
     *          2. Recgonize more than one options,'currResult' will contains 'index' property
     *              In this case, need to go through ASR_Scoring and Common_Scoring logic
     *
     */

	function parseASRScoring(actContent, actScoring, currResult) {
		var arrEls = getSameArrayProps(actContent, actScoring),
			iNotPassed = 0,
			iNeedPassed, length, allItems, currItem, currSubItem;

        //todo: find most case for ASRResult
		currResult = currResult[0];

		if(arrEls && arrEls.length && currResult) {
            //Note: 1. Here assume "actContent" only have one array element
            //      2. 'this' is point to current activity instance
			allItems = actContent[arrEls[0]];

			$.each(allItems, function(i, item) {
				if(item[ID] === currResult[ID]) {
					currItem = item;
					return false;
				}
			});

            //ASR Result contains 'index' property
			if(currItem) {
                //1. find current recording sub-item in currentItem
				for(var key in currItem) {
					if(key !== ASR_WORDS && currItem.hasOwnProperty(key) && isArray(currItem[key])) {
						currSubItem = currItem[key];
						break;
					}
				}
                //Notes: Because 'index' always exists in ASR Result,
                //       So we need to check wheither has sub-item.
                //       if it is has, we need to preprocess json and go through common scoring.
                //       Otherwise, we only need mark json by result score.
				if(currSubItem) {
                    //2. mark selected symbol
					$.each(currSubItem, function(i, item) {
						if(item[ORINGNAL_INDEX] === currResult.index - 1) {
							item[SELECTED] = true;
						} else {
							item[SELECTED] = false;
						}
					});
                    //3. go trrough common scoring logic
					parse(actContent, actScoring);
				} else {
					if(currResult.score >= iBASE_LINE) {
						currItem[IS_CORRECT] = true;
					} else {
						currItem[IS_CORRECT] = false;
					}
					delete currResult.score;

					if(currResult.words) {
						$.each(currResult.words, function(i, word) {
							if(word.score >= iBASE_LINE) {
								word[IS_CORRECT] = true;
							} else {
								word[IS_CORRECT] = false;
							}
							delete word.score;
						});

						currItem[ASR_WORDS] = currResult.words;
					}
				}

                //mark ASR related JSON
				$.each(allItems, function(i, item) {
					if(!item[IS_CORRECT]) {
						iNotPassed++;
					}
				});

				length = allItems.length;
				iNeedPassed = Math.ceil(length * iBASE_LINE / 100);

				actContent[NUM_ASR_NOT_PASSED_ITEMS] = iNotPassed;
				actContent[NUM_ASR_NEED_PASSED_ITEMS] = iNeedPassed;
				actContent[IS_CORRECT] = iNeedPassed <= length-iNotPassed;
			}
		}
	}

	return {
		compute: function computeScore(actJSON, actInstance, option, /*data1,data2 ...*/ deferred) {
			deferred = deferred || $.Deferred();
            //reset current depth
			depth = 1;
			option = option || {
				scoringType: ENUM_SCORING_TYPE.DEFAULT
			};

			switch(option.scoringType) {
				case ENUM_SCORING_TYPE.ASR:
					parseASRScoring.call(actInstance, actJSON.content, actJSON.scoring, option.currASRResult);
					break;
				case ENUM_SCORING_TYPE.DEFAULT:
				default:
					parse.call(actInstance, actJSON.content, actJSON.scoring);
					markRoot(actJSON.content, actJSON.scoring);
			}

			deferred.resolve(actJSON);
			return when.resolve(actJSON);
		}
	}
});
