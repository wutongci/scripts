define(['jquery',
        'troopjs-ef/component/widget'],
    function HttpRequestHandling($, Widget) {
    'use strict';

    return Widget.extend({
        "sig/start":function onStart() {
            $(document).ajaxError(function(event,jqXHR,ajaxSettings,thrownError){
                if(jqXHR.status == 403){
                    window.location.reload();
                }
            });
        }
    });
});
