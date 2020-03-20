define('school-ui-progress-report/enum/feedback-category',{
	writing: "WRITING",
	evc: "EVC",
	none: "NONE"
});
define('school-ui-progress-report/enum/feedback-typecode',{
	writing: "WANI",
	eftv: "EFTV",
	gl: "GL",
	pl: "PL",
	cp20: "CP20",
	osa: "OSA"
});
define('school-ui-progress-report/enum/score-state',{
	passScore: 70,
	osaPassScore: 60
});

define('school-ui-progress-report/service/hash',[
	"when",
	"troopjs-ef/component/service",
	"troopjs-browser/route/uri"
], function (when, Service, URI) {
	"use strict";

	var ROUTE = "_route";

	function string2uri(hash) {
		return URI(hash);
	}

	function uri2string(uri) {
		var result = "";
		if (uri.path) {
			result += uri.path.toString();
		}
		if (uri.query) {
			result += "?" + uri.query.toString();
		}
		return result;
	}

	return Service.extend({
		"displayName": "school-ui-progress-report/service/navigate",

		"hub:memory/route": function onRoute(uri) {
			var me = this;

			if (!(me[ROUTE] && uri && me[ROUTE].toString() === uri.toString())) {
				me.publish("navigate", uri2string(uri));
			}
		},

		"hub/navigate": function (hash) {
			var me = this;
			return me.publish("navigation/verify", string2uri(hash)).spread(function (hash) {
				me[ROUTE] = string2uri(hash);
				return me.publish("route/set", me[ROUTE]).then(function () {
					return me.publish("navigate/to", me[ROUTE]);
				});
			});
		}
	});
});
define('school-ui-progress-report/utils/feedback-category',[
	"school-ui-progress-report/enum/feedback-typecode",
	"school-ui-progress-report/enum/feedback-category"
], function (fbType, fbCategory) {
	function getCategoryCode(fbTypeCode) {
		switch (fbTypeCode) {
			case fbType.writing:
				return fbCategory.writing;
			case fbType.gl:
			case fbType.pl:
			case fbType.cp20:
			case fbType.eftv:
				return fbCategory.evc;
			default:
				return fbCategory.none;
		}
	}

	return {
		getCategoryCode: getCategoryCode
	};
});

define('troopjs-requirejs/template!school-ui-progress-report/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-pr-main\">\n\t<!--dynamic create widget-->\n\t<!--<div class=\"ets-pr-navigation\" data-weave=\"school-ui-progress-report/widget/navigation/main\"></div>-->\n\t<!--<div class=\"ets-pr-container\" data-weave=\"school-ui-progress-report/widget/container/main\"></div>-->\n</div>\n\n<div data-weave=\"school-ui-shared/plugins/confirm-box/main\"></div>\n<div class=\"ets-sp-loading ets-none\">\n\t<div class=\"ets-inner\">\n\t\t<div class=\"ets-inner-cell\">\n\t\t\t<div class=\"ets-icon\">\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-backdrop\"></div>\n</div>"; return o; }; });
define('school-ui-progress-report/main',[
	"jquery",
	"poly",
	"when",
	"underscore",
	"quill",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-progress-report/service/hash",
	"school-ui-shared/enum/course-type",
	"school-ui-progress-report/enum/feedback-typecode",
	"school-ui-progress-report/utils/feedback-category",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/utils/console",
	"template!./main.html"
], function (
	$,
	poly,
	when,
	_,
	Quill,
	Widget,
	loom,
	weave,
	hashService,
	courseType,
	fbType,
	fbCategoryUtil,
	Parser,
	Console,
	tMain
) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_PR_NAV = "ets-pr-navigation",
		CLS_PR_CON = "ets-pr-container";

	var SEL_PR = ".ets-pr-main";

	var WIDGET_NAV = "school-ui-progress-report/widget/navigation/main",
		WIDGET_CON = "school-ui-progress-report/widget/container/main";

	function convertArchiveWritingItem(item) {
		//reserve troop object for later expanding (.teacher)
		var detail = item.detail || {};

		$.extend(true, item, {
			isArchive: true,
			feedback_id: item.studentCourseItemArchiveId || detail.feedback_id,
			startTime: item.submitDateTime || detail.startTime, //detail.startTime has lower priority
			grade: detail.grade || item.grade,
			teacher: detail.teacher,
			title: item.topic || "",
			detail: {
				startTime: item.submitDateTime || detail.startTime, //detail.startTime has lower priority
				topic: item.topic || "",
				grade: detail.grade || item.grade,
				comment: detail.comment || "",
				correction: detail.correction || "",
				correctedTime: detail.correctedTime || ""
			}
		});

		return item;
	}

	function isLegacyEvc() {
		var me = this;
		return me.query("member_site_setting!'school;student.evc.version'").spread(function (setting) {
			return !setting || !setting.value || parseFloat(setting.value) < 2;
		});
	}

	function queryArchiveWritingFeedbacks() {
		var me = this;
		return me.query('student_archive_writing!*.items.detail')
		.spread(function (list) {
			return list.items.map(convertArchiveWritingItem);
		});
	}

	function queryLegacyFeedbacks() {
		var me = this;
		return me.query("student_feedback_list!current").spread(function (list) {
			return list.items;
		});
	}

	function queryIntegrationFeedbacks() {
		var me = this;
		return me.query("integration_student_feedback_list!current").spread(function (list) {
			// Adding a property 'feedback_id'
			// to make the items be compatible with the old feedback service
			list.items.forEach(function (item) {
				if (!item.feedback_id) {
					item.feedback_id = item.feedbackId;
				}
			});
			return list.items;
		});
	}

	function filterFeedbacks(feedbacks, types) {
		return feedbacks.filter(function (feedback) {
			return types.indexOf(feedback.typeCode) > -1;
		});
	}

	function appendWidget(data) {
		var me = this;

		var $nav = $("<div>").attr(loom.weave, WIDGET_NAV).data("assets", $.extend({}, data)).addClass(CLS_PR_NAV);
		var $con = $("<div>").attr(loom.weave, WIDGET_CON).data("assets", $.extend({}, data)).addClass(CLS_PR_CON);

		me[$ELEMENT].find(SEL_PR).empty().append($nav).append($con);
		return me.weave();
	}

	function hookArchiveCourseLevel(courses, archiveCourseName, archiveCourse) {
		archiveCourse && courses.forEach(function (course) {
			if (course.courseTypeCode === archiveCourse.courseTypeCode) {
				if (!course.archiveId) {
					course.archiveId = {};
				}
				course.archiveId[archiveCourseName] = archiveCourse.id;

				course.children.forEach(function (level) {
					if (!level.archiveId) {
						level.archiveId = {};
					}
					var archiveLevel = _.find(archiveCourse.children, function (archiveLevel) {
						return level.levelNo === archiveLevel.levelNo
					});
					if (archiveLevel) {
						level.archiveId[archiveCourseName] = archiveLevel.id;
					}
				});
			}
		});
	}

	function initQuill() {
		var SizeStyleModule = Quill.import("attributors/style/size");
		SizeStyleModule.whitelist = null; // disable size whitelisting
		Quill.register(SizeStyleModule, true);
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			initQuill();

			var widgetData = {};

			return me.html(tMain)
				.then(function () {
					// Split in multiple functions, let troop optimize and merge requests
					return when.all([
						me.loadEnrollableCourse(widgetData),
						me.loadCurrentEnrollment(widgetData),
						me.loadFeedbackList(widgetData),
						me.loadTestResults(widgetData)
					]);
				})
				.then(function () {
					return appendWidget.call(me, widgetData);
				})
				.then(function () {
					hashService().start();
				});
		},

		"loadEnrollableCourse": function (widgetData) {
			var me = this;

			/*
			archive type id description from database:
			SELECT * FROM School_0.dbo.StudentCourseItemArchiveTagType_lkp
			SELECT * FROM School_0.dbo.StudentCourseItemArchiveType_lkp
			*/
			return me.query([
				"student_enrollable_courses!*.items.children.progress",
				"student_course_archive!1;1;GE.children",
				"student_course_archive!2;7;GE.children",
				"student_course_archive!2;8;BE.children"
			]).spread(function (enrollableCourses, archiveE10GECourse, archiveE13GECourse, archiveE13BECourse) {
				//hook legacy course data (BEFORE level number mapping)
				hookArchiveCourseLevel(enrollableCourses.items, 'e10', archiveE10GECourse);
				hookArchiveCourseLevel(enrollableCourses.items, 'e13', archiveE13GECourse);
				hookArchiveCourseLevel(enrollableCourses.items, 'e13', archiveE13BECourse);

				//hook enrollment information
				var courseEnrollQ = [];
				enrollableCourses.items.forEach(function (course) {
					if (!course.isTemplate && course.studentCourseId) {
						courseEnrollQ.push("student_course_enrollment!" + course.studentCourseId)
					}
				});
				return me.query(courseEnrollQ).spread(function () {
					$.each(arguments, function (index, courseEnroll) {
						var courseEnrollId = Parser.parseId(courseEnroll.id);

						enrollableCourses.items.forEach(function (course) {
							if (course.studentCourseId === courseEnrollId) {
								course.currentEnroll = courseEnroll;
							}
						});
					});
					widgetData.enrollable_course = $.extend({}, enrollableCourses);
				});
			});
		},

		"loadCurrentEnrollment": function (widgetData) {
			var me = this;
			return me.query("student_course_enrollment!current")
				.spread(function (current_enroll) {
					widgetData.current_enroll = $.extend({}, current_enroll);
				});
		},

		"loadFeedbackList": function (widgetData) {
			var me = this;
			var queries = [
				queryArchiveWritingFeedbacks.call(me),
				queryIntegrationFeedbacks.call(me)
			];
			return isLegacyEvc.call(me).then(function(isLegacy){
				if(isLegacy){
					queries.push(queryLegacyFeedbacks.call(me));
				}
				return when.all(queries).spread(function (archiveWritingFeedbacks, integrationFeedbacks, legacyFeedbacks) {
					if(legacyFeedbacks){
						widgetData.feedbacks = [].concat(
							archiveWritingFeedbacks,
							filterFeedbacks(integrationFeedbacks, [fbType.writing]),
							filterFeedbacks(legacyFeedbacks, [fbType.gl, fbType.pl, fbType.cp20, fbType.eftv, fbType.osa])
						);
					} else {
						widgetData.feedbacks = [].concat(
							archiveWritingFeedbacks,
							integrationFeedbacks
						);
					}
					widgetData.feedbacks.forEach(function (feedback) {
						feedback.categoryCode = fbCategoryUtil.getCategoryCode(feedback.typeCode);
					});
					widgetData.feedbacks.sort(function (itemA, itemB) {
						return itemB.startTime - itemA.startTime; // sort by startTime descending
					});
				});
			});
		},

		"loadTestResults": function (widgetData) {
			var me = this;
			return me.publish("school/interface/progress-report/test-results-widget", "").then(function (widgetPath) {
				//widgetPath can be "some/widget/path" or ["some/widget/path"]
				widgetData.test_results_widget = String(widgetPath);
			});
		},

		"hub:memory/school/spinner": function showSpinner(promise) {
			var me = this;

			me.task(function (resolve, reject, progress) {
				return promise
					.then(resolve, reject, progress);
			});
		}
	});
});
define('school-ui-progress-report', ['school-ui-progress-report/main'], function (main) { return main; });

define('school-ui-progress-report/utils/load',[
	"when",
	"client-tracking",
	"school-ui-shared/enum/course-type",
	"troopjs-ef/component/gadget"
], function (when, ct, courseType, Gadget) {
	"use strict";

	var UNDEF;

	function tracking(level) {
		var me = this;
		var pagename;
		if (courseType.isGECourse(level.parent.courseTypeCode)) {
			pagename = "ProgressReport:GE:Level" + level.levelNo;
			me.publish("tracking/pagename", "ge", pagename);
		} else if (courseType.isSpinCourse(level.parent.courseTypeCode)) {
			pagename = "ProgressReport:SPIN:" + level.parent.courseTypeCode + ":" + level.templateLevelId;
			me.publish("tracking/pagename", "spin", pagename);
		}

		ct.pagename(pagename);
	}

	return Gadget.create({
		loadLevel: function (page, levelId, archiveLevelId) {
			var me = this;
			var promise = me.query([
				levelId + ".children.progress,.children.children.progress.detail,.levelTest.progress",
				archiveLevelId && archiveLevelId.e10 && archiveLevelId.e10 + ".children.progress,.children.children.progress.detail",
				archiveLevelId && archiveLevelId.e13 && archiveLevelId.e13 + ".children.progress,.children.children.progress.detail"
			]).spread(function (level, archiveE10Level, archiveE13Level) {
				me.publish("load/level", page, {
					level: level,
					archiveLevel: {
						e10: archiveE10Level,
						e13: archiveE13Level
					}
				});

				tracking.call(me, level);
			});

			me.publish("school/spinner", promise);
		}
	});
});




