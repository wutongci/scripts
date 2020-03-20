define([
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
