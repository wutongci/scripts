(function(){
var baseRJSDefine = define;
define = function (name, deps, module) {
    if (arguments.length === 2) {
        module = deps;
        deps = [];
    }
    baseRJSDefine(name, ['logger'].concat(deps), function(Logger) {
        Logger.log('Required dependency to troopjs 1x ' + name);

        if (typeof module === 'function') {
            var args = Array.prototype.slice.call(arguments, 1);
            return module.apply(this, args);
        } else {
            return module;
        }
    });
};

// For Activity Event Log 'school/school_event_log/LogActivityEvent'

define('school-ui-shared/enum/activity-event-type',{
    lngCompRetryTimesV1: 1,
    lngCompRetryTimesV2: 2,
    ASRMicSettingOnboarding: 3,
    ASRMicSettingE13: 4
});

define('school-ui-shared/enum/ccl',{
    enableChangeUnit: "school.courseware.enableChangeUnit",
    enableChangeLevel: "school.courseware.enableChangeLevel",
    enableTTS: "school.courseware.e12.enableTTS",
    enableFloatingToolkit: "school.enable.floatingtoolkit",
    enablePCHtmlEpaper: "school.courseware.htmlepaper.pc.enable",
    enableSPINHtmlEpaper: "school.courseware.htmlepaper.spin.enable",
    asrSrvAddr: "school.AsrServerAddress",
    playerRules: "school.courseware.e12.playerRules"
});
define('school-ui-shared/enum/course-type',{
    /**
     * General English
     */
    GeneralEnglish: "GE",

    /**
     * Business English SPIN
     */
    BusinessEnglish: "BE",

    /**
     * Industry English SPIN
     */
    IndustryEnglish: "IND",

    /**
     * B2B Industry English SPIN
     */
    IndustryEnglishB2B: "INDB2B",

    /**
     * ILS Industry English SPIN
     */
    IndustryEnglishILS: "INDILS",

    /**
     * Travel English
     */
    TravelEnglish: "TRV",

    /**
     * English for Food Service
     */
    FoodEnglish: "FSE",

    /**
     * English for Hospitality
     */
    HospitalityEnglish: "HE",

    /**
     * English for Security
     */
    SecurityEnglish: "SE",

    /**
     * check if the course is GE by courseTypeCode
     * @param {String} courseTypeCode
     * @return {Boolean} true is GE course else is not
     * @api public
     */
    isGECourse: function onCheckGECourse(courseTypeCode) {
        return this.GeneralEnglish === ("" + courseTypeCode).toUpperCase();
    },

    /**
     * check if the course is BE by courseTypeCode
     * @param {String} courseTypeCode
     * @return {Boolean} true is BE course else is not
     * @api public
     */
    isBECourse: function onCheckBECourse(courseTypeCode) {
        return this.BusinessEnglish === ("" + courseTypeCode).toUpperCase();
    },

    /**
     * check if the course is SPIN by courseTypeCode
     * @param {String} courseTypeCode
     * @return {Boolean} true is SPIN course else is not
     * @api public
     */
    isSpinCourse: function onCheckSpinCourse(courseTypeCode) {
        return !this.isGECourse(courseTypeCode);
    }
});
/**
 * enroll node type enum
 */
 define('school-ui-shared/enum/enroll-node-type',{
    course: 1,
    level: 2,
    unit: 3,
    lesson: 4,
    step: 5,
    activity: 6
});

define('school-ui-shared/enum/enrollment-state',{
	isPrimary: 1,
	isCurrent: 2,
	isCurrentForCourseType: 4,
	isEnrollable: 8
});
define('school-ui-shared/enum/feature-access-id',{
    "free self-study"                               :  1,
	"Bronze group chats"                            :  2,
	"Bronze private chats"                          :  3,
	"face to face study"                            :  4,
	"Silver group chats"                            :  5,
	"Silver private chats"                          :  6,
	"self-study no business course (not extendable)":  7,
	"Free group chats"                              :  8,
	"Gold private chats"                            :  9,
	"Private lesson"                                :  10,
	"Group discussion"                              :  11,
	"Trainer for TOEIC"                             :  12,
	"Test for TOEIC (Red)"                          :  13,
	"Test for TOEIC (Green)"                        :  14,
	"Test for TOEIC (Blue)"                         :  15,
	"Trainer for TOEFL"                             :  16,
	"Test for TOEFL (Red)"                          :  17,
	"Test for TOEFL (Green)"                        :  18,
	"Test for TOEFL (Blue)"                         :  19,
	"EFT"                                           :  20,
	"self-study (extendable)"                       :  21,
	"Group discussion (unlimited)"                  :  22,
	"Personalize Language Aptitude Test Online"     :  23,
	"Business Course (extendable)"                  :  24,
	"self-study no business course"                 :  25,
	"Trainer for TOEIC (Interstitial)"              :  27,
	"Test for TOEIC (Blue Interstitial)"            :  28,
	"Trainer for TOEFL (Interstitial)"              :  29,
	"Test for TOEFL (Blue Interstitial)"            :  30,
	"Group discussion upsell"                       :  31,
	"Writing class limited"                         :  32,
	"Writing class unlimited"                       :  33,
	"Etown Translator"                              :  34,
	"Business Course (not extendable)"              :  35,
	"Personal Coaching"                             :  36,
	"SPIN Course"                                   :  37,
	"English Corner"                                :  38,
	"self-study (B2B Homework)"                     :  39,
	"Industry English SPINs"                        :  40,
	"Travel SPINs"                                  :  41,
	"Private Lesson 20"                             :  42,
	"Private Lesson 20 - Unit Move On"              :  43,
	"GL Daily Delivery"                             :  44,
	"Check Point 20"                                :  45,
	"Check Point 20 (unlimited)"                    :  46,
	"Private Lesson 40 - Unit Move On"              :  47,
	"Camp"                                          :  48,
	"Resume Correction"                             :  49
});
define('school-ui-shared/enum/progress-state',{
	notStarted: 0,
 	onGoing: 1,
 	completed: 2, // not usefull
	hasPassed: 4, //only use this one in front-end code
	isFinished: 8 // not usefull
});
define('school-ui-shared/enum/rating-source-type',{
    ASR_TYPING: "TP",
    ASR_SPEAKING: "SPK",
    ASR_SELECTION: "SLCT"
});

define('school-ui-shared/enum/step-type',{
	movie: 0,
	finalTask: 1,
	vocabulary: 2,
	vocabularyAndIntonnation: 3,
	languageAndFocus: 4,
	functions: 5,
	grammar: 6,
	pronunciation: 7,
	reading: 8,
	listening: 9,
	speaking: 10,
	writing: 11
});
define('school-ui-shared/module',["module"], function(module){
	return module;
});
define('school-ui-shared/tracker/base/mock-data',[],function(){
    return [{
        'id': 'tracking!e12_omniture',
        'tracking': [{
            'id': 'tracking_item!001',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/?$",
            'props': {
                'pageName': "School:Courseware:UnitMainMenu"
            },
            'events': [{
                'id': 'tracking_events!001',
                'click': [{
                    'id': 'tracking_event_click!001',
                    'selector': ' .ets-overview',
                    'props': {
                        'pageName': "School:Courseware:Test"
                    }
                }]
            }]
        },
        // {
        //     'id': 'tracking_item!002',
        //     'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
        //     'props': {
        //         'pageName': "School:Courseware:UnitBox"
        //     }
        // },
        {
            'id': 'tracking_item!003',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'props':{
                'pageName': "School:Courseware:Lessons"
            }
        },
        {
            'id': 'tracking_item!004',
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/unit-overview/open',
                'props': {
                    'pageName': "School:Courseware:UnitOverview"
                }
            }]   
        },
        {
            'id': 'tracking_item!005',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/lesson/expand/0',
                'props': {
                    'pageName': "School:Courseware:UnitBox1"
                }
            }]
        },
        {
            'id': 'tracking_item!006',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/lesson/expand/1',
                'props': {
                    'pageName': "School:Courseware:UnitBox2"
                }
            }]
        },
        {
            'id': 'tracking_item!007',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/lesson/expand/2',
                'props': {
                    'pageName': "School:Courseware:UnitBox3"
                }
            }]
        },
        {
            'id': 'tracking_item!008',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/lesson/expand/3',
                'props': {
                    'pageName': "School:Courseware:UnitBox4"
                }
            }]
        },
        {
            'id': 'tracking_item!009',
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/change-course/expand',
                'props': {
                    'pageName': "School:Courseware:EnglishCategories"
                }
            }]
        },
        {
            'id': 'tracking_item!010',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/\\d+/summary$",
            'props':{
                'pageName': "School:Courseware:ActivityResults"
            }
        }
        ]
    },{
        'id': 'tracking!e12_etvt',
        'tracking':[{
            'id': 'tracking_item!001',
            'regex': "",
            'props': {}
        }]
    }];
});
/**
 * class TrackerBase
 * The base tracker class, allows you to inherit to implement customized tracking logic
 * It does:
 *    Getting the tracking data from server according to this.scope (which specified in sub class)
 *    Monitor the hash uri change,
 *    Check if uri match the regex in tracking data.
 */
