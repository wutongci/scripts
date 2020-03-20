define([
	"jquery",
	"troopjs-ef/component/gadget",
	"school-ui-shared/utils/query-builder"
], function CCLUtilModule($, Gadget, queryBuilder) {
	"use strict";

	var ARRAY_SLICE = Array.prototype.slice;

	return Gadget.create({
		enableLockUnit: function enableLockUnit(queryResult) {
			return (queryResult || {}).value === "false";
		},

		getCCLByKey : function onGetCCLByKey(key){
			var me = this;
			var args = ARRAY_SLICE.call(arguments);

			$.each(args,function(key,val){
				args[key] = queryBuilder.buildCCLQuery(val);
			});

			return me.query(args);
		},
		indicateCCLStringValue: function(queryResult) {
			return (queryResult || {}).value.toLowerCase() === "true";
		}
	});
});
