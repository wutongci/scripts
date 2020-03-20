define([
	"when",
	"poly",
	"troopjs-ef/component/widget",
	"template!./lock.html"
	],function(when, poly, Widget, tLock){
	"use strict";

	return Widget.extend({
		"hub:memory/load/unit" : function(unit){
			var me = this;
			var previousUnit;
			var currentUnit = unit && unit.unitNo;
			if(unit) {
				unit.parent.children.every(function(e, i){
					if(unit.id === e.id) {
						previousUnit = (i == 0 ? undefined : unit.parent.children[i - 1].unitNo);
						return false;
					}
					else {
						return true;
					}
				});

				me.html(tLock, {
					blurbValues : {
						currentunit : currentUnit,
						previousunit : previousUnit
					}
				});
			}
		}
	});
});
