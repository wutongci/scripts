define(["troopjs-core/component/gadget",
    "jquery",
    "when"
], function(Gadget, $, when) {
    'use strict';

    return Gadget.extend(function() {}, {
        "get": function(feature) {
            var me = this;
            var deferred = when.defer();
            if (!feature) {
                deferred.reject();
            }
            // Get credit data by eTroop
            me.publish("query", ["evcmember!current"]).spread(function(data) {
                if (!data || !data.features || !data.courseInfo) {
                    deferred.reject();
                }
                // Generate a new object to resolve
                var courseInfo = data.courseInfo;
                var features = data.features;
                var memberInfo = {};
                var credit = {};

                // Read & find GL credit
                $.each(features, function(i, e) {
                    if (e.featureType.toUpperCase() === feature.toUpperCase()) {
                        credit.buyUrl = e.buyUrl;
                        credit.canAccess = e.canAccess;
                        credit.canBuyMore = e.canBuyMore;
                        credit.couponLeft = e.couponLeft;
                        credit.isUnlimitedAccess = e.isUnlimitedAccess;
                        return false;
                    }
                });

                memberInfo.courseInfo = courseInfo;
                memberInfo.credit = credit;

                // Resolve generated credit
                deferred.resolve(memberInfo);
            });
            // Return a promise
            return deferred.promise;
        }
    });
});
