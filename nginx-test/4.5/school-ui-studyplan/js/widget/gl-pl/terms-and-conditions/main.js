define([
    "troopjs-ef/component/widget",
    "template!./main.html",
	"jquery.gudstrap"
], function (Widget, template) {
    return Widget.extend({
		"sig/start": function () {
            this.html(template);
        }
    });
})
