/**
 * TTS translator module definition
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "troopjs-utils/deferred",
    "template!./translator.html",
    "template!./translation.html",
    "template!./notebook.html",
    "template!./bing.html",
    "./lang-helper"
], function TTSTranslatorModule($, Widget, Deferred, tTranslator, tTranslation, tNotebook, tBing, LangHelper) {
    "use strict";
    var $ELEMENT = "$element";

    var SPACE = " ",
        DOT = ".",
        NULL = null,
        LANG_EN = "en",
        DEFAULT_WORDGROUP_NAME = "from translator";

    // ref URL: http://msdn.microsoft.com/en-us/library/ff512402.aspx
    var BING_TRANSLATOR_URL = "//api.microsofttranslator.com/V2/Ajax.svc/GetTranslations";

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

    /*!
     * widget data key
     */
    var CULTURE_CODE = "_cultureCode",
        BING_LANG_FROM = "_bingLangFrom",
        BING_LANG_TO = "_bingLangTo";

    function init(deferred) {
        var me = this;
        toggleFoot.call(me, false, false);

        deferred = deferred || Deferred();
        if(me._inited) {
            deferred.resolve();
            return;
        }

        Deferred(function deferredQuery(dfdQuery) {
            var q = QUERY_TOOLKIT_CONTEXT;
            me.query(q, dfdQuery);
        })
        .done(function doneQuery(result) {
            if(result) {
                me.publish(TOPIC_SET_TTS_URL, result.speechServerUrl);
                me._languageList = result.lngs || [];
            }
            me._inited = true;
            deferred.resolve();
        })
        .fail(function failCall() {
            me._inited = false;
            deferred.reject();
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

    function renderNotebook(deferred, wordText) {
        var me = this;
        //Save for add to notebook
        me._wordText = wordText;
        deferred = deferred || Deferred();
        deferred.done(function doneCall() {
            toggleFoot.call(me, true, false);
        });
        if(me._notebookRendered) {
            deferred.resolve();
            return;
        }

        me._notebookRendered = true;
        Deferred(function deferredCall(dfd) {
            loadWordGroup.call(me, dfd);
        })
        .done(function doneCall(wordGroups) {
            var data = {
                "wordGroups": wordGroups || [],
                "enableTranslatorDetail": me[$ELEMENT].data("enableTranslatorDetail")
            };
            me[$ELEMENT]
                .find(SEL_NOTEBOOK)
                .html(tNotebook(data))
                .find("*")
                .weave(deferred);
        })
        .fail(function failCall() {
            me._notebookRendered = false;
            deferred.reject();
        });
    }

    function loadWordGroup(deferred) {
        var me = this;
        Deferred(function deferredQuery(dfdQuery) {
            me.query(QUERY_NOTEBOOK_WORDGROUP, dfdQuery);
        })
        .done(function doneQuery(wordGroup) {
            var result = wordGroup && wordGroup.result;
            if(result && result.length > 0) {
                deferred.resolve(result);
            } else {
                Deferred(function dfdUpdate(dfd) {
                    var data = {
                        "groupName": DEFAULT_WORDGROUP_NAME
                    };
                    me.publish(TOPIC_ADD_USER_WORDGROUP, data, dfd);
                })
                .done(function doneUpdate(added) {
                    added = added && (added[0] || added);
                    if(added && added.isSuccess) {
                        result = [{
                            "wordGroup_id": added.result,
                            "wordGroupName": DEFAULT_WORDGROUP_NAME
                        }];
                        deferred.resolve(result);
                    } else {
                        deferred.reject();
                    }
                });
            }
        })
        .fail(function failQuery() {
            deferred.reject();
        });
    }

    function toggleWordGroup(show) {
        this[$ELEMENT]
            .find(SEL_WORDGROUP)
            .toggleClass(CLS_EXPANDED, show);
    }

    function renderBing(deferred) {
        var me = this;
        deferred = deferred || Deferred();
        deferred.done(function doneCall() {
            toggleFoot.call(me, true, true);
        });
        if(me._bingRendered) {
            deferred.resolve();
            return;
        }

        me._bingRendered = true;
        Deferred(function deferredQuery(dfdQuery) {
            if(me._languageList) {
                dfdQuery.resolve({"lngs": me._languageList});
                return;
            }
            var q = QUERY_TOOLKIT_CONTEXT;
            me.query(q, dfdQuery);
        })
        .done(function doneQuery(result) {
            var data = {
                "languageList": (result || {}).lngs || []
            };
            me[$ELEMENT]
                .find(SEL_BING)
                .html(tBing(data))
                .find("*")
                .weave(deferred);
        })
        .fail(function failQuery() {
            me._bingRendered = false;
            deferred.reject();
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
        var showMessage = function(success) {
            $notebook
                .find(SEL_NOTEBOOK_MSG + DOT + (success ? CLS_DONE : CLS_FAIL))
                .stop(true, true)
                .show()
                .delay(1000)
                .fadeOut(2000);
        };

        toggleWordGroup.call(me, false);

        Deferred(function deferredUpdate(dfdUpdate) {
            var data = {
                "wordGroup_id": wordGroupId,
                "wordTexts": [ wordText || me._text ]
            };
            me.publish(TOPIC_ADD_WORDS_TO_USER_WORDGROUP, data, dfdUpdate);
        })
        .done(function doneUpdate(added) {
            added = added && (added[0] || added);
            if(added && added.isSuccess) {
                showMessage.call(me, true);
            } else {
                showMessage.call(me, false);
            }
        })
        .fail(function failUpdate() {
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
    function translate(text, from, to, deferred) {
        var me = this;

        deferred = deferred || Deferred();
        Deferred(function deferredCall(dfd) {
            translateByBing.call(me, text, from, to, dfd);
        })
        .done(function doneCall() {
            deferred.resolve();
        })
        .fail(function failCall() {
            translateByEF.call(me, text, deferred);
        });
    }

    function translateByBing(text, from, to, deferred) {
        var me = this;
        Deferred(function deferredQueryToken(dfdQueryToken) {
            me.query(QUERY_TOOLKIT_CONTEXT, dfdQueryToken);
        }).done(function doneQueryToken(contextResult) {
            to = me[BING_LANG_TO] || to;
            var url = [
                BING_TRANSLATOR_URL + "?appId=Bearer+" + encodeURIComponent(contextResult.bingApiToken),
                "text=" + encodeURIComponent(text),
                "from=" + from,
                "to=" + to,
                "maxTranslations=5"
            ].join("&");

            var options = {
                "type": "GET",
                "url": url,
                "cache": true,
                "dataType": "jsonp",
                "jsonp": "oncomplete"
            };

            Deferred(function deferredQueryTranslate(dfdQueryTranslate) {
                me.publish("ajax", options, dfdQueryTranslate);
            }).done(function doneQueryTranslate(result) {
                var langFrom = me[BING_LANG_FROM] = (result && result.From) || "";
                //if is en & without space & without num , we use ef tts
                if(!result || ( langFrom === LANG_EN && !/\s/.test(text) && !/\d/.test(text) )) {
                    deferred.reject();
                } else {
                    var translatedText = "";
                    if(result.Translations && result.Translations.length > 0) {
                        translatedText = result.Translations[0].TranslatedText;
                    }
                    var english = to === LANG_EN ? translatedText : (langFrom === LANG_EN ? text : "");
                    if(english) {
                        setEnglish.call(me, english);
                    }
                    renderTranslation.call(me, encodeHtml(translatedText));
                    renderBing.call(me);
                    deferred.resolve();
                }
            }).fail(function failQuery() {
                deferred.reject();
            });
        }).fail(function failQuery() {
            deferred.reject();
        });
    }

    function translateByEF(text, deferred) {
        var me = this, regEn = /^([a-zA-Z`,.])+$/gim;
        //just pass pure letter
        if(regEn.test($.trim(text))){
            Deferred(function deferredQuery(dfdQuery) {
                var q = QUERY_PREFIX_TOOLKIT_TRANSLATION + '"' + text + '"';
                me.query(q, dfdQuery);
            })
            .done(function doneQuery(translation) {
                if(translation && translation.isFound) {
                    var result = (translation.result || [])[0] || {};
                    var wordText = result.wordText;
                    result.wordText = encodeHtml(wordText);

                    var data = {
                        "isEnglish": (me[CULTURE_CODE] || LANG_EN) === LANG_EN,
                        "result": result
                    };
                    setEnglish.call(me, wordText || text);
                    renderTranslation.call(me, tTranslation(data));
                    renderNotebook.call(me, Deferred(), wordText);
                    deferred.resolve();
                } else {
                    renderTranslation.call(me, NULL);
                    deferred.reject();
                }
            })
            .fail(function failQuery() {
                renderTranslation.call(me, NULL);
                deferred.reject();
            });            
        }
        else{
            renderTranslation.call(me, NULL);
            deferred.reject();
        }

    }

    function renderTranslation(translation) {
        var me = this;
        if(translation === NULL) {
            Deferred(function deferredCall(dfd) {
                me.publish(TOPIC_GET_TRANSLATION_ERROR, dfd);
            })
            .done(function doneCall(errorMessage) {
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
        "sig/initialize": function onInit(signal, deferred) {
            this.html(tTranslator, deferred);
        },

        "hub/tts/translator/reset": function onReset(topic) {
            reset.call(this);
        },

        "hub/tts/translator/translate": function onTranslate(topic, text, cultureCode, deferred) {
            deferred = deferred || Deferred();
            var me = this;
            var from = me[BING_LANG_FROM] = "",
                to = me[BING_LANG_TO] || LANG_EN;

            me._text = text;
            me[CULTURE_CODE] = cultureCode;

            toggleTranslating.call(me, true);
            deferred.always(function alwaysCall() {
                toggleTranslating.call(me, false);
            });

            Deferred(function deferredCall(dfd) {
                init.call(me, dfd);
            })
            .done(function doneCall() {
                translate.call(me, me._text, from, to, deferred);
            })
            .fail(function failCall() {
                deferred.reject();
            });
        },

        "dom/action.click": $.noop,

        "dom/action/notebook/toggle/wordgroup": function onToggleWordGroup(topic, $event) {
            toggleWordGroup.call(this);
        },

        "dom/action/notebook/add/word": function onAddWord(topic, $event, wordGroupId) {
            var me = this;
            addWordToWordGroup.call(me, wordGroupId, me._wordText);
            //send useraction tracking
            me.publish("tracking/useraction", {
                "action.translateAddtoNotebook" : "1"
            });
        },

        "dom/action/open/translator": function onOpenTranslator(topic, $event) {
            this.publish(TOPIC_OPEN_TRANSLATOR);
        },

        "dom/action/bing/toggle/lang": function onBingToggleLang(topic, $event) {
            toggleLanguage.call(this);
        },

        "dom/action/bing/translate": function onBingTranslate(topic, $event, langCode) {
            var me = this,
                from = me[BING_LANG_FROM] || "",
                to = me[BING_LANG_TO] = LangHelper.getBingLangByEFLang(langCode);

            var $lang = $($event.target);
            if(!$lang.hasClass(CLS_SELECTED)) {
                $lang.parent().find(DOT + CLS_SELECTED).removeClass(CLS_SELECTED);
                $lang.addClass(CLS_SELECTED);
            }

            toggleLanguage.call(me, false);
            toggleTranslating.call(me, true);
            Deferred(function deferredCall(dfd) {
                translate.call(me, me._text, from, to, dfd);
            })
            .always(function alwaysCall() {
                toggleTranslating.call(me, false);
            });
        }
    });
});
