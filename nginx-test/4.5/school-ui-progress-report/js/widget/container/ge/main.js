define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./ge.html"
], function ($, Widget, tGe) {
	"use strict";

	var INIT_DATA = "_init_data";

	var $ELEMENT = "$element";

	return Widget.extend(function($element, path, initData){
		this[INIT_DATA] = initData;
	},{
		'sig/start' : function(){
			var me = this;
			me[$ELEMENT].html(tGe());
			me[$ELEMENT].find(".ets-pr-header-nav").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-ge-level-info").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-unit-list").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-unit-list-e10-archive").data("initData", me[INIT_DATA]);
			return me.weave();
		}
	});
});
