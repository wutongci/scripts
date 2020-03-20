define([
	'when',
	'troopjs-ef/component/widget',
	'mediaelement-and-player',
	'template!./word-list.html'
], function (when, Widget, mejs, tWordList) {
	'use strict';

	var $ELEMENT = '$element';
	var CLS_WORD_SELECTED = 'etc-unit-overview-word-selected';

	return Widget.extend(function (element, path, data) {
		var wordList = data;
		var me = this;
		return me.html(tWordList, wordList).then(function () {
			var mediaelementInits = [];
			me[$ELEMENT].find('audio').each(function (index, audio) {
				mediaelementInits.push(when.promise(function (resolve, reject) {
					new MediaElementPlayer(audio, {
						pauseOtherPlayers: true,
						alwaysShowControls: true,
						playpauseText: '',
						mode: 'native',
						features: ['playpause'],
						defaultAudioWidth: 20,
						defaultAudioHeight: 20,
						success: function (mediaElement, domObject, player) {
							mediaElement.addEventListener('play', function () {
								this.currentTime = 0;
							});
							resolve();
						},
						error: reject
					});
				}));
			});

			return when.all(mediaelementInits);
		});
	}, {
		'dom:tr/click': function (evt) {
			var $tr = $(evt.currentTarget);
			$tr.addClass(CLS_WORD_SELECTED);
			$tr.siblings().removeClass(CLS_WORD_SELECTED);
		}
	});
});
