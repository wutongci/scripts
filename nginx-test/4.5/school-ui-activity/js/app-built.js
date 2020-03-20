define('school-ui-activity/activity/base/item',[
	'when',
	"troopjs-core/component/factory",
	'troopjs-core/pubsub/hub'
], function (when, Factory, hub) {

	var TOPIC_ITEMPROP = "activity/item/prop/changed/";
	var PROMISE_SUFFIX = 'Promise';

	var PROP = {
		/* Return true or false, indicates if current answer is intact so that it can be checked by scoring.compute */
		ANSWERED: 'answered',
		/* indicates if current activity enabled instance feedback */
		INSTANT_FEEDBACK: 'instantFeedback',
		/* indicates if current activity is savable */
		SAVABLE: 'savable',
		/* indicates if current activity is completed */
		COMPLETED: 'completed'
	};

	var methods = {
		_pubProps: function () {
			var me = this;
			var promises = [];
			for (var key in PROP) {
				if (!PROP.hasOwnProperty(key)) {
					return;
				}

				// compulsory publish the change
				var currentValue = methods[PROP[key]].call(me);
				var promise = methods[PROP[key] + PROMISE_SUFFIX].call(me, currentValue, false);
				promises.push(promise);
			}
			return when.all(promises);
		}
	};

	// setup state APIs
	for (var key in PROP) {
		if (!PROP.hasOwnProperty(key)) {
			return;
		}

		methods[PROP[key]] = (function (key) {
			/*
			 * @param silent true to not publishing, false to force publishing, undefined
			 * indicates that the publishing happen only when the value is updated.
			 */
			return function (value, silent) {
				var _key = this['_' + key];

				if (arguments.length >= 1 && (silent === false || value !== _key)) {
					this['_' + key] = value;
					if (silent !== true) {
						hub.publish(TOPIC_ITEMPROP + PROP[key], value, this._index, this);
					}
				}

				return _key;
			};
		})(key);

		methods[PROP[key] + PROMISE_SUFFIX] = (function (key) {
			/*
			 * @param silent true to not publishing, false to force publishing, undefined
			 * indicates that the publishing happen only when the value is updated.
			 */
			return function (value, silent) {
				var previousValue = this['_' + key];

				if (arguments.length >= 1 && (silent === false || value !== previousValue)) {
					this['_' + key] = value;
					if (silent !== true) {
						return hub.publish(TOPIC_ITEMPROP + PROP[key], value, this._index, this)
								.then(function() {
									return previousValue;
								}, function() {
									//ignore error
									return previousValue;
								});
					}
				}

				return when.resolve(previousValue);
			};
		})(key);

	}

	return Factory(function (index/*, json*/) {

		this._index = index;

		this[PROP.ANSWERED](false, true);
		this[PROP.INSTANT_FEEDBACK](false, true);
		this[PROP.SAVABLE](false, true);
		this[PROP.COMPLETED](false, true);

	}, methods);
});
/**
 * @class Activity/Base
 * Base class of activity widget
 * Defined the interfaces that activity must implement.

 * Constructor:
 ($element, name, json, iScoring)
 json - The json that contains all information about activity, such as template code, contents...etc
 iScoring - The object which implemented compute(deferred) method, the compute(deferred) should resolve deferred with
 json that contains result of checking answer

 * Abstract Methods:
 nextStep(deferred) - Switch to next sub question

 * Public Methods:
 checkAnswer(deferred) - Trigger answer checking, activity reveal the state of user's answer.

 * Available Channels/Topics:
 activity/set/result - calls _setResult()
 activity/get/result - calls _getResult()
 activity/check/answer - calls checkAnswer(deferred)
 activity/next/step - switch to next sub question


 */
define('school-ui-activity/activity/base/main',[
	"jquery",
	"when",
	"compose",
	"troopjs-ef/component/widget",
	"troopjs-core/pubsub/hub",
	"school-ui-shared/utils/typeid-parser",
	"json2",
	"./item"
], function ActivityBaseModule($, when, Compose, Widget, Hub, Parser, JSON, Item) {
	"use strict";

	var TOPIC_LOAD_ENROLLMENT = 'load/enrollment';

	var PROP_JSON = '_json',
		PROP_START_TIME = '_startTime',
		PROP_SOURCE = "_source",
		PROP_ISCORING = '_scoring',
		PROP_ENROLLMENT_LOADED = '_enrollmentLoaded',
		PROP_ONANSWERCHECKED = '_onAnswerChecked';

	var MUST_HAS = [
		PROP_JSON,
		PROP_ISCORING,
		PROP_ONANSWERCHECKED
	];

	var ACT_ID = "act_id",
		ACT_TEMPLATE_ID = "act_template_id",
		ACT_CONTENT = "activityContent",
		STU_ID = "studentCourseId",
		SCORING = "scoring",
		IS_CORRECT = "_isCorrect",
		HAS_PASSED = "hasPassed",
		LEARNING = "LEARNING",
		EXERCISE = "EXERCISE",
		WRITING_CONTENT = "_writingContent";

	var ACT_TYPE = {
		/* indicates current activity is a 'LEARNING' activtiy or not  */
		LEARNING: 2,
		/* indicates current activity is a 'EXERCISE' activtiy or not */
		EXERCISE: 1,
		/* indicates current activity is a 'PRACTICE' activtiy or not */
		PRACTICE: 3
	};

	/**
	 * Properties:
	 * (BELOW API SHOULD NOT BE CHANGED ONCE STABLIZED)
	 * BELOW API SHOULD NOT BE CHANGED ONCE STABLIZED
	 */
	var PROP = {
		/* indicates if current activity is completed */
		COMPLETED: 'completed',
		/* indicates current sub question index */
		INDEX: 'index',
		/* indicates how many sub question does current activity has */
		LENGTH: 'length',
		/* indicates current act type, 1. exercise, 2. learning 3. practice */
		TYPE: 'type'
	};
	var PROMISE_SUFFIX = 'Promise';

	var ENUM_SCORING_TYPE = {
		"ASR": "asr",
		"GP": "grouping",
		"DEFAULT": "default"
	};


	var ENUM_ASR_FALLBACK_TYPE = {
		TYPING: "TYPING",
		SELECT: "SELECT",
		NEXT: "NEXT"
	};

	var TOPIC_PROP = "activity/prop/changed/",
		TOPIC_ACT_SUBMIT_SCORE = "activity/submit/score",
		TOPIC_RENDER_ACT = "render/activity";

	var baseLength, baseIndex, baseIndexPromise, currentInstance;

	function submitScore() {
		if (this._submitted === true) {
			return;
		}

		this._submitted = true;

		var content = this._json.content,
			hasPassed = !this.hasScoring || typeof content === "undefined" || content[IS_CORRECT],
			isGradedWriting = this.type() === ACT_TYPE.EXERCISE && this._json[WRITING_CONTENT],
			score = (hasPassed || isGradedWriting) ? 100 : 0,
			writingContent = this._json[WRITING_CONTENT];

		var details = {
			actId: this[ACT_ID],
			startTime: this[PROP_START_TIME],
			completeTime: new Date().getTime()
		};

		this.publish(TOPIC_ACT_SUBMIT_SCORE, score, writingContent, details);
	}

	// define the member methods
	var methods = {
		"sig/start": function onStart() {
			var me = this;
			me[PROP_START_TIME] = new Date().getTime();

			var platformVersionPromise = me
				.query("student_platform_version!current")
				.spread(function doneQuery(platformVersion) {
					me.platformVersion = platformVersion && platformVersion.version;
				});

			//don't use hub:memory for following topic to avoid deadlock in sig/render
			Hub.subscribe(TOPIC_LOAD_ENROLLMENT, me, me.onLoadEnrollment);
			var loadEnrollmentPromise = Hub.reemit(TOPIC_LOAD_ENROLLMENT, false, me, me.onLoadEnrollment);

			return when.all([platformVersionPromise, loadEnrollmentPromise])
				.then(function () {
					return me.signal('render');
				});
		},
		"sig/stop": function onStop() {
			var me = this;
			Hub.unsubscribe(TOPIC_LOAD_ENROLLMENT, me, me.onLoadEnrollment);
		},
		"onLoadEnrollment": function onLoadEnrollment(enrollment) {
			var me = this;
			if (enrollment) {
				me[STU_ID] = Parser.parseId(enrollment.id);
			}
			me[PROP_ENROLLMENT_LOADED].resolve();
		},
		//Want activityCompleted to be overridable
		"activityCompleted": function activityCompleted(hasCompelted) {
			//For learning activity, student need click 'Next' to submit score.
			if (hasCompelted && this.type() !== ACT_TYPE.LEARNING && currentInstance === this) {
				submitScore.call(this);
			}
		},
		//Want retryActivity to be overridable
		"retryActivity": function () {
			return this.publish(TOPIC_RENDER_ACT, this[ACT_ID]);
		},

		"hub/activity/next/step": function onNextStep() {
			if (currentInstance !== this) return;

			this.hasScoring || this.items(this.index()).completed(true);
			return this.nextStep();
		},
		"hub/activity/submit/score/proxy": function onActivityMoveon() {
			if (this.type() === ACT_TYPE.LEARNING && currentInstance === this) {
				submitScore.call(this);
			}
		},
		"hub/activity/retry": function onNextStep() {
			if (currentInstance !== this) return;

			return this.retryActivity();
		},
		"hub:memory/activity/prop/changed/type": function onTypeChanged(type) {
			if (type !== ACT_TYPE.EXERCISE && currentInstance === this) {
				this.hasScoring = false;
			}
		},
		// Automatically score submitting
		"hub/activity/prop/changed/completed": function (hasCompelted) {
			this.activityCompleted(hasCompelted);
		},
		"hub/activity-container/bottom-bar/item/completed": function (state, itemIndex) {
			this.publish("activity/item/prop/changed/completed", state, itemIndex);
		},
		"hub/activity/item/prop/changed/completed": function onItemCompleted(itemCompleted, itemIndex, _self) {
			if (_self && this._items[itemIndex] !== _self) return;

			this.items(itemIndex).completed(itemCompleted);

			var allCompleted = true;
			for (var l = this.length(); l--;) {
				if (!this.items(l).completed()) {
					allCompleted = false;
					break;
				}
			}

			if (allCompleted) {
				this.completed(true);
			}
		},
		/*
		 Use a common way to add automation testing asset dom.
		 */
		attachATAssetDom: function (data) {
			var me = this;

			if (data) {
				return $('<div class="ets-hidden" data-weave="school-ui-activity/shared/automation-test/main(assets)"></div>')
					.data("assets", data)
					.appendTo(me.$element)
					.weave();
			} else {
				return when.resolve();
			}
		},

		scoringType: function (type) {
			if (type) {
				this._scoringType = type;
			}
			return this._scoringType || ENUM_SCORING_TYPE.DEFAULT;
		},

		publishInteraction: function(interaction) {
			return this.publish('activity/interaction', $.extend(interaction, {
				activityId: this[ACT_ID]
			}));
		},

		getWritingHist: function () {
			var me = this;
			return me[PROP_ENROLLMENT_LOADED].promise.then(function () {
				var act_id = Parser.parseId(me[ACT_ID]);
				if (me[STU_ID]) {
					var query;
					if (me.platformVersion === "2.0") {
						query = "integration_student_writing!" + act_id;
					} else {
						query = "writing_status!" + me[STU_ID] + ";" + act_id;
					}
					return me.query(query)
						.spread(function (writingInfo) {
							return writingInfo;
						});
				} else {
					return when.resolve(null);
				}
			});
		},

		getProgress: function () {
			var me = this;
			return me[PROP_ENROLLMENT_LOADED].promise.then(function () {
				var actId = Parser.parseId(me[ACT_ID]);
				if (me[STU_ID]) {
					var query;
					if (me.platformVersion === "2.0") {
						query = "student_activity_progress!" + actId;
					} else {
						query = 'progress!' + me[STU_ID] + ';activity;' + actId;
					}
					return me.query(query).spread(function (activityProgress) {
						return activityProgress;
					});
				} else {
					return when.resolve(null);
				}
			});
		},

		nextStep: function onNextStep() {
			return when.resolve();
		},

		items: function getItem(index) {

			if (arguments.length < 1) {
				index = this.index();
			}

			if (!this._items[index]) {
				this._items[index] = new Item(index, this._json);
			}

			return this._items[index];
		}
	};

	// setup state APIs
	for (var key in PROP) {
		if (!PROP.hasOwnProperty(key)) {
			return;
		}

		methods[PROP[key]] = (function (key) {
			return function (value) {
				var _key = this['_' + key];
				if (arguments.length >= 1 && value !== _key) {
					this['_' + key] = value;
					this.publish(TOPIC_PROP + PROP[key], value);
				}

				return _key;
			};
		})(key);

		methods[PROP[key] + PROMISE_SUFFIX] = (function (key) {
			return function (value) {
				var previousValue = this['_' + key];
				if (arguments.length >= 1 && value !== previousValue) {
					this['_' + key] = value;
					return this.publish(TOPIC_PROP + PROP[key], value)
						.then(function () {
							return previousValue;
						}, function () {
							//ignore error
							return previousValue;
						});
				}

				return when.resolve(previousValue);
			};
		})(key);

	}

	// overwrite the baseLength to automatically create sub item instance when
	// length get set
	baseLength = methods[PROP.LENGTH];

	methods[PROP.LENGTH] = function (value) {

		if (value != undefined &&
			typeof value == 'number') {
			for (var l = value; l--;) {
				this.items(l);
			}
		}

		return baseLength.apply(this, arguments);
	};

	baseIndex = methods[PROP.INDEX];

	methods[PROP.INDEX] = function (value) {
		if (value != undefined &&
			typeof value == 'number') {

			if (value >= this.length()) {
				throw this + ': new index() is greater or equal to length()';
			}

			var item = this.items(value);

			item._pubProps();
		}
		return baseIndex.apply(this, arguments);
	};

	baseIndexPromise = methods[PROP.INDEX + PROMISE_SUFFIX];

	methods[PROP.INDEX + PROMISE_SUFFIX] = function (value) {
		var args = arguments, me = this;
		if (value != undefined &&
			typeof value == 'number') {

			if (value >= this.length()) {
				return when.reject(new Error(this + ': new index() is greater or equal to length()'));
			}

			var item = this.items(value);

			return item._pubProps()
				.then(function () {
					return baseIndexPromise.apply(me, args);
				});
		}
		return baseIndexPromise.apply(me, args);
	};

	// setup must-have methods
	for (var l = MUST_HAS.length; l--;) {
		methods[MUST_HAS[l]] = Compose.required;
	}

	var ret = Widget.extend(function ($element, name, option) {

		currentInstance = this;
		this._items = [];
		this[PROP_SOURCE] = option[ACT_CONTENT];
		// http://jsfiddle.net/TESeT/1/
		//this[PROP_JSON] = JSON.parse(JSON.stringify(option[ACT_CONTENT]));
		try {
			this[PROP_JSON] = JSON.parse(JSON.stringify(option[ACT_CONTENT]));
		}
		catch (err) {
			throw "JSON parse error. Invalid JSON string."
		}
		this[PROP_ISCORING] = option[SCORING];
		this[ACT_ID] = option[ACT_ID];
		this[ACT_TEMPLATE_ID] = option[ACT_TEMPLATE_ID];
		this[HAS_PASSED] = option[HAS_PASSED];

		this[PROP.COMPLETED](false);
		this[PROP.INDEX](0);
		this[PROP.LENGTH](1);
		this._score = 100;

		if (this.hasScoring = !!option[ACT_CONTENT].scoring) {
			this.type(ACT_TYPE[EXERCISE]);
		} else {
			this.type(ACT_TYPE[LEARNING]);
		}

		this[PROP_ENROLLMENT_LOADED] = when.defer();

	}, methods);

	ret.ACT_TYPE = ACT_TYPE;
	ret.SCORING_TYPE = ENUM_SCORING_TYPE;
	ret.ASR_FALLBACK_TYPE = ENUM_ASR_FALLBACK_TYPE;
	return ret;
});

define('school-ui-activity/util/scoring',[
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

define('school-ui-activity/util/interaction',[
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


define('troopjs-requirejs/template!school-ui-activity/activity/flashcard-choice/flashcard-choice.html',[],function() { return function template(data) { var o = "";
var blurb = function(id,en){
	    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
	    return res;
	};
o += "\n\n<div class=\"ets-act-fce\">\n\t<div class=\"ets-act-fce-main\">\n\t\t<div class=\"ets-act-fce-bd\">\n\t\t\t<div class=\"ets-act-fce-stack\">\n\t\t\t\t";
				var data = data || {};
				var cards = data.cards;
				var correctRequired = data.correctRequired;
				for(var i = 0; i < cards.length; i++){
					writeItem(cards[i], i);o += "\n\t\t\t\t";}o += "\n\t\t\t</div>\n\t\t\t<div class=\"ets-act-fce-ctrl\">\n\t\t\t\t<div class=\"ets-bd\">\n\t\t\t\t\t<div data-at-id=\"btn-skip\" class=\"ets-act-fce-btn ets-act-btn-skip ets-btn-skip\"><span " +blurb(450011,"Skip")+ "></span></div>\n\t\t\t\t\t<div class=\"ets-act-fce-number\">\n\t\t\t\t\t\t<span class=\"ets-act-fce-number-current\"></span> / <span class=\"ets-act-fce-number-total\"></span>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"ets-act-fce-ft\">\n\t\t\t<div class=\"ets-act-fce-choice\">\n\t\t\t\t";
				for(var i = 0; i < cards.length; i++){
					writeOption(cards[i], i);o += "\n\t\t\t\t";}o += "\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t\n\t<!-- Activity Summary Start-->\n\t<div class=\"ets-act-summary-wrap\"></div>\n\t<!-- Activity Summary End-->\n</div>\n\n"; function writeItem(data, index) { 
	var index = parseInt(index) + 1;
	o += "\n\t<div class=\"ets-act-fce-card ";if (index > 4) {o += "ets-candidate ";} else {o += " ets-stack-" +index+ " ";}o += "\" id=\"ets-act-fce-card" +data._id+ "\" data-id=\"" +data._id+ "\" data-at-id=\"" +data._id+ "\">\n\t\t<div class=\"ets-bd\">\n\t\t\t<img src=\"" +data.image.url+ "\" />\n\t\t</div>\n        <div class=\"ets-icon\">\n            <span></span>\n        </div>\n\t\t<div class=\"ets-ft\">\n\t\t\t<div class=\"ets-act-fce-word ets-audio-only\">\n\t\t\t\t<div class=\"ets-audio\">\n\t\t\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap ets-ap-small\">\n\t\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t\t\t       data-src=\"" +data.audio.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t\t\t       data-at-id=\"answer_audio_" +data._id+ "\"\n\t\t\t\t\t\t       class=\"ets-ap ets-ap-small ets-ap-nobar\"></audio>\n\t\t\t\t\t</div></div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n"; } o += "\n\n"; function writeOption(data, index) { 
	var index = parseInt(index) + 1;
	o += "\n\t<ul class=\"ets-options ets-cf ets-none\" id=\"" +data._id+ "\" data-id=\"" +data._id+ "\">\n\t\t";for (var l = 0; l < data.options.length; l ++) {o += "\n\t\t<li id=\"" +data.options[l]._id+ "\"  data-id=\"" +data.options[l]._id+ "\" data-at-id=\"" +data.options[l]._id+ "\"><span>" +data.options[l].text+ "</span></li>\n\t\t";}o += "\n\t</ul>\n"; }  return o; }; });
define('school-ui-activity/activity/flashcard-choice/flashcard-choice',[
	'jquery',
	'jquery.ui',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'school-ui-activity/util/scoring',
	'template!./flashcard-choice.html'
], function ($, ui$, poly, when, Widget, Interaction, Scoring, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";
	var HUB_REMOVE_INTRO_TITLE = "dispose/reference";

	var SEL_FCE_MAIN = ".ets-act-fce-main",
		CLS_DISABLED = "ets-disabled",
		CLS_FIRST = "ets-stack-1",
		CLS_SECOND = "ets-stack-2",
		CLS_THIRD = "ets-stack-3",
		CLS_FOURTH = "ets-stack-4",
		CLS_CANDIDATE = "ets-candidate",
		CLS_DONE = "ets-done",
		CLS_NONE = "ets-none",
		CLS_INCORRECT = "ets-incorrect",
		CLS_CORRECT = "ets-correct",

		SEL_AUDIO = ".ets-ap",

		SEL_FIRST_CARD = ".ets-act-fce-card.ets-stack-1",
		SEL_SECOND_CARD = ".ets-act-fce-card.ets-stack-2",
		SEL_THIRD_CARD = ".ets-act-fce-card.ets-stack-3",
		SEL_FOURTH_CARD = ".ets-act-fce-card.ets-stack-4",
		SEL_CANDIDATE = ".ets-act-fce-card.ets-candidate",
		SEL_BTN_SKIP = ".ets-act-fce-btn.ets-btn-skip",
		SEL_QUESTION = ".ets-act-fce-choice > .ets-options",

		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		SEL_COUNT_CURRENT = ".ets-act-fce-number-current",
		SEL_COUNT_TOTAL = ".ets-act-fce-number-total",

		SEL_SUMMARY_PASS = ".ets-act-fce-summary > .ets-hd > .ets-pass",
		SEL_SUMMARY_FAIL = ".ets-act-fce-summary > .ets-hd > .ets-fail",

		SEL_SUMMARY_REQUIRE_MSG = ".ets-act-fce-summary > .ets-ft > p",

		SEL_CORRECT_ICON = ".ets-icon span",

		SWITCH_DELAY = 800,
		FEEDBACK_DELAY = 500;

	// Constructor
	function Ctor() {
		this.currentCardIndex = 0;
	}

	// # Render
	function render() {
		var me = this;
		var flashcards = this._json.content.flashCards;

		this.totalCards = this._json.content.flashCards.length;

		if (!flashcards || !flashcards.length) {
			return when.reject(new Error(this.toString() + EX_JSON_FORMAT));
		}

		me.correctRequired = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * me.totalCards);
		me.correctCount = 0;
		me.incorrectCount = me.totalCards;

		me.html(tTemplate, {cards: this._json.content.flashCards, correctRequired: me.correctRequired})
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_BTN_SKIP).click(function () {
			if ($(this).hasClass(CLS_DISABLED)) {
				return;
			}
			me.publishSkipInteraction(me.currentCardIndex)
				.then(function () {
					switchCard.call(me);
				})
		});

		me.$activeCard = $el.find(SEL_FIRST_CARD);
		me.$activeQuestion = $el.find(SEL_QUESTION).filter(function () {
			return $(this).data("id") == me.$activeCard.data("id");
		});
		$el.find(SEL_QUESTION).addClass(CLS_NONE);
		me.$activeQuestion.removeClass(CLS_NONE);

		$el.find(SEL_QUESTION + " li").click(function () {
			onClickOption.call(me, $(this));
		});

		$el.find(SEL_COUNT_TOTAL).text(me.totalCards);
		$el.find(SEL_COUNT_CURRENT).text(me.currentCardIndex + 1);
	}

	function switchCard() {
		var me = this,
			$el = this.$element;

		// send pause to all audio in activity
		$el.find(SEL_AUDIO).trigger('player/pause');

		if (me.currentCardIndex + 1 >= me.totalCards) {
			$el.find(SEL_BTN_SKIP).addClass(CLS_NONE);
			me._item.completed(true);
			$el.find(SEL_FCE_MAIN).fadeOut(200, function () {
				viewSummary.call(me);
			});
		} else {
			var $firstCard = $el.find(SEL_FIRST_CARD),
				$secondCard = $el.find(SEL_SECOND_CARD),
				$thirdCard = $el.find(SEL_THIRD_CARD),
				$fourthCard = $el.find(SEL_FOURTH_CARD),
				$candidate = $($el.find(SEL_CANDIDATE).first());

			me.currentCardIndex++;
			$el.find(SEL_COUNT_TOTAL).text(me.totalCards);
			$el.find(SEL_COUNT_CURRENT).text(me.currentCardIndex + 1);


			$firstCard.animate({left: "+=150", top: "-=100", opacity: "0"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_FIRST).addClass(CLS_DONE);
				$el.find(SEL_BTN_SKIP).removeClass(CLS_DISABLED);
			});

			$secondCard.animate({top: "0", left: "12"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_SECOND).addClass(CLS_FIRST);
				if (me.currentCardIndex < me.totalCards) {
					me.$activeCard = $el.find(SEL_FIRST_CARD);
					me.$activeQuestion = $el.find(SEL_QUESTION).filter(function () {
						return $(this).data("id") == me.$activeCard.data("id");
					});
					$el.find(SEL_QUESTION).addClass(CLS_NONE);
					me.$activeQuestion.removeClass(CLS_NONE);
				}
			});

			$thirdCard.animate({top: "6", left: "6"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_THIRD).addClass(CLS_SECOND);
			});

			$fourthCard.animate({top: "12", left: "0", opacity: "1"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_FOURTH).addClass(CLS_THIRD);
			});

			$candidate.removeClass(CLS_CANDIDATE).addClass(CLS_FOURTH);
		}
	}

	function viewSummary() {
		var me = this,
			$el = this.$element;

		var passed = me.isPassed();

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);

		$(this).removeClass(CLS_NONE).removeAttr('style');

		if (passed) {
			$el.find(SEL_SUMMARY_PASS).removeClass(CLS_NONE);
			$el.find(SEL_SUMMARY_FAIL).addClass(CLS_NONE);

			$el.find(SEL_SUMMARY_REQUIRE_MSG).addClass(CLS_NONE);
		}

		//Render activity summary widget
		$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
			.data("settings",
			{
				passed: passed,
				correctNum: me.correctCount,
				skippedNum: me.incorrectCount,
				passNum: me.correctRequired
			})
			.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
			.weave();
	}

	function onClickOption($selectedOption) {
		var me = this,
			$el = this.$element;

		if ($selectedOption.hasClass(CLS_DISABLED) || me.optionFreezed) {
			return;
		}

		$el.find(SEL_BTN_SKIP).addClass(CLS_DISABLED);

		var optionId = $selectedOption.data("id");
		var checkResult = me.checkAnswer(me.currentCardIndex, optionId);
		me.displayInteractionResult(checkResult, $selectedOption);
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		"hub/activity/template/flashcardchoice/load": function (options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._super = options._super;
			me._interacted = false;
			// set instant feedback on
			me._item.instantFeedback(true);

			return me.signal('render');
		},
		checkAnswer: function (questionIndex, optionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, questionIndex, optionId, 'flashCards');
			var correct = interaction.correct;

			if (correct) {
				me.correctCount++;
				me.incorrectCount--;
				me._json.content._isCorrect = me.isPassed();
			}

			var promise = me._super.publishInteraction(interaction);
			return {
				correct: correct,
				promise: promise
			};
		},
		displayInteractionResult: function (checkResult, $selectedOption) {
			var me = this;
			var $el = this.$element;
			var $correctIcon = me.$activeCard.find(SEL_CORRECT_ICON);

			me.optionFreezed = true;

			if (checkResult.correct) {
				me.$activeCard.addClass(CLS_CORRECT);
				$selectedOption.addClass(CLS_CORRECT);
				setTimeout(function () {
					checkResult.promise.then(function () {
						switchCard.call(me);
						me.optionFreezed = false;
					});
				}, SWITCH_DELAY);
			} else {
				$selectedOption.addClass(CLS_INCORRECT);
				me.$activeCard.addClass(CLS_INCORRECT);
				$correctIcon.effect('shake', {distance: 8, times: 3}, 100, function () {
					setTimeout(function () {
						me.$activeCard.removeClass(CLS_INCORRECT);
						$selectedOption.removeClass(CLS_INCORRECT).addClass(CLS_DISABLED);
						me.optionFreezed = false;
						$el.find(SEL_BTN_SKIP).removeClass(CLS_DISABLED);
					}, FEEDBACK_DELAY);
				});
			}
		},
		publishSkipInteraction: function (questionIndex) {
			var me = this;
			var questionId = me._json.content.flashCards[questionIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			return me._super.publishInteraction(interaction);
		},
		isPassed: function () {
			var me = this;
			return me.correctCount >= me.correctRequired;
		}
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/flashcard-choice/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-fce-wrap\" data-weave=\"school-ui-activity/activity/flashcard-choice/flashcard-choice\"></div>"; return o; }; });
define('school-ui-activity/activity/flashcard-choice/main',[
	'jquery',
	'when',
	'../base/main',
	'template!./main.html',
	'./flashcard-choice'
], function activityTemplateModule($, when, Widget, tTemplate) {
	"use strict";

	var TOPIC_FLASHCARD_CHOICE_LOAD = "activity/template/flashcardchoice/load";

	function Ctor() {
	}

	function render() {

		var me = this;

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate());
		}

		var data = this._json;

		return this._htmlPromise
			.then(function () {
				return me.publish(TOPIC_FLASHCARD_CHOICE_LOAD, {
					item: me.items(),
					json: data,
					_super: me
				});
			});
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			this.length(1);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);

			return this.signal('render');
		},
		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/flashcard-exercise/flashcard-exercise.html',[],function() { return function template(data) { var o = "";
var blurb = function(id,en){
	    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
	    return res;
	};
o += "\n\n<div class=\"ets-act-fce\">\n\t<div class=\"ets-act-fce-main\">\n\t\t<div class=\"ets-act-fce-bd\">\n\t\t\t<div class=\"ets-act-fce-stack\">\n\t\t\t\t";
				var data = data || {};
				var cards = data.cards;
				var correctRequired = data.correctRequired;
				for(var i = 0; i < cards.length; i++){
					writeItem(cards[i], i);o += "\n\t\t\t\t";}o += "\n\t\t\t</div>\n\t\t\t<div class=\"ets-act-fce-ctrl\">\n\t\t\t\t<div class=\"ets-bd\">\n\t\t\t\t\t<div data-at-id=\"btn-skip\" class=\"ets-act-fce-btn ets-act-btn-skip ets-btn-skip\"><span " +blurb(450011,"Skip")+ "></span></div>\n\t\t\t\t\t<div class=\"ets-act-fce-number\">\n\t\t\t\t\t\t<span class=\"ets-act-fce-number-current\">4</span> / <span class=\"ets-act-fce-number-total\">6</span>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"ets-act-fce-ft\">\n\t\t\t<div class=\"ets-act-fce-mic\">\n\t\t\t\t <div data-weave=\"school-ui-activity/shared/asr/asr-ui\"></div>\n\t\t\t</div>\n\t\t\t<div class=\"ets-act-fce-typing ets-none\">\n\t\t\t\t<div class=\"ets-act-fce-typing-box\">\n\t\t\t\t\t<div class=\"ets-input\"><input type=\"text\" name=\"\" data-at-id=\"answer_input\" class=\"ets-act-fce-typing-input\" /> <div data-at-id=\"submit\" class=\"ets-btn ets-btn-blue ets-act-fce-typing-check ets-disabled\"><span " +blurb(443583, "DONE")+ "></span></div></div>\n\t\t\t\t\t<i class=\"ets-icon-correct-s\"></i> <i class=\"ets-icon-incorrect-s\"></i>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<!-- Activity Summary Start-->\n\t<div class=\"ets-act-summary-wrap\"></div>\n\t<!-- Activity Summary End-->\n</div>\n\n\n"; function writeItem(data, index) {
	var index = parseInt(index) + 1;
	o += "\n\t<div class=\"ets-act-fce-card ";if (index > 4) {o += "ets-candidate ";} else {o += " ets-stack-" +index+ " ";}o += "\" id=\"ets-act-fce-card" +data._id+ "\" data-at-id=\"" +data._id+ "\">\n\t\t<div class=\"ets-bd\">\n\t\t\t<img src=\"" +data.image.url+ "\" />\n\t\t</div>\n        <div class=\"ets-icon\">\n            <span></span>\n        </div>\n\t\t<div class=\"ets-ft\">\n\t\t\t<div class=\"ets-act-fce-word\">\n\t\t\t\t";if (data.audio) {o += "\n\t\t\t\t<div class=\"ets-audio\">\n\t\t\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap ets-ap-small\">\n\t\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t\t\t       data-src=\"" +data.audio.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t\t\t       data-at-id=\"answer_audio_" +data._id+ "\"\n\t\t\t\t\t\t       class=\"ets-ap ets-ap-small ets-ap-nobar\"></audio>\n\t\t\t\t\t</div></div>\n\t\t\t\t</div>\n\t\t\t\t";}o += "\n\t\t\t\t<div class=\"ets-text ";if (data.txt.length > 26) {o += " ets-text-long";}o += "\"><span>" +data.txt+ "</span></div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n"; }  return o; }; });
define('school-ui-activity/shared/typing-helper/main',[
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
define('school-ui-activity/shared/asr/asr-service-message-type',[],function () {
	return {
		VOICE_TOO_SLOW: "VOICE_TOO_SLOW",
		VOICE_TOO_FAST: "VOICE_TOO_FAST",
		VOICE_TOO_LOW: "VOICE_TOO_LOW",
		VOICE_TOO_HIGH: "VOICE_TOO_HIGH",
		CAN_NOT_RECOGNIZE: "CAN_NOT_RECOGNIZE",
		TIMEOUT: "TIMEOUT",
		NO_VOICE: "NO_VOICE",
		FLASH_ERROR: "FLASH_ERROR",
		SERVER_ERROR: "SERVER_ERROR",
		INCORRECT_ANSWER: "INCORRECT_ANSWER",
		INCORRECT_PRONUN: "INCORRECT_PRONUN",
		FALLBACK: "FALLBACK"
	}
});

define('school-ui-activity/shared/asr/asr-ui-states',[],function () {
	return {
		/*
		 "COMMON" state is not a ASR internal state,
		 it's controlled by external widget, like activity.
		 Bad requirements make this happens.
		 For example: LanguageComparation have a strange
		 requirement which need set ASR failed when record a wrong answer.
		 Details in https://jira.englishtown.com/browse/SPC-2921.
		 */
		COMMON: "COMMON",
		START: "START",
		STOP: "STOP",
		NORMAL: "NORMAL",
		DISABLE: "DISABLE",
		RECORDING: "RECORDING",
		PROCESSING: "PROCESSING",
		PREPARING: "PREPARING",
		WARNING: "WARNING",
		ERROR: "ERROR",
		HINT: "HINT",
		DOWN: "DOWN",
		BROKEN: "BROKEN",
		START_REPLAY: "START_REPLAY",
		STOP_REPLAY: "STOP_REPLAY"
	};
});

// # Task Module
define('school-ui-activity/activity/flashcard-exercise/flashcard-exercise',[
	"jquery",
	"jquery.ui",
	"poly",
	"when",
	"troopjs-ef/component/widget",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./flashcard-exercise.html",
	"school-ui-activity/shared/typing-helper/main",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states"
], function (
	$,
	ui$,
	poly,
	when,
	Widget,
	Scoring,
	Interaction,
	tTemplate,
	TypingHelper,
	ratingSouceType,
	MSGType,
	ASRUIStatus
) {
	"use strict";

	// Constants
	var HUB = 'hub/';
	var TOPIC_FLASHCARD_EXERCISE_LOAD = "activity/template/flashcardexercise/load";
	var TOPIC_ASR_STOP_PLAYBACK = "asr/stopPlayback";
	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_FCE_MAIN = ".ets-act-fce-main",
		CLS_DISABLED = "ets-disabled",
		CLS_FIRST = "ets-stack-1",
		CLS_SECOND = "ets-stack-2",
		CLS_THIRD = "ets-stack-3",
		CLS_FOURTH = "ets-stack-4",
		CLS_CANDIDATE = "ets-candidate",
		CLS_DONE = "ets-done",
		CLS_NONE = "ets-none",
		CLS_INCORRECT = "ets-incorrect",
		CLS_CORRECT = "ets-correct",
		CLS_AUDIO_ONLY = "ets-audio-only",

		SEL_ASR_CONTAINER = ".ets-act-fce-mic",
		SEL_FIRST_CARD = ".ets-act-fce-card.ets-stack-1",
		SEL_SECOND_CARD = ".ets-act-fce-card.ets-stack-2",
		SEL_THIRD_CARD = ".ets-act-fce-card.ets-stack-3",
		SEL_FOURTH_CARD = ".ets-act-fce-card.ets-stack-4",
		SEL_CANDIDATE = ".ets-act-fce-card.ets-candidate",
		SEL_BTN_SKIP = ".ets-act-fce-btn.ets-btn-skip",

		SEL_TYPING_CONTAINER = ".ets-act-fce-typing",
		SEL_TYPING_BOX = ".ets-act-fce-typing-box",
		SEL_TYPING_INPUT = ".ets-act-fce-typing-input",
		SEL_TYPING_CHECK = ".ets-act-fce-typing-check",

		SEL_AUDIO = ".ets-ap",

		SEL_WORD = ".ets-act-fce-word",

		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		SEL_COUNT_CURRENT = ".ets-act-fce-number-current",
		SEL_COUNT_TOTAL = ".ets-act-fce-number-total",

		HUB_ASR_SET = "asr/ui/setting",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference",

		SEL_CORRECT_ICON = ".ets-icon span",

		SWITCH_DELAY = 800,
		FEEDBACK_DELAY = 500;

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	// Constructor
	function Ctor() {
		this.currentCardIndex = 0;
		this.correctCount = {};
		this.incorrectCount = {};
		this.totalCards = {};
		this.$activeCard = {};
		this.$activeQuestion = {};
		this.answerMode = 'ASR';
		this.asrDisabled = false;
		this.asrMode = ratingSouceType["ASR_SPEAKING"];
	}

	// # Render
	function render() {
		var me = this;
		var flashcards = this._json.content.flashCards;

		if (!flashcards || !flashcards.length) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		me.totalCards = this._json.content.flashCards.length;

		//Init summary page card numbers
		me.correctRequired = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * me.totalCards);
		me.correctCount = 0;
		me.incorrectCount = me.totalCards;

		if (flashcards && flashcards[0] && flashcards[0].pronsXML) {
			me.hasPronsXML = true;
		}

		return me.html(tTemplate, {cards: flashcards, correctRequired: me.correctRequired});
	}

	function onRendered() {
		var me = this,
			$el = this.$element,
			enableSwitchASRMode = !me.asrDisabled
				&& !me._json.asrDisabled
				&& me.hasPronsXML
				&& window.location.search.indexOf("non-asr") < 0;

		$el.find(SEL_BTN_SKIP).click(function () {
			if ($(this).hasClass(CLS_DISABLED)) {
				return;
			}
			me.publish("asr/disable");
			me.publish("asr/ui/playback", false);
			me.publishSkipInteraction(me.currentCardIndex)
				.then(function () {
					switchCard.call(me);
					me.publish("asr/enable");
				});
		});

		me.$activeCard = $el.find(SEL_FIRST_CARD);

		$el.find(SEL_COUNT_TOTAL).text(me.totalCards);
		$el.find(SEL_COUNT_CURRENT).text(me.currentCardIndex + 1);

		me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.flashCards[me.currentCardIndex], {
			asrFallbackType: "TYPING",
			asrFallbackCb: switchAnswerMode.bind(me, "TYPING"),
			needResetASRFailedTimes: true,
			asrEnableTip: true
		});

		if (!enableSwitchASRMode) {
			switchAnswerMode.call(me, "TYPING");
			me.asrMode = ratingSouceType["ASR_TYPING"];
		}
	}


	function switchAnswerMode(mode) {
		var me = this,
			$el = this.$element;

		switch (mode) {
			case 'ASR':
				me.answerMode = 'ASR';
				$el.find(SEL_TYPING_CONTAINER).addClass(CLS_NONE);
				$el.find(SEL_ASR_CONTAINER).removeClass(CLS_NONE);
				$el.find(SEL_WORD).removeClass(CLS_AUDIO_ONLY);
				$el.find(SEL_TYPING_CHECK).unbind('click');
				$el.find(SEL_TYPING_INPUT).unbind('change');
				me._super.scoringType('asr');
				break;
			case 'TYPING':
				me.answerMode = 'TYPING';
				$el.find(SEL_ASR_CONTAINER).addClass(CLS_NONE);
				$el.find(SEL_TYPING_CONTAINER).removeClass(CLS_NONE);
				$el.find(SEL_WORD).addClass(CLS_AUDIO_ONLY);
				me._super.scoringType('default');

				$el.find(SEL_TYPING_CHECK).click(function () {
					onClickCheck.call(me);
				});

				onInputFocus.call(me);
				break;
		}
	}

	function onASRRecognized(asrResult) {
		var me = this;
		var phraseResult = asrResult[0];
		var checkResult = me.checkAnswer(me.currentCardIndex, phraseResult);
		me.displayInteractionResult(checkResult, asrResult);
	}

	function switchCard() {
		var me = this,
			$el = this.$element;

		// send pause to all audio in activity
		$el.find(SEL_AUDIO).trigger('player/pause');

		if (me.currentCardIndex + 1 >= me.totalCards) {
			$el.find(SEL_BTN_SKIP).addClass(CLS_NONE);
			me._json.content._isCorrect = me.isActivityPassed();
			me._item.completed(true);
			$el.find(SEL_FCE_MAIN).fadeOut(200, function () {
				viewSummary.call(me);
			});
		} else {
			var $firstCard = $el.find(SEL_FIRST_CARD),
				$secondCard = $el.find(SEL_SECOND_CARD),
				$thirdCard = $el.find(SEL_THIRD_CARD),
				$fourthCard = $el.find(SEL_FOURTH_CARD),
				$candidate = $($el.find(SEL_CANDIDATE).first());

			me.currentCardIndex++;

			$el.find(SEL_COUNT_CURRENT).text(me.currentCardIndex + 1);

			$firstCard.animate({left: "+=150", top: "-=100", opacity: "0"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_FIRST).addClass(CLS_DONE);
			});

			$secondCard.animate({top: "0", left: "12"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_SECOND).addClass(CLS_FIRST);
				me.$activeCard = $el.find(SEL_FIRST_CARD);
			});

			$thirdCard.animate({top: "6", left: "6"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_THIRD).addClass(CLS_SECOND);
			});

			$fourthCard.animate({top: "12", left: "0", opacity: "1"}, 300, function () {
				$(this).removeAttr("style").removeClass(CLS_FOURTH).addClass(CLS_THIRD);
			});

			$candidate.removeClass(CLS_CANDIDATE).addClass(CLS_FOURTH);

			$el.find(SEL_TYPING_INPUT).removeAttr("readonly").val('');
			$el.find(SEL_TYPING_CHECK).addClass(CLS_DISABLED);

			me.publish(
				HUB_ASR_SET,
				onASRRecognized.bind(me),
				me._json.content.flashCards[me.currentCardIndex],
				{
					asrEnableTip: true
				}
			);
		}

	}

	function viewSummary() {
		var me = this,
			$el = this.$element;

		//Render activity summary widget
		$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
			.data("settings",
			{
				passed: me.isActivityPassed(),
				correctNum: me.correctCount,
				skippedNum: me.incorrectCount,
				passNum: me.correctRequired
			})
			.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
			.weave();

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	function onClickCheck() {
		var me = this,
			$el = this.$element,
			$check = $el.find(SEL_TYPING_CHECK),
			$input = $el.find(SEL_TYPING_INPUT);

		if (!this.answerMode == "TYPING" || $check.hasClass(CLS_DISABLED)) {
			return;
		}

		var answer = $input.val();
		var checkResult = me.checkTypingAnswer(me.currentCardIndex, answer);
		me.displayInteractionResult(checkResult);
	}

	function onInputFocus() {
		var me = this,
			$el = this.$element,
			$check = $el.find(SEL_TYPING_CHECK),
			$input = $el.find(SEL_TYPING_INPUT);


		$input.keyup(function (e) {
			if (e.which == 13) {
				onClickCheck.call(me);
			} else {
				if ($.trim($input.val()).length > 0) {
					$check.removeClass(CLS_DISABLED);
				} else {
					$check.addClass(CLS_DISABLED);
				}
			}
		});
	}


	var methods = {
		'sig/render': function onRender() {
			return when.all([
				render.call(this),
				TypingHelper.readyPromise
			]);
		},
		"sig/start": function () {
			var me = this;

			me.query(CCL_ASR_ENABLED).spread(function (asrEnabledCcl) {
				me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');
			});
		},
		"hub/asr/ui/states/changed": function (state) {
			if (!state) return;
			// this.state(state);
			var $el = this.$element,
				$skipButton = $el.find(SEL_BTN_SKIP);
			switch (state) {
				case ASRUIStatus.RECORDING:
				case ASRUIStatus.PROCESSING:
				case ASRUIStatus.PREPARING:
				case ASRUIStatus.DISABLE:
					$skipButton.addClass(CLS_DISABLED);
					break;
				default:
					$skipButton.removeClass(CLS_DISABLED);
					break;
			}
		},
		"hub/rating/sourceType": function () {
			return [this.asrMode];
		},
		"dom:.ets-ap/media/play": function () {
			this.publish(TOPIC_ASR_STOP_PLAYBACK);
		},
		isActivityPassed: function () {
			var me = this;
			return me.correctCount >= me.correctRequired;
		},
		checkAnswer: function (flashcardIndex, phraseResult) {
			var me = this;
			var correct = Scoring.isPhraseCorrect(phraseResult);

			if (correct) {
				me.incrementCorrectCount();
			}

			var promise = this._super.publishInteraction(
				Interaction.makeAsrInteraction(correct, phraseResult._id));

			return {
				correct: correct,
				promise: promise
			};
		},
		checkTypingAnswer: function (flashcardIndex, answer) {
			var me = this;
			var json = me._json;
			var flashcard = json.content.flashCards[flashcardIndex];
			var solution = Scoring.findById(json.scoring.flashCards, flashcard._id);
			var cleanedAnswer = TypingHelper.cleanTypingAnswer(answer).toLowerCase();
			var expectedAnswer = TypingHelper.cleanTypingAnswer(solution.answer).toLowerCase();
			var correct = (expectedAnswer === cleanedAnswer);

			if (correct) {
				me.incrementCorrectCount();
			}

			var promise = this._super.publishInteraction(
				Interaction.makeAsrFallbackInteraction(correct, flashcard._id));

			return {
				correct: correct,
				promise: promise
			};
		},
		publishSkipInteraction: function (flashcardIndex) {
			var me = this;
			var questionId = me._json.content.flashCards[flashcardIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			return me._super.publishInteraction(interaction);
		},
		incrementCorrectCount: function () {
			var me = this;
			me.correctCount++;
			me.incorrectCount--;
		},
		displayInteractionResult: function (checkResult, asrResult) {
			var me = this;
			var json = this._json;
			var $el = this.$element;
			var $typingBox = $el.find(SEL_TYPING_BOX);
			var $input = $el.find(SEL_TYPING_INPUT);
			var $correctIcon = me.$activeCard.find(SEL_CORRECT_ICON);

			if (checkResult.correct) {
				me.$activeCard.addClass(CLS_CORRECT);
				$typingBox.addClass(CLS_CORRECT);
				$input.attr("disabled", "disabled");
				me.publish("asr/disable");
				setTimeout(function () {
					checkResult.promise.then(function () {
						switchCard.call(me);
						$typingBox.removeClass(CLS_CORRECT);
						$input.removeAttr("disabled").focus();
						me.publish("asr/enable");
					});
				}, SWITCH_DELAY);
			} else {
				me.$activeCard.addClass(CLS_INCORRECT);
				$typingBox.addClass(CLS_INCORRECT);
				$input.attr("disabled", "disabled");

				if (asrResult && !asrResult._hasError) {
					me.publish("asr/show/message", MSGType.INCORRECT_PRONUN);
				}

				$correctIcon.effect('shake', {distance: 8, times: 3}, 100, function () {
					setTimeout(function () {
						me.$activeCard.removeClass(CLS_INCORRECT);
						$typingBox.removeClass(CLS_INCORRECT);
						$input.removeAttr("disabled").focus();
						//show asr message
					}, FEEDBACK_DELAY);
				});
			}
		}
	};

	methods[HUB + TOPIC_FLASHCARD_EXERCISE_LOAD] = function (parent, options) {
		var me = this;

		me._json = options.json;
		me._item = options.item;
		me._super = parent;

		me._interacted = false;
		// set instant feedback on
		me._item.instantFeedback(true);

		return me.signal('render').then(function () {
			onRendered.call(me);
		});
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/flashcard-exercise/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-fce-wrap\" data-weave=\"school-ui-activity/activity/flashcard-exercise/flashcard-exercise\"></div>"; return o; }; });
define('school-ui-activity/activity/flashcard-exercise/main',[
	'jquery',
	'when',
	'../base/main',
	'school-ui-activity/shared/typing-helper/main',
	'./flashcard-exercise',
	'template!./main.html'
], function activityTemplateModule($, when, Widget, TypingHelper, FlashcardExercise, tTemplate) {
	"use strict";

	var TOPIC_FLASHCARD_EXERCISE_LOAD = "activity/template/flashcardexercise/load";

	function Ctor() {
		this.scoringType(Widget.SCORING_TYPE.ASR);
	}

	function render() {
		var me = this;

		if (!me.$element) {
			return;
		}

		if (!me._htmlPromise) {
			me._htmlPromise = me.html(tTemplate());
		}

		var data = this._json;

		return me._htmlPromise
			.then(function () {
				return me.publish(TOPIC_FLASHCARD_EXERCISE_LOAD, me, {
					item: me.items(),
					json: data
				});
			});
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			this.length(1);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			delete this._htmlPromise;
		},
		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);

			return this.signal('render');
		},
		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/flashcard-presentation/flashcard-presentation.html',[],function() { return function template(data) { var o = "";
	var cards = data.flashCards;
 	var len = cards.length;
 	var CLS_DISTANT = '';
 	if (len < 10) {
 		CLS_DISTANT = "ets-distant";
 	}
o += "\n<div class=\"ets-act-fcp\">\n\t<div class=\"ets-act-fcp-main \">\n\t\t<ul>\n\t\t\t";for(var i=0; i<len; i++){o += "\n\t\t\t\t<li class=\"ets-act-fcp-item ets-foggy " + CLS_DISTANT+ "\" data-at-id=\"" +cards[i]._id+ "\" data-index=\"" +i + "\">\n\t\t\t\t\t<img src=\"" + cards[i].image.url+ "\" alt=\"\" />\n\t\t\t\t</li>\n\t\t\t";}o += "\n\t\t</ul>\n\t</div>\n\t<div class=\"ets-act-fcp-side\">\n\t\t<div class=\"ets-act-fcp-card-wrap\">\n\t\t\t<div class=\"ets-act-fcp-card\">\n\t\t\t\t<div class=\"ets-act-fcp-card-front\">\n\t\t\t\t\t<div class=\"ets-act-fcp-card-img\"></div>\n\t\t\t\t\t<div class=\"ets-act-fcp-card-vocabulary\">\n\n\t\t\t\t\t\t<div class=\"ets-act-fcp-card-audio\">\n\t\t\t\t\t\t\t<div data-at-id=\"answer_audio\" class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap ets-ap-small\">\n\t\t\t\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t\t\t\t\t       id=\"ets-act-fcp-audio-player\"\n\t\t\t\t\t\t\t\t       data-src=\"" +cards[0].audio.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t\t\t\t\t       class=\"ets-ap ets-ap-small ets-ap-nobar\"></audio>\n\t\t\t\t\t\t\t</div></div>\n\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t<div class=\"ets-act-fcp-card-text\"></div>\n\t\t\t\t\t\t\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"ets-act-fcp-card-back ets-none\">\n\t\t\t\t\t<div class=\"ets-act-fcp-card-translation\">\n\t\t\t\t\t\t<h4></h4>\n\t\t\t\t\t\t<div class=\"ets-translation\">\n\t\t\t\t\t\t\t<span class=\"ets-translation-title\"></span> \n\t\t\t\t\t\t\t<span class=\"ets-partofspeech\"></span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"ets-pronunciation\">\n\t\t\t\t\t\t\t<span></span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\n\t\t\t\t\t\t<div class=\"ets-definition\">\n\t\t\t\t\t\t\t<span></span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"ets-example\">\n\t\t\t\t\t\t\t<ol>\n\t\t\t\t\t\t\t</ol>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"ets-act-fcp-card-action ets-none\">\n\t\t\t<div class=\"ets-btn ets-btn-white ets-btn-shadowed ets-act-fcp-flip ets-act-fcp-normal\" data-at-id=\"btn-filp\">\n\t\t\t\t<span>\n\t\t\t\t\t<i class=\"ets-icon-flip\"></i>\n\t\t\t\t\t<span class=\"ets-act-fcp-info-normal\" data-weave='troopjs-ef/blurb/widget' data-blurb-id='469642' data-text-en='Grammar Notes'></span>\n\t\t\t\t\t<span class=\"ets-act-fcp-info-back\" data-weave='troopjs-ef/blurb/widget' data-blurb-id='469643' data-text-en='Flip Back'></span>\n\t\t\t\t</span>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-fcp-reminder ets-clear\" data-weave='troopjs-ef/blurb/widget' data-blurb-id='465094' data-text-en='Make sure you try all cards at least once before moving on!'></div>\n</div>"; return o; }; });
define('school-ui-activity/activity/flashcard-presentation/main',[
	'jquery',
	'poly',
	'underscore',
	'../base/main',
	"troopjs-core/pubsub/hub",
	"jquery.flip",
	"template!./flashcard-presentation.html"
], function FlashCardPresentation($, poly, _, Widget, Hub, flip$, tTemplate) {
	"use strict";

	// TODO: constants
	var SEL_ITEM = ".ets-act-fcp-item",
		SEL_CARD = ".ets-act-fcp-card",
		SEL_CARD_FRONT = ".ets-act-fcp-card-front",
		SEL_CARD_BACK = ".ets-act-fcp-card-back",
		SEL_CARD_ACTION = ".ets-act-fcp-card-action",
		SEL_CARD_IMG = ".ets-act-fcp-card-img",
		SEL_CARD_TXT = ".ets-act-fcp-card-text",
		SEL_CARD_FLIP = ".ets-act-fcp-flip",
		SEL_FOGGY_ITEM = ".ets-act-fcp-item.ets-foggy",
		SEL_CARD_TRANS = ".ets-act-fcp-card-translation",
		SEL_CARD_TITLE = "> h4",
		SEL_PRONOUNCE = "> .ets-pronunciation > span",
		SEL_TRANS = "> .ets-translation .ets-translation-title",
		SEL_DEFINITION = "> .ets-definition",
		SEL_EXAMPLES = "> .ets-example ol",
		SEL_AUDIO_PLAYER = "#ets-act-fcp-audio-player",

		CLS_NONE = "ets-none",
		CLS_ACTIVE = "ets-active",
		CLS_FOGGY = "ets-foggy",
		CLS_FLIP_BACK = "ets-act-fcp-back",

		DURATION_FADE_OUT = 100,
		DURATION_FADE_IN = 200,

		EN = "en",
		ANAT = "Anat",

		HUB_CONTEXT = "context";

	function flipCard() {
		var me = this,
			fliped = me._cardFlipped;

		flip$(me._$card).flip({
			direction: fliped ? 'lr' : 'rl',
			bgColor: '#eee',
			speed: 300,
			onEnd: function () {
				me._$cardFront.toggleClass(CLS_NONE, !fliped);
				me._$cardBack.toggleClass(CLS_NONE, fliped);
				me._$btnFlip.toggleClass(CLS_FLIP_BACK, !fliped);
				me._$card.removeAttr("style");
				me._cardFlipped = !me._cardFlipped;
			}
		});
	}

	function selectItem(item) {
		var me = this;

		var $item = $(item);
		if ($item.hasClass(CLS_ACTIVE)) {
			return;
		}
		clearTimeout(me.playTimeoutId);
		me._$items.not($item).removeClass(CLS_ACTIVE);
		$item.addClass(CLS_ACTIVE);
		$item.removeClass(CLS_FOGGY);

		var $img = $item.find("img").clone();
		var index = $item.data("index");
		var data = me._json.content.flashCards[index];
		var audioSrc = data.audio.url;
		var text = data.txt;

		var $phImg = this._$phImage;
		var fadeInImg = function () {
			$phImg.hide().html($img).fadeIn(DURATION_FADE_IN);
		};
		if ($phImg.children().length) {
			$phImg.fadeOut(DURATION_FADE_OUT, fadeInImg);
		} else {
			fadeInImg();
		}

		me._$phText.text(text);

		switchTrans.call(me, data);
		if (me._cardFlipped) {
			flipCard.call(me);
		}

		//Pause a while before play, for a smooth user experience
		me.playTimeoutId = setTimeout(function () {
			$(SEL_AUDIO_PLAYER).trigger("player/play", audioSrc);
		}, 500);

		//Move on when all cards read
		if (!this.$element.find(SEL_FOGGY_ITEM).length) {
			this.items().completed(true);
		}
	}

	function switchTrans(data) {
		var trans = data.translation,
			title = data.txt,
			me = this;

		if (!trans) return;

		var tagPre = "<li><span>",
			tagMid = "</span></li><li><span>",
			tagSuff = "</span></li>",
			br = "<br/>&nbsp;&nbsp;&nbsp;&nbsp;",
			pron = $.trim(trans.phoneticSpelling),
			sampleSentences = [];

		if (_.isArray(trans.sampleSentences)) {
			trans.sampleSentences.forEach(function (smpl) {
				var sentence,
					trans = "";

				if (!smpl) return;

				if (_.isObject(smpl)) {
					if (me.isNeedShowTrans && smpl["value"] != smpl["key"]) {
						trans = br + ['<span class="ets-translation">', smpl["value"], '</span>'].join('');
					} else {
						trans = "";
					}
					sentence = smpl["key"] + trans;

					sampleSentences.push(sentence);
				} else {
					sampleSentences.push(smpl);
				}
			});
		}

		var samplesHTML = sampleSentences.length
			? (tagPre + sampleSentences.join(tagMid) + tagSuff)
			: "";

		//Check whether have '/' in prons, if not, wrap '/'.
		pron = (pron.length && pron.indexOf("/") !== 0) ? ('/' + pron + '/') : pron;

		this._$trans
			.find(SEL_CARD_TITLE)
			.text(title)
			.end()
			.find(SEL_TRANS)
			.text(trans.translation == title ? "" : trans.translation)
			.end()
			/*
			 //currently, content not supply a partofspeech
			 .find(SEL_TRANS_POSPE)
			 .text(trans.partofspeech)
			 .end()
			 */
			.find(SEL_DEFINITION)
			.text(trans.definition)
			.end()
			.find(SEL_EXAMPLES)
			.html(samplesHTML)
			.end()
			.find(SEL_PRONOUNCE)
			.text(pron);
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			me._cardFlipped = false;
			me.type(Widget.ACT_TYPE.LEARNING);
		},
		"sig/render": function onRender() {
			var $el = this.$element,
				isENCulture,
				isAnatPartner,
				me = this;

			me.isNeedShowTrans = true;

			function onContext(context) {
				if (context) {
					isENCulture = context.cultureCode === EN;
					isAnatPartner = context.partnerCode === ANAT;

					me.isNeedShowTrans = !isENCulture && !isAnatPartner;
				}
			}

			Hub.subscribe(HUB_CONTEXT, Hub, onContext);
			Hub.reemit(HUB_CONTEXT, false, Hub, onContext);
			Hub.unsubscribe(HUB_CONTEXT, Hub, onContext);

			return me.renderPromise = me
				.html(tTemplate, {
					flashCards: me._json.content.flashCards,
					hasPassed: me.hasPassed
				})
				.then(function () {
					me._$items = $el.find(SEL_ITEM);
					me._$card = $el.find(SEL_CARD);
					me._$cardFront = $el.find(SEL_CARD_FRONT);
					me._$cardBack = $el.find(SEL_CARD_BACK);
					me._$phImage = $el.find(SEL_CARD_IMG);
					me._$phText = $el.find(SEL_CARD_TXT);
					me._$btnFlip = $el.find(SEL_CARD_FLIP);
					me._$trans = $el.find(SEL_CARD_TRANS);

					selectItem.call(me, me._$items[0]);

					if (me._json.templateCode === "FlaPreFlip" && me._json.canFlipCard) {
						$el.find(SEL_CARD_ACTION).removeClass(CLS_NONE);
					}
				});
		},
		"sig/finalize": function onInitialize() {
			var me = this;

			var $card = flip$(me._$card);
			//1. clear potencial timer to avoid submit wrong score
			$card.stop(true, true);

			me.renderPromise && me.renderPromise.ensure(function () {
				me._$items = null;
				me._$card = null;
				me._$cardFront = null;
				me._$cardBack = null;
				me._$phImage = null;
				me._$phText = null;
				me._$btnFlip = null;
				me._$trans = null;
			});
		},
		"dom:.ets-act-fcp-item/click": function onSwitchCrad($event) {
			selectItem.call(this, $event.currentTarget);
		},
		"dom:.ets-act-fcp-flip/click": function onSwitchCrad() {
			flipCard.call(this);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/activity/grouping/grouping.html',[],function() { return function template(data) { var o = "";
    var wordItems = data.wordItems;
    var wordGroups = data.wordGroups;
    var references = data.references;
    var itemsLen = wordItems.length;
    var groupsLen = wordGroups.length;
    var stripClass = data.isCopyMode ? 'ets-act-grp-strip-copy' : 'ets-act-grp-strip-move';
o += "\n";if (references.aud) {o += "\n<div class=\"ets-act-grp-audio\">\n    <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n        <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n               data-src=\"" +references.aud.url+ "\" type=\"audio/mpeg\"\n               class=\"ets-ap\"></audio>\n    </div></div>\n</div>\n";}o += "\n<div class=\"ets-act-grp\">\n    <div class=\"ets-act-grp-droparea\">\n        ";for(var i=0; i < groupsLen; i++){o += "\n            <section>\n                <h5><span>" + wordGroups[i].txt+ "</span></h5>\n                <div class=\"ets-act-grp-target\" data-group=\"" + wordGroups[i]._id+ "\" data-at-id=\"" + wordGroups[i]._id+ "\"></div>\n            </section>\n        ";}o += "\n    </div>\n\n    <div class=\"ets-act-grp-originarea\">\n        ";for(var i=0; i < itemsLen; i++){o += "\n            <div class=\"ets-act-grp-strip " +stripClass+ "\" data-group=\"" + wordItems[i]._id+ "\" data-at-id=\"" + wordItems[i]._id+ "\"><p>" + wordItems[i].txt+ "</p></div>\n        ";}o += "\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/grouping/main',[
	'jquery',
	'school-ui-activity/activity/base/main',
	'troopjs-core/component/factory',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	'template!./grouping.html',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'underscore'
], function groupingMoveModule($, Widget, Factory, Scoring, Interaction, tTemplate, $ui, $uiTouchPunch, _) {
	"use strict";

	/**
	 grouping move and copy mode
	 */
	var SEL_DROP_AREA = ".ets-act-grp-droparea",
		SEL_ORIGIN_AREA = ".ets-act-grp-originarea",
		SEL_TARGET = ".ets-act-grp-target",
		SEL_ACTIVITY_BODY = ".ets-act-bd",
		SEL_STRIP = ".ets-act-grp-strip",
		SEL_ETS_ACT_BD_MAIN = "div.ets-act-bd-main",

		CLS_TARGET = "ets-act-grp-target",
		CLS_STRIP_MOVE = "ets-act-grp-strip-move",
		CLS_STRIP_COPY = "ets-act-grp-strip-copy",
		CLS_CORRECT = "ets-correct",
		CLS_INCORRECT = "ets-incorrect",
		CLS_HOVER = "ets-hover",
		CLS_ACCEPTED = "ets-accepted",
		CLS_GRADE_COMPLETED = "ets-act-grade-completed",
		CLS_STRIP_DISABLED = "ets-act-strip-disabled",
		SLIDETIME = {"correct": 500, "incorrect": 800};

	/**
	 filter data that from service
	 */
	function filterByGrade(data) {
		var me = this;
		//specified correct items number which display on the page.
		var optionNo = me._allItemsCount = data.filterOptions.optionNo;
		//specified distractor items number.
		var distNo = data.filterOptions.distNo;
		var filteredDistItems = [];
		var filteredCount = 0;
		var copyData = $.extend(true, {}, data);
		var scoringDistItems = me._source.scoring.items;
		var copyScoringGroups = $.extend(true, {}, me._source.scoring.groups);
		//the rest items which are filtered from scoring.group items.
		var restGroupItems = [];
		copyData.content.items = [];
		if (distNo > 0) {
			scoringDistItems = _.shuffle(scoringDistItems);
			filteredDistItems = scoringDistItems.slice(0, distNo);
			copyData.content.items = copyData.content.items.concat(filteredDistItems);
		}
		$.each(me._source.scoring.groups, function (p, v) {
			filteredCount = filteredCount + v.items.length;
		});
		// specified correct items number larger than the account of scoring.group's items
		if (optionNo >= filteredCount) {
			$.each(me._source.scoring.groups, function (p, v) {
				copyData.content.items = copyData.content.items.concat(v.items);
			});
			me._allItemsCount = filteredCount;
		} else {
			while (optionNo > 0) {
				$.each(copyScoringGroups, function (p, v) {
					v.items = _.shuffle(v.items);
					if (v.items && v.items.length) {
						copyData.content.items.push(v.items.shift());
						optionNo--;
					}
					if (optionNo <= 0) {
						return false;
					}
				});
			}
			//merge not used items in scoring.groups
			$.each(copyScoringGroups, function (p, v) {
				if (v.items && v.items.length) {
					restGroupItems = restGroupItems.concat(v.items);
				}
			});
			//delete items which are existed in data.scoring.groups by filtering restGroupItems array.
			$.each(data.scoring.groups, function (p, v) {
				if (restGroupItems.length === 0) {
					return false;
				}
				if (v.items && v.items.length) {
					v.items = $.grep(v.items, function (m) {
						var retain = true;
						$.each(restGroupItems, function (i, j) {
							if (m._id === j._id) {
								retain = false;
								return false;
							}
						});
						return retain;
					});
				}
			});
		}
		$.each(copyData.content.items, function (p, v) {
			$.each(data.content.items, function (m, n) {
				if (v._id === n._id) {
					v.txt = n.txt;
					return false;
				}
			});
		});
		delete data.scoring.items;
		data.content.items = _.shuffle(copyData.content.items);
		data.content.items = _.uniq(data.content.items, false, function (p) {
			return p.txt;
		});
		return data;
	}

	function filterByNonGrade(data) {
		var optionNo = data.filterOptions.optionNo;
		var copyData = $.extend(true, {}, data);
		data.content.items = _.shuffle(copyData.content.items).slice(0, optionNo);
		data.content.items = _.uniq(data.content.items, false, function (p) {
			return p.txt;
		});
		return data;
	}

	function filterData(data) {
		return this.hasScoring ? filterByGrade.call(this, data)
			: filterByNonGrade.call(this, data);
	}

	/**
	 drop items which be drag to current container .
	 */
	function startDroppable() {
		var me = this;
		var $groupTargetArea = this.$element.find(SEL_TARGET);
		var $groupOriginArea = this.$element.find(SEL_ORIGIN_AREA);
		$groupTargetArea.droppable({
			accept: SEL_STRIP,
			hoverClass: CLS_HOVER,
			drop: function (event, ui) {
				var $target = $(this),
					$strip = ui.draggable;
				dropStrip.call(me, $strip, $target);
			}
		});

		$.each($groupOriginArea.find(SEL_STRIP), function (p, v) {
			var $el = $(v);
			var isCopyMode = me._isCopyMode;
			$el.draggable({
				containment: SEL_ACTIVITY_BODY,
				revert: "invalid",
				revertDuration: 300,
				snapMode: "inner",
				stack: isCopyMode ? "" : "div.ets-act-grp-strip",
				helper: isCopyMode ? 'clone' : 'original',
				cancel: "",
				scroll: false,
				stop: function (/*event, ui*/) {
					var $me = $(this);
					if (!$me.parent().hasClass(CLS_TARGET)) {
						$me.animate({"left": 0, "top": 0}, 500);
					}
				},
				start: function (event, ui) {
					var $me = $(this);
					if (isCopyMode) {
						ui.helper.removeClass(CLS_STRIP_COPY).addClass(CLS_STRIP_MOVE);
					}
					if ($me.parent().hasClass(CLS_TARGET)) {
						return false;
					}
				}
			});
		});
	}

	function cloneModeDrop(correct, $strip, $target) {
		var me = this;
		var $stripClone = $strip.clone();
		$stripClone.removeClass(CLS_STRIP_COPY).addClass(CLS_STRIP_MOVE);
		$target.prepend($stripClone.css({"left": 0, "top": 0}));
		if (correct) {
			me.hasScoring && $stripClone.addClass(CLS_CORRECT);
			window.setTimeout(function () {
				slideCorrectStrip.call(me, $stripClone);
			}, SLIDETIME.correct);
		} else {
			$stripClone.addClass(CLS_INCORRECT);
			window.setTimeout(function () {
				$stripClone.removeClass(CLS_INCORRECT);
				slideIncorrectCloneStrip.call(me, $stripClone, $strip, $target);
			}, SLIDETIME.incorrect);
		}
	}

	function moveModeDrop(correct, $strip, $target) {
		var me = this;
		$target.prepend($strip.css({"left": 0, "top": 0}));
		if (correct) {
			me.hasScoring && $strip.addClass(CLS_CORRECT);
			window.setTimeout(function () {
				slideCorrectStrip.call(me, $strip);
			}, SLIDETIME.correct);
		} else {
			$strip.addClass(CLS_INCORRECT);
			window.setTimeout(function () {
				me.$element.find(SEL_ORIGIN_AREA).append($strip.removeClass(CLS_INCORRECT));
				slideIncorrectStrip.call(me, $strip, $target);
			}, SLIDETIME.incorrect);
		}
	}

	function slideCorrectStrip($strip) {
		$strip.animate(
			{
				top: 60
			},
			500,
			function () {
				$(this).addClass(CLS_ACCEPTED);
				var stripId = $strip.attr('data-group');
				if ($strip.siblings('[data-group="' + stripId + '"]').length > 0) {
					$strip.remove();
				}
			}
		);
	}

	function slideIncorrectStrip($strip, $target) {
		var distance = {
			"left": $target.offset().left - $strip.offset().left,
			"top": $target.offset().top - $strip.offset().top
		};
		$strip.css({"left": distance.left, "top": distance.top})
			.animate({"left": 0, "top": 0}, 500);
	}

	function slideIncorrectCloneStrip($stripClone, $strip, $target) {
		var me = this;
		var distance = {
			"sLeft": $strip.position().left,
			"sTop": $strip.position().top,
			"tLeft": $target.position().left,
			"tTop": $target.position().top
		};
		me.$element.find(SEL_ORIGIN_AREA).append($stripClone.css({"position": "absolute"}));
		$stripClone.css({"left": distance.tLeft, "top": distance.tTop})
			.animate({"left": distance.sLeft, "top": distance.sTop},
				500,
				function () {
					$stripClone.remove();
				});
	}

	function dropStrip($strip, $target) {
		var me = this;
		var correct;
		var stripId = $strip.data("group");
		var targetId = $target.data("group");
		correct = me.checkAnswer(stripId, targetId);
		me.displayInteractionResult(correct, $strip, $target)
	}

	/**
	 call completeGroup when all items are dragged to relative container
	 */
	function completeGrouping() {
		var me = this;
		if (!me.hasScoring) {
			me.items().answered(true);
			return false;
		}
		var json = me._json;
		json.content._isCorrect = true;
		var $selDropArea = me.$element.find(SEL_DROP_AREA);
		var $originalArea = me.$element.find(SEL_ORIGIN_AREA);
		$selDropArea.addClass(CLS_GRADE_COMPLETED).hide().fadeIn('slow');
		disabledStrip.call(me);
		$originalArea.children().length === 0 && $originalArea.remove();
		me.$element.parents(SEL_ETS_ACT_BD_MAIN).css({"vertical-align": "top"});
		me.items().completed(true);
		me.publish("activity-container/resize");
	}

	function disabledStrip() {
		var $originalArea = this.$element.find(SEL_ORIGIN_AREA);
		$originalArea.find(SEL_STRIP).draggable("disable");
		$originalArea.addClass(CLS_STRIP_DISABLED);
	}

	function render() {
		var me = this;
		me._isCopyMode = (me._json.templateCode == "GroupCopy");
		var data = {
			wordItems: me._json.content.items,
			wordGroups: me._json.content.groups,
			references: me._json.references,
			isCopyMode: me._isCopyMode
		};

		return me.html(tTemplate, data)
			.then(function () {
				startDroppable.call(me);
				return me.attachATAssetDom(me._json.content.items);
			});
	}

	var extendOptions = {
		"sig/initialize": function onInitialize() {
			this.hasScoring || this.type(Widget.ACT_TYPE.PRACTICE);
			this.items().instantFeedback(true);

			filterData.call(this, this._json);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"completed": Factory.around(function (base) {
			return function () {
				base.apply(this, arguments);
				this._COMPLETED && disabledStrip.call(this);
			};
		}),
		checkAnswer: function (stripId, targetId) {
			var me = this;

			if (!me.hasScoring) {
				window.setTimeout(function () {
					completeGrouping.call(me);
				}, SLIDETIME.correct);
				return true;
			}

			var json = me._json;
			var solution = Scoring.findById(json.scoring.groups, targetId);
			var correctStrip = Scoring.findById(solution.items, stripId);
			var correct = Boolean(correctStrip);

			var alreadyAnswered = false;
			if (correct) {
				me._storeGroup[targetId] = me._storeGroup[targetId] || [];
				if (_.indexOf(me._storeGroup[targetId], stripId) === -1) {
					me._storeGroup[targetId].push(stripId);
					me._allItemsCount--;
				} else {
					alreadyAnswered = true;
				}
			}

			if (!alreadyAnswered) {
				var promise = me.publishInteraction(
					Interaction.makeGroupingInteraction(correct, targetId, stripId));
				if (me._allItemsCount == 0) {
					window.setTimeout(function () {
						promise.then(function(){
							completeGrouping.call(me);
						});
					}, SLIDETIME.correct);
				}
			}

			return correct;
		},
		displayInteractionResult: function (correct, $strip, $target) {
			var me = this;
			if (me._isCopyMode) {
				cloneModeDrop.call(me, correct, $strip, $target);
			} else {
				moveModeDrop.call(me, correct, $strip, $target);
			}
		}
	};
	return Widget.extend(function () {
		this._allItemsCount = 0;
		this._storeGroup = {};
	}, extendOptions);
});


define('troopjs-requirejs/template!school-ui-activity/activity/language-comparison/language-comparison.html',[],function() { return function template(data) { var o = "";	var data = data || {},
		me = this,
		phrases = data.content.phrases[me.index()],
		audioUrl = phrases.audio.url,
		text = phrases.text,
		translation = phrases.translation;

	var outBlurb = function(id,en){
	    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
	    return res;
	};
o += "\r\n\r\n<div class=\"ets-act-lnc ets-cf\">\r\n\t<div class=\"ets-act-lnc-main\">\r\n\t\t<div class=\"ets-act-btn-skip ets-act-lnc-skip\">\r\n\t\t\t<span " +outBlurb(450011,"Skip")+ "></span>\r\n\t\t</div>\r\n\t\t<div class=\"ets-act-lnc-content\">\r\n\t\t\t<div class=\"ets-act-lnc-play\">\r\n\t\t\t\t<div class=\"ets-act-lnc-play-content\">\r\n\t\t\t\t\t<div class=\"ets-table-hack\">\r\n\t\t\t\t\t\t<div class=\"ets-act-lnc-play-container\">\r\n\t\t\t\t\t\t\t<div class=\"ets-act-lnc-play-tip ets-none\">\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-play-tip-top\"></div>\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-play-tip-mid\">\r\n\t\t\t\t\t\t\t\t\t<span class=\"ets-act-lnc-tip-msg\" " +outBlurb(462459,"Listen to the audio")+ "></span>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-play-tip-bottom\"></div>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class=\"ets-act-lnc-play-btn\">\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\r\n\t\t\t\t\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\r\n\t\t\t\t\t\t\t\t\t       data-src=\"" +audioUrl+ "\" type=\"audio/mpeg\"\r\n\t\t\t\t\t\t\t\t\t       class=\"ets-ap\" controls=\"controls\"></audio>\r\n\t\t\t\t\t\t\t\t</div></div>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class=\"ets-act-lnc-play-sentences\">\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-play-original\">" +text+ "</div>\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-play-translation\">" +translation+ "</div>\t\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\r\n\t\t\t<div class=\"ets-act-lnc-record\">\r\n\t\t\t\t<div class=\"ets-act-lnc-record-content\">\r\n\t\t\t\t\t<div class=\"ets-act-lnc-record-msg ets-first-time\">\r\n\t\t\t\t\t\t<div class=\"ets-table-hack\">\r\n\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-btn\" data-weave=\"school-ui-activity/shared/asr/asr-ui\"></div>\r\n\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-tip ets-away\">\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-tip-top\"></div>\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-tip-mid\">\r\n\t\t\t\t\t\t\t\t\t<span class=\"ets-act-lnc-tip-msg ets-act-lnc-tip-msg-repeat\" " +outBlurb(465087,"Try to repeat the phrase")+ "></span>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-tip-bottom\"></div>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-container ets-away\">\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-title\">\r\n\t\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-title-top\"></div>\r\n\t\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-title-bottom\">\r\n\t\t\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-title-content-container\">\r\n\t\t\t\t\t\t\t\t\t\t\t<span class=\"ets-act-lnc-record-msg-title-content ets-act-lnc-record-msg-title-content-correct\" " +outBlurb(480559,"Correct")+ ">Correct</span>\r\n\t\t\t\t\t\t\t\t\t\t\t<span class=\"ets-act-lnc-record-msg-title-content ets-act-lnc-record-msg-title-content-wrong\" " +outBlurb(480560,"Try again!")+ "></span>\r\n\t\t\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t</div>\t\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-content-container-top\">\r\n\t\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-content-container-inner\">\r\n\t\t\t\t\t\t\t\t\t\t<div class=\"ets-table-hack\">\r\n\t\t\t\t\t\t\t\t\t\t\t<div class=\"ets-ap-lnc-record\"></div>\r\n\t\t\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t\t\t<div class=\"ets-table-hack\">\r\n\t\t\t\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-content\"></div>\r\n\t\t\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<div class=\"ets-act-lnc-record-msg-content-container-bottom\"></div>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t\t<div class=\"ets-act-lnc-new-icon\"></div>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"ets-act-lnc-number\">\r\n                <span class=\"ets-act-lnc-number-current\"></span> / <span class=\"ets-act-lnc-number-total\"></span>\r\n            </div>\r\n\t\t</div>\r\n\t</div>\r\n\t\r\n\t<!-- Activity Summary Start-->\r\n\t<div class=\"ets-act-summary-wrap\"></div>\r\n\t<!-- Activity Summary End-->\r\n</div>"; return o; }; });
define('school-ui-activity/activity/language-comparison/v1',[
	"jquery",
	"when",
	"poly",
	"school-ui-activity/activity/base/main",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./language-comparison.html",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states",
	"school-ui-shared/utils/update-helper",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/enum/activity-event-type"
], function MultipleChoiceModule($, when, poly, Widget, Scoring, Interaction, tTemplate, ratingSourceType, MSGType, ASRUIStatus, updateHelper, parser, activityEventType) {
	"use strict";

	// declare variables
	var CLS_NONE = "ets-none",
		CLS_WRONG = 'ets-wrong',
		CLS_CORRECT = 'ets-correct',
		CLS_DISABLED = "ets-disabled",
		CLS_AWAY = "ets-away";

	var SEL_BTN_SKIP = ".ets-act-lnc-skip",
		SEL_AUDIO = ".ets-ap",
		SEL_LNC_RECORD = ".ets-ap-lnc-record",
		SEL_LNC_PLAY_TIP = ".ets-act-lnc-play-tip",
		SEL_LNC_RECORD_TIP = ".ets-act-lnc-record-tip",
		SEL_LNC_RECORD_CONTENT = ".ets-act-lnc-record-content",
		SEL_LNC_RECORD_MSG_CONTAINER = ".ets-act-lnc-record-msg-container",
		SEL_LNC_RECORD_MSG_CONTENT = ".ets-act-lnc-record-msg-content",

		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		SEL_LNC_NUMBER_CURRENT = '.ets-act-lnc-number-current',
		SEL_LNC_NUMBER_TOTAL = '.ets-act-lnc-number-total',
		SEL_LNC_MAIN = ".ets-act-lnc-main",
		SEL_LNC_PLAY_TRANSLATION = ".ets-act-lnc-play-translation",
		SEL_LNC_RECORD_MSG_TTITLE_CONTENT_CORRECT = ".ets-act-lnc-record-msg-title-content-correct",
		SEL_LNC_RECORD_MSG_TTITLE_CONTENT_WRONG = ".ets-act-lnc-record-msg-title-content-wrong";

	var IS_CORRECT = "_isCorrect",
		IS_QUESTION_PASSED,
		PROP_ID = "_id";

	var ACT_ID = "act_id",
		ACT_TEMPLATE_ID = "act_template_id";

	var MAP_ABTEST_EVENTTYPE = {
		"V1": activityEventType["lngCompRetryTimesV1"],
		"V2": activityEventType["lngCompRetryTimesV2"]
	};

	var MAP_ABTEST_EVENTATTR = {
		"pass": "|pass",
		"fail": "|fail",
		"skip": "|skip",
		"warning": "|warning",
		"broken": "|broken"
	};

	var HUB_ASR_SET = "asr/ui/setting",
		HUB_ASR_DISABLE = "asr/disable",
		HUB_ASR_STOP_PLAYBACK = "asr/stopPlayback",
		HUB_ASR_PLAYBACK = "asr/startPlayback",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference";

	var WIDGET_PATH_AUDIO_SHELL = "school-ui-activity/shared/audio/audio-shell";

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	/**
	 * Shuffle origin json data
	 */
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length() - 1);

		me.items().instantFeedback(true);

		return me.html(tTemplate, me._json).then(function () {
			onRendered.call(me);
		});
	}

	/**
	 * On activity rendered:
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = me.$element,
			phrases = me._json.content.phrases[me.index()],
			text = phrases.text,
			translation = phrases.translation;

		me._firstTimePlay = true;
		me._firstTimeRecord = true;
		me._playMediaElement = "";
		me._recordMediaElement = "";
		me._asrState = 'NORMAL';
		//Remove English translation if viewing site in English
		if (text.replace(/\’/g, "'") === translation.replace(/\’/g, "'")) {
			$el.find(SEL_LNC_PLAY_TRANSLATION).hide();
		}

		$el.find(SEL_BTN_SKIP).click(function () {
			if ($(this).hasClass(CLS_DISABLED)) {
				return;
			}
			logActEvent.call(me, "skip");
			if (me.index() + 1 !== me.length()) {
				me.publishSkipInteraction(me.index())
					.then(function(){
						me.publish("asr/ui/playback", false);
						me.nextStep();
					});
			}
		});
		if (me.index() != 0) {
			$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_AWAY);
		}
		renderQuestionNumber.call(me);
		if (me.asrDisabled || window.location.search.indexOf("non-asr") > 0) {
			$el.find(SEL_BTN_SKIP).addClass(CLS_DISABLED);
			$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_NONE);
			me._json.content[IS_CORRECT] = true;
			me.index(me.length() - 1);
			me.completed(true);
			me.publish("asr/disable");
		} else {
			$el.find(SEL_LNC_PLAY_TIP).removeClass(CLS_NONE);
			//set ASR recording data
			me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.phrases[me.index()], {
				asrFallbackType: Widget.ASR_FALLBACK_TYPE.NEXT,
				asrFallbackCb: function () {
					$el.find(SEL_BTN_SKIP).addClass(CLS_DISABLED);
					me._json.content[IS_CORRECT] = true;
					me.index(me.length() - 1);
					me.completed(true);
				},
				needResetASRFailedTimes: true
			});
		}
	}

	//Question number
	function renderQuestionNumber() {
		var me = this,
			$el = me.$element;
		$el.find(SEL_LNC_NUMBER_CURRENT).text(me.index() + 1);
		$el.find(SEL_LNC_NUMBER_TOTAL).text(me.length() - 1);
	}

	//ASR recognize success
	function onASRRecognized(asrResult, guid) {
		if (asrResult._hasError) return;

		var me = this,
			$el = me.$element,
			recordMsg = "",
			$skipButton = $el.find(SEL_BTN_SKIP),
			$recordContent = $el.find(SEL_LNC_RECORD_CONTENT),
			$msgContainer = $el.find(SEL_LNC_RECORD_MSG_CONTAINER),
			$msgTips = $el.find(SEL_LNC_RECORD_TIP),
			phraseIndex = me.index();

		var phraseResult = asrResult[0];

		var correct = this.checkAnswer(phraseIndex, phraseResult);

		var words = phraseResult.words;
		if (!words) return;

		for (var wordIndex = 0; wordIndex < words.length; wordIndex++) {
			var wordCorrect = Scoring.isWordCorrect(words[wordIndex]);
			recordMsg += "<span class='" + (wordCorrect ? '' : CLS_WRONG) + "'>" + words[wordIndex].word + "</span>";
		}

		$el.find(SEL_LNC_RECORD_MSG_CONTENT).html(recordMsg);

		$msgTips.addClass(CLS_AWAY);

		if (correct) {
			//passed
			$skipButton.addClass(CLS_DISABLED);
			$recordContent.removeClass(CLS_WRONG).addClass(CLS_CORRECT);
			$el.find(SEL_LNC_RECORD_MSG_TTITLE_CONTENT_CORRECT).removeClass(CLS_NONE);
			$el.find(SEL_LNC_RECORD_MSG_TTITLE_CONTENT_WRONG).addClass(CLS_NONE);
		} else {
			//failed
			$skipButton.removeClass(CLS_DISABLED);
			$recordContent.addClass(CLS_WRONG).removeClass(CLS_CORRECT);
			$el.find(SEL_LNC_RECORD_MSG_TTITLE_CONTENT_WRONG).removeClass(CLS_NONE);
			$el.find(SEL_LNC_RECORD_MSG_TTITLE_CONTENT_CORRECT).addClass(CLS_NONE);
		}
		record.call(me, guid);
		$msgContainer.removeClass(CLS_AWAY);

		logActEvent.call(me, "passOrFail");
	}

	//record player init when first time and reset record src
	function record(guid) {
		var me = this, $record = me.$element.find(SEL_LNC_RECORD);

		$record
			.unweave()
			.then(function () {
				return $record
					.data("option", {
						"_playHandler": function () {
							me.publish(HUB_ASR_PLAYBACK);
						},
						"_pauseHandler": function () {
							me.publish(HUB_ASR_STOP_PLAYBACK);
						},
						"guid": guid
					})
					.attr("data-weave", WIDGET_PATH_AUDIO_SHELL + "(option)")
					.weave();
			});
	}

	//Come to last question
	function comeToLast() {
		var me = this;
		var totalLength = me.length() - 1;//since there is a fake summary page there,so here need to subtract 1
		var passNum = me._answersCorrectness.reduce(function (count, correct) {
			return correct ? count + 1 : count;
		}, 0);
		var failNum = totalLength - passNum;
		var passNeedNum = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * totalLength);
		var isPassed = passNum >= passNeedNum;

		viewSummary.call(me, isPassed, passNum, failNum, passNeedNum);

		me._json.content._isCorrect = isPassed;
		return completeItem.call(me, true);
	}

	//setup summary page,including isPassed?
	//pass number, fail number ,and how many correct answers will be pass
	function viewSummary(passed, correctNum, skippedNum, passNum) {
		var me = this,
			$el = me.$element;

		me.$element.find(SEL_LNC_MAIN).fadeOut(300, function () {
			//Render activity summary widget
			$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
				.data("settings",
				{
					passed: passed,
					correctNum: correctNum,
					skippedNum: skippedNum,
					passNum: passNum
				})
				.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
				.weave();
		});

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	//item complete status change
	function completeItem(status) {
		var me = this;
		var itemIndex = me.index();
		var answeredPromise = me.items(itemIndex).answeredPromise(status);
		var completedPromise = me.items(itemIndex).completedPromise(status);
		return when.all([answeredPromise, completedPromise]);
	}

	function logActEvent(eventAttr) {
		var me = this;
		var phraseIndex = me.index();
		var phrase = me._json.content.phrases[phraseIndex];
		var isCurrentQuestionPassed = Boolean(me._answersCorrectness[phraseIndex]);
		if (IS_QUESTION_PASSED[phraseIndex]) {
			if (eventAttr === "passOrFail") {
				eventAttr = isCurrentQuestionPassed ? "pass" : "fail";
			}
			updateHelper.logActEvent({
				"activityId": parser.parseId(me[ACT_TEMPLATE_ID] || me[ACT_ID]),
				"eventDescr": phrase[PROP_ID] + MAP_ABTEST_EVENTATTR[eventAttr],
				"eventTypeId": MAP_ABTEST_EVENTTYPE[me.feedbackVersion]
			});
		}
		if (isCurrentQuestionPassed) {
			IS_QUESTION_PASSED[phraseIndex] = isCurrentQuestionPassed;
		}
	}

	var extendOptions = {
		"sig/initialize": function onInitialize() {
			var me = this,
				itemsLength = me._json.content.phrases.length;
			me.scoringType(Widget.SCORING_TYPE.ASR);

			/*
			 *since there is a summary page there, and deal with it as a item like other question
			 *so fake a item here.
			 */
			me.length(itemsLength + 1);
		},
		"sig/render": function onRender() {
			if (this.index() >= this.length() - 1) return;
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			if (me._summaryTimer > 0) {
				window.clearTimeout(me._summaryTimer);
			}
		},
		"sig/start": function () {
			var me = this;

			me.query(CCL_ASR_ENABLED).spread(function (asrEnabledCcl) {
				me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');

				IS_QUESTION_PASSED = [];
			});
		},
		checkAnswer: function (phraseIndex, phraseResult) {
			var me = this;
			var correct = Scoring.isPhraseCorrect(phraseResult);

			me._answersCorrectness[phraseIndex] = correct;

			this.publishInteraction(Interaction.makeAsrInteraction(correct, phraseResult._id))
				.then(function () {
					completeItem.call(me, correct);
				});

			return correct;
		},
		publishSkipInteraction: function (phraseIndex) {
			var me = this;
			var questionId = me._json.content.phrases[phraseIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			return me.publishInteraction(interaction)
				.then(function () {
					completeItem.call(me, true);
				});
		},
		nextStep: function onNextStep() {
			var index = this.index(),
				me = this;

			me.publish(HUB_ASR_DISABLE);

			if (index > me.length() - 2) {
				return when.resolve();
			} else if (index === me.length() - 2) {
				return me.indexPromise(index + 1)
					.then(comeToLast.bind(me));
			} else {
				return me.indexPromise(index + 1)
					.then(function () {
						return me.publish(HUB_ASR_STOP_PLAYBACK);
					})
					.then(function () {
						return me.signal('render');
					});
			}
		},
		"hub/asr/ui/states/changed": function (state) {
			if (!state) return;
			var me = this,
				$el = me.$element,
				$skipButton = $el.find(SEL_BTN_SKIP);

			me._asrState = state;

			function layoutBack() {
				$el.find(SEL_LNC_RECORD_MSG_CONTAINER).addClass(CLS_AWAY);
				$skipButton.removeClass(CLS_DISABLED);
			}

			// asr status
			switch (state) {
				case ASRUIStatus.NORMAL:
					if (me._firstTimePlay === false) {
						$el.find(SEL_LNC_RECORD_TIP).removeClass(CLS_AWAY);
					}
					$skipButton.removeClass(CLS_DISABLED);
					break;
				case ASRUIStatus.RECORDING:
				case ASRUIStatus.PROCESSING:
					$skipButton.addClass(CLS_DISABLED);
					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					break;
				case ASRUIStatus.PREPARING:
					me.items(me.index()).answered(false);
					$skipButton.addClass(CLS_DISABLED);

					if (me._firstTimeRecord) {
						me._firstTimeRecord = false;
					}

					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					$el.find(SEL_LNC_RECORD_MSG_CONTAINER).addClass(CLS_AWAY);

					$el.find(SEL_AUDIO).trigger('player/pause');

					break;
				case ASRUIStatus.BROKEN:
					layoutBack();
					logActEvent.call(me, "broken");
					break;
				case ASRUIStatus.WARNING:
					layoutBack();
					logActEvent.call(me, "warning");
					break;
				case ASRUIStatus.HINT:
				case ASRUIStatus.ERROR:
				case ASRUIStatus.DOWN:
					layoutBack();
					break;
				case ASRUIStatus.DISABLE:
					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					break;
				default:
					break;
			}
		},
		"hub/rating/sourceType": function () {
			return [ratingSourceType["ASR_SPEAKING"]];
		},
		"dom:.ets-ap/media/play": function () {
			var me = this,
				$el = me.$element;

			// stop playback when play audio
			me.publish(HUB_ASR_STOP_PLAYBACK);

			if (me._firstTimePlay) {
				$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_AWAY);
				if (me._asrState === "NORMAL" && me._firstTimeRecord) {
					$el.find(SEL_LNC_RECORD_TIP).removeClass(CLS_AWAY);
				}
				me._firstTimePlay = false;
			}
		}
	};

	return Widget.extend(function ($element) {
		this._playMediaElement;
		this._recordMediaElement;
		this._firstTimePlay;
		this._firstTimeRecord;
		this._asrState;
		this.asrDisabled = false;
		this.feedbackVersion = $element.data("option").abtestVersion;
		this._answersCorrectness = [];
	}, extendOptions);
});

define('school-ui-activity/activity/language-comparison/v2',[
	"jquery",
	"poly",
	"when",
	"school-ui-activity/activity/base/main",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./language-comparison.html",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states",
	"school-ui-shared/utils/update-helper",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/enum/activity-event-type"
], function MultipleChoiceModule(
	$,
	poly,
	when,
	Widget,
	Scoring,
	Interaction,
	tTemplate,
	ratingSourceType,
	MSGType,
	ASRUIStatus,
	updateHelper,
	parser,
	activityEventType
) {
	"use strict";

	// declare variables
	var CLS_NONE = "ets-none",
		CLS_WRONG = 'ets-wrong',
		CLS_DISABLED = "ets-disabled",
		CLS_AWAY = "ets-away",
		CLS_NEW_CORRECT = "ets-act-lnc-new-correct",
		CLS_NEW_INCORRECT = "ets-act-lnc-new-incorrect";

	var SEL_BTN_SKIP = ".ets-act-lnc-skip",
		SEL_AUDIO = ".ets-ap",
		SEL_LNC_RECORD = ".ets-ap-lnc-record",
		SEL_LNC_PLAY_TIP = ".ets-act-lnc-play-tip",
		SEL_LNC_RECORD_TIP = ".ets-act-lnc-record-tip",
		SEL_LNC_RECORD_CONTENT = ".ets-act-lnc-record-content",
		SEL_LNC_RECORD_MSG_CONTAINER = ".ets-act-lnc-record-msg-container",
		SEL_LNC_RECORD_MSG_CONTENT = ".ets-act-lnc-record-msg-content",

		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		SEL_LNC_NUMBER_CURRENT = '.ets-act-lnc-number-current',
		SEL_LNC_NUMBER_TOTAL = '.ets-act-lnc-number-total',
		SEL_LNC_MAIN = ".ets-act-lnc-main",
		SEL_LNC_PLAY_TRANSLATION = ".ets-act-lnc-play-translation";

	var IS_CORRECT = "_isCorrect",
		IS_QUESTION_PASSED,
		PROP_ID = "_id";

	var ACT_ID = "act_id",
		ACT_TEMPLATE_ID = "act_template_id";

	var MAP_ABTEST_EVENTTYPE = {
		"V1": activityEventType["lngCompRetryTimesV1"],
		"V2": activityEventType["lngCompRetryTimesV2"]
	};

	var MAP_ABTEST_EVENTATTR = {
		"pass": "|pass",
		"fail": "|fail",
		"skip": "|skip",
		"warning": "|warning",
		"broken": "|broken"
	};

	var HUB_ASR_SET = "asr/ui/setting",
		HUB_ASR_DISABLE = "asr/disable",
		HUB_ASR_STOP_PLAYBACK = "asr/stopPlayback",
		HUB_ASR_PLAYBACK = "asr/startPlayback",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference";

	var WIDGET_PATH_AUDIO_SHELL = "school-ui-activity/shared/audio/audio-shell";

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	/**
	 * Shuffle origin json data
	 */
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length() - 1);

		me.items().instantFeedback(true);

		return me.html(tTemplate, me._json).then(function () {
			onRendered.call(me);
		});
	}

	/**
	 * On activity rendered:
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = me.$element,
			phrases = me._json.content.phrases[me.index()],
			text = phrases.text,
			translation = phrases.translation;

		me._firstTimePlay = true;
		me._firstTimeRecord = true;
		me._playMediaElement = "";
		me._recordMediaElement = "";
		me._asrState = 'NORMAL';
		//Remove English translation if viewing site in English
		if (text.replace(/\’/g, "'") === translation.replace(/\’/g, "'")) {
			$el.find(SEL_LNC_PLAY_TRANSLATION).hide();
		}

		$el.find(SEL_BTN_SKIP).click(function () {
			if ($(this).hasClass(CLS_DISABLED)) {
				return;
			}
			logActEvent.call(me, "skip");
			if (me.index() + 1 !== me.length()) {
				me.publishSkipInteraction(me.index())
					.then(function () {
						me.publish("asr/ui/playback", false);
						me.nextStep();
					});
			}
		});
		if (me.index() != 0) {
			$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_AWAY);
		}
		renderQuestionNumber.call(me);
		if (me.asrDisabled || window.location.search.indexOf("non-asr") > 0) {
			$el.find(SEL_BTN_SKIP).addClass(CLS_DISABLED);
			$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_NONE);
			me._json.content[IS_CORRECT] = true;
			me.index(me.length() - 1);
			me.completed(true);
			me.publish("asr/disable");
		} else {
			$el.find(SEL_LNC_PLAY_TIP).removeClass(CLS_NONE);
			//set ASR recording data
			me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.phrases[me.index()], {
				asrFallbackType: Widget.ASR_FALLBACK_TYPE.NEXT,
				asrFallbackCb: function () {
					$el.find(SEL_BTN_SKIP).addClass(CLS_DISABLED);
					me._json.content[IS_CORRECT] = true;
					me.index(me.length() - 1);
					me.completed(true);
				},
				needResetASRFailedTimes: true
			});
		}
	}

	function showASRMessage(msgType) {
		this.publish("asr/show/message", MSGType[msgType]);
	}

	//Question number
	function renderQuestionNumber() {
		var me = this,
			$el = me.$element;
		$el.find(SEL_LNC_NUMBER_CURRENT).text(me.index() + 1);
		$el.find(SEL_LNC_NUMBER_TOTAL).text(me.length() - 1);
	}

	//ASR recognize success
	function onASRRecognized(asrResult, guid) {
		if (asrResult._hasError) return;

		var me = this,
			$el = me.$element,
			recordMsg = "",
			$skipButton = $el.find(SEL_BTN_SKIP),
			$recordContent = $el.find(SEL_LNC_RECORD_CONTENT),
			$msgTips = $el.find(SEL_LNC_RECORD_TIP),
			phraseIndex = me.index();

		var phraseResult = asrResult[0];

		var correct = this.checkAnswer(phraseIndex, phraseResult);

		var words = phraseResult.words;
		if (!words) return;

		for (var wordIndex = 0; wordIndex < words.length; wordIndex++) {
			var wordCorrect = Scoring.isWordCorrect(words[wordIndex]);
			recordMsg += "<span class='" + (wordCorrect ? '' : CLS_WRONG) + "'>" + words[wordIndex].word + "</span>";
		}

		$el.find(SEL_LNC_RECORD_MSG_CONTENT).html(recordMsg);
		$msgTips.addClass(CLS_AWAY);

		$skipButton.toggleClass(CLS_DISABLED, correct);
		$recordContent.toggleClass(CLS_NEW_CORRECT, correct);
		$recordContent.toggleClass(CLS_NEW_INCORRECT, !correct);
		if (!correct && asrResult && !asrResult._hasError) {
			//if the asr result got a score
			showASRMessage.call(me, "INCORRECT_PRONUN");
		}
		record.call(me, guid);

		logActEvent.call(me, "passOrFail");
	}

	//record player init when first time and reset record src
	function record(guid) {
		var me = this, $record = me.$element.find(SEL_LNC_RECORD);

		$record
			.unweave()
			.then(function () {
				return $record
					.data("option", {
						"_playHandler": function () {
							me.publish(HUB_ASR_PLAYBACK);
						},
						"_pauseHandler": function () {
							me.publish(HUB_ASR_STOP_PLAYBACK);
						},
						"guid": guid
					})
					.attr("data-weave", WIDGET_PATH_AUDIO_SHELL + "(option)")
					.weave();
			});
	}

	//Come to last question
	function comeToLast() {
		var me = this;
		var totalLength = me.length() - 1;//since there is a fake summary page there,so here need to subtract 1
		var passNum = me._answersCorrectness.reduce(function (count, correct) {
			return correct ? count + 1 : count;
		}, 0);
		var failNum = totalLength - passNum;
		var passNeedNum = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * totalLength);
		var isPassed = passNum >= passNeedNum;

		viewSummary.call(me, isPassed, passNum, failNum, passNeedNum);

		me._json.content._isCorrect = isPassed;
		return me.items().completedPromise(true);
	}

	//setup summary page,including isPassed?
	//pass number, fail number ,and how many correct answers will be pass
	function viewSummary(passed, correctNum, skippedNum, passNum) {
		var me = this,
			$el = me.$element;

		me.$element.find(SEL_LNC_MAIN).fadeOut(300, function () {
			//Render activity summary widget
			$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
				.data("settings",
				{
					passed: passed,
					correctNum: correctNum,
					skippedNum: skippedNum,
					passNum: passNum
				})
				.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
				.weave();
		});

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	//item complete status change
	function completeItem(status) {
		var me = this;
		var answeredPromise = me.items(me.index()).answeredPromise(status);
		var completedPromise = me.items(me.index()).completedPromise(status);
		return when.all([answeredPromise, completedPromise]);
	}

	function logActEvent(eventAttr) {
		var me = this;
		var phraseIndex = me.index();
		var phrase = me._json.content.phrases[phraseIndex];
		var isCurrentQuestionPassed = Boolean(me._answersCorrectness[phraseIndex]);
		if (IS_QUESTION_PASSED[phraseIndex]) {
			if (eventAttr === "passOrFail") {
				eventAttr = isCurrentQuestionPassed ? "pass" : "fail";
			}
			updateHelper.logActEvent({
				"activityId": parser.parseId(me[ACT_TEMPLATE_ID] || me[ACT_ID]),
				"eventDescr": phrase[PROP_ID] + MAP_ABTEST_EVENTATTR[eventAttr],
				"eventTypeId": MAP_ABTEST_EVENTTYPE[me.feedbackVersion]
			});
		}
		if (isCurrentQuestionPassed) {
			IS_QUESTION_PASSED[phraseIndex] = isCurrentQuestionPassed;
		}
	}

	var extendOptions = {
		"sig/initialize": function onInitialize() {
			var me = this,
				itemsLength = me._json.content.phrases.length;
			me.scoringType(Widget.SCORING_TYPE.ASR);

			/*
			 *since there is a summary page there, and deal with it as a item like other question
			 *so fake a item here.
			 */
			me.length(itemsLength + 1);
		},
		"sig/render": function onRender() {
			if (this.index() >= this.length() - 1) return;
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			if (me._summaryTimer > 0) {
				window.clearTimeout(me._summaryTimer);
			}
		},
		"sig/start": function () {
			var me = this;

			me.query(CCL_ASR_ENABLED).spread(function (asrEnabledCcl) {
				me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');

				IS_QUESTION_PASSED = [];
			});
		},
		checkAnswer: function (phraseIndex, phraseResult) {
			var me = this;
			var correct = Scoring.isPhraseCorrect(phraseResult);

			me._answersCorrectness[phraseIndex] = correct;

			this.publishInteraction(Interaction.makeAsrInteraction(correct, phraseResult._id))
				.then(function () {
					completeItem.call(me, correct);
				});

			return correct;
		},
		publishSkipInteraction: function (phraseIndex) {
			var me = this;
			var questionId = me._json.content.phrases[phraseIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			return me.publishInteraction(interaction)
				.then(function () {
					completeItem.call(me, true);
				});
		},
		nextStep: function onNextStep() {
			var index = this.index(),
				me = this;

			me.publish(HUB_ASR_DISABLE);

			if (index > me.length() - 2) {
				return when.resolve();
			} else if (index === me.length() - 2) {
				return me.indexPromise(index + 1)
					.then(completeItem.bind(me, true))
					.then(comeToLast.bind(me, "comeFromClick"));
			} else {
				return me.indexPromise(index + 1)
					.then(function () {
						return me.publish(HUB_ASR_STOP_PLAYBACK);
					})
					.then(function () {
						return me.signal('render');
					});
			}
		},
		"hub/asr/ui/states/changed": function (state) {
			if (!state) return;
			var me = this,
				$el = me.$element,
				$skipButton = $el.find(SEL_BTN_SKIP),
				$recordContent = $el.find(SEL_LNC_RECORD_CONTENT);

			me._asrState = state;

			function layoutBack() {
				$el.find(SEL_LNC_RECORD_MSG_CONTAINER).addClass(CLS_AWAY);
				$skipButton.removeClass(CLS_DISABLED);
			}

			// asr status
			switch (state) {
				case ASRUIStatus.NORMAL:
					if (me._firstTimePlay === false) {
						$el.find(SEL_LNC_RECORD_TIP).removeClass(CLS_AWAY);
					}
					$skipButton.removeClass(CLS_DISABLED);
					break;
				case ASRUIStatus.RECORDING:
				case ASRUIStatus.PROCESSING:
					$skipButton.addClass(CLS_DISABLED);
					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					$recordContent.removeClass(CLS_NEW_CORRECT).removeClass(CLS_NEW_INCORRECT);
					break;
				case ASRUIStatus.PREPARING:
					me.items(me.index()).answered(false);
					$skipButton.addClass(CLS_DISABLED);

					if (me._firstTimeRecord) {
						me._firstTimeRecord = false;
					}

					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					$el.find(SEL_LNC_RECORD_MSG_CONTAINER).addClass(CLS_AWAY);

					$el.find(SEL_AUDIO).trigger('player/pause');

					$recordContent.removeClass(CLS_NEW_CORRECT).removeClass(CLS_NEW_INCORRECT);

					break;
				case ASRUIStatus.BROKEN:
					layoutBack();
					logActEvent.call(me, "broken");
					break;
				case ASRUIStatus.WARNING:
					layoutBack();
					logActEvent.call(me, "warning");
					break;
				case ASRUIStatus.HINT:
				case ASRUIStatus.ERROR:
				case ASRUIStatus.DOWN:
					layoutBack();
					break;
				case ASRUIStatus.DISABLE:
					$el.find(SEL_LNC_RECORD_TIP).addClass(CLS_AWAY);
					break;
				default:
					break;
			}
		},
		"hub/rating/sourceType": function () {
			return [ratingSourceType["ASR_SPEAKING"]];
		},
		"dom:.ets-ap/media/play": function () {
			var me = this,
				$el = me.$element;

			// stop playback when play audio
			me.publish(HUB_ASR_STOP_PLAYBACK);

			if (me._firstTimePlay) {
				$el.find(SEL_LNC_PLAY_TIP).addClass(CLS_AWAY);
				if (me._asrState === "NORMAL" && me._firstTimeRecord) {
					$el.find(SEL_LNC_RECORD_TIP).removeClass(CLS_AWAY);
				}
				me._firstTimePlay = false;
			}
		}
	};

	return Widget.extend(function ($element) {
		this._playMediaElement;
		this._recordMediaElement;
		this._firstTimePlay;
		this._firstTimeRecord;
		this._asrState;
		this.asrDisabled = false;
		this.feedbackVersion = $element.data("option").abtestVersion;
		this._answersCorrectness = [];
	}, extendOptions);
});

define('school-ui-activity/util/content-converter',[], function () {
	'use strict';

	function timeStrToSeconds(strTime) {
		/*
		 acceptable format:
		 hh:mm:ss.nnn
		 mm:ss.nnn
		 ss.nnn
		 */
		var times = strTime.split(/[:.]/);
		var MAX_PARTS = 4;
		for (var i = 0, missingParts = MAX_PARTS - times.length; i < missingParts; i++) {
			times.unshift(0);
		}

		var strHours = times[0];
		var strMinutes = times[1];
		var strSeconds = times[2];
		var strMilliSeconds = times[3];

		var MILLISECONDS_DIGITS = 3;
		strMilliSeconds = strMilliSeconds + '000';
		strMilliSeconds = strMilliSeconds.substr(0, MILLISECONDS_DIGITS);

		var SECONDS_PER_HOUR = 3600;
		var SECONDS_PER_MINUTE = 60;
		var MILLISECONDS_PER_SECOND = 1000;
		return parseInt(strHours, 10) * SECONDS_PER_HOUR +
			parseInt(strMinutes, 10) * SECONDS_PER_MINUTE +
			parseInt(strSeconds, 10) +
			parseInt(strMilliSeconds, 10) / MILLISECONDS_PER_SECOND;
	}

	return {
		timeStrToSeconds: timeStrToSeconds,

		scriptsToSubtitles: function (scripts) {
			return scripts.map(function (item) {
				return {
					text: item.txt,
					start: timeStrToSeconds(item.startTime),
					end: timeStrToSeconds(item.endTime)
				};
			});
		},

		questionsToEndTimes: function (questions) {
			return questions.map(function (item) {
				return timeStrToSeconds(item.timeline || item.endTime);
			});
		},

		questionsToTimeRanges: function (questions) {
			return questions.map(function (item) {
				return [
					timeStrToSeconds(item.startTime),
					timeStrToSeconds(item.endTime)
				];
			});
		}
	}
});

define('troopjs-requirejs/template!school-ui-activity/activity/language-presentation-new/language-presentation-new.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	
	var blurb = function(id,en){
	    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
	    return res;
	};
o += "\n\n<div class=\"ets-act-lpn\">\n\t<div class=\"ets-act-lpn-bd\">\n\t\t<div class=\"ets-act-lpn-view-wrap\">\n\t\t\t<div class=\"ets-act-lpn-view\" id=\"ets-act-lpn-view\">\n\t\t\t\t";
					if (data.content.title) {
				o += "\n\t\t\t\t<div class=\"ets-act-lpn-section\" data-section=\"1\">\n\t\t\t\t\t<div class=\"ets-bd\">\n\t\t\t\t\t\t<div class=\"ets-act-lpn-start\">\n\t\t\t\t\t\t\t<h2>" +data.content.title+ "</h2>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t";}o += "\n\n\t\t\t\t";
					if (data.content.grammarVideo && data.content.grammarVideo.videoUrl) {
						writeGrammarVideo(data.content.grammarVideo, 1);

						for (var i=0; i < data.content.presentations.length; i++ ) {
							var n = i+2;
							writeSection(data.content.presentations[i], n);
						}
					} else {
						for (var i=0; i < data.content.presentations.length; i++ ) {
							var n = i+1;
							writeSection(data.content.presentations[i], n);
						}
					}
				o += "\n\t\t\t\t\n\t\t\t</div>\n\t\t</div>\n\t\t\n\t\t<div class=\"ets-act-lpn-tabs\" id=\"ets-act-lpn-tabs\">\n\t\t\t<div class=\"ets-act-lpn-tabs-path\">\n\t\t\t\t<span></span>\n\t\t\t</div>\n\t\t\t";	var totalSections;
				if (data.content.grammarVideo && data.content.grammarVideo.videoUrl) {
					totalSections = data.content.presentations.length + 1;
				} else {
					totalSections = data.content.presentations.length;
				}
			 o += "\n\t\t\t<ul class=\"ets-total-" +totalSections+ "\">\n\t\t\t\t";
					for (var i=0; i < totalSections; i++ ) {
						var n = i + 1,
							alphabets = ["A", "B", "C", "D", "E", "F", "G"],
							txt = alphabets[i];
						o += "\n\t\t\t\t\t\t<li data-section=\"" +n+ "\">\n\t\t\t\t\t\t\t<span>\n\t\t\t\t\t\t\t<!--[if lte IE 7]>\n\t\t\t\t\t\t<div class=\"ets-act-iefix-wrap\">\n\t\t\t\t\t\t    <div class=\"ets-act-iefix-offset\">\n\t\t\t\t\t\t        <div class=\"ets-act-iefix-inner\">\n\t\t\t\t\t\t<![endif]-->\n\t\t\t\t\t\t\t" +txt+ "\n\t\t\t\t\t\t\t<!--[if lte IE 7]>\n\t\t\t\t\t\t        </div>\n\t\t\t\t\t\t    </div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<![endif]-->\n\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t</li>\n\t\t\t\t\t";}
				o += "\n\t\t\t</ul>\n\t\t</div>\n\t</div>\n</div>\n\n"; function writeGrammarVideo(section, n) { o += "\n\t<div class=\"ets-act-lpn-section\" data-section=\"" +n+ "\">\n\t\t<div class=\"ets-bd\">\n\t\t\t<div class=\"ets-act-lpn-grammar-video\">\n\t\t\t\t<div class=\"ets-act-vp-wrap\"><!--<div data-weave=\"school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)\"></div>--></div>\n\t\t\t\t";if (section.audioUrl && section.audioUrl.url) {o += "\n\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t       data-pause-other-players=\"false\"\n\t\t\t\t       src=\"" +section.audioUrl.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t       class=\"ets-ap ets-ap-nobar\"></audio>\n\t\t\t\t";}o += "\n\t\t\t</div>\n\t\t</div>\n\t</div>\n"; } o += "\n\n"; function writeSection(section, n) { o += "\n\t\t<div class=\"ets-act-lpn-section\" data-section=\"" +n+ "\">\n\t\t\t<div class=\"ets-bd\">\n\t\t\t\t<div class=\"ets-act-lpn-grammar\">\n\t\t\t\t\t" +section.text+ "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n"; }  return o; }; });
// # Task Module
define('school-ui-activity/activity/language-presentation-new/language-presentation-new',[
	'jquery',
	'jquery.ui',
	'poly',
	'troopjs-ef/component/widget',
	"jquery.easing",
	"jquery.scrollto",
	"jquery.viewport",
	'jquery.mousewheel',
	'markdownjs',
	"mediaelement-plugin-ef",
	"school-ui-activity/util/content-converter",
	'template!./language-presentation-new.html',
	"school-ui-shared/utils/browser-check",
	'mediaelement-and-player'
], function ($,
             ui$,
             poly,
             Widget,
             easing,
             scrollto,
             viewport,
             mousewheel,
             md,
             mejsPlugin,
             converter,
             tTemplate,
			 browserCheck,
			 mejs) {
	"use strict";

	// Constants
	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_GRAMMAR_VIDEO_AP = ".ets-act-lpn-grammar-video .ets-ap";
	var SEL_VIEW = "#ets-act-lpn-view";
	var SEL_SECTION = ".ets-act-lpn-section";
	var SEL_TAB = "#ets-act-lpn-tabs > ul > li";
	var SEL_AUDIO = ".ets-ap";
	var SEL_LP_GRAMMAR = ".ets-act-lpn-grammar";
	var SEL_VIDEO_CONTAINER = ".ets-act-vp-wrap";

	var CLS_CURRENT = "ets-current";
	var CLS_ACTIVE = "ets-active";
	var CLS_PLAYING = "ets-playing";
	var CLS_ARABIC_FIX = "ets-ui-arabic-fix";

	var PROP_CULTURE_CODE = "cultureCode";

	function arabicFix(data) {
		data.content.presentations.forEach(function (v) {
			var $html = $("<div>" + v.text + "</div>");
			$html.find("p,td,strong").each(function () {
				var $this = $(this);
				var fixText = $this.text();
				Array.prototype.every.call(fixText, function (char) {
					if (char.charCodeAt(0) > 160) {
						$this.addClass(CLS_ARABIC_FIX);
						return false;
					}
					return true;
				});
			});
			v.text = $html.html();
		});
	}

	// # Render
	function render() {
		var me = this;

		if (!me._json || !me[PROP_CULTURE_CODE]) return;

		var data = me._json;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		filterData.call(me, data);

		if (/^ar/.test(me[PROP_CULTURE_CODE])) {
			arabicFix(data);
		}

		return me
			.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	function filterData(data) {
		for (var i = 0; i < data.content.presentations.length; i++) {
			data.content.presentations[i].text = data.content.presentations[i].text.replace(/(^\s*)|(\s*$)/g, "");

			//Parse markdown to html
			data.content.presentations[i].text = md.toHTML(data.content.presentations[i].text);
		}
	}

	/**
	 * On activity rendered:
	 * 1. Enable droppable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this;
		if (me._json.content.grammarVideo && me._json.content.grammarVideo.videoUrl) {
			initGrammerVideo.call(me);
		}

		initScroll.call(me);
		initMedia.call(me);
	}

	function scriptsToSubtitles(scripts) {
		// language-presentation-new scripts have a different format than other activities scripts
		return scripts.map(function (item) {
			return {
				html: md.toHTML(item.text),
				start: converter.timeStrToSeconds(item.StartTime),
				end: converter.timeStrToSeconds(item.EndTime)
			};
		});
	}

	function initGrammerVideo() {
		var me = this,
			$el = this.$element;

		var videoInfo = {
			video: me._json.content.grammarVideo.videoUrl
		};

		var options = {
			features: ['Subtitles', 'SwitchQuality'],
			subtitles: scriptsToSubtitles(me._json.content.grammarVideo.scripts),
			showToggleSubtitlesButton: false,
			pauseOtherPlayers:browserCheck.device!=='tablet'
		};

		var $video = $el.find(SEL_VIDEO_CONTAINER);

		$video.data({
			'videoInfo': videoInfo,
			'options': options,
			'successCallback': onVideoPlayerReady.bind(me)
		})
			.attr('data-weave', 'school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)')
			.weave();
	}

	function onVideoPlayerReady(videoMediaElement, domObject, player) {
		var me = this;
		var $el = me.$element;
		var isTablet = browserCheck.device === 'tablet';
		var $videoParent = $(domObject).parents(".ets-vp");

		me.grammarVideoMediaElement = videoMediaElement;

		player.enableSubtitles();

		// try to fix tablet can not play audio issue , check detail for SPC-7914
		if(isTablet){
			$el.find('.mejs-overlay-button, .ets-act-lpn-grammar-video .mejs-play').on('click', function(){
				var audioElement = $el.find('.ets-act-lpn-grammar-video audio')[0];
				if(!audioElement)return;
				if(audioElement.paused){
					audioElement.play();
				}else{
					audioElement.pause();
				}
			});
		}

		videoMediaElement.addEventListener('pause', function () {
			$videoParent.removeClass(CLS_PLAYING);
		});

		videoMediaElement.addEventListener('play', function () {
			$videoParent.addClass(CLS_PLAYING);
		});

		if (me._json.content.grammarVideo.audioUrl) {
			videoMediaElement.addEventListener('pause', function () {
				$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/pause');
			});

			videoMediaElement.addEventListener('playing', function () {
				// try to fix tablet can not play audio issue , check detail for SPC-7914
				if(isTablet){
					var audioElement = $el.find('.ets-act-lpn-grammar-video audio')[0];
					Object.keys(mejs.players).forEach(function(key){
						var mediaElement =   mejs.players[key].media;
						if(mediaElement !== videoMediaElement && mediaElement !== audioElement
						&& !mediaElement.paused && !mediaElement.ended ){
							mediaElement.pause();
						}
					});
				}else{
					$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/play');
				}
			});

			videoMediaElement.addEventListener('ended', function () {
				$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/end');
			});

			videoMediaElement.addEventListener('seeked', function () {
				var currentTime = videoMediaElement.currentTime;
				$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/seek', currentTime);
			});

			videoMediaElement.addEventListener('volumechange', function () {
				var volume = videoMediaElement.volume;
				var muted = videoMediaElement.muted;
				$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/volume', {
					volume: volume,
					muted: muted
				});
			});

			var initVolume = videoMediaElement.volume;
			var initMuted = videoMediaElement.muted;
			$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/volume', {
				volume: initVolume,
				muted: initMuted
			});
		}
	}


	function initMedia() {
		var $el = this.$element;

		$el.find(SEL_LP_GRAMMAR).each(function (i, item) {
			var $item = $(item);
			var str = convertLegacyAudioTag($item.html());
			str = replaceURLWithAudioTag(str);
			str = replaceURLWithImageTag(str);
			$item.html(str);

			//Weave audio widget
			$item.find("[data-weave]").weave();
		});
	}

	function replaceURLWithAudioTag(text) {
		var expAudio = /((?:https?:)?\/\/.*?.(?:mp3|ogg|webm))/ig;
		text = text.replace(expAudio, [
			'<div class="ets-act-ap-wrap"><div data-at-id="btn-audio-start" class="ets-act-ap ets-ap-smaller">',
			'<audio data-weave="school-ui-shared/widget/audio-player/main" preload="none" data-src="$1" type="audio/mpeg" class="ets-ap ets-ap-smaller ets-ap-nobar"></audio>',
			'</div></div>'
		].join(''));
		return text;
	}

	function replaceURLWithImageTag(text) {
		var expImage = /((?:https?:)?\/\/.*?.(?:jpg|png|gif|jpeg|bmp))/ig;
		text = text.replace(expImage, "<img src='$1' />");
		return text;
	}

	function convertLegacyAudioTag(html) {
		var $temp = $("<div></div>");
		$temp.html(html);
		var audioPlaceholder = $temp.find(".flashplaceholder");
		audioPlaceholder.each(function () {
			$(this).removeAttr("name width height class id");
			$(this).text().trim();
		});

		return $temp.html();
	}

	function scrollToSection(activity) {
		var me = activity,
			$el = me.$element;
		if ($(this).hasClass(CLS_ACTIVE)) {
			return;
		}

		var index = $(this).index();

		me._super.index(index);

		if (index >= $(this).siblings().length) {
			me._super.completed(true);
		} else {
			me._super.completed(false);
		}
		$(this).addClass(CLS_ACTIVE).siblings(SEL_TAB).removeClass(CLS_ACTIVE);
		var currentSection = $(this).data("section");
		var $targetSection = $(SEL_SECTION).filter(function () {
			return $(this).data("section") == currentSection
		});
		$(SEL_VIEW).stop().scrollTo($targetSection, 300);

		if (me.grammarVideoMediaElement && me.grammarVideoMediaElement.played) {
			setTimeout(function () {
				me.grammarVideoMediaElement.pause();
			}, 100);
		}

		$el.find(SEL_AUDIO).trigger('player/pause');
	}

	function initScroll() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_TAB).click(function () {
			scrollToSection.call(this, me);
		});

		//scroll to first tab
		scrollToSection.call($($el.find(SEL_TAB).get(0)), me);

		$el.find(SEL_VIEW).viewport({
			targets: SEL_SECTION,
			onViewChange: function (elements/*, detail*/) {
				$.each(elements, function (i, element) {
					var currentSection = $(element).data('section');
					var $targetTab = $el.find(SEL_TAB).filter(function () {
						return $(this).data("section") == currentSection
					});

					$el.find(SEL_TAB).removeClass(CLS_ACTIVE);
					$targetTab.addClass(CLS_ACTIVE);

					$el.find(SEL_VIEW).removeClass(CLS_CURRENT);
					$(element).addClass(CLS_CURRENT);
				});
			}
		});

	}

	var methods = {
		"hub/activity/template/lpn/load": function (parent, options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;

			me._super = parent;

			// set instant feedback off
			me._item.instantFeedback(false);

			return render.call(me);
		},
		"hub/activity/template/lpn/next": function (index) {
			scrollToSection.call($(this.$element.find(SEL_TAB).get(index)), this);
		},
		"hub:memory/context": function (context) {
			var me = this;
			context && context[PROP_CULTURE_CODE] && (me[PROP_CULTURE_CODE] = context[PROP_CULTURE_CODE]);
			render.call(me);
		}
	};

	return Widget.extend(methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/language-presentation-new/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-lpn-wrap\" data-weave=\"school-ui-activity/activity/language-presentation-new/language-presentation-new\"></div>"; return o; }; });
define('school-ui-activity/activity/language-presentation-new/main',[
	'jquery',
	'underscore',
	'when',
	'../base/main',
	'./language-presentation-new',
	'template!./main.html'
], function activityTemplateModule($, _, when, Widget, lpn, tTemplate) {
	"use strict";

	var TOPIC_ACT_LPN_LOAD = "activity/template/lpn/load";
	var TOPIC_ACT_LPN_NEXT = 'activity/template/lpn/next';

	function Ctor() {
		filterData.call(this);
	}

	function filterData() {
		var totalSections,
			me = this,
			data = me._json;
		if (data.content.grammarVideo && data.content.grammarVideo.videoUrl) {
			totalSections = data.content.presentations.length + 1;
		} else {
			totalSections = data.content.presentations.length;
		}
		me.length(totalSections);
	}

	function render() {
		var me = this;
		var data = this._json;

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate());
		}

		return this._htmlPromise
			.then(function () {
				return me.publish(TOPIC_ACT_LPN_LOAD, me, {
					item: me.items(),
					json: data
				});
			});
	}

	var methods = {
		"sig/render": function onRender() {
			return render.call(this);
		},

		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},

		nextStep: function onNextStep() {
			return this.publish(TOPIC_ACT_LPN_NEXT, this.index() + 1);
		},

		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/language-presentation/language-presentation.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-lan-pre\">\n    <div class=\"ets-act-lan-title\" data-weave='troopjs-ef/blurb/widget' data-blurb-id='450030' data-text-en='Language Focus'></div>\n    <div class=\"ets-act-lnp-view\" id=\"ets-act-lnp-view\">\n        <div class=\"ets-act-lnp-scroll\">\n            <div class=\"ets-act-lnp-section ets-section-grammer\" data-section=\"1\">\n                <!--[if lt IE 8]><div class=\"ets-bd\"><![endif]-->\n                <!--[if IE 8]><div class=\"ets-bd ets-ie8-fix\"><![endif]-->\n                <!--[if gt IE 8]><div class=\"ets-bd\"><![endif]-->\n                <!--[if !IE]><!-->\n                <div class=\"ets-bd\">\n                <!--<![endif]-->\n                </div>\n            </div>\n        </div>\n    </div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity/activity/language-presentation/content-audio.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap ets-ap-smaller\">\n\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t       data-src=\"" +data.audioUrl+ "\" type=\"audio/mpeg\"\n\t       class=\"ets-ap ets-ap-smaller ets-ap-nobar\"></audio>\n</div></div>"; return o; }; });
define('school-ui-activity/util/activity-util',[
	'jquery',
	"school-ui-shared/utils/browser-check"
], function ($, browserCheck) {
	var Util = {};
	/**
	 * remove video player
	 */
	Util.clearVideo = function (player) {
		Util.clearMedia(player);
	};
	/**
	 * remove audio player
	 */
	Util.clearAudio = function (player) {
		Util.clearMedia(player);
	};
	/**
	 * Safe way to remove mediaelement player
	 */
	Util.clearMedia = function (player) {
		if (parseInt(browserCheck.version, 10) <= 8 && player && player.container) {
			var id = player.container.find('object').attr('id');
			$('<div></div>', {
				id: id,
				style: 'display: none;'
			}).appendTo('body');
			//This div will receive and ignore flash messages in IE8, see SPC-5835 and SPC-5868
		}

		try {
			player.dispose();
		} catch (ex) {
		}
	};
	Util.blink = function ($target) {
		this.fn._blink = this.fn._blink || function () {
				return this.fadeOut({duration: 400, queue: true})
					.fadeIn({duration: 400, queue: true});
			};
		return $target._blink()._blink()._blink()._blink();
	};
	return Util;
});
define('school-ui-activity/activity/language-presentation/main',[
	'jquery',
	'school-ui-activity/activity/base/main',
	'template!./language-presentation.html',
	'template!./content-audio.html',
	'jquery.ui',
	'school-ui-activity/util/activity-util',
	'jquery.jscrollpane',
	'jquery.mousewheel'
], function languagePresentationModule($, Widget, tTemplate, aTemplate, ui, Util) {
	"use strict";

	/**
	 language presentation
	 */

	var SEL_SOURCE_AUDIO = "span.flashplaceholder",
		SEL_ETS_ACT_LNP_SCROLL = ".ets-act-lnp-scroll",
		SEL_ETS_BD = ".ets-bd";

	var _timeoutToChangeScrollbarAlphaFirst,
		_timeoutToChangeScrollbarAlphaSecond;

	function initMediaPlayer() {
		var me = this;
		var previousAudioUrl;

		//Remove extra space before audio button
		me.$element.find(SEL_SOURCE_AUDIO).each(function () {
			var str = $(this).parent().html().replace("&nbsp;<span", "<span");
			$(this).parent().html(str);
		});

		me.$element.find(SEL_SOURCE_AUDIO).each(function () {
			var audioStr = $(this).attr("name");
			if (previousAudioUrl == audioStr) {
				return false;
			}
			previousAudioUrl = audioStr;
			var audioUrl = audioStr.split(/[=|&]/)[1];
			var audioHtml = $.trim(aTemplate({"audioUrl": audioUrl}));
			$(this).replaceWith($(audioHtml));
		});
		return me.$element.find("[data-weave]").weave();
	}

	function initScrollPanelEvent($pane) {
		return $pane.bind('jsp-initialised', function () {
			var $dragbar = $pane.find('.jspDrag'),
				eventScroll = 'jsp-scroll-y';
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
		});
	}

	function customScrollBar() {
		var me = this,
			$pane = me.$element.find(SEL_ETS_ACT_LNP_SCROLL);
		initScrollPanelEvent($pane).jScrollPane({
			contentWidth: "0"
		});
	}

	function render() {
		var me = this;
		var data = {
			content: me._json.content.txt
		};

		return me.html(tTemplate, data)
			.then(function () {
				me.$element.find(SEL_ETS_BD).html(data.content);
				return initMediaPlayer.call(me);
			})
			.then(function () {
				customScrollBar.call(me);
			});
	}

	var extendOptions = {
		'sig/finalize': function onFinalize() {
			window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
		},
		"sig/render": function onRender() {
			this.items().completed(true);
			return render.call(this);
		}
	};
	return Widget.extend(function () {

	}, extendOptions);
});

define('troopjs-requirejs/template!school-ui-activity/activity/matching-pic-audio/main.html',[],function() { return function template(data) { var o = "";
    var audios = data.audios;
    var pics = data.pics;
o += "\n\n<div class=\"ets-act-mpa\">\n\n    <div class=\"ets-targets\">\n        <ul class=\"ets-cf\">\n            "; for (var i = 0, len = audios.length; i < len; i++) { o += "\n            <li "; if(i === len - 1){ o += "class=\"last\""; } o += ">\n                <div class=\"ets-mb-top ets-mb-top-small\" data-at-id=\"" + audios[i]._id + "\" data-audio-id=\"" + audios[i]._id + "\">\n                    <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n                        <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                               data-src=\"" +audios[i].audio.url+ "\" type=\"audio/mpeg\"\n                               class=\"ets-ap\"></audio>\n                    </div></div>\n                </div>\n                <div class=\"ets-placeholder\"></div>\n            </li>\n            "; } o += "\n        </ul>\n    </div>\n\n    <div class=\"ets-options\">\n        <ul class=\"ets-cf\">\n            "; for (var i = 0, len = pics.length; i < len; i++) { o += "\n            <li "; if(i === len - 1){ o += "class=\"last\""; } o += ">\n                <div class=\"ets-mb-bottom ets-mb-bottom-large\" data-at-id=\"" + pics[i]._id + "\" data-pic-id=\"" + pics[i]._id + "\" data-index=\"" + i + "\">\n                    <i class=\"ets-indicator\"></i>\n                    <img src=\"" + pics[i].image.url + "\" alt=\"\" width=\"127\" height=\"97\">\n                    <div class=\"ets-img-shadow\"></div>\n                </div>\n            </li>\n            "; } o += "\n        </ul>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/matching-pic-audio/main',[
	'jquery',
	'when',
	'school-ui-activity/activity/base/main',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./main.html",
	'jquery.ui',
	'jquery.ui.touch-punch',
	'jquery.transit'
], function mpaMain($, when, Widget, Scoring, Interaction, tTemplate) {
	"use strict";

	// declaire variables

	var $ROOT;
	var $ORIGIN_UL;

	var SEL_MPA = ".ets-act-mpa",
		SEL_OPTION = '.ets-options',
		SEL_OPTION_UL = '.ets-options ul',
		SEL_MB_TOP = '.ets-mb-top',
		SEL_MB_BOTTOM = '.ets-mb-bottom',
		SEL_PLACEHOLDER = '.ets-placeholder',
		SEL_DROPPABLE_AREA = '.ets-targets li';

	var CLS_INCORRECT = 'ets-incorrect',
		CLS_CORRECT = 'ets-correct',
		CLS_HOVER = 'ets-hover',
		CLS_DROPPED = 'ets-mb-dropped',
		CLS_MOVING = 'ets-moving';

	var draggableSetting = {
		containment: SEL_MPA,
		scroll: false,
		revert: 'invalid',
		start: function (/*event, ui*/) {
			var $me = $(this);
			$me.addClass(CLS_MOVING);
			if ($me.hasClass(CLS_DROPPED)) {
				return false;
			}

			$me.closest('li').siblings()
				.css({
					'z-index': 0,
					'position': 'relative'
				});
			$me.css('z-index', 1);
		},
		stop: function (/*event, ui*/) {
			var $me = $(this);
			$me.removeClass(CLS_MOVING);

			$me.closest('li').siblings()
				.css({
					'z-index': '',
					'position': 'static'
				});
			$me.css('z-index', '');
		}
	};

	/**
	 * Move picture back to origin position
	 * @api private
	 */
	function backToOriginPosition($answer) {
		var index = $answer.attr('data-index');
		var $li = $ORIGIN_UL.find('li').eq(index);
		var originPos = $li.position();
		var currentPos = $answer.position();

		return when.promise(function (resolve) {
			$answer
				.css('z-index', 1)
				.removeClass(CLS_DROPPED)
				.addClass(CLS_MOVING)
				.animate({
					left: originPos.left - currentPos.left,
					top: originPos.top - currentPos.top
				}, function () {
					$answer.removeClass(CLS_MOVING).next().show();
					$li.html($answer.css({
						left: 'auto',
						top: 'auto',
						'z-index': 'auto'
					}));
					$li.find(SEL_MB_BOTTOM).draggable(draggableSetting);
					resolve();
				});
		});
	}

	/**
	 * Filter Distractors
	 **/
	function filterDist(data) {
		var me = this;

		var dists = data.scoring.pics;

		if (!dists) {
			return data;
		}
		data.dists = [];

		_.each(dists, function (dist) {
			data.dists.push(_.find(data.content.pics, function (pic) {
				return dist._id == pic._id;
			}));

			data.content.pics = _.reject(data.content.pics, function (pic) {
				return dist._id == pic._id;
			});
		});

		delete me._json.scoring.pics;

		return data;
	}


	/**
	 * Filter source data
	 * # Shuffle template data items
	 * @api private
	 */
	function filterData(data) {
		var me = this;
		if (!data.pics) {
			return;
		}

		// Shuffle pics items and add distraction
		if (data.dists) {
			var distNo = me._json.filterOptions.distNo;
			for (var i = 0, length = 5 - data.pics.length; i < length; i++) {
				if (i >= distNo) {
					break;
				}
				if (data.dists[i]) {
					data.pics.push(data.dists[i]);
				}
			}
		}

		data.pics = _.shuffle(data.pics);

		return data;
	}

	/**
	 * Paging data
	 * @api private
	 */
	function pagination(data) {
		var me = this;
		var maxPairs = Math.min(data.filterOptions.questionNo, data.content.audios.length);
		var contentLength;
		var audios;
		var maxPage = Math.ceil(maxPairs / 5);
		var pairs;

		var temp,
			tempPics,
			tempAuds,
			newAuds = [];

		contentLength = data.scoring.audios.length;
		audios = data.scoring.audios;

		if (contentLength > maxPairs) {
			// Filter pairs
			pairs = _.shuffle(audios).slice(0, maxPairs);
		} else {
			pairs = _.shuffle(audios);
		}

		me.length(maxPage);

		var perPage = Math.ceil(maxPairs / maxPage);

		for (var pageIndex = 0; pageIndex < maxPage; ++pageIndex) {
			temp = {};
			tempAuds = temp.audios = [];
			tempPics = temp.pics = [];

			var pairIndex = pageIndex * perPage, pairIndexEnd = (pageIndex + 1) * perPage;
			for (; pairIndex < pairIndexEnd; pairIndex++) {
				var pair = pairs[pairIndex];
				if (pair) {
					tempAuds.push(_.find(data.content.audios, function (audio) {
						return pair._id == audio._id;
					}));
					tempPics.push(_.find(data.content.pics, function (pic) {
						return pair.pic._id == pic._id;
					}));
				} else {
					break;
				}
			}

			temp.references = data.references;
			temp.dists = data.dists;
			newAuds = newAuds.concat(tempAuds);

			me._templateData.push(filterData.call(me, temp));
		}
		me._json.content.audios = newAuds;
	}

	/**
	 * Shuffle items when sequence change
	 * # Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		// Render widget
		return me.html(tTemplate, me._templateData[me.index()])
			.then(function () {
				onRendered.call(me);

				$ROOT = $(SEL_MPA);
				$ORIGIN_UL = $ROOT.find(SEL_OPTION_UL);
				$ROOT.find(SEL_OPTION + ' ' + SEL_MB_BOTTOM).draggable(draggableSetting);
				$ROOT.find(SEL_DROPPABLE_AREA).droppable(me.droppableSetting);

				//for automation testing
				return me.attachATAssetDom(me._templateData[me.index()]);
			});
	}

	/**
	 * On activity rendered:
	 * # Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this;
		me._currentPairs += me._templateData[me.index()].audios.length;
	}

	return Widget.extend(function () {
		var me = this;
		me._templateData = [];
		me._currentPairs = 0;
		me._correctAnswers = 0;

		me.droppableSetting = {
			drop: function (event, ui) {
				var $me = $(this);
				var $pic = ui.draggable;
				var $audio = $me.find(SEL_MB_TOP);
				var $placeholder = $me.find(SEL_PLACEHOLDER);
				var placholderPosition = $placeholder.position();
				var answerPositon = $pic.position();

				// place the target back to its position
				$audio.animate({
					top: 0
				}, 'fast');


				//insert dragging item before placeholder
				$pic.animate({
					left: parseInt($pic.css('left')) + (placholderPosition.left - answerPositon.left),
					top: parseInt($pic.css('top')) + (placholderPosition.top - answerPositon.top)
				}, 'fast', function () {
					$placeholder.before($pic.addClass(CLS_DROPPED).css({
						left: 'auto',
						top: 'auto'
					})).hide();

					$pic.draggable("destroy");
					$me.droppable('disable');

					var audioId = $audio.attr('data-audio-id');
					var picId = $pic.attr('data-pic-id');

					var correct = me.checkAnswer(audioId, picId);

					me.displayInteractionResult(correct, audioId, picId);
				});
			},
			over: function (/*event, ui*/) {
				var $me = $(this);
				var $top = $me.find(SEL_MB_TOP);
				$me.prev().addClass(CLS_HOVER);
				if ($top.is(":animated")) {
					return;
				}
				$top.animate({
					top: 10
				}, 'fast');
			},
			out: function (/*event, ui*/) {
				var $me = $(this);
				var $top = $me.find(SEL_MB_TOP);
				$top.removeClass(CLS_HOVER);
				$top.animate({
					top: 0
				}, 'fast');
			}
		};
	}, {
		"sig/initialize": function onStart() {
			var me = this;

			pagination.call(me, filterDist.call(me, $.extend(true, {}, me._json)));

			me.items().instantFeedback(true);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		checkAnswer: function (audioId, picId) {
			var me = this;
			var json = me._json;
			var pic = Scoring.findById(json.content.pics, picId);
			var solution = Scoring.findById(json.scoring.audios, audioId);
			var correct = pic && solution && (solution.pic._id === pic._id);

			if (correct) {
				me._correctAnswers += 1;
			}

			var promise = me.publishInteraction(Interaction.makeMatchingInteraction(correct, audioId, picId));

			if (me._correctAnswers === me._currentPairs) {
				me._json.content._isCorrect = true;
				promise.then(function () {
					var item = me.items();
					item.answered(true);
					item.completed(true);
				});
			}

			return correct;
		},
		displayInteractionResult: function (correct, audioId, picId) {
			var $audio = $('[data-audio-id="' + audioId + '"]');
			var $pic = $('[data-pic-id="' + picId + '"]');
			var $li = $audio.closest('li');
			if (correct) {
				$li.addClass(CLS_CORRECT);
			} else {
				$li.addClass(CLS_INCORRECT);

				setTimeout(function () {
					$audio.css('z-index', 'auto');
					$li.removeClass(CLS_INCORRECT);

					backToOriginPosition($pic)
						.then(function () {
							$li.droppable('enable');
						});
				}, 1000);
			}
		},
		nextStep: function () {
			var me = this;
			me.index(me.index() + 1);
			me.items().instantFeedback(true);
			return render.call(me);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/activity/matching-text-long-text/main.html',[],function() { return function template(data) { var o = "";
var targets = data.targets;
var sources = data.sources;
o += "\n<div class=\"ets-act-mtl ets-cf\">\n    "; if (data.references.aud) { o += "\n    <div class=\"ets-references\">\n        <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                   data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n                   class=\"ets-ap ets-ap-bottom-right\"></audio>\n        </div></div>\n    </div>\n    "; } o += "\n\n    <div class=\"ets-targets\">\n        <ul>\n            "; for (var i = 0, len = targets.length; i < len; i++) { o += "\n            <li class=\"ets-droppable-line\">\n                <ul class=\"ets-cf\">\n                    <li class=\"ets-first\">\n                        <span class=\"ets-mtl-left\" data-at-id=\"" + targets[i]._id + "\" data-target-id=\"" + targets[i]._id + "\">\n                            <span>\n                                <div>\n                                    <div>" + targets[i].txt + "</div>\n                                </div>\n                            </span>\n                        </span>\n                    </li>\n                    <li class=\"ets-last\"></li>\n                </ul>\n            </li>\n            "; } o += "\n        </ul>\n    </div>\n\n    <div class=\"ets-options\">\n        <ul>\n            "; for (var i = 0, len = sources.length; i < len; i++) { o += "\n            <li>\n                <span class=\"ets-mtl-right\" data-at-id=\"" + sources[i]._id + "\" data-source-id=\"" + sources[i]._id + "\" data-index=\"" + i + "\">\n                    <i class=\"ets-indicator\"></i>\n                    <span>\n                        <div>\n                            <div>" + sources[i].txt + "</div>\n                        </div>\n                    </span>\n                    <i class=\"ets-bottom-shadow\"></i>\n                </span>\n            </li>\n            "; } o += "\n        </ul>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/matching-text-long-text/main',[
	'jquery',
	"when",
	'school-ui-activity/activity/base/main',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"school-ui-shared/utils/browser-check",
	"template!./main.html",
	'underscore',
	'jquery.ui',
	'jquery.ui.touch-punch'
], function MatchingTextText($, when, Widget, Scoring, Interaction, browserCheck, template, _) {
	'use strict';

	var PAGINATE = 6;

	var SEL_MTL = '.ets-act-mtl';
	var SEL_TARGET = '.ets-targets';
	var SEL_OPTION = '.ets-options';
	var SEL_OPTION_UL = '.ets-options ul';
	var SEL_DROPPABLE = '.ets-droppable-line ul';
	var SEL_MTL_RIGHT = '.ets-mtl-right';
	var SEL_MTL_LEFT = '.ets-mtl-left';
	var SEL_FIRST = '.ets-first';
	var SEL_LAST = '.ets-last';
	var SEL_REF = '.ets-references';

	var CLS_MOVING = 'ets-moving';
	var CLS_DROPPED = 'ets-dropped';
	var CLS_CORRECT = 'ets-correct';
	var CLS_INCORRECT = 'ets-incorrect';

	var draggableOptions = {
		revert: 'invalid',
		containment: SEL_MTL,
		scroll: false
	};


	/**
	 * Move picture back to origin position
	 * @api private
	 */
	function backToOriginPosition($source) {
		var me = this;
		var index = $source.attr('data-index');
		var $optionLi = me.$element.find(SEL_OPTION_UL).find('li').eq(index);
		var optionPos = $optionLi.offset();
		var $currentLi = $source.parent();
		var currentPos = $currentLi.offset();

		return when.promise(function (resolve) {
			$source.addClass('ets-moving').animate({
				left: optionPos.left - currentPos.left,
				top: optionPos.top - currentPos.top
			}, function () {
				$optionLi.append($source.removeAttr('style').removeClass(CLS_MOVING + ' ' + CLS_DROPPED));
				$optionLi.find(SEL_MTL_RIGHT).draggable(draggableOptions);
				resolve();
			});
		});
	}

	/**
	 * Filter Distractors
	 **/
	function filterDist(data) {
		var me = this;

		var dists = data.scoring.sources;

		if (!dists) {
			return data;
		}
		data.dists = [];

		_.each(dists, function (dist) {
			data.dists.push(_.find(data.content.sources, function (source) {
				return dist._id == source._id;
			}));

			data.content.sources = _.reject(data.content.sources, function (source) {
				return dist._id == source._id;
			});
		});

		delete me._json.scoring.sources;

		return data;
	}

	/**
	 * Filter source data
	 * # Shuffle template data items
	 * @api private
	 */
	function filterData(data) {
		var me = this;
		if (!data.sources) {
			return;
		}

		// Shuffle pics items and add distraction
		if (data.dists) {
			var distNo = me._json.filterOptions.distNo;
			for (var i = 0, length = 5 - data.sources.length; i < length; i++) {
				if (i >= distNo) {
					break;
				}
				if (data.dists[i]) {
					data.sources.push(data.dists[i]);
				}
			}
		}

		data.sources = _.shuffle(data.sources);

		return data;
	}

	/**
	 * Paginate data
	 * @api private
	 */
	function pagination(data) {
		var me = this;
		var maxPairs = Math.min(data.filterOptions.questionNo, data.content.targets.length);
		var contentLength = data.scoring.targets.length;
		var maxPage = Math.ceil(maxPairs / PAGINATE);
		var pairs;

		var temp,
			tempTargets,
			tempSources,
			newSources = [];

		if (contentLength >= maxPairs) {
			// Filter pairs
			pairs = _.shuffle(data.scoring.targets).slice(0, maxPairs);

			// update scoring.targets so that scoring can calculate correctly
			me._json.scoring.targets = pairs;
		} else {
			pairs = _.shuffle(data.scoring.targets);
		}

		me.length(maxPage);

		var perPage = Math.ceil(maxPairs / maxPage);

		for (var pageIndex = 0; pageIndex < maxPage; ++pageIndex) {
			temp = {};
			tempTargets = temp.targets = [];
			tempSources = temp.sources = [];

			var pairIndex = pageIndex * perPage, pairIndexEnd = (pageIndex + 1) * perPage;
			for (; pairIndex < pairIndexEnd; pairIndex++) {
				var pair = pairs[pairIndex];
				if (pair) {
					tempTargets.push(_.find(data.content.targets, function (target) {
						return pair._id == target._id;
					}));
					tempSources.push(_.find(data.content.sources, function (source) {
						return pair.source.txt == source.txt;
					}));
				} else {
					break;
				}
			}

			temp.dists = data.dists;
			temp.references = data.references;
			newSources = newSources.concat(tempSources);

			me._templateData.push(filterData.call(me, temp));
		}
		me._json.content.sources = newSources;
	}

	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		return me.html(template, me._templateData[me.index()])
			.then(function () {
				onRendered.call(me);
				return me.attachATAssetDom(me._templateData[me.index()]);
			});
	}

	function onRendered() {
		var me = this;
		me._currentPairs += me._templateData[me.index()].targets.length;

		me.$element.find(SEL_OPTION + ' ' + SEL_MTL_RIGHT).css('position', 'relative').draggable(draggableOptions);
		me.$element.find(SEL_OPTION).on('mousedown mouseup', SEL_MTL_RIGHT, function (e) {
			var $me = $(this);
			if (e.type === 'mousedown') {
				$me.addClass(CLS_MOVING);
			} else {
				$me.removeClass(CLS_MOVING);
			}
		});

		me.$element.find(SEL_DROPPABLE).droppable(me._droppableOptions);

		// prevent user select
		if (browserCheck.browser === "msie") {
			me.$element.find(SEL_TARGET).add(SEL_OPTION).on('selectstart', function () {
				return false;
			});
		}

		// let audio player vertical align to center
		if (me._json.references.aud) {
			me.$element.find(SEL_REF).css({
				'padding-top': (me.$element.find(SEL_MTL).height() - 75) / 2
			});
		}
	}

	return Widget.extend(function () {
		var me = this;
		me._templateData = [];
		me._currentPairs = 0;
		me._correctAnswers = 0;

		me._droppableOptions = {
			hoverClass: "ets-drop-hover",
			drop: function (event, ui) {
				var $me = $(this).animate({
					left: 0
				}, 'fast', function () {
					$me.css('position', 'static');
				});
				var $source = ui.draggable;
				var $target = $me.find(SEL_FIRST + ' ' + SEL_MTL_LEFT);
				var $li = $me.find(SEL_LAST);

				var targetPos = $li.offset();
				var originPos = ui.offset;

				$source.addClass('ets-moving').animate({
					left: parseInt($source.css('left')) + (targetPos.left - originPos.left),
					top: parseInt($source.css('top')) + (targetPos.top - originPos.top)
				}, 'fast', function () {
					$source.removeClass(CLS_MOVING).addClass(CLS_DROPPED);
					$li.html($source.removeAttr('style'));

					$me.droppable('disable');

					$source.draggable('destroy');

					var sourceId = $source.attr('data-source-id');
					var targetId = $target.attr('data-target-id');

					var correct = me.checkAnswer(sourceId, targetId);

					me.displayInteractionResult(correct, $source, $target);
				});
			},
			over: function (/*event, ui*/) {
				var $me = $(this);

				if ($me.is(":animated")) {
					return;
				}

				$me.css({position: 'relative'}).animate({
					left: 10
				}, 'fast');
			},
			out: function (/*event, ui*/) {
				var $me = $(this);

				$me.animate({
					left: 0
				}, 'fast', function () {
					$me.css('position', 'static');
				});
			}
		};
	}, {
		'sig/initialize': function () {
			var me = this;

			pagination.call(me, filterDist.call(me, me._json));
		},
		'sig/render': function () {
			this.items().instantFeedback(true);

			return render.call(this);
		},
		checkAnswer: function (sourceId, targetId) {
			var me = this;
			var json = me._json;
			var source = Scoring.findById(json.content.sources, sourceId);
			var solution = Scoring.findById(json.scoring.targets, targetId);
			var correct = source && solution && (solution.source.txt === source.txt);

			if (correct) {
				me._correctAnswers += 1;
			}

			var promise = me.publishInteraction(Interaction.makeMatchingInteraction(correct, targetId, sourceId));

			if (me._correctAnswers === me._currentPairs) {
				me._json.content._isCorrect = true;
				promise.then(function () {
					var item = me.items();
					item.answered(true);
					item.completed(true);
				});
			}

			return correct;
		},
		displayInteractionResult: function (correct, $source, $target) {
			var me = this;

			var $ul = $target.closest('ul');

			if (correct) {
				$ul.addClass(CLS_CORRECT);
			} else {
				$ul.addClass(CLS_INCORRECT);

				setTimeout(function () {
					$target.css('z-index', 'auto');
					$ul.removeClass(CLS_INCORRECT);

					backToOriginPosition.call(me, $source)
						.then(function () {
							$target.closest('ul')
								.droppable('enable');
						});
				}, 1000);
			}
		},
		nextStep: function () {
			var me = this;
			me.index(me.index() + 1);
			me.items().instantFeedback(true);
			render.call(me);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/activity/matching-text-pic/main.html',[],function() { return function template(data) { var o = "";
    var pics = data.pics;
    var texts = data.texts;
o += "\n\n<div class=\"ets-act-mtp\">\n    "; if (data.references.aud) { o += "\n    <div class=\"ets-references\">\n        <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                   data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n                   class=\"ets-ap\"></audio>\n        </div></div>\n    </div>\n    "; } o += "\n\n    <div class=\"ets-targets\">\n        <ul class=\"ets-cf\">\n            ";for (var i = 0, len = pics.length; i < len; i++) {o += "\n            <li "; if(i === len - 1){ o += "class=\"last\""; } o += ">\n                <div class=\"ets-mb-top\" data-at-id=\"" + pics[i]._id + "\" data-pic-id=\"" + pics[i]._id + "\">\n                    <img src=\"" + pics[i].image.url + "\" alt=\"\" width=\"127\" height=\"97\">\n                    <div class=\"ets-img-shadow\"></div>\n                </div>\n                <div class=\"ets-placeholder\">\n                </div>\n            </li>\n            "; } o += "\n        </ul>\n    </div>\n\n    <div class=\"ets-options\">\n        <ul class=\"ets-cf\">\n            ";for (var i = 0, len = texts.length; i < len; i++) {o += "\n            <li "; if(i === len - 1){ o += "class=\"last\""; } o += ">\n                <div class=\"ets-mb-bottom\" data-at-id=\"" + texts[i]._id + "\" data-text-id=\"" + texts[i]._id + "\" data-index=\"" + i + "\">\n                    <i class=\"ets-indicator\"></i>\n                    <span>" + texts[i].txt + "</span>\n                </div>\n            </li>\n            "; } o += "\n        </ul>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/matching-text-pic/main',[
	'jquery',
	'when',
	'school-ui-activity/activity/base/main',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./main.html",
	'underscore',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'jquery.transit'
], function mpaMain($, when, Widget, Scoring, Interaction, tTemplate) {
	"use strict";

	var $ROOT;
	var $ORIGIN_UL;

	var SEL_MTP = ".ets-act-mtp",
		SEL_OPTION = '.ets-options',
		SEL_OPTION_UL = '.ets-options ul',
		SEL_MB_TOP = '.ets-mb-top',
		SEL_MB_BOTTOM = '.ets-mb-bottom',
		SEL_PLACEHOLDER = '.ets-placeholder',
		SEL_DROPPABLE_AREA = '.ets-targets li';

	var CLS_INCORRECT = 'ets-incorrect',
		CLS_CORRECT = 'ets-correct',
		CLS_HOVER = 'ets-hover',
		CLS_DROPPED = 'ets-mb-dropped',
		CLS_MOVING = 'ets-moving',
		CLS_MB_MEDIUM = 'ets-mb-bottom-medium',
		CLS_PH_MEDIUM = 'ets-placeholder-medium';

	var draggableSetting = {
		containment: SEL_MTP,
		scroll: false,
		revert: 'invalid',
		start: function (/*event, ui*/) {
			var $me = $(this);
			$me.addClass(CLS_MOVING);
			if ($me.hasClass(CLS_DROPPED)) {
				return false;
			}
			$me.closest('li').siblings()
				.css({
					'z-index': 0,
					'position': 'relative'
				});
			$me.css('z-index', 1);
		},
		stop: function (/*event, ui*/) {
			var $me = $(this);
			$me.removeClass(CLS_MOVING);
			$me.closest('li').siblings()
				.css({
					'z-index': '',
					'position': 'static'
				});
			$me.css('z-index', '');
		}
	};


	/**
	 * Move picture back to origin position
	 * @api private
	 */
	function backToOriginPosition($answer) {
		var index = $answer.attr('data-index');
		var $li = $ORIGIN_UL.find('li').eq(index);
		var originPos = $li.position();
		var currentPos = $answer.position();

		return when.promise(function (resolve) {
			$answer.css('z-index', 1).removeClass(CLS_DROPPED)
				.addClass(CLS_MOVING).animate({
					left: originPos.left - currentPos.left,
					top: originPos.top - currentPos.top
				}, function () {
					$answer.removeClass(CLS_MOVING).next().show();
					$li.html($answer.css({
						left: 'auto',
						top: 'auto',
						'z-index': 'auto'
					}));
					$li.find(SEL_MB_BOTTOM).draggable(draggableSetting);
					resolve();
				});
		});
	}

	/**
	 * Filter Distractors
	 **/
	function filterDist(data) {
		var me = this;
		var dists = data.scoring.texts;

		if (!dists) {
			return data;
		}
		data.dists = [];

		_.each(dists, function (dist) {
			data.dists.push(_.find(data.content.texts, function (text) {
				return dist._id == text._id;
			}));

			data.content.texts = _.reject(data.content.texts, function (text) {
				return dist._id == text._id;
			});
		});

		delete me._json.scoring.texts;

		return data;
	}

	/**
	 * Filter source data
	 * # Shuffle template data items
	 * @api private
	 */
	function filterData(data) {
		var me = this;
		if (!data.texts) {
			return;
		}

		// Shuffle pics items and add distraction
		if (data.dists) {
			var distNo = me._json.filterOptions.distNo;
			for (var i = 0, length = 5 - data.texts.length; i < length; i++) {
				if (i >= distNo) {
					break;
				}
				if (data.dists[i]) {
					data.texts.push(data.dists[i]);
				}
			}
		}

		data.texts = _.shuffle(data.texts);

		return data;
	}

	function pagination(data) {
		var me = this;
		var maxPairs = Math.min(data.filterOptions.questionNo, data.content.pics.length);
		var contentLength = data.scoring.pics.length;
		var maxPage = Math.ceil(maxPairs / 5);
		var pairs;

		var temp,
			tempPics,
			tempTexts,
			newPics = [];

		if (contentLength >= maxPairs) {
			// Filter pairs
			pairs = _.shuffle(data.scoring.pics).slice(0, maxPairs);
		} else {
			pairs = _.shuffle(data.scoring.pics);
		}

		me.length(maxPage);

		var perPage = Math.ceil(maxPairs / maxPage);


		for (var pageIndex = 0; pageIndex < maxPage; ++pageIndex) {
			temp = {};
			tempPics = temp.pics = [];
			tempTexts = temp.texts = [];

			var pairIndex = pageIndex * perPage, pairIndexEnd = (pageIndex + 1) * perPage;
			for (; pairIndex < pairIndexEnd; pairIndex++) {
				var pair = pairs[pairIndex];
				if (pair) {
					tempPics.push(_.find(data.content.pics, function (pic) {
						return pair._id == pic._id;
					}));
					tempTexts.push(_.find(data.content.texts, function (text) {
						return pair.text._id == text._id;
					}));
				} else {
					break;
				}
			}

			temp.dists = data.dists;
			temp.references = data.references;
			newPics = newPics.concat(tempPics);

			me._templateData.push(filterData.call(me, temp));
		}

		me._json.content.pics = newPics;
	}

	/**
	 * Shuffle items when sequence change
	 * # Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		// Render widget
		return me.html(tTemplate, me._templateData[me.index()])
			.then(function () {
				onRendered.call(me);

				$ROOT = $(SEL_MTP);
				$ORIGIN_UL = $ROOT.find(SEL_OPTION_UL);
				$ROOT.find(SEL_OPTION + ' ' + SEL_MB_BOTTOM).draggable(draggableSetting);
				$ROOT.find(SEL_DROPPABLE_AREA).droppable(me.droppableSetting);

				return me.attachATAssetDom(me._templateData[me.index()]);
			});
	}

	/**
	 * On activity rendered:
	 * # enlarge the height of matching block bottom by add a class, if neccessary
	 * @api private
	 */
	function onRendered() {
		var me = this;
		var $mb = $(SEL_MB_BOTTOM);
		var $span = $mb.children('span');

		me._currentPairs += me._templateData[me.index()].pics.length;

		if ($span.length) {
			$span.each(function () {
				if ($(this).height() > 32) {
					$mb.addClass(CLS_MB_MEDIUM);
					$(SEL_PLACEHOLDER).addClass(CLS_PH_MEDIUM);
					return false;
				}
			});
		}
	}

	return Widget.extend(function () {
		var me = this;
		me._templateData = [];
		me._currentPairs = 0;
		me._correctAnswers = 0;

		me.droppableSetting = {
			drop: function (event, ui) {
				var $me = $(this);
				var $text = ui.draggable;
				var $pic = $me.find(SEL_MB_TOP);
				var $placeholder = $me.find(SEL_PLACEHOLDER);
				var placholderPosition = $placeholder.position();
				var answerPositon = $text.position();

				// place the target back to its position
				$pic.animate({
					top: 0
				}, 'fast');

				//insert dragging item before placeholder
				$text.animate({
					left: parseInt($text.css('left')) + (placholderPosition.left - answerPositon.left),
					top: parseInt($text.css('top')) + (placholderPosition.top - answerPositon.top)
				}, 'fast', function () {
					$placeholder.before($text.addClass(CLS_DROPPED).css({
						left: 'auto',
						top: 'auto'
					})).hide();

					$text.draggable("destroy");
					$me.droppable('disable');

					var picId = $pic.attr('data-pic-id');
					var textId = $text.attr('data-text-id');

					var correct = me.checkAnswer(picId, textId);

					me.displayInteractionResult(correct, $pic, $text);
				});
			},
			over: function (/*event, ui*/) {
				var $me = $(this);
				var $top = $me.find(SEL_MB_TOP);
				$me.prev().addClass(CLS_HOVER);
				if ($top.is(":animated")) {
					return;
				}
				$top.animate({
					top: 10
				}, 'fast');
			},
			out: function (/*event, ui*/) {
				var $me = $(this);
				var $top = $me.find(SEL_MB_TOP);
				$top.removeClass(CLS_HOVER);
				$top.animate({
					top: 0
				}, 'fast');
			}
		};
	}, {
		"sig/initialize": function onStart() {
			var me = this;

			pagination.call(me, filterDist.call(me, $.extend(true, {}, me._json)));

			me.items().instantFeedback(true);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		checkAnswer: function (picId, textId) {
			var me = this;
			var json = me._json;
			var text = Scoring.findById(json.content.texts, textId);
			var solution = Scoring.findById(json.scoring.pics, picId);
			var correct = text && solution && (solution.text._id === text._id);

			if (correct) {
				me._correctAnswers += 1;
			}

			var promise = me.publishInteraction(Interaction.makeMatchingInteraction(correct, picId, textId));

			if (me._correctAnswers === me._currentPairs) {
				me._json.content._isCorrect = true;
				promise.then(function () {
					var item = me.items();
					item.answered(true);
					item.completed(true);
				});
			}

			return correct;
		},
		displayInteractionResult: function (correct, $pic, $text) {
			var me = this;
			var json = this._json;

			var $li = $pic.closest('li');
			if (correct) {
				$li.addClass(CLS_CORRECT);
			} else {
				$li.addClass(CLS_INCORRECT);

				setTimeout(function () {
					$pic.css('z-index', 'auto');
					$li.removeClass(CLS_INCORRECT);
					backToOriginPosition($text)
						.then(function () {
							$pic.closest('li').droppable('enable');
						});
				}, 1000);
			}
		},
		nextStep: function () {
			var me = this;
			me.index(me.index() + 1);
			me.items().instantFeedback(true);
			return render.call(me);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/activity/matching-text-text/main.html',[],function() { return function template(data) { var o = "";
var targets = data.targets;
var sources = data.sources;
o += "\n<div class=\"ets-act-mtt ets-cf\">\n\n    "; if (data.references.aud) { o += "\n    <div class=\"ets-references\">\n        <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                   data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n                   class=\"ets-ap\"></audio>\n        </div></div>\n    </div>\n    "; } o += "\n\n    <div class=\"ets-targets\">\n\n        <ul class=\"ets-droppable\">\n            "; for (var i = 0, len = targets.length; i < len; i++) { o += "\n            <li class=\"ets-droppable-line\">\n                <ul class=\"ets-cf\">\n                    <li class=\"ets-first\">\n                        <span class=\"ets-word-puzzle ets-undraggable\" data-at-id=\"" + targets[i]._id + "\" data-target-id=\"" + targets[i]._id + "\">\n                            <span>\n                                <div>\n                                    <div>" + targets[i].txt + "</div>\n                                </div>\n                            </span>\n                        </span>\n                    </li>\n                    <li class=\"ets-last\"></li>\n                </ul>\n            </li>\n            "; } o += "\n        </ul>\n\n    </div>\n\n    <div class=\"ets-options\">\n        <ul>\n            "; for (var i = 0, len = sources.length; i < len; i++) { o += "\n            <li class=\"ets-last\">\n                <span class=\"ets-word-puzzle\" data-at-id=\"" + sources[i]._id + "\" data-source-id=\"" + sources[i]._id + "\" data-index=\"" + i + "\" data-action=\"draggable/option\">\n                    <i class=\"ets-indicator\"></i>\n                    <span>\n                        <div>\n                            <div>" + sources[i].txt + "</div>\n                        </div>\n                    </span>\n                    <i class=\"ets-bottom-shadow\"></i>\n                </span>\n            </li>\n            "; } o += "\n        </ul>\n    </div>\n\n</div>"; return o; }; });
define('school-ui-activity/activity/matching-text-text/main',[
	'jquery',
	"poly",
	"when",
	'school-ui-activity/activity/base/main',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"school-ui-shared/utils/browser-check",
	"template!./main.html",
	'underscore',
	'jquery.ui',
	'jquery.ui.touch-punch'
], function MatchingTextText($, poly, when, Widget, Scoring, Interaction, browserCheck, template, _) {
	'use strict';

	var PAGINATE = 6;

	var SEL_MTT = '.ets-act-mtt';
	var SEL_TARGET = '.ets-targets';
	var SEL_OPTION = '.ets-options';
	var SEL_PUZZLE = '.ets-word-puzzle';
	var SEL_DROPPABLE = '.ets-droppable ul';
	var SEL_OPTION_UL = '.ets-options ul';

	var CLS_MOVING = 'ets-moving';
	var CLS_CORRECT = 'ets-correct';
	var CLS_INCORRECT = 'ets-incorrect';
	var CLS_UNDRAGGABLE = 'ets-undraggable';

	var draggableOptions = {
		revert: 'invalid',
		containment: SEL_MTT,
		scroll: false,
		zIndex: 2
	};

	/**
	 * Move picture back to origin position
	 * @api private
	 */
	function backToOriginPosition($source) {
		var me = this;
		var index = $source.attr('data-index');
		var $li = me.$element.find(SEL_OPTION_UL).find('li').eq(index);
		var originPos = $li.position();
		var currentPos = $source.position();

		return when.promise(function (resolve) {
			$source
				.css('z-index', 1)
				.addClass(CLS_MOVING)
				.animate({
					left: originPos.left - currentPos.left,
					top: originPos.top - currentPos.top
				}, function () {
					$source
						.removeClass(CLS_MOVING + " " + CLS_UNDRAGGABLE)
						.next()
						.show();
					$li.html($source.css({
						left: 'auto',
						top: 'auto',
						'z-index': 'auto'
					}));
					$li.find(SEL_PUZZLE).draggable(draggableOptions);
					resolve();
				});
		});
	}

	/**
	 * Filter Distractors
	 **/
	function filterDist(data) {
		var me = this;

		var dists = data.scoring.sources;

		if (!dists) {
			return data;
		}
		data.dists = [];

		_.each(dists, function (dist) {
			data.dists.push(_.find(data.content.sources, function (source) {
				return dist._id == source._id;
			}));

			data.content.sources = _.reject(data.content.sources, function (source) {
				return dist._id == source._id;
			});
		});

		delete me._json.scoring.sources;

		return data;
	}

	/**
	 * Filter source data
	 * # Shuffle template data items
	 * @api private
	 */
	function filterData(data) {
		var me = this;
		if (!data.sources) {
			return;
		}

		// Shuffle pics items and add distraction
		if (data.dists) {
			var distNo = me._json.filterOptions.distNo;
			for (var i = 0, length = 5 - data.sources.length; i < length; i++) {
				if (i >= distNo) {
					break;
				}
				if (data.dists[i]) {
					data.sources.push(data.dists[i]);
				}
			}
		}

		data.sources = _.shuffle(data.sources);

		return data;
	}

	/**
	 * Paginate data
	 * @api private
	 */
	function pagination(data) {
		var me = this;
		var maxPairs = Math.min(data.filterOptions.questionNo, data.content.targets.length);
		var contentLength = data.scoring.targets.length;
		var maxPage = Math.ceil(maxPairs / PAGINATE);
		var pairs;

		var temp,
			tempTargets,
			tempSources,
			newSources = [];

		if (contentLength >= maxPairs) {
			// Filter pairs
			pairs = _.shuffle(data.scoring.targets).slice(0, maxPairs);

			// update scoring.targets so that scoring can calculate correctly
			me._json.scoring.targets = pairs;
		} else {
			pairs = _.shuffle(data.scoring.targets);
		}

		me.length(maxPage);

		var perPage = Math.ceil(maxPairs / maxPage);

		for (var pageIndex = 0; pageIndex < maxPage; ++pageIndex) {
			temp = {};
			tempTargets = temp.targets = [];
			tempSources = temp.sources = [];

			var pairIndex = pageIndex * perPage, pairIndexEnd = (pageIndex + 1) * perPage;
			for (; pairIndex < pairIndexEnd; ++pairIndex) {
				var pair = pairs[pairIndex];
				if (pair) {
					tempTargets.push(_.find(data.content.targets, function (target) {
						return pair._id == target._id;
					}));
					tempSources.push(_.find(data.content.sources, function (source) {
						return pair.source.txt == source.txt;
					}));
				} else {
					break;
				}
			}

			temp.dists = data.dists;
			temp.references = data.references;
			newSources = newSources.concat(tempSources);

			me._templateData.push(filterData.call(me, temp));
		}
		me._json.content.sources = newSources;
	}

	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		return me.html(template, me._templateData[me.index()])
			.then(function () {
				me.attachATAssetDom(me._templateData[me.index()]);
				onRendered.call(me);
			});
	}

	function onRendered() {
		var me = this;

		me._currentPairs += me._templateData[me.index()].targets.length;

		me.$element.find(SEL_OPTION + ' ' + SEL_PUZZLE).css('position', 'relative').draggable(draggableOptions);
		me.$element.find(SEL_OPTION).on('mousedown mouseup', SEL_PUZZLE, function (e) {
			var $me = $(this);
			if (e.type === 'mousedown') {
				$me.addClass(CLS_MOVING);
			} else {

				$me.removeClass(CLS_MOVING);
			}
		});

		me.$element.find(SEL_DROPPABLE).droppable(me._droppableOptions);

		// prevent user select
		if (browserCheck.browser === "msie") {
			me.$element.find(SEL_TARGET).add(SEL_OPTION).on('selectstart', function (e) {
				e.preventDefault();
			});
		}
	}

	return Widget.extend(function () {
		var me = this;
		me._templateData = [];
		me._currentPairs = 0;
		me._correctAnswers = 0;

		me._droppableOptions = {
			hoverClass: "ets-drop-hover",
			drop: function (event, ui) {
				var $me = $(this).css('position', 'static');
				var $source = ui.draggable;
				var $target = $me.find('.ets-first .ets-word-puzzle');
				var $li = $me.find('.ets-last');

				var targetPos = $li.position();
				var originPos = $source.position();

				$source.addClass(CLS_MOVING).animate({
					left: parseInt($source.css('left')) + (targetPos.left - originPos.left) + 2,
					top: parseInt($source.css('top')) + (targetPos.top - originPos.top)
				}, function () {
					$li.html($source.removeAttr('style').removeClass(CLS_MOVING));

					$me.droppable('disable');
					$source.addClass(CLS_UNDRAGGABLE).draggable('destroy');

					var sourceId = $source.attr('data-source-id');
					var targetId = $target.attr('data-target-id');

					var correct = me.checkAnswer(sourceId, targetId);

					me.displayInteractionResult(correct, $source, $target);
				});
			},
			over: function (/*event, ui*/) {
				var $me = $(this);
				if ($me.is(":animated")) {
					return;
				}
				$me.css({position: 'relative'}).animate({
					left: 10
				}, 'fast');
			},
			out: function (/*event, ui*/) {
				var $me = $(this);

				$me.animate({
					left: 0
				}, 'fast');
			}
		};
	}, {
		"sig/initialize": function onStart() {
			var me = this;

			pagination.call(me, filterDist.call(me, me._json));
		},
		"sig/render": function onRender() {
			this.items().instantFeedback(true);

			return render.call(this);
		},
		checkAnswer: function (sourceId, targetId) {
			var me = this;
			var json = me._json;
			var source = Scoring.findById(json.content.sources, sourceId);
			var solution = Scoring.findById(json.scoring.targets, targetId);
			var correct = source && solution && (solution.source.txt === source.txt);

			if (correct) {
				me._correctAnswers += 1;
			}

			var promise = me.publishInteraction(Interaction.makeMatchingInteraction(correct, targetId, sourceId));

			if (me._correctAnswers === me._currentPairs) {
				me._json.content._isCorrect = true;
				promise.then(function () {
					var item = me.items();
					item.answered(true);
					item.completed(true);
				});
			}

			return correct;
		},
		displayInteractionResult: function (correct, $source, $target) {
			var me = this;
			var $ul = $target.closest('ul');
			if (correct) {
				$ul.addClass(CLS_CORRECT);
			} else {
				$ul.addClass(CLS_INCORRECT);

				setTimeout(function () {
					$target.css('z-index', 'auto');
					$ul.removeClass(CLS_INCORRECT);

					backToOriginPosition.call(me, $source)
						.then(function () {
							$target.closest('ul').droppable('enable');
						});
				}, 1000);
			}
		},
		nextStep: function () {
			var me = this;
			me.index(me.index() + 1);
			this.items().instantFeedback(true);
			return render.call(me);
		}
	});
});

define('troopjs-requirejs/template!school-ui-activity/activity/movie-presentation/main.html',[],function() { return function template(data) { var o = ""; var words = data.content.words; o += "\n<div class=\"ets-act-mvp ets-cf\">\n    <div class=\"ets-movie\" data-at-id=\"video\">\n        <!--<div data-weave=\"school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)\"></div>-->\n    </div>\n\n    <div class=\"ets-word-list\">\n        <ul>\n            ";for (var i = 0, len = words.length; i < len; i++) {o += "\n            <li class=\"" +(i === 0 ? 'ets-first' : '')+ "\" data-at-id=\"answer\">\n                <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                       class=\"ets-ap ets-ap-small ets-ap-nobar\"\n                       data-src=\"" +words[i].translation.audio.url+ "\" type=\"audio/mpeg\"\n                       controls=\"controls\"></audio>\n\n                <div class=\"ets-words-info\">\n                    <p class=\"ets-word\">" +words[i].txt+ "</p>\n                    ";if(words[i].txt.replace(/\’/g,"'") !== words[i].translation.translation.replace(/\’/g,"'")){o += "\n                        <p class=\"ets-translation\">" +words[i].translation.translation+ "</p>\n                    ";}o += "\n                </div>\n            </li>\n            ";}o += "\n        </ul>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/movie-presentation/continuousMovie',[
	"jquery",
	"poly",
	"mediaelement-plugin-ef",
	"school-ui-activity/util/content-converter",
	"school-ui-activity/activity/base/main",
	"template!./main.html"
], function mpaMain($, poly, mejs, converter, Widget, tTemplate) {
	"use strict";
	var $ELEMENT = "$element";

	var CLS_ACTIVE = "ets-active";

	var SEL_MOVIE = ".ets-movie";
	var SEL_WORD_LIST = ".ets-word-list";
	var SEL_WORD_LI = "li";
	var SEL_MEJS_TIME_SEPARATOR = ".mejs-time-separator-item";

	var DURATION_WORD_ACTIVE = 1000;
	var DURATION_WORDLIST_SCROLL = 500;

	function showWord(index) {
		var me = this;
		var $li = me.$wordlist.find(SEL_WORD_LI).eq(index);
		$li.show();
		$li.attr("data-at-status", "shown");	//for automation testing
	}

	function activeWord(index) {
		var me = this;
		var $li = me.$wordlist.find(SEL_WORD_LI).eq(index);

		if (!$li.hasClass(CLS_ACTIVE)) {
			$li.addClass(CLS_ACTIVE);

			setTimeout(function () {
				$li.removeClass(CLS_ACTIVE);
			}, DURATION_WORD_ACTIVE);
		}
	}

	function scrollWordIntoView(index) {
		var me = this;
		var $li = me.$wordlist.find(SEL_WORD_LI).eq(index);
		var liTop = $li.position().top;
		var liHeight = $li.outerHeight(true);
		var liBottom = liTop + liHeight;
		var wordlistHeight = me.$wordlist.height();

		if (liTop < 0) {
			me.$wordlist.animate({
				scrollTop: liTop
			}, DURATION_WORDLIST_SCROLL);
		}
		else if (liBottom > wordlistHeight) {
			var scrollDownDistance = liBottom - wordlistHeight;
			me.$wordlist.animate({
				scrollTop: me.$wordlist.scrollTop() + scrollDownDistance
			}, DURATION_WORDLIST_SCROLL);
		}
	}

	function onVPSuccess(mediaElement, domObject, player) {
		var me = this;
		var $mediaElement = mejs.$(mediaElement);

		$mediaElement.on("restrict_time_range_ended", function (evt, rangeInfo) {
			if (rangeInfo.index < me.timeSepCount) {
				showWord.call(me, rangeInfo.index);
				scrollWordIntoView.call(me, rangeInfo.index);
				activeWord.call(me, rangeInfo.index);

				var $currentTimeSeparator = me[$ELEMENT].find(SEL_MEJS_TIME_SEPARATOR + ":eq(" + rangeInfo.index + ")");
				$currentTimeSeparator.addClass(CLS_ACTIVE);
			}
		});

		$mediaElement.one("ended", function () {
			$mediaElement.off("restrict_time_range_ended");

			player.disableRestrictPlayingTimeRange();
			mediaElement.pause();
			mediaElement.setCurrentTime(0);
			$mediaElement.on("time_range_changed", function (evt, rangeInfo) {
				if (rangeInfo.oldIndex < me.timeSepCount && rangeInfo.oldIndex + 1 === rangeInfo.newIndex) {
					scrollWordIntoView.call(me, rangeInfo.oldIndex);
					activeWord.call(me, rangeInfo.oldIndex);
				}
			});
		});
	}

	function render() {
		var me = this;

		return me
			.html(tTemplate, me._json)
			.tap(function () {
				me.$wordlist = me[$ELEMENT].find(SEL_WORD_LIST)
			})
			.tap(initVideoPlayer.bind(me));
	}

	function initVideoPlayer() {
		var me = this;
		var data = me._json.content;

		//video info
		var videoInfo = {
			video: data.video,
			poster: data.poster
		};

		//options
		var features = ["TimeRanges", "Subtitles", "SwitchQuality"];
		var subtitles = converter.scriptsToSubtitles(data.scripts);
		var timeRangeSeparators = converter.questionsToEndTimes(data.words);
		me.timeSepCount = timeRangeSeparators.length;

		var options = {
			features: features,
			subtitles: subtitles,
			timeRangeSeparators: timeRangeSeparators,
			restrictPlayingTimeRange: true,
			restrictDeviationBefore: 0.5,
			continueOnEndOfRestrictRange: true
		};

		//success callback
		var successCallback = function () {
			onVPSuccess.apply(me, arguments);
		};

		//start to init
		var $video = me[$ELEMENT].find(SEL_MOVIE);
		$video.data({
			"videoInfo": videoInfo,
			"options": options,
			"successCallback": successCallback
		});
		$video.attr("data-weave", "school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)");
		$video.weave();
	}

	return Widget.extend({
		"sig/start": function onInit() {
			var me = this;
			me.$wordlist = null;
			me.timeSepCount = -1;
		},
		"sig/render": function onRender() {
			this.items().completed(true);
			return render.call(this);
		},
		"dom:.ets-ap/media/play": function (event) {
			$(event.target).closest("li").addClass(CLS_ACTIVE);
		},
		"dom:.ets-ap/media/pause": function (event) {
			$(event.target).closest("li").removeClass(CLS_ACTIVE);
		},
		"dom:.ets-ap/media/ended": function (event) {
			$(event.target).closest("li").removeClass(CLS_ACTIVE);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/activity/movie-presentation/screen-word.html',[],function() { return function template(data) { var o = "<table class=\"ets-screen-inner\">\n    <tr>\n        <td>\n            <p class=\"ets-word\">" +data.txt+ "</p>\n            ";if(data.txt.replace(/\’/g,"'") !== data.translation.translation.replace(/\’/g,"'")){o += "\n                <p class=\"ets-translation\">" +data.translation.translation+ "</p>\n            ";}o += "\n        </td>\n    </tr>\n</table>  "; return o; }; });
define('school-ui-activity/activity/movie-presentation/screen-word',['jquery',
    'troopjs-core/component/widget',
    "troopjs-utils/deferred",
    "template!./screen-word.html"], function mpaMain($, Widget, Deferred, tTemplate) {
    'use strict';

    function render(deferred) {
        var me = this;
        me.html(tTemplate, me._content, deferred);
    }

    return Widget.extend(function (el, module, content) {
        var me = this;

        me._content = content;
    }, {
        'sig/initialize': function (signal, deferred) {
            var me = this;

            render.call(me, deferred);
        }
    });
});

define('troopjs-requirejs/template!school-ui-activity/activity/movie-question/movie-question.html',[],function() { return function template(data) { var o = "";	var data = data || {}; 
	var questions = data.content.questions;
o += "\n<div class=\"ets-act-mvq ets-cf\">\n\t<div class=\"ets-act-mvq-movie\">\n\t\t<div class=\"ets-movie\" data-at-id=\"video\"><!--<div data-weave=\"school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)\"></div>--></div>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"464922\" data-text-en=\"Replay this video segment\" class=\"ets-act-mvq-replay-blurb ets-none\"></span>\n\t</div>\n\n\t<div class=\"ets-act-mvq-ques\">\n\t\t"; for(var i = 0; i < questions.length; i++) { o += "\n\t\t<div class=\"ets-act-mvq-que ets-none\">\n\t\t\t<span class=\"ets-act-mvq-que-title\">" +questions[i].txt+ "</span>\n\t\t\t<ul class=\"ets-act-mvq-answers\" data-at-id=\"" +questions[i]._id+ "\">\n\t\t\t\t"; for(var j = 0; j < questions[i].options.length; j++) { o += "\n\t\t\t\t\t<li class=\"ets-act-mvq-answer ets-table\" data-at-id=\"" +questions[i]._id+ "_" +questions[i].options[j]._id+ "\" data-option-id=\"" +questions[i].options[j]._id+ "\" data-index=\"" +j+ "\">\n\t\t\t\t\t\t<div class=\"ets-table-hack\">\n\t\t\t\t\t\t\t<span>" +questions[i].options[j].txt+ "</span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</li>\n\t\t\t\t"; } o += "\n\t\t\t</ul>\n\t\t</div>\n\t\t"; } o += "\n\t</div>\n</div>"; return o; }; });
define('school-ui-activity/activity/movie-question/main',[
	"jquery",
	"poly",
	"when",
	"mediaelement-plugin-ef",
	"school-ui-activity/util/content-converter",
	'school-ui-activity/util/interaction',
	"school-ui-activity/activity/base/main",
	"template!./movie-question.html"
], function MultipleChoiceModule($, poly, when, mejs, converter, Interaction, Widget, tTemplate) {
	"use strict";

	var $ELEMENT = "$element";

	// declaire variables
	var CLS_ACTIVE = "ets-active";
	var CLS_NONE = "ets-none";
	var CLS_WRONG = "ets-wrong";
	var CLS_CORRECT = "ets-correct";
	var CLS_DISABLED = "ets-disabled";
	var CLS_MOVIE_REPLAY = "ets-movie-replay";

	var SEL_MOVIE_CONTAINER = ".ets-act-mvq-movie";
	var SEL_MOVIE = ".ets-movie";
	var SEL_MEJS_OVERLAY_PLAY = ".mejs-overlay-play";
	var SEL_MEJS_TIME_SEPARATOR = ".mejs-time-separator-item";
	var SEL_QUESTION_CONTAINER = ".ets-act-mvq-ques";
	var SEL_QUESTION = ".ets-act-mvq-que";
	var SEL_ANSWER_CONTAINER = ".ets-act-mvq-answers";
	var SEL_REPLAY_BLURB = ".ets-act-mvq-replay-blurb";

	var DURATION_ANIMATION = 500;
	var DURATION_ANSWER_CORRECT = 1500;
	var DURATION_ANSWER_WRONG = 1000;

	function updateToPlayState() {
		var me = this;
		me.needReplay = false;

		var $movie = me[$ELEMENT].find(SEL_MOVIE);
		$movie.removeClass(CLS_MOVIE_REPLAY);
	}

	function updateToReplayState() {
		var me = this;
		me.needReplay = true;

		var $movie = me[$ELEMENT].find(SEL_MOVIE);
		$movie.addClass(CLS_MOVIE_REPLAY);
	}

	/**
	 * Added custom callback when video is ready
	 * @api private
	 */
	function onVPSuccess(mediaElement, domObject, player) {
		var me = this;

		me.player = player;
		me.mediaElement = mediaElement;

		me[$ELEMENT].find(SEL_REPLAY_BLURB).appendTo(me[$ELEMENT].find(SEL_MEJS_OVERLAY_PLAY));
		updateToPlayState.call(me);

		var $mediaElement = mejs.$(mediaElement);
		$mediaElement.on("restrict_time_range_ended", function (evt, rangeInfo) {
			if (!rangeInfo.continueOnEnd) {
				var $currentTimeSeparator = me[$ELEMENT].find(SEL_MEJS_TIME_SEPARATOR + ":eq(" + me.currentQuestionIndex + ")");
				if (!$currentTimeSeparator.hasClass(CLS_ACTIVE)) {
					$currentTimeSeparator.addClass(CLS_ACTIVE);
					showQuestion.call(me, me.currentQuestionIndex);
				}
				updateToReplayState.call(me);
			}
		});

		$mediaElement.on("play", function () {
			if (me.needReplay) {
				me.needReplay = false;
				player.restartCurrentTimeRange();
				mediaElement.play();
				updateToPlayState.call(me);
			}
		});

		$mediaElement.one("ended", function () {
			player.pause();
			player.disableRestrictPlayingTimeRange();
			mediaElement.setCurrentTime(0);
			updateToPlayState.call(me);
		});
	}

	/**
	 * show question when time point reach to the cube point
	 * @api private
	 */
	function showQuestion(index) {
		var me = this;
		var $movieContainer = me[$ELEMENT].find(SEL_MOVIE_CONTAINER);

		var $questionContainer = me[$ELEMENT].find(SEL_QUESTION_CONTAINER);
		$questionContainer.addClass(CLS_ACTIVE);
		var $currentQuestion = $questionContainer.find(SEL_QUESTION + ":eq(" + index + ")");

		if (me.currentQuestionIndex === 0) {
			$currentQuestion.removeClass(CLS_NONE);
			$movieContainer.animate({right: "150"}, DURATION_ANIMATION);
			$questionContainer.animate({marginLeft: "180"}, DURATION_ANIMATION);
		} else {
			$currentQuestion.fadeIn();
		}

		$currentQuestion.find(SEL_ANSWER_CONTAINER).attr("data-at-status", "shown");

		//only left current question data in scoring node of json data which benefit for scoring logic
		var scoreQuestions = me._json.scoring.questions;
		scoreQuestions.splice(index + 1);
		scoreQuestions.slice(0, index);
	}

	/**
	 * close question when answer correct
	 * @api private
	 */
	function closeQuestion(index) {
		var me = this;

		//recover scoring data of original data
		me._json.scoring.questions = me._source.scoring.questions.slice();

		return me[$ELEMENT]
			.find(SEL_QUESTION + ":eq(" + index + ")").fadeOut()
			.promise()
			.then(function () {
				closeQuestionDone.call(me);
			});
	}

	function closeQuestionDone() {
		var me = this;

		var previousQuestionIndex = me.currentQuestionIndex;
		me.currentQuestionIndex++;

		var isComplete;
		var isSameStopAsPrevious;
		if (me.currentQuestionIndex === me._json.content.questions.length) {
			me._json.content._isCorrect = true;
			isComplete = true;
		}
		else if (me.timeRangeSeparators[previousQuestionIndex] === me.timeRangeSeparators[me.currentQuestionIndex]) {
			isSameStopAsPrevious = true;
		}

		if (isSameStopAsPrevious) {
			showQuestion.call(me, me.currentQuestionIndex, me);
			me.player.nextTimeRange();
		}
		else {
			updateToPlayState.call(me);
			if (Math.abs(me.mediaElement.currentTime - me.timeRangeSeparators[previousQuestionIndex]) < 0.1) {
				me.player.nextTimeRange();
			}
			else {
				mejs.$(me.mediaElement).one("time_range_changed", function () {
					me.player.disableContinueOnEndOfRestrictRange();
				});
				me.player.enableContinueOnEndOfRestrictRange();
			}
			me.mediaElement.play();

			//if last quesiton answer correct, bottom button changes to be next and try again
			isComplete && me.items().completed(true);
		}
	}

	function onAnswerSelected(evt) {
		var me = this;

		var $currentAnswer = $(evt.currentTarget);
		if ($currentAnswer.hasClass(CLS_WRONG) || $currentAnswer.hasClass(CLS_CORRECT) ||
			$currentAnswer.hasClass(CLS_DISABLED) || me.answerTimeoutHandler) {
			return;
		}

		var currentQuestion = me._json.content.questions[me.currentQuestionIndex];
		var optionId = $currentAnswer.data('option-id');
		var checkResult = me.checkAnswer(me.currentQuestionIndex, optionId);
		if (checkResult.correct) {
			currentQuestion.pass = true;
			$currentAnswer.addClass(CLS_CORRECT);
			me.answerTimeoutHandler = setTimeout(function () {
				checkResult.promise.then(function () {
					return closeQuestion.call(me, me.currentQuestionIndex);
				}).then(function () {
					me.answerTimeoutHandler = 0;
				});
			}, DURATION_ANSWER_CORRECT);
		} else {
			$currentAnswer.addClass(CLS_WRONG);
			me.answerTimeoutHandler = setTimeout(function () {
				$currentAnswer.removeClass(CLS_WRONG).addClass(CLS_DISABLED);
				me.answerTimeoutHandler = 0;
			}, DURATION_ANSWER_WRONG);
		}
	}

	/**
	 * Shuffle origin json data
	 * # Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		return me.html(tTemplate, me._json)
			.tap(initVideoPlayer.bind(me));
	}

	function initVideoPlayer() {
		var me = this;
		var data = me._json.content;

		//video info
		var videoInfo = {
			video: data.video
		};

		//options
		var features = ["TimeRanges", "Subtitles", "SwitchQuality"];
		var subtitles = converter.scriptsToSubtitles(data.scripts);
		var timeRangeSeparators = converter.questionsToEndTimes(data.questions);
		me.timeRangeSeparators = timeRangeSeparators;

		var options = {
			features: features,
			subtitles: subtitles,
			timeRangeSeparators: timeRangeSeparators,
			restrictPlayingTimeRange: true,
			allowPlayingBeforeRestrictRange: true,
			continueOnEndOfRestrictRange: false
		};

		//success callback
		var successCallback = function () {
			onVPSuccess.apply(me, arguments);
		};

		//start to init
		var $video = me[$ELEMENT].find(SEL_MOVIE);
		$video.data({
			"videoInfo": videoInfo,
			"options": options,
			"successCallback": successCallback
		});
		$video.attr("data-weave", "school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)");
		$video.weave();
	}

	return Widget.extend(function () {
		var me = this;
		me.currentQuestionIndex = 0;
		me.answerTimeoutHandler = 0;
		me.player = null;
		me.mediaElement = null;
		me.needReplay = false;
	}, {
		"sig/initialize": function onInitialize() {
			var me = this;
			me.items().instantFeedback(true);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			clearTimeout(me.answerTimeoutHandler);
		},
		"checkAnswer": function (questionIndex, optionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, questionIndex, optionId);
			var promise = me.publishInteraction(interaction);
			return {
				correct: interaction.correct,
				promise: promise
			};
		},
		"dom:.ets-act-mvq-answer/click": function (/*evt*/) {
			onAnswerSelected.apply(this, arguments);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/activity/multiple-choice-media/multiple-choice-media.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var txt = data.content.questions[this._index].txt;
	var medias = data.content.questions[this._index].options;
	var questionAudio = data.content.questions[this._index].audio;
o += "\n<div class=\"ets-act-mcm ets-act-multiple ets-cf\">\n\t<div class=\"ets-act-mcm-content\">\n\t\t<div class=\"ets-act-mt-top\">\n\t\t\t";if (questionAudio) { o += "\n\t\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t\t       data-src=\"" +questionAudio.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t\t       class=\"ets-ap\"></audio>\n\t\t\t\t</div></div>\n\t\t\t";}o += "\n\t\t\t<div class=\"ets-act-mt-title-container\">\n\t\t\t\t<span class=\"ets-act-mt-title\">" + txt + "</span>\n\t\t\t</div>\n\t\t</div>\n\t\t<ul class=\"ets-act-mcm-options\">\n\t\t\t"; for (var i= 0;i< medias.length;i++) {o += "\n\t\t\t\t<li class=\"ets-act-mcm-option\" data-at-id=\"" + medias[i]._id + "\" data-answer=\"" + medias[i]._id + "\" data-index=\"" +i+ "\">\n\t\t\t\t\t<img src=\"" + medias[i].image.url + "\" width=\"162\"  height=\"117\"/>\n\t\t\t\t\t<span class=\"ets-icon-correct-s ets-none\"></span>\n\t\t\t\t\t<span class=\"ets-icon-incorrect-s ets-none\"></span>\n\t\t\t\t</li>\n\t\t\t"; } o += "\n\t\t</ul>\t\t\n\t</div>\n</div>"; return o; }; });
define('school-ui-activity/activity/multiple-choice-media/multiple-choice-media',[
	'jquery',
	'poly',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./multiple-choice-media.html'
], function MultipleChoiceMediaModule($, poly, Widget, Interaction, tMCMedia) {
	"use strict";

	// declaire variables
	var CLS_ACT = "ets-act",
		CLS_CORRECT = "ets-correct",
		CLS_WRONG = "ets-wrong",
		CLS_DISABLED = "ets-disabled",
		CLS_NONE = "ets-none",
		CLS_MT_LAY = "ets-act-mt-lay",
		CLS_MT_SINGLE_LAY = "ets-act-mt-single-lay",
		CLS_MT_COMMON_LAY = "ets-act-mt-common-lay",
		CLS_MT_AP_CONTENT_GAP = "ets-act-mt-ap-content-gap";

	var SEL_OPTION = ".ets-act-mcm-option",
		SEL_ICON_CORRECT = ".ets-icon-correct-s",
		SEL_ICON_INCORRECT = ".ets-icon-incorrect-s",
		SEL_MCM_OPTIONS = ".ets-act-mcm-options",
		SEL_ACT_MCM_CONTENT = ".ets-act-mcm-content";

	var HUB = 'hub/';
	var TOPIC_MULTIPLE_CHOICE_MEDIA_LOAD = "activity/template/multiplechoicemedia/load";

	var SHOW_CORRECTNESS_DURATION = 2000;

	// Constructor
	function Ctor() {

	}

	/**
	 * Shuffle origin json data
	 * # Templating and render
	 * @api private
	 */
	function render() {
		// TODO: Re-render according to this._json
		// Render widget
		var me = this,
			originData = me._json,
			quetionsData = originData.content.questions[me._index];

		me.optionWrongT = 0;
		me.selectIsCorrect = false;

		for (var j = 0; j < quetionsData.options.length; j++) {
			quetionsData.options[j].selected = false;
		}

		return me.html(tMCMedia, originData)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * # Init answers remaining
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = me.$element,
			commonAudio = me._json.references.aud;

		me.answersNum = 1;

		switch (me._optionsNum) {
			case 2 :
			case 4 :
				$el.find(SEL_MCM_OPTIONS).addClass(CLS_MT_LAY);
				break;
			case 1 :
				$el.find(SEL_MCM_OPTIONS).addClass(CLS_MT_SINGLE_LAY);
				break;
			default :
				$el.find(SEL_MCM_OPTIONS).addClass(CLS_MT_COMMON_LAY);
				break;
		}

		if (commonAudio) {
			$el.find(SEL_ACT_MCM_CONTENT).addClass(CLS_MT_AP_CONTENT_GAP);
		}
	}

	var methods = ({
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			window.clearTimeout(this._correctTimer);
			window.clearTimeout(this.optionWrongT);
		},
		"dom:.ets-act-mcm-option/click": function ($event) {
			//mark json data based on user's chose
			var me = this,
				$el = me.$element,
				$opTg = $($event.currentTarget),
				$options = $el.find(SEL_OPTION),
				item = me._item;

			if ($opTg.hasClass(CLS_CORRECT) || $opTg.hasClass(CLS_WRONG) || $opTg.hasClass(CLS_DISABLED) || me.optionWrongT != 0 || me.selectIsCorrect) {
				return;
			}
			//non-graded mode
			if (!me._hasScoring) {
				item.answered(true);
				if (me._index === me._length - 1) {
					item.completed(true);
					me._super.nextStep();
				}

				if ($opTg.hasClass(CLS_ACT)) {
					$opTg.removeClass(CLS_ACT);
					me.answersNum++;
				} else {
					$options.removeClass(CLS_ACT);
					$opTg.addClass(CLS_ACT);
					if (me.answersNum === 0) {
						return;
					} else {
						me.answersNum--;
					}
				}
			} else {//graded mode
				var selectOptionId = $opTg.data('answer');
				var correct = me.checkAnswer(selectOptionId);
				if (correct) {
					$opTg.addClass(CLS_CORRECT);
					$opTg.find(SEL_ICON_CORRECT).removeClass(CLS_NONE);
					me.selectIsCorrect = true;
				} else {
					$opTg.addClass(CLS_WRONG);
					$opTg.find(SEL_ICON_INCORRECT).removeClass(CLS_NONE);
					me.optionWrongT = setTimeout(function () {
						$opTg.toggleClass(CLS_DISABLED + ' ' + CLS_WRONG);
						$opTg.find(SEL_ICON_INCORRECT).addClass(CLS_NONE);
						me.optionWrongT = 0;
					}, SHOW_CORRECTNESS_DURATION);
				}
			}
		},

		checkAnswer: function (selectOptionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, me._index, selectOptionId);
			var correct = interaction.correct;

			var promise = me._super.publishInteraction(interaction);

			if (correct) {
				promise.then(function () {
					var isLastQuestion = (me._index === me._length - 1);
					if (isLastQuestion) {
						me._json.content._isCorrect = true;
					}
					me._item.completed(true);
					me._correctTimer = setTimeout(function () {
						me._super.nextStep();
					}, isLastQuestion ? 0 : SHOW_CORRECTNESS_DURATION);
				});
			}

			return correct;
		}
	});

	methods[HUB + TOPIC_MULTIPLE_CHOICE_MEDIA_LOAD] = function (options) {
		var me = this;

		me._super = options._super;
		me._json = me._super._json;
		me._item = me._super.items();
		me._index = me._super.index();
		me._length = me._super.length();
		me._hasScoring = me._super.hasScoring;
		me._optionsNum = me._json.content.questions[me._index].options.length;

		return me.signal('render');
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/multiple-choice-media/main.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var commonAudio = data.references.aud;
o += "\r\n<div class=\"ets-act-mt-container\">\r\n\t";if (commonAudio) { o += "\r\n\t\t<div class=\"ets-table-hack\">\r\n\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\r\n\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\r\n\t\t\t\t       data-src=\"" +commonAudio.url+ "\" type=\"audio/mpeg\"\r\n\t\t\t\t       class=\"ets-ap ets-com-ap\"></audio>\r\n\t\t\t</div></div>\r\n\t\t</div>\r\n\t";}o += "\r\n\t<div class=\"ets-act-mcm-wrap\" data-weave=\"school-ui-activity/activity/multiple-choice-media/multiple-choice-media\">\r\n\t</div>\r\n</div>"; return o; }; });
define('school-ui-activity/activity/multiple-choice-media/main',[
	'jquery',
	'underscore',
	'when',
	'../base/main',
	'./multiple-choice-media',
	'template!./main.html'
], function MultipleChoiceModule($, _, when, Widget, MultipleChoiceMedia, tTemplate) {
	"use strict";

	// declaire variables
	var SEL_ACT_MCM_WRAP = ".ets-act-mcm-wrap";

	var TOPIC_MULTIPLE_CHOICE_MEDIA_LOAD = "activity/template/multiplechoicemedia/load";

	function Ctor() {
	}

	/**
	 * Filter source data
	 * # Shuffle question & media items
	 * # Random and select specified numbers of options
	 * @api private
	 */
	function filterData(data) {
		// TODO: restructuring json data for later rendering
		if (!data.content.questions) {
			throw "the json data can't find questions node in multiple-choice-media";
		}

		var oldData = this._json,
			filterOpNum = oldData.filterOptions.optionNo,
			isRandom = oldData.filterOptions.random,
			wrongNum,
			corNum,
			questionsData = oldData.content.questions,
			contOptions,
			scrOptions,
			tmpSrcOptions,
			tmpConOptions,
			tmpConOptKeys;

		if (!this.hasScoring && isRandom) {
			_.each(questionsData, function (qVal, qInd) {
				data.content.questions[qInd].options = _.shuffle(questionsData[qInd].options);
				if (filterOpNum < qVal.options.length) {
					data.content.questions[qInd].options.splice(filterOpNum, qVal.options.length - filterOpNum);
				}
			});
		} else {
			var scoringData = oldData.scoring.questions;
			_.each(scoringData, function (sqValue, sqIndex) {
				contOptions = isRandom ? _.shuffle(questionsData[sqIndex].options) : questionsData[sqIndex].options;
				scrOptions = isRandom ? _.shuffle(sqValue.options) : sqValue.options;
				tmpSrcOptions = [];
				tmpConOptKeys = [];
				tmpConOptions = [];
				corNum = 1;
				wrongNum = filterOpNum - corNum;
				_.each(scrOptions, function (opVal) {
					if ((opVal.selected && corNum && corNum--) || (!opVal.selected && wrongNum && wrongNum--)) {
						tmpSrcOptions.push(opVal);
						tmpConOptKeys.push(opVal._id);
					}
				});
				_.each(contOptions, function (val) {
					if (_.indexOf(tmpConOptKeys, val._id) >= 0) {
						tmpConOptions.push(val);
					}
				});
				data.scoring.questions[sqIndex].options = tmpSrcOptions;
				data.content.questions[sqIndex].options = tmpConOptions;
			});
		}
		return data;
	}

	// # Render Method

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		// If it is the first time be called, it renders the basic outer html of
		// current activity.
		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate, this._json)
				.then(function () {
					// After the basic outer html is rendered, we cache some elements
					// that will be used later.
					me._$wrapper = me.$element.find(SEL_ACT_MCM_WRAP);
					return me.attachATAssetDom(me._json.content.questions);
				});
		}

		return this._htmlPromise.then(function () {
			return me.publish(TOPIC_MULTIPLE_CHOICE_MEDIA_LOAD, {
				_super: me
			});
		});
	}

	// ## Member Methods
	// Member methods are needed in order to correctly go through the whole process
	// of activity, now we are going to implements those members which will be called
	// at certain point of the activiting progress.
	var methods = {
		"sig/initialize": function onInitialize() {
			this.type(Widget.ACT_TYPE.EXERCISE);
			this.length(this._json.content.questions.length);
			filterData.call(this, this._json);
		},
		"sig/render": function onRender() {
			this.items().instantFeedback(true);
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);
			return this.signal('render');
		},
		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/multiple-choice-text/multiple-choice-text.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var txt = data.content.questions[this._index].txt;
	var texts = data.content.questions[this._index].options;
	var questionAudio = data.content.questions[this._index].audio;
	var autoWeightBtnBg = data._layoutType === "right";
o += "\n<div class=\"ets-act-mct ets-act-multiple ets-cf\">\n\t<div class=\"ets-act-mct-content\">\n\t\t<div class=\"ets-act-mt-top\">\n\t\t\t";if (questionAudio) { o += "\n\t\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t\t       data-src=\"" +questionAudio.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t\t       class=\"ets-ap\"></audio>\n\t\t\t\t</div></div>\n\t\t\t";}o += "\n\t\t\t<div class=\"ets-act-mt-title-container\">\n\t\t\t\t<span class=\"ets-act-mt-title\">" + txt + "</span>\n\t\t\t</div>\n\t\t</div>\n\t\t<ul class=\"ets-act-mct-options\">\n\t\t\t"; for (var i = 0;i < texts.length;i++) { o += "\n\t\t\t\t<li class=\"ets-act-mct-option\" data-at-id=\"" + texts[i]._id + "\" data-answer=\"" + texts[i]._id + "\" data-index=\"" +i+ "\">\n\t\t\t\t\t<div class=\"ets-table-hack\">\n\t\t\t\t\t\t<span>" + texts[i].txt + "</span>\n\t\t\t\t\t</div>\n\t\t\t\t\t"; if (autoWeightBtnBg) {o += "\n\t\t\t\t\t<span class=\"ets-act-mct-option-bg\"></span>\n\t\t\t\t\t";} o += "\n\t\t\t\t</li>\n\t\t\t"; } o += "\n\t\t</ul>\n\t</div>\n</div>"; return o; }; });
define('school-ui-activity/activity/multiple-choice-text/multiple-choice-text',[
	'jquery',
	'poly',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./multiple-choice-text.html'
], function MultipleChoiceTextModule($, poly, Widget, Interaction, tMCText) {
	"use strict";

	// declaire variables
	var CLS_ACT = "ets-act",
		CLS_CORRECT = "ets-correct",
		CLS_WRONG = "ets-wrong",
		CLS_DISABLED = "ets-disabled";

	var SEL_OPTION = ".ets-act-mct-option";

	var HUB = 'hub/';
	var TOPIC_MULTIPLE_CHOICE_TEXT_LOAD = "activity/template/multiplechoicetext/load";

	var SHOW_CORRECTNESS_DURATION = 2000;

	// Constructor
	function Ctor() {

	}

	/**
	 * Shuffle origin json data
	 * # Templating and render
	 * @api private
	 */
	function render() {
		// TODO: Re-render according to this._json
		// Render widget
		var me = this,
			originData = me._json,
			quetionsData = originData.content.questions[me._index];

		me.optionWrongT = 0;
		me.selectIsCorrect = false;

		for (var j = 0; j < quetionsData.options.length; j++) {
			quetionsData.options[j].selected = false;
		}

		return me.html(tMCText, originData)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * # Init answers remaining
	 * @api private
	 */
	function onRendered() {
		var me = this;

		me.answersNum = 1;
	}

	var methods = ({
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			window.clearTimeout(this._correctTimer);
			window.clearTimeout(this.optionWrongT);
		},
		"dom:.ets-act-mct-option/click": function ($event) {
			//mark json data based on user's chose
			var me = this,
				$el = me.$element,
				$opTg = $($event.currentTarget),
				$options = $el.find(SEL_OPTION),
				currentQuestion = me._json.content.questions[me._index],
				item = me._item;

			if ($opTg.hasClass(CLS_CORRECT) || $opTg.hasClass(CLS_WRONG) || $opTg.hasClass(CLS_DISABLED) || me.optionWrongT != 0 || me.selectIsCorrect) {
				return;
			}
			//non-graded mode
			if (!me._hasScoring) {
				item.answered(true);
				if (me._index === me._length - 1) {
					item.completed(true);
					me._super.nextStep();
				}

				if ($opTg.hasClass(CLS_ACT)) {
					$opTg.removeClass(CLS_ACT);
					me.answersNum++;
				} else {
					$options.removeClass(CLS_ACT);
					$opTg.addClass(CLS_ACT);
					if (me.answersNum === 0) {
						return;
					} else {
						me.answersNum--;
					}
				}
			} else {//graded mode
				var selectOptionId = $opTg.data('answer');
				var correct = me.checkAnswer(selectOptionId);
				if (correct) {
					$opTg.addClass(CLS_CORRECT);
					me.selectIsCorrect = true;
				} else {
					$opTg.addClass(CLS_WRONG);
					me.optionWrongT = setTimeout(function () {
						$opTg.toggleClass(CLS_DISABLED + ' ' + CLS_WRONG);
						me.optionWrongT = 0;
					}, SHOW_CORRECTNESS_DURATION);
				}
			}
		},

		checkAnswer: function (selectOptionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, me._index, selectOptionId);
			var correct = interaction.correct;

			var promise = me._super.publishInteraction(interaction);

			if (correct) {
				promise.then(function () {
					var isLastQuestion = (me._index === me._length - 1);
					if (isLastQuestion) {
						me._json.content._isCorrect = true;
					}
					me._item.completed(true);
					me._correctTimer = setTimeout(function () {
						me._super.nextStep();
					}, isLastQuestion ? 0 : SHOW_CORRECTNESS_DURATION);
				});
			}

			return correct;
		}
	});

	methods[HUB + TOPIC_MULTIPLE_CHOICE_TEXT_LOAD] = function (options) {
		var me = this;

		me._super = options._super;
		me._json = me._super._json;
		me._item = me._super.items();
		me._index = me._super.index();
		me._length = me._super.length();
		me._hasScoring = me._super.hasScoring;
		me._optionsNum = me._json.content.questions[me._index].options.length;

		return me.signal('render');
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/multiple-choice-text/main.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var commonAudio = data.references.aud;
o += "\r\n<div class=\"ets-act-mt-container\">\r\n\t";if (commonAudio) { o += "\r\n\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\r\n\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\r\n\t\t\t       data-src=\"" +commonAudio.url+ "\" type=\"audio/mpeg\"\r\n\t\t\t       class=\"ets-ap ets-mt-com-ap\"></audio>\r\n\t\t</div></div>\r\n\t";}o += "\r\n\t<div class=\"ets-act-mct-wrap\" data-weave=\"school-ui-activity/activity/multiple-choice-text/multiple-choice-text\">\r\n\t</div>\r\n</div>"; return o; }; });
define('school-ui-activity/activity/multiple-choice-text/main',[
	'jquery',
	'when',
	'underscore',
	'../base/main',
	'./multiple-choice-text',
	'template!./main.html'
], function MultipleChoiceModule($, when, _, Widget, MultipleChoiceText, tTemplate) {
	"use strict";

	// declaire variables
	var SEL_ACT_MCT_WRAP = ".ets-act-mct-wrap",
		CLS_ACTIVITY_RIGHT = "ets-act-activity-right",
		LAYOUT_TYPE = "_layoutType";

	var TOPIC_MULTIPLE_CHOICE_TEXT_LOAD = "activity/template/multiplechoicetext/load";

	function Ctor($element, name, options) {
		options[LAYOUT_TYPE] === "right" && $element.addClass(CLS_ACTIVITY_RIGHT);
		this._json[LAYOUT_TYPE] = options[LAYOUT_TYPE];
	}

	/**
	 * Filter source data
	 * # Shuffle Shuffle question & text items
	 * # Random and select specified numbers of options
	 * @api private
	 */
	function filterData(data) {
		// TODO: restructuring json data for later rendering
		if (!data.content.questions) {
			throw "the json data can't find questions node in multiple-choice-text";
		}

		var oldData = this._json,
			filterOpNum = oldData.filterOptions.optionNo,
			isRandom = oldData.filterOptions.random,
			wrongNum,
			corNum,
			questionsData = oldData.content.questions,
			contOptions,
			scrOptions,
			tmpSrcOptions,
			tmpConOptions,
			tmpConOptKeys;

		if (!this.hasScoring && isRandom) {
			_.each(questionsData, function (qVal, qInd) {
				data.content.questions[qInd].options = _.shuffle(questionsData[qInd].options);
				if (filterOpNum < qVal.options.length) {
					data.content.questions[qInd].options.splice(filterOpNum, qVal.options.length - filterOpNum);
				}
			});
		} else {
			var scoringData = oldData.scoring.questions;
			_.each(scoringData, function (sqValue, sqIndex) {
				contOptions = isRandom ? _.shuffle(questionsData[sqIndex].options) : questionsData[sqIndex].options;
				scrOptions = isRandom ? _.shuffle(sqValue.options) : sqValue.options;
				tmpSrcOptions = [];
				tmpConOptKeys = [];
				tmpConOptions = [];
				corNum = 1;
				wrongNum = filterOpNum - corNum;
				_.each(scrOptions, function (opVal) {
					if ((opVal.selected && corNum && corNum--) || (!opVal.selected && wrongNum && wrongNum--)) {
						tmpSrcOptions.push(opVal);
						tmpConOptKeys.push(opVal._id);
					}
				});
				_.each(contOptions, function (val) {
					if (_.indexOf(tmpConOptKeys, val._id) >= 0) {
						tmpConOptions.push(val);
					}
				});
				data.scoring.questions[sqIndex].options = tmpSrcOptions;
				data.content.questions[sqIndex].options = tmpConOptions;
			});
		}
		return data;
	}

	// # Render Method

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		// If it is the first time be called, it renders the basic outer html of
		// current activity.
		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate, this._json)
				.then(function () {
					// After the basic outer html is rendered, we cache some elements
					// that will be used later.
					me._$wrapper = me.$element.find(SEL_ACT_MCT_WRAP);
					return me.attachATAssetDom(me._json.content.questions);
				});
		}

		return this._htmlPromise
			.then(function () {
				return me.publish(TOPIC_MULTIPLE_CHOICE_TEXT_LOAD, {
					_super: me
				});
			});
	}


	// ## Member Methods
	// Member methods are needed in order to correctly go through the whole process
	// of activity, now we are going to implements those members which will be called
	// at certain point of the activiting progress.
	var methods = {
		"sig/initialize": function onInitialize() {
			this.type(Widget.ACT_TYPE.EXERCISE);
			this.length(this._json.content.questions.length);

			filterData.call(this, this._json);
		},
		"sig/render": function onRender() {
			this.items().instantFeedback(true);
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);
			return this.signal('render');
		}
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/multiple-select-media/multiple-select-media.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var txt = data.content.questions[this._index].txt;
	var medias = data.content.questions[this._index].options;
	var questionAudio = data.content.questions[this._index].audio;
o += "\r\n<div class=\"ets-act-msm ets-act-multiple ets-cf\">\r\n\t<div class=\"ets-act-msm-content\">\r\n\t\t<div class=\"ets-act-mt-top\">\r\n\t\t\t";if (questionAudio) { o += "\r\n\t\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\r\n\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\r\n\t\t\t\t           data-src=\"" +questionAudio.url+ "\" type=\"audio/mpeg\"\r\n\t\t\t\t           class=\"ets-ap\"></audio>\r\n\t\t\t\t</div></div>\r\n\t\t\t";}o += "\r\n\t\t\t<div class=\"ets-act-mt-title-container\">\r\n\t\t\t\t<span class=\"ets-act-mt-title\">" + txt + "</span>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<ul class=\"ets-act-msm-options\">\r\n\t\t\t"; for (var i= 0;i< medias.length;i++) {o += "\r\n\t\t\t\t<li class=\"ets-act-msm-option\" data-at-id=\"" + medias[i]._id + "\" data-answer=\"" + medias[i]._id + "\" data-index=\"" +i+ "\">\r\n\t\t\t\t\t<img src=\"" + medias[i].image.url + "\" width=\"162\"  height=\"117\"/>\r\n\t\t\t\t\t<span class=\"ets-icon-correct-s ets-none\"></span>\r\n\t\t\t\t\t<span class=\"ets-icon-incorrect-s ets-none\"></span>\r\n\t\t\t\t</li>\r\n\t\t\t"; } o += "\r\n\t\t\t<div class=\"ets-ar ets-clear\"></div>\r\n\t\t</ul>\r\n\t</div>\r\n</div>"; return o; }; });
define('school-ui-activity/activity/multiple-select-media/multiple-select-media',[
	'jquery',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./multiple-select-media.html'
], function MultipleSelectMediaModule($, poly, when, Widget, Interaction, tMSMedia) {
	"use strict";

	// declaire variables
	var CLS_ACT = "ets-act",
		CLS_CORRECT = "ets-correct",
		CLS_WRONG = "ets-wrong",
		CLS_DISABLED = "ets-disabled",
		CLS_ANIMATE = "ets-animate",
		CLS_NONE = "ets-none",
		CLS_MT_LAY = "ets-act-mt-lay",
		CLS_MT_SINGLE_LAY = "ets-act-mt-single-lay",
		CLS_MT_COMMON_LAY = "ets-act-mt-common-lay",
		CLS_MT_AP_CONTENT_GAP = "ets-act-mt-ap-content-gap";

	var SEL_AR = ".ets-ar",
		SEL_OPTION = ".ets-act-msm-option",
		SEL_ICON_CORRECT = ".ets-icon-correct-s",
		SEL_ICON_INCORRECT = ".ets-icon-incorrect-s",
		SEL_MSM_OPTIONS = ".ets-act-msm-options",
		SEL_ACT_MSM_CONTENT = ".ets-act-msm-content";

	var SWITCH_ANSWERS_NUM = "rolling-number/switch-answers-num";
	var HUB = 'hub/';
	var TOPIC_MULTIPLE_SELECT_MEDIA_LOAD = "activity/template/multipleselectmedia/load";

	var SHOW_CORRECTNESS_DURATION = 2000;

	// Constructor
	function Ctor() {

	}

	/**
	 * Shuffle origin json data
	 * # Templating and render
	 * @api private
	 */
	function render() {
		// TODO: Re-render according to this._json
		// Render widget
		var me = this,
			originData = me._json,
			quetionsData = originData.content.questions[me._index],
			answersScroNum = 0;

		me.optionWrongT = 0;
		me.selectIsCorrect = false;
		me._onlyOneAnswer = false;

		for (var j = 0; j < quetionsData.options.length; j++) {
			quetionsData.options[j].selected = false;
		}

		if (me._hasScoring) {
			var scoringOptions = originData.scoring.questions[me._index].options;
			for (var i = 0; i < scoringOptions.length; i++) {
				if (scoringOptions[i].selected) {
					answersScroNum++;
				}
			}
		}

		me.answersNum = Math.min(originData.filterOptions.correctOptionNo, answersScroNum);

		return me.html(tMSMedia, originData);
	}

	/**
	 * On activity rendered:
	 * # Init answers remaining
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = me.$element,
			commonAudio = me._json.references.aud;

		switch (me._optionsNum) {
			case 2 :
			case 4 :
				$el.find(SEL_MSM_OPTIONS).addClass(CLS_MT_LAY);
				break;
			case 1 :
				$el.find(SEL_MSM_OPTIONS).addClass(CLS_MT_SINGLE_LAY);
				break;
			default :
				$el.find(SEL_MSM_OPTIONS).addClass(CLS_MT_COMMON_LAY);
				break;
		}

		if (commonAudio) {
			$el.find(SEL_ACT_MSM_CONTENT).addClass(CLS_MT_AP_CONTENT_GAP);
		}

		if (!me._hasScoring || me.answersNum === 1) {
			$el.find(SEL_AR).addClass(CLS_NONE);
			me._onlyOneAnswer = true;
			return when.resolve();
		} else {
			//Init answers remainning
			return $el.find(SEL_AR)
				.data("setting", {
					length: 2
				})
				.attr("data-weave", "school-ui-activity/shared/rolling-number/main(setting)")
				.attr("data-at-id", "pnl-answer-remaining")
				.weave()
				.then(function () {
					$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "reset", step: me.answersNum });
				});
		}
	}

	var methods = ({
		'sig/finalize': function onFinalize() {
			window.clearTimeout(this._correctTimer);
			window.clearTimeout(this.optionWrongT);
		},
		"dom:.ets-act-msm-option/click": function ($event) {
			//mark json data based on user's chose
			var me = this,
				$el = me.$element,
				$opTg = $($event.currentTarget),
				$options = $el.find(SEL_OPTION),
				item = me._item;

			if ($opTg.hasClass(CLS_CORRECT) || $opTg.hasClass(CLS_WRONG) || $opTg.hasClass(CLS_DISABLED) || me.optionWrongT != 0 || me.selectIsCorrect || $opTg.hasClass(CLS_ANIMATE)) {
				return;
			}
			//non-graded mode
			if (!me._hasScoring) {
				$opTg.toggleClass(CLS_ACT);
				item.answered(true);
				if (me._index === me._length - 1) {
					item.completed(true);
					me._super.nextStep();
				}
			} else {//graded mode
				var selectOptionId = $opTg.data('answer');
				var checkResult = me.checkAnswer(selectOptionId);
				if (checkResult.correct) {
					if (!me._onlyOneAnswer) {
						$options.addClass(CLS_ANIMATE);
						$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "sub", step: 1 });
						$options.removeClass(CLS_ANIMATE);
					}

					$opTg.addClass(CLS_CORRECT);
					$opTg.find(SEL_ICON_CORRECT).removeClass(CLS_NONE);

					me.answersNum--;
					if (me.answersNum === 0) {
						me.selectIsCorrect = true;
						var isLastQuestion = (me._index === me._length - 1);
						if (isLastQuestion) {
							me._json.content._isCorrect = true;
						}
						checkResult.promise.then(function () {
							me._item.completed(true);
							me._correctTimer = setTimeout(function () {
								me._super.nextStep();
							}, isLastQuestion ? 0 : SHOW_CORRECTNESS_DURATION);
						});
					}
				} else {
					if (!me._onlyOneAnswer) {
						$options.addClass(CLS_ANIMATE);
						$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "sub", step: 1 });
						$options.removeClass(CLS_ANIMATE);
					}

					$opTg.addClass(CLS_WRONG);
					$opTg.find(SEL_ICON_INCORRECT).removeClass(CLS_NONE);
					me.optionWrongT = setTimeout(function () {
						if (!me._onlyOneAnswer) {
							$options.addClass(CLS_ANIMATE);
							$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "add", step: 1 });
							$options.removeClass(CLS_ANIMATE);
						}

						$opTg.toggleClass(CLS_DISABLED + ' ' + CLS_WRONG);
						$opTg.find(SEL_ICON_INCORRECT).addClass(CLS_NONE);
						me.optionWrongT = 0;
					}, SHOW_CORRECTNESS_DURATION);
				}
			}
		},

		checkAnswer: function (selectOptionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, me._index, selectOptionId);
			var correct = interaction.correct;

			var promise = me._super.publishInteraction(interaction);

			return {
				correct: correct,
				promise: promise
			};
		}
	});

	methods[HUB + TOPIC_MULTIPLE_SELECT_MEDIA_LOAD] = function (options) {
		var me = this;

		me._super = options._super;
		me._json = me._super._json;
		me._item = me._super.items();
		me._index = me._super.index();
		me._length = me._super.length();
		me._hasScoring = me._super.hasScoring;
		me._optionsNum = me._json.content.questions[me._index].options.length;

		return render.call(me)
			.then(onRendered.bind(me));
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/multiple-select-media/main.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var commonAudio = data.references.aud;
o += "\r\n<div class=\"ets-act-mt-container\">\r\n\t";if (commonAudio) { o += "\r\n\t\t<div class=\"ets-table-hack\">\r\n\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\r\n\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\r\n\t\t\t\t       data-src=\"" +commonAudio.url+ "\" type=\"audio/mpeg\"\r\n\t\t\t\t       class=\"ets-ap ets-com-ap\"></audio>\r\n\t\t\t</div></div>\r\n\t\t</div>\r\n\t";}o += "\r\n\t<div class=\"ets-act-msm-wrap\" data-weave=\"school-ui-activity/activity/multiple-select-media/multiple-select-media\">\r\n\t</div>\r\n</div>"; return o; }; });
define('school-ui-activity/activity/multiple-select-media/main',[
	'jquery',
	'underscore',
	'when',
	'../base/main',
	'./multiple-select-media',
	'template!./main.html'
], function MultipleSelectModule($, _, when, Widget, MultipleSelectMedia, tTemplate) {
	"use strict";

	// declaire variables
	var SEL_ACT_MSM_WRAP = ".ets-act-msm-wrap";

	var TOPIC_MULTIPLE_SELECT_MEDIA_LOAD = "activity/template/multipleselectmedia/load";

	function Ctor() {
	}

	/**
	 * Filter source data
	 * # Shuffle question & media items
	 * # Random and select specified numbers of options
	 * @api private
	 */
	function filterData(data) {
		if (!data.content.questions) {
			throw "the json data can't find questions node in multiple-select-media";
		}

		var oldData = this._json,
			filterOpNum = oldData.filterOptions.optionNo,
			wrongNum,
			corNum,
			questionsData = oldData.content.questions,
			contOptions,
			scrOptions,
			tmpSrcOptions,
			tmpConOptions,
			tmpConOptKeys;

		if (!this.hasScoring) {
			_.each(questionsData, function (qVal, qInd) {
				data.content.questions[qInd].options = _.shuffle(questionsData[qInd].options);
				if (filterOpNum < qVal.options.length) {
					data.content.questions[qInd].options.splice(filterOpNum, qVal.options.length - filterOpNum);
				}
			});
		} else {
			var scoringData = oldData.scoring.questions;
			_.each(scoringData, function (sqValue, sqIndex) {
				contOptions = _.shuffle(questionsData[sqIndex].options);
				scrOptions = _.shuffle(sqValue.options);
				tmpSrcOptions = [];
				tmpConOptKeys = [];
				tmpConOptions = [];
				corNum = oldData.filterOptions.correctOptionNo;
				wrongNum = filterOpNum - corNum;
				_.each(scrOptions, function (opVal) {
					if ((opVal.selected && corNum && corNum--) || (!opVal.selected && wrongNum && wrongNum--)) {
						tmpSrcOptions.push(opVal);
						tmpConOptKeys.push(opVal._id);
					}
				});
				_.each(contOptions, function (val) {
					if (_.indexOf(tmpConOptKeys, val._id) >= 0) {
						tmpConOptions.push(val);
					}
				});
				data.scoring.questions[sqIndex].options = tmpSrcOptions;
				data.content.questions[sqIndex].options = tmpConOptions;
			});
		}

		return data;
	}

	// # Render Method

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		// If it is the first time be called, it renders the basic outer html of
		// current activity.
		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate, this._json)
				.then(function () {
					// After the basic outer html is rendered, we cache some elements
					// that will be used later.
					me._$wrapper = me.$element.find(SEL_ACT_MSM_WRAP);
					return me.attachATAssetDom(me._json.content.questions);
				});
		}

		return this._htmlPromise
			.then(function () {
				me.publish(TOPIC_MULTIPLE_SELECT_MEDIA_LOAD, {
					_super: me
				});
			});
	}

	// ## Member Methods
	// Member methods are needed in order to correctly go through the whole process
	// of activity, now we are going to implements those members which will be called
	// at certain point of the activiting progress.
	var methods = {
		"sig/initialize": function onInitialize() {
			this.type(Widget.ACT_TYPE.EXERCISE);
			this.length(this._json.content.questions.length);

			filterData.call(this, this._json);
		},
		"sig/render": function onRender() {
			this.items().instantFeedback(true);
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);
			return this.signal('render');
		},
		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/multiple-select-text/multiple-select-text.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var txt = data.content.questions[this._index].txt;
	var texts = data.content.questions[this._index].options;
	var questionAudio = data.content.questions[this._index].audio;
	var autoWeightBtnBg = data._layoutType === "right";
o += "\n<div class=\"ets-act-mst ets-act-multiple ets-cf\">\n\t<div class=\"ets-act-mst-content\">\n\t\t<div class=\"ets-act-mt-top\">\n\t\t\t";if (questionAudio) { o += "\n\t\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t           data-src=\"" +questionAudio.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t           class=\"ets-ap\"></audio>\n\t\t\t\t</div></div>\n\t\t\t";}o += "\n\t\t\t<div class=\"ets-act-mt-title-container\">\n\t\t\t\t<span class=\"ets-act-mt-title\">" + txt + "</span>\n\t\t\t</div>\n\t\t</div>\n\t\t<ul class=\"ets-act-mst-options\">\n\t\t\t"; for (var i = 0;i < texts.length;i++) { o += "\n\t\t\t\t<li class=\"ets-act-mst-option\" data-at-id=\"" + texts[i]._id + "\" data-answer=\"" + texts[i]._id + "\" data-index=\"" +i+ "\">\n\t\t\t\t\t<div class=\"ets-table-hack\">\n\t\t\t\t\t\t<span>" + texts[i].txt + "</span>\n\t\t\t\t\t</div>\n\t\t\t\t\t"; if (autoWeightBtnBg) {o += "\n\t\t\t\t\t<span class=\"ets-act-mst-option-bg\"></span>\n\t\t\t\t\t";} o += "\n\t\t\t\t</li>\n\t\t\t"; } o += "\n\t\t\t<div class=\"ets-ar ets-clear\"></div>\n\t\t</ul>\n\t</div>\n</div>"; return o; }; });
define('school-ui-activity/activity/multiple-select-text/multiple-select-text',['jquery',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./multiple-select-text.html'
], function MultipleSelectTextModule($, poly, when, Widget, Interaction, tMSText) {
	"use strict";

	// declare variables
	var CLS_ACT = "ets-act",
		CLS_NONE = "ets-none",
		CLS_CORRECT = "ets-correct",
		CLS_WRONG = "ets-wrong",
		CLS_DISABLED = "ets-disabled",
		CLS_ANIMATE = "ets-animate";

	var SEL_AR = ".ets-ar",
		SEL_OPTION = ".ets-act-mst-option";

	var LAYOUT_TYPE = "_layoutType";

	var SWITCH_ANSWERS_NUM = "rolling-number/switch-answers-num";
	var HUB = 'hub/';
	var TOPIC_MULTIPLE_SELECT_TEXT_LOAD = "activity/template/multipleselecttext/load";

	var SHOW_CORRECTNESS_DURATION = 2000;

	// Constructor
	function Ctor() {

	}

	/**
	 * Shuffle origin json data
	 * # Templating and render
	 * @api private
	 */
	function render() {
		// TODO: Re-render according to this._json
		// Render widget
		var me = this,
			originData = me._json,
			quetionsData = originData.content.questions[me._index],
			answersScroNum = 0;

		me.optionWrongT = 0;
		me.selectIsCorrect = false;
		me._onlyOneAnswer = false;

		for (var j = 0; j < quetionsData.options.length; j++) {
			quetionsData.options[j].selected = false;
		}

		if (me._hasScoring) {
			var scoringOptions = originData.scoring.questions[me._index].options;
			for (var i = 0; i < scoringOptions.length; i++) {
				if (scoringOptions[i].selected) {
					answersScroNum++;
				}
			}
		}

		me.answersNum = Math.min(originData.filterOptions.correctOptionNo, answersScroNum);

		return me.html(tMSText, originData);
	}

	/**
	 * On activity rendered:
	 * # Init answers remaining
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = me.$element;

		if (!me._hasScoring || me.answersNum === 1) {
			$el.find(SEL_AR).addClass(CLS_NONE);
			me._onlyOneAnswer = true;
			return when.resolve();
		} else {
			//Init answers remainning
			return $el.find(SEL_AR)
				.data("setting", {
					length: 2,
					type: this._json[LAYOUT_TYPE] === "right" ? "white" : "gray"
				})
				.attr("data-weave", "school-ui-activity/shared/rolling-number/main(setting)")
				.attr("data-at-id", "pnl-answer-remaining")
				.weave()
				.then(function () {
					$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "reset", step: me.answersNum });
				});
		}
	}

	var methods = ({
		'sig/finalize': function onFinalize() {
			window.clearTimeout(this._correctTimer);
			window.clearTimeout(this.optionWrongT);
		},
		"dom:.ets-act-mst-option/click": function ($event) {
			//mark json data based on user's chose
			var me = this,
				$el = me.$element,
				$opTg = $($event.currentTarget),
				$options = $el.find(SEL_OPTION),
				item = me._item;

			if ($opTg.hasClass(CLS_CORRECT) || $opTg.hasClass(CLS_WRONG) || $opTg.hasClass(CLS_DISABLED) || me.optionWrongT != 0 || me.selectIsCorrect || $opTg.hasClass(CLS_ANIMATE)) {
				return;
			}
			//non-graded mode
			if (!me._hasScoring) {
				$opTg.toggleClass(CLS_ACT);
				item.answered(true);
				if (me._index === me._length - 1) {
					item.completed(true);
					me._super.nextStep();
				}
			} else {//graded mode
				var selectOptionId = $opTg.data('answer');
				var checkResult = me.checkAnswer(selectOptionId);
				if (checkResult.correct) {
					if (!me._onlyOneAnswer) {
						$options.addClass(CLS_ANIMATE);
						$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "sub", step: 1 });
						$options.removeClass(CLS_ANIMATE);
					}

					$opTg.addClass(CLS_CORRECT);

					me.answersNum--;
					if (me.answersNum === 0) {
						me.selectIsCorrect = true;
						var isLastQuestion = (me._index === me._length - 1);
						if (isLastQuestion) {
							me._json.content._isCorrect = true;
						}
						checkResult.promise.then(function () {
							me._item.completed(true);
							me._correctTimer = setTimeout(function () {
								me._super.nextStep();
							}, isLastQuestion ? 0 : SHOW_CORRECTNESS_DURATION);
						});
					}
				} else {
					if (!me._onlyOneAnswer) {
						$options.addClass(CLS_ANIMATE);
						$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "sub", step: 1 });
						$options.removeClass(CLS_ANIMATE);
					}

					$opTg.addClass(CLS_WRONG);
					me.optionWrongT = setTimeout(function () {
						if (!me._onlyOneAnswer) {
							$options.addClass(CLS_ANIMATE);
							$el.find(SEL_AR).trigger(SWITCH_ANSWERS_NUM, { action: "add", step: 1 });
							$options.removeClass(CLS_ANIMATE);
						}

						$opTg.toggleClass(CLS_DISABLED + ' ' + CLS_WRONG);
						me.optionWrongT = 0;
					}, SHOW_CORRECTNESS_DURATION);
				}
			}
		},

		checkAnswer: function (selectOptionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, me._index, selectOptionId);
			var correct = interaction.correct;

			var promise = me._super.publishInteraction(interaction);

			return {
				correct: correct,
				promise: promise
			};
		}
	});

	methods[HUB + TOPIC_MULTIPLE_SELECT_TEXT_LOAD] = function (options) {
		var me = this;

		me._super = options._super;
		me._json = me._super._json;
		me._item = me._super.items();
		me._index = me._super.index();
		me._length = me._super.length();
		me._hasScoring = me._super.hasScoring;
		me._optionsNum = me._json.content.questions[me._index].options.length;

		return render.call(me)
			.then(onRendered.bind(me));
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/multiple-select-text/main.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var commonAudio = data.references.aud;
o += "\r\n<div class=\"ets-act-mt-container\">\r\n\t";if (commonAudio) { o += "\r\n\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\r\n\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\r\n\t\t           data-src=\"" +commonAudio.url+ "\" type=\"audio/mpeg\"\r\n\t\t           class=\"ets-ap ets-mt-com-ap\"></audio>\r\n\t\t</div></div>\r\n\t";}o += "\r\n\t<div class=\"ets-act-mst-wrap\" data-weave=\"school-ui-activity/activity/multiple-select-text/multiple-select-text\">\r\n\t</div>\r\n</div>"; return o; }; });
define('school-ui-activity/activity/multiple-select-text/main',[
	'jquery',
	'underscore',
	'when',
	'../base/main',
	'./multiple-select-text',
	'template!./main.html'
], function MultipleSelectModule($, _, when, Widget, MultipleSelectText, tTemplate) {
	"use strict";

	// declare variables
	var SEL_ACT_MST_WRAP = ".ets-act-mst-wrap",
		CLS_ACTIVITY_RIGHT = "ets-act-activity-right",
		LAYOUT_TYPE = "_layoutType";

	var TOPIC_MULTIPLE_SELECT_TEXT_LOAD = "activity/template/multipleselecttext/load";

	function Ctor($element, name, options) {
		options[LAYOUT_TYPE] === "right" && $element.addClass(CLS_ACTIVITY_RIGHT);
		this._json[LAYOUT_TYPE] = options[LAYOUT_TYPE];
	}

	/**
	 * Filter source data
	 * # Shuffle question & text items
	 * # Random and select specified numbers of options
	 * @api private
	 */
	function filterData(data) {
		// TODO: restructuring json data for later rendering
		if (!data.content.questions) {
			throw "the json data can't find questions node in multiple-select-text";
		}

		var oldData = this._json,
			filterOpNum = oldData.filterOptions.optionNo,
			isRandom = oldData.filterOptions.random,
			wrongNum,
			corNum,
			questionsData = oldData.content.questions,
			contOptions,
			scrOptions,
			tmpSrcOptions,
			tmpConOptions,
			tmpConOptKeys;

		if (!this.hasScoring && isRandom) {
			_.each(questionsData, function (qVal, qInd) {
				data.content.questions[qInd].options = _.shuffle(questionsData[qInd].options);
				if (filterOpNum < qVal.options.length) {
					data.content.questions[qInd].options.splice(filterOpNum, qVal.options.length - filterOpNum);
				}
			});
		} else {
			var scoringData = oldData.scoring.questions;
			_.each(scoringData, function (sqValue, sqIndex) {
				contOptions = isRandom ? _.shuffle(questionsData[sqIndex].options) : questionsData[sqIndex].options;
				scrOptions = isRandom ? _.shuffle(sqValue.options) : sqValue.options;
				tmpSrcOptions = [];
				tmpConOptKeys = [];
				tmpConOptions = [];
				corNum = oldData.filterOptions.correctOptionNo;
				wrongNum = filterOpNum - corNum;
				_.each(scrOptions, function (opVal) {
					if ((opVal.selected && corNum && corNum--) || (!opVal.selected && wrongNum && wrongNum--)) {
						tmpSrcOptions.push(opVal);
						tmpConOptKeys.push(opVal._id);
					}
				});
				_.each(contOptions, function (val) {
					if (_.indexOf(tmpConOptKeys, val._id) >= 0) {
						tmpConOptions.push(val);
					}
				});
				data.scoring.questions[sqIndex].options = tmpSrcOptions;
				data.content.questions[sqIndex].options = tmpConOptions;
			});
		}
		return data;
	}

	// # Render Method

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		// If it is the first time be called, it renders the basic outer html of
		// current activity.
		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate, me._json)
				.then(function () {
					// After the basic outer html is rendered, we cache some elements
					// that will be used later.
					me._$wrapper = me.$element.find(SEL_ACT_MST_WRAP);
					return me.attachATAssetDom(me._json.content.questions);
				});
		}

		return this._htmlPromise
			.then(function () {
				return me.publish(TOPIC_MULTIPLE_SELECT_TEXT_LOAD, {
					_super: me
				});
			});
	}

	// ## Member Methods
	// Member methods are needed in order to correctly go through the whole process
	// of activity, now we are going to implements those members which will be called
	// at certain point of the activiting progress.
	var methods = {
		"sig/initialize": function onInitialize() {
			this.type(Widget.ACT_TYPE.EXERCISE);
			this.length(this._json.content.questions.length);

			filterData.call(this, this._json);
		},
		"sig/render": function onRender() {
			this.items().instantFeedback(true);
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);
			return this.signal('render');
		},
		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/no-template/no-template.html',[],function() { return function template(data) { var o = "<div>\n\t<p>Activity not available now. Please skip this activity to continue.</p>\n</div>"; return o; }; });
define('school-ui-activity/activity/no-template/main',[
	'school-ui-activity/activity/base/main',
	"template!./no-template.html"
], function noTemplateModule(Widget, tTemplate) {
	"use strict";

	return Widget.extend({
		"sig/initialize": function onInitialize() {
			this.items().completed(true);
		},
		"sig/render": function onRender() {
			return this.html(tTemplate);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/activity/role-play-audio/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-rpa-wrap\" data-weave=\"school-ui-activity/activity/role-play-audio/role-play-audio\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity/activity/role-play-audio/role-play-audio.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var correctRequired = data.correctRequired;
	var data = data.data;
	
	var blurb = function(id,en){
	    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
	    return res;
	};
o += "\n\n\n<div class=\"ets-act-rpa\">\n\t<div class=\"ets-act-rpa-bd\">\n\t\t<div class=\"ets-act-rpa-side\">\n\t\t\t<div class=\"ets-act-rpa-questions\">\n\t\t\t\t<h4><span " +blurb(150634,"Question")+ "></span> <strong>1</strong> / " + data.content.questions.length+ "</h4>\n\t\t\t\t";
			        var items = data.content.questions;
			        for (var i = 0; i < items.length; i++) {
			            writeItem(items[i], i);
			        }
			    o += "\n\t\t\t</div>\n\t\t\t<div class=\"ets-act-rpa-mic ets-none\">\n\t\t\t\t<div data-weave=\"school-ui-activity/shared/asr/asr-ui\"></div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"ets-act-rpa-main\">\n\t\t\n\t\t\t<div class=\"ets-act-rpa-audio-overlay\"><span class=\"ets-act-rpa-audio-start\" data-at-id=\"btn-audio-start\"></span></div>\n\t\t\t<div class=\"ets-act-rpa-image\">\n\t\t\t\t";
			        var items = data.content.questions;
			        for (var i = 0; i < items.length; i++) {
			            writeImage(items[i], i);
			        }
			    o += "\n\t\t\t</div>\n\t\t\t<div class=\"ets-act-rpa-audio-player\">\n\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t       src=\"" +data.content.questions[0].audio.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t       class=\"ets-ap ets-ap-nobar\"></audio>\n\t\t\t</div>\n\t\t\t<div class=\"ets-act-rpa-audio-control\">\n\t\t\t\t<div class=\"ets-act-rpa-btn-replay\" data-at-id=\"replay\"><span " +blurb(467622,"Replay this segment")+ "></span></div>\n\t\t\t\t<div class=\"ets-act-rpa-btn-skip\" data-at-id=\"btn-skip\"><span " +blurb(467623,"Skip this segment")+ "></span></div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\n\t<!-- Activity Summary Start-->\n\t<div class=\"ets-act-summary-wrap\"></div>\n\t<!-- Activity Summary End-->\n</div>\n\n"; function writeItem(data, i) { 
		var m = i + 1;
		var mapIndexes = {
			'0' : 'A',
			'1' : 'B',
			'2' : 'C',
			'3' : 'D',
			'4' : 'E',
			'5' : 'F'
		};
		o += "\n\t\t<ul class=\"ets-act-rpa-question\" data-order=\"" + m+ "\" data-id=\"" + data._id+ "\" data-at-id=\"" + data._id+ "\" data-start-time=\"" + data.startTime+ "\" data-end-time=\"" + data.endTime+ "\">\n\t\t\t";
		        var options = data.options;
		        for (var j = 0; j < options.length; j++) {
		        	var n = j + 1;o += "\n\t\t            <li class=\"ets-act-rpa-answer ets-nth-" + n+ "\" data-id=\"" + options[j]._id+ "\" data-at-id=\"" + data._id+ "_" + options[j]._id+ "\"><b>" +mapIndexes[j]+ "</b><i class=\"ets-mark-correct\"></i><i class=\"ets-mark-incorrect\"></i><span>" + options[j].txt+ "</span></li>\n\t\t    ";}o += "\n\t\t\t\n\t\t</ul>\n"; } o += "\n\n"; function writeImage(data, i) {
		o += "\n\t\t<img src=\"" +data.image.url+ "\" alt=\"\" width=\"640\" height=\"360\" data-index='" +i+ "' />\n"; }  return o; }; });
define('school-ui-activity/activity/role-play-audio/role-play-audio',[
	"jquery",
	"jquery.ui",
	"poly",
	"troopjs-ef/component/widget",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./role-play-audio.html",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states"
], function ($, ui$, poly, Widget, Scoring, Interaction, tTemplate, ratingSouceType, MSGType, ASRUIStatus) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_ACT_BODY = ".ets-act-rpa-bd",
		SEL_AUDIO = ".ets-ap",
		SEL_MAIN = ".ets-act-rpa-main",
		SEL_SIDE = ".ets-act-rpa-side",
		SEL_IMAGE = ".ets-act-rpa-image img",
		SEL_QUESTION = ".ets-act-rpa-question",
		SEL_ANSWER = ".ets-act-rpa-answer",
		SEL_BTN_START = ".ets-act-rpa-audio-start",
		SEL_BTN_REPLAY = ".ets-act-rpa-btn-replay",
		SEL_BTN_SKIP = ".ets-act-rpa-btn-skip",
		SEL_QUESTIONS = ".ets-act-rpa-questions",
		SEL_QUESTION_ACTIVE = ".ets-act-rpa-question.ets-active",
		SEL_QUESTION_NUMBER = ".ets-act-rpa-questions h4 strong",
		SEL_ASR_CONTAINER = ".ets-act-rpa-mic > div",
		SEL_RPA_MIC = ".ets-act-rpa-mic",
		SEL_AUDIO_CONTROL = ".ets-act-rpa-audio-control",
		SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap",

		CLS_CORRECT = "ets-correct",
		CLS_INCORRECT = "ets-incorrect",
		CLS_DISABLED = "ets-disabled",
		CLS_NONE = "ets-none",
		CLS_ACTIVE = "ets-active",
		CLS_SELECT_MODE = "ets-select-mode",
		FEEDBACK_DELAY = 1500,
		asrMode = ratingSouceType["ASR_SPEAKING"];

	var HUB_ASR_SET = "asr/ui/setting",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference";

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	function Ctor() {
		var me = this;
		me.answerMode = {};
		me.questionShown = false;
		me.isLastQuestion = false;
		me.isFirstQuestion = true;
		me.totalQuestions = {};
		/*Total question numbers*/
		me.currentQuestion = {};
		/*Current question*/
		me.currentQuestionIndex = {};
		me.$currentQuestion = {};
		me.correctCount = {};
		me.incorrectCount = {};
		me.correctRequired = {};
		me.asrDisabled = false;
		me.timeouts = [];
	}

	// # Render
	function render() {
		var me = this;
		var data = this._json;

		this.totalQuestions = this._json.content.questions.length;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		me.correctRequired = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * me.totalQuestions);
		me.correctCount = 0;
		me.incorrectCount = me.totalQuestions;

		return this.html(tTemplate, {data: data, correctRequired: me.correctRequired})
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * 1. Enable droppable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = this.$element,
			enableASRSwitch = !me.asrDisabled
				&& !me._json.asrDisabled
				&& window.location.search.indexOf("non-asr") < 0;

		me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.questions[0], {
			asrFallbackType: "SELECT",
			asrFallbackCb: switchAnswerMode.bind(me, "SELECT"),
			needResetASRFailedTimes: true,
			asrEnableTip: true
		});

		//Bind Start
		$el.find(SEL_BTN_START).click(function () {
			start.call(me);
		});

		$el.find(SEL_BTN_REPLAY).click(function () {
			if (!me.audioControlEnabled) {
				return;
			}
			me.publish("asr/ui/playback", false);
			replay.call(me);
		});

		$el.find(SEL_BTN_SKIP).click(function () {
			if (!me.audioControlEnabled) {
				return;
			}
			me.publish("asr/ui/playback", false);
			if (me.isNonGraded()) {
				moveOn.call(me);
			} else {
				me.publishSkipInteraction(me.currentQuestionIndex);
			}
		});

		//Init Activity
		init.call(me);

		if (!enableASRSwitch) {
			switchAnswerMode.call(me, "SELECT");
			asrMode = ratingSouceType["ASR_SELECTION"];
		}

		//Set current question index
		me.currentQuestionIndex = 0;

		//Set current question
		me.currentQuestion = me._json.content.questions[me.currentQuestionIndex];

		//Set current question jquery object
		me.$currentQuestion = $el.find(SEL_QUESTION_ACTIVE);

		$el.find(SEL_IMAGE).filter(function () {
			return $(this).data("index") == 0;
		}).show();
	}

	function onASRRecognized(asrResult) {
		var me = this;

		if (asrResult && asrResult.length > 0) {
			var $selectedOption = $(me.$currentQuestion.find(SEL_ANSWER).filter(function () {
				return $(this).data('id').split('_')[1] == asrResult[0].index;
			})[0]);
			var optionId = $selectedOption.data('id');

			//For non-grade activities, no check answer, mark correct and move on.
			if (me.isNonGraded()) {
				$selectedOption.addClass(CLS_CORRECT);
				disableRecord.call(me);

				var moveOnTimeout = setTimeout(function () {
					moveOn.call(me);
				}, FEEDBACK_DELAY);

				me.timeouts.push(moveOnTimeout);

				me.correctCount++;
				me.incorrectCount--;
			} else if (asrResult[0].score < 100) {
				//below threshold
				showASRMessage.call(me, "INCORRECT_PRONUN");
			} else {
				var correct = me.checkAnswer(me.currentQuestionIndex, optionId);
				me.displayInteractionResult(correct, $selectedOption, asrResult);
			}
		}
	}

	function switchAnswerMode(mode) {
		var me = this,
			$el = this.$element;

		switch (mode) {
			case 'ASR':
				me.answerMode = 'ASR';
				$el.find(SEL_ASR_CONTAINER).removeClass(CLS_NONE);
				$el.find(SEL_QUESTIONS).removeClass(CLS_SELECT_MODE);
				$el.find(SEL_QUESTIONS + " li").unbind('click');
				me._super.scoringType('asr');
				break;
			case 'SELECT':
			default:
				me.answerMode = 'SELECT';
				$el.find(SEL_ASR_CONTAINER).addClass(CLS_NONE);
				$el.find(SEL_QUESTIONS).addClass(CLS_SELECT_MODE);
				$el.find(SEL_QUESTIONS + " li").click(function () {
					onClickOption.call(me, $(this));
				});
				me._super.scoringType('default');
				break;
		}
	}

	function onClickOption($selectedOption) {
		var me = this;

		if ($selectedOption.hasClass(CLS_DISABLED) || me.optionFreezed) {
			return;
		}

		var optionId = $selectedOption.data("id");

		disableAudioControl.call(me);

		//For non-grade activities, no check answer, mark correct and move on.
		if (me.isNonGraded()) {
			me.optionFreezed = true;
			$selectedOption.addClass(CLS_CORRECT);
			disableRecord.call(me);

			var moveOnTimeout = setTimeout(function () {
				moveOn.call(me);
			}, FEEDBACK_DELAY);

			me.timeouts.push(moveOnTimeout);

			me.correctCount++;
			me.incorrectCount--;
		} else {
			var correct = me.checkAnswer(me.currentQuestionIndex, optionId);
			me.displayInteractionResult(correct, $selectedOption);
		}
	}

	function showQuestion() {
		var me = this,
			$el = this.$element;

		if (!me.questionShown) {
			me.questionShown = true;
			me.optionFreezed = false;
			if (me.isFirstQuestion) {
				$el.find(SEL_MAIN).animate({left: "0"}, 300);
				$el.find(SEL_SIDE).animate({right: "0"}, 300);
				me.isFirstQuestion = false;
			} else {
				//in ie8 , animation fadeout or fadein will cause png image has a black border.
				(navigator.userAgent.indexOf('MSIE 8.0') > 0) ?
					$el.find(SEL_SIDE).show() :
					$el.find(SEL_SIDE).fadeIn('slow');
			}
			$el.find(SEL_RPA_MIC).show();
		}
	}

	function hideQuestion() {
		var me = this,
			$el = this.$element;

		if (me.questionShown) {
			me.questionShown = false;
			//in ie8 , animation fadeout or fadein will cause png image has a black border.
			(navigator.userAgent.indexOf('MSIE 8.0') > 0) ?
				$el.find(SEL_SIDE).hide() :
				$el.find(SEL_SIDE).fadeOut('slow');
			$el.find(SEL_RPA_MIC).hide();
		}
	}

	function onSectionEnd() {
		var me = this,
			$el = this.$element;

		if (me.currentQuestionIndex < me.totalQuestions) {
			$el.find(SEL_AUDIO).trigger('player/pause');
			enableRecord.call(me);
			showQuestion.call(me);
			enableAudioControl.call(me);
			//for automation test
			$el.find(SEL_QUESTION + "[data-order=" + (me.currentQuestionIndex + 1) + "]")
				.attr("data-at-status", "shown");
		} else {
			me.actStarted = false;
			disableAudioControl.call(me);
		}

	}

	function enableAudioControl() {
		var me = this,
			$el = this.$element;
		$el.find(SEL_AUDIO_CONTROL).removeClass(CLS_DISABLED);
		me.audioControlEnabled = true;
	}

	function disableAudioControl() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_AUDIO_CONTROL).addClass(CLS_DISABLED);
		me.audioControlEnabled = false;
	}

	function enableRecord() {
		this.publish("asr/enable");

	}

	function disableRecord() {
		this.publish("asr/disable");

	}

	function start() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_AUDIO).trigger('player/play');
		$el.find(SEL_BTN_START).hide(0);
		me.actStarted = true;

		disableRecord.call(me);
		disableAudioControl.call(me);
		hideQuestion.call(me);
	}

	function replay() {
		var me = this,
			$el = this.$element;

		if (!me.audioControlEnabled) {
			return;
		}

		me.$currentQuestion = $el.find(SEL_QUESTION_ACTIVE);
		$el.find(SEL_AUDIO).trigger('player/play', me.currentQuestion.audio.url);

		disableRecord.call(me);
		disableAudioControl.call(me);
	}


	function moveOn() {
		var me = this,
			$el = this.$element;

		if (me.currentQuestionIndex + 1 < me.totalQuestions) {
			me.currentQuestionIndex++;
			me.currentQuestion = me._json.content.questions[me.currentQuestionIndex];

			var nextQuestionTimeout = setTimeout(function () {
				//Moveon to next question
				me.$currentQuestion.removeClass(CLS_ACTIVE).next().addClass(CLS_ACTIVE);
				me.$currentQuestion = me.$currentQuestion.next();

				$el.find(SEL_QUESTION_NUMBER).text(me.currentQuestionIndex + 1);
			}, 500);

			me.timeouts.push(nextQuestionTimeout);

			$el.find(SEL_IMAGE).hide();
			$el.find(SEL_IMAGE).filter(function () {
				return $(this).data("index") == me.currentQuestionIndex;
			}).show();

			$el.find(SEL_AUDIO).trigger('player/play', me.currentQuestion.audio.url);
			me.publish(HUB_ASR_SET,
				onASRRecognized.bind(me),
				me.currentQuestion,
				{
					asrEnableTip: true
				});

			disableRecord.call(me);
			disableAudioControl.call(me);
			hideQuestion.call(me);

		} else {
			var nonGraded = me.isNonGraded();

			var passed;
			if (nonGraded) {
				passed = true;
			} else {
				passed = me.correctCount >= me.correctRequired;
				me._json.content._isCorrect = passed;
			}

			$el.find(SEL_ACT_BODY).fadeOut(300, function () {
				$(this).addClass(CLS_NONE).removeAttr('style');
				viewSummary.call(me, passed);
			});


			if (nonGraded) {
				me._item.answered(true);
			} else {
				me._item.completed(true);
			}
		}
	}

	var init = function () {
		var me = this,
			$el = this.$element;
		$el.find(SEL_QUESTION).removeClass(CLS_ACTIVE);
		$el.find(SEL_QUESTION + ":first").addClass(CLS_ACTIVE);
		$el.find(SEL_BTN_START).show(0);
		$el.find(SEL_QUESTION_NUMBER).text("1");
		this.actStarted = false;
		disableRecord.call(me);

		disableAudioControl.call(me);
	};

	function viewSummary(passed) {
		var me = this,
			$el = this.$element;

		//Render activity summary widget
		$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
			.data("settings",
			{
				passed: passed,
				correctNum: me.correctCount,
				skippedNum: me.incorrectCount,
				passNum: me.correctRequired
			})
			.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
			.weave();

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	function showASRMessage(msgType) {
		this.publish("asr/show/message", MSGType[msgType]);
	}


	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			//Clear timeouts when finalize
			$.each(this.timeouts, function (i, timeout) {
				window.clearTimeout(timeout);
			});
		},
		"sig/start": function () {
			var me = this;

			return me.query(CCL_ASR_ENABLED)
				.spread(function (asrEnabledCcl) {
					me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');
				});
		},
		"hub/activity/template/rpa/load": function (parent, options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;

			me._super = parent;

			// set instant feedback off
			me._item.instantFeedback(true);

			return me.signal('render');
		},
		"hub/asr/ui/states/changed": function (state) {
			var me = this;
			if (!state || !me.actStarted) return;
			switch (state) {
				case ASRUIStatus.RECORDING:
				case ASRUIStatus.PROCESSING:
				case ASRUIStatus.PREPARING:
				case ASRUIStatus.DISABLE:
					disableAudioControl.call(me);
					break;
				default:
					enableAudioControl.call(me);
					break;
			}
		},
		"hub/rating/sourceType": function () {
			return [asrMode];
		},
		"dom:.ets-ap/media/ended": function() {
			onSectionEnd.call(this);
		},
		checkAnswer: function (questionIndex, optionId) {
			var me = this;
			var interaction = Interaction.makeChoiceInteraction(me._json, questionIndex, optionId);
			var promise = me._super.publishInteraction(interaction);

			if (interaction.correct) {
				me.correctCount++;
				me.incorrectCount--;

				var moveOnTimeout = setTimeout(function () {
					promise.then(function(){
						moveOn.call(me);
					});
				}, FEEDBACK_DELAY);

				me.timeouts.push(moveOnTimeout);
			}

			return interaction.correct;
		},
		publishSkipInteraction: function(questionIndex) {
			var me = this;
			var questionId = me._json.content.questions[questionIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			me._super.publishInteraction(interaction)
				.then(function () {
					moveOn.call(me);
				});
		},
		displayInteractionResult: function (correct, $selectedOption, asrResult) {
			var me = this;

			me.optionFreezed = true;

			if (correct) {
				$selectedOption.addClass(CLS_CORRECT);
				disableRecord.call(me);
			} else {
				$selectedOption.addClass(CLS_INCORRECT);

				if (asrResult && !asrResult._hasError) {
					showASRMessage.call(me, "INCORRECT_ANSWER");
				}

				var retryTimeout = setTimeout(function () {
					$selectedOption.removeClass(CLS_INCORRECT).addClass(CLS_DISABLED);
					me.optionFreezed = false;

					if (!asrResult) {
						enableAudioControl.call(me);
					}
				}, FEEDBACK_DELAY);

				me.timeouts.push(retryTimeout);
			}
		},
		isNonGraded: function () {
			return this._super.type() == 3;
		}
	};

	return Widget.extend(Ctor, methods);
});

define('school-ui-activity/activity/role-play-audio/main',[
	'jquery',
	'when',
	'../base/main',
	'template!./main.html',
	'./role-play-audio'
], function activityTemplateModule($, when, Widget, tTemplate, rpa) {
	"use strict";

	var TOPIC_ACT_RPA_LOAD = "activity/template/rpa/load";

	function Ctor() {
		this.scoringType(Widget.SCORING_TYPE.ASR);
		this._htmlPromise = null;
	}

	function render() {
		var me = this;

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate());
		}

		var data = this._json;

		return this._htmlPromise
			.then(function () {
				return me.publish(TOPIC_ACT_RPA_LOAD, me, {
					item: me.items(),
					json: data
				});
			});
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			this.hasScoring || this.type(Widget.ACT_TYPE.PRACTICE);
			this.items().instantFeedback(true);

			this.length(1);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);

			return this.signal('render');
		},
		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/role-play-video/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-rpv-wrap\" data-weave=\"school-ui-activity/activity/role-play-video/role-play-video\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity/activity/role-play-video/role-play-video.html',[],function() { return function template(data) { var o = "";
	var data = data || {};
	var correctRequired = data.correctRequired;
	var data = data.data;
	
	var blurb = function(id,en){
	    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
	    return res;
	};
o += "\n\n\n<div class=\"ets-act-rpv\">\n\t<div class=\"ets-act-rpv-bd\">\n\t\t<div class=\"ets-act-rpv-side\">\n\t\t\t<div class=\"ets-act-rpv-questions\">\n\t\t\t\t<h4><span " +blurb(150634,"Question")+ "></span> <strong>1</strong> / " + data.content.questions.length+ "</h4>\n\t\t\t\t";
			        var items = data.content.questions;
			        for (var i = 0; i < items.length; i++) {
			            writeItem(items[i], i);
			        }
			    o += "\n\t\t\t</div>\n\t\t\t<div class=\"ets-act-rpv-mic ets-none\">\n\t\t\t\t<div data-weave=\"school-ui-activity/shared/asr/asr-ui\"></div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"ets-act-rpv-main\">\n\t\t\t<div class=\"ets-act-vp-wrap\"><!--<div data-weave=\"school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)\"></div>--></div>\n\t\t\t<div class=\"ets-act-rpv-video-control\">\n\t\t\t\t<div class=\"ets-act-rpv-btn-replay\" data-at-id=\"replay\"><span " +blurb(467622,"Replay this segment")+ "></span></div>\n\t\t\t\t<div class=\"ets-act-rpv-btn-skip\" data-at-id=\"btn-skip\"><span " +blurb(467623,"Skip this segment")+ "></span></div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t\n\t<!-- Activity Summary Start-->\n\t<div class=\"ets-act-summary-wrap\"></div>\n\t<!-- Activity Summary End-->\n\t\n</div>\n\n"; function writeItem(data, i) { 
		var m = i + 1;
		var mapIndexes = {
			'0' : 'A',
			'1' : 'B',
			'2' : 'C',
			'3' : 'D',
			'4' : 'E',
			'5' : 'F'
		};
		o += "\n\t\t<ul class=\"ets-act-rpv-question\" data-order=\"" + m+ "\" data-id=\"" + data._id+ "\" data-at-id=\"" + data._id+ "\" data-start-time=\"" + data.startTime+ "\" data-end-time=\"" + data.endTime+ "\">\n\t\t\t";
		        var options = data.options;
		        for (var j = 0; j < options.length; j++) {
		        	var n = j + 1;o += "\n\t\t            <li class=\"ets-act-rpv-answer ets-nth-" + n+ "\" data-id=\"" + options[j]._id+ "\" data-at-id=\"" + data._id+ "_" + options[j]._id+ "\"><b>" +mapIndexes[j]+ "</b><i class=\"ets-mark-correct\"></i><i class=\"ets-mark-incorrect\"></i><span>" + options[j].txt+ "</span></li>\n\t\t    ";}o += "\n\t\t\t\n\t\t</ul>\n"; }  return o; }; });
// # Task Module
define('school-ui-activity/activity/role-play-video/role-play-video',[
	"jquery",
	"jquery.ui",
	"jquery.easing",
	"poly",
	"troopjs-ef/component/widget",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"mediaelement-plugin-ef",
	"school-ui-activity/util/activity-util",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states",
	"school-ui-activity/util/content-converter",
	"template!./role-play-video.html"
], function (
	$,
	ui$,
	easing,
	poly,
	Widget,
	Scoring,
	Interaction,
	mejs,
	Util,
	ratingSouceType,
	MSGType,
	ASRUIStatus,
	converter,
	tTemplate
) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_ACT_BODY = ".ets-act-rpv-bd";
	var SEL_MAIN = ".ets-act-rpv-main";
	var SEL_SIDE = ".ets-act-rpv-side";
	var SEL_QUESTION = ".ets-act-rpv-question";
	var SEL_ANSWER = ".ets-act-rpv-answer";
	var SEL_QUESTIONS = ".ets-act-rpv-questions";
	var SEL_QUESTION_NUMBER = ".ets-act-rpv-questions h4 strong";
	var SEL_ASR_CONTAINER = ".ets-act-rpv-mic > div";
	var SEL_RPV_MIC = ".ets-act-rpv-mic";
	var SEL_VIDEO_CONTROL = ".ets-act-rpv-video-control";
	var SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap";
	var SEL_VIDEO_CONTAINER = ".ets-act-vp-wrap";

	var CLS_CORRECT = "ets-correct";
	var CLS_INCORRECT = "ets-incorrect";
	var CLS_DISABLED = "ets-disabled";
	var CLS_NONE = "ets-none";
	var CLS_ACTIVE = "ets-active";
	var CLS_SELECT_MODE = "ets-select-mode";
	var CLS_VP_PLAYED = "ets-vp-played";

	var FEEDBACK_DELAY = 1500;
	var MOVEON_DELAY = 500;
	var DURATION_ANIMATION = 300;

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	var HUB_ASR_SET = "asr/ui/setting",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference",
		asrMode = ratingSouceType["ASR_SPEAKING"];

	function Ctor() {
		var me = this;
		me.answerMode = {};
		me.questionShown = false;
		me.outOfLastQuestion = false;
		me.firstQuestionShown = false;
		me.questionCount = 0;
		me.currentQuestion = {};
		me.currentQuestionIndex = -1;
		me.$currentQuestion = {};
		me.correctCount = {};
		me.incorrectCount = {};
		me.correctRequired = {};
		me.mediaElement = {};
		me.asrDisabled = false;
		me.timeouts = [];
		me.actStarted = false;
	}

	// # Render
	function render() {
		var me = this;
		var data = this._json;

		this.questionCount = this._json.content.questions.length;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		me.correctRequired = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * me.questionCount);
		me.correctCount = 0;
		me.incorrectCount = me.questionCount;

		return this.html(tTemplate, {data: data, correctRequired: me.correctRequired})
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * 1. Enable droppable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this,
			enableASRSwitch = !me.asrDisabled
				&& !me._json.asrDisabled
				&& window.location.search.indexOf("non-asr") < 0;

		me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.questions[0], {
			asrFallbackType: "SELECT",
			asrEnableSwitch: enableASRSwitch,
			asrFallbackCb: switchAnswerMode.bind(me, "SELECT"),
			needResetASRFailedTimes: true,
			asrEnableTip: true
		});

		initVideoPlayer.call(me);

		//Init Activity
		disableRecord.call(me);
		disableVideoControl.call(me);

		if (!enableASRSwitch) {
			switchAnswerMode.call(me, "SELECT");
			asrMode = ratingSouceType["ASR_SELECTION"];
		}

		pointToQuestion.call(me, 0);
	}

	function pointToQuestion(index) {
		var me = this;
		var $el = me.$element;

		me.currentQuestionIndex = index;
		me.currentQuestion = me._json.content.questions[index];
		me.$currentQuestion = $el.find(SEL_QUESTION + ":eq(" + index + ")");
		$el.find(SEL_QUESTION_NUMBER).text(index + 1);
	}

	function onASRRecognized(asrResult) {
		var me = this;

		if (asrResult && asrResult.length > 0) {
			var $selectedOption = $(me.$currentQuestion.find(SEL_ANSWER).filter(function () {
				return $(this).data('id').split('_')[1] == asrResult[0].index;
			})[0]);
			var optionId = $selectedOption.data('id');

			if (asrResult[0].score < 100) {
				//below threshold
				showASRMessage.call(me, "INCORRECT_PRONUN");
			} else {
				var correct = me.checkAnswer(me.currentQuestionIndex, optionId);
				me.displayInteractionResult(correct, $selectedOption, asrResult);
			}
		}
	}

	function switchAnswerMode(mode) {
		var me = this,
			$el = this.$element;

		switch (mode) {
			case 'ASR':
				me.answerMode = 'ASR';
				$el.find(SEL_ASR_CONTAINER).removeClass(CLS_NONE);
				$el.find(SEL_QUESTIONS).removeClass(CLS_SELECT_MODE);
				$el.find(SEL_QUESTIONS + " li").unbind('click');
				me._super.scoringType('asr');
				break;
			case 'SELECT':
			default:
				me.answerMode = 'SELECT';
				$el.find(SEL_ASR_CONTAINER).addClass(CLS_NONE);
				$el.find(SEL_QUESTIONS).addClass(CLS_SELECT_MODE);
				$el.find(SEL_QUESTIONS + " li").click(function () {
					onClickOption.call(me, $(this));
				});
				me._super.scoringType('default');
				break;
		}
	}

	function onClickOption($selectedOption) {
		var me = this;
		if ($selectedOption.hasClass(CLS_DISABLED) || me.optionFreezed) {
			return;
		}

		var optionId = $selectedOption.data("id");

		disableVideoControl.call(me);

		var correct = me.checkAnswer(me.currentQuestionIndex, optionId);
		me.displayInteractionResult(correct, $selectedOption);
	}

	function showQuestion() {
		var me = this,
			$el = this.$element;

		if (!me.questionShown) {
			me.questionShown = true;
			me.optionFreezed = false;
			me.$currentQuestion.addClass(CLS_ACTIVE).siblings().removeClass(CLS_ACTIVE);

			if (!me.firstQuestionShown) {
				me.firstQuestionShown = true;
				$el.find(SEL_MAIN).animate({left: "0"}, DURATION_ANIMATION);
				$el.find(SEL_SIDE).animate({right: "0"}, DURATION_ANIMATION);
			} else {
				$el.find(SEL_SIDE).fadeIn(DURATION_ANIMATION);
			}

			$el.find(SEL_RPV_MIC).show();
		}
	}

	function hideQuestion() {
		var me = this,
			$el = this.$element;

		if (me.questionShown) {
			me.questionShown = false;
			$el.find(SEL_SIDE).fadeOut(DURATION_ANIMATION);
			$el.find(SEL_RPV_MIC).hide();
		}
	}

	function initVideoPlayer() {
		var me = this;
		var $el = this.$element;
		var data = me._json.content || {};

		//video info
		var videoInfo = {
			video: data.video
		};

		//options
		var features = ['TimeRanges'];
		var timeRanges = converter.questionsToTimeRanges(data.questions);
		var options = {
			features: features,
			timeRanges: timeRanges,
			restrictPlayingTimeRange: true,
			allowPlayingBeforeRestrictRange: true,
			continueOnEndOfRestrictRange: true
		};

		//success callback
		var successCallback = function () {
			onVideoPlayerReady.apply(me, arguments);   //this: instance of widget "video-player/main"
		};

		//start to init
		var $video = $el.find(SEL_VIDEO_CONTAINER);
		$video.data({
			'videoInfo': videoInfo,
			'options': options,
			'successCallback': successCallback
		});
		$video.attr('data-weave', 'school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)');
		$video.weave();
	}

	function onVideoPlayerReady(mediaElement, domObject, player) {
		var me = this;
		var $el = me.$element;

		me.mediaElement = mediaElement;
		me.$mediaElement = mejs.$(mediaElement);
		me.player = player;

		me.$mediaElement.one("play", function () {
			me.actStarted = true;
			player.options.clickToPlayPause = false;
			$el.find(SEL_VIDEO_CONTAINER).addClass(CLS_VP_PLAYED);
		});

		me.$mediaElement.on("restrict_time_range_ended", function () {
			me.mediaElement.pause();
			onTimeRangeEnded.call(me);
		});
	}

	function onTimeRangeEnded() {
		var me = this;

		if (!me.outOfLastQuestion) {
			enableRecord.call(me);
			enableVideoControl.call(me);
			showQuestion.call(me);
			updateAutomationTestStatus.call(me);
		}
	}

	function updateAutomationTestStatus() {
		var me = this;
		//for automation test
		me.$element.find(SEL_QUESTION + "[data-order=" + (me.currentQuestionIndex + 1) + "]")
			.attr("data-at-status", "shown");
	}

	function enableVideoControl() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_VIDEO_CONTROL).removeClass(CLS_DISABLED);
		me.videoControlEnabled = true;
	}

	function disableVideoControl() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_VIDEO_CONTROL).addClass(CLS_DISABLED);
		me.videoControlEnabled = false;
	}

	function enableRecord() {
		this.publish("asr/enable");
	}

	function disableRecord() {
		this.publish("asr/disable");
	}

	function replay() {
		var me = this;
		me.player.goToTimeRange(me.currentQuestionIndex, true);
		me.mediaElement.play();
		disableRecord.call(me);
		disableVideoControl.call(me);
	}

	function moveOn() {
		var me = this;

		disableRecord.call(me);
		disableVideoControl.call(me);
		hideQuestion.call(me);

		if (me.currentQuestionIndex + 1 < me.questionCount) {
			var nextQuestionTimeoutHandler = setTimeout(function () {   //wait for animation done
				pointToQuestion.call(me, me.currentQuestionIndex + 1);  //me.currentQuestionIndex will be increased

				me.publish(
					HUB_ASR_SET,
					onASRRecognized.bind(me),
					me.currentQuestion,
					{
						asrEnableTip: true
					}
				);

				me.player.goToTimeRange(me.currentQuestionIndex);
				me.mediaElement.play();
			}, MOVEON_DELAY);
			me.timeouts.push(nextQuestionTimeoutHandler);
		} else {
			me.outOfLastQuestion = true;
			if (me.mediaElement.currentTime === 0 || me.mediaElement.duration - me.mediaElement.currentTime < 1) {
				//View summary if video ends, or close to end
				activityComplete.call(me);
			} else {
				//otherwise play rest of the video
				me.$mediaElement.one('ended', function () {
					activityComplete.call(me);
				});

				var playRestTimeout = setTimeout(function () {
					hideQuestion.call(me);
					me.mediaElement.play();
				}, MOVEON_DELAY);
				me.timeouts.push(playRestTimeout);
			}
		}
	}

	function viewSummary(passed) {
		var me = this,
			$el = this.$element;
		$el.find(SEL_ACT_BODY).fadeOut(DURATION_ANIMATION, function () {
			$(this).addClass(CLS_NONE).removeAttr('style');

			//Render activity summary widget
			$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
				.data("settings",
				{
					passed: passed,
					correctNum: me.correctCount,
					skippedNum: me.incorrectCount,
					passNum: me.correctRequired
				})
				.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
				.weave();
		});

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	function activityComplete() {
		var me = this;
		var passed = me.correctCount >= me.correctRequired;
		me._json.content._isCorrect = passed;
		viewSummary.call(me, passed);
		me._item.completed(true);
		me.actStarted = false;
	}

	function showASRMessage(msgType) {
		this.publish("asr/show/message", MSGType[msgType]);
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			//Clear timeouts when finalize
			$.each(this.timeouts, function (i, timeout) {
				clearTimeout(timeout);
			});
		},
		"sig/start": function () {
			var me = this;

			return 	me.query(CCL_ASR_ENABLED).spread(function (asrEnabledCcl) {
				me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');
			});
		},
		"dom/destroy": function () {
			var me = this;
			// Clear video flash
			// See SPC-382, SU-2323 and SU-2316 for old issues relative to clearing video
			// See SPC-5835 for issue after migration to troopjs2
			Util.clearVideo(me.mediaElement);
		},
		/**
		 * End of clear video flash.
		 */
		"hub/asr/ui/states/changed": function (state) {
			var me = this;
			if (state && me.actStarted) {
				// this.state(state);
				switch (state) {
					case ASRUIStatus.RECORDING:
					case ASRUIStatus.PROCESSING:
					case ASRUIStatus.PREPARING:
					case ASRUIStatus.DISABLE:
						disableVideoControl.call(me);
						break;
					default:
						enableVideoControl.call(me);
						break;
				}
			}
		},

		"hub/rating/sourceType": function () {
			return [asrMode];
		},

		"dom:.ets-act-rpv-btn-replay/click": function () {
			var me = this;
			if (me.videoControlEnabled) {
				me.publish("asr/ui/playback", false);
				replay.call(me);
			}
		},
		"dom:.ets-act-rpv-btn-skip/click": function () {
			var me = this;
			if (me.videoControlEnabled) {
				me.publish("asr/ui/playback", false);
				me.publishSkipInteraction(me.currentQuestionIndex);
			}
		},
		"hub/activity/template/rpv/load": function (parent, options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;

			me._super = parent;

			// set instant feedback off
			me._item.instantFeedback(true);

			return me.signal('render');
		},
		checkAnswer: function (questionIndex, optionId) {
			var me = this;
			var interaction = Interaction.makeChoiceInteraction(me._json, questionIndex, optionId);
			var promise = me._super.publishInteraction(interaction);

			if (interaction.correct) {
				me.correctCount++;
				me.incorrectCount--;

				var moveOnTimeout = setTimeout(function () {
					promise.then(function(){
						moveOn.call(me);
					});
				}, FEEDBACK_DELAY);

				me.timeouts.push(moveOnTimeout);
			}

			return interaction.correct;
		},
		publishSkipInteraction: function (questionIndex) {
			var me = this;
			var questionId = me._json.content.questions[questionIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			me._super.publishInteraction(interaction)
				.then(function () {
					moveOn.call(me);
				});
		},
		displayInteractionResult: function (correct, $selectedOption, asrResult) {
			var me = this;

			me.optionFreezed = true;

			if (correct) {
				$selectedOption.addClass(CLS_CORRECT);
				disableRecord.call(me);
			} else {
				$selectedOption.addClass(CLS_INCORRECT);

				if (asrResult && !asrResult._hasError) {
					showASRMessage.call(me, "INCORRECT_ANSWER");
				}

				var retryTimeout = setTimeout(function () {
					$selectedOption.removeClass(CLS_INCORRECT).addClass(CLS_DISABLED);
					me.optionFreezed = false;

					if (!asrResult) {
						enableVideoControl.call(me);
					}
				}, FEEDBACK_DELAY);

				me.timeouts.push(retryTimeout);
			}
		}
	};

	return Widget.extend(Ctor, methods);
});

define('school-ui-activity/activity/role-play-video/main',[
	'jquery',
	'underscore',
	'../base/main',
	'template!./main.html',
	'when',
	'./role-play-video'
], function activityTemplateModule($, _, Widget, tTemplate, when, rpv) {
	"use strict";

	var TOPIC_ACT_RPV_LOAD = "activity/template/rpv/load";

	return Widget.extend(function Ctor() {
		this.scoringType(Widget.SCORING_TYPE.ASR);
		this._htmlPromise = null;
	}, {
		"sig/initialize": function onInitialize() {
			this.length(1);
		},
		"sig/render": function onRender() {
			var me = this;

			// No matter when render() is called, it always check if the $element is exist,
			// to make sure there is no code error when render() is called after finalization.
			if (!me.$element) {
				return;
			}

			if (!this._htmlPromise) {
				this._htmlPromise = this.html(tTemplate());
			}

			return me._htmlPromise.then(function () {
				return me.publish(TOPIC_ACT_RPV_LOAD, me, {
					item: me.items(),
					json: me._json
				});
			});
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);

			return this.signal('render');
		},
		_onAnswerChecked: function () {
		}
	});
});

define('troopjs-requirejs/template!school-ui-activity/activity/sequencing-image/sequencing-image.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-sqi\">\n\t";
	var data = data || {};
	if (data.references.aud) { o += "\n\t<div class=\"ets-act-sqi-side\">\n\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t           data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n\t\t           class=\"ets-ap\"></audio>\n\t\t</div></div>\n\t</div>\n\t";}o += "\n\t<div class=\"ets-act-sqi-main\">\n\t\t<div class=\"ets-act-sqi-droparea\">\n\t\t";
	        var items = data.content.sequences;
	        for (var i = 1; i <= items.length; i++) {
	        	if (i < items.length) {o += "\n\t            <div class=\"ets-act-sqi-droppable ets-nth-" + i+ "\"></div>\n\t            ";} else {o += "\n\t            <div class=\"ets-act-sqi-droppable ets-nth-" + i+ " ets-last\"></div>\n\t            ";}o += "\n\t    ";}o += "\n\t\t</div>\n\t\t<div class=\"ets-act-sqi-originarea\">\n\t\t\t";
		        var items = data.content.sequences;
		        for (var i = 1; i <= items.length; i++) {
		        	writeItem(items[i - 1]);
				}
		    o += "\n\t\t</div>\n\t</div>\n</div>\n"; function writeItem(data) { o += "\n\t\t<div class=\"ets-act-sqi-origin ets-nth-" + i+ "\">\n\t\t\t<div id=\"" + data._id+ "\" data-at-id=\"" + data._id+ "\" class=\"ets-act-sqi-item ets-nth-" + i+ "\">\n\t\t\t\t"; if (data.image) { o += "\n\t\t\t\t\t<img src=\"" + data.image.url+ "\" />\n\t\t\t\t";} else {o += "\n\t\t\t\t\t\n\t\t\t\t";}o += "\n\t\t\t\t<div class=\"ets-act-act-sqi-item-cover\"></div>\n\t\t\t\t<i class=\"ets-icon-correct-s\"></i>\n\t\t\t\t<i class=\"ets-icon-incorrect-s\"></i>\n\t\t\t</div>\n\t\t</div>\n"; }  return o; }; });
// # Task Module
define('school-ui-activity/activity/sequencing-image/sequencing-image',[
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./sequencing-image.html'
], function ($, ui$, $uiTouchPunch, Widget, Interaction, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_DROP_AREA = ".ets-act-sqi-droparea",
		SEL_ORIGIN_AREA = ".ets-act-sqi-originarea",
		SEL_ACTIVITY_BODY = ".ets-act-bd",
		SEL_DROPPABLE = ".ets-act-sqi-droppable",
		SEL_ITEM = ".ets-act-sqi-item",
		SEL_ITEM_CORRECT = ".ets-correct",
		SEL_ITEM_INCORRECT = ".ets-incorrect",
		SEL_ACTIVE = ".ets-active",
		SEL_ORIGIN = ".ets-act-sqi-origin",
		CLS_CORRECT = "ets-correct",
		CLS_INCORRECT = "ets-incorrect",
		CLS_HOVER = "ets-hover",
		CLS_DROPPED = "ets-dropped",
		CLS_ACTIVE = "ets-active",
		FEEDBACK_DELAY = 1500;

	function Ctor() {

	}

	// # Render

	function render() {
		var me = this;
		var data = this._json;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		return this.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * 1. Enable droppable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this;

		//Enable droppable
		enableDroppable.call(me);
	}


	/**
	 * Return if same jquery element
	 * @api private
	 */
	function isSamejQueryElement(a, b) {
		return (a.length === b.length && a.length === a.filter(b).length);
	}

	/**
	 * Return if same jquery element
	 * @api private
	 */
	function enableDroppable() {
		var me = this,
			$el = this.$element;
		$el.find(SEL_DROPPABLE).droppable({
			accept: SEL_ITEM,
			hoverClass: CLS_HOVER,
			over: function (event, ui) {
				var $me = $(this);
				if ($me.find(SEL_ITEM).length > 0) {
					var $existingItem = $me.find(SEL_ITEM);
					if (!isSamejQueryElement($existingItem, $(ui.draggable)) && !$existingItem.hasClass(CLS_CORRECT)) {
						//$existingItem.transition({ x: '-15px', y: '15px', opacity: "0.6", easing: 'snap'});
					} else {
						$me.removeClass(CLS_HOVER);
					}
				}
			},
			out: function (/*event, ui*/) {
			//	var $me = $(this);
			//	var $existingItem = $me.find(SEL_ITEM);
			//	if ($existingItem.length > 0) {
			//		$existingItem.transition({ x: '0px', y: '0px', opacity: "1", easing: 'snap' });
			//	}
			},
			drop: function (event, ui) {
				var $me = $(this);
				if ($me.find(SEL_ITEM).length > 0) {
					var $existingItem = $me.find(SEL_ITEM);
					if (!$existingItem.hasClass(CLS_CORRECT)) {
						$($el.find(SEL_ORIGIN_AREA).find(SEL_ORIGIN).filter(function () {
							return $(this).html() == false
						})[0]).append($existingItem);

						$(this).append($(ui.draggable).removeAttr("style").addClass(CLS_DROPPED));
					}
				} else {
					$(this).append($(ui.draggable).removeAttr("style").addClass(CLS_DROPPED));
				}

				refreshDropArea.call(me);
				refreshOriginArea.call(me);
			}
		});

		$el.find(SEL_ORIGIN).droppable({
			accept: SEL_ITEM,
			drop: function (event, ui) {
				if ($(this).find(SEL_ITEM).length > 0) {
					return;
				}
				$(this).append($(ui.draggable));
				refreshDropArea.call(me);
				refreshOriginArea.call(me);
			}
		});

		$el.find(SEL_ITEM).draggable({
			cancel: SEL_ITEM_CORRECT + ", " + SEL_ITEM_INCORRECT,
			containment: SEL_ACTIVITY_BODY,
			activeClass: SEL_ACTIVE,
			revert: true,
			start: function () {
				$(this).addClass(CLS_ACTIVE);
			},
			stop: function () {
				$(this).removeAttr("style");
				$(this).removeClass(CLS_ACTIVE);
			}
		});
	}

	function refreshDropArea() {
		var me = this,
			$el = this.$element;
		if ($el.find(SEL_DROPPABLE + ":empty").length < 1) {
			onSequenceComplete.call(me);
		} else {
			me._item.answered(false);
		}
	}

	function refreshOriginArea() {
		var $el = this.$element;
		var $items = $el.find(SEL_ORIGIN_AREA).find(SEL_ITEM);
		$items.removeAttr("style").removeClass(CLS_DROPPED + " " + CLS_INCORRECT);
	}


	/**
	 * Return incorrect items
	 * 1. Move strips start from the first incorrect strip back to origin area
	 * 2. Refresh origin area
	 * 3. Disable check answer
	 * @api private
	 */
	function returnIncorrectItems() {
		var me = this,
			$el = this.$element;
		var $incorrectItems = $el.find(SEL_DROP_AREA).find(SEL_ITEM_INCORRECT);

		$($el.find(SEL_ORIGIN_AREA).find(SEL_ORIGIN).filter(function () {
			return $(this).html() == false
		})).each(function (i) {
			$(this).append($incorrectItems[i]);
		});

		//$(SEL_ORIGIN_AREA).append($incorrectItems);

		refreshOriginArea.call(me);

		me._item.answered(false);
	}

	/**
	 * When all strips are in drop area
	 * 1. Update item's position property based on ui sequence
	 * 2. Enable check answer
	 * @api private
	 */
	function onSequenceComplete() {
		var me = this;
		me._item.answered(true);
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		"hub/activity/template/sqi/load": function (options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;
			me._super = options._super;

			// set instant feedback off
			me._item.instantFeedback(false);

			return me.signal('render');
		},
		'hub/activity/check/answer': function () {
			var me = this;
			var allCorrect = true;
			var $el = this.$element;

			var $items = $el.find(SEL_DROP_AREA).find(SEL_ITEM);
			me._json.scoring.sequences.forEach(function (expectedItem, index) {
				var $item = $items.eq(index);
				var correct = expectedItem._id === $item.attr('id');
				$item.addClass(correct ? CLS_CORRECT : CLS_INCORRECT);
				allCorrect = allCorrect && correct;
			});

			window.setTimeout(function () {
				returnIncorrectItems.call(me)
			}, FEEDBACK_DELAY);

			//only one sequence, there is not specific id
			var promise = me._super.publishInteraction(
				Interaction.makeSequencingInteraction(allCorrect, "SeqImgId"));

			promise.then(function () {
				if (allCorrect) {
					me._json.content._isCorrect = true;
					me._item.answered(true);
					me._item.completed(true);
				} else {
					me._item.answered(false);
				}
			});
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/sequencing-image/main.html',[],function() { return function template(data) { var o = "<div class=\"et-act-sqi-wrap\" data-weave=\"school-ui-activity/activity/sequencing-image/sequencing-image\"></div>"; return o; }; });
define('school-ui-activity/activity/sequencing-image/main',[
	'jquery',
	'when',
	'../base/main',
	'./sequencing-image',
	'template!./main.html'
], function activityTemplateModule($, when, Widget, sqi, tTemplate) {
	"use strict";

	var TOPIC_ACT_SQI_LOAD = "activity/template/sqi/load";

	function Ctor() {
	}

	function render() {
		var me = this;

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		// If it is the first time be called, it renders the basic outer html of
		// current activity.
		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate());
		}

		var data = this._json;

		return this._htmlPromise
			.then(function () {
				return me.publish(TOPIC_ACT_SQI_LOAD, {
					item: me.items(),
					json: data,
					_super: me
				});
			});
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			this.length(1);
		},

		"sig/render": function onRender() {
			return render.call(this);
		},

		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},

		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);

			return this.signal('render');
		},

		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/sequencing-paragraph-vertical/sequencing-paragraph-vertical.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-spv\">\n\t";
	var data = data || {};
	if (data.references.aud) { o += "\n\t<div class=\"ets-act-spv-side\">\n\t\t<div class=\"ets-act-spv-side-bd\">\n\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t       data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n\t\t\t\t       class=\"ets-ap\"></audio>\n\t\t\t</div></div>\n\t\t</div>\n\t</div>\n\t";}o += "\n\t<div class=\"ets-act-spv-main\">\n\t\t<div class=\"ets-act-spv-list-wrap\">\n\t\t    <ul class=\"ets-act-spv-list\">\n\t\t    ";
		        var items = data.content.sequences;
		        for (var i = 0; i < items.length; i++) {
		            writeItem(items[i]);
		        }
		    o += "\n\t\t    </ul>\n\t    </div>\n\t</div>\n</div>\n"; function writeItem(data) { 
	if (data.isLock) {
		data.lockClass = "ets-correct ets-locked";
	} else {
		data.lockClass = ""
	}
	o += "\n\t\n\t\t\t\t<li id=\"" + data._id+ "\" data-at-id=\"" + data._id+ "\" class=\"ets-act-spv-item " + data.lockClass+ "\" data-position=\"" + data.position+ "\">\n\t\t\t\t\t<div class=\"ets-bd\">" + data.item+ "<div class=\"ets-bd-handle\"></div><div class=\"ets-bd-correct\"></div><div class=\"ets-bd-incorrect\"></div><div class=\"ets-bd-lock\"></div></div>\n\t\t\t\t\t<div class=\"ets-ft\"></div>\n\t\t\t\t</li>\n"; }  return o; }; });
// # Task Module
define('school-ui-activity/activity/sequencing-paragraph-vertical/sequencing-paragraph-vertical',[
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./sequencing-paragraph-vertical.html'
], function ($, ui$, $uiTouchPunch, Widget, Interaction, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var CLS_ITEM_CORRECT = "ets-correct",
		CLS_ITEM_INCORRECT = "ets-incorrect",
		CLS_SEQ_PLACEHOLDER = "ets-act-spv-list-placeholder",
		CLS_ACTIVE = "ets-active",
		CLS_FREEZED = "ets-freezed",
		CLS_SCROLLABLE = "ets-scrollable",

		SEL_SEQ_MAIN = ".ets-act-spv-main",
		SEL_SEQ_SIDE = ".ets-act-spv-side",
		SEL_SEQ_LIST = ".ets-act-spv-list",
		SEL_SEQ_ITEMS = ".ets-act-spv-list > .ets-act-spv-item",
		SEL_ITEM_LOCKED = ".ets-locked",
		SEL_ITEM_CORRECT = ".ets-correct",
		SEL_ITEM_INCORRECT = ".ets-incorrect",
		SEL_SORTABLE_CONTAINMENT = ".ets-ui-acc-bd-main",

		FEEDBACK_DELAY = 1500;

	function Ctor() {

	}

	// # Render

	function render() {
		var me = this;
		var data = this._json;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		this.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * # Init media player
	 * # Show check answer button
	 * # Disable dragging items
	 * # Fade in activity
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = this.$element;

		//Disable dragging when activity init
		var _$items = $el.find(SEL_SEQ_ITEMS);
		if (_$items) {
			_$items.addClass(CLS_FREEZED);
			me.actLocked = true;
		} else {
			throw "Sequecing data not found";
		}

		if (!me._json.references.aud) {
			enableDragging.call(me);
		}

		adjustLayout.call(me);

		removeInlineStyles.call(me);
	}

	/**
	 * Adjust style
	 * # Adust side padding to audio vertically middle
	 * # Make list scrollable if height exceed container
	 * @api private
	 */
	function adjustLayout() {
		var $el = this.$element;
		var $side = $(SEL_SEQ_SIDE),
			$main = $(SEL_SEQ_MAIN);
		$side.css("padding-top", ($main.outerHeight() - 75) / 2);

		if ($el.find(SEL_SEQ_LIST).outerHeight() >= 416) {
			$el.find(SEL_SEQ_LIST).addClass(CLS_SCROLLABLE);
		}
	}

	/**
	 * Remove inline styles
	 * # Remove inline styles from authoring tool
	 * @api private
	 */
	function removeInlineStyles() {
		var $el = this.$element;

		$el.find(SEL_SEQ_ITEMS).find("p, span").removeAttr("style");
	}


	/**
	 * Enable dragging
	 * # Enable dragging
	 * # Bind sortable
	 * @api private
	 */
	function enableDragging() {
		var me = this,
			$el = this.$element;

		if (!me.actLocked) {
			return;
		}

		var _$items = $el.find(SEL_SEQ_ITEMS);
		_$items.removeClass(CLS_FREEZED);
		me.actLocked = false;

		//Sortable
		$el.find(SEL_SEQ_LIST).sortable({
			containment: SEL_SORTABLE_CONTAINMENT,
			cancel: SEL_ITEM_LOCKED + ', ' + SEL_ITEM_CORRECT + ', ' + SEL_ITEM_INCORRECT,
			axis: 'y',
			placeholder: CLS_SEQ_PLACEHOLDER,
			start: function (event, ui) {
				$(ui.item).addClass(CLS_ACTIVE);
				//Make placeholder the same height as drag item
				var sortable = $(this).data("ui-sortable");
				sortable.placeholder.outerHeight(sortable.currentItem.height() - 10);

				$(SEL_ITEM_CORRECT, this).each(function () {
					var $this = $(this);
					$this.data('pos', $this.index());
				});
			},
			change: function () {
				var $sortable = $(this);
				var $statics = $(SEL_ITEM_CORRECT, this).detach();
				var $helper = $('<li></li>').prependTo(this);
				$statics.each(function () {
					var $this = $(this);
					var target = $this.data('pos');

					$this.insertAfter($('li', $sortable).eq(target));
				});
				$helper.remove();
			},
			update: function () {
				onSequenceChanged.call(me);
			},
			stop: function (event, ui) {
				$(ui.item).removeClass(CLS_ACTIVE);
			}
		});
	}

	/**
	 * Update data when sequence change
	 * # Update sequece position property
	 * @api private
	 */
	function onSequenceChanged() {
		var me = this;

		me._item.answered(true);
	}


	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		"hub/activity/template/spv/load": function (options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;
			me._super = options._super;

			// set instant feedback off
			me._item.instantFeedback(false);

			return me.signal('render');
		},
		'hub/activity/check/answer': function () {
			var me = this;
			var allCorrect = true;
			var $el = this.$element;

			var $items = $el.find(SEL_SEQ_ITEMS);
			me._json.scoring.sequences.forEach(function (expectedItem, index) {
				var $item = $items.eq(index);
				var correct = expectedItem._id === $item.attr('id');
				$item.toggleClass(CLS_ITEM_CORRECT, correct);
				$item.toggleClass(CLS_ITEM_INCORRECT, !correct);
				allCorrect = allCorrect && correct;
			});
			if(!allCorrect){
				window.setTimeout(function () {
					$items.removeClass(CLS_ITEM_INCORRECT);
				}, FEEDBACK_DELAY);
			}

			//only one sequence, there is not specific id
			var promise = me._super.publishInteraction(
				Interaction.makeSequencingInteraction(allCorrect, "SeqParVerId"));

			promise.then(function () {
				if (allCorrect) {
					me._json.content._isCorrect = true;
					me._item.answered(true);
					me._item.completed(true);
				} else {
					me._item.answered(false);
				}
			});
		},
		'dom:.ets-ap/media/play': function () {
			enableDragging.call(this);
		},
		//Also listen for "playing" in case "play" is not well sent
		'dom:.ets-ap/media/playing': function () {
			enableDragging.call(this);
		}
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/sequencing-paragraph-vertical/main.html',[],function() { return function template(data) { var o = "<div class=\"et-act-spv-wrap\" data-weave=\"school-ui-activity/activity/sequencing-paragraph-vertical/sequencing-paragraph-vertical\"></div>"; return o; }; });
define('school-ui-activity/activity/sequencing-paragraph-vertical/main',[
	'jquery',
	'when',
	'../base/main',
	'./sequencing-paragraph-vertical',
	'template!./main.html'
], function activityTemplateModule($, when, Widget, spv, tTemplate) {
	"use strict";

	var TOPIC_ACT_SPV_LOAD = "activity/template/spv/load";

	function Ctor() {
	}

	// # Render Method

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {

		var me = this;

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		// If it is the first time be called, it renders the basic outer html of
		// current activity.
		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate());
		}

		var data = this._json;

		return this._htmlPromise
			.then(function () {
				return me.publish(TOPIC_ACT_SPV_LOAD, {
					item: me.items(),
					json: data,
					_super: me
				});
			});
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			this.length(1);
		},

		"sig/render": function onRender() {
			return render.call(this);
		},

		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},

		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);

			return this.signal('render');
		},

		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/sequencing-word-horizontal/sequencing-word-horizontal.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-swh-droparea ets-cf\">\n\t\n</div>\n\n<div class=\"ets-act-swh-originarea\">\n\t";
        var items = data.words;
        for (var i = 0; i < items.length; i++) {
            writeItem(items[i]);
        }
    o += "\n</div>\n\n"; function writeItem(data) { o += "\n\t\t<div class=\"ets-act-swh-strip\" data-at-id=\"" + data._id+ "\">\n\t\t\t<div class=\"ets-l\"></div>\n\t\t\t<div class=\"ets-c\">" + data.txt+ "</div>\n\t\t\t<div class=\"ets-r\"></div>\n\t\t</div>\n"; }  return o; }; });
// # Task Module
define('school-ui-activity/activity/sequencing-word-horizontal/sequencing-word-horizontal',[
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	'template!./sequencing-word-horizontal.html'
], function ($, $ui, $uiTouchPunch, Widget, Scoring, Interaction, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_DROP_AREA = ".ets-act-swh-droparea",
		SEL_ORIGIN_AREA = ".ets-act-swh-originarea",
		SEL_ACTIVITY_BODY = ".ets-act-bd",
		SEL_STRIP = ".ets-act-swh-strip",
		SEL_STRIP_CORRECT = ".ets-correct",
		SEL_STRIP_INCORRECT = ".ets-incorrect",
		SEL_ACTIVE = ".ets-active",
		CLS_ORIGIN_AREA = "ets-act-swh-originarea",
		CLS_DROP_AREA = "ets-act-swh-droparea",
		CLS_PLACEHOLDER = "ets-act-swh-placeholder",
		CLS_BEGIN = "ets-begin",
		CLS_END = "ets-end",
		CLS_CORRECT = "ets-correct",
		CLS_INCORRECT = "ets-incorrect",
		FEEDBACK_DELAY = 1500,
		HELPER = "<div class='ets-act-swh-strip'></div>";

	var LAST_TOUCH_DATE = "_lastTouchDate";
	var DOUBLE_CLICK_DURATION = 250;

	function Ctor() {

	}

	// # Render

	function render() {
		var me = this;
		var data = me._phrase;

		if (!data) {
			throw me.toString() + EX_JSON_FORMAT;
		}

		return me.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * 1. Enable sortable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this;

		//Enable sortable
		enableSortable.call(me);

		//Bind double click
		bindDoubleClickItem.call(me);

		setStripeWidth.call(me);
	}

	function setStripeWidth() {
		$(SEL_STRIP).each(function (i, item) {
			var l = $(item).find(".ets-l").outerWidth(),
				c = $(item).find(".ets-c").outerWidth(),
				r = $(item).find(".ets-r").outerWidth();

			$(item).css("width", l + c + r + 1);
		});
	}


	/**
	 * Enable sortable
	 * 1. Sortable droparea and origin area
	 * 2. Refresh droparea and origin area when stop dragging
	 * @api private
	 */
	function enableSortable() {
		var me = this,
			$el = this.$element;
		$el.find(SEL_ORIGIN_AREA).sortable({
			cancel: SEL_STRIP_CORRECT + "," + SEL_STRIP_INCORRECT,
			containment: SEL_ACTIVITY_BODY,
			activeClass: SEL_ACTIVE,
			connectWith: SEL_DROP_AREA,
			placeholder: CLS_PLACEHOLDER,
			tolerance: 'pointer',
			// revert: true,
			start: function () {
				$(SEL_DROP_AREA).find(SEL_STRIP_CORRECT).each(function () {
					var $this = $(this);
					$this.data('pos', $this.index() + 1);
				});
			},
			change: function () {
				var $statics = $(SEL_STRIP_CORRECT, $(SEL_DROP_AREA)).detach();
				var $helper = $(HELPER).prependTo($(SEL_DROP_AREA));
				$statics.each(function () {
					var $this = $(this);
					var target = $this.data('pos');
					$this.insertAfter($(SEL_STRIP, $(SEL_DROP_AREA)).eq(parseInt(target) - 1));
				});
				$helper.remove();
			},
			stop: function () {
				refreshDropArea.call(me);
				refreshOriginArea.call(me);
				setStripeWidth.call(me);
			}
		});

		$el.find(SEL_DROP_AREA).sortable({
			cancel: SEL_STRIP_CORRECT + "," + SEL_STRIP_INCORRECT,
			containment: SEL_ACTIVITY_BODY,
			activeClass: SEL_ACTIVE,
			connectWith: SEL_ORIGIN_AREA,
			placeholder: CLS_PLACEHOLDER,
			tolerance: 'pointer',
			start: function (/*event, ui*/) {
				$(SEL_STRIP_CORRECT, this).each(function () {
					var $this = $(this);
					$this.data('pos', $this.index() + 1);
				});
			},
			change: function () {
				var $sortable = $(this);
				var $statics = $(SEL_STRIP_CORRECT, this).detach();
				var $helper = $(HELPER).prependTo(this);
				$statics.each(function () {
					var $this = $(this);
					var target = $this.data('pos');
					$this.insertAfter($(SEL_STRIP, $sortable).eq(parseInt(target) - 1));
				});
				$helper.remove();
			},
			stop: function () {
				refreshDropArea.call(me);
				refreshOriginArea.call(me);
				setStripeWidth.call(me);
			}
		});
	}

	/**
	 * Refresh drop area:
	 * 1. Add special class to first and last item
	 * 2. Enable check answer when all strip are in droparea
	 * 3. Unbind double click to droparea strips
	 * @api private
	 */
	function refreshDropArea() {
		var me = this;
		var $items = $(SEL_DROP_AREA).find(SEL_STRIP);

		if ($items.length > 0) {
			$items.removeClass(CLS_BEGIN + " " + CLS_END).removeAttr("style");
			$items.first().addClass(CLS_BEGIN);
			//Enable check answer
			me._item.answered(false);
		}
		if ($items.length === me._phrase.words.length) {
			//Enable check answer
			onSequenceComplete.call(me);
			$items.last().addClass(CLS_END);
		}
	}

	/**
	 * Refresh origin area:
	 * 1. Reset origin area strip classes
	 * 3. Bind double click to strips
	 * @api private
	 */
	function refreshOriginArea() {
		var $strips = $(SEL_ORIGIN_AREA).find(SEL_STRIP);

		if ($strips.length > 0) {
			$strips.removeClass([CLS_BEGIN, CLS_END, CLS_CORRECT, CLS_INCORRECT].join(' '))
				.removeAttr("style");
		}
	}

	/**
	 * Return incorrect items
	 * 1. Move strips start from the first incorrect strip back to origin area
	 * 2. Refresh origin area
	 * 3. Disable check answer
	 * @api private
	 */
	function returnIncorrectItems() {
		var me = this;
		var firstIncorrectItemIndex = $(SEL_DROP_AREA).find(SEL_STRIP_INCORRECT).first().index(),
			$items = $(SEL_DROP_AREA).find(SEL_STRIP),
			$returnItems = [];

		if (firstIncorrectItemIndex >= 0) {
			$items.each(function (index, item) {
				if (index >= firstIncorrectItemIndex) {
					$returnItems.push(item);
				}
			});

			$(SEL_ORIGIN_AREA).append($returnItems);

			refreshOriginArea.call(me);
			setStripeWidth.call(me);
		}
	}

	/**
	 * Bind double click
	 * 1. Move strip to droparea when double click
	 * 2. Refresh drop area
	 * @api private
	 */
	function bindDoubleClickItem() {
		var me = this;

		$(SEL_STRIP).on("dblclick customdblclick", function () {
			var $el = $(this);

			if ($el.parent().hasClass(CLS_ORIGIN_AREA)) {
				$(SEL_DROP_AREA).append($el);
				refreshDropArea.call(me);
			} else if ($el.parent().hasClass(CLS_DROP_AREA)) {
				if ($el.hasClass(CLS_CORRECT)) {
					return;
				}
				$(SEL_ORIGIN_AREA).append($el);
				refreshOriginArea.call(me);
				refreshDropArea.call(me);
			}

			setStripeWidth.call(me);
		});

		$(SEL_STRIP).on('touchstart', function (evt) {
			evt.preventDefault();
			var $el = $(this);

			var lastTouchDate = $el.data(LAST_TOUCH_DATE);
			var touchDate = new Date().getTime();
			if (!lastTouchDate) {
				$el.data(LAST_TOUCH_DATE, touchDate);
				return;
			}

			var duration = touchDate - lastTouchDate;
			if (duration <= DOUBLE_CLICK_DURATION) {
				$el.trigger('customdblclick');
				$el.removeData(LAST_TOUCH_DATE);
			}
			else {
				$el.data(LAST_TOUCH_DATE, touchDate);
			}
		});
	}


	function onSequenceComplete() {
		var me = this;
		me._item.answered(true);
	}


	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		'hub/activity/template/swh/load': function (options) {
			var me = this;

			me._json = options.json;
			me._index = options.index;
			me._phrase = me._json.content.phrases[me._index];
			me._item = options.item;
			me._interacted = false;
			me._super = options._super;

			// set instant feedback off
			me._item.instantFeedback(false);

			return me.signal('render');
		},
		'hub/activity/check/answer': function () {
			var me = this;
			var allCorrect = true;
			var $el = this.$element;
			var $strips = $el.find(SEL_DROP_AREA).find(SEL_STRIP);
			var solution = Scoring.findById(me._json.scoring.phrases, me._phrase._id);
			var expectedTexts = solution.blanks.map(function (blank) {
				return blank.word.txt;
			});

			$strips.each(function (index) {
				var $strip = $(this);
				var stripText = $strip.find(".ets-c").text();
				var correct = expectedTexts[index] === stripText;
				$strip.addClass(correct ? CLS_CORRECT : CLS_INCORRECT);
				allCorrect = allCorrect && correct;
			});

			window.setTimeout(function () {
				returnIncorrectItems.call(me)
			}, FEEDBACK_DELAY);

			var promise = me._super.publishInteraction(
				Interaction.makeSequencingInteraction(allCorrect, me._phrase._id));

			promise.then(function () {
				if (allCorrect) {
					if (me._index === me._json.content.phrases.length - 1) {
						me._json.content._isCorrect = true;
					}
					me._item.answered(true);
					me._item.completed(true);
				} else {
					me._item.answered(false);
				}
			});
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/sequencing-word-horizontal/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-swh ets-cf\">\n\t";
	var data = data || {};
	if (data.references.aud) { o += "\n\t<div class=\"ets-act-swh-audio\">\n\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t       data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n\t\t\t       class=\"ets-ap\"></audio>\n\t\t</div></div>\n\t</div>\n\t";}o += "\n\t\n\t<div class=\"et-act-swh-main\" data-weave=\"school-ui-activity/activity/sequencing-word-horizontal/sequencing-word-horizontal\"></div>\n</div>"; return o; }; });
define('school-ui-activity/activity/sequencing-word-horizontal/main',[
	'jquery',
	'../base/main',
	'when',
	'poly',
	'underscore',
	'./sequencing-word-horizontal', //maybe for load optimization???
	'template!./main.html'
], function activityTemplateModule($, Widget, when, poly, _, swh, tTemplate) {
	"use strict";

	var TOPIC_ACT_SWH_LOAD = "activity/template/swh/load";

	function Ctor() {
	}

	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		if (!me.$element) {
			return;
		}

		if (!me._htmlPromise) {
			me._htmlPromise = me
				.html(tTemplate, me._json);
		}

		return me._htmlPromise
			.then(function () {
				return me.publish(TOPIC_ACT_SWH_LOAD, {
					item: me.items(),
					index: me.index(),
					json: me._json,
					_super: me
				});
			});
	}

	function randomWords(data) {
		data.content.phrases.forEach(function (phrase) {
			if (phrase.words) {
				phrase.words = _.shuffle(phrase.words);
			}
		});
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			var me = this;
			me.length(me._json.content.phrases.length);
			randomWords.call(me, this._json);
		},

		"sig/render": function onRender() {
			return render.call(this);
		},

		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},

		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);

			return this.signal('render');
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/sequencing-word-vertical/sequencing-word-vertical.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-swv\">\n\t";
	var data = data || {};
	if (data.references.aud) { o += "\n\t<div class=\"ets-act-swv-side\">\n\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t       data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n\t\t\t       class=\"ets-ap\"></audio>\n\t\t</div></div>\n\t</div>\n\t";}o += "\n\t<div class=\"ets-act-swv-main\">\n\t\t<div class=\"ets-act-swv-list-wrap\">\n\t\t    <ul class=\"ets-act-swv-list\">\n\t\t    ";
		        var items = data.content.sequences;
		        for (var i = 0; i < items.length; i++) {
		            writeItem(items[i]);
		        }
		    o += "\n\t\t    </ul>\n\t    </div>\n\t    <div class=\"ets-act-swv-label\">\n\t\t\t<div class=\"ets-arrow\">\n\t\t\t\t<div class=\"ets-bd\"></div>\n\t\t\t</div>\n\t\t\t<div class=\"ets-label\">\n\t\t\t\t<div class=\"ets-hd\">" +data.content.labels.top+ "</div>\n\t\t\t\t<div class=\"ets-ft\">" +data.content.labels.bottom+ "</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n\n"; function writeItem(data) { 
	if (data.isLock) {
		data.lockClass = "ets-correct ets-locked";
	} else {
		data.lockClass = ""
	}
o += "\n\t\t\t\t<li id=\"" + data._id+ "\" data-at-id=\"" + data._id+ "\" class=\"ets-act-swv-item " + data.lockClass+ "\" data-position=\"" + data.position+ "\">\n\t\t\t\t\t<div class=\"ets-bd\">" + data.item+ "</div>\n\t\t\t\t</li>\n"; }  return o; }; });
// # Task Module
define('school-ui-activity/activity/sequencing-word-vertical/sequencing-word-vertical',[
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./sequencing-word-vertical.html'
], function ($, ui$, $uiTouchPunch, when, Widget, Interaction, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var CLS_ITEM_LOCKED = "ets-locked",
		CLS_ITEM_CORRECT = "ets-correct",
		CLS_ITEM_INCORRECT = "ets-incorrect",
		CLS_SEQ_PLACEHOLDER = "ets-act-swv-list-placeholder",
		CLS_ACTIVE = "ets-active",

		SEL_SEQ_SIDE = ".ets-act-swv-side",
		SEL_SEQ_MAIN = ".ets-act-swv-main",
		SEL_SEQ_LIST = ".ets-act-swv-list",
		SEL_SEQ_ITEMS = ".ets-act-swv-list > .ets-act-swv-item",
		SEL_ITEM_LOCKED = ".ets-act-swv-item.ets-locked",
		SEL_ITEM_CORRECT = ".ets-act-swv-item.ets-correct",
		SEL_ITEM_INCORRECT = ".ets-act-swv-item.ets-incorrect",
		SEL_SORTABLE_CONTAINMENT = ".ets-ui-acc-bd-main",
		SEL_LABEL = ".ets-act-swv-label",

		FEEDBACK_DELAY = 1500;

	function Ctor() {

	}

	// # Render

	function render() {
		var me = this;
		var data = this._json;

		if (!data) {
			when.reject(new Error(this.toString() + EX_JSON_FORMAT));
		}

		return this.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * # Init media player
	 * # Show check answer button
	 * # Disable dragging items
	 * # Fade in activity
	 * @api private
	 */
	function onRendered() {
		var me = this;

		//Disable dragging when activity init
		var _$items = $(SEL_SEQ_ITEMS);
		if (_$items) {
			_$items.addClass(CLS_ITEM_LOCKED);
			me.actLocked = true;
		} else {
			throw "Sequecing data not found";
		}

		if (!me._json.references.aud) {
			enableDragging.call(me);
		}

		adjustLayout.call(me);
	}

	/**
	 * Adjust style
	 * # Adust side padding to audio vertically middle
	 * @api private
	 */
	function adjustLayout() {
		var $el = this.$element;
		var $side = $(SEL_SEQ_SIDE),
			$main = $(SEL_SEQ_MAIN),
			$label = $el.find(SEL_LABEL),
			$sequence = $el.find(SEL_SEQ_MAIN);
		$side.css("padding-top", ($main.outerHeight() - 75) / 2);
		$label.css("height", $sequence.outerHeight());
	}

	/**
	 * Enable dragging
	 * # Enable dragging
	 * # Bind sortable
	 * @api private
	 */
	function enableDragging() {
		var me = this,
			$el = this.$element;

		var _$items = $el.find(SEL_SEQ_ITEMS);
		_$items.each(function () {
			if (!$(this).hasClass(CLS_ITEM_CORRECT)) {
				$(this).removeClass(CLS_ITEM_LOCKED);
			}
		});

		me.actLocked = false;

		//Sortable
		$el.find(SEL_SEQ_LIST).sortable({
			containment: SEL_SORTABLE_CONTAINMENT,
			cancel: SEL_ITEM_LOCKED + ', ' + SEL_ITEM_CORRECT + ', ' + SEL_ITEM_INCORRECT,
			axis: 'y',
			placeholder: CLS_SEQ_PLACEHOLDER,
			start: function (event, ui) {
				$(ui.item).addClass(CLS_ACTIVE);
				//Make placeholder the same height as drag item
				var sortable = $(this).data("ui-sortable");
				sortable.placeholder.outerHeight(sortable.currentItem.height() - 10);

				$(SEL_ITEM_CORRECT, this).each(function () {
					var $this = $(this);
					$this.data('pos', $this.index());
				});
			},
			change: function () {
				var $sortable = $(this);
				var $statics = $(SEL_ITEM_CORRECT, this).detach();
				var $helper = $('<li></li>').prependTo(this);
				$statics.each(function () {
					var $this = $(this);
					var target = $this.data('pos');

					$this.insertAfter($('li', $sortable).eq(target));
				});
				$helper.remove();
			},
			update: function () {
				onSequenceChanged.call(me);
			},
			stop: function (event, ui) {
				$(ui.item).removeClass(CLS_ACTIVE);
			}
		});
	}

	/**
	 * Update data when sequence change
	 * # Update sequence position property
	 * @api private
	 */
	function onSequenceChanged() {
		var me = this;

		me._item.answered(true);
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		"hub/activity/template/swv/load": function (options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;
			me._super = options._super;

			// set instant feedback off
			me._item.instantFeedback(false);

			return me.signal('render');
		},
		'hub/activity/check/answer': function () {
			var me = this;
			var allCorrect = true;
			var $el = this.$element;

			var $items = $el.find(SEL_SEQ_ITEMS);
			me._json.scoring.sequences.forEach(function (expectedItem, index) {
				var $item = $items.eq(index);
				var correct = expectedItem._id === $item.attr('id');
				$item.toggleClass(CLS_ITEM_CORRECT, correct);
				$item.toggleClass(CLS_ITEM_INCORRECT, !correct);
				allCorrect = allCorrect && correct;
			});
			if(!allCorrect){
				window.setTimeout(function () {
					$items.removeClass(CLS_ITEM_INCORRECT);
				}, FEEDBACK_DELAY);
			}

			//only one sequence, there is not specific id
			var promise = me._super.publishInteraction(
				Interaction.makeSequencingInteraction(allCorrect, "SeqWordVerId"));

			promise.then(function () {
				if (allCorrect) {
					me._json.content._isCorrect = true;
					me._item.answered(true);
					me._item.completed(true);
				} else {
					me._item.answered(false);
				}
			});
		},
		"dom:.ets-ap/media/play": function () {
			enableDragging.call(this);
		}
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/sequencing-word-vertical/main.html',[],function() { return function template(data) { var o = "<div class=\"et-act-swv-wrap\" data-weave=\"school-ui-activity/activity/sequencing-word-vertical/sequencing-word-vertical\"></div>"; return o; }; });
define('school-ui-activity/activity/sequencing-word-vertical/main',[
	'jquery',
	'when',
	'../base/main',
	'./sequencing-word-vertical',
	'template!./main.html'
], function activityTemplateModule($, when, Widget, swv, tTemplate) {
	"use strict";

	var TOPIC_ACT_SWV_LOAD = "activity/template/swv/load";

	function Ctor() {
	}

	function render() {
		var me = this;

		// No matter when render() is called, it always check if the $element is exist,
		// to make sure there is no code error when render() is called after finalization.
		if (!me.$element) {
			return;
		}

		// If it is the first time be called, it renders the basic outer html of
		// current activity.
		if (!this._htmlPromise) {
			this._htmlPromise = this.html(tTemplate());
		}

		var data = this._json;

		return this._htmlPromise
			.then(function () {
				return me.publish(TOPIC_ACT_SWV_LOAD, {
					item: me.items(),
					json: data,
					_super: me
				});
			});
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			this.hasScoring || this.type(Widget.ACT_TYPE.PRACTICE);

			if (this.type() == Widget.ACT_TYPE.PRACTICE) {
				this.items().answered(true);
			}

			this.length(1);
		},

		"sig/render": function onRender() {
			return render.call(this);
		},

		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},

		nextStep: function onNextStep() {
			if (this.index() >= this.length() - 1) {
				return when.resolve();
			}

			this.index(this.index() + 1);

			return this.signal('render');
		},

		_onAnswerChecked: function () {
		}
	};

	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/sharing-pic-desc/choose-picture/main.html',[],function() { return function template(data) { var o = "";
var images = data.content.stockImages;
o += "\n<div class=\"ets-create-profile\">\n    <div class=\"ets-images-area\">\n\n        <div class=\"ets-tooltip\" data-weave=\"school-ui-activity/shared/tooltip/main\">\n            <!-- TODO: should from authoring tool -->\n            <span>" + data.content.descriptionTips + "</span>\n        </div>\n\n\n        <div class=\"ets-tooltip ets-tooltip-error\" data-weave=\"school-ui-activity/shared/tooltip/main\">\n        </div>\n\n        <div class=\"ets-gallery\">\n            <ul class=\"ets-cf\">\n                "; for(var i=0; i<images.length; i++) { o += "\n                <li>\n                    <a href=\"#\" class=\"ets-gallery-item\">\n                        <img src=\"" +images[i].url + "\">\n                        <span class=\"ets-shadow\"></span>\n                    </a> \n                </li>\n                "; } o += "\n            </ul>\n        </div>\n\n        <div class=\"ets-uploading\">\n            <div class=\"ets-progress\">\n                <div class=\"ets-progress-bg\">\n                    <div class=\"ets-current-progress\"></div>\n                </div>\n            </div>\n            <p data-blurb-id=\"443582\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Uploading\"></p>\n        </div>\n\n    \n        <div class=\"ets-reupload\">\n            <form action=\"#\" method=\"POST\" enctype=\"multipart/form-data\">\n                "; if (!data.isiPad) { o += "\n                <div>\n                    <div class=\"ets-btn ets-btn-blue ets-btn-shadowed\">\n                        <span data-blurb-id=\"467433\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Upload another picture\"></span>\n                        <input type=\"file\" name=\"UploadImage\" class=\"ets-file\"/>\n                    </div>\n                </div>\n                "; } o += "\n                <div>\n                    <div class=\"ets-btn ets-btn-white ets-btn-shadowed ets-select-library\">\n                        <span data-blurb-id=\"443595\" data-weave=\"troopjs-ef/blurb/widget\"  data-text-en=\"Select a picture from library\"></span>\n                    </div>\n                </div>\n            </form>\n        </div>\n\n        "; if (!data.isiPad && data.enableUpload) { o += "\n        <div class=\"ets-upload\">\n            <form action=\"#\" method=\"POST\" enctype=\"multipart/form-data\">\n                <span data-blurb-id=\"462924\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"or\">or</span> \n                <span class=\"upload-btn\">\n                    <a href=\"#\"><span data-blurb-id=\"467429\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"upload your own picture\"></span><input type=\"file\" name=\"UploadImage\" class=\"ets-file\"/></a>\n                </span>\n            </form>\n        </div>\n        "; } o += "\n    </div>\n    \n</div>"; return o; }; });
define('school-ui-activity/activity/sharing-pic-desc/choose-picture/main',[
	'jquery',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check",
	'template!./main.html',
	'school-ui-shared/utils/typeid-parser',
	'jquery.form',
	'jquery.ui'
], function ($, poly, when, Widget, browserCheck, tTemplate, idParser) {
	"use strict";

	var $ELEMENT = '$element';

	var SEL_UPLOAD = 'input[type="file"]';
	var SEL_CURRENT_PROGRESS = '.ets-current-progress';
	var SEL_TOOLTIP = '.ets-tooltip:not(.ets-tooltip-error)';
	var SEL_ERROR_TOOLTIP = '.ets-tooltip-error';
	var SEL_TOOLTIP_CONTENT = '.ets-tooltip-content';

	var CLS_SHOW_UPLOADING = 'ets-show-uploading';
	var CLS_SHOW_REUPLOAD = 'ets-show-reupload';

	var IS_IE = browserCheck.browser === "msie";

	var URL = {
		UPLOAD: "/services/schoolupload/SharingPictureDescr/UploadHandler.ashx?NeatUpload_PostBackID=" + (new Date()).getTime()
	};

	var HUB_SHOW_DESCR = 'activity/sharing-pic-desc/show/describe-srceen';

	/*!
	 * widget blurb
	 */
	var BLURB = "blurb!",
		BLURB_GENERAL_ERROR = BLURB + "467616",
		BLURB_ERROR_TOO_BIG = BLURB + "467614",
		BLURB_DIMENSITION_INCORRECT = BLURB + "467613",
		BLURB_FILE_TYPE_INCORRECT = BLURB + "467618";

	var BLURB_LIST = {};
	BLURB_LIST[BLURB_GENERAL_ERROR] = 'Upload file error: An unexpected error occurred. Please try it again or later!';
	BLURB_LIST[BLURB_ERROR_TOO_BIG] = 'Upload file error: The image size is too big, please select image no more than:';
	BLURB_LIST[BLURB_DIMENSITION_INCORRECT] = 'The image is too small. The minimum dimension is';
	BLURB_LIST[BLURB_ERROR_TOO_BIG] = 'The file you have uploaded is not supported. Please upload an image of the type JPG, GIF or PNG.';

	function getBlurb(status) {
		switch (status) {
			case 800:
				return BLURB_LIST[BLURB_ERROR_TOO_BIG]; //UploadFileToBig
			case 900:
				return BLURB_LIST[BLURB_DIMENSITION_INCORRECT] + ' 80px*80px'; //UploadFileDimensionIncorrect //todo: using configvalue
			case 500:
				return BLURB_LIST[BLURB_GENERAL_ERROR]; //UploadFileUnhandledError
			case 406:
				return BLURB_LIST[BLURB_FILE_TYPE_INCORRECT]; //UploadFileTypeIncorrect
			case 403:
				return BLURB_LIST[BLURB_GENERAL_ERROR]; //UnAuthorized
			case 404:
				return BLURB_LIST[BLURB_GENERAL_ERROR]; //UploadFileNotExists
			default:
				return BLURB_LIST[BLURB_GENERAL_ERROR];
		}
	}


	function toggleUpload() {
		var me = this;
		me[$ELEMENT].removeClass(CLS_SHOW_REUPLOAD).toggleClass(CLS_SHOW_UPLOADING);
	}

	// Toggle reupload area
	function toggleReupload() {
		var me = this;
		me[$ELEMENT].removeClass(CLS_SHOW_UPLOADING).toggleClass(CLS_SHOW_REUPLOAD);
	}

	function showErrorTooltip(msg) {
		var me = this;
		me[$ELEMENT].find(SEL_TOOLTIP).hide();
		me[$ELEMENT].find(SEL_ERROR_TOOLTIP)
			.show()
			.find(SEL_TOOLTIP_CONTENT).text(msg);
	}

	function hideErrorTooltip() {
		var me = this;
		me[$ELEMENT].find(SEL_TOOLTIP).show();
		me[$ELEMENT].find(SEL_ERROR_TOOLTIP).hide();
	}

	function uploadSubmit(e) {
		var me = this;
		var $target = $(e.target);
		var file = $(e.target).val();
		// If file is empty just quick return
		if (!file) {
			return;
		}

		$target.closest('form').ajaxSubmit({
			url: URL.UPLOAD,
			dataType: 'JSON',
			data: {
				'ActivityId': me._ActivityId,
				'StudentId': me._StudentId,
				'CultureCode': me._cultureCode
			},
			beforeSend: function () {
				hideErrorTooltip.call(me);
				toggleUpload.call(me);
				// Fallback uploading progress animation for IE
				if (IS_IE) {
					startAnimate(me.$currentProgress);
				}
			},
			uploadProgress: function (e, pos, total, percent) {
				me.$currentProgress.width(percent + '%');
			},
			success: function (res) {
				if (IS_IE) {
					stopAnimate(me.$currentProgress);
				}

				switch (res.Status) {
					case 200: //success
						toggleUpload.call(me);
						me.publish(HUB_SHOW_DESCR, {
							url: res.ImagePath,
							isLibrary: false,
							cropped: false,
							from: 'choose-picture'
						});
						break;
					case 800: //UploadFileToBig
					case 900: //UploadFileDimensionIncorrect
					case 500: //UploadFileUnhandledError
					case 406: //UploadFileTypeIncorrect
					case 403: //UnAuthorized
					case 404: //UploadFileNotExists
						showErrorTooltip.call(me, getBlurb(res.Status));
						toggleReupload.call(me);
						break;
				}

				// Clear input file's value
				$target.closest('form')[0].reset();
			},
			error: function (jqXHR) {
				switch (jqXHR.status) {
					case 504:
					case 413:
					case 0:
						var msg = BLURB_LIST[BLURB_ERROR_TOO_BIG] + ' 1024KB';
						showErrorTooltip.call(me, msg);
						break;
					default:
						showErrorTooltip.call(me, BLURB_LIST[BLURB_GENERAL_ERROR]);
						break;
				}

				toggleReupload.call(me);

				// Clear input file's value
				$target.closest('form')[0].reset();
			}
		});
	}

	function startAnimate($el) {
		$el.animate({
			left: '-10px'
		}, function () {
			$el.css({
				left: 0
			});
			startAnimate($el);
		});
	}

	function stopAnimate($el) {
		$el.stop(true, true);
	}

	function loadBlurb() {
		var me = this;
		var blurbList = BLURB_LIST;

		var q = Object.keys(BLURB_LIST);
		return me.query(q)
			.spread(function doneQuery() {
				$.each(arguments, function (i, blurb) {
					var translation = blurb && blurb.translation;
					if (translation) {
						blurbList[blurb.id] = translation;
					}
				});
			});
	}

	function render() {
		var me = this;

		return when.resolve()
			.then(function () {
				return me.query('ccl!"school.sharingTemplate.upload.enable"')
					.spread(function (enableUpload) {
						me._json.enableUpload = enableUpload && enableUpload.value === "true";
					})
					.otherwise(function ignoreError() {
					});
			})
			.then(function () {
				return me.html(tTemplate, me._json)
					.then(function () {
						me.$upload = me[$ELEMENT].find(SEL_UPLOAD);

						me.$upload.each(function () {
							$(this).on('change', $.proxy(uploadSubmit, me));
						});

						me.$currentProgress = me[$ELEMENT].find(SEL_CURRENT_PROGRESS);
					});
			});

	}

	// Constructor
	function ctor(el, module, json) {
		var me = this;
		var isiPad = /ipad/ig.test(navigator.userAgent);

		me._json = json;
		me._json.isiPad = isiPad;
		// Default culture code is 'en'
		me._cultureCode = 'en';

		// Load blurb
		loadBlurb.call(me);
	}

	// Methods
	var methods = {
		'sig/initialize': function () {
			var me = this;

			return render.call(me);
		},
		'hub:memory/context': function (context) {
			var me = this;
			me._cultureCode = context.cultureCode;
			me._StudentId = idParser.parseId(context.user.id);
		},
		'hub:memory/start/load/activity': function (activity) {
			var me = this;
			me._ActivityId = idParser.parseId(activity.id);
		},

		'dom:.ets-gallery-item/click': function ($e) {
			$e.preventDefault();
			var me = this;
			var url = $($e.currentTarget).find('img').attr('src');
			me.publish(HUB_SHOW_DESCR, {
				url: url,
				isLibrary: true,
				from: 'choose-picture'
			});
		},
		'dom:.ets-select-library/click': function ($e) {
			$e.preventDefault();
			var me = this;
			toggleReupload.call(me);
			hideErrorTooltip.call(me);
		}
	};

	return Widget.extend(ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/sharing-pic-desc/describe/main.html',[],function() { return function template(data) { var o = "";  
    var outputBlurb = function (id,en) {
        var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
        return res;
    };
o += "\n<div class=\"ets-act-st ets-cf\">\n    <div class=\"ets-create-profile\">\n        <div class=\"ets-profile-image\">\n            <div class=\"ets-tooltip ets-tooltip-error\" data-weave=\"school-ui-activity/shared/tooltip/main\">\n            </div>\n\n            <div class=\"ets-corp-area\" >\n                <img src=\"\">\n            </div>\n            <div class=\"ets-btn-change\">\n                <div class=\"ets-btn ets-btn-white ets-btn-shadowed ets-btn-change-button\">\n                    <span " + outputBlurb(467430,"Change Picture") + "></span>\n                </div>\n            </div>\n            <div class=\"ets-edit-entry ets-none\">\n                <div class=\"ets-btn ets-btn-white ets-btn-shadowed ets-edit-entry-button\">\n                    <span " + outputBlurb(467434,"Edit your entry") + " ></span>\n                </div>\n            </div>\n        </div>\n        <div class=\"ets-describe-area ets-none\">\n            <div class=\"ets-tooltip ets-none\" data-weave=\"school-ui-activity/shared/tooltip/main\">\n                <span>" + data.content.pickImgTips + "</span>\n            </div>\n\n            <textarea id=\"input-describe\" cols=\"30\" rows=\"10\" data-weave=\"school-ui-activity/shared/textchange/main\"></textarea>\n             \n            <div class=\"share-info\">\n                <label for=\"agree-share\" data-weave=\"school-ui-activity/shared/checkbox/main\">\n                    <input type=\"checkbox\" id=\"agree-share\" name=\"agree-share\" checked=\"checked\">\n                    <i class=\"icon-people\"></i> <span data-blurb-id=\"467432\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Share my post with other students\"></span>\n                </label>\n            </div>\n            <div class=\"ets-btn ets-btn-blue ets-btn-shadowed ets-disabled ets-describe-submit-button\"\n                 data-action=\"submit\">";/* data-action="submit" is used by tests */o += "\n                <span data-blurb-id=\"462455\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Submit\"></span>\n            </div>\n        </div>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/sharing-pic-desc/describe/main',[
	'jquery',
	'poly',
	'when',
	'troopjs-utils/merge',
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check",
	'template!./main.html',
	'school-ui-shared/utils/typeid-parser',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'jquery.counter'
], function ($, poly, when, merge, Widget, browserCheck, tTemplate, idParser) {
	"use strict";

	var $ELEMENT = '$element';

	var PREVIEW_WIDTH = 310;
	var PREVIEW_HEIGHT = 310;
	var THUMBNAIL_WIDTH = 110;
	var THUMBNAIL_HEIGHT = 110;

	var WARN_TEXT_LENGTH = 190;

	var SEL_PREVIEW_IMG = '.ets-corp-area img';
	var SEL_DESCRIBE_AREA = '.ets-describe-area';
	var SEL_TEXTAREA = 'textarea';
	var SEL_SUBMIT = '.ets-btn-blue';
	var SEL_COUNTER = '#input-describe_counter';
	var SEL_PROFILE_IMG = '.ets-profile-image';
	var SEL_TEXTAREA_TOOLTIP = '.ets-describe-area .ets-tooltip';
	var SEL_GENERAL_TOOLTIP = '.ets-profile-image .ets-tooltip';
	var SEL_TOOLTIP_CONTENT = '.ets-tooltip-content';
	var SEL_AGREE_SHARE = '#agree-share';
	var SEL_CHANGE_PICTURE = ".ets-btn-change";
	var SEL_EDIT_ENTRY = ".ets-edit-entry";

	var CLS_NONE = 'ets-none';
	var CLS_WARNING = 'ets-warning';
	var CLS_DISABLED = 'ets-disabled';
	var CLS_FOCUS = 'ets-focus';
	var CLS_SUCCESS = 'ets-tooltip-success';
	var CLS_ERROR = 'ets-tooltip-error';
	var CLS_CHECKBOX = 'ets-checkbox-checked';
	var CLS_TOOLTIP_IE8 = 'ets-tooltip-ie8';


	var HUB_SHOW_CHOOSE = "activity/sharing-pic-desc/show/choose-picture-screen";
	var HUB_SHOW_WALL = 'activity/sharing-pic-desc/show/picture-wall-screen';
	var HUB_ENABLE_NEXT = 'activity/sharing-pic-desc/enable/next';

	/*!
	 * widget blurb
	 */
	var BLURB = "blurb!",
		BLURB_GENERAL_ERROR = BLURB + "467616",
		BLURB_SAVE_ERROR = BLURB + "467617",
		BLURB_COMPLETE = BLURB + "467615";

	var BLURB_LIST = {};
	BLURB_LIST[BLURB_GENERAL_ERROR] = 'Upload file error: An unexpected error occurred. Please try it again or later!';
	BLURB_LIST[BLURB_SAVE_ERROR] = 'There is an unexpected error occured when save your entity. Please try it again or later!';
	BLURB_LIST[BLURB_COMPLETE] = 'Completed. Good job!';

	function showCompleteTooltip() {
		var me = this;
		me.$generalTooltip.addClass(CLS_SUCCESS).removeClass(CLS_ERROR)
			.show()
			.find(SEL_TOOLTIP_CONTENT).text(BLURB_LIST[BLURB_COMPLETE]);
	}

	function hideGeneralTooltip() {
		var me = this;
		me.$generalTooltip.hide();
	}

	function showErrorTooltip(msg) {
		var me = this;
		me.$generalTooltip.addClass(CLS_ERROR).removeClass(CLS_SUCCESS)
			.show()
			.find(SEL_TOOLTIP_CONTENT).text(msg);
	}

	function hideErrorTooltip() {
		var me = this;
		me.$generalTooltip.addClass(CLS_ERROR).removeClass(CLS_SUCCESS)
			.hide();
	}

	function showPreview() {
		var me = this;
		var url = me._json.url;
		var img = new Image();

		if (browserCheck.browser === "msie") {
			img.onreadystatechange = onload;
		} else {
			img.onload = onload;
		}

		img.src = url;

		function onload() {
			me.$previewImage.attr('src', url);
			if (me._json.isLibrary || me._json.cropped) {
				me.$previewImage.css({
					width: '100%',
					height: '100%'
				});
				return;
			}

			me.$previewImage.css("cursor", 'move');

			var width = me.$previewImage.width() - PREVIEW_WIDTH;
			var height = me.$previewImage.height() - PREVIEW_HEIGHT;

			me.$previewImage.draggable({
				drag: function (e, ui) {

					if (ui.position.left >= 0) {
						ui.position.left = 0;
					}
					if (ui.position.top >= 0) {
						ui.position.top = 0;
					}
					if (ui.position.left <= -width) {
						ui.position.left = -width;
					}
					if (ui.position.top <= -height) {
						ui.position.top = -height;
					}
				}
			});
		}

	}

	function destroyDraggable() {
		var me = this;

		if (me.$previewImage.data('ui-draggable')) {
			me.$previewImage.draggable('destroy');
		} //draggable not initialized if "me._json.isLibrary || me._json.cropped", don't destroy

		me.$previewImage.removeAttr('style');
	}

	function showDescribeArea() {
		var me = this;

		if (typeof me._json.describe !== 'undefined') {
			var _desc = me._json.describe.replace(/(<|(?:&lt;))/g, '$1 ');
			var _descDecode = $('<div/>').html(_desc).text();
			me.$textarea.val(_descDecode.replace(/((<|(?:&lt;))\s)/g, '$2'));
			delete me._json.describe;
		}

		if (typeof me._json.isPrivate !== 'undefined' && me._json.isPrivate) {
			me.$agreeShare.parent('span').removeClass(CLS_CHECKBOX);
			me.$agreeShare.prop('checked', false);
		}
		else {
			me.$agreeShare.parent('span').addClass(CLS_CHECKBOX);
			me.$agreeShare.prop('checked', true);
		}

		toggleSubmitButton.call(me, me.$textarea.val().length);

		me.$describeArea.show("slide", {
			direction: "left"
		}, 'normal', function () {
			me.$textarea.focus();
			if (me.$textareaTooltip.hasClass(CLS_TOOLTIP_IE8)) {
				me.$textareaTooltip.css('top', (-1) * (me.$textareaTooltip.height())).show();
			}
			else {
				me.$textareaTooltip.css('top', (-1) * (me.$textareaTooltip.height() + 10)).show();
			}
		});
	}

	function hideDescribeArea() {
		var me = this;

		return when.promise(function (resolve) {
			me.$textareaTooltip.hide();
			//hide describe area
			me.$describeArea.hide("slide", {
				direction: "left"
			}, 'slow', resolve);
		});
	}

	function getCroppedImage(imageUrl) {
		var me = this;

		function onDone() {
			destroyDraggable.call(me);
			me.$previewImage.attr('src', url)
				.css({
					width: '100%',
					height: '100%'
				});
		}

		if (me._json.isLibrary) {
			return when.resolve().tap(onDone);
		}

		var url = imageUrl;

		var image = new Image;
		image.src = url;

		return when.promise(function (resolve) {
			$(image).one('load', resolve);
		}).tap(onDone);
	}

	function zoomOutPreview() {
		var me = this;

		return when.promise(function (resolve) {
			me[$ELEMENT].find(SEL_PROFILE_IMG)
				.animate({
					width: THUMBNAIL_WIDTH,
					height: THUMBNAIL_HEIGHT
				}, 'normal', function () {
					me._isShrink = true;
					resolve();
				})
				.find(SEL_CHANGE_PICTURE).addClass(CLS_NONE);
		});
	}

	function zoomInPreview() {
		var me = this;

		return when.promise(function (resolve) {
			me[$ELEMENT].find(SEL_PROFILE_IMG)
				.animate({
					width: PREVIEW_WIDTH,
					height: PREVIEW_HEIGHT
				}, 'normal', function () {
					me._isShrink = false;
					$(this).find(SEL_CHANGE_PICTURE).removeClass(CLS_NONE);
					me.$previewImage.css({
						width: '100%',
						height: '100%'
					});
					resolve();
				});
		});
	}

	function toggleSubmitButton(textLength) {
		var me = this;
		if (textLength) {
			me.$submit.removeClass(CLS_DISABLED);
		} else {
			me.$submit.addClass(CLS_DISABLED);
		}
	}

	function saveEntity(data) {
		var me = this;

		var left = parseInt(me.$previewImage.css('left'), 10) || 0;
		var top = parseInt(me.$previewImage.css('top'), 10) || 0;

		var ajaxData = merge.call({
			"data": JSON.stringify({
				"activity_id": me.activity_id,
				"descr": $.trim(me.$textarea.val()),
				"imagePath": me._json.url,
				"isPrivate": !me.$agreeShare.prop('checked'),
				"height": PREVIEW_HEIGHT,
				"width": PREVIEW_WIDTH,
				"xAxis": -left,
				"yAxis": -top,
				"isFromLibrary": me._json.isLibrary
			})
		}, me._saveAndCropImage);

		return me.publish("ajax", ajaxData)
			.tap(hideErrorTooltip.bind(me))
			.then(function (res) {
				me.publish(HUB_ENABLE_NEXT);
				if (res && res[0].saveResult) {
					data.imageUrl = res[0].cropedFileName;
				}

				when
					.all([
						hideDescribeArea.call(me),
						getCroppedImage.call(me, data.imageUrl)
					])
					.then(function () {
						if (me._noOthers) {
							showCompleteTooltip.call(me);
							me.$changePicture.addClass(CLS_NONE);
							me.$editEntry.removeClass(CLS_NONE);
						} else {
							zoomOutPreview.call(me)
								.then(function () {
									me.publish(HUB_SHOW_WALL, data);
								});
						}
					});
			})
			.otherwise(function () {
				showErrorTooltip.call(me, BLURB_LIST[BLURB_SAVE_ERROR]);
			});
	}

	function render() {
		var me = this;

		return me.html(tTemplate, me._content)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this;

		me.$textarea = me[$ELEMENT].find(SEL_TEXTAREA);
		me.$textarea.counter({
			goal: 200
		});

		me.$submit = me[$ELEMENT].find(SEL_SUBMIT);
		me.$describeArea = me[$ELEMENT].find(SEL_DESCRIBE_AREA);
		me.$previewImage = me[$ELEMENT].find(SEL_PREVIEW_IMG);
		me.$textareaTooltip = me[$ELEMENT].find(SEL_TEXTAREA_TOOLTIP);
		me.$generalTooltip = me[$ELEMENT].find(SEL_GENERAL_TOOLTIP);
		me.$agreeShare = me[$ELEMENT].find(SEL_AGREE_SHARE);
		me.$editEntry = me[$ELEMENT].find(SEL_EDIT_ENTRY);
		me.$changePicture = me[$ELEMENT].find(SEL_CHANGE_PICTURE);
	}

	function showWithoutAnimation() {
		var me = this;
		if (me._json) {
			showPreview.call(me);
			showDescribeArea.call(me);
		}
	}

	function showWithAnimation() {
		var me = this;

		zoomInPreview.call(me)
			.then(showDescribeArea.bind(me));
	}

	function showCompleted() {
		var me = this;

		me.$changePicture.addClass(CLS_NONE);
		me.$editEntry.removeClass(CLS_NONE);
		showPreview.call(me);
		showCompleteTooltip.call(me);
	}

	function loadBlurb() {
		var me = this;
		var blurbList = BLURB_LIST;

		var q = Object.keys(BLURB_LIST);
		return me.query(q)
			.spread(function doneQuery() {
				$.each(arguments, function (i, blurb) {
					var translation = blurb && blurb.translation;
					if (translation) {
						blurbList[blurb.id] = translation;
					}
				});
			});
	}


	// Constructor
	function ctor(module, el, content) {
		var me = this;
		me._isShrink = false;
		me._json = null;
		me._content = content;
		// Load blurb
		loadBlurb.call(me);
	}

	// Methods
	var methods = {
		'sig/initialize': function () {
			return render.call(this);
		},
		'hub/activity/sharing-pic-desc/describe/reload': function (data) {
			var me = this;
			var isNoOthersCompleted = me._noOthers && (data && data.from !== 'choose-picture');
			me._json = data;

			// If the preview is shrinked,
			// then zoom in it and show describe area
			if (me._isShrink) {
				showWithAnimation.call(me);
			} else {

				if (isNoOthersCompleted) {
					showCompleted.call(me);
				} else {
					showWithoutAnimation.call(me);
				}
			}

		},
		'dom:.ets-btn-change-button/click': function ($e) {
			$e.preventDefault();
			var me = this;

			me.$generalTooltip.hide();

			var hideDescribeAreaPromise;
			if (me.$describeArea.is(':visible')) {
				hideDescribeAreaPromise = hideDescribeArea.call(me);
			} else {
				hideDescribeAreaPromise = when.resolve();
			}

			hideDescribeAreaPromise.then(function () {
				destroyDraggable.call(me);
				hideErrorTooltip.call(me);
				me.publish(HUB_SHOW_CHOOSE);
			});
		},
		'dom:.ets-edit-entry-button/click': function () {
			var me = this;
			me.$changePicture.removeClass(CLS_NONE);
			me.$editEntry.addClass(CLS_NONE);
			hideGeneralTooltip.call(me);
			showDescribeArea.call(me);
		},
		'dom:#input-describe/EFTextChange': function () {
			var me = this;
			var textLength = $.trim(me.$textarea.val()).length;

			if (textLength > WARN_TEXT_LENGTH) {
				me[$ELEMENT].find(SEL_COUNTER).addClass(CLS_WARNING);
			} else {
				me[$ELEMENT].find(SEL_COUNTER).removeClass(CLS_WARNING);
			}

			toggleSubmitButton.call(me, textLength);
		},
		'dom:.ets-describe-submit-button/click': function ($e) {
			$e.preventDefault();
			var me = this;

			if (me.$submit.hasClass(CLS_DISABLED)) {
				return;
			}

			var data = {
				imageUrl: me.$previewImage.attr('src'),
				describe: me.$textarea.val(),
				isPrivate: !me.$agreeShare.prop('checked')
			};

			saveEntity.call(me, data);
		},

		'dom:#input-describe/focusin': function () {
			var me = this;
			me.$describeArea.addClass(CLS_FOCUS);
		},
		'dom:#input-describe/focusout': function () {
			var me = this;
			me.$describeArea.removeClass(CLS_FOCUS);
		},
		'hub:memory/start/load/activity': function (activity) {
			this.activity_id = idParser.parseId(activity.id);
		},
		'hub:memory/activity/sharing-pic-desc/describe/no/others': function () {
			this._noOthers = true;
		},
		'hub:memory/context': function (context) {
			this._saveAndCropImage = context.api['action/sharingpicturedescr/SaveAndCropImage'];
		}
	};

	return Widget.extend(ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/sharing-pic-desc/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-st ets-cf\">\n    <div class=\"ets-choose-picture-screen ets-none\"></div>\n    <div class=\"ets-share-and-describe-screen ets-none\"></div>\n    <div class=\"ets-picture-wall-screen ets-none\" data-weave=\"school-ui-activity/activity/sharing-pic-desc/picture-wall/main\"></div>\n</div>"; return o; }; });
define('school-ui-activity/activity/sharing-pic-desc/main',[
	'jquery',
	'when',
	'../base/main',
	'template!./main.html'
], function ($, when, Widget, tTemplate) {
	"use strict";

	var $ELEMENT = '$element';

	var WID_CHOOSE_PIC = 'school-ui-activity/activity/sharing-pic-desc/choose-picture/main';
	var WID_DESCRIBE = "school-ui-activity/activity/sharing-pic-desc/describe/main";

	var SEL_PIC_SCREEN = '.ets-choose-picture-screen';
	var SEL_DESC_SCREEN = '.ets-share-and-describe-screen';
	var SEL_PIC_WALL = '.ets-picture-wall-screen';

	var CLS_NONE = 'ets-none';

	var HUB_DESCRIBE = "activity/sharing-pic-desc/describe/reload";
	var HUB_PICTURE_WALL = "activity/sharing-pic-desc/picture-wall/reload";
	var HUB_ENABLE_NEXT = "activity/sharing-pic-desc/enable/next";

	// Switch screen
	function switchScreen(sel, hub, data) {
		var me = this;
		me[$ELEMENT].find(sel).removeClass(CLS_NONE).siblings().addClass(CLS_NONE);

		if (hub) {
			me.publish(hub, data);
		}
	}

	function render() {
		var me = this;

		return me.html(tTemplate, me._json)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this;

		when.resolve()
			.then(function () {
				return me[$ELEMENT].find(SEL_PIC_SCREEN)
					.data('json', me._json)
					.attr('data-weave', WID_CHOOSE_PIC + "(json)")
					.weave()
			})
			.then(function () {
				return me[$ELEMENT].find(SEL_DESC_SCREEN)
					.data('json', me._json)
					.attr('data-weave', WID_DESCRIBE + '(json)')
					.weave();
			})
			.then(function () {
				// If this activity has bee passed,
				// then use the picture wall directly
				if (me.hasPassed) {
					switchScreen.call(me, SEL_PIC_WALL, HUB_PICTURE_WALL);
					me.publish(HUB_ENABLE_NEXT);
				} else {
					switchScreen.call(me, SEL_PIC_SCREEN);
				}
			});
	}

	// Methods
	var methods = {
		'sig/render': function () {
			return render.call(this);
		},
		'hub/activity/sharing-pic-desc/show/describe-srceen': function (data) {
			var me = this;
			switchScreen.call(me, SEL_DESC_SCREEN, HUB_DESCRIBE, data);
		},
		'hub/activity/sharing-pic-desc/show/choose-picture-screen': function () {
			var me = this;
			switchScreen.call(me, SEL_PIC_SCREEN)
		},
		'hub/activity/sharing-pic-desc/show/picture-wall-screen': function (data) {
			var me = this;
			switchScreen.call(me, SEL_PIC_WALL, HUB_PICTURE_WALL, data);
		},
		'hub/activity/sharing-pic-desc/enable/next': function () {
			// Enable NEXT button
			this.items().completed(true);
		}
	};

	return Widget.extend(methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/sharing-pic-desc/picture-wall/main.html',[],function() { return function template(data) { var o = "";
    var others = data.others;
    var myself = data.myself;
    var imagePath;
    function getImagePath(isFromLibrary, imgPath) {
        if(imgPath.indexOf('http:') < 0) { //todo: delete the line after 15-1 release
            imgPath = (isFromLibrary ? data.cacheServer : data.uploadCacheServer) + imgPath;
        }
        return imgPath;
    }
o += "\n<ul class=\"ets-profile-wall ets-cf\">\n    "; for (var i = 0, len = others.length; i < len; i++ ) {
        imagePath = getImagePath(others[i].isFromLibrary, others[i].imagePath);
    o += "\n    <li "; if (i === 9) { o += "class=\"ets-add-margin-right\""; } o += ">\n        <a href=\"#\" student-id=\"" + others[i].studentId + "\" class=\"ets-profile-wall-item\">\n            <img src=\"" + imagePath + "\">\n            <div class=\"ets-shadow\"></div>\n        </a>\n\n        <div class=\"ets-tooltip ets-left-arrow\" data-weave=\"school-ui-activity/shared/tooltip/main\">\n            <p>" + others[i].descr + "</p>\n\n            <div class=\"ets-person-info\">\n                <img src=\"" + others[i].avatar + "\" width=\"40\" height=\"40\" alt=\"\">\n                <div class=\"ets-info\">\n                    <p class=\"ets-name\">" +others[i].firstName+ "</p>\n                    "; if (others[i].countryFlag) { o += "\n                    <p class=\"ets-location\">\n                        <img src=\"/_imgs/friends/flags/" + others[i].countryFlag + ".gif\" width=\"16\" height=\"11\"/>\n                        <span>" + others[i].country + "</span>\n                    </p>\n                    "; } o += "\n                </div>\n            </div>\n        </div>\n\n    </li>\n    "; } o += "\n    "; for (var j = i; j < 20; j++) { o += "\n    <li class=\"ets-profile-placeholder "; if (j === 9) { o += "ets-add-margin-right"; } o += "\">\n        <a class=\"ets-profile-wall-item-placeholder\">\n            <div class=\"ets-shadow\"></div>\n        </a>\n    </li>\n    "; } o += "\n</ul>\n<div class=\"ets-profile-me\">\n    <a href=\"#\" class=\"ets-profile-wall-item\">\n        <img src=\""; if (myself && myself.imagePath) { o += "" + getImagePath(myself.isFromLibrary, myself.imagePath) + '?' + (new Date).getTime(); } o += "\">\n        <div class=\"ets-shadow\"></div>\n    </a>\n    \n    <div class=\"ets-tooltip ets-left-arrow\" data-weave=\"school-ui-activity/shared/tooltip/main\">\n        <p>"; if (myself && myself.descr) { o += "" + myself.descr; } o += "</p>\n\n        <div class=\"ets-person-info\">\n            <img src=\"" + myself.avatar+ "\" width=\"40\" height=\"40\" alt=\"\">\n                <div class=\"ets-info\">\n                    <p class=\"ets-name\">" + myself.firstName + "</p>\n                    "; if (myself.countryFlag) { o += "\n                    <p class=\"ets-location\">\n                        <img src=\"/_imgs/friends/flags/" + myself.countryFlag + ".gif\" width=\"16\" height=\"11\"/>\n                        <span>" + myself.country + "</span>\n                    </p>\n                    "; } o += "\n                </div>\n        </div>\n\n        <div class=\"ets-tooltip-btns\">\n            <span class=\"ets-btn-small ets-btn-white ets-btn-shadow ets-profile-edit-button\">\n                <span data-blurb-id=\"467434\" data-text-en=\"Edit your entry\"></span>\n            </span>\n        </div>\n    </div>\n</div>\n\n<div class=\"ets-msg-box\">\n    <div class=\"ets-content\">\n        <h3 data-blurb-id=\"467619\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"See what other students like\"></h3>\n        <p data-blurb-id=\"467620\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"There are thousands of other students learning English at Englishtown. Take a minute to browse around and see what food the other students in the school like.\"></p>\n        <p data-blurb-id=\"467621\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Click on the pictures to read their stories.\"></p>\n\n        <div class=\"ets-btn ets-btn-blue ets-btn-shadowed ets-msg-box-close-button\">\n            <span data-blurb-id=\"462940\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Close\">\n            </span>\n        </div>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/sharing-pic-desc/picture-wall/main',[
	"jquery",
	"poly",
	'when',
	'troopjs-ef/component/widget',
	'template!./main.html',
	'school-ui-shared/utils/typeid-parser',
	'jquery.ui'
], function DemoModule($, poly, when, Widget, template, idParser) {
	"use strict";

	var $ELEMENT = '$element';

	var SEL_ME = '.ets-profile-me';
	var SEL_ME_IMG = '.ets-profile-me img';
	var SEL_ME_LINK = '.ets-profile-me a';
	var SEL_PROFILE_WALL = '.ets-profile-wall';
	var SEL_PROFILES = '.ets-profile-wall li';
	var SEL_MSG = '.ets-msg-box';
	var SEL_DESC = '.ets-tooltip-content > p:eq(0)';
	var SEL_ST = '.ets-act-st';

	var CLS_NONE = 'ets-none';
	var CLS_ON = 'ets-on';
	var CLS_ACT = 'ets-act-sharing-pic-desc';

	var STARTED = '_started';

	var HUB_DESCRIBE_SHOW = "activity/sharing-pic-desc/show/describe-srceen";
	var HUB_NO_OTHERS = 'activity/sharing-pic-desc/describe/no/others';

	function loadProfiles() {
		var me = this;

		function loadSharedPictureDescrs() {
			return me._activityLoaded.promise
				.then(function () {
					var q = "sharing_picture_descr!" + me.activity_id;
					return me.query(q)
				})
				.spread(function (sharingData) {
					return sharingData;
				});
		}

		function loadUploadCacheServer() {
			return me.query('ccl!"school.sharingTemplate.upload.cacheServer"')
				.spread(function (cclUploadCacheServer) {
					return cclUploadCacheServer;
				});
		}

		return when.all([
			loadSharedPictureDescrs(),
			loadUploadCacheServer()
		]).spread(function (sharingData, cclUploadCacheServer) {
			if (!me[STARTED]) {
				return when.reject();
			}

			if (!sharingData || !sharingData.pictureWall || sharingData.pictureWall.length < 3) {
				me.publish(HUB_NO_OTHERS);
			}

			me._json.others = sharingData.pictureWall;
			me._json.myself = sharingData.studentSharing;
			me._json.uploadCacheServer = cclUploadCacheServer.value;
		});
	}

	function updateMyProfile(data) {
		var me = this;

		me[$ELEMENT].find(SEL_ME + " a > img").attr('src', data.imageUrl);
		me[$ELEMENT].find([SEL_ME, SEL_DESC].join(' ')).text(data.describe);

		me._json.myself.descr = data.describe;
		me._json.myself.isPrivate = data.isPrivate;

		if (!me[$ELEMENT].find(SEL_ME).hasClass(CLS_ON)) {
			showMySelf.call(me);
		}

		return when.resolve();
	}


	function closeCompleteMsg() {
		var me = this;
		me[$ELEMENT].find(SEL_MSG).fadeOut('fast', function () {
			$(this).remove();
		});
	}

	function showMySelf() {
		var me = this;

		me[$ELEMENT].find(SEL_ME_LINK).trigger('click');
	}

	function endingAnimation() {
		var me = this;
		me[$ELEMENT].addClass(CLS_NONE);
		return when.resolve();
	}

	function backToDescribScreen() {
		var me = this;
		me.publish(HUB_DESCRIBE_SHOW, {
			url: me[$ELEMENT].find(SEL_ME_IMG).attr('src'),
			isLibrary: me._json.myself.isFromLibrary,
			describe: me._json.myself.descr,
			isPrivate: me._json.myself.isPrivate,
			cropped: true
		});
	}

	function render() {
		var me = this;
		return me.html(template, me._json)
			.then(function () {
				me[$ELEMENT].find('.ets-tooltip-btns [data-blurb-id]')
					.attr('data-weave', 'troopjs-ef/blurb/widget')
					.weave();
				me.$profileWall = me[$ELEMENT].find(SEL_PROFILE_WALL);

				$(document.body).on('click.' + CLS_ACT, function (e) {
					me.$profileWall.css('zIndex', '');

					me[$ELEMENT].find(SEL_ME).removeClass(CLS_ON);
					me[$ELEMENT].find(SEL_PROFILES).removeClass(CLS_ON);
				});
			}).then(me._dfdRendered.resolve);
	}

	function ctor() {
		var me = this;
		me._json = {};
		me.edge = me[$ELEMENT].closest(SEL_ST).offset().left + 980;
		me._contextLoaded = when.defer();
		me._activityLoaded = when.defer();
		me._dfdRendered = when.defer();
	}

	// Log visit this picture's user
	// TODO: log api will be wrapped in etroop service later
	function logVisit($target) {
		var me = this;

		var studentId = $target.attr("student-id");
		me._contextLoaded.promise
			.then(function () {
				var params = {
					visitor_id: me._json.myself.studentId,
					activity_id: me.activity_id,
					student_id: studentId,
					'StudentId': me._StudentId
				};
				if (params.visitor_id && params.activity_id && params.student_id) {
					$.get("/services/school/social/SharingPictureDescr/picturevisit", params);
				}
			});
	}

	var methods = {
		"sig/start": function () {
			var me = this;

			me[STARTED] = true;

			//don't wait loadProfile to return so hub:memory/start/load/activity can be called
			loadProfiles.call(me)
				.then(render.bind(me));

			return when.resolve();
		},
		"sig/stop": function () {
			var me = this;
			me[STARTED] = false;
			$(document.body).off('click.' + CLS_ACT);
		},

		"hub/activity/sharing-pic-desc/picture-wall/reload": function (data) {
			var me = this;
			me._dfdRendered.promise.then(function () {
				if (!me._json.others.length) {
					me[$ELEMENT].addClass(CLS_NONE);
					backToDescribScreen.call(me);
				}

				if (data) {
					updateMyProfile.call(me, data);
				}
			});
		},

		'hub/st/picture-wall/show/myself': function () {
			var me = this;

			me.$element.find(SEL_ME_LINK).trigger('click');
		},
		'hub:memory/context': function (context) {
			var me = this;
			me._StudentId = idParser.parseId(context.user.id);
			me._json.cacheServer = context.cacheServer;
			me._contextLoaded.resolve();
		},
		'dom:.ets-profile-wall-item-placeholder/click': function (event) {
			event.preventDefault();
		},
		'dom:.ets-profile-wall-item/click': function ($e) {
			$e.preventDefault();
			$e.stopPropagation();
			var me = this;
			var $target = $($e.currentTarget);
			var $tooltip = $target.next();
			var isMe = $target.closest(SEL_ME).length ? true : false;
			var $parent = isMe ? $target.closest(SEL_ME) : $target.closest('li');

			closeCompleteMsg.call(this);

			if (isMe) {
				$parent.toggleClass(CLS_ON);
				me[$ELEMENT].find(SEL_PROFILES).removeClass(CLS_ON);
			} else {
				me.$profileWall.css('zIndex', 2);
				$parent.siblings().removeClass(CLS_ON).end()
					.toggleClass(CLS_ON);
				me[$ELEMENT].find(SEL_ME).removeClass(CLS_ON);
				//track click pciture event log
				logVisit.call(me, $target);
			}


			var height = $tooltip.height();
			var width = $tooltip.width();

			$tooltip.css('margin-top', -(height / 2));

			if (me.edge - $tooltip.offset().left < width) {
				$tooltip.addClass('ets-right-arrow');
			}
		},
		"dom:.ets-profile-edit-button/click": function ($e) {
			$e.preventDefault();
			$e.stopPropagation();
			var me = this;

			endingAnimation.call(me)
				.then(backToDescribScreen.bind(me));
		},
		'hub:memory/start/load/activity': function (activity) {
			this.activity_id = idParser.parseId(activity.id);
			this._activityLoaded.resolve();
		},
		'dom:.ets-msg-box-close-button/click': function ($e) {
			$e.preventDefault();
			$e.stopPropagation();
			var me = this;

			closeCompleteMsg.call(me);

			//show my profile
			showMySelf.call(me);
		}
	};


	return Widget.extend(ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/speaking-challenge-new/main.html',[],function() { return function template(data) { var o = "";
var isAudioInputAvailable = data.references && data.references.aud && data.references.aud.url;
var isModelAudioInputAvailable = data.modelAud && data.modelAud.url;
o += "\n<div class=\"gud text-center\">\n\n    <div class=\"ets-act-spc-new ets-cf\">\n\n        "; if (isModelAudioInputAvailable) { o += "\n            <div class=\"glyphicon glyphicon-volume-up active js-toggle\">\n                <div class=\"tooltip-volume-up \" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"655958\">Listen to a model audio to what it sounds like</div>\n            </div>\n         "; } o += "\n\n\n        <div class=\"ets-act-spc-l\">\n\n            \n            <div class=\"ets-act-spc-content asr-output ets-act-disabled-" + Boolean(isAudioInputAvailable) + "\">\n                <!-- asr component -->\n                <div class=\"title\"><strong data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"655954\">Record your Audio</strong></div>\n                <div class=\"ets-act-spc-asr\">\n                    <div data-weave=\"school-ui-activity/shared/asr/asr-ui\"></div>\n                    <div class=\"ets-tooltip\">\n                        <div class=\"ets-tooltip-content\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"464924\">\n                            Press to record\n                        </div>\n                    </div>\n                </div>\n\n                <div class=\"ets-act-record\">\n                    <div class=\"ets-tooltip ets-tooltip-green\">\n                        <div class=\"ets-tooltip-content\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"464925\">\n                            Listen to your recording. You can record again or press DONE.\n                        </div>\n                    </div>\n                </div>\n\n                "; if (isAudioInputAvailable) { o += "\n                    <div class=\"icon-replay-audioin please-play\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"655956\">Re-play Audio</div>\n                "; } o += "\n            </div>\n\n            "; if (isAudioInputAvailable) { o += "\n                <div class=\"ets-act-spc-content audio-input\">\n                    <!-- audio-input component-->\n                        <div class=\"title\"><strong data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"655957\" >Listen to this audio</strong></div>\n\n                        <div class=\"swing-container\">\n                            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                                   data-src=\"" + data.references.aud.url + "\" class=\"ets-ap\" type=\"audio/mpeg\"\n                                   controls=\"controls\"></audio>\n\n                           <div class=\"ets-tooltip\">\n                                <div class=\"ets-tooltip-content\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"464923\"></div>\n                            </div>\n\n                        </div>\n\n\n                </div>\n             "; } o += "\n\n        </div>\n\n        <div class=\"ets-act-spc-r\">\n\n        \n            "; if (isModelAudioInputAvailable) { o += "\n                <div class=\"glyphicon glyphicon-arrow-left active js-toggle\"></div>\n\n                    <!-- model-audio-input component-->\n\n                <div class=\"ets-act-spc-content model-audio-input\" >\n                    <div class=\"title\"><strong data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"655955\">Model Audio</strong></div>\n\n                    <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                           data-src=\"" + data.modelAud.url + "\" class=\"ets-ap\" type=\"audio/mpeg\"\n                           controls=\"controls\"></audio>\n                </div>\n\n                \n            "; } o += "\n\n         </div>\n\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/speaking-challenge-new/main',[
	'jquery',
	'poly',
	'school-ui-activity/activity/base/main',
	'template!./main.html',
	'school-ui-shared/enum/rating-source-type'
], function ($, poly, Widget, tTemplate, ratingSouceType) {
	'use strict';

	var $ELEMENT = '$element';

	var ELEMENTS_CACHE = '_elementsCache';
	var AUDIO_STATE = '_audioState';
	var MODEL_AUDIO_STATE = '_audioState';

	var SEL_RIGHT = '.ets-act-spc-r';
	var SEL_ASR = '.ets-act-spc-asr';
	var SEL_MEJS = '.mejs-container';
	var SEL_RECORD = '.ets-act-record';
	var SEL_TOOLTIP = '.ets-tooltip';
	var SEL_TOOLTIP_RECORD = '.ets-tooltip-green';
	var SEL_AP = '.ets-ap';
	var ICON_VALUE = '.glyphicon-volume-up';
	var AUDIO_INPUT = '.audio-input';
	var MODEL_AUDIO_INPUT = '.model-audio-input';
	var ASR_OUTPUT = '.asr-output';
	var CLS_AP_CONTAINER = 'ets-ap-con';
	var CLS_DISABLED = 'ets-disabled';

	var HUB_ASR_SETTING = 'asr/ui/setting';
	var HUB_ASR_STOP_PLAYBACK = 'asr/stopPlayback';
	var HUB_ASR_PLAYBACK = 'asr/startPlayback';
	var WIDGET_PATH_AUDIO_SHELL = 'school-ui-activity/shared/audio/audio-shell';

	var IS_CORRECT = '_isCorrect';


	function initChainFn() {
		var me = this;
		for (var i = 0, l = arguments.length; i < l; ++i) {
			arguments[i][0].call(me, arguments[i][1]);
		}
	}


	function findElem(selector) {
		var me = this;
		var $childElement = me[ELEMENTS_CACHE][selector];
		if ($childElement) { // cached elements always have length > 0
			return $childElement;
		}
		$childElement = me[$ELEMENT].find(selector);
		if ($childElement.length > 0) {
			me[ELEMENTS_CACHE][selector] = $childElement;
		}
		return $childElement;
	}

	function setupASR() {
		var me = this;
		me.publish(HUB_ASR_SETTING, function (result, guid) {
			showRecord.call(me, guid);
		}, {
			prons: '',
			autostopTime: 180000,
			disableScoreRecording: true,
			playback: false
		}, {
			asrFailCb: function () {
				me._json.content = {};
				me._json.content[IS_CORRECT] = true;
				me.completed(true);
			}
		});
	}

	function toggleAudioInTooltip(isShow) {
		var me = this;

		var $elem = findElem.call(me, [AUDIO_INPUT, SEL_TOOLTIP].join(' '));
		if ($elem.length === 0) {
			return;
		}

		if (isShow && !me._isOpen) {
			$elem.fadeIn();
		} else {
			$elem.fadeOut();
		}
	}

	function toogleModelAudioInButton(isActive) {
		var me = this;

		var $elem = findElem.call(me, SEL_MEJS);

		if ($elem.length === 0) {
			return;
		}

		if (!isActive) {
			$elem.addClass('mejs-disabled');
			$elem.find('.mejs-playpause-button').children().prop('disabled', true);
		} else {
			$elem.removeClass('mejs-disabled');
			$elem.find('.mejs-playpause-button').children().prop('disabled', false);
		}
	}


	function toggleASRTooltip(isShow) {
		var me = this;

		var $elem =findElem.call(me, [SEL_ASR, SEL_TOOLTIP].join(' '));

		if ($elem.length === 0) {
			return;
		}

		if (isShow) {
			$elem.fadeIn();
		} else {
			$elem.fadeOut();
		}
	}

	function toggleModelAudioInTooltip(isShow) {
		var me = this;

		var $elem = findElem.call(me, '.tooltip-volume-up');
		if ($elem.length === 0) {
			return;
		}

		if (!isShow) {
			$elem.delay(500).fadeOut();
		} else {
			$elem.delay(500).fadeIn();
		}
	}

	function togglePauseAudio(isPause) {
		var me = this;
		var $elem = findElem.call(me, '.icon-replay-audioin');
		if ($elem.length === 0) {
			return;
		}

		if (isPause) {
			$elem.addClass('please-pause');
		} else {
			$elem.removeClass('please-pause');
		}

	}

	function toggleReplyAudio(isActive) {
		var me = this;
		var $elem = findElem.call(me, '.icon-replay-audioin');
		if ($elem.length === 0) {
			return;
		}

		if (isActive) {
			$elem.removeClass('status-disabled');
		} else {
			$elem.addClass('status-disabled');
		}
	}

	function toggleRecordTooltip(isShow) {
		var me = this;

		//init selector
		var $elem = findElem.call(me, SEL_TOOLTIP_RECORD);
		if ($elem.length === 0) {
			return;
		}

		if (isShow) {
			$elem.fadeIn();
		} else {
			$elem.fadeOut();
		}
	}

	function recordSlideOut($el) {
		var me = this;

		var $asr = findElem.call(me, SEL_ASR);
		if ($asr.length === 0) {
			return;
		}

		$el.animate({
			'margin-left': -72,
			'opacity': 1
		}, 'slow', function () {
			toggleRecordTooltip.call(me, true);
			setTimeout(function () {
				toggleRecordTooltip.call(me, false);
			}, 5000);

			$asr.css({
				'z-index': 'auto'
			});
		});

		$asr.animate({
			'margin-left': -15
		}, 'slow');
	}

	function replaceRecord(guid) {
		var me = this;

		var $record = findElem.call(me, SEL_RECORD);
		var $asr = findElem.call(me, SEL_ASR);
		if ($record.length === 0 || $asr.length === 0) {
			return;
		}

		$record.animate({
			'margin-left': -41,
			'opacity': 0.5
		}, 'slow', function () {
			$(this).children('.' + CLS_AP_CONTAINER).remove();
			me._hasRecord = false;
			showRecord.call(me, guid);
		});

		$asr.css({
			'z-index': 1
		}).animate({
			'margin-left': -38
		}, 'slow');
	}

	function createNewRecord(guid) {
		var me = this;

		var $record = findElem.call(me, SEL_RECORD);
		if ($record.length === 0) {
			return;
		}

		$record.prepend('<div class="' + CLS_AP_CONTAINER + '"></div>'); //recordered audio

		var $container = me[$ELEMENT].find('.' + CLS_AP_CONTAINER);
		$container
			.unweave()
			.then(function () {
				return $container
					.data('option', {
						'_playHandler': function () {
							me.publish(HUB_ASR_PLAYBACK);
							toggleRecordTooltip.call(me, false);
							toggleReplyAudio.call(me, false);
							toogleModelAudioInButton.call(me, false);

						},
						'_pauseHandler': function () {
							me.publish(HUB_ASR_STOP_PLAYBACK);
							toggleReplyAudio.call(me, true);
						},
						'guid': guid
					})
					.attr('data-weave', WIDGET_PATH_AUDIO_SHELL + '(option)')
					.weave();
			})
			.then(function () {
				recordSlideOut.call(me, $record); //animate recorded audio

				me._hasRecord = true;
				me.items().answered(true);
			});
	}

	function showRecord(guid) {
		var me = this;
		if (me._hasRecord) {
			replaceRecord.call(this, guid);
		} else {
			createNewRecord.call(this, guid);
		}
	}

	function animateIcon() {
		var me = this;
		var t = 800;
		var $audio = findElem.call(me, AUDIO_INPUT);
		var $asr = findElem.call(me, ASR_OUTPUT);
		if ($audio.length === 0 || $asr.length === 0) {
			return;
		}

		$audio.find('.title').fadeOut();

		if (isIE() === 8) {
			$audio.find('.swing-container').fadeOut(t);
		} else {
			$audio.find('.swing-container').hide(t);//swing animation
			$audio.find('button').addClass('transform'); //css3 animation  only for moder browser
		}

		$asr.show({duration: t, easing: 'linear'});
	}

	function isIE() {
		var myNav = navigator.userAgent.toLowerCase();
		return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1]) : false;
	}

	function toggleIcon(isActive) {
		var me = this;

		var $elem = findElem.call(me, ICON_VALUE);
		if ($elem.length === 0) {
			return;
		}

		if (isActive) {
			$elem.addClass('active');
		} else {
			$elem.removeClass('active');
		}
	}

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {
		var me = this;
		me[ELEMENTS_CACHE] = {};
		return me.html(tTemplate, me._json)
			.tap(onRendered.bind(me));
	}

	function setASRstatus(state) {
		var me = this;
		me.publish('asr/ui/states/changed', state);

		var $elem = findElem.call(me, [SEL_RECORD, SEL_AP].join(' '));

		if ($elem.length === 0) {
			return;
		}

		if (state === 'DISABLE') {
			$elem.addClass(CLS_DISABLED);
			toggleRecordTooltip.call(me, false);
		} else {
			$elem.removeClass(CLS_DISABLED);
		}
	}


	function onRendered() {
		var me = this;

		var $modelAudioContainer = me[$ELEMENT].find(MODEL_AUDIO_INPUT).find(SEL_MEJS);
		$modelAudioContainer.find('.mejs-volume-button').remove();
		$modelAudioContainer.find('.mejs-horizontal-volume-slider').remove();

		var audioContainer = me[$ELEMENT].find(AUDIO_INPUT).find(SEL_MEJS);
		audioContainer.find('.mejs-time').remove();
		audioContainer.find('.mejs-time-rail').remove();
		audioContainer.find('.mejs-volume-button').remove();
		audioContainer.find('.mejs-horizontal-volume-slider').remove();

		//init ASR
		setupASR.call(me);
	}

	// ## Constructor
	function Ctor() {
		var me = this;

		me.type(2);

		me._hasRecord = false;
		me._isOpen = false;
		me._state = '';

		me[ELEMENTS_CACHE] = {};
		me[AUDIO_STATE] = null;
		me[MODEL_AUDIO_STATE] = null;
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/stop': function onStop() {
			var me = this;
			me[ELEMENTS_CACHE] = {};

			// Stop the record if leave the activity
			var $record = me[$ELEMENT].find('.' + CLS_AP_CONTAINER);

			me.publish(HUB_ASR_STOP_PLAYBACK);
			return $record.unweave();
		},


		'hub/asr/ui/states/changed': function (state) {
			var me = this;
			me._state = state;

			if (state === 'PREPARING') {
				initChainFn.call(me, [toggleRecordTooltip, false], [toggleASRTooltip, false], [toggleReplyAudio, false]);
			}

			if (state === 'WARNING' || state === 'ERROR' || state === 'DOWN') {
				toggleASRTooltip.call(me, false);
			}

			if (state === 'RECORDING') {
				toogleModelAudioInButton.call(me, false);
			}

			if (state === 'PROCESSING') {
				toggleReplyAudio.call(me, true);
			}

			if (state === 'PREPARING' || state === 'DISABLE') {
				toggleIcon.call(me, false);
			}

			if (state === 'NORMAL') {
				initChainFn.call(me, [toogleModelAudioInButton, true], [toggleReplyAudio, true], [toggleIcon, true]);
			}
		},

		'hub/activity/epaper/expanding': function () {
			var me = this;
			initChainFn.call(me, [toggleIcon, false], [toggleASRTooltip, false], [toggleModelAudioInTooltip, false]);
		},

		'hub/activity/epaper/folding': function () {
			var me = this;
			initChainFn.call(me, [toggleIcon, true], [toggleModelAudioInTooltip, true], [toggleRecordTooltip, false]);

			if (me._state !== 'RECORDING') {
				toggleASRTooltip.call(this, true);
			}
		},

		'hub/rating/sourceType': function () {
			return [ratingSouceType['ASR_SPEAKING']];
		},

		'hub/audio/shell/play/complete': function (/*guid*/) {
			var me = this;
			toggleReplyAudio.call(me, true);
		},

		'dom:.js-toggle/click': function(event) {
			var me = this;
			var $button = $(event.currentTarget);
			if (!$button.hasClass('active')) {
				return;
			}

			var $modelPlayer = findElem.call(this, [MODEL_AUDIO_INPUT, SEL_AP].join(' '));
			findElem.call(me, SEL_RIGHT).animate(
				{'margin-left': !me._isOpen ? 453 : 0},
				{
					'duration': 'slow',
					'complete': function () {
						me._isOpen = !me._isOpen;

						if (me._isOpen) {
							$modelPlayer.trigger('player/play');
							toggleAudioInTooltip.call(me, false);
						} else {
							if (me._state !== 'RECORDING') {
								$modelPlayer.trigger('player/pause');
							}
							toggleAudioInTooltip.call(me, true);
						}

						toggleModelAudioInTooltip.call(me, !me._isOpen);

					}
				}
			);
		},
		'dom:.icon-replay-audioin/click': function (event) {
			var $button = $(event.currentTarget);
			if ($button.hasClass('status-disabled')) {
				return;
			}

			var $player = findElem.call(this, [AUDIO_INPUT, SEL_AP].join(' '));
			if ($button.hasClass('please-pause')) {
				$player.trigger('player/pause');
			} else {
				$player.trigger('player/play');
			}
		},
		'dom:.model-audio-input .ets-ap/media/play': function (event) {
			var me = this;
			me[MODEL_AUDIO_STATE] = e['type'];
			initChainFn.call(me, [setASRstatus, 'DISABLE'], [toggleASRTooltip, false], [toggleRecordTooltip, false])
		},
		'dom:.model-audio-input .ets-ap/media/pause': function (event) {
			var me = this;
			me[MODEL_AUDIO_STATE] = e['type'];
			setASRstatus.call(me, 'NORMAL');

			setTimeout(function () {
				//if the next event for audio-in not play, then appeat tooltip
				toggleASRTooltip.call(me, me[AUDIO_STATE] !== 'play');
			}, 0);
		},
		'dom:.model-audio-input .ets-ap/media/ended': function (event) {
			var me = this;
			me[MODEL_AUDIO_STATE] = e['type'];
			initChainFn.call(me, [setASRstatus, 'NORMAL'], [toggleASRTooltip, true]);
		},
		'dom:.audio-input .ets-ap/media/play': function (event) {
			var me = this;
			me[AUDIO_STATE] = event['type'];
			initChainFn.call(me, [setASRstatus, 'DISABLE'], [toggleIcon, false], [toggleModelAudioInTooltip, false], [toggleASRTooltip, false], [togglePauseAudio, true], [toggleAudioInTooltip, false]);
		},
		'dom:.audio-input .ets-ap/media/pause': function (event) {
			var me = this;
			me[AUDIO_STATE] = event['type'];
			initChainFn.call(me, [setASRstatus, 'NORMAL'], [toggleIcon, true], [toggleModelAudioInTooltip, true], [togglePauseAudio, false]);

			setTimeout(function () {
				//if the next event 'ended', dont appear tooltip
				toggleAudioInTooltip.call(me, me[AUDIO_STATE] !== 'ended');
			}, 0);

			setTimeout(function () {
				//if the next event for model-audio not play, then appeat tooltip
				toggleASRTooltip.call(me, me[MODEL_AUDIO_STATE] !== 'play')
			}, 0);
		},
		'dom:.audio-input .ets-ap/media/ended': function (event) {
			var me = this;
			me[AUDIO_STATE] = event['type'];
			initChainFn.call(me, [setASRstatus, 'NORMAL'], [toggleASRTooltip, true], [toggleIcon, true], [toggleModelAudioInTooltip, true], [togglePauseAudio, false], [toggleAudioInTooltip, false], [animateIcon, null])
		}
	};

	return Widget.extend(Ctor, methods);
});


define('troopjs-requirejs/template!school-ui-activity/activity/speaking-challenge/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-spc ets-cf\">\n    "; if (data.references.aud) { o += "\n    <div class=\"ets-act-spc-l\">\n        <div class=\"ets-act-spc-content\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                   data-src=\"" + data.references.aud.url + "\" class=\"ets-ap\" type=\"audio/mpeg\"\n                   controls=\"controls\"></audio>\n\n            <div class=\"ets-tooltip\">\n                <div class=\"ets-tooltip-content\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"464923\">\n                    First, you listen to the dailog\n                </div>\n            </div>\n        </div>\n    </div>\n    "; } o += "\n    <div class=\"ets-act-spc-r\">\n\n        <div class=\"ets-act-spc-content\">\n            <!-- asr component -->\n            <div class=\"ets-act-spc-asr\">\n                <div data-weave=\"school-ui-activity/shared/asr/asr-ui\"></div>\n                <div class=\"ets-tooltip\">\n                    <div class=\"ets-tooltip-content\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"464924\">\n                        Press to record\n                    </div>\n                </div>\n            </div>\n\n            <div class=\"ets-act-record\">\n                <div class=\"ets-tooltip ets-tooltip-green\">\n                    <div class=\"ets-tooltip-content\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"464925\">\n                        Listen to your recording. You can record again or press DONE.\n                    </div>\n                </div>\n            </div>\n            \n        </div>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/speaking-challenge/main',[
	'jquery',
	'poly',
	'school-ui-activity/activity/base/main',
	"template!./main.html",
	'school-ui-shared/enum/rating-source-type'
], function ($, poly, Widget, tTemplate, ratingSouceType) {
	"use strict";

	var $ELEMENT = '$element';

	var SEL_LEFT = '.ets-act-spc-l';
	var SEL_RIGHT = '.ets-act-spc-r';
	var SEL_ASR = '.ets-act-spc-asr';
	var SEL_MEJS = '.mejs-container';
	var SEL_RECORD = '.ets-act-record';
	var SEL_TOOLTIP = '.ets-tooltip';
	var SEL_TOOLTIP_RECORD = '.ets-tooltip-green';

	var CLS_AP_CONTAINER = "ets-ap-con";

	var HUB_ASR_SETTING = "asr/ui/setting";
	var HUB_ASR_STOP_PLAYBACK = "asr/stopPlayback";
	var HUB_ASR_PLAYBACK = "asr/startPlayback";
	var WIDGET_PATH_AUDIO_SHELL = "school-ui-activity/shared/audio/audio-shell";

	var IS_CORRECT = "_isCorrect";

	function setupASR() {
		var me = this;
		me.publish(HUB_ASR_SETTING, function (result, guid) {
			showRecord.call(me, guid);
		}, {
			prons: "",
			autostopTime: 180000,
			disableScoreRecording: true,
			playback: false
		}, {
			asrFailCb: function () {
				me._json.content = {};
				me._json.content[IS_CORRECT] = true;
				me.completed(true);
			}
		});
	}

	function hideAudioTooltip() {
		var me = this;
		me._timer = window.setTimeout(function () {
			me[$ELEMENT].find([SEL_LEFT, SEL_TOOLTIP].join(' ')).fadeOut();
		}, 5000);
	}

	function hideRecordTooltip() {
		var me = this;
		me.$recordTooltip.delay(5000).fadeOut();
	}

	function showASRTooltip() {
		if (!this._ASRTooltip && this.$asrTooltip) {
			this.$asrTooltip.css('display', 'block');
			hideASRTooltip.call(this);
			this._ASRTooltip = true;
		}
	}

	function hideASRTooltip() {
		var me = this;
		me.$asrTooltip.delay(5000).fadeOut();
	}

	function showASRSection() {
		var me = this;

		if (!me._ASRShowed) {
			// ASR section will slide out after 1000 ms
			me[$ELEMENT].find(SEL_RIGHT)
				.delay(1000).animate({
					'margin-left': 110
				}, 'slow', function () {
					$(this).css('z-index', 2);
					hideASRTooltip.call(me);
				});
		}
	}

	function recordSlideOut($el) {
		var me = this;
		$el.animate({
			'margin-left': 8
		}, 'slow', function () {
			me[$ELEMENT].find(SEL_TOOLTIP_RECORD).fadeIn();
			hideRecordTooltip.call(me);
			me.$asr.css({
				'z-index': 'auto'
			});
		});

		me.$asr.animate({
			'margin-left': -61
		}, 'slow');
	}

	function replaceRecord(guid) {
		var me = this;

		me.$record.animate({
			'margin-left': -27
		}, 'slow', function () {
			$(this).children('.' + CLS_AP_CONTAINER).remove();
			me._hasRecord = false;
			showRecord.call(me, guid);
		});

		me.$asr.css({
			'z-index': 1
		}).animate({
			'margin-left': -38
		}, 'slow');
	}

	function createNewRecord(guid) {
		var me = this;

		me.$record.prepend('<div class="' + CLS_AP_CONTAINER + '"></div>');

		var $container = me[$ELEMENT].find("." + CLS_AP_CONTAINER);
		$container
			.unweave()
			.then(function () {
				return $container
					.data("option", {
						"_playHandler": function () {
							me.publish(HUB_ASR_PLAYBACK);
							me[$ELEMENT].find(SEL_TOOLTIP_RECORD).fadeOut();
						},
						"_pauseHandler": function () {
							me.publish(HUB_ASR_STOP_PLAYBACK);
						},
						"guid": guid
					})
					.attr("data-weave", WIDGET_PATH_AUDIO_SHELL + "(option)")
					.weave()
					.then(function () {
						recordSlideOut.call(me, me.$record);

						me._hasRecord = true;
						me.items().answered(true);
					});
			});
	}

	function showRecord(guid) {
		var me = this;

		if (me._hasRecord) {
			// record slides in
			replaceRecord.call(this, guid);
		} else {
			createNewRecord.call(this, guid);
		}

	}

	// # Render Method

	// Render method renders the UI according to the json data we
	// created in filterData().
	function render() {
		var me = this;

		return me.html(tTemplate, me._json)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this;

		var $container = me[$ELEMENT].find(SEL_MEJS);
		me._interval = window.setInterval(function () {
			if ($container.is(':visible')) {
				hideAudioTooltip.call(me);
				window.clearInterval(me._interval);
			}
		}, 4);

		// remove unneccessary element
		$container.find('.mejs-time').remove();
		$container.find('.mejs-time-rail').remove();
		$container.find('.mejs-volume-button').remove();
		$container.find('.mejs-horizontal-volume-slider').remove();

		//asr setup
		setupASR.call(me);

		me.$record = me[$ELEMENT].find(SEL_RECORD);
		me.$asr = me[$ELEMENT].find(SEL_ASR);

		me.$asrTooltip = me[$ELEMENT].find([SEL_ASR, SEL_TOOLTIP].join(' '));
		me.$recordTooltip = me[$ELEMENT].find(SEL_TOOLTIP_RECORD);
	}

	// ## Constructor
	function Ctor() {
		var me = this;

		me.type(3);

		me._ASRShowed = false;
		me._hasRecord = false;
		me._ASRTooltip = false;
	}

	// ## methods
	var methods = {
		"sig/render": function onRender() {
			return render.call(this);
		},
		'sig/finalize': function () {
			var me = this;
			window.clearTimeout(me._timer);
			window.clearInterval(me._interval);
		},
		'sig/stop': function onStop() {
			var me = this;

			// Stop the record if leave the activity
			var $record = me[$ELEMENT].find('.' + CLS_AP_CONTAINER);

			me.publish(HUB_ASR_STOP_PLAYBACK);
			return $record.unweave();
		},

		"hub/asr/ui/states/changed": function (state) {
			var me = this;

			if (state === 'PREPARING') {
				me.$asr.find(SEL_TOOLTIP).fadeOut();
				me.$asrTooltip.hide();
				me.$recordTooltip.hide();
				me._ASRTooltip = true;
			}
		},
		'hub/activity/epaper/expanding': function () {
			showASRTooltip.call(this);
		},
		'hub/rating/sourceType': function () {
			return [ratingSouceType['ASR_SPEAKING']];
		},


		'dom:.ets-ap/media/play': function() {
			// hide tooltip
			this[$ELEMENT].find([SEL_LEFT, SEL_TOOLTIP].join(' ')).fadeOut();
			// show ASR section
			showASRSection.call(this);
		},
		'dom:.ets-ap/media/pause': function() {
			showASRTooltip.call(this);
		},
		'dom:.ets-ap/media/ended': function() {
			showASRTooltip.call(this);
		}
	};

	return Widget.extend(Ctor, methods);
});

/**
 * # text select shared constant module definition
 */
define('school-ui-activity/activity/text-select/const',{
	SLASH: "/",
	DOUBLE_SLASH: "//"
});

define('troopjs-requirejs/template!school-ui-activity/activity/text-select/main.html',[],function() { return function template(data) { var o = "";
    var model = data,
        hasSharedAudio = model.hasSharedAudio,
        weaver = model.weaver;
o += "\n\n<div class=\"ets-act-tsl\">\n    <div class=\"ets-act-tsl-main\">\n        ";if(hasSharedAudio) {o += "\n        <div class=\"ets-act-tsl-audio ets-shared\">\n            <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n                <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                       data-src=\"" +model.ref.aud.url+ "\" type=\"audio/mpeg\"\n                       class=\"ets-ap\"></audio>\n            </div></div>\n        </div>\n        ";}o += "\n        <div class=\"ets-act-tsl-view\" data-weave=\"school-ui-activity/activity/text-select/text-select\"></div>\n    </div>\n    ";if(model.isMultiType && model.isGradeMode) {o += "\n    <div class=\"ets-act-tsl-ft" +(hasSharedAudio ? ' ets-shrink' : '')+ "\">\n        <div class=\"ets-act-tpg-b\" data-weave=\"school-ui-activity/shared/toggle-slide/main\"></div>\n        <div class=\"ets-ar\" data-at-id=\"pnl-answer-remaining\" data-weave=\"school-ui-activity/shared/rolling-number/main\"></div>\n        <div class=\"ets-cf\"></div>\n    </div>\n    ";}o += "\n</div>"; return o; }; });
/**
 * text select main module definition
 */
define('school-ui-activity/activity/text-select/main',[
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


define('troopjs-requirejs/template!school-ui-activity/activity/text-select/text-select.html',[],function() { return function template(data) { var o = "";
	var me = this;
	var model = data;
	var makePhrase = model.makePhrase;
	var isAnyMode = model.isAnyMode;
	var hasSharedAudio = model.hasSharedAudio;
	var renderQuestionPhrases = model.renderQuestionPhrases;
o += "\n<div class=\"ets-act-tsl-view-main\">\n\t<div class=\"ets-act-tsl-phrases\">";renderPhrases();o += "</div>\n</div>\n";
function renderPhrases() {
	for(var i = 0, len = renderQuestionPhrases.length; i < len; i++) {
		var phrase = renderQuestionPhrases[i];

		var audioUrl = !hasSharedAudio && phrase.audio ? phrase.audio.url : '';
		var phraseTextClass = isAnyMode ? 'ets-any' : 'ets-some';
		if(audioUrl) {
			phraseTextClass += ' ets-has-audio';
		}
		var firstLastClass = (i === 0 ? ' ets-first' : '') + (i === len - 1 ? ' ets-last' : '');
		o += "\n\t\t<div class=\"ets-act-tsl-phrase" +firstLastClass+ "\">\n\t\t\t";if(audioUrl) {o += "\n\t\t\t<div class=\"ets-act-tsl-audio\">\n\t\t\t\t<div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap ets-ap-small\">\n\t\t\t\t\t<audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n\t\t\t\t\t\t   data-src=\"" +audioUrl+ "\" type=\"audio/mpeg\"\n\t\t\t\t\t\t   class=\"ets-ap ets-ap-small ets-ap-nobar\"></audio>\n\t\t\t\t</div></div>\n\t\t\t</div>\n\t\t\t";}o += "\n\t\t\t<div data-phrase-index=\"" +i+ "\" data-phrase-id=\"" +phrase._id+ "\" class=\"ets-act-tsl-text ets-doing " +phraseTextClass+ "\">\n\t\t\t\t" +makePhrase.call(me, phrase, isAnyMode)+ "\n\t\t\t</div>\n\t\t</div>\n\t\t";
	}
}
 return o; }; });
define('school-ui-activity/activity/text-select/text-select',[
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


define('troopjs-requirejs/template!school-ui-activity/activity/typing-drag-drop/main.html',[],function() { return function template(data) { var o = "";if(data.references.aud){o += "\n    <div class=\"ets-act-tpd-hd-ap\">\n        <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                   data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n                   class=\"ets-ap\"></audio>\n        </div></div>\n    </div>\n";}o += "\n<div class=\"ets-act-tpd\" data-weave=\"school-ui-activity/activity/typing-drag-drop/typing-drag-drop\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity/activity/typing-drag-drop/typing-drag-drop.html',[],function() { return function template(data) { var o = "";
    var paragraphs = data.paragraphs;
    var dragPieces = data.dragPieces;
o += "\n<div class=\"ets-act-tpd-main\">\n";
for(var i=0;i<paragraphs.length;i++){
    var paragraph = paragraphs[i];
    for(var j=0;j<paragraph.length;j++){
        var cell = paragraph[j];
        if(cell._toAs){
        o += "\n            <span class=\"ets-act-tpd-gap ets-act-tpd-n\" data-at-tag=\"droppable\" data-at-id=\"" +cell.text+ "\" data-id=\"" +cell.text+ "\"><span class=\"ets-act-tpd-cm\">\n                </span>\n            </span> \n        ";
        }else{
        o += "\n            " +cell.text+ "\n        ";
        }
    }
}
o += "\n</div>\n<div class=\"ets-act-tpd-shadow ets-act-tpg-none\"></div>\n<div class=\"ets-act-tpd-items\">\n    <ul>\n    ";
    for(var i=0;i<data.dragPieces.length;i++){
        var piece = data.dragPieces[i];
        o += "\n        <li>\n            <span class=\"ets-act-tpd-item ets-act-tpd-item-n\" data-index=\"" +i+ "\" data-at-tag=\"draggable\" data-at-id=\"" +piece._id+ "\" data-id=\"" +piece._id+ "\"><span class=\"ets-act-tpd-im\">\n                <span class=\"ets-act-tpd-txt\">" +piece.txt+ "\n                </span><span class=\"ets-act-tpd-idc\">\n                </span></span>\n            </span>\n        </li>\n        ";
    }
    o += "\n    </ul>\n</div> "; return o; }; });
define('school-ui-activity/activity/typing-drag-drop/typing-drag-drop',[
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'school-ui-shared/utils/browser-check',
	'school-ui-activity/util/activity-util',
	'template!./typing-drag-drop.html',
	"jquery.jscrollpane",
	"jquery.mousewheel"
], function ($, ui$, $uiTouchPunch, Widget, Interaction, browserCheck, Util, tPd) {
	"use strict";

	var _inDragging,
		_inDropping,
		_timeoutToBack,
		_timeoutToCheckHeight,
		_timeoutToChangeScrollbarAlphaFirst,
		_timeoutToChangeScrollbarAlphaSecond,
		_HEIGHT_MAIN = 430,
		_HEIGHT_AUDIO = 85,
		_HEIGHT_SHADOW = 37,
		_HEIGHT_DRAG_MARGIN = 10,
		_ISIE = browserCheck.browser === "msie",
		_ISIE_LT8 = _ISIE && parseInt(browserCheck.version) < 8,
		STR_DOT = '.',
		CLS_GAP_HIGHLIGHT = 'ets-act-tpd-h',
		CLS_ITEM_NORMAL = 'ets-act-tpd-item-n',
		CLS_ITEM_PLACED = 'ets-act-tpd-item-p',
		CLS_ITEM_HIGHLIGHT = 'ets-act-tpd-item-h',
		CLS_ITEM_SIMPLE_CORRECT = 'ets-act-tpd-item-sc',
		CLS_ITEM_INCORRECT = 'ets-act-tpd-item-ic',
		SEL_MAIN = '.ets-act-tpd-main',
		SEL_GAP = '.ets-act-tpd-gap',
		SEL_GAP_MID = '.ets-act-tpd-cm',
		SEL_ITEM = '.ets-act-tpd-item',
		SEL_ITEM_NORMAL = STR_DOT + CLS_ITEM_NORMAL,
		SEL_ITEM_PLACED = STR_DOT + CLS_ITEM_PLACED,
		SEL_ITEM_MID = '.ets-act-tpd-im',
		SEL_ITEMS = '.ets-act-tpd-items',
		SEL_TXT = '.ets-act-tpd-txt',
		SEL_SHADOW = '.ets-act-tpd-shadow';

	/**
	 * Util function ,remove style attribute from jquery object
	 */
	function clearStyle() {
		$(this).removeAttr('style');
	}

	function fixIERender() {
		if (!_ISIE) {
			return;
		}
		var me = this,
			$ROOT = me.$element;
		/**
		 * IE is ugly, will not rerender all elements of dom tree, use addClass to force it rerender
		 **/
		$ROOT.find(SEL_MAIN).addClass('notExists');
	}

	/**
	 * Templating and render
	 * @api private
	 */
	function render() {
		var me = this;
		return me.html(tPd, me._json)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * # Bind input element focus and blur event
	 * # Bind input text change event
	 * # Bind Example text click event
	 * @api private
	 */
	function onRendered() {
		var me = this;
		initContentSize.call(me);
		initScrollPane.call(me);
		initDraggable.call(me);
		initDroppable.call(me);
	}

	function initContentSize() {
		var me = this,
			$ROOT = me.$element,
			$dragElements = $ROOT.find(SEL_ITEMS),
			$mainContent = $ROOT.find(SEL_MAIN),
			dragItemsHeight = $dragElements.height() + _HEIGHT_DRAG_MARGIN;

		//Set drag items div with fixed width to avoid layout change when some items dragged out.
		$dragElements.css({
			height: dragItemsHeight
		});
		var audioHeight = me._hasAudio ? _HEIGHT_AUDIO : 0;

		//Set max height to cover value set by css(max height in css is to avoid content height exceed of 430px)
		$ROOT.css({
			maxHeight: _HEIGHT_MAIN - audioHeight
		});
		var contentAvailiableheight = _HEIGHT_MAIN - dragItemsHeight - audioHeight;
		//Set height or max height for jScrollPane
		if ($mainContent.height() > contentAvailiableheight) {
			$mainContent.css({
				maxHeight: contentAvailiableheight - _HEIGHT_SHADOW
			});
			$ROOT.find(SEL_SHADOW).show();
			if (_ISIE_LT8) {
				$mainContent.css({
					'overflow-y': 'scroll'
				});
			}
		} else {
			$mainContent.css({
				height: contentAvailiableheight
			});
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
				if (parseInt(newHeight) - parseInt(height)) {
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
			$ROOT = me.$element,
			$pane = $ROOT.find(SEL_MAIN);
		if (!(_ISIE_LT8)) {
			initScrollPanelEvent($pane).jScrollPane();
		}
	}

	function initDraggable() {
		var me = this,
			$ROOT = me.$element;

		var dragOption = {
			stack: SEL_ITEM_NORMAL,
			//containment : '.ets-ui-acc-bd',
			cancel: SEL_ITEM_PLACED,
			appendTo: '.ets-act-bd-main',
			revert: 'invalid',
			start: function (event, ui) {
				if (_inDragging || _inDropping) {
					ui.helper.removeClass(CLS_ITEM_HIGHLIGHT);
					return false;
				}
				_inDragging = true;
			},
			stop: function (event, ui) {
				ui.helper.removeClass(CLS_ITEM_HIGHLIGHT);
				_inDragging = false;
			},
			disabled: false
		};

		$ROOT.find(SEL_ITEMS).find(SEL_ITEM_NORMAL).bind('mousedown', function () {
			$(this).addClass(CLS_ITEM_HIGHLIGHT);
		}).bind('mouseup', function () {
			$(this).removeClass(CLS_ITEM_HIGHLIGHT);
		}).draggable(dragOption);
	}

	function initDroppable() {
		var me = this,
			$ROOT = me.$element;

		var dropOption = {
			accept: SEL_ITEM,
			activeClass: CLS_GAP_HIGHLIGHT,
			tolerance: "intersect",
			greedy: true,
			over: function (event, ui) {
				var $gap = $(this).css('zIndex', 1);
				var $gapMid = $gap.find(SEL_GAP_MID);
				$gapMid.stop().animate({
					width: ui.draggable.find(SEL_ITEM_MID).width() + 6
				});
			},
			out: function (/*event, ui*/) {
				var $gap = $(this).css('zIndex', 0);
				var $gapMid = $gap.find(SEL_GAP_MID);
				$gapMid.stop().animate({
					width: $gap.width()
				}, function () {
					$gapMid.each(clearStyle);
				});
			},
			drop: function (event, ui) {
				if (_inDropping) {
					return;
				} else {
					_inDropping = true;
				}

				//disable item draggable
				var $item = ui.draggable.draggable({
					disabled: true
				});
				//disable gap droppable
				var $gap = $(this).droppable({
					disabled: true
				});

				//set gap middle blank to item width subtract 13 to fit for item
				var $gapMid = $gap.find(SEL_GAP_MID);
				$gapMid.stop().css({
					width: $item.find(SEL_ITEM_MID).width() + 6
				});

				//animate to move drag item into the gap
				var gapOff = $gap.offset();
				var itemOff = $item.offset();
				var deltaOff = {
					left: gapOff.left - itemOff.left,
					top: gapOff.top - itemOff.top
				};
				$item.animate({
					left: parseInt($item.css('left')) + deltaOff.left + 4,
					top: parseInt($item.css('top')) + deltaOff.top + 3
				}, 100, function () {
					//append item to gap
					$gap.find(SEL_GAP_MID).append($item.each(clearStyle).addClass(CLS_ITEM_PLACED));
					$gap.css('width', 'auto');
					setTimeout(function () {
						handleInteraction.call(me, $gap, $item);
					}, 500);
				});
			}
		};

		$ROOT.find(SEL_GAP).droppable(dropOption);
	}

	/*
	 * Check answer with dragged id and correct answer id
	 * set result to json data
	 */
	function handleInteraction($gap, $item) {
		var me = this;
		var gapId = $gap.data('id');
		var itemId = $item.data('id');

		if (!gapId || !itemId)
			return;

		var correct = (gapId === itemId);

		var promise = me._super.publishInteraction(
			Interaction.makeMatchingInteraction(correct, gapId, itemId));

		if (correct) {
			me._correctAnswers += 1;
		}
		if (me._totalAnswers === me._correctAnswers) {
			me._json.content._isCorrect = true;
			promise.then(function () {
				me._item.completed(true);
			});
		}

		displayInteractionResult.call(me, correct, $gap, $item);
	}

	/*
	 * Animate drag item back to original position
	 * Finish Drop
	 */
	function backToOriginPosition($item) {
		$item.removeClass(CLS_ITEM_INCORRECT + ' ' + CLS_ITEM_PLACED);

		var me = this,
			$ROOT = me.$element,
			itemOff = $item.offset(),
			$gap = $item.closest(SEL_GAP),
			$gapMid = $gap.find(SEL_GAP_MID);
		$gap.css({
			width: $gap.width()
		});

		//set gap middle element back to min width
		$gapMid.animate({
			width: 50
		}, function () {
			$gapMid.each(clearStyle);
			$gap.each(clearStyle);
		});
		//detach item and append to template root element to normalize position when scrollbar shows
		$item.detach().css({
			position: 'absolute',
			zIndex: 10
		}).appendTo($ROOT).offset(itemOff).find(SEL_ITEM_MID).each(clearStyle);
		//get target li element
		var $li = $ROOT.find(SEL_ITEMS).find('li').eq(parseInt($item.data('index'))).css({
				width: $item.width() + 20
			}),
			liOff = $li.offset(),
			deltaOff = {
				left: liOff.left - itemOff.left,
				top: liOff.top - itemOff.top
			};
		//animate item back to original position smoothly
		$item.animate({
			left: parseInt($item.css('left')) + deltaOff.left + 10,
			top: parseInt($item.css('top')) + deltaOff.top
		}, function () {
			//append item to target li element
			$li.append($item.each(clearStyle).css({
				position: 'relative'
			}).draggable({
				disabled: false
			})).each(clearStyle);
			//complete dropping
			_inDropping = false;
		});
	}

	/**
	 * Use scoring data to set each gap's style
	 */
	function displayInteractionResult(correct, $gap, $item) {
		var me = this;

		if (correct) {
			markCorrect.call(me, $gap);
		} else {
			markIncorrect.call(me, $gap, $item);
		}

		fixIERender.call(me);
	}

	/**
	 * Mark correct gap with correct style
	 */
	function markCorrect($gap) {
		//set correct get to green simple span style
		var span = $('<span>').html($gap.find(SEL_TXT).text());
		$gap.removeClass().each(clearStyle).addClass(CLS_ITEM_SIMPLE_CORRECT).html(span).removeAttr("data-at-tag");
		_inDropping = false;
	}

	/*
	 * Mark Incorrect gap with incorrect style
	 * Call backToOriginPosition function
	 */
	function markIncorrect($gap, $item) {
		var me = this;
		//set gap to fixed width to fit for incorrect item
		$gap.droppable({
			disabled: false
		});

		$item.addClass(CLS_ITEM_INCORRECT);
		_timeoutToBack = window.setTimeout(function () {
			backToOriginPosition.call(me, $item);
		}, 500);
	}

	return Widget.extend({
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			window.clearTimeout(_timeoutToBack);
			window.clearTimeout(_timeoutToCheckHeight);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
			_inDragging = _inDropping = null;
		},
		'hub/activity/template/typing-drag-drop/load': function onTemplateLoad(options) {
			var me = this;

			me._super = options._super;
			me._json = options.json;
			me._item = options.item;
			me._hasScoring = options.hasScoring;
			me._hasAudio = me._json.references.aud;
			me._correctAnswers = 0;
			me._totalAnswers = me._json.content.items.reduce(function (count, item) {
				return count + item.gaps.length;
			}, 0);
			return me.signal('render');
		}
	});
});

define('school-ui-activity/activity/typing-drag-drop/main',[
	'jquery',
	"poly",
	'underscore',
	'school-ui-activity/activity/base/main',
	"template!./main.html",
	'string.split',
	'jquery.ui',
	'jquery.transit',
	'./typing-drag-drop'
], function mpaMain($, poly, _, Widget, tTdp) {
	"use strict";

	/**
	 * Filter source data
	 * create paragraphs array from original data
	 * @api private
	 */
	function filterData() {
		var me = this,
			data = me._json,
			dragPieces = [],
			caseSensitive = me._json.content.evalLogic && (me._json.content.evalLogic == 2),
			scoringItems = data.scoring.items || [],
			contentItems = data.content.items || [];

		scoringItems.forEach(function (item) {
			dragPieces.push.apply(dragPieces, item.gaps || []);
		});
		dragPieces = _.shuffle(dragPieces);
		data.dragPieces = dragPieces;
		data.paragraphs = [];
		var _gapTotal = 0;
		contentItems.forEach(function (item) {
			var paragraph = [];
			var cells = split(item.txt.replace(/\n/g, ""), /(<strike(?:.*?)>.*?<\/strike>)/);
			$.each(cells, function (j, cellTxt) {
				var cell = {};
				var matches = cellTxt.match(/^<strike(?:.*?)>(.*?)<\/strike>$/);
				if (matches) {
					cell._toAs = true;
					cell.text = matches[1];
					_gapTotal++;
				} else {
					cell.text = cellTxt;
				}
				paragraph.push(cell);
			});
			data.paragraphs.push(paragraph);
		});

		scoringItems.forEach(function (item) {
			item.gaps.forEach(function (gap) {
				//replace html tag and \n to adapt to existing content
				if (gap.txt != null) {
					gap.txt = $.trim(gap.txt.replace(/\n/g, '').replace(/<.*?>/ig, ''));
					if (!caseSensitive) {
						gap.txt = gap.txt.toLowerCase();
					}
				}
			});
		});
		data._gapTotal = _gapTotal;
	}

	function render() {
		var me = this;
		if (!me._htmlPromise) {
			me._htmlPromise = me.html(tTdp, me._json);
		}

		return me._htmlPromise
			.then(function () {
				return me.publish('activity/template/typing-drag-drop/load', {
					item: me.items(),
					json: me._json,
					hasScoring: me.hasScoring,
					_super: me
				});
			});
	}

	return Widget.extend(function () {
	}, {
		"sig/initialize": function onInitialize() {
			var me = this;
			me.items().instantFeedback(true);
			filterData.call(me);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		_onAnswerChecked: function onAnswerChecked() {
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/activity/typing-gap-fill/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-tpg";if(!data.references.aud){o += " ets-act-tpg-noaudio";}o += "\">\n    ";
    if(data.references.aud){
    o += "\n    <div class=\"ets-act-hd-ap\">\n        <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                 data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n                 class=\"ets-ap\"></audio>\n        </div></div>\n    </div>\n    ";
    }
    o += "\n   <div data-weave=\"school-ui-activity/activity/typing-gap-fill/typing-gap-fill\"></div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity/activity/typing-gap-fill/typing-gap-fill.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-tpg-main\">";
var paragraphs = data.paragraphs,
    tabindex = 0;
for(var paragraphIndex=0;paragraphIndex<paragraphs.length;paragraphIndex++){
    var paragraph = paragraphs[paragraphIndex];
    for(var j=0;j<paragraph.length;j++){
        var cell = paragraph[j];
        if(cell && cell._toAs){
            tabindex++;
o += "\n    <span class=\"ets-act-tpg-cell ets-act-tpg-n\">\n        <span class=\"ets-act-tpg-cm\">\n            <input class=\"ets-act-tpg-input\" autocomplete=\"off\" type=\"text\" data-id=\"" +cell.txt+ "\" data-at-id=\"" +cell.txt+ "\" data-weave=\"school-ui-activity/shared/textchange/main\" size=\"10\" tabindex=\"" +tabindex+ "\"/>\n            <span class=\"ets-act-tpg-txt ets-act-tpg-none\"></span>\n            <span class=\"ets-act-tpg-idc\"></span>\n        </span>\n    </span>\n";
        }else{
o += "\n    " +cell.txt+ "    \n";
        }
    }
}
o += "</div>\n<div class=\"ets-act-tpg-shadow ets-act-tpg-none\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity/shared/toggle-slide/main.html',[],function() { return function template(data) { var o = "";
var outBlurb = function(id,en){
    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
    return res;
};
o += "\n<div class=\"ets-act-wgt-ts-ctn ets-none\">\n    <div class=\"ets-act-wgt-ci\">\n        <span " +outBlurb(462460,"Show correct answers")+ "></span>\n    </div>\n    <div class=\"ets-act-wgt-ts\" data-at-id=\"btn-show-correct-answer\" data-show=\"true\">\n        <div class=\"ets-act-wgt-ts-sd\">\n            <ul class=\"ets-cf\">\n                <li class=\"ets-act-wgt-ts-hd\">\n                    <span " +outBlurb(462461,"YES")+ "></span>\n                </li>\n                <li class=\"ets-act-wgt-ts-sh\">\n                    <span " +outBlurb(462462,"NO")+ "></span>\n                </li>\n            </ul>\n        </div>\n        <div class=\"ets-act-wgt-ts-sd\">\n            <div class=\"ets-act-wgt-ts-kb\"></div>\n        </div>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/shared/toggle-slide/main',[
	'jquery',
	'poly',
	'troopjs-ef/component/widget',
	"template!./main.html"
], function mpaMain($, poly, Widget, tTs) {
	"use strict";

	var SEL_CONTAINER = '.ets-act-wgt-ts-ctn',
		SEL_TOGGLE = '.ets-act-wgt-ts',
		SEL_KNOB = '.ets-act-wgt-ts-kb',
		NUM_TOGGLE_TIME = 250,
		NUM_TOGGLE = -78,
		NUM_KNOB = 44;

	function render() {
		var me = this;
		// Render widget
		return me.html(tTs)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_CONTAINER).delegate(SEL_TOGGLE, 'click', toggleSlideClick.bind(me));
	}

	/**
	 * toggle slide button click handler
	 */
	function toggleSlideClick() {
		var me = this,
			$ROOT = me.$element,
			$ele = $ROOT.find(SEL_TOGGLE),
			show = $ele.data('show'),
			$knob = $ele.find(SEL_KNOB);
		if ($knob.is(':animated')) {
			return;
		}
		$knob.animate({
			left: (show ? NUM_KNOB : 0)
		}, NUM_TOGGLE_TIME);
		$ele.find('ul').animate({
			marginLeft: (show ? 0 : NUM_TOGGLE)
		}, NUM_TOGGLE_TIME, function () {
			$ele.data('show', !show);
			me.publish('activity/correctanswer/show', show);
		});
	}

	/**
	 * Show or hide
	 **/
	function toggleSlideShow(setting) {
		var me = this,
			$ROOT = me.$element,
			$container = $ROOT.find(SEL_CONTAINER);
		if (setting.show) {
			if (!($container.is(':visible') == 'true')) {
				setting.style && $container.css(setting.style);
				$container.fadeIn();
			}
		} else {
			$container.fadeOut();
		}
	}

	return Widget.extend({
		"sig/initialize": function onInitialize() {
			return render.call(this);
		},
		"hub/activity/widget/toggleslide/toggle": function onToggle() {
			toggleSlideClick.call(this);
		},
		"hub/activity/widget/toggleslide/show": function onUIShow(setting) {
			toggleSlideShow.call(this, setting);
		}
	});
});

// # Task Module
define('school-ui-activity/activity/typing-gap-fill/typing-gap-fill',[
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

define('school-ui-activity/activity/typing-gap-fill/main',[
	'jquery',
	'poly',
	'when',
	'school-ui-activity/activity/base/main',
	"troopjs-core/component/factory",
	"template!./main.html",
	'string.split',
	'underscore',
	'jquery.ui',
	'jquery.transit',
	'./typing-gap-fill'
], function mpaMain($, poly, when, Widget, Factory, tTpg) {
	"use strict";

	/**
	 * Filter source data
	 */
	function filterData() {
		var me = this,
			data = me._json,
			paragraphs = [],
			maxParagraphs = data.filterOptions.questionNo,
			caseSensitive = data.content.evalLogic && (data.content.evalLogic == 2),
			isGradeMode = me.hasScoring;

		//item bank
		if (maxParagraphs < data.content.items.length) {
			data.content.items.splice(maxParagraphs - 1, data.content.items.length - maxParagraphs);
		}

		//generate paragraph array for UI render
		var paragrapIds = [];
		$.each(data.content.items, function (i, item) {
			paragrapIds.push(item._id);
			var paragrap = [],
				cells = split(item.txt.replace(/\n/g, ''), /(<strike(?:.*?)>.*?<\/strike>)/);
			$.each(cells, function (j, cell) {
				var gap = {},
					matches = cell.match(/^<strike(?:.*?)>(.*?)<\/strike>$/);
				if (matches) {
					gap._toAs = true;
					gap.txt = matches[1];
				} else {
					gap.txt = $.trim(cell);
				}
				paragrap.push(gap);
			});
			paragraphs.push(paragrap);
		});
		data.paragraphs = paragraphs;
		data.isGradeMode = isGradeMode;
		if (isGradeMode) {
			//remove none used scoring data to improve scoring performance
			for (var i = data.scoring.items.length - 1; i >= 0; i--) {
				var item = data.scoring.items[i];
				if ($.inArray(item._id, paragrapIds) < 0) {
					data.scoring.items.splice(i, 1);
				}
			}
			//_correctAns stores original correct answers,because _scoring may change to lower case when case insensitive
			data._correctAns = [];
			$.each(data.scoring.items, function (i, item) {
				$.each(item.gaps, function (k, gap) {
					//replace html tag and \n to adapt to existing content
					if (gap.txt != null) {
						gap.txt = $.trim(gap.txt.replace(/\n/g, '').replace(/<.*?>/ig, ''));
						data._correctAns.push({_id: gap._id, txt: gap.txt.split('/')[0]});
						// Eval Logic
						!caseSensitive && (gap.txt = gap.txt.toLowerCase());
					}
				});
			});
		}
	}

	/**
	 * Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		if (!me._htmlPromise) {
			me._htmlPromise = me.html(tTpg, me._json);
		}

		return me._htmlPromise.then(function () {
			return me.publish('activity/template/typing-gap-fill/load', {
				item: me.items(),
				json: me._json,
				hasScoring: me.hasScoring,
				_super: me
			});
		});
	}

	var extendOptions = {
		"sig/initialize": function onInitialize() {
			var me = this;
			if (!me.hasScoring) {
				me.type(Widget.ACT_TYPE.PRACTICE);
			} else {
				me.items().completed(false);
			}

			filterData.call(me);
		},
		'sig/finalize': function onFinalize() {
			var me = this;
			me._htmlPromise = null;
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"hub/typing-gap-fill/interaction": function(interaction) {
			return this.publishInteraction(interaction);
		},
		completed: Factory.around(function (base) {
			return function (isCompleted) {
				var me = this;
				if (!me.hasScoring && isCompleted) {
					me.publish('activity/template/typing-gap-fill/show-non-graded-feedback');
				}
				return base.call(this, isCompleted);
			}
		})
	};
	return Widget.extend(function () {
	}, extendOptions);
});


define('troopjs-requirejs/template!school-ui-activity/activity/typing-table/main.html',[],function() { return function template(data) { var o = "";
var outBlurb = function(id,en){
    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
    return res;
};
o += "\n<div class=\"ets-act-tpt\">\n    ";if(data.references.aud){o += "\n    <div class=\"ets-act-hd-ap\">\n        <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                   data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n                   class=\"ets-ap\"></audio>\n        </div></div>\n    </div>\n    ";}o += "\n    <div class=\"ets-act-tpt-main\" data-weave=\"school-ui-activity/activity/typing-table/typing-table\">\n    </div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity/activity/typing-table/typing-table.html',[],function() { return function template(data) { var o = "";
    var items = data.tables;
	var attr = data.tablesAttr[data.curPage];
    var item = items[data.curPage];
    var rows = item.length;
    var cols = item[rows-1] && item[rows-1].length;
o += "\n<table class=\"ets-act-tpt-t\">\n    ";
        for(var i = 0 ; i < rows ; i++){
    o += "\n        <tr class=\"" +(i==rows-1?'ets-act-tpt-last':'ets-act-tpt-tr-m')+ "\">\n            ";
                for(var j=0;j<cols;j++){
            o += "\n\t\t\t\t";
	                if(attr[i][j] != undefined) {
	            o += "\n                <td class=\"" +(j==cols-1?'ets-act-tpt-last':'ets-act-tpt-m')+ "\" " + (attr[i][j]?attr[i][j]:'')+ " >\n                    ";
                        if(item[i][j]){
                            if(item[i][j]._toAnswer != null){
                    o += "\n                            <div class=\"ets-act-tpt-input ets-act-tpt-n\" data-r=\"" +i+ "\" data-c=\"" +j+ "\">\n                                <input type=\"text\" data-id=\"" +item[i][j]._toAnswer+ "\" data-at-id=\"" +item[i][j]._toAnswer+ "\" data-weave=\"school-ui-activity/shared/textchange/main\" maxlength='200'/>\n                                <span class=\"ets-act-tpt-txt ets-none\"></span>\n                            </div>\n                            ";}else{o += "\n                                " +item[i][j]+ "\n                            ";}
                        }
                    o += "\n                </td>\n\t\t        ";
		            }
		        o += "\n            ";
                }
            o += "\n        </tr>\n    ";
        }
    o += "\n</table>\n<div class=\"ets-act-tpt-b\" data-weave=\"school-ui-activity/shared/toggle-slide/main\"></div>"; return o; }; });
// # Task Module
define('school-ui-activity/activity/typing-table/typing-table',[
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
define('school-ui-activity/activity/typing-table/main',[
	'jquery',
	'poly',
	'../base/main',
	"troopjs-core/component/factory",
	'when',
	'template!./main.html',
	'underscore',
	'jquery.ui',
	'jquery.transit',
	'./typing-table'
], function mpaMain($, poly, Widget, Factory, when, tTpt) {
	"use strict";

	var REG_TR = /<tr(?:.*?)>(.*?)<\/tr>/ig,
		REG_TD = /<td(?:.*?)>(.*?)<\/td>/ig;

	/**
	 * Filter source data
	 * create table array from original data
	 * @api private
	 */
	function filterData() {
		var me = this,
			data = me._json,
			maxTables = data.filterOptions.questionNo,
			caseSensitive = data.content.evalLogic && (data.content.evalLogic == 2),
			isGradeMode = me.hasScoring;

		//item bank
		if (maxTables < data.content.items.length) {
			data.content.items.splice(maxTables - 1, data.content.items.length - maxTables);
		}

		var tableIds = [];
		//genarate table array from original json data
		data.tables = [];
		data.tablesAttr = [];

		$.each(data.content.items, function (i, item) {
			tableIds.push(item._id);
			var table = [],
				tableAttr = [],
				tableTxt = item.txt.replace(/\n/g, ""),
				trResult = REG_TR.exec(tableTxt);
			while (trResult) {
				var row = [],
					rowAttr = [],
					trTxt = trResult[1],
					tdResult = REG_TD.exec(trTxt);

				while (tdResult) {
					var cell = {},
						stkResult = /<strike(?:.*?)>(.*?)<\/strike>/ig.exec(tdResult[1]);
					stkResult ?
						cell._toAnswer = stkResult[1] :
						cell = tdResult[1];
					var attr = /<td(.*?)>/.exec(tdResult[0]);
					row.push(cell);
					rowAttr.push(attr[1]);
					tdResult = REG_TD.exec(trTxt);
				}
				table.push(row);
				tableAttr.push(rowAttr);
				trResult = REG_TR.exec(tableTxt);
			}

			data.tables.push(table);
			data.tablesAttr.push(tableAttr);
		});

		if (isGradeMode) {
			// remove none used scoring data to improve scoring performance
			for (var i = data.scoring.items.length - 1; i >= 0; i--) {
				var item = data.scoring.items[i];
				if ($.inArray(item._id, tableIds) < 0) {
					data.scoring.items.splice(i, 1);
				}
			}
			//_correctAns stores original correct answers,because _scoring may change to lower case when case insensitive
			data._correctAns = [];
			$.each(data.scoring.items, function (i, item) {
				$.each(item.gaps, function (k, gap) {
					if (gap.txt != null) {
						gap.txt = $.trim(gap.txt.replace(/\n/g, '').replace(/<.*?>/ig, ''));
						data._correctAns.push({_id: gap._id, txt: gap.txt.split('/')[0]});
						// Eval Logic
						!caseSensitive && (gap.txt = gap.txt.toLowerCase());
					}
				});
			});
		}
		data.curPage = 0;
		me.length(data.tables.length);
		me.index(data.curPage);
	}

	/**
	 * Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		if (!me._htmlPromise) {
			me._htmlPromise = me.html(tTpt, me._json);
		}

		return me._htmlPromise
			.then(function () {
				return me.publish('activity/template/typing-table/load', {
					item: me.items(),
					isLastItem: me.index() === me.length() - 1,
					json: me._json,
					hasScoring: me.hasScoring,
					_super: me
				});
			});
	}

	function Ctor() {
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			var me = this;
			if (!me.hasScoring) {
				me.type(Widget.ACT_TYPE.PRACTICE);
			} else {
				me.items().completed(false);
			}

			filterData.call(me);
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			me._htmlPromise = null;
		},
		"sig/render": function onRender() {
			var me = this;
			return render.call(me);
		},
		"hub/typing-table/interaction": function(interaction) {
			return this.publishInteraction(interaction);
		},
		completed: Factory.around(function (base) {
			return function (isCompleted) {
				var me = this;
				if (!me.hasScoring && isCompleted) {
					me.publish('activity/template/typing-table/show-non-graded-feedback');
				}
				return base.call(this, isCompleted);
			}
		}),
		nextStep: function () {
			var me = this;
			me.index(++me._json.curPage);
			render.call(me);
		}
	};
	return Widget.extend(Ctor, methods);
});

define('troopjs-requirejs/template!school-ui-activity/activity/writing-challenge-exercise/main.html',[],function() { return function template(data) { var o = "";
var data = data || {};

var outBlurb = function(id,en){
    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
    return res;
};
var showLeft = data.references.aud || data.isGraded,
    showExp = data.content.modelText,
    CLS_CNT = (function(){
    if(showLeft && !showExp) return 'ets-act-wtc-l_ne';
    else if(!showLeft && showExp) return 'ets-act-wtc-nl_e';
    else if(!showLeft && !showExp) return 'ets-act-wtc-nl_ne';
    else return 'ets-act-wtc-l_e';
})();
o += "\n<div class=\"ets-act-wtc\">\n    ";if(showLeft){o += "\n    <div class=\"ets-act-wtc-l ets-act-wtc-grade_l\">\n        ";if(data.references.aud){o += "\n        <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                   data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n                   class=\"ets-ap\"></audio>\n        </div></div>\n        ";}o += "\n        ";if(data.isGraded){o += "\n        <div class='ets-act-wtc-fb'>\n            <div class=\"ets-act-wtc-fb-nsmtd ets-act-wtc-fb-none\">\n                <p " +outBlurb(461312,"Your answer will be sent to a teacher for review")+ "></p>\n            </div>\n            <div class=\"ets-act-wtc-fb-smtd ets-act-wtc-fb-none\">\n                <div class=\"ets-act-wtc-fbh\"></div>\n                <p class='ets-act-wtc-fbt' " +outBlurb(461313,"Submitted")+ "></p>\n                <p class='ets-act-wtc-fbc' " +outBlurb(423933,"Unfortunately, due to increasing student numbers, your writing assignment might take a little longer than usual to be graded. Please check your writing carefully before you click 'Submit', and make sure you follow the recommended word limit.")+ "></p>\n                <!--<p class='ets-act-wtc-fbc' " +outBlurb(461314,"Teacher feedback should be sent to you be email within 48 hours.")+ "></p>-->\n                <div class=\"ets-act-wtc-fbf\"></div>\n            </div>\n            <div class=\"ets-act-wtc-fb-psd ets-act-wtc-fb-none\">\n                <p class='ets-act-wtc-fbt' " +outBlurb(461315,"Passed")+ "></p>\n                <p class='ets-act-wtc-fbc'><!--Passed 2012.09.22 (9:15pm)--></p>\n            </div>\n            <div class=\"ets-act-wtc-fb-npsd ets-act-wtc-fb-none\">\n                <p class='ets-act-wtc-fbt' " +outBlurb(461316,"Not passed")+ "></p>\n                <p class='ets-act-wtc-fbc'><!--Not passed: 2012.09.26 (6:00pm)--></p>\n            </div>\n        </div>\n        ";}o += "\n    </div>\n    ";}o += "\n    <div class='ets-act-wtc-r " +CLS_CNT+ "'>\n        <div class=\"ets-act-wtc-rl ets-left\"></div>\n        <div class=\"ets-act-wtc-rm ets-left\">\n            <div class='ets-act-wtc-ip ets-left'>\n                <textarea data-weave=\"school-ui-activity/shared/textchange/main\" readonly=\"readonly\" data-at-id=\"txt-single-textbox\"></textarea>\n            </div>\n            ";if(showExp){o += "\n            <div class='ets-act-wtc-expctn ets-left'>\n                <div class='ets-act-wtc-exp ets-left'>\n                    <div class='ets-act-wtc-exptxt'>\n                        " +data.content.modelText+ "\n                    </div>\n                </div>\n                <div class='ets-act-wtc-exptg' data-show='true'></div>\n                <div class=\"ets-act-wtc-arctn\">\n                    <span class=\"ets-act-wtc-ar\"></span>\n                    <span class=\"ets-act-wtc-artxt\" " + outBlurb(461311,"Show model answer")+ "></span>\n                </div>\n            </div>\n            ";}o += "\n        </div>\n        <div class=\"ets-act-wtc-rr ets-left\"></div>\n        <p class=\"ets-act-wtc-wdscnt ets-act-wtc-clear\"><span " +outBlurb(150691,"Words typed:")+ "></span> <span class=\"ets-act-wtc-wdsnum\">0</span></p>\n        ";if(showExp){o += "\n        <p class=\"ets-act-wtc-ic ets-act-wtc-clear ets-none\" " +outBlurb(461317,"Compare your answer with the model text.")+ "></p>\n        ";}o += "\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/writing-challenge-exercise/main',[
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

define('troopjs-requirejs/template!school-ui-activity/activity/writing-challenge-practice/main.html',[],function() { return function template(data) { var o = "";
var data = data || {};

var outBlurb = function(id,en){
    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
    return res;
};
var showLeft = data.references.aud;
var showExp = data.content.modelText;
var CLS_CNT = (function(){
    if(showLeft && !showExp) return 'ets-act-wtc-l_ne';
    else if(!showLeft && showExp) return 'ets-act-wtc-nl_e';
    else if(!showLeft && !showExp) return 'ets-act-wtc-nl_ne';
    else return 'ets-act-wtc-l_e';
})();
o += "\n<div class=\"ets-act-wtc\">\n     ";if(data.references.aud){o += "\n    <div class=\"ets-act-wtc-l ets-act-wtc-nongrade_l\">\n        <div class=\"ets-act-ap-wrap\"><div data-at-id=\"btn-audio-start\" class=\"ets-act-ap\">\n            <audio data-weave=\"school-ui-shared/widget/audio-player/main\" preload=\"none\"\n                   data-src=\"" +data.references.aud.url+ "\" type=\"audio/mpeg\"\n                   class=\"ets-ap\"></audio>\n        </div></div>\n    </div>\n    ";}o += "\n    <div class='ets-act-wtc-r " +CLS_CNT+ "'>\n        <div class=\"ets-act-wtc-rl ets-left\"></div>\n        <div class=\"ets-act-wtc-rm ets-left\">\n            <div class='ets-act-wtc-ip ets-left'>\n                <textarea data-weave=\"school-ui-activity/shared/textchange/main\" readonly=\"readonly\" data-at-id=\"txt-single-textbox\"></textarea>\n            </div>\n            ";if(showExp){o += "\n            <div class='ets-act-wtc-expctn ets-left'>\n                <div class='ets-act-wtc-exp ets-left'>\n                    <div class='ets-act-wtc-exptxt'>\n                        " +data.content.modelText+ "\n                    </div>\n                </div>\n                <div class='ets-act-wtc-exptg' data-show='true'></div>\n                <div class=\"ets-act-wtc-arctn\">\n                    <span class=\"ets-act-wtc-ar\"></span>\n                    <span class=\"ets-act-wtc-artxt\" " + outBlurb(461311,"Show model answer")+ "></span>\n                </div>\n            </div>\n            ";}o += "\n        </div>\n        <div class=\"ets-act-wtc-rr ets-left\"></div>\n        <p class=\"ets-act-wtc-wdscnt ets-act-wtc-clear\"><span " +outBlurb(150691,"Words typed:")+ "></span> <span class=\"ets-act-wtc-wdsnum\">0</span></p>\n        ";if(showExp){o += "\n        <p class=\"ets-act-wtc-ic ets-act-wtc-clear ets-none\" " +outBlurb(461317,"Compare your answer with the model text.")+ "></p>\n        ";}o += "\n    </div>\n</div>"; return o; }; });
define('school-ui-activity/activity/writing-challenge-practice/main',[
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

define('school-ui-activity/application',[
    "compose",
    "jquery",
    "troopjs-utils/deferred",
    "troopjs-utils/when",
    "troopjs-utils/tr",
    "troopjs-utils/grep",
    "troopjs-utils/uri",
    "troopjs-ef/widget/application",
    "troopjs-ef/data/cache",
    "troopjs-core/route/router",
    "troopjs-core/remote/ajax",
    "troopjs-ef/service/query",
    "school-ui-study/service/config",
    "school-ui-study/service/context",
    "school-ui-study/service/load"
], function ApplicationModule(Compose, $, Deferred, when, tr, grep, URI, Application, Cache, Router, Ajax, Query, Config, Context, Load) {
    "use strict";

    var RE = /^\w+!/;
    var _URI = "uri";
    var CONTEXT = "context";
    var CURRENT_ENROLLMENT = "currentEnrollment";
    var SERVICES = "services";
    var ENROLLMENTS = "enrollments";
    var REQ_ENROLLMENT = "reqEnrollment";

    /**
     * Forwards signals to services
     * @param signal Signal
     * @param deferred Deferred
     * @returns me
     */
    function forward(signal, deferred) {
        var me = this;

        var services = tr.call(me[SERVICES], function (service, index) {
            return Deferred(function (dfd) {
                service.signal(signal, dfd);
            });
        });

        if (deferred) {
            when.apply($, services).then(deferred.resolve, deferred.reject, deferred.notify);
        }

        me.publish("application/signal/" + signal, deferred);

        return me;
    }

     /*!
     * validate if request enrollment belongs to the student
     * if false, use student current context enrollment
     *
     * @param {void}
     * @return {void}
     */
    function validateEnrollment() {
        var me = this,
            context = me[CONTEXT],
            reqEnrollment = me[REQ_ENROLLMENT];

        if(!context || !reqEnrollment ||
            (context[CURRENT_ENROLLMENT] || {}).id === reqEnrollment.id  ||
            !context[ENROLLMENTS]) {
            return;
        }
        
        // check request enrollment
        var isValidEnrollment = false;
        $.each(context[ENROLLMENTS], function(index, enrollment) {
            if(reqEnrollment.id === enrollment.id) {
                isValidEnrollment = true;
                return false;
            }
        });

        if(!isValidEnrollment) {
            // refresh no hash page to load student context
            window.location.hash = "";
            window.location.reload();
        }
    }

    return Application.extend(function ($element, name) {
        var $window = $(window);
        var cache = Cache();

        this[SERVICES] = [ Router($window), Ajax(), Query(cache), Config(cache), Context(), Load() ];
    }, {
        "sig/initialize" : forward,
        "sig/finalize" : forward,
        "sig/start" : forward,
        "sig/stop" : forward,


        "hub:memory/route" : function onRoute(topic, uri) {
            var me = this;

            me.update(me[CONTEXT], me[_URI] = uri);
        },

         /**
         * subscription: hub:memory/context
         * save context, update context and
         * validate enrollment if isUpdate is not true
         *
         * @param {String} topic
         * @param {Object} context
         * @param {Boolean} isUpdate
         * @return {void}
         */
        "hub:memory/context" : function onContext(topic, context) {
            var me = this;
            var isUpdate = arguments[arguments.length-1];

            me.update(me[CONTEXT] = context, me[_URI], isUpdate);

            if(!isUpdate) {
                validateEnrollment.call(me);
            }
        },

        /**
         * subscription: hub:memory/load/enrollment
         * save request enrollment and validate
         *
         * @param {String} topic
         * @param {Object} enrollment
         * @return {void}
         */
        "hub:memory/load/enrollment" : function onEnrollment(topic, enrollment) {
            var me = this;

            me[REQ_ENROLLMENT] = enrollment;

            validateEnrollment.call(me);
        },

        /**
         * update context
         *
         * @param {Object} context
         * @param {Object} uri
         * @param {Boolean} isUpdate
         * @return {void}
         */
        "update" : function update(context, uri, isUpdate) {
            var me = this;

            if (!context || !uri || (!isUpdate && uri.path) || !(CURRENT_ENROLLMENT in context)) {
                return;
            }

            // Deferred query
            Deferred(function deferredQuery(dfdQuery) {
                me.query(context[CURRENT_ENROLLMENT].id, dfdQuery);
            })
            .done(function doneQuery(enrollment) {
                // Route to school with all parts of the path set
                uri.path = URI.Path(tr.call([ "school", enrollment, enrollment.course, enrollment.level, enrollment.unit ], function (element, i) {
                    element = element || "";
                    return element.id
                        ? element.id.replace(RE, "")
                        : element;
                }));

                me.route(uri);
            });
        }
    });
});

define('troopjs-requirejs/template!school-ui-activity/launcher/launcher.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-bd-activity\">\n\t<!--render activity here-->\n</div>\n<div class=\"ets-act-bd-ft\" data-weave=\"school-ui-activity/shared/question-number/main\"></div>"; return o; }; });
define('school-ui-activity/launcher/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"when",
	"school-ui-shared/utils/typeid-parser",
	"template!./launcher.html"
], function WrapperModule($, Widget, When, typeidParser, tLauncher) {

	var TARGET = "target";
	var $ELEMENT = "$element";
	var ACT_CONTENT = "activityContent";

	return Widget.extend(function ($element, name, option) {
		var me = this;
		me._json = option[ACT_CONTENT];
		me[TARGET] = option[TARGET];
		me._option = option;
	}, {
		"sig/start": function initialize() {
			var me = this;
			return me
				.html(tLauncher)
				.then(function () {
					return me[$ELEMENT]
						.find(".ets-act-bd-activity")
						.data("option", me._option)
						.attr("data-at-id", "activity-container")
						.attr("data-at-activity-id", typeidParser.parseId(me._option.act_id))
						.attr("data-weave", me[TARGET] + "(option)")
						.weave();
				});
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			delete me._json;
			delete me._option;
		}
	});
});

define('school-ui-activity/shared/asr/asr-blurbs',[
	'troopjs-core/pubsub/hub'
], function (Hub) {
	"use strict";
	/*
	 Current not supplied blurbs:
	 asrRecordTxt_noasr: "Select the correct answer",
	 asr_error_dictionary_error: "'DICTIONARY_ERROR'",
	 asr_error_not_recgnized: "'NOT_RECOGNIZED'",
	 asr_not_rec_result: "Your voice was not recognized.",

	 New Blurbs:
	 ASRConnErr, 467529
	 ASRSpeechErr, 467530
	 ASRConnErrTryAgain, 467531
	 ASRSwitchTyping, 467532
	 ASRWaitConn, 467533
	 ASRRecording, 467534
	 ASRWarning: "443588"

	 ASRAlterTitle:      "506850",
	 ASRAlterConfirm:    "506853",
	 ASRAlterCancel:     "506854",

	 Past Messages:
	 asr_RecordAgain:        "429405", // "Record again"
	 asrTryTxt:              "150671", // "Remaining attempts"
	 asr_VolumeHigh:         "429404", // "The volume is too high."
	 asr_VolumeLow:          "429403", // "The volume is too low."
	 asr_download_btn_txt:   "183275", // "Download"
	 asr_download_tooltip:   "183274", // "There is a new version of the speech recognition software which has many important updates that will improve your study experience. We strongly recommend you download the new software. Click on 'download' to install. If you don't have admin rights please contact your IT department."
	 asr_error_no_voice:     "183297", // "No voice is detected."

	 asr_error_unknown:          "151181", // "Sorry, your voice wasn't recognized. Please try again."
	 asr_error_voice_too_fast:   "178190", // "You're speaking too fast. Please try again more slowly."
	 asr_error_voice_too_high:   "151179", // "The recording is too loud. Try adjusting your distance from the microphone."
	 asr_error_voice_too_low:    "151180", // "Your voice is too low. Please check your microphone distance and make sure the microphone is not covered."
	 asr_error_voice_too_noisy:  "150929", // "We could not recognize your voice.  This may be due to background noise or a faulty microphone.  Please check your settings and try again, or skip this item."
	 asr_error_voice_too_slow:   "178191", // "You're speaking too slowly. Please try again a bit faster."
	 asr_failed:         "167401", // "The speech recognition software is not working right now. Click OK to complete the activity by typing, or skip this activity."
	 asr_sorry:          "433648", // "I'm sorry."
	 asr_repeat:         "433650", // "Please repeat that."

	 asr_preparing:      "151701", // "Prepare to start recording"
	 asr_processing:     "151687", // "Processing..."
	 asr_try_over_times: "150927", // "You have made three incorrect attempts.  Keep trying or skip this item?"

	 BtnCancel:          "468592", // "Cancel"
	 BtnInstallNow:      "150642", // "Install now"

	 asrDisabledContent:     "179626", // "This activity uses EF Advanced Speech Recognition Software. You are currently studying with Advanced Software Recognition turned off. Please click on “Next” to go to the next activity."
	 asrFailed:              "167401", // "The speech recognition software is not working right now. Click OK to complete the activity by typing, or skip this activity."
	 asrFailedWithoutTyping: "167512", // "We're very sorry, but this activity is not working now."
	 asrRecordTxt:           "150758", // "Record your answer"
	 */
	var blurbs = {

		/*E12 ASR blurbs*/
		ASRSwitchTyping: "467532", // "The speech recognition is not working now. Click OK to complete the activity by typing."
		ASRSwitchSelecting: "467436", // "The speech recognition software is not working right now. Click OK to complete the activity in a non-speaking mode."
		ASRSwitchNext: "467435", // "The speech recognition software is not working right now. Click NEXT to proceed to the next activity."

		ASRClientErrSkip: "468589", // "This activity uses Advanced Speech Recognition software. Install it now and relaunch your browser, or click Cancel to move on to the next activity."
		ASRClientErrType: "468590", // "This activity uses Advanced Speech Recognition software. Install it now and relaunch your browser, or click Cancel for an alternate mode."
		ASRClientErrSelect: "468591", // "This activity uses Advanced Speech Recognition software. Install now, or click Cancel for a non-speaking mode. When installed, please restart your browser."

		/*
		 *  ASR on-boarding related blurbs.
		 */
		IntroTitle: "492075", // "Time to practice speaking!"
		IntroDes: "492076", // "This activity requires you to record your voice. Make sure that you are in a quiet environment and use a headset with microphone. Let's take a few steps to setup your environment."
		IntroButton: "492077", // "GET STARTED"
		Checking: "492078", // "Checking …"
		CheckingDes: "492079", // "Please wait. We are analyzing your browser settings."
		MicFail: "492080", // "Check your microphone"
		MicFailDes: "492081", // "We can't detect your microphone. Please make sure it is plugged in, then click Check Again."
		MicFailCheckButton: "492082", // "CHECK AGAIN"
		SkipReason1: "492083", // "I don't have a microphone/headset."
		SkipReason2: "492084", // "I don't want to speak."
		SkipReason3: "492085", // "Other"
		PriSetDes: "492086", // "Allow access to your microphone."
		PriSetOpen: "492087", // "We just opened the Flash Player settings for you here."
		PriSetAllow: "492088", // "Check Allow"
		PriSetRem: "492089", // "Check Remember"
		PriSetClose: "492090", // "Click Close"
		PriSetBut: "492091", // "I HAVE CHECKED MY SETTINGS!"
		ReadyGo: "492092", // "You are ready to go!"
		ReadyGoDes: "492093", // "Your environment has been successfully set up! You are now ready to start practice speaking."
		ReadyGoBut: "492094", // "Done"
		Other: "450011", // "Skip"

		/*ASR Broken releted*/
		ASRAlterMsg: "626864", // "Do you want to try this activity in non-speaking mode instead?"
		ASRAlterSkipMsg: "626863", // "Do you want to skip this activity for now?"

		/* message blurb*/
		TOPIC_NOT_RECOGNIZE: "626843", // "Sorry, your voice wasn't recognized"
		TOPIC_TOO_HIGH: "626845", // "Your voice is too loud"
		TOPIC_TOO_LOW: "626847", // "Your voice is too soft"
		TOPIC_TOO_SLOWLY: "626849", // "You're speaking too slowly"
		TOPIC_TOO_FAST: "626851", // "You're speaking too fast"
		TOPIC_MIC_NO_VOICE: "626853", // "Sorry, we think there is a problem with your microphone"
		TOPIC_TECH_ERROR: "626855", // "Technical error"
		TOPIC_RETRY: "626859", // "Please try again"
		TOPIC_3_FAIL: "626862", // "Sorry, it seems that we have trouble recognizing your voice"
		MSG_NOT_RECOGNIZE: "626844", // "Check your settings and make sure you are in a quiet place before trying again."
		MSG_CHECK_MIC_HIGH: "626846", // "Please check your microphone settings and try again."
		MSG_CHECK_MIC_LOW: "626848", // "Please check your microphone settings and try again."
		MSG_TRY_FASTER: "626850", // "Please try again a bit faster."
		MSG_TRY_SLOWLY: "626852", // "Please try again more slowly."
		MSG_CHECK_NOT_MUTE: "626854", // "Please check that it is correctly installed and is not muted."
		MSG_TIMEOUT: "626856", // "The server timed out your request. Please try again."
		MSG_FLASH_ERROR: "626857", // "The speech recognition software was unable to connect. Please try again."
		MSG_SERVER_ERROR: "626858", // "The server cannot process your request right now. Please try again."
		MSG_INCORRECT_PRONUN: "626860", // "Pronounce the words more carefully."
		MSG_INCORRECT_ANSWER: "626861", // "That answer is Incorrect."
		MSG_SKIP: "626863", // "Do you want to skip this activity for now?"
		MSG_TRY_NON_SPEAKING: "626864"  // "Do you want to try this activity in non-speaking mode instead?"
	};

	var translations = {};

	var blurbKeys = Object.keys(blurbs);
	var queries = blurbKeys.map(function (key) {
		return 'blurb!' + blurbs[key];
	});
	translations.loadedPromise = Hub.publish('query', queries)
		.then(function (queriedBlurbs) {
			blurbKeys.forEach(function (key, index) {
				translations[key] = queriedBlurbs[index].translation;
			});
			return translations;
		});

	return translations;
});

define('school-ui-activity/shared/asr/asr-config',[],function(){
	return {
		LIMIT_FAILED_TIMES: 3,
		DEBUG_ASR_ENABLED: location.search.indexOf('debugasr') >= 0
	};
});

define('school-ui-activity/shared/asr/guid',[], function () {
	return function guid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		}).toUpperCase();
	};
});


define('troopjs-requirejs/template!school-ui-activity/shared/asr/asr-debug/asr-debug.html',[],function() { return function template(data) { var o = "<h1>ASR DEBUGGER TOOL</h1>\n<p>------------------------------------------------------------------------</p>\n";
	for (var i = 0; i < data.length; i++) {
		writeButton(data[i].code, data[i].msg);
	}
o += "\n\n"; function writeButton(code, msg) { o += "\n\t<button class=\"asr-debug-submit\" data-errorcode=\"" + code + "\">" + msg + "(" + code + ")" + "</button>\n"; } o += "\n<p>------------------------------------------------------------------------</p>\n<input style=\"width: 400px\" id=\"correctAnswerUrl\" type=\"text\" placeholder=\"CORRECT_ANSWER_URL\"/>\n<button class=\"asr-debug-submit\" data-action='recorder'>SUBMIT</button>"; return o; }; });
define('school-ui-activity/shared/asr/asr-debug/main',[
	'jquery',
	'when',
	'troopjs-ef/component/widget',
	'../guid',
	'template!./asr-debug.html'
], function asrDebugModule($, when, Widget, guid, tAsrDebug) {
	'use strict';

	var $ELEMENT = "$element";

	var CCL_SCHOOL_ASR_RECORDER = "ccl!'school.serverasr.nonstreaming.flash.relativepath'";

	var pronsXML,
		activityCb,
		asr_option;

	return Widget.extend({
		"hub:memory/asr/inited": function asrInited(recorderService) {
			var me = this;
			me.recorderService = recorderService;

			/*
			 var asrErrCdMapping = {
			 80  : 'NO_VOICE',
			 3   : 'VOICE_TOO_SLOW',
			 4   : 'VOICE_TOO_FAST',
			 5   : 'VOICE_TOO_LOW',
			 85  : 'VOICE_TOO_LOW', //the same ad '5',
			 6   : 'VOICE_TOO_HIGH',
			 86  : 'VOICE_TOO_HIGH' //the same ad '6',
			 7   : 'CAN_NOT_RECOGNIZE',
			 8   : 'CAN_NOT_RECOGNIZE'
			 };
			 */

			var asrErrCdMapping = [
				{
					code: 80,
					msg: 'NO_VOICE'
				},
				{
					code: 85,
					msg: 'VOICE_TOO_LOW'
				},
				{
					code: 6,
					msg: 'VOICE_TOO_HIGH'
				},
				{
					code: 86,
					msg: 'VOICE_TOO_HIGH'
				},
				{
					code: 61,
					msg: 'GET_RESULT_TIMEOUT'
				},
				{
					code: 1,
					msg: 'DICTIONARY_ERROR'
				}
			];

			me.html(tAsrDebug, asrErrCdMapping);
		},

		"hub:memory/asr/debuggerTool": function (cb, option) {
			pronsXML = option.pronsXML;
			activityCb = cb;
			asr_option = option;
		},

		"dom:.asr-debug-submit/click": function (event) {
			var me = this;
			var g = guid();

			me.publish("asr/set/guid", g);
			me.publish("asr/set/callback", activityCb, g);
			me.publish("asr/set/source", asr_option, g);

			var $button = $(event.currentTarget);
			var errorcode = $button.data('errorcode');

			var testOptionsPromise;
			if (errorcode) {
				testOptionsPromise = me.query(CCL_SCHOOL_ASR_RECORDER)
					.spread(function (ccl) {
						var folder = ccl.value.replace("recorder.swf", "");
						return me.publish("ajax", {
							url: folder + errorcode + ".txt"
						}).then(function (xml) {
							return {
								xml: xml,
								audioUrl: folder + errorcode + ".wav"
							};
						});
					});
			} else if (pronsXML) {
				testOptionsPromise = when.resolve({
					xml: pronsXML,
					audioUrl: me[$ELEMENT].find("#correctAnswerUrl").val()
				});
			} else {
				return;
			}

			testOptionsPromise.then(function (testOptions) {
				me.publish("asr/service/setting", {
					pronsXML: testOptions.xml
				});

				me.recorderService.getRecorder().testClientRecording(
					g,
					'/asr/handlers',
					testOptions.xml,
					"ASR.asrHubProxy",
					88888888,
					99999999,
					false,
					testOptions.audioUrl);
			});
		}
	});
});

define('school-ui-activity/shared/asr/asr-states',[],function () {
	return {
		// For DOM UI indicator
		START: 'START', // Shall only be used to indicate, DOM UI is ok to swtich to "recording" mode
		COMPLETE: 'COMPLETE', // Shall only be used to indicate, the recording is stopped, ASR evaluation follows.
		FEEDBACK: "FEEDBACK", // Shall only be used to indicate ASR evaluation is done, and <TPResult/> has been retrived from server.

		// For abnormal system error UI indicator
		FAILED: 'FAILED', // shall only be used to indicate server communication failure
		ERROR: "ERROR", // shall be used for any flash internal error, non-server communication related

		// For MIC status UI indicator
		NOMIC: 'NOMIC', // MIC status
		UNMUTED: 'UNMUTED', // MIC status
		MUTED: 'MUTED' // MIC status
	};
});

define('school-ui-activity/shared/asr/asr-logger',[
	"jquery",
	"json2",
	"./asr-config"
], function ($, JSON, ASRConfig) {
	"use strict";

	var ASRLogger = {};

	if (window.console) {
		ASRLogger.log = function (info) {
			window.console.log("JS: " + JSON.stringify(info));
		};
	} else {
		ASRLogger.log = function () {};
	}

	if (ASRConfig.DEBUG_ASR_ENABLED) {
		ASRLogger.log = (function (log) {
			return function (info) {
				typeof info === "object" && (info = JSON.stringify(info));
				$(".ets-fn-asr-console").append("<li>" + info + "</li>");
				log(info);
			};
		})(ASRLogger.log);
	}

	return ASRLogger;
});

define('school-ui-activity/shared/asr/asr-trace-event-type',[],function () {
	return {
		'DEFAULT': 70,
		'START': 71,
		'PREPARE': 72,
		'STOP': 73,
		'COMPLETE': 74,
		'PROCESSING': 75,
		'CALLBACK_COMPLETE': 76,
		'RECORDING_COMPLETE': 77,
		'INTERUPT': 78,
		'EVALUTE': 79,
		'SERVER_UNAVALIABLE': 80,
		'CONTEXT_NULL': 81,
		'READY_FOR_RECORD': 83,
		'UI_TIMEOUT': 84,

		/*
		 *  NON-STREAMING MODE
		 */
		'SEND_GRAMMAR_XML': 101,
		'AUDIO_DURATION': 103,
		'AUDIO_ENCODE_TIME': 104,
		'TOTAL_TIME': 108,

		// FLASH INTERNAL ERROR
		'FLASH_ERROR': 85
	};
});

define('school-ui-activity/shared/asr/asr-trace',[
	'module',
	'jquery',
	'json2',
	'troopjs-ef/component/gadget',
	'school-ui-shared/utils/browser-check',
	'school-ui-shared/utils/typeid-parser',
	'./asr-logger',
	'./asr-trace-event-type'
], function ASRLogModule(
	module,
	$,
	JSON,
	Widget,
	BrowserInfo,
	TypeIdParser,
	ASRLogger,
	ASREventType
) {
	"use strict";

	var config = $.extend({
		asrLogUrl: '/services/school/courseware/LogAsrTracking.ashx',
		headers: {}
	}, module.config() || {});

	//Variables
	var activity_id,
		Browser = BrowserInfo.browser + BrowserInfo.version,
		CustomerOS = navigator.platform,
		contentType = 'application/json; charset=utf-8',
		EventLevel = 3,
		student_id,
		AJAX = 'ajax',
		Token;//asrTrackingToken;

	/*!
	 * ASR trace function
	 * {String} token : ASR session token
	 * {Number} eventType
	 * {String} eventDesc
	 */
	function trace(token, eventType, eventDesc) {
		if (!token || !this._isReady) {
			return;
		}

		var me = this,
			EventType = eventType || ASREventType.DEFAULT,
			EventDesc = eventDesc,
			ProcessGuid = token,
			asrType,
			params;
		asrType = 3;

		params = {
			'ProcessGuid': ProcessGuid,
			'student_id': student_id,
			'Activity_id': activity_id,
			'CustomerOS': CustomerOS,
			'Broswer': Browser,
			'AsrType': asrType,
			'Token': Token,
			'EventLevel': EventLevel,
			'EventType': EventType,
			'EventDesc': EventDesc
		};

		me.publish(AJAX, getOldAjaxSet(params))
			.ensure(function (response) {
				ASRLogger.log("ASR Event, type: " + EventType + ", desc: " + eventDesc + ", Response is : " + (response && response.responseText));
			});

	}

	function getOldAjaxSet(p) {

		var params = [
			'ProcessGuid=' + p.ProcessGuid,
			'student_id=' + p.student_id,
			'Activity_id=' + p.Activity_id,
			'CustomerOS=' + p.CustomerOS,
			'Broswer=' + p.Broswer,
			'NativeAsrVersion=' + p.NativeAsrVersion,
			'AsrType=' + p.AsrType,
			'Token=' + p.Token,
			'EventLevel=' + p.EventLevel,
			'EventType=' + p.EventType,
			'EventDesc=' + p.EventDesc
		].join("&");

		return {
			type: "GET",
			url: config.asrLogUrl,
			headers: config.headers,
			cache: false,
			data: params,
			processData: false,
			contentType: contentType
		};
	}

	//Constructor
	function ctor() {
		this._isReady = false;

		setPhase.call(this);
	}

	//Util functions
	function setPhase() {
		if (student_id && activity_id) {
			this._isReady = true;
		}
	}

	//Hanlders
	var Hanlders = {
		"hub:memory/context": function (context) {
			if (!context) {
				return;
			}

			student_id = TypeIdParser.parseId(context.user.id);
			setPhase.call(this);
		},
		"hub:memory/start/load/activity": function (activity) {
			if (!activity) {
				return;
			}

			activity_id = TypeIdParser.parseId(activity.id);

			setPhase.call(this);
		},
		log: trace
	};

	return Widget.extend(ctor, Hanlders);
});

define('school-ui-activity/shared/asr/asr-service-failed-type',[],function () {
	return {
		WARN: "warn",
		MSG: "message",
		CONN: "connect",
		EVA: "evaluate",
		COMM: "common",
		CRASH: "crash"
	}
});

/* global ActiveXObject */
/**
 *   ASR Service Widget
 *   ASR is taken as a type of service to external,
 *   the responsiblity of this widget is to supply a uniform
 *   recorder API for different type of ASR engine, like:
 *    Local, Server.
 */
define('school-ui-activity/shared/asr/asr-service',[
	'module',
	'jquery',
	'when',
	'troopjs-ef/component/service',
	"troopjs-core/pubsub/hub",
	"school-ui-shared/utils/typeid-parser",
	'json2',
	'school-ui-shared/utils/browser-check',
	'./asr-states',
	'./asr-ui-states',
	'./asr-blurbs',
	'./asr-config',
	'./asr-logger',
	'./asr-trace',
	'./asr-trace-event-type',
	'./asr-service-failed-type',
	'./asr-service-message-type',
	'underscore'
], function ASRServiceModule(
	module,
	$,
	when,
	Service,
	Hub,
	TypeIdParser,
	JSON,
	browserCheck,
	FlashStates,
	UIStates,
	ASRBlurbs,
	ASRConfig,
	ASRLogger,
	ASRTrace,
	ASRTraceType,
	ASRFailedType,
	MSGType,
	_
) {
	"use strict";

	/*
	 * Constant variables
	 */
	var CCL_ASR_KEY = 'ccl!"school.AsrServerAddress"',
		currState,
		WARNING_TICK = 5000,
		WARNING_TIMEOUT,
		asrFailedTypes = {},
		undef;

	var SETTINGS = {
		flv: undef,
		recordMaxLength: 600000, // the max recording length is 10mins
		autostopTime: 5, //measured as seconds
		micGain: 80, //asr volume
		silenceLevel: 5, //Audio threshold
		asrServerAddress: "rtmp://speechtest.englishtown.com:1935/asrstreaming",
		asrServerResultUrl: '/asr/Evaluate.ashx', // server evluation service
		activityId: "",
		memberId: "",
		disableScoreRecording: false, // don't send recording to server for scoring

		/*Local ASR Setting*/
		beforeDelay: 5, // number of seconds (integer) to wait before start speaking
		afterDelay: 2, //number of seconds (integer) to wait after finish speaking
		level: 60, //silence level (dB) to activate actual recording(0~96)
		length: 600, //max number of seconds for recording
		asrThreshold: 70
	};

	var callbacks = {},
		source = {},

		currGUID,

		TOPIC_ASR_SERVICE_START = "asr/service/started",
		TOPIC_ASR_UI = "asr/ui/states/changed",
		TOPIC_UI = "asr/ui/",
		TOPIC_AUDIO_PLAY_COMPLETE = "audio/shell/play/complete",
		ASRTHRESHOLD_SETTING = "ccl!'school.asr.threshold.setting'";

	/**
	 * Transform XML document to jQuery dom elment
	 * @param {Object} xml is XMLDocument
	 * @returns {Object} jQuery Dom
	 */

	function xmlToJDom(xml) {
		if (!xml) {
			return $;
		}

		if (browserCheck.browser === "msie" && parseInt(browserCheck.version, 10) <= 9 && Object.prototype.toString.call(xml) === "[object String]") {
			var doc = new ActiveXObject('Microsoft.XMLDOM');
			doc.async = 'false';
			doc.loadXML(xml);
			return $(doc);
		} else {
			return $(xml);
		}
	}

	/**
	 * ASR msg code mapping from error number to error string
	 * @param {Number} errorCode is error code number
	 * @returns {String} error string
	 */

	function getMessageCode(errorCode) {
		// PC ASR version 4.3 support errorCode,
		// other early version didn't return errorCode.
		// It returns error message, goto default error handling.
		var asrErrCdMapping = {
			80: 'NO_VOICE',
			3: 'VOICE_TOO_SLOW',
			4: 'VOICE_TOO_FAST',
			5: 'VOICE_TOO_LOW',
			85: 'VOICE_TOO_LOW', //the same ad '5',
			6: 'VOICE_TOO_HIGH',
			86: 'VOICE_TOO_HIGH',//the same ad '6',
			7: 'CAN_NOT_RECOGNIZE',
			8: 'CAN_NOT_RECOGNIZE'
		};

		var result,
			errCode = parseInt(errorCode, 10);

		if (errCode) {
			result = asrErrCdMapping[errCode] && MSGType[asrErrCdMapping[errCode]] ?
				MSGType[asrErrCdMapping[errCode]] :
				"SERVER_ERROR";
		}

		return result;
	}

	/**
	 * Util function used to publish ASR warning message.
	 * @param {String} context troop component
	 * @param {String} topic
	 * @param {String} msg is warning message
	 * @returns
	 */
	function messagePublishProxy(context, type, topic, msg) {
		context.publish(TOPIC_UI + type, topic, msg);
	}

	/**
	 * Pre-process origin data to ASR understandable type
	 * @param {Object} data is source data from Activity
	 * @returns {Array} processed data
	 */

	function preProcess(data) {
		if (!data) {
			return;
		}

		var propertiesToProcess = [
				/*language comparasion*/
				"text",
				/*
				 Roleplay have special structure:
				 {
				 pronsXML: "...",
				 options: {
				 txt: '...
				 }
				 },

				 So currently ASR can not do pre-process.
				 */
				/*FlashCard Excise*/
				"txt"
			],
			ret;

		propertiesToProcess.forEach(function (propertyKey) {
			if (data[propertyKey]) {
				ret = data[propertyKey].replace(/-/g, " - ").replace(/\s+/g, " ").split(" ");
				return false;
			}
		});

		return ret;
	}

	/**
	 * Deep clone a data from a Object
	 * @param {Object} data
	 * @returns {Object} is a cloned data
	 */

	function clone(data) {
		return JSON.parse(JSON.stringify(data));
	}

	/**
	 * Process and compare ASR results before callback Acitivity
	 * @param {Object} data is ASR recognized results
	 * @param {Boolean} hasError to indicate ASR recgonized success or not
	 * @returns
	 */

	function asrCallBackProxy(data, hasError) {
		var _result = clone(data),
			txt = source[currGUID],
			callback = callbacks[currGUID];

		if (txt) {
			if (_result.length === 0) {
				txt = txt.join(" ").replace(/\s{1}-\s{1}/g, "-").split(" ");
				var _sentence = {
					sentence: txt.join(" "),
					score: 0,
					words: []
				};
				for (var i = 0; i < txt.length; i++) {
					_sentence.words.push({
						word: txt[i],
						score: 0
					});
				}
				_result.push(_sentence);
			} else {
				_result[0].sentence = txt.join(" ");
				var words = _result[0].words;
				var w = 0,
					t = 0;
				while (w < words.length && t < txt.length) {
					if (txt[t] == '-') {
						if (w > 0) {
							words[w - 1].word += '-';
						}
						t++;
						continue;
					}
					words[w].word = txt[t];
					w++;
					t++;
				}
			}
		}

		//Cause every 'source' only used once, so need delete
		delete source[currGUID];

		_result._hasError = hasError;

		if (_.isFunction(callback)) {
			callback(_result);
		}
	}


	/**
	 * Util function used to indicate to persist current state
	 * @returns {Boolean}
	 */

	function neeKeepState(state) {
		var states = [UIStates.BROKEN, UIStates.DOWN];
		return _.indexOf(states, state) > -1;
	}

	var config = $.extend({
		asrEvalzipBaseUrl: window.location.protocol + "//" + window.location.host,
		asrEvalzipPathPrefix: '/asr/handlers'
	}, module.config() || {});

	var TOPIC_ASR_CONN_FAILD = "asr/connection/failed";

	//Const
	var TOPIC_ASR_UI_RECORDING = "asr/ui/recording",
		TOPIC_ASR_RECORDING_STOP = "asr/recording/stopped";

	function trackProxy(feedback) {
		if (!feedback) {
			return;
		}

		ASRLogger.log(feedback);

		this.trace(ASRTraceType.TOTAL_TIME, feedback.totalTime)
			.trace(ASRTraceType.AUDIO_DURATION, feedback.audioDuration)
			.trace(ASRTraceType.AUDIO_ENCODE_TIME, feedback.encodeTime);
	}


	function techcheckRequest() {
		var me = this;
		return me.publish("tech-check/request", [
			{
				id: "flash-setting"
			},
			{
				id: "chrome-auth"
			}
		]);
	}

	return Service.extend(function () {
		this.state(UIStates.DISABLE);
		this.setFailedTimes(null, true);
		this.traceInstance = ASRTrace.create();
	}, {
		"displayName": "server-client",

		"sig/start": function StartASRService() {
			this.publish(TOPIC_ASR_SERVICE_START);
			this.state(UIStates.NORMAL);
			return when.all([
				ASRBlurbs.loadedPromise,
				this.traceInstance.start()
			]);
		},

		"sig/stop": function StopASRService() {
			//dispose ASR service
			callbacks = {};

			if (this.state() === UIStates.RECORDING) {
				this.stopRecord();
				this.reset();
			}
		},

		"hub:memory/asr/inited": function asrInited(recorderService) {
			//Do something when asr init finished
			this.recorderService = recorderService;
		},

		//only set setting
		"hub/asr/service/setting": function (config) {
			var me = this;
			me.setting(config);
		},

		"hub/asr/reset": function asrReset() {
			this.reset();
		},

		/**
		 *   @description
		 *   This method is used for EXTERNAL change ASR failed times.
		 *   Such as: FlashCard Excise have a requirement which need to
		 *   set a failed time when the answer is wrong.
		 *   (https://jira.englishtown.com/browse/SPC-2926)

		 *   !!!Only the ASR state is 'Normal' can set this property.

		 * @param {String} topic
		 * @param {String} newState When set a common failed type, there must provide a new state.
		 */
		"hub/asr/set/common/failed/times": function asrSetCommonFailedTimes(newState) {
			if (this.state() !== UIStates.NORMAL) {
				return;
			}

			this.state(newState, this.setFailedTimes(ASRFailedType.COMM));
		},

		"hub/asr/reset/failed/times": function asrReset() {
			var statesCheckList = [
				UIStates.PROCESSING,
				UIStates.PREPARING,
				UIStates.RECORDING
			];

			if (_.indexOf(statesCheckList, this.state()) > -1) {
				return;
			}
			this.setFailedTimes(null, true);
		},

		"hub/before/loadActivity": function () {
			this.reset();
			//Only when activity reloaded, reset this value
			this.setFailedTimes(0, true);
		},

		"hub/asr/enable": function asrEnable() {
			var me = this,
				state = me.state();

			me.GUID(null);

			/*
			 For some state like 'broken', ASR should keep
			 the state and can't be changed. This logic only
			 applied after recorded that means every reseted
			 state should not have this check.
			 */

			if (neeKeepState(state) && !me._reseted) {
				if (state === UIStates.BROKEN) {
					me.setFailedTimes(null, true);
				}

				ASRLogger.log("Can't force ASR enable, current state is: " + state);
				return;
			}

			me.state(UIStates.NORMAL);

			me._reseted = false;
			ASRLogger.log("Force ASR enable");
		},

		"hub/asr/disable": function asrDisable() {
			var me = this;

			if (me.state() === UIStates.BROKEN) {
				me.setFailedTimes(null, true);
			}

			me.GUID(null);
			clearTimeout(WARNING_TIMEOUT);
			me.state(UIStates.DISABLE);
			ASRLogger.log("Force ASR disable");
		},

		"hub/asr/isEnabled": function () {
			return this.isASREnabled();
		},

		"hub/asr/start/record": function asrStartRecord(guid, cb, option) {
			this.startRecord(guid, cb, option);
		},

		"hub/asr/stop/record": function asrStopRecord() {
			this.stopRecord();
		},
		/*
		 *  Add new hub for outside to change ASR state,
		 *   only can change when ASR warning.
		 */
		"hub/asr/show/message": function asrShowWarning(msgType) {
			var me = this;
			if (me.state() !== UIStates.NORMAL) {
				return;
			}

			me.message(msgType);
		},

		"hub/asr/startPlayback": function asrStartPlayback() {
			var state = this.state(),
				validStates = [UIStates.NORMAL, UIStates.COMMON, UIStates.HINT, UIStates.WARNING, UIStates.ERROR];

			if (this.isPlaying
				// || !this.GUID()
				|| validStates.indexOf(state) === -1) {
				return;
			}

			this.state(UIStates.DISABLE);
			this.isPlaying = true;
			this.startPlayback();
		},
		"hub/asr/stopPlayback": function asrStopPlayback() {
			//When playing asr, record state should be diabled
			if (this.state() !== UIStates.DISABLE) {
				return;
			}

			this.isPlaying = false;
			this.state(UIStates.NORMAL);
			this.stopPlayback();
		},
		"hub:memory/start/load/activity": function (activity) {
			if (!activity) {
				return;
			}
			SETTINGS.activityId = TypeIdParser.parseId(activity.id);
		},
		"hub:memory/load/level": function (levelInfo) {
			var me = this;

			if (!levelInfo) {
				return;
			}

			me.query(ASRTHRESHOLD_SETTING)
				.spread(function (configInfo) {
					//Notes : config value example {"default": 70, "levelNo": {"1" : 50, "2" : 50, "3" : 60}}
					var config = JSON.parse(configInfo.value) || { "default": 70 },
						levelNo = levelInfo.levelNo,

						CFG_TYPE = "levelNo",
						DEFAULT = "default";

					SETTINGS.asrThreshold = (config[CFG_TYPE] && config[CFG_TYPE][levelNo]) || config[DEFAULT];
				});
		},
		"hub:memory/context": function (context) {
			var me = this,
				REG_PROTOCOL = /.*?(?=\:\/\/)/i;
			SETTINGS.memberId = TypeIdParser.parseId(context.user.id);
			me.query(CCL_ASR_KEY)
				.spread(function (addr) {
					SETTINGS.asrServerAddress = addr && addr.value;

					me.defaultProtocol = SETTINGS.asrServerAddress.match(REG_PROTOCOL)[0];
				});
		},

		"hub/asr/playback/status/changed": function asrPlayBackComplete(playState) {
			switch (playState) {
				case "START":
					break;
				case "COMPLETE":
					this.isPlaying = false;
					this.state(UIStates.NORMAL);
					this.publish(TOPIC_AUDIO_PLAY_COMPLETE, this.GUID());
					break;
			}
		},

		"hub/asr/set/guid": function (guid) {
			var me = this;
			me.GUID(guid);
		},

		"hub/asr/set/callback": function (cb, guid) {
			callbacks[guid] = cb;
		},

		"hub/asr/set/source": function (option, guid) {
			source[guid] = preProcess(option);
		},

		/**
		 * Internal state machine
		 * @param {String} newState to update
		 * @param {Object} failedTimes for newState
		 * @returns {String} current ASR state
		 */
		state: function (newState, failedTimes) {
			failedTimes = failedTimes || 0;
			var me = this,
				args = [].slice.call(arguments, 0),
				isPlaying = me.isPlaying,
				isCrashed = asrFailedTypes[ASRFailedType.CRASH] > 0,
				isNormal = failedTimes < ASRConfig.LIMIT_FAILED_TIMES;

			if (newState && newState !== currState) {
				/*
				 Here is a hack for ASR failed 3 times,
				 But if ASR encountered a crash error such as
				 ASR Server down or Client Side ASR not installed.
				 So only when non-crash error happened times is more than 3
				 or ASR is not replay,then we tell student that you can
				 switch to alternative mode. If we encounte a crash error,
				 only tell student the ASR is down and shows skeleton.
				 */

				args[0] = currState = (isCrashed || isNormal || isPlaying) ? newState : (newState = UIStates.BROKEN);

				args.unshift(TOPIC_ASR_UI);
				me.publish.apply(me, args);

				/*
				 * Sometimes, ASR internal may be produce exceptions which cause
				 * the Flash stop to go on the task, so here is a way to handle
				 * this case.
				 */
				if (newState === UIStates.PROCESSING) {
					me._processTimeout = setTimeout(function () {
						me.message(MSGType.TIMEOUT);
						me.trace(ASRTraceType.UI_TIMEOUT, "UI processing timeout!");
						me.GUID(null);
					}, 30000);
				} else {
					clearTimeout(me._processTimeout);
				}
			}

			return currState;
		},

		/**
		 * Show the message box, all message show be call in this way
		 *
		 */
		message: function (type) {
			var me = this;
			var UIType;
			var failedTimes = me.setFailedTimes(ASRFailedType.MSG);

			clearTimeout(WARNING_TIMEOUT);
			type = type.toUpperCase();

			if (failedTimes >= ASRConfig.LIMIT_FAILED_TIMES) {
				type = MSGType.FALLBACK;
			}
			else {
				WARNING_TIMEOUT = setTimeout(function () {
					var state = me.state();
					if (state === UIStates.WARNING ||
						state === UIStates.ERROR) {
						me.state(UIStates.NORMAL);
					}
				}, WARNING_TICK);
			}

			switch (type) {
				case MSGType.FALLBACK:
					UIType = UIStates.BROKEN;
					break;
				case MSGType.INCORRECT_ANSWER:
					messagePublishProxy(me, "hint", ASRBlurbs.TOPIC_RETRY, ASRBlurbs.MSG_INCORRECT_ANSWER);
					UIType = UIStates.HINT;
					break;
				case MSGType.INCORRECT_PRONUN:
					messagePublishProxy(me, "hint", ASRBlurbs.TOPIC_RETRY, ASRBlurbs.MSG_INCORRECT_PRONUN);
					UIType = UIStates.HINT;
					break;
				case MSGType.VOICE_TOO_SLOW:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_TOO_SLOWLY, ASRBlurbs.MSG_TRY_FASTER);
					UIType = UIStates.WARNING;
					break;
				case MSGType.VOICE_TOO_FAST:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_TOO_FAST, ASRBlurbs.MSG_TRY_SLOWLY);
					UIType = UIStates.WARNING;
					break;
				case MSGType.VOICE_TOO_HIGH:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_TOO_HIGH, ASRBlurbs.MSG_CHECK_MIC_HIGH);
					UIType = UIStates.WARNING;
					break;
				case MSGType.VOICE_TOO_LOW:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_TOO_LOW, ASRBlurbs.MSG_CHECK_MIC_LOW);
					UIType = UIStates.WARNING;
					break;
				case MSGType.NO_VOICE:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_MIC_NO_VOICE, ASRBlurbs.MSG_CHECK_NOT_MUTE);
					UIType = UIStates.WARNING;
					break;
				case MSGType.CAN_NOT_RECOGNIZE:
					messagePublishProxy(me, "warning", ASRBlurbs.TOPIC_NOT_RECOGNIZE, ASRBlurbs.MSG_NOT_RECOGNIZE);
					UIType = UIStates.WARNING;
					break;
				case MSGType.TIMEOUT:
					messagePublishProxy(me, "error", ASRBlurbs.TOPIC_TECH_ERROR, ASRBlurbs.MSG_TIMEOUT);
					UIType = UIStates.ERROR;
					break;
				case MSGType.FLASH_ERROR:
					messagePublishProxy(me, "error", ASRBlurbs.TOPIC_TECH_ERROR, ASRBlurbs.MSG_FLASH_ERROR);
					UIType = UIStates.ERROR;
					break;
				case MSGType.SERVER_ERROR:
				default:
					messagePublishProxy(me, "error", ASRBlurbs.TOPIC_TECH_ERROR, ASRBlurbs.MSG_SERVER_ERROR);
					UIType = UIStates.ERROR;
					break;
			}
			if (UIType === UIStates.WARNING || UIType === UIStates.HINT) {
				//show play back button
				me.publish("asr/ui/playback", true);
			}
			else {
				me.publish("asr/ui/playback", false);
			}

			me.state(UIType);
		},

		/**
		 * Update or reset failed times for specific ASR state
		 * @param {String} failedType to set
		 * @param {Boolean} reset ASR failed times
		 * @param {Int} step for add failed times
		 * @returns {Int} all failed times
		 */
		setFailedTimes: function (failedType, reset, step) {
			var i,
				type;
			step = step || 1;

			if (failedType) {

				asrFailedTypes[failedType] += reset ? 0 : step;

			} else if (reset) {

				for (i in ASRFailedType) {

					if (_.has(ASRFailedType, i)) {
						type = ASRFailedType[i];
						asrFailedTypes[type] = 0;
					}

				}

			}

			return this.getFailedTimes();
		},

		/**
		 * Get all types of ASR failed times
		 * @return {Int} all failed times
		 */
		getFailedTimes: function () {
			var i,
				type,
				allFailedTimes = 0;

			for (i in ASRFailedType) {

				if (_.has(ASRFailedType, i)) {
					type = ASRFailedType[i];
					allFailedTimes += asrFailedTypes[type];
				}

			}

			return allFailedTimes;
		},


		/**
		 * ASR session GUID setter
		 * @param {String} id is session GUID string
		 * @return {String} current session GUID
		 */
		GUID: function (id) {
			if (!currGUID || (id !== undefined && currGUID !== id)) {
				currGUID = id;
			}

			return currGUID;
		},

		/**
		 * Recorder setting setter
		 * @param {Object} config is all options of recoder settings
		 * @return {String} current setting
		 */
		setting: function (config) {
			var me = this;
			me._settings = me._settings || _.extend({}, SETTINGS);

			return config ? _.extend(me._settings, config) : me._settings;
		},

		/**
		 * Recorder callback getter
		 * @param {String} guid is session GUID
		 * @return {Function} callback by GUID
		 */
		callback: function (guid) {
			return callbacks[guid || currGUID];
		},

		/**
		 * Record complete handler
		 * @param {Object} result recognize result from recoder
		 * @return
		 */
		"recognizeComplete": function (result) {
			if (!currGUID) {
				return;
			}

			var me = this,
				jsonResult = [],
				jXML = xmlToJDom(result),
				errorCode = jXML.attr('error') || jXML.find('TPResult').attr('error'),
				reason = jXML.attr('error') || jXML.find('TPResult').attr('reason') || "",
				threshold = SETTINGS.asrThreshold,
				answerIncorrect = 0,
				answerCorrect = 100;

			if (errorCode) {
				ASRLogger.log("Error:" + errorCode + " Reason: " + reason);
				me.message(getMessageCode(errorCode));
				asrCallBackProxy(jsonResult, true);

			} else {
				jXML.find('Sentence').each(function () {
					var jSentence = $(this),
						sentence = {
							sentence: jSentence.attr('trans'),
							index: Number(jSentence.attr('id')),
							similarity: Number(jSentence.attr('score'))
						};
					sentence.words = [];

					jSentence.find('Word').each(function () {
						var jWord = $(this);
						sentence.words.push({
							word: jWord.attr('trans'),
							similarity: Number(jWord.attr('score'))
						});
					});
					jsonResult.push(sentence);
				});

				ASRLogger.log("threshold:" + threshold);

				_.each(jsonResult, function (sentence) {
					_.each(sentence.words, function (word) {
						word.score = (word.similarity < threshold) ? answerIncorrect : answerCorrect;
					});
					sentence.score = (sentence.similarity < threshold) ? answerIncorrect : answerCorrect;

					ASRLogger.log("similarity:" + JSON.stringify(sentence));
				});

				me.state(UIStates.NORMAL);

				asrCallBackProxy(jsonResult);

				me.trace(ASRTraceType.RECORDING_COMPLETE, "RecognizeCompleted");
			}


		},

		"startRecord": function (guid, cb, option) {
			var me = this,
				setting = me.setting();
			if (!this.isASREnabled()) {
				me.state(UIStates.DOWN, me.setFailedTimes(ASRFailedType.CRASH, false, ASRConfig.LIMIT_FAILED_TIMES));
				return;
			}

			me.setting(option);

			me.state(UIStates.PREPARING);
			me.GUID(guid);
			//TODO: should pass GUID to server for every session
			callbacks[currGUID] = callbacks[currGUID] || cb;
			source[currGUID] = preProcess(option);

			//Not block UI thread
			setTimeout(function () {
				if (me.state() === UIStates.RECORDING) {
					me.stopRecord();
				} else {
					me._startTime = (new Date).getTime();
					me.trace(ASRTraceType.START, "Start");
				}

				me.trace(ASRTraceType.SEND_GRAMMAR_XML, "Send ASR grammar xml text");

				var recorder = me.recorderService && me.recorderService.getRecorder();
				if (recorder && recorder.startClientRecording) {
					recorder.startClientRecording(
						guid,
						config.asrEvalzipBaseUrl + config.asrEvalzipPathPrefix,
						setting.pronsXML,
						"ASR.asrHubProxy",
						setting.memberId,
						setting.activityId,
						setting.disableScoreRecording);
				}
				else {
					me.state(UIStates.NORMAL);
				}
			});
		},

		"stopRecord": function () {
			this.state(UIStates.PROCESSING);
			//stop curr recording instance
			this.isASREnabled() && this.recorderService.getRecorder().stopClientRecording();
		},

		"startPlayback": function () {
			this.isASREnabled() && this.recorderService.getRecorder().startClientPlayback(
				"ASR.playStatusCallback"
			);
		},

		"stopPlayback": function () {
			this.isASREnabled() && this.recorderService.getRecorder().stopClientPlayback();
		},

		"isASREnabled": function () {
			var recorder = this.recorderService && this.recorderService.getRecorder();
			var enabled = Boolean(recorder)
				&& (recorder['stopClientPlayback'] !== null);
			ASRLogger.log("Check ASR: " + enabled);
			return enabled;
		},

		"reset": function () {
			var me = this;

			clearTimeout(WARNING_TIMEOUT);
			me.GUID(null);
			me.isPlaying = false;
			me._reseted = true;
			me._settings = null;

			if (me.state() === UIStates.RECORDING) {
				me.stopRecord();
			}

			clearInterval(this._asrInterval);
			this.setFailedTimes(ASRFailedType.EVA, true);
		},

		/*
		 * Here success means flash can connect to server successfully.
		 */
		"hub/asr/record/success": function (args) {
			var currGUID = this.GUID(),
				me = this,
				status = args[0];

			if (!currGUID || !args) {
				return;
			}

			clearInterval(this._asrInterval);
			ASRLogger.log("recorder response status, state is: " + args[0] + ", message is: " + args[1]);

			/*
			 args=[statusCode,audio_id,audioBuffer16]
			 */
			switch (status) {
				case FlashStates.START:
					me.trace(ASRTraceType.READY_FOR_RECORD, me._startTime ? ((new Date).getTime() - me._startTime) : 0);
					delete me._startTime;
					me.state(UIStates.RECORDING);
					me._asrInterval = setInterval(function () {
						var recorder = me.recorderService && me.recorderService.getRecorder();
						if (!recorder || !recorder.getMicActivity) {
							clearInterval(me._asrInterval);
							return;
						}

						var _micLevel = recorder.getMicActivity();
						me.publish(TOPIC_ASR_UI_RECORDING, _micLevel);
					}, 100);
					break;
				case FlashStates.COMPLETE:

					me.publish(TOPIC_ASR_RECORDING_STOP);
					me.state(UIStates.PROCESSING);
					me.trace(ASRTraceType.COMPLETE, "Complete");
					break;
				case FlashStates.FEEDBACK:
					me.onRecordFeedback.apply(me, args);
					break;
				case FlashStates.FAILED:
					// For any asr server errors
					me.onRecordFailed.apply(me, args);
					break;
				case FlashStates.ERROR:
					// For any flash client errors
					me.message(MSGType.FLASH_ERROR);
					me.trace(ASRTraceType.FLASH_ERROR, (args[1] || "Unknown Flash Error!"));
					break;
				case FlashStates.NOMIC:
					me.state(UIStates.NORMAL);

					techcheckRequest.call(me);

					break;
				case FlashStates.UNMUTED:
					me.state(UIStates.NORMAL);
					break;
				case FlashStates.MUTED:
					me.state(UIStates.NORMAL);
					techcheckRequest.call(me);

					break;
				default:
					break;
			}
		},

		/*
		 * @param {Object} info {
		 audioSize: 13480,
		 encodeTime: 568,
		 result: "<TPResult version="1.0"><Sentence id="3" trans="TN score="34.487766"></Word></Sentence></TPResult>",
		 totalTime: 915,
		 audioDuration: 1.0681179138321995
		 }
		 */
		"onRecordFeedback": function (status, info) {
			var me = this,
				sets = me.setting(),
				cb = me.callback();

			trackProxy.call(me, info);

			// For activities with pronsXML, which means this is not a speaking challenge
			if (sets.pronsXML && info) {
				me.recognizeComplete(info.result);
			}
			// Speaking challenge only
			else {
				if (cb) {
					cb();
				}
				me.state(UIStates.NORMAL);
			}
		},

		"onRecordFailed": function () {
			var me = this;

			me.publish(TOPIC_ASR_CONN_FAILD);

			if (me.state() === UIStates.PROCESSING) {
				me.message(MSGType.FLASH_ERROR);
			}

			me.trace(ASRTraceType.SERVER_UNAVALIABLE, "ASR Server Unavaliable");
		},

		"trace": function (evtType, evtDesc) {
			this.traceInstance.log(this.GUID(), evtType, evtDesc);
			return this;
		}
	});
});

define('school-ui-activity/shared/asr/asr-recorder-service-html5',[
	'require',
	'jquery',
	'when',
	'troopjs-ef/component/service',
	'./asr-states',
	'asr-core'
], function (
	require,
	$,
	when,
	Service,
	FlashStates,
	html5AsrRecorder
) {
	var RECORDER = '_recorder';

	var TOPIC_ASR_SUCCESS = "asr/record/success";
	var TOPIC_ASR_PLAYBACK_STATUS_CHANGED = "asr/playback/status/changed";

	function publishAsrRecordEvent() {
		var me = this;
		var args = Array.prototype.slice.call(arguments);
		me.publish(TOPIC_ASR_SUCCESS, args);
	}

	function record(
		guid,
		host,
		contextXml,
		ignoredCallback,
		studentId,
		activityId,
		disableScoreRecording,
		audioElement
	) {
		var me = this;

		return html5AsrRecorder.startClientRecording({
			basename: guid,
			files: [
				{
					filename: guid + '.context',
					content: contextXml
				}
			],
			onlyPlayback: Boolean(disableScoreRecording),
			audioElement: audioElement
		}).then(function (startResult) {
			publishAsrRecordEvent.call(me, FlashStates.START, guid);
			return startResult.resultPromise.then(function (result) {
				publishAsrRecordEvent.call(me, FlashStates.COMPLETE, guid);

				if (disableScoreRecording) {
					publishAsrRecordEvent.call(me, FlashStates.FEEDBACK, null);
					return;
				}

				var endRecordingTimestamp = Date.now();
				var encodeTime = 0;
				if (result.timers) {
					endRecordingTimestamp = result.timers.endRecording || endRecordingTimestamp;
					encodeTime = (result.timers.zip || endRecordingTimestamp) - endRecordingTimestamp;
				}

				var url = host
					+ "/evalzip.ashx"
					+ "?guid=" + guid
					+ "&student_id=" + studentId
					+ "&activity_id=" + activityId;
				me.publish('ajax', {
					type: 'POST',
					url: url,
					contentType: 'application/zip',
					data: result.zip,
					processData: false,
					dataType: 'text'
				})
					.then(function (responseArray) {
						var totalTime = Date.now() - endRecordingTimestamp;
						publishAsrRecordEvent.call(me, FlashStates.FEEDBACK, {
							result: responseArray[0],
							totalTime: totalTime,
							encodeTime: encodeTime,
							audioDuration: result.duration,
							audioSize: result.zip.size
						});
					}, function (jqXHR, textStatus, errorThrown) {
						publishAsrRecordEvent.call(me, FlashStates.FAILED, errorThrown);
					});
			});
		}, function (error) {
			publishAsrRecordEvent.call(me, FlashStates.ERROR, error);
		});
	}

	function initServerHtml5Asr() {
		var me = this;
		var recorder = $.extend({}, html5AsrRecorder);
		recorder.startClientRecording = function (
			guid,
			host,
			contextXml,
			ignoredCallback,
			studentId,
			activityId,
			disableScoreRecording
		) {
			record.call(me,
				guid,
				host,
				contextXml,
				ignoredCallback,
				studentId,
				activityId,
				disableScoreRecording,
				null // audio element
			);
		};
		recorder.testClientRecording = function (
			guid,
			host,
			contextXml,
			ignoredCallback,
			studentId,
			activityId,
			disableScoreRecording,
			audioUrl
		) {
			var audioElement = document.createElement('audio');
			audioElement.controls = false;
			audioElement.preload = 'auto';
			audioElement.muted = true;
			audioElement.addEventListener('ended', function () {
				document.body.removeChild(audioElement);
			});
			audioElement.addEventListener('error', function (error) {
				document.body.removeChild(audioElement);
				publishAsrRecordEvent.call(me, FlashStates.ERROR, error);
			});
			audioElement.addEventListener('canplaythrough', function onCanPlayThrough() {
				audioElement.removeEventListener('canplaythrough', onCanPlayThrough);
				audioElement.pause();
				setTimeout(function () {
					audioElement.muted = false;
					audioElement.currentTime = 0;
					record.call(me,
						guid,
						host,
						contextXml,
						ignoredCallback,
						studentId,
						activityId,
						disableScoreRecording,
						audioElement
					);
				}, 0);
			});
			audioElement.src = audioUrl;
			document.body.appendChild(audioElement);
			audioElement.play(); // start loading
		};
		recorder.startClientPlayback = function () {
			me.publish(TOPIC_ASR_PLAYBACK_STATUS_CHANGED, 'START');
			html5AsrRecorder.startClientPlayback()
				.then(function () {
					me.publish(TOPIC_ASR_PLAYBACK_STATUS_CHANGED, 'COMPLETE');
				});
		};
		this[RECORDER] = recorder;
	}


	return Service.extend({
		'sig/start': function () {
			return initServerHtml5Asr.call(this);
		},
		getRecorder: function () {
			return this[RECORDER];
		}
	});
});

define('school-ui-activity/util/ccl-cache-server',[], function () {
	return location.protocol === 'http:'
		? "ccl!'configuration.servers.cache'"
		: "ccl!'configuration.servers.cachesecure'";
});
define('school-ui-activity/shared/asr/asr-recorder-service-flash',[
	'require',
	'jquery',
	'when',
	'troopjs-ef/component/service',
	'school-ui-shared/utils/browser-check',
	'school-ui-activity/util/ccl-cache-server',
	'./asr-logger'
], function (
	require,
	$,
	when,
	Service,
	browserCheck,
	CCL_CACHE_SERVER,
	ASRLogger
) {
	var CONTAINER = '_asrFlashContainer';
	var RECORDER = '_recorder';

	var FLASH_CONTAINER_ID = 'ets-asr-recorder';
	var CLS_RECORDER = 'asr-recorder';
	var SEL_RECORDER = '#asr-recorder';

	var FLASH_HIDDEN_WIDTH = "500", FLASH_HIDDEN_HEIGHT = "500";

	var CCL_ASR_NON_STREAMING_FLASH_RELATIVE_PATH = 'ccl!"school.serverasr.nonstreaming.flash.relativepath"';

	var	TOPIC_ASR_SUCCESS = "asr/record/success";
	var	TOPIC_ASR_FAIL = "asr/record/failed";
	var	TOPIC_ASR_PLAYBACK_STATUS_CHANGED = "asr/playback/status/changed";

	function getCacheServer() {
		var me = this;
		return me.query(CCL_CACHE_SERVER).spread(function (cclCacheServer) {
			return cclCacheServer && cclCacheServer.value || '';
		});
	}

	function getFlashRelativePath() {
		var me = this;
		return me.query(CCL_ASR_NON_STREAMING_FLASH_RELATIVE_PATH)
			.spread(function (flashRelativePathCcl) {
				return flashRelativePathCcl && flashRelativePathCcl.value;
			});
	}

	function requireSwfObject() {
		return when.promise(function (resolve) {
			require(['swfobject'], resolve);
		});
	}

	function initServerFlashAsr($container) {
		var me = this;

		var ASR = window.ASR = window.ASR || {};

		/**
		 * ASR recording proxy hub used to handle events callback from flash
		 */
		ASR.asrHubProxy = function () {
			var args = [].slice.call(arguments, 0);
			if (args.length) {
				// TODO: this hub name is confusing, as it really
				// meant to hanle a "recording status" notification (failure, error, etc),
				// instead of saying the recording is *really* success
				me.publish(TOPIC_ASR_SUCCESS, args);
			} else {
				me.publish(TOPIC_ASR_FAIL);
			}
		};

		/*
		 * New method for new Server ASR recording flow, in the new flow there have a client mode,
		 * that means when ASR playback don't need send request.
		 *  @param {String} status is ASR player internal status
		 */
		ASR.playStatusCallback = function (status) {
			me.publish(TOPIC_ASR_PLAYBACK_STATUS_CHANGED, status);
		};

		return when.all([
			getCacheServer.call(me),
			getFlashRelativePath.call(me),
			requireSwfObject()
		]).spread(function (cacheServer, flashRelativePath, swfobject) {
			$container.append($('<div></div>', { id: FLASH_CONTAINER_ID }));

			var initFunctionName = 'asrRecorderInit';
			var promise = when.promise(function(resolve){
				window[initFunctionName] = resolve;
			});

			var swfversionstr = "10.0.0",
				xiswfurlstr = "playerproductinstall.swf",
				flashvars = {
					init: initFunctionName
				},
				params = {},
				attributes = {};

			var flashUrl = cacheServer + flashRelativePath;
			/**
			 *  In IE, we have a known SPC-2568, if flash file is cached,
			 *  then the recorder re-init will always failed.
			 */
			if (browserCheck.browser === 'msie') {
				flashUrl += '?' + (+new Date);
			}

			//create flash for record
			//for version detection, set to min. required flash player version, or 0 (or 0.0.0), for no version detection.
			params.quality = "high";
			params.bgcolor = "#ffffff";
			params.allowscriptaccess = "always";
			params.allowfullscreen = "true";
			params.allowDomain = "true";
			params.wmode = "transparent";
			attributes.id = CLS_RECORDER;
			attributes.name = CLS_RECORDER;
			attributes.align = "middle";
			swfobject.embedSWF(
				flashUrl,
				FLASH_CONTAINER_ID,
				FLASH_HIDDEN_WIDTH, FLASH_HIDDEN_HEIGHT,
				swfversionstr,
				xiswfurlstr,
				flashvars,
				params,
				attributes,
				function flashCb(event) {
					me[RECORDER] = event.ref;
				});
			//javascript enabled so display the flashcontent div in case it is not replaced with a swf object. -->
			swfobject.createCSS(SEL_RECORDER, "display:block;text-align:left;");
			//end flash for record

			return promise;
		})
			.otherwise(function (e) {
				ASRLogger.log("Server ASR Exception:" + (e && e.stack) || e);
				throw e;
			});
	}

	return Service.extend({
		'sig/start': function () {
			return initServerFlashAsr.call(this, this[CONTAINER]);
		},
		setContainer: function (container) {
			this[CONTAINER] = container;
		},
		getRecorder: function() {
			return this[RECORDER];
		},
		"hub/asr/flash/init/append-to": function ($container) {
			var me = this;
			if ($container) {
				me[CONTAINER].find(SEL_RECORDER).remove();
				$container.append('<div id="ets-asr-recorder"></div>');
				initServerFlashAsr.call(me, $container);
			}
		}
	});
});

define('school-ui-activity/shared/asr/asr-init',[
	'jquery',
	'when',
	'troopjs-ef/component/widget',
	'./asr-service',
	'./asr-recorder-service-html5',
	'./asr-recorder-service-flash',
	'asr-core'
], function ASRInitModule(
	$,
	when,
	Widget,
	ASRService,
	Html5RecorderService,
	FlashRecorderService,
	html5AsrRecorder
) {
	"use strict";

	var $ELEMENT = "$element";

	var TOPIC_ASR_INITED = "asr/inited";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			var recorderService;
			if (html5AsrRecorder.isAvailable()) {
				recorderService = Html5RecorderService.create();
			} else {
				recorderService = FlashRecorderService.create();
				recorderService.setContainer(me[$ELEMENT])
			}
			recorderService.start()
				.then(function () {
					return me.publish(TOPIC_ASR_INITED, recorderService);
				})
				.then(function(){
					var asrService = ASRService.create();
					return asrService.start();
				});
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/shared/asr/asr-ui.html',[],function() { return function template(data) { var o = "";
    var outBlurb = function(id,en){
        var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";

        return res;
    };
o += "\n<div class=\"ets-act-asr ets-disabled\" data-at-id=\"btn-asr-record\">\n\t<div class=\"ets-act-playback\"></div>\n\t<div class=\"ets-act-asr-button\" data-action=\"record\"><div class=\"ets-act-asr-loading\"></div></div>\n\t<div class=\"ets-act-asr-pop ets-tip\" data-at-id=\"pnl-message-asr-tip\">\n\t\t<div class=\"ets-hd\"></div>\n\t\t<div class=\"ets-bd\">\n\t\t\t<span data-at-id=\"lbl-asr-tip-topic\" " + outBlurb("512394", "Click to record your answer")+ "></span>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-asr-pop ets-message\">\n\t\t<div class=\"ets-hd\"></div>\n\t\t<div class=\"ets-bd\">\n\t\t\t<span " + outBlurb("467533", "Wait. Connecting...")+ "></span>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-asr-pop ets-volume\" data-at-id=\"pnl-message-asr-volume\">\n\t\t<div class=\"ets-hd\"></div>\n\t\t<div class=\"ets-bd\">\n\t\t\t<span data-at-id=\"lbl-asr-volume-topic\" " + outBlurb("512393", "Click to stop recording")+ "></span>\n\t\t\t<div class=\"ets-act-asr-indicator\"><span></span></div>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-asr-pop ets-warning-pop ets-warning\" data-at-id=\"pnl-message-asr-warning\">\n\t\t<div class=\"ets-hd\"></div>\n\t\t<div class=\"ets-bd\">\n\t\t\t<h4 data-at-id=\"lbl-asr-warning-topic\"></h4>\n\t\t\t<p data-at-id=\"lbl-asr-warning-content\"></p>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-asr-pop ets-error-pop ets-error\" data-at-id=\"pnl-message-asr-error\">\n\t\t<div class=\"ets-hd\"></div>\n\t\t<div class=\"ets-bd\">\n\t\t\t<h4 data-at-id=\"lbl-asr-error-topic\"></h4>\n\t\t\t<p data-at-id=\"lbl-asr-error-content\"></p>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-asr-pop ets-hint-pop ets-hint\" data-at-id=\"pnl-message-asr-hint\">\n\t\t<div class=\"ets-hd\"></div>\n\t\t<div class=\"ets-bd\">\n\t\t\t<h4 data-at-id=\"lbl-asr-hint-topic\"></h4>\n\t\t\t<p data-at-id=\"lbl-asr-hint-content\"></p>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-asr-pop ets-hint-pop ets-broken\" data-at-id=\"pnl-message-asr-switch-typing\">\n\t\t<div class=\"ets-hd\"></div>\n\t\t<div class=\"ets-bd\">\n\t\t\t<h4 data-at-id=\"lbl-asr-switch-topic\"><span " + outBlurb("626862", "Sorry, it seems that we have trouble recognizing your voice")+ "></span></h4>\n\t\t\t<p data-at-id=\"lbl-asr-switch-content\" " + outBlurb("626864", "Do you want to try this activity in non-speaking mode instead?")+ " ></p>\n\t\t\t<div class=\"ets-btn ets-btn-blue ets-btn-shadowed\" data-action=\"switch\" data-at-id=\"btn-switch-typing-yes\">\n\t\t\t\t<span " + outBlurb("506853", "Yes")+ " ></span>\n\t\t\t</div>\n\t\t\t<div class=\"ets-btn ets-btn-blue ets-btn-shadowed\" data-action=\"cancel\" data-at-id=\"btn-switch-typing-no\">\n\t\t\t\t<span " + outBlurb("506854", "No")+ " ></span>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-asr-pop ets-error-pop ets-down\" data-at-id=\"pnl-message-asr-down\">\n\t\t<div class=\"ets-hd\"></div>\n\t\t<div class=\"ets-bd\">\n\t\t\t<h4><span " + outBlurb("467530", "Speech recognition error")+ "></span></h4>\n\t\t\t<p>The speech recognition is not working now.</p>\n\t\t\t<div class=\"ets-btn-small ets-btn-blue ets-btn-shadowed\" data-action=\"down\">\n\t\t\t\t<span " + outBlurb("150652", "OK")+ "></span>\n\t\t\t</div>&nbsp;\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
/**
 *   ASR Widget
 */
define('school-ui-activity/shared/asr/asr-ui',[
	'jquery',
	'jquery.ui',
	'troopjs-ef/component/widget',
	'underscore',
	'template!./asr-ui.html',
	'./asr-ui-states',
	'./asr-blurbs',
	'./asr-config',
	'./asr-service',
	'./guid',
	'school-ui-shared/utils/browser-check'
], function ASRUI(
	$,
	$UI,
	Widget,
	_,
	tASR,
	UIStates,
	ASRBlurbs,
	ASRConfig,
	ASRService,
	guid,
	browserCheck
) {
	"use strict";

	var undef;
	var $ELEMENT = "$element";

	var CLS_ASR_DISABLE = "ets-disabled",
		CLS_ASR_RECODING = "ets-recording ",
		CLS_ASR_PREPARING = "ets-preparing ",
		CLS_ASR_PROCESSING = "ets-processing ",
		CLS_ASR_DOWN = "ets-down",
		CLS_ASR_WARNING = "ets-warning",
		CLS_ASR_ERROR = "ets-error",
		CLS_ASR_HINT = "ets-hint",
		CLS_ASR_BROKEN = "ets-broken",
		CLS_ASR = "ets-act-asr",
		CLS_TIP = "ets-tip",
		CLS_PLAYBACK_OPEN = "ets-act-open",

		ASR_FALLBACK_TYPE = "asrFallbackType",
		ASR_FALLBACK_CB = "asrFallbackCb",
		ASR_FAIL_CB = "asrFailCb",
		ASR_RESET_FAILED_TIMES = "needResetASRFailedTimes",
		ASR_ENABLE_TIP = "asrEnableTip",

		ID = "_id",

		SEL_ASR = ".ets-act-asr",
		SEL_ASR_BUTTON = ".ets-act-asr-button",
		SEL_ASR_WARN_TITLE = ".ets-warning .ets-bd > h4",
		SEL_ASR_WARN_MSG = ".ets-warning .ets-bd > p",
		SEL_ASR_ERROR_TITLE = ".ets-error .ets-bd > h4",
		SEL_ASR_ERROR_MSG = ".ets-error .ets-bd > p",
		SEL_ASR_HINT_TITLE = ".ets-hint .ets-bd > h4",
		SEL_ASR_HINT_MSG = ".ets-hint .ets-bd > p",
		SEL_INDICATOR = ".ets-act-asr-indicator span",
		SEL_ASR_DOWN_CONTENT = ".ets-down .ets-bd > p",
		SEL_ASR_BROKEN_CONTENT = ".ets-broken .ets-bd > p",
		SEL_ASR_PARPARE_MSG = ".ets-act-asr-pop.ets-message",
		SEL_PLAYBACK = ".ets-act-playback",


		TOPIC_ASR_DEBUGGERTOOL = "asr/debuggerTool",
		TOPIC_ASR_UI = "asr/ui/states/changed",
		TOPIC_CONTAINER_NEXT_ACT = "activity-container/nextActivity",
		TOPIC_ASR_ENABLE = "asr/enable",
		TOPIC_ASR_START_RECORD = "asr/start/record",
		TOPIC_ASR_STOP_RECORD = "asr/stop/record",
		TOPIC_ASR_PLAYBACK = "asr/ui/playback",
		TOPIC_ASR_INIT_APPENDTO = "asr/flash/init/append-to";


	var ENUM_ASR_FALLBACK_TYPE = {
		TYPING: "TYPING",
		SELECT: "SELECT",
		NEXT: "NEXT"
	};

	var SETTING = {
		asrFallbackType: ENUM_ASR_FALLBACK_TYPE.NEXT,
		asrFallbackCb: $.noop,
		asrFailCb: $.noop,
		needResetASRFailedTimes: false,
		asrEnableTip: false
	};

	var HANDLERS = {
		state: function (state) {
			if (state && this._state !== state) {
				this._state = state;
				this.updateUI(state);
			}
			return this._state;
		},
		option: function (option) {
			if (!this._option || (option && this._option[ID] !== option[ID])) {
				this._option = option;
			}
			return this._option || { prons: "" };
		},
		"setting": function (config) {
			var me = this;
			me._setting = me._setting || _.extend({}, SETTING);

			return config ? _.extend(me._setting, config) : me._setting;
		},
		toggleCls: function (cls) {
			var me = this;

			if (!me._$asr) {
				return;
			}
			var newCls = cls ? (CLS_ASR + " " + cls) : CLS_ASR;

			me._$asr.attr("class", newCls);
		},
		updateUI: function (state) {
			var me = this,
				setting = me.setting(),
				FALLBACK_TYPE = setting[ASR_FALLBACK_TYPE].toUpperCase();
			state = state || me.state();

			switch (state) {
				case UIStates.BROKEN:
					// case 1, fail case over 3 times
					switch (FALLBACK_TYPE) {

						case ENUM_ASR_FALLBACK_TYPE.NEXT:
							this._$brokenContent.text(ASRBlurbs.ASRAlterSkipMsg);
							break;
						case ENUM_ASR_FALLBACK_TYPE.TYPING:
						case ENUM_ASR_FALLBACK_TYPE.SELECT:
							this._$brokenContent.text(ASRBlurbs.ASRAlterMsg);
							break;
						default:
							break;
					}

					me.toggleCls(CLS_ASR_BROKEN);
					break;
				case UIStates.DISABLE:
					me.toggleCls(CLS_ASR_DISABLE, true);
					break;
				case UIStates.DOWN:
					// case 1, sudden stop record when ui is processing
					// case 2, asr is not enabled(asr funtion not found) when start record
					switch (FALLBACK_TYPE) {
						case ENUM_ASR_FALLBACK_TYPE.NEXT:
							me._$fallBackContent.text(ASRBlurbs.ASRSwitchNext);
							break;
						case ENUM_ASR_FALLBACK_TYPE.TYPING:
							me._$fallBackContent.text(ASRBlurbs.ASRSwitchTyping);
							break;
						case ENUM_ASR_FALLBACK_TYPE.SELECT:
							me._$fallBackContent.text(ASRBlurbs.ASRSwitchSelecting);
							break;
					}

					me.toggleCls(CLS_ASR_DOWN);
					if (setting[ASR_FAIL_CB]) {
						setting[ASR_FAIL_CB]();
					}
					break;
				case UIStates.NORMAL:
					me.toggleCls(setting[ASR_ENABLE_TIP] ? CLS_TIP : "");
					break;
				case UIStates.PREPARING:
					me.toggleCls(CLS_ASR_PREPARING);
					break;
				case UIStates.PROCESSING:
					me.toggleCls(CLS_ASR_PROCESSING);
					break;
				case UIStates.RECORDING:
					me.toggleCls(CLS_ASR_RECODING);
					break;
				case UIStates.WARNING:
					me.toggleCls(CLS_ASR_WARNING);
					break;
				case UIStates.ERROR:
					me.toggleCls(CLS_ASR_ERROR);
					break;
				case UIStates.HINT:
					me.toggleCls(CLS_ASR_HINT);
					break;
			}
		}
	};


	function initASREL() {
		var me = this;
		if (!me[$ELEMENT]) {
			return;
		}

		if (!me._$asr || !me._$asr.length) {
			me._$asr = me[$ELEMENT].find(SEL_ASR);
			me._$fallBackContent = me._$asr.find(SEL_ASR_DOWN_CONTENT);
			me._$brokenContent = me._$asr.find(SEL_ASR_BROKEN_CONTENT);

			me._$asr.find(SEL_ASR_PARPARE_MSG).hide();
		}

		return me._$asr;
	}

	function resetFailedTimes() {
		this.publish("asr/reset/failed/times");
	}

	function createPlayback(guid) {
		var me = this;
		var $playback_audio = $(SEL_PLAYBACK);
		var HUB_ASR_STOP_PLAYBACK = "asr/stopPlayback";
		var HUB_ASR_PLAYBACK = "asr/startPlayback";
		var WIDGET_PATH_AUDIO_SHELL = "school-ui-activity/shared/audio/audio-shell";

		$playback_audio
			.unweave()
			.then(function () {
				return $playback_audio
					.data("option", {
						"_playHandler": function () {
							me.publish(HUB_ASR_PLAYBACK);
						},
						"_pauseHandler": function () {
							me.publish(HUB_ASR_STOP_PLAYBACK);
						},
						"guid": guid
					})
					.attr("data-weave", WIDGET_PATH_AUDIO_SHELL + "(option)")
					.weave();
			});
	}

	function createDebugPanel() {
		$(".ets-asr-debug").remove();

		$("<div></div>").addClass("ets-asr-debug")
			.attr("data-weave", "school-ui-activity/shared/asr/asr-debug/main")
			.appendTo("body")
			.weave();
	}

	return Widget.extend(function () {
		var me = this;

		me.html(tASR)
			.then(function () {
				var $el = me[$ELEMENT];
				if (!$el) {
					return;
				}
				me._$indicator = $el.find(SEL_INDICATOR);

				if (ASRConfig.DEBUG_ASR_ENABLED) {
					createDebugPanel.call(me);
				}
			});
	}, {
		"sig/start": function() {
			return ASRBlurbs.loadedPromise;
		},

		"sig/stop": function () {
			this.publish("asr/reset");
		},

		"hub/asr/ui/setting": function (cb, option, config) {
			var me = this,
				setting;

			me.option(option);

			if (cb && typeof cb === "function") {
				me._asrCB = (function () {
					var asr_cb = cb || function () {};

					if (option["playback"] != false) {
						createPlayback.call(me, me._guid);
					}

					return function (result) {
						/*Add ASR Info for ASR_Scoring:
						 * >. Current recording items '_id'
						 */
						if (result && result[0]) {
							result[0][ID] = me.option()[ID];
						}

						asr_cb(result, me._guid);
					}
				})();
			}

			if (config) {
				setting = me.setting(config);
			}

			if (setting[ASR_RESET_FAILED_TIMES]) {
				resetFailedTimes.call(me);
			}

			me.updateUI();

			me.publish(TOPIC_ASR_DEBUGGERTOOL, me._asrCB, me.option());
		},

		"hub:memory/asr/service/started": function () {
			var me = this;

			initASREL.call(this);

			me.state(UIStates.NORMAL);
			me.publish(TOPIC_ASR_ENABLE);

			// we need to append the asr flash under the button for preventing power saved
			if (browserCheck.browser === "safari" &&
				parseFloat(browserCheck.version, 10) >= 7) {
				me.publish(TOPIC_ASR_INIT_APPENDTO, me[$ELEMENT].find(SEL_ASR_BUTTON));
			}
		},


		"hub/asr/ui/states/changed": function (state, failedTimes) {

			if (failedTimes !== undefined) {
				this._failedTimes = failedTimes;
			}

			this.state(state);
		},

		"hub/asr/ui/warning": function (title, msg) {
			var me = this;
			me._$asr
				.addClass(CLS_ASR_WARNING)
				.find(SEL_ASR_WARN_TITLE)
				.text(title || "")
				.end()
				.find(SEL_ASR_WARN_MSG)
				.text(msg || "");
			me.updateUI();

		},
		"hub/asr/ui/error": function (title, msg) {
			this._$asr
				.addClass(CLS_ASR_ERROR)
				.find(SEL_ASR_ERROR_TITLE)
				.text(title || "")
				.end()
				.find(SEL_ASR_ERROR_MSG)
				.text(msg || "");
		},
		"hub/asr/ui/hint": function (title, msg) {
			this._$asr
				.addClass(CLS_ASR_HINT)
				.find(SEL_ASR_HINT_TITLE)
				.text(title || "")
				.end()
				.find(SEL_ASR_HINT_MSG)
				.text(msg || "");
		},

		"hub/asr/ui/recording": function (micLevel) {
			var me = this;

			if (!me._$indicator) {
				me._$indicator = me[$ELEMENT].find(SEL_INDICATOR);
			}
			me._$indicator.css("width", micLevel + "%");
		},

		"hub/asr/ui/playback": function (toggle) {
			var me = this,
				option = me.option();

			if (option["playback"] == false) {
				return;
			}

			var $playback = me[$ELEMENT].find(SEL_PLAYBACK);

			if (toggle === undef) {
				$playback.toggleClass(CLS_PLAYBACK_OPEN);
			}
			else if (toggle === true) {
				$playback.addClass(CLS_PLAYBACK_OPEN);
			}
			else {
				$playback.removeClass(CLS_PLAYBACK_OPEN);
			}
		},

		'dom:[data-action="record"]/click': function () {
			var me = this,
				inValidState = [UIStates.PROCESSING, UIStates.PREPARING, UIStates.DISABLE],
				isASRDown = (me.state() === UIStates.DOWN) && me._failedTimes > ASRConfig.LIMIT_FAILED_TIMES - 1;

			if (_.indexOf(inValidState, me.state()) !== -1 || isASRDown) {
				return;
			}

			switch (me.state()) {
				case UIStates.WARNING:
				case UIStates.HINT:
				case UIStates.ERROR:
					me.toggleCls();
				case UIStates.COMMON:
				case UIStates.DOWN:
				case UIStates.STOP_REPLAY:
				case UIStates.NORMAL:
					me._guid = guid();
										me.publish(TOPIC_ASR_START_RECORD, me._guid, me._asrCB, me.option());
					me.publish(TOPIC_ASR_PLAYBACK, false);
					break;
				case UIStates.RECORDING:
					me.publish(TOPIC_ASR_STOP_RECORD, me._guid);
					break;
				default :
					break;
			}
		},

		'dom:[data-action="down"]/click': function () {
			var me = this,
				setting = this.setting();

			me.toggleCls(CLS_ASR_DISABLE);
			me[$ELEMENT]
				.effect(
					'fade',
					500,
					function () {
						if (setting[ASR_FALLBACK_CB]) {
							setting[ASR_FALLBACK_CB]();
						}
					}
				).remove();
		},

		'dom:[data-action="switch"]/click': function () {
			var me = this,
				setting = me.setting(),
				FALLBACK_TYPE = setting[ASR_FALLBACK_TYPE].toUpperCase();

			switch (FALLBACK_TYPE) {
				case ENUM_ASR_FALLBACK_TYPE.NEXT:
					me.publish(TOPIC_CONTAINER_NEXT_ACT);
					break;
				case ENUM_ASR_FALLBACK_TYPE.TYPING:
				case ENUM_ASR_FALLBACK_TYPE.SELECT:
					me[$ELEMENT].find('[data-action="down"]').click();
					break;
			}
		},

		'dom:[data-action="cancel"]/click': function () {
			var me = this;
			me.state(UIStates.NORMAL);
			me.publish(TOPIC_ASR_UI, UIStates.NORMAL);
			resetFailedTimes.call(me);
		}
	}, HANDLERS);
});


define('troopjs-requirejs/template!school-ui-activity/shared/audio/audio-shell.html',[],function() { return function template(data) { var o = "<div class=\"ets-ap-shell\">\n    <div class=\"ets-ap ets-ap-small\">\n        <button data-action=\"play\"></button>\n    </div>\n</div>  "; return o; }; });
define('school-ui-activity/shared/audio/audio-shell',[
	'jquery',
	'troopjs-ef/component/widget',
	'template!./audio-shell.html'
], function ActivityBaseModule($, Widget, tAudioShell) {
	"use strict";

	var SEL_AP_SHELL = ".ets-ap-shell",
		SEL_AP = ".ets-ap",
		CLS_DISABLED = "ets-disabled",
		CLS_PAUSE = "ets-pause",
		HANDLER_PLAY = "_playHandler",
		HANDLER_PAUSE = "_pauseHandler";

	var ENUM_STATES = {
		NORMAL: "NORMAL",
		PLAYING: "PLAYING"
	};

	function updateCls(needPauseCls) {
		if (!this.$apShell) {
			this.$apShell = this.$element.find(SEL_AP_SHELL);
		}
		if (!needPauseCls) {
			this.$apShell.removeClass(CLS_PAUSE);
		} else {
			this.$apShell.addClass(CLS_PAUSE);
		}
	}

	return Widget.extend(function (el, module, setting) {
		if (setting) {
			this[HANDLER_PLAY] = setting[HANDLER_PLAY];
			this[HANDLER_PAUSE] = setting[HANDLER_PAUSE];
			this._guid = setting.guid;
		} else {
			this[HANDLER_PLAY] = this[HANDLER_PAUSE] = $.noop;
		}
	}, {
		"sig/initialize": function onStart() {
			var me = this;
			return me.html(tAudioShell);
		},
		state: function (s) {
			if (s && this._state != s) {
				this._state = s;
			}
			return this._state || ENUM_STATES.NORMAL;
		},
		'dom:button/click': function ($e) {
			var $target = $($e.currentTarget);
			// If audio is disabled, then don't play audio just return
			if ($target.closest(SEL_AP).hasClass(CLS_DISABLED)) {
				return;
			}
			switch (this.state()) {
				case ENUM_STATES.NORMAL:
					this[HANDLER_PLAY]();
					this.state(ENUM_STATES.PLAYING);
					updateCls.call(this, true);
					break;
				case ENUM_STATES.PLAYING:
					this[HANDLER_PAUSE]();
					this.state(ENUM_STATES.NORMAL);
					updateCls.call(this);
					break;
			}
		},
		"hub/audio/shell/play/complete": function (/*guid*/) {
			var me = this;
			// if(guid !== this._guid) return;
			me.state(ENUM_STATES.NORMAL);

			// Becasue sometimes the callback will get immediately, so this can be let javascript delay run in queue
			setTimeout(function () {
				updateCls.call(me);
			}, 0);
		},
		'hub/asr/start/record': function () {
			var me = this;
			me.$element.find(SEL_AP).addClass(CLS_DISABLED);
		},
		'hub/asr/recording/stopped': function () {
			var me = this;
			me.$element.find(SEL_AP).removeClass(CLS_DISABLED);
		}
	});
});

define('troopjs-requirejs/template!school-ui-activity/shared/automation-test/automation-test.html',[],function() { return function template(data) { var o = "<input type=\"hidden\" data-at-id=\"assets\" />"; return o; }; });
define('school-ui-activity/shared/automation-test/main',[
	'json2',
	"troopjs-ef/component/widget",
	"template!./automation-test.html"
], function (JSON, Widget, tAt) {

	return Widget.extend(function ($element, name, assets) {
		var assetsString = "{}";
		switch (typeof assets) {
			case "string":
				assetsString = assets;
				break;
			case "object":
				assetsString = JSON.stringify(assets);
				break;
		}
		this.html(tAt);
		$element.find("[data-at-id=assets]").val(assetsString);
	});

});
define('school-ui-activity/shared/checkbox/main',[
	'jquery',
	'when',
	'troopjs-ef/component/widget'
], function ActivityBaseModule($, when, Widget) {
	"use strict";

	var $ELEMENT = '$element';

	var WRAPPER = "<span class='ets-checkbox'></span>";

	var SEL_CHECKBOX = '.ets-checkbox';
	var SEL_INPUT = 'input[type="checkbox"]';
	var CLS_CHECKED = 'ets-checkbox-checked';

	function toggleChecked() {
		var me = this;

		if (me.$input.prop('checked')) {
			me.$wrapper.addClass(CLS_CHECKED);
		} else {
			me.$wrapper.removeClass(CLS_CHECKED);
		}

	}

	function render() {
		var me = this;

		if (!me[$ELEMENT].find(SEL_INPUT).length) {
			return when.reject(new Error("No found checkbox element"));
		}

		me[$ELEMENT].find(SEL_INPUT).wrap();
		me.$input = me[$ELEMENT].find(SEL_INPUT);

		me.$input.wrap(WRAPPER);

		me.$wrapper = me[$ELEMENT].find(SEL_CHECKBOX);

		return when.resolve();
	}

	return Widget.extend({
		'sig/initialize': function () {
			return render.call(this);
		},
		'sig/start': function () {
			var me = this;
			toggleChecked.call(me);
		},
		'dom/mouseenter': function () {
			var me = this;
			me.$wrapper.addClass('ets-checkbox-hover');
		},
		'dom/mouseleave': function () {
			var me = this;
			me.$wrapper.removeClass('ets-checkbox-hover');
		},
		'dom/click': function () {
			var me = this;
			me.$input.prop('checked', !me.$input.prop('checked'));
			toggleChecked.call(me);
		}
	});
});

define('troopjs-requirejs/template!school-ui-activity/shared/epaper/epaper.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-ep-bd\" data-at-id=\"pnl-epaper-container\">\n\t<div class=\"ets-act-ep-main\">\n\t\t<div class=\"ets-act-ep-content-wrap\">\n\t\t\t<div class=\"ets-act-ep-content ets-hidden\">\n\t\t\t\t<!--put epaper content here-->\n\t\t\t\t" + data + "\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"ets-act-ep-handler\" data-at-id=\"btn-epaper-toggle\">\n\t\t\t<i class=\"ets-act-ep-arr\"></i>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-ep-bd-shadow\"></div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity/shared/epaper/epaper-fixed.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-ep-bd ets-act-ep-fixed\" data-at-id=\"pnl-epaper-container\">\n    <div class=\"ets-act-ep-main\">\n        <div class=\"ets-act-ep-content-wrap\">\n            <div class=\"ets-act-ep-content ets-hidden\">\n                <!--put epaper content here-->\n                " + data + "\n            </div>\n        </div>\n    </div>\n</div>"; return o; }; });
/*
 * Flow to add epaper:
 1. build a container with class named "ets-act-epaper"
 2. set epaper content
 */
define('school-ui-activity/shared/epaper/main',[
	'jquery',
	'jquery.mousewheel',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-shared/utils/browser-check',
	'template!./epaper.html',
	'template!./epaper-fixed.html',
	'jquery.jscrollpane'
], function ($, $mouseWheel, when, Widget, browserCheck, tEpaper, tEpaperFixed) {
	"use strict";

	var IS_IE78 = browserCheck.browser === "msie" && parseInt(browserCheck.version, 10) <= 8;
	var $el = "$element",

		PROP_ANIMATING_TOGGLE = "_animatingToggle",

		SEL_EPAPER_CONTENT = ".ets-act-ep-content",
		SEL_EPAPER_BD = ".ets-act-ep-bd",

		CLS_EXPENDED = "ets-expanded",
		CLS_HIDDEN = "ets-hidden",

		AUTO_EXPAND_DELAY = 600,
		ANIMATE_DURATION = 400,
		REG_IMAGE_URL = /(?:(src\s*=\s*[\|'|"]*)(.*?\.(jpg|png)))/g,
		REG_LOOK_BEHIND = /src\s*[=|'|"]+|url\s*\(['|"]*/g,

		IMG_PAP = "imgPap",
		HTML_PAP = "htmlPap",
		$epBody,

		defaults = {
			expandWidth: 652,
			autoExpand: true
		},

		DEFAULT_CONTENT = "Failed loading content. Please try again later.",

		TOPIC_EPAPER_EXPAND = "activity/epaper/expanding",
		TOPIC_EPAPER_FOLD = "activity/epaper/folding";

	function toggleExpandContent() {
		var me = this;
		if (me[PROP_ANIMATING_TOGGLE]) return;

		var expWid = this._settings.expandWidth,
			operator = this.expanded ? '-=' : '+=',
			toggleOperate = this.expanded ? "removeClass" : "addClass";

		publishProxy.call(this, this.expanded);

		me[PROP_ANIMATING_TOGGLE] = true;
		when
			.promise(function (resolve, reject) {
				$epBody.animate({
					"width": operator + expWid
				}, ANIMATE_DURATION).promise().then(resolve, reject);
			})
			.then(function () {
				me[PROP_ANIMATING_TOGGLE] = false;
				$(this)[toggleOperate](CLS_EXPENDED);
				me.expanded = !me.expanded;

				if (!me.expanded) {
					me.publish('epaper/collapse');
				}
			});
	}

	function publishProxy(isExpand) {
		this.publish(isExpand ? TOPIC_EPAPER_FOLD : TOPIC_EPAPER_EXPAND);
	}

	function loadImg(src) {
		return when.promise(function (resolve) {
			var cachedImg = new Image();
			cachedImg.onload = function () {
				resolve({
					width: cachedImg.width,
					height: cachedImg.height
				});
			};
			cachedImg.onerror = function () {
				resolve({
					width: null,
					height: null
				});
			};
			cachedImg.src = src;
		});
	}

	function wrapImg(src) {
		return '<img src="' + src + ' " alt="" />';
	}

	function render(content) {
		var me = this,
			$ele = me[$el],
			template = me._refereces._epaperType === "fixed" ? tEpaperFixed : tEpaper;

		content = content || DEFAULT_CONTENT;

		this.expanded = false;

		// Cause JavaScript not consist 'look behind', like (?<:XX)SS
		//  To reach the same goal, here used two regexp
		var imgsUrlArr = (content.match(REG_IMAGE_URL) || []).map(function (src) {
			return src.replace(REG_LOOK_BEHIND, "");
		});

		return this.html(template, content)
			.then(function () {
				$epBody = $ele.find(SEL_EPAPER_BD);
				var imgPromises = imgsUrlArr.map(function (src) {
					src = src.replace(/'/g, '%27').replace(/"/g, '%34');

					// Fix <=IE8 cached image can't fire onload event properly
					if (IS_IE78) {
						src = src + "?_" + (new Date).getTime();
					}

					return loadImg(src)
						.then(function (size) {
							$ele.find('img[src="' + src + '"]').attr({
								height: size.height || "auto",
								width: size.width || "auto"
							});
						});
				});

				if (me._settings.autoExpand && template === tEpaper) {
					me._timeout = setTimeout(function () {
						toggleExpandContent.call(me);
					}, AUTO_EXPAND_DELAY);
				}

				return when.all(imgPromises);
			})
			.then(function () {
				$ele.find(SEL_EPAPER_CONTENT)
					.jScrollPane()
					.find("img")
					.removeAttr("height width")
					.end()
					.removeClass(CLS_HIDDEN);
			});
	}

	function checkAndReadyEpaper() {
		var me = this,
			ref = me._refereces;

		var content = (ref[HTML_PAP] && ref[HTML_PAP].content)
			? ref[HTML_PAP].content
			: ref[IMG_PAP] && ref[IMG_PAP].url && wrapImg(ref[IMG_PAP].url);

		//Resolve epaper render defer object
		me.renderDfd.resolve(content);
	}

	return Widget.extend(function (el, module, refereces, settings) {
		if (!refereces) {
			throw "You must supply epaper content!";
		}
		var me = this;

		me._refereces = refereces;
		me._settings = $.extend(true, defaults, settings);

		me[PROP_ANIMATING_TOGGLE] = false;

		this.renderDfd = when.defer();
		this.renderDfd.promise.then(function (content) {
			render.call(me, content);
		});
	}, {
		"hub:memory/course-property/load/courseTypeCode": function updateCourseCodeType() {
			checkAndReadyEpaper.call(this);
		},
		"sig/start": function epaperStart() {
			var me = this;
			checkAndReadyEpaper.call(me);
		},
		"sig/stop": function epaperStop() {
			clearTimeout(this._timeout);
			//Stop the currently-running animation on the matched elements.
			/*
			 *	.stop( [clearQueue ] [, jumpToEnd ] )
			 */
			$epBody && $epBody.stop(true, true);
		},
		"dom:.ets-act-ep-handler/touchstart": function handlerClick($event) {
			$event.preventDefault();
			toggleExpandContent.call(this, true);
		},
		"dom:.ets-act-ep-handler/click": function handlerClick($event) {
			$event.preventDefault();
			toggleExpandContent.call(this, true);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/shared/question-number/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-wgt-qs\">\n    <p class=\"ets-wgt-qs-desc\" data-weave='troopjs-ef/blurb/widget' data-blurb-id='467836' data-text-en='question'></p>\n    <ul class=\"ets-wgt-qs-index\">\n        <li class=\"ets-wgt-qs-index-left\">\n            <ul><li class=\"ets-wgt-qs-num\">" +data._preIndex.charAt(0)+ "</li>\n            ";if(data._curIndex.charAt(0) != data._preIndex.charAt(0)){o += "\n                <li class=\"ets-wgt-qs-num ets-wgt-qs-num-cur\">" +data._curIndex.charAt(0)+ "</li>\n            ";}o += "\n            </ul>\n        </li>\n        <li class=\"ets-wgt-qs-index-right\">\n            <ul><li class=\"ets-wgt-qs-num\">" +data._preIndex.charAt(1)+ "</li>\n            ";if(data._curIndex.charAt(1) != data._preIndex.charAt(1)){o += "\n                <li class=\"ets-wgt-qs-num ets-wgt-qs-num-cur\">" +data._curIndex.charAt(1)+ "</li>\n            ";}o += "\n            </ul>\n        </li>\n    </ul>\n    <span class=\"ets-wgt-qs-split\"></span>\n    <ul class=\"ets-wgt-qs-total\">\n        <li class=\"ets-wgt-qs-num\">" +data._total.charAt(0)+ "</li>\n        <li class=\"ets-wgt-qs-num\">" +data._total.charAt(1)+ "</li>\n    </ul>\n</div>"; return o; }; });
define('school-ui-activity/shared/question-number/main',[
	'jquery',
	'troopjs-ef/component/widget',
	"template!./main.html"
], function mpaMain($, Widget, tQn) {
    "use strict";
    var SEL_MAIN = '.ets-wgt-qs',
        SEL_LEFT_NUM = '.ets-wgt-qs-index-left',
        SEL_RIGHT_NUM = '.ets-wgt-qs-index-right',
        STR_MASK = '0';

	function render() {
        var me = this,
            $ROOT = me.$element;
        $ROOT.find(SEL_MAIN).hide();
		return me
			.html(tQn, me._json)
			.tap(onRendered.bind(me));
    }
    function hideQuestionNumber() {
        var me = this,
            $ROOT = me.$element;
        if($ROOT == null || $ROOT.length === 0){
            return;
        }
        $ROOT.find(SEL_MAIN).stop().delay(800).fadeOut();
    }
    function onRendered() {
        var me = this,
            $ROOT = me.$element;
        $ROOT.stop().fadeIn(500,function () {
			var rightNumbers = $ROOT.find(SEL_RIGHT_NUM).find('li');
                if (rightNumbers.length > 1) {
                    rightNumbers.eq(0).delay(100).animate({
                        marginTop : -rightNumbers.eq(0).height()
                    }, function () {
                        var leftNumbers = $ROOT.find(SEL_LEFT_NUM).find('li');
                        if (leftNumbers.length > 1) {
                            leftNumbers.eq(0).delay(100).animate({
                                marginTop : -leftNumbers.eq(0).height()
                            }, function () {
                                hideQuestionNumber.call(me);
                            });
                        } else {
                            hideQuestionNumber.call(me);
                        }
                    });
                }
        });
	}
    return Widget.extend({
		"sig/render": function onRender() {
			return render.call(this);
        },
		'hub/activity/step/render': function onQuestionNumberLoad(currentIndex, total) {
            if(!(total > 1)){
                return;
            }
            currentIndex++;
            var me = this;
            me._json = me._json || {};
            var data = me._json;
            data._total = total;
            data._total = data._total < 10 ? (data._total = STR_MASK + data._total):(data._total = data._total.toString());
            data._preIndex = currentIndex - 1;
            data._preIndex < 10 ? (data._preIndex = STR_MASK + data._preIndex) : (data._preIndex = data._preIndex.toString());
            currentIndex < 10 ? (data._curIndex = STR_MASK + currentIndex) : (data._curIndex = currentIndex.toString());
			return me.signal('render');
        }
    });
});


define('troopjs-requirejs/template!school-ui-activity/shared/rolling-number/rolling-number.html',[],function() { return function template(data) { var o = "<ul class=\"ets-ar-tp\">\r\n\t<li class=\"ets-ar-tp-left\">\r\n\t\t<ul><li class=\"ets-ar-num ets-ar-num-left\" data=\"0\" data-at-id=\"lbl-remaining-left\">0</li></ul>\r\n\t</li>\r\n\t<li class=\"ets-ar-tp-right\">\r\n\t\t<ul><li class=\"ets-ar-num ets-ar-num-right\" data=\"0\" data-at-id=\"lbl-remaining-right\">0</li></ul>\r\n\t</li>\r\n</ul>\r\n<span class=\"ets-ar-title\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"464921\" data-text-en=\"Answers Remaining\"></span>"; return o; }; });
define('school-ui-activity/shared/rolling-number/main',[
	'jquery',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	"template!./rolling-number.html"
], function ActivityBaseModule($, poly, when, Widget, tTemplate) {
	"use strict";

	// declaire variables
	var defaults = {
		length: 2,
		step: 1,
		max: 99,
		min: 0,
		type: "gray", // "gray" | "white"
		action: "set"
	};

	var CLS_AR_NUM = "ets-ar-num",
		CLS_AR_NUM_LEFT = "ets-ar-num-left",
		CLS_AR_NUM_RIGHT = "ets-ar-num-right";

	var SEL_AR_NUM_LEFT = "." + CLS_AR_NUM_LEFT,
		SEL_AR_NUM_RIGHT = "." + CLS_AR_NUM_RIGHT,
		SEL_AR_TIP_LEFT_UI = ".ets-ar-tp-left ul",
		SEL_AR_TIP_RIGHT_UI = ".ets-ar-tp-right ul";

	//init rolling for set action
	function initRolling() {
		var targetNum = this._targetNumber,
			me = this,
			$el = me.$element;
		//todo: need refactor to more generic
		$el.find(SEL_AR_TIP_LEFT_UI).html('<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_LEFT + '" data="' + Math.floor(targetNum / 10) + '">' + Math.floor(targetNum / 10) + '</li>');
		$el.find(SEL_AR_TIP_RIGHT_UI).html('<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_RIGHT + '" data="' + targetNum % 10 + '">' + targetNum % 10 + '</li>');

		$el.find(SEL_AR_NUM_LEFT).attr("data-at-id", "lbl-remaining-left");
		$el.find(SEL_AR_NUM_RIGHT).attr("data-at-id", "lbl-remaining-right");
	}

	//update rolling for sub,add,reset
	function updateRolling() {
		var currNum = this._currentNum,
			step = this._step,
			targetNum = this._targetNumber,
			currNumLeft = Math.floor(currNum / 10),
			targetNumLeft = Math.floor(targetNum / 10),
			targetNumRight = targetNum % 10,
			iNumRight = 0,
			numListLeft = '',
			numListRight = '',
			actValue = 0,
			aniLeftValue = 0,
			aniRightValue = 0,
			duration = 150,
			me = this,
			$el = me.$element;

		if (currNum < this._settings.min) return;

		var i, j;
		if (targetNum >= currNum) {
			actValue = -24;
			if (targetNumLeft !== currNumLeft) {
				for (j = targetNumLeft; j > currNumLeft; j--) {
					numListLeft += '<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_LEFT + '" data="' + j + '">' + j + '</li>';
				}
			}
			for (i = targetNum; i > currNum; i--) {
				iNumRight = i % 10;
				numListRight += '<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_RIGHT + '" data="' + iNumRight + '">' + iNumRight + '</li>';
			}
			if (numListLeft !== "") {
				$(numListLeft).insertBefore(SEL_AR_NUM_LEFT);
				$el.find(SEL_AR_TIP_LEFT_UI).css('margin-top', actValue * (targetNumLeft - currNumLeft) + 'px');
			}
			$(numListRight).insertBefore(SEL_AR_NUM_RIGHT);
			$el.find(SEL_AR_TIP_RIGHT_UI).css('margin-top', actValue * step + 'px');
			aniRightValue = aniLeftValue = '0px';
		} else {
			actValue = 24;

			if (targetNumLeft !== currNumLeft) {
				for (j = currNumLeft - 1; j >= targetNumLeft; j--) {
					numListLeft += '<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_LEFT + '" data="' + j + '">' + j + '</li>';
				}
			}

			for (i = currNum - 1; i >= targetNum; i--) {
				iNumRight = i % 10;
				numListRight += '<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_RIGHT + '" data="' + iNumRight + '">' + iNumRight + '</li>';
			}
			if (numListLeft !== "") {
				$(numListLeft).insertAfter(SEL_AR_NUM_LEFT);
			}
			$(numListRight).insertAfter(SEL_AR_NUM_RIGHT);
			aniLeftValue = -(currNumLeft - targetNumLeft) * actValue + 'px';
			aniRightValue = -step * actValue + 'px';
		}

		$el.find(SEL_AR_NUM_LEFT).attr("data-at-id", "lbl-remaining-left");
		$el.find(SEL_AR_NUM_RIGHT).attr("data-at-id", "lbl-remaining-right");

		//left num and right num animation
		var numLSwitch = function () {
			if (!numListLeft) {
				return when.resolve();
			}

			var $elToRemove = $el.find(SEL_AR_NUM_LEFT).not($el.find(SEL_AR_NUM_LEFT + "[data='" + targetNumLeft + "']").first());
			return when.promise(function (resolve) {
				$el.find(SEL_AR_TIP_LEFT_UI).animate({
					'margin-top': aniLeftValue
				}, duration, function () {
					$elToRemove.remove();
					$elToRemove = null;
					$el.find(SEL_AR_TIP_LEFT_UI).css('margin-left', '0px');
					$el.find(SEL_AR_TIP_LEFT_UI).css('margin-top', '0px');
					resolve();
				});
			});
		};

		var numRSwitch = function () {
			var $elToRemove = $el.find(SEL_AR_NUM_RIGHT).not($el.find(SEL_AR_NUM_RIGHT + "[data='" + targetNumRight + "']").first());
			return when.promise(function (resolve) {
				$el.find(SEL_AR_TIP_RIGHT_UI).animate({
					'margin-top': aniRightValue
				}, duration, function () {
					$elToRemove.remove();
					$elToRemove = null;
					$el.find(SEL_AR_TIP_RIGHT_UI).css('margin-top', '0px');
					resolve();
				});
			});
		};

		return when.all([numLSwitch(), numRSwitch()]);
	}

	return Widget.extend(function (el, module, settings) {
		this._settings = $.extend({}, defaults, settings);
		this._targetNumber = this._settings.min;
		this._step = this._settings.step;
		this._currentNum = this._targetNumber;
		this._settings.type === "white" && el.addClass("ets-ar-white");

	}, {
		"sig/initialize": function onStart() {
			var me = this;
			return me.html(tTemplate, me._settings)
				.tap(initRolling.bind(this));
		},
		"dom/rolling-number/switch-answers-num": function ($event, options) {
			var promise = null;
			var sets = this._settings;
			var action = options.action;
			var step = options.step;
			this._step = step;

			// 1. do operation based on 'key', sub,add,set,reset
			switch (action.toLowerCase()) {
				case "add":
					if (this._targetNumber + step <= sets.max) {
						this._targetNumber += step;
						promise = updateRolling.call(this);
						this._currentNum = this._targetNumber;
					}
					break;
				case "sub":
					if (this._targetNumber - step >= sets.min) {
						this._targetNumber -= step;
						promise = updateRolling.call(this);
						this._currentNum = this._targetNumber;
					}
					break;
				case "set":
					if (step >= sets.min && step <= sets.max) {
						this._targetNumber = step;
						promise = updateRolling.call(this);
						this._currentNum = this._targetNumber;
					}
					break;
				case "reset":
					this._targetNumber += step;
					this._currentNum = this._targetNumber;
					initRolling.call(this);
					break;
				default:
					break;
			}

			return promise || when.resolve();
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/shared/summary/summary.html',[],function() { return function template(data) { var o = "";
	var blurb = function(id,en){
	    var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";
	    return res;
	};
o += "\n<div class=\"ets-act-summary\">\n\t<div class=\"ets-act-summary-main ets-cf\">\n\t\t<div class=\"ets-act-summary-main-correct\">\n\t\t\t<div class=\"ets-act-summary-num-correct\">" +data.correctNum+ "</div>\n\t\t\t<br>\n\t\t\t<h4 class=\"ets-correct\"><span " +blurb(480845,"correct answers")+ "></span></h4>\n\t\t</div>\n\t\t<div class=\"ets-act-summary-main-skipped\">\n\t\t\t<div class=\"ets-act-summary-num-skipped\">" +data.skippedNum+ "</div>\n\t\t\t<br>\n\t\t\t<h4 class=\"ets-skipped\"><span " +blurb(480846,"skipped answers")+ "></span></h4>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-act-summary-result\" >\n\t\t";if (data.passed) {o += "\n\t\t<h2><span " +blurb(480844,"Result")+ "></span>: <span class=\"ets-pass\" data-at-id='lbl-result-state-message' " +blurb(461315,"Passed")+ "></span></h2>\n\t\t";} else {o += "\n\t\t<h2><span " +blurb(480844,"Result")+ "></span>: <span class=\"ets-fail\" data-at-id='lbl-result-state-message' " +blurb(461316,"Not passed")+ "></span></h2>\n\t\t<p><span data-at-id='lbl-result-need-passed-message' " +blurb(465093,"you need")+ " data-values='{\"number\":" + data.passNum+ "}' ></span></p>\n\t\t";}o += "\n\t</div>\n</div>"; return o; }; });
// # Activity summary

define('school-ui-activity/shared/summary/main',['jquery', 'compose', 'underscore',
    'troopjs-ef/component/widget',
    'template!./summary.html'
], function summaryModule($, Compose, _, Widget, tTemplate) {
    "use strict";

    function Ctor(el, module, settings){
        this._content = settings;
    }

    function render(){
        var me = this;

        if (!me.$element){
            return;
        }

        return me.html(tTemplate, me._content);
    }

    var methods = {
        "sig/start": function onStart() {
            return render.call(this);
        }
    };

    return Widget.extend(Ctor, methods);
});
/**
 * value change event for input or textarea,still has bug on IE9, can't detect delete with contextmenu immediately
 */
define('school-ui-activity/shared/textchange/main',[
	'jquery',
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check"
], function ($, Widget, browserCheck) {
	"use strict";

	var IS_IE = browserCheck.browser === "msie";
	var BROWSER_VERSION = parseInt(browserCheck.version, 10);

	var EVT_TXTCHANGE = (function () {
			if (!IS_IE) {
				return "input";
			} else {
				if (BROWSER_VERSION < 9) {
					return "propertychange keyup";
				} else if (BROWSER_VERSION === 9) {
					/**
					 * for ie9, propertychange and input exist bugs.
					 * propertychange can only work with attachEvent
					 * input can't detect value change set by js
					 * propertychange and input can't detect:
					 * 1.backspace with keyboard    : use keydown and keyCode to detect
					 * 2.delete with keyboard       : use keydown and keyCode to detect
					 * 3.delete with contextmenu    : disable contextmenu on input element
					 * 4.cut                        : use cut to detect
					 * 5.ctrl+Z/ctrl+Y              : use keydown and keyCode to detect
					 * 6.drag out                   : use change to detect
					 * 7.will trigger many times with multiple lines' paste : can't resolve
					 */
					return "keydown cut change";
				} else {
					return "input propertychange";
				}
			}
		})(),
		EVT_CUSTOMER_TEXT_CHANGE = 'EFTextChange',
		UNDEFINED;

	/**
	 * Check event whether need to trigger textchange event
	 */
	function filterEvent(e) {
		var orge = e.originalEvent;
		if (orge === UNDEFINED) {
			return;
		}
		if (IS_IE && BROWSER_VERSION === 9) {
			/** For keydown event, only need to trigger value change when:
			 * DELETE/BACKSPACE
			 * CTRL+Z/CTRL+Y
			 **/
			if (orge.type === 'keydown'
				&& !(orge.keyCode == 0x2E || orge.keyCode == 0x8)
				&& !(orge.ctrlKey && (orge.keyCode == 90 || orge.keyCode == 89))) {
				return;
			}
		}

		//Filter not value attribute change of propertychange
		if (orge.propertyName && orge.propertyName != 'value') {
			return;
		}
		return true;
	}

	function triggerChangeEvent($DOM) {
		//Use setTimeout to get real value, some events like paste|cut|ctrl+z|ctrl+y,can't get real value immediately
		setTimeout(function () {
			$DOM.trigger(EVT_CUSTOMER_TEXT_CHANGE);
		}, 0);
	}

	return Widget.extend({
		"sig/initialize": function onStart() {
			var me = this,
				$ROOT = me.$element,
				domEle = $ROOT.get(0);
			if (IS_IE && BROWSER_VERSION === 9) {
				domEle.attachEvent && domEle.attachEvent("oncontextmenu", function () {
					return false;
				}) && domEle.attachEvent("onpropertychange", function (e) {
					filterEvent($.Event(e)) && triggerChangeEvent($ROOT);
				});
			}
			$ROOT.bind(EVT_TXTCHANGE, function (e) {
				filterEvent(e) && triggerChangeEvent($ROOT);
			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity/shared/tooltip/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-tooltip-content\">\n</div>\n<div class=\"ets-tooltip-footer\"></div>"; return o; }; });
define('school-ui-activity/shared/tooltip/main',[
	'jquery',
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check",
	'template!./main.html'
], function Tooltip($, Widget, browserCheck, tTemplate) {
	'use strict';

	var $ELEMENT = '$element';

	var SEL_CONTENT = '.ets-tooltip-content';

	var CLS_IE8 = 'ets-tooltip-ie8';

	function render() {
		var me = this;
		return me.html(tTemplate)
			.then(function () {
				if (me._content.length) {
					me[$ELEMENT].find(SEL_CONTENT).prepend($(me._content));
				}
			});
	}

	function onRender() {
		var me = this;

		if (browserCheck.browser === "msie") {
			if (parseInt(browserCheck.version, 10) <= 8) {
				me[$ELEMENT].addClass(CLS_IE8);
			}
		}
	}

	return Widget.extend(function Ctor() {
		var me = this;
		me._content = $.trim(me[$ELEMENT].html());
	}, {
		'sig/initialize': function onInitialize() {
			return render.call(this);
		},
		'sig/start': function onStart() {
			onRender.call(this);
		}
	});
});


//# sourceMappingURL=app-built.js.map
