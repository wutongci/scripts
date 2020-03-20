define([
	"school-ui-studyplan/module",
	"jquery",
	"when",
	"moment",
	"poly",
	"lodash",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/moment-language",
	"template!./pace-config.html",
	"school-ui-studyplan/utils/widget-creator",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/enum/course-type"
], function(module, $, when, Moment, Poly, _, Widget, momentLang, tPaceConfig, widgetCreator, typeidParser, CourseType){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var UNDEF;

	var MODULE_CONFIG = _.merge({
		changeCourseUrl: "/school/changecourse",
		certUrl: "/school/course/CertificateBoard.aspx?key=",
		levelTestPath: "/school/content/leveltest.aspx",
		blurbIds: {
			cpNextUnit: "695095",
			cpCourseChange: "656560",
		}
	}, module.config() || {});

	var $ELEMENT = "$element";

	var CULTURE_CODE = "_culture_code",
		STATUS = "_status";

	var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

	function convertToLegacyItem(certItem) {
		return {
			"date": Moment(certItem.certificateDate).lang("en").format("MMM DD, YYYY"),
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

	function render(){
		var me = this;

		return when.all([
			me.dfdResults.promise,
			me.levelTestVersionPromise,
			me.certPromise,
		]).spread(function (results, levelTestVersion, certficate) {
			var studentCert = certficate[0];
			var studentArchiveCert = certficate[1];
			var certItems = $.extend(true, [], studentCert.items);
			var archiveCertItems = $.extend(true, [], studentArchiveCert.items);
			var levelTestId = levelTestVersion === 1 ? results.level.legacyLevelId : results.level.templateLevelId;
			initCertificateData.call(me, certItems, archiveCertItems);

			return me.html(tPaceConfig, {
				isLastLevel: isLastLevel(results),
				status: me[STATUS],
				levelTestPath: MODULE_CONFIG.levelTestPath,
				levelTestId: levelTestId,
				certUrl: MODULE_CONFIG.certUrl + results.course.courseTypeCode + '_' + results.level.levelCode,
				blurbIds: MODULE_CONFIG.blurbIds
			});
		});
	}

	function isLastLevel(data){
		var isGE = CourseType.isGECourse((data.course || {}).courseTypeCode);
		var level = data.level;
		var levels = data.course.children;
		var levelLen = data.course.children.length;
		var isLastLevel = false;
		if(isGE) {
			if(level.templateLevelId === levels[levelLen-1].templateLevelId) {
				isLastLevel = true;
			}
		} else {
			// For SPIN course, alway let student select course
			isLastLevel = true;
		}

		return	isLastLevel;
	}

	return Widget.extend(function(){
		var me = this;

		me[STATUS] = me[$ELEMENT].data("status");
		me.dfdResults = when.defer();

		me.levelTestVersionPromise = me.query(MSS_LEVEL_TEST_VERSION).spread(function (mssLevelTestVersion) {
			return parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);
		});

		me.certPromise = me.query([
			"student_certificate!*",
			"student_archive_certificate!*"
		]);
	},{

		"hub:memory/common_context" : function(common_context){
			var me = this;
			common_context && render.call(me, me[CULTURE_CODE] = common_context.values.culturecode.value);
		},

		"hub:memory/load/results": function(data) {
			this.dfdResults.resolve(data);
		},

		"dom: .cp-next-unit/click": function(){
			var me = this;
			me.publish('ef/next/unit');
		},

		"dom: .cp-next-level/click": function(){
			var me = this;
			me.publish("enroll/next/level")
		},

		"dom: .cp-course-change/click": function(){
			window.location.href = MODULE_CONFIG.changeCourseUrl;
		},

		"dom: .cp-certificate-action/click": function(){
			var me = this;
			var resultURL = me.$element.find('.cp-certificate-action-text').data('url');
			window.open(resultURL);
		}
	});
});
