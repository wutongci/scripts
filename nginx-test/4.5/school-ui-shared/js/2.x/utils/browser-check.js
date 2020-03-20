define(function(){
    // mapping from https://msdn.microsoft.com/en-us/library/ms537503(v=vs.85).aspx#TriToken
    var TRIDENT_TO_MSIE = {
        '4': '8.0',
        '5': '9.0',
        '6': '10.0',
        '7': '11.0',
        '8': '11.0' // see http://answers.microsoft.com/en-us/ie/forum/ie11-iewindows_10/trident-version-being-reported-as-trident80-in/00091417-43c7-4f60-9198-f6634cd1c352
    };

    function parseUserAgent(userAgent) {
        var ua = userAgent.toLowerCase();

        var match = /(edge)\/([\w.]+)/.exec(ua) ||    //make sure test edge before Chrome, because "chrome" keyword is in Edge's UA
            /(chrome)[ \/]([\w.]+)/.exec(ua) ||
            /(firefox)[ \/]([\w.]+)/.exec(ua) ||
            /version\/([\d|.]+)(?: mobile\/[\w.]+)? (safari)/.exec(ua) ||
            /(webkit)[ \/]([\w.]+)/.exec(ua) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
            // use to check compatible mode in ie
            /(?:(msie) ([\d.]+).*)?(trident)\/(\d+)/.exec(ua) ||
            /(msie) ([\w.]+)/.exec(ua) ||
            [];

        var compatibilityMode = false;
        var actualVersionOfCompatibility = null;

        if (match[2] === "safari") {
            match[2] = match[1];
            match[1] = "safari";
        } else if (match[3] === "trident") {
            var actualMsieVersion = TRIDENT_TO_MSIE[match[4]];
            if (!match[1]) {
                match[1] = "msie";
                match[2] = actualMsieVersion;
            }
            compatibilityMode = ua.indexOf('compatible') >= 0
                && match[2] !== actualMsieVersion; // IE9 reports itself has "compatible" in default mode
            if (compatibilityMode) {
                actualVersionOfCompatibility = parseFloat(actualMsieVersion);
            }
        }

        // TODO: if we need to check anyother OS, add here
        var platform = /(ipad)[\S\s]*os (\d+)_(\d+)/.exec(ua) ||
            /(iphone)[\S\s]*os (\d+)_(\d+)/.exec(ua) ||
            //this is recommend by google, but unfortunately, few browser to follow it.
            /(android)[\S\s]*(mobile)/.exec(ua) ||
            /(android)[\S\s]*(?!mobile)/.exec(ua) ||
            //kindle fire, so special
            /(kfjwi) /.exec(ua) ||
            /(kftt) /.exec(ua) ||
            /(kfot) /.exec(ua) ||
            [];

        var os = platform[1];

        var device = "pc";

        if (os === "android" || os === "kfjwi" || os === "kftt" || os === "kfot") {
            var screen = window.screen,
                screenW = screen.width,
                screenH = screen.height,
                minSize = Math.min(screenW, screenH);
                device = minSize >= 512 ? "tablet" : "mobile";
                os = "android";
        }
        else if (os === "ipad") {
            device = "tablet";
            os = "ios";
        }
        else if (os === "iphone") {
            device = "mobile";
            os = "ios";
        }

	    if (device === "pc" && !os) {
		    if (/mac os x/i.test(ua)) {
			    os = "osx";
		    } else if (/windows/i.test(ua)) {
			    os = "windows";
		    }
	    }

        return {
            browser: match[1] || "",
            version: match[2] || "0.0",
            os: os,
            device: device,
            compatibilityMode: compatibilityMode,
            actualVersionOfCompatibility: actualVersionOfCompatibility
        };
    }

    var result = parseUserAgent(navigator.userAgent);
    result.parseUserAgent = parseUserAgent; // for tests
    return result;
});
