define([
	"when",
	"logger",
	"poly",
	"jquery",
	"client-tracking",
	"mv!jquery#troopjs-1.0",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-shared/enum/course-type",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/server-time",
	"school-ui-shared/plugins/techcheck/techcheck-render",
	"template!./initialization.html"
], function SchoolModule(
	when,
	Logger,
	polyArray,
	$,
	ct,
	jqueryInTroop1,
	Widget,
	loom,
	weave,
	courseType,
	Parser,
	serverTime,
	techcheckRender,
	tInit
) {
	"use strict";

	var UNDEF;

	var $ELEMENT = "$element";

	var SEL_HTML = "html";

	var PAGE_CONTEXT_DATA = "_page_context_data";
	var RENDERED = "_rendered";


	return Widget.extend(function(){
		//tracking context data
		this[PAGE_CONTEXT_DATA] = {};
	},{
		"hub:memory/context" : function (context, courseEnroll, platformVersion){
			var me = this;

			if(platformVersion.version === "2.0") {
				if(!me[RENDERED]) {
					me.query("ccl!'school.activity.interaction.sampleRate'").spread(function(data){
						//FOR ACT_INTERACTION TRACKING/////////////
						var rate = parseFloat(data.value);
						me["_isSample"] = (context.user.member_id % 100 < (rate * 100));
						////////////////////////////////////////////
						me.html(tInit).then(function(){
							me[RENDERED] = true;
							jqueryInTroop1("[data-weave-1]").each(function(entryIndex, entry){
								var $e = jqueryInTroop1(entry);
								$e.attr("data-weave", $e.attr("data-weave-1")).weave();
							});
						});
					});
				}
			}
		},

		//FOR ACT_INTERACTION TRACKING/////////////
		"hub:memory/logger/troopjs1": function (msg) {
			this["_isSample"] && Logger.log(msg);
		},
		////////////////////////////////////////////

		"hub:memory/load/results": function (results) {
			var NULL = "null";
			var me = this;
			var updated;
			var pageData = {
				"unitID" : NULL,
				"levelID" : NULL,
				"lessonID" : NULL
			};

			//set pageData for tracking
			Object.keys(results).forEach(function(name){
				var data = results[name];
				if(data){
					switch (name){
						case "level":
							data.templateLevelId && (pageData.levelID = data.templateLevelId);
							break;
						case "unit":
							data.templateUnitId && (pageData.unitID = data.templateUnitId);
							break;
						case "lesson":
							data.templateLessonId && (pageData.lessonID = data.templateLessonId);
							break;
					}
				}
			});

			Object.keys(pageData).forEach(function(name){
				updated = updated || pageData[name] !== me[PAGE_CONTEXT_DATA]["page." + name];
				me[PAGE_CONTEXT_DATA]["page." + name] = pageData[name];
			});

			updated && ct.usercontext(me[PAGE_CONTEXT_DATA]);
		},

		"hub/school/toggle/overflow":function toggleOverflow(style){
			$(SEL_HTML).css('overflow',style);
		},

		"hub:memory/school/spinner": function showSpinner(promise){
			var me = this;

			me.task(function (resolve, reject, progress) {
				return promise
					.then(resolve, reject, progress);
			});
		},

		"hub/tracking/useraction" : function onTrackingUserAction(data){
			ct.useraction(data);
		}
	});
});
