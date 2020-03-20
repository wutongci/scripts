define([
	"when",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/browser-check",
	"template!./asr-not-supported.html"
], function ReferenceModule(
	when,
	Widget,
	browserCheck,
	template
) {
	"use strict";

	var $ELEMENT = "$element";

	function computeNoticeBlurb(html5AsrAvailable) {
		var noticeBlurbId = 709456;
		var noticeBlurbEn = 'Please allow your Microphone to be accessed and try again.';

		if (!html5AsrAvailable) {
			var isPc = browserCheck.device === 'pc';
			var isOsx = browserCheck.os === 'osx';
			var isIos = browserCheck.os === 'ios';
			if (isPc) {
				if (isOsx) {
					noticeBlurbId = 709458;
					noticeBlurbEn = 'Please use the latest version of Web browser Chrome or upgrade to Safari 11.';
				} else { // windows
					noticeBlurbId = 709457;
					noticeBlurbEn = 'Please use the latest version of web browser such as Chrome (preferred), Firefox. Thanks.';
				}
			} else { // tablet / mobile
				if (isIos) {
					noticeBlurbId = 709460;
					noticeBlurbEn = 'Please use Safari 11 by upgrading to iOS 11.';
				} else { // android
					noticeBlurbId = 709459;
					noticeBlurbEn = 'Please use the latest version of Chrome or Firefox. Thanks.';
				}
			}
		}

		return {
			noticeBlurbId: noticeBlurbId,
			noticeBlurbEn: noticeBlurbEn
		};
	}

	return Widget.extend({
		"sig/start": function () {
			var $element = this.$element;
			var html5AsrAvailable = $element.data('html5AsrAvailable');
			var hasNoAsrFallback = $element.data('hasNoAsrFallback');

			var noticeBlurb = computeNoticeBlurb(html5AsrAvailable);

			return when.all([
				this.html(template, {
					hasNoAsrFallback: hasNoAsrFallback,
					html5AsrAvailable: html5AsrAvailable,
					noticeBlurbId: noticeBlurb.noticeBlurbId,
					noticeBlurbEn: noticeBlurb.noticeBlurbEn
				}),
				// reset bottom bar
				this.publish("activity/prop/changed/completed", false),
				this.publish("activity/prop/changed/type", -1),
				this.publish("activity/prop/changed/length", 0),
				this.publish("activity/prop/changed/index", -Infinity)
			]);
		},
		"dom:[data-action=skip]/click": function () {
			var resolver = this[$ELEMENT].data('resolver');
			resolver({
				skip: true
			});
		},
		"dom:[data-action=proceedWithoutAsr]/click": function () {
			var resolver = this[$ELEMENT].data('resolver');
			resolver({
				proceedWithoutAsr: true
			});
		},
	});
});
