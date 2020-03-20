define([
	"when",
	"jquery",
	"json2",
	"lodash",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-shared/utils/progress-state",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/enum/studyplan-state",
	"school-ui-studyplan/enum/studyplan-item-state",
	"school-ui-studyplan/enum/studyplan-velocity",
	"template!./goal.html"
], function (when, $, JSON, _, Widget, loom, weave, progressState, stateParser, studyplanState, itemState, velocityState, tGoal) {
	"use strict";

	var $ELEMENT = "$element";

	var WIDGET_PACE = "school-ui-studyplan/shared/cp-pace-config/main";
	var WIDGET_PROGRESS = "school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/progress/main";
	var WIDGET_MOVEON = "school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/moveon/main";

	var SEL_PROGRESS_HOLDER = ".ets-sp-cfg-hd";
	var SEL_ACTIVITY_HOLDER = ".ets-sp-cfg-ft";
	var SEL_PACE_HOLDER = ".ets-sp-cfg-bd";
	var SEL_CONTAINER = ".ets-sp-cfg";

	var DATA_GOAL = "_data_goal";

	var CCL_ENABLE_LEVELTEST = 'ccl!"school.courseware.enableleveltest"';
	var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

	function hasState(state) {
		return this & state;
	}

	function isLessonItem(item) {
		return item.typeCode === 'lesson';
	}

	function completedItem(item) {
		return hasState.call(item.progress.state, itemState.Completed);
	}

	function isUnitComplete(unitStudyPlan, studyplanState){
		return unitStudyPlan.progress.state === studyplanState.Completed
	}

	return Widget.extend(function ($element, path, itemData) {
		var me = this;
		me[DATA_GOAL] = itemData;
	}, {
		"hub:memory/load/results": function (results) {
			var studyplan = results.studyplan;
			if (studyplan) {
				var me = this;
				var isNopace;
				me[DATA_GOAL].properties.paces.forEach(function (e) {
					if (e.pacePoints === 0) {
						isNopace = e.selected;
					}
				});

				return when.all([
					me.query(studyplan.id + ".progress,.items.progress"),
					me.query('campus_student_unit_studyplan!current.studyPlan.progress,.studyPlan.items.progress,.studentUnit.children.progress.detail,.studentUnit.children.lessonImage,.studentUnit.parent.parent')
				]).spread(function (studyplanData, unit_studyplan) {
					var statusPromise = me.getStatusKey(studyplan, isNopace, results, unit_studyplan[0]);
					var isUnitCompleted = isUnitComplete(studyplan, studyplanState);
					statusPromise.then(function (status) {
						me.html(tGoal, {
							status: "cp-cfg-" + status.key.toLowerCase(),
							isUnitCompleted: isUnitCompleted
						}).then(function () {
							var $moveon;
							var $progress;
							var $pace;

							var studyplan = studyplanData[0];
							var goal;
							if(!isUnitCompleted){
								return;
							}

							studyplan.items.forEach(function (item) {
								if (item.typeCode === "goal") {
									goal = item;
								}
							});

							//weave progress widget
							me[$ELEMENT].find(SEL_PROGRESS_HOLDER).append(
								$progress = $("<div></div>")
									.attr(loom.weave, WIDGET_PROGRESS)
									.data("studyplan", studyplan)
									.data("status", status)
									.data("config", $.extend({}, goal && goal.properties, goal && goal.progress.properties))
							);
							$progress.weave();

							// pace and end status content
							me[$ELEMENT].find(SEL_PACE_HOLDER).append(
								$pace = $("<div></div>")
									.attr(loom.weave, WIDGET_PACE)
									.data("mode", "view")
									.data("status", status)
									.data("studyplan", studyplan)
									.data("config", $.extend({}, goal && goal.properties, goal && goal.progress.properties))
							);
							$pace.weave();

							// action
							me[$ELEMENT].find(SEL_ACTIVITY_HOLDER).append(
								$moveon = $("<div></div>")
									.attr(loom.weave, WIDGET_MOVEON)
									.data("studyplan", studyplan)
									.data("status", status)
							);
							$moveon.weave();
						});
					});
				});
			}
		},

		'hub/studyplan/goal/body/status/update': function (stauts) {
			var me = this;
			if (stauts.action === 0) {
				me[$ELEMENT].find(SEL_CONTAINER).removeClass(stauts.class);
			} else {
				me[$ELEMENT].find(SEL_CONTAINER).addClass(stauts.class);
			}
		},

		"getStatusKey": function (studyplan, isNopace, results, unit_studyplan) {
			var me = this;

			return me.checkIfTestIsAvailable({
				studyPlan: unit_studyplan.studyPlan,
				course: unit_studyplan.studentUnit.parent.parent,
				level: unit_studyplan.studentUnit.parent,
				unit: unit_studyplan.studentUnit
			}).then(function (testResult) {

				var unit = results.unit;
				var units = unit.parent.children;
				var unitLen = units.length;

				var completed = isUnitComplete(studyplan, studyplanState) ? 'Completed' : '';
				var nopace = isNopace ? 'Nopace' : '';
				var stateCollection = stateParser.parseFlag(velocityState, studyplan.progress.properties.velocity);
				var velocity = '';
				_.find(stateCollection, function (value, key) {
					if (value) {
						velocity = key;
					}
				});

				var key = completed || nopace || velocity;
				var code = key.toLowerCase();

				if (completed) {
					code = "unit_complete";

					if (unit.templateUnitId === units[unitLen - 1].templateUnitId) {
						code = "all_unit_complete";
					}

					if (unit.templateUnitId === units[unitLen - 1].templateUnitId &&
						testResult.levelTestIsDone) {
						code = "level_complete";
					}

					// for spin course
					if (unit.templateUnitId === units[unitLen - 1].templateUnitId &&
						results.course.courseTypeCode !== 'GE') {
						code = "course_change";
					}
				}

				return {
					key: key,
					code: code
				};
			});
		},

		checkLevelIsCompleted: _.memoize(function (data) {
			var studyPlan = data.studyPlan;
			var level = data.level;
			var unit = data.unit;

			var lessons = _.filter(studyPlan.items, isLessonItem);
			var completedLessons = _.filter(lessons, completedItem);
			var allLessonsAreCompleted = lessons.length === completedLessons.length;
			var unitIsCompleted = studyPlan.progress && hasState.call(studyPlan.progress.state, studyplanState.Completed);
			var isLastUnit = (level.children.length - 1) === _.indexOf(level.children, unit);

			return isLastUnit && unitIsCompleted && allLessonsAreCompleted;
		}),

		checkIfTestIsAvailable: function (data) {
			var me = this;
			var level = data.level;
			var resultDefer = when.defer();
			var result = {};
			if (me.checkLevelIsCompleted(data)) {
				me.query(CCL_ENABLE_LEVELTEST, MSS_LEVEL_TEST_VERSION).spread(function (cclEnableLevelTest, mssLevelTestVersion) {
					var enableLevelTest = cclEnableLevelTest.value.toLowerCase() === 'true';
					var levelTestVersion = parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);

					result.canDoLevelTest = enableLevelTest;
					if (enableLevelTest) {
						return levelTestVersion === 1 ?
							me.query('leveltest_overview!' + level.levelCode).spread(function (leveltest) {
								result.levelTestIsDone = leveltest.hasPassed;
								resultDefer.resolve(result);
							}) :
							me.query(level.id + '.levelTest.progress').spread(function (level) {
								result.levelTestIsDone = Boolean(level.levelTest && progressState.hasPassed(level.levelTest.progress.state));
								resultDefer.resolve(result);
							});
					}
					resultDefer.resolve(result);
				});
			} else {
				resultDefer.resolve({
					canDoLevelTest: false,
					levelTestIsDone: false
				});
			}
			return resultDefer.promise;
		}
	});
});
