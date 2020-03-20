define(["jquery",
    "./main",
    "./service"
], function($, CreditBase, Credit) {
    "use strict";

    var STATUS_NO_COUPON_GL = "no_coupon_gl";

    return CreditBase.extend({
        "sig/start": function() {
            var me = this;
            new Credit().get("GL").then(function(dataCredit) {
                var credit = dataCredit.credit;
                if (credit) {
                    if(!credit.isUnlimitedAccess){
                        var hasCredit = credit.couponLeft > 0 ? true : false;
                        var link;
                        if (!hasCredit) {
                            // Show notice to student on the status bar
                            if(credit.canBuyMore && credit.buyUrl){
                                link = me.generateBuyMoreUrl(credit);
                            }
                            me.publish("studyplan/evc/gl/notification", {
                                "statusCode": STATUS_NO_COUPON_GL,
                                "link": link
                            });
                        }
                        me.publish("studyplan/evc/gl/credit", hasCredit);

                        me.render(credit);
                    }
                    else{
                        me.publish("studyplan/evc/gl/credit", true);
                    }
                }
            });

        }
    });
});
