define([
	"when",
	"poly",
	"jquery",
	"snapsvg",
	"troopjs-ef/component/widget",
	"template!./state-circle.html"
], function (when, poly, $, snapsvg, Widget, template) {
	"use strict";

	var $ELEMENT = "$element";

	var SELECTED_ID = '_selectedStateCircleId';
	var HOVERED_ID = '_hoveredStateCircleId';
	var ID = '_stateCircleId';
	var STATE = '_stateCircleState';

	function svgAnimate(node, options, duration) {
		try {
			snapsvg(node).animate(options, duration);
		} catch (e) {
			// IE9 may throw an error if the node is not visible
			// ignore error
		}
	}

	function updateSelected() {
		var me = this;
		if (me[SELECTED_ID] === me[ID]) {
			me[$ELEMENT].find("path[data-d-select]").each(function () {
				svgAnimate(this, {
					d: $(this).data("d-select")
				}, 100);
			});
		} else {
			me[$ELEMENT].find("path[data-d-origin]").each(function () {
				svgAnimate(this, {
					d: $(this).data("d-origin")
				}, 100);
			});
		}
	}

	function updateHovered() {
		var me = this;
		if (me[HOVERED_ID] === me[ID]) {
			me[$ELEMENT].find("path").each(function () {
				svgAnimate(this, {
					transform: "s1.3,1.3,16,16"
				}, 100);
			});
		} else {
			me[$ELEMENT].find("path").each(function () {
				svgAnimate(this, {
					transform: "s1,1,16,16"
				}, 100);
			});
		}
	}

	return Widget.extend(function ($element) {
		this[SELECTED_ID] = null;
		this[HOVERED_ID] = null;
		this[ID] = $element.data('id');
		this[STATE] = $element.data('state');
	}, {
		"sig/start": function () {
			var me = this;
			return me.html(template, {
				state: me[STATE],
			}).then(function () {
				updateSelected.call(me);
				updateHovered.call(me);
			});
		},
		"setSelected": function (selectedId) {
			var me = this;
			var previousSelectedId = me[SELECTED_ID];
			me[SELECTED_ID] = selectedId;
			if (previousSelectedId === me[ID] || selectedId === me[ID]) {
				updateSelected.call(me);
			} // else stays unselected
		},
		"setHovered": function (hoveredId) {
			var me = this;
			var previousHoveredId = me[HOVERED_ID];
			me[HOVERED_ID] = hoveredId;
			if (previousHoveredId === me[ID] || hoveredId === me[ID]) {
				updateHovered.call(me);
			} // else stays not hovered
		}
	});
});
