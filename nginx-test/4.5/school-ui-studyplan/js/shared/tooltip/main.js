define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./main.html"
], function($, Widget, template){
	"use strict";
	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		"sig/start" : function(){
			var me = this;
			return me.html(template, {
				content: me.options.content,
				customClass: me.options.customClass,
				expand: me.options.expand ? '' : 'ets-none'
			});
		},

		"dom:.campus-tooltip/click": function(e){
			e.stopPropagation();
		},

		"dom: .title-icon/click": function(){
			var me = this;
			me.$element.find('.ets-icon-cp-arrow-up').toggleClass('ets-none');
			me.$element.find('.tooltip-body').toggleClass('ets-none');
		},

		"dom:.ets-icon-cp-close/click": function(){
			var me = this;
			me.$element.find('.ets-icon-cp-arrow-up').addClass('ets-none');
			me.$element.find('.tooltip-body').addClass('ets-none');
			me.$element.trigger("tooltip/close");
		}
	});
});
