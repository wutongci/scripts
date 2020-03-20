define([
	'jquery',
	'poly',
	'when',
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check",
	'template!./main.html',
	'school-ui-shared/utils/typeid-parser',
	'jquery.form',
	'jquery.ui'
], function ($, poly, when, Widget, browserCheck, tTemplate, idParser) {
	"use strict";

	var $ELEMENT = '$element';

	var SEL_UPLOAD = 'input[type="file"]';
	var SEL_CURRENT_PROGRESS = '.ets-current-progress';
	var SEL_TOOLTIP = '.ets-tooltip:not(.ets-tooltip-error)';
	var SEL_ERROR_TOOLTIP = '.ets-tooltip-error';
	var SEL_TOOLTIP_CONTENT = '.ets-tooltip-content';

	var CLS_SHOW_UPLOADING = 'ets-show-uploading';
	var CLS_SHOW_REUPLOAD = 'ets-show-reupload';

	var IS_IE = browserCheck.browser === "msie";

	var URL = {
		UPLOAD: "/services/schoolupload/SharingPictureDescr/UploadHandler.ashx?NeatUpload_PostBackID=" + (new Date()).getTime()
	};

	var HUB_SHOW_DESCR = 'activity/sharing-pic-desc/show/describe-srceen';

	/*!
	 * widget blurb
	 */
	var BLURB = "blurb!",
		BLURB_GENERAL_ERROR = BLURB + "467616",
		BLURB_ERROR_TOO_BIG = BLURB + "467614",
		BLURB_DIMENSITION_INCORRECT = BLURB + "467613",
		BLURB_FILE_TYPE_INCORRECT = BLURB + "467618";

	var BLURB_LIST = {};
	BLURB_LIST[BLURB_GENERAL_ERROR] = 'Upload file error: An unexpected error occurred. Please try it again or later!';
	BLURB_LIST[BLURB_ERROR_TOO_BIG] = 'Upload file error: The image size is too big, please select image no more than:';
	BLURB_LIST[BLURB_DIMENSITION_INCORRECT] = 'The image is too small. The minimum dimension is';
	BLURB_LIST[BLURB_ERROR_TOO_BIG] = 'The file you have uploaded is not supported. Please upload an image of the type JPG, GIF or PNG.';

	function getBlurb(status) {
		switch (status) {
			case 800:
				return BLURB_LIST[BLURB_ERROR_TOO_BIG]; //UploadFileToBig
			case 900:
				return BLURB_LIST[BLURB_DIMENSITION_INCORRECT] + ' 80px*80px'; //UploadFileDimensionIncorrect //todo: using configvalue
			case 500:
				return BLURB_LIST[BLURB_GENERAL_ERROR]; //UploadFileUnhandledError
			case 406:
				return BLURB_LIST[BLURB_FILE_TYPE_INCORRECT]; //UploadFileTypeIncorrect
			case 403:
				return BLURB_LIST[BLURB_GENERAL_ERROR]; //UnAuthorized
			case 404:
				return BLURB_LIST[BLURB_GENERAL_ERROR]; //UploadFileNotExists
			default:
				return BLURB_LIST[BLURB_GENERAL_ERROR];
		}
	}


	function toggleUpload() {
		var me = this;
		me[$ELEMENT].removeClass(CLS_SHOW_REUPLOAD).toggleClass(CLS_SHOW_UPLOADING);
	}

	// Toggle reupload area
	function toggleReupload() {
		var me = this;
		me[$ELEMENT].removeClass(CLS_SHOW_UPLOADING).toggleClass(CLS_SHOW_REUPLOAD);
	}

	function showErrorTooltip(msg) {
		var me = this;
		me[$ELEMENT].find(SEL_TOOLTIP).hide();
		me[$ELEMENT].find(SEL_ERROR_TOOLTIP)
			.show()
			.find(SEL_TOOLTIP_CONTENT).text(msg);
	}

	function hideErrorTooltip() {
		var me = this;
		me[$ELEMENT].find(SEL_TOOLTIP).show();
		me[$ELEMENT].find(SEL_ERROR_TOOLTIP).hide();
	}

	function uploadSubmit(e) {
		var me = this;
		var $target = $(e.target);
		var file = $(e.target).val();
		// If file is empty just quick return
		if (!file) {
			return;
		}

		$target.closest('form').ajaxSubmit({
			url: URL.UPLOAD,
			dataType: 'JSON',
			data: {
				'ActivityId': me._ActivityId,
				'StudentId': me._StudentId,
				'CultureCode': me._cultureCode
			},
			beforeSend: function () {
				hideErrorTooltip.call(me);
				toggleUpload.call(me);
				// Fallback uploading progress animation for IE
				if (IS_IE) {
					startAnimate(me.$currentProgress);
				}
			},
			uploadProgress: function (e, pos, total, percent) {
				me.$currentProgress.width(percent + '%');
			},
			success: function (res) {
				if (IS_IE) {
					stopAnimate(me.$currentProgress);
				}

				switch (res.Status) {
					case 200: //success
						toggleUpload.call(me);
						me.publish(HUB_SHOW_DESCR, {
							url: res.ImagePath,
							isLibrary: false,
							cropped: false,
							from: 'choose-picture'
						});
						break;
					case 800: //UploadFileToBig
					case 900: //UploadFileDimensionIncorrect
					case 500: //UploadFileUnhandledError
					case 406: //UploadFileTypeIncorrect
					case 403: //UnAuthorized
					case 404: //UploadFileNotExists
						showErrorTooltip.call(me, getBlurb(res.Status));
						toggleReupload.call(me);
						break;
				}

				// Clear input file's value
				$target.closest('form')[0].reset();
			},
			error: function (jqXHR) {
				switch (jqXHR.status) {
					case 504:
					case 413:
					case 0:
						var msg = BLURB_LIST[BLURB_ERROR_TOO_BIG] + ' 1024KB';
						showErrorTooltip.call(me, msg);
						break;
					default:
						showErrorTooltip.call(me, BLURB_LIST[BLURB_GENERAL_ERROR]);
						break;
				}

				toggleReupload.call(me);

				// Clear input file's value
				$target.closest('form')[0].reset();
			}
		});
	}

	function startAnimate($el) {
		$el.animate({
			left: '-10px'
		}, function () {
			$el.css({
				left: 0
			});
			startAnimate($el);
		});
	}

	function stopAnimate($el) {
		$el.stop(true, true);
	}

	function loadBlurb() {
		var me = this;
		var blurbList = BLURB_LIST;

		var q = Object.keys(BLURB_LIST);
		return me.query(q)
			.spread(function doneQuery() {
				$.each(arguments, function (i, blurb) {
					var translation = blurb && blurb.translation;
					if (translation) {
						blurbList[blurb.id] = translation;
					}
				});
			});
	}

	function render() {
		var me = this;

		return when.resolve()
			.then(function () {
				return me.query('ccl!"school.sharingTemplate.upload.enable"')
					.spread(function (enableUpload) {
						me._json.enableUpload = enableUpload && enableUpload.value === "true";
					})
					.otherwise(function ignoreError() {
					});
			})
			.then(function () {
				return me.html(tTemplate, me._json)
					.then(function () {
						me.$upload = me[$ELEMENT].find(SEL_UPLOAD);

						me.$upload.each(function () {
							$(this).on('change', $.proxy(uploadSubmit, me));
						});

						me.$currentProgress = me[$ELEMENT].find(SEL_CURRENT_PROGRESS);
					});
			});

	}

	// Constructor
	function ctor(el, module, json) {
		var me = this;
		var isiPad = /ipad/ig.test(navigator.userAgent);

		me._json = json;
		me._json.isiPad = isiPad;
		// Default culture code is 'en'
		me._cultureCode = 'en';

		// Load blurb
		loadBlurb.call(me);
	}

	// Methods
	var methods = {
		'sig/initialize': function () {
			var me = this;

			return render.call(me);
		},
		'hub:memory/context': function (context) {
			var me = this;
			me._cultureCode = context.cultureCode;
			me._StudentId = idParser.parseId(context.user.id);
		},
		'hub:memory/start/load/activity': function (activity) {
			var me = this;
			me._ActivityId = idParser.parseId(activity.id);
		},

		'dom:.ets-gallery-item/click': function ($e) {
			$e.preventDefault();
			var me = this;
			var url = $($e.currentTarget).find('img').attr('src');
			me.publish(HUB_SHOW_DESCR, {
				url: url,
				isLibrary: true,
				from: 'choose-picture'
			});
		},
		'dom:.ets-select-library/click': function ($e) {
			$e.preventDefault();
			var me = this;
			toggleReupload.call(me);
			hideErrorTooltip.call(me);
		}
	};

	return Widget.extend(ctor, methods);
});
