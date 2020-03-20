define([
	"troopjs-ef/component/widget",
	"template!./main.html",
], function (Widget, template) {
	var SEL_VIDEO = '.ets-pr-fb-class-video';
	var SEL_NOTES = ".ets-pr-fb-class-notes";

	return Widget.extend(function ($element, path, options) {
		this.options = options || {};
	}, {
		"sig/start": function () {
			this.$element.html(template(this.options));
			this.$element.find(SEL_VIDEO).data('options', this.options.video);
			this.$element.find(SEL_NOTES).data('notes', this.options.notes);
			return this.weave();
		}
	});
});
