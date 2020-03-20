/**
 * Shared sandbox(gollum) instance
 */
define(['gollum'], function(Gollum){
	"use strict";

	var PATH_SCODE = '/school/tracking/e12.aspx';

	var gollum = new Gollum({
        url: PATH_SCODE
    });

    return gollum;
});