define('troopjs-requirejs/template!school-ui-progress-report/widget/container/be/be-navigation/be-navigation.html',[],function() { return function template(data) { var o = "";
var cardsPerPage = data.cardsPerPage;
var spinCards = data.spinCards;

function renderSpinCard(spinCard) {
	var classes = ['ets-pr-spin-nav-card'];
	if (spinCard.levelId === data.selectedLevelId) {
		classes.push('ets-pr-selected');
	}
	// be careful not to leave line return or spaces around cards
o += "<span class=\"" +classes.join(' ')+ "\" data-id=\"" +spinCard.levelId+ "\" data-archive-e13-level-id=\"" +(spinCard.archiveId && spinCard.archiveId.e13 || '') + "\">\n\t<span class=\"ets-pr-spin-nav-card-header\">\n\t\t<span class=\"ets-pr-spin-nav-card-image\"></span>\n\t</span>\n\t<span class=\"ets-pr-spin-nav-card-content\">\n\t\t<span class=\"ets-pr-spin-nav-card-course\">" +spinCard.courseName+ "</span>\n\t\t<span class=\"ets-pr-spin-nav-card-level\">" +spinCard.levelName+ "</span>\n\t</span>\n\t<span data-state=\"" +spinCard.state+ "\" data-id=\"" +spinCard.levelId+ "\"\n\t      class=\"ets-pr-spin-nav-card-progress\"\n\t     data-weave=\"school-ui-progress-report/widget/container/be/be-navigation/state-circle\"></span>\n</span>";
}

function renderSpinCardsPage(pageCards, pageIndex) {
	var classes = ['ets-pr-spin-nav-page'];
	if (pageIndex !== data.selectedPage) {
		classes.push('ets-none');
	}
o += "<div class=\"" +classes.join(' ')+ "\">";
	pageCards.forEach(renderSpinCard);
o += "</div>";
}


// TEMPLATE BEGIN

o += "\n<div class=\"ets-pr-spin-nav ets-pr-header-content\">\n";
	var pageIndex = 0;
	for (var cardIndex = 0; cardIndex < spinCards.length; cardIndex+=cardsPerPage) {
		var pageCards = spinCards.slice(cardIndex, cardIndex+cardsPerPage);
		renderSpinCardsPage(pageCards, pageIndex);
		++pageIndex;
	}
o += "\n"; if (spinCards.length > cardsPerPage) { o += "\n\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_spin_previous_page',11,21)\"\n\t     class=\"ets-pr-spin-nav-previous-page ets-pr-disabled\" data-action=\"previous-page\"></div>\n\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_spin_next_page',11,21)\"\n\t     class=\"ets-pr-spin-nav-next-page ets-pr-disabled\" data-action=\"next-page\"></div>\n\t<div class=\"ets-pr-spin-nav-pagination\" data-weave=\"troopjs-ef/blurb/widget\"\n\t     data-blurb-id=\"694984\" data-text-en=\"^number^ / ^total^\"\n\t     data-values=\"{&quot;total&quot;:" +String(data.maxPageIndex+1)+ "}\">\n\t\t<span class=\"ets-pr-spin-nav-page-num\" data-value-name=\"number\"></span>\n\t</div>\n"; } o += "\n\n"; if (spinCards.length === 0) { o += "\n\t<div class=\"ets-pr-header-no-course\">\n\t\t<div class=\"ets-pr-header-no-course-content\">\n\t\t\t<div class=\"ets-pr-header-content-start\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"719531\"></div>\n\t\t\t<div class=\"ets-pr-header-content-detail\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"719536\"></div>\n\t\t</div>\n\t</div>\n"; } o += "\n</div>\n<div class=\"ets-pr-nav-bottom-border\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/be/be-navigation/be-card-image.html',[],function() { return function template(data) { var o = "<div style=\"background-image: url('" +data.imageUrl+ "')\"\n\t\tclass=\"ets-pr-spin-nav-card-image\"></div>"; return o; }; });
define('school-ui-progress-report/widget/container/be/be-navigation/main',[
	"poly",
	"jquery",
	"when",
	"shadow!jquery.jscrollpane#$=jquery&jQuery=jquery&exports=jQuery",
	"shadow!jquery.mousewheel#$=jquery&jQuery=jquery&exports=jQuery",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"school-ui-shared/utils/progress-state",
	"template!./be-navigation.html",
	"template!./be-card-image.html"
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
		Load.loadLevel("be", levelId, archiveId);
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


define('troopjs-requirejs/template!school-ui-progress-report/widget/shared/state-circle/state-circle.html',[],function() { return function template(data) { var o = "";
var iconName = {
	passed: 'ico_circle_green',
	current: 'ico_circle_blue',
	progress: 'ico_circle_black'
}[data.state] || 'ico_circle_gray';
o += "\n<div class=\"ets-pr-state-circle\"\n     data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/" +iconName+ "',32,32)\"\n></div>"; return o; }; });
define('school-ui-progress-report/widget/shared/state-circle/main',[
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
define('school-ui-progress-report/widget/container/be/be-navigation/state-circle',[
	"school-ui-progress-report/widget/shared/state-circle/main"
], function (StateCircleWidget) {
	"use strict";

	return StateCircleWidget.extend({
		"hub:memory/progress-report/spin/state-circle/selected": function (selectedId) {
			this.setSelected(selectedId);
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/be/be.html',[],function() { return function template(data) { var o = "<div class=\"ets-pr-header\">\n\t<div class=\"ets-pr-header-nav\" data-weave=\"school-ui-progress-report/widget/container/be/be-navigation/main('initData')\"></div>\n\t<div class=\"ets-pr-level-info ets-pr-header-content\" data-weave=\"school-ui-progress-report/widget/shared/level-info/main('be')\"></div>\n</div>\n<div class=\"ets-pr-body\">\n\t<div class=\"ets-pr-content\">\n\t\t<div class=\"ets-pr-unit\">\n\t\t\t<div class=\"ets-pr-unit-list\" data-weave=\"school-ui-progress-report/widget/shared/unit-list/normal/main('be','initData')\"></div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/be/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"template!./be.html"
], function ($, Widget, Load, tSpin) {
	"use strict";

	var INIT_DATA = "_init_data";
	var $ELEMENT = "$element";

	return Widget.extend(function ($element, path, initData) {
		this[INIT_DATA] = initData;
	}, {
		"sig/start": function () {
			var me = this;
			me[$ELEMENT].html(tSpin());
			me[$ELEMENT].find(".ets-pr-header-nav").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-unit-list").data("initData", me[INIT_DATA]);
			return me.weave();
		}
	});
});

define('school-ui-progress-report/widget/container/feedback/feedback-id-manager',[
	"poly",
	"troopjs-ef/component/gadget"
], function (poly, Gadget) {

	var localStorage = window.localStorage;

	var FEEDBACK_IDS = "_progress_report_viewed_feedback_ids";
	var ID_SEPARATOR = ",";

	return Gadget.create(function () {
			this.loadIds();
		},
		{
			"loadIds": function () {
				this[FEEDBACK_IDS] = localStorage.getItem(FEEDBACK_IDS) || ID_SEPARATOR;
			},
			"saveIds": function () {
				localStorage.setItem(FEEDBACK_IDS, this[FEEDBACK_IDS]);
			},
			"isNewId": function (id) {
				var checkId = ID_SEPARATOR + id.toString() + ID_SEPARATOR;
				return this[FEEDBACK_IDS].indexOf(checkId) === -1;
			},
			"addIds": function (ids) {
				var me = this;
				var newIds = [];

				ids.forEach(function (id) {
					me.isNewId(id) && newIds.push(id);
				});

				if (newIds.length) {
					me[FEEDBACK_IDS] = ID_SEPARATOR + newIds.join(ID_SEPARATOR) + me[FEEDBACK_IDS];
					me.saveIds();
				}
			}
		}
	);
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-body/feedback-body.html',[],function() { return function template(data) { var o = "";
var feedbacks = data.items;
var getTypeInfo = data.getTypeInfo;
var formatDate = data.formatDate;
var OSA = data.OSA;
o += "\n\n"; for(var i = 0; i < feedbacks.length ; i++) {
	var item = feedbacks[i];
	var typeInfo = getTypeInfo(item.typeCode);
	var dateFormat = formatDate(item.startTime);
	var grade = item.osaGradedStatus || item.grade;
	o += "\n\t<tr class=\"ets-pr-fb-row\" data-sourceId=\"" + item.feedback_id + "\" data-typeCode=\"" + item.typeCode + "\">\n\t\t<td class=\"ets-pr-fb-date\"><span>\n\t\t\t"; if(item.isNew){ o += "<em data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659693\" data-text-en=\"New\"></em>"; } o += "\n\t\t\t"; if(dateFormat.blurbId) { o += "<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +dateFormat.blurbId+ "\" data-text-en=\"" +dateFormat.blurbTextEn+ "\"></span>"; } o += " " + dateFormat.passedDate + "\n\t\t</span></td>\n\t\t<td class=\"ets-pr-fb-summary\"><span>\n\t\t\t"; if(item.typeCode !== OSA && item.courseBreadCrumb) { o += "<span class=\"ets-pr-fb-course-bread-crumb\">" + item.courseBreadCrumb + "</span>"; } o += "\n\t\t\t<span class=\"ets-pr-fb-title\">" + item.title + "</span>\n\t\t\t"; if(item.teacher) { o += "\n\t\t\t\t<span class=\"ets-pr-fb-teacher\">\n\t\t\t\t\t<span data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_teacher',25.5,15.5)\"></span>\n\t\t\t\t\t" + item.teacher.displayName + "\n\t\t\t\t</span>\n\t\t\t"; } o += "\n\t\t</span></td>\n\t\t<td class=\"ets-pr-fb-type\"><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +typeInfo.blurbId+ "\" data-text-en=\"" +typeInfo.blurbTextEn+ "\"></span></td>\n\t\t<td class=\"ets-pr-fb-device\">\n\t\t\t";if (item.device === "Mobile") {o += "\n\t\t\t\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_mobilephone',20,22)\" data-at-device=\"mobile\"></div>\n\t\t\t";} else if (item.device === "PC") {o += "\n\t\t\t\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_pc',44,29)\" data-at-device=\"desktop\"></div>\n\t\t\t";}o += "\n\t\t</td>\n\t\t<td class=\"ets-pr-fb-score " + (item.isPassed ? 'ets-pr-fb-passed' : 'ets-pr-fb-not-passed')+ "\"><span>" + grade + "</span></td>\n\t</tr>\n"; }  return o; }; });
define('school-ui-progress-report/widget/container/feedback/feedback-body/main',[
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


define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/class-notes/class-notes.html',[],function() { return function template(data) { var o = "<button data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708503\" data-text-en=\"CLASS NOTES\" class=\"ets-pr-fb-btn ets-pr-fb-btn-class-notes\"></button>\n<div class=\"ets-pr-fb-class-notes-backdrop ets-none\">\n\t<div class=\"ets-pr-fb-class-notes-wrapper\">\n\t\t<button type=\"button\" class=\"ets-pr-fb-class-notes-close\"></button>\n\t\t<h6 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708503\" data-text-en=\"CLASS NOTES\"></h6>\n\t\t<div class=\"ets-pr-fb-class-notes-container\">\n\t\t\t<div class=\"ets-pr-fb-class-notes-content\"></div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/feedback/feedback-detail/class-notes/main',[
	"quill",
	"troopjs-ef/component/widget",
	"template!./class-notes.html",
], function (Quill, Widget, tClassNotes) {
	"use strict";

	var CLS_NONE = "ets-none";
	var CLS_MODAL_OPEN = "modal-open";

	var SEL_NOTES_BACKDROP = '.ets-pr-fb-class-notes-backdrop';
	var SEL_NOTES_CONTENT = '.ets-pr-fb-class-notes-content';

	var RE_NEWLINE = /\n/g;
	var NEWLINE_ESCAPE = '\\n';

	return Widget.extend({
		'sig/start': function () {
			var me = this;
			var notes = me.$element.data('notes');
			if (!notes) {
				return;
			}

			me.html(tClassNotes).then(function () {
				var notesData;

				try {
					notesData = JSON.parse(notes.replace(RE_NEWLINE, NEWLINE_ESCAPE));
				}
				catch (ex) {
					notesData = {ops: [{insert: String(notes)}]};
				}

				var quill = new Quill(me.$element.find(SEL_NOTES_CONTENT)[0], {
					readOnly: true
				});

				quill.setContents(notesData);
			});
		},

		'dom:.ets-pr-fb-btn-class-notes/click': function () {
			$(document.body).addClass(CLS_MODAL_OPEN);
			this.$element.find(SEL_NOTES_BACKDROP).removeClass(CLS_NONE);
		},

		'dom:.ets-pr-fb-class-notes-close,.ets-pr-fb-class-notes-backdrop/click': function (evt) {
			if (evt.currentTarget === evt.target) {
				$(document.body).removeClass(CLS_MODAL_OPEN);
				this.$element.find(SEL_NOTES_BACKDROP).addClass(CLS_NONE);
			}
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/class-video/main.html',[],function() { return function template(data) { var o = "<button class=\"ets-pr-fb-btn ets-pr-fb-btn-class-video\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708502\" data-text-en=\"Class video\"></button>\n<div class=\"hidden ets-pr-fb-video\">\n    <video title=\"" + data.topic + "\" width=\"600\" height=\"400\" preload=\"none\" class=\"ef-mejs-video\">\n        <source type=\"video/mp4\" src=\"" + data.video + "\" />\n    </video>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/feedback/feedback-detail/class-video/main',[
	"jquery",
	"when",
	"mediaelement-with-plugins",
	"troopjs-ef/component/widget",
	"template!./main.html",
], function ($, when, mejs, Widget, template) {

	var SEL_DETAIL = ".ets-pr-fb-detail";
	var SEL_VIDEO = '.ets-pr-fb-video';
	var SEL_PLAYER = '.ef-mejs-video';
	var PLAYER_FEATURES = ['playpause','current','progress','duration','tracks','volume','fullscreen','title'];
	var PLAYER_CONTROLS_TIMEOUT_MOUSELEAVE = 2000;

	function getTopic () {
		var blurbId = this.options.topicBlurbId;
		if (blurbId) {
			return this.query('blurb!' + blurbId).spread(function (blurb) {
				return blurb && blurb.translation;
			});
		} else {
			return when.resolve(this.options.topic);
		}
	}

	return Widget.extend(function ($element, path, options) {
		this.options = options || {};
	}, {
		"sig/start": function () {
			var me = this;
			if (!me.options.video) {
				return;
			}

			return getTopic.call(me).then(function (topic) {
				return me.html(template({
					topic: topic || '',
					video: me.options.video
				}));
			});
		},

		'dom:.ets-pr-fb-btn-class-video/click': function (e) {
			var $button = $(e.currentTarget);
			var $video = this.$element.find(SEL_VIDEO);
			var $detail = $button.closest(SEL_DETAIL);
			var height = $detail.height();
			var $player;

			// show the video player
			$button.remove();
			$video.removeClass('hidden');
			$player = $video.find(SEL_PLAYER).mediaelementplayer({
				features: PLAYER_FEATURES,
				controlsTimeoutMouseLeave: PLAYER_CONTROLS_TIMEOUT_MOUSELEAVE
			});

			// autoplay
			$player.data('mediaelementplayer').play();

			// update the height for the effect of animation
			height += $video.height();
			$detail
				.height(height)
				.data("height", height);
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/writing.html',[],function() { return function template(data) { var o = "";
	var summary = data.summary;
	var feedback = data.feedback;
	var teacher = data.teacher;
o += "\n<div class=\"ets-pr-fb-detail ets-pr-fb-detail-writing ets-none ets-pr-fb-open\">\n\t<div class=\"ets-pr-fb-teacher\">\n\t\t"; if (teacher) { o += "\n\t\t<img src=\"" + teacher.imageUrl + "\"/>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659698\" data-text-en=\"Teacher\"></span>\n\t\t<span>" + teacher.displayName + "</span>\n\t\t"; } o += "\n\t</div>\n\t<div class=\"ets-pr-fb-content\">\n\t\t"; if (feedback.topic) { o += "\n\t\t\t<h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659699\" data-text-en=\"Topic\"></h5>\n\t\t\t<p>" + feedback.topic + "</p>\n\t\t"; } o += "\n\n\t\t"; if (feedback.comment) { o += "\n\t\t\t<h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708940\" data-text-en=\"Teacher's comments\"></h5>\n\t\t\t<p>" + feedback.comment + "</p>\n\t\t"; } o += "\n\n\t\t<div class=\"ets-pr-fb-correction\" data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-detail/writing-correction/main\"></div>\n\n\t\t<div class=\"ets-pr-fb-content-buttons\">\n\t\t\t"; if(!summary.isArchive) { o += "\n\t\t\t<button type=\"button\" class=\"ets-pr-btn ets-pr-fb-open-survey-button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"701043\" data-text-en=\"Writing Challenge Survey\"></button>\n\t\t\t"; } o += "\n\t\t</div>\n\t</div>\n\t<div class=\"ets-pr-fb-score-large\">\n\t\t<span class=\"ets-pr-fb-score-num\">" + feedback.grade + "</span>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659692\" data-text-en=\"Score\"></span>\n\t</div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/gl.html',[],function() { return function template(data) { var o = "";
	var _ = data._;
	var teacher = data.teacher;
	var feedback = data.feedback;
o += "\n<div class=\"ets-pr-fb-detail ets-pr-fb-detail-gl ets-none ets-pr-fb-open\">\n\t<div class=\"ets-pr-fb-teacher\">\n\t\t"; if (teacher) { o += "\n\t\t<img src=\"" + teacher.imageUrl + "\"/>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659698\" data-text-en=\"Teacher\"></span>\n\t\t<span>" + teacher.displayName + "</span>\n\t\t"; } o += "\n\t</div>\n\t<div class=\"ets-pr-fb-content\">\n\t\t<div class=\"ets-pr-fb-score-large\">\n\t\t\t<span class=\"ets-pr-fb-score-num\">" + feedback.grade + "</span>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659692\" data-text-en=\"Score\"></span>\n\t\t</div>\n\n\t\t";if(feedback.lessonSummary){o += "\n\t\t\t<h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708940\" data-text-en=\"Teacher's comments\"></h5>\n\t\t\t<p>" + _.escape(feedback.lessonSummary) + "</p>\n\t\t";}o += "\n\n\t\t";if(feedback.overall){o += "\n\t\t\t<h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"711390\" data-text-en=\"GENERAL COMMENTS\"></h5>\n\t\t\t<p>" + _.escape(feedback.overall) + "</p>\n\t\t";}o += "\n\n\t\t"; if (data.videoRecoredEnabled) { o += "\n\t\t\t<div class=\"ets-pr-fb-video-and-notes\" data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-detail/video-and-notes/main(options)\"></div>\n\t\t"; } o += "\n\t</div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/pl.html',[],function() { return function template(data) { var o = "";
	var _ = data._;
	var teacher = data.teacher;
	var feedback = data.feedback;
o += "\n<div class=\"ets-pr-fb-detail ets-pr-fb-detail-pl ets-none ets-pr-fb-open\">\n\t<div class=\"ets-pr-fb-teacher\">\n\t\t"; if (teacher) { o += "\n\t\t<img src=\"" + teacher.imageUrl + "\"/>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659698\" data-text-en=\"Teacher\"></span>\n\t\t<span>" + teacher.displayName + "</span>\n\t\t"; } o += "\n\t</div>\n\t<div class=\"ets-pr-fb-content\">\n\t\t<div class=\"ets-pr-fb-score-large\">\n\t\t\t<span class=\"ets-pr-fb-score-num\">" + feedback.grade + "</span>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659692\" data-text-en=\"Score\"></span>\n\t\t</div>\n\n\t\t<h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708940\" data-text-en=\"Teacher's comments\"></h5>\n\t\t<p>" + _.escape(feedback.overall) + "</p>\n\n\t";if (feedback.gradingType === 0) {o += "\n\t\t<div class=\"ets-pr-fb-lists\">\n\t\t";if (feedback.details.showClarity) {o += "\n\t\t<h6>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672774\" data-text-en=\"Clarity\"></span>\n\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.clarityGrade+ "</span>\n\t\t</h6>\n\t\t<dl>\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.clarityStrength+ "</dd>\n\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.clarityImprovement+ "</dd>\n\t\t</dl>\n\t\t";}o += "\n\n\t\t";if (feedback.details.showConfidence) {o += "\n\t\t<h6>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672775\" data-text-en=\"Confidence\"></span>\n\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.confidenceGrade+ "</span>\n\t\t</h6>\n\t\t<dl>\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.confidenceStrength+ "</dd>\n\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.confidenceImprovement+ "</dd>\n\t\t</dl>\n\t\t";}o += "\n\n\t\t";if (feedback.details.showExpression) {o += "\n\t\t<h6>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672776\" data-text-en=\"Expression\"></span>\n\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.expressionGrade+ "</span>\n\t\t</h6>\n\t\t<dl>\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.expressionStrength+ "</dd>\n\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.expressionImprovement+ "</dd>\n\t\t</dl>\n\t\t";}o += "\n\n\t\t";if (feedback.details.showAccuracy) {o += "\n\t\t<h6>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672777\" data-text-en=\"Accuracy\"></span>\n\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.accuracyGrade+ "</span>\n\t\t</h6>\n\t\t<dl>\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.accuracyStrength+ "</dd>\n\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.accuracyImprovement+ "</dd>\n\t\t</dl>\n\t\t";}o += "\n\n\t\t";if (feedback.details.showRange) {o += "\n\t\t<h6>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672778\" data-text-en=\"Range\"></span>\n\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.rangeGrade+ "</span>\n\t\t</h6>\n\t\t<dl>\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.rangeStrength+ "</dd>\n\n\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t<dd>" + feedback.details.rangeImprovement+ "</dd>\n\t\t</dl>\n\t\t"; } o += "\n\t\t</div>\n\t"; } o += "\n\t\t"; if (data.videoRecoredEnabled) { o += "\n\t\t\t<div class=\"ets-pr-fb-video-and-notes\" data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-detail/video-and-notes/main(options)\"></div>\n\t\t"; } o += "\n\t</div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/cp20.html',[],function() { return function template(data) { var o = "";
	var _ = data._;
	var teacher = data.teacher;
	var feedback = data.feedback;
o += "\n<div class=\"ets-pr-fb-detail ets-pr-fb-detail-cp20 ets-none ets-pr-fb-open\">\n\t<div class=\"ets-pr-fb-teacher\">\n\t\t"; if (teacher) { o += "\n\t\t<img src=\"" + teacher.imageUrl + "\"/>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659698\" data-text-en=\"Teacher\"></span>\n\t\t<span>" + teacher.displayName + "</span>\n\t\t"; } o += "\n\t</div>\n\t<div class=\"ets-pr-fb-content\">\n\t\t<div class=\"ets-pr-fb-score-large\">\n\t\t\t<span class=\"ets-pr-fb-score-num\">" + feedback.grade + "</span>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659692\" data-text-en=\"Score\"></span>\n\t\t</div>\n\n\t\t<h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708940\" data-text-en=\"Teacher's comments\"></h5>\n\t\t<p>" + _.escape(feedback.overall) + "</p>\n\n\t\t";if (feedback.gradingType === 0) {o += "\n\t\t<div class=\"ets-pr-fb-lists\">\n\t\t\t<h6 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672768\" data-text-en=\"Overall\"></h6>\n\t\t\t<dl class=\"ets-pr-fb-list-overall\">\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.strength + "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.improvement + "</dd>\n\t\t\t</dl>\n\t\t</div>\n\t\t"; } o += "\n\t\t"; if (data.videoRecoredEnabled) { o += "\n\t\t\t<div class=\"ets-pr-fb-video-and-notes\" data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-detail/video-and-notes/main(options)\"></div>\n\t\t"; } o += "\n\t</div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/eft.html',[],function() { return function template(data) { var o = "";
	var _ = data._;
	var teacher = data.teacher;
	var feedback = data.feedback;
o += "\n<div class=\"ets-pr-fb-detail ets-pr-fb-detail-eft ets-none ets-pr-fb-open\">\n\t<div class=\"ets-pr-fb-teacher\">\n\t\t"; if (teacher) { o += "\n\t\t<img src=\"" + teacher.imageUrl + "\"/>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659698\" data-text-en=\"Teacher\"></span>\n\t\t<span>" + teacher.displayName + "</span>\n\t\t"; } o += "\n\t</div>\n\t<div class=\"ets-pr-fb-content\">\n\t\t<div class=\"ets-pr-fb-lists\">\n\t\t\t<h6 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672769\" data-text-en=\"Student Goal\"></h6>\n\t\t\t<dl>\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672770\" data-text-en=\"Study Purpose\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.studyGoal+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672771\" data-text-en=\"Study Level\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.studyLevel+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672772\" data-text-en=\"Study Area\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.studyArea+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672773\" data-text-en=\"Study Pace\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.studyPace+ "</dd>\n\t\t\t</dl>\n\t\t</div>\n\n\t\t<div class=\"ets-pr-fb-score-large\">\n\t\t\t<span class=\"ets-pr-fb-score-num\">" + feedback.grade + "</span>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659692\" data-text-en=\"Score\"></span>\n\t\t</div>\n\n\t\t<h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708940\" data-text-en=\"Teacher's comments\"></h5>\n\t\t<p>" + _.escape(feedback.overall) + "</p>\n\n\t\t<div class=\"ets-pr-fb-lists\">\n\t\t\t";if (feedback.details.showClarity) {o += "\n\t\t\t<h6>\n\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672774\" data-text-en=\"Clarity\"></span>\n\t\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.clarityGrade+ "</span>\n\t\t\t</h6>\n\t\t\t<dl>\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.clarityStrength+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.clarityImprovement+ "</dd>\n\t\t\t</dl>\n\t\t\t";}o += "\n\n\t\t\t";if (feedback.details.showConfidence) {o += "\n\t\t\t<h6>\n\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672775\" data-text-en=\"Confidence\"></span>\n\t\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.confidenceGrade+ "</span>\n\t\t\t</h6>\n\t\t\t<dl>\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.confidenceStrength+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.confidenceImprovement+ "</dd>\n\t\t\t</dl>\n\t\t\t";}o += "\n\n\t\t\t";if (feedback.details.showExpression) {o += "\n\t\t\t<h6>\n\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672776\" data-text-en=\"Expression\"></span>\n\t\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.expressionGrade+ "</span>\n\t\t\t</h6>\n\t\t\t<dl>\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.expressionStrength+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.expressionImprovement+ "</dd>\n\t\t\t</dl>\n\t\t\t";}o += "\n\n\t\t\t";if (feedback.details.showAccuracy) {o += "\n\t\t\t<h6>\n\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672777\" data-text-en=\"Accuracy\"></span>\n\t\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.accuracyGrade+ "</span>\n\t\t\t</h6>\n\t\t\t<dl>\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.accuracyStrength+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.accuracyImprovement+ "</dd>\n\t\t\t</dl>\n\t\t\t";}o += "\n\n\t\t\t";if (feedback.details.showRange) {o += "\n\t\t\t<h6>\n\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672778\" data-text-en=\"Range\"></span>\n\t\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.rangeGrade+ "</span>\n\t\t\t</h6>\n\t\t\t<dl>\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.rangeStrength+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.rangeImprovement+ "</dd>\n\t\t\t</dl>\n\t\t\t";}o += "\n\n\t\t\t";if (feedback.details.showComprehension) {o += "\n\t\t\t<h6>\n\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672779\" data-text-en=\"Comprehension\"></span>\n\t\t\t\t<span class=\"ets-pr-fb-detail-score\">" +feedback.details.comprehensionGrade+ "</span>\n\t\t\t</h6>\n\t\t\t<dl>\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.comprehensionStrength+ "</dd>\n\n\t\t\t\t<dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></span>:</dt>\n\t\t\t\t<dd>" + feedback.details.comprehensionImprovement+ "</dd>\n\t\t\t</dl>\n\t\t\t";}o += "\n\t\t</div>\n\n\t\t"; if (data.videoRecoredEnabled) { o += "\n\t\t\t<div class=\"ets-pr-fb-video-and-notes\" data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-detail/video-and-notes/main(options)\"></div>\n\t\t"; } o += "\n\t</div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/osa.html',[],function() { return function template(data) { var o = "";
  var detailCategoryBlurbs = {
    Clarity: "672774",
    Confidence: "672775",
    Expression: "672776",
    Accuracy: "672777",
    Range: "672778"
  };
  var _ = data._;
  var teacher = data.teacher;
  var feedback = data.feedback;
o += "\n<div class=\"ets-pr-fb-detail ets-pr-fb-detail-osa ets-none ets-pr-fb-open\">\n  <div class=\"ets-pr-fb-teacher\">\n    "; if (teacher) { o += "\n    <img src=\"" + teacher.imageUrl + "\"/>\n    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659698\" data-text-en=\"Teacher\"></span>\n    <span>" + teacher.displayName + "</span>\n    "; } o += "\n  </div>\n  <div class=\"ets-pr-fb-content\">\n    <div class=\"ets-pr-fb-score-large\">\n      <span class=\"ets-pr-fb-score-num\">" + feedback.osaGradedStatus + "</span>\n    </div>\n    <h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708940\" data-text-en=\"Teacher's comments\"></h5>\n    <p>" + _.escape(feedback.overall) + "</p>\n    \n    <div class=\"ets-pr-fb-lists\">\n      "; if (feedback.strengthCategory) { o += "\n      <h6 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672780\" data-text-en=\"Strength\"></h6>\n      <dl>\n        <dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id='" + detailCategoryBlurbs[feedback.strengthCategory] + "'></span>:</dt>\n        <dd>" + feedback.strength + "</dd>\n      </dl>\n      "; } o += "\n\n      "; if (feedback.improvementCategory) { o += "\n      <h6 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"672781\" data-text-en=\"Areas for improvement\"></h6>\n      <dl>\n        <dt><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id='" + detailCategoryBlurbs[feedback.improvementCategory] + "'></span>:</dt>\n        <dd>" + feedback.improvement + "</dd>\n      </dl>\n      "; } o += "\n    </div>\n  </div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/feedback/feedback-detail/main',[
	"jquery",
	"when",
	'underscore',
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-progress-report/enum/feedback-typecode",
	"template!./writing.html",
	"template!./gl.html",
	"template!./pl.html",
	"template!./cp20.html",
	"template!./eft.html",
	"template!./osa.html"
], function ($, when, _, Widget, loom, weave, fbType, tWriting, tGL, tPL, tCP20, tEFT, tOSA) {
	"use strict";

	var $ELEMENT = "$element";

	var UNDEF;

	var PROP_FEEDBACK_ID = "_feedbackId";
	var PROP_TEACHER_PROFILE = "_teacherProfile";
	var PROP_WRITING_ID = "_writingId";

	var SEL_VIDEO_NOTES = '.ets-pr-fb-video-and-notes';
	var SEL_CORRECTION = ".ets-pr-fb-correction";

	var CLS_SURVEY = 'ets-pr-fb-survey';
	var SEL_SURVEY = '.' + CLS_SURVEY;

	//if teacher's image ready, remove this line
	var defaultImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NkEzNzkzNzJDRDQ1MTFFNEJCQTBDRTQ3OUEzNjM5OEEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NkEzNzkzNzNDRDQ1MTFFNEJCQTBDRTQ3OUEzNjM5OEEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2QTM3OTM3MENENDUxMUU0QkJBMENFNDc5QTM2Mzk4QSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2QTM3OTM3MUNENDUxMUU0QkJBMENFNDc5QTM2Mzk4QSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjsNI60AAA0mSURBVHja7F13UBXdFT82sDcQRVBQ1LGh2AKxgY4ysYx+xjJGU4wmlomS2AI6g04yo/LpKH5YJrH9gX3sjkOinyYSO9bRUexYsKBYERvqzflddnfe46O899i3u5Qz85sH7+3e3fvbu+eec+6591YQQpCFpAqjHSOY0YYRyAhgeCnwZNRifGJkM14zspS/7zPuMVIZVxhXGTlWqVgFk4muxPgZ4xeMCEY3RjWdyv7AOMs4yvg3I4XxtSwRXYHRm/ErxnCGt0HXzWTsYmxjJDNEaSW6LuOPjEmMIJPf5NuMNYy1ivopFUQ3ZEQz/qDoVysJ9Ps6xmLG05JKdE3GXMafGdXJ2vKekcBYwHhXUoiGDv4NI47hSyVLnjBiGBv11uF6Ex2o6L7+VLLlR8ZExVy0HNG/Zqxi1KbSIW8Zf2JssgrRcCJWKp1daRR0llMVJ8k0ohsx9jJCqXTLGcZ3xbFMikN0a0YSoxmVDUljDGRcN5LoTopb60NlS54p4YKLRhAdrLiw9ahsymslhHDFnUQ3YZxk+FPZlnRGD8YDR0+o6EThDRj/MYrkN2/eUMuWLalnz56Unp5uNaLBwRGFE8cELdoBeDBOCQPlwIEDQvHORN26dcXSpUtFdna2sJicUrgpkkNHW/T3jDAjm8yjR4/kZ0REhPycOXMmBQQE0IwZMyglJYUsMmARpgSkdGnR3zG+Gd1UFi1aJFvzzp07xfPnz8X06dNF/fr1tVbeuHFjMWnSJLFr1y6RmZlpZqv+pnBUKI9FkRzIeGnG3UdFRUlCT5w4oX338eNHsXnzZjF8+HBRp04djfSKFSuKrl27ijlz5oiLFy+acbsvFa5cIhoWyY9G3/GrV6/EvHnzRM2aNUXlypVla85PcnJyxLFjx0RsbKzo1q2bJFslntWNOHv2rNG3fkjhzGmif2f0nUINNGrUSOsAExISHD4XD2TTpk2CrRStlaOFf/361cgqjHOW6NqMJ0bdHciYPXu2JKhKlSoiOjpatmxXZf/+/cLPz0+WN3LkSPHlyxejqvJE4c5hor83shlMmTJFktKsWTNx4cIFfWr85IkICQmR5bLFYmR14hwluiHDMIM1MTFRkhEcHCwyMjJ0LfvZs2eiefPmokKFCuL48eNGVSlb4bBIouONuqP379+LBg0aiGrVqolr16655RrJycnyQfbu3dvIVh1fFNF1GVlG3c3atWslCbCRC5Lbt2+L1atXS7vaVV3br18/eZ3Lly8bVbUshcsCiZ5l5GMfNWqUJCA/vXz9+nUxePBg+drjGHzevHnTpevgQaGMuLg4I6s3uyCiYQPeMvJOOnXqJCpVqmRngn369EkSAnWi2sXFJQktGWWMGTPGyOrdsrWrbYmOMNpuhpUBx0Q18eBut23bVpICzy8+Pl46LejQimMPw0VHmVAhBkuEym9lm7DHaKMjMuyUUFpaGm3ZsoXmz59PrI/l98OGDaMVK1bQu3fviPU3denSRX5/6NAh4odB7PUROyjk4eFBDRs2pBYtWlC7du2oTZs2xA4PsS0uy2LPUZYRGpo7pMlvj9FVBKdHbYNKleBcGf248Srbxiugs8+dO6f9/vjxY/kbEyg6duyoHYtW7uPjYxfvcARjx441uorPFW61Fo1wn7fRj3vAgAGyNUOOHj1KvXr1svvd19eXWrVqRampqcSdIQ0dOpTYuZHHVa+em2XGOp3YNJTHcAcqW3pOTg75+/tT9+7diVUTDRkyhF68eEHcJxhdRXD6c8ZxtUX/zZT44rdvIjIyUra2rVu35nsMPwgRFhYm+EG4dI1t27bJlo835s6dO2ZU8++2nWGyWcHciRMnSqLx6Q6Bo4Lyw8PDzapisko0hmLem3EHCHOCBFYP4unTp265BjxOLy8v4enpKdLT082oJrj1gI5uS/pNZ3Au/efMGfkZExMjrQdVsrOzadasWVKv2goGaqOiorT/Y2Nj6caNG3bHNG3alBYvXkysKuT/sETGjx9PS5YsoUuXLpGfn5/R1QS3bSsreRqmCDslWodmK/fv36c1a9YQ63C770GUSvTnz58pISGB3r59a3dM1apVae7cuVS/fn3tO7UcmH0mSTAeexuzrt6kSRP5effuXbvv2WmRg7MgFrZycHAwcUdGbPppx+B72OBo0Xhg7PzIYx4+fGhHMgTfQ2DBmCRtoaO3mtVLIGaMGAaGogoSJrLI8CmsCdjc+QlcegzqAgaPttjKVhB9QpgobOvKDtFV860oWbVqlVutGgflBIi+YeYdsFstWzXGCE+fPq1r2bChMTTGzo24deuWmdW8QWa43j8Z+4mLk61u2rRpupbLnqcsd9++fWZXMRNEvzX7LtjKkITAS9Q7OlijRg0zdbM2EEDCIuLv7y9DpkiS0UPYkpEPr0+fPpaoH8y7z1ZIYkOACSHNpKQkXcrbvn27/Bw4cKA18k+hP6zwxGF14HZGjBihS3kYVUcgie1xK1RPqo40K9wJInkBAQGCHZECbWJH5dSpU/Kh9e/f3yqaMROqI8sKbxbizWzrStd62bJlxSorPj5efk6dOtUqiesvTA2R5hWkgaFDRPzY1ZQw2MsYgcHYI94Si8hxtOj7VnnsGENEq8a0CkTvvnz54tT5Hz58kK0Y50VHR8u3xCJyFy16jrCQIH6sjvFBx7586Vh6NuImGInBedDziHFYSOaA6BFWuiM28ewGVIOCgorMm9uxY4fw9vbWzsHfFpPhILq9le7o6tWrkiy4z6wGtBHyyZMnyygd8qBTUlLEvXv3xMmTJ7WhKsQ0FixYoJl1r1+/tlK12ps6lJVfSBOEgjhE3SCYnQWzzzYtIW8aAVSGmlY2Y8YM+d3ChQvlrAALiBzKUid0JiuzQQ0VdF5Hjhyhw4cPE6sHunLlijTvfHx8ZFBfTSlgt5wSExNl8gxGVDp06CAHC5AQg/QDpCGoHR9GZzB8hbIx2oJBhB49elB4eLj0EtVRHQPlf4xwU9INmFiZzIKAj23LROoX0njRajFNwhXBfER11hYGfW3fAFxv9OjRYu/evUbOArBLN+hhxBUPHjwoQkNDtYpj1AMB+d27d0urAYKYdK1ateTvEyZMEGzqOVQ2dDemUaidoZqiy2+ASEpKkioF0Tzbh7p+/XojIns9bYl2a0oYOi5E0dT020GDBsl5Jqwm8j0eU9jat2+vPQx1WlteUvA/dDPmvGDgQE0fS01NLdDNR2I6WjWcGhzfuXNnd06Z01LCbLNJ/+GOK2FeoJojh2lp58+fd+g8hEsxta127dpaK0RLh1WB4S/W01rLV3/D8ZhF4KgHOWTIEM1iWblypTuq/09hRNqumgAOtxqvqSsuMVTHhg0bZFQPrz5IUa2PwMBAObkTZbtqzq1bt07rK5YvX643BX2EEYnomIKGhHK9pzTAqdHbGwXZvr6+ehZrl4huO+keT3WNnnZNZmYmccckTSw9hUnRtTwsV1GvXj3it0LPYteSzdp5lfP5cR7lrsJYbIHdumfPHurbty9xZygTYUJCQmSyi5qyZYbAVr958yaxF0rcEUpbHmuCjBkzRq9LvMvbaPNbgQbB3L/ocbWMjAxik0tm3udNBUMrCgoKkktDsK6VTgrAdrR8CwBkIzkryNtDjjSujTcKAIlwgODk4BPZTGyx2MXCIyMjaePGjfL6OsgPeTnMj2gssYYcKt3WE1XTuZDihVaEhHE2+WTCeGHClgR5enoSWx7yf7zetoKcPbYyZG4dQqvwBuFFFiZsARHb0NS6dWvq2LGj9DLxliHpXSfBOqdYTfhpUUSrC6H81Z2vL0h+8OCBhrytEEA2KcjMysrSyMw7KoMYtvqJNwV5d3gbbN8OkAh1BYK9vLzcrZmwUEr0T0aQCiAaTeiG0rrLxQltiVxKyl1u004K6pFw4Jxy3pyWmPxILqxFy98Yhxj9yvlzSA4zIqmA5ZCLWvcukHJXLaxbzmOh8orRmQpZBrkoYxYn/p4M3nighAm4GU9FrDXtiNeA1XRXlPNZoKxQOCpUHF0y00MZhQkr59VOTsvREwfyF51ZmxQuU4qit8sld13Sroznjhzs7CKwiA4dJWfW5CydAnIjGNccPcGVZY1DGP8tw5YIQnx9yck1pIuzUPfBMtiyMxVb2ZCFulXB/ESsit60DOlkrIae6srJxd1MoTFjD+Xu4FaaBbvIYTOFx64WUNzo+2PFvFlfikneQLnJRY+LU4ieG978VjHeS9OGN9MYiXoUpvcWTtgqZJ3SK5dkwRL72MAnTa8C9R64w40h2jeOcrfSKIn28TilDml6FuzObfZgZ2ObPUwkqWZxgrFtKrahWkhu2kjSiI0jMUoTo7yKNSxGcLai6rAlYIndODKvYGQVW6Fi+zqzt0LF4LO6FeorIy5o1ua+iBNgc99fUu421EYI1g3azdhKufGaUru5b36iblc9QCG/K+m7XfU5hdR/URncrrowKWgDdm+l5eMhqPkm7xUyXygxCEtvwP5/AQYA45MVlK+fMKMAAAAASUVORK5CYII="

	function _firstResult(result) {
		return result;
	}

	function _getArchiveWritingFeedback(summary) {
		var me = this;
		var clobPromise = summary.clob ? me.query(summary.clob.id).spread(_firstResult) : when.resolve(UNDEF);
		var teacherPromise = summary.teacher ? me.query(summary.teacher.id).spread(_firstResult) : when.resolve(UNDEF);

		return when.all([clobPromise, teacherPromise]).spread(function (clob, teacher) {
			var feedbackDetail = summary.detail;
			if (feedbackDetail.comment || feedbackDetail.correction) {
				return [feedbackDetail, teacher];
			}
			else if (clob) {
				if (clob.comment || clob.correction) {
					feedbackDetail.comment = clob.comment || "";
					feedbackDetail.correction = clob.correction || "";
					feedbackDetail.correctedTime = clob.correctDateTime || "";
					return [feedbackDetail, teacher];
				}
				else if (clob.writingId) {
					return me.query('integration_writing_feedback_detail!' + clob.writingId + '.teacher').spread(function (inteFeedbackDetail) {
						return [inteFeedbackDetail || feedbackDetail, inteFeedbackDetail && inteFeedbackDetail.teacher || teacher];
					});
				}
			}

			return [feedbackDetail, teacher];
		});
	}

	function _getRegularWritingFeedback(summary) {
		var me = this;
		return me.query(summary.detail.id + ".teacher").spread(function (feedbackDetail) {
			var teacher = feedbackDetail.teacher;
			me[PROP_WRITING_ID] = feedbackDetail.writing_id;
			return [feedbackDetail, teacher];
		});
	}

	function renderWritingFeedback(summary) {
		var me = this;
		var promiseQuery = summary.isArchive ?
			_getArchiveWritingFeedback.call(me, summary) :
			_getRegularWritingFeedback.call(me, summary);

		return promiseQuery.spread(function (feedbackDetail, teacher) {
			me[PROP_TEACHER_PROFILE] = teacher;
			if (teacher) {
				teacher.imageUrl = defaultImage;
			}

			me[$ELEMENT].html(tWriting({
				summary: summary,
				feedback: feedbackDetail,
				teacher: teacher
			}));

			//use $element.data() to prevent browser's auto html unescape
			me[$ELEMENT].find(SEL_CORRECTION).data("correction", feedbackDetail.correction);
			return me.weave();
		});
	}

	function renderEvcFeedback(summary, evcmember) {
    var me = this;
    
    if (summary.isArchive) {
      return when.rejected(false);
    }

    return when.all([
      checkEvcMemberSettings.call(this),
      this.query(summary.detail.id + ".teacher,.topic")
    ]).spread(function (memberList, feedbackDetailList) {
      var evcmember = memberList[0];
      var feedbackDetail = feedbackDetailList[0];
			me[PROP_TEACHER_PROFILE] = feedbackDetail.teacher;
			if (feedbackDetail.teacher) {
				feedbackDetail.teacher.imageUrl = defaultImage;
			}

			var renderTemplate;
			switch (summary.typeCode) {
				case fbType.gl:
					renderTemplate = tGL;
					break;
				case fbType.pl:
					renderTemplate = tPL;
					break;
				case fbType.cp20:
					renderTemplate = tCP20;
					break;
				case fbType.eftv:
					renderTemplate = tEFT;
					break;
				case fbType.osa:
					renderTemplate = tOSA;
					break;
			}

			// check if evc enables video/notes or not
			var isGL = summary.typeCode === fbType.gl;
			var videoRecoredEnabled = isGL ? evcmember.enableGLRecord : evcmember.enablePLRecord;

			me[$ELEMENT].html(renderTemplate({
				_: _,
				feedback: feedbackDetail,
				teacher: feedbackDetail.teacher,
				videoRecoredEnabled: videoRecoredEnabled
			}));

			me[$ELEMENT].find(SEL_VIDEO_NOTES).data('options', {
				hasVideoRecord: feedbackDetail.hasVideoRecord,
				videoAvailable: feedbackDetail.videoAvailable,
				video: {
					topicBlurbId: feedbackDetail.topicBlurb_id, // for some GL
					topic: isGL ? feedbackDetail.topic && feedbackDetail.topic.topic : feedbackDetail.topic,
					video: feedbackDetail.videoRecord
				},
				noteAvailable: feedbackDetail.noteAvailable,
				notes: feedbackDetail.notes
			});

			return me.weave();
		});
	}

	var checkEvcMemberSettings = _.once(function () {
		return this.query('evcmember!current');
	});

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			var summary = me[$ELEMENT].data("summary");
			me[PROP_FEEDBACK_ID] = summary.feedback_id;

			if (summary.typeCode === fbType.writing) {
				return renderWritingFeedback.call(me, summary);
			}
			else {
        return renderEvcFeedback.call(me, summary);
			}
		},
		'dom:.ets-pr-fb-open-survey-button/click': function () {
			var me = this;
			if (me[$ELEMENT].find(SEL_SURVEY).length > 0 || !me[PROP_WRITING_ID]) {
				return;
			}

			var $survey = $('<div>')
				.addClass(CLS_SURVEY)
				.data('writingId', me[PROP_WRITING_ID])
				.data('teacherProfile', me[PROP_TEACHER_PROFILE])
				.attr(loom.weave, "school-ui-progress-report/widget/container/feedback/feedback-survey/main(writingId, teacherProfile)")
				.appendTo(me[$ELEMENT]);
			$survey.weave();
		},
		'dom:.ets-pr-fb-survey/hidden.ets-fb-survey': function () {
			var me = this;
			var $oldSurvey = me[$ELEMENT].find(SEL_SURVEY);
			$oldSurvey.unweave().then(function () {
				$oldSurvey.remove();
			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-detail/video-and-notes/main.html',[],function() { return function template(data) { var o = ""; if (data.hasVideoRecord && !data.videoAvailable && !data.noteAvailable) { o += "\n    <p class=\"ets-pr-fb-class-notes-unavailable\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"709107\" data-text-en=\"Class video and class notes are not available\"></p>\n"; } else { o += "\n    "; if (data.hasVideoRecord) { o += "\n        "; if (data.videoAvailable) { o += "\n            <div class=\"ets-pr-fb-class-video\" data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-detail/class-video/main(options)\"></div>\n        "; } else { o += "\n            <p class=\"ets-pr-fb-class-notes-unavailable\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"709106\" data-text-en=\"Classs video is not available\"></p>\n        "; } o += "\n    "; } o += "\n    \n    "; if (data.noteAvailable) { o += "\n        <div class=\"ets-pr-fb-class-notes\" data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-detail/class-notes/main\"></div>\n    "; } else { o += "\n        <p class=\"ets-pr-fb-class-notes-unavailable\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"709105\" data-text-en=\"Classs notes are not available\"></p>\n    "; } o += "\n"; }  return o; }; });
define('school-ui-progress-report/widget/container/feedback/feedback-detail/video-and-notes/main',[
	"troopjs-ef/component/widget",
	"template!./main.html",
], function (Widget, template) {
	var SEL_VIDEO = '.ets-pr-fb-class-video';
	var SEL_NOTES = ".ets-pr-fb-class-notes";

	return Widget.extend(function ($element, path, options) {
		this.options = options || {};
	}, {
		"sig/start": function () {
			this.$element.html(template(this.options));
			this.$element.find(SEL_VIDEO).data('options', this.options.video);
			this.$element.find(SEL_NOTES).data('notes', this.options.notes);
			return this.weave();
		}
	});
});
define('school-ui-progress-report/widget/container/feedback/feedback-detail/writing-correction/main',[
	"jquery",
	"when",
	"poly",
	"jquery.gudstrap",
	"troopjs-ef/component/widget"
], function ($, when, poly, GUD, Widget) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_NONE = "ets-none";

	function getCorrectionTags() {
		var me = this;

		return me.query("writing_correction_tag!current").spread(function (tagData) {
			var tags = {};
			tagData.items.forEach(function (item) {
				tags[item.code] = item;
			});
			return tags;
		});
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;

			var correction = me[$ELEMENT].data("correction");
			correction = $.trim(correction).replace(/\s+/g, " ");
			if (!correction) {
				me[$ELEMENT].addClass(CLS_NONE);
				return when.resolve();
			}

			return getCorrectionTags.call(me).then(function (correctionTags) {
				var replaceElement = function (correction, oldTag, newTag) {
					correction = correction.replace(new RegExp("<" + oldTag + "\\b", "ig"), "<" + newTag + " data-element-type='" + oldTag + "'");
					correction = correction.replace(new RegExp("<\\/" + oldTag + ">", "ig"), "</" + newTag + ">");
					return correction;
				};

				correction = replaceElement(correction, "paragraph", "p");
				correction = replaceElement(correction, "text", "span");
				correction = replaceElement(correction, "input", "span");
				correction = replaceElement(correction, "b", "span");
				correction = replaceElement(correction, "i", "span");
				correction = replaceElement(correction, "c", "span");
				correction = replaceElement(correction, "code", "span");

				var $correction = $("<div>" + correction + "</div>");
				$correction.find("[data-element-type='paragraph']").removeClass().addClass("ets-pr-fb-correction-paragraph");
				$correction.find("[data-element-type='text']").removeClass().addClass("ets-pr-fb-correction-text");
				$correction.find("[data-element-type='input']").removeClass().addClass("ets-pr-fb-correction-input");
				$correction.find("[data-element-type='i']").removeClass().addClass("ets-pr-fb-correction-i");
				$correction.find("[data-element-type='b']").removeClass().addClass("ets-pr-fb-correction-b");
				$correction.find("[data-element-type='c']").removeClass().addClass("ets-pr-fb-correction-c");
				$correction.find("[data-element-type='code']").removeClass().addClass("ets-pr-fb-correction-code").each(function (index, element) {
					var $code = $(element);
					var correctionTagCode = $code.attr("a");
					var correctionText = $code.attr("c");

					$code.addClass("ets-pr-fb-correction-action-" + correctionTagCode.toLowerCase());
					if (!$code.text()) {
						$code.addClass("ets-pr-fb-correction-empty");
					}

					var correctionTagName = correctionTags[correctionTagCode] && correctionTags[correctionTagCode].tagName || correctionTagCode;
					var tooltipHtml = correctionTagName + (correctionText ? ": <span>" + correctionText + "</span>" : "");
					$code.attr("data-title", tooltipHtml);
				});

				return me[$ELEMENT].append($correction.contents()).weave().then(function () {
					me[$ELEMENT].find(".ets-pr-fb-correction-code").tooltip({
						placement: "bottom",
						html: true
					});
				});
			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-head/feedback-head.html',[],function() { return function template(data) { var o = "<tr class=\"ets-pr-fb-head\">\n\t<th class=\"ets-pr-fb-date\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659689\" data-text-en=\"Date\"></span>\n\t</th>\n\t<th class=\"ets-pr-fb-summary\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659690\" data-text-en=\"Title\"></span>\n\t</th>\n\t<th class=\"ets-pr-fb-type\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659691\" data-text-en=\"Type\"></span>\n\t</th>\n\t<th class=\"ets-pr-fb-device\">\n\t</th>\n\t<th class=\"ets-pr-fb-score\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659692\" data-text-en=\"Score\"></span>\n\t</th>\n</tr>"; return o; }; });
define('school-ui-progress-report/widget/container/feedback/feedback-head/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"template!./feedback-head.html"
], function($, Widget, tFeedbackHead){
	"use strict";

	var $ELEMENT = "$element";

	return Widget.extend({
		"sig/start": function() {
			return this.html(tFeedbackHead);
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback-survey/feedback-survey.html',[],function() { return function template(data) { var o = "";
	var teacher = data.teacher;
    var ratingBlurb = {
		'1': { id: 701035, en: 'Strongly Disagree' },
		'2': { id: 701036, en: 'Disagree' },
		'3': { id: 701037, en: 'Neutral' },
		'4': { id: 701038, en: 'Agree' },
		'5': { id: 701039, en: 'Strongly Agree' },
	};
o += "\n<div class=\"ets-pr-fb-survey-modal modal fade in\" data-backdop=\"static\" lang=\"" +data.lang+ "\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content\">\n\t\t\t<form class=\"ets-pr-fb-survey-form\">\n\t\t\t\t<div class=\"ets-pr-fb-survey-teacher-header\">\n\t\t\t\t\t<img class=\"ets-pr-fb-survey-teacher-image\" src=\"" + teacher.imageUrl + "\"/>\n\t\t\t\t\t<span class=\"ets-pr-fb-survey-teacher-profile\">\n\t\t\t\t\t\t<span class=\"ets-pr-fb-survey-teacher-name\">" + teacher.displayName + "</span>\n\t\t\t\t\t\t<br/>\n\t\t\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"701042\" data-text-en=\"Your Corrector\"></span>\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t\t"; data.questions.forEach(function (question, questionIndex) { o += "\n\t\t\t\t\t<div class=\"ets-pr-fb-survey-question\" data-weave=\"troopjs-ef/blurb/widget\" \n\t\t\t\t\t     data-blurb-id=\"" + question.blurbId + "\" data-blurb-en=\"" + question.blurbEn + "\">\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"ets-pr-fb-survey-rating-answer\">\n\t\t\t\t\t\t";
						/* Using a recursive call to generate the rating line */ 
						(function renderRatingGroup(rating) {
							var id = ['radio',data.writingId,questionIndex,rating].join('-');
							o += "\n\t\t\t\t\t\t\t<input id=\"" +id+ "\" class=\"ets-pr-radio\" type=\"radio\" name=\"" + question.inputName + "\" value=\"" + rating + "\"/>\n\t\t\t\t\t\t\t<span class=\"ets-pr-fb-survey-rating-group\" data-rating=\"" + rating + "\">\n\t\t\t\t\t\t\t\t"; if (rating > 1) { renderRatingGroup(rating-1); } o += "\n\t\t\t\t\t\t\t\t<label for=\"" +id+ "\" data-rating=\"" +rating+ "\" class=\"ets-pr-fb-survey-rating-label\">\n\t\t\t\t\t\t\t\t\t<span data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_survey_rating" + rating + "',30,30)\"></span>\n\t\t\t\t\t\t\t\t\t<span class=\"ets-pr-fb-survey-rating-label-text\" data-weave=\"troopjs-ef/blurb/widget\"\n\t\t\t\t\t\t\t\t\t      data-blurb-id=\"" + ratingBlurb[rating].id + "\" data-blurb-en=\"" + ratingBlurb[rating].en + "\"></span>\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t";
						})(5);
						o += "\n\t\t\t\t\t</div>\n\t\t\t\t"; }); o += "\n\n\t\t\t\t<label for=\"ets-pr-fb-survey-" +data.writingId+ "-comments\" class=\"ets-pr-fb-survey-comments-label\"\n\t\t\t\t\t   data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"701034\" data-blurb-en=\"Comments\"></label>\n\t\t\t\t<textarea id=\"ets-pr-fb-survey-" +data.writingId+ "-comments\" name=\"comments\"></textarea>\n\t\t\t\t<div class=\"ets-pr-fb-survey-buttons\">\n\t\t\t\t\t<button type=\"submit\" class=\"ets-pr-btn submit disabled\">\n\t\t\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"701041\" data-text-en=\"Submit\"></span>\n\t\t\t\t\t</button>\n\t\t\t\t</div>\n\t\t\t</form>\n\t\t\t<div class=\"ets-pr-fb-survey-confirmation\">\n\t\t\t\t<h1 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673744\" data-text-en=\"Thank you!\"></h1>\n\t\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673745\" data-text-en=\"Your rating has been submitted\"></p>\n\t\t\t\t<p><span data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_confirmation', 102, 94)\"></span></p>\n\t\t\t\t<button type=\"button\" class=\"ets-pr-btn\" data-dismiss=\"modal\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673746\" data-text-en=\"Got it\"></button>\n\t\t\t</div>\n\t\t\t<button type=\"button\" class=\"ets-pr-btn close\" data-dismiss=\"modal\">\n\t\t\t\t<span data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_close', 30, 30)\"></span>\n\t\t\t</button>\n\t\t</div>\n\t</div>\n\t<div class=\"modal-backdrop fade in\"></div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/feedback/feedback-survey/main',[
	"jquery",
	"jquery.gudstrap",
	"when",
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/browser-check",
	"school-ui-shared/utils/update-helper",
	"school-ui-shared/utils/hub-memory",
	"template!./feedback-survey.html"
], function (
	$,
	$gudstrap,
	when,
	poly,
	Widget,
	browserCheck,
	updateHelper,
	HubMemory,
	tFeedbackSurvey
) {
	"use strict";

	var $ELEMENT = "$element";

	var PROP_WRITING_ID = '_writingId';
	var PROP_TEACHER_PROFILE = '_teacherProfile';

	var SEL_MODAL = '.modal';
	var SEL_SUBMIT_BUTTON = 'button[type="submit"]';
	var SEL_FORM = '.ets-pr-fb-survey-form';
	var SEL_CONFIRMATION = '.ets-pr-fb-survey-confirmation';
	var SEL_COMMENTS = 'textarea[name="comments"]';

	var BLURB_FORM_NOT_VALID_TITLE = 673743; //en="Please complete this evaluation for your writing correction"
	var BLURB_COMMENTS_PLACEHOLDER = 701040; //en="Please write only in English letters"

	var ERR_FORM_NOT_VALID = 'Form not valid';

	var QUESTIONS = [
		{
			blurbId: 701031,
			blurbEn: 'I liked the writing task',
			inputName: 'topicScore'
		},
		{
			blurbId: 701032,
			blurbEn: 'I learned from the corrections',
			inputName: 'satisfiedScore'
		},
		{
			blurbId: 701033,
			blurbEn: 'I learned from the comments',
			inputName: 'commentScore'
		}
	];

	var IS_IE8 = browserCheck.browser === "msie" && parseInt(browserCheck.version) === 8;

	function errorMatch(message, err) {
		return Boolean(err && err.message == message);
	}

	function ignoreError() {
		//noop
	}

	return Widget.extend(function ($element, name, writingId, teacherProfile) {
		var me = this;
		me[PROP_WRITING_ID] = writingId;
		me[PROP_TEACHER_PROFILE] = teacherProfile;
	}, {
		"sig/start": function () {
			var me = this;
			var context = HubMemory.readMemory('context');
			var htmlPromise = me.html(tFeedbackSurvey, {
				writingId: me[PROP_WRITING_ID],
				teacher: me[PROP_TEACHER_PROFILE],
				questions: QUESTIONS,
				isIE8: IS_IE8,
				lang: context && context.cultureCode || ''
			});
			return when.all(
				me.query('blurb!' + BLURB_FORM_NOT_VALID_TITLE, 'blurb!' + BLURB_COMMENTS_PLACEHOLDER),
				htmlPromise
			).spread(function (formNotValidTitleBlurb, commentPlaceholderBlurb) {
				me[$ELEMENT].find(SEL_CONFIRMATION).hide();
				me[$ELEMENT].find(SEL_MODAL).modal('show');
				me[$ELEMENT].find(SEL_SUBMIT_BUTTON).tooltip({
					placement: 'top',
					trigger: 'hover focus',
					animation: false, //animation:true cause strange scrollbar visual effect on chrome
					title: formNotValidTitleBlurb && formNotValidTitleBlurb.translation || ''
				});
				if (commentPlaceholderBlurb) {
					me[$ELEMENT].find(SEL_COMMENTS).attr('placeholder', commentPlaceholderBlurb.translation || '');
				}
				return me.validateForm()
					.otherwise(errorMatch.bind(null, ERR_FORM_NOT_VALID), ignoreError);
			});
		},
		"dom:.modal/hidden.bs.modal": function () {
			var me = this;
			me[$ELEMENT].trigger('hidden.ets-fb-survey');
		},
		"dom:input/change": function () {
			this.validateForm()
				.otherwise(errorMatch.bind(null, ERR_FORM_NOT_VALID), ignoreError);
		},
		"dom:form/submit": function (event) {
			var me = this;
			event.stopPropagation();
			event.preventDefault();

			me.validateForm()
				.then(function () {
					// Currently backend reads the "feedbackId" field.
					// But we should name this field "writingId" everywhere.
					// Send both "feedbackId" and "writingId" for compatibility. SPC-6816
					var surveyData = {
						feedbackId: me[PROP_WRITING_ID],
						writingId: me[PROP_WRITING_ID],
						comments: me[$ELEMENT].find('[name="comments"]').val()
					};
					QUESTIONS.forEach(function (question) {
						var rating = me[$ELEMENT].find('[name="' + question.inputName + '"]:checked').val();
						surveyData[question.inputName] = rating ? parseInt(rating, 10) : null;
					});
					return updateHelper.submitWritingCorrectionRating(surveyData);
				})
				.then(function () {
					me[$ELEMENT].find(SEL_FORM).hide();
					me[$ELEMENT].find(SEL_CONFIRMATION).show();
				})
				.otherwise(errorMatch.bind(null, ERR_FORM_NOT_VALID), ignoreError)
				.otherwise(ignoreError);
		},
		"dom:input.ets-pr-radio-ie8/change": function (event) {
			var $target = $(event.target);
			$target.addClass('checked');
			var name = $target.attr('name');
			$target.closest('form, body')
				.find('input.ets-pr-radio-ie8[name="' + name + '"]')
				.not($target)
				.removeClass('checked');
		},

		"validateForm": function () {
			var me = this;
			//cannot use Array.some, bug in poly for IE8: https://github.com/cujojs/poly/issues/39
			var hasCheckedAllRatings = QUESTIONS.every(function (question) {
				var inputSelector = 'input[name="' + question.inputName + '"]:checked';
				return me[$ELEMENT].find(inputSelector).length !== 0;
			});

			return when.promise(function (resolve, reject) {
				var valid = (hasCheckedAllRatings);
				var $submitButton = me[$ELEMENT].find(SEL_SUBMIT_BUTTON);
				$submitButton.toggleClass('disabled', !valid);
				if (valid) {
					$submitButton.tooltip('hide').tooltip('disable');
					resolve(true);
				} else {
					$submitButton.tooltip('enable');
					reject(new Error(ERR_FORM_NOT_VALID));
				}
			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/feedback.html',[],function() { return function template(data) { var o = "<div class=\"ets-pr-header\">\n\t<div class=\"ets-pr-header-title ets-pr-header-content\">\n\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708939\" data-text-en=\"CLASS REVIEW & FEEDBACK\"></p>\n\t</div>\n</div>\n<div class=\"ets-pr-body\">\n\t<div class=\"ets-pr-content\">\n\t\t<table class=\"ets-pr-feedback\">\n\t\t\t<thead data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-head/main\"></thead>\n\t\t\t<tbody data-weave=\"school-ui-progress-report/widget/container/feedback/feedback-body/main(selectedItem)\"></tbody>\n\t\t</table>\n\t\t<div class=\"ets-pr-pagination\" data-weave=\"school-ui-progress-report/widget/container/feedback/pagination/main(items, selectedItem)\"></div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/feedback/main',[
	"jquery",
	"json2",
	"moment",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"template!./feedback.html"
], function ($, JSON, Moment, Widget, loom, weave, tFeedback) {
	"use strict";

	var $ELEMENT = "$element";
	var INIT_DATA = "_init_data";

	var SEL_FEEDBACK_BODY = ".ets-pr-feedback tbody";
	var SEL_PAGINATION = ".ets-pr-pagination";

	return Widget.extend(function ($element, path, initData) {
		this[INIT_DATA] = initData;
	}, {
		"sig/start": function () {
			var me = this;
			var feedbacks = me[INIT_DATA].feedbacks;

			var selectedItem;
			if (me[INIT_DATA].fb_id) {
				var itemData = me[INIT_DATA].fb_id.split("_");
				selectedItem = {
					typeCode: itemData[0],
					feedbackId: itemData[1]
				};
			}

			me[$ELEMENT].html(tFeedback());
			me[$ELEMENT].find(SEL_FEEDBACK_BODY).data("selectedItem", selectedItem);
			me[$ELEMENT].find(SEL_PAGINATION).data("items", feedbacks).data("selectedItem", selectedItem);
			return me.weave();
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/container/feedback/pagination/pagination.html',[],function() { return function template(data) { var o = "<div class=\"pagination-wrapper\">\n\t<div class=\"section ets-none prev\">\n\t\t<a class=\"prev icon-angle-left\"></a>\n\t</div>\n\t<div class=\"section ets-none start\">\n\t</div>\n\t<div class=\"section ets-none middle\">\n\t\t<span class=\"ellipsis\"><span data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_dot_3',12,4)\"></span></span>\n\t\t<span class=\"ellipsis\"><span data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_dot_3',12,4)\"></span></span>\n\t</div>\n\t<div class=\"section ets-none end\">\n\t</div>\n\t<div class=\"section ets-none next\">\n\t\t<a class=\"next icon-angle-right\"></a>\n\t</div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/feedback/pagination/main',[
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


define('troopjs-requirejs/template!school-ui-progress-report/widget/shared/callout/callout.html',[],function() { return function template(data) { var o = "<div class=\"ets-pr-callout-pointer " + (data.isIE8 ? 'ets-pr-isIE8' : '') + "\"></div>"; return o; }; });
define('school-ui-progress-report/widget/shared/callout/main',[
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/browser-check",
	"template!./callout.html"
], function (poly, Widget, browserCheck, template) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_CALLOUT = "ets-pr-callout";

	var SEL_POINTER = ".ets-pr-callout-pointer";

	return Widget.extend(function () {
	}, {
		"sig/start": function () {
			var me = this;
			me[$ELEMENT].addClass(CLS_CALLOUT);
			return me.html(template, {
				isIE8: browserCheck.browser === "msie" && parseInt(browserCheck.version) === 8
			});
		},
		"pointerTo": function ($target) {
			var me = this;
			var $pointer = me[$ELEMENT].find(SEL_POINTER);
			if ($target && $target.length > 0) {
				var centeringOffset = $target.width() / 2 - $pointer.width() / 2;
				var left = $target.offset().left - $pointer.offsetParent().offset().left;

				$pointer.show().css("left", Math.round(left + centeringOffset) + "px");
			} else {
				$pointer.hide();
			}
		}
	});
});
define('school-ui-progress-report/widget/container/ge/level-navigation/callout',[
	"school-ui-progress-report/widget/shared/callout/main"
], function (CalloutWidget) {
	"use strict";

	return CalloutWidget.extend({
		"hub/progress-report/ge/callout/pointer-to": function ($target) {
			this.pointerTo($target);
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/ge/level-navigation/level-navigation.html',[],function() { return function template(data) { var o = "";
	function computeIconState(level) {
		if (this.progressState.hasPassed(level.progress.state)) {
			return "passed";
		} else if (level.id === data.currentLevelId) {
			return "current";
		} else if (this.progressState.hasStarted(level.progress.state)) {
			return "progress";
		} else {
			return "normal";
		}
	}
o += "\n\n<div class=\"ets-pr-level-nav ets-pr-header-content\">\n\t<div class=\"ets-pr-level-holder\">\n\t\t<span class=\"ets-pr-line\"></span>\n\t\t";
		var index = 0;

		for(var n=0; n < data.levelStages.length; n++){
			var stage = data.levelStages[n];
			var stage_normal_state = "ets-pr-normal";
		o += "\n\t\t\t<div class=\"ets-pr-level-stage\">\n\t\t\t\t";
				for (var i=0; i < stage.levels.length; i++){
					var level = stage.levels[i];
					var iconState = computeIconState.call(this, level);

					if(iconState !== "normal") {
						stage_normal_state = "";
					}
				o += "\n\t\t\t\t\t<div class=\"ets-pr-level-point " + (iconState==='normal'?'ets-pr-normal':'') + "\">\n\t\t\t\t\t\t<div class=\"ets-pr-level-icon\" data-state=\"" + iconState + "\"\n\t\t\t\t\t\t    data-id=\"" + level.id + "\"\n\t\t\t\t\t\t    data-archive-e10-id=\"" + (level.archiveId && level.archiveId.e10 || '') + "\"\n\t\t\t\t\t\t\tdata-archive-e13-id=\"" + (level.archiveId && level.archiveId.e13 || '') + "\"\n\t\t\t\t\t\t    data-weave=\"school-ui-progress-report/widget/container/ge/level-navigation/state-circle\"></div>\n\t\t\t\t\t\t<span class=\"ets-pr-level-num\">" + level.levelNo+ "</span>\n\t\t\t\t\t</div>\n\t\t\t\t";
					index++;
				}
				o += "\n\t\t\t\t<span class=\"ets-pr-stage " + stage_normal_state + "\">\n\t\t\t\t\t<span data-weave=\"school-ui-shared/widget/hyphenate('troopjs-ef/blurb/widget')\"\n\t\t\t\t\t      data-blurb-id=\"" + stage.blurbId+ "\" data-text-en=\"" + stage.blurbTextEn+ "\"></span>\n\t\t\t\t</span>\n\t\t\t</div>\n\t\t";
		}
		o += "\n\t</div>\n</div>\n<div class=\"ets-pr-nav-bottom-border\"\n     data-weave=\"school-ui-progress-report/widget/container/ge/level-navigation/callout\"></div>"; return o; }; });
define('school-ui-progress-report/widget/container/ge/level-navigation/main',[
	"when",
	"poly",
	"jquery",
	"snapsvg",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"school-ui-shared/utils/progress-state",
	"template!./level-navigation.html"
], function (when, poly, $, snapsvg, Widget, Load, progressState, tLevelNav) {
	"use strict";

	var STAGES = {
		"beginner" 			: {blurbId:659668, blurbTextEn:"Beginner", levelCodes:["0A","0B","1"]},
		"elementary" 		: {blurbId:659669, blurbTextEn:"Elementary", levelCodes:["2","3","4"]},
		"intermediate" 		: {blurbId:659670, blurbTextEn:"Intermediate", levelCodes:["5","6","7"]},
		"upperIntermediate" : {blurbId:659671, blurbTextEn:"Upper Intermediate", levelCodes:["8","9","10"]},
		"advanced" 			: {blurbId:659672, blurbTextEn:"Advanced", levelCodes:["11","12","13"]},
		"upperAdvanced" 	: {blurbId:659673, blurbTextEn:"Upper Advanced", levelCodes:["14"]}
	};

	var $ELEMENT = "$element";

	var CLS_SELECTED = "ets-pr-selected";

	var SEL_ICON = ".ets-pr-level-icon";
	var SEL_SELECTED = "." + CLS_SELECTED;

	var DATA = "_data";
	var PROP_INIT_DATA = "_init_data";
	var SELECTED_LEVEL = "_selected_level";

	var STATE_NORMAL = 'normal';

	function selectIcon($target) {
		$target.find("i svg path[data-d-select]").each(function(){
			var d_select = $(this).data("d-select");
			snapsvg($(this)[0]).animate({
				d: d_select
			}, 100);
		});
	}

	function unSelectIcon() {
		var me = this;
		me.$element.find("." + CLS_SELECTED).find("i svg path[data-d-origin]").each(function(){
			var d_origin = $(this).data("d-origin");
			snapsvg($(this)[0]).animate({
				d: d_origin
			}, 100);
		});
	}

	function pointerTo($target) {
		this.publish('progress-report/ge/callout/pointer-to', $target);
	}

	return Widget.extend(function($element, path, renderData){
		this[PROP_INIT_DATA] = renderData;
	},{
		"progressState" : progressState,
		"sig/start" : function(){
			var me = this;
			var data = me[PROP_INIT_DATA];
			var currentEnroll = data.currentEnroll;
			var currentCourseEnroll = data.course.currentEnroll;

			//save aviliabe level in each stages
			var levelStages = [];
			var breakToLevel;
			var levels = data.course.children;

			me[DATA] = data.course.children;

			//each level in course levels data
			for(var index in levels){
				breakToLevel = false;
				//each level number in STAGES
				for (var name in STAGES){
					for (var num in STAGES[name].levelCodes){
						if(levels[index].levelCode === STAGES[name].levelCodes[num]){
							var stage = levelStages[levelStages.length - 1];
							if(stage && stage.name === name){
								stage.levels.push(levels[index]);
							}
							else{
								levelStages.push({
									name : name,
									blurbId : STAGES[name].blurbId,
									blurbTextEn : STAGES[name].blurbTextEn,
									levels : [ levels[index] ]
								})
							}
							breakToLevel = true;
							break;
						}
					}
					if(breakToLevel){
						break;
					}
				}
			}
			//levelStages looks like : [{name:"beginner", blurb:"beginner", levels:[{/**/},{/**/},{/**/}]},]

			return me.html(tLevelNav, {
				currentLevelId : currentEnroll.studentLevel.id,
				levelStages : levelStages,
				levelContent : me[DATA]
			}).then(function () {
				//landing logic
				var defaultLevel = currentCourseEnroll && currentCourseEnroll.studentLevel || data.course.children[0];
				var archiveId = defaultLevel.archiveId;
				me.load(defaultLevel.id, {
					e10: archiveId && archiveId.e10,
					e13: archiveId && archiveId.e13
				});
				pointerTo.call(me, me[$ELEMENT].find(SEL_SELECTED));
			});
		},

		"dom:.ets-pr-level-icon/mouseenter" : function(e){
			var $target = $(e.currentTarget);
			if ($target.data('state') !== STATE_NORMAL) {
				this.publish('progress-report/ge/state-circle/hovered', $target.data("id"));
			}
		},
		"dom:.ets-pr-level-icon/mouseleave": function () {
			this.publish('progress-report/ge/state-circle/hovered', null);
		},
		"dom:.ets-pr-level-icon/click" : function(element){
			var me = this;
			var $target = $(element.currentTarget);
			var $data = $target.data();
			var id = $data.id;

			if ($target.data('state') !== STATE_NORMAL && !$target.hasClass(CLS_SELECTED)) {
				me.load(id, {
					e10: $data.archiveE10Id,
					e13: $data.archiveE13Id
				});
				pointerTo.call(me, $target);
			}
		},
		"load" : function(levelId, archiveId){
			var me = this;
			var levelIndex = -1;
			var $allIcon;

			if(me[SELECTED_LEVEL] !== levelId){

				me.publish('progress-report/ge/state-circle/selected', levelId);
				$allIcon = me.$element.find(SEL_ICON);

				me[DATA] && me[DATA].forEach(function(levelContent, index){
					if(levelContent.id === levelId){
						levelIndex = index;
					}
				});

				if(levelIndex !== -1){
					me[SELECTED_LEVEL] = levelId;
					Load.loadLevel("ge", levelId, archiveId);

					unSelectIcon.call(me);

					//change style
					$allIcon.removeClass(CLS_SELECTED);
					$($allIcon[levelIndex]).addClass(CLS_SELECTED);
					selectIcon($($allIcon[levelIndex]));
				}
			}
		}
	});
});
define('school-ui-progress-report/widget/container/ge/level-navigation/state-circle',[
	"school-ui-progress-report/widget/shared/state-circle/main"
], function (StateCircleWidget) {
	"use strict";

	return StateCircleWidget.extend({
		"hub:memory/progress-report/ge/state-circle/selected": function (selectedId) {
			this.setSelected(selectedId);
		},
		"hub:memory/progress-report/ge/state-circle/hovered": function (hoveredId) {
			this.setHovered(hoveredId);
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/ge/level-test/level-test.html',[],function() { return function template(data) { var o = "<div class=\"ets-pr-level-test-container\">\n\t<h2 class=\"ets-pr-score-title\" data-weave=\"school-ui-progress-report/widget/container/ge/level-test/level-test-name\"></h2>\n\t<div class=\"ets-pr-score-all\">\n\t\t<div class=\"ets-pr-score\">\n\t\t\t<span class=\"ets-pr-percentage\">" + data.overallScore+ "</span>%\n\t\t</div>\n\t\t<div class=\"ets-pr-overall\">\n\n\t\t\t<i class=\"ets-pr-complete " + (data.passed ? '' : 'ets-none')+ "\">\n\t\t\t\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_checkmark',32,32)\"></div>\n\t\t\t</i>\n\t\t\t<br/>\n\t\t\t<span class=\"ets-pr-tips\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"660190\" data-text-en=\"Overall Score\"></span>\n\t\t</div>\n\t</div>\n\n\t<div class=\"ets-pr-score-section\">\n\t\t"; for (var n=0; n<data.steps.length; n++){
			var step = data.steps[n];
			o += "\n\t\t<div class=\"ets-pr-score-each\">\n\t\t\t<span class=\"ets-pr-score-topic\">" + step.name+ "</span>\n\t\t\t<div class=\"ets-pr-score " + (step.passed ? '' : 'ets-failed')+ "\">\n\t\t\t\t"; if(n === 0){ o += "\n\t\t\t\t\t<i class=\"ets-pr-flag\" style=\"left:" + (data.passPercent + '%') + "\">\n\t\t\t\t\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_flag',20,200)\"></div>\n\t\t\t\t\t</i>\n\t\t\t\t"; } o += "\n\t\t\t\t<span class=\"ets-pr-score-progress\"></span>\n\t\t\t</div>\n\t\t\t<span class=\"ets-pr-score-score\">" + step.score+ "%</span>\n\t\t</div>\n\t\t"; } o += "\n\t</div>\n\t<a class=\"ets-pr-retake\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"660191\" data-text-en=\"Retake the test\"></a>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/ge/level-test/legacy/main',[
	"when",
	"poly",
	"jquery",
	"client-tracking",
	"troopjs-ef/component/widget",
	"template!../level-test.html"
], function (when, poly, $, ct, Widget, tLevelTest) {
	"use strict";

	var UNIT_STRUCTURE_URL = "/services/school/courseware/GetUnitStructure.ashx";
	var UNIT_SCORE_URL = "/services/school/courseware/GetUnitScore.ashx";

	var SEL_STEPS = ".ets-pr-score-progress";
	var SEL_FLAG = ".ets-pr-flag";

	var $ELEMENT = "$element";
	var SITE_VERSION = "siteVersion";
	var LANGUAGE_CODE = "languageCode";
	var PARTNER_CODE = "partnerCode";
	var MEMBER_ID = "memberid";
	var LEVEL_ID = "_levelid";
	var RETAKE_LEVEL_ID = "_retake_levelid";
	var CONTEXT = "_context";
	var MARKET_CODE = "marketCode";
	var DATA = "_data";


	return Widget.extend({
		"hub:memory/load/level": function onLevel(page, data){
			var me = this;
			me[RETAKE_LEVEL_ID] = data.level.legacyLevelId;
			me.query("leveltest_best_levelid!" + data.level.levelCode).spread(function(data){
				me.render(me[CONTEXT], me[LEVEL_ID] = data && data.levelId);
			});
		},
		"hub:memory/context":function(context){
			var me = this;
			if(context){
				me.render(me[CONTEXT] = context, me[LEVEL_ID]);
			}
		},
		"render" : function(context, levelId){
			var me = this;

			if(context && levelId){

				me[SITE_VERSION] = context[SITE_VERSION];
				me[LANGUAGE_CODE] = context.cultureCode;
				me[PARTNER_CODE] = context[PARTNER_CODE];
				me[MEMBER_ID] = context.user.member_id;
				me[MARKET_CODE] = context.countryCode;

				when.all([
					me.getUnitStructure(),
					me.getUnitScore()
				]).spread(function(unitStructure, unitScore){
					var structure = unitStructure && unitStructure[0];
					var score = unitScore && unitScore[0];
					var passPercent;
					var steps;
					//we need to calc this value, because backend service api do not cover this status
					var attempted;


					if(structure && score){
						steps = structure.Unit.Lessons[0].Steps.map(function(item, index){
							return {
								name : item.StepTypeName
							}
						});

						score.Unit.Lessons[0].Steps.forEach(function(item, index){
							var step = steps[index];
							//Step State:  2: Incomplete, 3: Complete
							attempted = attempted || item.State === 3;

							step.correct = item.CorrectAnswerCount;
							step.incorrect = item.QuestionCount - item.CorrectAnswerCount;
							step.score = item.Score;
							step.passed = item.Score >= structure.Unit.Lessons[0].StepPassPercent;
						});

						me[DATA] = {
							retakeLevelId : me[RETAKE_LEVEL_ID],
							levelId : me[LEVEL_ID],
							overallScore : score.Unit.Score,
							steps : steps,
							passPercent : structure.Unit.StepPassPercent,
							//Lesson State,  0： InProgress, 1: Passed
							passed : score.Unit.Lessons[0].State === 1
						};

						if(attempted){
							me.html(tLevelTest, me[DATA]).delay(0).then(function(){
								var $steps = me[$ELEMENT].find(SEL_STEPS);
								$steps.each(function(index, step){
									$(step).css({
										width : me[DATA].steps[index].score + "%"
									})
								});

							});
						}
						else{
							me[$ELEMENT].empty();
						}
					}
				});
			}
			else{
				me[$ELEMENT].empty();
			}

		},
		"getUnitStructure" : function(){
			var me = this;
			return me[LEVEL_ID] && me.publish("ajax", {
				url : UNIT_STRUCTURE_URL,
				data : {
					type : 1,
					showBlurbs : 0,
					siteVersion : me[SITE_VERSION],
					languageCode : me[LANGUAGE_CODE],
					partnerCode : me[PARTNER_CODE],
					memberid : me[MEMBER_ID],
					areaCode : "Etown",
					marketCode : me[MARKET_CODE],
					cultureCode : me[LANGUAGE_CODE],
					levelid : me[LEVEL_ID]
				}
			});
		},
		"getUnitScore" : function(){
			var me = this;
			return me[LEVEL_ID] && me.publish("ajax", {
				url : UNIT_SCORE_URL,
				data : {
					type : 2,
					siteVersion : me[SITE_VERSION],
					languageCode : me[LANGUAGE_CODE],
					partnerCode : me[PARTNER_CODE],
					memberid : me[MEMBER_ID],
					levelid : me[LEVEL_ID]
				}
			});
		},

		"dom:.ets-pr-retake/click": function (evt) {
			var me = this;
			ct.useraction({
				"action.levelTest": "1"
			});
			window.open("/school/content/leveltest.aspx?testid=" + me[RETAKE_LEVEL_ID] + "&isredo=true");
		}

	});
});

define('school-ui-progress-report/widget/container/ge/level-test/level-test-name',[
	"when",
	"jquery",
	"troopjs-ef/component/widget"
], function (when, $, Widget, tLevelTestName) {
	"use strict";

	return Widget.extend({
		"sig/start": function () {
			var me = this;

			var defaultNamePromise = me.query('blurb!660189').spread(function (blurbLevelTest) {
				return blurbLevelTest.translation;
			});
			var mappedNamePromise = me.query('ccl!"school.courseware.level.mapping.query"').spread(function (cclMappingQuery) {
				if (!cclMappingQuery.value) {
					return null;
				}
				return me.query(cclMappingQuery.value).spread(function (mapped) {
					return mapped.courseLevelTestNameMap;
				});
			});

			return when.all([
				defaultNamePromise,
				mappedNamePromise
			]).spread(function (defaultName, mappedName) {
				me.defaultName = defaultName;
				me.mappedName = mappedName;
			});
		},
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;
			if (page === "ge") {
				var levelCode = data.level.levelCode;
				var levelTestName = me.mappedName && me.mappedName[levelCode] || me.defaultName || 'Level Test';
				me.text(levelTestName);
			}
			else {
				me.text('');
			}
		}
	});
});

define('school-ui-progress-report/widget/container/ge/level-test/platform2/main',[
	"module",
	"jquery",
	"client-tracking",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-progress-report/enum/score-state",
	"template!../level-test.html"
], function (module, $, ct, Widget, progressState, scoreState, tLevelTest) {
	"use strict";

	var MODULE_CONFIG = $.extend({
		levelTestPath: "/school/content/leveltest.aspx"
	}, module.config() || {});

	var SEL_STEPS = ".ets-pr-score-progress";

	return Widget.extend(function (path, $element, page) {
		this.page = page;
	}, {
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;

			if (page !== me.page) {
				return;
			}

			if (!data.level.levelTest || data.level.levelTest.isTemplate) {
				me.$element.empty();
				return;
			}

			var level = data.level;
			var levelTest = data.level.levelTest;
			if (progressState.notStarted(levelTest.progress.state)) {
				me.$element.empty();
				return;
			}

			me.templateLevelId = level.templateLevelId;

			var renderData = {
				overallScore: levelTest.progress.score,
				passPercent: scoreState.passScore,
				passed: progressState.hasPassed(levelTest.progress.state),
				steps: levelTest.progress.testSections.sort(function(prev,next){
					return (prev.sectionOrder || 0) - (next.sectionOrder || 0);
				}).map(function (sectionScoreInfo) {
					return {
						name: sectionScoreInfo.sectionName,
						score: sectionScoreInfo.score || 0,
						passed: sectionScoreInfo.score >= scoreState.passScore
					}
				})
			};

			me.html(tLevelTest, renderData).delay(0).then(function () {
				var $steps = me.$element.find(SEL_STEPS);
				$steps.each(function (stepIndex, step) {
					$(step).width(renderData.steps[stepIndex].score + "%");
				});
			});
		},
		"dom:.ets-pr-retake/click": function (evt) {
			var me = this;
			ct.useraction({
				"action.levelTest": "1"
			});
			window.open((MODULE_CONFIG.levelTestPath || "/school/content/leveltest.aspx") + "?testid=" + me.templateLevelId + "&isredo=true");
		}

	});
});

define('school-ui-progress-report/widget/container/ge/level-test/version-selector',[
	"jquery",
	"troopjs-ef/component/widget"
], function ($, Widget) {
	"use strict";

	var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

	return Widget.extend(function (path, $element, page) {
		this.page = page;
	}, {
		"sig/start": function () {
			var me = this;

			me.query(MSS_LEVEL_TEST_VERSION).spread(function (mssLevelTestVersion) {
				var levelTestWidget = "school-ui-progress-report/widget/container/ge/level-test/";

				var levelTestVersion = parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);
				if (levelTestVersion === 1) {
					levelTestWidget += "legacy/main('" + me.page + "')";
				}
				else {
					levelTestWidget += "platform2/main('" + me.page + "')";
				}

				var $widget = $('<div></div>', {
					"data-weave": levelTestWidget
				});
				me.$element.replaceWith($widget);
				$widget.weave();
			});
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/ge/ge.html',[],function() { return function template(data) { var o = "<div class=\"ets-pr-header\">\n\t<div class=\"ets-pr-header-nav\" data-weave=\"school-ui-progress-report/widget/container/ge/level-navigation/main('initData')\"></div>\n\t<div class=\"ets-pr-level-info ets-pr-header-content\" data-weave=\"school-ui-progress-report/widget/shared/level-info/main('ge')\"></div>\n</div>\n<div class=\"ets-pr-body\">\n\t<div class=\"ets-pr-content\">\n\t\t<div class=\"ets-pr-unit\">\n\t\t\t<div class=\"ets-pr-unit-list\" data-weave=\"school-ui-progress-report/widget/shared/unit-list/normal/main('ge', 'initData')\"></div>\n\t\t\t<div class=\"ets-pr-level-test\" data-weave=\"school-ui-progress-report/widget/container/ge/level-test/version-selector('ge')\"></div>\n\t\t\t<div class=\"ets-pr-unit-list-e10-archive\" data-weave=\"school-ui-progress-report/widget/shared/unit-list/e10-archive/main('ge', 'initData')\"></div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/ge/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"template!./ge.html"
], function ($, Widget, tGe) {
	"use strict";

	var INIT_DATA = "_init_data";

	var $ELEMENT = "$element";

	return Widget.extend(function($element, path, initData){
		this[INIT_DATA] = initData;
	},{
		'sig/start' : function(){
			var me = this;
			me[$ELEMENT].html(tGe());
			me[$ELEMENT].find(".ets-pr-header-nav").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-ge-level-info").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-unit-list").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-unit-list-e10-archive").data("initData", me[INIT_DATA]);
			return me.weave();
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/ind/ind-navigation/ind-navigation.html',[],function() { return function template(data) { var o = "";
var cardsPerPage = data.cardsPerPage;
var spinCards = data.spinCards;

function renderSpinCard(spinCard) {
	var classes = ['ets-pr-spin-nav-card'];
	if (spinCard.levelId === data.selectedLevelId) {
		classes.push('ets-pr-selected');
	}
	// be careful not to leave line return or spaces around cards
o += "<span class=\"" +classes.join(' ')+ "\" data-id=\"" +spinCard.levelId+ "\" data-archive-e13-level-id=\"" +(spinCard.archiveId && spinCard.archiveId.e13 || '') + "\">\n\t<span class=\"ets-pr-spin-nav-card-header\">\n\t\t<span class=\"ets-pr-spin-nav-card-image\"></span>\n\t</span>\n\t<span class=\"ets-pr-spin-nav-card-content\">\n\t\t<span class=\"ets-pr-spin-nav-card-course\">" +spinCard.courseName+ "</span>\n\t\t<span class=\"ets-pr-spin-nav-card-level\">" +spinCard.levelName+ "</span>\n\t</span>\n\t<span data-state=\"" +spinCard.state+ "\" data-id=\"" +spinCard.levelId+ "\"\n\t      class=\"ets-pr-spin-nav-card-progress\"\n\t     data-weave=\"school-ui-progress-report/widget/container/ind/ind-navigation/state-circle\"></span>\n</span>";
}

function renderSpinCardsPage(pageCards, pageIndex) {
	var classes = ['ets-pr-spin-nav-page'];
	if (pageIndex !== data.selectedPage) {
		classes.push('ets-none');
	}
o += "<div class=\"" +classes.join(' ')+ "\">";
	pageCards.forEach(renderSpinCard);
o += "</div>";
}


// TEMPLATE BEGIN

o += "\n<div class=\"ets-pr-spin-nav ets-pr-header-content\">\n";
	var pageIndex = 0;
	for (var cardIndex = 0; cardIndex < spinCards.length; cardIndex+=cardsPerPage) {
		var pageCards = spinCards.slice(cardIndex, cardIndex+cardsPerPage);
		renderSpinCardsPage(pageCards, pageIndex);
		++pageIndex;
	}
o += "\n"; if (spinCards.length > cardsPerPage) { o += "\n\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_spin_previous_page',11,21)\"\n\t     class=\"ets-pr-spin-nav-previous-page ets-pr-disabled\" data-action=\"previous-page\"></div>\n\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_spin_next_page',11,21)\"\n\t     class=\"ets-pr-spin-nav-next-page ets-pr-disabled\" data-action=\"next-page\"></div>\n\t<div class=\"ets-pr-spin-nav-pagination\" data-weave=\"troopjs-ef/blurb/widget\"\n\t     data-blurb-id=\"694984\" data-text-en=\"^number^ / ^total^\"\n\t     data-values=\"{&quot;total&quot;:" +String(data.maxPageIndex+1)+ "}\">\n\t\t<span class=\"ets-pr-spin-nav-page-num\" data-value-name=\"number\"></span>\n\t</div>\n"; } o += "\n"; if (spinCards.length === 0) { o += "\n\t<div class=\"ets-pr-header-no-course\">\n\t\t<div class=\"ets-pr-header-no-course-content\">\n\t\t\t<div class=\"ets-pr-header-content-start\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"719531\"></div>\n\t\t\t<div class=\"ets-pr-header-content-detail\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"719532\"></div>\n\t\t</div>\n\t</div>\n"; } o += "\n</div>\n<div class=\"ets-pr-nav-bottom-border\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/ind/ind-navigation/ind-card-image.html',[],function() { return function template(data) { var o = "<div style=\"background-image: url('" +data.imageUrl+ "')\"\n\t\tclass=\"ets-pr-spin-nav-card-image\"></div>"; return o; }; });
define('school-ui-progress-report/widget/container/ind/ind-navigation/main',[
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

define('school-ui-progress-report/widget/container/ind/ind-navigation/state-circle',[
	"school-ui-progress-report/widget/shared/state-circle/main"
], function (StateCircleWidget) {
	"use strict";

	return StateCircleWidget.extend({
		"hub:memory/progress-report/spin/state-circle/selected": function (selectedId) {
			this.setSelected(selectedId);
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/ind/ind.html',[],function() { return function template(data) { var o = "<div class=\"ets-pr-header\">\n\t<div class=\"ets-pr-header-nav\" data-weave=\"school-ui-progress-report/widget/container/ind/ind-navigation/main('initData')\"></div>\n\t<div class=\"ets-pr-level-info ets-pr-header-content\" data-weave=\"school-ui-progress-report/widget/shared/level-info/main('ind')\"></div>\n</div>\n<div class=\"ets-pr-body\">\n\t<div class=\"ets-pr-content\">\n\t\t<div class=\"ets-pr-unit\">\n\t\t\t<div class=\"ets-pr-unit-list\" data-weave=\"school-ui-progress-report/widget/shared/unit-list/normal/main('ind','initData')\"></div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/ind/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"template!./ind.html"
], function ($, Widget, Load, tSpin) {
	"use strict";

	var INIT_DATA = "_init_data";
	var $ELEMENT = "$element";

	return Widget.extend(function ($element, path, initData) {
		this[INIT_DATA] = initData;
	}, {
		"sig/start": function () {
			var me = this;
			me[$ELEMENT].html(tSpin());
			me[$ELEMENT].find(".ets-pr-header-nav").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-unit-list").data("initData", me[INIT_DATA]);
			return me.weave();
		}
	});
});

define('school-ui-progress-report/widget/container/main',[
	"jquery",
	"when",
	"poly",
	"client-tracking",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/course-type"
], function ($, when, poly, ct, Widget, courseType) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_NONE = "ets-none";
	var CLS_CONTAINER = "ets-pr-container";
	var CLS_CONTAINER_ITEM = "ets-pr-container-item";

	var COURSE = "enrollable_course";
	var ENROLL = "current_enroll";
	var FEEDBACKS= "feedbacks";
	var TEST_RESULTS_WIDGET = "test_results_widget";
	var DATA = "_data";
	var PAGENAME = "_pagename";

	function initContainer(tabName, initData) {
		var me = this;
		var widgetClass = CLS_CONTAINER + "-" + tabName;
		var $widget = me[$ELEMENT].find("." + widgetClass);
		if ($widget.length === 0) {
			$widget = $("<div/>", {
				"class": widgetClass + " " + CLS_CONTAINER_ITEM + " " + CLS_NONE,
				"data-weave": "school-ui-progress-report/widget/container/" + tabName + "/main(initData)"
			})
			.data("initData", initData)
			.appendTo(me[$ELEMENT]);

			switchContainer($widget);
			return $widget.weave();
		}
		else {
			switchContainer($widget);

			ct.pagename(me["_" + tabName + "_" + PAGENAME]);

			return when.resolve();
		}
	}

	function switchContainer($container) {
		$container.removeClass(CLS_NONE).siblings().addClass(CLS_NONE);
	}

	return Widget.extend(function(){
		var me = this;
		me[DATA] = me[$ELEMENT].data("assets");
	},{
		"hub:memory/navigate/to": function (uri) {
			var me = this;
			var tabName;

			switch (uri.path.toString()) {
				case "general-english":
					tabName = "ge";

					me[DATA][COURSE].items.forEach(function(entry, entryIndex){
						if(courseType.isGECourse(entry.courseTypeCode)) {
							initContainer.call(me, tabName, {
								"course": entry,
								"currentEnroll": me[DATA][ENROLL]
							});
						}
					});

					break;
        case "business-english":
          tabName = "be";
          var course_list = [];
          me[DATA][COURSE].items.forEach(function(entry, entryIndex){
            if(courseType.BusinessEnglish === entry.courseTypeCode) {
              course_list.push(entry);
            }
          });

          initContainer.call(me, tabName, {
            "course": course_list,
            "currentEnroll": me[DATA][ENROLL]
          });

          break;
        case "industry-english":
          tabName = "ind";
          var course_list = [];
          me[DATA][COURSE].items.forEach(function(entry, entryIndex){
            if(courseType.IndustryEnglish === entry.courseTypeCode) {
              course_list.push(entry);
            }
          });
          initContainer.call(me, tabName, {
            "course": course_list,
            "currentEnroll": me[DATA][ENROLL]
          });

          break;
				case "special-interest-courses":
					tabName = "spin";

					var course_list = [];
					me[DATA][COURSE].items.forEach(function(entry, entryIndex){
						if(courseType.isSpinCourse(entry.courseTypeCode)) {
							course_list.push(entry);
						}
					});

					initContainer.call(me, tabName, {
						"course": course_list,
						"currentEnroll": me[DATA][ENROLL]
					});

					break;
				case "teacher-feedback":
					tabName = "feedback";

					initContainer.call(me, tabName, {
						feedbacks: me[DATA][FEEDBACKS],
						"fb_id": uri.query && uri.query.fb_id
					}).then(function(){
						ct.pagename("ProgressReport:TeacherFeedback");
					});
					break;
				case "test-results":
					tabName = "test-results";

					initContainer.call(me, tabName, me[DATA][TEST_RESULTS_WIDGET]).then(function(){
						ct.pagename("ProgressReport:TestResults");
					});
					break;
			}

			return when.resolve();
		},

		"hub/tracking/pagename": function(courseType, pagename) {
			var me = this;
			me["_" + courseType + "_" + PAGENAME] = pagename;
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/spin/spin.html',[],function() { return function template(data) { var o = "<div class=\"ets-pr-header\">\n\t<div class=\"ets-pr-header-nav\" data-weave=\"school-ui-progress-report/widget/container/spin/spin-navigation/main('initData')\"></div>\n\t<div class=\"ets-pr-level-info ets-pr-header-content\" data-weave=\"school-ui-progress-report/widget/shared/level-info/main('spin')\"></div>\n</div>\n<div class=\"ets-pr-body\">\n\t<div class=\"ets-pr-content\">\n\t\t<div class=\"ets-pr-unit\">\n\t\t\t<div class=\"ets-pr-unit-list\" data-weave=\"school-ui-progress-report/widget/shared/unit-list/normal/main('spin','initData')\"></div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/container/spin/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"template!./spin.html"
], function ($, Widget, Load, tSpin) {
	"use strict";

	var INIT_DATA = "_init_data";
	var $ELEMENT = "$element";

	return Widget.extend(function ($element, path, initData) {
		this[INIT_DATA] = initData;
	}, {
		"sig/start": function () {
			var me = this;
			me[$ELEMENT].html(tSpin());
			me[$ELEMENT].find(".ets-pr-header-nav").data("initData", me[INIT_DATA]);
			me[$ELEMENT].find(".ets-pr-unit-list").data("initData", me[INIT_DATA]);
			return me.weave();
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/container/spin/spin-navigation/spin-navigation.html',[],function() { return function template(data) { var o = "";
var cardsPerPage = data.cardsPerPage;
var spinCards = data.spinCards;

function renderSpinCard(spinCard) {
	var classes = ['ets-pr-spin-nav-card'];
	if (spinCard.levelId === data.selectedLevelId) {
		classes.push('ets-pr-selected');
	}
	// be careful not to leave line return or spaces around cards
o += "<span class=\"" +classes.join(' ')+ "\" data-id=\"" +spinCard.levelId+ "\" data-archive-e13-level-id=\"" +(spinCard.archiveId && spinCard.archiveId.e13 || '') + "\">\n\t<span class=\"ets-pr-spin-nav-card-header\">\n\t\t<span class=\"ets-pr-spin-nav-card-image\"></span>\n\t</span>\n\t<span class=\"ets-pr-spin-nav-card-content\">\n\t\t<span class=\"ets-pr-spin-nav-card-course\">" +spinCard.courseName+ "</span>\n\t\t<span class=\"ets-pr-spin-nav-card-level\">" +spinCard.levelName+ "</span>\n\t</span>\n\t<span data-state=\"" +spinCard.state+ "\" data-id=\"" +spinCard.levelId+ "\"\n\t      class=\"ets-pr-spin-nav-card-progress\"\n\t     data-weave=\"school-ui-progress-report/widget/container/spin/spin-navigation/state-circle\"></span>\n</span>";
}

function renderSpinCardsPage(pageCards, pageIndex) {
	var classes = ['ets-pr-spin-nav-page'];
	if (pageIndex !== data.selectedPage) {
		classes.push('ets-none');
	}
o += "<div class=\"" +classes.join(' ')+ "\">";
	pageCards.forEach(renderSpinCard);
o += "</div>";
}


// TEMPLATE BEGIN

o += "\n<div class=\"ets-pr-spin-nav ets-pr-header-content\">\n";
	var pageIndex = 0;
	for (var cardIndex = 0; cardIndex < spinCards.length; cardIndex+=cardsPerPage) {
		var pageCards = spinCards.slice(cardIndex, cardIndex+cardsPerPage);
		renderSpinCardsPage(pageCards, pageIndex);
		++pageIndex;
	}
o += "\n"; if (spinCards.length > cardsPerPage) { o += "\n\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_spin_previous_page',11,21)\"\n\t     class=\"ets-pr-spin-nav-previous-page ets-pr-disabled\" data-action=\"previous-page\"></div>\n\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_spin_next_page',11,21)\"\n\t     class=\"ets-pr-spin-nav-next-page ets-pr-disabled\" data-action=\"next-page\"></div>\n\t<div class=\"ets-pr-spin-nav-pagination\" data-weave=\"troopjs-ef/blurb/widget\"\n\t     data-blurb-id=\"694984\" data-text-en=\"^number^ / ^total^\"\n\t     data-values=\"{&quot;total&quot;:" +String(data.maxPageIndex+1)+ "}\">\n\t\t<span class=\"ets-pr-spin-nav-page-num\" data-value-name=\"number\"></span>\n\t</div>\n"; } o += "\n</div>\n<div class=\"ets-pr-nav-bottom-border\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/container/spin/spin-navigation/spin-card-image.html',[],function() { return function template(data) { var o = "<div style=\"background-image: url('" +data.imageUrl+ "')\"\n\t\tclass=\"ets-pr-spin-nav-card-image\"></div>"; return o; }; });
define('school-ui-progress-report/widget/container/spin/spin-navigation/main',[
	"poly",
	"jquery",
	"when",
	"shadow!jquery.jscrollpane#$=jquery&jQuery=jquery&exports=jQuery",
	"shadow!jquery.mousewheel#$=jquery&jQuery=jquery&exports=jQuery",
	"troopjs-ef/component/widget",
	"school-ui-progress-report/utils/load",
	"school-ui-shared/utils/progress-state",
	"template!./spin-navigation.html",
	"template!./spin-card-image.html"
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
		Load.loadLevel("spin", levelId, archiveId);
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

define('school-ui-progress-report/widget/container/spin/spin-navigation/state-circle',[
	"school-ui-progress-report/widget/shared/state-circle/main"
], function (StateCircleWidget) {
	"use strict";

	return StateCircleWidget.extend({
		"hub:memory/progress-report/spin/state-circle/selected": function (selectedId) {
			this.setSelected(selectedId);
		}
	});
});
define('school-ui-progress-report/widget/container/test-results/main',[
	"jquery",
	"logger",
	"troopjs-ef/component/widget"
], function ($, Logger, Widget) {
	"use strict";

	var $ELEMENT = "$element";
	var PROP_TEST_RESULTS_WIDGET = "_testResultsWidget";

	return Widget.extend(function ($element, path, testResultsWidget) {
		this[PROP_TEST_RESULTS_WIDGET] = testResultsWidget;
	}, {
		"sig/start": function () {
			var me = this;
			var widgetPath = me[PROP_TEST_RESULTS_WIDGET];
			if (widgetPath) {
				var $widget = $("<div></div>", {
					"data-weave": widgetPath
				});

				$widget.appendTo(me[$ELEMENT]).weave();
			}
			else {
				Logger.log("Progress Report: test results widget not found.")
			}
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/navigation/navigation.html',[],function() { return function template(data) { var o = "";
var nav_item = data.nav_item;
o += "\n<div class=\"ets-pr-top-title\">\n\t<div class=\"ets-pr-top-title-content\">\n\t\t<div class=\"ets-pr-icon\">\n\t\t\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_progress',20,20)\"></div>\n\t\t</div>\n\t\t<h1 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"707546\" data-text-en=\"Progress &amp; Tests\"></h1>\n\t</div>\n</div>\n<div class=\"ets-pr-nav-list\">\n\t"; for(var i = 0; i < nav_item.length ; i++) {
	o += "\n\t<div class=\"ets-pr-nav-button " + (nav_item[i].enabled ? '' : 'ets-unavailable')+ "\"\n\t     data-hash-path=\"" +nav_item[i].hashPath+ "\"\n\t     data-disable-bottom-border-when-selected=\"" + (nav_item[i].disableBottomBorderWhenSelected ? 'true' : 'false') + "\"\n\t     data-item-index=\"" +i+ "\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +nav_item[i].blurbId+ "\" data-text-en=\"" +nav_item[i].name+ "\"></span>\n\t\t"; if (!nav_item[i].enabled){ o += "\n\t\t\t<div class=\"ets-pr-nav-tip\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + nav_item[i].disableBlurbId + "\" data-text-en=\"" + nav_item[i].disableTipsEn + "\"></div>\n\t\t"; } o += "\n\t</div>\n\t";}o += "\n</div>\n<div class=\"ets-pr-nav-bottom-border\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/widget/navigation/navigation-b2b.html',[],function() { return function template(data) { var o = "";
	var nav_item = data.nav_item;
	var type = data.type;
	var isDisplayCompanyGoal = data.isDisplayCompanyGoal;
	var courseTitle;
	if(type === 'general-english') {
		courseTitle = 659680;
	}
	if(type === 'business-english') {
		courseTitle = 718696;
	}
	if(type === 'industry-english') {
		courseTitle = 718697;
	}
o += "\n<div class=\"ets-pr-top-container\">\n\t<div class=\"bread-crumb-nav\">\n\t\t<a href=\"/2/progress-goals/\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"717604\" data-text-en=\"My progress & goals\"></a>\n\t\t<span class=\"nav-arrow\"> > </span>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +courseTitle+ "\"> </span>\n\t</div>\n\t<div class=\"ets-pr-top-title-content\">\n\t\t<h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +courseTitle+ "\"></h2>\n\t</div>\n\t"; if(isDisplayCompanyGoal) {o += "\n\t<div class=\"company-goal\">\n\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"717614\" data-text-en=\"Company Goal\"></span>\n\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_progress_flag',14,14)\"\n    class=\"progress-flag\"></div>\n\t</div>\n\t"; } o += "\n</div>\n<div class=\"ets-pr-nav-bottom-border\"></div>"; return o; }; });
define('school-ui-progress-report/widget/navigation/main',[
	"jquery",
	"when",
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/course-type",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/feature-access",
  "troopjs-browser/route/uri",
	"template!./navigation.html",
  "template!./navigation-b2b.html"
], function ($, when, poly, Widget, courseType, progressState, featureAccess, URI,  tNavigation, b2bNavigation) {
	"use strict";

	var $ELEMENT = "$element";

	var CLS_ACTIVE = "ets-active";
	var CLS_UNAVA = "ets-unavailable";
	var CLS_BOTTOM_BORDER = ".ets-pr-nav-bottom-border";

	var NAV_ITEMS = "_nav_items";
	var NAV_ITEMS_PROMISE = "_nav_items_promise";
	var ENROLLABLE_COURSES = "_course";
	var CURRENT_ENROLLMENT = "_current_enrollment";
	var FEEDBACKS = "_feedbacks";
	var ARCHIVE_WRITING = "_archive_writing";
	var TEST_RESULTS_WIDGET = "_test_results_widget";
  var HASH_PROMISE = "_hash_promise";

	var NAME_GE = "General English";
	var NAME_FEEDBACK = "Teacher Feedback";
	var NAME_TEST_RESULTS = "Test Results";
	var NAME_SPIN = "Special Interest Courses";

	var CCL_HAS_BEST_TEST="ccl!'school.ui.progress.report.has.best.test'";

	var ROUTE_COURSE_MAP = {
		'general-english': 'GE',
		'business-english': 'BE',
		'industry-english': 'IE'
	}

	function hasStartedCourse(courses) {
		return !courses.every(function (courseItem) {
			return courseItem.children.every(function (level) {
				return progressState.notStarted(level.progress.state);
			});
		});
	}

	function getGECourses(enrollableCourses) {
		return enrollableCourses.items.filter(function (studentCourse) {
			return courseType.isGECourse(studentCourse.courseTypeCode);
		});
	}

	function getSpinCourses(enrollableCourses) {
		return enrollableCourses.items.filter(function (studentCourse) {
			return courseType.isSpinCourse(studentCourse.courseTypeCode);
		});
	}

  function hashProcess(nav_items, uri) {
    var hashCheck = uri.path && nav_items.reduce(function (prev, item) {
      return prev || (uri.path.toString() === item.hashPath && item.enabled);
    }, false);

    if (hashCheck) {
      return uri.source;
    }
    else {
      return nav_items.reduce(function (prev, next) {
            return prev || (next.isCurrentCourse && next.hashPath);
          }, false) || nav_items[0].hashPath;
    }
  }

  function useB2BTemplate(hash){
    return hash === 'general-english' || hash === 'business-english' || hash === 'industry-english';
  }

	function isBECourse(courseTypeCode) {
		return courseType.BusinessEnglish === courseTypeCode.toUpperCase();
	}

	function isINDCourse(courseTypeCode) {
		return courseType.IndustryEnglish === courseTypeCode.toUpperCase();
	}

	function getCookieItem (sKey) {
		if (!sKey) { return null; }
		return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
	}

	function getLicense(header){
		return $.ajax({
			url:'/2/api/corporate-licensing/v1/studentlicenses',
			headers: header,
			type: 'GET'
		});
	}

	function getProgress(header, licenseID){
		return $.ajax({
			url:'/2/api/progress-goals/v1/progress/' + licenseID + '/company',
			headers: header,
			type: 'GET'
		});
	}

	function getCompanyGoal(){
		var token = getCookieItem('efid_tokens');
		var auth = JSON.parse(token);
		var header = {
			Authorization: "Bearer " + auth.access,
			"X-EF-Access": auth.account
		};

		var licensePromise = getLicense(header);

		return licensePromise.then(function(data){
			var licenseID = data.length > 0 && data[0].licenseId;
			return getProgress(header, licenseID);
		})
	}

	function isDisplayCompanyGoal(hash, companyGoals){
		var courseCode = ROUTE_COURSE_MAP[hash];
		return companyGoals.some(function(item){
			return item.type.toUpperCase() === courseCode;
		});
	}

	return Widget.extend(function(){
		var me = this;
		var data = me[$ELEMENT].data("assets");
		me[ENROLLABLE_COURSES] = data["enrollable_course"];
		me[CURRENT_ENROLLMENT] = data["current_enroll"];
		me[FEEDBACKS] = data["feedbacks"];
		me[TEST_RESULTS_WIDGET] = data["test_results_widget"];
		me[NAV_ITEMS_PROMISE] = when.defer();
    me[HASH_PROMISE] = when.defer();
	},{
		"render": function() {
			var me = this;
			var studentCourse = me[CURRENT_ENROLLMENT].studentCourse;
			var courseTypeCode = studentCourse ? studentCourse.courseTypeCode : null;
			var currentCourseIsGE = courseType.isGECourse(courseTypeCode);
			var currentCourseIsBE = isBECourse(courseTypeCode);
			var currentCourseIsIND = isINDCourse(courseTypeCode);
			var currentCourseIsSpin = courseType.isSpinCourse(courseTypeCode);
			var geCourses = getGECourses(me[ENROLLABLE_COURSES]);
			var spinCourses = getSpinCourses(me[ENROLLABLE_COURSES]);
			return me.query(CCL_HAS_BEST_TEST, me[HASH_PROMISE].promise, getCompanyGoal()).spread(function(cclHasBestTest, hash, companyGoals){
				var hasBestTest = (cclHasBestTest.value === "true");
				var hasFeedbacks = me[FEEDBACKS].length > 0;

				me[NAV_ITEMS] = [
					{
						"name": NAME_GE,
						"blurbId": "659680",
						"isCurrentCourse": currentCourseIsGE,
						"disableBottomBorderWhenSelected": true,
						"enabled": true,
						"visible": geCourses.length > 0
					},
          {
            "name": 'Industry English',
            "blurbId": "718697",
            "isCurrentCourse": currentCourseIsIND,
            "disableBottomBorderWhenSelected": true,
            "enabled": true,
            "visible": true
          },
          {
            "name": 'Business English',
            "blurbId": "718696",
            "isCurrentCourse": currentCourseIsBE,
            "disableBottomBorderWhenSelected": true,
            "enabled": true,
            "visible": true
          },
					{
						"name": NAME_SPIN,
						"blurbId": "659681",
						"isCurrentCourse": currentCourseIsSpin,
						"disableBottomBorderWhenSelected": true,
						"disableTextEn": "You haven't taken any special interest course yet.",
						"disableBlurbId": "660187",
						"enabled": hasStartedCourse(spinCourses) || currentCourseIsSpin,
						"visible": spinCourses.length > 0
					},
					{
						"name": NAME_FEEDBACK,
						"blurbId": "708939",
						"disableTipsEn": "You haven't got any teacher feedback yet.",
						"disableBlurbId": "660188",
						"enabled": hasFeedbacks,
						"visible": featureAccess.hasWritingClassFeature() || featureAccess.hasGLClassFeature() || featureAccess.hasPLClassFeature() || featureAccess.hasCP20ClassFeature() || featureAccess.hasEFTClassFeature() || hasFeedbacks
					},
					{
						"name": NAME_TEST_RESULTS,
						"blurbId": "666790",
						"disableTipsEn": "You haven't got any test results yet.",
						"disableBlurbId": "666792",
						"enabled": me[TEST_RESULTS_WIDGET],
						"visible": hasBestTest || me[TEST_RESULTS_WIDGET]
					}
				];

				me[NAV_ITEMS] = me[NAV_ITEMS].filter(function (item) {
					return item.visible;
				});
				me[NAV_ITEMS].forEach(function (item) {
					item.hashPath = item.name.toLocaleLowerCase().replace(/ /g, "-");
				});

        var _hash = hashProcess(me[NAV_ITEMS], hash);

        var template = useB2BTemplate(_hash) ? b2bNavigation : tNavigation;

        return me.html(template, {
          "nav_item": me[NAV_ITEMS],
					"type": _hash,
					'isDisplayCompanyGoal': isDisplayCompanyGoal(_hash, companyGoals)
        }).then(function () {
          me[$ELEMENT].find(CLS_BOTTOM_BORDER).hide();

          me[NAV_ITEMS_PROMISE].resolve(me[NAV_ITEMS]);
        });
			});
		},

    "hub:memory/navigate": function (hash) {
      var me = this;
      me[HASH_PROMISE] = when.defer();
      me[HASH_PROMISE].resolve(URI(hash));
      if(me.hash !== hash) {
        this.render();
        me.hash = hash;
      }
    },

		"hub:memory/context": function onContext(context){
			featureAccess.setFeaturesUnicode(context.featureAccessBits);
			this.render();
		},

		"hub/navigation/verify": function (uri) {
			var me = this;
			return me[NAV_ITEMS_PROMISE].promise.then(function (nav_items) {
				return [hashProcess(nav_items, uri)];
			});
		},

		"hub:memory/navigate/to": function(uri){
			var me = this;
			var $activeItem = me[$ELEMENT].find("[data-hash-path=" + uri.path + "]");
			$activeItem.addClass(CLS_ACTIVE).siblings().removeClass(CLS_ACTIVE);
			me[$ELEMENT].find(CLS_BOTTOM_BORDER)
				.toggle($activeItem.data('disableBottomBorderWhenSelected') !== true);
			return when.resolve();
		},

		"dom:.ets-pr-nav-button/click": function ($evt) {
			var me = this;
			var $target = $($evt.currentTarget);
			!$target.hasClass(CLS_UNAVA) && me.publish("navigate", $target.attr('data-hash-path'));
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/shared/certificate/certificate.html',[],function() { return function template(data) { var o = "";
	var showCertTip = data.showCertTip;
o += "\n<div class=\"ets-pr-cert-wrapper\">\n\t<button class=\"ets-pr-cert-view\">\n\t\t<span class=\"ets-pr-button-text\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659688\" data-text-en=\"View certificate\"></span>\n\t\t<span data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_arrow_light_right', 21, 11)\"></span>\n\t</button>\n\t<div class=\"ets-pr-cert-tip " +(showCertTip ? '' : 'ets-none')+ "\">\n\t\t<div class=\"ets-pr-cert-description\">\n\t\t\t<p class=\"ets-pr-cert-subtitle\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659684\" data-text-en=\"You have earned a\"></p>\n\t\t\t<h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659685\" data-text-en=\"Certificate\"></h4>\n\t\t\t<div class=\"ets-pr-cert-icon\">\n\t\t\t\t<div class=\"ets-pr-cert-icon-vector\" data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_cert', 40, 40)\"></div>\n\t\t\t\t<hr />\n\t\t\t</div>\n\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659686\" data-text-en=\"Click on 'View certificate' to see the details\"></p>\n\t\t</div>\n\t\t<button class=\"ets-pr-btn ets-pr-btn-cert\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659687\" data-text-en=\"Ok, got it!\"></button>\n\t</div>\n</div>"; return o; }; });
define('school-ui-progress-report/widget/shared/certificate/main',[
	"module",
	"jquery",
	"when",
	"poly",
	"client-tracking",
	"moment",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/course-type",
	"template!./certificate.html"
], function (module, $, when, poly, ct, Moment, Widget, CourseType, tCert) {
	"use strict";

	var MODULE_CONFIG = module.config() || {};
	MODULE_CONFIG.certUrl = MODULE_CONFIG.certUrl || "/school/course/CertificateBoard.aspx?key=";

	var $ELEMENT = "$element";

	var SEL_CERT_TIP = ".ets-pr-cert-tip";

	var CLS_NONE = "ets-none";

	var PROP_CERT_TIP_CLOSED = "_cert_tip_closed";
	var PROP_CERT_KEY = "_cert_key";
	var CURRENT_LEVEL_ID = "_current_level_id";

	var certUrl = MODULE_CONFIG.certUrl;
	var certWidth = 984;
	var certHeight = 550;

	var localStorage = window.localStorage;

	function openWindow(url, width, height) {
		var win = window.open(url, 'newwindow', 'height=' + height + ', width=' + width + ', toolbar=no, menubar=no, scrollbars=yes, resizable=yes,location=no, status=no');
		win.focus();
	}

	function convertToLegacyItem(certItem) {
		return {
			"date": Moment(certItem.certificateDate).locale("en").format("MMM DD, YYYY"),
			"course": certItem.courseName || "",
			"level": certItem.levelName,
			"Key": certItem.key,
			"levelCertificate": certItem.certificateName,
			"coursetype": 2,
			"name": certItem.studentName
		};
	}

	function initCertificateData(certItems, archiveCertItems) {
		var me = this;
		var certDataGE = [];
		var certDataSPIN = [];

		certItems.forEach(function (item) {
			if (me[CURRENT_LEVEL_ID] === item.studentLevelId) {
				me[PROP_CERT_KEY] = item.key;
			}
		});

		[certItems, archiveCertItems].forEach(function (items) {
			items.forEach(function (item) {
				var legacyItem = convertToLegacyItem(item);
				if (CourseType.isGECourse(item.courseTypeCode)) {
					certDataGE.push(legacyItem)
				}
				else {
					certDataSPIN.push(legacyItem);
				}
			});
		});

		window.generalCertificates = certDataGE;
		window.spinCertificates = certDataSPIN;
	}

	return Widget.extend(function ($element, name, currentLevelId) {
		var me = this;
		me[CURRENT_LEVEL_ID] = currentLevelId;
		me[PROP_CERT_KEY] = "";
	}, {
		"sig/start": function () {
			var me = this;

			var renderPromise = me.html(tCert, {
				showCertTip: localStorage && !localStorage.getItem(PROP_CERT_TIP_CLOSED)
			});

			var queryPromise = me.query([
				"student_certificate!*",
				"student_archive_certificate!*"
			]).spread(function (studentCert, studentArchiveCert) {
				var certItems = $.extend(true, [], studentCert.items);
				var archiveCertItems = $.extend(true, [], studentArchiveCert.items);
				initCertificateData.call(me, certItems, archiveCertItems);
			});

			return when.all([renderPromise, queryPromise]);
		},
		"dom:.ets-pr-cert-view/click": function () {
			var me = this;
			ct.useraction({
				"action.viewCertificate": "1"
			});
			openWindow(certUrl + me[PROP_CERT_KEY], certWidth, certHeight);
		},
		"dom:.ets-pr-btn-cert/click": function () {
			var me = this;
			me[$ELEMENT].find(SEL_CERT_TIP).addClass(CLS_NONE);
			localStorage && localStorage.setItem(PROP_CERT_TIP_CLOSED, "true");
		}
	});
});


define('troopjs-requirejs/template!school-ui-progress-report/widget/shared/level-info/level-info.html',[],function() { return function template(data) { var o = "";if (data.unCompletedLessons === 0) {o += "\n\t";if (data.hasLevelCertificate) {o += "\n\t\t<div class=\"ets-pr-completed-medal\" data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_medal',32,40)\"></div>\n\t";} else {o += "\n\t\t<div class=\"ets-pr-completed-checkmark\" data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_checkmark',32,32)\"></div>\n\t";}o += "\n\t<div class=\"ets-pr-completed-text\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"669820\" data-text-en=\"Completed\"></div>\n";}o += "\n<h2>" +data.level.levelName+ "</h2>\n";if (data.unCompletedLessons > 0) {o += "\n\t<h3>" +data.lessonsLeft+ "</h3>\n";}o += "\n";if (data.canShowCertificate) {o += "\n\t<div data-weave=\"school-ui-progress-report/widget/shared/certificate/main('" +data.level.studentLevelId+ "')\"></div>\n";} return o; }; });
define('school-ui-progress-report/widget/shared/level-info/main',[
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/enum/course-type",
	"template!./level-info.html"
], function (Widget, progressState, courseType, tLevelInfo) {
	"use strict";

	var PAGE = "_page";
	var STUDENT_ARCHIVE_CERT = "_student_archive_certificate";

	function hasLevelCertificate(level, studentCert) {
		return studentCert.items.reduce(function (prev, certItem) {
			return prev || (certItem.studentLevelId && certItem.studentLevelId === level.studentLevelId);
		}, false);
	}

	function canShowCertificate(currentLevel, studentCert, studentArchiveCert) {
		if (courseType.isGECourse(currentLevel.parent.courseTypeCode)) {
			return hasLevelCertificate(currentLevel, studentCert);
		}
		else {
			return hasLevelCertificate(currentLevel, studentCert) || studentArchiveCert.items.length;
		}
	}

	function getCompletedLessonCount(level) {
		var completedLessons = 0;
		level.children.forEach(function (unit) {
			unit.children.forEach(function (lesson) {
				progressState.hasPassed(lesson.progress.state) && completedLessons++;
			});
		});
		return completedLessons;
	}

	function getTotalLessonCount(level) {
		var totalLessons = 0;
		level.children.forEach(function (unit) {
			totalLessons += unit.children.length;
		});
		return totalLessons;
	}

	function initBlurb() {
		return {
			singleLessonLeft: {
				id: 669819,
				en: "^uncompleted^ lesson left of ^total^"
			},
			multiLessonsLeft: {
				id: 669818,
				en: "^uncompleted^ lessons left of ^total^"
			}
		};
	}

	return Widget.extend(function (path, $element, page) {
		var me = this;
		me[PAGE] = page;
	}, {
		"sig/start": function () {
			var me = this;
			return me.query("student_archive_certificate!*").spread(function (studentArchiveCert) {
				me[STUDENT_ARCHIVE_CERT] = studentArchiveCert;
			});
		},
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;
			if (me[PAGE] === page) {
				var level = data.level;

				var completedLessons = getCompletedLessonCount(level);
				var totalLessons = getTotalLessonCount(level);
				var unCompletedLessons = totalLessons - completedLessons;

				var blurbs = initBlurb();
				var blurbLessonsLeft = "blurb!" + (unCompletedLessons <= 1 ? blurbs.singleLessonLeft.id : blurbs.multiLessonsLeft.id);
				me.query([
					blurbLessonsLeft,
					"student_certificate!" + level.studentLevelId
				]).spread(function (blurbLessonsLeftResult, studentCert) {
					var lessonsLeft = blurbLessonsLeftResult.translation || blurbLessonsLeft.en;
					lessonsLeft = lessonsLeft.replace("^uncompleted^", "<span>" + unCompletedLessons + "</span>");
					lessonsLeft = lessonsLeft.replace("^total^", totalLessons);

					me.html(tLevelInfo, {
						page: page,
						level: level,
						hasLevelCertificate: hasLevelCertificate(level, studentCert),
						canShowCertificate: canShowCertificate(level, studentCert, me[STUDENT_ARCHIVE_CERT]),
						lessonsLeft: lessonsLeft,
						unCompletedLessons: unCompletedLessons,
						totalLessons: totalLessons
					});
				});
			}
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/shared/unit-list/unit-list.html',[],function() { return function template(data) { var o = "";
	var units = data.units;
	var lessonLinks = data.lessonLinks;
	var _getUnitState = this._getUnitState;
	var _hasLessonPassed = this._hasLessonPassed;
	var _progressState = this._progressState;
o += "\n<div class=\"ets-pr-unit-list-header\">\n\t<div class=\"ets-pr-lesson-name\"></div>\n\t<div class=\"ets-pr-lesson-time-spent\">\n\t\t<span class=\"ets-pr-text\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"666926\" data-text-en=\"Total time\"></span>\n\t</div>\n\t<div class=\"ets-pr-lesson-score\">\n\t\t<span class=\"ets-pr-text\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"666925\" data-text-en=\"Total score\"></span>\n\t\t<span class=\"ets-pr-icon\" data-toggle=\"popover\" data-placement=\"right\" data-trigger=\"hover\" data-html=\"true\">?</span>\n\t</div>\n\t<div class=\"ets-pr-lesson-state\"></div>\n</div>\n\n";
function renderLessonItems(lessons) {
	for(var lessonIndex = 0, lessonCount = lessons.length; lessonIndex < lessonCount; lessonIndex++) {
	var lesson = lessons[lessonIndex];
	o += "\n\t<div class=\"ets-pr-lesson\">\n\t\t<div class=\"ets-pr-lesson-name\" data-merged-template-lesson-id=\"" +lesson.templateLessonId+ "\" data-actual-template-lesson-id=\"" +(lesson.actualLesson && lesson.actualLesson.templateLessonId)+ "\">\n\t\t\t";if (lesson.lessonLink) {o += "\n\t\t\t<a href=\"" +lesson.lessonLink+ "\">" + (lesson.actualLesson && lesson.actualLesson.lessonName || lesson.lessonName) + "</a>\n\t\t\t";} else {o += "\n\t\t\t" + (lesson.actualLesson && lesson.actualLesson.lessonName || lesson.lessonName) + "\n\t\t\t";}o += "\n\t\t</div>\n\t\t<div class=\"ets-pr-lesson-time-spent\">\n\t\t\t"; if (lesson.progress.timeSpent === 1) { o += "\n\t\t\t" + lesson.progress.timeSpent + " <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"668332\" data-text-en=\"minute\"></span>\n\t\t\t"; } else if (lesson.progress.timeSpent > 1) { o += "\n\t\t\t" + lesson.progress.timeSpent + " <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"668333\" data-text-en=\"minutes\"></span>\n\t\t\t"; } else { o += "\n\t\t\t<span class=\"ets-pr-empty-content\">--</span>\n\t\t\t"; } o += "\n\t\t</div>\n\t\t<div class=\"ets-pr-lesson-score\">\n\t\t\t"; if (_progressState.hasPassed(lesson.progress.state)) { o += "\n\t\t\t" + lesson.progress.score + "%\n\t\t\t"; } else { o += "\n\t\t\t<span class=\"ets-pr-empty-content\">--</span>\n\t\t\t"; } o += "\n\t\t</div>\n\t\t<div class=\"ets-pr-lesson-state\">\n\t\t\t<div class=\"ets-pr-ico-mobilephone\">\n\t\t\t\t"; if (_hasLessonPassed(lesson,'MOBLesson')){ o += "\n\t\t\t\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_mobilephone',20,22)\" data-at-device=\"mobile\"></div>\n\t\t\t\t"; } o += "\n\t\t\t</div>\n\t\t\t<div class=\"ets-pr-ico-pc\">\n\t\t\t\t"; if (_hasLessonPassed(lesson,'PCLesson')){ o += "\n\t\t\t\t<div data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_pc',44,29)\" data-at-device=\"desktop\"></div>\n\t\t\t\t"; } o += "\n\t\t\t</div>\n\t\t\t"; if (_progressState.hasPassed(lesson.progress.state)) { o += "\n\t\t\t<div class=\"ets-pr-checkmark ets-pr-checkmark-passed\" data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_checkmark',24,24)\"></div>\n\t\t\t"; } else { o += "\n\t\t\t<div class=\"ets-pr-checkmark ets-pr-checkmark-not-passed\" data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_circle_gray',24,24)\"></div>\n\t\t\t"; } o += "\n\t\t</div>\n\t</div>\n\t";
	}
}
o += "\n\n";
for(var i = 0; i < units.length ; i++) {
	var unit = units[i];
	var unitState = _getUnitState(unit);
o += "\n<div class=\"ets-pr-unit-item\">\n\t<div class=\"ets-pr-unit-header\">\n\t\t<p class=\"ets-pr-unit-no\">\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"659676\" data-text-en=\"Unit\"></span>\n\t\t\t<span>" + unit.unitNo + "</span>\n\t\t\t"; if (unit.archiveUnit) {o += "\n\t\t\t\t<span class=\"ets-pr-lesson-list-switch to-new switched\"><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"705112\" data-text-en=\"New\"></span>";if (_progressState.hasPassed(unit.progress.state)) {o += "<span class=\"ets-pr-checkmark\" data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_checkmark',16,16)\"></span>";}o += "</span>\n\t\t\t\t<span class=\"ets-pr-lesson-list-switch to-old\"><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"705113\" data-text-en=\"Old\"></span>";if (_progressState.hasPassed(unit.archiveUnit.progress.state)) {o += "<span class=\"ets-pr-checkmark\" data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_checkmark',16,16)\"></span>";}o += "</span>\n\t\t\t"; } else if (_progressState.hasPassed(unit.progress.state)) { o += "\n\t\t\t\t<span class=\"ets-pr-checkmark\" data-weave=\"school-ui-shared/widget/vector('school-ui-progress-report/vector/ico_checkmark',24,24)\"></span>\n\t\t\t"; } o += "\n\t\t</p>\n\t\t<p class=\"ets-pr-unit-name\"><span data-weave=\"school-ui-shared/widget/hyphenate\">" + unit.unitName + "</span></p>\n\t\t"; if(unitState) { o += "\n\t\t\t<p class=\"ets-pr-unit-state ets-pr-unit-state-" +unitState.stateName+ "\"><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + unitState.blurbId+ "\" data-text-en=\"" + unitState.blurbTextEn+ "\"></span> " +unitState.suffix+ "</p>\n\t\t"; } o += "\n\t</div>\n\t<div class=\"ets-pr-unit-detail\">\n\t\t<div class=\"ets-pr-lesson-list is-new switched ets-show\">\n\t\t\t"; renderLessonItems(unit.children); o += "\n\t\t</div>\n\t\t";if (unit.archiveUnit) {o += "\n\t\t<div class=\"ets-pr-lesson-list is-old\">\n\t\t\t"; renderLessonItems(unit.archiveUnit.children); o += "\n\t\t</div>\n\t\t";}o += "\n\t</div>\n</div>\n"; }  return o; }; });
define('school-ui-progress-report/widget/shared/unit-list/base',[
	"jquery",
	"jquery.gudstrap",
	"when",
	"moment",
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/enum/moment-language",
	"template!./unit-list.html"
], function ($, GUD, when, Moment, Poly, Widget, progressState, momentLang, tUnitList) {
	"use strict";

	var PAGE = "_page";
	var PROMISE_BLURBS = "_promise_blurbs";
	var CURRENT_ENROLLMENT = "_currentEnroll";
	var SEL_UNIT_ITEM = ".ets-pr-unit-item";
	var SEL_LESSON_LIST_SWITCH = ".ets-pr-lesson-list-switch";
	var SEL_LESSON_LIST = ".ets-pr-lesson-list";
	var SEL_IS_NEW = ".is-new";
	var SEL_IS_OLD = ".is-old";
	var SEL_SCORE_ICON = ".ets-pr-unit-list-header .ets-pr-lesson-score .ets-pr-icon";
	var CLS_SWITCHED = "switched";
	var CLS_SHOW = "ets-show";

	function initBlurbs() {
		var me = this;
		var blurbs = {
			scoreTitle: {
				id: "666900",
				en: "How is the total score calculated?"
			},
			scoreContent1: {
				id: "666901",
				en: "The total score shows the score that is the highest from either the web, tablet or phone."
			},
			scoreContent2: {
				id: "666902",
				en: "The score on your phone is represented by stars, but shown as % in the progress report."
			}
		};

		var blurbNames = Object.keys(blurbs);
		var blurbIds = blurbNames.map(function (blurbName) {
			return "blurb!" + blurbs[blurbName].id;
		});

		return me.query(blurbIds).then(function (blurbResults) {
			blurbResults.forEach(function (blurbResult, index) {
				blurbs[blurbNames[index]].translation = blurbResult.translation || blurbs[blurbNames[index]].en;
			});

			return blurbs;
		});
	}

	function doRender(context, level) {
		var me = this;

		if (!context || !level) {
			return;
		}

		me._getUnitState = function (unit) {
			var unitProgress = unit.progress;
			if (progressState.notStarted(unitProgress.state)) {
				return {
					blurbId: "659677",
					blurbTextEn: "Not yet started",
					stateName: "not-started",
					suffix: ""
				};
			}
			else if (progressState.hasStarted(unitProgress.state)) {
				if (me[CURRENT_ENROLLMENT].studentUnit.id === unit.id) {
					return {
						blurbId: "659679",
						blurbTextEn: "Ongoing",
						stateName: "on-going",
						suffix: ""
					};
				}
				else {
					return {
						blurbId: "",
						blurbTextEn: "",
						stateName: "started",
						suffix: ""
					};
				}
			}
			else if (progressState.hasPassed(unitProgress.state)) {
				var momentPassed = Moment(unitProgress.completionDate);
				momentPassed.locale(momentLang[context.cultureCode.toLowerCase()] || "en");
				return {
					blurbId: "659678",
					blurbTextEn: "Passed on",
					stateName: "passed",
					suffix: momentPassed.format("ll")
				};
			}
		};

		me._hasLessonPassed = function (studentLesson, typeCode) {
			var detail = studentLesson.progress.detail;
			return detail && detail.items && detail.items.reduce(function (prev, item) {
					return prev || (item.sourceTypeCode === typeCode && progressState.hasPassed(item.state));
				}, false);
		};

		me._progressState = progressState;

		var renderPromise = me.html(tUnitList, {
			"units": level.children
		});

		return when.all([
			me[PROMISE_BLURBS],
			renderPromise
		]).spread(function (blurbs) {
			$(SEL_SCORE_ICON).popover({
				"title": "<p data-blurb-id='" + blurbs.scoreTitle.id + "' data-text-en='" + blurbs.scoreTitle.en + "'>" + blurbs.scoreTitle.translation + "</p>",
				"content": "<p data-blurb-id='" + blurbs.scoreContent1.id + "' data-text-en='" + blurbs.scoreContent1.en + "'>" + blurbs.scoreContent1.translation + "</p>" +
				"<p data-blurb-id='" + blurbs.scoreContent2.id + "' data-text-en='" + blurbs.scoreContent2.en + "'>" + blurbs.scoreContent2.translation + "</p>"
			});
		});
	}

	function switchLessonList($switchLabel, selTargetList) {
		$switchLabel = $($switchLabel);
		if (!$switchLabel.hasClass(CLS_SWITCHED)) {
			$switchLabel.addClass(CLS_SWITCHED);

			var $otherSwitchLabels = $switchLabel.siblings(SEL_LESSON_LIST_SWITCH);
			$otherSwitchLabels.removeClass(CLS_SWITCHED);

			var $lessonLists = $switchLabel.closest(SEL_UNIT_ITEM).find(SEL_LESSON_LIST);
			$lessonLists.removeClass(CLS_SWITCHED).removeClass(CLS_SHOW);

			var $switchedLessonList = $lessonLists.filter(selTargetList);
			$switchedLessonList.addClass(CLS_SWITCHED);
			(window.requestAnimationFrame || setTimeout)(function () {  //fade animation
				$switchedLessonList.addClass(CLS_SHOW);
			});
		}
	}

	return Widget.extend(function (path, $element, page, initData) {
		var me = this;
		me[PAGE] = page;
		me[CURRENT_ENROLLMENT] = initData.currentEnroll;
	}, {
		"sig/start": function () {
			var me = this;
			me[PROMISE_BLURBS] = initBlurbs.call(me);
		},
		"dom:.ets-pr-lesson-list-switch.to-new:not(.switched)/click": function (e) {
			switchLessonList(e.currentTarget, SEL_IS_NEW);
		},
		"dom:.ets-pr-lesson-list-switch.to-old:not(.switched)/click": function (e) {
			switchLessonList(e.currentTarget, SEL_IS_OLD);
		},
		"render": doRender
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/widget/shared/unit-list/e10-archive/notice.html',[],function() { return function template(data) { var o = "<p class=\"ets-pr-archive-unit-notice\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"684697\" data-text-en=\"These units are part of an outdated course structure. You will always be able to check your progress and access your feedback reports, but you can't open these outdated units.\"></p>"; return o; }; });
define('school-ui-progress-report/widget/shared/unit-list/e10-archive/main',[
	"when",
	"../base",
	"template!./notice.html"
], function (when, BaseWidget, tNotice) {
	"use strict";

	var $ELEMENT = "$element";
	var CONTEXT = "_context";
	var PAGE = "_page";
	var LEVEL = "_level";
	var SEL_NOTICE = ".ets-pr-archive-unit-notice";

	function renderArchiveUnits(context, level) {
		var me = this;
		var renderResult = me.render(context, level);
		renderResult && renderResult.then(function () {
			if (!me[$ELEMENT].find(SEL_NOTICE).length) {
				//if render was called many times, make sure add notice only once
				me.prepend(tNotice);
			}
		});
	}

	return BaseWidget.extend({
		"hub:memory/context": function (context) {
			var me = this;
			renderArchiveUnits.call(me, me[CONTEXT] = context, me[LEVEL]);
		},
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;
			if (me[PAGE] === page) {
				var level = data.level;
				var ArchiveE10Level = data.archiveLevel && data.archiveLevel.e10;

				if (ArchiveE10Level && ArchiveE10Level.children.length > level.children.length) {
					ArchiveE10Level.children = ArchiveE10Level.children.sort(function (prev, curr) {
						return (prev.unitNo || 0) - (curr.unitNo || 0);
					}).slice(level.children.length);

					ArchiveE10Level.children.forEach(function (archiveUnit) {
						archiveUnit.children && archiveUnit.children.length && archiveUnit.children.sort(function (prevLesson, currLesson) {
							return prevLesson.lessonNo - currLesson.lessonNo;
						});
					});

					renderArchiveUnits.call(me, me[CONTEXT], me[LEVEL] = ArchiveE10Level);
				}
				else {
					me[$ELEMENT].empty();
				}
			}
		}
	});
});
define('school-ui-progress-report/widget/shared/unit-list/normal/main',[
	"jquery",
	"when",
	"underscore",
	"../base",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/utils/progress-state"
], function ($, when, _, BaseWidget, typeidParser, progressState) {
	"use strict";

	var CONTEXT = "_context";
	var PAGE = "_page";
	var LEVEL = "_level";

	var LINK_TYPE_E13 = "e13";
	var LINK_TYPE_STUDYPLAN = "studyplan";
	var CCL_LESSON_LINK_TYPE = "ccl!'school.ui.progress.report.lesson.link.type'";

	function setActualLessonId(mergedLesson) {
		var progress = mergedLesson.progress;
		var progressItems = progress.detail.items;
		if (progressItems.length === 1) {
			mergedLesson.actualLessonId = 'student_lesson!' + progressItems[0].sourceProgressId;
		}
		else if (progressState.notStarted(progress.state)) {    //not started
			mergedLesson.actualLessonId = mergedLesson.id
		}
		else if (!progressState.hasPassed(progress.state)) {    //in progress
			var actualLessonProgress = progressItems.reduce(function (prev, curr) {
				return prev.startDate <= curr.startDate ? prev : curr;
			});
			mergedLesson.actualLessonId = 'student_lesson!' + actualLessonProgress.sourceProgressId;
		}
		else {  //finished
			var finishedLessonProgress = progressItems.filter(function (item) {
				return progressState.hasPassed(item.state);
			});

			if (finishedLessonProgress.length === 1) {
				actualLessonProgress = finishedLessonProgress[0];
			}
			else {
				actualLessonProgress = finishedLessonProgress.reduce(function (prev, curr) {
					return prev.completionDate <= curr.completionDate ? prev : curr;
				});
			}
			mergedLesson.actualLessonId = 'student_lesson!' + actualLessonProgress.sourceProgressId;
		}

		return mergedLesson.actualLessonId;
	}


	function getE13LessonLinks(level) {
		var me = this;
		var links = {};
		var course = level.parent;
		var units = level.children;
		var lessonMapPromises = [];

		units.filter(function (unit) {
			return !progressState.notStarted(unit.progress.state);
		}).forEach(function (unit) {
			unit.children.forEach(function (lesson) {
				lessonMapPromises.push(me.query("pc_student_lesson_map!" + lesson.templateLessonId).spread(function (lessonMap) {
					//url format: /school/studyunit#school/{studentCourseId}/{studentCourseId}/{studentLevelId}/{studentUnitId}/{pc-studentLessonId}
					var url = "/school/studyunit#school" +
						"/" + course.studentCourseId +
						"/" + course.studentCourseId +
						"/" + level.studentLevelId +
						"/" + unit.studentUnitId +
						"/" + typeidParser.parseId(lessonMap.lesson.id);
					links[lesson.studentLessonId] = url;
				}));
			});
		});

		return when.all(lessonMapPromises).then(function () {
			return links;
		});
	}

	function getStudyplanLessonLinks(level) {
		var me = this;
		var links = {};
		var units = level.children;

		var studyplansQ = units.filter(function (unit) {
			return !progressState.notStarted(unit.progress.state);
		}).map(function (unit) {
			return "student_unit_studyplan!" + unit.templateUnitId + ".studyPlan.items,.studentUnit";
		});
		return me.query(studyplansQ).then(function (unitStudyplans) {
			unitStudyplans && unitStudyplans.forEach(function (unitStudyplan) {
				var unit = unitStudyplan.studentUnit;
				var studyplan = unitStudyplan.studyPlan;

				unit.children.forEach(function (lesson) {
					var studyplanId = typeidParser.parseId(studyplan.id);
					var studyplanItemId = typeidParser.parseId(studyplan.items.filter(function (studyplanItem) {
						return studyplanItem.properties.templateLessonId === lesson.templateLessonId;
					})[0].id);

					//url format: /school/studyplan#study/{studyplannId}/{studyplanItemId}
					var url = "/school/studyplan#study" +
						"/" + studyplanId +
						"/" + studyplanItemId;
					links[lesson.studentLessonId] = url;
				});
			});

			return links;
		});
	}

	function getLessonLinks(level) {
		/* expected returned structure:
		{
			"lessonid_1_of_unit_1": "link url",
			"lessonid_2_of_unit_1": "link url",
			"lessonid_3_of_unit_1": "link url",
			"lessonid_4_of_unit_1": "link url",

			"lessonid_1_of_unit_2": "link url",
			"lessonid_2_of_unit_2": "link url",
			"lessonid_3_of_unit_2": "link url",
			"lessonid_4_of_unit_2": "link url"
		 }
		*/
		var me = this;
		return me.query(CCL_LESSON_LINK_TYPE).spread(function (cclLessonLinkType) {
			if (cclLessonLinkType.value === LINK_TYPE_E13) {
				return getE13LessonLinks.call(me, level);
			}
			else if (cclLessonLinkType.value === LINK_TYPE_STUDYPLAN) {
				return getStudyplanLessonLinks.call(me, level);
			}
			else {
				return {};
			}
		});
	}

	function hookArchiveUnit(units, archiveUnits) {
		archiveUnits && units.forEach(function (unit) {
			var archiveUnit = _.find(archiveUnits, function (archiveUnit) {
				return unit.unitNo === archiveUnit.unitNo
			});
			if (archiveUnit) {
				archiveUnit.children && archiveUnit.children.length && archiveUnit.children.sort(function (prevLesson, currLesson) {
					return prevLesson.lessonNo - currLesson.lessonNo;
				});
				unit.archiveUnit = archiveUnit;
			}
		});
	}

	return BaseWidget.extend({
		"hub:memory/context": function (context) {
			var me = this;
			me.render(me[CONTEXT] = context, me[LEVEL]);
		},
		"hub:memory/load/level": function onLevel(page, data) {
			var me = this;
			if (me[PAGE] === page) {
				var level = $.extend({}, data.level);
				level.children = $.extend([], level.children);

				var archiveLevel = data.archiveLevel && data.archiveLevel.e13;
				hookArchiveUnit(level.children, archiveLevel && archiveLevel.children);

				var actualLessonQueries = [];

				level.children.forEach(function (unit) {
					for (var lessonIndex = 0; lessonIndex < unit.children.length; lessonIndex++) {
						unit.children[lessonIndex] = $.extend({}, unit.children[lessonIndex]);
						var actualLessonId = setActualLessonId(unit.children[lessonIndex]);
						actualLessonId && actualLessonQueries.push(actualLessonId);
					}
				});

				var actualLessonQueriesPromise = actualLessonQueries.length ?
					me.query(actualLessonQueries) :
					when.resolve([]);

				when.all([
					actualLessonQueriesPromise,
					getLessonLinks.call(me, level)
				]).spread(function (actualLessons, lessonLinks) {
					level.children.forEach(function (unit) {
						unit.children.forEach(function (lesson) {
							//attach actualLesson Object
							if (lesson.actualLessonId) {
								lesson.actualLesson = actualLessons.filter(function (actualLesson) {
									return actualLesson.id === lesson.actualLessonId;
								});
								if (lesson.actualLesson.length) {
									lesson.actualLesson = lesson.actualLesson[0];
								}
							}

							//attach lesson link
							var lessonLink = lessonLinks[lesson.studentLessonId];
							if (lessonLink) {
								lesson.lessonLink = lessonLink;
							}
						});
					});

					me.render(me[CONTEXT], me[LEVEL] = level);
				});

			}
		}
	});
});

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_arrow_light_right.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"21px\" height=\"11px\" viewBox=\"0 0 21 11\" enable-background=\"new 0 0 21 11\" xml:space=\"preserve\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"#FFFFFF\" d=\"M19.853,5.522L15.669,10L14.78,9.067l2.659-2.879H1L0.995,4.75\n\th16.457L14.78,1.976l0.889-0.933L19.853,5.522L19.853,5.522L19.853,5.522z\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_cert.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"40px\" height=\"40px\" viewBox=\"0 0 40 40\" enable-background=\"new 0 0 40 40\" xml:space=\"preserve\">\n<path fill=\"#FFFFFF\" d=\"M29.629,13.332l2.873,1.933l-2.875,1.934l1.922,2.895l-3.387,0.678l0.676,3.418l-2.08-0.42l4.576,7.998\n\tl-5.256-1.418l-1.406,5.301l-4.549-7.949L20,27.887l-0.049-0.074l-4.483,7.84L14.06,30.35l-5.255,1.42l4.594-8.035l-2.24,0.451\n\tl0.677-3.418l-3.387-0.675l1.921-2.896l-2.871-1.932l2.872-1.933l-1.922-2.895l3.388-0.677L11.16,6.341l3.386,0.684l0.671-3.419\n\tl2.869,1.94L20,2.646l1.915,2.899l2.869-1.938l0.67,3.418l3.385-0.684L28.163,9.76l3.389,0.677L29.629,13.332z M24.344,33.137\n\tl1.055-3.977l3.943,1.061l-3.838-6.709l-0.049-0.01l-0.672,3.42l-2.867-1.939l-1.197,1.814L24.344,33.137z M10.798,30.225\n\tl3.942-1.062l1.055,3.977l3.562-6.227l-1.272-1.928l-2.87,1.939l-0.645-3.295L10.798,30.225z M20,8.47\n\tc-3.717,0-6.731,3.043-6.731,6.795c0,3.752,3.015,6.793,6.731,6.793c3.715,0,6.73-3.042,6.73-6.793\n\tC26.73,11.513,23.717,8.47,20,8.47z M20,20.119c-2.656,0-4.808-2.173-4.808-4.854s2.15-4.854,4.808-4.854s4.809,2.172,4.809,4.854\n\tC24.809,17.946,22.657,20.119,20,20.119z\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_checkmark.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"32px\" height=\"32px\" viewBox=\"0 0 32 32\" enable-background=\"new 0 0 32 32\" xml:space=\"preserve\">\n<circle fill=\"#74D17F\" cx=\"16\" cy=\"16\" r=\"15\"/>\n<path fill=\"#FFFFFF\" d=\"M15.11,21.63l-1.555,1.578L8.11,17.54l1.555-1.579l3.891,4.09l9.783-10.266l1.551,1.579L15.11,21.63z\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_circle_black.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t viewBox=\"0 0 32 32\" style=\"enable-background:new 0 0 32 32;\" xml:space=\"preserve\" width=\"32\" height=\"32\">\n<path style=\"fill:#FFFFFF;stroke:#000000;stroke-width:0.6px;\" d=\"M16,26.5c-5.8,0-10.5-4.7-10.5-10.5S10.2,5.5,16,5.5S26.5,10.2,26.5,16S21.8,26.5,16,26.5z\"/>\n<path d=\"M16,16L16,16L16,16L16,16L16,16L16,16z\"\n\t\tdata-d-origin=\"M16,16L16,16L16,16L16,16L16,16L16,16z\"\n\t\tdata-d-select=\"M16,11c-2.8,0-5,2.2-5,5c0,2.8,2.2,5,5,5s5-2.2,5-5C21,13.2,18.8,11,16,11L16,11z\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_circle_blue.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t viewBox=\"0 0 32 32\" style=\"enable-background:new 0 0 32 32;\" xml:space=\"preserve\" width=\"32\" height=\"32\">\n<path id=\"XMLID_2_\" style=\"fill:#0078FF;\" d=\"M16,5C9.9,5,5,9.9,5,16s4.9,11,11,11s11-4.9,11-11S22.1,5,16,5L16,5z\"/>\n<path id=\"XMLID_3_\" style=\"fill:#FFFFFF;\" d=\"M16,16L16,16L16,16L16,16L16,16L16,16z\"\n\t\tdata-d-origin=\"M16,16L16,16L16,16L16,16L16,16L16,16z\"\n\t\tdata-d-select=\"M16,11c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S18.8,11,16,11L16,11z\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_circle_gray.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t viewBox=\"0 0 32 32\" style=\"enable-background:new 0 0 32 32;\" xml:space=\"preserve\" width=\"32\" height=\"32\">\n\t<path style=\"fill:#FFFFFF;stroke:#808080;stroke-width:0.6px;\" d=\"M16,26.5c-5.8,0-10.5-4.7-10.5-10.5S10.2,5.5,16,5.5S26.5,10.2,26.5,16\n\t\tS21.8,26.5,16,26.5z\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_circle_green.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t viewBox=\"0 0 32 32\" style=\"enable-background:new 0 0 32 32;\" xml:space=\"preserve\" width=\"32\" height=\"32\">\n<path id=\"XMLID_2_\" style=\"fill:#74D17F;\" d=\"M16,5C9.9,5,5,9.9,5,16s4.9,11,11,11s11-4.9,11-11S22.1,5,16,5L16,5z\"/>\n<path style=\"fill:#FFFFFF;\" d=\"M15,19.7l-1.1,1.1L10,16.7l1.1-1.1l2.8,2.9l7-7.4l1.1,1.1L15,19.7z\"\n\tdata-d-origin=\"M15,19.7l-1.1,1.1L10,16.7l1.1-1.1l2.8,2.9l7-7.4l1.1,1.1L15,19.7z\"\n\tdata-d-select=\"M16,11c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S18.8,11,16,11L16,11z\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_close.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"30px\" height=\"30px\"\n\t viewBox=\"0 0 30 30\" enable-background=\"new 0 0 30 30\" xml:space=\"preserve\">\n<g>\n\t<line fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" x1=\"21\" y1=\"9\" x2=\"9\" y2=\"21\"/>\n\t<line fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" x1=\"21\" y1=\"21\" x2=\"9\" y2=\"9\"/>\n</g>\n<circle fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"15\" r=\"14\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_confirmation.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"102px\" height=\"94px\"\n\t viewBox=\"0 0 102 94\" enable-background=\"new 0 0 102 94\" xml:space=\"preserve\">\n<polyline fill=\"none\" stroke=\"#74D17F\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\n\t29,40.1 47.4,58.5 100,6 \"/>\n<path fill=\"none\" stroke=\"#74D17F\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\n\tM90.4,35c1.1,3.8,1.6,7.8,1.6,12c0,24.9-20.1,45-45,45S2,71.9,2,47S22.1,2,47,2c10.1,0,19.5,3.3,27,9\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_dot_3.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"12px\" height=\"4px\" viewBox=\"0 0 12 4\" enable-background=\"new 0 0 12 4\" xml:space=\"preserve\">\n<rect x=\"1\" y=\"1\" width=\"2\" height=\"2\"/>\n<rect x=\"5\" y=\"1\" width=\"2\" height=\"2\"/>\n<rect x=\"9\" y=\"1\" width=\"2\" height=\"2\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_flag.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"20px\" height=\"200px\" viewBox=\"0 0 20 200\" enable-background=\"new 0 0 20 200\" xml:space=\"preserve\">\n<path fill=\"#FFFFFF\" fill-opacity=\"0.6\" d=\"M11.257,3.146C8.778,1.961,6.271,1.855,5,2.023v10.135\n\tc1.271-0.359,3.778-0.476,6.257,0.707C15.609,14.945,19,13.641,19,13.641V3.229C19,3.229,15.605,5.23,11.257,3.146z M1,200h2.028\n\tL3.038,1H1V200z\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_medal.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"32px\" height=\"40px\"\r\n\t viewBox=\"0 0 32 40\" enable-background=\"new 0 0 32 40\" xml:space=\"preserve\">\r\n<polygon id=\"XMLID_4_\" fill=\"none\" stroke=\"#C9B188\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t26,17 29,15 26,13 28,10 24.5,9.3 25.2,5.8 21.7,6.5 21,3 18,5 16,2 14,5 11,3 10.3,6.5 6.8,5.8 7.5,9.3 4,10 6,13 3,15 6,17 4,20 \r\n\t7.5,20.7 6.8,24.2 9.1,23.7 4.4,32 9.8,30.5 11.3,36 15.9,27.9 16,28 16.1,27.8 20.9,36 22.3,30.5 27.8,32 23,23.8 25.2,24.2 \r\n\t24.5,20.7 28,20 \"/>\r\n<circle id=\"XMLID_3_\" fill=\"none\" stroke=\"#C9B188\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" cx=\"16\" cy=\"15\" r=\"5\"/>\r\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_mobilephone.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"20px\" height=\"22px\"\r\n\t viewBox=\"0 0 20 22\" enable-background=\"new 0 0 20 22\" xml:space=\"preserve\">\r\n<path fill=\"#FFFFFF\" d=\"M6,20.5c-0.8,0-1.5-0.7-1.5-1.5V3c0-0.8,0.7-1.5,1.5-1.5h8c0.8,0,1.5,0.7,1.5,1.5v16c0,0.8-0.7,1.5-1.5,1.5\r\n\tH6z\"/>\r\n<path fill=\"#222222\" d=\"M14,2c0.6,0,1,0.4,1,1v16c0,0.6-0.4,1-1,1H6c-0.6,0-1-0.4-1-1V3c0-0.6,0.4-1,1-1H14 M14,1H6\r\n\tC4.9,1,4,1.9,4,3v16c0,1.1,0.9,2,2,2h8c1.1,0,2-0.9,2-2V3C16,1.9,15.1,1,14,1L14,1z\"/>\r\n<circle fill=\"#222222\" cx=\"10\" cy=\"17\" r=\"1\"/>\r\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_pc.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 18.1.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"44px\" height=\"29px\"\r\n\t viewBox=\"0 0 44 29\" enable-background=\"new 0 0 44 29\" xml:space=\"preserve\">\r\n<path fill=\"#FFFFFF\" d=\"M3,23.5c-0.8,0-1.5-0.7-1.5-1.5V3c0-0.8,0.7-1.5,1.5-1.5h24c0.8,0,1.5,0.7,1.5,1.5v19\r\n\tc0,0.8-0.7,1.5-1.5,1.5H3z\"/>\r\n<path fill=\"#222222\" d=\"M27,2c0.6,0,1,0.4,1,1v19c0,0.6-0.4,1-1,1H3c-0.6,0-1-0.4-1-1V3c0-0.6,0.4-1,1-1H27 M27,1H3\r\n\tC1.9,1,1,1.9,1,3v19c0,1.1,0.9,2,2,2h24c1.1,0,2-0.9,2-2V3C29,1.9,28.1,1,27,1L27,1z\"/>\r\n<line fill=\"none\" stroke=\"#222222\" stroke-miterlimit=\"10\" x1=\"15\" y1=\"24\" x2=\"15\" y2=\"28\"/>\r\n<line fill=\"none\" stroke=\"#222222\" stroke-miterlimit=\"10\" x1=\"11\" y1=\"27.5\" x2=\"19\" y2=\"27.5\"/>\r\n<path fill=\"#FFFFFF\" d=\"M27,27.5c-0.8,0-1.5-0.7-1.5-1.5V15c0-0.8,0.7-1.5,1.5-1.5h14c0.8,0,1.5,0.7,1.5,1.5v11\r\n\tc0,0.8-0.7,1.5-1.5,1.5H27z\"/>\r\n<path fill=\"#222222\" d=\"M41,14c0.6,0,1,0.4,1,1v11c0,0.6-0.4,1-1,1H27c-0.6,0-1-0.4-1-1V15c0-0.6,0.4-1,1-1H41 M41,13H27\r\n\tc-1.1,0-2,0.9-2,2v11c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V15C43,13.9,42.1,13,41,13L41,13z\"/>\r\n<circle fill=\"#111111\" cx=\"39.4\" cy=\"20.5\" r=\"1\"/>\r\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_point_black.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"32px\" height=\"32px\" viewBox=\"0 0 32 32\" enable-background=\"new 0 0 32 32\" xml:space=\"preserve\">\n<circle fill=\"#000000\"  cx=\"16\" cy=\"16\" r=\"4\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_point_green.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"32px\" height=\"32px\" viewBox=\"0 0 32 32\" enable-background=\"new 0 0 32 32\" xml:space=\"preserve\">\n<circle fill=\"#00C950\" cx=\"16\" cy=\"16\" r=\"4\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_progress_flag.svg',[],function() { return function template(data) { var o = "<svg class=\"icon\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><defs><style/></defs><path d=\"M121.522 927.927a15.088 15.088 0 0 1-15.083-15.083V83.76c0-8.326 6.757-15.083 15.083-15.083s15.083 6.757 15.083 15.083v829.083a15.049 15.049 0 0 1-15.083 15.083z\"/><path d=\"M812.445 513.386H121.522a15.088 15.088 0 0 1-15.083-15.083V83.759a15.088 15.088 0 0 1 15.083-15.083h690.893a15.079 15.079 0 0 1 13.576 8.506 15.106 15.106 0 0 1-1.752 15.928L667.557 291.03 824.24 488.949a15.042 15.042 0 0 1 1.752 15.928 15.033 15.033 0 0 1-13.546 8.506zm-675.84-30.167h644.648L636.519 300.383a15.095 15.095 0 0 1 0-18.734L781.253 98.842H136.605v384.375z\"/><path d=\"M116.439 88.413H625.68v397.346H116.439z\"/><path d=\"M611.98 90.697h168.985v34.254H611.98z\"/><path d=\"M595.994 108.965h155.284v59.374H595.994z\"/><path d=\"M559.456 127.234h123.315V239.13H559.456z\"/><path d=\"M513.784 147.787h210.091v47.955h-210.09z\"/><path d=\"M486.381 159.205H669.07v89.06H486.381z\"/><path d=\"M616.546 234.563h22.836v107.33h-22.836zm54.807-66.224h27.403v52.523h-27.403z\"/><path d=\"M607.412 184.324h45.672v139.3h-45.672zm-4.567 210.09H707.89v43.39H602.845z\"/><path d=\"M595.994 307.638h66.224v187.255h-66.224z\"/><path d=\"M646.233 417.25h107.329v82.21H646.233zm-4.567-77.641h52.523v77.642h-52.523z\"/><path d=\"M671.353 373.863h54.806v66.224h-54.806z\"/><path d=\"M673.636 424.102h31.97v4.567h-31.97zm-18.269-43.389h31.97v25.12h-31.97zM739.972 464.74a13.702 14.843 82.967 1 0 29.464-3.635 13.702 14.843 82.967 1 0-29.464 3.635z\"/><path d=\"M748.995 467.49h47.955v29.687h-47.955zm-158.71-253.48h79.926v41.106h-79.926zM720.45 106.683h38.821v50.239H720.45zm-36.538 84.493h34.254v9.134h-34.254z\"/><path d=\"M615.404 227.712h41.105v36.538h-41.105z\"/></svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_progress.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 18.1.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"20px\" height=\"20px\"\r\n\t viewBox=\"0 0 20 20\" enable-background=\"new 0 0 20 20\" xml:space=\"preserve\">\r\n<polygon fill=\"#4B4A48\" points=\"0.4,15.8 -0.4,15.2 6,7.8 11,12.3 17.6,4.7 18.4,5.3 11,13.7 6,9.2 \"/>\r\n<polygon fill=\"#4B4A48\" points=\"20,20 0,20 0,0 1,0 1,19 20,19 \"/>\r\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_spin_next_page.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"11px\" height=\"21px\" viewBox=\"0 0 11 21\" xml:space=\"preserve\">\n<path stroke=\"#157cfb\" stroke-width=\"1\" fill=\"none\" d=\"M0,0L11,10.5L0,21\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_spin_previous_page.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"11px\" height=\"21px\" viewBox=\"0 0 11 21\" xml:space=\"preserve\">\n<path stroke=\"#157cfb\" stroke-width=\"1\" fill=\"none\" d=\"M11,0L0,10.5L11,21\"/>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_survey_rating1.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"30px\" height=\"30px\" viewBox=\"0 0 30 30\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n\t xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n\t<g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n\t\t<g transform=\"translate(-431.000000, -231.000000)\">\n\t\t\t<g transform=\"translate(364.000000, 76.000000)\">\n\t\t\t\t<g transform=\"translate(60.000000, 150.000000)\">\n\t\t\t\t\t<g transform=\"translate(7.000000, 5.000000)\">\n\t\t\t\t\t\t<circle class=\"ets-pr-fb-survey-icon-background\" cx=\"15\" cy=\"15\" r=\"15\"/>\n\t\t\t\t\t\t<path class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  d=\"M10.6929508,20.4193492 L9.29089089,19.2278481 L8.73417722,20.0278992 L10.1362371,21.2194003 C11.553368,22.4235126 13.2509108,23.0253165 14.9493671,23.0253165 C16.6478233,23.0253165 18.3458229,22.4235126 19.7624971,21.2194003 L21.164557,20.0278992 L20.6078433,19.2278481 L19.2062401,20.4193492 C16.6998868,22.549624 13.1997608,22.5486151 10.6929508,20.4193492 Z\"\n\t\t\t\t\t\t\t  transform=\"translate(14.949367, 21.126582) scale(-1, -1) translate(-14.949367, -21.126582) \"/>\n\t\t\t\t\t\t<path class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  d=\"M9.21518987,14.2721519 C9.21518987,13.5765528 9.78266262,13.0126582 10.478689,13.0126582 L10.5086528,13.0126582 C11.2064641,13.0126582 11.7721519,13.5717032 11.7721519,14.2721519 L11.7721519,14.2721519 C11.7721519,14.967751 11.2046792,15.5316456 10.5086528,15.5316456 L10.478689,15.5316456 C9.7808777,15.5316456 9.21518987,14.9726006 9.21518987,14.2721519 L9.21518987,14.2721519 Z\"\n\t\t\t\t\t\t\t  transform=\"translate(10.493671, 14.272152) scale(-1, -1) translate(-10.493671, -14.272152) \"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  x=\"18.2278481\" y=\"13.0126582\" width=\"2.55696203\" height=\"2.51898734\"\n\t\t\t\t\t\t\t  rx=\"1.25949367\"/>\n\t\t\t\t\t\t<path class=\"ets-pr-fb-survey-icon-stroke\"\n\t\t\t\t\t\t\t  d=\"M8,9 L12.5,11.5\" stroke-linecap=\"round\"/>\n\t\t\t\t\t\t<path class=\"ets-pr-fb-survey-icon-stroke\"\n\t\t\t\t\t\t\t  d=\"M18,9 L22.5,11.5\" stroke-linecap=\"round\"\n\t\t\t\t\t\t\t  transform=\"translate(20.250000, 10.250000) scale(-1, 1) translate(-20.250000, -10.250000) \"/>\n\t\t\t\t\t</g>\n\t\t\t\t</g>\n\t\t\t</g>\n\t\t</g>\n\t</g>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_survey_rating2.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"30px\" height=\"30px\" viewBox=\"0 0 30 30\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n\t xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n\t<g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n\t\t<g transform=\"translate(-568.000000, -231.000000)\">\n\t\t\t<g transform=\"translate(364.000000, 76.000000)\">\n\t\t\t\t<g transform=\"translate(60.000000, 150.000000)\">\n\t\t\t\t\t<g transform=\"translate(144.000000, 5.000000)\">\n\t\t\t\t\t\t<circle class=\"ets-pr-fb-survey-icon-background\" cx=\"15\" cy=\"15\" r=\"15\"/>\n\t\t\t\t\t\t<path d=\"M19.8715667,19.4193492 C17.1150886,21.549624 13.2656628,21.5486151 10.5086824,19.4193492 L8.96670204,18.2278481 L8.35443038,19.0278992 L9.8964107,20.2194003 C11.454966,21.4235126 13.3219175,22.0253165 15.1898734,22.0253165 C17.0578294,22.0253165 18.9252831,21.4235126 20.4833361,20.2194003 L22.0253165,19.0278992 L21.4130448,18.2278481 L19.8715667,19.4193492 L19.8715667,19.4193492 Z\"\n\t\t\t\t\t\t\t  class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  transform=\"translate(15.189873, 20.126582) scale(-1, -1) translate(-15.189873, -20.126582) \"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  transform=\"translate(9.493671, 11.772152) scale(-1, -1) translate(-9.493671, -11.772152) \"\n\t\t\t\t\t\t\t  x=\"7.21518987\" y=\"11.0126582\" width=\"4.55696203\" height=\"1.51898734\"\n\t\t\t\t\t\t\t  rx=\"0.759493671\"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  x=\"18.2278481\" y=\"11.0126582\" width=\"4.55696203\" height=\"1.51898734\"\n\t\t\t\t\t\t\t  rx=\"0.759493671\"/>\n\t\t\t\t\t</g>\n\t\t\t\t</g>\n\t\t\t</g>\n\t\t</g>\n\t</g>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_survey_rating3.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"30px\" height=\"30px\" viewBox=\"0 0 30 30\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n\t xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n\t<g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n\t\t<g transform=\"translate(-705.000000, -231.000000)\">\n\t\t\t<g transform=\"translate(364.000000, 76.000000)\">\n\t\t\t\t<g transform=\"translate(60.000000, 150.000000)\">\n\t\t\t\t\t<g transform=\"translate(281.000000, 5.000000)\">\n\t\t\t\t\t\t<circle class=\"ets-pr-fb-survey-icon-background\" cx=\"15\" cy=\"15\" r=\"15\"/>\n\t\t\t\t\t\t<path class=\"ets-pr-fb-survey-icon-stroke\"\n\t\t\t\t\t\t\t  d=\"M11,20 L19,20\" stroke-linecap=\"square\"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  transform=\"translate(9.873418, 11.772152) scale(-1, -1) rotate(90.000000) translate(-9.873418, -11.772152) \"\n\t\t\t\t\t\t\t  x=\"7.59493671\" y=\"11.0126582\" width=\"4.55696203\" height=\"1.51898734\"\n\t\t\t\t\t\t\t  rx=\"0.759493671\"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  transform=\"translate(20.126582, 11.772152) rotate(90.000000) translate(-20.126582, -11.772152) \"\n\t\t\t\t\t\t\t  x=\"17.8481013\" y=\"11.0126582\" width=\"4.55696203\" height=\"1.51898734\"\n\t\t\t\t\t\t\t  rx=\"0.759493671\"/>\n\t\t\t\t\t</g>\n\t\t\t\t</g>\n\t\t\t</g>\n\t\t</g>\n\t</g>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_survey_rating4.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"30px\" height=\"30px\" viewBox=\"0 0 30 30\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n\t xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n\t<g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n\t\t<g transform=\"translate(-842.000000, -231.000000)\">\n\t\t\t<g transform=\"translate(364.000000, 76.000000)\">\n\t\t\t\t<g transform=\"translate(60.000000, 150.000000)\">\n\t\t\t\t\t<g transform=\"translate(418.000000, 5.000000)\">\n\t\t\t\t\t\t<circle class=\"ets-pr-fb-survey-icon-background\" cx=\"15\" cy=\"15\" r=\"15\"/>\n\t\t\t\t\t\t<path class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  d=\"M10.5086824,19.4193492 L8.96670204,18.2278481 L8.35443038,19.0278992 L9.8964107,20.2194003 C11.454966,21.4235126 13.3219175,22.0253165 15.1898734,22.0253165 C17.0578294,22.0253165 18.9252831,21.4235126 20.4833361,20.2194003 L22.0253165,19.0278992 L21.4130448,18.2278481 L19.8715667,19.4193492 C17.1150886,21.549624 13.2656628,21.5486151 10.5086824,19.4193492 Z\"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  transform=\"translate(9.873418, 11.772152) scale(-1, -1) rotate(90.000000) translate(-9.873418, -11.772152) \"\n\t\t\t\t\t\t\t  x=\"7.59493671\" y=\"11.0126582\" width=\"4.55696203\" height=\"1.51898734\"\n\t\t\t\t\t\t\t  rx=\"0.759493671\"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  transform=\"translate(20.126582, 11.772152) rotate(90.000000) translate(-20.126582, -11.772152) \"\n\t\t\t\t\t\t\t  x=\"17.8481013\" y=\"11.0126582\" width=\"4.55696203\" height=\"1.51898734\"\n\t\t\t\t\t\t\t  rx=\"0.759493671\"/>\n\t\t\t\t\t</g>\n\t\t\t\t</g>\n\t\t\t</g>\n\t\t</g>\n\t</g>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_survey_rating5.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"30px\" height=\"30px\" viewBox=\"0 0 30 30\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n\t xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n\t<g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n\t\t<g transform=\"translate(-979.000000, -231.000000)\">\n\t\t\t<g transform=\"translate(364.000000, 76.000000)\">\n\t\t\t\t<g transform=\"translate(60.000000, 150.000000)\">\n\t\t\t\t\t<g transform=\"translate(555.000000, 5.000000)\">\n\t\t\t\t\t\t<circle class=\"ets-pr-fb-survey-icon-background\" cx=\"15\" cy=\"15\" r=\"15\"/>\n\t\t\t\t\t\t<path class=\"ets-pr-fb-survey-icon-stroke\"\n\t\t\t\t\t\t\t  d=\"M10,18 L19.5131488,18\" stroke-linecap=\"round\"/>\n\t\t\t\t\t\t<path class=\"ets-pr-fb-survey-icon-stroke\"\n\t\t\t\t\t\t\t  d=\"M10,18 C10,18 10,23 15,23 C20,23 20,18 20,18\" stroke-linecap=\"round\"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  transform=\"translate(9.873418, 11.772152) scale(-1, -1) rotate(90.000000) translate(-9.873418, -11.772152) \"\n\t\t\t\t\t\t\t  x=\"7.59493671\" y=\"11.0126582\" width=\"4.55696203\" height=\"1.51898734\"\n\t\t\t\t\t\t\t  rx=\"0.759493671\"/>\n\t\t\t\t\t\t<rect class=\"ets-pr-fb-survey-icon-fill\"\n\t\t\t\t\t\t\t  transform=\"translate(20.126582, 11.772152) rotate(90.000000) translate(-20.126582, -11.772152) \"\n\t\t\t\t\t\t\t  x=\"17.8481013\" y=\"11.0126582\" width=\"4.55696203\" height=\"1.51898734\"\n\t\t\t\t\t\t\t  rx=\"0.759493671\"/>\n\t\t\t\t\t</g>\n\t\t\t\t</g>\n\t\t\t</g>\n\t\t</g>\n\t</g>\n</svg>"; return o; }; });

define('troopjs-requirejs/template!school-ui-progress-report/vector/ico_teacher.svg',[],function() { return function template(data) { var o = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"22px\" height=\"15px\" viewBox=\"0 0 22 15\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <g stroke=\"none\" stroke-width=\"1\" fill=\"#cccccc\" fill-rule=\"evenodd\">\n\t\t<path d=\"M5.01598762,6.12030075 C5.01598762,4.128486 6.14086762,2.52593985 7.49350909,2.52593985 C8.84584215,2.52593985 9.97045359,4.12846775 9.97045359,6.12030075 C9.97045359,8.49849539 9.06487873,9.82894737 7.49350909,9.82894737 C5.92181211,9.82894737 5.01598762,8.49844988 5.01598762,6.12030075 L5.01598762,6.12030075 Z M4.71598762,6.12030075 C4.71598762,8.64512938 5.72619522,10.1289474 7.49350909,10.1289474 C9.26051615,10.1289474 10.2704536,8.64516803 10.2704536,6.12030075 C10.2704536,3.98086927 9.03889082,2.22593985 7.49350909,2.22593985 C5.94783814,2.22593985 4.71598762,3.98088019 4.71598762,6.12030075 L4.71598762,6.12030075 Z M13.8211393,14.15 C14.0043298,14.15 14.15,13.9964483 14.15,13.8105263 C14.15,11.957019 13.3106615,11.0201763 11.7414359,10.5214775 C11.4796913,10.4382952 11.2703819,10.3843573 10.8226397,10.2781128 C10.739901,10.2582835 10.739901,10.2582835 10.6581661,10.2385631 C10.2427304,10.1379508 10.0071753,10.0695409 9.8050177,9.98252273 C9.65093787,9.9160872 9.54721502,9.79645528 9.48311303,9.60623407 C9.47346024,9.58154078 9.47346024,9.58154078 9.46657394,9.57024922 C9.46633873,9.56985188 9.46633873,9.56985188 9.4662194,9.56965029 C9.46848721,9.57321326 9.46848721,9.57321326 9.47595513,9.59135768 L9.33375497,9.63909774 L9.43761369,9.74732605 C10.216497,8.99988917 10.6310598,7.74196667 10.6310598,6.12030075 C10.6310598,3.77474139 9.23582606,1.85 7.49350909,1.85 C5.75109353,1.85 4.35538135,3.77488805 4.35538135,6.12030075 C4.35538135,7.74898352 4.77389784,9.01275215 5.55941035,9.75982028 L5.66278321,9.65112782 L5.66278321,9.50112782 C5.63256355,9.50038848 5.63256355,9.50038848 5.56325388,9.53826825 C5.52085038,9.59092217 5.52085038,9.59092217 5.51316167,9.62587431 C5.45424635,9.79428344 5.35013582,9.91288783 5.19190689,9.98323718 C4.99136734,10.0695473 4.75593507,10.1379602 4.34082091,10.2385691 C4.25914702,10.2582894 4.25914702,10.2582894 4.17613076,10.2781996 C1.83903666,10.8280512 0.85,11.5753215 0.85,13.8105263 C0.85,13.9968588 0.996087865,14.15 1.18030313,14.15 C1.3645184,14.15 1.51060626,13.9968588 1.51060626,13.8105263 C1.51060626,12.1258365 2.22764311,11.467775 3.88991893,11.04057 C4.01082315,11.0094976 4.10642747,10.9862456 4.32586061,10.9338717 C4.87503274,10.8071934 5.17030193,10.7244836 5.45057349,10.6039656 C5.73485781,10.4820295 5.95264098,10.2553359 6.08812681,9.94947278 L5.86452853,10.0113032 C6.32663408,10.3372058 6.87619096,10.5048872 7.49350909,10.5048872 C8.11492537,10.5048872 8.6680401,10.3348171 9.13317387,10.0050769 L8.90852145,9.941723 C9.04197409,10.25356 9.25667987,10.4784333 9.54821429,10.6039405 C9.82493088,10.7229299 10.095834,10.7993494 10.673039,10.9368919 C12.7654837,11.4312129 13.4905477,11.9784914 13.4905477,13.8105263 C13.4905477,13.9968715 13.6369463,14.15 13.8211393,14.15 L13.8211393,14.15 Z M13.8211393,13.85 C13.8057229,13.85 13.7905477,13.8341272 13.7905477,13.8105263 C13.7905477,11.7988545 12.95412,11.1675187 10.7422959,10.6449957 C10.1825445,10.5116119 9.92202921,10.4381227 9.66678191,10.3283653 C9.44824436,10.2342836 9.28839352,10.0668629 9.18432634,9.82369053 L9.11123296,9.65289422 L8.95967392,9.76033666 C8.54613662,10.0534994 8.05378184,10.2048872 7.49350909,10.2048872 C6.93699414,10.2048872 6.44797025,10.0556757 6.03743095,9.76614045 L5.8879266,9.66070164 L5.81383267,9.82797083 C5.70797925,10.066938 5.54427009,10.2373451 5.33218996,10.3283112 C5.0735766,10.439516 4.79041197,10.5188352 4.25732054,10.6418084 C4.03509507,10.6948444 3.93838358,10.7183657 3.81524554,10.7500122 C2.03477803,11.2075923 1.21060626,11.9639771 1.21060626,13.8105263 C1.21060626,13.8342549 1.19558635,13.85 1.18030313,13.85 C1.16501992,13.85 1.15,13.8342549 1.15,13.8105263 C1.15,11.7548908 2.02748139,11.0919065 4.2454795,10.5700734 C4.32919709,10.5499966 4.32919709,10.5499966 4.41148447,10.5301281 C4.84250435,10.4256642 5.08969678,10.353834 5.31215215,10.2580788 C5.55046923,10.1521334 5.71191809,9.96820829 5.80245777,9.70251911 C5.80110998,9.71358911 5.80110998,9.71358911 5.76000467,9.76473927 C5.69199318,9.80186716 5.69199318,9.80186716 5.66278321,9.80112782 L6.03816094,9.80112782 L5.76615608,9.54243536 C5.04804303,8.85946805 4.65538135,7.6737716 4.65538135,6.12030075 C4.65538135,3.92360243 5.94139822,2.15 7.49350909,2.15 C9.04549909,2.15 10.3310598,3.92344615 10.3310598,6.12030075 C10.3310598,7.66715974 9.94208751,8.84743197 9.22989624,9.53086944 L9.1915548,9.68683781 C9.20207446,9.71256316 9.20207446,9.71256316 9.20799006,9.72235132 C9.2082355,9.72276603 9.2082355,9.72276603 9.20836447,9.72298386 C9.20544484,9.71845922 9.20544484,9.71845922 9.1968168,9.69561657 C9.28913343,9.97003625 9.45078904,10.1564867 9.68632073,10.2580423 C9.90887004,10.353838 10.15619,10.4256647 10.587552,10.5301341 C10.6699003,10.5500025 10.6699003,10.5500025 10.7530366,10.5699265 C11.1939485,10.6745508 11.3982466,10.7271973 11.6505742,10.8073868 C13.1048719,11.2695617 13.85,12.1012497 13.85,13.8105263 C13.85,13.834195 13.8350062,13.85 13.8211393,13.85 L13.8211393,13.85 Z\"></path>\n\t\t<path d=\"M9,1.3 L21,1.3 L20.7,1 L20.7,10 L21,9.7 L9.35285501,9.7 L9.35285501,10.3 L21,10.3 L21.3,10.3 L21.3,10 L21.3,1 L21.3,0.7 L21,0.7 L9,0.7 L9,1.3 L9,1.3 Z\"></path>\n\t\t<path d=\"M9,1 L9,3 L9,3.3 L9.6,3.3 L9.6,3 L9.6,1 L9.6,0.7 L9,0.7 L9,1 L9,1 Z\"></path>\n\t\t<path d=\"M14.2910428,14.0727607 L16.2910428,6.07276069 L16.3638034,5.78171794 L15.7817179,5.63619656 L15.7089572,5.92723931 L13.7089572,13.9272393 L13.6361966,14.2182821 L14.2182821,14.3638034 L14.2910428,14.0727607 L14.2910428,14.0727607 Z\"></path>\n    </g>\n</svg>"; return o; }; });

//# sourceMappingURL=app-built.js.map
