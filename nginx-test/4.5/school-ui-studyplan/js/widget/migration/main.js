define([
	"jquery",
	"jquery.gudstrap",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/update-helper",
	"template!./main.html"
], function($, $GUD, Widget, UpdateHelper, tMain){
	"use strict";

	var $ELEMENT = "$element";

	var RETRY = "_retry";

	var CHECK_STATUS_DURATION = 100;

	var RETRY_TIMES = 3;

	var URL_SCHOOL_HANDLE = "/school/course/currentcourse/handler.aspx";

	var SEL_MODAL = ".modal",
		SEL_PROGRESS_BAR = ".progress-bar",
		SEL_MIGRATION_PROGRESS_MODAL = ".ets-sp-migration-progress-modal",
		SEL_MIGRATION_FAIL_MODAL = ".ets-sp-migration-fail-modal";

	function hideModal(){
		var me = this;
		me[$ELEMENT].find(SEL_MODAL).modal('hide');
	}

	function showProgressModal(progress) {
		var me = this;
		showModal.call(me, SEL_MIGRATION_PROGRESS_MODAL)
			.find(SEL_PROGRESS_BAR).width(progress - 5 + "%").text(progress + "%");

		(progress === 100) && gotoSchoolHandle();
	}

	function showFailModal() {
		var me = this;
		showModal.call(me, SEL_MIGRATION_FAIL_MODAL);
	}

	function showModal(modal){
		var me = this;
		var $modal = me[$ELEMENT].find(modal);

		$modal.on('show.bs.modal', function($event) {
			me[$ELEMENT].find(".modal-backdrop").removeClass("hidden");
		}).on('hidden.bs.modal', function($event) {
			me[$ELEMENT].find(".modal-backdrop").addClass("hidden");
		});

		if(!$modal.hasClass("in")) {
			hideModal.call(me);

			$modal.modal({
				keyboard: false
			});
		}

		return $modal;
	}

	function gotoSchoolHandle(){
		window.open(URL_SCHOOL_HANDLE, '_self');
	}

	function execMigrate(){
		var me = this;

		if(me[RETRY] >= RETRY_TIMES) {
			showFailModal.call(me)
		}
		else {
			UpdateHelper.platformMigrate().then(function(data){
				me[RETRY]++;
				switch (data.response) {
					case "DONE":
						gotoSchoolHandle();
						break;
					case "OK":
						checkStatus.call(me);
						break;
					case "ERROR":
						showFailModal.call(me);
						break;
					case "RETRY":
						execMigrate.call(me);
						break;
					default:
						showFailModal.call(me);
						break;
				}
			});
		}
	}

	function checkStatus(){
		var me = this;

		var checkAgain = function(){
			window.setTimeout(function(){
				checkStatus.call(me);
			}, CHECK_STATUS_DURATION);
		};

		me.query("platform_migration!current").spread(function(mig_status){
			switch (mig_status.status) {
				case "":
					execMigrate.call(me);
					break;
				case "QUEUED":
				case "STARTED":
					showProgressModal.call(me, mig_status.progress);
					checkAgain();
					break;
				case "TIMEOUT":
				case "CONFLICTED":
				case "ERROR":
					showFailModal.call(me);
					break;
				case "DONE":
					// Cause backend service have some unknown issue here
					// Sometime service will return "DONE" state but progress isn't 100
					// So we fake the progress is 100 to work around the issue.
					showProgressModal.call(me, 100);
					break;
				case "CANCELLED":
				case "RESET":
					execMigrate.call(me);
					break;
				default:
					showFailModal.call(me);
					break;
			}
		});
	}

	return Widget.extend({
		"hub:memory/context" : function(context, courseEnroll, platformVersion){
			var me = this;

			if(platformVersion.version === "1.0") {
				return me.html(tMain).then(function(){
					me[RETRY] = 0;
					checkStatus.call(me);
				});
			}
		}
	});
});
