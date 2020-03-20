/* vector images support for ie8 & modern browsers
 * use in this way : "<div data-weave="school-ui-progress-report/utils/vector("filename", "width", "height")"></div>"
 * exp : "<div data-weave="school-ui-progress-report/utils/vector(check, 50, 50)"></div>"
 */

define([
	"require",
	"when",
	"poly",
	"school-ui-shared/utils/browser-check",
	"troopjs-ef/component/widget"
], function (localRequire, when, poly, browserCheck, Widget) {
	"use strict";

	var $ELEMENT = "$element";

	var PREFIX_TEMPLATE = "template!";
	var SUFFIX_SVG = "svg";
	var SUFFIX_VML = "vml";

	var REG_SVG_WIDTH = /(\<svg[^\<]*width=\")(\S*)(\"[^\<]*\>)/gmi;
	var REG_SVG_HEIGHT = /(\<svg[^\<]*height=\")(\S*)(\"[^\<]*\>)/gmi;
	var REG_VML_WIDTH = /<v[^>]*width[^>]?:[^>]?([\d]+)[^>]*>/mi;
	var REG_VML_HEIGHT = /<v[^>]*height[^>]?:[^>]?([\d]+)[^>]*>/mi;

	//for ie8 we use vml to display vector image
	var VECTOR_TYPE = browserCheck.browser === "msie" &&
	parseInt(browserCheck.version) === 8 ? SUFFIX_VML : SUFFIX_SVG;

	return Widget.extend(function (path, $element, vector, width, height) {
		var me = this;

		me.width = width;
		me.height = height;
		me.vector = vector;

		//for optimize vml performance in ie8,
		//we hide element before append the vml, and display inline-block after appending
		me[$ELEMENT].css("display", "none");
	}, {
		"sig/start": function () {
			var me = this;

			if (me.width && me.height && me.vector) {
				return when.promise(function (resolve) {
					// use template plugin to load vector,
					// and then we can pack them together in grunt
					localRequire(
						[PREFIX_TEMPLATE + me.vector + "." + VECTOR_TYPE],
						resolve
					);
				}).then(me.render.bind(me));
			}

			return when.resolve();
		},
		"render": function (template) {
			var me = this;
			var html = template();
			var width;
			var height;

			if (VECTOR_TYPE === SUFFIX_VML) {
				width = html.match(REG_VML_WIDTH);
				height = html.match(REG_VML_HEIGHT);
				if (width[1] && height[1]) {
					//can't use a top width and height in vml to set the size, so we use zoom here
					//don't use jquery function here, because ignore zoom will be ignored...
					html = "<div style='zoom:" + Math.min(parseInt(me.height, 10) / height[1], parseInt(me.width, 10) / width[1]) + "'>" + html + "</div>";
				}
			} else {
				//replace height and width for svg element
				html = html.replace(
					REG_SVG_WIDTH,
					function (match, $1, $2, $3) {
						return $1 + me.width + "px" + $3;
					});
				html = html.replace(
					REG_SVG_HEIGHT,
					function (match, $1, $2, $3) {
						return $1 + me.height + "px" + $3;
					});
			}
			me[$ELEMENT].html(html);
			//show and set the width and height
			me[$ELEMENT].css({
				"display": "inline-block",
				"width": me.width,
				"height": me.height,
				"line-height": 0,
				"vertical-align": "middle",
				"overflow": "hidden"
			});
		}
	});
});
