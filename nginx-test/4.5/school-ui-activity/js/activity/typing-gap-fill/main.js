define([
	'jquery',
	'poly',
	'when',
	'school-ui-activity/activity/base/main',
	"troopjs-core/component/factory",
	"template!./main.html",
	'string.split',
	'underscore',
	'jquery.ui',
	'jquery.transit',
	'./typing-gap-fill'
], function mpaMain($, poly, when, Widget, Factory, tTpg) {
	"use strict";

	/**
	 * Filter source data
	 */
	function filterData() {
		var me = this,
			data = me._json,
			paragraphs = [],
			maxParagraphs = data.filterOptions.questionNo,
			caseSensitive = data.content.evalLogic && (data.content.evalLogic == 2),
			isGradeMode = me.hasScoring;

		//item bank
		if (maxParagraphs < data.content.items.length) {
			data.content.items.splice(maxParagraphs - 1, data.content.items.length - maxParagraphs);
		}

		//generate paragraph array for UI render
		var paragrapIds = [];
		$.each(data.content.items, function (i, item) {
			paragrapIds.push(item._id);
			var paragrap = [],
				cells = split(item.txt.replace(/\n/g, ''), /(<strike(?:.*?)>.*?<\/strike>)/);
			$.each(cells, function (j, cell) {
				var gap = {},
					matches = cell.match(/^<strike(?:.*?)>(.*?)<\/strike>$/);
				if (matches) {
					gap._toAs = true;
					gap.txt = matches[1];
				} else {
					gap.txt = $.trim(cell);
				}
				paragrap.push(gap);
			});
			paragraphs.push(paragrap);
		});
		data.paragraphs = paragraphs;
		data.isGradeMode = isGradeMode;
		if (isGradeMode) {
			//remove none used scoring data to improve scoring performance
			for (var i = data.scoring.items.length - 1; i >= 0; i--) {
				var item = data.scoring.items[i];
				if ($.inArray(item._id, paragrapIds) < 0) {
					data.scoring.items.splice(i, 1);
				}
			}
			//_correctAns stores original correct answers,because _scoring may change to lower case when case insensitive
			data._correctAns = [];
			$.each(data.scoring.items, function (i, item) {
				$.each(item.gaps, function (k, gap) {
					//replace html tag and \n to adapt to existing content
					if (gap.txt != null) {
						gap.txt = $.trim(gap.txt.replace(/\n/g, '').replace(/<.*?>/ig, ''));
						data._correctAns.push({_id: gap._id, txt: gap.txt.split('/')[0]});
						// Eval Logic
						!caseSensitive && (gap.txt = gap.txt.toLowerCase());
					}
				});
			});
		}
	}

	/**
	 * Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		if (!me._htmlPromise) {
			me._htmlPromise = me.html(tTpg, me._json);
		}

		return me._htmlPromise.then(function () {
			return me.publish('activity/template/typing-gap-fill/load', {
				item: me.items(),
				json: me._json,
				hasScoring: me.hasScoring,
				_super: me
			});
		});
	}

	var extendOptions = {
		"sig/initialize": function onInitialize() {
			var me = this;
			if (!me.hasScoring) {
				me.type(Widget.ACT_TYPE.PRACTICE);
			} else {
				me.items().completed(false);
			}

			filterData.call(me);
		},
		'sig/finalize': function onFinalize() {
			var me = this;
			me._htmlPromise = null;
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"hub/typing-gap-fill/interaction": function(interaction) {
			return this.publishInteraction(interaction);
		},
		completed: Factory.around(function (base) {
			return function (isCompleted) {
				var me = this;
				if (!me.hasScoring && isCompleted) {
					me.publish('activity/template/typing-gap-fill/show-non-graded-feedback');
				}
				return base.call(this, isCompleted);
			}
		})
	};
	return Widget.extend(function () {
	}, extendOptions);
});
