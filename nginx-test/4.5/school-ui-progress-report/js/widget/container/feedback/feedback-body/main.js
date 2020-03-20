define([
	"jquery",
	"when",
	"poly",
	"moment",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-shared/enum/moment-language",
	"school-ui-progress-report/enum/feedback-typecode",
	"../feedback-id-manager",
	"school-ui-progress-report/enum/score-state",
	"template!./feedback-body.html"
], function ($, when, poly, Moment, Widget, loom, weave, momentLang, fbType, FeedbackIdManager, scoreState, tFeedbackBody) {
	"use strict";

	var UNDEF;
	var $ELEMENT = "$element";

	var CONTEXT = "_context",
		SELECTED_ITEM_INFO = "_selectedItemInfo",
		ITEMS = "_items";

	var SEL_DOCUMENT = "html, body";   //for scroll animation, "html" works for IE8 and "body" works for other browsers
	var SEL_HEADER = ".ue-header";
	var SEL_SUMMARY_ROW = ".ets-pr-fb-row";
	var SEL_DETAIL = ".ets-pr-fb-detail";
	var SEL_VIDEO = ".ets-pr-fb-video";

	var CLS_SELECT = "ets-pr-fb-select";
	var CLS_DETAIL_ROW = "ets-pr-fb-detail-row";
	var CLS_DETAIL_OPEN = "ets-pr-fb-open";
	var CLS_NONE = "ets-none";

	var DURATION_SCROLL_DOWN = 800;

	function initItemDetail($summaryRow) {
		var $detailCell = $("<td></td>")
		.attr("colspan", $summaryRow.children().length)
		.data("summary", $summaryRow.data("summary"))
		.attr(loom.weave, "school-ui-progress-report/widget/container/feedback/feedback-detail/main");
		var $detailRow = $("<tr></tr>").attr("class", CLS_DETAIL_ROW).html($detailCell);

		var rowWidth = $summaryRow.width();
		$summaryRow.after($detailRow);
		return $detailCell.weave().spread(function () {
			var $detail = $detailCell.find(SEL_DETAIL);

			$detail.width(rowWidth);
			$detail.attr("data-height", $detail.height());
			$detail.css("height", "0").removeClass(CLS_NONE);
			$detail.removeClass(CLS_DETAIL_OPEN);
		});
	}

	function expandItemDetail($summaryRow) {
		var $detail = $summaryRow.next().find(SEL_DETAIL);
		$detail.addClass(CLS_DETAIL_OPEN).css("height", $detail.data("height") + "px");
		$summaryRow.addClass(CLS_SELECT);
	}

	function collapseItemDetail($summaryRow) {
		var $detail = $summaryRow.next().find(SEL_DETAIL);
		$detail.removeClass(CLS_DETAIL_OPEN).css("height", 0);
		$summaryRow.removeClass(CLS_SELECT);
	}

	function stopVideoPlayer($summaryRow){
		var $detail = $summaryRow.next().find(SEL_DETAIL);
		var $video = $detail.find(SEL_VIDEO + ' video');
		if ($video.length) {
			$video.data('mediaelementplayer').pause();
		}
	}

	function toggleItemDetail($summaryRow) {
		var $next = $summaryRow.next();

		if ($next.hasClass(CLS_DETAIL_ROW)) {
			if ($summaryRow.hasClass(CLS_SELECT)) {
				collapseItemDetail($summaryRow);
				stopVideoPlayer($summaryRow);
			} else {
				expandItemDetail($summaryRow);
			}
		} else {
			initItemDetail($summaryRow).then(function () {
				setTimeout(function () {
					$next = $summaryRow.next();
					var $detail = $next.find(SEL_DETAIL);
					expandItemDetail($summaryRow, $detail);
				}, 0);
			});
		}
	}

	function getTypeInfo(type) {
		switch (type) {
			case fbType.writing:
				return {
					blurbId: 659694,
					blurbTextEn: "Writing Challenge"
				};
			case fbType.gl:
				return {
					blurbId: 659695,
					blurbTextEn: "Online Group Class"
				};
			case fbType.pl:
				return {
					blurbId: 659696,
					blurbTextEn: "Online Private Class"
				};
			case fbType.cp20:
				return {
					blurbId: 659696,
					blurbTextEn: "Online Private Class"
				};
			case fbType.eftv:
				return {
					blurbId: 60558,
					blurbTextEn: "English Fluency Test"
				};
			case fbType.osa:
				return {
					blurbId: 709947,
					blurbTextEn: "Online stage assessment"
				};
			default:
				return {};
		}
	}

	function formatDate(date) {
		var context = this[CONTEXT];
		var MNow = Moment();
		var MDate = Moment(date);
		MDate.locale(momentLang[context.cultureCode.toLowerCase()] || "en");

		if (MNow.isSame(MDate, "day")) {
			return {
				blurbId: "660406",
				blurbTextEn: "Today",
				passedDate: ""
			};
		}
		else if (MNow.add(-1, 'day').isSame(MDate, "day")) {
			return {
				blurbId: "660407",
				blurbTextEn: "Yesterday",
				passedDate: MDate.format("H:mm")
			};
		}
		else {
			return {
				blurbId: "",
				blurbTextEn: "",
				passedDate: MDate.format("ll")
			};
		}
	}

	function render(context, items) {
		var me = this;

		if (!context || !items) {
			return;
		}

		me.html(tFeedbackBody, {
			items: items,
			getTypeInfo: getTypeInfo,
			formatDate: formatDate.bind(me),
			OSA: fbType.osa
		}).then(function () {
			//assign item object to summary row element
			var $rows = me[$ELEMENT].find(SEL_SUMMARY_ROW);
			items.forEach(function (item, index) {
				$rows.eq(index).data("summary", item);
			});

			//expand selected item and scroll into visible area
			var selectedItem = items.reduce(function (prev, item) {
				return prev || (item.isSelected && item)
			}, UNDEF);

			if (selectedItem) {
				var $selectedRow = me[$ELEMENT].find(SEL_SUMMARY_ROW + "[data-typecode='" + selectedItem.typeCode + "'][data-sourceid='" + selectedItem.feedback_id + "']");
				initItemDetail($selectedRow).then(function () {
					var $detail = $selectedRow.next().find(SEL_DETAIL);
					var scrollTop = $selectedRow.offset().top -
						$(SEL_HEADER).outerHeight() -
						($(window).height() - $(SEL_HEADER).outerHeight() - $selectedRow.height() - parseInt($detail.data("height"))) / 2;

					$(SEL_DOCUMENT).animate({
						scrollTop: scrollTop
					}, DURATION_SCROLL_DOWN, UNDEF, function animateDone() {
						expandItemDetail($selectedRow);
					});

					selectedItem.isSelected = false;
				});
			}
		});
	}

	return Widget.extend(function ($element, path, selectedItemInfo) {
		this[SELECTED_ITEM_INFO] = selectedItemInfo;
	}, {
		"hub:memory/context": function (context) {
			var me = this;
			render.call(me, me[CONTEXT] = context, me[ITEMS]);
		},

		"hub:memory/feedback/update-items": function (items) {
			var me = this;

			//isSelected
			if (me[SELECTED_ITEM_INFO]) {
				var typeCode = me[SELECTED_ITEM_INFO].typeCode;
				var feedbackId = me[SELECTED_ITEM_INFO].feedbackId;
				items.every(function (item) {
					if (String(item.feedback_id) === feedbackId && (item.typeCode === typeCode || item.categoryCode === typeCode)) {
						item.isSelected = true;
						delete me[SELECTED_ITEM_INFO];  //auto expand only once
						return false;
					}
					else {
						return true;
					}
				});
			}

			//isPassed
			items.forEach(function (item) {
				var passScore = item.typeCode === fbType.osa ? scoreState.osaPassScore : scoreState.passScore;
				item.isPassed = (item.grade >= passScore);
			});

			//isNew
			var newIds = [];
			items.forEach(function (item) {
				var itemId = item.typeCode + "_" + item.feedback_id;
				item.isNew = FeedbackIdManager.isNewId(itemId);
				item.isNew && newIds.push(itemId);
			});
			FeedbackIdManager.addIds(newIds);

			//get teacher info, then render
			var teacherQueries = items.filter(function (item) {
				return item.teacher;
			}).map(function (item) {
				return me.query(item.teacher.id).spread(function (teacher) {
					item.teacher = teacher;
				});
			});
			when.all(teacherQueries).then(function () {
				render.call(me, me[CONTEXT], me[ITEMS] = items);
			});
		},

		"dom:.ets-pr-fb-row/click": function (evt) {
			var $summaryRow = $(evt.currentTarget);
			toggleItemDetail($summaryRow);
		}
	});
});
