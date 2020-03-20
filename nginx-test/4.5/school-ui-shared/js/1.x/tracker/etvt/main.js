
/**
 * @class omniture tracker
 * Send omniture tracking info
 */
define(['./etvt', '../base/main'], function OmnitureTrackerModule(etvt, Widget){
	"use strict";

    return Widget.extend({
        scope: 'e12_etvt',
        _onSend: function onSend(data, track, deferred){
        	if (!track.uri){
        		return;
        	}

            // Change hash to path format, and can let back-end save data to DB.
            // After back-end framework update, will be deleted.
            etvt.send(window.location.protocol + '//' + window.location.host + window.location.pathname + (window.location.pathname.substr(window.location.pathname.length - 1) === "/" ? window.location.hash.replace('#', '') : window.location.hash.replace('#', '/')) + (window.location.search ? window.location.search : ''));

            if (deferred){
                deferred.resolve();
            }
        }
    });
});
