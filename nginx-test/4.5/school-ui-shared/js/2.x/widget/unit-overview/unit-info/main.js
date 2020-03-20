define([
	'troopjs-ef/component/widget',
	"school-ui-shared/enum/course-type",
	'template!./unit-info.html'
], function (Widget, courseType, tUnitInfo) {
	'use strict';

	return Widget.extend(function (element, path, data) {
		var me = this;
		var unitInfo = data;

		var level = unitInfo.level;
		unitInfo.isGE = courseType.isGECourse(level);

		return me.html(tUnitInfo, unitInfo);
	});
});
