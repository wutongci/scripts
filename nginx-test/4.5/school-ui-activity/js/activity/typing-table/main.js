define([
	'jquery',
	'poly',
	'../base/main',
	"troopjs-core/component/factory",
	'when',
	'template!./main.html',
	'underscore',
	'jquery.ui',
	'jquery.transit',
	'./typing-table'
], function mpaMain($, poly, Widget, Factory, when, tTpt) {
	"use strict";

	var REG_TR = /<tr(?:.*?)>(.*?)<\/tr>/ig,
		REG_TD = /<td(?:.*?)>(.*?)<\/td>/ig;

	/**
	 * Filter source data
	 * create table array from original data
	 * @api private
	 */
	function filterData() {
		var me = this,
			data = me._json,
			maxTables = data.filterOptions.questionNo,
			caseSensitive = data.content.evalLogic && (data.content.evalLogic == 2),
			isGradeMode = me.hasScoring;

		//item bank
		if (maxTables < data.content.items.length) {
			data.content.items.splice(maxTables - 1, data.content.items.length - maxTables);
		}

		var tableIds = [];
		//genarate table array from original json data
		data.tables = [];
		data.tablesAttr = [];

		$.each(data.content.items, function (i, item) {
			tableIds.push(item._id);
			var table = [],
				tableAttr = [],
				tableTxt = item.txt.replace(/\n/g, ""),
				trResult = REG_TR.exec(tableTxt);
			while (trResult) {
				var row = [],
					rowAttr = [],
					trTxt = trResult[1],
					tdResult = REG_TD.exec(trTxt);

				while (tdResult) {
					var cell = {},
						stkResult = /<strike(?:.*?)>(.*?)<\/strike>/ig.exec(tdResult[1]);
					stkResult ?
						cell._toAnswer = stkResult[1] :
						cell = tdResult[1];
					var attr = /<td(.*?)>/.exec(tdResult[0]);
					row.push(cell);
					rowAttr.push(attr[1]);
					tdResult = REG_TD.exec(trTxt);
				}
				table.push(row);
				tableAttr.push(rowAttr);
				trResult = REG_TR.exec(tableTxt);
			}

			data.tables.push(table);
			data.tablesAttr.push(tableAttr);
		});

		if (isGradeMode) {
			// remove none used scoring data to improve scoring performance
			for (var i = data.scoring.items.length - 1; i >= 0; i--) {
				var item = data.scoring.items[i];
				if ($.inArray(item._id, tableIds) < 0) {
					data.scoring.items.splice(i, 1);
				}
			}
			//_correctAns stores original correct answers,because _scoring may change to lower case when case insensitive
			data._correctAns = [];
			$.each(data.scoring.items, function (i, item) {
				$.each(item.gaps, function (k, gap) {
					if (gap.txt != null) {
						gap.txt = $.trim(gap.txt.replace(/\n/g, '').replace(/<.*?>/ig, ''));
						data._correctAns.push({_id: gap._id, txt: gap.txt.split('/')[0]});
						// Eval Logic
						!caseSensitive && (gap.txt = gap.txt.toLowerCase());
					}
				});
			});
		}
		data.curPage = 0;
		me.length(data.tables.length);
		me.index(data.curPage);
	}

	/**
	 * Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		me.publish('activity/step/render', me.index(), me.length());

		if (!me._htmlPromise) {
			me._htmlPromise = me.html(tTpt, me._json);
		}

		return me._htmlPromise
			.then(function () {
				return me.publish('activity/template/typing-table/load', {
					item: me.items(),
					isLastItem: me.index() === me.length() - 1,
					json: me._json,
					hasScoring: me.hasScoring,
					_super: me
				});
			});
	}

	function Ctor() {
	}

	var methods = {
		"sig/initialize": function onInitialize() {
			var me = this;
			if (!me.hasScoring) {
				me.type(Widget.ACT_TYPE.PRACTICE);
			} else {
				me.items().completed(false);
			}

			filterData.call(me);
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			me._htmlPromise = null;
		},
		"sig/render": function onRender() {
			var me = this;
			return render.call(me);
		},
		"hub/typing-table/interaction": function(interaction) {
			return this.publishInteraction(interaction);
		},
		completed: Factory.around(function (base) {
			return function (isCompleted) {
				var me = this;
				if (!me.hasScoring && isCompleted) {
					me.publish('activity/template/typing-table/show-non-graded-feedback');
				}
				return base.call(this, isCompleted);
			}
		}),
		nextStep: function () {
			var me = this;
			me.index(++me._json.curPage);
			render.call(me);
		}
	};
	return Widget.extend(Ctor, methods);
});
