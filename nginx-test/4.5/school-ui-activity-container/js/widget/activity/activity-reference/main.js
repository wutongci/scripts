define([
	"jquery",
	"troopjs-ef/component/widget",
	"when",
	"school-ui-shared/utils/language-fixing",
	"markdownjs",
	"template!./reference.html"
], function ReferenceModule($, Widget, when, languageFixing, md, tReference) {
	"use strict";
	var $ELEMENT = "$element";
	var SEL_INTRO_TITLE = ".ets-act-intro .ets-act-intro-title";
	var SEL_INTRO_DESC = ".ets-act-intro .ets-act-intro-desc";
	var CLS_NONE = "ets-none";

	var PROP_CULTURE_CODE = "cultureCode";
	var PROP_ACT = "_activity";

	function render() {
		var me = this;

		if (!me[PROP_ACT] || !me[PROP_CULTURE_CODE]) {
			return;
		}

		var $title = me[$ELEMENT].find(SEL_INTRO_TITLE);
		var $desc = me[$ELEMENT].find(SEL_INTRO_DESC);
		var reference = me[PROP_ACT] &&
			me[PROP_ACT].activityContent &&
			me[PROP_ACT].activityContent.references;

		when(($title.length && $desc.length) || me.html(tReference)).then(function () {

			$title = me[$ELEMENT].find(SEL_INTRO_TITLE);
			$desc = me[$ELEMENT].find(SEL_INTRO_DESC);

			if (reference) {
				var titleText = reference.title && reference.title.length > 0
					? md.toHTML(reference.title)
					: "";

				//Prepend standard instruction if exist
				if (reference.standardInstruction && reference.standardInstruction.length > 0) {
					titleText += " " + md.toHTML(reference.standardInstruction);
				}

				languageFixing($title, titleText, me[PROP_CULTURE_CODE]);
				$title.html(titleText);

				var descText = reference.desc && reference.desc.length > 0
					? md.toHTML(reference.desc)
					: "";

				languageFixing($desc, descText, me[PROP_CULTURE_CODE]);
				$desc.html(descText);

				me[$ELEMENT].removeClass(CLS_NONE);
			} else {
				$title.html("");
				$desc.html("");
			}
		});
	}

	return Widget.extend({
		"hub:memory/load/activity": function onLoadRef(activity) {
			var me = this;
			activity && (me[PROP_ACT] = activity);
			render.call(me);
		},
		"hub:memory/context": function (context) {
			var me = this;
			context && context[PROP_CULTURE_CODE] && (me[PROP_CULTURE_CODE] = context[PROP_CULTURE_CODE]);
			render.call(me);
		}
	});
});
