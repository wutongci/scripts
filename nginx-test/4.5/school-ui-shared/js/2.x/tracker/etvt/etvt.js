define([
	'../sandbox/main'
], function EtvtWrapperModule(gollum){
	"use strict";

	return {
		send: function(url){
			gollum.exec(function(url){
				if (!window.visitTrack){
					return;
				}

				window.visitTrack(url);
			}, url);
		}
	};
});
