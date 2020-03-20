define([
	"jquery",
	"when",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/enum/studyplan-mode",
	"school-ui-studyplan/enum/studyplan-velocity",
	"poly"
], function studyplanHashHandle($, when, Widget, Parser, stateParser, studyplanMode, velocityState, poly) {
	"use strict";

	var UNDEF;

	var UNIT_ID = "unit_id",
		TEMPLATE_UNIT_ID = "template_unit_id",
		LESSON_ID = "lesson_id",
		TEMPLATE_LESSON_ID = "template_lesson_id",
		STEP_ID = "step_id",
		ACTIVITY_ID = "activity_id",
		PREFIX = "prefix",
		STUDYPLAN_ID = "studyplan_id",
		STUDYPLAN_ITEM_ID = "studyplan_item_id",
		RESULTS = "results",
		PLATFORM_VERSION = "platformVersion";

	var CONFIG = "config",
		STUDY = "study",
		PREFIX_TEMP = "template_unit;";

	function activityContainerToStudyplanHash(){
		var me = this;

		if(me[TEMPLATE_UNIT_ID] && me[TEMPLATE_LESSON_ID] && me[PREFIX] == "school") {
			me.query("campus_student_unit_studyplan!" + me[TEMPLATE_UNIT_ID] + ".studyPlan.items,.studyPlan.progress").spread(function(unitStudyplan){

				var studyplan_id = unitStudyplan.studyPlan.id;
				var studyplan = unitStudyplan.studyPlan;
				var studyplanItem_id;
				var expandLessonQ = [];

				if (unitStudyplan.mode === studyplanMode.Study) {
					studyplan.items.forEach(function(e, i){
						if(e.typeCode == "lesson") {
							expandLessonQ.push("pc_student_lesson_map!" + e.properties.templateLessonId);
						}
						else {
							expandLessonQ.push(UNDEF);
						}
					});

					me.query(expandLessonQ).spread(function(){
						Array.prototype.forEach.call(arguments, function (result, index) {
							if(result && result.lesson && (result.lesson.templateLessonId === me[TEMPLATE_LESSON_ID])){
								studyplanItem_id = studyplan.items[index].id;
							}
						});

						if(studyplanItem_id) {
							if(me[ACTIVITY_ID] || me[STEP_ID]) {
								me[STUDYPLAN_ID] = Parser.parseId(studyplan_id);
								me[STUDYPLAN_ITEM_ID] = Parser.parseId(studyplanItem_id);
							}
							else if(me[TEMPLATE_LESSON_ID]) {
								me.publish("load", {
									"prefix": STUDY,
									"studyplan": Parser.parseId(studyplan_id),
									"studyplan_item": Parser.parseId(studyplanItem_id)
								});
							}
						}
						else {
							loadConfig.call(me, PREFIX_TEMP + me[TEMPLATE_UNIT_ID]);
						}
					});

				}
				// other states (close activity container and use config flow)
				else {
					// for auto test tools
					if(window.location.search.indexOf("unlock") < 0) {
						loadConfig.call(me, PREFIX_TEMP + me[TEMPLATE_UNIT_ID]);
					}
				}

			});
		}
	}

	function findStudyplanItem (unitId) {
		var me = this;
		var queryString = "campus_student_unit_studyplan!" + unitId + ".studyPlan";

		me.query(queryString + ".items").spread(function(data){
			return data.mode === studyplanMode.Study ?
				me.query(queryString + ".progress") : [data];
		}).spread(function(data){
			var studyplan = data.studyPlan;
			var studyplanID =  Parser.parseId(studyplan.id);
			switch(data.mode) {
				case studyplanMode.Create: //create
					me.publish("load", {
						"prefix": CONFIG,
						"unit": PREFIX_TEMP + studyplan.properties.templateUnitId
					});
					break;
				case studyplanMode.Locked: //locked
					me.publish("load", {
						"prefix" : STUDY,
						"studyplan" : studyplanID,
						"studyplan_item" : UNDEF
					});
					break;
				case studyplanMode.Study: //study
					var suggestedItems = studyplan.items.filter(function (item) {
						return studyplan.progress && item.itemIndex === studyplan.progress.properties.suggestedItemIndex;
					});
					var suggestedItem = suggestedItems.length ? suggestedItems[0] : studyplan.items[0];
					var studyplanItemID = Parser.parseId(suggestedItem.id);

					me.publish("load", {
						"prefix" : STUDY,
						"studyplan" : studyplanID,
						"studyplan_item" : studyplanItemID
					});
					break;
			}
		});
	}

	function loadConfig(unitID) {
		this.publish("load", {
			"prefix": CONFIG,
			"unit": unitID,
			"step": UNDEF // close activity
		});
	}

	function hashExceptionHandle(platformVersion, prefix, results) {
		var me = this;

		if(prefix && results && platformVersion && platformVersion.version === "2.0") {
			switch (prefix) {
				case CONFIG:
					me.query("campus_student_unit_studyplan!" + results.unit.templateUnitId + ".studyPlan.items,.studyPlan.progress").spread(function(data){
						var studyplan = data.studyPlan;

						if (data.mode !== studyplanMode.Create) {
							var suggestedItems = studyplan.items.filter(function (item) {
								return studyplan.progress && studyplan.progress.properties && item.itemIndex === studyplan.progress.properties.suggestedItemIndex;
							});
							var suggestedItem = suggestedItems.length ? suggestedItems[0] : studyplan.items[0];

							me.publish("load", {
								"prefix": "study",
								"studyplan": Parser.parseId(studyplan.id),
								"studyplan_item": data.mode === studyplanMode.Locked ?
									UNDEF :
									Parser.parseId(suggestedItem.id)
							});
						}
					});
					break;
				case STUDY:
					if(!results.studyplan) {
						findStudyplanItem.call(me, "current");
					}
					else if(results.studyplan && !results.studyplan_item){
						if(results.unit_studyplan.mode === studyplanMode.Study){
							findStudyplanItem.call(me, results.studyplan.properties.templateUnitId);
						}
					}
					else if(results.studyplan && results.studyplan_item) {
						if(results.studyplan_item.typeCode !== "goal") {
							me.query(results.studyplan.id + ".progress").spread(function(studyplan){
								if(velocityState.Crashed === studyplan.progress.properties.velocity){
									var goalId;
									studyplan.items.forEach(function(item){
										if(item.typeCode === "goal"){
											goalId = Parser.parseId(item.id);
										}
									});
									//check the goal crashed to change hash to goal
									me.publish("load", {
										"studyplan_item": goalId
									});
								}
							});

						}
						else if(me[RESULTS] && me[RESULTS].studyplan && me[RESULTS].studyplan.id === results.studyplan.id){
							//when load goal item
							//update the sequence to catch the "Crshed" state and lock the sequence
							me.publish("studyplan/sequence/update");
						}
					}
					break;
			}
		}

		me[RESULTS] = results;
	}

	return Widget.extend({
		"hub:memory/context": function(context, courseEnroll, platformVersion){
			var me = this;
			hashExceptionHandle.call(me, me[PLATFORM_VERSION] = platformVersion, me[PREFIX], me[RESULTS]);
		},

		"hub:memory/load/prefix": function(prefix) {
			var me = this;
			me[PREFIX] = prefix;
			activityContainerToStudyplanHash.call(me);
		},

		"hub:memory/load/unit": function(unit){
			var me = this;
			if(!unit) {
				return;
			}
			me[UNIT_ID] = Parser.parseId(unit.id);
			me[TEMPLATE_UNIT_ID] = unit.templateUnitId;
			activityContainerToStudyplanHash.call(me);
		},

		"hub:memory/load/lesson": function(lesson){
			var me = this;
			if(!lesson) {
				return;
			}
			me[LESSON_ID] = Parser.parseId(lesson.id);
			me[TEMPLATE_LESSON_ID] = lesson.templateLessonId;
			activityContainerToStudyplanHash.call(me);
		},

		"hub:memory/load/step": function(step){
			var me = this;
			if(!step) {
				return;
			}
			me[STEP_ID] = Parser.parseId(step.id);
		},

		"hub:memory/load/activity": function(activity){
			var me = this;
			if(!activity) {
				return;
			}
			me[ACTIVITY_ID] = Parser.parseId(activity.id);
		},

		"hub:memory/load/studyplan": function(studyplan){
			var me = this;
			if(!studyplan){
				return;
			}
			me[STUDYPLAN_ID] = Parser.parseId(studyplan.id);
		},

		"hub:memory/load/studyplan_item": function(studyplan_item){
			var me = this;
			if(!studyplan_item){
				return;
			}
			me[STUDYPLAN_ITEM_ID] = Parser.parseId(studyplan_item.id);
		},

		"hub:memory/route": function(uri){
			var me = this;
			var _prefix = me[PREFIX];

			me[PREFIX] = uri.path ? uri.path[0] : STUDY;
			if(_prefix !== me[PREFIX]){
				hashExceptionHandle.call(me, me[PLATFORM_VERSION], me[PREFIX], me[RESULTS]);
			}
		},

		"hub/enrollment/update": function() {
			var me = this;

			return me.publish("load", {
                "studyplan": UNDEF,
                "studyplan_item": UNDEF,
				"command": UNDEF,
				"prefix" : UNDEF,
				"unit" : UNDEF
            });
		},

		"hub:memory/load/results": function(results) {
			var me = this;

			if (!results) {
				return;
			}

			hashExceptionHandle.call(me, me[PLATFORM_VERSION], me[PREFIX] = results.prefix, results);
		},

		"hub:memory/load/config" : function(unitID) {
			var me = this;
			findStudyplanItem.call(me, unitID);
		},

		"hub/school/interface/get/activity-container/closeHash": function(){
			var me = this;

			return [{
				"prefix": STUDY,
				"studyplan": me[STUDYPLAN_ID],
				"studyplan_item": me[STUDYPLAN_ITEM_ID]
			}]
		}
	});
});
