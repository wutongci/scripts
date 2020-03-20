define([
	"when",
	"jquery",
	"troopjs-ef/component/widget"
], function (when, $, Widget, tLevelTestName) {
	"use strict";

	return Widget.extend({
		"sig/start": function () {
			var me = this;

			var defaultNamePromise = me.query('blurb!660189').spread(function (blurbLevelTest) {
				return blurbLevelTest.translation;
			});
			var mappedNamePromise = me.query('ccl!"school.courseware.level.mapping.query"').spread(function (cclMappingQuery) {
				if (!cclMappingQuery.value) {
					return null;
				}
				return me.query(cclMappingQuery.value).spread(function (mapped) {
					return mapped.courseLevelTestNameMap;
				});
			});

			return when.all([
				defaultNamePromise,
				mappedNamePromise
			]).spread(function (defaultName, mappedName) {
				me.defaultName = defaultName;
				me.mappedName = mappedName;
			});
		},
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;
			if (page === "ge") {
				var levelCode = data.level.levelCode;
				var levelTestName = me.mappedName && me.mappedName[levelCode] || me.defaultName || 'Level Test';
				me.text(levelTestName);
			}
			else {
				me.text('');
			}
		}
	});
});
