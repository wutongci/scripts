define([
    "when",
    "jquery.gudstrap",
    "troopjs-ef/component/widget",
    "template!./alert-box.html"
    ],function(when, $GUD, Widget, tModalBox){
    "use strict";

    var SEL_MODAL_ROOT = ".alert-modal-box";
    var SEL_MODAL_TITLE = ".modal-title";
    var SEL_MODAL_BODY = ".modal-body p";
    var SEL_BACK_DROP = ".modal-backdrop";

    var DEFERRED_OK = "_defer_ok";

    var CLS_GUD_HIDDEN = "hidden";

    return Widget.extend({   
        "sig/start": function() {
            var me = this;
            
            return me.html(tModalBox).then(function(){
                var $el = me.$element;

                me.$root = $el.find(SEL_MODAL_ROOT);
                me.$title = $el.find(SEL_MODAL_TITLE);
                me.$body = $el.find(SEL_MODAL_BODY);
                me.$backdrop = $el.find(SEL_BACK_DROP);

                me.$root.on('show.bs.modal', function($event) {
                    me.$backdrop.removeClass(CLS_GUD_HIDDEN);
                }).on('hidden.bs.modal', function($event) {
                    me.$backdrop.addClass(CLS_GUD_HIDDEN);
                    me.isBusy = false;
                    //reject the promise
                    me[DEFERRED_OK] && me[DEFERRED_OK].reject("confirm-box reject");
                });
            });
        },
        "hub/enable/show/alert-box": function() {
            return [!this.isBusy];
        },
        "hub/show/alert-modal-box": function(config) {
            var me = this;
            if(!config) return when.reject("alert-box no config");

            me.isBusy = true;
            me.$title.text(config.title);
            me.$body.html(config.body);

            me.$root.modal();

            return (me[DEFERRED_OK] = when.defer()).promise;
        },
        "dom:[data-action='ok']/click": function (event){
            var me = this;
            var defer = me[DEFERRED_OK];
            if(defer){
                defer.resolver.resolve({
                    $title : me.$title,
                    $body  : me.$body
                });
                defer.promise.then(function(){
                    me.$root.modal("hide");
                });
            }
        }
    });
});
