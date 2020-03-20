define([
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/language-fixing",
	"template!./step-title.html"
], function (Widget, languageFixing, tStepTitle) {
	"use strict";

	var $ELEMENT = "$element";
	var PROP_CULTURE_CODE = "cultureCode";
	var PROP_DATA = "_data";

	function render() {
		var me = this;

		if (!me[PROP_DATA] || !me[PROP_CULTURE_CODE]) {
			return;
		}

		languageFixing(me[$ELEMENT], me[PROP_DATA], me[PROP_CULTURE_CODE]);

		me.html(tStepTitle, me[PROP_DATA]);
	}

	return Widget.extend({
		"hub:memory/load/step": function onLoadStep(step) {
			var me = this;
			step && (me[PROP_DATA] = step.stepName);
			render.call(me);
		},
		"hub:memory/context": function (context) {
			var me = this;
			context && context[PROP_CULTURE_CODE] && (me[PROP_CULTURE_CODE] = context[PROP_CULTURE_CODE]);
			render.call(me);
		}
	});
});
