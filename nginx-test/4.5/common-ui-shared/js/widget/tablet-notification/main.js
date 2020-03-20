define(["troopjs-ef/component/widget",
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
