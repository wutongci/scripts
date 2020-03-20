define([
	"troopjs-ef/component/widget",
	"school-ui-studyplan/utils/client-storage",
	"template!./class-status.html"
	], function(Widget, clientStorage, tClassStatus){

	var UNITID = "_unitId";
	var STATUS = "_statusCode";

    var STATUS_BOOKED = "booked";
    var STATUS_START_IN_COUNTDOWN = "incountdown";
    var STATUS_START_STARTED = "started";

	var CASE = {
		tckNoPass: {
			"BOOKED" : {blurbId : "568587", en : "Class booked", classname : "evc-studyplan-green"},
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "656134", en : "Classroom is open but you cannot enter", classname : "evc-studyplan-blue"}
		},
		tckPassed: {
			"BOOKED" : {blurbId : "568587", en : "Class booked", classname : "evc-studyplan-green"},
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "568579", en : "Classroom is open", classname : "evc-studyplan-blue"}
		}
	};


	return Widget.extend(function(element, path, unitId){
		var me = this;
		me[UNITID] = unitId;
	},{
		"sig/initialize" : function(){
			var me = this;
			return me.query("plclass!" + me[UNITID]).spread(function(data){
				me[STATUS] = data.statusCode.toLowerCase();
				if(me[STATUS] === STATUS_BOOKED){
					return me.render("BOOKED");
				}
			});
		},
		"hub:memory/studyplan/evc/pl/start-status" : function(status){
			var me = this;
			if(me[STATUS] === STATUS_BOOKED){
				if(status === STATUS_START_STARTED){
					me.render("OPEN");
				}
				else if(status === STATUS_START_IN_COUNTDOWN){
					me.render("CLOSED");
				}
			}
		},
		"render" : function(type){
			var subCase = clientStorage.getSessionStorage("techcheck_state") === "passed" ? CASE.tckPassed : CASE.tckNoPass;
			if(subCase[type]){
				return this.html(tClassStatus, subCase[type]);
			}
		}
	});
});
