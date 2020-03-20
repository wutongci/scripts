define([
    "troopjs-ef/component/widget",
    "when",
    "jquery",
    "school-ui-studyplan/module",
    "school-ui-shared/utils/console",
    "template!./booked.html"
], function(Widget, when, $, module, Console, template) {

	var MODULE_CONFIG = $.extend(true, {
		useLegacyUnitId: true
	}, module.config() || {});

    var STATUS_BOOKED = "booked";

    var UNIT_ID_KEY = MODULE_CONFIG.useLegacyUnitId ? "legacyUnitId" : "templateUnitId"

    return Widget.extend(function($element, name, item) {
        var me = this;
        me.getUnit = when.defer();

        function unitFn(unit) {
            if (!unit || !unit[UNIT_ID_KEY]) {
                return;
            }
            // Resolve unit
            me.getUnit.resolver.resolve(unit[UNIT_ID_KEY]);
            me.unsubscribe("load/unit", unitFn);
        }
        me.subscribe("load/unit", unitFn);
        me.republish("load/unit", false, unitFn);
    }, {
        "sig/start": function() {
            var me = this;

            return me.getUnit.promise.then(function(unitId) {
                return me.publish("query", ["checkpointstate!cp20;" + unitId]).spread(function success(data) {
                    if (!data || !data.statusCode) {
                        return when.reject("skip CP20 mark, CP20 status query failed.");
                    }
                    var statusCode = data.statusCode.toLowerCase();

                    if (statusCode === STATUS_BOOKED) {
                        me.html(template);
                    } else {
                        return when.reject("skip CP20 mark, CP20 not booked.");
                    }
                });
            });
        }
    });
});
