define([
	'school-ui-activity/activity/base/main',
	"template!./no-template.html"
], function noTemplateModule(Widget, tTemplate) {
	"use strict";

	return Widget.extend({
		"sig/initialize": function onInitialize() {
			this.items().completed(true);
		},
		"sig/render": function onRender() {
			return this.html(tTemplate);
		}
	});
});
