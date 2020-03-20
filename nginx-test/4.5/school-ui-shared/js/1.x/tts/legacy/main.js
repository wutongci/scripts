/**
 * legacy TTS integration wrapper in troopjs e12
 * TODO: rewrite TTS in future in troopjs way(need frontend and backend work)
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "template!./tts.html",
    "school-ui-shared/enum/ccl",
    "school-ui-shared/utils/query-builder",
    "school-ui-shared/utils/typeid-parser"
], function LegacyTTSModule($, Widget, tTTS, CCL, QueryBuilder, TypeidParser) {
    "use strict";
    var $ELEMENT = "$element";
    var RE_CRLN = /\n|\r/g,
        MAX_SEARCH_TEXT_LENGTH = 1800;
    var EVENT_TTS_PRELAUNCH = "mousedown.legacy.tts",
        EVENT_TTS_LAUNCH = "mouseup.legacy.tts";
    var IGNORED_TAG = {
        "INPUT": 1,
        "TEXTAREA": 1
    };

    function getWindow() {
        var $element = this[$ELEMENT],
            doc = ($element && $element[0] && $element[0].ownerDocument) || {};

        return doc.defaultView || doc.parentWindow;
    }

    function loadFloatingToolkit(cacheServer, culture, siteVersion, deferred) {
        cacheServer = cacheServer || ".";
        culture = culture || "en";

        var me = this,
            url = cacheServer + "/translator/integration/Js4FloatingToolkit/?culture=" + culture
                + "&newcourseware=true&siteversion=" + siteVersion + "&LE=e12-old";
        
        function loadScript($) {
            $.ajax({
                "type": "GET",
                "url": url,
                "dataType": "script",
                "cache": true
            }).always(function() {
                deferred && deferred.resolve();
            });
        }

        // check if in iframe
        var win = getWindow.call(me);
        if(win === window) {
            loadScript($);
        } else if(win) {
            // make TTS in right context by using iframe "jquery"
            win.require(["jquery"], function($) {
                loadScript($);
            });
        }
    }

    function closeFloatingToolkit() {
        function closeToolkit($) {
            $(".tts-btn-close").trigger("mouseup");
        }
        
        // check if in iframe
        var win = getWindow.call(this);
        if(win === window) {
            closeToolkit($);
        } else if(win) {
            win.require(["jquery"], function($) {
                closeToolkit($);
            });
        }
    }

    function initTranslatorLaunchEvent() {
        var me = this;
        var isIgnoredTarget;

        // check if in iframe
        var win = getWindow.call(me), doc = win.document;
        if(win === window) {
            bindEvent($, doc);
        } else if(win) {
            win.require(["jquery"], function($) {
                bindEvent($, doc);
            });
        }

        function bindEvent($, doc) {
            $(doc)
                .unbind(EVENT_TTS_PRELAUNCH).bind(EVENT_TTS_PRELAUNCH, prelaunch)
                .unbind(EVENT_TTS_LAUNCH).bind(EVENT_TTS_LAUNCH, launch);
        }

        function prelaunch($event) {
            isIgnoredTarget = verifyIgnoredTarget($event);
        }

        function launch($event) {
            if(isIgnoredTarget) {
                return;
            }

            var text = getSelectedText(win);
            if(!text) {
                return;
            }
            openTranslator(text);
            clearSelection(win);
        }

        function verifyIgnoredTarget($event) {
            var target = $event.target,
                ignored = !!IGNORED_TAG[target.tagName];
            if(ignored && (target.readOnly === true || target.disabled === true)) {
                ignored = false;
            }
            return ignored;
        }
    }

    function getSelectedText(win) {
        win = win || window;
        var doc = win.document;
        var txt = (win.getSelection && win.getSelection()) ||
                  (doc.getSelection && doc.getSelection()) ||
                  (doc.selection && doc.selection.createRange().text) || "";
        return $.trim(("" + txt).replace(RE_CRLN, ""));
    }

    function clearSelection(win) {
        win = win || window;
        var doc = win.document;
        if(win.getSelection) {
            win.getSelection().removeAllRanges();
        } else if(doc.getSelection) {
            doc.getSelection().removeAllRanges();
        } else if(doc.selection) {
            doc.selection.empty();
        }
    }

    function openTranslator(searchText) {
        searchText = searchText || "";
        if (searchText.length > MAX_SEARCH_TEXT_LENGTH) {
            searchText = searchText.substr(0, MAX_SEARCH_TEXT_LENGTH);
        }
        var url = "/translator/?newcourseware=true&LE=e12-old-pop&searchText=" + encodeURIComponent(searchText),
            features = 'height=740px,width=680px,top=0,left=0,toolbar=no,resizable=yes,location=no,status=no,scrollbars=yes';
        var translatorWindow = window.parent.open(url, 'Translator', features);
        translatorWindow.focus();
    }

    return Widget.extend({
        "sig/stop": function onStop(signal, deferred) {
            closeFloatingToolkit.call(this);

            deferred && deferred.resolve();
        },

        "hub:memory/context": function onContext(topic, context) {
            if(!context) return;

            var me = this;
            var isFloatingToolkitEnabled;
            $.Deferred(function deferredQuery(dfdQuery) {
                var q = QueryBuilder.buildCCLQuery(CCL.enableFloatingToolkit);
                me.query(q, dfdQuery);
            })
            .done(function doneQuery(cclResult) {
                isFloatingToolkitEnabled = (cclResult || {}).value === "true";
            })
            .always(function alwaysQuery() {
                if(isFloatingToolkitEnabled) {
                    var data = {
                        "memberId": TypeidParser.parseId((context.user || {}).id),
                        "cacheServer": context.cacheServer,
                        "siteVersion": context.siteVersion,
                        "token": "" // obsolete
                    };
                    $.Deferred(function deferredCall(dfd) {
                        me.html(tTTS, data, dfd);
                    })
                    .done(function doneCall() {
                        loadFloatingToolkit.call(me, context.cacheServer, context.cultureCode, context.siteVersion);
                    });
                } else {
                    initTranslatorLaunchEvent.call(me);
                }
            });
        }
    });
});
