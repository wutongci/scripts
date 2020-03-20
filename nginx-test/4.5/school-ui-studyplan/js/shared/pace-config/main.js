define([
	"jquery",
	"when",
	"moment",
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/moment-language",
	"template!./pace-config.html"
], function($, when, Moment, Poly, Widget, momentLang, tPaceConfig){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var UNDEF;

	var $ELEMENT = "$element";

	var CULTURE_CODE = "_culture_code",
		PACES = "_paces",
		CONFIG = "_config",
		MODE = "_mode",
		CONFIG_ORIG = "_config_original";

	var LONG_DASH = "&mdash;&mdash;";

	var SEL_ITEM_TARGETDATE = ".ets-sp-cfg-item-targetDate",
		SEL_ITEM_DAYS = ".ets-sp-cfg-item-days",
		SEL_PACESELECT = ".ets-cfg-paceSelect";

	var CLS_NONE = "ets-none",
		CLS_PACESELECT_VIEW = "ets-cfg-paceSelect-view";

	var DOWNLIST_DURATION = 200;

	var MODE_VIEW = "view",
		MODE_EDIT = "edit";

	var HUB_PACESELECT_TOGGLE = "config/pace-select/toggle",
		HUB_PACECHANGE = "config/pace-change";

	function render(culturecode, pace_config){
		var me = this;
		var paceDays;
		var config = pace_config ? pace_config : me[CONFIG];
		var noSelectedInConfig;

		if(config.paceDays) {
			paceDays = parseInt(config.paceDays, 10);
		}
		else {
			noSelectedInConfig = config.paces.every(function(e, i){
				if(e.selected) {
					paceDays = e.paceDays;
					return false;
				}
				else {
					return true;
				}
			});
			// if there is not a selected pace, selecte the first one by default
			if(noSelectedInConfig){
				config.paces[0].selected = true;
				paceDays = config.paces[0].paceDays;
			}

		}

		return when(config.endDate ?
			localLang(culturecode, config.endDate).format("ll") :
			getTargetDate.call(me, culturecode, paceDays)).then(function(targetDate) {

				return me.html(tPaceConfig, {
					paces: config.paces,
					targetDate: paceDays ? targetDate : UNDEF,
					paceDays: paceDays,
					leftDays: config.leftDays,
					paceSelectMode: me[MODE]
				})
				.then(function(){
					// if there is not a selected pace, enter edit mode to open the pace list
					noSelectedInConfig && me.publish("config/pace-config/mode", MODE_EDIT);
				});
			});
	}

	function getTargetDate(culturecode, paceDays){
		var me = this;
		return me.publish("studyplan/get/serverTime").then(function(now){
			return localLang(culturecode, now).add("days", paceDays).format("ll");
		});
	}

	function localLang(culturecode, date) {
		var moment = Moment(date);
		moment.lang(momentLang[culturecode.toLowerCase()]);
		return moment;
	}

	return Widget.extend(function(){
		var me = this;
		var config = me[$ELEMENT].data("config");

		me[CONFIG] = config;
		me[CONFIG_ORIG] = $.extend(true, {}, config);
		me[PACES] = me[CONFIG].paces;
		me[MODE] = me[$ELEMENT].data("mode");
	},{

		"hub:memory/common_context" : function(common_context){
			var me = this;
			common_context && render.call(me, me[CULTURE_CODE] = common_context.values.culturecode.value);
		},

		"hub/config/pace-select": function(days){
			var me = this;
			var $targetDate = me[$ELEMENT].find(SEL_ITEM_TARGETDATE).find("h2");
			var $days = me[$ELEMENT].find(SEL_ITEM_DAYS).find("h2");

			getTargetDate.call(me, me[CULTURE_CODE], days).then(function(targetDate){
				if(days) {
					$targetDate.html(targetDate);
					$days.html(days);
					$days.siblings("span").removeClass(CLS_NONE);
				}
				else {
					$targetDate.html(LONG_DASH);
					$days.html(LONG_DASH);
					$days.siblings("span").addClass(CLS_NONE);
				}

				me[PACES].forEach(function(e, i){
					e.selected && delete e.selected;

					if(e.paceDays == days) {
						e.selected = true;
					}
				});

				me.publish(HUB_PACECHANGE, me[PACES]);
			});
		},

		"hub/config/pace-config/mode": function(mode) {
			var me = this;
			var $PACESELECT = me[$ELEMENT].find(SEL_PACESELECT);
			me[MODE] = mode;
			me[$ELEMENT].attr("data-mode", mode);

			switch (mode) {
				case MODE_EDIT:
					me.publish(HUB_PACESELECT_TOGGLE, "open");
					setTimeout(function(){
						$PACESELECT.removeClass(CLS_PACESELECT_VIEW);
					}, DOWNLIST_DURATION);

					//set default value, this hub means start change pace
					me.publish(HUB_PACECHANGE, me[PACES]);
					break;

				case MODE_VIEW:
					me.publish(HUB_PACESELECT_TOGGLE, "close");

					$PACESELECT.addClass(CLS_PACESELECT_VIEW);
					render.call(me, me[CULTURE_CODE], me[CONFIG_ORIG]);
					break;
			}

		}
	});
});
