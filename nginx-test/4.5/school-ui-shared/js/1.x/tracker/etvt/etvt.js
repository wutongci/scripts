define(['../sandbox/main', 'troopjs-utils/deferred'], function EtvtWrapperModule(gollum, Deferred){
	"use strict";
	
	var ret = {
		send: function(url){
			gollum.exec(function(url){
				if (!window.visitTrack){
					return;
				}

				window.visitTrack(url);
			}, url);
		}
	};

	return ret;
});
