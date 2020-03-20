define('school-ui-shared/enum/abtest-query-string',{
	"activity": {
		"lngComp": "school_mvt!lancomp_new_asr_fed"
	}
});
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
    courseTypeCode: 4,
    level: 2,
    levelCode: 5,
    unit: 3,

    /*
        Notes: the following node type are obsoleted.
        Please don't use again. 
    */
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
//if null: no hyphenator pattern, language doesn't need hyphens
define('school-ui-shared/enum/hyphenator-languages',{
	"ar": null,
	"de": "de",
	"de-de": "de",
	"en": "en-us",
	"en-gb": "en-gb",
	"es": "es",
	"es-cl": "es",
	"fr": "fr",
	"id-id": null,
	"it": "it",
	"ko-kr": null,
	"ja-jp": null,
	"pt-br": "pt",
	"ru": "ru",
	"th": null,
	"tr-tr": "tr",
	"tt": "ru",
	"zh-hk": null,
	"zh-tw": null,
	"zh-cn": null
});
define('school-ui-shared/enum/moment-language',{
	"en": "en",
	"en-gb": "en",
	"pt-br": "pt-br",
	"es-cl": "es",
	"es": "es",
	"fr": "fr",
	"de": "de",
	"de-de": "de",
	"it": "it",
	"ko-kr": "ko",
	"ja-jp": "ja",
	"zh-hk": "zh-tw",
	"zh-tw": "zh-tw",
	"zh-cn": "zh-cn",
	"th": "th",
	"ru": "ru",
	"tt": "ru",
	"tr-tr": "tr",
	"id-id": "id",
	"ar": "ar"
});
define('school-ui-shared/enum/progress-state',{
	notStarted: 0,
	started: 1,
	completed: 2
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

define('troopjs-requirejs/template!school-ui-shared/plugins/alert-box/alert-box.html',[],function() { return function template(data) { var o = "";
  data = data || {};
o += "\n<div class=\"modal fade in alert-modal-box\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"alertModalLabel\" aria-hidden=\"true\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content\">\n\t\t\t<div class=\"modal-header\">\n\t\t\t\t<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n\t\t\t\t<h4 class=\"modal-title\">" + data.title + "</h4>\n\t\t\t</div>\n\t\t\t<div class=\"modal-body\">\n\t\t\t\t<p>" + data.body + "</p>\n\t\t\t</div>\n\t\t\t<div class=\"modal-footer\">\n\t\t\t\t<button type=\"button\" class=\"btn btn-default\" data-action=\"ok\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"150652\" data-text-en=\"OK\"></button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n<div class=\"modal-backdrop fade in hidden\"></div>"; return o; }; });
define('school-ui-shared/plugins/alert-box/main',[
    "when",
    "jquery.gudstrap",
    "troopjs-ef/component/widget",
    "template!./alert-box.html"
    ],function(when, $GUD, Widget, tModalBox){
    "use strict";

    var SEL_MODAL_ROOT = ".alert-modal-box";
    var SEL_MODAL_TITLE = ".modal-title";
    var SEL_MODAL_BODY = ".modal-body p";
    var SEL_BACK_DROP = ".modal-backdrop";

    var DEFERRED_OK = "_defer_ok";

    var CLS_GUD_HIDDEN = "hidden";

    return Widget.extend({   
        "sig/start": function() {
            var me = this;
            
            return me.html(tModalBox).then(function(){
                var $el = me.$element;

                me.$root = $el.find(SEL_MODAL_ROOT);
                me.$title = $el.find(SEL_MODAL_TITLE);
                me.$body = $el.find(SEL_MODAL_BODY);
                me.$backdrop = $el.find(SEL_BACK_DROP);

                me.$root.on('show.bs.modal', function($event) {
                    me.$backdrop.removeClass(CLS_GUD_HIDDEN);
                }).on('hidden.bs.modal', function($event) {
                    me.$backdrop.addClass(CLS_GUD_HIDDEN);
                    me.isBusy = false;
                    //reject the promise
                    me[DEFERRED_OK] && me[DEFERRED_OK].reject("confirm-box reject");
                });
            });
        },
        "hub/enable/show/alert-box": function() {
            return [!this.isBusy];
        },
        "hub/show/alert-modal-box": function(config) {
            var me = this;
            if(!config) return when.reject("alert-box no config");

            me.isBusy = true;
            me.$title.text(config.title);
            me.$body.html(config.body);

            me.$root.modal();

            return (me[DEFERRED_OK] = when.defer()).promise;
        },
        "dom:[data-action='ok']/click": function (event){
            var me = this;
            var defer = me[DEFERRED_OK];
            if(defer){
                defer.resolver.resolve({
                    $title : me.$title,
                    $body  : me.$body
                });
                defer.promise.then(function(){
                    me.$root.modal("hide");
                });
            }
        }
    });
});

define('troopjs-requirejs/template!school-ui-shared/plugins/confirm-box/confirm-box.html',[],function() { return function template(data) { var o = "";
  data = data || {};
o += "\n<div class=\"modal fade in confirm-modal-box\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"confirmModalLabel\" aria-hidden=\"true\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content\">\n\t\t\t<div class=\"modal-header\">\n\t\t\t\t<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n\t\t\t\t<h4 class=\"modal-title\">" + data.title + "</h4>\n\t\t\t</div>\n\t\t\t<div class=\"modal-body\">\n\t\t\t\t<p>" + data.body + "</p>\n\t\t\t</div>\n\t\t\t<div class=\"modal-footer\">\n\t\t\t\t<button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\"></button>\n\t\t\t\t<button type=\"button\" class=\"btn btn-primary\" data-action=\"confirm\"></button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n<div class=\"modal-backdrop fade in hidden\"></div>"; return o; }; });
define('school-ui-shared/plugins/confirm-box/main',[
    "when",
    "jquery.gudstrap",
    "troopjs-ef/component/widget",
    "template!./confirm-box.html"
    ],function(when, $GUD, Widget, tModalBox){
    "use strict";

    var SEL_MODAL_ROOT = ".confirm-modal-box";
    var SEL_MODAL_TITLE = ".modal-title";
    var SEL_MODAL_BODY = ".modal-body p";
    var SEL_BACK_DROP = ".modal-backdrop";
    var SEL_CANCEL = ".btn-default";
    var SEL_CONFIRM = ".btn-primary";

    var CLS_GUD_HIDDEN = "hidden";

    var DEFERRED_CONFIRM = "confirmDfd";

    var BLURB_CANCEL = "_cancel";
    var BLURB_CONFIRM = "_confirm";


    return Widget.extend({
        "sig/start": function() {
            var me = this;

            return when([   me.query("blurb!450018", "blurb!450019"),
                            me.html(tModalBox)])
                .spread(function(blurb){
                    var $el = me.$element;
                    me[BLURB_CANCEL] = blurb[0] && blurb[0].translation;
                    me[BLURB_CONFIRM] = blurb[1] && blurb[1].translation;

                    me.$root = $el.find(SEL_MODAL_ROOT);
                    me.$title = $el.find(SEL_MODAL_TITLE);
                    me.$body = $el.find(SEL_MODAL_BODY);
                    me.$cancel = $el.find(SEL_CANCEL);
                    me.$confirm = $el.find(SEL_CONFIRM);
                    me.$backdrop = $el.find(SEL_BACK_DROP);

                    me.$root.on('show.bs.modal', function($event) {
                        me.$backdrop.removeClass(CLS_GUD_HIDDEN);
                    }).on('hidden.bs.modal', function($event) {
                        me.$backdrop.addClass(CLS_GUD_HIDDEN);
                        me.isBusy = false;
                        //reject the promise
                        me[DEFERRED_CONFIRM] && me[DEFERRED_CONFIRM].reject("confirm-box reject");
                    });
            });
        },
        "hub/enable/show/confirm-box": function() {
            return [!this.isBusy];
        },
        "hub/show/confirm-modal-box": function(config) {
            var me = this;
            if(!config) return when.reject("confirm-box no config");

            me.isBusy = true;
            me.$title.text(config.title);
            me.$body.html(config.body);
            me.$cancel.text(config.cancel ? config.cancel : me[BLURB_CANCEL]);
            me.$confirm.text(config.confirm ? config.confirm : me[BLURB_CONFIRM]);

            me.$root.modal();

            return (me[DEFERRED_CONFIRM] = when.defer()).promise;
        },
        "dom:[data-action='confirm']/click": function (event){
            var me = this;
            var defer = me[DEFERRED_CONFIRM];
            if(defer){
                defer.resolver.resolve({
                    $title : me.$title,
                    $body  : me.$body
                });
                defer.promise.then(function(){
                    me.$root.modal("hide");
                });
            }
        }

    });
});
define('school-ui-shared/plugins/http-request-handling/main',['jquery',
        'troopjs-ef/component/widget'],
    function HttpRequestHandling($, Widget) {
    'use strict';

    return Widget.extend({
        "sig/start":function onStart() {
            $(document).ajaxError(function(event,jqXHR,ajaxSettings,thrownError){
                if(jqXHR.status == 403){
                    window.location.reload();
                }
            });
        }
    });
});

define('troopjs-requirejs/template!school-ui-shared/plugins/techcheck/techcheck.html',[],function() { return function template(data) { var o = "<div class=\"gud tck-ui\" data-weave=\"techcheck-ui/widget/container/main\"></div>"; return o; }; });
define('school-ui-shared/plugins/techcheck/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"template!./techcheck.html"
], function ($, Widget, tTechcheck) {
	"use strict";

	var HUB_PLUGINS_TECHCHECK_ENABLE = "plugins/tech-check/enable";

	return Widget.extend({
		"sig/start": function () {
			var me = this;

			return me.html(tTechcheck).then(function () {
				// Signal that the Tech-Check widget is ready
				return me.publish(HUB_PLUGINS_TECHCHECK_ENABLE, true);
			});
		}
	});
});

define('school-ui-shared/plugins/techcheck/techcheck-render',[
	"jquery",
	"when",
	"poly/array"
], function ($, when, polyArray) {

	var CLS_WIDGET = "ets-ui-techcheck-container",
		CLS_OVERLAY = "ets-ui-techcheck-overlay";
	var SEL_BODY = "body",
		SEL_WIDGET = "." + CLS_WIDGET,
		SEL_OVERLAY = "." + CLS_OVERLAY;

	function renderPrependTo($container, widgetName) {
		if ($container.children(SEL_WIDGET).size() === 0) {
			return $("<div></div>")
				.addClass(CLS_WIDGET)
				.attr("data-weave", widgetName)
				.prependTo($container)
				.weave();
		}
		else {
			return when.resolve();
		}
	}

	function removeOverlay() {
		$(SEL_BODY).children(SEL_OVERLAY).remove();
	}

	function renderOverlay(widgetName) {
		removeOverlay();

		return $("<div></div>")
			.addClass(CLS_OVERLAY)
			.attr("data-weave", widgetName)
			.appendTo($(SEL_BODY))
			.weave();
	}

	return {
		"renderFlashInstallBanner": function ($container, results) {
			results.some(function (result) {
				if (result.id === "flash-install" && result.passed === false) {
					renderPrependTo($container, result.widgets["banner"]);
					return true;
				}
			});
		},
		"renderFlashInstallOverlay": function (results) {
			results.some(function (result) {
				if (result.id === "flash-install" && result.passed === false) {
					renderOverlay(result.widgets["overlay"]);
					return true;
				}
			});
		},
		"removeOverlay": removeOverlay
	};
});

/**
 * load student current school context
 */
define('school-ui-shared/service/context',[
	"when",
	"troopjs-ef/component/service"
], function ContextModule(when, Service) {
	"use strict";

	function loadContext(isUpdate) {
		var me = this;

		return me.query(["school_context!current.user", "student_course_enrollment!current", "student_platform_version!current"]).spread(function doneQuery(context, courseEnroll, platformVersion) {
			return me.publish("context", context || {}, courseEnroll , platformVersion, isUpdate);
		});
	}

	/**
	 * context module definition
	 */
	return Service.extend({
		"displayName" : "school-ui-shared/service/context",

		"sig/start": function onStart() {
			var me = this;
			
			me.query("context!current").spread(function(common_context){
				me.publish("common_context", common_context);
			});

			return loadContext.call(this, false);
		},

		"hub/context/update/context": function onUpdateContext() {
			return loadContext.call(this, true);
		}
	});
});

define('school-ui-shared/utils/console',[
	"school-ui-shared/module"
],	function(module){
	var config = module.config();

	function EMPTY(){}

	function wraper(name){
		return config.debug ?
					window.console &&
						typeof window.console[name] === "function" &&
						function(){
							window.console[name].apply(window.console, arguments)
						}
						||
						EMPTY
					:
					EMPTY;
	}

	return {
		log : wraper("log"),
		warn : wraper("warn"),
		error : wraper("error"),
		info : wraper("info"),
		dir : wraper("dir"),
		time : wraper("time"),
		timeEnd : wraper("timeEnd")
	}
});
define('school-ui-shared/service/popcache',[
	"troopjs-ef/component/service",
	"school-ui-shared/utils/console",
	"jquery",
	"json2"
], function CacheFillerService(EFService, Console, $, JSON) {
	"use strict";

	/**
	 * Try out all possible ways to populate troop cache. Used for pre-fill data cache before any query that
	 * eliminates network requests.
	 */
	var CACHE = "cache";

	return EFService.extend(function CacheFillerService(cache) {
		if (!cache) {
			throw new Error("no cache provided");
		}
		this[CACHE] = cache;
	}, {
		"sig/start": function onStart() {
			var cache = this[CACHE];
			$("script[type='application/json'][data-query]").each(function(i, el) {
				var data;

				try{ 
					data = JSON.parse($(el).html());
				}
				catch(e){
					Console.info(e);
				}

				data && cache.put(data);
			});
		},

		"hub/school/clearCache": function(key) {
			var cache = this[CACHE];

			cache[key] && delete cache[key];
		}
	});
});
define('school-ui-shared/tracker/base/mock-data',[],function () {
	return [
		{
			'id': 'tracking!e12_omniture',
			'tracking': [
				{
					'id': 'tracking_item!001',
					'regex': "^school/\\d+/\\d+/\\d+/\\d+/?$",
					'props': {
						'pageName': "School:Courseware:UnitMainMenu"
					},
					'events': [
						{
							'id': 'tracking_events!001',
							'click': [
								{
									'id': 'tracking_event_click!001',
									'selector': ' .ets-overview',
									'props': {
										'pageName': "School:Courseware:Test"
									}
								}
							]
						}
					]
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
					'props': {
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
					'props': {
						'pageName': "School:Courseware:ActivityResults"
					}
				}
			]
		},
		{
			'id': 'tracking!e12_etvt',
			'tracking': [
				{
					'id': 'tracking_item!001',
					'regex': "",
					'props': {}
				}
			]
		}
	];
});

/**
 * class TrackerBase
 * The base tracker class, allows you to inherit to implement customized tracking logic
 * It does:
 *    Getting the tracking data from server according to this.scope (which specified in sub class)
 *    Monitor the hash uri change,
 *    Check if uri match the regex in tracking data.
 */
define('school-ui-shared/tracker/base/main',[
	'jquery',
	'when',
	'troopjs-ef/component/widget',
	'./mock-data'
], function BaseTrackerModule(
	$,
	when,
	Widget,
	MOCK_DATA
) {
	"use strict";

	var URI = 'uri';
	var ON_SEND = '_onSend';
	var EX_BOUND_ERR = 'Tracker widget must be bound to top-most element';

	/**
	 * Try to see if current uri is matched, if matched, send out the event.
	 * @param uri the uri to be matched and tracked.
	 */
	function sendURI(uri) {
		if (!uri) {
			return;
		}

		var me = this, data = me._data.tracking, l;

		me[URI] = uri;

		for (l = data.length; l--;) {
			if (data[l].props && data[l].regex != null && new RegExp(data[l].regex).test(uri)) {
				// this[ON_HASH_MATCH](data[l], uri);
				me[ON_SEND](data[l], {
					uri: uri
				});
			}
		}

	}

	function sendBehavior(behavior) {
		if (!behavior) {
			return;
		}

		var me = this, data = me._data.tracking, l, lb, behaviorItem, uri = me[URI];

		for (l = data.length; l--;) {

			behaviorItem = data[l].behavior;

			if (!behaviorItem ||
				// check the constrains of uri if available
				(data[l].regex && !(new RegExp(data[l].regex).test(uri)))
			) {
				continue;
			}

			for (lb = behaviorItem.length; lb--;) {
				if (behaviorItem[lb].props && behaviorItem[lb].name === behavior) {

					// this[ON_HASH_MATCH](data[l], uri);
					me[ON_SEND](behaviorItem[lb], {
						behavior: behavior
					});
				}
			}
		}

	}

	function filter(track) {
		var me = this;

		me._dfdTrackingInfo.then(function(){
			sendURI.call(me, track.uri);
			sendBehavior.call(me, track.behavior);
		});
	}

	return Widget.extend(function () {
		var me = this;

		me._dfdTrackingInfo = me.getTracking();

		me._dfdFirstRoute = when.defer();
	}, {
		'sig/start': function () {
			// check if current element is top most element
			// if its not, this widget cannot work
			var tag = this.$element[0].tagName.toUpperCase();
			if (tag !== 'BODY' && tag !== 'HTML') {
				throw EX_BOUND_ERR;
			}
		},

		'hub:memory/route': function onRoute(uri) {
			var me = this;

			filter.call(me, {
				uri: uri
			});

			me._dfdFirstRoute.resolve();
		},
		'hub:memory/tracking/track': function onTrack(track) {
			var me = this;
			var behavior = track.toString();

			if (track.name) {
				behavior = track.name;
			}

			me._dfdFirstRoute.promise.then(function () {
				filter.call(me, {
					behavior: behavior
				});
			});
		},

		'dom:[data-action="track"]/click': function (event, behavior) {
			var me = this;
			var $target = $(event.currentTarget);

			me.publish('tracking/track', behavior || $target.data('behavior'));
		},
		/**
		 * Get tracking info from remote server
		 */
		getTracking: function onGetTracking() {
			var me = this;
			var id = 'tracking!' + me.scope;

			// Check if required data is in mocking data
			for (var l = MOCK_DATA.length; l--;) {
				if (MOCK_DATA[l].id === id) {
					// if there is, resolve with the mock data
					me._data = MOCK_DATA[l];
					return when.resolve();
				}
			}

			return me.query('tracking!' + me.scope)
				.spread(function (trackingData) {
					me._data =trackingData;
				});
		},
	});
});

/**
 * Shared sandbox(gollum) instance
 */
define('school-ui-shared/tracker/sandbox/main',['gollum'], function (Gollum) {
	"use strict";

	var PATH_SCODE = '/school/tracking/e12.aspx';

	return new Gollum({
		url: PATH_SCODE
	});
});

define('school-ui-shared/tracker/etvt/etvt',[
	'../sandbox/main'
], function EtvtWrapperModule(gollum){
	"use strict";

	return {
		send: function(url){
			gollum.exec(function(url){
				if (!window.visitTrack){
					return;
				}

				window.visitTrack(url);
			}, url);
		}
	};
});

/**
 * @class omniture tracker
 * Send omniture tracking info
 */
define('school-ui-shared/tracker/etvt/main',['./etvt', '../base/main'], function OmnitureTrackerModule(etvt, Widget) {
	"use strict";

	return Widget.extend({
		scope: 'e12_etvt',
		_onSend: function onSend(data, track) {
			if (!track.uri) {
				return;
			}

			// Change hash to path format, and can let back-end save data to DB.
			// After back-end framework update, will be deleted.
			var loc = window.location;
			etvt.send(loc.protocol + '//' + loc.host + loc.pathname + (loc.pathname.substr(loc.pathname.length - 1) === "/" ? loc.hash.replace('#', '') : loc.hash.replace('#', '/')) + (loc.search ? loc.search : ''));
		}
	});
});

/***
 * @singleton omniture

 * Omniture wrapper, wraps around the original omniture s_code file,
 * make sure omniture doesn't pollute the global and also provides convininent
 * APIs for single page application.
 */
define('school-ui-shared/tracker/omniture/omniture',[
	'when',
	'../sandbox/main'
], function OmnitureWrapperModule(when, gollum) {
	'use strict';

	var FUNC_OMNI_SEND = 'E12_Tracking_Omniture_Send';

	// contains the backed up properties of the original s object
	var backup = {};

	var dfdSCode = when.promise(function(resolve, reject){
		// Init
		gollum
			.exec(function (backup) {

				if (!window.s) {
					return;
				}

				// backup the original 's' object
				for (var key in window.s) {
					backup[key] = window.s[key];
				}

			}, backup)
			.then(resolve, reject);
	});


	return {
		send: function (settings) {
			dfdSCode.then(function () {
				gollum.exec(function (FUNC_OMNI_SEND, settings, backup) {

					var s = window.s;

					if (!s || !window[FUNC_OMNI_SEND]) {
						return;
					}

					// restore the original 's' object
					for (var key in s) {
						if (!s.hasOwnProperty(key)) {
							continue;
						}

						if (key in backup) {
							s[key] = backup[key];
						}
						else {
							delete s[key];
						}

					}

					// set up the sending parameter
					for (var key in settings) {
						if (!settings.hasOwnProperty(key)) {
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
});

/**
 * @class omniture tracker
 * Send omniture tracking info
 */
define('school-ui-shared/tracker/omniture/main',['./omniture', '../base/main'], function OmnitureTrackerModule(omniture, Widget) {
	"use strict";

	return Widget.extend({
		scope: 'e12_omniture',
		_onSend: function onSend(data) {
			omniture.send(data.props);
		}
	});
});

/**
 * @class Gollum
 * Load script under sandboxed execution context to isolate unsafe code.
 */
define('school-ui-shared/tracker/shared/gollum',['jquery'], function TrackerGollum($) {
	'use strict';

	var NAME = 'Gollum';
	var EX_NO_ARG = NAME + ': Required argument is missing.';
	var EX_NO_DEFFERED = NAME + ': jQuery does not implement Deferred() method.';

	var defaultSettings = {
		url: 'about:blank'
	};

	var Deferred = $.Deferred;

	if (!Deferred) {
		throw EX_NO_DEFFERED;
	}

	// @constructor
	// @param opts options: {url: 'The url for iframe.'}.
	function Gollum(opts) {

		var me = this;

		me.opts = opts || defaultSettings;

		me.ready = Deferred();

		// It creates the iframe which contains the dirty scripts.
		var $gollum = (function createGollum() {

			var ret = $(document.createElement('iframe'));

			ret.attr('src', me.opts.url);

			ret.hide();

			ret.appendTo(document.body);

			return ret;

		})();

		me._$gollum = $gollum;

		// It also make sure that all operation are done after iframe
		// is properly loaded
		me._$gollum.bind('load', function () {
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
	p.load = function (path) {
		if (!path) {
			throw EX_NO_ARG;
		}

		var me = this;
		var deferred = Deferred();

		me.ready.done(function () {

			var window = this._$gollum[0].contentWindow;
			var doc = window.document;
			var script = doc.createElement('script');

			script.src = path;

			if (script.completed) {
				deferred.resolve();
			}
			else {
				script.onload = function () {
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
	p.exec = function (func) {
		if (!func) {
			throw EX_NO_ARG;
		}

		var me = this;
		var ret = Deferred();
		var sSource = func.toString();
		var args = Array.prototype.slice.call(arguments, 1);

		me.ready.done(function () {
			var window = me._$gollum[0].contentWindow;

			window.__gollumArgs__.push(Array.prototype.slice.call(args));

			ret.resolve(window.eval(
				'(' + sSource + ').apply(this, this.__gollumArgs__.shift());'
			));
		});

		return ret;
	};

	return Gollum;
});


define('troopjs-requirejs/template!school-ui-shared/tts/tts.html',[],function() { return function template(data) { var o = "<div class=\"ets-ui-tts-small-box\" data-action=\"show/box\"></div>\n<div class=\"ets-ui-tts-box\">\n    <div class=\"ets-ui-tts-close-btn\" data-action=\"close/box\"></div>\n    <div class=\"ets-ui-tts-main\">\n        <div class=\"ets-ui-tts-hd\">\n            <div class=\"ets-ui-tts-hd-listen ets-hidden\"></div>\n            <div class=\"ets-ui-tts-tabs\">\n                <div data-action=\"toggle/pin(index)\" data-index=\"0\" class=\"ets-ui-tts-tab ets-pin\">\n                    <div class=\"ets-ui-tts-tab-ico\"></div>\n                </div>\n                <div data-action=\"switch/tab(index)\" data-index=\"1\" class=\"ets-ui-tts-tab ets-ui-tts-tab-switch ets-translator ets-active\">\n                    <div class=\"ets-ui-tts-tab-ico\"></div>\n                    <div class=\"ets-ui-tts-tab-arrow\"></div>\n                </div>\n                <div data-action=\"switch/tab(index)\" data-index=\"2\" class=\"ets-ui-tts-tab ets-ui-tts-tab-switch ets-speech\">\n                    <div class=\"ets-ui-tts-tab-ico\"></div>\n                    <div class=\"ets-ui-tts-tab-arrow\"></div>\n                </div>\n                <div data-action=\"switch/tab(index)\" data-index=\"3\" class=\"ets-ui-tts-tab ets-ui-tts-tab-switch ets-settings\">\n                    <div class=\"ets-ui-tts-tab-ico ets-last\"></div>\n                    <div class=\"ets-ui-tts-tab-arrow\"></div>\n                </div>\n            </div>\n        </div>\n        <div class=\"ets-ui-tts-bd ets-tab-1\">\n            <div class=\"ets-ui-tts-bd-main\">\n                <div class=\"ets-ui-tts-translator ets-loading\" data-weave=\"school-ui-shared/tts/translator/main\" data-enable-translator-detail=\"" +data.enableTranslatorDetail+ "\"></div>\n                <div class=\"ets-ui-tts-speech\">\n                    <textarea class=\"ets-ui-tts-speech-input\" data-action=\"click/input\"></textarea>\n                    <div class=\"ets-ui-tts-speech-listen ets-hidden\"></div>\n                    <div class=\"ets-ui-tts-speech-tip\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"165019\" data-text-en=\"You could enter your content to listen the pronunciation, allow max 300 characters.\"></div>\n                </div>\n                <div class=\"ets-ui-tts-settings ets-hidden\"></div>\n            </div>\n        </div>\n        <div class=\"ets-ui-tts-ft\"></div>\n    </div>\n</div>\n<div id=\"ets-ui-tts-sound-sprite\"></div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/translator.html',[],function() { return function template(data) { var o = "<div class=\"ets-ui-trans-small-box\" data-action=\"open/translator\">Translate</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/listen-panel.html',[],function() { return function template(data) { var o = "";
    var model = data || {},
        settings = model.settings || {},
        isForSpeech = model.isForSpeech,
        id = new Date().getTime();
o += "\n<div class=\"ets-ui-tts-listen-panel\">\n    <div class=\"ets-ui-tts-listen-panel-bd\">\n        <div class=\"ets-ui-tts-listen\">\n            <a id=\"ets-ui-tts-listen-btn-" +id+ "\" data-action=\"listen/speech(" +isForSpeech+ ")\" data-value=\"" +isForSpeech+ "\" class=\"ets-ui-tts-listen-btn\" href=\"javascript:void(0)\"><span></span></a>\n            <audio id=\"ets-ui-tts-listen-audio-" +id+ "\" class=\"ets-ui-tts-listen-audio\"></audio>\n        </div>\n        <div class=\"ets-ui-tts-speed\" data-action=\"toggle/speed\">\n            <div class=\"ets-ui-tts-speed-bd\">\n                <span class=\"ets-ui-tts-speed-selected\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +(settings.speed === 100 ? 167328 : 167329)+ "\"></span>\n                <ul class=\"ets-ui-tts-speed-options\">\n                    <li class=\"ets-ui-tts-select-speed\" data-action=\"select/speed(value)\" data-value=\"100\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167328\" data-text-en=\"Normal speed\"></li>\n                    <li class=\"ets-ui-tts-select-speed\" data-action=\"select/speed(value)\" data-value=\"80\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167329\" data-text-en=\"Slow speed\"></li>\n                </ul>\n            </div>\n        </div>\n    </div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/settings.html',[],function() { return function template(data) { var o = "";
    var model = data || {},
        settings = model.settings || {};
o += "\n<h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167332\" data-text-en=\"Voice\"></h4>\n<div class=\"ets-ui-tts-settings-voice\">\n    <input type=\"radio\" name=\"ets-ui-tts-voice\" value=\"101\" id=\"ets-ui-tts-voice-male\"" +(settings.speaker !== 100 ? " checked='checked'" : "")+ " />\n    <label for=\"ets-ui-tts-voice-male\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167334\" data-text-en=\"Male\"></label>\n    <input type=\"radio\" name=\"ets-ui-tts-voice\" value=\"100\" id=\"ets-ui-tts-voice-female\"" +(settings.speaker === 100 ? " checked='checked'" : "")+ " />\n    <label for=\"ets-ui-tts-voice-female\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167336\" data-text-en=\"Female\"></label>\n</div>\n<h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167345\" data-text-en=\"Display Mode\"></h4>\n<div class=\"ets-ui-tts-settings-display\">\n    <input type=\"checkbox\" name=\"ets-ui-tts-auto-launch\" id=\"ets-ui-tts-auto-launch\"" +(settings.autoLaunch ? " checked='checked'" : "")+ " />\n    <label for=\"ets-ui-tts-auto-launch\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167348\" data-text-en=\"Launch it automatically when a word is double-clicked\"></label>\n</div>\n<a class=\"ets-ui-tts-save-btn\" href=\"javascript:void(0)\" data-action=\"save/settings\">\n    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167349\" data-text-en=\"Save\"></span>\n</a>\n<span class=\"ets-ui-tts-settings-msg ets-done\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167350\" data-text-en=\"Saved successfully!\"></span>\n<span class=\"ets-ui-tts-settings-msg ets-fail\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167351\" data-text-en=\"Save failed, please try again!\"></span>"; return o; }; });
define('school-ui-shared/utils/typeid-parser',[
	"troopjs-core/component/factory"
], function TypeidParserUtilModule(Factory) {
	"use strict";
	var RE_TYPEID = /^(?:(\w+)!)?!?([;\-\w]+)?/, /* format like "course!201" */
		RE_LAST_TYPEID=/(?:(\w+)[!|;])?(\d+)$/, /* format like "course!201;activity;345" */
		TYPE = "type",
		ID = "id",
		UNDEF;

	return Factory.create({
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
	"troopjs-core/component/factory",
	"school-ui-shared/utils/typeid-parser"
], function QueryBuilderUtilModule(Factory, typeidParser) {
	"use strict";
	var PROGRESS = "progress!",
		CHILDREN = ".children",
		SEPARATOR = ";",
		CCL = "ccl!";

	return Factory.create({
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
 * check text if can be recognized by TTS
 */
define('school-ui-shared/tts/text-helper',[],function TextHelperModule() {
	"use strict";
	var RE_TEXT_CAN_TTS = /[A-Za-z0-9\+\\]+/;
	var TEXT_ONLY_ONE_CAN_TTS = [
		'~',
		'`',
		'!',
		'#',
		'^',
		'*',
		'(',
		')',
		'_',
		'-',
		'[',
		']',
		'{',
		'}',
		'|',
		';',
		':',
		'\'',
		',',
		'.',
		'<',
		'>',
		'?',
		'$',
		'%',
		'&',
		'@',
		'/',
		'='
	];

	return {
		"canTTS": function onCheckText(text) {
			text = text || "";
			if (text.search(RE_TEXT_CAN_TTS) >= 0) {
				return true;
			} else if (text.length === 1) {
				return TEXT_ONLY_ONE_CAN_TTS.indexOf(text) >= 0;
			} else {
				return false;
			}
		}
	};
});

/**
 * TTS module definition
 */
define('school-ui-shared/tts/main',[
	'jquery',
	'when',
	'jquery.ui',
	'troopjs-ef/component/widget',
	'school-ui-shared/module',
	'template!./tts.html',
	'template!./translator.html',
	'template!./listen-panel.html',
	'template!./settings.html',
	'school-ui-shared/enum/ccl',
	'school-ui-shared/utils/query-builder',
	'school-ui-shared/utils/typeid-parser',
	'./text-helper',
	'Cookies'
], function TTSModule(
	$,
	when,
	ui$,
	Widget,
	module,
	tTTS,
	tTRANS,
	tListenPanel,
	tSettings,
	CCL,
	QueryBuilder,
	TypeIdParser,
	TextHelper,
	Cookies
) {
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
		TAB_PREFIX = "ets-tab-";

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

		SEL_TTS_AUDIO = ".ets-ui-tts-listen-audio",
		SEL_TTS_LISTEN_BUTTON = ".ets-ui-tts-listen-btn",
		SEL_TTS_SPEED = ".ets-ui-tts-speed",
		SEL_TTS_SPEED_SELECTED = ".ets-ui-tts-speed-selected";

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
		BLURB_PROMISE = "_blurbPromise";
	var BLURB_LIST = {};
	BLURB_LIST[BLURB_PIN_DOWN] = "PinDown";
	BLURB_LIST[BLURB_PIN_UP] = "PinUp";
	BLURB_LIST[BLURB_TRANSLATOR] = "Translator";
	BLURB_LIST[BLURB_SPEECH] = "Speech";
	BLURB_LIST[BLURB_SETTINGS] = "Settings";
	BLURB_LIST[BLURB_TRANSLATION_ERROR] = "We're sorry but there's been an error processing your request. Please try again later.";

	var TAB_HANDLERS = [0];
	TAB_HANDLERS[1] = function onTranslator() {
		var me = this,
			$widget = me[$ELEMENT];
		var $speed = $widget.find(SEL_TTS_HEAD_LISTEN).find(SEL_TTS_SPEED);
		toggleSpeed.call(me, $speed, false);
		resetTranslator.call(me);
		var text = $.trim($widget.find(SEL_TTS_SPEECH_INPUT).val());
		if (text !== "" && (me._text !== text || me[IS_FAILED])) {
			me._text = text;
			translate.call(me);
		}

	};

	TAB_HANDLERS[2] = function onSpeech() {
		var me = this,
			$widget = me[$ELEMENT];
		if (!me._isPinned) {
			me._isPinned = true;
			togglePin.call(me, true);
		}

		var $speech = $widget.find(SEL_TTS_SPEECH),
			$speed = $speech.find(SEL_TTS_SPEED);
		toggleSpeechTip.call(me, $speech, false);
		toggleSpeed.call(me, $speed, false);

		renderListenPanel.call(me, true);
	};

	TAB_HANDLERS[3] = function onSettings() {
		var me = this;
		var hideSettingsMessage = function () {
			me[$ELEMENT]
				.find(SEL_TTS_SETTINGS_MSG)
				.hide();
		};

		renderSettings.call(me);
		hideSettingsMessage();
	};

	function init() {
		var me = this;

		me[$ELEMENT].addClass(CLS_TTS);

		me._isHidden = true;
		me._isRendered = false;
		me._isPinned = false;
		me._isTranslatorTab = true;
		me._text = "";
		me._english = "";

		return initSettings.call(me)
			.ensure(function () {
				initLaunchEvent.call(me);
			});
	}

	function initSettings() {
		var me = this;
		return me.query([
			QueryBuilder.buildCCLQuery(CCL.enableFloatingToolkit),
			"student_translator_config!current",
			"tts_member_settings!current"
		]).spread(function doneQuery(cclFloatingResult, translatorConfig, settings) {
			me[ENABLE_FLOATING_TOOLKIT] = (cclFloatingResult || {}).value === "true";
			me[ENABLE_TRANSLATOR] = (translatorConfig || {}).enabled === true;
			//check autoLaunch value of the pupup window module
			if (!me[ENABLE_FLOATING_TOOLKIT]) {
				//a autolaunch value in cookie ?
				var cookieValue = checkTransAutolaunchByCookie();
				if (cookieValue === UNDEF) {
					//there isn`t cookie value, use an old interface
					return me.publish(
						"ajax",
						{
							type: "GET",
							url: "/translator/Integration/GetAutoLaunchStatus"
						}
					).then(function (data) {
						TRANS_SETTINGS.autoLaunch = data === "true";
					});
				}
				else {
					TRANS_SETTINGS.autoLaunch = cookieValue;
				}
			}
			else if (settings) {
				SETTINGS.speed = settings.speed || SETTINGS.speed;
				SETTINGS.speaker = settings.speaker || SETTINGS.speaker;
				SETTINGS.autoLaunch = settings.status !== 0;
			}
		});
	}

	function initLaunchEvent() {
		var me = this;
		var isIgnoredTarget;

		function verifyIgnoredTarget($event) {
			var target = $event.target,
				ignored = !!IGNORED_TAG[target.tagName] || target.className === CLS_TTS_DISABLED;
			if (ignored && (target.readOnly === true || target.disabled === true)) {
				ignored = false;
			}
			return ignored;
		}

		function verifyTTSTarget($event) {
			return $($event.target).closest(SEL_TTS).length > 0;
		}

		function prelaunch($event) {
			isIgnoredTarget = verifyIgnoredTarget($event);
			if (me._isHidden || me._isTtsSmallBox) {
				return;
			}
			var isFromTTS = verifyTTSTarget($event);
			if (isFromTTS) {
				isIgnoredTarget = true;
			}
			if (me._isPinned || isFromTTS) {
				return;
			}

			hide.call(me); // hide tts when unpinned
		}

		function launch($event) {
			if (isIgnoredTarget) {
				return;
			}
			var text = getSelectedText();
			if (!text) {
				return;
			}

			me._text = me._english = text;
			if (!me[ENABLE_FLOATING_TOOLKIT]) {
				var cookieValue = checkTransAutolaunchByCookie();
				if (cookieValue !== UNDEF) {
					TRANS_SETTINGS.autoLaunch = cookieValue;
				}

				if (TRANS_SETTINGS.autoLaunch) {
					openTranslator.call(me, true);
					clearSelection();
				}
				else {
					doRender.call(me)
						.ensure(function alwaysCall() {
							setTransBoxStyle.call(me);
							setTransBoxPosition.call(me, $event);
							show.call(me);
						});
				}
			}
			else {
				doRender.call(me)
					.ensure(function alwaysCall() {
						if (!me._isPinned) {
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

	function checkTransAutolaunchByCookie() {
		var preference = Cookies.get("Translator3_User_Preference");
		var preferenceSegs = preference && preference.split("~");
		//is there a autolaunch value in cookie ?
		if (preferenceSegs && preferenceSegs.length >= 3) {
			return preferenceSegs[2] === 'True';
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
		if (win.getSelection) {
			win.getSelection().removeAllRanges();
		} else if (doc.getSelection) {
			doc.getSelection().removeAllRanges();
		} else if (doc.selection) {
			doc.selection.empty();
		}
	}

	function doRender() {
		var me = this;
		if (me._isRendered) {
			return when.resolve();
		}

		me._isRendered = true;
		return render.call(me);
	}

	function render() {
		var me = this;

		if (!me[ENABLE_FLOATING_TOOLKIT]) {
			if (me[ENABLE_TRANSLATOR]) {
				return me.html(tTRANS)
					.then(function () {
						onRendered.call(me);
					});
			} else {
				return when.resolve();
			}
		}
		else {
			return me.html(tTTS({ enableTranslatorDetail: me[ENABLE_TRANSLATOR] }))
				.then(function () {
					me[$ELEMENT].find(SEL_TTS_BOX).mouseenter(function () {
						me.publish("tracking/useraction", {
							"action.translateOverlay": "1"
						});
					});
					onRendered.call(me);
				});
		}
	}

	function renderListenPanel(isForSpeech) {
		var me = this;
		if (isForSpeech) {
			if (me._speechListenRendered) {
				return when.resolve();
			}
			me._speechListenRendered = true;
		} else {
			if (me._headListenRendered) {
				return when.resolve();
			}
			me._headListenRendered = true;
		}

		var data = {
			"isForSpeech": isForSpeech,
			"settings": SETTINGS
		};

		var $widget = me[$ELEMENT].find(isForSpeech ? SEL_TTS_SPEECH_LISTEN : SEL_TTS_HEAD_LISTEN);
		return $widget
			.html(tListenPanel(data))
			.find("*")
			.weave()
			.then(function doneCall() {
				initAudioElement.call(me, $widget);
				$widget.removeClass(CLS_HIDDEN);
			}, function failCall() {
				if (isForSpeech) {
					me._speechListenRendered = false;
				} else {
					me._headListenRendered = false;
				}
			});
	}

	function renderSettings() {
		var me = this;
		if (me._settingsRendered) {
			return when.resolve();
		}

		me._settingsRendered = true;
		var $widget = me[$ELEMENT].find(SEL_TTS_SETTINGS);
		var data = {
			"settings": SETTINGS
		};
		return $widget
			.html(tSettings(data))
			.find("*")
			.weave()
			.done(function doneCall() {
				$widget.removeClass(CLS_HIDDEN);
			}, function failCall() {
				me._settingsRendered = false;
			});
	}

	function onRendered() {
		var me = this;

		setzIndex.call(me);
		setTtsBoxStyle.call(me);

		initDraggable.call(me);

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
		if (boxX > maxX) {
			boxX = maxX;
		}
		if (boxY < 0) {
			boxY = 0;
		} else if (boxY > maxY) {
			boxY = maxY;
		}
		var $widget = me[$ELEMENT], smallBox;
		$widget
			.find(SEL_TTS_BOX)
			.css({ "left": boxX, "top": boxY });

		if (me._isTtsSmallBox) {
			smallBox = $widget.find(SEL_TTS_SMALL_BOX);
			smallBox.css(getSmallBoxOffset(smallBox, $event));
		}
	}

	function setTransBoxPosition($event) {
		var me = this;
		var smallBox;
		if (me._isTransSmallBox) {
			smallBox = me[$ELEMENT].find(SEL_TRANS_SMALL_BOX);
			smallBox.css(getSmallBoxOffset(smallBox, $event));
		}
	}

	function getSmallBoxOffset(smallBox, $event) {
		var pageX = $event.pageX,
			pageY = $event.pageY;
		var $win = $(window),
			winWidth = $win.width(),
			winHeight = $win.height();

		var smallMaxX = winWidth - smallBox.width(),
			smallMaxY = winHeight - smallBox.height();
		var smallBoxX = pageX + 20,
			smallBoxY = pageY - 10;
		if (smallBoxX > smallMaxX) {
			smallBoxX = smallMaxX;
		}
		if (smallBoxY < 0) {
			smallBoxY = 0;
		} else if (smallBoxY > smallMaxY) {
			smallBoxY = smallMaxY;
		}
		return { "left": smallBoxX, "top": smallBoxY };
	}

	function getBoxSize() {
		var me = this;
		if (!me._ttsBoxSize) {
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
		if (zIndex !== UNDEF) {
			$widget.find(SEL_TTS_SMALL_BOX + "," + SEL_TTS_BOX).css("z-index", zIndex);
		}
	}

	function initDraggable() {
		var me = this,
			boxWidth = getBoxSize.call(me).width + 2,
			maxLeft = 0;

		function onStart() {
			maxLeft = $(window).width() - boxWidth;
		}

		function onDrag($event, ui) {
			var position = ui.position;
			if (maxLeft > 0 && position.left > maxLeft) {
				position.left = maxLeft;
			}
		}

		ui$(me[$ELEMENT].find(SEL_TTS_BOX))
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

	function initAudioElement($widget) {
		var $player = $widget.find(SEL_TTS_LISTEN_BUTTON);
		var $audio = $widget.find(SEL_TTS_AUDIO);
		$audio.on('play playing', function () {
			$player.removeClass(CLS_LOADING).addClass(CLS_PLAYING);
		});
		$audio.on('pause ended', function () {
			$player.removeClass(CLS_PLAYING);
		});
		$audio.on('error', function () {
			$player.removeClass(CLS_PLAYING).removeClass(CLS_LOADING);
		});
	}

	function initTabTip() {
		var me = this;
		var blurbList = BLURB_LIST;
		loadBlurb.call(me)
			.ensure(function () {
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

	function loadBlurb() {
		var me = this;
		if (!me[BLURB_PROMISE]) {
			var blurbIds = Object.keys(BLURB_LIST);
			me[BLURB_PROMISE] = me.query(blurbIds)
				.then(function (blurbs) {
					blurbs.forEach(function (blurb) {
						var translation = blurb && blurb.translation;
						if (translation) {
							BLURB_LIST[blurb.id] = translation;
						}
					});
				});
		}
		return me[BLURB_PROMISE];
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
		if (!me[ENABLE_FLOATING_TOOLKIT]) {
			setTransBoxStyle.call(me);
		}
		else {
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
		if (!me._isTranslatorTab) {
			var $tab = $widget.find(SEL_TTS_TAB_TRANSLATOR);
			initTab.call(me, $tab, TAB_INDEX_TRANSLATOR);
		}
	}

	function switchTab($tab, tabIndex) {
		var me = this;
		initTab.call(me, $tab, tabIndex);

		var handler = TAB_HANDLERS[tabIndex];
		if (typeof(handler) === TYPE_FUNCTION) {
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
		if ($player.hasClass(CLS_LOADING) ||
			$player.hasClass(CLS_PLAYING) ||
			$player.hasClass(CLS_DISABLED)) {
			return;
		}

		var me = this, $widget = me[$ELEMENT], $speech;
		var text = me._english;
		if (isForSpeech) {
			$speech = $widget.find(SEL_TTS_SPEECH);
			text = $.trim($speech.find(SEL_TTS_SPEECH_INPUT).val());
		}
		if (text.length === 0 || text.length > SETTINGS.maxTextLength) {
			if ($speech) {
				toggleSpeechTip.call(me, $speech, true);
			}
			return;
		} else if (!TextHelper.canTTS(text)) {
			if (text === DOUBLE_QUOTE) {
				text = TTS_TEXT_DOUBLE_QUOTATION;
			} else if (isForSpeech) {
				enablePlayerAudio($player, false);
				return;
			} else {
				text = TTS_TEXT_SORRY;
			}
		}

		var $audio = $player.siblings(SEL_TTS_AUDIO);
		$player.addClass(CLS_LOADING);
		var ttsUrl = SETTINGS.ttsUrl;
		var url = [
			ttsUrl + (ttsUrl.indexOf("?") >= 0 ? "&" : "?") + "m=" + me._member_id,
			"spk=" + SETTINGS.speaker,
			"spd=" + SETTINGS.speed,
			"t=" + encodeURIComponent('"' + text + '"'),
			"p=" + encodeURIComponent(location.href),
			"k="
		].join("&");
		$audio.attr('src', url);
		$audio.get(0).play();
	}

	function toggleSpeechTip($speech, show) {
		var $speechTip = $speech
			.find(SEL_TTS_SPEECH_TIP)
			.stop(true, true)
			.toggle(show);
		if (show) {
			$speechTip.delay(2000).fadeOut(3000);
		}
	}

	function enablePlayerAudio($player, enabled) {
		$player.toggleClass(CLS_DISABLED, !enabled);
	}

	function saveSettings() {
		var me = this;
		var $settings = me[$ELEMENT].find(SEL_TTS_SETTINGS);
		var showMessage = function (success) {
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

		me.publish(TOPIC_SAVE_SETTINGS, settings)
			.spread(function doneUpdate(saved) {
				saved = saved && (saved[0] || saved);
				if (saved && saved.result === 1) {
					SETTINGS.speaker = speaker;
					SETTINGS.autoLaunch = autoLaunch;
					showMessage(true);
				} else {
					showMessage(false);
				}
			})
			.catch(function failUpdate() {
				showMessage(false);
			});
	}

	function translate() {
		// SPC-2505, replace translation text's 'noisy' characters with EMPTY before translating
		var normalizeText = function (txt) {
			return ('' + txt).replace(/['"\\]/g, '') || ' ';
		};

		var me = this;
		var text = normalizeText(me._text);
		if (text.length > SETTINGS.maxTextLength) {
			text = text.substr(0, SETTINGS.maxTextLength);
		}
		me._text = text;

		me[IS_FAILED] = false;
		me.publish(TOPIC_TTS_TRANSLATOR_TRANSLATE, text, me._cultureCode)
			.catch(function failCall() {
				me[IS_FAILED] = true;
			});
	}

	function resetTranslator() {
		this.publish(TOPIC_TTS_TRANSLATOR_RESET);
	}

	function openTranslator(autoPop) {
		var me = this,
			searchText = me._text || "";
		if (searchText.length > MAX_SEARCH_TEXT_LENGTH) {
			searchText = searchText.substr(0, MAX_SEARCH_TEXT_LENGTH);
		}
		var url = "/translator/?newcourseware=true&LE=" + ("e12-new" + (autoPop ? "-pop" : "")) + "&searchText=" + encodeURIComponent(searchText),
			features = 'height=740px,width=680px,top=0,left=0,toolbar=no,resizable=yes,location=no,status=no,scrollbars=yes';
		var translatorWindow = window.open(url, 'Translator', features);
		translatorWindow.focus();
	}

	return Widget.extend({
		"sig/start": function onStart() {
			return init.call(this);
		},

		"hub:memory/context": function onContext(context) {
			if (context) {
				var me = this;
				me._member_id = +TypeIdParser.parseId((context.user || {}).id);
				me._cultureCode = context.cultureCode;
			}
		},

		"hub/tts/set/url": function onSetSpeechUrl(url) {
			if (url) {
				SETTINGS.ttsUrl = url;
			}
		},

		"hub/tts/set/english": function onSetEnglish(english) {
			this._english = english || "";
		},

		"hub/tts/get/translation/error": function onGetTranslationError() {
			return BLURB_LIST[BLURB_TRANSLATION_ERROR];
		},

		"hub/tts/open/translator": function onOpenTranslator() {
			openTranslator.call(this);
		},

		"hub/tts/close/toolkit": function onCloseToolkit() {
			hide.call(this);
		},

		"dom:.ets-ui-tts-small-box/click": function onShowBox() {
			setTtsBoxStyle.call(this, false);
		},

		"dom:.ets-ui-trans-small-box/click": function onActionOpenTranslator() {
			openTranslator.call(this);
		},

		"dom:.ets-ui-tts-close-btn/click": function onCloseBox() {
			hide.call(this);
		},

		"dom:.ets-ui-tts-tab.ets-pin/click": function onTogglePin() {
			var me = this;
			me._isPinned = !me._isPinned;
			togglePin.call(me, me._isPinned);
		},

		"dom:.ets-ui-tts-tab-switch/click": function onSwitchTab($event) {
			var $tab = $($event.currentTarget);
			if ($tab.hasClass(CLS_ACTIVE)) {
				return;
			}
			switchTab.call(this, $tab, $tab.data('index'));
		},

		"dom:.ets-ui-tts-speech-input/click": function onClickInput($event) {
			var $speech = $($event.currentTarget).closest(SEL_TTS_SPEECH);
			toggleSpeechTip.call(this, $speech, false);

			var $player = $speech.find(SEL_TTS_LISTEN_BUTTON);
			enablePlayerAudio($player, true);
		},

		"dom:.ets-ui-tts-speed/click": function onToggleSpeed($event) {
			var $speed = $($event.currentTarget);
			toggleSpeed.call(this, $speed);
		},

		"dom:.ets-ui-tts-select-speed/click": function onSelectSpeed($event) {
			var $option = $($event.currentTarget);
			var me = this;
			selectSpeed.call(me, $option.data('value'), $option.text());

			var $speed = $option.closest(SEL_TTS_SPEED);
			toggleSpeed.call(me, $speed, false);
		},

		"dom:.ets-ui-tts-listen-btn/click": function onListenSpeech($event) {
			var me = this;
			var $player = $($event.currentTarget);
			listenSpeech.call(me, $player, $player.data('value'));
			//send useraction tracking
			me.publish("tracking/useraction", {
				"action.translatePlay": "1"
			});
		},

		"dom:.ets-ui-tts-save-btn/click": function onSaveSettings() {
			saveSettings.call(this);
		}
	});
});

/**
 * # language map helper module definition
 */
define('school-ui-shared/tts/translator/lang-helper',[],function LangHelperModule() {
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

	return {
		"getBingLangByCultureCode": function onGetBingLangByCultureCode(cultureCode) {
			return AS_BING_LANG[cultureCode] || cultureCode;
		},

		"getEFLangByCultureCode": function onGetEFLangByCultureCode(cultureCode) {
			return AS_EF_LANG[cultureCode] || cultureCode;
		},

		"getBingLangByEFLang": function onGetBingLangByEFLang(eflangCode) {
			return AS_BING_LANG[eflangCode] || eflangCode;
		}
	};
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
o += "\n";if(model.enableTranslatorDetail) {o += "<a class=\"ets-ui-tts-detail-btn\" href=\"javascript:void(0)\" data-action=\"open/translator\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"163088\" data-text-en=\"Details\"></a>";}o += "\n<div class=\"ets-ui-tts-wordgroup\">\n    <span class=\"ets-ui-tts-notebook-tip ets-ui-tts-toggle-wordgroup\" data-action=\"notebook/toggle/wordgroup\">" +NOTEBOOK_TIP+ "</span>\n    <ul class=\"ets-ui-tts-wordgroup-list\">\n        <li class=\"ets-ui-tts-wordgroup-tip ets-ui-tts-toggle-wordgroup\" data-action=\"notebook/toggle/wordgroup\">" +NOTEBOOK_TIP+ "</li>\n        "; for(var i = 0; i < wordGroupCount; i++) {
            wordGroup = wordGroupList[i];
        o += "\n        <li class=\"ets-ui-tts-add-word\" data-action=\"notebook/add/word(wordGroupId)\" data-word-group-id=\"" +wordGroup.wordGroup_id+ "\">" +wordGroup.wordGroupName+ "</li>\n        ";}o += "\n    </ul>\n</div>\n<p class=\"ets-ui-tts-notebook-msg ets-done\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167354\" data-text-en=\"Add success!\"></p>\n<p class=\"ets-ui-tts-notebook-msg ets-fail\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"167355\" data-text-en=\"Add failure, please try again!\"></p>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/tts/translator/bing.html',[],function() { return function template(data) { var o = "";
    var model = data,
        langList = model.languageList,
        langCount = langList.length,
        lang, langCode;
o += "\n<div class=\"ets-ui-tts-bing-logo\">Powered by Microsoft<sup> &copy; </sup>Translator</div>\n<div class=\"ets-ui-tts-bing-lang\">\n    <span class=\"ets-ui-tts-bing-tip\" data-action=\"bing/toggle/lang\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"163091\" data-text-en=\"Translate to\"></span>\n    <ul class=\"ets-ui-tts-bing-lang-list\">\n        "; for(var i = 0; i < langCount; i++) {
            lang = langList[i];
            langCode = lang.cultureCode;
        o += "\n        <li data-lang-code=\"" +langCode+ "\" class=\"ets-ui-tts-bing-translate " +(langCode === 'en' ? 'ets-selected' : '')+ "\" data-action=\"bing/translate(langCode)\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +lang.text+ "\"></li>\n        ";}o += "\n    </ul>\n</div>"; return o; }; });
/**
 * TTS translator module definition
 */
define('school-ui-shared/tts/translator/main',[
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

define('school-ui-shared/utils/audio-output',[
	'when'
], function (when) {
	var HAS_ENUMERATE_DEVICES = Boolean(navigator.mediaDevices) &&
		typeof navigator.mediaDevices.enumerateDevices === 'function';

	var MP3_DATA_URI = 'data:audio/mpeg;base64,/+OIxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+OIxAAAAANIAAAAAExBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

	var body = document.body;

	function canPlayAudio() {
		return when
			.promise(function (resolve, reject) {
				var audio = document.createElement('audio');
				if (!audio.canPlayType('audio/mpeg')) {
					reject(new Error('cannot play mp3'));
					return;
				}
				audio.addEventListener('error', function (event) {
					if (event.srcElement && event.srcElement.error &&
						event.srcElement.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
						resolve(false);
					} else {
						reject(new Error('Unexpected audio error ' + event));
					}
					body.removeChild(audio);
				});
				audio.addEventListener('play', function () {
					resolve(true);
					body.removeChild(audio);
				});
				audio.autoplay = true;
				audio.src = MP3_DATA_URI;
				body.appendChild(audio);
			});
	}

	function hasAudioOutput() {
		if (HAS_ENUMERATE_DEVICES) {
			return when.resolve()
				.then(function () { // encapsulate in then() to catch exceptions
					return navigator.mediaDevices.enumerateDevices();
				})
				.then(function (devices) {
					return devices.reduce(function (hasOutputDevices, device) {
						return hasOutputDevices || device.kind === 'audiooutput';
					}, false);
				});
		} else {
			return when.resolve();
		}
	}

	return {
		hasAudioOutput: hasAudioOutput,
		canPlayAudio: canPlayAudio
	};
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

	    if (device === "pc" && !os) {
		    if (/mac os x/i.test(ua)) {
			    os = "osx";
		    } else if (/windows/i.test(ua)) {
			    os = "windows";
		    }
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
	"jquery",
	"troopjs-ef/component/gadget",
	"school-ui-shared/utils/query-builder"
], function CCLUtilModule($, Gadget, queryBuilder) {
	"use strict";

	var ARRAY_SLICE = Array.prototype.slice;

	return Gadget.create({
		enableLockUnit: function enableLockUnit(queryResult) {
			return (queryResult || {}).value === "false";
		},

		getCCLByKey : function onGetCCLByKey(key){
			var me = this;
			var args = ARRAY_SLICE.call(arguments);

			$.each(args,function(key,val){
				args[key] = queryBuilder.buildCCLQuery(val);
			});

			return me.query(args);
		},
		indicateCCLStringValue: function(queryResult) {
			return (queryResult || {}).value.toLowerCase() === "true";
		}
	});
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
// adjust viewport meta tag for mobile devices
// that screen width is less than minimal requirement
define('school-ui-shared/utils/fix-viewport',[
	'./browser-check'
], function (browserCheck) {
	var VIEWPORT = 'viewport';

	var HTML_MIN_WIDTH = parseInt(getComputedStyle(document.documentElement).minWidth, 10) || 0;
	var BODY_MIN_WIDTH = parseInt(getComputedStyle(document.body).minWidth, 10) || 0;
	var MIN_REQUIRED_WIDTH = 1010;  //10px for ePaper handler
	var MIN_WIDTH = Math.max(HTML_MIN_WIDTH, BODY_MIN_WIDTH, MIN_REQUIRED_WIDTH);

	var _metaViewport;
	var _initialSettings = '';

	function _getMetaViweport() {
		if (!_metaViewport) {
			_metaViewport = document.querySelector('meta[name=' + VIEWPORT + ']');

			if (!_metaViewport) {
				_metaViewport = document.createElement('meta');
				_metaViewport.name = VIEWPORT;
				(document.head || document.getElementsByTagName('head')[0]).appendChild(_metaViewport);
			}
		}

		return _metaViewport;
	}

	function _doFixViewPort() {
		var newSettings = screen.width >= MIN_WIDTH ?
			_initialSettings :
			'width=' + MIN_WIDTH + ',user-scalable=no';

		var metaViewport = _getMetaViweport();
		metaViewport.content = newSettings;
	}

	function fixViewPort() {
		var device = browserCheck.device;
		if (device !== 'tablet' && device !== 'mobile') {
			return;
		}

		if (!screen.width || !screen.height) {
			return;
		}

		if (screen.width >= MIN_WIDTH && screen.height >= MIN_WIDTH) {
			return;
		}

		var metaViewport = _getMetaViweport();
		_initialSettings = metaViewport.content;

		_doFixViewPort();

		if (
			(screen.width >= MIN_WIDTH && screen.height < MIN_WIDTH) ||
			(screen.height >= MIN_WIDTH && screen.width < MIN_WIDTH)
		) {
			window.addEventListener("orientationchange", _doFixViewPort);
		}
	}

	return fixViewPort;
});
define('school-ui-shared/utils/https-compatibility',[
	'troopjs-core/pubsub/hub',
	'logger'
], function HttpsCompatibility(Hub, Logger) {
	"use strict";

	var loc = window.location;

	if (loc.protocol !== 'https:') {
		return;
	}

	var whitelist = null;
	var prefix = 'http://' + loc.hostname;

	function onContext() {
		Hub.publish('query', 'https_compatible_urls!current')
			.spread(function (whitelistResponse) {
				whitelist = whitelistResponse && whitelistResponse.result || null;
			});
	}

	Hub.subscribe('context', Hub, onContext);
	Hub.reemit('context', false, Hub, onContext);

	function isWhitelisted(url) {
		if (!whitelist) {
			Logger.log('HTTPS whitelist not yet loaded');
			return true;
		}
		if (url.length === 0 || url.charAt(0) !== '/') {
			return true;
		}
		for (var i = 0; i < whitelist.length; ++i) {
			if (url.indexOf(whitelist[i]) === 0) {
				return true;
			}
		}
		return false;
	}

	function handleEvent(event) {
		var node = event.target;
		while (node && node.tagName !== 'A') {
			node = node.parentNode;
		}
		if (node) {
			var href = node.getAttribute('href') || '';
			if (!isWhitelisted(href)) {
				node.setAttribute('href', prefix + href);
			}
		}
	}

	document.body.addEventListener('focus', handleEvent, true);
	document.body.addEventListener('click', handleEvent, false);


	function patchOpenFunction(thisWindow, open) {
		return function (url) {
			if (!isWhitelisted(url)) {
				// force http
				var fixedArgs = Array.prototype.slice.call(arguments, 1);
				fixedArgs.unshift(prefix + url);
				return open.apply(thisWindow, fixedArgs);
			}
			// default behaviour
			return open.apply(thisWindow, arguments);
		};
	}

	window.open = patchOpenFunction(window, window.open);


	// Special case for window.parent.open used in legacy code to
	// open /translator/ page, we want to force http only in this case
	function patchParentOpenTranslatorFunction(thisWindow, open) {
		return function (url, windowName) {
			if (url.indexOf('/translator/') === 0 && windowName === 'Translator') {
				// force http
				var fixedArgs = Array.prototype.slice.call(arguments, 1);
				fixedArgs.unshift(prefix + url);
				return open.apply(thisWindow, fixedArgs);
			}
			// default behaviour
			return open.apply(thisWindow, arguments);
		};
	}

	if (window.parent !== window) {
		try {
			window.parent.open = patchParentOpenTranslatorFunction(window.parent, window.parent.open);
		} catch (ignored) {
			// probably cross-origin parent
		}
	}
});

define('school-ui-shared/utils/hub-memory',[
	"troopjs-core/pubsub/hub"
], function (Hub) {

	return {
		readMemory: function (topic) {
			var result;
			var callback = function (value) {
				result = value;
			};
			// Use "callback" as context to ensure it doesn't conflict with another subscription
			Hub.subscribe(topic, callback, callback);
			Hub.reemit(topic, false, callback, callback);
			Hub.unsubscribe(topic, callback, callback);
			return result;
		}
	}

});

define('hyphenate-Hyphenator', ["shadow!hyphenator#exports=Hyphenator"], function (Hyphenator) {
	return Hyphenator;
});

define('school-ui-shared/utils/hyphenate',[
	"require",
	"poly",
	"when",
	"troopjs-ef/component/gadget",
	"../enum/hyphenator-languages"
	//Don't depend on Hyphenator here, require the lib only if actually needed
], function (require, poly, when, Gadget, HyphenatorLanguages) {

	var loadedLanguages = {};

	function loadLanguage(hyphenatorLanguage) {
		if (hyphenatorLanguage in loadedLanguages) {
			return loadedLanguages[hyphenatorLanguage];
		}
		var promise = when.promise(function (resolve) {
			require([
				"shadow!hyphenator/patterns/" + hyphenatorLanguage + "#Hyphenator=hyphenate-Hyphenator&exports=Hyphenator"
			], resolve);
		});
		loadedLanguages[hyphenatorLanguage] = promise;
		return promise;
	}

	var currentLanguageDefer = when.defer();

	var gadget = Gadget.create({
		"hub:memory/context": function (context) {
			currentLanguageDefer.resolver.resolve(context.cultureCode);
		},
		"hyphenate": function (text) {
			var languagePromise = currentLanguageDefer.promise;
			return languagePromise.then(function (language) {
				var hyphenatorLanguage = HyphenatorLanguages[language.toLowerCase()];
				if (hyphenatorLanguage) {
					return loadLanguage(hyphenatorLanguage).then(function (Hyphenator) {
						text = Hyphenator.hyphenate(text, hyphenatorLanguage) || text;
						return [text];
					});
				} else {
					return [text];
				}
			});
		}
	});

	gadget.start();

	return gadget;
});
define('school-ui-shared/utils/language-fixing',["poly/array"],
	function () {
		var CLS_ARABIC_FIX = "ets-ui-arabic-fix";

		function arabicFix(el, data) {
			// Add rtl direction in Arabic-English mixing layout
			Array.prototype.every.call(data, function (e, i) {
				if (e.charCodeAt(0) > 160) {
					el.addClass(CLS_ARABIC_FIX);
					return false;
				}
				return true;
			});
		}

		return function (el, data, cultureCode) {
			if (/^ar/.test(cultureCode)) {
				arabicFix(el, data);
			}
		}
	});
define('school-ui-shared/utils/location-helper',[], function () {
	//constructor
	function LocationHelper(initHref) {
		var me = this;
		if (!(me instanceof LocationHelper)) {
			return new LocationHelper(initHref);
		}

		me.link = document.createElement('a');
		if (initHref) {
			me.link.href = initHref;
		}
	}

	//common function
	LocationHelper.prototype.getUrl = function () {
		return this.link.href;
	};

	LocationHelper.prototype.toString = LocationHelper.prototype.getUrl;
	LocationHelper.prototype.valueOf = LocationHelper.prototype.getUrl;

	//href
	LocationHelper.prototype.getHref = LocationHelper.prototype.getUrl;
	LocationHelper.prototype.setHref = function (value) {
		var me = this;
		me.link.href = value;
		return me;
	};

	//protocol
	LocationHelper.prototype.getProtocol = function () {
		return this.link.protocol;
	};
	LocationHelper.prototype.setProtocol = function (value) {
		var me = this;
		me.link.protocol = value;
		return me;
	};

	//host
	LocationHelper.prototype.getHost = function () {
		return this.link.host;
	};
	LocationHelper.prototype.setHost = function (value) {
		var me = this;
		me.link.host = value;
		return me;
	};

	//hostname
	LocationHelper.prototype.getHostname = function () {
		return this.link.hostname;
	};
	LocationHelper.prototype.setHostname = function (value) {
		var me = this;
		me.link.hostname = value;
		return me;
	};

	//port
	LocationHelper.prototype.getPort = function () {
		return this.link.port;
	};
	LocationHelper.prototype.setPort = function (value) {
		var me = this;
		me.link.port = value;
		return me;
	};

	//pathname
	LocationHelper.prototype.getPathname = function () {
		return this.link.pathname;
	};
	LocationHelper.prototype.setPathname = function (value) {
		var me = this;
		me.link.pathname = value;
		return me;
	};

	//search
	LocationHelper.prototype.getSearch = function () {
		return this.link.search;
	};
	LocationHelper.prototype.setSearch = function (value) {
		var me = this;
		me.link.search = value;
		return me;
	};

	//hash
	LocationHelper.prototype.getHash = function () {
		return this.link.hash;
	};
	LocationHelper.prototype.setHash = function (value) {
		var me = this;
		me.link.hash = value;
		return me;
	};

	return LocationHelper;
});
define('school-ui-shared/utils/media-player',[
	"jquery",
	"when",
	"troopjs-core/component/factory",
	 "./browser-check",
	"./ccl",
	"../enum/ccl"
], function ($, when, Factory, BROWSERCHECK, CCL, ENUM) {
    var VALUE = "value";
    var SHIM = "shim";
    var AUTO = "auto";
    var TYPE = "type";
    var BROWSER = "browser";
    var VERSION = "version";
    var PLAYER = "player";
    var AUDIO = "audio";
    var VIDEO = "video";

    function player(type) {
        // Quick fail if required parameter were not provided
        if (!type) {
            return when.reject(new Error("required parameters not provided"));
        }

		// Query CCL for rules
		return CCL
			.getCCLByKey(ENUM.playerRules)
            .spread(function (rules) {
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
                return players.pop() || SHIM;
            });
    }

    var MediaPlayer = Factory.create({
        "videoPlayer" : function () {
            return player.call(this, VIDEO);
        },

        "audioPlayer" : function () {
            return player.call(this, AUDIO);
        }
    });

    MediaPlayer[SHIM] = SHIM;
    MediaPlayer[AUTO] = AUTO;

    return MediaPlayer;
});
define('school-ui-shared/utils/media',[], function () {
	"use strict";

	function findErrorName(error) {
		var code = error && error.code || null;
		var result = typeof code === 'number' ? String(code) : null;
		var ME = window.MediaError || {};
		Object.keys(ME).some(function (name) {
			if (name.indexOf('MEDIA_') === 0 && ME[name] === code) {
				result = name;
				return true;
			}
			return false;
		});
		return result;
	}

	return {
		findErrorName: findErrorName
	};
});

define('school-ui-shared/utils/path-formatter',["troopjs-ef/component/gadget", "./typeid-parser"], function(Gadget, typeIdParser){

	var UNDEF;
	var URI = "URI";
	var NUMBER_ANY = '234';

	var EXPAND = [ , "enrollment!$2", "course!$2", "level!$2", "unit!$2", "lesson!$2", "step!$2", "activity!$2.activityContent" ];
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
		var path = uri.path || [];
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

		var path = uri.path || [];
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

	var pathFormatter = Gadget.create(function(){
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
		"displayName" : "school-ui-shared/utils/path-formatter",
		"hub:memory/route" : function onRoute(uri) {
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
	});

	pathFormatter.start();
	return pathFormatter;
});
define('school-ui-shared/utils/performance',[
], function () {
	"use strict";

	var performance = window.performance;
	var HAS_PERFORMANCE_API = Boolean(
		performance
		&& typeof performance.getEntries === 'function'
		&& window.PerformanceResourceTiming
	);

	if (HAS_PERFORMANCE_API) {
		if (typeof performance.clearResourceTimings === 'function'
			&& typeof performance.setResourceTimingBufferSize === 'function') {
			performance.onresourcetimingbufferfull = (function (onresourcetimingbufferfull) {
				if (performance.getEntries().length < 1000) {
					performance.setResourceTimingBufferSize(1000);
				}
				onresourcetimingbufferfull.apply(this, arguments);
				performance.clearResourceTimings();
			})(performance.onresourcetimingbufferfull || function () {});
		}
	}

	return {
		"getLogMessage": function () {
			if (HAS_PERFORMANCE_API) {
				var perfs = {
					timing: performance.timing,
					entries: performance.getEntries().slice(-50),
				};
				return JSON.stringify(perfs, function (key, value) {
					if (typeof value === 'number') {
						return Number(value.toFixed(3));
					}
					if (typeof value === 'string') {
						return value.replace(/\s/g, '~');
					}
					return value;
				});
			}
			return '';
		}
	};
});

define('school-ui-shared/utils/progress-state',[
	"jquery",
	"school-ui-shared/enum/progress-state",
	"troopjs-ef/component/gadget"
], function ProgressStateUtilModule($, ProgressStateEnum, Gadget) {
	"use strict";

	var progressState = Gadget.create({
		notStarted: function notStarted (state) {
			return (state === ProgressStateEnum.notStarted);
		},

		hasStarted: function hasStarted (state) {
			return (state === ProgressStateEnum.started);
		},

		hasPassed: function hasPassed(state){
			return (state === ProgressStateEnum.completed);
		}
	});

	progressState.start();

	return progressState;
});
define('school-ui-shared/utils/update-command',[
	"when",
	"troopjs-ef/component/gadget"
], function (when, Gadget) {
	"use strict";
	var DEBUG = true;

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
		return when.reject(error);
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

	/*!
	 * call update service by api
	 *
	 * @param {String} apiName
	 * @param {Object} data
	 * @param {String} topic
	 */
	function update(apiName, data, topic) {
		var me = this;
		var promise;
		me.publish("school/spinner", promise = me.publish(apiName, data));
		return promise.spread(function doneUpdate(results) {
			var verified = verify.call(me, results),
				result  = verified.data;

			if(verified.success && results !== data) {
				if(topic) {
					me.publish(topic, result);
				}
				return result;
			} else {
				throw result;
			}
		}).otherwise(function(ex){
			return errorOf.call(me, ex);
		});
	}

	return Gadget.create({
		update: update
	});
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
	"./update-command"
], function UpdateHelperUtilModule(UpdateCommand) {
	"use strict";

	/*!
	 * api name
	 */
	var API_SUBMIT_SCORE = "school/scoring/SubmitActivityScore";
	var API_UPDATE_ENROLLMENT = "school/enrollment/UpdateCurrentEnrollment";
	var API_SAVE_MEMBER_SITE = "school/member_site_setting/Save";
	var API_INTEGRATION_SUBMIT_WRITING = "schoolintegration/integration_writing/SubmitWriting";
	var API_SUBMIT_RATING = "school/rating/SubmitRating";
	var API_FEATURE_LOG = "school/featuresupport/Log";
	var API_ACT_EVENT_LOG = "school/school_event_log/LogActivityEvent";
	var API_WRITING_CORRECTION_SUBMIT_RATING = "school/writing_correction_rating/SubmitRating";
	var API_PLATFORM_MIGRATE = "school/platform2migrate/Migrate";
	var API_NEW_CONTENT_MIGRATE = "school/newcontentupgrade/Migrate";

	/*!
	 * hub name
	 */
	var HUB_UPDATE_PROGRESS = "ef/update/progress";

	return {
		submitScore: function onSubmitScore(data) {
			return UpdateCommand.update(API_SUBMIT_SCORE, data, HUB_UPDATE_PROGRESS);
		},

		moveOnUnit: function onMoveOnUnit(data) {
			return UpdateCommand.update(API_MOVE_ON_UNIT, data, HUB_UPDATE_PROGRESS);
		},

		updateEnrollment: function onUpdateEnrollment(data) {
			return UpdateCommand.update(API_UPDATE_ENROLLMENT, data);
		},

		submitRating: function onSubmitRating(data) {
			return UpdateCommand.update(API_SUBMIT_RATING, data);
		},

		saveMemberSite: function onSubmitRating(data) {
			return UpdateCommand.update(API_SAVE_MEMBER_SITE, data);
		},

		integrationSubmitWriting: function onSubmitWriting(data) {
			return UpdateCommand.update(API_INTEGRATION_SUBMIT_WRITING, data);
		},

		logFeature: function onLogFeature(data) {
			return UpdateCommand.update(API_FEATURE_LOG, data);
		},

		logActEvent: function onLogActEvent(data) {
			return UpdateCommand.update(API_ACT_EVENT_LOG, data);
		},

		submitWritingCorrectionRating: function onSubmitWritingCorrectionRating(data) {
			return UpdateCommand.update(API_WRITING_CORRECTION_SUBMIT_RATING, data);
		},

		platformMigrate: function onPlatformMigrate(data) {
			return UpdateCommand.update(API_PLATFORM_MIGRATE, data);
		},

		newContentMigrate: function onPlatformMigrate(data) {
			return UpdateCommand.update(API_NEW_CONTENT_MIGRATE, data);
		}
	};
});

define('school-ui-shared/widget/abtest-helper',[
	"jquery",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"when"
], function($, Widget, loom, when){

	"use strict";

	var $ELEMENT = "$element";

	return Widget.extend({
		// controller
		// {
		//  "value1": "widgetA",
		//  "value2": "widgetB"
		// }
		"sig/start": function onSingle() {
			var me = this;
			var $data = me[$ELEMENT].data();

			if($data.query && $data.controller) {
				return me.query($data.query).spread(function(data){
					if(typeof $data.controller == "string") {
						$data.controller = $.parseJSON($data.controller);
					}
					var widget = $data.controller[data.value];

					if(widget) {
						me[$ELEMENT].html($("<div>").attr(loom.weave, widget).attr("data-abtest", data.value));
						return me.weave();
					}
				});
			}
			else {
				return when.resolve();
			}
		}
	});
});

define('school-ui-shared/widget/audio-player/main',[
	'jquery',
	'when',
	'logger',
	"../../utils/performance",
	'troopjs-ef/component/widget',
	"school-ui-shared/utils/browser-check",
	'school-ui-shared/utils/media',
	'school-ui-shared/utils/hub-memory',
	'school-ui-shared/utils/location-helper',
	'school-ui-shared/utils/audio-output',
	'mediaelement-and-player'
], function audioPlayerModule($,
                              when,
                              Logger,
                              performanceUtils,
                              Widget,
                              browserCheck,
                              Media,
                              HubMemory,
                              LocationHelper,
                              AudioOutput,
                              mejs) {
	"use strict";

	var $ELEMENT = '$element';

	var SEL_CONTAINER = '.mejs-container';
	var SEL_BTN_PLAY = '.mejs-play';

	var CLS_CONTROLS_PLAYING = 'mejs-controls-playing';

	var EVENTS_TO_FORWARD = [
		'play', 'playing', 'pause', 'ended'
	];
	var FORWARDED_EVENT_PREFIX = 'media/';
	var MODE_NATIVE = "native";

	var blankAudio = 'data:audio/mpeg;base64,SUQzAwAAAAAAI1RTU0UAAAAPAAAATGF2ZjU3LjQxLjEwMAAAAAAAAAAAAAAA/+NAwAAAAAAAAAAAAEluZm8AAAAPAAAABwAABoYAPz8/Pz8/Pz8/Pz8/Pz9fX19fX19fX19fX19fX39/f39/f39/f39/f39/n5+fn5+fn5+fn5+fn5+fv7+/v7+/v7+/v7+/v7/f39/f39/f39/f39/f3///////////////////AAAAAExhdmM1Ny40OAAAAAAAAAAAAAAAACQAAAAAAAAAAAaGYncOXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/jQMQAAAADSAAAAABMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/40LEOwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jQsQ7AAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+NCxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/40LEOwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jQsQ7AAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+NCxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

	var logIdGenerator = 1000;

	function mediaPlayerLog(message) {
		var me = this;
		var mode = me.audioInstance ? me.audioInstance.media.pluginType : 'unknown';
		var finalMessage = me._logPrefix + ' mode=' + mode + ' ' + message;
		Logger.log(finalMessage);
	}

	function mediaPlayerLogAudioOutput(message) {
		var me = this;
		var logPrefix = me._logPrefix;
		var mode = me.audioInstance ? me.audioInstance.media.pluginType : 'unknown';

		var promiseHasAudioOutput = AudioOutput.hasAudioOutput()
		.then(function (result) {
			return 'HasOutput=' + result;
		})
		.otherwise(function (error) {
			return 'FailedToGetOutput=' + (error.message || String(error)).replace(/\s+/g, '_');
		});

		var promiseCanPlayAudio = AudioOutput.canPlayAudio()
		.then(function (result) {
			return 'CanPlayMedia=' + result;
		})
		.otherwise(function (error) {
			return 'FailedToPlayMedia=' + (error.message || String(error)).replace(/\s+/g, '_');
		});

		when.all([promiseHasAudioOutput, promiseCanPlayAudio]).spread(function (hasAudioOutput, canPlayAudio) {
			var finalMessage = logPrefix + ' mode=' + mode + ' ' + hasAudioOutput + ' ' + canPlayAudio + ' ' + message;
			Logger.log(finalMessage);
		});
	}

	function bindMediaElement(mediaElement, domElement, player) {
		function _onStartPlay() {
			me.publish('audio/event/play', mediaElement);
			player.controls.addClass(CLS_CONTROLS_PLAYING);
		}

		function _onStopPlay(){
			player.controls.removeClass(CLS_CONTROLS_PLAYING);
		}

		var me = this;
		var $domElement = $(domElement);

		mediaElement.addEventListener('play', _onStartPlay);
		mediaElement.addEventListener('pause', _onStopPlay);
		mediaElement.addEventListener('ended', _onStopPlay);

		EVENTS_TO_FORWARD.forEach(function (eventName) {
			// var listener = $domElement.trigger.bind($domElement, FORWARDED_EVENT_PREFIX + eventName);
			var listener = function () {
				$domElement.trigger(FORWARDED_EVENT_PREFIX + eventName);
			};
			mediaElement.addEventListener(eventName, listener, false);
		});

		var onError = function (e) {
			if (me._preloadFix) {
				return;
			}

			var message = e.message || Media.findErrorName(mediaElement.error) || String(e);
			var url = e.src || me._audioUrl || '';

			//for Frontend log
			var mode = mediaElement.pluginType || "";
			Logger.log("Error loading audio " + mode + " for " + url + ": " + message);

			//for Media log
			var perfLog = performanceUtils.getLogMessage();
			if (perfLog) {
				mediaPlayerLog.call(me, 'Error.Media.Perfs ' + perfLog);
			}
			mediaPlayerLogAudioOutput.call(me, 'Error.Media ' + message);
		};
		mediaElement.addEventListener('error', onError, false);
	}

	function initPlayer() {
		var me = this;
		var customOptions = $.extend(true, {}, me._audioOptions);

		//init mep
		var audio = me[$ELEMENT].get(0);
		if (!audio.src) {
			me._preloadFix =
				(browserCheck.browser === 'msie' && parseInt(browserCheck.version) > 9 ) ||
				browserCheck.browser === 'edge';

			if (me._preloadFix) {
				audio.src = blankAudio;
			}
			else {
				audio.src = audio.attributes['data-src'].value;
			}
		}

		return (me._finalized ?
				when.resolve() :
				initMediaelementPlayer.call(me, customOptions)
		).catch(function (ex) {
			ex.player && ex.player.controls && ex.player.controls.show();

			var message = 'Error.Init ';
			if (ex.canPlayType) {
				message += 'CanPlayType=' + ex.canPlayType('audio/mpeg');
			}
			else if (ex.error) {
				message += ex.error;
			}
			else if (ex.message) {
				message += ex.message;
			}
			else {
				message += String(ex);
			}
			me._logDefer.resolver.resolve(message);
			throw ex;
		});
	}

	function wrapPlayToHandleRejection(play) {
		return function playWithHandledRejection() {
			var mediaElement = this;
			var promise = play.apply(mediaElement, arguments);
			if (promise) {
				when(promise).catch(function (error) {
					if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
						if (error.code === DOMException.ABORT_ERR) {
							// ignore
							return;
						}
					}
					var nodes = [mediaElement].concat(
						Array.prototype.slice.call(mediaElement.querySelectorAll('source')));
					var src = nodes.map(function (node) {
						return node.src;
					}).join(', ');
					Logger.log('Audio play() exception: ' + String(error) + '\n' + src);
				});
			}
			return promise;
		};
	}

	function initMediaelementPlayer(customOptions) {
		var me = this;

		return when.promise(function (resolve, reject) { //handle exceptions
			me.audioInstance = new mejs.MediaElementPlayer(me[$ELEMENT].get(0), {
				mode: MODE_NATIVE,
				plugins: [],
				pauseOtherPlayers: (typeof customOptions.pauseOtherPlayers === 'boolean' ? customOptions.pauseOtherPlayers : true),
				alwaysShowControls: (typeof customOptions.alwaysShowControls === 'boolean' ? customOptions.alwaysShowControls : true),
				playpauseText: '',
				success: function (mediaElement, domElement, player) {
					mediaElement.play = wrapPlayToHandleRejection(mediaElement.play);

					var $domElement = $(domElement);
					$domElement.closest(SEL_CONTAINER).css("display", "inline-block");

					if (me._preloadFix) {
						me[$ELEMENT].closest(SEL_CONTAINER).find(SEL_BTN_PLAY).one('click', me._onFirstTimePlay = function onFirstTimePlay(e) {
							me._preloadFix = false;
							e.stopImmediatePropagation();
							var src = $domElement.data("src");
							me._audioUrl = src;
							updateLogPrefix.call(me);

							mediaElement.pause();
							mediaElement.setSrc(src);
							mediaElement.play();
						});
					}

					bindMediaElement.call(me, mediaElement, domElement, player);

					me._logDefer.resolver.resolve();

					resolve();
				},
				error: reject
			});
		});
	}

	function updateLogPrefix() {
		var me = this;
		var $el = me[$ELEMENT];

		var course = HubMemory.readMemory('load/course');
		var level = HubMemory.readMemory('load/level');
		var activity = HubMemory.readMemory('load/activity');
		var activityOption = $el.closest('.ets-act-bd-activity').data('option');
		var activityContent = activityOption && activityOption.activityContent;

		var courseTypeCode = course && course.courseTypeCode || '';
		var levelId = level && (level.templateLevelId || level.id) || '';    //templateLevelId for platform 2, id for platform 1
		var levelCode = level && (level.levelCode || level.levelNo) || '';
		var activityId = activity && (activity.templateActivityId || activity.id) || '';    //templateActivityId for platform 2, id for platform 1
		var activityTemplateCode = activityContent && activityContent.templateCode || '';
		var mediaUrl = me._audioUrl.replace(/ /g, '%20');
		var browser = browserCheck.browser + '/' + parseInt(browserCheck.actualVersionOfCompatibility || browserCheck.version, 10);
		if (!me._logid) {
			me._logid = (new Date().getTime()) + '.' + (logIdGenerator++);
		}

		me._logPrefix = [
			'NewMediaPlayer audio',
			'courseTypeCode=' + courseTypeCode,
			'level=' + levelId,
			'levelCode=' + courseTypeCode + '_' + levelCode,
			'activity=' + activityId,
			'activityType=' + activityTemplateCode,
			'url=' + mediaUrl,
			'browser=' + browser,
			'logid=' + me._logid
		].join(' ');
	}

	return Widget.extend(function () {
		var me = this;
		me._finalized = false;
		me._audioOptions = me[$ELEMENT].data();
		me._audioUrl = me[$ELEMENT].data('src') || me[$ELEMENT].get(0).src;
		me.audioInstance = null;
		updateLogPrefix.call(me);

		me._preloadFix = false;

		me._logDefer = when.defer();
		me._logDefer.promise.then(function (message) {
			message && mediaPlayerLog.call(me, message);
		});
	}, {
		"sig/start": function onStart() {
			var me = this;
			return initPlayer.call(me);
		},
		'sig/stop': function () {
			var me = this;
			me._finalized = true;
			me.audioInstance.pause();
			me.audioInstance = null;
		},

		"hub/audio/event/play": function (sourceMediaElement) {
			var me = this;

			// on another audio-player plays
			if (me.audioInstance
				&& sourceMediaElement !== me.audioInstance.media
				&& me.audioInstance.media.currentTime > 0
			) {
				// force reset current time to match previous behaviour
				me.audioInstance.media.setCurrentTime(0);
				me.audioInstance.media.pause();
			}
		},

		"dom/player/play": function play($event, src) {
			var me = this;
			if (me.audioInstance) {
				if (src) {
					if (me._preloadFix) {
						me._preloadFix = false;
						me._onFirstTimePlay && me[$ELEMENT].closest(SEL_CONTAINER).find(SEL_BTN_PLAY).unbind('click', me._onFirstTimePlay);
					}

					me._audioUrl = src;
					updateLogPrefix.call(me);

					me.audioInstance.media.pause();
					me.audioInstance.media.setSrc(src);
					me.audioInstance.media.load();
				}
				me.audioInstance.media.play();
			}
		},
		"dom/player/pause": function pause() {
			var me = this;
			if (me.audioInstance) {
				me.audioInstance.media.pause();
			}
		},
		"dom/player/seek": function seek($event, seekedTime) {
			var me = this;
			if (me.audioInstance) {
				var paused = me.audioInstance.media.paused;
				me.audioInstance.media.setCurrentTime(seekedTime);
				if (paused) {
					me.audioInstance.media.pause();
				}
			}
		},
		"dom/player/end": function end() {
			var me = this;
			if (me.audioInstance) {
				me.audioInstance.media.setCurrentTime(0);
				me.audioInstance.media.pause();
			}
		},
		"dom/player/volume": function setVolume($event, volumeInfo) {
			var me = this;
			if (me.audioInstance) {
				me.audioInstance.media.setVolume(volumeInfo.volume);

				if (typeof volumeInfo.muted === 'boolean') {
					me.audioInstance.media.setMuted(volumeInfo.muted);
				}
			}
		}
	});
});

define('school-ui-shared/widget/blurb',[
	"when",
	"troopjs-ef/component/widget"
	], function(when, Widget){

		var RE = /(?:\^(\w+)\^)/g;
		var PATTERNS = {
			"default" : RE
		};

		return Widget.extend({
			"sig/start" : function cclBlurbStart () {
				var me = this;
				var data = me.$element.data();
				//if there is a blurb-ccl in data, we try to use the ccl value as the blurb id
				return when(data.blurbCcl && me.query("ccl!'" + data.blurbCcl + "'"))
					.then(function(cclValue){
						//if the ccl value is undefined, we use origin blurb id in data
						var id = cclValue && cclValue[0] && cclValue[0].value || data.blurbId;
						if(id){
							// Query for blurb
							return me.query("blurb!" + id).spread(function doneQuery(blurb) {
								var pattern = data.pattern;
								var values = data.values;
								var translation = blurb && blurb.translation || "";

								if (translation && values) {
									pattern = pattern
										? PATTERNS[pattern] || RegExp(pattern, "g")
										: RE;

										translation = translation.replace(pattern, function (match, key, position, original) {
											return values[key] || key;
										});
								}
								// Set html, pass deferred
								return me.html(translation);
							});						
						}
					});
			}

		});
	});
define('school-ui-shared/widget/hyphenate',[
	"poly",
	"when",
	"jquery",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"../utils/hyphenate"
], function (poly, when, $, Widget, loom, HyphenateGadget) {

	var $ELEMENT = "$element";
	var PROP_WIDGET_NAME = "_widgetName";
	var requestAnimationFrame = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 16);
		};

	return Widget.extend(function ($element, name, widgetName) {
		this[PROP_WIDGET_NAME] = widgetName;
	}, {
		"sig/start": function onStart() {
			var me = this;
			var $element = me[$ELEMENT];

			var promise;
			if (me[PROP_WIDGET_NAME]) {
				var $newWidget = $element.clone();
				$newWidget.attr(loom.weave, me[PROP_WIDGET_NAME]);
				$newWidget.removeAttr(loom.unweave);
				$newWidget.removeAttr(loom.woven);
				promise = me.html($newWidget);
			} else {
				promise = when.resolve();
			}

			return promise.then(function () {
				//wait next animation frame, content is likely to have been rendered so we can measure width
				// without blocking
				return when.promise(function (resolve) {
					requestAnimationFrame(resolve);
				});
			}).then(function () {
				if ($element.width() > $element.parent().width()) {
					//overflow, need to hyphenate texts

					//In case it contains DOM elements, hyphenate each text node one by one
					var hyphenatePromises = $element.find('*').andSelf().contents()
						.filter(function(){
							return this.nodeType === 3; //text node
						})
						.map(function(){
							//can't use this.textContent in IE8, use .text() and createTextNode() instead
							var $textNode = $(this);
							var text = $textNode.text() || '';
							return HyphenateGadget.hyphenate(text).spread(function (hyphenatedText) {
								$textNode.replaceWith(document.createTextNode(hyphenatedText));
							})
						})
						.get();

					return when.all(hyphenatePromises);
				}
			});
		}
	});
});

define('troopjs-requirejs/template!school-ui-shared/widget/unit-overview/container/container.html',[],function() { return function template(data) { var o = "<div class=\"ets-uo-container ets-uo-loading\">\n\t<div class=\"ets-uo-title-bar\">\n\t\t<div class=\"ets-uo-title\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"450055\" data-text-en=\"Unit overview\"></div>\n\t\t"; if (!data.hideWorldList && data.showDownloadButton) { o += "\n\t\t<div class=\"ets-uo-export\" data-weave-delay=\"school-ui-shared/widget/unit-overview/export-pdf/main\"></div>\n\t\t"; } o += "\n\t</div>\n\t<div class=\"ets-uo-unit-info\" data-weave-delay=\"school-ui-shared/widget/unit-overview/unit-info/main(data)\"></div>\n\t"; if (!data.hideWorldList) { o += "\n\t<div class=\"ets-uo-word-list\" data-weave-delay=\"school-ui-shared/widget/unit-overview/word-list/main(data)\"></div>\n\t"; } o += "\n</div>"; return o; }; });
define('school-ui-shared/widget/unit-overview/container/main',[
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


define('troopjs-requirejs/template!school-ui-shared/widget/unit-overview/export-pdf/export-pdf.html',[],function() { return function template(data) { var o = "<a class=\"ets-uo-export-link\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"134772\" data-text-en=\"Download\"></a>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/widget/unit-overview/export-pdf/pdf-style.html',[],function() { return function template(data) { var o = "<style type=\"text/css\">\n\tbody {\n\t\tfont: 14px/1.5 Helvetica, Arial, sans-serif;\n\t}\n\n\t.ets-uo-title {\n\t\tfloat: left;\n\t\tmargin: 0 15px 5px 0;\n\t\tcolor: #070;\n\t}\n\n\t.ets-uo-unit-info .ets-uo-course-location {\n\t\tfloat: left;\n\t\tmargin: 0 15px 5px 0;\n\t\tcolor: #070;\n\t}\n\n\t.ets-uo-unit-info .ets-uo-unit-name {\n\t\tclear: left;\n\t\tcolor: #15a;\n\t\tmargin-bottom: 20px;\n\t\tfont-size: 16px;\n\t\tfont-weight: bold;\n\t}\n\n\t.ets-uo-word-list .ets-uo-word-list-title {\n\t\tcolor: #15a;\n\t\tfont-size: 14px;\n\t}\n\n\t.ets-uo-word-list table {\n\t\tborder-collapse: collapse;\n\t\tborder: 1px #eee solid;\n\t\twidth: 640px;\n\t\tfont-size: 12px;\n\t}\n\n\t.ets-uo-word-list th,\n\t.ets-uo-word-list td {\n\t\tborder: 1px #eee solid;\n\t\tpadding: 5px 8px;\n\t\tempty-cells: show;\n\t}\n\n\t.ets-uo-word-list th {\n\t\twhite-space: nowrap;\n\t\tbackground: #f1f1f1;\n\t}\n\n\t.ets-uo-word-list td {\n\t\tcolor: #333;\n\t}\n</style>"; return o; }; });

define('troopjs-requirejs/template!school-ui-shared/widget/unit-overview/export-pdf/submit-form.html',[],function() { return function template(data) { var o = "<form method=\"post\" action=\"" +data.exportPdfUrl+ "\">\n\t<input type=\"hidden\" name=\"pdfContent\" value=\"" +data.pdfContent.replace(/\"/g,'&quot;')+ "\"/>\n\t<input type=\"hidden\" name=\"fileName\" value=\"" +data.fileName+ "\"/>\n\t<input type=\"hidden\" name=\"cacheServers\" value='[\"\"]'/>\n</form>"; return o; }; });
define('school-ui-shared/widget/unit-overview/export-pdf/main',[
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


define('troopjs-requirejs/template!school-ui-shared/widget/unit-overview/modal-container/modal-container.html',[],function() { return function template(data) { var o = "<div class=\"modal fade ets-uo-modal ets-uo-modal-loading\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"Unit Overview\" aria-hidden=\"true\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content\">\n\t\t\t<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n\t\t\t<!--<div data-weave=\"school-ui-shared/widget/unit-overview/container/main(templateUnitId)\"></div>-->\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-shared/widget/unit-overview/modal-container/main',[
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


define('troopjs-requirejs/template!school-ui-shared/widget/unit-overview/unit-info/unit-info.html',[],function() { return function template(data) { var o = "";
var data = data || {};
var isGE = data.isGE;
var level = data.level || {};
var unit = data.unit || {};
var lessons = data.lessons || [];
o += "\n<div class=\"ets-uo-unit-image\">\n\t<img src=\"" + unit.unitImage.url + "\"/>\n</div>\n<div class=\"ets-uo-unit-fields\">\n\t<div class=\"ets-uo-course-location\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"126799\" data-text-en=\"Level\"></span>\n\t\t<span class=\"ets-uo-level-no\">" +(isGE ? level.levelNo : level.levelName)+ "</span>\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"126802\" data-text-en=\"Unit\"></span>\n\t\t<span class=\"ets-uo-unit-no\">" +unit.unitNo+ "</span>\n\t</div>\n\t<div class=\"ets-uo-unit-name\">" +unit.unitName+ "</div>\n\t<div class=\"ets-uo-unit-desc\">" +(unit.unitDesc || '')+ "</div>\n</div>\n<div class=\"ets-uo-unit-task\">\n\t<div data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"470915\" data-text-en=\"Tasks\"></div>\n\t<ul>\n\t\t"; lessons.forEach(function (lesson) { o += "\n\t\t<li>" + lesson.lessonName + "</li>\n\t\t"; }); o += "\n\t</ul>\n</div>"; return o; }; });
define('school-ui-shared/widget/unit-overview/unit-info/main',[
	'troopjs-ef/component/widget',
	"school-ui-shared/enum/course-type",
	'template!./unit-info.html'
], function (Widget, courseType, tUnitInfo) {
	'use strict';

	return Widget.extend(function (element, path, data) {
		var me = this;
		var unitInfo = data;

		var level = unitInfo.level;
		unitInfo.isGE = courseType.isGECourse(level);

		return me.html(tUnitInfo, unitInfo);
	});
});


define('troopjs-requirejs/template!school-ui-shared/widget/unit-overview/word-list/word-list.html',[],function() { return function template(data) { var o = "";
var wordList = data || {};
var words = wordList.words;
o += "\n<h2 class=\"ets-uo-word-list-title\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"110570\" data-text-en=\"Vocabulary\"></h2><!-- only visible for pdf export -->\n<table>\n\t<thead>\n\t<tr>\n\t\t<th class=\"ets-uo-word-list-column-player\"></th>\n\t\t<th class=\"ets-uo-word-list-column-vocabulary\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"126660\" data-text-en=\"Vocabulary\"></th>\n\t\t<th class=\"ets-uo-word-list-column-phonetic\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"135412\" data-text-en=\"Phonetic spelling\"></th>\n\t\t<th class=\"ets-uo-word-list-column-partofspeech\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"126662\" data-text-en=\"Part of speech\"></th>\n\t\t<th class=\"ets-uo-word-list-column-translation\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"126661\" data-text-en=\"Translation / definition\"></th>\n\t</tr>\n\t</thead>\n\t<tbody>\n\t\t"; words.forEach(function(wordItem) { o += "<tr style=\"page-break-inside: avoid;\">\n\t\t\t<td class=\"ets-uo-word-list-column-player\">\n\t\t\t\t<audio src=\"" + wordItem.audioPath + "\" preload=\"none\"></audio>\n\t\t\t</td>\n\t\t\t<td class=\"ets-uo-word-list-column-vocabulary\">" + wordItem.word + "</td>\n\t\t\t<td class=\"ets-uo-word-list-column-phonetic\">\n\t\t\t\t";if (wordItem.pronunciation.uk) {o += "\n\t\t\t\t\t[<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"135413\" data-text-en=\"UK\"></span>]" + wordItem.pronunciation.uk + "\n\t\t\t\t";}o += "\n\t\t\t\t";if (wordItem.pronunciation.us) {o += "\n\t\t\t\t\t[<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"135414\" data-text-en=\"US\"></span>]" + wordItem.pronunciation.us + "\n\t\t\t\t";}o += "\n\t\t\t</td>\n\t\t\t<td class=\"ets-uo-word-list-column-partofspeech\">" + wordItem.partofSpeech + "</td>\n\t\t\t<td class=\"ets-uo-word-list-column-translation\">" + wordItem.translation + "</td>\n\t\t</tr>"; }); o += "\n\t</tbody>\n</table>"; return o; }; });
define('school-ui-shared/widget/unit-overview/word-list/main',[
	'when',
	'troopjs-ef/component/widget',
	'mediaelement-and-player',
	'template!./word-list.html'
], function (when, Widget, mejs, tWordList) {
	'use strict';

	var $ELEMENT = '$element';
	var CLS_WORD_SELECTED = 'etc-unit-overview-word-selected';

	return Widget.extend(function (element, path, data) {
		var wordList = data;
		var me = this;
		return me.html(tWordList, wordList).then(function () {
			var mediaelementInits = [];
			me[$ELEMENT].find('audio').each(function (index, audio) {
				mediaelementInits.push(when.promise(function (resolve, reject) {
					new MediaElementPlayer(audio, {
						pauseOtherPlayers: true,
						alwaysShowControls: true,
						playpauseText: '',
						mode: 'native',
						features: ['playpause'],
						defaultAudioWidth: 20,
						defaultAudioHeight: 20,
						success: function (mediaElement, domObject, player) {
							mediaElement.addEventListener('play', function () {
								this.currentTime = 0;
							});
							resolve();
						},
						error: reject
					});
				}));
			});

			return when.all(mediaelementInits);
		});
	}, {
		'dom:tr/click': function (evt) {
			var $tr = $(evt.currentTarget);
			$tr.addClass(CLS_WORD_SELECTED);
			$tr.siblings().removeClass(CLS_WORD_SELECTED);
		}
	});
});

/* vector images support for ie8 & modern browsers
 * use in this way : "<div data-weave="school-ui-progress-report/utils/vector("filename", "width", "height")"></div>"
 * exp : "<div data-weave="school-ui-progress-report/utils/vector(check, 50, 50)"></div>"
 */

define('school-ui-shared/widget/vector',[
	"require",
	"when",
	"poly",
	"school-ui-shared/utils/browser-check",
	"troopjs-ef/component/widget"
], function (localRequire, when, poly, browserCheck, Widget) {
	"use strict";

	var $ELEMENT = "$element";

	var PREFIX_TEMPLATE = "template!";
	var SUFFIX_SVG = "svg";
	var SUFFIX_VML = "vml";

	var REG_SVG_WIDTH = /(\<svg[^\<]*width=\")(\S*)(\"[^\<]*\>)/gmi;
	var REG_SVG_HEIGHT = /(\<svg[^\<]*height=\")(\S*)(\"[^\<]*\>)/gmi;
	var REG_VML_WIDTH = /<v[^>]*width[^>]?:[^>]?([\d]+)[^>]*>/mi;
	var REG_VML_HEIGHT = /<v[^>]*height[^>]?:[^>]?([\d]+)[^>]*>/mi;

	//for ie8 we use vml to display vector image
	var VECTOR_TYPE = browserCheck.browser === "msie" &&
	parseInt(browserCheck.version) === 8 ? SUFFIX_VML : SUFFIX_SVG;

	return Widget.extend(function (path, $element, vector, width, height) {
		var me = this;

		me.width = width;
		me.height = height;
		me.vector = vector;

		//for optimize vml performance in ie8,
		//we hide element before append the vml, and display inline-block after appending
		me[$ELEMENT].css("display", "none");
	}, {
		"sig/start": function () {
			var me = this;

			if (me.width && me.height && me.vector) {
				return when.promise(function (resolve) {
					// use template plugin to load vector,
					// and then we can pack them together in grunt
					localRequire(
						[PREFIX_TEMPLATE + me.vector + "." + VECTOR_TYPE],
						resolve
					);
				}).then(me.render.bind(me));
			}

			return when.resolve();
		},
		"render": function (template) {
			var me = this;
			var html = template();
			var width;
			var height;

			if (VECTOR_TYPE === SUFFIX_VML) {
				width = html.match(REG_VML_WIDTH);
				height = html.match(REG_VML_HEIGHT);
				if (width[1] && height[1]) {
					//can't use a top width and height in vml to set the size, so we use zoom here
					//don't use jquery function here, because ignore zoom will be ignored...
					html = "<div style='zoom:" + Math.min(parseInt(me.height, 10) / height[1], parseInt(me.width, 10) / width[1]) + "'>" + html + "</div>";
				}
			} else {
				//replace height and width for svg element
				html = html.replace(
					REG_SVG_WIDTH,
					function (match, $1, $2, $3) {
						return $1 + me.width + "px" + $3;
					});
				html = html.replace(
					REG_SVG_HEIGHT,
					function (match, $1, $2, $3) {
						return $1 + me.height + "px" + $3;
					});
			}
			me[$ELEMENT].html(html);
			//show and set the width and height
			me[$ELEMENT].css({
				"display": "inline-block",
				"width": me.width,
				"height": me.height,
				"line-height": 0,
				"vertical-align": "middle",
				"overflow": "hidden"
			});
		}
	});
});

define('troopjs-requirejs/template!school-ui-shared/widget/video-player/video-player.html',[],function() { return function template(data) { var o = "";
	var videoUrl = data.video && data.video.url || "";
	var videoLowQualityUrl = data.video && data.video.lowQualityUrl || "";
	var posterUrl = data.poster && data.poster.url || "";
	var customClass = data.customClass || "";
o += "\n<video class=\"ets-vp " +customClass+ "\" width=\"640\" height=\"360\" playsinline=\"playsinline\" "; if (posterUrl && posterUrl.indexOf(".jpg") > 0) { o += "poster=\"" +posterUrl+ "\""; } o += " preload=\"none\">\n\t<source type=\"video/mp4\" src=\"" +videoUrl+ "\" data-switch-src=\"" +videoLowQualityUrl+ "\" />\n</video>"; return o; }; });
define('school-ui-shared/widget/video-player/main',[
	"when",
	"logger",
	"../../utils/performance",
	"mediaelement-plugin-ef",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/browser-check",
	"school-ui-shared/utils/media",
	"school-ui-shared/utils/hub-memory",
	"school-ui-shared/utils/location-helper",
	"template!./video-player.html"
], function videoPlayerModule(
	when,
	Logger,
	performanceUtils,
	mejs,
	Widget,
	browserCheck,
	Media,
	HubMemory,
	LocationHelper,
	tTemplate
) {
	"use strict";

	var $ELEMENT = "$element";
	var $ = mejs.$;

	var CLS_VP_PLAYED = "ets-vp-played";

	var SEL_VP = ".ets-vp";
	var SEL_OVERLAY_PLAY = ".mejs-overlay-play";
	var SEL_CONTROLS_BUTTON_PLAYPAUSE = "mejs-controls .mejs-playpause-button";
	var SEL_CONTAINTER = ".mejs-container";

	var ME_DEFAULT_FEATURES_BEFORE = ["playpause", "current", "progress", "duration", "IgnoreKeyEvent"];
	var ME_DEFAULT_FEATURES_AFTER = ["volume"];

	var MODE_NATIVE = "native";

	var logIdGenerator = 1000;

	function mediaPlayerLog(message) {
		var me = this;
		var mode = (me.videoInstance && me.videoInstance.media) ? me.videoInstance.media.pluginType : 'unknown';
		var finalMessage = me._logPrefix + ' mode=' + mode + ' ' + message;
		Logger.log(finalMessage);
	}

	function initPlayer() {
		var me = this;
		var customOptions = $.extend(true, {}, me._options);

		//init mep
		var translationPromise = getTranslations.call(me);
		var renderPromise = me.html(tTemplate, me._videoInfo);

		return when.all([
			translationPromise,
			renderPromise
		]).spread(function (translations) {
			return me._finalized ?
				when.resolve() :
				initMediaelementPlayer.call(me, customOptions, translations, me._onSuccess);
		}).catch(function (ex) {
			ex.player && ex.player.controls && ex.player.controls.show();

			var message = 'Error.Init ';
			if (ex.canPlayType) {
				message += 'CanPlayType=' + ex.canPlayType('video/mp4');
			}
			else if (ex.error) {
				message += ex.error;
			}
			else if (ex.message) {
				message += ex.message;
			}
			else {
				message += String(ex);
			}
			me._logDefer.resolver.resolve(message);
			throw ex;
		});
	}

	function wrapPlayToHandleRejection(play) {
		return function playWithHandledRejection() {
			var mediaElement = this;
			var promise = play.apply(mediaElement, arguments);
			if (promise) {
				when(promise).catch(function (error) {
					if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
						if (error.code === DOMException.ABORT_ERR) {
							// ignore
							return;
						}
					}
					var nodes = [mediaElement].concat(
						Array.prototype.slice.call(mediaElement.querySelectorAll('source')));
					var src = nodes.map(function (node) {
						return node.src;
					}).join(', ');
					Logger.log('Video play() exception: ' + String(error) + '\n' + src);
				});
			}
			return promise;
		};
	}

	function initMediaelementPlayer(customOptions, translations, cbOnSuccess) {
		var me = this;

		return when.promise(function (resolve, reject) { //handle exceptions
			var videoOptions = {
				mode: MODE_NATIVE,
				plugins: [],
				pauseOtherPlayers: (typeof customOptions.pauseOtherPlayers === 'boolean' ? customOptions.pauseOtherPlayers : true),
				alwaysShowControls: true,
				startVolume: 0.8,
				success: function (mediaElement, domElement, player) {
					mediaElement.play = wrapPlayToHandleRejection(mediaElement.play);

					var $container = $(domElement).closest(SEL_CONTAINTER);

					//add attribute data-at-id for automation testing
					var $playButton = $container.find(SEL_OVERLAY_PLAY);
					$playButton.attr("data-at-id", "btn-video-start");

					var $playPauseButton = $container.find(SEL_CONTROLS_BUTTON_PLAYPAUSE);
					$playPauseButton.attr("data-at-id", "btn-video-playpause");

					mediaElement.addEventListener("error", function (e) {
						var message = e.message || Media.findErrorName(mediaElement.error) || String(e);
						var url = e.src || (me._videoInfo.video && me._videoInfo.video.url) || '';

						//for Frontend log
						var mode = mediaElement.pluginType || "";
						Logger.log("Error loading video " + mode + " for " + url + ": " + message);

						//for Media log
						var perfLog = performanceUtils.getLogMessage();
						if (perfLog) {
							mediaPlayerLog.call(me, 'Error.Media.Perfs ' + perfLog);
						}
						mediaPlayerLog.call(me, 'Error.Media ' + message);
					}, false);

					mediaElement.addEventListener('play', function handleFirstPlay() {
						me[$ELEMENT].addClass(CLS_VP_PLAYED);
						mediaElement.removeEventListener('play', handleFirstPlay);
					}, false);

					me._logDefer.resolver.resolve();

					cbOnSuccess && cbOnSuccess.apply(me, arguments);

					resolve();
				},
				error: reject
			};

			customOptions.features = ME_DEFAULT_FEATURES_BEFORE.concat(customOptions.features || []).concat(ME_DEFAULT_FEATURES_AFTER);

			me.videoInstance = new mejs.MediaElementPlayer(
				me[$ELEMENT].find(SEL_VP)[0],
				$.extend({}, videoOptions, customOptions, translations)
			);
		});
	}

	function getTranslations() {
		var me = this;

		var translations = {
			playpauseText: '470485',
			muteText: '469863',
			tracksText: '469864',
			fullscreenText: '470489',
			qualityText: '469865',
			tracksOnText: '480847',
			tracksOffText: '480848',
			outOfTimeRangeText: '468588'
		};

		var blurbPrefix = "blurb!";
		var translationNames = Object.keys(translations);
		var blurbIds = [];

		translationNames.forEach(function (name, index) {
			//use keys[index] instead of key.push to make code easier to understand
			blurbIds[index] = blurbPrefix + translations[name];
		});

		return me.query(blurbIds).then(function (blurbs) {
			blurbs.forEach(function (blurb, index) {
				translations[translationNames[index]] = blurb.translation;
			});
			return translations;
		});
	}

	function updateLogPrefix() {
		var me = this;
		var $el = me[$ELEMENT];

		var course = HubMemory.readMemory('load/course');
		var level = HubMemory.readMemory('load/level');
		var activity = HubMemory.readMemory('load/activity');
		var activityOption = $el.closest('.ets-act-bd-activity').data('option');
		var activityContent = activityOption && activityOption.activityContent;

		var courseTypeCode = course && course.courseTypeCode || '';
		var levelId = level && (level.templateLevelId || level.id) || '';    //templateLevelId for platform 2, id for platform 1
		var levelCode = level && (level.levelCode || level.levelNo) || '';
		var activityId = activity && (activity.templateActivityId || activity.id) || '';    //templateActivityId for platform 2, id for platform 1
		var activityTemplateCode = activityContent && activityContent.templateCode || '';
		var mediaUrl = me._videoInfo.video && me._videoInfo.video.url.replace(/ /g, '%20') || '';
		var browser = browserCheck.browser + '/' + parseInt(browserCheck.actualVersionOfCompatibility || browserCheck.version, 10);
		if (!me._logid) {
			me._logid = (new Date().getTime()) + '.' + (logIdGenerator++);
		}

		me._logPrefix = [
			'NewMediaPlayer video',
			'courseTypeCode=' + courseTypeCode,
			'level=' + levelId,
			'levelCode=' + courseTypeCode + '_' + levelCode,
			'activity=' + activityId,
			'activityType=' + activityTemplateCode,
			'url=' + mediaUrl,
			'browser=' + browser,
			'logid=' + me._logid
		].join(' ');
	}

	return Widget.extend(
		/**
		 * Constructor
		 * @param {Object}    $el
		 * @param {Object}    module
		 * @param {Object}    videoInfo (video, scripts, stopPoints)
		 * @param {Function}  onSuccess
		 * @param {Object}    options
		 */
		function Ctor($el, module, videoInfo, options, onSuccess) {
			var me = this;
			me._videoInfo = videoInfo;
			me._onSuccess = onSuccess;
			me._options = options;
			me._finalized = false;
			me.videoInstance = null;
			updateLogPrefix.call(me);

			me._logDefer = when.defer();
			me._logDefer.promise.then(function (message) {
				message && mediaPlayerLog.call(me, message);
			});
		}, {
			"sig/start": function onStart() {
				var me = this;
				initPlayer.call(me);
			},
			"sig/stop": function () {
				var me = this;
				me._finalized = true;
				if (me.videoInstance) {
					me.videoInstance.pause();
					me.videoInstance.remove();
					me.videoInstance = null;
				}
			},
			"play": function () {
				var me = this;
				me.videoInstance.media.play();
			}
		});
});


//# sourceMappingURL=app-built.js.map
