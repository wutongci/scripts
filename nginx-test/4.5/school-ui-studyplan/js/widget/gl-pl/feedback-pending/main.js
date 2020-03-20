define(["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    "use strict";

    return Widget.extend({
        "sig/start": function() {
            var me = this;

            me.html(template);
        }
    });
});
