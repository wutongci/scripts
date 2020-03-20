define([
	'jquery',
	'school-ui-shared/module',
	'troopjs-ef/component/widget',
	'template!./export-pdf.html',
	'template!./pdf-style.html',
	'template!./submit-form.html'
], function ($, module, Widget, tExportPdf, tPdfStyle, tSubmitForm) {
	'use strict';

	var MODULE_CONFIG = $.extend({
		exportPdfUrl: "/school/StudyTools/downloads/PDF/Export"
	}, module.config());

	var $ELEMENT = '$element';
	var SEL_CONTAINER = '.ets-uo-container';
	var SEL_LEVEL_NO = '.ets-uo-level-no';
	var SEL_UNIT_NO = '.ets-uo-unit-no';
	var SEL_FORM = 'form';

	function getExportHtml() {
		var me = this;

		var $html = $('<html/>');

		var $head = $('<head/>').appendTo($html);
		$head.append(tPdfStyle());

		var $body = $('<body/>').appendTo($html);
		var $clonedContainer = me[$ELEMENT].closest(SEL_CONTAINER).clone();
		$clonedContainer.find('.ets-uo-export, .ets-uo-unit-image, .ets-uo-unit-task, .ets-uo-word-list-column-player').remove();
		$body.append($clonedContainer);

		return $html[0].outerHTML;
	}

	function getExportFileName() {
		var me = this;
		var $container = me[$ELEMENT].closest(SEL_CONTAINER);
		var levelNo = $container.find(SEL_LEVEL_NO).text();
		var unitNo = $container.find(SEL_UNIT_NO).text();
		return 'unit-overview-level' + levelNo + '-unit' + unitNo;
	}

	return Widget.extend({
		'sig/start': function () {
			return this.html(tExportPdf);
		},
		'dom:.ets-uo-export-link/click': function () {
			var me = this;
			var $form = me[$ELEMENT].children(SEL_FORM);

			if (!$form.length) {
				var submitData = {
					pdfContent: getExportHtml.call(me),
					fileName: getExportFileName.call(me),
					exportPdfUrl: MODULE_CONFIG.exportPdfUrl
				};
				$form = $(tSubmitForm(submitData)).appendTo(me[$ELEMENT]);
			}

			$form.submit();
		}
	});
});
