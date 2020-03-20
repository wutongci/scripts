define([
	'jquery',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'troopjs-ef/component/widget',
	'school-ui-activity/util/interaction',
	'school-ui-shared/utils/browser-check',
	'school-ui-activity/util/activity-util',
	'template!./typing-drag-drop.html',
	"jquery.jscrollpane",
	"jquery.mousewheel"
], function ($, ui$, $uiTouchPunch, Widget, Interaction, browserCheck, Util, tPd) {
	"use strict";

	var _inDragging,
		_inDropping,
		_timeoutToBack,
		_timeoutToCheckHeight,
		_timeoutToChangeScrollbarAlphaFirst,
		_timeoutToChangeScrollbarAlphaSecond,
		_HEIGHT_MAIN = 430,
		_HEIGHT_AUDIO = 85,
		_HEIGHT_SHADOW = 37,
		_HEIGHT_DRAG_MARGIN = 10,
		_ISIE = browserCheck.browser === "msie",
		_ISIE_LT8 = _ISIE && parseInt(browserCheck.version) < 8,
		STR_DOT = '.',
		CLS_GAP_HIGHLIGHT = 'ets-act-tpd-h',
		CLS_ITEM_NORMAL = 'ets-act-tpd-item-n',
		CLS_ITEM_PLACED = 'ets-act-tpd-item-p',
		CLS_ITEM_HIGHLIGHT = 'ets-act-tpd-item-h',
		CLS_ITEM_SIMPLE_CORRECT = 'ets-act-tpd-item-sc',
		CLS_ITEM_INCORRECT = 'ets-act-tpd-item-ic',
		SEL_MAIN = '.ets-act-tpd-main',
		SEL_GAP = '.ets-act-tpd-gap',
		SEL_GAP_MID = '.ets-act-tpd-cm',
		SEL_ITEM = '.ets-act-tpd-item',
		SEL_ITEM_NORMAL = STR_DOT + CLS_ITEM_NORMAL,
		SEL_ITEM_PLACED = STR_DOT + CLS_ITEM_PLACED,
		SEL_ITEM_MID = '.ets-act-tpd-im',
		SEL_ITEMS = '.ets-act-tpd-items',
		SEL_TXT = '.ets-act-tpd-txt',
		SEL_SHADOW = '.ets-act-tpd-shadow';

	/**
	 * Util function ,remove style attribute from jquery object
	 */
	function clearStyle() {
		$(this).removeAttr('style');
	}

	function fixIERender() {
		if (!_ISIE) {
			return;
		}
		var me = this,
			$ROOT = me.$element;
		/**
		 * IE is ugly, will not rerender all elements of dom tree, use addClass to force it rerender
		 **/
		$ROOT.find(SEL_MAIN).addClass('notExists');
	}

	/**
	 * Templating and render
	 * @api private
	 */
	function render() {
		var me = this;
		return me.html(tPd, me._json)
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * # Bind input element focus and blur event
	 * # Bind input text change event
	 * # Bind Example text click event
	 * @api private
	 */
	function onRendered() {
		var me = this;
		initContentSize.call(me);
		initScrollPane.call(me);
		initDraggable.call(me);
		initDroppable.call(me);
	}

	function initContentSize() {
		var me = this,
			$ROOT = me.$element,
			$dragElements = $ROOT.find(SEL_ITEMS),
			$mainContent = $ROOT.find(SEL_MAIN),
			dragItemsHeight = $dragElements.height() + _HEIGHT_DRAG_MARGIN;

		//Set drag items div with fixed width to avoid layout change when some items dragged out.
		$dragElements.css({
			height: dragItemsHeight
		});
		var audioHeight = me._hasAudio ? _HEIGHT_AUDIO : 0;

		//Set max height to cover value set by css(max height in css is to avoid content height exceed of 430px)
		$ROOT.css({
			maxHeight: _HEIGHT_MAIN - audioHeight
		});
		var contentAvailiableheight = _HEIGHT_MAIN - dragItemsHeight - audioHeight;
		//Set height or max height for jScrollPane
		if ($mainContent.height() > contentAvailiableheight) {
			$mainContent.css({
				maxHeight: contentAvailiableheight - _HEIGHT_SHADOW
			});
			$ROOT.find(SEL_SHADOW).show();
			if (_ISIE_LT8) {
				$mainContent.css({
					'overflow-y': 'scroll'
				});
			}
		} else {
			$mainContent.css({
				height: contentAvailiableheight
			});
		}
	}

	function initScrollPanelEvent($pane) {
		var dragBarSelector = '.jspDrag',
			jspaneSelector = '.jspPane',
			eventScroll = 'jsp-scroll-y',
			eventInitialed = 'jsp-initialised';
		return $pane.bind(eventInitialed, function () {
			$pane.unbind(eventInitialed);
			var $dragbar = $pane.find(dragBarSelector);
			_timeoutToChangeScrollbarAlphaFirst = setTimeout(function () {
				Util.blink.call($, $dragbar);
			}, 5000);

			_timeoutToChangeScrollbarAlphaSecond = setTimeout(function () {
				Util.blink.call($, $dragbar);
			}, 30000);

			$pane.bind(eventScroll, function () {
				$pane.unbind(eventScroll);
				window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
				window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
			});
			var height = $pane.find(jspaneSelector).height();

			function checkHeight() {
				var newHeight = $pane.find(jspaneSelector).height();
				if (parseInt(newHeight) - parseInt(height)) {
					$pane.jScrollPane();
				}
				height = newHeight;
				_timeoutToCheckHeight = setTimeout(checkHeight, 100);
			}

			_timeoutToCheckHeight = setTimeout(checkHeight, 100);
		});
	}

	function initScrollPane() {
		var me = this,
			$ROOT = me.$element,
			$pane = $ROOT.find(SEL_MAIN);
		if (!(_ISIE_LT8)) {
			initScrollPanelEvent($pane).jScrollPane();
		}
	}

	function initDraggable() {
		var me = this,
			$ROOT = me.$element;

		var dragOption = {
			stack: SEL_ITEM_NORMAL,
			//containment : '.ets-ui-acc-bd',
			cancel: SEL_ITEM_PLACED,
			appendTo: '.ets-act-bd-main',
			revert: 'invalid',
			start: function (event, ui) {
				if (_inDragging || _inDropping) {
					ui.helper.removeClass(CLS_ITEM_HIGHLIGHT);
					return false;
				}
				_inDragging = true;
			},
			stop: function (event, ui) {
				ui.helper.removeClass(CLS_ITEM_HIGHLIGHT);
				_inDragging = false;
			},
			disabled: false
		};

		$ROOT.find(SEL_ITEMS).find(SEL_ITEM_NORMAL).bind('mousedown', function () {
			$(this).addClass(CLS_ITEM_HIGHLIGHT);
		}).bind('mouseup', function () {
			$(this).removeClass(CLS_ITEM_HIGHLIGHT);
		}).draggable(dragOption);
	}

	function initDroppable() {
		var me = this,
			$ROOT = me.$element;

		var dropOption = {
			accept: SEL_ITEM,
			activeClass: CLS_GAP_HIGHLIGHT,
			tolerance: "intersect",
			greedy: true,
			over: function (event, ui) {
				var $gap = $(this).css('zIndex', 1);
				var $gapMid = $gap.find(SEL_GAP_MID);
				$gapMid.stop().animate({
					width: ui.draggable.find(SEL_ITEM_MID).width() + 6
				});
			},
			out: function (/*event, ui*/) {
				var $gap = $(this).css('zIndex', 0);
				var $gapMid = $gap.find(SEL_GAP_MID);
				$gapMid.stop().animate({
					width: $gap.width()
				}, function () {
					$gapMid.each(clearStyle);
				});
			},
			drop: function (event, ui) {
				if (_inDropping) {
					return;
				} else {
					_inDropping = true;
				}

				//disable item draggable
				var $item = ui.draggable.draggable({
					disabled: true
				});
				//disable gap droppable
				var $gap = $(this).droppable({
					disabled: true
				});

				//set gap middle blank to item width subtract 13 to fit for item
				var $gapMid = $gap.find(SEL_GAP_MID);
				$gapMid.stop().css({
					width: $item.find(SEL_ITEM_MID).width() + 6
				});

				//animate to move drag item into the gap
				var gapOff = $gap.offset();
				var itemOff = $item.offset();
				var deltaOff = {
					left: gapOff.left - itemOff.left,
					top: gapOff.top - itemOff.top
				};
				$item.animate({
					left: parseInt($item.css('left')) + deltaOff.left + 4,
					top: parseInt($item.css('top')) + deltaOff.top + 3
				}, 100, function () {
					//append item to gap
					$gap.find(SEL_GAP_MID).append($item.each(clearStyle).addClass(CLS_ITEM_PLACED));
					$gap.css('width', 'auto');
					setTimeout(function () {
						handleInteraction.call(me, $gap, $item);
					}, 500);
				});
			}
		};

		$ROOT.find(SEL_GAP).droppable(dropOption);
	}

	/*
	 * Check answer with dragged id and correct answer id
	 * set result to json data
	 */
	function handleInteraction($gap, $item) {
		var me = this;
		var gapId = $gap.data('id');
		var itemId = $item.data('id');

		if (!gapId || !itemId)
			return;

		var correct = (gapId === itemId);

		var promise = me._super.publishInteraction(
			Interaction.makeMatchingInteraction(correct, gapId, itemId));

		if (correct) {
			me._correctAnswers += 1;
		}
		if (me._totalAnswers === me._correctAnswers) {
			me._json.content._isCorrect = true;
			promise.then(function () {
				me._item.completed(true);
			});
		}

		displayInteractionResult.call(me, correct, $gap, $item);
	}

	/*
	 * Animate drag item back to original position
	 * Finish Drop
	 */
	function backToOriginPosition($item) {
		$item.removeClass(CLS_ITEM_INCORRECT + ' ' + CLS_ITEM_PLACED);

		var me = this,
			$ROOT = me.$element,
			itemOff = $item.offset(),
			$gap = $item.closest(SEL_GAP),
			$gapMid = $gap.find(SEL_GAP_MID);
		$gap.css({
			width: $gap.width()
		});

		//set gap middle element back to min width
		$gapMid.animate({
			width: 50
		}, function () {
			$gapMid.each(clearStyle);
			$gap.each(clearStyle);
		});
		//detach item and append to template root element to normalize position when scrollbar shows
		$item.detach().css({
			position: 'absolute',
			zIndex: 10
		}).appendTo($ROOT).offset(itemOff).find(SEL_ITEM_MID).each(clearStyle);
		//get target li element
		var $li = $ROOT.find(SEL_ITEMS).find('li').eq(parseInt($item.data('index'))).css({
				width: $item.width() + 20
			}),
			liOff = $li.offset(),
			deltaOff = {
				left: liOff.left - itemOff.left,
				top: liOff.top - itemOff.top
			};
		//animate item back to original position smoothly
		$item.animate({
			left: parseInt($item.css('left')) + deltaOff.left + 10,
			top: parseInt($item.css('top')) + deltaOff.top
		}, function () {
			//append item to target li element
			$li.append($item.each(clearStyle).css({
				position: 'relative'
			}).draggable({
				disabled: false
			})).each(clearStyle);
			//complete dropping
			_inDropping = false;
		});
	}

	/**
	 * Use scoring data to set each gap's style
	 */
	function displayInteractionResult(correct, $gap, $item) {
		var me = this;

		if (correct) {
			markCorrect.call(me, $gap);
		} else {
			markIncorrect.call(me, $gap, $item);
		}

		fixIERender.call(me);
	}

	/**
	 * Mark correct gap with correct style
	 */
	function markCorrect($gap) {
		//set correct get to green simple span style
		var span = $('<span>').html($gap.find(SEL_TXT).text());
		$gap.removeClass().each(clearStyle).addClass(CLS_ITEM_SIMPLE_CORRECT).html(span).removeAttr("data-at-tag");
		_inDropping = false;
	}

	/*
	 * Mark Incorrect gap with incorrect style
	 * Call backToOriginPosition function
	 */
	function markIncorrect($gap, $item) {
		var me = this;
		//set gap to fixed width to fit for incorrect item
		$gap.droppable({
			disabled: false
		});

		$item.addClass(CLS_ITEM_INCORRECT);
		_timeoutToBack = window.setTimeout(function () {
			backToOriginPosition.call(me, $item);
		}, 500);
	}

	return Widget.extend({
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			window.clearTimeout(_timeoutToBack);
			window.clearTimeout(_timeoutToCheckHeight);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
			_inDragging = _inDropping = null;
		},
		'hub/activity/template/typing-drag-drop/load': function onTemplateLoad(options) {
			var me = this;

			me._super = options._super;
			me._json = options.json;
			me._item = options.item;
			me._hasScoring = options.hasScoring;
			me._hasAudio = me._json.references.aud;
			me._correctAnswers = 0;
			me._totalAnswers = me._json.content.items.reduce(function (count, item) {
				return count + item.gaps.length;
			}, 0);
			return me.signal('render');
		}
	});
});
