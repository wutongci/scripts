define([
	'troopjs-core/pubsub/hub',
	'logger'
], function HttpsCompatibility(Hub, Logger) {
	"use strict";

	var loc = window.location;

	if (loc.protocol !== 'https:') {
		return;
	}

	var whitelist = null;
	var prefix = 'http://' + loc.hostname;

	function onContext() {
		Hub.publish('query', 'https_compatible_urls!current')
			.spread(function (whitelistResponse) {
				whitelist = whitelistResponse && whitelistResponse.result || null;
			});
	}

	Hub.subscribe('context', Hub, onContext);
	Hub.reemit('context', false, Hub, onContext);

	function isWhitelisted(url) {
		if (!whitelist) {
			Logger.log('HTTPS whitelist not yet loaded');
			return true;
		}
		if (url.length === 0 || url.charAt(0) !== '/') {
			return true;
		}
		for (var i = 0; i < whitelist.length; ++i) {
			if (url.indexOf(whitelist[i]) === 0) {
				return true;
			}
		}
		return false;
	}

	function handleEvent(event) {
		var node = event.target;
		while (node && node.tagName !== 'A') {
			node = node.parentNode;
		}
		if (node) {
			var href = node.getAttribute('href') || '';
			if (!isWhitelisted(href)) {
				node.setAttribute('href', prefix + href);
			}
		}
	}

	document.body.addEventListener('focus', handleEvent, true);
	document.body.addEventListener('click', handleEvent, false);


	function patchOpenFunction(thisWindow, open) {
		return function (url) {
			if (!isWhitelisted(url)) {
				// force http
				var fixedArgs = Array.prototype.slice.call(arguments, 1);
				fixedArgs.unshift(prefix + url);
				return open.apply(thisWindow, fixedArgs);
			}
			// default behaviour
			return open.apply(thisWindow, arguments);
		};
	}

	window.open = patchOpenFunction(window, window.open);


	// Special case for window.parent.open used in legacy code to
	// open /translator/ page, we want to force http only in this case
	function patchParentOpenTranslatorFunction(thisWindow, open) {
		return function (url, windowName) {
			if (url.indexOf('/translator/') === 0 && windowName === 'Translator') {
				// force http
				var fixedArgs = Array.prototype.slice.call(arguments, 1);
				fixedArgs.unshift(prefix + url);
				return open.apply(thisWindow, fixedArgs);
			}
			// default behaviour
			return open.apply(thisWindow, arguments);
		};
	}

	if (window.parent !== window) {
		try {
			window.parent.open = patchParentOpenTranslatorFunction(window.parent, window.parent.open);
		} catch (ignored) {
			// probably cross-origin parent
		}
	}
});
