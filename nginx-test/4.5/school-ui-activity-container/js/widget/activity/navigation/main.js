define([
	"jquery",
	"when",
	"troopjs-ef/component/widget",
	"template!./navigation.html",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"poly/json"
], function ActivityNavigationModule($, when, Widget, tNav, progressState, typeidParser) {
	"use strict";
	var $ELEMENT = "$element";

	/*!
	 * widget constants
	 */
	var UNDEF;
	var ACTIVITY_ID = "_activity_id";
	var CURRENT_TYPE = "_current_type";
	var STEP_ID = "_step_id";
	var SUMMARY = "summary";
	var ACTIVITY = "activity";
	var RENDER_PROMISE = "_render_promise";

	var CLS_HIDE = "ets-none";
	var CLS_ACT_NAV_ACTIVE = "ets-ui-acc-act-nav-active";

	var HUB_SHOW_LOADING = "activity-container/show/loading";
	var HUB_SUBMIT_SCORE = 'activity/submit/score/proxy';

	function render(){
		var me = this;
		if(me[STEP_ID] && me[CURRENT_TYPE]){
			//to make sure render function to call me.show() or me.hide() in calling order
			//we use promise to keep this order
			me[RENDER_PROMISE] = me[RENDER_PROMISE].then(function () {
				return me.query(me[STEP_ID] + ".progress,.children").spread(function (step) {
					var activities = step.children || [];

					var hasStepPassed = progressState.hasPassed(step.progress.state);
					var activity_index;

					//check every activity pass state

					// The code query way is for at-preview optimizing
					var q_activity_progress = activities.map(function(activity) {
						return activity.progress.id;
					});

					return me.query(q_activity_progress).spread(function() {
						activities.forEach(function(activity, index) {
							activities[index].hasPassed = progressState.hasPassed(activity.progress.state);
						});
						if(me[CURRENT_TYPE] !== SUMMARY){
							activities.forEach(function(activity, index){
								if(activity.id === me[ACTIVITY_ID]){
									activity_index = index;
								}
							});
						}
						else{
							activity_index = activities.length;
						}

						return me.html(tNav, {
							"index": activity_index,
							"activities": activities,
							"currentType" : me[CURRENT_TYPE],
							"hasStepPassed": hasStepPassed
						})
							.then(function(){
								activity_index !== UNDEF ? me.show() : me.hide();
							});
					});
				});
			}).otherwise(function ignoreError() {
			});
		}
	}


	return Widget.extend({
		"sig/start": function () {
			this[RENDER_PROMISE] = when.resolve();
		},
		"hub:memory/load/step":function(step){
			var me = this;
			if(step){
				me[STEP_ID] = step.id;
				render.call(me);
			}
		},
		"hub:memory/load/results":function(results){
			var me = this;
			if(results){
				me[CURRENT_TYPE] =  results.activity === SUMMARY ?
										SUMMARY :
										ACTIVITY;
				me[ACTIVITY_ID] = results.activity && results.activity.id;
				render.call(me);
			}
		},
		"hide" : function(){
			this[$ELEMENT].addClass(CLS_HIDE);
		},
		"show" : function(){
			this[$ELEMENT].removeClass(CLS_HIDE);
		},
		"hub/activity/update/progress" : function(){
			render.call(this);
		},
		"dom:[data-action='route']/click": function onRouteActivity($event) {
			var me = this;
			var $target = $($event.target);
			var actId = $target.data("act-id");

			if(!$target.hasClass(CLS_ACT_NAV_ACTIVE)) {
				// If clicking navigation button also try to submit score
				me.publish(HUB_SUBMIT_SCORE);
				me.publish("load", {
					"activity" : actId ? typeidParser.parseId(actId) : SUMMARY
				});

				// navigate activity for good user experience
				//use for render this time
				me[ACTIVITY_ID] = actId;
				me[CURRENT_TYPE] = actId ? ACTIVITY : SUMMARY;
				actId && me.publish(HUB_SHOW_LOADING, actId);
				render.call(me);
			}

		}
	});
});
