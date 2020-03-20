define([
    "when",
    "jquery",
    "moment",
    "school-ui-shared/enum/moment-language",
    "troopjs-ef/component/widget",
    "template!./index.html"
], function (when, $, Moment, momentLang, Widget, template) {
    "use strict";

    var CONTEXT_DEFER = "_context_promise";

    return Widget.extend({
        "sig/start": function () {
            this[CONTEXT_DEFER] = when.defer();
        },
        "hub:memory/context": function (context) {
            context && this[CONTEXT_DEFER].resolve([context]);
        },
        "render": function onRender(data) {
            var me = this;
            if (!data) {
                return;
            }

            me[CONTEXT_DEFER].promise.spread(function (context) {
                var moment = Moment(new Date(data.year, data.month - 1, data.day));
                moment.lang(momentLang[context.cultureCode.toLowerCase()]);
                me.html(template, {
                    url: data.url,
                    date: moment.format("LL")
                });
            });
        }
    });
});
