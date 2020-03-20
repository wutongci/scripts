// adjust viewport meta tag for mobile devices
// that screen width is less than minimal requirement
define([
	'./browser-check'
], function (browserCheck) {
	var VIEWPORT = 'viewport';

	var HTML_MIN_WIDTH = parseInt(getComputedStyle(document.documentElement).minWidth, 10) || 0;
	var BODY_MIN_WIDTH = parseInt(getComputedStyle(document.body).minWidth, 10) || 0;
	var MIN_REQUIRED_WIDTH = 1010;  //10px for ePaper handler
	var MIN_WIDTH = Math.max(HTML_MIN_WIDTH, BODY_MIN_WIDTH, MIN_REQUIRED_WIDTH);

	var _metaViewport;
	var _initialSettings = '';

	function _getMetaViweport() {
		if (!_metaViewport) {
			_metaViewport = document.querySelector('meta[name=' + VIEWPORT + ']');

			if (!_metaViewport) {
				_metaViewport = document.createElement('meta');
				_metaViewport.name = VIEWPORT;
				(document.head || document.getElementsByTagName('head')[0]).appendChild(_metaViewport);
			}
		}

		return _metaViewport;
	}

	function _doFixViewPort() {
		var newSettings = screen.width >= MIN_WIDTH ?
			_initialSettings :
			'width=' + MIN_WIDTH + ',user-scalable=no';

		var metaViewport = _getMetaViweport();
		metaViewport.content = newSettings;
	}

	function fixViewPort() {
		var device = browserCheck.device;
		if (device !== 'tablet' && device !== 'mobile') {
			return;
		}

		if (!screen.width || !screen.height) {
			return;
		}

		if (screen.width >= MIN_WIDTH && screen.height >= MIN_WIDTH) {
			return;
		}

		var metaViewport = _getMetaViweport();
		_initialSettings = metaViewport.content;

		_doFixViewPort();

		if (
			(screen.width >= MIN_WIDTH && screen.height < MIN_WIDTH) ||
			(screen.height >= MIN_WIDTH && screen.width < MIN_WIDTH)
		) {
			window.addEventListener("orientationchange", _doFixViewPort);
		}
	}

	return fixViewPort;
});
