define([
	"poly",
	"jquery",
	"when",
	"shadow!jquery.jscrollpane#$=jquery&jQuery=jquery&exports=jQuery",
	"shadow!jquery.mousewheel#$=jquery&jQuery=jquery&exports=jQuery",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"school-ui-shared/utils/progress-state",
	"template!./ind-navigation.html",
	"template!./ind-card-image.html"
], function (
	poly,
	$,
	when,
	jScrollPane,
	mouseWheel,
	Widget,
	Load,
	progressState,
	template,
	imageTemplate
) {
	"use strict";

	var $ELEMENT = "$element";
	var SPIN_CARDS = '_spinCards';
	var MAX_PAGE_INDEX = '_maxPageIndex';
	var SELECTED_PAGE = '_selectedPage';
	var QUERIED_PAGE_IMAGES = '_queriedPageImages';
	var HTML_PROMISE = '_htmlPromise';

	var CLS_SELECTED = "ets-pr-selected";
	var CLS_NONE = 'ets-none';
	var CLS_DISABLED = 'ets-pr-disabled';

	var SEL_CARD = '.ets-pr-spin-nav-card';
	var SEL_PAGE = '.ets-pr-spin-nav-page';
	var SEL_CARD_IMAGE = '.ets-pr-spin-nav-card-image';
	var SEL_SELECTED = '.' + CLS_SELECTED;
	var SEL_PAGE_NUM = '.ets-pr-spin-nav-page-num';
	var SEL_PREVIOUS_PAGE_BUTTON = '.ets-pr-spin-nav-previous-page';
	var SEL_NEXT_PAGE_BUTTON = '.ets-pr-spin-nav-next-page';

	var CARDS_PER_PAGE = 3;

	function hasLevelProgressOrIsCurrent(studentLevel, currentEnroll) {
		return 	(studentLevel && studentLevel.progress && studentLevel.progress.state) ||
			(studentLevel.id === currentEnroll.studentLevel.id);
	}

	function compareCourses(prev, next) {
		return prev.children.length - next.children.length;
	}

	function computeSpinCards(initData) {
		var currentEnroll = initData.currentEnroll;
		var courses = initData.course.slice(0); // clone array
		courses.sort(compareCourses);
		var spinCards = [];
		courses.forEach(function (course) {
			course.children.forEach(function (level) {
				if (hasLevelProgressOrIsCurrent(level, currentEnroll)) {
					var current = level.studentLevelId === currentEnroll.studentLevelId;
					var passed = progressState.hasPassed(level.progress.state);
					var state;
					if (passed) {
						state = 'passed';
					} else if (current) {
						state = 'current';
					} else {
						state = 'progress';
					}
					spinCards.push({
						courseName: course.courseName,
						levelId: level.id,
						levelName: level.levelName,
						firstUnitId: level.children[0].id,
						state: state,
						current: current,
						archiveId: {
							e13: level.archiveId && level.archiveId.e13
						}
					});
				}
			});
		});
		return spinCards;
	}

	function quietQuery(queries) {
		// don't use this.query to avoid displaying spinner on page change
		return this.publish('query', queries);
	}

	function showSelectedPageImages() {
		var me = this;
		var pageIndex = me[SELECTED_PAGE];
		if (me[QUERIED_PAGE_IMAGES][pageIndex]) {
			return; // already queried images for this page
		}
		me[QUERIED_PAGE_IMAGES][pageIndex] = true;
		var queriedSpinCards = me[SPIN_CARDS].slice(pageIndex * CARDS_PER_PAGE, (pageIndex + 1) * CARDS_PER_PAGE);
		var queries = queriedSpinCards.map(function (spinCard) {
			return spinCard.firstUnitId + '.unitImage';
		});
		var htmlPromise = me[HTML_PROMISE];
		return when.all([
			quietQuery.call(me, queries),
			htmlPromise
		]).spread(function (units) {
			if (htmlPromise !== me[HTML_PROMISE]) {
				return; // race condition check
			}
			var $element = me[$ELEMENT];
			queriedSpinCards.forEach(function (spinCard, index) {
				var unit = units[index];
				if (unit.unitImage && unit.unitImage.url) {
					$element.find(SEL_CARD + '[data-id="' + spinCard.levelId + '"] ' + SEL_CARD_IMAGE)
						.css('background-image', "url('" + unit.unitImage.url + "')");
				}
			});
		});
	}

	function updateShownPage() {
		var me = this;
		var selectedPage = me[SELECTED_PAGE];
		var maxPageIndex = me[MAX_PAGE_INDEX];
		var $element = me[$ELEMENT];

		var $pages = $element.find(SEL_PAGE);
		$pages.addClass(CLS_NONE);
		var $selectedPage = $pages.eq(selectedPage);
		$selectedPage.removeClass(CLS_NONE);
		var pageNumText = String(selectedPage + 1);
		$element.find(SEL_PAGE_NUM).text(pageNumText);
		$element.find(SEL_PREVIOUS_PAGE_BUTTON)
			.toggleClass(CLS_DISABLED, selectedPage === 0);
		$element.find(SEL_NEXT_PAGE_BUTTON)
			.toggleClass(CLS_DISABLED, selectedPage >= maxPageIndex);

		showSelectedPageImages.call(me);
	}

	function selectLevel(levelId, archiveId) {
		var me = this;
		me.publish('progress-report/spin/state-circle/selected', levelId);
		Load.loadLevel("ind", levelId, archiveId);
	}

	return Widget.extend(function ($element, name, initData) {
		this[SPIN_CARDS] = computeSpinCards(initData);
		this[MAX_PAGE_INDEX] = Math.floor((this[SPIN_CARDS].length - 1) / CARDS_PER_PAGE);
		this[QUERIED_PAGE_IMAGES] = {}; // mapping page index -> boolean (true if queried)
		this[HTML_PROMISE] = null;
	}, {
		"sig/start": function () {
			var me = this;
			var spinCards = this[SPIN_CARDS];

			var selectedPage = 0;
			var selectedSpinCard = spinCards[0];
			spinCards.every(function (spinCard, cardIndex) {
				if (spinCard.current) {
					selectedSpinCard = spinCard;
					selectedPage = Math.floor(cardIndex / CARDS_PER_PAGE);
					return false;
				} else {
					return true;
				}
			});
			var selectedLevelId = selectedSpinCard && selectedSpinCard.levelId;
			var selectedArchiveLevelId = selectedSpinCard && selectedSpinCard.archiveId;

			me[SELECTED_PAGE] = selectedPage;

			me[QUERIED_PAGE_IMAGES] = {};
			me[HTML_PROMISE] = me.html(template, {
				selectedLevelId: selectedLevelId,
				selectedPage: selectedPage,
				spinCards: spinCards,
				cardsPerPage: CARDS_PER_PAGE,
				maxPageIndex: me[MAX_PAGE_INDEX]
			}).then(function(){
				updateShownPage.call(me);
			});

			showSelectedPageImages.call(me); // early query of current page images
			selectLevel.call(me, selectedLevelId, selectedArchiveLevelId);
		},
		"sig/stop": function () {
			this[QUERIED_PAGE_IMAGES] = {};
			this[HTML_PROMISE] = null;
		},
		"dom:[data-action=previous-page]/click": function () {
			var me = this;
			if (me[SELECTED_PAGE] > 0) {
				me[SELECTED_PAGE] -= 1;
				updateShownPage.call(me);
			}
		},
		"dom:[data-action=next-page]/click": function () {
			var me = this;
			if (me[SELECTED_PAGE] < me[MAX_PAGE_INDEX]) {
				me[SELECTED_PAGE] += 1;
				updateShownPage.call(me);
			}
		},
		"dom:.ets-pr-spin-nav-card/click": function (evt) {
			var me = this;
			var $target = $(evt.currentTarget);
			if (!$target.hasClass(CLS_SELECTED)) {
				var levelId = $target.data("id");
				var archiveE13LevelId=$target.data("archiveE13LevelId");
				me[$ELEMENT].find(SEL_SELECTED).removeClass(CLS_SELECTED);
				$target.addClass(CLS_SELECTED);
				selectLevel.call(me, levelId, {e13: archiveE13LevelId});
			}
		}
	});
});
