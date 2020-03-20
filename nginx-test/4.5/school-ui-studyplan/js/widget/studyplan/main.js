define([
	"troopjs-ef/component/widget",
	"template!./main.html"
], function(Widget, tMain){
	"use strict";

	return Widget.extend({
		'sig/start' : function(){
			return this.html(tMain);
		}
	});
});
