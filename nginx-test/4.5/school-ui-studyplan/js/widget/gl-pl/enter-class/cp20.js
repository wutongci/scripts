define([
	"troopjs-ef/component/widget",
	"template!./enter-class.html"
], function(Widget, tEnterClass){

	var UNIT_ID = "_unitId",
		CLASS_ID = "_classId",
		MODE = "_mode";

	var CP20_ENTER_URL = "_cp20_enter_url";

	var STATUS_START_STARTED = "started";

	function getCP20Action(unitId, classId) {
		var me = this;
		return me[CP20_ENTER_URL]
			.replace('?', '?showcontentonly=y&') // add search key 'showcontentonly' to skip new PL booking page redirect logic
			.replace("{unitId}", unitId)
			.replace("{source}", window.encodeURIComponent(window.location.href))
			.replace("{classId}", classId);
	}

	return Widget.extend(function(element, path, unitId, classId){
		var me = this;
		me[UNIT_ID] = unitId;
		me[CLASS_ID] = classId;
	}, {
		"sig/start": function(){
			var me = this;
			return me.query("evc_url_resource!current").spread(function(data){
				me[CP20_ENTER_URL] = data.studyPlanUrls.CP20Entering;
			});
		},
		"hub:memory/studyplan/evc/cp20/start-status": function(status){
			var me = this;
			if(status === STATUS_START_STARTED){
				me.html(tEnterClass);
			}
		},

		"dom:.countdown-scoreboard-enter/click": function enterClass() {
			var me = this;
			window.open(getCP20Action.call(me, me[UNIT_ID], me[CLASS_ID]), '_self');
		}
	});
});
