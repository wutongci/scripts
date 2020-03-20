define([
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
