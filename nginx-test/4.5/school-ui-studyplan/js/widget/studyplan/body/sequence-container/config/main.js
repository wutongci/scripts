define([
	"jquery",
	"poly",
	"json2",
	"moment",
	"when",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/studyplan-update-helper",
	"school-ui-studyplan/enum/studyplan-mode",
	"school-ui-shared/enum/moment-language",
	"template!./config.html"
], function ($, Poly, JSON, Moment, when, Widget, Parser, UpdateHelper, studyplanMode, momentLang, tConfig) {
	"use strict";

	var UNIT = "_unit";
	var UNIT_STUDYPLAN = "_unit_studyplan";
	var SP_TEMPLATE = "_studyplan_template";
	var GOAL = "_goal";
	var SELECTED = 'selected';

	function render(unit, unit_studyplan) {
		var me = this;
		var renderData = {};

		if (!unit || !unit_studyplan) {
			return;
		}

		renderData.unit = unit;

		var studyplan = me[SP_TEMPLATE] = $.extend(true, {}, unit_studyplan.studyPlan);

		if (unit_studyplan.mode === studyplanMode.Create) {
			studyplan.items.forEach(function (e) {
				if (e.typeCode === "goal") {
					me[GOAL] = e;
					renderData.properties = e.properties;
				}
			});
			return me.query('ccl!"school.studyplan.pace.mode"', 'member_site_setting!"school;studyplan.newui.enabled"').spread(function (
				ccl,
				newuiEnable
			) {
				renderData.mode = ccl.value;
				if (ccl.value === 'view') {
					setViewModeForPaces(renderData.properties.paces);
				}

				if (newuiEnable.value === 'true') {
					return UpdateHelper.createStudyplan({
						"studentStudyPlanTemplate": studyplan
					})
						.then(function (data) {
							var studyplanId = data.id;
							return me.publish("school/clearCache", unit_studyplan.id) // SPC-7224
								.then(function () {
									me.publish("load", {
										"prefix": "study",
										"studyplan": Parser.parseId(studyplanId)
									});
								});
						});
				} else {
					return me.html(tConfig, renderData);
				}
			});
		}
	}

	function setViewModeForPaces(paces) {
		for (var i = 0, ii = paces.length; i < ii; i++) {
			var pace = paces[i];
			if (SELECTED in pace) {
				pace[SELECTED] = false;
			}
		}
		paces[ii - 1][SELECTED] = true;
		return paces;
	}

	return Widget.extend({
		"hub:memory/load/unit": function (unit) {
			var me = this;
			if (!unit) {
				return;
			}

			render.call(me, me[UNIT] = unit, me[UNIT_STUDYPLAN]);
		},

		"hub:memory/load/unit_studyplan": function (unit_studyplan) {
			var me = this;
			if (!unit_studyplan) {
				return;
			}

			render.call(me, me[UNIT], me[UNIT_STUDYPLAN] = unit_studyplan);
		},

		"hub/config/pace-change": function (paces) {
			var me = this;
			me[GOAL].properties.paces = paces;
		},

		"dom:.ets-sp-cfg-create/click": function (evt) {
			var me = this;
			var noSelectedInConfig = me[GOAL].properties.paces.every(function (e) {
				return !e.selected;
			});

			// if there is not any selected pace, for prevent unexpected result after creation.
			// we select the first pace by default. and send a front-end event log
			if (noSelectedInConfig) {
				me.log("Studyplan exception when creating, goal properties is : " + JSON.stringify(me[GOAL].properties));
				me[GOAL].properties.paces[0].selected = true;
			}

			$(evt.currentTarget).prop("disabled", true);

			var unit_studyplan = me[UNIT_STUDYPLAN];

			UpdateHelper.createStudyplan({
				"studentStudyPlanTemplate": me[SP_TEMPLATE]
			}).then(function (data) {

				var studyplanId = data.id;

				// make sure update context first and jump page
				me.publish("context/update/context")
					.then(function () {
						return me.publish("school/clearCache", unit_studyplan.id); // SPC-7224
					})
					.then(function () {
						me.publish("load", {
							"prefix": "study",
							"studyplan": Parser.parseId(studyplanId)
						});
					});

			});
		}
	});
});
