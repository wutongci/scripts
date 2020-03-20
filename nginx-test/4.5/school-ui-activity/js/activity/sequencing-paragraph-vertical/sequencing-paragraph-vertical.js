// # Task Module
define([
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./sequencing-paragraph-vertical.html'
], function ($, ui$, $uiTouchPunch, Widget, Interaction, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var CLS_ITEM_CORRECT = "ets-correct",
		CLS_ITEM_INCORRECT = "ets-incorrect",
		CLS_SEQ_PLACEHOLDER = "ets-act-spv-list-placeholder",
		CLS_ACTIVE = "ets-active",
		CLS_FREEZED = "ets-freezed",
		CLS_SCROLLABLE = "ets-scrollable",

		SEL_SEQ_MAIN = ".ets-act-spv-main",
		SEL_SEQ_SIDE = ".ets-act-spv-side",
		SEL_SEQ_LIST = ".ets-act-spv-list",
		SEL_SEQ_ITEMS = ".ets-act-spv-list > .ets-act-spv-item",
		SEL_ITEM_LOCKED = ".ets-locked",
		SEL_ITEM_CORRECT = ".ets-correct",
		SEL_ITEM_INCORRECT = ".ets-incorrect",
		SEL_SORTABLE_CONTAINMENT = ".ets-ui-acc-bd-main",

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

		this.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * # Init media player
	 * # Show check answer button
	 * # Disable dragging items
	 * # Fade in activity
	 * @api private
	 */
	function onRendered() {
		var me = this,
			$el = this.$element;

		//Disable dragging when activity init
		var _$items = $el.find(SEL_SEQ_ITEMS);
		if (_$items) {
			_$items.addClass(CLS_FREEZED);
			me.actLocked = true;
		} else {
			throw "Sequecing data not found";
		}

		if (!me._json.references.aud) {
			enableDragging.call(me);
		}

		adjustLayout.call(me);

		removeInlineStyles.call(me);
	}

	/**
	 * Adjust style
	 * # Adust side padding to audio vertically middle
	 * # Make list scrollable if height exceed container
	 * @api private
	 */
	function adjustLayout() {
		var $el = this.$element;
		var $side = $(SEL_SEQ_SIDE),
			$main = $(SEL_SEQ_MAIN);
		$side.css("padding-top", ($main.outerHeight() - 75) / 2);

		if ($el.find(SEL_SEQ_LIST).outerHeight() >= 416) {
			$el.find(SEL_SEQ_LIST).addClass(CLS_SCROLLABLE);
		}
	}

	/**
	 * Remove inline styles
	 * # Remove inline styles from authoring tool
	 * @api private
	 */
	function removeInlineStyles() {
		var $el = this.$element;

		$el.find(SEL_SEQ_ITEMS).find("p, span").removeAttr("style");
	}


	/**
	 * Enable dragging
	 * # Enable dragging
	 * # Bind sortable
	 * @api private
	 */
	function enableDragging() {
		var me = this,
			$el = this.$element;

		if (!me.actLocked) {
			return;
		}

		var _$items = $el.find(SEL_SEQ_ITEMS);
		_$items.removeClass(CLS_FREEZED);
		me.actLocked = false;

		//Sortable
		$el.find(SEL_SEQ_LIST).sortable({
			containment: SEL_SORTABLE_CONTAINMENT,
			cancel: SEL_ITEM_LOCKED + ', ' + SEL_ITEM_CORRECT + ', ' + SEL_ITEM_INCORRECT,
			axis: 'y',
			placeholder: CLS_SEQ_PLACEHOLDER,
			start: function (event, ui) {
				$(ui.item).addClass(CLS_ACTIVE);
				//Make placeholder the same height as drag item
				var sortable = $(this).data("ui-sortable");
				sortable.placeholder.outerHeight(sortable.currentItem.height() - 10);

				$(SEL_ITEM_CORRECT, this).each(function () {
					var $this = $(this);
					$this.data('pos', $this.index());
				});
			},
			change: function () {
				var $sortable = $(this);
				var $statics = $(SEL_ITEM_CORRECT, this).detach();
				var $helper = $('<li></li>').prependTo(this);
				$statics.each(function () {
					var $this = $(this);
					var target = $this.data('pos');

					$this.insertAfter($('li', $sortable).eq(target));
				});
				$helper.remove();
			},
			update: function () {
				onSequenceChanged.call(me);
			},
			stop: function (event, ui) {
				$(ui.item).removeClass(CLS_ACTIVE);
			}
		});
	}

	/**
	 * Update data when sequence change
	 * # Update sequece position property
	 * @api private
	 */
	function onSequenceChanged() {
		var me = this;

		me._item.answered(true);
	}


	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		"hub/activity/template/spv/load": function (options) {
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

			var $items = $el.find(SEL_SEQ_ITEMS);
			me._json.scoring.sequences.forEach(function (expectedItem, index) {
				var $item = $items.eq(index);
				var correct = expectedItem._id === $item.attr('id');
				$item.toggleClass(CLS_ITEM_CORRECT, correct);
				$item.toggleClass(CLS_ITEM_INCORRECT, !correct);
				allCorrect = allCorrect && correct;
			});
			if(!allCorrect){
				window.setTimeout(function () {
					$items.removeClass(CLS_ITEM_INCORRECT);
				}, FEEDBACK_DELAY);
			}

			//only one sequence, there is not specific id
			var promise = me._super.publishInteraction(
				Interaction.makeSequencingInteraction(allCorrect, "SeqParVerId"));

			promise.then(function () {
				if (allCorrect) {
					me._json.content._isCorrect = true;
					me._item.answered(true);
					me._item.completed(true);
				} else {
					me._item.answered(false);
				}
			});
		},
		'dom:.ets-ap/media/play': function () {
			enableDragging.call(this);
		},
		//Also listen for "playing" in case "play" is not well sent
		'dom:.ets-ap/media/playing': function () {
			enableDragging.call(this);
		}
	};

	return Widget.extend(Ctor, methods);
});
