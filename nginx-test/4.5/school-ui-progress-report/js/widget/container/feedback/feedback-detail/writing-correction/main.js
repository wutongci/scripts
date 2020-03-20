define([
	"jquery",
	"when",
	"poly",
	"jquery.gudstrap",
	"troopjs-ef/component/widget"
], function ($, when, poly, GUD, Widget) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_NONE = "ets-none";

	function getCorrectionTags() {
		var me = this;

		return me.query("writing_correction_tag!current").spread(function (tagData) {
			var tags = {};
			tagData.items.forEach(function (item) {
				tags[item.code] = item;
			});
			return tags;
		});
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;

			var correction = me[$ELEMENT].data("correction");
			correction = $.trim(correction).replace(/\s+/g, " ");
			if (!correction) {
				me[$ELEMENT].addClass(CLS_NONE);
				return when.resolve();
			}

			return getCorrectionTags.call(me).then(function (correctionTags) {
				var replaceElement = function (correction, oldTag, newTag) {
					correction = correction.replace(new RegExp("<" + oldTag + "\\b", "ig"), "<" + newTag + " data-element-type='" + oldTag + "'");
					correction = correction.replace(new RegExp("<\\/" + oldTag + ">", "ig"), "</" + newTag + ">");
					return correction;
				};

				correction = replaceElement(correction, "paragraph", "p");
				correction = replaceElement(correction, "text", "span");
				correction = replaceElement(correction, "input", "span");
				correction = replaceElement(correction, "b", "span");
				correction = replaceElement(correction, "i", "span");
				correction = replaceElement(correction, "c", "span");
				correction = replaceElement(correction, "code", "span");

				var $correction = $("<div>" + correction + "</div>");
				$correction.find("[data-element-type='paragraph']").removeClass().addClass("ets-pr-fb-correction-paragraph");
				$correction.find("[data-element-type='text']").removeClass().addClass("ets-pr-fb-correction-text");
				$correction.find("[data-element-type='input']").removeClass().addClass("ets-pr-fb-correction-input");
				$correction.find("[data-element-type='i']").removeClass().addClass("ets-pr-fb-correction-i");
				$correction.find("[data-element-type='b']").removeClass().addClass("ets-pr-fb-correction-b");
				$correction.find("[data-element-type='c']").removeClass().addClass("ets-pr-fb-correction-c");
				$correction.find("[data-element-type='code']").removeClass().addClass("ets-pr-fb-correction-code").each(function (index, element) {
					var $code = $(element);
					var correctionTagCode = $code.attr("a");
					var correctionText = $code.attr("c");

					$code.addClass("ets-pr-fb-correction-action-" + correctionTagCode.toLowerCase());
					if (!$code.text()) {
						$code.addClass("ets-pr-fb-correction-empty");
					}

					var correctionTagName = correctionTags[correctionTagCode] && correctionTags[correctionTagCode].tagName || correctionTagCode;
					var tooltipHtml = correctionTagName + (correctionText ? ": <span>" + correctionText + "</span>" : "");
					$code.attr("data-title", tooltipHtml);
				});

				return me[$ELEMENT].append($correction.contents()).weave().then(function () {
					me[$ELEMENT].find(".ets-pr-fb-correction-code").tooltip({
						placement: "bottom",
						html: true
					});
				});
			});
		}
	});
});
