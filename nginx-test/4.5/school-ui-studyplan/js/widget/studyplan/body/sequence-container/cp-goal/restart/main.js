define([
	"jquery",
	"poly",
	"when",
	"troopjs-ef/command/service",
	"troopjs-data/cache/component",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/studyplan-update-helper",
    "school-ui-studyplan/enum/studyplan-velocity",
	"template!./restart.html"
],function($, Poly, when, CommandService, Cache, Widget, typeidParser, updateHelper, studyplanVelocity, tRestart){
	"use strict";

	var UNDEF;

	var DATA_STUDYPLAN = "_data_studyplan";
	var $ELEMENT = "$element";

	var PACE_POINTS = "_pacePoints";

	var SEL_CONFIRM_WRAPPER = ".ets-sp-goal-restart-confirm-wrapper",
		SEL_RESTART_LINK = ".ets-sp-goal-restart-link";

	var CLS_PRIMARY = "btn-primary btn-m btn";
	var CLS_NONE = "ets-none";

	var SUBSCRIBE_COMMAND = 'campus_student_studyplan_email_subscrib/SubscribStudyPlanEmail';
	var UNSUBSCRIBE_COMMAND = "campus_student_studyplan_email_subscrib/UnsubscribStudyPlanEmail";

	return Widget.extend(function(){
		var me = this;
		me[DATA_STUDYPLAN] = me[$ELEMENT].data("studyplan");
	},{
		"sig/start" : function(){
			var me = this;
			var subscriptionPromise = me.query('campus_student_studyplan_email_subscription!current','ccl!"CoachingEmail.enabled"');
			return when(subscriptionPromise)
				.then(function(data){
					return me.html(tRestart, {
						isSubscribed : data[0].isSubscribed,
						emailEnable: data[1].value,
					});
				})
				.then(function(){
					if(me[DATA_STUDYPLAN] && me[DATA_STUDYPLAN].progress.properties.velocity === studyplanVelocity.Crashed){
						me[$ELEMENT].find(SEL_RESTART_LINK).addClass(CLS_PRIMARY);
					}
				});

		},

		"hub/config/pace-change": function(paces){
			var me = this;
			var t = paces.every(function(e, i){
				if (e.selected) {
					me[PACE_POINTS] = e.pacePoints;
					return false;
				} else {
					return true;
				}
			});
		},

		"dom:.ets-sp-goal-restart-link/click": function(){
			var me = this;

			me[$ELEMENT].find(SEL_RESTART_LINK).addClass(CLS_NONE);
			me[$ELEMENT].find(SEL_CONFIRM_WRAPPER).removeClass(CLS_NONE);
			me.publish("config/pace-config/mode", "edit");
		},

		"dom:.ets-sp-goal-restart-confirm/click": function(){
			var me = this;

			updateHelper.restartStudyplan({
				reason : "",
				pacePoints : me[PACE_POINTS]
			}).then(function(goalItem){
				me.publish("load", {
					studyplan_item : typeidParser.parseId(goalItem.id)
				});
			});
		},

		"dom:.ets-sp-goal-restart-cancel/click": function(){
			var me = this;

			me.publish("config/pace-config/mode", "view");
			me[$ELEMENT].find(SEL_RESTART_LINK).removeClass(CLS_NONE);
			me[$ELEMENT].find(SEL_CONFIRM_WRAPPER).addClass(CLS_NONE);
		},

		"dom:.cp-goal-change/click": function(){
			var me = this;
			me[$ELEMENT].find('.ets-sp-goal-restart').addClass('goal-changing');
			me.publish("config/pace-config/mode", "edit");
			me.publish("studyplan/goal/progress/edit/show" ,true);
			me.publish("studyplan/goal/body/status/update" , {
				action: 1,
				class: 'cp-cfg-edit'
			});
		},

		"dom:.cp-goal-set/click": function(){
			var me = this;
			me[$ELEMENT].find('.ets-sp-goal-restart').removeClass('goal-changing');
			updateHelper.restartStudyplan({
				reason : "",
				pacePoints : me[PACE_POINTS]
			}).then(function(goalItem){
				me.publish("load", {
					studyplan_item : typeidParser.parseId(goalItem.id)
				});
			});
		},

		"dom:.cp-goal-cancel/click": function(){
			var me = this;
			me[$ELEMENT].find('.ets-sp-goal-restart').removeClass('goal-changing');
			me.publish("config/pace-config/mode", "view");
			me.publish("studyplan/goal/progress/edit/show" ,false);
			me.publish("studyplan/goal/body/status/update" ,  {
				action: 0,
				class: 'cp-cfg-edit'
			});
		},

		"dom:.goal-mail input/click": function(){
			var me = this;
			var $input = me[$ELEMENT].find('input');
			var command = $input.is(':checked') ? SUBSCRIBE_COMMAND : UNSUBSCRIBE_COMMAND;
			me.publish(command);
		}
	});
});
