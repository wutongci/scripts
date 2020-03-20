define([
	"compose",
	"school-ui-shared/utils/typeid-parser"
], function QueryBuilderUtilModule(Compose, typeidParser) {
	"use strict";
	var PROGRESS = "progress!",
		CHILDREN = ".children",
		SEPARATOR = ";",
		CCL = "ccl!";

	return Compose.create({
		// input format: enrollment!1234, course!201, 1(optional)
		// output format: progress!1234;course;201.children
		buildProgressQuery: function buildProgressQuery(enrollmentid, typeid, childrenCount) {
			if(!enrollmentid || !typeid) {
				throw Error("invalid arguments, build progress query failed!");
			}
			var enrollment_id = typeidParser.parseId(enrollmentid),
				oTypeid = typeidParser.parse(typeid),
				children = "";
			if(childrenCount) {
				childrenCount = parseInt(childrenCount ,10);
				if(isNaN(childrenCount) || childrenCount < 0) {
					childrenCount = 0;
				}
				while(childrenCount-- > 0) {
					children += CHILDREN;
				}
			}
			return PROGRESS.concat([enrollment_id, oTypeid.type, oTypeid.id].join(SEPARATOR), children);
		},

		buildCCLQuery: function buildCCLQuery(variableName) {
			if (!variableName) {
				throw Error("invalid ccl variableName, build ccl query faild!");
			}
			return CCL + '"' + variableName + '"';
		}
	});
});
