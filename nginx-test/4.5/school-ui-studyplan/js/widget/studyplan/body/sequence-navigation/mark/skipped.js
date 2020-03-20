define([
    "troopjs-ef/component/widget",
    "template!./skipped.html"
], function(Widget, tSkipped){
    return Widget.extend({
        "sig/start":function(){
            return this.html(tSkipped);
        }
    });
});
