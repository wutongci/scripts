define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./pace-select.html"
], function($, Widget, tPaceSelect){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var UNDEF;

	var $ELEMENT = "$element";

	var PACES = "_paces";

	var EVT_MOUSEDOWN = "mousedown.pace";

	var SEL_CONFIG_CONTAINER = ".ets-studyplan",
		SEL_PACE = ".ets-sp-cfg-pace",
		SEL_PACELIST = ".ets-sp-cfg-paceList",
		SEL_PACEBUTTON = ".ets-sp-cfg-pace-button",
		SEL_PACELIST_WRAPPER = ".ets-sp-cfg-paceList-wrapper";

	var CLS_PACESELECT_VIEW = "ets-cfg-paceSelect-view";

	var HUB_PACESELECT = "config/pace-select";

	function open(){
		var me = this;
		var height = me[$ELEMENT].find(SEL_PACELIST).outerHeight();
		me[$ELEMENT].find(SEL_PACELIST_WRAPPER).height(height);
		me[$ELEMENT].attr("data-status", "open");
	}

	function close(){
		var me = this;
		me[$ELEMENT].find(SEL_PACELIST_WRAPPER).height(0);
		me[$ELEMENT].attr("data-status", "close");
	}

	return Widget.extend(function(){
		var me = this;
		me[PACES] = me[$ELEMENT].data("paces");
	},{
		"sig/start" : function(){
			var me = this;

			$(SEL_CONFIG_CONTAINER).off(EVT_MOUSEDOWN).on(EVT_MOUSEDOWN, function(event){
				if ($(event.target).parents(SEL_PACE).length == 0){
					close.call(me);
				}
			});

			return me.html(tPaceSelect, me[PACES]);
		},

		"sig/stop": function onStop() {
			$(SEL_CONFIG_CONTAINER).off(EVT_MOUSEDOWN);
		},

		"hub/config/pace-select/toggle": function(status){
			var me = this;
			if(status === "open") {
				open.call(me);
			}
			else if(status === "close") {
				close.call(me);
			}
		},

		"dom:.ets-sp-cfg-pace-button/click": function(evt){
			var me = this;

			if(!me[$ELEMENT].hasClass(CLS_PACESELECT_VIEW)){
				open.call(me);
			}
		},

		"dom:ul li .ets-sp-cfg-pace-item/click": function(evt){
			var me = this;
			var $currentTarget = $(evt.currentTarget);
			var days = parseInt($currentTarget.attr("data-days"));

			me.publish(HUB_PACESELECT, days);

			me[$ELEMENT].find(SEL_PACEBUTTON).find("div").html($currentTarget.html());

			close.call(me);
		}
	});
});
