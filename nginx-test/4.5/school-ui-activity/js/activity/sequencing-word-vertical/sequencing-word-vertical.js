// # Task Module
define([
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'template!./sequencing-word-vertical.html'
], function ($, ui$, $uiTouchPunch, when, Widget, Interaction, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var CLS_ITEM_LOCKED = "ets-locked",
		CLS_ITEM_CORRECT = "ets-correct",
		CLS_ITEM_INCORRECT = "ets-incorrect",
		CLS_SEQ_PLACEHOLDER = "ets-act-swv-list-placeholder",
		CLS_ACTIVE = "ets-active",

		SEL_SEQ_SIDE = ".ets-act-swv-side",
		SEL_SEQ_MAIN = ".ets-act-swv-main",
		SEL_SEQ_LIST = ".ets-act-swv-list",
		SEL_SEQ_ITEMS = ".ets-act-swv-list > .ets-act-swv-item",
		SEL_ITEM_LOCKED = ".ets-act-swv-item.ets-locked",
		SEL_ITEM_CORRECT = ".ets-act-swv-item.ets-correct",
		SEL_ITEM_INCORRECT = ".ets-act-swv-item.ets-incorrect",
		SEL_SORTABLE_CONTAINMENT = ".ets-ui-acc-bd-main",
		SEL_LABEL = ".ets-act-swv-label",

		FEEDBACK_DELAY = 1500;

	function Ctor() {

	}

	// # Render

	function render() {
		var me = this;
		var data = this._json;

		if (!data) {
			when.reject(new Error(this.toString() + EX_JSON_FORMAT));
		}

		return this.html(tTemplate, data)
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
		var me = this;

		//Disable dragging when activity init
		var _$items = $(SEL_SEQ_ITEMS);
		if (_$items) {
			_$items.addClass(CLS_ITEM_LOCKED);
			me.actLocked = true;
		} else {
			throw "Sequecing data not found";
		}

		if (!me._json.references.aud) {
			enableDragging.call(me);
		}

		adjustLayout.call(me);
	}

	/**
	 * Adjust style
	 * # Adust side padding to audio vertically middle
	 * @api private
	 */
	function adjustLayout() {
		var $el = this.$element;
		var $side = $(SEL_SEQ_SIDE),
			$main = $(SEL_SEQ_MAIN),
			$label = $el.find(SEL_LABEL),
			$sequence = $el.find(SEL_SEQ_MAIN);
		$side.css("padding-top", ($main.outerHeight() - 75) / 2);
		$label.css("height", $sequence.outerHeight());
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

		var _$items = $el.find(SEL_SEQ_ITEMS);
		_$items.each(function () {
			if (!$(this).hasClass(CLS_ITEM_CORRECT)) {
				$(this).removeClass(CLS_ITEM_LOCKED);
			}
		});

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
	 * # Update sequence position property
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
		"hub/activity/template/swv/load": function (options) {
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
				Interaction.makeSequencingInteraction(allCorrect, "SeqWordVerId"));

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
		"dom:.ets-ap/media/play": function () {
			enableDragging.call(this);
		}
	};

	return Widget.extend(Ctor, methods);
});
