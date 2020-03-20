define('common-ui-shared/utils/browser-check',[],function(){

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


define('troopjs-requirejs/template!common-ui-shared/widget/tablet-notification/tablet-notification.html',[],function() { return function template(data) { var o = "<div class=\"com-tablet-download com-tablet-" +data.version+ "\">\n    <div class=\"com-tablet-cover\">\n        <div class=\"com-tablet-logo\"></div>\n        <div class=\"com-tablet-links\">\n            <span class=\"com-tablet-available\" " +data.weaveAttr+ "='troopjs-ef/blurb/widget' data-blurb-id='511879' data-text-en='APP AVAILABLE ON'></span>\n            ";if(data.os === "ios" && data.ipadLink){o += "\n            <a href=\"" +data.ipadLink+ "\" target=\"_blank\" class=\"com-tablet-app-store\" data-action=\"iosClick\"></a>\n            ";}o += "\n            ";if(data.os === "android" && data.androidLink){o += "\n            <a href=\"" +data.androidLink+ "\" target=\"_blank\" class=\"com-tablet-google-play\" data-action=\"androidClick\"></a>\n            ";}o += "\n        </div>\n\n        <ul class=\"com-tablet-point\">\n            <li class=\"com-tablet-levels\">\n                <span class=\"com-tablet-circle\">\n                    16\n                </span>\n                <p class=\"com-tablet-disc\">\n                    <span class=\"com-tablet-disc-title\" " +data.weaveAttr+ "='troopjs-ef/blurb/widget' data-blurb-id='511880' data-text-en='16 levels'></span>\n                    <br />\n                    <span " +data.weaveAttr+ "='troopjs-ef/blurb/widget' data-blurb-id='511881' data-text-en='of interactive course lessons'></span> \n                </p>\n            </li>\n            <li class=\"com-tablet-levels\">\n                <span class=\"com-tablet-circle com-tablet-circle-s\">\n                    24/7\n                </span>\n                <p class=\"com-tablet-disc\">\n                    <span class=\"com-tablet-disc-title\" " +data.weaveAttr+ "='troopjs-ef/blurb/widget' data-blurb-id='511882' data-text-en='24/7 Access'></span>\n                    <br />\n                    <span " +data.weaveAttr+ "='troopjs-ef/blurb/widget' data-blurb-id='511883' data-text-en='to skilled English teachers'></span> \n                </p>\n            </li>\n            <li class=\"com-tablet-levels\">\n                <span class=\"com-tablet-circle com-tablet-circle-s\">\n                    100 <span class=\"com-tablet-s\">%</span>\n                </span>\n                <p class=\"com-tablet-disc\">\n                    <span class=\"com-tablet-disc-title\" " +data.weaveAttr+ "='troopjs-ef/blurb/widget' data-blurb-id='511884' data-text-en='100% Portable learning'></span>\n                    <br />\n                    <span " +data.weaveAttr+ "='troopjs-ef/blurb/widget' data-blurb-id='511885' data-text-en='online or offline'></span> \n                </p>\n            </li>\n        </ul>\n        <button class=\"com-tablet-not-now\" data-action=\"close\" " +data.weaveAttr+ "='troopjs-ef/blurb/widget' data-blurb-id='511886' data-text-en='NOT NOW, TAKE ME TO THE WEBSITE'>\n        </button>\n    </div>\n</div>"; return o; }; });
define('common-ui-shared/widget/tablet-notification/main',["troopjs-ef/component/widget",
        "troopjs-browser/loom/config",
        "template!./tablet-notification.html",
        "common-ui-shared/utils/browser-check",
        "Cookies"
        ], function(Widget, LoomConfig, tTabletGuide, browserCheck, Cookies){

    var $ELEMENT = '$element';

    var CCL_ENABLE = "ccl!'school.tablet.appsdownload.enable'";
    var CCL_IPAD = "ccl!'school.ipad.product'";
    var CCL_ANDROID = "ccl!'school.android.product'";
    var CCL_IPAD_LINK = "ccl!'school.ipad.product.appstore.url'";
    var CCL_ANDROID_LINK = "ccl!'school.android.product.appstore.url'";

    var COOKIE_NOTIFICATION = "Tablet_Notification";
    
    return Widget.extend(function($element, path, version){
        this[$ELEMENT] = $element;
        this._render = false;
        this._version = version || 'englishtown';
    },{
        'sig/start' : function(){
            var me = this;
            return me.query(CCL_ENABLE, CCL_IPAD, CCL_ANDROID, CCL_IPAD_LINK, CCL_ANDROID_LINK)
                .spread(function(cclEnable, cclIpad, cclAndroid, cclIpadLink, cclAndroidLink){
                    me._enable = !!cclEnable && cclEnable.value === "true";
                    me._ipad = !!cclIpad && cclIpad.value === "englishtown";
                    me._android = !!cclAndroid && cclAndroid.value === "englishtown";
                    me._ipadLink = cclIpadLink && cclIpadLink.value;
                    me._androidLink = cclAndroidLink && cclAndroidLink.value;
                    return [me.publish("tablet-notification/show")];
                });
        },
        "hub/tablet-notification/show" : function browserUpgradeShow(topic){
            var me = this;
            var cookieValue = Cookies.get(COOKIE_NOTIFICATION);
            if( me._enable &&
                ((me._ipad && me._ipadLink) || (me._android && me._androidLink)) &&
                browserCheck.device === "tablet" &&
                cookieValue !== "false"){
                if(!me._render){
                    //render the full screen cover
                    return me.html(tTabletGuide,
                        {
                            weaveAttr : LoomConfig.weave,
                            os : browserCheck.os,
                            ipadLink : me._ipadLink,
                            androidLink : me._androidLink,
                            version: me._version
                        })
                        .spread(function(){
                            return [me[$ELEMENT].fadeIn().promise()];
                        });
                }
                else{
                    return me[$ELEMENT].fadeIn().promise();
                }
            }
        },
        "hub/tablet-notification/hide" : function browserUpgradeHide(){
            this[$ELEMENT].fadeOut();
        },
        "dom:[data-action='close']/click" : function(){
            this.publish("tablet-notification/hide");
            Cookies.set(COOKIE_NOTIFICATION, "false");
        }
    });
});
