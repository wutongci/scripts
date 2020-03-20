define([
	'jquery',
	'school-ui-activity/activity/base/main',
	'troopjs-core/component/factory',
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	'template!./grouping.html',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'underscore'
], function groupingMoveModule($, Widget, Factory, Scoring, Interaction, tTemplate, $ui, $uiTouchPunch, _) {
	"use strict";

	/**
	 grouping move and copy mode
	 */
	var SEL_DROP_AREA = ".ets-act-grp-droparea",
		SEL_ORIGIN_AREA = ".ets-act-grp-originarea",
		SEL_TARGET = ".ets-act-grp-target",
		SEL_ACTIVITY_BODY = ".ets-act-bd",
		SEL_STRIP = ".ets-act-grp-strip",
		SEL_ETS_ACT_BD_MAIN = "div.ets-act-bd-main",

		CLS_TARGET = "ets-act-grp-target",
		CLS_STRIP_MOVE = "ets-act-grp-strip-move",
		CLS_STRIP_COPY = "ets-act-grp-strip-copy",
		CLS_CORRECT = "ets-correct",
		CLS_INCORRECT = "ets-incorrect",
		CLS_HOVER = "ets-hover",
		CLS_ACCEPTED = "ets-accepted",
		CLS_GRADE_COMPLETED = "ets-act-grade-completed",
		CLS_STRIP_DISABLED = "ets-act-strip-disabled",
		SLIDETIME = {"correct": 500, "incorrect": 800};

	/**
	 filter data that from service
	 */
	function filterByGrade(data) {
		var me = this;
		//specified correct items number which display on the page.
		var optionNo = me._allItemsCount = data.filterOptions.optionNo;
		//specified distractor items number.
		var distNo = data.filterOptions.distNo;
		var filteredDistItems = [];
		var filteredCount = 0;
		var copyData = $.extend(true, {}, data);
		var scoringDistItems = me._source.scoring.items;
		var copyScoringGroups = $.extend(true, {}, me._source.scoring.groups);
		//the rest items which are filtered from scoring.group items.
		var restGroupItems = [];
		copyData.content.items = [];
		if (distNo > 0) {
			scoringDistItems = _.shuffle(scoringDistItems);
			filteredDistItems = scoringDistItems.slice(0, distNo);
			copyData.content.items = copyData.content.items.concat(filteredDistItems);
		}
		$.each(me._source.scoring.groups, function (p, v) {
			filteredCount = filteredCount + v.items.length;
		});
		// specified correct items number larger than the account of scoring.group's items
		if (optionNo >= filteredCount) {
			$.each(me._source.scoring.groups, function (p, v) {
				copyData.content.items = copyData.content.items.concat(v.items);
			});
			me._allItemsCount = filteredCount;
		} else {
			while (optionNo > 0) {
				$.each(copyScoringGroups, function (p, v) {
					v.items = _.shuffle(v.items);
					if (v.items && v.items.length) {
						copyData.content.items.push(v.items.shift());
						optionNo--;
					}
					if (optionNo <= 0) {
						return false;
					}
				});
			}
			//merge not used items in scoring.groups
			$.each(copyScoringGroups, function (p, v) {
				if (v.items && v.items.length) {
					restGroupItems = restGroupItems.concat(v.items);
				}
			});
			//delete items which are existed in data.scoring.groups by filtering restGroupItems array.
			$.each(data.scoring.groups, function (p, v) {
				if (restGroupItems.length === 0) {
					return false;
				}
				if (v.items && v.items.length) {
					v.items = $.grep(v.items, function (m) {
						var retain = true;
						$.each(restGroupItems, function (i, j) {
							if (m._id === j._id) {
								retain = false;
								return false;
							}
						});
						return retain;
					});
				}
			});
		}
		$.each(copyData.content.items, function (p, v) {
			$.each(data.content.items, function (m, n) {
				if (v._id === n._id) {
					v.txt = n.txt;
					return false;
				}
			});
		});
		delete data.scoring.items;
		data.content.items = _.shuffle(copyData.content.items);
		data.content.items = _.uniq(data.content.items, false, function (p) {
			return p.txt;
		});
		return data;
	}

	function filterByNonGrade(data) {
		var optionNo = data.filterOptions.optionNo;
		var copyData = $.extend(true, {}, data);
		data.content.items = _.shuffle(copyData.content.items).slice(0, optionNo);
		data.content.items = _.uniq(data.content.items, false, function (p) {
			return p.txt;
		});
		return data;
	}

	function filterData(data) {
		return this.hasScoring ? filterByGrade.call(this, data)
			: filterByNonGrade.call(this, data);
	}

	/**
	 drop items which be drag to current container .
	 */
	function startDroppable() {
		var me = this;
		var $groupTargetArea = this.$element.find(SEL_TARGET);
		var $groupOriginArea = this.$element.find(SEL_ORIGIN_AREA);
		$groupTargetArea.droppable({
			accept: SEL_STRIP,
			hoverClass: CLS_HOVER,
			drop: function (event, ui) {
				var $target = $(this),
					$strip = ui.draggable;
				dropStrip.call(me, $strip, $target);
			}
		});

		$.each($groupOriginArea.find(SEL_STRIP), function (p, v) {
			var $el = $(v);
			var isCopyMode = me._isCopyMode;
			$el.draggable({
				containment: SEL_ACTIVITY_BODY,
				revert: "invalid",
				revertDuration: 300,
				snapMode: "inner",
				stack: isCopyMode ? "" : "div.ets-act-grp-strip",
				helper: isCopyMode ? 'clone' : 'original',
				cancel: "",
				scroll: false,
				stop: function (/*event, ui*/) {
					var $me = $(this);
					if (!$me.parent().hasClass(CLS_TARGET)) {
						$me.animate({"left": 0, "top": 0}, 500);
					}
				},
				start: function (event, ui) {
					var $me = $(this);
					if (isCopyMode) {
						ui.helper.removeClass(CLS_STRIP_COPY).addClass(CLS_STRIP_MOVE);
					}
					if ($me.parent().hasClass(CLS_TARGET)) {
						return false;
					}
				}
			});
		});
	}

	function cloneModeDrop(correct, $strip, $target) {
		var me = this;
		var $stripClone = $strip.clone();
		$stripClone.removeClass(CLS_STRIP_COPY).addClass(CLS_STRIP_MOVE);
		$target.prepend($stripClone.css({"left": 0, "top": 0}));
		if (correct) {
			me.hasScoring && $stripClone.addClass(CLS_CORRECT);
			window.setTimeout(function () {
				slideCorrectStrip.call(me, $stripClone);
			}, SLIDETIME.correct);
		} else {
			$stripClone.addClass(CLS_INCORRECT);
			window.setTimeout(function () {
				$stripClone.removeClass(CLS_INCORRECT);
				slideIncorrectCloneStrip.call(me, $stripClone, $strip, $target);
			}, SLIDETIME.incorrect);
		}
	}

	function moveModeDrop(correct, $strip, $target) {
		var me = this;
		$target.prepend($strip.css({"left": 0, "top": 0}));
		if (correct) {
			me.hasScoring && $strip.addClass(CLS_CORRECT);
			window.setTimeout(function () {
				slideCorrectStrip.call(me, $strip);
			}, SLIDETIME.correct);
		} else {
			$strip.addClass(CLS_INCORRECT);
			window.setTimeout(function () {
				me.$element.find(SEL_ORIGIN_AREA).append($strip.removeClass(CLS_INCORRECT));
				slideIncorrectStrip.call(me, $strip, $target);
			}, SLIDETIME.incorrect);
		}
	}

	function slideCorrectStrip($strip) {
		$strip.animate(
			{
				top: 60
			},
			500,
			function () {
				$(this).addClass(CLS_ACCEPTED);
				var stripId = $strip.attr('data-group');
				if ($strip.siblings('[data-group="' + stripId + '"]').length > 0) {
					$strip.remove();
				}
			}
		);
	}

	function slideIncorrectStrip($strip, $target) {
		var distance = {
			"left": $target.offset().left - $strip.offset().left,
			"top": $target.offset().top - $strip.offset().top
		};
		$strip.css({"left": distance.left, "top": distance.top})
			.animate({"left": 0, "top": 0}, 500);
	}

	function slideIncorrectCloneStrip($stripClone, $strip, $target) {
		var me = this;
		var distance = {
			"sLeft": $strip.position().left,
			"sTop": $strip.position().top,
			"tLeft": $target.position().left,
			"tTop": $target.position().top
		};
		me.$element.find(SEL_ORIGIN_AREA).append($stripClone.css({"position": "absolute"}));
		$stripClone.css({"left": distance.tLeft, "top": distance.tTop})
			.animate({"left": distance.sLeft, "top": distance.sTop},
				500,
				function () {
					$stripClone.remove();
				});
	}

	function dropStrip($strip, $target) {
		var me = this;
		var correct;
		var stripId = $strip.data("group");
		var targetId = $target.data("group");
		correct = me.checkAnswer(stripId, targetId);
		me.displayInteractionResult(correct, $strip, $target)
	}

	/**
	 call completeGroup when all items are dragged to relative container
	 */
	function completeGrouping() {
		var me = this;
		if (!me.hasScoring) {
			me.items().answered(true);
			return false;
		}
		var json = me._json;
		json.content._isCorrect = true;
		var $selDropArea = me.$element.find(SEL_DROP_AREA);
		var $originalArea = me.$element.find(SEL_ORIGIN_AREA);
		$selDropArea.addClass(CLS_GRADE_COMPLETED).hide().fadeIn('slow');
		disabledStrip.call(me);
		$originalArea.children().length === 0 && $originalArea.remove();
		me.$element.parents(SEL_ETS_ACT_BD_MAIN).css({"vertical-align": "top"});
		me.items().completed(true);
		me.publish("activity-container/resize");
	}

	function disabledStrip() {
		var $originalArea = this.$element.find(SEL_ORIGIN_AREA);
		$originalArea.find(SEL_STRIP).draggable("disable");
		$originalArea.addClass(CLS_STRIP_DISABLED);
	}

	function render() {
		var me = this;
		me._isCopyMode = (me._json.templateCode == "GroupCopy");
		var data = {
			wordItems: me._json.content.items,
			wordGroups: me._json.content.groups,
			references: me._json.references,
			isCopyMode: me._isCopyMode
		};

		return me.html(tTemplate, data)
			.then(function () {
				startDroppable.call(me);
				return me.attachATAssetDom(me._json.content.items);
			});
	}

	var extendOptions = {
		"sig/initialize": function onInitialize() {
			this.hasScoring || this.type(Widget.ACT_TYPE.PRACTICE);
			this.items().instantFeedback(true);

			filterData.call(this, this._json);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"completed": Factory.around(function (base) {
			return function () {
				base.apply(this, arguments);
				this._COMPLETED && disabledStrip.call(this);
			};
		}),
		checkAnswer: function (stripId, targetId) {
			var me = this;

			if (!me.hasScoring) {
				window.setTimeout(function () {
					completeGrouping.call(me);
				}, SLIDETIME.correct);
				return true;
			}

			var json = me._json;
			var solution = Scoring.findById(json.scoring.groups, targetId);
			var correctStrip = Scoring.findById(solution.items, stripId);
			var correct = Boolean(correctStrip);

			var alreadyAnswered = false;
			if (correct) {
				me._storeGroup[targetId] = me._storeGroup[targetId] || [];
				if (_.indexOf(me._storeGroup[targetId], stripId) === -1) {
					me._storeGroup[targetId].push(stripId);
					me._allItemsCount--;
				} else {
					alreadyAnswered = true;
				}
			}

			if (!alreadyAnswered) {
				var promise = me.publishInteraction(
					Interaction.makeGroupingInteraction(correct, targetId, stripId));
				if (me._allItemsCount == 0) {
					window.setTimeout(function () {
						promise.then(function(){
							completeGrouping.call(me);
						});
					}, SLIDETIME.correct);
				}
			}

			return correct;
		},
		displayInteractionResult: function (correct, $strip, $target) {
			var me = this;
			if (me._isCopyMode) {
				cloneModeDrop.call(me, correct, $strip, $target);
			} else {
				moveModeDrop.call(me, correct, $strip, $target);
			}
		}
	};
	return Widget.extend(function () {
		this._allItemsCount = 0;
		this._storeGroup = {};
	}, extendOptions);
});
