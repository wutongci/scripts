define([
    "troopjs-ef/component/widget",
    "template!./unavailable.html"
    ],function(Widget, tUnavailable){
    "use strict";
    return Widget.extend({
        "sig/start" : function(){
            return this.html(tUnavailable);
        }
    });
});
