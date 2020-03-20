define(["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    'use strict';

    return Widget.extend({
        "render": function(data){
            var me = this;
            if (!data) {
                return;
            }
            me.append(template, data);
        },
        "hideSeparateLine": function() {
            var me = this;
            var $me = me.$element;
            var $hr = $me.find("hr").eq(0);
            if ($hr.length > 0) {
                $hr.hide();
            }
        }
    });
});
