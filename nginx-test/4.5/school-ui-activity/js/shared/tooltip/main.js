define([
	'jquery',
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check",
	'template!./main.html'
], function Tooltip($, Widget, browserCheck, tTemplate) {
	'use strict';

	var $ELEMENT = '$element';

	var SEL_CONTENT = '.ets-tooltip-content';

	var CLS_IE8 = 'ets-tooltip-ie8';

	function render() {
		var me = this;
		return me.html(tTemplate)
			.then(function () {
				if (me._content.length) {
					me[$ELEMENT].find(SEL_CONTENT).prepend($(me._content));
				}
			});
	}

	function onRender() {
		var me = this;

		if (browserCheck.browser === "msie") {
			if (parseInt(browserCheck.version, 10) <= 8) {
				me[$ELEMENT].addClass(CLS_IE8);
			}
		}
	}

	return Widget.extend(function Ctor() {
		var me = this;
		me._content = $.trim(me[$ELEMENT].html());
	}, {
		'sig/initialize': function onInitialize() {
			return render.call(this);
		},
		'sig/start': function onStart() {
			onRender.call(this);
		}
	});
});
