define([
	'jquery',
	'when',
	'school-ui-activity/activity/base/main',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"template!./main.html",
	'jquery.ui',
	'jquery.ui.touch-punch',
	'jquery.transit'
], function mpaMain($, when, Widget, Scoring, Interaction, tTemplate) {
	"use strict";

	// declaire variables

	var $ROOT;
	var $ORIGIN_UL;

	var SEL_MPA = ".ets-act-mpa",
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
		CLS_MOVING = 'ets-moving';

	var draggableSetting = {
		containment: SEL_MPA,
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
			$answer
				.css('z-index', 1)
				.removeClass(CLS_DROPPED)
				.addClass(CLS_MOVING)
				.animate({
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

		var dists = data.scoring.pics;

		if (!dists) {
			return data;
		}
		data.dists = [];

		_.each(dists, function (dist) {
			data.dists.push(_.find(data.content.pics, function (pic) {
				return dist._id == pic._id;
			}));

			data.content.pics = _.reject(data.content.pics, function (pic) {
				return dist._id == pic._id;
			});
		});

		delete me._json.scoring.pics;

		return data;
	}


	/**
	 * Filter source data
	 * # Shuffle template data items
	 * @api private
	 */
	function filterData(data) {
		var me = this;
		if (!data.pics) {
			return;
		}

		// Shuffle pics items and add distraction
		if (data.dists) {
			var distNo = me._json.filterOptions.distNo;
			for (var i = 0, length = 5 - data.pics.length; i < length; i++) {
				if (i >= distNo) {
					break;
				}
				if (data.dists[i]) {
					data.pics.push(data.dists[i]);
				}
			}
		}

		data.pics = _.shuffle(data.pics);

		return data;
	}

	/**
	 * Paging data
	 * @api private
	 */
	function pagination(data) {
		var me = this;
		var maxPairs = Math.min(data.filterOptions.questionNo, data.content.audios.length);
		var contentLength;
		var audios;
		var maxPage = Math.ceil(maxPairs / 5);
		var pairs;

		var temp,
			tempPics,
			tempAuds,
			newAuds = [];

		contentLength = data.scoring.audios.length;
		audios = data.scoring.audios;

		if (contentLength > maxPairs) {
			// Filter pairs
			pairs = _.shuffle(audios).slice(0, maxPairs);
		} else {
			pairs = _.shuffle(audios);
		}

		me.length(maxPage);

		var perPage = Math.ceil(maxPairs / maxPage);

		for (var pageIndex = 0; pageIndex < maxPage; ++pageIndex) {
			temp = {};
			tempAuds = temp.audios = [];
			tempPics = temp.pics = [];

			var pairIndex = pageIndex * perPage, pairIndexEnd = (pageIndex + 1) * perPage;
			for (; pairIndex < pairIndexEnd; pairIndex++) {
				var pair = pairs[pairIndex];
				if (pair) {
					tempAuds.push(_.find(data.content.audios, function (audio) {
						return pair._id == audio._id;
					}));
					tempPics.push(_.find(data.content.pics, function (pic) {
						return pair.pic._id == pic._id;
					}));
				} else {
					break;
				}
			}

			temp.references = data.references;
			temp.dists = data.dists;
			newAuds = newAuds.concat(tempAuds);

			me._templateData.push(filterData.call(me, temp));
		}
		me._json.content.audios = newAuds;
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

				$ROOT = $(SEL_MPA);
				$ORIGIN_UL = $ROOT.find(SEL_OPTION_UL);
				$ROOT.find(SEL_OPTION + ' ' + SEL_MB_BOTTOM).draggable(draggableSetting);
				$ROOT.find(SEL_DROPPABLE_AREA).droppable(me.droppableSetting);

				//for automation testing
				return me.attachATAssetDom(me._templateData[me.index()]);
			});
	}

	/**
	 * On activity rendered:
	 * # Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this;
		me._currentPairs += me._templateData[me.index()].audios.length;
	}

	return Widget.extend(function () {
		var me = this;
		me._templateData = [];
		me._currentPairs = 0;
		me._correctAnswers = 0;

		me.droppableSetting = {
			drop: function (event, ui) {
				var $me = $(this);
				var $pic = ui.draggable;
				var $audio = $me.find(SEL_MB_TOP);
				var $placeholder = $me.find(SEL_PLACEHOLDER);
				var placholderPosition = $placeholder.position();
				var answerPositon = $pic.position();

				// place the target back to its position
				$audio.animate({
					top: 0
				}, 'fast');


				//insert dragging item before placeholder
				$pic.animate({
					left: parseInt($pic.css('left')) + (placholderPosition.left - answerPositon.left),
					top: parseInt($pic.css('top')) + (placholderPosition.top - answerPositon.top)
				}, 'fast', function () {
					$placeholder.before($pic.addClass(CLS_DROPPED).css({
						left: 'auto',
						top: 'auto'
					})).hide();

					$pic.draggable("destroy");
					$me.droppable('disable');

					var audioId = $audio.attr('data-audio-id');
					var picId = $pic.attr('data-pic-id');

					var correct = me.checkAnswer(audioId, picId);

					me.displayInteractionResult(correct, audioId, picId);
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
		checkAnswer: function (audioId, picId) {
			var me = this;
			var json = me._json;
			var pic = Scoring.findById(json.content.pics, picId);
			var solution = Scoring.findById(json.scoring.audios, audioId);
			var correct = pic && solution && (solution.pic._id === pic._id);

			if (correct) {
				me._correctAnswers += 1;
			}

			var promise = me.publishInteraction(Interaction.makeMatchingInteraction(correct, audioId, picId));

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
		displayInteractionResult: function (correct, audioId, picId) {
			var $audio = $('[data-audio-id="' + audioId + '"]');
			var $pic = $('[data-pic-id="' + picId + '"]');
			var $li = $audio.closest('li');
			if (correct) {
				$li.addClass(CLS_CORRECT);
			} else {
				$li.addClass(CLS_INCORRECT);

				setTimeout(function () {
					$audio.css('z-index', 'auto');
					$li.removeClass(CLS_INCORRECT);

					backToOriginPosition($pic)
						.then(function () {
							$li.droppable('enable');
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
