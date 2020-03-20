define(function () {
	return {
		/*
		 "COMMON" state is not a ASR internal state,
		 it's controlled by external widget, like activity.
		 Bad requirements make this happens.
		 For example: LanguageComparation have a strange
		 requirement which need set ASR failed when record a wrong answer.
		 Details in https://jira.englishtown.com/browse/SPC-2921.
		 */
		COMMON: "COMMON",
		START: "START",
		STOP: "STOP",
		NORMAL: "NORMAL",
		DISABLE: "DISABLE",
		RECORDING: "RECORDING",
		PROCESSING: "PROCESSING",
		PREPARING: "PREPARING",
		WARNING: "WARNING",
		ERROR: "ERROR",
		HINT: "HINT",
		DOWN: "DOWN",
		BROKEN: "BROKEN",
		START_REPLAY: "START_REPLAY",
		STOP_REPLAY: "STOP_REPLAY"
	};
});
