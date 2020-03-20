define([
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
