define([
	"when",
	"../base",
	"template!./notice.html"
], function (when, BaseWidget, tNotice) {
	"use strict";

	var $ELEMENT = "$element";
	var CONTEXT = "_context";
	var PAGE = "_page";
	var LEVEL = "_level";
	var SEL_NOTICE = ".ets-pr-archive-unit-notice";

	function renderArchiveUnits(context, level) {
		var me = this;
		var renderResult = me.render(context, level);
		renderResult && renderResult.then(function () {
			if (!me[$ELEMENT].find(SEL_NOTICE).length) {
				//if render was called many times, make sure add notice only once
				me.prepend(tNotice);
			}
		});
	}

	return BaseWidget.extend({
		"hub:memory/context": function (context) {
			var me = this;
			renderArchiveUnits.call(me, me[CONTEXT] = context, me[LEVEL]);
		},
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;
			if (me[PAGE] === page) {
				var level = data.level;
				var ArchiveE10Level = data.archiveLevel && data.archiveLevel.e10;

				if (ArchiveE10Level && ArchiveE10Level.children.length > level.children.length) {
					ArchiveE10Level.children = ArchiveE10Level.children.sort(function (prev, curr) {
						return (prev.unitNo || 0) - (curr.unitNo || 0);
					}).slice(level.children.length);

					ArchiveE10Level.children.forEach(function (archiveUnit) {
						archiveUnit.children && archiveUnit.children.length && archiveUnit.children.sort(function (prevLesson, currLesson) {
							return prevLesson.lessonNo - currLesson.lessonNo;
						});
					});

					renderArchiveUnits.call(me, me[CONTEXT], me[LEVEL] = ArchiveE10Level);
				}
				else {
					me[$ELEMENT].empty();
				}
			}
		}
	});
});