define('school-ui-shared/tracker/base/main',['compose', 'troopjs-core/component/widget', 'troopjs-utils/deferred', './mock-data'], 
    function BaseTrackerModule(Compose, Widget, Deferred, MOCK_DATA){
    "use strict";

    var URI = 'uri';
    var ON_SEND = '_onSend';
    var ON_HASH_MATCH = '_onHashMatch';
    var EX_BOUND_ERR = 'Tracker widget must be bound to top-most element';

    var routingQueue = [];

    function begatQueuedItem(uri){
        return {
            uri: uri,
            behaviors: []
        };
    }

    function filter(track){
        var me = this;

        if (me._dfdTrackingInfo.isResolved()){

            sendURI.call(me, track.uri);
            sendBehavior.call(me, track.behavior);

        }
        else{

            if (track.uri){
                routingQueue(begatQueuedItem(uri))
            }

            var item = routingQueue[routingQueue.length - 1];
            
            if (track.behavior){
                item.behaviors.push(track.behaviors);
            }
        }
    }

    /**
     * Try to see if current uri is matched, if matched, send out the event.
     * @param uri the uri to be matched and tracked. 
     */
    function sendURI(uri){
        if (!uri || uri == false){
            return;
        }

        var me = this, data = me._data.tracking, l;

        me[URI] = uri;

        for(l = data.length; l--;){
            if (data[l].props && data[l].regex != null && new RegExp(data[l].regex).test(uri)){
                // this[ON_HASH_MATCH](data[l], uri);
                me[ON_SEND](data[l], {
                    uri: uri
                });
            }
        }

    }

    function sendBehavior(behavior){
        if (!behavior || behavior == false){
            return;
        }

        var me = this, data = me._data.tracking, l, lb, behaviorItem, uri = me[URI]

        for(l = data.length; l--;){

            behaviorItem = data[l].behavior;

            if (!behaviorItem || 
                // check the constrains of uri if available 
                (data[l].regex && !(new RegExp(data[l].regex).test(uri)))
                ){
                continue;
            }
            
            for(lb = behaviorItem.length; lb--;){
                if (behaviorItem[lb].props && behaviorItem[lb].name == behavior){

                    // this[ON_HASH_MATCH](data[l], uri);
                    me[ON_SEND](behaviorItem[lb], {
                        behavior: behavior
                    });
                }
            }
        }
        
    }

    function onRoute(topic, uri){

        var me = this, data, l;
        
        filter.call(me, {
            uri: uri
        })

        me._dfdFirstRoute.resolve();

    }

    function onTrack(topic, track){
        var me = this;
        var behavior = track.toString();
        
        if (track.name){
            behavior = track.name;
        }

        me._dfdFirstRoute.done(function(){

            filter.call(me, {
                behavior: behavior
            });

        });

    }

    return Widget.extend(function(){

        var me = this;

        // Try to get the tracking info, and queue those routing signal if it is 
        // happened before tracking info is loaded, and re-signal them once data 
        // is loaded.
        me._dfdTrackingInfo = me.getTracking()
            .done(function(trackingData){

                var item, i, j;

                me._data = trackingData;

                for(i = 0; i < routingQueue.length; i++){

                    item = routingQueue[i];

                    // re-trigger cached events
                    sendURI.call(me, item.uri);

                    for(j = 0; j < item.behaviors.length; j++){

                        sendBehavior.call(me, item.behaviors[j]);

                    }
                }

                routingQueue.length = 0;
            });

        me._dfdFirstRoute = Deferred();

    }, {
        'sig/start': function(signal, deferred){

            // check if current element is top most element
            // if its not, this widget cannot work
            var tag = this.$element[0].tagName.toUpperCase();
            if (tag != 'BODY' && tag != 'HTML'){
                throw EX_BOUND_ERR;
                deferred.reject();
                return;
            }

            if (deferred){
                deferred.resolve();
            }
        },

        'hub:memory/route': onRoute,
        'hub:memory/tracking/track': onTrack,

        'dom/action': $.noop,
        'dom/action/track': function(topic, $event, behavior){
            var me = this;

            me.publish('tracking/track', behavior);
        },
        /**
         * Get tracking info from remote server
         */
        getTracking: function onGetTracking(deferred){

            var ret = Deferred();
            var id = 'tracking!' + this.scope;
            var foundInMock = false;

            if (deferred){
                ret.then(deferred.resolve, deferred.reject);
            }

            // Check if required data is in mocking data
            for(var l = MOCK_DATA.length; l--;){
                if (MOCK_DATA[l].id == id){
                    // if there is, resolve with the mock data
                    ret.resolve(MOCK_DATA[l]);
                    foundInMock = true;
                    break;
                }
            }

            if (!foundInMock){
                // Otherwise, send a request for the data.
                this.query('tracking!' + this.scope, ret);
            }

            return ret;
        },
        _onSend: Compose.required
    });
});
/**
 * Shared sandbox(gollum) instance
 */
define('school-ui-shared/tracker/sandbox/main',['gollum'], function(Gollum){
	"use strict";

	var PATH_SCODE = '/school/tracking/e12.aspx';

	var gollum = new Gollum({
        url: PATH_SCODE
    });

    return gollum;
});
define('school-ui-shared/tracker/etvt/etvt',['../sandbox/main', 'troopjs-utils/deferred'], function EtvtWrapperModule(gollum, Deferred){
	"use strict";
	
	var ret = {
		send: function(url){
			gollum.exec(function(url){
				if (!window.visitTrack){
					return;
				}

				window.visitTrack(url);
			}, url);
		}
	};

	return ret;
});


/**
 * @class omniture tracker
 * Send omniture tracking info
 */
define('school-ui-shared/tracker/etvt/main',['./etvt', '../base/main'], function OmnitureTrackerModule(etvt, Widget){
	"use strict";

    return Widget.extend({
        scope: 'e12_etvt',
        _onSend: function onSend(data, track, deferred){
        	if (!track.uri){
        		return;
        	}

            // Change hash to path format, and can let back-end save data to DB.
            // After back-end framework update, will be deleted.
            etvt.send(window.location.protocol + '//' + window.location.host + window.location.pathname + (window.location.pathname.substr(window.location.pathname.length - 1) === "/" ? window.location.hash.replace('#', '') : window.location.hash.replace('#', '/')) + (window.location.search ? window.location.search : ''));

            if (deferred){
                deferred.resolve();
            }
        }
    });
});
/***
 * @singleton omniture 

 * Omniture wrapper, wraps around the original omniture s_code file,
 * make sure omniture doesn't pollute the global and also provides convininent
 * APIs for single page application.
 */
