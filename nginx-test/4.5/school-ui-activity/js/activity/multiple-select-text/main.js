define([
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
