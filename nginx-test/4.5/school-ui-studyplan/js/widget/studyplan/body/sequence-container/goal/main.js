define([
	"when",
	"jquery",
	"json2",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
    "school-ui-studyplan/utils/state-parser",
    "school-ui-studyplan/enum/studyplan-state",
    "school-ui-studyplan/enum/studyplan-item-state",
	"template!./goal.html"
	],function(when, $, JSON, Widget, loom, weave, stateParser, studyplanState, itemState, tGoal){
	"use strict";

	var UNDEF;

	var $ELEMENT = "$element";

	var WIDGET_PACE = "school-ui-studyplan/shared/pace-config/main";
	var WIDGET_PROGRESS = "school-ui-studyplan/widget/studyplan/body/sequence-container/goal/progress/main";
	var WIDGET_MOVEON = "school-ui-studyplan/widget/studyplan/body/sequence-container/goal/moveon/main";
	var WIDGET_RESTART = "school-ui-studyplan/widget/studyplan/body/sequence-container/goal/restart/main";

	var SEL_PROGRESS_HOLDER = ".ets-sp-cfg-hd";
	var SEL_ACTIVITY_HOLDER = ".ets-sp-cfg-ft";
	var SEL_PACE_HOLDER = ".ets-sp-cfg-bd";
	var CLS_BLANK = "ets-sp-blank";

	var DATA_GOAL = "_data_goal";

	return Widget.extend(function($element, path, itemData){
		var me = this;
		me[DATA_GOAL] = itemData;
	},{
		"hub:memory/load/studyplan" : function(studyplan){
			if(studyplan){
				var me = this;
				var isNopace;

				me[DATA_GOAL].properties.paces.forEach(function (e) {
					if(e.pacePoints === 0){
						isNopace = e.selected;
					}
				});

				return when.all([
					me.html(tGoal),
					me.query(studyplan.id + ".progress,.items.progress")
				]).spread(function (templateArray, studyplanData) {
					var $moveon;
					var $progress;
					var $pace;
					var $restart;

					var studyplan = studyplanData[0];
					var goal;

					studyplan.items.forEach(function(item){
						if(item.typeCode === "goal"){
							goal = item;
						}
					});

					//weave progress widget
					me[$ELEMENT].find(SEL_PROGRESS_HOLDER).append(
							$progress = $("<div></div>")
								.attr(loom.weave, WIDGET_PROGRESS)
								.data("studyplan", studyplan)
						);
					$progress.weave();

					//check state
					if(studyplan.progress.state === studyplanState.Completed){

						me[$ELEMENT].find(SEL_ACTIVITY_HOLDER).append(
							$moveon = $("<div></div>")
								.attr(loom.weave, WIDGET_MOVEON)
								.data("studyplan", studyplan)
						);
						$moveon.weave();
					}
					else{
						me[$ELEMENT].find(SEL_PACE_HOLDER).append(
							$pace = $("<div></div>")
								.attr(loom.weave, WIDGET_PACE)
								.data("mode", "view")
								.data("config", $.extend({}, goal && goal.properties, goal && goal.progress.properties))
						);
						$pace.weave();
						// when studyplan is no-pace, there is 'no pace', and can not restart
						if(isNopace){
							me[$ELEMENT].find(SEL_ACTIVITY_HOLDER).addClass(CLS_BLANK);
						}
						else{
							me[$ELEMENT].find(SEL_ACTIVITY_HOLDER).append(
								$moveon = $("<div></div>")
									.attr(loom.weave, WIDGET_RESTART)
									.data("studyplan", studyplan)
							);
							$moveon.weave();
						}
					}
				});
			}
		}
	});
});
