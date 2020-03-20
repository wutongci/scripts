// # Task Module
define([
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	'template!./sequencing-word-horizontal.html'
], function ($, $ui, $uiTouchPunch, Widget, Scoring, Interaction, tTemplate) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_DROP_AREA = ".ets-act-swh-droparea",
		SEL_ORIGIN_AREA = ".ets-act-swh-originarea",
		SEL_ACTIVITY_BODY = ".ets-act-bd",
		SEL_STRIP = ".ets-act-swh-strip",
		SEL_STRIP_CORRECT = ".ets-correct",
		SEL_STRIP_INCORRECT = ".ets-incorrect",
		SEL_ACTIVE = ".ets-active",
		CLS_ORIGIN_AREA = "ets-act-swh-originarea",
		CLS_DROP_AREA = "ets-act-swh-droparea",
		CLS_PLACEHOLDER = "ets-act-swh-placeholder",
		CLS_BEGIN = "ets-begin",
		CLS_END = "ets-end",
		CLS_CORRECT = "ets-correct",
		CLS_INCORRECT = "ets-incorrect",
		FEEDBACK_DELAY = 1500,
		HELPER = "<div class='ets-act-swh-strip'></div>";

	var LAST_TOUCH_DATE = "_lastTouchDate";
	var DOUBLE_CLICK_DURATION = 250;

	function Ctor() {

	}

	// # Render

	function render() {
		var me = this;
		var data = me._phrase;

		if (!data) {
			throw me.toString() + EX_JSON_FORMAT;
		}

		return me.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * 1. Enable sortable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this;

		//Enable sortable
		enableSortable.call(me);

		//Bind double click
		bindDoubleClickItem.call(me);

		setStripeWidth.call(me);
	}

	function setStripeWidth() {
		$(SEL_STRIP).each(function (i, item) {
			var l = $(item).find(".ets-l").outerWidth(),
				c = $(item).find(".ets-c").outerWidth(),
				r = $(item).find(".ets-r").outerWidth();

			$(item).css("width", l + c + r + 1);
		});
	}


	/**
	 * Enable sortable
	 * 1. Sortable droparea and origin area
	 * 2. Refresh droparea and origin area when stop dragging
	 * @api private
	 */
	function enableSortable() {
		var me = this,
			$el = this.$element;
		$el.find(SEL_ORIGIN_AREA).sortable({
			cancel: SEL_STRIP_CORRECT + "," + SEL_STRIP_INCORRECT,
			containment: SEL_ACTIVITY_BODY,
			activeClass: SEL_ACTIVE,
			connectWith: SEL_DROP_AREA,
			placeholder: CLS_PLACEHOLDER,
			tolerance: 'pointer',
			// revert: true,
			start: function () {
				$(SEL_DROP_AREA).find(SEL_STRIP_CORRECT).each(function () {
					var $this = $(this);
					$this.data('pos', $this.index() + 1);
				});
			},
			change: function () {
				var $statics = $(SEL_STRIP_CORRECT, $(SEL_DROP_AREA)).detach();
				var $helper = $(HELPER).prependTo($(SEL_DROP_AREA));
				$statics.each(function () {
					var $this = $(this);
					var target = $this.data('pos');
					$this.insertAfter($(SEL_STRIP, $(SEL_DROP_AREA)).eq(parseInt(target) - 1));
				});
				$helper.remove();
			},
			stop: function () {
				refreshDropArea.call(me);
				refreshOriginArea.call(me);
				setStripeWidth.call(me);
			}
		});

		$el.find(SEL_DROP_AREA).sortable({
			cancel: SEL_STRIP_CORRECT + "," + SEL_STRIP_INCORRECT,
			containment: SEL_ACTIVITY_BODY,
			activeClass: SEL_ACTIVE,
			connectWith: SEL_ORIGIN_AREA,
			placeholder: CLS_PLACEHOLDER,
			tolerance: 'pointer',
			start: function (/*event, ui*/) {
				$(SEL_STRIP_CORRECT, this).each(function () {
					var $this = $(this);
					$this.data('pos', $this.index() + 1);
				});
			},
			change: function () {
				var $sortable = $(this);
				var $statics = $(SEL_STRIP_CORRECT, this).detach();
				var $helper = $(HELPER).prependTo(this);
				$statics.each(function () {
					var $this = $(this);
					var target = $this.data('pos');
					$this.insertAfter($(SEL_STRIP, $sortable).eq(parseInt(target) - 1));
				});
				$helper.remove();
			},
			stop: function () {
				refreshDropArea.call(me);
				refreshOriginArea.call(me);
				setStripeWidth.call(me);
			}
		});
	}

	/**
	 * Refresh drop area:
	 * 1. Add special class to first and last item
	 * 2. Enable check answer when all strip are in droparea
	 * 3. Unbind double click to droparea strips
	 * @api private
	 */
	function refreshDropArea() {
		var me = this;
		var $items = $(SEL_DROP_AREA).find(SEL_STRIP);

		if ($items.length > 0) {
			$items.removeClass(CLS_BEGIN + " " + CLS_END).removeAttr("style");
			$items.first().addClass(CLS_BEGIN);
			//Enable check answer
			me._item.answered(false);
		}
		if ($items.length === me._phrase.words.length) {
			//Enable check answer
			onSequenceComplete.call(me);
			$items.last().addClass(CLS_END);
		}
	}

	/**
	 * Refresh origin area:
	 * 1. Reset origin area strip classes
	 * 3. Bind double click to strips
	 * @api private
	 */
	function refreshOriginArea() {
		var $strips = $(SEL_ORIGIN_AREA).find(SEL_STRIP);

		if ($strips.length > 0) {
			$strips.removeClass([CLS_BEGIN, CLS_END, CLS_CORRECT, CLS_INCORRECT].join(' '))
				.removeAttr("style");
		}
	}

	/**
	 * Return incorrect items
	 * 1. Move strips start from the first incorrect strip back to origin area
	 * 2. Refresh origin area
	 * 3. Disable check answer
	 * @api private
	 */
	function returnIncorrectItems() {
		var me = this;
		var firstIncorrectItemIndex = $(SEL_DROP_AREA).find(SEL_STRIP_INCORRECT).first().index(),
			$items = $(SEL_DROP_AREA).find(SEL_STRIP),
			$returnItems = [];

		if (firstIncorrectItemIndex >= 0) {
			$items.each(function (index, item) {
				if (index >= firstIncorrectItemIndex) {
					$returnItems.push(item);
				}
			});

			$(SEL_ORIGIN_AREA).append($returnItems);

			refreshOriginArea.call(me);
			setStripeWidth.call(me);
		}
	}

	/**
	 * Bind double click
	 * 1. Move strip to droparea when double click
	 * 2. Refresh drop area
	 * @api private
	 */
	function bindDoubleClickItem() {
		var me = this;

		$(SEL_STRIP).on("dblclick customdblclick", function () {
			var $el = $(this);

			if ($el.parent().hasClass(CLS_ORIGIN_AREA)) {
				$(SEL_DROP_AREA).append($el);
				refreshDropArea.call(me);
			} else if ($el.parent().hasClass(CLS_DROP_AREA)) {
				if ($el.hasClass(CLS_CORRECT)) {
					return;
				}
				$(SEL_ORIGIN_AREA).append($el);
				refreshOriginArea.call(me);
				refreshDropArea.call(me);
			}

			setStripeWidth.call(me);
		});

		$(SEL_STRIP).on('touchstart', function (evt) {
			evt.preventDefault();
			var $el = $(this);

			var lastTouchDate = $el.data(LAST_TOUCH_DATE);
			var touchDate = new Date().getTime();
			if (!lastTouchDate) {
				$el.data(LAST_TOUCH_DATE, touchDate);
				return;
			}

			var duration = touchDate - lastTouchDate;
			if (duration <= DOUBLE_CLICK_DURATION) {
				$el.trigger('customdblclick');
				$el.removeData(LAST_TOUCH_DATE);
			}
			else {
				$el.data(LAST_TOUCH_DATE, touchDate);
			}
		});
	}


	function onSequenceComplete() {
		var me = this;
		me._item.answered(true);
	}


	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		'hub/activity/template/swh/load': function (options) {
			var me = this;

			me._json = options.json;
			me._index = options.index;
			me._phrase = me._json.content.phrases[me._index];
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
			var $strips = $el.find(SEL_DROP_AREA).find(SEL_STRIP);
			var solution = Scoring.findById(me._json.scoring.phrases, me._phrase._id);
			var expectedTexts = solution.blanks.map(function (blank) {
				return blank.word.txt;
			});

			$strips.each(function (index) {
				var $strip = $(this);
				var stripText = $strip.find(".ets-c").text();
				var correct = expectedTexts[index] === stripText;
				$strip.addClass(correct ? CLS_CORRECT : CLS_INCORRECT);
				allCorrect = allCorrect && correct;
			});

			window.setTimeout(function () {
				returnIncorrectItems.call(me)
			}, FEEDBACK_DELAY);

			var promise = me._super.publishInteraction(
				Interaction.makeSequencingInteraction(allCorrect, me._phrase._id));

			promise.then(function () {
				if (allCorrect) {
					if (me._index === me._json.content.phrases.length - 1) {
						me._json.content._isCorrect = true;
					}
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
