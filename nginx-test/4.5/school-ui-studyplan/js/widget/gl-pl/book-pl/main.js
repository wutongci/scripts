define(["troopjs-ef/component/widget",
    "jquery",
    "../credit/service",
    "school-ui-studyplan/enum/studyplan-item-typecode",
    "template!./index.html"
], function(Widget, $, Credit, spItemTypeCode, template) {
    "use strict";

    var PL_BOOK_URL = "/school/evc/pl/unitaligned";
    var KEY = "SP";

    return Widget.extend(function($element, widgetName, unitId, spTypeCode) {
        var me = this;
        // get parameters
        me.unitId = unitId;
        me.spTypeCode = spTypeCode;
    }, {
        "sig/start": function() {
            var me = this;

            if (!me.unitId) {
                return;
            }

            me.query("evc_url_resource!current").spread(function(data){
                var isPL20 = Boolean(me.spTypeCode === spItemTypeCode.pl20);

                var tempData = {};
                tempData.bookUrl =
                    (isPL20 ? data.studyPlanUrls.SPPL20Booking : data.studyPlanUrls.SPPL40Booking)
                    .replace("{unitid}", me.unitId)
                    .replace("{source}", window.encodeURIComponent(window.location.href));

                new Credit().get(isPL20 ? "PL20" : "PL").then(function(dataCredit) {
                    if (!dataCredit) {
                        return;
                    }
                    tempData.credit = dataCredit.credit;
                    me.html(template, tempData);
                });
            });

        }
    });
});
