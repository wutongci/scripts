define(["jquery",
    "./main",
    "./service"
], function($, CreditBase, Credit) {
    "use strict";

    var STATUS_NO_COUPON_PL = "no_coupon_pl";

    return CreditBase.extend({
        "sig/start": function() {
            var me = this;

            new Credit().get("PL20").then(function(dataCredit) {
                if (!dataCredit) {
                    return;
                }
                var credit = dataCredit.credit;
                var link;
                if(credit.couponLeft <= 0){
                    if(credit.canBuyMore && credit.buyUrl){
                        link = me.generateBuyMoreUrl(credit);
                    }
                    me.publish("studyplan/evc/pl/notification", {
                        "statusCode": STATUS_NO_COUPON_PL,
                        "link": link
                    });
                }
                me.render(credit);
            });
        }
    });
});
