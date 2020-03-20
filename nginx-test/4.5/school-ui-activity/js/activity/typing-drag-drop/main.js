define([
	'jquery',
	"poly",
	'underscore',
	'school-ui-activity/activity/base/main',
	"template!./main.html",
	'string.split',
	'jquery.ui',
	'jquery.transit',
	'./typing-drag-drop'
], function mpaMain($, poly, _, Widget, tTdp) {
	"use strict";

	/**
	 * Filter source data
	 * create paragraphs array from original data
	 * @api private
	 */
	function filterData() {
		var me = this,
			data = me._json,
			dragPieces = [],
			caseSensitive = me._json.content.evalLogic && (me._json.content.evalLogic == 2),
			scoringItems = data.scoring.items || [],
			contentItems = data.content.items || [];

		scoringItems.forEach(function (item) {
			dragPieces.push.apply(dragPieces, item.gaps || []);
		});
		dragPieces = _.shuffle(dragPieces);
		data.dragPieces = dragPieces;
		data.paragraphs = [];
		var _gapTotal = 0;
		contentItems.forEach(function (item) {
			var paragraph = [];
			var cells = split(item.txt.replace(/\n/g, ""), /(<strike(?:.*?)>.*?<\/strike>)/);
			$.each(cells, function (j, cellTxt) {
				var cell = {};
				var matches = cellTxt.match(/^<strike(?:.*?)>(.*?)<\/strike>$/);
				if (matches) {
					cell._toAs = true;
					cell.text = matches[1];
					_gapTotal++;
				} else {
					cell.text = cellTxt;
				}
				paragraph.push(cell);
			});
			data.paragraphs.push(paragraph);
		});

		scoringItems.forEach(function (item) {
			item.gaps.forEach(function (gap) {
				//replace html tag and \n to adapt to existing content
				if (gap.txt != null) {
					gap.txt = $.trim(gap.txt.replace(/\n/g, '').replace(/<.*?>/ig, ''));
					if (!caseSensitive) {
						gap.txt = gap.txt.toLowerCase();
					}
				}
			});
		});
		data._gapTotal = _gapTotal;
	}

	function render() {
		var me = this;
		if (!me._htmlPromise) {
			me._htmlPromise = me.html(tTdp, me._json);
		}

		return me._htmlPromise
			.then(function () {
				return me.publish('activity/template/typing-drag-drop/load', {
					item: me.items(),
					json: me._json,
					hasScoring: me.hasScoring,
					_super: me
				});
			});
	}

	return Widget.extend(function () {
	}, {
		"sig/initialize": function onInitialize() {
			var me = this;
			me.items().instantFeedback(true);
			filterData.call(me);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			this._htmlPromise = null;
		},
		_onAnswerChecked: function onAnswerChecked() {
		}
	});
});
