define(["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    "use strict";

    function updateURLSearch(url, key, val) {
        if(!url){
            return;
        }
        var urlNew = "";
        // Get url path with query string
        if (url.indexOf("#") !== -1) {
            url = url.substr(0, url.indexOf("#"));
        }
        // Update query string
        if (url.indexOf("?") !== -1) {
            var str = url.substr(1),
                strs = str.split("&");
            for (var i = 0, l = strs.length; i < l; i++) {
                if (strs[i].split("=")[0] === key) {
                    urlNew = url.replace(strs[i].split("=")[1], val);
                }
            }
            if (!urlNew) {
                urlNew = url + "&" + key + "=" + val;
            }
        }
        if (!urlNew) {
            urlNew = url + "?" + key + "=" + val;
        }
        return urlNew;
    }

    return Widget.extend({
        "render": function onRender(dataCredit) {
            var me = this;
            if (!dataCredit) {
                return;
            }
            // update upsell url with current path
            var currentPath = location.pathname + location.search + location.hash;
            dataCredit.buyUrl = updateURLSearch(dataCredit.buyUrl, "upurl", encodeURIComponent(currentPath));
            me.html(template, dataCredit);
        },
        "generateBuyMoreUrl": function (dataCredit){
            if(!dataCredit.buyUrl){
                return;
            }
            var currentPath = location.pathname + location.search + location.hash;
            var url = updateURLSearch(dataCredit.buyUrl, "upurl", encodeURIComponent(currentPath));
            return url;
        }
    });
});
