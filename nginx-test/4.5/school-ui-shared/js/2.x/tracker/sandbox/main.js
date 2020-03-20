/**
 * Shared sandbox(gollum) instance
 */
define(['gollum'], function (Gollum) {
	"use strict";

	var PATH_SCODE = '/school/tracking/e12.aspx';

	return new Gollum({
		url: PATH_SCODE
	});
});
