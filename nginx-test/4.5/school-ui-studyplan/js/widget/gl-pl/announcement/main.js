define(["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    'use strict';

    var htmlToggleOn = "<small><a data-action=\"toggle\" class=\"glyphicon icon-chevron-sign-down sp-evc-announcement-toggle\" style=\"display: none;\"></a></small>";
    var htmlToggleOff = "<small><a data-action=\"toggle\" class=\"glyphicon icon-chevron-sign-up sp-evc-announcement-toggle\"></a></small>";
    var SELECTOR_TITLE = ".sp-evc-announcement-title";
    var SELECTOR_CONTENT = ".sp-evc-announcement-content";

    return Widget.extend({
        "render": function(data) {
            var me = this;
            var $me = me.$element;
            if (!data) {
                return;
            }
            // Templating
            me.html(template, data).then(function(){
                var $title = $me.find(SELECTOR_TITLE);
                if($title.length <= 0){
                    return;
                }
                $title.append(htmlToggleOn).append(htmlToggleOff);
            });
        },
        "dom:[data-action=toggle]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;
            var $e = $(e.currentTarget);
            var $content = $me.find(SELECTOR_CONTENT);
            if ($content.length <= 0) {
                return;
            }
            $content.toggle("slow");
            $me.find("[data-action=toggle]").toggle();
        }
    });
});
