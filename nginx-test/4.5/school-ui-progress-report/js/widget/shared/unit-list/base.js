define([
	"jquery",
	"jquery.gudstrap",
	"when",
	"moment",
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/enum/moment-language",
	"template!./unit-list.html"
], function ($, GUD, when, Moment, Poly, Widget, progressState, momentLang, tUnitList) {
	"use strict";

	var PAGE = "_page";
	var PROMISE_BLURBS = "_promise_blurbs";
	var CURRENT_ENROLLMENT = "_currentEnroll";
	var SEL_UNIT_ITEM = ".ets-pr-unit-item";
	var SEL_LESSON_LIST_SWITCH = ".ets-pr-lesson-list-switch";
	var SEL_LESSON_LIST = ".ets-pr-lesson-list";
	var SEL_IS_NEW = ".is-new";
	var SEL_IS_OLD = ".is-old";
	var SEL_SCORE_ICON = ".ets-pr-unit-list-header .ets-pr-lesson-score .ets-pr-icon";
	var CLS_SWITCHED = "switched";
	var CLS_SHOW = "ets-show";

	function initBlurbs() {
		var me = this;
		var blurbs = {
			scoreTitle: {
				id: "666900",
				en: "How is the total score calculated?"
			},
			scoreContent1: {
				id: "666901",
				en: "The total score shows the score that is the highest from either the web, tablet or phone."
			},
			scoreContent2: {
				id: "666902",
				en: "The score on your phone is represented by stars, but shown as % in the progress report."
			}
		};

		var blurbNames = Object.keys(blurbs);
		var blurbIds = blurbNames.map(function (blurbName) {
			return "blurb!" + blurbs[blurbName].id;
		});

		return me.query(blurbIds).then(function (blurbResults) {
			blurbResults.forEach(function (blurbResult, index) {
				blurbs[blurbNames[index]].translation = blurbResult.translation || blurbs[blurbNames[index]].en;
			});

			return blurbs;
		});
	}

	function doRender(context, level) {
		var me = this;

		if (!context || !level) {
			return;
		}

		me._getUnitState = function (unit) {
			var unitProgress = unit.progress;
			if (progressState.notStarted(unitProgress.state)) {
				return {
					blurbId: "659677",
					blurbTextEn: "Not yet started",
					stateName: "not-started",
					suffix: ""
				};
			}
			else if (progressState.hasStarted(unitProgress.state)) {
				if (me[CURRENT_ENROLLMENT].studentUnit.id === unit.id) {
					return {
						blurbId: "659679",
						blurbTextEn: "Ongoing",
						stateName: "on-going",
						suffix: ""
					};
				}
				else {
					return {
						blurbId: "",
						blurbTextEn: "",
						stateName: "started",
						suffix: ""
					};
				}
			}
			else if (progressState.hasPassed(unitProgress.state)) {
				var momentPassed = Moment(unitProgress.completionDate);
				momentPassed.locale(momentLang[context.cultureCode.toLowerCase()] || "en");
				return {
					blurbId: "659678",
					blurbTextEn: "Passed on",
					stateName: "passed",
					suffix: momentPassed.format("ll")
				};
			}
		};

		me._hasLessonPassed = function (studentLesson, typeCode) {
			var detail = studentLesson.progress.detail;
			return detail && detail.items && detail.items.reduce(function (prev, item) {
					return prev || (item.sourceTypeCode === typeCode && progressState.hasPassed(item.state));
				}, false);
		};

		me._progressState = progressState;

		var renderPromise = me.html(tUnitList, {
			"units": level.children
		});

		return when.all([
			me[PROMISE_BLURBS],
			renderPromise
		]).spread(function (blurbs) {
			$(SEL_SCORE_ICON).popover({
				"title": "<p data-blurb-id='" + blurbs.scoreTitle.id + "' data-text-en='" + blurbs.scoreTitle.en + "'>" + blurbs.scoreTitle.translation + "</p>",
				"content": "<p data-blurb-id='" + blurbs.scoreContent1.id + "' data-text-en='" + blurbs.scoreContent1.en + "'>" + blurbs.scoreContent1.translation + "</p>" +
				"<p data-blurb-id='" + blurbs.scoreContent2.id + "' data-text-en='" + blurbs.scoreContent2.en + "'>" + blurbs.scoreContent2.translation + "</p>"
			});
		});
	}

	function switchLessonList($switchLabel, selTargetList) {
		$switchLabel = $($switchLabel);
		if (!$switchLabel.hasClass(CLS_SWITCHED)) {
			$switchLabel.addClass(CLS_SWITCHED);

			var $otherSwitchLabels = $switchLabel.siblings(SEL_LESSON_LIST_SWITCH);
			$otherSwitchLabels.removeClass(CLS_SWITCHED);

			var $lessonLists = $switchLabel.closest(SEL_UNIT_ITEM).find(SEL_LESSON_LIST);
			$lessonLists.removeClass(CLS_SWITCHED).removeClass(CLS_SHOW);

			var $switchedLessonList = $lessonLists.filter(selTargetList);
			$switchedLessonList.addClass(CLS_SWITCHED);
			(window.requestAnimationFrame || setTimeout)(function () {  //fade animation
				$switchedLessonList.addClass(CLS_SHOW);
			});
		}
	}

	return Widget.extend(function (path, $element, page, initData) {
		var me = this;
		me[PAGE] = page;
		me[CURRENT_ENROLLMENT] = initData.currentEnroll;
	}, {
		"sig/start": function () {
			var me = this;
			me[PROMISE_BLURBS] = initBlurbs.call(me);
		},
		"dom:.ets-pr-lesson-list-switch.to-new:not(.switched)/click": function (e) {
			switchLessonList(e.currentTarget, SEL_IS_NEW);
		},
		"dom:.ets-pr-lesson-list-switch.to-old:not(.switched)/click": function (e) {
			switchLessonList(e.currentTarget, SEL_IS_OLD);
		},
		"render": doRender
	});
});
