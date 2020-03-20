define([
	'jquery',
	'poly',
	'when',
	'troopjs-utils/merge',
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check",
	'template!./main.html',
	'school-ui-shared/utils/typeid-parser',
	'jquery.ui',
	'jquery.ui.touch-punch',
	'jquery.counter'
], function ($, poly, when, merge, Widget, browserCheck, tTemplate, idParser) {
	"use strict";

	var $ELEMENT = '$element';

	var PREVIEW_WIDTH = 310;
	var PREVIEW_HEIGHT = 310;
	var THUMBNAIL_WIDTH = 110;
	var THUMBNAIL_HEIGHT = 110;

	var WARN_TEXT_LENGTH = 190;

	var SEL_PREVIEW_IMG = '.ets-corp-area img';
	var SEL_DESCRIBE_AREA = '.ets-describe-area';
	var SEL_TEXTAREA = 'textarea';
	var SEL_SUBMIT = '.ets-btn-blue';
	var SEL_COUNTER = '#input-describe_counter';
	var SEL_PROFILE_IMG = '.ets-profile-image';
	var SEL_TEXTAREA_TOOLTIP = '.ets-describe-area .ets-tooltip';
	var SEL_GENERAL_TOOLTIP = '.ets-profile-image .ets-tooltip';
	var SEL_TOOLTIP_CONTENT = '.ets-tooltip-content';
	var SEL_AGREE_SHARE = '#agree-share';
	var SEL_CHANGE_PICTURE = ".ets-btn-change";
	var SEL_EDIT_ENTRY = ".ets-edit-entry";

	var CLS_NONE = 'ets-none';
	var CLS_WARNING = 'ets-warning';
	var CLS_DISABLED = 'ets-disabled';
	var CLS_FOCUS = 'ets-focus';
	var CLS_SUCCESS = 'ets-tooltip-success';
	var CLS_ERROR = 'ets-tooltip-error';
	var CLS_CHECKBOX = 'ets-checkbox-checked';
	var CLS_TOOLTIP_IE8 = 'ets-tooltip-ie8';


	var HUB_SHOW_CHOOSE = "activity/sharing-pic-desc/show/choose-picture-screen";
	var HUB_SHOW_WALL = 'activity/sharing-pic-desc/show/picture-wall-screen';
	var HUB_ENABLE_NEXT = 'activity/sharing-pic-desc/enable/next';

	/*!
	 * widget blurb
	 */
	var BLURB = "blurb!",
		BLURB_GENERAL_ERROR = BLURB + "467616",
		BLURB_SAVE_ERROR = BLURB + "467617",
		BLURB_COMPLETE = BLURB + "467615";

	var BLURB_LIST = {};
	BLURB_LIST[BLURB_GENERAL_ERROR] = 'Upload file error: An unexpected error occurred. Please try it again or later!';
	BLURB_LIST[BLURB_SAVE_ERROR] = 'There is an unexpected error occured when save your entity. Please try it again or later!';
	BLURB_LIST[BLURB_COMPLETE] = 'Completed. Good job!';

	function showCompleteTooltip() {
		var me = this;
		me.$generalTooltip.addClass(CLS_SUCCESS).removeClass(CLS_ERROR)
			.show()
			.find(SEL_TOOLTIP_CONTENT).text(BLURB_LIST[BLURB_COMPLETE]);
	}

	function hideGeneralTooltip() {
		var me = this;
		me.$generalTooltip.hide();
	}

	function showErrorTooltip(msg) {
		var me = this;
		me.$generalTooltip.addClass(CLS_ERROR).removeClass(CLS_SUCCESS)
			.show()
			.find(SEL_TOOLTIP_CONTENT).text(msg);
	}

	function hideErrorTooltip() {
		var me = this;
		me.$generalTooltip.addClass(CLS_ERROR).removeClass(CLS_SUCCESS)
			.hide();
	}

	function showPreview() {
		var me = this;
		var url = me._json.url;
		var img = new Image();

		if (browserCheck.browser === "msie") {
			img.onreadystatechange = onload;
		} else {
			img.onload = onload;
		}

		img.src = url;

		function onload() {
			me.$previewImage.attr('src', url);
			if (me._json.isLibrary || me._json.cropped) {
				me.$previewImage.css({
					width: '100%',
					height: '100%'
				});
				return;
			}

			me.$previewImage.css("cursor", 'move');

			var width = me.$previewImage.width() - PREVIEW_WIDTH;
			var height = me.$previewImage.height() - PREVIEW_HEIGHT;

			me.$previewImage.draggable({
				drag: function (e, ui) {

					if (ui.position.left >= 0) {
						ui.position.left = 0;
					}
					if (ui.position.top >= 0) {
						ui.position.top = 0;
					}
					if (ui.position.left <= -width) {
						ui.position.left = -width;
					}
					if (ui.position.top <= -height) {
						ui.position.top = -height;
					}
				}
			});
		}

	}

	function destroyDraggable() {
		var me = this;

		if (me.$previewImage.data('ui-draggable')) {
			me.$previewImage.draggable('destroy');
		} //draggable not initialized if "me._json.isLibrary || me._json.cropped", don't destroy

		me.$previewImage.removeAttr('style');
	}

	function showDescribeArea() {
		var me = this;

		if (typeof me._json.describe !== 'undefined') {
			var _desc = me._json.describe.replace(/(<|(?:&lt;))/g, '$1 ');
			var _descDecode = $('<div/>').html(_desc).text();
			me.$textarea.val(_descDecode.replace(/((<|(?:&lt;))\s)/g, '$2'));
			delete me._json.describe;
		}

		if (typeof me._json.isPrivate !== 'undefined' && me._json.isPrivate) {
			me.$agreeShare.parent('span').removeClass(CLS_CHECKBOX);
			me.$agreeShare.prop('checked', false);
		}
		else {
			me.$agreeShare.parent('span').addClass(CLS_CHECKBOX);
			me.$agreeShare.prop('checked', true);
		}

		toggleSubmitButton.call(me, me.$textarea.val().length);

		me.$describeArea.show("slide", {
			direction: "left"
		}, 'normal', function () {
			me.$textarea.focus();
			if (me.$textareaTooltip.hasClass(CLS_TOOLTIP_IE8)) {
				me.$textareaTooltip.css('top', (-1) * (me.$textareaTooltip.height())).show();
			}
			else {
				me.$textareaTooltip.css('top', (-1) * (me.$textareaTooltip.height() + 10)).show();
			}
		});
	}

	function hideDescribeArea() {
		var me = this;

		return when.promise(function (resolve) {
			me.$textareaTooltip.hide();
			//hide describe area
			me.$describeArea.hide("slide", {
				direction: "left"
			}, 'slow', resolve);
		});
	}

	function getCroppedImage(imageUrl) {
		var me = this;

		function onDone() {
			destroyDraggable.call(me);
			me.$previewImage.attr('src', url)
				.css({
					width: '100%',
					height: '100%'
				});
		}

		if (me._json.isLibrary) {
			return when.resolve().tap(onDone);
		}

		var url = imageUrl;

		var image = new Image;
		image.src = url;

		return when.promise(function (resolve) {
			$(image).one('load', resolve);
		}).tap(onDone);
	}

	function zoomOutPreview() {
		var me = this;

		return when.promise(function (resolve) {
			me[$ELEMENT].find(SEL_PROFILE_IMG)
				.animate({
					width: THUMBNAIL_WIDTH,
					height: THUMBNAIL_HEIGHT
				}, 'normal', function () {
					me._isShrink = true;
					resolve();
				})
				.find(SEL_CHANGE_PICTURE).addClass(CLS_NONE);
		});
	}

	function zoomInPreview() {
		var me = this;

		return when.promise(function (resolve) {
			me[$ELEMENT].find(SEL_PROFILE_IMG)
				.animate({
					width: PREVIEW_WIDTH,
					height: PREVIEW_HEIGHT
				}, 'normal', function () {
					me._isShrink = false;
					$(this).find(SEL_CHANGE_PICTURE).removeClass(CLS_NONE);
					me.$previewImage.css({
						width: '100%',
						height: '100%'
					});
					resolve();
				});
		});
	}

	function toggleSubmitButton(textLength) {
		var me = this;
		if (textLength) {
			me.$submit.removeClass(CLS_DISABLED);
		} else {
			me.$submit.addClass(CLS_DISABLED);
		}
	}

	function saveEntity(data) {
		var me = this;

		var left = parseInt(me.$previewImage.css('left'), 10) || 0;
		var top = parseInt(me.$previewImage.css('top'), 10) || 0;

		var ajaxData = merge.call({
			"data": JSON.stringify({
				"activity_id": me.activity_id,
				"descr": $.trim(me.$textarea.val()),
				"imagePath": me._json.url,
				"isPrivate": !me.$agreeShare.prop('checked'),
				"height": PREVIEW_HEIGHT,
				"width": PREVIEW_WIDTH,
				"xAxis": -left,
				"yAxis": -top,
				"isFromLibrary": me._json.isLibrary
			})
		}, me._saveAndCropImage);

		return me.publish("ajax", ajaxData)
			.tap(hideErrorTooltip.bind(me))
			.then(function (res) {
				me.publish(HUB_ENABLE_NEXT);
				if (res && res[0].saveResult) {
					data.imageUrl = res[0].cropedFileName;
				}

				when
					.all([
						hideDescribeArea.call(me),
						getCroppedImage.call(me, data.imageUrl)
					])
					.then(function () {
						if (me._noOthers) {
							showCompleteTooltip.call(me);
							me.$changePicture.addClass(CLS_NONE);
							me.$editEntry.removeClass(CLS_NONE);
						} else {
							zoomOutPreview.call(me)
								.then(function () {
									me.publish(HUB_SHOW_WALL, data);
								});
						}
					});
			})
			.otherwise(function () {
				showErrorTooltip.call(me, BLURB_LIST[BLURB_SAVE_ERROR]);
			});
	}

	function render() {
		var me = this;

		return me.html(tTemplate, me._content)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this;

		me.$textarea = me[$ELEMENT].find(SEL_TEXTAREA);
		me.$textarea.counter({
			goal: 200
		});

		me.$submit = me[$ELEMENT].find(SEL_SUBMIT);
		me.$describeArea = me[$ELEMENT].find(SEL_DESCRIBE_AREA);
		me.$previewImage = me[$ELEMENT].find(SEL_PREVIEW_IMG);
		me.$textareaTooltip = me[$ELEMENT].find(SEL_TEXTAREA_TOOLTIP);
		me.$generalTooltip = me[$ELEMENT].find(SEL_GENERAL_TOOLTIP);
		me.$agreeShare = me[$ELEMENT].find(SEL_AGREE_SHARE);
		me.$editEntry = me[$ELEMENT].find(SEL_EDIT_ENTRY);
		me.$changePicture = me[$ELEMENT].find(SEL_CHANGE_PICTURE);
	}

	function showWithoutAnimation() {
		var me = this;
		if (me._json) {
			showPreview.call(me);
			showDescribeArea.call(me);
		}
	}

	function showWithAnimation() {
		var me = this;

		zoomInPreview.call(me)
			.then(showDescribeArea.bind(me));
	}

	function showCompleted() {
		var me = this;

		me.$changePicture.addClass(CLS_NONE);
		me.$editEntry.removeClass(CLS_NONE);
		showPreview.call(me);
		showCompleteTooltip.call(me);
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


	// Constructor
	function ctor(module, el, content) {
		var me = this;
		me._isShrink = false;
		me._json = null;
		me._content = content;
		// Load blurb
		loadBlurb.call(me);
	}

	// Methods
	var methods = {
		'sig/initialize': function () {
			return render.call(this);
		},
		'hub/activity/sharing-pic-desc/describe/reload': function (data) {
			var me = this;
			var isNoOthersCompleted = me._noOthers && (data && data.from !== 'choose-picture');
			me._json = data;

			// If the preview is shrinked,
			// then zoom in it and show describe area
			if (me._isShrink) {
				showWithAnimation.call(me);
			} else {

				if (isNoOthersCompleted) {
					showCompleted.call(me);
				} else {
					showWithoutAnimation.call(me);
				}
			}

		},
		'dom:.ets-btn-change-button/click': function ($e) {
			$e.preventDefault();
			var me = this;

			me.$generalTooltip.hide();

			var hideDescribeAreaPromise;
			if (me.$describeArea.is(':visible')) {
				hideDescribeAreaPromise = hideDescribeArea.call(me);
			} else {
				hideDescribeAreaPromise = when.resolve();
			}

			hideDescribeAreaPromise.then(function () {
				destroyDraggable.call(me);
				hideErrorTooltip.call(me);
				me.publish(HUB_SHOW_CHOOSE);
			});
		},
		'dom:.ets-edit-entry-button/click': function () {
			var me = this;
			me.$changePicture.removeClass(CLS_NONE);
			me.$editEntry.addClass(CLS_NONE);
			hideGeneralTooltip.call(me);
			showDescribeArea.call(me);
		},
		'dom:#input-describe/EFTextChange': function () {
			var me = this;
			var textLength = $.trim(me.$textarea.val()).length;

			if (textLength > WARN_TEXT_LENGTH) {
				me[$ELEMENT].find(SEL_COUNTER).addClass(CLS_WARNING);
			} else {
				me[$ELEMENT].find(SEL_COUNTER).removeClass(CLS_WARNING);
			}

			toggleSubmitButton.call(me, textLength);
		},
		'dom:.ets-describe-submit-button/click': function ($e) {
			$e.preventDefault();
			var me = this;

			if (me.$submit.hasClass(CLS_DISABLED)) {
				return;
			}

			var data = {
				imageUrl: me.$previewImage.attr('src'),
				describe: me.$textarea.val(),
				isPrivate: !me.$agreeShare.prop('checked')
			};

			saveEntity.call(me, data);
		},

		'dom:#input-describe/focusin': function () {
			var me = this;
			me.$describeArea.addClass(CLS_FOCUS);
		},
		'dom:#input-describe/focusout': function () {
			var me = this;
			me.$describeArea.removeClass(CLS_FOCUS);
		},
		'hub:memory/start/load/activity': function (activity) {
			this.activity_id = idParser.parseId(activity.id);
		},
		'hub:memory/activity/sharing-pic-desc/describe/no/others': function () {
			this._noOthers = true;
		},
		'hub:memory/context': function (context) {
			this._saveAndCropImage = context.api['action/sharingpicturedescr/SaveAndCropImage'];
		}
	};

	return Widget.extend(ctor, methods);
});
