define(["./main",
	"jquery",
	"school-ui-studyplan/utils/client-storage",
	"template!./index.html"
], function (StatusBarBase, $, clientStorage, template) {
	'use strict';

	var SEL_CONTAINER = ".evc-studyplan-status-optional-gl-container";

	return StatusBarBase.extend({
		"hub/studyplan/evc/gl/notification": function (data) {
			var me = this;
			me.render(data);
		},
		"hub/studyplan/evc/gl/announcement/disable": function () {
			var me = this;
			me.hideSeparateLine();
		},
		"dom:[data-action = closeGLOptionalMsg]/click": function (e) {
			var me = this;
			var $el = me.$element;

			clientStorage.setLocalStorage("gl_tips", "closed");
			$el.find(SEL_CONTAINER).remove();
			me.hideSeparateLine();
		}
	});
});
