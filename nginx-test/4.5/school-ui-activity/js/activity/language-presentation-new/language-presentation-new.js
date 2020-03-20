// # Task Module
define([
	'jquery',
	'jquery.ui',
	'poly',
	'troopjs-ef/component/widget',
	"jquery.easing",
	"jquery.scrollto",
	"jquery.viewport",
	'jquery.mousewheel',
	'markdownjs',
	"mediaelement-plugin-ef",
	"school-ui-activity/util/content-converter",
	'template!./language-presentation-new.html',
	"school-ui-shared/utils/browser-check",
	'mediaelement-and-player'
], function ($,
             ui$,
             poly,
             Widget,
             easing,
             scrollto,
             viewport,
             mousewheel,
             md,
             mejsPlugin,
             converter,
             tTemplate,
			 browserCheck,
			 mejs) {
	"use strict";

	// Constants
	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_GRAMMAR_VIDEO_AP = ".ets-act-lpn-grammar-video .ets-ap";
	var SEL_VIEW = "#ets-act-lpn-view";
	var SEL_SECTION = ".ets-act-lpn-section";
	var SEL_TAB = "#ets-act-lpn-tabs > ul > li";
	var SEL_AUDIO = ".ets-ap";
	var SEL_LP_GRAMMAR = ".ets-act-lpn-grammar";
	var SEL_VIDEO_CONTAINER = ".ets-act-vp-wrap";

	var CLS_CURRENT = "ets-current";
	var CLS_ACTIVE = "ets-active";
	var CLS_PLAYING = "ets-playing";
	var CLS_ARABIC_FIX = "ets-ui-arabic-fix";

	var PROP_CULTURE_CODE = "cultureCode";

	function arabicFix(data) {
		data.content.presentations.forEach(function (v) {
			var $html = $("<div>" + v.text + "</div>");
			$html.find("p,td,strong").each(function () {
				var $this = $(this);
				var fixText = $this.text();
				Array.prototype.every.call(fixText, function (char) {
					if (char.charCodeAt(0) > 160) {
						$this.addClass(CLS_ARABIC_FIX);
						return false;
					}
					return true;
				});
			});
			v.text = $html.html();
		});
	}

	// # Render
	function render() {
		var me = this;

		if (!me._json || !me[PROP_CULTURE_CODE]) return;

		var data = me._json;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		filterData.call(me, data);

		if (/^ar/.test(me[PROP_CULTURE_CODE])) {
			arabicFix(data);
		}

		return me
			.html(tTemplate, data)
			.tap(onRendered.bind(me));
	}

	function filterData(data) {
		for (var i = 0; i < data.content.presentations.length; i++) {
			data.content.presentations[i].text = data.content.presentations[i].text.replace(/(^\s*)|(\s*$)/g, "");

			//Parse markdown to html
			data.content.presentations[i].text = md.toHTML(data.content.presentations[i].text);
		}
	}

	/**
	 * On activity rendered:
	 * 1. Enable droppable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this;
		if (me._json.content.grammarVideo && me._json.content.grammarVideo.videoUrl) {
			initGrammerVideo.call(me);
		}

		initScroll.call(me);
		initMedia.call(me);
	}

	function scriptsToSubtitles(scripts) {
		// language-presentation-new scripts have a different format than other activities scripts
		return scripts.map(function (item) {
			return {
				html: md.toHTML(item.text),
				start: converter.timeStrToSeconds(item.StartTime),
				end: converter.timeStrToSeconds(item.EndTime)
			};
		});
	}

	function initGrammerVideo() {
		var me = this,
			$el = this.$element;

		var videoInfo = {
			video: me._json.content.grammarVideo.videoUrl
		};

		var options = {
			features: ['Subtitles', 'SwitchQuality'],
			subtitles: scriptsToSubtitles(me._json.content.grammarVideo.scripts),
			showToggleSubtitlesButton: false,
			pauseOtherPlayers:browserCheck.device!=='tablet'
		};

		var $video = $el.find(SEL_VIDEO_CONTAINER);

		$video.data({
			'videoInfo': videoInfo,
			'options': options,
			'successCallback': onVideoPlayerReady.bind(me)
		})
			.attr('data-weave', 'school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)')
			.weave();
	}

	function onVideoPlayerReady(videoMediaElement, domObject, player) {
		var me = this;
		var $el = me.$element;
		var isTablet = browserCheck.device === 'tablet';
		var $videoParent = $(domObject).parents(".ets-vp");

		me.grammarVideoMediaElement = videoMediaElement;

		player.enableSubtitles();

		// try to fix tablet can not play audio issue , check detail for SPC-7914
		if(isTablet){
			$el.find('.mejs-overlay-button, .ets-act-lpn-grammar-video .mejs-play').on('click', function(){
				var audioElement = $el.find('.ets-act-lpn-grammar-video audio')[0];
				if(!audioElement)return;
				if(audioElement.paused){
					audioElement.play();
				}else{
					audioElement.pause();
				}
			});
		}

		videoMediaElement.addEventListener('pause', function () {
			$videoParent.removeClass(CLS_PLAYING);
		});

		videoMediaElement.addEventListener('play', function () {
			$videoParent.addClass(CLS_PLAYING);
		});

		if (me._json.content.grammarVideo.audioUrl) {
			videoMediaElement.addEventListener('pause', function () {
				$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/pause');
			});

			videoMediaElement.addEventListener('playing', function () {
				// try to fix tablet can not play audio issue , check detail for SPC-7914
				if(isTablet){
					var audioElement = $el.find('.ets-act-lpn-grammar-video audio')[0];
					Object.keys(mejs.players).forEach(function(key){
						var mediaElement =   mejs.players[key].media;
						if(mediaElement !== videoMediaElement && mediaElement !== audioElement
						&& !mediaElement.paused && !mediaElement.ended ){
							mediaElement.pause();
						}
					});
				}else{
					$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/play');
				}
			});

			videoMediaElement.addEventListener('ended', function () {
				$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/end');
			});

			videoMediaElement.addEventListener('seeked', function () {
				var currentTime = videoMediaElement.currentTime;
				$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/seek', currentTime);
			});

			videoMediaElement.addEventListener('volumechange', function () {
				var volume = videoMediaElement.volume;
				var muted = videoMediaElement.muted;
				$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/volume', {
					volume: volume,
					muted: muted
				});
			});

			var initVolume = videoMediaElement.volume;
			var initMuted = videoMediaElement.muted;
			$el.find(SEL_GRAMMAR_VIDEO_AP).trigger('player/volume', {
				volume: initVolume,
				muted: initMuted
			});
		}
	}


	function initMedia() {
		var $el = this.$element;

		$el.find(SEL_LP_GRAMMAR).each(function (i, item) {
			var $item = $(item);
			var str = convertLegacyAudioTag($item.html());
			str = replaceURLWithAudioTag(str);
			str = replaceURLWithImageTag(str);
			$item.html(str);

			//Weave audio widget
			$item.find("[data-weave]").weave();
		});
	}

	function replaceURLWithAudioTag(text) {
		var expAudio = /((?:https?:)?\/\/.*?.(?:mp3|ogg|webm))/ig;
		text = text.replace(expAudio, [
			'<div class="ets-act-ap-wrap"><div data-at-id="btn-audio-start" class="ets-act-ap ets-ap-smaller">',
			'<audio data-weave="school-ui-shared/widget/audio-player/main" preload="none" data-src="$1" type="audio/mpeg" class="ets-ap ets-ap-smaller ets-ap-nobar"></audio>',
			'</div></div>'
		].join(''));
		return text;
	}

	function replaceURLWithImageTag(text) {
		var expImage = /((?:https?:)?\/\/.*?.(?:jpg|png|gif|jpeg|bmp))/ig;
		text = text.replace(expImage, "<img src='$1' />");
		return text;
	}

	function convertLegacyAudioTag(html) {
		var $temp = $("<div></div>");
		$temp.html(html);
		var audioPlaceholder = $temp.find(".flashplaceholder");
		audioPlaceholder.each(function () {
			$(this).removeAttr("name width height class id");
			$(this).text().trim();
		});

		return $temp.html();
	}

	function scrollToSection(activity) {
		var me = activity,
			$el = me.$element;
		if ($(this).hasClass(CLS_ACTIVE)) {
			return;
		}

		var index = $(this).index();

		me._super.index(index);

		if (index >= $(this).siblings().length) {
			me._super.completed(true);
		} else {
			me._super.completed(false);
		}
		$(this).addClass(CLS_ACTIVE).siblings(SEL_TAB).removeClass(CLS_ACTIVE);
		var currentSection = $(this).data("section");
		var $targetSection = $(SEL_SECTION).filter(function () {
			return $(this).data("section") == currentSection
		});
		$(SEL_VIEW).stop().scrollTo($targetSection, 300);

		if (me.grammarVideoMediaElement && me.grammarVideoMediaElement.played) {
			setTimeout(function () {
				me.grammarVideoMediaElement.pause();
			}, 100);
		}

		$el.find(SEL_AUDIO).trigger('player/pause');
	}

	function initScroll() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_TAB).click(function () {
			scrollToSection.call(this, me);
		});

		//scroll to first tab
		scrollToSection.call($($el.find(SEL_TAB).get(0)), me);

		$el.find(SEL_VIEW).viewport({
			targets: SEL_SECTION,
			onViewChange: function (elements/*, detail*/) {
				$.each(elements, function (i, element) {
					var currentSection = $(element).data('section');
					var $targetTab = $el.find(SEL_TAB).filter(function () {
						return $(this).data("section") == currentSection
					});

					$el.find(SEL_TAB).removeClass(CLS_ACTIVE);
					$targetTab.addClass(CLS_ACTIVE);

					$el.find(SEL_VIEW).removeClass(CLS_CURRENT);
					$(element).addClass(CLS_CURRENT);
				});
			}
		});

	}

	var methods = {
		"hub/activity/template/lpn/load": function (parent, options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;

			me._super = parent;

			// set instant feedback off
			me._item.instantFeedback(false);

			return render.call(me);
		},
		"hub/activity/template/lpn/next": function (index) {
			scrollToSection.call($(this.$element.find(SEL_TAB).get(index)), this);
		},
		"hub:memory/context": function (context) {
			var me = this;
			context && context[PROP_CULTURE_CODE] && (me[PROP_CULTURE_CODE] = context[PROP_CULTURE_CODE]);
			render.call(me);
		}
	};

	return Widget.extend(methods);
});
