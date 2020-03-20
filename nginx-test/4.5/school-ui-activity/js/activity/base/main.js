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
define([
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
