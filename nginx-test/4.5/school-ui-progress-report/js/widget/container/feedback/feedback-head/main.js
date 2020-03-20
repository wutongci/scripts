define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./feedback-head.html"
], function($, Widget, tFeedbackHead){
	"use strict";

	var $ELEMENT = "$element";

	return Widget.extend({
		"sig/start": function() {
			return this.html(tFeedbackHead);
		}
	});
});
