/**
 * TTS translator module definition
 */
define([
	"jquery",
	"when",
	'logger',
	"troopjs-ef/component/widget",
	"template!./translator.html",
	"template!./translation.html",
	"template!./notebook.html",
	"template!./bing.html",
	"./lang-helper"
], function TTSTranslatorModule(
	$,
	when,
	Logger,
	Widget,
	tTranslator,
	tTranslation,
	tNotebook,
	tBing,
	LangHelper
) {
	"use strict";
	var $ELEMENT = "$element";

	var DOT = ".",
		NULL = null,
		LANG_EN = "en",
		DEFAULT_WORDGROUP_NAME = "from translator";

	var CLS_SELECTED = "ets-selected",
		CLS_EXPANDED = "ets-expanded",
		CLS_LOADING = "ets-loading",
		CLS_NONE = "ets-none",
		CLS_BING = "ets-bing",
		CLS_DONE = "ets-done",
		CLS_FAIL = "ets-fail";

	var SEL_TRANSLATION = ".ets-ui-tts-translation",
		SEL_TRANSLATOR_FOOT = ".ets-ui-tts-translator-ft",
		SEL_NOTEBOOK = ".ets-ui-tts-notebook",
		SEL_WORDGROUP = ".ets-ui-tts-wordgroup",
		SEL_NOTEBOOK_MSG = ".ets-ui-tts-notebook-msg",
		SEL_BING = ".ets-ui-tts-bing",
		SEL_BING_LANG = ".ets-ui-tts-bing-lang";

	var TOPIC_ADD_USER_WORDGROUP = "school/notebook/AddUserWordGroup",
		TOPIC_ADD_WORDS_TO_USER_WORDGROUP = "school/notebook/AddWordsToUserWordGroup",
		TOPIC_SET_TTS_URL = "tts/set/url",
		TOPIC_SET_ENGLISH = "tts/set/english",
		TOPIC_GET_TRANSLATION_ERROR = "tts/get/translation/error",
		TOPIC_OPEN_TRANSLATOR = "tts/open/translator";

	var QUERY_TOOLKIT_CONTEXT = "toolkit_context!current",
		QUERY_NOTEBOOK_WORDGROUP = "notebook_wordgroup!current",
		QUERY_PREFIX_TOOLKIT_TRANSLATION = "toolkit_translation!";

	var MAX_LOG_TEXT_LEN = 30;

	/*!
	 * widget data key
	 */
	var CULTURE_CODE = "_cultureCode",
		BING_LANG_TO = "_bingLangTo";

	function init() {
		var me = this;
		toggleFoot.call(me, false, false);

		if (me._inited) {
			return when.resolve();
		}

		return me.query(QUERY_TOOLKIT_CONTEXT)
			.spread(function doneQuery(result) {
				if (result) {
					me.publish(TOPIC_SET_TTS_URL, result.speechServerUrl);
					me._languageList = result.lngs || [];
				}
				me._inited = true;
			}, function failCall() {
				me._inited = false;
			});
	}

	function reset() {
		var me = this;
		me[$ELEMENT]
			.find(SEL_NOTEBOOK_MSG)
			.stop(true, true)
			.hide();

		toggleWordGroup.call(me, false);
		toggleLanguage.call(me, false);
	}

	function toggleFoot(show, bing) {
		this[$ELEMENT]
			.find(SEL_TRANSLATOR_FOOT)
			.toggleClass(CLS_NONE, !show)
			.toggleClass(CLS_BING, !!bing);
	}

	function renderNotebook(wordText) {
		var me = this;
		//Save for add to notebook
		me._wordText = wordText;
		return when.resolve()
			.then(function () {
				if (me._notebookRendered) {
					return;
				}

				me._notebookRendered = true;
				return loadWordGroup.call(me)
					.then(function doneCall(wordGroups) {
						var data = {
							"wordGroups": wordGroups || [],
							"enableTranslatorDetail": me[$ELEMENT].data("enableTranslatorDetail")
						};
						return me[$ELEMENT]
							.find(SEL_NOTEBOOK)
							.html(tNotebook(data))
							.find("*")
							.weave();
					}, function failCall() {
						me._notebookRendered = false;
					});
			})
			.then(function () {
				toggleFoot.call(me, true, false);
			});
	}

	function loadWordGroup() {
		var me = this;
		return me.query(QUERY_NOTEBOOK_WORDGROUP)
			.spread(function doneQuery(wordGroup) {
				var result = wordGroup && wordGroup.result;
				if (result && result.length > 0) {
					return result;
				} else {
					var data = {
						"groupName": DEFAULT_WORDGROUP_NAME
					};
					return me.publish(TOPIC_ADD_USER_WORDGROUP, data)
						.spread(function doneUpdate(added) {
							added = added && (added[0] || added);
							if (added && added.isSuccess) {
								result = [{
									"wordGroup_id": added.result,
									"wordGroupName": DEFAULT_WORDGROUP_NAME
								}];
								return result;
							} else {
								throw new Error('cannot load word group');
							}
						});
				}
			});
	}

	function toggleWordGroup(show) {
		this[$ELEMENT]
			.find(SEL_WORDGROUP)
			.toggleClass(CLS_EXPANDED, show);
	}

	function renderBing() {
		var me = this;

		return when.resolve()
			.then(function () {
				if (me._bingRendered) {
					return;
				}

				me._bingRendered = true;
				return when.resolve()
					.then(function () {
						if (me._languageList) {
							return { "lngs": me._languageList };
						}
						return me.query(QUERY_TOOLKIT_CONTEXT).spread(function (result) {
							return result;
						});
					})
					.then(function doneQuery(result) {
						var data = {
							"languageList": (result || {}).lngs || []
						};
						return me[$ELEMENT]
							.find(SEL_BING)
							.html(tBing(data))
							.find("*")
							.weave();
					}, function failQuery() {
						me._bingRendered = false;
					});
			})
			.then(function () {
				toggleFoot.call(me, true, true);
			});
	}

	function toggleLanguage(show) {
		this[$ELEMENT]
			.find(SEL_BING_LANG)
			.toggleClass(CLS_EXPANDED, show);
	}

	function addWordToWordGroup(wordGroupId, wordText) {
		var me = this;
		var $notebook = me[$ELEMENT].find(SEL_NOTEBOOK);
		var showMessage = function (success) {
			$notebook
				.find(SEL_NOTEBOOK_MSG + DOT + (success ? CLS_DONE : CLS_FAIL))
				.stop(true, true)
				.show()
				.delay(1000)
				.fadeOut(2000);
		};

		toggleWordGroup.call(me, false);

		var data = {
			"wordGroup_id": wordGroupId,
			"wordTexts": [wordText || me._text]
		};
		me.publish(TOPIC_ADD_WORDS_TO_USER_WORDGROUP, data)
			.spread(function doneUpdate(added) {
				added = added && (added[0] || added);
				if (added && added.isSuccess) {
					showMessage.call(me, true);
				} else {
					showMessage.call(me, false);
				}
			}, function failUpdate() {
				showMessage.call(me, false);
			});
	}

	function toggleTranslating(translating) {
		this[$ELEMENT].toggleClass(CLS_LOADING, translating);
	}

	/*!
	 * translate text
	 *
	 * @param {String} text
	 * @param {String} from, from bing lang code
	 * @param {String} to, to bing lang code
	 * @param {Object} deferred
	 * @return {void}
	 */
	function translate(text, to) {
		var me = this;

		return translateByBing.call(me, text, to)
			.catch(function failCall() {
				return translateByEF.call(me, text);
			});
	}

	function translateByBing(text, to) {
		var me = this;
		var isEnglish = me[CULTURE_CODE] === LANG_EN;
		//if is en & without space & without num , we use ef tts
		if(isEnglish && !/\s/.test(text) && !/\d/.test(text)){
			return when.reject(new Error('translate with ef tts'));
		}
		to = me[BING_LANG_TO] || to;
		logBingTTS(text, me[CULTURE_CODE], to);
		return me.query(QUERY_TOOLKIT_CONTEXT)
			.spread(function doneQueryToken(contextResult) {
				var url = [
					contextResult.translateTextAPIUrl + "?appid=Bearer " + encodeURIComponent(contextResult.AzureApiToken),
					"text=" + encodeURIComponent(text),
					"to=" + to
				].join("&");

				var options = {
					"type": "GET",
					"url": url,
					"cache": true
				};

				return $.ajax(options);
			})
			.then(function doneQueryTranslate(result) {
				if (!result) {
					throw new Error('cannot translate with bing');
				} else {
					var translatedText = $(result).find('string').text();
					var english = to === LANG_EN ? translatedText : (isEnglish ? text : "");
					if (english) {
						setEnglish.call(me, english);
					}
					renderTranslation.call(me, encodeHtml(translatedText));
					renderBing.call(me);
				}
			});
	}

	function logBingTTS(text, sourceLang, targetLang) {
		var partialText = text.substr(0, MAX_LOG_TEXT_LEN);
		Logger.log('BingTTS chars=' + text.length + ' sourceLang=' + sourceLang + ' targetLang=' + targetLang + ' text=' + partialText);
	}

	function translateByEF(text) {
		var me = this, regEn = /^([a-zA-Z`,.])+$/gim;
		//just pass pure letter
		if (regEn.test($.trim(text))) {
			return me.query(QUERY_PREFIX_TOOLKIT_TRANSLATION + '"' + text + '"')
				.catch(function (e) {
					renderTranslation.call(me, NULL);
					throw new Error('translate by ef error: ' + e);
				})
				.spread(function doneQuery(translation) {
					if (translation && translation.isFound) {
						var result = (translation.result || [])[0] || {};
						var wordText = result.wordText;
						result.wordText = encodeHtml(wordText);

						var data = {
							"isEnglish": (me[CULTURE_CODE] || LANG_EN) === LANG_EN,
							"result": result
						};
						setEnglish.call(me, wordText || text);
						renderTranslation.call(me, tTranslation(data));
						renderNotebook.call(me, wordText);
					} else {
						renderTranslation.call(me, NULL);
						return when.reject(new Error('cannot translate by ef'));
					}
				});
		}
		else {
			renderTranslation.call(me, NULL);
			return when.reject(new Error('cannot translate by ef'));
		}
	}

	function renderTranslation(translation) {
		var me = this;
		if (translation === NULL) {
			me.publish(TOPIC_GET_TRANSLATION_ERROR)
				.then(function doneCall(errorMessage) {
					translation = errorMessage;
				});
		}
		me[$ELEMENT]
			.find(SEL_TRANSLATION)
			.html(translation);
	}

	function setEnglish(english) {
		this.publish(TOPIC_SET_ENGLISH, english);
	}

	function encodeHtml(text) {
		return ("" + text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	return Widget.extend({
		"sig/initialize": function onInit() {
			return this.html(tTranslator);
		},

		"hub/tts/translator/reset": function onReset() {
			reset.call(this);
		},

		"hub/tts/translator/translate": function onTranslate(text, cultureCode) {
			var me = this;
			var to = me[BING_LANG_TO] || LANG_EN;

			me._text = text;
			me[CULTURE_CODE] = cultureCode;

			toggleTranslating.call(me, true);
			return init.call(me)
				.then(function doneCall() {
					return translate.call(me, me._text, to);
				})
				.ensure(function alwaysCall() {
					toggleTranslating.call(me, false);
				});
		},

		"dom:.ets-ui-tts-toggle-wordgroup/click": function onToggleWordGroup() {
			toggleWordGroup.call(this);
		},

		"dom:.ets-ui-tts-add-word/click": function onAddWord($event) {
			var me = this;
			var $elem = $($event.currentTarget);
			addWordToWordGroup.call(me, $elem.data('wordGroupId'), me._wordText);
			//send useraction tracking
			me.publish("tracking/useraction", {
				"action.translateAddtoNotebook": "1"
			});
		},

		"dom:.ets-ui-tts-detail-btn/click": function onOpenTranslator() {
			this.publish(TOPIC_OPEN_TRANSLATOR);
		},

		"dom:.ets-ui-tts-bing-tip/click": function onBingToggleLang() {
			toggleLanguage.call(this);
		},

		"dom:.ets-ui-tts-bing-translate/click": function onBingTranslate($event) {
			var me = this;
			var $lang = $($event.currentTarget);
			var to = me[BING_LANG_TO] = LangHelper.getBingLangByEFLang($lang.data('langCode'));

			if (!$lang.hasClass(CLS_SELECTED)) {
				$lang.parent().find(DOT + CLS_SELECTED).removeClass(CLS_SELECTED);
				$lang.addClass(CLS_SELECTED);
			}

			toggleLanguage.call(me, false);
			toggleTranslating.call(me, true);
			translate.call(me, me._text, to)
				.ensure(function alwaysCall() {
					toggleTranslating.call(me, false);
				});
		}
	});
});