define('school-ui-shared/tracker/omniture/omniture',['../sandbox/main', 'troopjs-utils/deferred'], function OmnitureWrapperModule(gollum, Deferred){
    'use strict';

    var FUNC_OMNI_SEND = 'E12_Tracking_Omniture_Send'

    var global = this;

    // contains the backed up properties of the original s object
    var backup = {};

    var dfdSCode = Deferred();

    // Init
    gollum
        .exec(function(backup){

            if (!window.s){
                return;
            }
            
            // backup the original 's' object
            for(var key in window.s){
                backup[key] = window.s[key];
            }

        }, backup)
        .then(dfdSCode.resolve, dfdSCode.reject);

    var ret = {
        send: function(settings, uri){

            dfdSCode.done(function(){
                gollum.exec(function(FUNC_OMNI_SEND, settings, backup){

                    var s = window.s;

                    if (!s || !window[FUNC_OMNI_SEND]){
                        return;
                    }

                    // restore the original 's' object
                    for(var key in s){
                        if (!s.hasOwnProperty(key)){
                            continue;
                        }

                        if (key in backup){
                            s[key] =  backup[key];
                        }
                        else{
                            delete s[key];
                        }

                    }

                    // set up the sending parameter
                    for(var key in settings){
                        if (!settings.hasOwnProperty(key)){
                            continue;
                        }

                        s[key] = settings[key];
                    }

                    // TODO: call the customized method which produced by backend code?
                    window[FUNC_OMNI_SEND]();

                }, FUNC_OMNI_SEND, settings, backup);
            });
        }
    };

    return ret;
});
/**
 * @class omniture tracker
 * Send omniture tracking info
 */
define('school-ui-shared/tracker/omniture/main',['./omniture', '../base/main'], function OmnitureTrackerModule(omniture, Widget){
	"use strict";

    return Widget.extend({
        scope: 'e12_omniture',
        _onSend: function onSend(data, track, deferred){
            omniture.send(data.props);

            if (deferred){
                deferred.resolve();
            }
        }
    });
});
/**
 * @class Gollum
 * Load script under sandboxed execution context to isolate unsafe code.
 */
define('school-ui-shared/tracker/shared/gollum',['jquery'], function TrackerGollum($){
    'use strict';

    var NAME = 'Gollum';
    var EX_NO_ARG = NAME + ': Required argument is missing.';
    var EX_NO_DEFFERED = NAME + ': jQuery does not implement Deferred() method.';

    var defaultSettings = {
        url: 'about:blank'
    };

    var Deferred = $.Deferred;

    if (!Deferred){
        throw EX_NO_DEFFERED;
    }

    // @constructor
    // @param opts options: {url: 'The url for iframe.'}.
    function Gollum(opts){

        var me = this;

        me.opts = opts || defaultSettings;

        me.ready = Deferred();

        // It creates the iframe which contains the dirty scripts.
        var $gollum = (function createGollum(){
        
            var ret = $(document.createElement('iframe'));

            ret.attr('src', me.opts.url);

            ret.hide();

            ret.appendTo(document.body);

            return ret;

        })();

        me._$gollum = $gollum;

        // It also make sure that all operation are done after iframe 
        // is properly loaded
        me._$gollum.bind('load', function(){
            $gollum[0].contentWindow.__gollumArgs__ = [];
            me.ready.resolve();
        });
    }

    var p = Gollum.prototype;

    /**
     * Load script under the execution context created by gollum.
     * @param path The script path
     * @api public
     */
    p.load = function(path){
        if (!path){
            throw EX_NO_ARG; 
        }

        var me = this;
        var deferred = Deferred();

        me.ready.done(function(){

            var window = this._$gollum[0].contentWindow;
            var doc = window.document;
            var script = doc.createElement('script');

            script.src = path;

            if (script.completed){
                deferred.resolve();
            }
            else{
                script.onload = function(){
                    deferred.resolve();
                };
            }

            doc.body.appendChild(script);

        });

        return deferred;
    };

    /**
     * Execute a function under the execution context of sub window,
     *     Caveat: The function passed in cannot visit its own execution context.
     * @param func The function to be executed under the sub window, or string that
     *               contains code to be executed.
     * @param ... All the remaining parameters will be passed into 'func'.
     * @api public
     */
    p.exec = function(func){
        if (!func){
            throw EX_NO_ARG;
        }

        var me = this;
        var ret = Deferred();
        var sSource = func.toString();
        var args = Array.prototype.slice.call(arguments, 1);

        me.ready.done(function(){
            var window = me._$gollum[0].contentWindow;
            var document = window.document;

            window.__gollumArgs__.push(Array.prototype.slice.call(args));

            ret.resolve(window.eval(
                '(' + sSource + ').apply(this, this.__gollumArgs__.shift());'
            ));
        });

        return ret;
    };

    return Gollum;
});

define('troopjs-requirejs/template!school-ui-shared/tts/legacy/tts.html',[],function() { return function template(data) { var o = "<input type='hidden' id='memberid4tts' value='" +data.memberId+ "' />\n<input type='hidden' id='token4tts' value='" +data.token+ "' />\n<input type='hidden' id='isnewcourseware4tts' value='true' />\n<input type='hidden' id='siteversion4tts' value='" +data.siteVersion+ "' />"; return o; }; });
define('school-ui-shared/utils/typeid-parser',[
    "compose"
], function TypeidParserUtilModule(Compose) {
    "use strict";
    var RE_TYPEID = /^(?:(\w+)!)?!?([;\-\w]+)?/, /* format like "course!201" */
        RE_LAST_TYPEID=/(?:(\w+)[!|;])?(\d+)$/, /* format like "course!201;activity;345" */
        TYPE = "type",
        ID = "id",
        UNDEF;

    return Compose.create({
        // eg: "course!201" -> {type: "course", id: 201}
        // eg: "course!" -> {type: "course", id: undefined}
        // eg: "234234" -> {type: "", id: 234234}
        // eg: "!234234" -> {type: "", id: 234234}
        // eg: "course!sdfsdf" -> {type: "course", id: "sdfsdf"}
        // eg: "sdfsdf" -> {type: "", id: "sdfsdf"}
        // eg: "!sdfsdf" -> {type: "", id: "sdfsdf"}
        parse: function parse(typeid) {
            var matches = RE_TYPEID.exec(typeid);
            if(!matches) {
                matches = ["", "", UNDEF];
                //throw Error("invalid format of typeid, parse failed!");
            }
            var result = {};
            result[TYPE] = matches[1] || "";
            result[ID] = matches[2];
            return result;
        },

        /*
         input : "course!201;activity;345"
         output: {type:'activity',id:345}
         */
        parseLastType: function parseLastType(typeid){
            var rs=RE_LAST_TYPEID.exec(typeid)||[];
            return {
                type: rs[1],
                id  : rs[2]
            };
        },

        /*
         input : "course!201;activity;345"
         output: "activity!345"
         */
        parseLastTypeAndId: function parseLastTypeAndId(typeid){
            var rs = RE_LAST_TYPEID.exec(typeid)||[];
            return rs[1] + "!" + rs[2];
        },

        // eg: "course!201" -> "course"
        parseType: function parseType(typeid) {
            var result = this.parse(typeid);
            return result[TYPE];
        },

        // eg: "course!201" -> 201
        parseId: function parseId(typeid) {
            var result = this.parse(typeid);
            return result[ID];
        },

        // eg: "activity!1234.activityContent" -> "activity!1234"
        parseTypeid: function parseTypeid(str) {
            var result = this.parse(str);
            return result[TYPE] + "!" + result[ID];
        },

        // if input looks like a id, it returns true, otherwise false
        // eg: "course!23423" -> true
        // eg: "course!" -> true
        // eg: "course" -> false
        isId: function isId(str) {
            return ('' + str).indexOf('!') >= 0;
        }
    });
});

define('school-ui-shared/utils/query-builder',[
	"compose",
	"school-ui-shared/utils/typeid-parser"
], function QueryBuilderUtilModule(Compose, typeidParser) {
	"use strict";
	var PROGRESS = "progress!",
		CHILDREN = ".children",
		SEPARATOR = ";",
		CCL = "ccl!";

	return Compose.create({
		// input format: enrollment!1234, course!201, 1(optional)
		// output format: progress!1234;course;201.children
		buildProgressQuery: function buildProgressQuery(enrollmentid, typeid, childrenCount) {
			if(!enrollmentid || !typeid) {
				throw Error("invalid arguments, build progress query failed!");
			}
			var enrollment_id = typeidParser.parseId(enrollmentid),
				oTypeid = typeidParser.parse(typeid),
				children = "";
			if(childrenCount) {
				childrenCount = parseInt(childrenCount ,10);
				if(isNaN(childrenCount) || childrenCount < 0) {
					childrenCount = 0;
				}
				while(childrenCount-- > 0) {
					children += CHILDREN;
				}
			}
			return PROGRESS.concat([enrollment_id, oTypeid.type, oTypeid.id].join(SEPARATOR), children);
		},

		buildCCLQuery: function buildCCLQuery(variableName) {
			if (!variableName) {
				throw Error("invalid ccl variableName, build ccl query faild!");
			}
			return CCL + '"' + variableName + '"';
		}
	});
});
/**
 * legacy TTS integration wrapper in troopjs e12
 * TODO: rewrite TTS in future in troopjs way(need frontend and backend work)
 */
