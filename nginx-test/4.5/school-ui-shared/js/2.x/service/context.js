/**
 * load student current school context
 */
define([
	"when",
	"troopjs-ef/component/service"
], function ContextModule(when, Service) {
	"use strict";

	function loadContext(isUpdate) {
		var me = this;

		return me.query(["school_context!current.user", "student_course_enrollment!current", "student_platform_version!current"]).spread(function doneQuery(context, courseEnroll, platformVersion) {
			return me.publish("context", context || {}, courseEnroll , platformVersion, isUpdate);
		});
	}

	/**
	 * context module definition
	 */
	return Service.extend({
		"displayName" : "school-ui-shared/service/context",

		"sig/start": function onStart() {
			var me = this;
			
			me.query("context!current").spread(function(common_context){
				me.publish("common_context", common_context);
			});

			return loadContext.call(this, false);
		},

		"hub/context/update/context": function onUpdateContext() {
			return loadContext.call(this, true);
		}
	});
});
