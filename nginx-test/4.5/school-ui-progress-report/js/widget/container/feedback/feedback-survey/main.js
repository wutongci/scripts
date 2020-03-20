define([
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
