// # Activity summary

define(['jquery', 'compose', 'underscore',
    'troopjs-ef/component/widget',
    'template!./summary.html'
], function summaryModule($, Compose, _, Widget, tTemplate) {
    "use strict";

    function Ctor(el, module, settings){
        this._content = settings;
    }

    function render(){
        var me = this;

        if (!me.$element){
            return;
        }

        return me.html(tTemplate, me._content);
    }

    var methods = {
        "sig/start": function onStart() {
            return render.call(this);
        }
    };

    return Widget.extend(Ctor, methods);
});
