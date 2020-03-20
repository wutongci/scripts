define([
	"troopjs-ef/component/service",
    "troopjs-utils/deferred",
    "troopjs-utils/each",
	"school-ui-shared/utils/query-builder"
], function CCLUtilModule(Service, Deferred, Each, queryBuilder) {
	"use strict";
	
	return Service.extend({

		enableLockUnit: function enableLockUnit(queryResult) {
			return (queryResult || {}).value === "false";
		},

        getCCLByKey : function onGetCCLByKey(key, /*key,key,...*/ deferred){
            
            var me = this,
                SLICE = [].slice,
                args = SLICE.call(arguments, 0, -1),
                deferred = SLICE.call(arguments, -1)[0] || Deferred();

            if(args){
                Each(args,function(key,val){
                    args[key] = queryBuilder.buildCCLQuery(val);
                });

                Deferred(function(dfdQuery){
                    args.push(dfdQuery);
                    me.query.apply(me,args);
                }).done(function(cclVal){
                    cclVal = cclVal || {};
                    deferred.resolve.apply(deferred, SLICE.call(arguments, 0));
                });
            }            
        }   

	}).apply(Service).start();
});
