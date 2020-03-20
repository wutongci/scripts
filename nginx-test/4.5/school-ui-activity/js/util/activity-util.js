define([
	'jquery',
	"school-ui-shared/utils/browser-check"
], function ($, browserCheck) {
	var Util = {};
	/**
	 * remove video player
	 */
	Util.clearVideo = function (player) {
		Util.clearMedia(player);
	};
	/**
	 * remove audio player
	 */
	Util.clearAudio = function (player) {
		Util.clearMedia(player);
	};
	/**
	 * Safe way to remove mediaelement player
	 */
	Util.clearMedia = function (player) {
		if (parseInt(browserCheck.version, 10) <= 8 && player && player.container) {
			var id = player.container.find('object').attr('id');
			$('<div></div>', {
				id: id,
				style: 'display: none;'
			}).appendTo('body');
			//This div will receive and ignore flash messages in IE8, see SPC-5835 and SPC-5868
		}

		try {
			player.dispose();
		} catch (ex) {
		}
	};
	Util.blink = function ($target) {
		this.fn._blink = this.fn._blink || function () {
				return this.fadeOut({duration: 400, queue: true})
					.fadeIn({duration: 400, queue: true});
			};
		return $target._blink()._blink()._blink()._blink();
	};
	return Util;
});
