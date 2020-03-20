define([
	"jquery",
	"poly",
	"troopjs-ef/component/widget",
	"template!./pagination.html"
], function ($, poly, Widget, tPagination) {
	"use strict";

	var UNDEF;
	var $ELEMENT = "$element";

	var CLS_NONE = "ets-none";
	var CLS_ACTIVE = "active";
	var CLS_NUM = "num";
	var CLS_ELLIPSIS = "ellipsis";

	var SEL_SECTION_START = ".section.start";
	var SEL_SECTION_MIDDLE = ".section.middle";
	var SEL_SECTION_END = ".section.end";
	var SEL_SECTION_PREV = ".section.prev";
	var SEL_SECTION_NEXT = ".section.next";
	var SEL_ACTIVE = "." + CLS_ACTIVE;
	var SEL_NUM = "." + CLS_NUM;
	var SEL_ELLIPSIS = "." + CLS_ELLIPSIS;

	var PAGE_ITEMS = 10;     //how many items will be shown in one page
	var ITEMS = "_items";
	var SELECTED_ITEM_INFO = "_selectedItemInfo";

	var MAX_START_NUMS = 1;
	var MAX_MIDDLE_NUMS = 5;
	var MAX_END_NUMS = 1;

	var SECTION_START = "_section_start";
	var SECTION_MIDDLE = "_section_middle";
	var SECTION_END = "_section_end";
	var PAGE_COUNT = "_page_count";

	return Widget.extend(function ($element, path, items, selectedItemInfo) {
		var me = this;
		me[ITEMS] = items;
		me[SELECTED_ITEM_INFO] = selectedItemInfo;
	}, {
		"sig/start": function () {
			var me = this;
			return me.html(tPagination).then(function () {
				var totalItems = me[ITEMS].length;
				var totalPages = Math.ceil(totalItems / PAGE_ITEMS);
				me.setPageCount(totalPages);

				if (totalPages > 0) {
					var selectedIndex = -1;
					if (me[SELECTED_ITEM_INFO]) {
						var typeCode = me[SELECTED_ITEM_INFO].typeCode;
						var feedbackId = me[SELECTED_ITEM_INFO].feedbackId;
						me[ITEMS].every(function (item, index) {
							if (String(item.feedback_id) === feedbackId && (item.typeCode === typeCode || item.categoryCode === typeCode)) {
								selectedIndex = index;
								return false;
							} else {
								return true;
							}
						});
					}

					if (selectedIndex > -1) {
						var selectedPageNum = Math.ceil((selectedIndex + 1) / PAGE_ITEMS);
						me.setActivePage(selectedPageNum);
					}
					else {
						me.setActivePage(1);
					}
				}
			});
		},
		"dom:a.num/click": function (e) {
			var pageNum = parseInt($(e.currentTarget).text());
			var me = this;
			me.setActivePage(pageNum);
		},
		"dom:a.prev/click": function () {
			var me = this;
			var newPageNum = parseInt(me[$ELEMENT].find(SEL_ACTIVE).text()) - 1;
			if (newPageNum >= 1) {
				me.setActivePage(newPageNum);
			}
		},
		"dom:a.next/click": function () {
			var me = this;
			var newPageNum = parseInt(me[$ELEMENT].find(SEL_ACTIVE).text()) + 1;
			if (newPageNum <= me[PAGE_COUNT]) {
				me.setActivePage(newPageNum);
			}
		},
		"dom:.pagination-wrapper/selectstart": function () {
			return false;
		},
		"setPageCount": function (pageCount) {
			pageCount = parseInt(pageCount);
			pageCount = (pageCount < 0 ? 0 : pageCount);

			var me = this;
			me[PAGE_COUNT] = pageCount;

			//calculate
			var startNumCount = Math.min(pageCount, MAX_START_NUMS);
			var endNumCount = Math.min(pageCount - startNumCount, MAX_END_NUMS);
			var middleNumCount = Math.min(pageCount - startNumCount - endNumCount, MAX_MIDDLE_NUMS);
			me[SECTION_START] = {
				min: 1,
				max: startNumCount,
				count: startNumCount
			};
			me[SECTION_MIDDLE] = {
				min: startNumCount + 1,
				max: pageCount - endNumCount,
				count: (middleNumCount ? pageCount - startNumCount - endNumCount : 0),
				displayCount: middleNumCount
			};
			me[SECTION_END] = {
				min: pageCount - endNumCount + 1,
				max: pageCount,
				count: endNumCount
			};

			//render init
			var i;

			//section start
			var $sectionStart = me[$ELEMENT].find(SEL_SECTION_START).empty();
			for (i = me[SECTION_START].min; i <= me[SECTION_START].max; i++) {
				$sectionStart.append($("<a></a>", {
					"class": CLS_NUM,
					"text": i
				}));
			}
			$sectionStart.toggleClass(CLS_NONE, me[SECTION_START].count === 0);

			//section middle
			var $sectionMiddle = me[$ELEMENT].find(SEL_SECTION_MIDDLE);
			$sectionMiddle.find(SEL_NUM).remove();
			var $endEllipsis = $sectionMiddle.find(SEL_ELLIPSIS + ":last");
			for (i = 1; i <= me[SECTION_MIDDLE].displayCount; i++) {
				$endEllipsis.before($("<a></a>", {
					"class": CLS_NUM
				}));
			}
			$sectionMiddle.toggleClass(CLS_NONE, me[SECTION_MIDDLE].count === 0);

			//section end
			var $sectionEnd = me[$ELEMENT].find(SEL_SECTION_END).empty();
			for (i = me[SECTION_END].min; i <= me[SECTION_END].max; i++) {
				$sectionEnd.append($("<a></a>", {
					"class": CLS_NUM,
					"text": i
				}));
			}
			$sectionEnd.toggleClass(CLS_NONE, me[SECTION_END].count === 0);

			//section prev & next
			me[$ELEMENT].find(SEL_SECTION_PREV).toggleClass(CLS_NONE, me[PAGE_COUNT] === 0);
			me[$ELEMENT].find(SEL_SECTION_NEXT).toggleClass(CLS_NONE, me[PAGE_COUNT] === 0);
		},
		"setActivePage": function (pageNum) {
			function updateMiddleSection(minPageNum) {
				var $sectionMiddle = me[$ELEMENT].find(SEL_SECTION_MIDDLE);
				for (var i = 1; i <= me[SECTION_MIDDLE].displayCount; i++) {
					$sectionMiddle.find(SEL_NUM + ":nth-of-type(" + (i) + ")").text(minPageNum + i - 1);
				}

				$sectionMiddle.find(SEL_ELLIPSIS + ":first").toggleClass(CLS_NONE, minPageNum === me[SECTION_START].max + 1);
				$sectionMiddle.find(SEL_ELLIPSIS + ":last").toggleClass(CLS_NONE, minPageNum + me[SECTION_MIDDLE].displayCount - 1 === me[SECTION_MIDDLE].max);
			}

			function setActiveNum($newActiveNum) {
				$activeNum.removeClass(CLS_ACTIVE);
				$newActiveNum.addClass(CLS_ACTIVE);
			}

			var me = this;
			var $activeNum = me[$ELEMENT].find(SEL_ACTIVE);
			if ($activeNum.text() === pageNum.toString()) {
				return;
			}

			if (pageNum >= me[SECTION_START].min && pageNum <= me[SECTION_START].max) {
				//active num is in start section
				updateMiddleSection(me[SECTION_MIDDLE].min);
				var $newActiveNum = me[$ELEMENT].find(SEL_SECTION_START + " " + SEL_NUM + ":nth-child(" + pageNum + ")");
				setActiveNum($newActiveNum);
			}
			else if (pageNum >= me[SECTION_END].min && pageNum <= me[SECTION_END].max) {
				//active num is in end section
				updateMiddleSection(me[SECTION_MIDDLE].max - me[SECTION_MIDDLE].displayCount + 1);
				var $newActiveNum = me[$ELEMENT].find(SEL_SECTION_END + " " + SEL_NUM + ":nth-child(" + (pageNum - me[SECTION_MIDDLE].max + ")"));
				setActiveNum($newActiveNum);
			}
			else {
				//active num is in middle section
				var middleSectionNumStart = pageNum - Math.floor((me[SECTION_MIDDLE].displayCount - 1) / 2);
				if (middleSectionNumStart < me[SECTION_MIDDLE].min) {
					middleSectionNumStart = me[SECTION_MIDDLE].min;
				}
				else if (middleSectionNumStart + me[SECTION_MIDDLE].displayCount - 1 > me[SECTION_MIDDLE].max) {
					middleSectionNumStart = me[SECTION_MIDDLE].max - me[SECTION_MIDDLE].displayCount + 1;
				}
				updateMiddleSection(middleSectionNumStart);

				var $newActiveNum = me[$ELEMENT].find(SEL_SECTION_MIDDLE + " " + SEL_NUM + ":nth-of-type(" + (pageNum - middleSectionNumStart + 1) + ")");
				setActiveNum($newActiveNum);
			}

			me.publishPagedItems(pageNum)
		},
		"publishPagedItems": function (pageNum) {
			var me = this;
			var startIndex = (pageNum - 1) * PAGE_ITEMS;
			var pagedItems = me[ITEMS].slice(startIndex, startIndex + PAGE_ITEMS);
			var renderItems = pagedItems.map(function (item) {
				return $.extend({}, item);
			});
			me.publish("feedback/update-items", renderItems);
		}
	});
});
