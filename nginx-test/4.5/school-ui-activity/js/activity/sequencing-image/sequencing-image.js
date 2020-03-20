// # Task Module
define([
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./sequencing-image.html'
], function ($, ui$, $uiTouchPunch, Widget, Interaction, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_DROP_AREA = ".ets-act-sqi-droparea",
		SEL_ORIGIN_AREA = ".ets-act-sqi-originarea",
		SEL_ACTIVITY_BODY = ".ets-act-bd",
		SEL_DROPPABLE = ".ets-act-sqi-droppable",
		SEL_ITEM = ".ets-act-sqi-item",
		SEL_ITEM_CORRECT = ".ets-correct",
		SEL_ITEM_INCORRECT = ".ets-incorrect",
		SEL_ACTIVE = ".ets-active",
		SEL_ORIGIN = ".ets-act-sqi-origin",
		CLS_CORRECT = "ets-correct",
		CLS_INCORRECT = "ets-incorrect",
		CLS_HOVER = "ets-hover",
		CLS_DROPPED = "ets-dropped",
		CLS_ACTIVE = "ets-active",
		FEEDBACK_DELAY = 1500;

	function Ctor() {

	}

	// # Render

	function render() {
		var me = this;
		var data = this._json;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		return this.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * 1. Enable droppable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this;

		//Enable droppable
		enableDroppable.call(me);
	}


	/**
	 * Return if same jquery element
	 * @api private
	 */
	function isSamejQueryElement(a, b) {
		return (a.length === b.length && a.length === a.filter(b).length);
	}

	/**
	 * Return if same jquery element
	 * @api private
	 */
	function enableDroppable() {
		var me = this,
			$el = this.$element;
		$el.find(SEL_DROPPABLE).droppable({
			accept: SEL_ITEM,
			hoverClass: CLS_HOVER,
			over: function (event, ui) {
				var $me = $(this);
				if ($me.find(SEL_ITEM).length > 0) {
					var $existingItem = $me.find(SEL_ITEM);
					if (!isSamejQueryElement($existingItem, $(ui.draggable)) && !$existingItem.hasClass(CLS_CORRECT)) {
						//$existingItem.transition({ x: '-15px', y: '15px', opacity: "0.6", easing: 'snap'});
					} else {
						$me.removeClass(CLS_HOVER);
					}
				}
			},
			out: function (/*event, ui*/) {
			//	var $me = $(this);
			//	var $existingItem = $me.find(SEL_ITEM);
			//	if ($existingItem.length > 0) {
			//		$existingItem.transition({ x: '0px', y: '0px', opacity: "1", easing: 'snap' });
			//	}
			},
			drop: function (event, ui) {
				var $me = $(this);
				if ($me.find(SEL_ITEM).length > 0) {
					var $existingItem = $me.find(SEL_ITEM);
					if (!$existingItem.hasClass(CLS_CORRECT)) {
						$($el.find(SEL_ORIGIN_AREA).find(SEL_ORIGIN).filter(function () {
							return $(this).html() == false
						})[0]).append($existingItem);

						$(this).append($(ui.draggable).removeAttr("style").addClass(CLS_DROPPED));
					}
				} else {
					$(this).append($(ui.draggable).removeAttr("style").addClass(CLS_DROPPED));
				}

				refreshDropArea.call(me);
				refreshOriginArea.call(me);
			}
		});

		$el.find(SEL_ORIGIN).droppable({
			accept: SEL_ITEM,
			drop: function (event, ui) {
				if ($(this).find(SEL_ITEM).length > 0) {
					return;
				}
				$(this).append($(ui.draggable));
				refreshDropArea.call(me);
				refreshOriginArea.call(me);
			}
		});

		$el.find(SEL_ITEM).draggable({
			cancel: SEL_ITEM_CORRECT + ", " + SEL_ITEM_INCORRECT,
			containment: SEL_ACTIVITY_BODY,
			activeClass: SEL_ACTIVE,
			revert: true,
			start: function () {
				$(this).addClass(CLS_ACTIVE);
			},
			stop: function () {
				$(this).removeAttr("style");
				$(this).removeClass(CLS_ACTIVE);
			}
		});
	}

	function refreshDropArea() {
		var me = this,
			$el = this.$element;
		if ($el.find(SEL_DROPPABLE + ":empty").length < 1) {
			onSequenceComplete.call(me);
		} else {
			me._item.answered(false);
		}
	}

	function refreshOriginArea() {
		var $el = this.$element;
		var $items = $el.find(SEL_ORIGIN_AREA).find(SEL_ITEM);
		$items.removeAttr("style").removeClass(CLS_DROPPED + " " + CLS_INCORRECT);
	}


	/**
	 * Return incorrect items
	 * 1. Move strips start from the first incorrect strip back to origin area
	 * 2. Refresh origin area
	 * 3. Disable check answer
	 * @api private
	 */
	function returnIncorrectItems() {
		var me = this,
			$el = this.$element;
		var $incorrectItems = $el.find(SEL_DROP_AREA).find(SEL_ITEM_INCORRECT);

		$($el.find(SEL_ORIGIN_AREA).find(SEL_ORIGIN).filter(function () {
			return $(this).html() == false
		})).each(function (i) {
			$(this).append($incorrectItems[i]);
		});

		//$(SEL_ORIGIN_AREA).append($incorrectItems);

		refreshOriginArea.call(me);

		me._item.answered(false);
	}

	/**
	 * When all strips are in drop area
	 * 1. Update item's position property based on ui sequence
	 * 2. Enable check answer
	 * @api private
	 */
	function onSequenceComplete() {
		var me = this;
		me._item.answered(true);
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		"hub/activity/template/sqi/load": function (options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;
			me._super = options._super;

			// set instant feedback off
			me._item.instantFeedback(false);

			return me.signal('render');
		},
		'hub/activity/check/answer': function () {
			var me = this;
			var allCorrect = true;
			var $el = this.$element;

			var $items = $el.find(SEL_DROP_AREA).find(SEL_ITEM);
			me._json.scoring.sequences.forEach(function (expectedItem, index) {
				var $item = $items.eq(index);
				var correct = expectedItem._id === $item.attr('id');
				$item.addClass(correct ? CLS_CORRECT : CLS_INCORRECT);
				allCorrect = allCorrect && correct;
			});

			window.setTimeout(function () {
				returnIncorrectItems.call(me)
			}, FEEDBACK_DELAY);

			//only one sequence, there is not specific id
			var promise = me._super.publishInteraction(
				Interaction.makeSequencingInteraction(allCorrect, "SeqImgId"));

			promise.then(function () {
				if (allCorrect) {
					me._json.content._isCorrect = true;
					me._item.answered(true);
					me._item.completed(true);
				} else {
					me._item.answered(false);
				}
			});
		}
	};

	return Widget.extend(Ctor, methods);
});
