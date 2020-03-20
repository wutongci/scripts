define([
	'when',
	'jquery',
	"jquery.gudstrap",
	'troopjs-ef/component/widget',
	'template!./modal-container.html'
], function (when, $, $GUD, Widget, tModalContainer) {
	'use strict';

	var $ELEMENT = '$element';
	var SEL_MODAL = ".modal";
	var SEL_MODAL_CONTENT = ".modal-content";

	return Widget.extend(function (element, path, templateUnitId) {
		this._templateUnitId = templateUnitId;
		this._hideWorldList = Boolean(element.data('hideWorldList'));
	}, {
		'sig/start': function () {
			var me = this;

			return me.html(tModalContainer).then(function () {
				var $container = $('<div></div>', {
					"data-weave": "school-ui-shared/widget/unit-overview/container/main(templateUnitId)",
					"data": {
						"templateUnitId": me._templateUnitId,
						"hideWorldList": me._hideWorldList
					}
				});

				return $container.appendTo(me[$ELEMENT].find(SEL_MODAL_CONTENT)).weave().then(function () {
					me[$ELEMENT].find(SEL_MODAL).modal({
						backdrop: 'static'
					});
				});
			});
		}
	});
});
