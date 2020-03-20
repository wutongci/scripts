define(['jquery',
    'troopjs-core/component/widget',
    "troopjs-utils/deferred",
    "template!./screen-word.html"], function mpaMain($, Widget, Deferred, tTemplate) {
    'use strict';

    function render(deferred) {
        var me = this;
        me.html(tTemplate, me._content, deferred);
    }

    return Widget.extend(function (el, module, content) {
        var me = this;

        me._content = content;
    }, {
        'sig/initialize': function (signal, deferred) {
            var me = this;

            render.call(me, deferred);
        }
    });
});
