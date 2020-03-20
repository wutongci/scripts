/**
 * # util/update-help.js
 *
 * Update service wrapper
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
	"./update-command"
], function UpdateHelperUtilModule(UpdateCommand) {
	"use strict";

	/*!
	 * api name
	 */
	var API_SUBMIT_SCORE = "school/scoring/SubmitActivityScore";
	var API_UPDATE_ENROLLMENT = "school/enrollment/UpdateCurrentEnrollment";
	var API_SAVE_MEMBER_SITE = "school/member_site_setting/Save";
	var API_INTEGRATION_SUBMIT_WRITING = "schoolintegration/integration_writing/SubmitWriting";
	var API_SUBMIT_RATING = "school/rating/SubmitRating";
	var API_FEATURE_LOG = "school/featuresupport/Log";
	var API_ACT_EVENT_LOG = "school/school_event_log/LogActivityEvent";
	var API_WRITING_CORRECTION_SUBMIT_RATING = "school/writing_correction_rating/SubmitRating";
	var API_PLATFORM_MIGRATE = "school/platform2migrate/Migrate";
	var API_NEW_CONTENT_MIGRATE = "school/newcontentupgrade/Migrate";

	/*!
	 * hub name
	 */
	var HUB_UPDATE_PROGRESS = "ef/update/progress";

	return {
		submitScore: function onSubmitScore(data) {
			return UpdateCommand.update(API_SUBMIT_SCORE, data, HUB_UPDATE_PROGRESS);
		},

		moveOnUnit: function onMoveOnUnit(data) {
			return UpdateCommand.update(API_MOVE_ON_UNIT, data, HUB_UPDATE_PROGRESS);
		},

		updateEnrollment: function onUpdateEnrollment(data) {
			return UpdateCommand.update(API_UPDATE_ENROLLMENT, data);
		},

		submitRating: function onSubmitRating(data) {
			return UpdateCommand.update(API_SUBMIT_RATING, data);
		},

		saveMemberSite: function onSubmitRating(data) {
			return UpdateCommand.update(API_SAVE_MEMBER_SITE, data);
		},

		integrationSubmitWriting: function onSubmitWriting(data) {
			return UpdateCommand.update(API_INTEGRATION_SUBMIT_WRITING, data);
		},

		logFeature: function onLogFeature(data) {
			return UpdateCommand.update(API_FEATURE_LOG, data);
		},

		logActEvent: function onLogActEvent(data) {
			return UpdateCommand.update(API_ACT_EVENT_LOG, data);
		},

		submitWritingCorrectionRating: function onSubmitWritingCorrectionRating(data) {
			return UpdateCommand.update(API_WRITING_CORRECTION_SUBMIT_RATING, data);
		},

		platformMigrate: function onPlatformMigrate(data) {
			return UpdateCommand.update(API_PLATFORM_MIGRATE, data);
		},

		newContentMigrate: function onPlatformMigrate(data) {
			return UpdateCommand.update(API_NEW_CONTENT_MIGRATE, data);
		}
	};
});
