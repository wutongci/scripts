define(function(){

    var ua = navigator.userAgent.toLowerCase();

    var pixelRatio = window.devicePixelRatio || 1;

    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
        /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
        // use to check compatible mode in ie
        /(msie) ([\w.]+)[\S\s]*trident\/([\w.]+)/.exec( ua ) ||
        /(msie) ([\w.]+)/.exec( ua ) ||
        ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
        [];

    var compatibilityMode;

    if(match[1] === "msie"){
        var msieVersion = parseInt(match[2], 10);
        switch(msieVersion){
            case 7:
                compatibilityMode = !!match[3];
                break;
        }
    }

    // TODO: if we need to check anyother OS, add here
    var platform =  /(ipad)[\S\s]*os (\d+)_(\d+)/.exec( ua ) ||
                    /(iphone)[\S\s]*os (\d+)_(\d+)/.exec( ua ) ||
                    //this is recommend by google, but unfortunately, few browser to follow it.
                    /(android)[\S\s]*(mobile)/.exec( ua ) ||
                    /(android)[\S\s]*(?!mobile)/.exec( ua ) ||
                    //kindle fire, so special
                    /(kfjwi) /.exec( ua ) ||
                    /(kftt) /.exec( ua ) ||
                    /(kfot) /.exec( ua ) ||
                    [];

    var os = platform[1];

    var device = "pc";
    
    if(os === "android" || os === "kfjwi" || os === "kftt" || os === "kfot"){
        var screen = window.screen,
            screenW = screen.width,
            screenH = screen.height,
            minSize = Math.min(screenW, screenH);
        //512 is a tablet such as which width 768px but has a 1.5 pixelRatio (this is a limit tablet in theory);
        //The min example is kindle fire which width 800px but has a 1.5 pixelRatio;
        device = minSize / pixelRatio >= 300 ? "tablet" : "mobile";
        os = "android";
    }
    else if(os === "ipad"){
        device = "tablet";
        os = "ios";
    }
    else if(os === "iphone"){
        device = "mobile";
        os = "ios";
    }

    return {
        browser : match[ 1 ] || "",
        version : match[ 2 ] || "0",
        os      : os,
        device  : device,
        compatibilityMode : compatibilityMode
    };
});
