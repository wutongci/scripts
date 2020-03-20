define([
    "when",
    "jquery.gudstrap",
    "troopjs-ef/component/widget",
    "template!./confirm-box.html"
    ],function(when, $GUD, Widget, tModalBox){
    "use strict";

    var SEL_MODAL_ROOT = ".confirm-modal-box";
    var SEL_MODAL_TITLE = ".modal-title";
    var SEL_MODAL_BODY = ".modal-body p";
    var SEL_BACK_DROP = ".modal-backdrop";
    var SEL_CANCEL = ".btn-default";
    var SEL_CONFIRM = ".btn-primary";

    var CLS_GUD_HIDDEN = "hidden";

    var DEFERRED_CONFIRM = "confirmDfd";

    var BLURB_CANCEL = "_cancel";
    var BLURB_CONFIRM = "_confirm";


    return Widget.extend({
        "sig/start": function() {
            var me = this;

            return when([   me.query("blurb!450018", "blurb!450019"),
                            me.html(tModalBox)])
                .spread(function(blurb){
                    var $el = me.$element;
                    me[BLURB_CANCEL] = blurb[0] && blurb[0].translation;
                    me[BLURB_CONFIRM] = blurb[1] && blurb[1].translation;

                    me.$root = $el.find(SEL_MODAL_ROOT);
                    me.$title = $el.find(SEL_MODAL_TITLE);
                    me.$body = $el.find(SEL_MODAL_BODY);
                    me.$cancel = $el.find(SEL_CANCEL);
                    me.$confirm = $el.find(SEL_CONFIRM);
                    me.$backdrop = $el.find(SEL_BACK_DROP);

                    me.$root.on('show.bs.modal', function($event) {
                        me.$backdrop.removeClass(CLS_GUD_HIDDEN);
                    }).on('hidden.bs.modal', function($event) {
                        me.$backdrop.addClass(CLS_GUD_HIDDEN);
                        me.isBusy = false;
                        //reject the promise
                        me[DEFERRED_CONFIRM] && me[DEFERRED_CONFIRM].reject("confirm-box reject");
                    });
            });
        },
        "hub/enable/show/confirm-box": function() {
            return [!this.isBusy];
        },
        "hub/show/confirm-modal-box": function(config) {
            var me = this;
            if(!config) return when.reject("confirm-box no config");

            me.isBusy = true;
            me.$title.text(config.title);
            me.$body.html(config.body);
            me.$cancel.text(config.cancel ? config.cancel : me[BLURB_CANCEL]);
            me.$confirm.text(config.confirm ? config.confirm : me[BLURB_CONFIRM]);

            me.$root.modal();

            return (me[DEFERRED_CONFIRM] = when.defer()).promise;
        },
        "dom:[data-action='confirm']/click": function (event){
            var me = this;
            var defer = me[DEFERRED_CONFIRM];
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
