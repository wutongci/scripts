define([
	'jquery',
	'school-ui-activity/activity/base/main',
	'template!./language-presentation.html',
	'template!./content-audio.html',
	'jquery.ui',
	'school-ui-activity/util/activity-util',
	'jquery.jscrollpane',
	'jquery.mousewheel'
], function languagePresentationModule($, Widget, tTemplate, aTemplate, ui, Util) {
	"use strict";

	/**
	 language presentation
	 */

	var SEL_SOURCE_AUDIO = "span.flashplaceholder",
		SEL_ETS_ACT_LNP_SCROLL = ".ets-act-lnp-scroll",
		SEL_ETS_BD = ".ets-bd";

	var _timeoutToChangeScrollbarAlphaFirst,
		_timeoutToChangeScrollbarAlphaSecond;

	function initMediaPlayer() {
		var me = this;
		var previousAudioUrl;

		//Remove extra space before audio button
		me.$element.find(SEL_SOURCE_AUDIO).each(function () {
			var str = $(this).parent().html().replace("&nbsp;<span", "<span");
			$(this).parent().html(str);
		});

		me.$element.find(SEL_SOURCE_AUDIO).each(function () {
			var audioStr = $(this).attr("name");
			if (previousAudioUrl == audioStr) {
				return false;
			}
			previousAudioUrl = audioStr;
			var audioUrl = audioStr.split(/[=|&]/)[1];
			var audioHtml = $.trim(aTemplate({"audioUrl": audioUrl}));
			$(this).replaceWith($(audioHtml));
		});
		return me.$element.find("[data-weave]").weave();
	}

	function initScrollPanelEvent($pane) {
		return $pane.bind('jsp-initialised', function () {
			var $dragbar = $pane.find('.jspDrag'),
				eventScroll = 'jsp-scroll-y';
			_timeoutToChangeScrollbarAlphaFirst = setTimeout(function () {
				Util.blink.call($, $dragbar);
			}, 5000);

			_timeoutToChangeScrollbarAlphaSecond = setTimeout(function () {
				Util.blink.call($, $dragbar);
			}, 30000);

			$pane.bind(eventScroll, function () {
				$pane.unbind(eventScroll);
				window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
				window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
			});
		});
	}

	function customScrollBar() {
		var me = this,
			$pane = me.$element.find(SEL_ETS_ACT_LNP_SCROLL);
		initScrollPanelEvent($pane).jScrollPane({
			contentWidth: "0"
		});
	}

	function render() {
		var me = this;
		var data = {
			content: me._json.content.txt
		};

		return me.html(tTemplate, data)
			.then(function () {
				me.$element.find(SEL_ETS_BD).html(data.content);
				return initMediaPlayer.call(me);
			})
			.then(function () {
				customScrollBar.call(me);
			});
	}

	var extendOptions = {
		'sig/finalize': function onFinalize() {
			window.clearTimeout(_timeoutToChangeScrollbarAlphaFirst);
			window.clearTimeout(_timeoutToChangeScrollbarAlphaSecond);
		},
		"sig/render": function onRender() {
			this.items().completed(true);
			return render.call(this);
		}
	};
	return Widget.extend(function () {

	}, extendOptions);
});
