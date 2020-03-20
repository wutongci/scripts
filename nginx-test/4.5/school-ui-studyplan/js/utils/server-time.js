define([
    "when",
    "troopjs-ef/component/gadget"
], function (when, Gadget) {
    "use strict";

    var DEFER_CONTEXT = "_defer_context";
    var CLIENT_START_TIME = "_client_start_time";


    var serverTimeService = Gadget.create(function(){
        this[DEFER_CONTEXT] = when.defer();
    },{
        "hub/studyplan/get/serverTime": function() {
            var me = this;
            return when(me[DEFER_CONTEXT].promise).then(function(context){
                return context.serverTime + new Date().getTime() - me[CLIENT_START_TIME];
            });
        },

        "hub:memory/context": function onContext(context) {
            var me = this;
            if(context){
                me[CLIENT_START_TIME] = new Date().getTime();
                me[DEFER_CONTEXT].resolve(context);                
            }
        }
    });

    serverTimeService.start();

    return serverTimeService;
});
