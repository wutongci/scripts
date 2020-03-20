define([
	'jquery',
	'when',
	'troopjs-ef/component/widget'
], function ActivityBaseModule($, when, Widget) {
	"use strict";

	var $ELEMENT = '$element';

	var WRAPPER = "<span class='ets-checkbox'></span>";

	var SEL_CHECKBOX = '.ets-checkbox';
	var SEL_INPUT = 'input[type="checkbox"]';
	var CLS_CHECKED = 'ets-checkbox-checked';

	function toggleChecked() {
		var me = this;

		if (me.$input.prop('checked')) {
			me.$wrapper.addClass(CLS_CHECKED);
		} else {
			me.$wrapper.removeClass(CLS_CHECKED);
		}

	}

	function render() {
		var me = this;

		if (!me[$ELEMENT].find(SEL_INPUT).length) {
			return when.reject(new Error("No found checkbox element"));
		}

		me[$ELEMENT].find(SEL_INPUT).wrap();
		me.$input = me[$ELEMENT].find(SEL_INPUT);

		me.$input.wrap(WRAPPER);

		me.$wrapper = me[$ELEMENT].find(SEL_CHECKBOX);

		return when.resolve();
	}

	return Widget.extend({
		'sig/initialize': function () {
			return render.call(this);
		},
		'sig/start': function () {
			var me = this;
			toggleChecked.call(me);
		},
		'dom/mouseenter': function () {
			var me = this;
			me.$wrapper.addClass('ets-checkbox-hover');
		},
		'dom/mouseleave': function () {
			var me = this;
			me.$wrapper.removeClass('ets-checkbox-hover');
		},
		'dom/click': function () {
			var me = this;
			me.$input.prop('checked', !me.$input.prop('checked'));
			toggleChecked.call(me);
		}
	});
});
