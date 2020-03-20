define([
	'when',
	'troopjs-ef/component/widget',
	"troopjs-browser/loom/config",
	'template!./container.html',
	"module"
], function (when, Widget, loom, tContainer, module) {
	'use strict';

	var MODULE_CONFIG = module.config() || {
		"showDownloadButton": true
	}

	var $ELEMENT = '$element';
	var SEL_UNIT_INFO = ".ets-uo-unit-info";
	var SEL_WORD_LIST = ".ets-uo-word-list";
	var SEL_EXPORT = ".ets-uo-export";

	var CLS_LOADING = 'ets-uo-loading';
	var SEL_LOADING = '.' + CLS_LOADING;

	var CLS_MODAL_LOADING = "ets-uo-modal-loading";
	var SEL_MODAL_LOADING = "." + CLS_MODAL_LOADING;

	var DATA_WEAVE_DELAY = 'data-weave-delay';

	function weaveDelayedWidget(selector, data) {
		var me = this;
		var $widget = me[$ELEMENT].find(selector);
		if (data) {
			$widget.data('data', data);
		}
		return $widget.attr(loom.weave, $widget.attr(DATA_WEAVE_DELAY)).weave();
	}

	function loadUnitInfo(templateUnitId) {
		var me = this;
		return me.query('student_unit!template_unit;' + templateUnitId + '.unitImage, .parent, .children').spread(function (unit) {
			return {
				level: unit.parent,
				unit: unit,
				lessons: unit.children
			};
		});
	}

	function loadWordList(templateUnitId) {
		var me = this;
		return me.query('template_course_item_word!' + templateUnitId).spread(function (wordList) {
			return {
				words: wordList && wordList.words || []
			};
		});
	}

	return Widget.extend(function (element, path, templateUnitId) {
		this._templateUnitId = templateUnitId;
		this._hideWorldList = Boolean(element.data('hideWorldList'));
	}, {
		'sig/start': function () {
			var me = this;

			var containerRender = me.html(tContainer, {
				hideWorldList: me._hideWorldList,
				showDownloadButton: MODULE_CONFIG.showDownloadButton
			});
			var unitInfoLoad = loadUnitInfo.call(me, me._templateUnitId);
			var wordListLoad = loadWordList.call(me, me._templateUnitId);

			var unitInfoRender = when.all([
				unitInfoLoad,
				containerRender
			]).spread(function (unitInfo) {
				return weaveDelayedWidget.call(me, SEL_UNIT_INFO, unitInfo);
			});

			var wordListRender = when.all([
				wordListLoad,
				containerRender
			]).spread(function (wordList) {
				return weaveDelayedWidget.call(me, SEL_WORD_LIST, wordList);
			});

			when.all([
				unitInfoRender,
				wordListRender
			]).then(function () {
				return weaveDelayedWidget.call(me, SEL_EXPORT);
			}).ensure(function () {
				me[$ELEMENT].find(SEL_LOADING).removeClass(CLS_LOADING);
				me[$ELEMENT].closest(SEL_MODAL_LOADING).removeClass(CLS_MODAL_LOADING);
			});

			return containerRender;
		}
	});
});
