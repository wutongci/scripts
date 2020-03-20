define([
    "troopjs-ef/component/widget",
    "template!./locked.html"
],function(Widget, tCheck){

    return Widget.extend({
        "sig/start":function(){
            return this.html(tCheck);
        }
    });
});
