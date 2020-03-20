define([
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
