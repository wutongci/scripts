define([
	"jquery",
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/studyplan-update-helper",
    "school-ui-studyplan/enum/studyplan-velocity",
	"template!./restart.html"
],function($, Poly, Widget, typeidParser, updateHelper, studyplanVelocity, tRestart){
	"use strict";

	var UNDEF;

	var DATA_STUDYPLAN = "_data_studyplan";
	var $ELEMENT = "$element";

	var PACE_POINTS = "_pacePoints";

	var SEL_CONFIRM_WRAPPER = ".ets-sp-goal-restart-confirm-wrapper",
		SEL_RESTART_LINK = ".ets-sp-goal-restart-link";

	var CLS_PRIMARY = "btn-primary btn-m btn";
	var CLS_NONE = "ets-none";

	return Widget.extend(function(){
		var me = this;
		me[DATA_STUDYPLAN] = me[$ELEMENT].data("studyplan");
	},{
		"sig/start" : function(){
			var me = this;
			return me.html(tRestart).then(function(){
				if(me[DATA_STUDYPLAN] && me[DATA_STUDYPLAN].progress.properties.velocity === studyplanVelocity.Crashed){
					me[$ELEMENT].find(SEL_RESTART_LINK).addClass(CLS_PRIMARY);
				}
			});;
		},

		"hub/config/pace-change": function(paces){
			var me = this;

			paces.every(function(e, i){
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
		}
	});
});
