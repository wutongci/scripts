define([
    "jquery",
    "troopjs-ef/component/widget",
    "school-ui-studyplan/module",
    "template!./index.html"
], function ($, Widget, module, template) {
    "use strict";

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
	}, module.config() || {});

    var CCL_MEDIA = "ccl!'school.studyplan.pl.intro.media'";

    return Widget.extend({
        "sig/start": function() {
            var me = this;

            me.query(CCL_MEDIA).spread(function (cclMediaResult) {
                me.query(cclMediaResult.value).spread(function (data) {
                    var customizeImage = /\.jpg$|\.png$|\.gif$/i.test(data.url);
                    me.html(template, {
                        cacheServer: MODULE_CONFIG.cacheServer,
                        image: customizeImage && data.url,
                        video: !customizeImage && data.url
                    });
                });
            });
        },
        "dom:[data-action = getStart]/click": function(e) {
            e.preventDefault();
            var me = this;
            me.publish("school/member_site_setting/Save", {
                "siteArea": "evc",
                "keyCode": "FirstTimeStudyPlanPL",
                "keyValue": "true"
            }).spread(function() {
                // reload
                me.publish("studyplan/evc/pl/load");
            });
        },
        "dom:[data-action = showVideo]/click": function(e) {
            e.preventDefault();
            this.publish("studyplan/evc/welcome-video/show");
        }
    });
});
