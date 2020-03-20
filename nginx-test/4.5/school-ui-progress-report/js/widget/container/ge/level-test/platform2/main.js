define([
	"module",
	"jquery",
	"client-tracking",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-progress-report/enum/score-state",
	"template!../level-test.html"
], function (module, $, ct, Widget, progressState, scoreState, tLevelTest) {
	"use strict";

	var MODULE_CONFIG = $.extend({
		levelTestPath: "/school/content/leveltest.aspx"
	}, module.config() || {});

	var SEL_STEPS = ".ets-pr-score-progress";

	return Widget.extend(function (path, $element, page) {
		this.page = page;
	}, {
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;

			if (page !== me.page) {
				return;
			}

			if (!data.level.levelTest || data.level.levelTest.isTemplate) {
				me.$element.empty();
				return;
			}

			var level = data.level;
			var levelTest = data.level.levelTest;
			if (progressState.notStarted(levelTest.progress.state)) {
				me.$element.empty();
				return;
			}

			me.templateLevelId = level.templateLevelId;

			var renderData = {
				overallScore: levelTest.progress.score,
				passPercent: scoreState.passScore,
				passed: progressState.hasPassed(levelTest.progress.state),
				steps: levelTest.progress.testSections.sort(function(prev,next){
					return (prev.sectionOrder || 0) - (next.sectionOrder || 0);
				}).map(function (sectionScoreInfo) {
					return {
						name: sectionScoreInfo.sectionName,
						score: sectionScoreInfo.score || 0,
						passed: sectionScoreInfo.score >= scoreState.passScore
					}
				})
			};

			me.html(tLevelTest, renderData).delay(0).then(function () {
				var $steps = me.$element.find(SEL_STEPS);
				$steps.each(function (stepIndex, step) {
					$(step).width(renderData.steps[stepIndex].score + "%");
				});
			});
		},
		"dom:.ets-pr-retake/click": function (evt) {
			var me = this;
			ct.useraction({
				"action.levelTest": "1"
			});
			window.open((MODULE_CONFIG.levelTestPath || "/school/content/leveltest.aspx") + "?testid=" + me.templateLevelId + "&isredo=true");
		}

	});
});
