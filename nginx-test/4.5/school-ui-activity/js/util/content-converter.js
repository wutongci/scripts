define([], function () {
	'use strict';

	function timeStrToSeconds(strTime) {
		/*
		 acceptable format:
		 hh:mm:ss.nnn
		 mm:ss.nnn
		 ss.nnn
		 */
		var times = strTime.split(/[:.]/);
		var MAX_PARTS = 4;
		for (var i = 0, missingParts = MAX_PARTS - times.length; i < missingParts; i++) {
			times.unshift(0);
		}

		var strHours = times[0];
		var strMinutes = times[1];
		var strSeconds = times[2];
		var strMilliSeconds = times[3];

		var MILLISECONDS_DIGITS = 3;
		strMilliSeconds = strMilliSeconds + '000';
		strMilliSeconds = strMilliSeconds.substr(0, MILLISECONDS_DIGITS);

		var SECONDS_PER_HOUR = 3600;
		var SECONDS_PER_MINUTE = 60;
		var MILLISECONDS_PER_SECOND = 1000;
		return parseInt(strHours, 10) * SECONDS_PER_HOUR +
			parseInt(strMinutes, 10) * SECONDS_PER_MINUTE +
			parseInt(strSeconds, 10) +
			parseInt(strMilliSeconds, 10) / MILLISECONDS_PER_SECOND;
	}

	return {
		timeStrToSeconds: timeStrToSeconds,

		scriptsToSubtitles: function (scripts) {
			return scripts.map(function (item) {
				return {
					text: item.txt,
					start: timeStrToSeconds(item.startTime),
					end: timeStrToSeconds(item.endTime)
				};
			});
		},

		questionsToEndTimes: function (questions) {
			return questions.map(function (item) {
				return timeStrToSeconds(item.timeline || item.endTime);
			});
		},

		questionsToTimeRanges: function (questions) {
			return questions.map(function (item) {
				return [
					timeStrToSeconds(item.startTime),
					timeStrToSeconds(item.endTime)
				];
			});
		}
	}
});
