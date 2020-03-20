/**
 * value change event for input or textarea,still has bug on IE9, can't detect delete with contextmenu immediately
 */
define([
	'jquery',
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check"
], function ($, Widget, browserCheck) {
	"use strict";

	var IS_IE = browserCheck.browser === "msie";
	var BROWSER_VERSION = parseInt(browserCheck.version, 10);

	var EVT_TXTCHANGE = (function () {
			if (!IS_IE) {
				return "input";
			} else {
				if (BROWSER_VERSION < 9) {
					return "propertychange keyup";
				} else if (BROWSER_VERSION === 9) {
					/**
					 * for ie9, propertychange and input exist bugs.
					 * propertychange can only work with attachEvent
					 * input can't detect value change set by js
					 * propertychange and input can't detect:
					 * 1.backspace with keyboard    : use keydown and keyCode to detect
					 * 2.delete with keyboard       : use keydown and keyCode to detect
					 * 3.delete with contextmenu    : disable contextmenu on input element
					 * 4.cut                        : use cut to detect
					 * 5.ctrl+Z/ctrl+Y              : use keydown and keyCode to detect
					 * 6.drag out                   : use change to detect
					 * 7.will trigger many times with multiple lines' paste : can't resolve
					 */
					return "keydown cut change";
				} else {
					return "input propertychange";
				}
			}
		})(),
		EVT_CUSTOMER_TEXT_CHANGE = 'EFTextChange',
		UNDEFINED;

	/**
	 * Check event whether need to trigger textchange event
	 */
	function filterEvent(e) {
		var orge = e.originalEvent;
		if (orge === UNDEFINED) {
			return;
		}
		if (IS_IE && BROWSER_VERSION === 9) {
			/** For keydown event, only need to trigger value change when:
			 * DELETE/BACKSPACE
			 * CTRL+Z/CTRL+Y
			 **/
			if (orge.type === 'keydown'
				&& !(orge.keyCode == 0x2E || orge.keyCode == 0x8)
				&& !(orge.ctrlKey && (orge.keyCode == 90 || orge.keyCode == 89))) {
				return;
			}
		}

		//Filter not value attribute change of propertychange
		if (orge.propertyName && orge.propertyName != 'value') {
			return;
		}
		return true;
	}

	function triggerChangeEvent($DOM) {
		//Use setTimeout to get real value, some events like paste|cut|ctrl+z|ctrl+y,can't get real value immediately
		setTimeout(function () {
			$DOM.trigger(EVT_CUSTOMER_TEXT_CHANGE);
		}, 0);
	}

	return Widget.extend({
		"sig/initialize": function onStart() {
			var me = this,
				$ROOT = me.$element,
				domEle = $ROOT.get(0);
			if (IS_IE && BROWSER_VERSION === 9) {
				domEle.attachEvent && domEle.attachEvent("oncontextmenu", function () {
					return false;
				}) && domEle.attachEvent("onpropertychange", function (e) {
					filterEvent($.Event(e)) && triggerChangeEvent($ROOT);
				});
			}
			$ROOT.bind(EVT_TXTCHANGE, function (e) {
				filterEvent(e) && triggerChangeEvent($ROOT);
			});
		}
	});
});
