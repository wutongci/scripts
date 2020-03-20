/***
 * @singleton omniture

 * Omniture wrapper, wraps around the original omniture s_code file,
 * make sure omniture doesn't pollute the global and also provides convininent
 * APIs for single page application.
 */
define([
	'when',
	'../sandbox/main'
], function OmnitureWrapperModule(when, gollum) {
	'use strict';

	var FUNC_OMNI_SEND = 'E12_Tracking_Omniture_Send';

	// contains the backed up properties of the original s object
	var backup = {};

	var dfdSCode = when.promise(function(resolve, reject){
		// Init
		gollum
			.exec(function (backup) {

				if (!window.s) {
					return;
				}

				// backup the original 's' object
				for (var key in window.s) {
					backup[key] = window.s[key];
				}

			}, backup)
			.then(resolve, reject);
	});


	return {
		send: function (settings) {
			dfdSCode.then(function () {
				gollum.exec(function (FUNC_OMNI_SEND, settings, backup) {

					var s = window.s;

					if (!s || !window[FUNC_OMNI_SEND]) {
						return;
					}

					// restore the original 's' object
					for (var key in s) {
						if (!s.hasOwnProperty(key)) {
							continue;
						}

						if (key in backup) {
							s[key] = backup[key];
						}
						else {
							delete s[key];
						}

					}

					// set up the sending parameter
					for (var key in settings) {
						if (!settings.hasOwnProperty(key)) {
							continue;
						}

						s[key] = settings[key];
					}

					// TODO: call the customized method which produced by backend code?
					window[FUNC_OMNI_SEND]();

				}, FUNC_OMNI_SEND, settings, backup);
			});
		}
	};
});