define('school-ui-shared/tts/legacy/main',[
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

define('troopjs-requirejs/template!school-ui-shared/tts/tts.html',[],function() { return function template(data) { var o = "<div class=\"ets-ui-tts-small-box\" data-action=\"show/box\"></div>\n<div class=\"ets-ui-tts-box\">\n    <div class=\"ets-ui-tts-close-btn\" data-action=\"close/box\"></div>\n    <div class=\"ets-ui-tts-main\">\n        <div class=\"ets-ui-tts-hd\">\n            <div class=\"ets-ui-tts-hd-listen ets-hidden\"></div>\n            <div class=\"ets-ui-tts-tabs\">\n                <div data-action=\"toggle/pin(index)\" data-index=\"0\" class=\"ets-ui-tts-tab ets-pin\">\n                    <div class=\"ets-ui-tts-tab-ico\"></div>\n                </div>\n                <div data-action=\"switch/tab(index)\" data-index=\"1\" class=\"ets-ui-tts-tab ets-translator ets-active\">\n                    <div class=\"ets-ui-tts-tab-ico\"></div>\n                    <div class=\"ets-ui-tts-tab-arrow\"></div>\n                </div>\n                <div data-action=\"switch/tab(index)\" data-index=\"2\" class=\"ets-ui-tts-tab ets-speech\">\n                    <div class=\"ets-ui-tts-tab-ico\"></div>\n                    <div class=\"ets-ui-tts-tab-arrow\"></div>\n                </div>\n                <div data-action=\"switch/tab(index)\" data-index=\"3\" class=\"ets-ui-tts-tab ets-settings\">\n                    <div class=\"ets-ui-tts-tab-ico ets-last\"></div>\n                    <div class=\"ets-ui-tts-tab-arrow\"></div>\n                </div>\n            </div>\n        </div>\n        <div class=\"ets-ui-tts-bd ets-tab-1\">\n            <div class=\"ets-ui-tts-bd-main\">\n                <div class=\"ets-ui-tts-translator ets-loading\" data-weave=\"school-ui-shared/tts/translator/main\" data-enable-translator-detail=\"" +data.enableTranslatorDetail+ "\"></div>\n                <div class=\"ets-ui-tts-speech\">\n                    <textarea class=\"ets-ui-tts-speech-input\" data-action=\"click/input\"></textarea>\n                    <div class=\"ets-ui-tts-speech-listen ets-hidden\"></div>\n                    <div class=\"ets-ui-tts-speech-tip\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"165019\" data-text-en=\"You could enter your content to listen the pronunciation, allow max 300 characters.\"></div>\n                </div>\n                <div class=\"ets-ui-tts-settings ets-hidden\"></div>\n            </div>\n        </div>\n        <div class=\"ets-ui-tts-ft\"></div>\n    </div>\n</div>\n<div id=\"ets-ui-tts-sound-sprite\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/translator.html',[],function() { return function template(data) { var o = "<div class=\"ets-ui-trans-small-box\" data-action=\"open/translator\">Translate</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/listen-panel.html',[],function() { return function template(data) { var o = "";
    var model = data || {},
        settings = model.settings || {},
        isForSpeech = model.isForSpeech,
        id = new Date().getTime();
o += "\n<div class=\"ets-ui-tts-listen-panel\">\n    <div class=\"ets-ui-tts-listen-panel-bd\">\n        <div class=\"ets-ui-tts-listen\">\n            <a id=\"ets-ui-tts-listen-btn-" +id+ "\" data-action=\"listen/speech(" +isForSpeech+ ")\" class=\"ets-ui-tts-listen-btn\" href=\"javascript:void(0)\"><span></span></a>\n        </div>\n        <div class=\"ets-ui-tts-speed\" data-action=\"toggle/speed\">\n            <div class=\"ets-ui-tts-speed-bd\">\n                <span class=\"ets-ui-tts-speed-selected\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +(settings.speed === 100 ? 167328 : 167329)+ "\"></span>\n                <ul class=\"ets-ui-tts-speed-options\">\n                    <li data-action=\"select/speed(value)\" data-value=\"100\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167328\" data-text-en=\"Normal speed\"></li>\n                    <li data-action=\"select/speed(value)\" data-value=\"80\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167329\" data-text-en=\"Slow speed\"></li>\n                </ul>\n            </div>\n        </div>\n    </div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/settings.html',[],function() { return function template(data) { var o = "";
    var model = data || {},
        settings = model.settings || {};
o += "\n<h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167332\" data-text-en=\"Voice\"></h4>\n<div class=\"ets-ui-tts-settings-voice\">\n    <input type=\"radio\" name=\"ets-ui-tts-voice\" value=\"101\"" +(settings.speaker !== 100 ? " checked='checked'" : "")+ " id=\"ets-ui-tts-voice-male\" />\n    <label for=\"ets-ui-tts-voice-male\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167334\" data-text-en=\"Male\"></label>\n    <input type=\"radio\" name=\"ets-ui-tts-voice\" value=\"100\"" +(settings.speaker === 100 ? " checked='checked'" : "")+ " id=\"ets-ui-tts-voice-female\" />\n    <label for=\"ets-ui-tts-voice-female\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167336\" data-text-en=\"Female\"></label>\n</div>\n<h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167345\" data-text-en=\"Display Mode\"></h4>\n<div class=\"ets-ui-tts-settings-display\">\n    <input type=\"checkbox\" name=\"ets-ui-tts-auto-launch\" id=\"ets-ui-tts-auto-launch\"" +(settings.autoLaunch ? " checked='checked'" : "")+ " />\n    <label for=\"ets-ui-tts-auto-launch\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167348\" data-text-en=\"Launch it automatically when a word is double-clicked\"></label>\n</div>\n<a class=\"ets-ui-tts-save-btn\" href=\"javascript:void(0)\" data-action=\"save/settings\">\n    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167349\" data-text-en=\"Save\"></span>\n</a>\n<span class=\"ets-ui-tts-settings-msg ets-done\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167350\" data-text-en=\"Saved successfully!\"></span>\n<span class=\"ets-ui-tts-settings-msg ets-fail\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167351\" data-text-en=\"Save failed, please try again!\"></span>"; return o; }; });
 /**
  * check text if can be recognized by TTS
  */
 define('school-ui-shared/tts/text-helper',[
    "compose"
], function TextHelperModule(Compose) {
    "use strict";
    var RE_TEXT_CAN_TTS = /[A-Za-z0-9\+\\]+/;
    var TEXT_ONLY_ONE_CAN_TTS = {
        "~": 1,
        "`": 1,
        "!": 1,
        "#": 1,
        "^": 1,
        "*": 1,
        "(": 1,
        ")": 1,
        "_": 1,
        "-": 1,
        "[": 1,
        "]": 1,
        "{": 1,
        "}": 1,
        "|": 1,
        ";": 1,
        ":": 1,
        "'": 1,
        ",": 1,
        ".": 1,
        "<": 1,
        ">": 1,
        "?": 1,

        "$": 1,
        "%": 1,
        "&": 1,
        "@": 1,
        "/": 1,
        "=": 1
    };

    return Compose.create({
        "canTTS": function onCheckText(text) {
            text = text || "";
            if(text.search(RE_TEXT_CAN_TTS) >= 0) {
                return true;
            } else if(text.length === 1) {
                return !!TEXT_ONLY_ONE_CAN_TTS[text];
            } else {
                return false;
            }
        }
    });
});
/**
 * TTS module definition
 */
define('school-ui-shared/tts/main',[
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

/**
 * # language map helper module definition
 */
define('school-ui-shared/tts/translator/lang-helper',[
    "compose"
], function LangHelperModule(Compose) {
    "use strict";

    /*!
     * culture code need to be mapped
     */
    var CULTURE_CODE_ES_CL = "es-CL",
        CULTURE_CODE_ID_ID = "id-ID",
        CULTURE_CODE_JA_JP = "ja-JP",
        CULTURE_CODE_KO_KR = "ko-KR",
        CULTURE_CODE_PT_BR = "pt-BR",
        CULTURE_CODE_ZH_CN = "zh-CN",
        CULTURE_CODE_ZH_HK = "zh-HK",
        CULTURE_CODE_ZH_TW = "zh-TW";

    /*!
     * bing language code need to be mapped
     *
     * Language codes representing languages that are supported by BING Translation Service
     * ar,bg,ca,zh-CHS,zh-CHT,cs,da,nl,en,et,fi,fr,de,el,ht,he,hi,mww,
     * hu,id,it,ja,ko,lv,lt,no,fa,pl,pt,ro,ru,sk,sl,es,sv,th,tr,uk,vi
     *
     * ref URL: http://api.microsofttranslator.com/V2/Ajax.svc/GetLanguagesForTranslate?appId=XXX
     */
    var BING_LANG_CODE_DE = "de",
        BING_LANG_CODE_ES = "es",
        BING_LANG_CODE_ID = "id",
        BING_LANG_CODE_JA = "ja",
        BING_LANG_CODE_KO = "ko",
        BING_LANG_CODE_PT = "pt",
        BING_LANG_CODE_ZH_CHS = "zh-CHS",
        BING_LANG_CODE_ZH_CHT = "zh-CHT";

    /*!
     * EF non-stardand language code need to be mapped
     */
    var EF_LANG_CODE_CH = "ch",
        EF_LANG_CODE_CS = "cs",
        EF_LANG_CODE_GE = "ge",
        EF_LANG_CODE_HK = "hk",
        EF_LANG_CODE_ID = "id",
        EF_LANG_CODE_JP = "jp",
        EF_LANG_CODE_KR = "kr",
        EF_LANG_CODE_SP = "sp",
        EF_LANG_CODE_PT = "pt";

    /*!
     * language code map from culture code/EF language code to bing language code
     */
    var AS_BING_LANG = {}, AS_EF_LANG = {};
    AS_BING_LANG[CULTURE_CODE_ES_CL] = BING_LANG_CODE_ES;
    AS_BING_LANG[CULTURE_CODE_ID_ID] = BING_LANG_CODE_ID;
    AS_BING_LANG[CULTURE_CODE_JA_JP] = BING_LANG_CODE_JA;
    AS_BING_LANG[CULTURE_CODE_KO_KR] = BING_LANG_CODE_KO;
    AS_BING_LANG[CULTURE_CODE_PT_BR] = BING_LANG_CODE_PT;
    AS_BING_LANG[CULTURE_CODE_ZH_CN] = BING_LANG_CODE_ZH_CHS;
    AS_BING_LANG[CULTURE_CODE_ZH_HK] = BING_LANG_CODE_ZH_CHT;
    AS_BING_LANG[CULTURE_CODE_ZH_TW] = BING_LANG_CODE_ZH_CHT;

    AS_BING_LANG[EF_LANG_CODE_CH] = BING_LANG_CODE_ZH_CHT;
    AS_BING_LANG[EF_LANG_CODE_CS] = BING_LANG_CODE_ZH_CHS;
    AS_BING_LANG[EF_LANG_CODE_GE] = BING_LANG_CODE_DE;
    AS_BING_LANG[EF_LANG_CODE_HK] = BING_LANG_CODE_ZH_CHT;
    AS_BING_LANG[EF_LANG_CODE_ID] = BING_LANG_CODE_ID;
    AS_BING_LANG[EF_LANG_CODE_JP] = BING_LANG_CODE_JA;
    AS_BING_LANG[EF_LANG_CODE_KR] = BING_LANG_CODE_KO;
    AS_BING_LANG[EF_LANG_CODE_SP] = BING_LANG_CODE_ES;
    AS_BING_LANG[EF_LANG_CODE_PT] = BING_LANG_CODE_PT;

    /*!
     * language code map from culture code to EF language code
     */
    AS_EF_LANG[CULTURE_CODE_ES_CL] = EF_LANG_CODE_SP;
    AS_EF_LANG[CULTURE_CODE_ID_ID] = EF_LANG_CODE_ID;
    AS_EF_LANG[CULTURE_CODE_JA_JP] = EF_LANG_CODE_JP;
    AS_EF_LANG[CULTURE_CODE_KO_KR] = EF_LANG_CODE_KR;
    AS_EF_LANG[CULTURE_CODE_PT_BR] = EF_LANG_CODE_PT;
    AS_EF_LANG[CULTURE_CODE_ZH_CN] = EF_LANG_CODE_CS;
    AS_EF_LANG[CULTURE_CODE_ZH_HK] = EF_LANG_CODE_CH;
    AS_EF_LANG[CULTURE_CODE_ZH_TW] = EF_LANG_CODE_CH;

    return Compose.create({
        "getBingLangByCultureCode": function onGetBingLangByCultureCode(cultureCode) {
            return AS_BING_LANG[cultureCode] || cultureCode;
        },

        "getEFLangByCultureCode": function onGetEFLangByCultureCode(cultureCode) {
            return AS_EF_LANG[cultureCode] || cultureCode;
        },

        "getBingLangByEFLang": function onGetBingLangByEFLang(eflangCode) {
            return AS_BING_LANG[eflangCode] || eflangCode;
        }
    });
});

define('troopjs-requirejs/template!school-ui-shared/tts/translator/translator.html',[],function() { return function template(data) { var o = "<div class=\"ets-ui-tts-translating\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"44578\" data-text-en=\"LOADING...Please wait\"></div>\n<div class=\"ets-ui-tts-translation\"></div>\n<div class=\"ets-ui-tts-translator-ft ets-none\">\n    <div class=\"ets-ui-tts-notebook\"></div>\n    <div class=\"ets-ui-tts-bing\"></div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/translator/translation.html',[],function() { return function template(data) { var o = "";
    var model = data || {},
        isEnglish = model.isEnglish,
        SEP_CHAR = isEnglish ? "" : "; ",
        result = model.result || {};
o += "\n<h5 class=\"ets-ui-tts-translation-hd\">\n    <p class=\"ets-ui-tts-word\">" +result.wordText+ "</p>\n    "; if(result.uk) { o += "\n    <span class=\"ets-ui-tts-ipa-region\">UK</span>\n    <span class=\"ets-ui-tts-ipa\">/" +result.uk+ "/</span>\n    ";}o += "\n    "; if(result.us) { o += "\n    <span class=\"ets-ui-tts-ipa-region\">US</span>\n    <span class=\"ets-ui-tts-ipa\">/" +result.us+ "/</span>\n    ";}o += "\n</h5>\n<ul class=\"ets-ui-tts-translation-bd" +(isEnglish ? " ets-english" : "")+ "\">\n    "; renderTranslation(result.pos || []); o += "\n</ul>\n\n"; function renderTranslation(posList) {
    var posCount = posList.length;
    for(var i = 0; i < posCount; i++) {
        renderPartOfSpeech(posList[i]);
    }
}o += "\n\n"; function renderPartOfSpeech(pos) { o += "\n<li class=\"ets-ui-tts-word-pos\">\n    <p>" +pos.partOfSpeech+ "</p>\n    <ul class=\"ets-ui-tts-word-sense\">\n        "; renderDefinition(pos.definitions || []); o += "\n    </ul>\n</li>\n";}o += "\n\n";
// For English layout : <li>definition1</li><li>definition2</li>
// Non English layout : <li>definition1; definition2</li>
function renderDefinition(definitions) {
    var index = 0,
        count = definitions.length,
        outerLoopCount = isEnglish ? count : (count > 0 ? 1 : 0),
        innerLoopCount = count - outerLoopCount + 1;
    for(var i = 0; i < outerLoopCount; i++) {
o += "\n<li class=\"ets-ui-tts-word-def\">\n    "; for(var j = 0; j < innerLoopCount; j++) { o += "\n    " +definitions[index++]+ "" +SEP_CHAR+ "\n    ";}o += "\n</li>\n";}} return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/translator/notebook.html',[],function() { return function template(data) { var o = "";
    var NOTEBOOK_TIP = "Add to My Notebook";
    var model = data || {},
        wordGroupList = model.wordGroups || [],
        wordGroupCount = wordGroupList.length,
        wordGroup;
o += "\n";if(model.enableTranslatorDetail) {o += "<a class=\"ets-ui-tts-detail-btn\" href=\"javascript:void(0)\" data-action=\"open/translator\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"163088\" data-text-en=\"Details\"></a>";}o += "\n<div class=\"ets-ui-tts-wordgroup\">\n    <span class=\"ets-ui-tts-notebook-tip\" data-action=\"notebook/toggle/wordgroup\">" +NOTEBOOK_TIP+ "</span>\n    <ul class=\"ets-ui-tts-wordgroup-list\">\n        <li class=\"ets-ui-tts-wordgroup-tip\" data-action=\"notebook/toggle/wordgroup\">" +NOTEBOOK_TIP+ "</li>\n        "; for(var i = 0; i < wordGroupCount; i++) {
            wordGroup = wordGroupList[i];
        o += "\n        <li data-action=\"notebook/add/word(wordGroupId)\" data-word-group-id=\"" +wordGroup.wordGroup_id+ "\">" +wordGroup.wordGroupName+ "</li>\n        ";}o += "\n    </ul>\n</div>\n<p class=\"ets-ui-tts-notebook-msg ets-done\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167354\" data-text-en=\"Add success!\"></p>\n<p class=\"ets-ui-tts-notebook-msg ets-fail\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167355\" data-text-en=\"Add failure, please try again!\"></p>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/translator/bing.html',[],function() { return function template(data) { var o = "";
    var model = data,
        langList = model.languageList,
        langCount = langList.length,
        lang, langCode;
o += "\n<div class=\"ets-ui-tts-bing-logo\">Powered by Microsoft<sup> &copy; </sup>Translator</div>\n<div class=\"ets-ui-tts-bing-lang\">\n    <span class=\"ets-ui-tts-bing-tip\" data-action=\"bing/toggle/lang\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"163091\" data-text-en=\"Translate to\"></span>\n    <ul class=\"ets-ui-tts-bing-lang-list\">\n        "; for(var i = 0; i < langCount; i++) {
            lang = langList[i];
            langCode = lang.cultureCode;
        o += "\n        <li data-lang-code=\"" +langCode+ "\"" +(langCode === "en" ? ' class="ets-selected"' : '')+ " data-action=\"bing/translate(langCode)\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +lang.text+ "\"></li>\n        ";}o += "\n    </ul>\n</div>"; return o; }; });
/**
 * TTS translator module definition
 */
define('school-ui-shared/tts/translator/main',[
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

define('school-ui-shared/utils/browser-check',[],function(){
	// mapping from https://msdn.microsoft.com/en-us/library/ms537503(v=vs.85).aspx#TriToken
	var TRIDENT_TO_MSIE = {
		'4': '8.0',
		'5': '9.0',
		'6': '10.0',
		'7': '11.0',
		'8': '11.0' // see http://answers.microsoft.com/en-us/ie/forum/ie11-iewindows_10/trident-version-being-reported-as-trident80-in/00091417-43c7-4f60-9198-f6634cd1c352
	};

	function parseUserAgent(userAgent) {
		var ua = userAgent.toLowerCase();

		var match = /(edge)\/([\w.]+)/.exec(ua) ||    //make sure test edge before Chrome, because "chrome" keyword is in Edge's UA
			/(chrome)[ \/]([\w.]+)/.exec(ua) ||
			/(firefox)[ \/]([\w.]+)/.exec(ua) ||
			/version\/([\d|.]+)(?: mobile\/[\w.]+)? (safari)/.exec(ua) ||
			/(webkit)[ \/]([\w.]+)/.exec(ua) ||
			/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
			// use to check compatible mode in ie
			/(?:(msie) ([\d.]+).*)?(trident)\/(\d+)/.exec(ua) ||
			/(msie) ([\w.]+)/.exec(ua) ||
			[];

		var compatibilityMode = false;
		var actualVersionOfCompatibility = null;

		if (match[2] === "safari") {
			match[2] = match[1];
			match[1] = "safari";
		} else if (match[3] === "trident") {
			var actualMsieVersion = TRIDENT_TO_MSIE[match[4]];
			if (!match[1]) {
				match[1] = "msie";
				match[2] = actualMsieVersion;
			}
			compatibilityMode = ua.indexOf('compatible') >= 0
				&& match[2] !== actualMsieVersion; // IE9 reports itself has "compatible" in default mode
			if (compatibilityMode) {
				actualVersionOfCompatibility = parseFloat(actualMsieVersion);
			}
		}

		// TODO: if we need to check anyother OS, add here
		var platform = /(ipad)[\S\s]*os (\d+)_(\d+)/.exec(ua) ||
			/(iphone)[\S\s]*os (\d+)_(\d+)/.exec(ua) ||
			//this is recommend by google, but unfortunately, few browser to follow it.
			/(android)[\S\s]*(mobile)/.exec(ua) ||
			/(android)[\S\s]*(?!mobile)/.exec(ua) ||
			//kindle fire, so special
			/(kfjwi) /.exec(ua) ||
			/(kftt) /.exec(ua) ||
			/(kfot) /.exec(ua) ||
			[];

		var os = platform[1];

		var device = "pc";

		if (os === "android" || os === "kfjwi" || os === "kftt" || os === "kfot") {
			var screen = window.screen,
				screenW = screen.width,
				screenH = screen.height,
				minSize = Math.min(screenW, screenH);
				device = minSize >= 512 ? "tablet" : "mobile";
				os = "android";
		}
		else if (os === "ipad") {
			device = "tablet";
			os = "ios";
		}
		else if (os === "iphone") {
			device = "mobile";
			os = "ios";
		}

		return {
			browser: match[1] || "",
			version: match[2] || "0.0",
			os: os,
			device: device,
			compatibilityMode: compatibilityMode,
			actualVersionOfCompatibility: actualVersionOfCompatibility
		};
	}

	var result = parseUserAgent(navigator.userAgent);
	result.parseUserAgent = parseUserAgent; // for tests
	return result;
});

define('school-ui-shared/utils/ccl',[
	"troopjs-ef/component/service",
    "troopjs-utils/deferred",
    "troopjs-utils/each",
	"school-ui-shared/utils/query-builder"
], function CCLUtilModule(Service, Deferred, Each, queryBuilder) {
	"use strict";
	
	return Service.extend({

		enableLockUnit: function enableLockUnit(queryResult) {
			return (queryResult || {}).value === "false";
		},

        getCCLByKey : function onGetCCLByKey(key, /*key,key,...*/ deferred){
            
            var me = this,
                SLICE = [].slice,
                args = SLICE.call(arguments, 0, -1),
                deferred = SLICE.call(arguments, -1)[0] || Deferred();

            if(args){
                Each(args,function(key,val){
                    args[key] = queryBuilder.buildCCLQuery(val);
                });

                Deferred(function(dfdQuery){
                    args.push(dfdQuery);
                    me.query.apply(me,args);
                }).done(function(cclVal){
                    cclVal = cclVal || {};
                    deferred.resolve.apply(deferred, SLICE.call(arguments, 0));
                });
            }            
        }   

	}).apply(Service).start();
});
define('school-ui-shared/utils/feature-access',["school-ui-shared/enum/feature-access-id"], function(FeatureAccessId){
    //var featureBits = "\u0000\u0002\u0070\u0040\u0019";//get from service
    var cache = {},
        FEATURE_UNICODE = "unicode";

    function validate(featureAccessId){
        // featureAccessId is always >= 1
        var quotient = Math.floor(featureAccessId / 16),
            remainder = featureAccessId % 16 || 16;

        return (cache[FEATURE_UNICODE].charCodeAt(quotient) & (1 << (remainder-1))) ? true : false;
    }

    return {
        validateFeatureByte: function validateFeatureByte(featureAccessId){
            return validate(featureAccessId);
        },
        hasWritingClassFeature:function hasWritingClassFeature(){
            var WRT_LIMT = "Writing class limited",
                WRT_UNLIMT = "Writing class unlimited";

            return validate(FeatureAccessId[WRT_LIMT]) || validate(FeatureAccessId[WRT_UNLIMT]);
        },
        hasGLClassFeature: function () {
            var GL = "Group discussion",
                GL_UNLIMIT = "Group discussion (unlimited)",
                GL_UPSELL = "Group discussion upsell";

            return validate(FeatureAccessId[GL]) ||
                validate(FeatureAccessId[GL_UNLIMIT]) ||
                validate(FeatureAccessId[GL_UPSELL]);
        },
        hasPLClassFeature: function () {
            var PL = "Private lesson",
                PL_MOVEON = "Private Lesson 40 - Unit Move On";

            return validate(FeatureAccessId[PL]) ||
                validate(FeatureAccessId[PL_MOVEON]);
        },
        hasCP20ClassFeature: function () {
            var PL20 = "Private Lesson 20",
                PL20_MOVEON = "Private Lesson 20 - Unit Move On",
                CP20 = "Check Point 20",
                CP20_UNLIMIT = "Check Point 20 (unlimited)";

            return validate(FeatureAccessId[PL20]) ||
                validate(FeatureAccessId[PL20_MOVEON]) ||
                validate(FeatureAccessId[CP20]) ||
                validate(FeatureAccessId[CP20_UNLIMIT]);
        },
        hasEFTClassFeature: function () {
            var EFT = "EFT";
            return validate(FeatureAccessId[EFT]);
        },
        setFeaturesUnicode: function setFeaturesUnicode(featureAccessId){
            cache[FEATURE_UNICODE] = featureAccessId;
        },
        getFeaturesUnicode: function getFeaturesUnicode(){
            return cache[FEATURE_UNICODE];
        }
    }
});
define('school-ui-shared/utils/language-fixing',["jquery", "poly/array"],
	function ($) {
		var CLS_ARABIC_FIX = "ets-ui-arabic-fix";

		// This arabic fixing is different with 2.x
		// because only activity use 1.x
		// and this html fragment was provided by database dynamically
		// not a static html element
		function arabicFix(data) {
			data.content.presentations.forEach(function (v) {
				var $html = $("<div>" + v.text + "</div>");
				$html.find("p,td,strong").each(function () {
					var $this = $(this);
					var fixText = $this.text();
					Array.prototype.every.call(fixText, function (e, i) {
						if (e.charCodeAt(0) > 160) {
							$this.addClass(CLS_ARABIC_FIX);
							return false;
						}
						return true;
					});
				});
				v.text = $html.html();
			});

			return data;
		}

		return function (data, cultureCode) {
			if (/^ar/.test(cultureCode)) {
				data = arabicFix(data);
			}
			return data;
		}
	});
define('school-ui-shared/utils/media-player',["compose", "jquery", "./browser-check", "./ccl", "../enum/ccl"], function (Compose, $, BROWSERCHECK, CCL, ENUM) {
    var VALUE = "value";
    var SHIM = "shim";
    var AUTO = "auto";
    var TYPE = "type";
    var BROWSER = "browser";
    var VERSION = "version";
    var PLAYER = "player";
    var AUDIO = "audio";
    var VIDEO = "video";

    function player(type, deferred) {
        // Quick fail if required parameter were not provided
        if (!type || !deferred) {
            throw new Error("required parameters not provided");
        }

        $.Deferred(function (dfd) {
            // Query CCL for rules
            CCL.getCCLByKey(ENUM.playerRules, dfd);
        })
            .done(function (rules) {
                // Parse rules
                rules = rules
                    && $.parseJSON(rules[VALUE]);

                // Get browser and version from BROWSERCHECK
                var browser = BROWSERCHECK[BROWSER];
                var version = BROWSERCHECK[VERSION];

                // Map players for combined rules
                var players = $.map(rules || false, function (rule) {
                    return rule
                        && (!(TYPE in rule) || type === rule[TYPE])
                        && (!(BROWSER in rule) || browser === rule[BROWSER])
                        && (!(VERSION in rule) || version >= rule[VERSION])
                        && rule[PLAYER];
                });

                // Resolve with last matched rule or SHIM
                deferred.resolve(players.pop() || SHIM);
            })
            .fail(deferred.reject);
    }

    var MediaPlayer = Compose.create({
        "videoPlayer" : function (deferred) {
            return player.call(this, VIDEO, deferred);
        },

        "audioPlayer" : function (deferred) {
            return player.call(this, AUDIO, deferred);
        }
    });

    MediaPlayer[SHIM] = SHIM;
    MediaPlayer[AUTO] = AUTO;

    return MediaPlayer;
});
define('school-ui-shared/utils/path-formatter',["troopjs-ef/component/gadget", "./typeid-parser"], function(Gadget, typeIdParser){

	var UNDEF;
	var URI = "URI";
	var NUMBER_ANY = '234'

	var EXPAND = [ , "enrollment!$2", "course!$2", "level!$2.levelName", "unit!$2", "lesson!$2", "step!$2", "activity!$2.activityContent" ];
	var PLACEHOLDER_ID = '$2';
	var PREFIX = [];
	var PREFIX_POSITION = {};
	
	var inited = false;

	/**
	 * update uri according to the IDs that passed in.
	 * @param IDs
	 */
	function routeUri() {
        var me = this;
        var uri = me[URI];
        var path = uri.path;
        var length = 0;
        
        $.each(arguments, function (i, entity) {
            var matches = typeIdParser.parse(entity);
            var type;
            var id;
            var position;

            // Is this an entity
            if (matches) {
                type = matches.type;
                id = matches.id || "";

                // Do we know where to change
                if (type in PREFIX_POSITION) {
                    // Get position
                    position = PREFIX_POSITION[type];

                    // Update path
                    path[position] = id;

                    // Update length
                    length = Math.max(length, position);
                }
            }
        });

        // Did we modify anything?
        if (++length > 1) {
            // Remove trailing part of path
            path.length = length;
            // Reroute
            me.route(uri);
        }
    }

    /**
     * remove some id value in url hash
     * @param id id or type
     */
    function unrouteUri(id) {
        var me = this;
        var uri = me[URI];
        var path = uri.path;
        var type = id;

        if (typeIdParser.isId(id)){
        	type = typeIdParser.parseType(id);
        }

        var pos = PREFIX_POSITION[type];

        if (!pos){
        	throw "pathFormatter: no such type";
        }

        while(path.length > pos) {
            path.pop();
        }   

        me.route(uri);
    }

	return (Gadget.extend(function(){
		var expand, type, l;

		init : {

			if (inited){
				break init;
			}

			// get prefixes and prefix positions
			for(var l = EXPAND.length; l--;){

				type = UNDEF;
				
				expand = EXPAND[l];

				if (expand){
					type = typeIdParser.parseType(expand.replace(PLACEHOLDER_ID, NUMBER_ANY));

					PREFIX_POSITION[type] = l;
				}

				PREFIX.unshift(type);
				
			}

			inited = true;
		}

	}, {
		PREFIX: PREFIX,
		EXPAND: EXPAND,
		POSITION: PREFIX_POSITION,
		"hub:memory/route" : function onRoute(topic, uri) {
            this[URI] = uri;
        },
		/**
	     * update uri according to the IDs that passed in.
	     * @param IDs
	     */
		expand: routeUri,

		/**
	     * remove some id value in url hash
	     * @param id id or type
	     */
		collapse: unrouteUri
	})()).start();
});
define('school-ui-shared/utils/progress-state',[
	"compose",
	"troopjs-utils/each",
	"troopjs-utils/deferred",
	"school-ui-shared/enum/progress-state",
	"troopjs-ef/component/service",
	"school-ui-shared/utils/query-builder"
], function ProgressStateUtilModule(Compose, Each, Deferred, progressState, Service, queryBuilder) {
	"use strict";
	var SLICE = [].slice;

	return Service.extend({
		"hub:memory/load/enrollment": function loadEnrollment(topic, enrollment) {
			var me = this;
			if(!enrollment) return;
			me.enrollment_id = enrollment.id;
			me.doQueryProgress();
		},
		"queryProgress": function onQueryProgress(res_id, deferred, needChilden, isResNeed){
			var me = this;
			needChilden = needChilden || 0;
			isResNeed = isResNeed || 0;
			me.queryArgs = {"res_id": res_id, "deferred": deferred, "needChilden": needChilden, "isResNeed": isResNeed};
			me.doQueryProgress();
		},
		"doQueryProgress": function onDoQueryProgress(){
			var me = this;

			if(!me.enrollment_id || !me.queryArgs) {
				return;
			}

			var prosURLs = [], prosURL, queryArr;
			var enrollment_id = me.enrollment_id,
				res_id = me.queryArgs["res_id"],
				deferred = me.queryArgs["deferred"],
				needChilden = me.queryArgs["needChilden"],
				isResNeed = me.queryArgs["isResNeed"];

			if(Object.prototype.toString.call(res_id) === "[object Array]") {
				Each(res_id,function(i,v){
					prosURL = queryBuilder.buildProgressQuery(enrollment_id,v,needChilden)
					prosURLs.push(isResNeed ? [v, prosURL]: prosURL);
				});
				prosURLs.push(deferred);
				queryArr = prosURLs;
			}
			else {
				prosURL = queryBuilder.buildProgressQuery(enrollment_id,res_id,needChilden),
					queryArr = isResNeed ? [res_id, prosURL, deferred] :  [prosURL, deferred];
			}

			me.query.apply(me, queryArr);
		},
		getActPros:function onGetActPros(act_id, deferred){
			this.queryProgress(act_id, deferred);
		},

		getActAndPros:function onGetActAndPros(act_id, deferred){
			this.queryProgress(act_id, deferred);
		},

		getStepPros:function onGetStepPros(step_id, deferred){
			this.queryProgress(step_id, deferred);
		},

		getStepAndPros:function onGetStepAndPros(step_id, deferred){
			this.queryProgress(step_id, deferred, 1, 1);
		},

		getLessonPros:function onGetLessonPros(lesson_id, deferred){
			this.queryProgress(lesson_id, deferred);
		},

		getLessonAndPros:function onGetLessonAndPros(lesson_id, deferred){
			this.queryProgress(lesson_id, deferred, 1, 1);
		},

		getUnitPros:function onGetUnitPros(unit_id, deferred){
			this.queryProgress(unit_id, deferred);
		},

		getUnitAndPros:function onGetUnitAndPros(lesson_id, deferred){
			this.queryProgress(unit_id, deferred, 1, 1);
		},

		getLevelPros:function onGetLevelPros(level_id, deferred){
			this.queryProgress(level_id, deferred);
		},

		getLevelAndPros:function onGetLevelAndPros(lesson_id, deferred){
			this.queryProgress(level_id, deferred, 1, 1);
		},

		//input : [step!334,lesson!234],deferred
		//return step_pros,lessonPros to deferrd obj
		getMixedPros:function onGetMixedPros(id_array, deferred){
			this.queryProgress(id_array, deferred);
		},
		//input : [step!334,lesson!234],deferred
		//return step,step_pros,lesson,lessonPros to deferrd obj
		getMixedAndPros:function onGetMixedPros(id_array, deferred){
			this.queryProgress(id_array, deferred, 1, 1);
		},

		notStarted: function hasStarted (state) {
			return !state || state.notStarted;
		},

		hasStarted: function hasStarted (state) {
			if(!state) {
				return false;
			}
			return !(state & progressState.notStarted);
		},

		// hasTried state contains: onGoing, completed, hasPassed isFinished
		hasTried: function hasTried(state){
			return !!state;
		},

		hasPassed: function hasPassed(state){
			if(!state) {
				return false;
			}
			return !!(state & progressState.hasPassed);
		},
		//id like activity!34, step!2354
		hasPassedMe: function(id, deferred){
			var me = this;
			me.queryProgress(id, Deferred().done(function(pros){
				deferred && deferred.resolve(me.hasPassed(pros && pros.state));
			}));
		}

	}).apply(Service).start();
});

/**
 * # util/update-help.js
 *
 * Update service wrapper
 *
 * @author UX Team
 * @version 0.0.1
 */
define('school-ui-shared/utils/update-helper',[
    "troopjs-core/component/service",
    "troopjs-utils/deferred",
    "troopjs-utils/merge",
    "json2"
], function UpdateHelperUtilModule(Service, Deferred, merge, JSON) {
    "use strict";
    var DEBUG = true;

    /*!
     * api name
     */
    var API_SUBMIT_SCORE = "school/progress/SubmitActivityScore",
        API_MOVE_ON_UNIT = "school/enrollment/MoveOnUnit",
        API_UPDATE_ENROLLMENT = "school/enrollment/Enroll",
        API_SAVE_MEMBER_SITE = "school/member_site_setting/Save",
        API_SUBMIT_RATING = "school/rating/SubmitRating",
        API_FEATURE_LOG = "school/featuresupport/Log",
        API_ACT_EVENT_LOG = "school/school_event_log/LogActivityEvent";

    /*!
     * hub name
     */
    var HUB_UPDATE_PROGRESS = "ef/update/progress";

    /*!
     * constants
     */
    var ID = "id",
        FAULT = "fault!",
        FAULT_CODE = "faultCode",
        FAULT_MSG = "faultMessage";

    /*!
     * get error status and status text from ajax error
     *
     * TODO: For ajax error we need a framework layer process?
     *
     * @param {Object} ex
     * @return {String} error
     */
    function errorOf(ex) {
        var error = "Sorry! Error occurred, please contact Administrator.";
        if(!DEBUG) {
            return error;
        }
        
        if(ex && ex.status) {
            error = ex.status + " " + ex.statusText;
        } else {
            error = ex || "unknown error";
        }
        return error;
    }

    /*!
     * verify results
     *
     * @param {Array} results
     * @return {Object} verified
     */
    function verify(results) {
        var result = results && (results[0] || results),
            verified = { success: true, data: result };
        
        if(!result || result[ID] === FAULT) {
            verified.success = false;
            verified.data = result ? result[FAULT_MSG] : "verify failed, unknown error";
        }
        return verified;
    }

    function getIframeWindow() {
        var doc = window.frames[0].document;
        var win = 'defaultView' in doc? doc.defaultView : doc.parentWindow;
        return win;
    }

    /*!
     * call update service by api
     *
     * @param {String} apiName
     * @param {Object} context Optional
     * @param {Object} data
     * @param {Object} deferred
     * @param {String} topic
     */
    function update(apiName, context, data, deferred, topic) {
        var me = this;

        if(!context || !context.constructor || !context.constructor._getBases) {
            deferred = data;
            data = context;
            context = me;
        }

        deferred = deferred || Deferred();
        Deferred(function deferredUpdate(dfdUpdate) {

            me.publish(apiName,
                data, dfdUpdate);

        })
        .done(function doneUpdate(results) {
            var verified = verify.call(me, results),
                result  = verified.data;

            if(verified.success) {
                deferred.resolve(result);
                if(topic) {
                    me.publish(topic, result);
                }
            } else {
                deferred.reject(result);
            }
        })
        .fail(function failUpdate(ex) {
            deferred.reject(errorOf.call(me, ex));
        });
    }

    return Service.extend({
        submitScore: function onSubmitScore(context, data, deferred) {
            update.call(this, API_SUBMIT_SCORE, context, data, deferred, HUB_UPDATE_PROGRESS);
        },

        moveOnUnit: function onMoveOnUnit(context, data, deferred) {
            update.call(this, API_MOVE_ON_UNIT, context, data, deferred, HUB_UPDATE_PROGRESS);
        },

        updateEnrollment: function onUpdateEnrollment(context, data, deferred) {
            update.call(this, API_UPDATE_ENROLLMENT, context, data, deferred);
        },

        submitRating: function onSubmitRating(context, data, deferred) {
            update.call(this, API_SUBMIT_RATING, context, data, deferred);
        },

        saveMemberSite: function onSubmitRating(context, data, deferred) {
            update.call(this, API_SAVE_MEMBER_SITE, context, data, deferred);
        },

        logFeature: function onLogFeature(context, data, deferred){
            update.call(this, API_FEATURE_LOG, context, data, deferred);  
        },

        logActEvent: function onLogActEvent(context, data, deferred) {
            update.call(this, API_ACT_EVENT_LOG, context, data, deferred);
        }
    }).apply(Service).start();
});

define = baseRJSDefine;
})();
