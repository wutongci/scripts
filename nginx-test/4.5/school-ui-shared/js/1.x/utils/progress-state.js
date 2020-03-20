define([
	"compose",
	"troopjs-utils/each",
	"troopjs-utils/deferred",
	"school-ui-shared/enum/progress-state",
	"troopjs-ef/component/service",
	"school-ui-shared/utils/query-builder"
], function ProgressStateUtilModule(Compose, Each, Deferred, progressState, Service, queryBuilder) {
	"use strict";
	var SLICE = [].slice;

	return Service.extend({
		"hub:memory/load/enrollment": function loadEnrollment(topic, enrollment) {
			var me = this;
			if(!enrollment) return;
			me.enrollment_id = enrollment.id;
			me.doQueryProgress();
		},
		"queryProgress": function onQueryProgress(res_id, deferred, needChilden, isResNeed){
			var me = this;
			needChilden = needChilden || 0;
			isResNeed = isResNeed || 0;
			me.queryArgs = {"res_id": res_id, "deferred": deferred, "needChilden": needChilden, "isResNeed": isResNeed};
			me.doQueryProgress();
		},
		"doQueryProgress": function onDoQueryProgress(){
			var me = this;

			if(!me.enrollment_id || !me.queryArgs) {
				return;
			}

			var prosURLs = [], prosURL, queryArr;
			var enrollment_id = me.enrollment_id,
				res_id = me.queryArgs["res_id"],
				deferred = me.queryArgs["deferred"],
				needChilden = me.queryArgs["needChilden"],
				isResNeed = me.queryArgs["isResNeed"];

			if(Object.prototype.toString.call(res_id) === "[object Array]") {
				Each(res_id,function(i,v){
					prosURL = queryBuilder.buildProgressQuery(enrollment_id,v,needChilden)
					prosURLs.push(isResNeed ? [v, prosURL]: prosURL);
				});
				prosURLs.push(deferred);
				queryArr = prosURLs;
			}
			else {
				prosURL = queryBuilder.buildProgressQuery(enrollment_id,res_id,needChilden),
					queryArr = isResNeed ? [res_id, prosURL, deferred] :  [prosURL, deferred];
			}

			me.query.apply(me, queryArr);
		},
		getActPros:function onGetActPros(act_id, deferred){
			this.queryProgress(act_id, deferred);
		},

		getActAndPros:function onGetActAndPros(act_id, deferred){
			this.queryProgress(act_id, deferred);
		},

		getStepPros:function onGetStepPros(step_id, deferred){
			this.queryProgress(step_id, deferred);
		},

		getStepAndPros:function onGetStepAndPros(step_id, deferred){
			this.queryProgress(step_id, deferred, 1, 1);
		},

		getLessonPros:function onGetLessonPros(lesson_id, deferred){
			this.queryProgress(lesson_id, deferred);
		},

		getLessonAndPros:function onGetLessonAndPros(lesson_id, deferred){
			this.queryProgress(lesson_id, deferred, 1, 1);
		},

		getUnitPros:function onGetUnitPros(unit_id, deferred){
			this.queryProgress(unit_id, deferred);
		},

		getUnitAndPros:function onGetUnitAndPros(lesson_id, deferred){
			this.queryProgress(unit_id, deferred, 1, 1);
		},

		getLevelPros:function onGetLevelPros(level_id, deferred){
			this.queryProgress(level_id, deferred);
		},

		getLevelAndPros:function onGetLevelAndPros(lesson_id, deferred){
			this.queryProgress(level_id, deferred, 1, 1);
		},

		//input : [step!334,lesson!234],deferred
		//return step_pros,lessonPros to deferrd obj
		getMixedPros:function onGetMixedPros(id_array, deferred){
			this.queryProgress(id_array, deferred);
		},
		//input : [step!334,lesson!234],deferred
		//return step,step_pros,lesson,lessonPros to deferrd obj
		getMixedAndPros:function onGetMixedPros(id_array, deferred){
			this.queryProgress(id_array, deferred, 1, 1);
		},

		notStarted: function hasStarted (state) {
			return !state || state.notStarted;
		},

		hasStarted: function hasStarted (state) {
			if(!state) {
				return false;
			}
			return !(state & progressState.notStarted);
		},

		// hasTried state contains: onGoing, completed, hasPassed isFinished
		hasTried: function hasTried(state){
			return !!state;
		},

		hasPassed: function hasPassed(state){
			if(!state) {
				return false;
			}
			return !!(state & progressState.hasPassed);
		},
		//id like activity!34, step!2354
		hasPassedMe: function(id, deferred){
			var me = this;
			me.queryProgress(id, Deferred().done(function(pros){
				deferred && deferred.resolve(me.hasPassed(pros && pros.state));
			}));
		}

	}).apply(Service).start();
});
