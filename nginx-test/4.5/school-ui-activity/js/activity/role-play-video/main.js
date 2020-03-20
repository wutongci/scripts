define([
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
