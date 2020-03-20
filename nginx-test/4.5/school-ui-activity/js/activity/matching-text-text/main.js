define([
	'jquery',
	"poly",
	"when",
	'school-ui-activity/activity/base/main',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"school-ui-shared/utils/browser-check",
	"template!./main.html",
	'underscore',
	'jquery.ui',
	'jquery.ui.touch-punch'
], function MatchingTextText($, poly, when, Widget, Scoring, Interaction, browserCheck, template, _) {
	'use strict';

	var PAGINATE = 6;

	var SEL_MTT = '.ets-act-mtt';
	var SEL_TARGET = '.ets-targets';
	var SEL_OPTION = '.ets-options';
	var SEL_PUZZLE = '.ets-word-puzzle';
	var SEL_DROPPABLE = '.ets-droppable ul';
	var SEL_OPTION_UL = '.ets-options ul';

	var CLS_MOVING = 'ets-moving';
	var CLS_CORRECT = 'ets-correct';
	var CLS_INCORRECT = 'ets-incorrect';
	var CLS_UNDRAGGABLE = 'ets-undraggable';

	var draggableOptions = {
		revert: 'invalid',
		containment: SEL_MTT,
		scroll: false,
		zIndex: 2
	};

	/**
	 * Move picture back to origin position
	 * @api private
	 */
	function backToOriginPosition($source) {
		var me = this;
		var index = $source.attr('data-index');
		var $li = me.$element.find(SEL_OPTION_UL).find('li').eq(index);
		var originPos = $li.position();
		var currentPos = $source.position();

		return when.promise(function (resolve) {
			$source
				.css('z-index', 1)
				.addClass(CLS_MOVING)
				.animate({
					left: originPos.left - currentPos.left,
					top: originPos.top - currentPos.top
				}, function () {
					$source
						.removeClass(CLS_MOVING + " " + CLS_UNDRAGGABLE)
						.next()
						.show();
					$li.html($source.css({
						left: 'auto',
						top: 'auto',
						'z-index': 'auto'
					}));
					$li.find(SEL_PUZZLE).draggable(draggableOptions);
					resolve();
				});
		});
	}

	/**
	 * Filter Distractors
	 **/
	function filterDist(data) {
		var me = this;

		var dists = data.scoring.sources;

		if (!dists) {
			return data;
		}
		data.dists = [];

		_.each(dists, function (dist) {
			data.dists.push(_.find(data.content.sources, function (source) {
				return dist._id == source._id;
			}));

			data.content.sources = _.reject(data.content.sources, function (source) {
				return dist._id == source._id;
			});
		});

		delete me._json.scoring.sources;

		return data;
	}

	/**
	 * Filter source data
	 * # Shuffle template data items
	 * @api private
	 */
	function filterData(data) {
		var me = this;
		if (!data.sources) {
			return;
		}

		// Shuffle pics items and add distraction
		if (data.dists) {
			var distNo = me._json.filterOptions.distNo;
			for (var i = 0, length = 5 - data.sources.length; i < length; i++) {
				if (i >= distNo) {
					break;
				}
				if (data.dists[i]) {
					data.sources.push(data.dists[i]);
				}
			}
		}

		data.sources = _.shuffle(data.sources);

		return data;
	}

	/**
	 * Paginate data
	 * @api private
	 */
	function pagination(data) {
		var me = this;
		var maxPairs = Math.min(data.filterOptions.questionNo, data.content.targets.length);
		var contentLength = data.scoring.targets.length;
		var maxPage = Math.ceil(maxPairs / PAGINATE);
		var pairs;

		var temp,
			tempTargets,
			tempSources,
			newSources = [];

		if (contentLength >= maxPairs) {
			// Filter pairs
			pairs = _.shuffle(data.scoring.targets).slice(0, maxPairs);

			// update scoring.targets so that scoring can calculate correctly
			me._json.scoring.targets = pairs;
		} else {
			pairs = _.shuffle(data.scoring.targets);
		}

		me.length(maxPage);

		var perPage = Math.ceil(maxPairs / maxPage);

		for (var pageIndex = 0; pageIndex < maxPage; ++pageIndex) {
			temp = {};
			tempTargets = temp.targets = [];
			tempSources = temp.sources = [];

			var pairIndex = pageIndex * perPage, pairIndexEnd = (pageIndex + 1) * perPage;
			for (; pairIndex < pairIndexEnd; ++pairIndex) {
				var pair = pairs[pairIndex];
				if (pair) {
					tempTargets.push(_.find(data.content.targets, function (target) {
						return pair._id == target._id;
					}));
					tempSources.push(_.find(data.content.sources, function (source) {
						return pair.source.txt == source.txt;
					}));
				} else {
					break;
				}
			}

			temp.dists = data.dists;
			temp.references = data.references;
			newSources = newSources.concat(tempSources);

			me._templateData.push(filterData.call(me, temp));
		}
		me._json.content.sources = newSources;
	}

	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		return me.html(template, me._templateData[me.index()])
			.then(function () {
				me.attachATAssetDom(me._templateData[me.index()]);
				onRendered.call(me);
			});
	}

	function onRendered() {
		var me = this;

		me._currentPairs += me._templateData[me.index()].targets.length;

		me.$element.find(SEL_OPTION + ' ' + SEL_PUZZLE).css('position', 'relative').draggable(draggableOptions);
		me.$element.find(SEL_OPTION).on('mousedown mouseup', SEL_PUZZLE, function (e) {
			var $me = $(this);
			if (e.type === 'mousedown') {
				$me.addClass(CLS_MOVING);
			} else {

				$me.removeClass(CLS_MOVING);
			}
		});

		me.$element.find(SEL_DROPPABLE).droppable(me._droppableOptions);

		// prevent user select
		if (browserCheck.browser === "msie") {
			me.$element.find(SEL_TARGET).add(SEL_OPTION).on('selectstart', function (e) {
				e.preventDefault();
			});
		}
	}

	return Widget.extend(function () {
		var me = this;
		me._templateData = [];
		me._currentPairs = 0;
		me._correctAnswers = 0;

		me._droppableOptions = {
			hoverClass: "ets-drop-hover",
			drop: function (event, ui) {
				var $me = $(this).css('position', 'static');
				var $source = ui.draggable;
				var $target = $me.find('.ets-first .ets-word-puzzle');
				var $li = $me.find('.ets-last');

				var targetPos = $li.position();
				var originPos = $source.position();

				$source.addClass(CLS_MOVING).animate({
					left: parseInt($source.css('left')) + (targetPos.left - originPos.left) + 2,
					top: parseInt($source.css('top')) + (targetPos.top - originPos.top)
				}, function () {
					$li.html($source.removeAttr('style').removeClass(CLS_MOVING));

					$me.droppable('disable');
					$source.addClass(CLS_UNDRAGGABLE).draggable('destroy');

					var sourceId = $source.attr('data-source-id');
					var targetId = $target.attr('data-target-id');

					var correct = me.checkAnswer(sourceId, targetId);

					me.displayInteractionResult(correct, $source, $target);
				});
			},
			over: function (/*event, ui*/) {
				var $me = $(this);
				if ($me.is(":animated")) {
					return;
				}
				$me.css({position: 'relative'}).animate({
					left: 10
				}, 'fast');
			},
			out: function (/*event, ui*/) {
				var $me = $(this);

				$me.animate({
					left: 0
				}, 'fast');
			}
		};
	}, {
		"sig/initialize": function onStart() {
			var me = this;

			pagination.call(me, filterDist.call(me, me._json));
		},
		"sig/render": function onRender() {
			this.items().instantFeedback(true);

			return render.call(this);
		},
		checkAnswer: function (sourceId, targetId) {
			var me = this;
			var json = me._json;
			var source = Scoring.findById(json.content.sources, sourceId);
			var solution = Scoring.findById(json.scoring.targets, targetId);
			var correct = source && solution && (solution.source.txt === source.txt);

			if (correct) {
				me._correctAnswers += 1;
			}

			var promise = me.publishInteraction(Interaction.makeMatchingInteraction(correct, targetId, sourceId));

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
		displayInteractionResult: function (correct, $source, $target) {
			var me = this;
			var $ul = $target.closest('ul');
			if (correct) {
				$ul.addClass(CLS_CORRECT);
			} else {
				$ul.addClass(CLS_INCORRECT);

				setTimeout(function () {
					$target.css('z-index', 'auto');
					$ul.removeClass(CLS_INCORRECT);

					backToOriginPosition.call(me, $source)
						.then(function () {
							$target.closest('ul').droppable('enable');
						});
				}, 1000);
			}
		},
		nextStep: function () {
			var me = this;
			me.index(me.index() + 1);
			this.items().instantFeedback(true);
			return render.call(me);
		}
	});
});
