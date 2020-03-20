define([
	'jquery',
	'poly',
	'troopjs-ef/component/widget',
	"template!./main.html"
], function mpaMain($, poly, Widget, tTs) {
	"use strict";

	var SEL_CONTAINER = '.ets-act-wgt-ts-ctn',
		SEL_TOGGLE = '.ets-act-wgt-ts',
		SEL_KNOB = '.ets-act-wgt-ts-kb',
		NUM_TOGGLE_TIME = 250,
		NUM_TOGGLE = -78,
		NUM_KNOB = 44;

	function render() {
		var me = this;
		// Render widget
		return me.html(tTs)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this,
			$ROOT = me.$element;
		$ROOT.find(SEL_CONTAINER).delegate(SEL_TOGGLE, 'click', toggleSlideClick.bind(me));
	}

	/**
	 * toggle slide button click handler
	 */
	function toggleSlideClick() {
		var me = this,
			$ROOT = me.$element,
			$ele = $ROOT.find(SEL_TOGGLE),
			show = $ele.data('show'),
			$knob = $ele.find(SEL_KNOB);
		if ($knob.is(':animated')) {
			return;
		}
		$knob.animate({
			left: (show ? NUM_KNOB : 0)
		}, NUM_TOGGLE_TIME);
		$ele.find('ul').animate({
			marginLeft: (show ? 0 : NUM_TOGGLE)
		}, NUM_TOGGLE_TIME, function () {
			$ele.data('show', !show);
			me.publish('activity/correctanswer/show', show);
		});
	}

	/**
	 * Show or hide
	 **/
	function toggleSlideShow(setting) {
		var me = this,
			$ROOT = me.$element,
			$container = $ROOT.find(SEL_CONTAINER);
		if (setting.show) {
			if (!($container.is(':visible') == 'true')) {
				setting.style && $container.css(setting.style);
				$container.fadeIn();
			}
		} else {
			$container.fadeOut();
		}
	}

	return Widget.extend({
		"sig/initialize": function onInitialize() {
			return render.call(this);
		},
		"hub/activity/widget/toggleslide/toggle": function onToggle() {
			toggleSlideClick.call(this);
		},
		"hub/activity/widget/toggleslide/show": function onUIShow(setting) {
			toggleSlideShow.call(this, setting);
		}
	});
});
