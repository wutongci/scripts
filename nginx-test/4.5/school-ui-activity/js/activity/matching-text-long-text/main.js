define([
	'jquery',
	"when",
	'school-ui-activity/activity/base/main',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"school-ui-shared/utils/browser-check",
	"template!./main.html",
	'underscore',
	'jquery.ui',
	'jquery.ui.touch-punch'
], function MatchingTextText($, when, Widget, Scoring, Interaction, browserCheck, template, _) {
	'use strict';

	var PAGINATE = 6;

	var SEL_MTL = '.ets-act-mtl';
	var SEL_TARGET = '.ets-targets';
	var SEL_OPTION = '.ets-options';
	var SEL_OPTION_UL = '.ets-options ul';
	var SEL_DROPPABLE = '.ets-droppable-line ul';
	var SEL_MTL_RIGHT = '.ets-mtl-right';
	var SEL_MTL_LEFT = '.ets-mtl-left';
	var SEL_FIRST = '.ets-first';
	var SEL_LAST = '.ets-last';
	var SEL_REF = '.ets-references';

	var CLS_MOVING = 'ets-moving';
	var CLS_DROPPED = 'ets-dropped';
	var CLS_CORRECT = 'ets-correct';
	var CLS_INCORRECT = 'ets-incorrect';

	var draggableOptions = {
		revert: 'invalid',
		containment: SEL_MTL,
		scroll: false
	};


	/**
	 * Move picture back to origin position
	 * @api private
	 */
	function backToOriginPosition($source) {
		var me = this;
		var index = $source.attr('data-index');
		var $optionLi = me.$element.find(SEL_OPTION_UL).find('li').eq(index);
		var optionPos = $optionLi.offset();
		var $currentLi = $source.parent();
		var currentPos = $currentLi.offset();

		return when.promise(function (resolve) {
			$source.addClass('ets-moving').animate({
				left: optionPos.left - currentPos.left,
				top: optionPos.top - currentPos.top
			}, function () {
				$optionLi.append($source.removeAttr('style').removeClass(CLS_MOVING + ' ' + CLS_DROPPED));
				$optionLi.find(SEL_MTL_RIGHT).draggable(draggableOptions);
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
			for (; pairIndex < pairIndexEnd; pairIndex++) {
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
				onRendered.call(me);
				return me.attachATAssetDom(me._templateData[me.index()]);
			});
	}

	function onRendered() {
		var me = this;
		me._currentPairs += me._templateData[me.index()].targets.length;

		me.$element.find(SEL_OPTION + ' ' + SEL_MTL_RIGHT).css('position', 'relative').draggable(draggableOptions);
		me.$element.find(SEL_OPTION).on('mousedown mouseup', SEL_MTL_RIGHT, function (e) {
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
			me.$element.find(SEL_TARGET).add(SEL_OPTION).on('selectstart', function () {
				return false;
			});
		}

		// let audio player vertical align to center
		if (me._json.references.aud) {
			me.$element.find(SEL_REF).css({
				'padding-top': (me.$element.find(SEL_MTL).height() - 75) / 2
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
				var $me = $(this).animate({
					left: 0
				}, 'fast', function () {
					$me.css('position', 'static');
				});
				var $source = ui.draggable;
				var $target = $me.find(SEL_FIRST + ' ' + SEL_MTL_LEFT);
				var $li = $me.find(SEL_LAST);

				var targetPos = $li.offset();
				var originPos = ui.offset;

				$source.addClass('ets-moving').animate({
					left: parseInt($source.css('left')) + (targetPos.left - originPos.left),
					top: parseInt($source.css('top')) + (targetPos.top - originPos.top)
				}, 'fast', function () {
					$source.removeClass(CLS_MOVING).addClass(CLS_DROPPED);
					$li.html($source.removeAttr('style'));

					$me.droppable('disable');

					$source.draggable('destroy');

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
				}, 'fast', function () {
					$me.css('position', 'static');
				});
			}
		};
	}, {
		'sig/initialize': function () {
			var me = this;

			pagination.call(me, filterDist.call(me, me._json));
		},
		'sig/render': function () {
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
							$target.closest('ul')
								.droppable('enable');
						});
				}, 1000);
			}
		},
		nextStep: function () {
			var me = this;
			me.index(me.index() + 1);
			me.items().instantFeedback(true);
			render.call(me);
		}
	});
});
