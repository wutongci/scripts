define([
	'jquery',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	"template!./rolling-number.html"
], function ActivityBaseModule($, poly, when, Widget, tTemplate) {
	"use strict";

	// declaire variables
	var defaults = {
		length: 2,
		step: 1,
		max: 99,
		min: 0,
		type: "gray", // "gray" | "white"
		action: "set"
	};

	var CLS_AR_NUM = "ets-ar-num",
		CLS_AR_NUM_LEFT = "ets-ar-num-left",
		CLS_AR_NUM_RIGHT = "ets-ar-num-right";

	var SEL_AR_NUM_LEFT = "." + CLS_AR_NUM_LEFT,
		SEL_AR_NUM_RIGHT = "." + CLS_AR_NUM_RIGHT,
		SEL_AR_TIP_LEFT_UI = ".ets-ar-tp-left ul",
		SEL_AR_TIP_RIGHT_UI = ".ets-ar-tp-right ul";

	//init rolling for set action
	function initRolling() {
		var targetNum = this._targetNumber,
			me = this,
			$el = me.$element;
		//todo: need refactor to more generic
		$el.find(SEL_AR_TIP_LEFT_UI).html('<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_LEFT + '" data="' + Math.floor(targetNum / 10) + '">' + Math.floor(targetNum / 10) + '</li>');
		$el.find(SEL_AR_TIP_RIGHT_UI).html('<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_RIGHT + '" data="' + targetNum % 10 + '">' + targetNum % 10 + '</li>');

		$el.find(SEL_AR_NUM_LEFT).attr("data-at-id", "lbl-remaining-left");
		$el.find(SEL_AR_NUM_RIGHT).attr("data-at-id", "lbl-remaining-right");
	}

	//update rolling for sub,add,reset
	function updateRolling() {
		var currNum = this._currentNum,
			step = this._step,
			targetNum = this._targetNumber,
			currNumLeft = Math.floor(currNum / 10),
			targetNumLeft = Math.floor(targetNum / 10),
			targetNumRight = targetNum % 10,
			iNumRight = 0,
			numListLeft = '',
			numListRight = '',
			actValue = 0,
			aniLeftValue = 0,
			aniRightValue = 0,
			duration = 150,
			me = this,
			$el = me.$element;

		if (currNum < this._settings.min) return;

		var i, j;
		if (targetNum >= currNum) {
			actValue = -24;
			if (targetNumLeft !== currNumLeft) {
				for (j = targetNumLeft; j > currNumLeft; j--) {
					numListLeft += '<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_LEFT + '" data="' + j + '">' + j + '</li>';
				}
			}
			for (i = targetNum; i > currNum; i--) {
				iNumRight = i % 10;
				numListRight += '<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_RIGHT + '" data="' + iNumRight + '">' + iNumRight + '</li>';
			}
			if (numListLeft !== "") {
				$(numListLeft).insertBefore(SEL_AR_NUM_LEFT);
				$el.find(SEL_AR_TIP_LEFT_UI).css('margin-top', actValue * (targetNumLeft - currNumLeft) + 'px');
			}
			$(numListRight).insertBefore(SEL_AR_NUM_RIGHT);
			$el.find(SEL_AR_TIP_RIGHT_UI).css('margin-top', actValue * step + 'px');
			aniRightValue = aniLeftValue = '0px';
		} else {
			actValue = 24;

			if (targetNumLeft !== currNumLeft) {
				for (j = currNumLeft - 1; j >= targetNumLeft; j--) {
					numListLeft += '<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_LEFT + '" data="' + j + '">' + j + '</li>';
				}
			}

			for (i = currNum - 1; i >= targetNum; i--) {
				iNumRight = i % 10;
				numListRight += '<li class="' + CLS_AR_NUM + ' ' + CLS_AR_NUM_RIGHT + '" data="' + iNumRight + '">' + iNumRight + '</li>';
			}
			if (numListLeft !== "") {
				$(numListLeft).insertAfter(SEL_AR_NUM_LEFT);
			}
			$(numListRight).insertAfter(SEL_AR_NUM_RIGHT);
			aniLeftValue = -(currNumLeft - targetNumLeft) * actValue + 'px';
			aniRightValue = -step * actValue + 'px';
		}

		$el.find(SEL_AR_NUM_LEFT).attr("data-at-id", "lbl-remaining-left");
		$el.find(SEL_AR_NUM_RIGHT).attr("data-at-id", "lbl-remaining-right");

		//left num and right num animation
		var numLSwitch = function () {
			if (!numListLeft) {
				return when.resolve();
			}

			var $elToRemove = $el.find(SEL_AR_NUM_LEFT).not($el.find(SEL_AR_NUM_LEFT + "[data='" + targetNumLeft + "']").first());
			return when.promise(function (resolve) {
				$el.find(SEL_AR_TIP_LEFT_UI).animate({
					'margin-top': aniLeftValue
				}, duration, function () {
					$elToRemove.remove();
					$elToRemove = null;
					$el.find(SEL_AR_TIP_LEFT_UI).css('margin-left', '0px');
					$el.find(SEL_AR_TIP_LEFT_UI).css('margin-top', '0px');
					resolve();
				});
			});
		};

		var numRSwitch = function () {
			var $elToRemove = $el.find(SEL_AR_NUM_RIGHT).not($el.find(SEL_AR_NUM_RIGHT + "[data='" + targetNumRight + "']").first());
			return when.promise(function (resolve) {
				$el.find(SEL_AR_TIP_RIGHT_UI).animate({
					'margin-top': aniRightValue
				}, duration, function () {
					$elToRemove.remove();
					$elToRemove = null;
					$el.find(SEL_AR_TIP_RIGHT_UI).css('margin-top', '0px');
					resolve();
				});
			});
		};

		return when.all([numLSwitch(), numRSwitch()]);
	}

	return Widget.extend(function (el, module, settings) {
		this._settings = $.extend({}, defaults, settings);
		this._targetNumber = this._settings.min;
		this._step = this._settings.step;
		this._currentNum = this._targetNumber;
		this._settings.type === "white" && el.addClass("ets-ar-white");

	}, {
		"sig/initialize": function onStart() {
			var me = this;
			return me.html(tTemplate, me._settings)
				.tap(initRolling.bind(this));
		},
		"dom/rolling-number/switch-answers-num": function ($event, options) {
			var promise = null;
			var sets = this._settings;
			var action = options.action;
			var step = options.step;
			this._step = step;

			// 1. do operation based on 'key', sub,add,set,reset
			switch (action.toLowerCase()) {
				case "add":
					if (this._targetNumber + step <= sets.max) {
						this._targetNumber += step;
						promise = updateRolling.call(this);
						this._currentNum = this._targetNumber;
					}
					break;
				case "sub":
					if (this._targetNumber - step >= sets.min) {
						this._targetNumber -= step;
						promise = updateRolling.call(this);
						this._currentNum = this._targetNumber;
					}
					break;
				case "set":
					if (step >= sets.min && step <= sets.max) {
						this._targetNumber = step;
						promise = updateRolling.call(this);
						this._currentNum = this._targetNumber;
					}
					break;
				case "reset":
					this._targetNumber += step;
					this._currentNum = this._targetNumber;
					initRolling.call(this);
					break;
				default:
					break;
			}

			return promise || when.resolve();
		}
	});
});
