define([
	"jquery",
	"jquery.gudstrap",
	"jquery.mediaelement",
	"troopjs-ef/component/widget",
	"template!./index.html"
], function ($, GUD, mejs, Widget, template) {
	"use strict";

	var $ELEMENT = "$element";
	var VIDEO_URL = "_video_url";
	var MEDIA_ELEMENT = "_media_element";
	var SEL_POPUP_VIDEO = ".evc-studyplan-popup-video";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			me[VIDEO_URL] = me[$ELEMENT].data("videoUrl");

			return me.html(template).then(function () {
				var $modalContent = me[$ELEMENT].find(".modal-content");

				$(SEL_POPUP_VIDEO).on("shown.bs.modal", function () {
					var $video = $("<video/>", {
						"class": "ets-vp",
						"width": "100%",
						"height": "100%",
						"type": "video/mp4",
						"controls": "controls",
						"src": me[VIDEO_URL]
					});
					$video.appendTo($modalContent.empty());

					mejs.MediaElementPlayer($video, {
						pauseOtherPlayers: true,
						alwaysShowControls: true,
						startVolume: 0.8,
						features: ["playpause", "progress", "current", "duration", "tracks", "volume"],
						videoWidth: 640,
						videoHeight: 360,
						success: function (mediaElement, domObject, player) {
							mediaElement.play();
							me[MEDIA_ELEMENT] = mediaElement;
						}
					});
				});

				$(SEL_POPUP_VIDEO).on("hide.bs.modal", function () {
					me[MEDIA_ELEMENT].pause();
					$modalContent.find("video")[0].player.remove();
				});
			});
		},
		"hub/studyplan/evc/welcome-video/show": function () {
			this[$ELEMENT].find(SEL_POPUP_VIDEO).modal();
		},
		"dom:.mejs-cover/click": function () {
			var me = this;
			!me[MEDIA_ELEMENT].paused && me[MEDIA_ELEMENT].pause();
		}
	});
});
