define([
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
