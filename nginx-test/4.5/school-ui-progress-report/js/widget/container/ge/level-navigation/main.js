define([
	"when",
	"poly",
	"jquery",
	"snapsvg",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"school-ui-shared/utils/progress-state",
	"template!./level-navigation.html"
], function (when, poly, $, snapsvg, Widget, Load, progressState, tLevelNav) {
	"use strict";

	var STAGES = {
		"beginner" 			: {blurbId:659668, blurbTextEn:"Beginner", levelCodes:["0A","0B","1"]},
		"elementary" 		: {blurbId:659669, blurbTextEn:"Elementary", levelCodes:["2","3","4"]},
		"intermediate" 		: {blurbId:659670, blurbTextEn:"Intermediate", levelCodes:["5","6","7"]},
		"upperIntermediate" : {blurbId:659671, blurbTextEn:"Upper Intermediate", levelCodes:["8","9","10"]},
		"advanced" 			: {blurbId:659672, blurbTextEn:"Advanced", levelCodes:["11","12","13"]},
		"upperAdvanced" 	: {blurbId:659673, blurbTextEn:"Upper Advanced", levelCodes:["14"]}
	};

	var $ELEMENT = "$element";

	var CLS_SELECTED = "ets-pr-selected";

	var SEL_ICON = ".ets-pr-level-icon";
	var SEL_SELECTED = "." + CLS_SELECTED;

	var DATA = "_data";
	var PROP_INIT_DATA = "_init_data";
	var SELECTED_LEVEL = "_selected_level";

	var STATE_NORMAL = 'normal';

	function selectIcon($target) {
		$target.find("i svg path[data-d-select]").each(function(){
			var d_select = $(this).data("d-select");
			snapsvg($(this)[0]).animate({
				d: d_select
			}, 100);
		});
	}

	function unSelectIcon() {
		var me = this;
		me.$element.find("." + CLS_SELECTED).find("i svg path[data-d-origin]").each(function(){
			var d_origin = $(this).data("d-origin");
			snapsvg($(this)[0]).animate({
				d: d_origin
			}, 100);
		});
	}

	function pointerTo($target) {
		this.publish('progress-report/ge/callout/pointer-to', $target);
	}

	return Widget.extend(function($element, path, renderData){
		this[PROP_INIT_DATA] = renderData;
	},{
		"progressState" : progressState,
		"sig/start" : function(){
			var me = this;
			var data = me[PROP_INIT_DATA];
			var currentEnroll = data.currentEnroll;
			var currentCourseEnroll = data.course.currentEnroll;

			//save aviliabe level in each stages
			var levelStages = [];
			var breakToLevel;
			var levels = data.course.children;

			me[DATA] = data.course.children;

			//each level in course levels data
			for(var index in levels){
				breakToLevel = false;
				//each level number in STAGES
				for (var name in STAGES){
					for (var num in STAGES[name].levelCodes){
						if(levels[index].levelCode === STAGES[name].levelCodes[num]){
							var stage = levelStages[levelStages.length - 1];
							if(stage && stage.name === name){
								stage.levels.push(levels[index]);
							}
							else{
								levelStages.push({
									name : name,
									blurbId : STAGES[name].blurbId,
									blurbTextEn : STAGES[name].blurbTextEn,
									levels : [ levels[index] ]
								})
							}
							breakToLevel = true;
							break;
						}
					}
					if(breakToLevel){
						break;
					}
				}
			}
			//levelStages looks like : [{name:"beginner", blurb:"beginner", levels:[{/**/},{/**/},{/**/}]},]

			return me.html(tLevelNav, {
				currentLevelId : currentEnroll.studentLevel.id,
				levelStages : levelStages,
				levelContent : me[DATA]
			}).then(function () {
				//landing logic
				var defaultLevel = currentCourseEnroll && currentCourseEnroll.studentLevel || data.course.children[0];
				var archiveId = defaultLevel.archiveId;
				me.load(defaultLevel.id, {
					e10: archiveId && archiveId.e10,
					e13: archiveId && archiveId.e13
				});
				pointerTo.call(me, me[$ELEMENT].find(SEL_SELECTED));
			});
		},

		"dom:.ets-pr-level-icon/mouseenter" : function(e){
			var $target = $(e.currentTarget);
			if ($target.data('state') !== STATE_NORMAL) {
				this.publish('progress-report/ge/state-circle/hovered', $target.data("id"));
			}
		},
		"dom:.ets-pr-level-icon/mouseleave": function () {
			this.publish('progress-report/ge/state-circle/hovered', null);
		},
		"dom:.ets-pr-level-icon/click" : function(element){
			var me = this;
			var $target = $(element.currentTarget);
			var $data = $target.data();
			var id = $data.id;

			if ($target.data('state') !== STATE_NORMAL && !$target.hasClass(CLS_SELECTED)) {
				me.load(id, {
					e10: $data.archiveE10Id,
					e13: $data.archiveE13Id
				});
				pointerTo.call(me, $target);
			}
		},
		"load" : function(levelId, archiveId){
			var me = this;
			var levelIndex = -1;
			var $allIcon;

			if(me[SELECTED_LEVEL] !== levelId){

				me.publish('progress-report/ge/state-circle/selected', levelId);
				$allIcon = me.$element.find(SEL_ICON);

				me[DATA] && me[DATA].forEach(function(levelContent, index){
					if(levelContent.id === levelId){
						levelIndex = index;
					}
				});

				if(levelIndex !== -1){
					me[SELECTED_LEVEL] = levelId;
					Load.loadLevel("ge", levelId, archiveId);

					unSelectIcon.call(me);

					//change style
					$allIcon.removeClass(CLS_SELECTED);
					$($allIcon[levelIndex]).addClass(CLS_SELECTED);
					selectIcon($($allIcon[levelIndex]));
				}
			}
		}
	});
});
