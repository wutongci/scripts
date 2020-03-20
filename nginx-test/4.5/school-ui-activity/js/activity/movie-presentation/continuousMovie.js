define([
	"jquery",
	"poly",
	"mediaelement-plugin-ef",
	"school-ui-activity/util/content-converter",
	"school-ui-activity/activity/base/main",
	"template!./main.html"
], function mpaMain($, poly, mejs, converter, Widget, tTemplate) {
	"use strict";
	var $ELEMENT = "$element";

	var CLS_ACTIVE = "ets-active";

	var SEL_MOVIE = ".ets-movie";
	var SEL_WORD_LIST = ".ets-word-list";
	var SEL_WORD_LI = "li";
	var SEL_MEJS_TIME_SEPARATOR = ".mejs-time-separator-item";

	var DURATION_WORD_ACTIVE = 1000;
	var DURATION_WORDLIST_SCROLL = 500;

	function showWord(index) {
		var me = this;
		var $li = me.$wordlist.find(SEL_WORD_LI).eq(index);
		$li.show();
		$li.attr("data-at-status", "shown");	//for automation testing
	}

	function activeWord(index) {
		var me = this;
		var $li = me.$wordlist.find(SEL_WORD_LI).eq(index);

		if (!$li.hasClass(CLS_ACTIVE)) {
			$li.addClass(CLS_ACTIVE);

			setTimeout(function () {
				$li.removeClass(CLS_ACTIVE);
			}, DURATION_WORD_ACTIVE);
		}
	}

	function scrollWordIntoView(index) {
		var me = this;
		var $li = me.$wordlist.find(SEL_WORD_LI).eq(index);
		var liTop = $li.position().top;
		var liHeight = $li.outerHeight(true);
		var liBottom = liTop + liHeight;
		var wordlistHeight = me.$wordlist.height();

		if (liTop < 0) {
			me.$wordlist.animate({
				scrollTop: liTop
			}, DURATION_WORDLIST_SCROLL);
		}
		else if (liBottom > wordlistHeight) {
			var scrollDownDistance = liBottom - wordlistHeight;
			me.$wordlist.animate({
				scrollTop: me.$wordlist.scrollTop() + scrollDownDistance
			}, DURATION_WORDLIST_SCROLL);
		}
	}

	function onVPSuccess(mediaElement, domObject, player) {
		var me = this;
		var $mediaElement = mejs.$(mediaElement);

		$mediaElement.on("restrict_time_range_ended", function (evt, rangeInfo) {
			if (rangeInfo.index < me.timeSepCount) {
				showWord.call(me, rangeInfo.index);
				scrollWordIntoView.call(me, rangeInfo.index);
				activeWord.call(me, rangeInfo.index);

				var $currentTimeSeparator = me[$ELEMENT].find(SEL_MEJS_TIME_SEPARATOR + ":eq(" + rangeInfo.index + ")");
				$currentTimeSeparator.addClass(CLS_ACTIVE);
			}
		});

		$mediaElement.one("ended", function () {
			$mediaElement.off("restrict_time_range_ended");

			player.disableRestrictPlayingTimeRange();
			mediaElement.pause();
			mediaElement.setCurrentTime(0);
			$mediaElement.on("time_range_changed", function (evt, rangeInfo) {
				if (rangeInfo.oldIndex < me.timeSepCount && rangeInfo.oldIndex + 1 === rangeInfo.newIndex) {
					scrollWordIntoView.call(me, rangeInfo.oldIndex);
					activeWord.call(me, rangeInfo.oldIndex);
				}
			});
		});
	}

	function render() {
		var me = this;

		return me
			.html(tTemplate, me._json)
			.tap(function () {
				me.$wordlist = me[$ELEMENT].find(SEL_WORD_LIST)
			})
			.tap(initVideoPlayer.bind(me));
	}

	function initVideoPlayer() {
		var me = this;
		var data = me._json.content;

		//video info
		var videoInfo = {
			video: data.video,
			poster: data.poster
		};

		//options
		var features = ["TimeRanges", "Subtitles", "SwitchQuality"];
		var subtitles = converter.scriptsToSubtitles(data.scripts);
		var timeRangeSeparators = converter.questionsToEndTimes(data.words);
		me.timeSepCount = timeRangeSeparators.length;

		var options = {
			features: features,
			subtitles: subtitles,
			timeRangeSeparators: timeRangeSeparators,
			restrictPlayingTimeRange: true,
			restrictDeviationBefore: 0.5,
			continueOnEndOfRestrictRange: true
		};

		//success callback
		var successCallback = function () {
			onVPSuccess.apply(me, arguments);
		};

		//start to init
		var $video = me[$ELEMENT].find(SEL_MOVIE);
		$video.data({
			"videoInfo": videoInfo,
			"options": options,
			"successCallback": successCallback
		});
		$video.attr("data-weave", "school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)");
		$video.weave();
	}

	return Widget.extend({
		"sig/start": function onInit() {
			var me = this;
			me.$wordlist = null;
			me.timeSepCount = -1;
		},
		"sig/render": function onRender() {
			this.items().completed(true);
			return render.call(this);
		},
		"dom:.ets-ap/media/play": function (event) {
			$(event.target).closest("li").addClass(CLS_ACTIVE);
		},
		"dom:.ets-ap/media/pause": function (event) {
			$(event.target).closest("li").removeClass(CLS_ACTIVE);
		},
		"dom:.ets-ap/media/ended": function (event) {
			$(event.target).closest("li").removeClass(CLS_ACTIVE);
		}
	});
});
