define([
	"when",
	"poly",
	"jquery",
	"client-tracking",
	"troopjs-ef/component/widget",
	"template!../level-test.html"
], function (when, poly, $, ct, Widget, tLevelTest) {
	"use strict";

	var UNIT_STRUCTURE_URL = "/services/school/courseware/GetUnitStructure.ashx";
	var UNIT_SCORE_URL = "/services/school/courseware/GetUnitScore.ashx";

	var SEL_STEPS = ".ets-pr-score-progress";
	var SEL_FLAG = ".ets-pr-flag";

	var $ELEMENT = "$element";
	var SITE_VERSION = "siteVersion";
	var LANGUAGE_CODE = "languageCode";
	var PARTNER_CODE = "partnerCode";
	var MEMBER_ID = "memberid";
	var LEVEL_ID = "_levelid";
	var RETAKE_LEVEL_ID = "_retake_levelid";
	var CONTEXT = "_context";
	var MARKET_CODE = "marketCode";
	var DATA = "_data";


	return Widget.extend({
		"hub:memory/load/level": function onLevel(page, data){
			var me = this;
			me[RETAKE_LEVEL_ID] = data.level.legacyLevelId;
			me.query("leveltest_best_levelid!" + data.level.levelCode).spread(function(data){
				me.render(me[CONTEXT], me[LEVEL_ID] = data && data.levelId);
			});
		},
		"hub:memory/context":function(context){
			var me = this;
			if(context){
				me.render(me[CONTEXT] = context, me[LEVEL_ID]);
			}
		},
		"render" : function(context, levelId){
			var me = this;

			if(context && levelId){

				me[SITE_VERSION] = context[SITE_VERSION];
				me[LANGUAGE_CODE] = context.cultureCode;
				me[PARTNER_CODE] = context[PARTNER_CODE];
				me[MEMBER_ID] = context.user.member_id;
				me[MARKET_CODE] = context.countryCode;

				when.all([
					me.getUnitStructure(),
					me.getUnitScore()
				]).spread(function(unitStructure, unitScore){
					var structure = unitStructure && unitStructure[0];
					var score = unitScore && unitScore[0];
					var passPercent;
					var steps;
					//we need to calc this value, because backend service api do not cover this status
					var attempted;


					if(structure && score){
						steps = structure.Unit.Lessons[0].Steps.map(function(item, index){
							return {
								name : item.StepTypeName
							}
						});

						score.Unit.Lessons[0].Steps.forEach(function(item, index){
							var step = steps[index];
							//Step State:  2: Incomplete, 3: Complete
							attempted = attempted || item.State === 3;

							step.correct = item.CorrectAnswerCount;
							step.incorrect = item.QuestionCount - item.CorrectAnswerCount;
							step.score = item.Score;
							step.passed = item.Score >= structure.Unit.Lessons[0].StepPassPercent;
						});

						me[DATA] = {
							retakeLevelId : me[RETAKE_LEVEL_ID],
							levelId : me[LEVEL_ID],
							overallScore : score.Unit.Score,
							steps : steps,
							passPercent : structure.Unit.StepPassPercent,
							//Lesson State,  0： InProgress, 1: Passed
							passed : score.Unit.Lessons[0].State === 1
						};

						if(attempted){
							me.html(tLevelTest, me[DATA]).delay(0).then(function(){
								var $steps = me[$ELEMENT].find(SEL_STEPS);
								$steps.each(function(index, step){
									$(step).css({
										width : me[DATA].steps[index].score + "%"
									})
								});

							});
						}
						else{
							me[$ELEMENT].empty();
						}
					}
				});
			}
			else{
				me[$ELEMENT].empty();
			}

		},
		"getUnitStructure" : function(){
			var me = this;
			return me[LEVEL_ID] && me.publish("ajax", {
				url : UNIT_STRUCTURE_URL,
				data : {
					type : 1,
					showBlurbs : 0,
					siteVersion : me[SITE_VERSION],
					languageCode : me[LANGUAGE_CODE],
					partnerCode : me[PARTNER_CODE],
					memberid : me[MEMBER_ID],
					areaCode : "Etown",
					marketCode : me[MARKET_CODE],
					cultureCode : me[LANGUAGE_CODE],
					levelid : me[LEVEL_ID]
				}
			});
		},
		"getUnitScore" : function(){
			var me = this;
			return me[LEVEL_ID] && me.publish("ajax", {
				url : UNIT_SCORE_URL,
				data : {
					type : 2,
					siteVersion : me[SITE_VERSION],
					languageCode : me[LANGUAGE_CODE],
					partnerCode : me[PARTNER_CODE],
					memberid : me[MEMBER_ID],
					levelid : me[LEVEL_ID]
				}
			});
		},

		"dom:.ets-pr-retake/click": function (evt) {
			var me = this;
			ct.useraction({
				"action.levelTest": "1"
			});
			window.open("/school/content/leveltest.aspx?testid=" + me[RETAKE_LEVEL_ID] + "&isredo=true");
		}

	});
});
