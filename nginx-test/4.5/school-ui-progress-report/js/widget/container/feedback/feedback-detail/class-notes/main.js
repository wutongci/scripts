define([
	"quill",
	"troopjs-ef/component/widget",
	"template!./class-notes.html",
], function (Quill, Widget, tClassNotes) {
	"use strict";

	var CLS_NONE = "ets-none";
	var CLS_MODAL_OPEN = "modal-open";

	var SEL_NOTES_BACKDROP = '.ets-pr-fb-class-notes-backdrop';
	var SEL_NOTES_CONTENT = '.ets-pr-fb-class-notes-content';

	var RE_NEWLINE = /\n/g;
	var NEWLINE_ESCAPE = '\\n';

	return Widget.extend({
		'sig/start': function () {
			var me = this;
			var notes = me.$element.data('notes');
			if (!notes) {
				return;
			}

			me.html(tClassNotes).then(function () {
				var notesData;

				try {
					notesData = JSON.parse(notes.replace(RE_NEWLINE, NEWLINE_ESCAPE));
				}
				catch (ex) {
					notesData = {ops: [{insert: String(notes)}]};
				}

				var quill = new Quill(me.$element.find(SEL_NOTES_CONTENT)[0], {
					readOnly: true
				});

				quill.setContents(notesData);
			});
		},

		'dom:.ets-pr-fb-btn-class-notes/click': function () {
			$(document.body).addClass(CLS_MODAL_OPEN);
			this.$element.find(SEL_NOTES_BACKDROP).removeClass(CLS_NONE);
		},

		'dom:.ets-pr-fb-class-notes-close,.ets-pr-fb-class-notes-backdrop/click': function (evt) {
			if (evt.currentTarget === evt.target) {
				$(document.body).removeClass(CLS_MODAL_OPEN);
				this.$element.find(SEL_NOTES_BACKDROP).addClass(CLS_NONE);
			}
		}
	});
});
