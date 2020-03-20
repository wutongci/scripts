/**
 * check text if can be recognized by TTS
 */
define(function TextHelperModule() {
	"use strict";
	var RE_TEXT_CAN_TTS = /[A-Za-z0-9\+\\]+/;
	var TEXT_ONLY_ONE_CAN_TTS = [
		'~',
		'`',
		'!',
		'#',
		'^',
		'*',
		'(',
		')',
		'_',
		'-',
		'[',
		']',
		'{',
		'}',
		'|',
		';',
		':',
		'\'',
		',',
		'.',
		'<',
		'>',
		'?',
		'$',
		'%',
		'&',
		'@',
		'/',
		'='
	];

	return {
		"canTTS": function onCheckText(text) {
			text = text || "";
			if (text.search(RE_TEXT_CAN_TTS) >= 0) {
				return true;
			} else if (text.length === 1) {
				return TEXT_ONLY_ONE_CAN_TTS.indexOf(text) >= 0;
			} else {
				return false;
			}
		}
	};
});
