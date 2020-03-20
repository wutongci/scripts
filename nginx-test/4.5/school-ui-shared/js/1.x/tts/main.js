/**
 * TTS module definition
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
	"troopjs-ef/component/ef",
	'troopjs-core/pubsub/hub',
	"troopjs-utils/deferred",
    "school-ui-shared/module",
    "template!./tts.html",
    "template!./translator.html",
    "template!./listen-panel.html",
    "template!./settings.html",
    "school-ui-shared/enum/ccl",
    "school-ui-shared/utils/query-builder",
    "school-ui-shared/utils/typeid-parser",
    "./text-helper",
    "swfobject",
    "jquery.ui",
    "Cookies"
], function TTSModule($, Widget, ef, hub, Deferred, module, tTTS, tTRANS, tListenPanel, tSettings, CCL, QueryBuilder, TypeIdParser, TextHelper, swfobject, jUI, Cookies) {
    "use strict";
    var $ELEMENT = "$element";

    /*!
     * event name
     */
    var EVENT_TTS_PRELAUNCH = "mousedown.tts",
        EVENT_TTS_LAUNCH = "mouseup.tts";

    /*!
     * widget constants
     */
    var UNDEF,
        DOT = ".",
        SPACE = " ",
        DOUBLE_QUOTE = '"',
        TYPE_FUNCTION = "function",
        RE_CRLN = /\n|\r/g,
        MAX_SEARCH_TEXT_LENGTH = 1800,
        TTS_TEXT_DOUBLE_QUOTATION = "double quotation",
        TTS_TEXT_SORRY = "Sorry! I can not recognize it.";
    var TAB_INDEX_TRANSLATOR = 1,
        TAB_PREFIX = "ets-tab-",
        TTS_SOUND_SPRITE_ID = "ets-ui-tts-sound-sprite",
        TTS_SPEECH_CALLBACK = "_ttsSpeechCallback_" + (new Date().getTime());

    /*!
     * widget data keys
     */
    var ENABLE_FLOATING_TOOLKIT = "_enableFloatingToolkit",
        ENABLE_TRANSLATOR = "_enableTranslator",
        IS_FAILED = "_isFailed";

    var IGNORED_TAG = {
        "INPUT": 1,
        "TEXTAREA": 1
    };
    var ATTR_TITLE = "title";

    /*!
     * class variables
     */
    var CLS_HIDDEN = "ets-hidden",
        CLS_ACTIVE = "ets-active",
        CLS_DISABLED = "ets-disabled",
        CLS_EXPANDED = "ets-expanded",
        CLS_LOADING = "ets-loading",
        CLS_PLAYING = "ets-playing",
        CLS_SMALL = "ets-small",
        CLS_TTS_SMALL = "ets-tts-small",
        CLS_TRANS_SMALL = "ets-trans-small",
        CLS_ALL_SMALL = CLS_TTS_SMALL + " " + CLS_TRANS_SMALL,
        CLS_PINNED = "ets-pinned",
        CLS_DONE = "ets-done",
        CLS_FAIL = "ets-fail",
        CLS_TTS = "ets-ui-tts",
        CLS_TTS_DISABLED = "ets-ui-tts-disabled",
        CLS_TAB_1 = TAB_PREFIX + "1",
        CLS_TAB_2 = TAB_PREFIX + "2",
        CLS_TAB_3 = TAB_PREFIX + "3",
        CLS_TAB_N = CLS_TAB_1 + SPACE + CLS_TAB_2 + SPACE + CLS_TAB_3;
    
    /*!
     * selector variables
     */
    var SEL_TTS = DOT + CLS_TTS,
        SEL_TTS_SMALL_BOX = ".ets-ui-tts-small-box",
        SEL_TRANS_SMALL_BOX = ".ets-ui-trans-small-box",
        SEL_TTS_BOX = ".ets-ui-tts-box",

        SEL_TTS_HEAD = ".ets-ui-tts-hd",
        SEL_TTS_HEAD_LISTEN = ".ets-ui-tts-hd-listen",
        SEL_TTS_TABS = ".ets-ui-tts-tabs",
        SEL_TTS_TAB = ".ets-ui-tts-tab",
        SEL_TTS_TAB_ACTIVE = SEL_TTS_TAB + DOT + CLS_ACTIVE,
        SEL_TTS_TAB_PIN = SEL_TTS_TAB + ".ets-pin",
        SEL_TTS_TAB_TRANSLATOR = SEL_TTS_TAB + ".ets-translator",
        SEL_TTS_TAB_SPEECH = SEL_TTS_TAB + ".ets-speech",
        SEL_TTS_TAB_SETTINGS = SEL_TTS_TAB + ".ets-settings",

        SEL_TTS_BODY = ".ets-ui-tts-bd",
        SEL_TTS_SPEECH = ".ets-ui-tts-speech",
        SEL_TTS_SPEECH_INPUT = ".ets-ui-tts-speech-input",
        SEL_TTS_SPEECH_TIP = ".ets-ui-tts-speech-tip",
        SEL_TTS_SPEECH_LISTEN = ".ets-ui-tts-speech-listen",
        SEL_TTS_SETTINGS = ".ets-ui-tts-settings",
        SEL_TTS_SETTINGS_VOICE = ".ets-ui-tts-settings-voice",
        SEL_TTS_SETTINGS_AUTO_LAUNCH = "#ets-ui-tts-auto-launch",
        SEL_TTS_SETTINGS_MSG = ".ets-ui-tts-settings-msg",
        SEL_TTS_FOOT = ".ets-ui-tts-ft",

        SEL_TTS_LISTEN_BUTTON = ".ets-ui-tts-listen-btn",
        SEL_TTS_SPEED = ".ets-ui-tts-speed",
        SEL_TTS_SPEED_SELECTED = ".ets-ui-tts-speed-selected",
        SEL_TTS_SOUND_SPRITE = "#" + TTS_SOUND_SPRITE_ID;

    /*!
     * hub topic variables
     */
    var TOPIC_SAVE_SETTINGS = "school/tts/SaveMemberSettings",
        TOPIC_TTS_TRANSLATOR_RESET = "tts/translator/reset",
        TOPIC_TTS_TRANSLATOR_TRANSLATE = "tts/translator/translate";

    /*!
     * tts default/current settings
     */
    var SETTINGS = {
        speed: 100,
        speaker: 100,
        autoLaunch: true,
        maxTextLength: 300,
        ttsUrl: "/tts/tts.ashx?l=1"
    };

    var TRANS_SETTINGS = {
        autoLaunch: false
    };

    /*!
     * widget blurb
     */
    var BLURB = "blurb!",
        BLURB_PIN_DOWN = BLURB + "163322",
        BLURB_PIN_UP = BLURB + "163323",
        BLURB_TRANSLATOR = BLURB + "163084",
        BLURB_SPEECH = BLURB + "163321",
        BLURB_SETTINGS = BLURB + "167509",
        BLURB_TRANSLATION_ERROR = BLURB + "163324",
        BLURB_LOADED = "_blurbLoaded";
    var BLURB_LIST = {};
    BLURB_LIST[BLURB_PIN_DOWN] = "PinDown";
    BLURB_LIST[BLURB_PIN_UP] = "PinUp";
    BLURB_LIST[BLURB_TRANSLATOR] = "Translator";
    BLURB_LIST[BLURB_SPEECH] = "Speech";
    BLURB_LIST[BLURB_SETTINGS] = "Settings";
    BLURB_LIST[BLURB_TRANSLATION_ERROR] = "We're sorry but there's been an error processing your request. Please try again later.";

    var TAB_HANDLERS = [0];
    TAB_HANDLERS[1] = function onTranslator($tab, tabIndex) {
        var me = this,
            $widget = me[$ELEMENT];
        var $speed = $widget.find(SEL_TTS_HEAD_LISTEN).find(SEL_TTS_SPEED);
        toggleSpeed.call(me, $speed, false);
        resetTranslator.call(me);
        var text = $.trim($widget.find(SEL_TTS_SPEECH_INPUT).val());
        if(text !== "" && (me._text !== text || me[IS_FAILED])) {
            me._text = text;
            translate.call(me);
        };
    };

    TAB_HANDLERS[2] = function onSpeech($tab, tabIndex) {
        var me = this,
            $widget = me[$ELEMENT];
        if(!me._isPinned) {
            me._isPinned = true;
            togglePin.call(me, true);
        }

        var $speech = $widget.find(SEL_TTS_SPEECH),
            $speed = $speech.find(SEL_TTS_SPEED);
        toggleSpeechTip.call(me, $speech, false);
        toggleSpeed.call(me, $speed, false);

        renderListenPanel.call(me, true);
    };

    TAB_HANDLERS[3] = function onSettings($tab, tabIndex) {
        var me = this;
        var hideSettingsMessage = function() {
            me[$ELEMENT]
                .find(SEL_TTS_SETTINGS_MSG)
                .hide();
            };

        renderSettings.call(me);
        hideSettingsMessage();
    };

    window[TTS_SPEECH_CALLBACK] = {
        SpeechPlayingCallback: function(id) {
        },
        SpeechLoadCompleteCallback: function(id) {
            $("#" + id).removeClass(CLS_LOADING).addClass(CLS_PLAYING);
        },
        SpeechStopCallback: function(id) {
            $("#" + id).removeClass(CLS_PLAYING);
        },
        SpeechErrorCallback: function(code, id) {
            $("#" + id).removeClass(CLS_PLAYING + SPACE + CLS_LOADING);
        }
    };

    function init(deferred) {
        var me = this;
        
        me[$ELEMENT].addClass(CLS_TTS);

        me._isHidden = true;
        me._isRendered = false;
        me._isPinned = false;
        me._isTranslatorTab = true;
        me._text = "";
        me._english = "";

        deferred = deferred || Deferred();
        deferred.always(function alwaysCall() {
            initLaunchEvent.call(me);
        });
        initSettings.call(me, deferred);
    }

    function initSettings(deferred) {
        var me = this;
        Deferred(function deferredQuery(dfdQuery) {
            var q = [
                QueryBuilder.buildCCLQuery(CCL.enableFloatingToolkit),
                "student_translator_config!current",
                "tts_member_settings!current"
            ];
            me.query(q, dfdQuery);
        })
        .done(function doneQuery(cclFloatingResult, translatorConfig, settings) {
            me[ENABLE_FLOATING_TOOLKIT] = (cclFloatingResult || {}).value === "true";
            me[ENABLE_TRANSLATOR] = (translatorConfig || {}).enabled === true;
            //check autoLaunch value of the pupup window module
            if(!me[ENABLE_FLOATING_TOOLKIT]){
                //a autolaunch value in cookie ? 
                var cookieValue = checkTransAutolaunchByCookie();
                if (cookieValue === UNDEF) {
                    //there isn`t cookie value, use an old interface
                    me.publish(
                        "ajax", 
                        {   type:"GET",
                            url:"/translator/Integration/GetAutoLaunchStatus"
                        },
                        Deferred().done(function(data){
                            TRANS_SETTINGS.autoLaunch = data === "true";
                        })
                    );
                }
                else{
                    TRANS_SETTINGS.autoLaunch = cookieValue;           
                }
            }
            else if(settings) {
                SETTINGS.speed = settings.speed || SETTINGS.speed;
                SETTINGS.speaker = settings.speaker || SETTINGS.speaker;
                SETTINGS.autoLaunch = settings.status !== 0;
            }
            deferred.resolve();
        })
        .fail(function failQuery() {
            deferred.reject();
        });
    }

    function initLaunchEvent() {
        var me = this;
        var isIgnoredTarget;

        function verifyIgnoredTarget($event) {
            var target = $event.target,
                ignored = !!IGNORED_TAG[target.tagName] || target.className === CLS_TTS_DISABLED;
            if(ignored && (target.readOnly === true || target.disabled === true)) {
                ignored = false;
            }
            return ignored;
        }

        function verifyTTSTarget($event) {
            return $($event.target).closest(SEL_TTS).length > 0;
        }

        function prelaunch($event) {
            isIgnoredTarget = verifyIgnoredTarget($event);
            if(me._isHidden || me._isTtsSmallBox) {
                return;
            }
            var isFromTTS = verifyTTSTarget($event);
            if(isFromTTS) {
                isIgnoredTarget = true;
            }
            if(me._isPinned || isFromTTS) {
                return;
            }

            hide.call(me); // hide tts when unpinned
        }

        function launch($event) {
            if(isIgnoredTarget) {
                return;
            }
            var text = getSelectedText();
            if(!text) {
                return;
            }

            me._text = me._english = text;
            if(!me[ENABLE_FLOATING_TOOLKIT]) {
                var cookieValue = checkTransAutolaunchByCookie();
                if(cookieValue !== UNDEF){
                    TRANS_SETTINGS.autoLaunch = cookieValue;
                }

                if(TRANS_SETTINGS.autoLaunch){
                    openTranslator.call(me, true);
                    clearSelection();
                }
                else{
                    Deferred(function deferredCall(dfd) {
                        doRender.call(me, dfd);
                    })
                    .always(function alwaysCall() {
                        setTransBoxStyle.call(me);
                        setTransBoxPosition.call(me, $event);
                        show.call(me);
                    });
                }
            }
            else{
                Deferred(function deferredCall(dfd) {
                    doRender.call(me, dfd);
                })
                .always(function alwaysCall() {
                    if(!me._isPinned) {
                        setTtsBoxPosition.call(me, $event);
                    }
                    show.call(me);
                    initTranslator.call(me);
                    translate.call(me);
                });
            }

        }

        $(document)
            .unbind(EVENT_TTS_PRELAUNCH).bind(EVENT_TTS_PRELAUNCH, prelaunch)
            .unbind(EVENT_TTS_LAUNCH).bind(EVENT_TTS_LAUNCH, launch);
    }

    function checkTransAutolaunchByCookie(){
        var preference = Cookies.get("Translator3_User_Preference");
        var preferenceSegs = preference && preference.split("~");
        //is there a autolaunch value in cookie ? 
        if (preferenceSegs && preferenceSegs.length >= 3) {
            return preferenceSegs[2] == 'True';
        }
    }

    function getSelectedText() {
        var win = window, doc = win.document;
        var txt = (win.getSelection && win.getSelection()) ||
                  (doc.getSelection && doc.getSelection()) ||
                  (doc.selection && doc.selection.createRange().text) || "";
        return $.trim(("" + txt).replace(RE_CRLN, ""));
    }

    function clearSelection() {
        var win = window, doc = win.document;
        if(win.getSelection) {
            win.getSelection().removeAllRanges();
        } else if(doc.getSelection) {
            doc.getSelection().removeAllRanges();
        } else if(doc.selection) {
            doc.selection.empty();
        }
    }

    function doRender(deferred) {
        deferred = deferred || Deferred();

        var me = this;
        if(me._isRendered) {
            deferred.resolve();
            return;
        }

        me._isRendered = true;
        render.call(me, deferred);
    }

    function render(deferred) {
        var me = this;

        deferred.done(function doneCall() {
            onRendered.call(me);
        });
        if (!me[ENABLE_FLOATING_TOOLKIT]) {
            me[ENABLE_TRANSLATOR] && me.html(tTRANS, deferred);
        }
        else{
            me.html(
                tTTS({enableTranslatorDetail: me[ENABLE_TRANSLATOR]}),
                deferred.then(function(){
                    me[$ELEMENT].find(SEL_TTS_BOX).mouseenter(function(){
                        me.publish("tracking/useraction", {
                            "action.translateOverlay" : "1"
                        });
                    });
                })
            );   
        }
    }

    function renderListenPanel(isForSpeech, deferred) {
        deferred = deferred || Deferred();
        var me = this;
        if(isForSpeech) {
            if(me._speechListenRendered) {
                deferred.resolve();
                return;
            }
            me._speechListenRendered = true;
        } else {
            if(me._headListenRendered) {
                deferred.resolve();
                return;
            }
            me._headListenRendered = true;
        }

        var data = {
            "isForSpeech": isForSpeech,
            "settings": SETTINGS
        };

        var $widget = me[$ELEMENT].find(isForSpeech ? SEL_TTS_SPEECH_LISTEN : SEL_TTS_HEAD_LISTEN);
        Deferred(function deferredCall(dfd) {
            $widget
                .html(tListenPanel(data))
                .find("*")
                .weave(dfd);
        })
        .done(function doneCall() {
            $widget.removeClass(CLS_HIDDEN);
             deferred.resolve();
        })
        .fail(function failCall() {
            if(isForSpeech) {
                me._speechListenRendered = false;
            } else {
                me._headListenRendered = false;
            }
            deferred.reject();
        });
    }

    function renderSettings(deferred) {
        deferred = deferred || Deferred();
        var me = this;
        if(me._settingsRendered) {
            deferred.resolve();
            return;
        }

        me._settingsRendered = true;
        var $widget = me[$ELEMENT].find(SEL_TTS_SETTINGS);
        Deferred(function deferredCall(dfd) {
            var data = {
                "settings": SETTINGS
            };
            $widget
                .html(tSettings(data))
                .find("*")
                .weave(dfd);
        })
        .done(function doneCall() {
            $widget.removeClass(CLS_HIDDEN);
            deferred.resolve();
        })
        .fail(function failCall() {
            me._settingsRendered = false;
            deferred.reject();
        });
    }

    function onRendered() {
        var me = this;

        setzIndex.call(me);
        setTtsBoxStyle.call(me);

        initDraggable.call(me);
        initSoundSprite.call(me);

        renderListenPanel.call(me, false);
        initTabTip.call(me);
    }

    function setTtsBoxPosition($event) {
        var pageX = $event.pageX,
            pageY = $event.pageY;
        var me = this,
            size = getBoxSize.call(me);
        var $win = $(window),
            winWidth = $win.width(),
            winHeight = $win.height();
        var maxX = winWidth - size.width,
            maxY = winHeight - size.height,
            boxX = pageX + 10,
            boxY = pageY - 60;
        if(boxX > maxX) {
            boxX = maxX;
        }
        if(boxY < 0) {
            boxY = 0;
        } else if(boxY > maxY) {
            boxY = maxY;
        }
        var $widget = me[$ELEMENT], smallBox;
        $widget
            .find(SEL_TTS_BOX)
            .css({ "left": boxX, "top": boxY });

        if(me._isTtsSmallBox) {
            smallBox = $widget.find(SEL_TTS_SMALL_BOX);
            smallBox.css(getSmallBoxOffset(smallBox, $event));
        }
    }

    function setTransBoxPosition($event) {
        var me = this;
        var smallBox;
        if(me._isTransSmallBox) {
            smallBox = me[$ELEMENT].find(SEL_TRANS_SMALL_BOX);
            smallBox.css(getSmallBoxOffset(smallBox, $event));
        }
    }

    function getSmallBoxOffset(smallBox, $event){
        var pageX = $event.pageX,
            pageY = $event.pageY;
        var $win = $(window),
            winWidth = $win.width(),
            winHeight = $win.height();

        var smallMaxX = winWidth - smallBox.width(),
            smallMaxY = winHeight - smallBox.height();
        var smallBoxX = pageX + 20,
            smallBoxY = pageY - 10;
        if(smallBoxX > smallMaxX) {
            smallBoxX = smallMaxX;
        }
        if(smallBoxY < 0) {
            smallBoxY = 0;
        } else if(smallBoxY > smallMaxY) {
            smallBoxY = smallMaxY;
        }
        return { "left": smallBoxX, "top": smallBoxY };
    }

    function getBoxSize() {
        var me = this;
        if(!me._ttsBoxSize) {
            var $box = me[$ELEMENT].find(SEL_TTS_BOX);
            var height = $box.find(SEL_TTS_HEAD).outerHeight()
                       + $box.find(SEL_TTS_BODY).outerHeight()
                       + $box.find(SEL_TTS_FOOT).outerHeight()
                       + 10;
            me._ttsBoxSize = {
                "width": $box.outerWidth() + 10,
                "height": height
            };
        }
        return me._ttsBoxSize;
    }

    /*!
     * set tts z-index by setting
     */
    function setzIndex() {
        var $widget = this[$ELEMENT],
            zIndex = $widget.data("zIndex");
        if(zIndex !== UNDEF) {
            $widget.find(SEL_TTS_SMALL_BOX + "," + SEL_TTS_BOX).css("z-index", zIndex);
        }
    }

    function initDraggable() {
        var me = this,
            boxWidth = getBoxSize.call(me).width + 2,
            maxLeft = 0;

        function onStart($event, ui) {
            maxLeft = $(window).width() - boxWidth;
        }

        function onDrag($event, ui) {
            var position = ui.position;
            if(maxLeft > 0 && position.left > maxLeft) {
                position.left = maxLeft;
            }
        }

        me[$ELEMENT]
            .find(SEL_TTS_BOX)
            .draggable({
                handle: SEL_TTS_HEAD,
                addClasses: false,
                containment: "window",
                scroll: false,
                scope: false,
                disabled: true,
                start: onStart,
                drag: onDrag
            });
    }

    function setTtsBoxStyle(small) {
        var me = this;
        me._isTtsSmallBox = small === UNDEF ? !SETTINGS.autoLaunch : !!small;
        me[$ELEMENT].removeClass(CLS_ALL_SMALL).toggleClass(CLS_TTS_SMALL, me._isTtsSmallBox);
    }

    function setTransBoxStyle(small) {
        var me = this;
        me._isTransSmallBox = small === UNDEF ? !TRANS_SETTINGS.autoLaunch : !!small;
        me[$ELEMENT].removeClass(CLS_ALL_SMALL).toggleClass(CLS_TRANS_SMALL, me._isTransSmallBox);
    }

    function initSoundSprite() {
        if(!swfobject) return;

        var appName = "school-ui-shared",
            audioPlayerPath = "/img/ets-ui-tts-sound-sprite.swf",
            audioPlayerUrl = "/_shared/" + appName + "/" + module.config()["app-version"][appName] + audioPlayerPath;
        swfobject.embedSWF(audioPlayerUrl, TTS_SOUND_SPRITE_ID, "0", "0", "9.0.0", "#fff", {}, { allowScriptAccess: "always" });
    }

    function initTabTip() {
        var me = this;
        var blurbList = BLURB_LIST;
        Deferred(function deferredCall(dfd) {
            loadBlurb.call(me, dfd);
        })
        .always(function alwaysCall() {
            me[$ELEMENT]
                .find(SEL_TTS_TABS)
                .find(SEL_TTS_TAB_PIN)
                .attr(ATTR_TITLE, me._isPinned ? blurbList[BLURB_PIN_UP] : blurbList[BLURB_PIN_DOWN])
                .end()
                .find(SEL_TTS_TAB_TRANSLATOR)
                .attr(ATTR_TITLE, blurbList[BLURB_TRANSLATOR])
                .end()
                .find(SEL_TTS_TAB_SPEECH)
                .attr(ATTR_TITLE, blurbList[BLURB_SPEECH])
                .end()
                .find(SEL_TTS_TAB_SETTINGS)
                .attr(ATTR_TITLE, blurbList[BLURB_SETTINGS]);
        });
    }

    function loadBlurb(deferred) {
        deferred = deferred || Deferred();
        var me = this;
        if(me[BLURB_LOADED]) {
            deferred.resolve();
            return;
        }

        me[BLURB_LOADED] = true;
        var blurbList = BLURB_LIST;
        Deferred(function deferredQuery(dfdQuery) {
            var q = [];
            $.each(blurbList || false, function(blurbid, value) {
                q.push(blurbid);
            });
            me.query(q, dfdQuery);
        })
        .done(function doneQuery() {
            $.each(arguments || false, function(i, blurb) {
                var translation = blurb && blurb.translation;
                if(translation) {
                    blurbList[blurb.id] = translation;
                }
            });
            deferred.resolve();
        })
        .fail(function failQuery() {
            me[BLURB_LOADED] = false;
            deferred.reject();
        });
    }

    function resetListenButton() {
        this[$ELEMENT]
            .find(SEL_TTS_LISTEN_BUTTON)
            .removeClass(CLS_PLAYING + SPACE + CLS_LOADING);
    }

    function show() {
        var me = this;
        me._isHidden = false;
        me[$ELEMENT].show();
        resetListenButton.call(me);
        resetTranslator.call(me);
    }

    function hide() {
        var me = this;
        me._isHidden = true;
        me._isPinned = false;
        me[$ELEMENT].hide();
        togglePin.call(me, false);
        if(!me[ENABLE_FLOATING_TOOLKIT]){
            setTransBoxStyle.call(me);
        }
        else{
            setTtsBoxStyle.call(me);
        }
    }

    function togglePin(pinned) {
        var me = this;
        me[$ELEMENT]
            .find(SEL_TTS_BOX)
            .toggleClass(CLS_PINNED, pinned)
            .draggable(pinned ? "enable" : "disable")
            .find(SEL_TTS_TAB_PIN)
            .attr(ATTR_TITLE, pinned ? BLURB_LIST[BLURB_PIN_UP] : BLURB_LIST[BLURB_PIN_DOWN]);
    }

    function initTranslator() {
        var me = this,
            text = me._text,
            $widget = me[$ELEMENT];
        $widget
            .find(SEL_TTS_SPEECH_INPUT)
            .val(text);
        if(!me._isTranslatorTab) {
            var $tab = $widget.find(SEL_TTS_TAB_TRANSLATOR);
            initTab.call(me, $tab, TAB_INDEX_TRANSLATOR);
        }
    }

    function switchTab($tab, tabIndex) {
        var me = this;
        initTab.call(me, $tab, tabIndex);

        var handler = TAB_HANDLERS[tabIndex];
        if(typeof(handler) === TYPE_FUNCTION) {
            handler.apply(me, arguments);
        }
    }

    function initTab($tab, tabIndex) {
        var me = this;
        me._isTranslatorTab = tabIndex === TAB_INDEX_TRANSLATOR;
        me[$ELEMENT]
            .find(SEL_TTS_HEAD_LISTEN)
            .toggle(me._isTranslatorTab)
            .end()
            .find(SEL_TTS_TAB_ACTIVE)
            .removeClass(CLS_ACTIVE)
            .end()
            .find(SEL_TTS_BODY)
            .removeClass(CLS_TAB_N)
            .addClass(TAB_PREFIX + tabIndex);

        $tab.addClass(CLS_ACTIVE);
    }

    function toggleSpeed($speed, expanded) {
        $speed.toggleClass(CLS_EXPANDED, expanded);
    }

    function selectSpeed(speed, text) {
        SETTINGS.speed = speed;
        this[$ELEMENT].find(SEL_TTS_SPEED_SELECTED).text(text);
    }

    function listenSpeech($player, isForSpeech) {
        if($player.hasClass(CLS_LOADING) ||
           $player.hasClass(CLS_PLAYING) ||
           $player.hasClass(CLS_DISABLED)) {
            return;
        }

        var me = this, $widget = me[$ELEMENT], $speech;
        var text = me._english;
        if(isForSpeech) {
            $speech = $widget.find(SEL_TTS_SPEECH);
            text = $.trim($speech.find(SEL_TTS_SPEECH_INPUT).val());
        }
        if(text.length === 0 || text.length > SETTINGS.maxTextLength) {
            if($speech) {
                toggleSpeechTip.call(me, $speech, true);
            }
            return;
        } else if(!TextHelper.canTTS(text)) {
            if(text === DOUBLE_QUOTE) {
                text = TTS_TEXT_DOUBLE_QUOTATION;
            } else if(isForSpeech) {
                enablePlayerAudio($player, false);
                return;
            } else {
                text = TTS_TEXT_SORRY;
            }
        }

        var soundSprite = $widget.find(SEL_TTS_SOUND_SPRITE)[0];
        if(soundSprite && soundSprite.loadSpeech) {
            $player.addClass(CLS_LOADING);
            var playerId = $player[0].id,
                ttsUrl = SETTINGS.ttsUrl;
            var url = [
                ttsUrl + (ttsUrl.indexOf("?") >= 0 ? "&" : "?") + "m=" + me._member_id,
                "spk=" + SETTINGS.speaker,
                "spd=" + SETTINGS.speed,
                "t=" + encodeURIComponent('"' + text + '"'),
                "p=" + encodeURIComponent(location.href),
                "k="
            ].join("&");

            soundSprite.loadSpeech(url, playerId, TTS_SPEECH_CALLBACK);
        }
    }

    function toggleSpeechTip($speech, show) {
        var $speechTip = $speech
            .find(SEL_TTS_SPEECH_TIP)
            .stop(true, true)
            .toggle(show);
        if(show) {
            $speechTip.delay(2000).fadeOut(3000);
        }
    }

    function enablePlayerAudio($player, enabled) {
        $player.toggleClass(CLS_DISABLED, !enabled);
    }

    function saveSettings() {
        var me = this;
        var $settings = me[$ELEMENT].find(SEL_TTS_SETTINGS);
        var showMessage = function(success) {
            $settings
                .find(SEL_TTS_SETTINGS_MSG + DOT + (success ? CLS_DONE : CLS_FAIL))
                .stop(true, true)
                .show()
                .delay(2000)
                .fadeOut(success ? 1000 : 3000);
        };

        var speaker = +$settings.find(SEL_TTS_SETTINGS_VOICE).find("input:checked").val(),
            autoLaunch = $settings.find(SEL_TTS_SETTINGS_AUTO_LAUNCH)[0].checked,
            settings = {
                "speed": SETTINGS.speed,
                "speaker": speaker,
                "status": (autoLaunch ? 1 : 0)
            };

        Deferred(function deferredUpdate(dfdUpdate) {
            me.publish(TOPIC_SAVE_SETTINGS, settings, dfdUpdate);
        })
        .done(function doneUpdate(saved) {
            saved = saved && (saved[0] || saved);
            if(saved && saved.result === 1) {
                SETTINGS.speaker = speaker;
                SETTINGS.autoLaunch = autoLaunch;
                showMessage(true);
            } else {
                showMessage(false);
            }
        })
        .fail(function failUpdate() {
            showMessage(false);
        });
    }

    function translate() {
        // SPC-2505, replace translation text's 'noisy' characters with EMPTY before translating
        var normalizeText = function(txt) {
            return ('' + txt).replace(/['"\\]/g, '') || ' ';
        };

        var me = this;
        var text = normalizeText(me._text);
        if(text.length > SETTINGS.maxTextLength) {
            text = text.substr(0, SETTINGS.maxTextLength);
        }
        me._text = text;

        me[IS_FAILED] = false;
        Deferred(function deferredCall(dfd) {
            me.publish(TOPIC_TTS_TRANSLATOR_TRANSLATE, text, me._cultureCode, dfd);
        })
        .done(function doneCall() {
        })
        .fail(function failCall() {
            me[IS_FAILED] = true;
        });
    }

    function resetTranslator() {
        this.publish(TOPIC_TTS_TRANSLATOR_RESET);
    }

    function openTranslator(autoPop) {
        var me = this,
            searchText = me._text || "";
        if(searchText.length > MAX_SEARCH_TEXT_LENGTH) {
            searchText = searchText.substr(0, MAX_SEARCH_TEXT_LENGTH);
        }
        var url = "/translator/?newcourseware=true&LE=" + ("e12-new" + (autoPop ? "-pop" : "")) + "&searchText=" + encodeURIComponent(searchText),
            features = 'height=740px,width=680px,top=0,left=0,toolbar=no,resizable=yes,location=no,status=no,scrollbars=yes';
        var translatorWindow = window.open(url, 'Translator', features);
        translatorWindow.focus();
    }

    return Widget.extend({
        "sig/start": function onStart(signal, deferred) {
            init.call(this, deferred);
        },

        "hub:memory/context": function onContext(topic, context) {
            if(context) {
                var me = this;
                me._member_id = +TypeIdParser.parseId((context.user || {}).id);
                me._cultureCode = context.cultureCode;
            }
        },

        "hub/tts/set/url": function onSetSpeechUrl(topic, url) {
            if(url) {
                SETTINGS.ttsUrl = url;
            }
        },
        
        "hub/tts/set/english": function onSetEnglish(topic, english) {
            this._english = english || "";
        },

        "hub/tts/get/translation/error": function onGetTranslationError(topic, deferred) {
            if(deferred) {
                deferred.resolve(BLURB_LIST[BLURB_TRANSLATION_ERROR]);
            }
        },

        "hub/tts/open/translator": function onOpenTranslator(topic) {
            openTranslator.call(this);
        },

        "hub/tts/close/toolkit": function onCloseToolkit(topic) {
            hide.call(this);
        },

        "dom/action.click": $.noop,

        "dom/action/show/box": function onShowBox(topic, $event) {
            setTtsBoxStyle.call(this, false);
        },

        "dom/action/open/translator": function onActionOpenTranslator(topic) {
            openTranslator.call(this);
        },

        "dom/action/close/box": function onCloseBox(topic, $event) {
            hide.call(this);
        },

        "dom/action/toggle/pin": function onTogglePin(topic, $event) {
            var me = this;
            me._isPinned = !me._isPinned;
            togglePin.call(me, me._isPinned);
        },

        "dom/action/switch/tab": function onSwitchTab(topic, $event, tabIndex) {
            var $tab = $($event.target);
            if($tab.hasClass(CLS_ACTIVE)) {
                return;
            }
            switchTab.call(this, $tab, tabIndex);
        },

        "dom/action/click/input": function onClickInput(topic, $event) {
            var $speech = $($event.target).closest(SEL_TTS_SPEECH);
            toggleSpeechTip.call(this, $speech, false);

            var $player = $speech.find(SEL_TTS_LISTEN_BUTTON);
            enablePlayerAudio($player, true);
        },

        "dom/action/toggle/speed": function onToggleSpeed(topic, $event) {
            var $speed = $($event.target);
            toggleSpeed.call(this, $speed);
        },

        "dom/action/select/speed": function onSelectSpeed(topic, $event, speed) {
            var $option = $($event.target);
            var me = this;
            selectSpeed.call(me, speed, $option.text());

            var $speed = $option.closest(SEL_TTS_SPEED);
            toggleSpeed.call(me, $speed, false);
        },

        "dom/action/listen/speech": function onListenSpeech(topic, $event, isForSpeech) {
            var me = this;
            var $player = $($event.target);
            listenSpeech.call(me, $player, isForSpeech);
            //send useraction tracking
            me.publish("tracking/useraction", {
                "action.translatePlay" : "1"
            });
        },

        "dom/action/save/settings": function onSaveSettings(topic, $event) {
            saveSettings.call(this);
        }
    });
});
