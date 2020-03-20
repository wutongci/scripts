define([
	"jquery",
	"when",
	"mediaelement-with-plugins",
	"troopjs-ef/component/widget",
	"template!./main.html",
], function ($, when, mejs, Widget, template) {

	var SEL_DETAIL = ".ets-pr-fb-detail";
	var SEL_VIDEO = '.ets-pr-fb-video';
	var SEL_PLAYER = '.ef-mejs-video';
	var PLAYER_FEATURES = ['playpause','current','progress','duration','tracks','volume','fullscreen','title'];
	var PLAYER_CONTROLS_TIMEOUT_MOUSELEAVE = 2000;

	function getTopic () {
		var blurbId = this.options.topicBlurbId;
		if (blurbId) {
			return this.query('blurb!' + blurbId).spread(function (blurb) {
				return blurb && blurb.translation;
			});
		} else {
			return when.resolve(this.options.topic);
		}
	}

	return Widget.extend(function ($element, path, options) {
		this.options = options || {};
	}, {
		"sig/start": function () {
			var me = this;
			if (!me.options.video) {
				return;
			}

			return getTopic.call(me).then(function (topic) {
				return me.html(template({
					topic: topic || '',
					video: me.options.video
				}));
			});
		},

		'dom:.ets-pr-fb-btn-class-video/click': function (e) {
			var $button = $(e.currentTarget);
			var $video = this.$element.find(SEL_VIDEO);
			var $detail = $button.closest(SEL_DETAIL);
			var height = $detail.height();
			var $player;

			// show the video player
			$button.remove();
			$video.removeClass('hidden');
			$player = $video.find(SEL_PLAYER).mediaelementplayer({
				features: PLAYER_FEATURES,
				controlsTimeoutMouseLeave: PLAYER_CONTROLS_TIMEOUT_MOUSELEAVE
			});

			// autoplay
			$player.data('mediaelementplayer').play();

			// update the height for the effect of animation
			height += $video.height();
			$detail
				.height(height)
				.data("height", height);
		}
	});
});
