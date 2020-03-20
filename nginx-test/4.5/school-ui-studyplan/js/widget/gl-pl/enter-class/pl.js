define([
	"troopjs-ef/component/widget",
	"client-tracking",
	"school-ui-studyplan/enum/studyplan-item-typecode",
	"template!./enter-class.html"
], function (Widget, ct, spItemTypeCode, tEnterClass) {

	var UNIT_ID = "_unitId",
		CLASS_ID = "_classId",
		SP_TYPECODE = "_spTypeCode";

	var PL_ENTER_URL = "_pl_enter_url";
	var KEY = "SP";
	var TOPICID = "_topicId";

	var STATUS_START_STARTED = "started";

	function getPLAction(classId) {
		var me = this;
		return me[PL_ENTER_URL]
			.replace('?', '?showcontentonly=y&') // add search key 'showcontentonly' to skip new PL booking page redirect logic
			.replace("{source}", window.encodeURIComponent(window.location.href))
			.replace("{classId}", classId);
	}

	return Widget.extend(function(element, path, unitId, classId, spTypeCode){
		var me = this;
		me[UNIT_ID] = unitId;
		me[CLASS_ID] = classId;
		me[SP_TYPECODE] = spTypeCode;
	}, {
		"sig/start": function(){
			var me = this;
			return me.query("evc_url_resource!current").spread(function(data){
				me[PL_ENTER_URL] = me[SP_TYPECODE] === spItemTypeCode.pl20 ?
					data.studyPlanUrls.SPPL20Entering :
					data.studyPlanUrls.SPPL40Entering;
			});
		},
		"hub:memory/studyplan/evc/pl/start-status": function(status){
			var me = this;
			if(status === STATUS_START_STARTED){
				me.html(tEnterClass);
			}
		},

		"hub:memory/studyplan/evc/pl/status": function(data){
			var me = this;
			me[TOPICID] = data.topicId;
		},

		"dom:.countdown-scoreboard-enter/click": function enterClass() {
			var me = this;
			ct.useraction({
				"action.joinPL": me[TOPICID]
			});
			window.open(getPLAction.call(me, me[CLASS_ID]), '_self');
		}
	});
});
