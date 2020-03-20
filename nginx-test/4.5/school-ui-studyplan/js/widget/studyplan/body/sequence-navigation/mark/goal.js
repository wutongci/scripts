define([
    "jquery",
    "when",
    "moment",
    "troopjs-ef/component/widget",
    "school-ui-shared/enum/moment-language",
    "school-ui-studyplan/enum/studyplan-item-state",
    "school-ui-studyplan/utils/state-parser",
    "template!./goal.html"
],function($, when, Moment, Widget, momentLang, itemState, stateParser, tGoalMark){
    var DATA = "_data";
    var CONTEXT_DEFER = "_context_defer";

    return Widget.extend(function($element, path, data){
        this[DATA] = data;
        this[CONTEXT_DEFER] = when.defer();
    },{
        "displayName" : "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/goal",
        "sig/start":function(){
            var me = this;
            var data = me[DATA];
            if(stateParser.parseFlag(itemState, data.progress.state).Completed){
                return when.reject("skip target date mark, studyplan is completed");
            }
            if(data && data.progress && data.progress.properties && data.progress.properties.endDate){
                me[CONTEXT_DEFER].promise.spread(function(context){
                    var localLang = Moment(data.progress.properties.endDate);
                    if(context) {
                        localLang.lang(momentLang[context.cultureCode.toLowerCase()]);
                        me.html(tGoalMark, localLang.format("ll"));
                    }
                });
            }
            else{
                return when.reject("skip target date mark, no endDate in goal");
            }
        },
        "hub:memory/context": function(context) {
            if(context){
                this[CONTEXT_DEFER].resolve([context]);
            }
        }
    });
});
