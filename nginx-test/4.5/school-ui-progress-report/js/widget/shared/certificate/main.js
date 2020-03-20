define([
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
