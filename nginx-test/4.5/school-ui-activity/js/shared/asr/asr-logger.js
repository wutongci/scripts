define([
	"jquery",
	"json2",
	"./asr-config"
], function ($, JSON, ASRConfig) {
	"use strict";

	var ASRLogger = {};

	if (window.console) {
		ASRLogger.log = function (info) {
			window.console.log("JS: " + JSON.stringify(info));
		};
	} else {
		ASRLogger.log = function () {};
	}

	if (ASRConfig.DEBUG_ASR_ENABLED) {
		ASRLogger.log = (function (log) {
			return function (info) {
				typeof info === "object" && (info = JSON.stringify(info));
				$(".ets-fn-asr-console").append("<li>" + info + "</li>");
				log(info);
			};
		})(ASRLogger.log);
	}

	return ASRLogger;
});
