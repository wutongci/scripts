define([
	'jquery',
	'when',
	'school-ui-activity/activity/base/main',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./main.html",
	'underscore',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'jquery.transit'
], function mpaMain($, when, Widget, Scoring, Interaction, tTemplate) {
	"use strict";

	var $ROOT;
	var $ORIGIN_UL;

	var SEL_MTP = ".ets-act-mtp",
		SEL_OPTION = '.ets-options',
		SEL_OPTION_UL = '.ets-options ul',
		SEL_MB_TOP = '.ets-mb-top',
		SEL_MB_BOTTOM = '.ets-mb-bottom',
		SEL_PLACEHOLDER = '.ets-placeholder',
		SEL_DROPPABLE_AREA = '.ets-targets li';

	var CLS_INCORRECT = 'ets-incorrect',
		CLS_CORRECT = 'ets-correct',
		CLS_HOVER = 'ets-hover',
		CLS_DROPPED = 'ets-mb-dropped',
		CLS_MOVING = 'ets-moving',
		CLS_MB_MEDIUM = 'ets-mb-bottom-medium',
		CLS_PH_MEDIUM = 'ets-placeholder-medium';

	var draggableSetting = {
		containment: SEL_MTP,
		scroll: false,
		revert: 'invalid',
		start: function (/*event, ui*/) {
			var $me = $(this);
			$me.addClass(CLS_MOVING);
			if ($me.hasClass(CLS_DROPPED)) {
				return false;
			}
			$me.closest('li').siblings()
				.css({
					'z-index': 0,
					'position': 'relative'
				});
			$me.css('z-index', 1);
		},
		stop: function (/*event, ui*/) {
			var $me = $(this);
			$me.removeClass(CLS_MOVING);
			$me.closest('li').siblings()
				.css({
					'z-index': '',
					'position': 'static'
				});
			$me.css('z-index', '');
		}
	};


	/**
	 * Move picture back to origin position
	 * @api private
	 */
	function backToOriginPosition($answer) {
		var index = $answer.attr('data-index');
		var $li = $ORIGIN_UL.find('li').eq(index);
		var originPos = $li.position();
		var currentPos = $answer.position();

		return when.promise(function (resolve) {
			$answer.css('z-index', 1).removeClass(CLS_DROPPED)
				.addClass(CLS_MOVING).animate({
					left: originPos.left - currentPos.left,
					top: originPos.top - currentPos.top
				}, function () {
					$answer.removeClass(CLS_MOVING).next().show();
					$li.html($answer.css({
						left: 'auto',
						top: 'auto',
						'z-index': 'auto'
					}));
					$li.find(SEL_MB_BOTTOM).draggable(draggableSetting);
					resolve();
				});
		});
	}

	/**
	 * Filter Distractors
	 **/
	function filterDist(data) {
		var me = this;
		var dists = data.scoring.texts;

		if (!dists) {
			return data;
		}
		data.dists = [];

		_.each(dists, function (dist) {
			data.dists.push(_.find(data.content.texts, function (text) {
				return dist._id == text._id;
			}));

			data.content.texts = _.reject(data.content.texts, function (text) {
				return dist._id == text._id;
			});
		});

		delete me._json.scoring.texts;

		return data;
	}

	/**
	 * Filter source data
	 * # Shuffle template data items
	 * @api private
	 */
	function filterData(data) {
		var me = this;
		if (!data.texts) {
			return;
		}

		// Shuffle pics items and add distraction
		if (data.dists) {
			var distNo = me._json.filterOptions.distNo;
			for (var i = 0, length = 5 - data.texts.length; i < length; i++) {
				if (i >= distNo) {
					break;
				}
				if (data.dists[i]) {
					data.texts.push(data.dists[i]);
				}
			}
		}

		data.texts = _.shuffle(data.texts);

		return data;
	}

	function pagination(data) {
		var me = this;
		var maxPairs = Math.min(data.filterOptions.questionNo, data.content.pics.length);
		var contentLength = data.scoring.pics.length;
		var maxPage = Math.ceil(maxPairs / 5);
		var pairs;

		var temp,
			tempPics,
			tempTexts,
			newPics = [];

		if (contentLength >= maxPairs) {
			// Filter pairs
			pairs = _.shuffle(data.scoring.pics).slice(0, maxPairs);
		} else {
			pairs = _.shuffle(data.scoring.pics);
		}

		me.length(maxPage);

		var perPage = Math.ceil(maxPairs / maxPage);


		for (var pageIndex = 0; pageIndex < maxPage; ++pageIndex) {
			temp = {};
			tempPics = temp.pics = [];
			tempTexts = temp.texts = [];

			var pairIndex = pageIndex * perPage, pairIndexEnd = (pageIndex + 1) * perPage;
			for (; pairIndex < pairIndexEnd; pairIndex++) {
				var pair = pairs[pairIndex];
				if (pair) {
					tempPics.push(_.find(data.content.pics, function (pic) {
						return pair._id == pic._id;
					}));
					tempTexts.push(_.find(data.content.texts, function (text) {
						return pair.text._id == text._id;
					}));
				} else {
					break;
				}
			}

			temp.dists = data.dists;
			temp.references = data.references;
			newPics = newPics.concat(tempPics);

			me._templateData.push(filterData.call(me, temp));
		}

		me._json.content.pics = newPics;
	}

	/**
	 * Shuffle items when sequence change
	 * # Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		// Render widget
		return me.html(tTemplate, me._templateData[me.index()])
			.then(function () {
				onRendered.call(me);

				$ROOT = $(SEL_MTP);
				$ORIGIN_UL = $ROOT.find(SEL_OPTION_UL);
				$ROOT.find(SEL_OPTION + ' ' + SEL_MB_BOTTOM).draggable(draggableSetting);
				$ROOT.find(SEL_DROPPABLE_AREA).droppable(me.droppableSetting);

				return me.attachATAssetDom(me._templateData[me.index()]);
			});
	}

	/**
	 * On activity rendered:
	 * # enlarge the height of matching block bottom by add a class, if neccessary
	 * @api private
	 */
	function onRendered() {
		var me = this;
		var $mb = $(SEL_MB_BOTTOM);
		var $span = $mb.children('span');

		me._currentPairs += me._templateData[me.index()].pics.length;

		if ($span.length) {
			$span.each(function () {
				if ($(this).height() > 32) {
					$mb.addClass(CLS_MB_MEDIUM);
					$(SEL_PLACEHOLDER).addClass(CLS_PH_MEDIUM);
					return false;
				}
			});
		}
	}

	return Widget.extend(function () {
		var me = this;
		me._templateData = [];
		me._currentPairs = 0;
		me._correctAnswers = 0;

		me.droppableSetting = {
			drop: function (event, ui) {
				var $me = $(this);
				var $text = ui.draggable;
				var $pic = $me.find(SEL_MB_TOP);
				var $placeholder = $me.find(SEL_PLACEHOLDER);
				var placholderPosition = $placeholder.position();
				var answerPositon = $text.position();

				// place the target back to its position
				$pic.animate({
					top: 0
				}, 'fast');

				//insert dragging item before placeholder
				$text.animate({
					left: parseInt($text.css('left')) + (placholderPosition.left - answerPositon.left),
					top: parseInt($text.css('top')) + (placholderPosition.top - answerPositon.top)
				}, 'fast', function () {
					$placeholder.before($text.addClass(CLS_DROPPED).css({
						left: 'auto',
						top: 'auto'
					})).hide();

					$text.draggable("destroy");
					$me.droppable('disable');

					var picId = $pic.attr('data-pic-id');
					var textId = $text.attr('data-text-id');

					var correct = me.checkAnswer(picId, textId);

					me.displayInteractionResult(correct, $pic, $text);
				});
			},
			over: function (/*event, ui*/) {
				var $me = $(this);
				var $top = $me.find(SEL_MB_TOP);
				$me.prev().addClass(CLS_HOVER);
				if ($top.is(":animated")) {
					return;
				}
				$top.animate({
					top: 10
				}, 'fast');
			},
			out: function (/*event, ui*/) {
				var $me = $(this);
				var $top = $me.find(SEL_MB_TOP);
				$top.removeClass(CLS_HOVER);
				$top.animate({
					top: 0
				}, 'fast');
			}
		};
	}, {
		"sig/initialize": function onStart() {
			var me = this;

			pagination.call(me, filterDist.call(me, $.extend(true, {}, me._json)));

			me.items().instantFeedback(true);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		checkAnswer: function (picId, textId) {
			var me = this;
			var json = me._json;
			var text = Scoring.findById(json.content.texts, textId);
			var solution = Scoring.findById(json.scoring.pics, picId);
			var correct = text && solution && (solution.text._id === text._id);

			if (correct) {
				me._correctAnswers += 1;
			}

			var promise = me.publishInteraction(Interaction.makeMatchingInteraction(correct, picId, textId));

			if (me._correctAnswers === me._currentPairs) {
				me._json.content._isCorrect = true;
				promise.then(function () {
					var item = me.items();
					item.answered(true);
					item.completed(true);
				});
			}

			return correct;
		},
		displayInteractionResult: function (correct, $pic, $text) {
			var me = this;
			var json = this._json;

			var $li = $pic.closest('li');
			if (correct) {
				$li.addClass(CLS_CORRECT);
			} else {
				$li.addClass(CLS_INCORRECT);

				setTimeout(function () {
					$pic.css('z-index', 'auto');
					$li.removeClass(CLS_INCORRECT);
					backToOriginPosition($text)
						.then(function () {
							$pic.closest('li').droppable('enable');
						});
				}, 1000);
			}
		},
		nextStep: function () {
			var me = this;
			me.index(me.index() + 1);
			me.items().instantFeedback(true);
			return render.call(me);
		}
	});
});
