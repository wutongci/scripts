define('school-ui-activity-container/util/ccl-cache-server',[], function () {
	return location.protocol === 'http:'
		? "ccl!'configuration.servers.cache'"
		: "ccl!'configuration.servers.cachesecure'";
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/activity/activity-container/activity-container.html',[],function() { return function template(data) { var o = "<div class=\"ets-ui-acc\" data-at-page-id=\"sp-activity-container\">\n\t<div class=\"ets-ui-acc-hd\">\n\t\t<div class=\"ets-ui-acc-hd-main\">\n\t\t\t<div class=\"ets-ui-acc-step-title\" data-weave=\"school-ui-activity-container/widget/activity/step-title/main\"></div>\n\t\t\t<div class=\"ets-ui-acc-step-nav\" data-weave=\"school-ui-activity-container/widget/activity/navigation/main\"></div>\n\t\t\t<div class=\"ets-ui-acc-btn-close\" data-action=\"close\" data-at-id=\"btn-close\"></div>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-ui-acc-bd\">\n\t\t<div class=\"ets-ui-acc-bd-main\">\n\t\t\t<!--<div class=\"ets-ui-step-summary\" data-weave=\"school-ui-activity-container/widget/activity/step-summary/main\"></div>-->\n\t\t\t<!--<div class=\"ets-activity\" data-weave=\"school-ui-activity-container/widget/activity/activity-manager/main\"></div>-->\n\t\t</div>\n\t</div>\n\n\t<div class=\"ets-ui-acc-ft\">\n\t\t<div class=\"ets-ui-acc-ft-main\" data-weave=\"school-ui-activity-container/widget/activity/bottom-bar/main\"></div>\n\t</div>\n\n\t<div class=\"ets-ui-acc-loading\" data-at-id=\"global-loading\">\n\t\t<div class=\"ets-ui-acc-loading-main\">\n\t\t\t<div class=\"ets-ui-acc-loading-backdrop\"></div>\n\t\t\t<div class=\"ets-ui-acc-loading-content\">\n\t\t\t\t<div class=\"ets-ui-acc-loading-icon\"><span></span></div>\n\t\t\t\t<div class=\"ets-ui-acc-loading-timeout\">\n\t\t\t\t\t<div class=\"ets-bd\">\n\t\t\t\t\t\t<h3><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"463704\" data-text-en=\"An error has occurred.\"></span></h3>\n\t\t\t\t\t\t<p><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"463688\" data-text-en=\"Please try again later.\"></span></p>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"ets-ft\">\n\t\t\t\t\t\t<div class=\"ets-btn ets-btn-purple ets-btn-shadowed\"><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"462940\" data-text-en=\"Close\"></span></div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-activity-container/widget/activity/activity-container/main',[
	"jquery",
	"mv!jquery#troopjs-1.0",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"troopjs-browser/route/uri",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"poly/array",
	"logger",
	"when",
	"template!./activity-container.html"
], function($, jqueryInTroop1, Widget, loom, weave, URI, progressState, typeidParser, poly, Logger, when, tAcc){
	"use strict";

	var UNDEF;

	var $ELEMENT = "$element";

	var LESSON = "_lesson",
		STEP = "_step",
		ACTIVITY = "_activity",
		STEP_ID = "_stepId",
		RESULTS = "_results",
		RETRY_RESIZE_TIMER = "_retryResizeTimer";

	var ANIME_DURATION = 400,
		RESIZE_DURATION = 200;

	var SEL_ACC_HD = ".ets-ui-acc-hd",
		SEL_ACC_BD = ".ets-ui-acc-bd",
		SEL_ACC_FT = ".ets-ui-acc-ft",
		SEL_ACC = ".ets-ui-acc",
		SEL_ACC_BD_MAIN = ".ets-ui-acc-bd-main",
		SEL_ACC_LOADING = ".ets-ui-acc-loading",
		SEL_ACC_LOADING_CLOSE = ".ets-ui-acc-loading .ets-btn",
		SEL_HEADER_NOTIFICATION = ".ets-ui-acc-act-header-notification",
		SEL_ACC_MANAGER = ".ets-activity";

	var CLS_OPEN = "ets-acc-open",
		CLS_NONE = "ets-none",
		CLS_LOADING = "ets-loading",
		CLS_TIMEOUT = "ets-timeout",
		CLS_ATPREVIEW = "ets-atpreview",
		CLS_ACC_MANAGER = "ets-activity",
		CLS_STEP_SUMMARY = "ets-ui-step-summary";

	var HUB_SHOW_LOADING = "activity-container/show/loading",
		HUB_HIDE_LOADING = "activity-container/hide/loading",
		HUB_ACTIVITY_OPENED = "activity/opened",
		HUB_ACTIVITY_CLOSED = "activity/closed";

	var WIDGET_ACTIVITY_MANAGER = "school-ui-activity-container/widget/activity/activity-manager/main",
		WIDGET_STEP_SUMMARY = "school-ui-activity-container/widget/activity/step-summary/main",
		WIDGET_NOTIFICATION = "headerfooter/widget/alert/courseware/main";

	var LOADING_TIMEOUT = 20000;

	var $win = $(window),
		$html = $("html");

	/**
	 * append a new widget and weave it into activity-continer body
	 * @param widgetName
	 * @param className
	 * @returns {promise}
	 */
	function showWidget(widgetName, className) {
		var me = this;
		var $el = $("<div>").addClass(className).attr(loom.weave, widgetName);

		me[$ELEMENT].find(SEL_ACC_BD_MAIN).empty().html($el);

		return me.weave();
	}

	/**
	 * open activity container
	 */
	function openActivity(){
		var me = this;
		var dfd = when.defer();

		if(me[$ELEMENT].hasClass(CLS_OPEN)) {
			dfd.resolve();
			return;
		}

		hiddenPageScroll(true);

		// set default position and let activity container open from window center
		me[$ELEMENT].find(SEL_ACC).css("top", getWindowCenter().top);

		me[$ELEMENT].removeClass(CLS_NONE);

		// if we don't add a zero duration here, the css3 animation will be failed
		// because we need remove ets-none firstly and need wait removeClass finished render
		setTimeout(function(){
			me[$ELEMENT].addClass(CLS_OPEN);

			// wait for css3 animation
			setTimeout(function(){
				// start timer for auto resize activity container
				retryResize.call(me);

				// start loading state
				me.publish(HUB_SHOW_LOADING);
				me.publish(HUB_ACTIVITY_OPENED);

				dfd.resolve();
			}, ANIME_DURATION);
		}, 0);

		return dfd.promise;
	}

	/**
	 * close activity container
	 */
	function closeActivity(){
		var me = this;
		var dfd = when.defer();

		// sometime close activity container will be not shown css3 animation
		// add a zero duration timeout to fixed
		setTimeout(function(){
			me[$ELEMENT].removeClass(CLS_OPEN);
			me[$ELEMENT].find(SEL_ACC).css({
				"height": 0,
				"top": getWindowCenter().top,
				"overflow": "hidden"
			});

			// clear timer for auto resize activity container
			clearRetryReszie.call(me);

			// wait for css3 animation
			setTimeout(function(){
				// set display none after animation finished
				me[$ELEMENT].addClass(CLS_NONE);

				hiddenPageScroll(false);

				// publish activity container closed event
				me.publish(HUB_ACTIVITY_CLOSED);

				dfd.resolve();
			}, ANIME_DURATION);

		}, 0);

		return dfd.promise;
	}

	/**
	 * dynamic get activity container height
	 * @returns {number}
	 */
	function getAccHeight(){
		var me = this;
		return me[$ELEMENT].find(SEL_ACC_HD).height() +
				me[$ELEMENT].find(SEL_ACC_BD).height() +
				me[$ELEMENT].find(SEL_ACC_FT).height();
	}

	/**
	 * dynamic get activity container offset top
	 * @returns {number}
	 */
	function getAccTop(){
		var me = this;
		return Math.round( (getWindowSize().height - getAccHeight.call(me)) / 2) > 0
				? Math.round( (getWindowSize().height - getAccHeight.call(me)) / 2)
				: 0;
	}

	/**
	 * set activity container offset top
	 */
	function setAccTop(){
		var me = this;
		me[$ELEMENT].find(SEL_ACC).css({
			"top": getAccTop.call(me)
		});
	}

	/**
	 * dynamic get window size
	 * @returns {{height: number, width: number}}
	 */
	function getWindowSize(){
		return {
			height: $win.height(),
			width: $win.width()
		}
	}

	/**
	 * dynamic get window center
	 * @returns {{left: number, top: number}}
	 */
	function getWindowCenter(){
		return {
			left: $win.width() / 2,
			top: $win.height() / 2
		}
	}

	/**
	 * change activity container offset when resize window
	 */
	function respondWinResize(){
		var me = this;
		$win.unbind("resize", setAccTop.call(me))
			.bind("resize", setAccTop.call(me));
	}

	/**
	 * show or hide window scrollbar
	 * @param toggle
	 */
	function hiddenPageScroll(toggle){
		if(toggle){
			$html.css("overflow", "hidden");
		}
		else {
			$html.css("overflow", "auto");
		}
	}

	/**
	 * dynamic resize activity container and change offset
	 */
	function resizeContainer(){
		var me = this;
		var $ACC = me[$ELEMENT].find(SEL_ACC);
		var targetHeight = getAccHeight.call(me);
		var targetTop = getAccTop.call(me);

		// just change when height or top be changed
		if ($ACC.height() != targetHeight || $ACC.offset().top != targetTop) {
			$ACC.css({
				"height": targetHeight,
				"top": targetTop,
				"overflow": "hidden"
			});
		}
		else {
			$ACC.css({
				"overflow": "visible"
			});
		}
	}

	/**
	 * repeat trying to resize activity container
	 */
	function retryResize(){
		var me = this;

		clearRetryReszie.call(me);
		me[RETRY_RESIZE_TIMER] = setInterval(function(){
			resizeContainer.call(me);
		}, RESIZE_DURATION);
	}

	/**
	 * clear interval for retry resize
	 */
	function clearRetryReszie(){
		var me = this;

		me[RETRY_RESIZE_TIMER] && clearInterval(me[RETRY_RESIZE_TIMER]);
	}

	/**
	 * change widget between activity manager and step summary
	 * @param activity
	 */
	function switchWidget(activity) {
		var me = this,
			renderPromise;

		if(activity) {
			switch (activity) {
				case "summary":
					renderPromise = showWidget.call(me, WIDGET_STEP_SUMMARY, CLS_STEP_SUMMARY);
					break;
				default:
					// if activity manager already exist, don't weave again
					if(me[$ELEMENT].find(SEL_ACC_MANAGER).length <= 0) {
						renderPromise = showWidget.call(me, WIDGET_ACTIVITY_MANAGER, CLS_ACC_MANAGER);
					}
			}

			// hiden loading state after widget woven
			renderPromise && renderPromise.then(function(){
				me.publish(HUB_HIDE_LOADING);
			});
		}
		else {
			// empty activity container for next render
			me[$ELEMENT].find(SEL_ACC_BD_MAIN).empty();
		}
	}

	function showLoading(timeoutMS, timeoutCallback) {
		var me = this;
		var $el = me[$ELEMENT];
		var $loadingOverlay = $el.find(SEL_ACC_LOADING);
		var $acc = $el.find(SEL_ACC);
		var $closeBtn = $el.find(SEL_ACC_LOADING_CLOSE);

		$acc.addClass(CLS_LOADING);
		$loadingOverlay.attr("data-at-status", "shown");

		clearTimeout(me.loadingTimeout);

		if (timeoutMS) {
			me.loadingTimeout = setTimeout(function () {
				$loadingOverlay.addClass(CLS_TIMEOUT);
				$closeBtn.bind("click", function () {
					$acc.removeClass(CLS_LOADING);
					$loadingOverlay.removeClass(CLS_TIMEOUT);
					$closeBtn.unbind("click");
				});
				timeoutCallback && timeoutCallback();
			}, timeoutMS);
		}
	}

	function hideLoading() {
		var me = this;
		if(me.interfaceLoading) {
			return;
		}
		var $el = me[$ELEMENT];
		var $loadingOverlay = $el.find(SEL_ACC_LOADING);
		var $acc = $el.find(SEL_ACC);

		$acc.removeClass(CLS_LOADING);
		$loadingOverlay.attr("data-at-status", "unshown");
		$loadingOverlay.removeClass(CLS_TIMEOUT);

		clearTimeout(me.loadingTimeout);
	}

	/**
	 * find correct activity
	 * @param step
	 * @param loadResults
	 * @returns {*}
	 */
	function fillActivity(step, loadResults){
		var me = this;

		// first run check
		if(!step || !loadResults){
			return;
		}

		// select activity widget or step summary widget
		switchWidget.call(me, loadResults.activity);

		// every run check
		if(!loadResults.step || loadResults.activity || loadResults.activity == "summary") {
			return;
		}

		return me.query(step.id + ".children.progress").spread(function(step){
			var activityIndex = 0,
				activityId;

			// find first and didn't pass activity
			// if didn't find, use first one
			step.children.every(function(e,i){
				if(progressState.hasPassed(e.progress.state)){
					return true;
				} else {
					activityIndex = i;
					return false;
				}
			});

			activityId = typeidParser.parseId(step.children[activityIndex].id);

			me.publish("load", {
				"activity": activityId
			});
		});
	}

	return Widget.extend({
		"sig/start" : function(){
			var me = this;

			// bind window resize
			respondWinResize.call(me);

			return me.html(tAcc).spread(function(){
				var uri = URI(document.location.href);
				var atpreview = Boolean(uri.query && uri.query.atpreview !== undefined);

				//use troop1 to weave headerfooter notification
				jqueryInTroop1(me[$ELEMENT].find(SEL_HEADER_NOTIFICATION))
					.attr("data-weave", WIDGET_NOTIFICATION).weave();

				// set activity container default offset
				me[$ELEMENT].find(SEL_ACC).css({
					"top": getWindowCenter().top
				});

				//emit scroll event
				me[$ELEMENT].scroll(function(){
					me.publish("activity-container/scroll");
				});

				//set class for at-preview
				me[$ELEMENT].toggleClass(CLS_ATPREVIEW, atpreview);
			});
		},

		"sig/finalize":function(){
			var me = this;

			//unweave troop1 widget manually
			jqueryInTroop1(me[$ELEMENT].find(SEL_HEADER_NOTIFICATION)).remove();
		},

		"hub:memory/load/lesson": function onLoadLevel(lesson) {
			var me = this;

			lesson && (me[LESSON] = lesson);
		},

		"hub:memory/load/step": function onLoadStep(step){
			var me = this;

			if(step){
				me[STEP_ID] = step.id;

				// if already exist activity manager or step summary, don't need open container again
				if(me[$ELEMENT].find(SEL_ACC_BD_MAIN).children().length > 0) {
					fillActivity.call(me, me[STEP] = step, me[RESULTS]);
				}
				else {
					openActivity.call(me).then(function(){
						fillActivity.call(me, me[STEP] = step, me[RESULTS]);
					});
				}
			}
			else {
				closeActivity.call(me).then(function(){
					// remove variable and dom element for next open
					delete me[STEP];

					me[$ELEMENT].find(SEL_ACC_BD_MAIN).empty();
				});
			}
		},

		"hub:memory/load/activity": function onLoadActivity(activity){
			var me = this;

			activity && (me[ACTIVITY] = activity);
		},

		"hub:memory/load/results": function(results) {
			var me = this;

			results && fillActivity.call(me, me[STEP], me[RESULTS] = results);
		},

		"hub/activity-container/show/loading": function (activityId) {
			showLoading.call(this, LOADING_TIMEOUT, function onTimeout() {
				activityId && Logger.log("Activity error: " + typeidParser.parseId(activityId) + " loading timeout");
			});
		},

		"hub/activity-container/hide/loading": function () {
			hideLoading.call(this);
		},

		"hub/activity-container/tryAgain": function(){
			var me = this;

			// load first activity of one step
			me[STEP] && me[STEP].children && me.publish("load", {
				"activity": typeidParser.parseId(me[STEP].children[0].id)
			});
		},

		"hub/activity-container/nextStep": function(){
			var me = this;
			var currentStepIndex;
			var stepId = me[STEP].id;
			var steps = me[LESSON].children;

			steps.every(function (e, i) {
				if (e.id === stepId) {
					currentStepIndex = i;
					return false;
				}
				else {
					return true;
				}
			});

			if ((currentStepIndex != UNDEF) && ((currentStepIndex + 1) != steps.length)) {
				// delete cache step data for next step render
				delete me[STEP];

				me.publish("load", {
					"step": typeidParser.parseId(steps[currentStepIndex + 1].id),
					"activity": UNDEF
				});
			}
		},

		"hub/activity-container/nextActivity": function(){
			var me = this;
			var currentActivityIndex;
			var activityId = me[ACTIVITY].id;
			var activities = me[STEP].children;

			activities.every(function(e,i){
				if(e.id == activityId) {
					currentActivityIndex = i;
					return false;
				}
				else {
					return true;
				}
			});

			if(currentActivityIndex != UNDEF) {
				if((currentActivityIndex + 1) != activities.length) {
					me.publish("load", {
						"activity": typeidParser.parseId(activities[currentActivityIndex + 1].id)
					});
				}
				else {
					me.publish("load", {
						"activity": "summary"
					});
				}
			}
		},

		"hub/activity-container/close": function(){
			var me = this;

			// the interface for third-party study courseware
			// when close activity container, should be changed back to which hash
			me.publish("school/interface/get/activity-container/closeHash", {}).spread(function(data){
				me.publish("load", $.extend({
					"step": UNDEF,
					"activity": UNDEF
				}, data));
			});
		},

		"hub/activity-container/resize": function(){
			var me = this;

			resizeContainer.call(me);
		},

		"hub/school/interface/activity-container/show/loading": function (promise) {
			var me = this;

			//todo: use better solution
			me.interfaceLoading = true;

			showLoading.call(me);
			promise.ensure(function () {
				me.interfaceLoading = false;
				hideLoading.call(me);
			});
		},

		"dom:.ets-ui-acc-btn-close/click": function(){
			var me = this;

			me.publish("activity-container/close");
		}
	});
});

define('school-ui-activity-container/widget/activity/activity-manager/data-bridge',[
	"jquery",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"when",
	"poly/array",
	"troopjs-ef/component/ef",
	"troopjs-core/pubsub/hub",
	"school-ui-shared/utils/feature-access",
	"logger",
	"underscore",
	"asr-core",
	"school-ui-shared/enum/abtest-query-string"
], function(
	$, loom, weave, when, polyArray,
	EF, HUB,
	feature,
	Logger,
	_,
	html5AsrRecorder,
	abtestQueryString
){
	'use strict';

	var UNDEF;

	var ACT_PRE = 'student_activity!';

	var CLS_AT_ASSETS = "ets-at-assets";

	var SEL_AT_ASSETS = ".ets-at-assets";

	function getActivityData(data) {
		// remove automation test assets
		$(SEL_AT_ASSETS).remove();

		var base_path = "school-ui-activity/activity/";
		var techcheck_modules_promise = when.resolve();
		var abtest_promise = when.resolve();

		switch (data.templateCode) {
			case "SeqParVer":
				var lockDataSeqParVer = _.filter(data.content.sequences, function (seq) {
					return seq.isLock;
				});

				data.content.sequences = filterData(_.filter(data.content.sequences, function (seq) {
					return !seq.isLock;
				}), data.filterOptions, true);

				$.each(lockDataSeqParVer, function (entryIndex, entry) {
					data.content.sequences.splice(entry.position - 1, 0, entry);
				});

				base_path += "sequencing-paragraph-vertical/main";
				break;

			case "SeqWordHor":
				$.each(data.content.phrases, function (p_entryIndex, p_entry) {
					$.each(p_entry.words, function (entryIndex, entry) {
						entry._id = p_entry.blanks[entryIndex]._id;
					});
				});

				data.content.phrases = filterData(data.content.phrases, data.filterOptions, true, "words");

				base_path += "sequencing-word-horizontal/main";
				break;

			case "SeqWordVer":
				var lockDataSeqWordVer = _.filter(data.content.sequences, function (seq) {
					return seq.isLock;
				});

				data.content.sequences = filterData(_.filter(data.content.sequences, function (seq) {
					return !seq.isLock;
				}), data.filterOptions, true);

				$.each(lockDataSeqWordVer, function (entryIndex, entry) {
					data.content.sequences.splice(entry.position - 1, 0, entry);
				});

				base_path += "sequencing-word-vertical/main";
				break;

			case "SeqImg":
				data.content.sequences = filterData(data.content.sequences, data.filterOptions, true, "options");
				base_path += "sequencing-image/main";
				break;

			case "MatPicToAud":
				base_path += "matching-pic-audio/main";
				break;

			case "Writing":
				if (data.isGraded && feature.hasWritingClassFeature()) {
					base_path += "writing-challenge-exercise/main";
				} else {
					base_path += "writing-challenge-practice/main";
				}
				break;

			case "MatTxtToPic":
				base_path += "matching-text-pic/main";
				break;

			case 'MatTxtToTxt':
				base_path += "matching-text-text/main";
				break;

			case 'MatTxtToLongTxt':
				base_path += 'matching-text-long-text/main';
				break;

			case "MulChoTxt":
				base_path += "multiple-choice-text/main";
				break;

			case "MulChoMedia":
				base_path += "multiple-choice-media/main";
				break;

			case "FlaPre":
			case "FlaPreFlip":
				data.content.flashCards = filterData(data.content.flashCards, data.filterOptions, true, "options");
				base_path += "flashcard-presentation/main";
				break;

			case "MulSelTxt":
				base_path += "multiple-select-text/main";
				break;

			case "MulSelMedia":
				base_path += "multiple-select-media/main";
				break;

			case "MoviePre":
				base_path += "movie-presentation/continuousMovie";
				setVideoLowQualityUrl(data.content.video);
				break;

			case "MovieQuestion":
				data.content.questions = filterData(data.content.questions, data.filterOptions, false, "options");
				base_path += "movie-question/main";
				setVideoLowQualityUrl(data.content.video);
				break;

			case "TypingTable":
				data.content.items = filterData(data.content.items, data.filterOptions, true);
				base_path += "typing-table/main";
				break;

			case "TypingDragDrop":
				data.content.items = filterData(data.content.items, data.filterOptions, true);
				base_path += "typing-drag-drop/main";
				break;

			case "TypingGapFill":
				data.content.items = filterData(data.content.items, data.filterOptions, true);
				base_path += "typing-gap-fill/main";
				break;

			case "GroupMove":
				base_path += "grouping/main";
				break;

			case "GroupCopy":
				base_path += "grouping/main";
				break;

			case "LngPre":
				base_path += "language-presentation/main";
				break;

			case "FlaExe":
				data.content.flashCards = filterData(data.content.flashCards, data.filterOptions, true, "options");
				data.hasNoAsrFallback = true;
				base_path += "flashcard-exercise/main";
				techcheck_modules_promise = getAsrTechcheckModules(data.content.flashCards, "pronsXML");
				break;

			case "LngComp":
				data.content.phrases = filterData(data.content.phrases, data.filterOptions, true, "options");

				techcheck_modules_promise = getAsrTechcheckModules(data.content.phrases, "pronsXML");

				abtest_promise = EF.query.call(HUB, abtestQueryString.activity.lngComp).spread(function(data){
					return {
						path: base_path + "language-comparison/" + data.value.toLowerCase(),
						version: data.value
					};
				});

				break;

			case "TextSelect":
				data.content.phrases = filterData(data.content.phrases, data.filterOptions, true, "options");
				base_path += "text-select/main";
				break;

			case 'SpeakCha':
				base_path += 'speaking-challenge/main';

				//since there is no property to detect in this activity, just check "templateCode" to make property check success
				techcheck_modules_promise = getAsrTechcheckModules(data, "templateCode");
				break;

			case 'SpeakChaRio':
				base_path += 'speaking-challenge-new/main';

				//since there is no property to detect in this activity, just check "templateCode" to make property check success
				techcheck_modules_promise = getAsrTechcheckModules(data, "templateCode");
				break;

			case "FlaChoice":
				data.content.flashCards = filterData(data.content.flashCards, data.filterOptions, true, "options");
				base_path += "flashcard-choice/main";
				break;

			case "RolePlayVideo":
				data.content.questions = filterData(data.content.questions, data.filterOptions, false, "options");
				data.hasNoAsrFallback = true;
				base_path += "role-play-video/main";
				setVideoLowQualityUrl(data.content.video);
				techcheck_modules_promise = getAsrTechcheckModules(data.content.questions, "pronsXML");
				break;

			case 'SharingPictureDescr':
				base_path += 'sharing-pic-desc/main';
				break;

			case "RolePlayAudio":
				data.content.questions = filterData(data.content.questions, data.filterOptions, false, "options");
				data.hasNoAsrFallback = true;
				base_path += "role-play-audio/main";
				techcheck_modules_promise = getAsrTechcheckModules(data.content.questions, "pronsXML");
				break;

			case "LanguagePresentationNew":
				base_path += "language-presentation-new/main";
				setVideoLowQualityUrl(data.content.grammarVideo.videoUrl);
				break;

			default:
				base_path += "no-template/main";
				Logger.log("Activity error: template type '" + data.templateCode + "' is not defined");
				break;
		}

		return when.all([
			techcheck_modules_promise,
			abtest_promise
		]).spread(function(techcheck_modules, abtest){
			return {
				"basePath": (abtest && abtest.path) ? abtest.path : base_path,
				"data": data,
				"techcheckModules": techcheck_modules,
				"abtestVersion": (abtest && abtest.version) ? abtest.version : UNDEF
			};
		});
	}

	/**
	 *
	 * @param data contain all questions
	 * @param filterOptions get from activity query data
	 * @param randomQuestion get from activity query data
	 * @param randomOptionName specific which property(option of the question) we need to random
	 * @returns {data}
	 */
	function filterData(data, filterOptions, randomQuestion, randomOptionName) {
		var random = filterOptions ? filterOptions.random : "";
		var questionNo = filterOptions ? filterOptions.questionNo : "";
		var optionNo = filterOptions ? filterOptions.optionNo : "";

		if(random) {
			if(randomQuestion){
				data = _.shuffle(data);
			}

			if(randomOptionName){
				// for scoring
				$.each(data, function(entryIndex,entry){
					if(entry[randomOptionName]) {
						$.each(entry[randomOptionName], function(entryOptionIndex, entryOption){
							//set original_index just at the begining
							if(entryOption.original_index === UNDEF){
								entryOption.original_index = entryOptionIndex;
							}
						});
					}
				});
				$.each(data, function(entryIndex,entry){
					if(entry[randomOptionName]) {
						entry[randomOptionName] = _.shuffle(entry[randomOptionName]);
					}
				});
			}
		}

		if(questionNo && $.isNumeric(questionNo)) {
			data = data.slice(0, questionNo);
		}

		if(optionNo && $.isNumeric(optionNo)) {
			$.each(data, function(entryIndex,entry){
				if(entry[randomOptionName]) {
					entry[randomOptionName] = entry[randomOptionName].slice(0, optionNo);
				}
			});
		}

		//for automation test assets, use troop2.0 version
		$('<div data-weave="school-ui-activity/shared/automation-test/main(assets)"></div>')
			.addClass(CLS_AT_ASSETS)
			.data("assets", data)
			.appendTo("body")
			.weave();

		return data;
	}

	function setVideoLowQualityUrl(videoObj) {
		if (videoObj && videoObj.url) {
			var patternCQ5 = /^(?:\w+:\/\/[\w\.-]+(?:\:\d+)?)?\/dam\//i;     //match ^(protocol://www.host.com(:port)?)?/dam/

			if (patternCQ5.test(videoObj.url)) {
				videoObj.lowQualityUrl = videoObj.url + "/_jcr_content/renditions/s.mp4";
			}
			else {
				var path = videoObj.url.substring(0, videoObj.url.lastIndexOf("."));
				var fileType = videoObj.url.substring(videoObj.url.lastIndexOf("."));
				videoObj.lowQualityUrl = path + "_s" + fileType;
			}
		}
	}

	/**
	 * @param obj object to check
	 * @param checkProperty decides which property name to check
	 */
	function getAsrTechcheckModules(obj, checkProperty) {

		function hasProperty(obj, checkProperty) {
			if (Array.isArray(obj)) {
				for (var i = 0; i < obj.length; i++) {
					if (obj[i][checkProperty]) {
						return true;
					}
				}
			}
			else if (obj[checkProperty]) {
				return true;
			}
			return false;
		}

		if (hasProperty(obj, checkProperty)) {
			if (html5AsrRecorder.isAvailable()) {
				return when.resolve([
					{ id: "html5-mic-auth" },
					{ id: "check-audio" }
				]);
			} else {
				return when.resolve([
					{ id: "flash-install" },
					{ id: "flash-setting" },
					{ id: "chrome-auth" },
					{ id: "check-audio" }
				]);
			}
		} else {
			return when.resolve();
		}
	}

	return {
		getProcessedActivityData : function (act_id){
			return EF.query.call(HUB, (ACT_PRE + act_id))
				.spread(function(data){
					var content = data.activityContent;
					return getActivityData(content);
				});
		}
	};
});

/* global module:false */


define('school-ui-activity-container/widget/activity/activity-manager/scoring',["jquery", "when"], function($, when) {
	"use strict";

    /*
     *  Common scoring related properties
     */
	var IS_CORRECT = "_isCorrect",
		OBJ_TOSTRING = Object.prototype.toString,
		ARRAY = "[object Array]",
		OBJECT = "[object Object]",
		EXCLUDED_PROPERTY_ARR = ["collapsed", "indexed", "expires"];

    /*
     *  ASR scoring related properties
     */
	var NUM_ASR_NOT_PASSED_ITEMS = "iNOT_PASSED",
		NUM_ASR_NEED_PASSED_ITEMS = "iNEED_PASSED",
		ASR_WORDS = "_asrWords",
		ORINGNAL_INDEX = "original_index",
		ID = "_id",
		SELECTED = "selected";

	var iBASE_LINE = 70,
		depth = 1;

	var ENUM_SCORING_TYPE = {
        /*ASR scoring type*/
		"ASR": "asr",
        /*Grouping like scoring type*/
		"GP": "grouping",
        /*Default scoring type*/
		"DEFAULT": "default"
	};

    /*
     *   Indicate whether 'o1' is sub-object of 'o2'
     */

	function isSubObj(o1, o2) {
		if(o1 === o2) {
			return true;
		}
		if(o1 === undefined || o1 === null || typeof(o1) !== "object") {
			return false;
		}
		if(o2 === undefined || o2 === null || typeof(o2) !== "object") {
			return false;
		}

		if(o1.constructor === o2.constructor) {
			if(isArray(o1)) {
				var len = o1.length;
				while(len--) {
					if(!isSubObj(o1[len], getElById(o2, getIdProp(o1[len])))) return false;
				}
			} else {
				for(var i in o1) {
                    //Somtimes, we need use '_id' or 'id' to do scoring opration,
                    //So we still need iterate '_id' and 'id' property
					if(arrayContains(EXCLUDED_PROPERTY_ARR, i)) continue;

					if(typeof(o1[i]) === "object") {
						if(!isSubObj(o1[i], o2[i])) return false;
					} else if(o1[i] !== o2[i]) {
						return false;
					}
				}
			}
			return true;
		}
		return false;
	}

    /**
    *   a is an array
        item is a string element
    */
	function arrayContains(a, item) {
		var ret = false;
		if(Array.prototype.indexOf) {
			ret = !! ~a.indexOf(item);
		} else {
			$.each(a, function(i, v) {
				if(item === v) {
					ret = true;
					return false;
				}
			});
		}
		return ret;
	}

    /**
     *  Return id or _id property of object.
     */

	function getIdProp(obj) {
		return obj["_id"] || obj["id"];
	}
    /**
     *   Assert obj is an array or not
     */

	function isArray(obj) {
		return OBJ_TOSTRING.call(obj) === ARRAY;
	}

	function isPlainObj(obj) {
		return OBJ_TOSTRING.call(obj) === OBJECT;
	}
    /*
     * Get activity property by activity type,such as "sequences","audios"
     */

	function getSameArrayProps(source, scoring) {
		if(!source || !scoring) return;
		var ret = [];
		for(var i in source) {
			if(source.hasOwnProperty(i) && scoring.hasOwnProperty(i) && isArray(source[i])) {
				ret.push(i);
			}
		}
		return ret;
	}

    /*
     *  Get Specific items from 'objArray' by object's property 'id'
     */

	function getElById(objArray, id) {
		var len = objArray.length,
			currItem;

		while(len--) {
			currItem = objArray[len];
			if(getIdProp(currItem) === id) {
				return currItem;
			}
		}
	}

    /**!
    *  Indicate have ASR scoring record or not, if have ,
       then do ASR scroing check too.

    *  Params:
    *  source {Object} current source content
    */
	function checkASRScoring(source){
		if(source && source[ASR_WORDS]){
			return source[IS_CORRECT];
		}

		return;
	}

    /*
     *  Mark 'isCorrect' flag for source content
     */
	function markJSON(currSource, currScoring) {
        //For root element, it don't need to marked here
		if(depth === 1) {
			return;
		}

		var result = true;
		if(isSubObj(currScoring, currSource) || checkASRScoring(currSource)) {
			currSource[IS_CORRECT] = true;
		} else {
			currSource[IS_CORRECT] = false;
			result = false;
		}

		depth--;

		return result;
	}

    /*
     * This function actually is used to check whether current activity have passed or not,
     *   When 70% questions have passed, then activity passed.
     *
     *   actContent {Object}
     *   actScoring {Object}
     */

	function markRoot(actContent, actScoring) {
		if(!actContent || !actScoring) return;

		var arrProps = getSameArrayProps(actContent, actScoring),
			propsLen = arrProps.length,
			len, i, iCorr = 0,
			currItem, currPorp;

		while(propsLen--) {
			currPorp = arrProps[propsLen];
			currItem = actContent[currPorp];
			len = currItem.length;

			if(currItem[IS_CORRECT]) continue;

			for(i = 0; i < len; i++) {
				if(currItem[i][IS_CORRECT]) {
					iCorr++;
				}
			}

			if(iCorr * 100 / len < iBASE_LINE) {
				actContent[IS_CORRECT] = false;
				return;
			}
		}

		actContent[IS_CORRECT] = true;
	}

    /*
        process and update jsondata
        actContent : activity content
        actScoring : activity scoring
    */
	function parse(actContent, actScoring) {
		if(!actContent || !actScoring) {
			return;
		}

        //traverse depth increase
		depth++;

		var currProp, currScoring, currSource, currId, len, result = false;
		var arrProps = getSameArrayProps(actContent, actScoring),
			arrPorpLen = arrProps.length;

		while(arrPorpLen--) {

			currProp = arrProps[arrPorpLen];
			currScoring = actScoring[currProp];
			currSource = actContent[currProp];
			len = currScoring.length;
			currSource[IS_CORRECT] = true;

			while(len--) {
				if(isPlainObj(currScoring[len])) {
					currId = getIdProp(currScoring[len]);
					parse(getElById(currSource, currId), currScoring[len]) || (currSource[IS_CORRECT] = false);
				}
			}
		}

		if(actScoring) {
			result = markJSON(actContent, actScoring);
		}

		return result;
	}

    /* ASR Scoring Logic
     *  actContent {Object} activity content node in json data
     *  actScoring {Object} activity scoring node in json data
     *  currResult {Object} Current ASR recganize result
     *      Notes:
     *          ASR Scoring have two types:
     *          1. Only have one option to recognize
     *              In this case, only need to go through ASR_Scoring logic
     *          2. Recgonize more than one options,'currResult' will contains 'index' property
     *              In this case, need to go through ASR_Scoring and Common_Scoring logic
     *
     */

	function parseASRScoring(actContent, actScoring, currResult) {
		var arrEls = getSameArrayProps(actContent, actScoring),
			iNotPassed = 0,
			iNeedPassed, length, allItems, currItem, currSubItem;

        //todo: find most case for ASRResult
		currResult = currResult[0];

		if(arrEls && arrEls.length && currResult) {
            //Note: 1. Here assume "actContent" only have one array element
            //      2. 'this' is point to current activity instance
			allItems = actContent[arrEls[0]];

			$.each(allItems, function(i, item) {
				if(item[ID] === currResult[ID]) {
					currItem = item;
					return false;
				}
			});

            //ASR Result contains 'index' property
			if(currItem) {
                //1. find current recording sub-item in currentItem
				for(var key in currItem) {
					if(key !== ASR_WORDS && currItem.hasOwnProperty(key) && isArray(currItem[key])) {
						currSubItem = currItem[key];
						break;
					}
				}
                //Notes: Because 'index' always exists in ASR Result,
                //       So we need to check wheither has sub-item.
                //       if it is has, we need to preprocess json and go through common scoring.
                //       Otherwise, we only need mark json by result score.
				if(currSubItem) {
                    //2. mark selected symbol
					$.each(currSubItem, function(i, item) {
						if(item[ORINGNAL_INDEX] === currResult.index - 1) {
							item[SELECTED] = true;
						} else {
							item[SELECTED] = false;
						}
					});
                    //3. go trrough common scoring logic
					parse(actContent, actScoring);
				} else {
					if(currResult.score >= iBASE_LINE) {
						currItem[IS_CORRECT] = true;
					} else {
						currItem[IS_CORRECT] = false;
					}
					delete currResult.score;

					if(currResult.words) {
						$.each(currResult.words, function(i, word) {
							if(word.score >= iBASE_LINE) {
								word[IS_CORRECT] = true;
							} else {
								word[IS_CORRECT] = false;
							}
							delete word.score;
						});

						currItem[ASR_WORDS] = currResult.words;
					}
				}

                //mark ASR related JSON
				$.each(allItems, function(i, item) {
					if(!item[IS_CORRECT]) {
						iNotPassed++;
					}
				});

				length = allItems.length;
				iNeedPassed = Math.ceil(length * iBASE_LINE / 100);

				actContent[NUM_ASR_NOT_PASSED_ITEMS] = iNotPassed;
				actContent[NUM_ASR_NEED_PASSED_ITEMS] = iNeedPassed;
				actContent[IS_CORRECT] = iNeedPassed <= length-iNotPassed;
			}
		}
	}

	return {
		compute: function computeScore(actJSON, actInstance, option, /*data1,data2 ...*/ deferred) {
			deferred = deferred || $.Deferred();
            //reset current depth
			depth = 1;
			option = option || {
				scoringType: ENUM_SCORING_TYPE.DEFAULT
			};

			switch(option.scoringType) {
				case ENUM_SCORING_TYPE.ASR:
					parseASRScoring.call(actInstance, actJSON.content, actJSON.scoring, option.currASRResult);
					break;
				case ENUM_SCORING_TYPE.DEFAULT:
				default:
					parse.call(actInstance, actJSON.content, actJSON.scoring);
					markRoot(actJSON.content, actJSON.scoring);
			}

			deferred.resolve(actJSON);
			return when.resolve(actJSON);
		}
	}
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/activity/activity-manager/manager.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-hd\" data-weave=\"school-ui-activity-container/widget/activity/activity-reference/main\"></div>\n<div class=\"ets-act-bd\">\n\t<div class=\"ets-act-bd-main\">\n    \t<!--render activity luncher here-->\n\t</div>\n\t<div class=\"ets-act-epaper\">\n\t\t<div class=\"ets-act-bd-epaper\">\n\t\t\t<!-- render epaper here -->\n\t\t</div>\t\t\n\t</div>\n\n</div>\n<div class=\"ets-act-ft\"></div>"; return o; }; });
define('school-ui-activity-container/widget/activity/activity-manager/main',[
	"when",
	"poly/array",
	"jquery",
	"json2",
	"troopjs-ef/component/widget",
	"./scoring",
	"./data-bridge",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/utils/feature-access",
	"school-ui-shared/utils/update-helper",
	"school-ui-activity-container/util/ccl-cache-server",
	"troopjs-browser/route/uri",
	"logger",
	"school-ui-shared/plugins/techcheck/techcheck-render",
	"asr-core",
	"template!./manager.html"
], function ActivityManagerModule(
	when,
	polyArray,
	$,
	JSON,
	Widget,
	scoring,
	bridge,
	progressState,
	typeidParser,
	featureAccess,
	updateHelper,
	CCL_CACHE_SERVER,
	URI,
	Logger,
	techcheckRender,
	html5AsrRecorder,
	tManager
) {

	"use strict";

	var UNDEF;

	var $ELEMENT = "$element";

	var REG_EPAPER = /^MulChoTxt$|^MulSelTxt$/;

	var STEP_ID = "step_id";

	var IS_REVIEW = "isReview";
	var STU_ID = "studentCourseId";
	var MEM_ID = "memberId";
	var ACT_ID = "act_id";
	var ACT_TEMPLATE_ID = "act_template_id";
	var ACT_CONTENT = "activityContent";
	var EPAPER_TYPE = "epaperType";
	var LAYOUT_TYPE = "_layoutType";
	var SCORING = "scoring";
	var TARGET = "target";
	var HAS_PASSED = "hasPassed";
	var ABTEST_VERSION = "abtestVersion";

	var CLS_ACTIVITY_BODY = "ets-act-bd-main";
	var CLS_EPAPER_BODY = "ets-act-bd-epaper";
	var CLS_ACT_PASS = "ets-pass";

	var CCL_EPAPER_TYPE = "ccl!'school.courseware.epaper.fixed.enable'";

	var HUB_SHOW_LOADING = "activity-container/show/loading";
	var HUB_HIDE_LOADING = "activity-container/hide/loading";
	var HUB_RESIZE_CONTAINER = "activity-container/resize";
	var HUB_TECHCHECK_REQUEST = "tech-check/request";
	var HUB_TECHCHECK_CANCEL = "tech-check/cancel";
	var HUB_MOVE_ON_ACT = "activity/submit/score/proxy";
	var HUB_CONTAINER_NEXT_ACT = "activity-container/nextActivity";

	var TECHCHECK_INITIALIZED = "_techcheckInitialized";
	var TECHCHECK_CHECK_AUDIO_ALREADY_SHOWN = '_activity_techcheck_checkaudio_already_shown';
	var CACHE_SERVER = "_cache_server";

	var FLASH_PATH = "_shared/techcheck-flash";
	var FLASH_VERSION = "{version}";
	var FLASH_NAME = "techcheck.swf";

	function checkEpaper(json) {
		var refs = json && json.references;
		return refs && (refs.htmlPap || refs.imgPap);
	}

	function weaveEpaper(options) {
		var me = this;
		if (checkEpaper(options[ACT_CONTENT]) && options[ACT_CONTENT].references) {
			//default epaper type
			options[ACT_CONTENT].references._epaperType = "expand";

			if (options[EPAPER_TYPE] &&
				options[EPAPER_TYPE].value === "true" &&
				//if there is a mulit select text | mulit choice text template
				REG_EPAPER.test(options[ACT_CONTENT].templateCode)) {

				options[ACT_CONTENT].references._epaperType = "fixed";
				options[LAYOUT_TYPE] = "right";
			}
			//
			var $epaperBody = me[$ELEMENT].find("." + CLS_EPAPER_BODY).empty();
			return $("<div></div>")
				.data("json", options[ACT_CONTENT].references)
				.attr("data-weave", "school-ui-activity/shared/epaper/main(json)")
				.appendTo($epaperBody)
				.weave();
		}
		return when.resolve();
	}

	function weaveActivity(options) {
		var me = this;
		var $activityBody = me[$ELEMENT].find("." + CLS_ACTIVITY_BODY).empty();
		var promise = $('<div class="ets-activity-launcher"></div>')
			.data("option", options)
			.attr("data-weave", "school-ui-activity/launcher/main(option)")
			.appendTo($activityBody)
			.weave();
		promise.otherwise(function (error) {
			Logger.log([
				"Activity error: " + typeidParser.parseId(me[ACT_ID]) + " weave error." +
				"Message: " + (error ? error.message : "NULL") + "." +
				"Type: " + (options[ACT_CONTENT] ? options[ACT_CONTENT].templateCode : "NULL") + "."
			].join(' | '));
		});
		return promise;
	}

	function loadActivity() {
		var me = this;
		var activityId = typeidParser.parseId(me[ACT_ID]);
		var $activityBody = me[$ELEMENT].find("." + CLS_ACTIVITY_BODY).empty();
		var $epaperBody = me[$ELEMENT].find("." + CLS_EPAPER_BODY).empty();

		me.publish(HUB_SHOW_LOADING, me[ACT_ID]);

		return when.promise(function (resolve) {
			//let the loading start by browser reflow
			setTimeout(resolve, 0);
		}).then(function () {
			return when.all([
				bridge.getProcessedActivityData(activityId),
				me.query(me[ACT_ID] + ".progress"),
				me.query(CCL_EPAPER_TYPE),
				($activityBody.length && $epaperBody.length) || me.html(tManager)
			]);
		}).spread(function (activityData, actPros, epaperQuery) {
			// Create option
			var options = {};
			options[TARGET] = activityData.basePath;
			options[ACT_CONTENT] = activityData.data;
			options[EPAPER_TYPE] = epaperQuery[0];
			options[LAYOUT_TYPE] = "across"; // default activity layout type
			options[SCORING] = scoring;
			options[IS_REVIEW] = me[IS_REVIEW];
			options[ACT_ID] = me[ACT_ID];
			options[ACT_TEMPLATE_ID] = me[ACT_TEMPLATE_ID];
			options[HAS_PASSED] = actPros[0] && progressState.hasPassed(actPros[0].progress.state);
			options[ABTEST_VERSION] = activityData.abtestVersion;

			//start to weave
			me[$ELEMENT].toggleClass(CLS_ACT_PASS, options[HAS_PASSED]);
			return renderTechCheck.call(me, activityData)
				.then(function (techCheckResult) {
					if (techCheckResult && techCheckResult.skip) {
						me.publish(HUB_MOVE_ON_ACT);
						me.publish(HUB_CONTAINER_NEXT_ACT);
						return;
					}

					if (techCheckResult && techCheckResult.proceedWithoutAsr) {
						options[ACT_CONTENT].asrDisabled = true;
					}

					weaveEpaper.call(me, options);
					return weaveActivity.call(me, options)
						.then(function () {
							me.publish(HUB_HIDE_LOADING);
							me.publish(HUB_RESIZE_CONTAINER);
							// Store new _beforeLoadActTime
							me._beforeLoadActTime = +new Date;
						})
						.otherwise(function () {
							// Remove broken $activityContent
							$activityBody.empty();
						});
				});
		});
	}

	function renderActivity() {
		var me = this;
		if (!me[ACT_ID] || !me[STU_ID] || !me[MEM_ID] || !me[STEP_ID] || !me[$ELEMENT]) {
			return;
		}
		var uri = URI(document.location.href);
		// don't need to validate the activity for at preview mode,
		// because only the activity_id provided in the hash when preview in at
		var atpreview = uri.query && uri.query.atpreview !== undefined;

		var stepId = me[STEP_ID];
		when(atpreview ?
			atpreview :
			me.query(stepId + ".progress")
		)
			.spread(function (step) {
				// Logs to understand "Cannot read property 'state' of undefined", SPC-7147
				if (!step) {
					Logger.log('Cannot retrieve step ' + stepId);
				} else if (!step.progress || !step.children) {
					var stepJson;
					try {
						stepJson = JSON.stringify(step, function (key, value) {
							if (key === 'parent') {
								return undefined;
							}
							if (key === 'children') {
								return value.map(function (child) {
									return { id: child.id };
								});
							}
							return value;
						});
					} catch (e) {
						stepJson = String(e);
					}
					Logger.log('Error in properties of step ' + step.id + ' (' + stepId + '): ' + stepJson);
				}

				var match;
				me[IS_REVIEW] = progressState.hasPassed(step.progress.state);
				step.children.forEach(function (act) {
					if (act.id === me[ACT_ID]) {
						match = true;
					}
				});
				return match;
			})
			.then(function (isValid) {
				return isValid && loadActivity.call(me);
			});
	}

	function renderAsrNotSupportedWidget(options) {
		var me = this;
		var $activityBody = me[$ELEMENT].find("." + CLS_ACTIVITY_BODY).empty();
		$('<div class="ets-activity-launcher"></div>')
			.data("resolver", options.resolver)
			.data("html5AsrAvailable", options.html5AsrAvailable)
			.data("lacksFlash", options.lacksFlash)
			.data("hasNoAsrFallback", options.hasNoAsrFallback)
			.attr("data-weave", "school-ui-activity-container/widget/activity/asr-not-supported/main")
			.appendTo($activityBody)
			.weave();
	}

	function renderTechCheck(activityData) {
		var me = this;
		var checkModules = activityData.techcheckModules;
		var hasNoAsrFallback = activityData.data.hasNoAsrFallback;

		if (!checkModules || checkModules.length === 0) {
			return when.resolve();
		}

		return me[TECHCHECK_INITIALIZED].promise.then(function () {
			//remove Overlay and tech check popup modal
			techcheckRender.removeOverlay();
			return me.publish(HUB_TECHCHECK_CANCEL);
		}).then(function () {
			return me[CACHE_SERVER];
		}).then(function (cacheServer) {
			// Remove check-audio if already passed once
			checkModules = checkModules.filter(function (module) {
				if (module.id === 'check-audio') {
					return localStorage.getItem(TECHCHECK_CHECK_AUDIO_ALREADY_SHOWN) !== 'true';
				}
				return true;
			});

			var techcheckOptions = {
				flashPath: [cacheServer, FLASH_PATH, FLASH_VERSION, FLASH_NAME].join("/")
			};

			var html5AsrAvailable = html5AsrRecorder.isAvailable();
			if (html5AsrAvailable) {
				techcheckOptions.recorderMode = 'html5';
			}

			var latestTechCheckResults = [];
			return when.promise(function (resolve, reject) {
				me.publish(HUB_TECHCHECK_REQUEST, checkModules, techcheckOptions).then(function (checkResults) {
					checkResults.forEach(function (module) {
						if (module.id === 'check-audio' && module.passed) {
							localStorage.setItem(TECHCHECK_CHECK_AUDIO_ALREADY_SHOWN, 'true');
						}
					});
					me.publish(HUB_SHOW_LOADING, me[ACT_ID]);
					resolve({});
				}, function ignoreCancelledTechcheck(error) {
					if (error !== 'cancel techcheck') {
						reject(error);
					} else {
						// if anything but check-audio failed, show popup
						var failedTechCheck = false;
						var lacksFlash = false;
						latestTechCheckResults.forEach(function (result) {
							if (result.id !== "check-audio" && result.passed === false) {
								failedTechCheck = true;
							}
							if (result.id === "flash-install" && result.passed === false) {
								lacksFlash = true;
							}
						});
						if (failedTechCheck) {
							renderAsrNotSupportedWidget.call(me, {
								resolver: resolve,
								html5AsrAvailable: html5AsrAvailable,
								lacksFlash: lacksFlash,
								hasNoAsrFallback: hasNoAsrFallback
							});
						} else {
							me.publish(HUB_SHOW_LOADING, me[ACT_ID]);
							resolve({});
						}
					}
				}, function (checkResults) {
					latestTechCheckResults = checkResults;
				});
				me.publish(HUB_HIDE_LOADING);
			});
		});
	}

	return Widget.extend({
		"sig/initialize": function () {
			this._beforeLoadActTime = +new Date;
			this[TECHCHECK_INITIALIZED] = when.defer();
			this[CACHE_SERVER] = this.query(CCL_CACHE_SERVER).spread(function (cclCacheServer) {
				return cclCacheServer && cclCacheServer.value || "";
			});
		},
		"sig/finalize": function onFinalize() {
			window.CollectGarbage && window.CollectGarbage();
		},
		"hub:memory/plugins/tech-check/enable": function () {
			this[TECHCHECK_INITIALIZED].resolve();
		},
		"hub:memory/context": function onContext(context) {
			var me = this;
			if (context) {
				featureAccess.setFeaturesUnicode(context.featureAccessBits);
				me[MEM_ID] = typeidParser.parseId(context.user.id);
				renderActivity.call(me);
			}
		},
		"hub:memory/load/enrollment": function onEnrollment(enrollment) {
			var me = this;
			if (enrollment) {
				me[STU_ID] = typeidParser.parseId(enrollment.id);
				renderActivity.call(me);
			}
		},

		"hub:memory/load/step": function onStep(step) {
			var me = this;
			if (step) {
				me[STEP_ID] = step.id;
				renderActivity.call(me);
			}
		},

		"hub:memory/load/activity": function onActivity(activity) {
			var me = this;
			if (activity) {
				me[ACT_ID] = activity.id;
				me[ACT_TEMPLATE_ID] = activity.templateActivityId;
				renderActivity.call(me);
			}
		},
		"hub/render/activity": function onRenderActivity(act_id) {
			var me = this;
			if (act_id) {
				me[ACT_ID] = act_id;
				renderActivity.call(me);
			}
		},

		"hub/activity/submit/score": function onActivitySubmitScore(score, content) {
			var me = this,
				submitTimeout;

			//submit score to server
			var _timeCost = Math.ceil((+new Date - me._beforeLoadActTime) / 60000) || 1; // 60000 = 1000*60; the min study minutes is 1, should not be 0.
			var _score = typeof score === "number" ? score : 100;

			if (_timeCost <= 0) {
				// if the computer date time changed to a earlier date, we keep it as 1 minute.
				_timeCost = 1;
			} else if (_timeCost > 32767) {
				// server value type is INT16, max is 32767
				_timeCost = 32767;
			}
			/*
			 Start submit score, if submit score not finished after 1 sec,
			 then here will publish an event
			 */
			submitTimeout = setTimeout(function () {
				me.publish(HUB_SHOW_LOADING, me[ACT_ID]);
			}, 1000);

			// school interface activity isReview
			return me.publish("school/interface/activityIsReview", me[IS_REVIEW]).spread(function (isReview) {
				return updateHelper.submitScore({
					"studentActivityId": typeidParser.parseId(me[ACT_ID]),
					"score": _score,
					"minutesSpent": _timeCost,
					"studyMode": isReview ? 1 : 0
				}).spread(function (pros) {
					// sent writing content after submit score success
					var submitPromise;
					if (content !== UNDEF) {
						submitPromise = updateHelper.integrationSubmitWriting({
							"writingScore": {
								"StudentActivityId": typeidParser.parseId(me[ACT_ID]),
								"Content": content || "",
								"StartTime": new Date(me._beforeLoadActTime).toUTCString(),
								"CompleteTime": new Date().toUTCString()
							}
						});
					}

					me.publish("activity/update/progress", pros);
					return submitPromise;
				}).otherwise(function (errorMsg) {
					if (typeof errorMsg === "object") {
						Logger.log("Activity error: Submit score failed cause by " + JSON.stringify(errorMsg));
					}
					else {
						Logger.log("Activity error: Submit score failed cause by " + errorMsg);
					}
				}).ensure(function () {
					clearTimeout(submitTimeout);
					/*
					 Publish submit score finished, and pass an param 'act_id',
					 If activity changed during submiting score, will not nothing.
					 */
					me.publish(HUB_HIDE_LOADING);
					me._beforeLoadActTime = +new Date;
				});
			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/activity/activity-reference/reference.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-intro\">\n    <div class=\"ets-act-intro-title\" data-at-id=\"lbl-title\"></div>\n    <div class=\"ets-act-intro-desc\" data-at-id=\"lbl-description\"></div>\n</div>\n<div class=\"ets-act-live-chat\" data-weave=\"school-ui-activity-container/widget/plugin/live-chat/main\">\n</div>"; return o; }; });
define('school-ui-activity-container/widget/activity/activity-reference/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"when",
	"school-ui-shared/utils/language-fixing",
	"markdownjs",
	"template!./reference.html"
], function ReferenceModule($, Widget, when, languageFixing, md, tReference) {
	"use strict";
	var $ELEMENT = "$element";
	var SEL_INTRO_TITLE = ".ets-act-intro .ets-act-intro-title";
	var SEL_INTRO_DESC = ".ets-act-intro .ets-act-intro-desc";
	var CLS_NONE = "ets-none";

	var PROP_CULTURE_CODE = "cultureCode";
	var PROP_ACT = "_activity";

	function render() {
		var me = this;

		if (!me[PROP_ACT] || !me[PROP_CULTURE_CODE]) {
			return;
		}

		var $title = me[$ELEMENT].find(SEL_INTRO_TITLE);
		var $desc = me[$ELEMENT].find(SEL_INTRO_DESC);
		var reference = me[PROP_ACT] &&
			me[PROP_ACT].activityContent &&
			me[PROP_ACT].activityContent.references;

		when(($title.length && $desc.length) || me.html(tReference)).then(function () {

			$title = me[$ELEMENT].find(SEL_INTRO_TITLE);
			$desc = me[$ELEMENT].find(SEL_INTRO_DESC);

			if (reference) {
				var titleText = reference.title && reference.title.length > 0
					? md.toHTML(reference.title)
					: "";

				//Prepend standard instruction if exist
				if (reference.standardInstruction && reference.standardInstruction.length > 0) {
					titleText += " " + md.toHTML(reference.standardInstruction);
				}

				languageFixing($title, titleText, me[PROP_CULTURE_CODE]);
				$title.html(titleText);

				var descText = reference.desc && reference.desc.length > 0
					? md.toHTML(reference.desc)
					: "";

				languageFixing($desc, descText, me[PROP_CULTURE_CODE]);
				$desc.html(descText);

				me[$ELEMENT].removeClass(CLS_NONE);
			} else {
				$title.html("");
				$desc.html("");
			}
		});
	}

	return Widget.extend({
		"hub:memory/load/activity": function onLoadRef(activity) {
			var me = this;
			activity && (me[PROP_ACT] = activity);
			render.call(me);
		},
		"hub:memory/context": function (context) {
			var me = this;
			context && context[PROP_CULTURE_CODE] && (me[PROP_CULTURE_CODE] = context[PROP_CULTURE_CODE]);
			render.call(me);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/activity/asr-not-supported/asr-not-supported.html',[],function() { return function template(data) { var o = "<div class=\"ets-acc-asr-not-supported\">\n    <i class=\"ets-acc-asr-not-supported-warning-icon\"></i>\n    <p class=\"ets-acc-asr-not-supported-notice\"\n       data-blurb-id=\"" +data.noticeBlurbId+ "\" data-blurb-en=\"" +data.noticeBlurbEn+ "\"\n       data-weave=\"troopjs-ef/blurb/widget\"></p>\n\n    "; if (data.hasNoAsrFallback) { o += "\n    <div class=\"ets-acc-asr-not-supported-btn-proceed\" data-action=\"proceedWithoutAsr\"\n         data-blurb-id=\"707725\" data-blurb-en=\"Proceed without Speech Recognition\"\n         data-weave=\"troopjs-ef/blurb/widget\"></div>\n    "; } o += "\n    <div class=\"ets-acc-asr-not-supported-btn-skip\" data-action=\"skip\"\n         data-blurb-id=\"707726\" data-blurb-en=\"Skip\"\n         data-weave=\"troopjs-ef/blurb/widget\"></div>\n    <div class=\"ets-acc-asr-not-supported-livechat\">\n        <span data-blurb-id=\"644326\" data-text-en=\"Need help? Get in touch\"\n              data-weave=\"troopjs-ef/blurb/widget\"></span>\n        <span data-weave=\"techcheck-ui/widget/shared/live-chat/main('small-button')\"\n              class=\"tck-ui-livechat-widget\" data-delegate=\"button\"></span>\n    </div>\n</div>"; return o; }; });
define('school-ui-activity-container/widget/activity/asr-not-supported/main',[
	"when",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/browser-check",
	"template!./asr-not-supported.html"
], function ReferenceModule(
	when,
	Widget,
	browserCheck,
	template
) {
	"use strict";

	var $ELEMENT = "$element";

	function computeNoticeBlurb(html5AsrAvailable) {
		var noticeBlurbId = 709456;
		var noticeBlurbEn = 'Please allow your Microphone to be accessed and try again.';

		if (!html5AsrAvailable) {
			var isPc = browserCheck.device === 'pc';
			var isOsx = browserCheck.os === 'osx';
			var isIos = browserCheck.os === 'ios';
			if (isPc) {
				if (isOsx) {
					noticeBlurbId = 709458;
					noticeBlurbEn = 'Please use the latest version of Web browser Chrome or upgrade to Safari 11.';
				} else { // windows
					noticeBlurbId = 709457;
					noticeBlurbEn = 'Please use the latest version of web browser such as Chrome (preferred), Firefox. Thanks.';
				}
			} else { // tablet / mobile
				if (isIos) {
					noticeBlurbId = 709460;
					noticeBlurbEn = 'Please use Safari 11 by upgrading to iOS 11.';
				} else { // android
					noticeBlurbId = 709459;
					noticeBlurbEn = 'Please use the latest version of Chrome or Firefox. Thanks.';
				}
			}
		}

		return {
			noticeBlurbId: noticeBlurbId,
			noticeBlurbEn: noticeBlurbEn
		};
	}

	return Widget.extend({
		"sig/start": function () {
			var $element = this.$element;
			var html5AsrAvailable = $element.data('html5AsrAvailable');
			var hasNoAsrFallback = $element.data('hasNoAsrFallback');

			var noticeBlurb = computeNoticeBlurb(html5AsrAvailable);

			return when.all([
				this.html(template, {
					hasNoAsrFallback: hasNoAsrFallback,
					html5AsrAvailable: html5AsrAvailable,
					noticeBlurbId: noticeBlurb.noticeBlurbId,
					noticeBlurbEn: noticeBlurb.noticeBlurbEn
				}),
				// reset bottom bar
				this.publish("activity/prop/changed/completed", false),
				this.publish("activity/prop/changed/type", -1),
				this.publish("activity/prop/changed/length", 0),
				this.publish("activity/prop/changed/index", -Infinity)
			]);
		},
		"dom:[data-action=skip]/click": function () {
			var resolver = this[$ELEMENT].data('resolver');
			resolver({
				skip: true
			});
		},
		"dom:[data-action=proceedWithoutAsr]/click": function () {
			var resolver = this[$ELEMENT].data('resolver');
			resolver({
				proceedWithoutAsr: true
			});
		},
	});
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/activity/bottom-bar/bottom-bar.html',[],function() { return function template(data) { var o = "";
	var outBlurb = function(id,en){
        var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";

        return res;
    };

    var outCls = function(fnType, type){
    	var typeCls = type ? 'ets-btn-'+ type : 'ets-btn-green';
    	var fnCls = fnType ? 'ets-btn-fn-' + fnType : "";

    	return "ets-btn "+ typeCls +" ets-btn-large ets-btn-shadowed ets-disabled " + fnCls;
    }
o += "\n\n<div class=\"" + outCls('check', 'purple')+ "\" data-action=\"check\" data-at-id=\"btn-check-answer\">\n\t<span " + outBlurb(450316, "CHECK MY ANSWER")+ "></span>\n</div>\n<div class=\"" + outCls('retry', 'blue')+ "\" data-action=\"retry\" data-at-id=\"btn-retry\">\n\t<span " + outBlurb(450051, "RETRY")+ "></span>\n</div>\n<div class=\"" + outCls('next')+ "\" data-action=\"nextQues\" data-at-id=\"btn-next-question\">\n\t<span " + outBlurb(450052, "NEXT")+ "></span>\n</div>\n<div class=\"" + outCls('save')+ "\" data-action=\"save\" data-at-id=\"save\">\n\t<span " + outBlurb(443583, "DONE")+ "></span>\n</div>\n<div class=\"" + outCls('submit')+ "\" data-action=\"submit\" data-at-id=\"btn-submit\">\n\t<span " + outBlurb(150622, "SUBMIT")+ "></span>\n</div>\n<div class=\"" + outCls('done')+ "\" data-action=\"done\" data-at-id=\"btn-done\">\n\t<span " + outBlurb(443583, "DONE")+ "></span>\n</div>\n<div class=\"" + outCls('move')+ "\" data-action=\"next\" data-type=\"button\" data-at-id=\"btn-next\">\n\t<span " + outBlurb(450052, "NEXT")+ "></span>\n</div>"; return o; }; });
/*
    Responsibility of this module:

    1. go to prev activity
    2. go to next activity
    3. 'check my answer' btn status change 
    4. save and submit content for writing challenge

    Notes: 
        Instance feedback
            show next Ques or next Act button
        Practice
            show check my answer
        Learning
            no grade
        Exercise
            grade
*/
define('school-ui-activity-container/widget/activity/bottom-bar/main',[
    "jquery",
    "mv!jquery#troopjs-1.0",
    "troopjs-ef/component/widget",
    "when",
    "template!./bottom-bar.html",
    "poly/array",
    "poly/object"
], function ActivityBottomButton($, jqueryInTroop1, Widget, when, tBottomBtn) {
    "use strict";
    var $EL = "$element",
        CLS_CHECK_ANSWER = "ets-btn-fn-check",
        CLS_NEXT = "ets-btn-fn-next",
        CLS_SAVE = "ets-btn-fn-save",
        CLS_SUBMIT = "ets-btn-fn-submit",
        CLS_MOVE_ON = "ets-btn-fn-move",
        CLS_DONE = "ets-btn-fn-done",
        CLS_RETRY = "ets-btn-fn-retry",

        CLS_NEXT_ACT = "ets-ui-acc-btn-next",
        CLS_PREV_ACT = "ets-ui-acc-btn-prev",
        CLS_HIDDEN = "ets-hidden",
        CLS_SHOW = "ets-show",
        CLS_DISABLE = "ets-disabled",

        PROP = {
            /* indicates if current activity is completed */
            COMPLETED: 'completed',
            /* indicates current sub question index */
            INDEX: 'index',
            /* indicates how many sub question does current activity has */
            LENGTH: 'length',
            /* indicates activity type */
            TYPE: 'type'
        },
        ITEM_PROP = {
            /* Return true or false, indicates if current answer is intact so that it can be checked by scoring.compute */
            ANSWERED: 'answered',
            /* indicates if current activity enabled instance feedback */
            INSTANT_FEEDBACK: 'instantFeedback',
            /* indicates if current activity is savable */
            SAVABLE: 'savable',
            /* indicates if current activity is completed */
            COMPLETED: 'completed'
        },
        ITEM_PREFIX = 'item_',

        ACT_TYPE = {
            /* indicates current activity is a 'LEARNING' activity or not  */
            LEARNING: 2,
            /* indicates current activity is a 'EXERCISE' activity or not */
            EXERCISE: 1,
            /* indicates current activity is a 'PRACTICE' activity or not */
            PRACTICE: 3
        },

        TOPIC_CHECK_ANSWERS = "activity/check/answer",
        TOPIC_NEXT_STEP = "activity/next/step",
        TOPIC_MOVE_ON_ACT = "activity/submit/score/proxy",
        TOPIC_CONTAINER_NEXT_ACT = "activity-container/nextActivity",
        TOPIC_ITEM_COMPLETED = "activity-container/bottom-bar/item/completed",
        TOPIC_RETRY_ACT = "activity/retry",

        state_machine = {},
        $subELs = {};


    function toggleLayout(states) {
        // Show or hide, enable or disable button
        states.forEach(function (state) {
            var $el = state.$el;
            if (!$el) return;
            state.show ? $el.addClass(CLS_SHOW) : $el.removeClass(CLS_SHOW);
            state.enable ? $el.removeClass(CLS_DISABLE) : $el.addClass(CLS_DISABLE);
            //for automation test
            state.enable ? $el.attr("data-at-enable", "true") : $el.attr("data-at-enable", "false");
        });
    }

    function stateProxy(state_name, state, itemPrefix) {
        if(itemPrefix) state_name = itemPrefix + state_name;
        state_machine[state_name] = state;
        check_button_state(state_machine);
    }

    function itemStateProxy(state_name, state) {
        stateProxy(state_name, state, ITEM_PREFIX);
    }

    function publishProxy($el) {
        if(!$el) return;
        
        if (!$el.hasClass(CLS_DISABLE)) {           
            var args = [].slice.call(arguments, 1);
            this.publish.apply(this, args);
        }
    }

    function check_button_state(states) {
        // Button states conditions
        var answered = states[ITEM_PREFIX + ITEM_PROP.ANSWERED],
            instantFeedback = states[ITEM_PREFIX + ITEM_PROP.INSTANT_FEEDBACK],
            savable = states[ITEM_PREFIX + ITEM_PROP.SAVABLE],
            isPractice= states[PROP.TYPE] === ACT_TYPE.PRACTICE,
            isLearning = states[PROP.TYPE] === ACT_TYPE.LEARNING,
            isExercise = states[PROP.TYPE] === ACT_TYPE.EXERCISE,     

            itemCompleted = states[ITEM_PREFIX + ITEM_PROP.COMPLETED],

            completed = states[PROP.COMPLETED],
            index = states[PROP.INDEX],
            length = states[PROP.LENGTH],

            isLastItem = index >= length - 1;

        var showCheck = !completed && (!instantFeedback && !savable && isExercise && !itemCompleted),
            showDone = isPractice && isLastItem && !savable && !completed,
            showMoveon = completed || ((!isExercise || instantFeedback) && !savable && isLastItem);

        toggleLayout([
            {   //Save state
                $el: $subELs.save,
                show: savable && !isExercise && !completed,
                enable: answered
            },
            {   //Submit state
                $el: $subELs.submit,
                show: savable && isExercise && !completed,
                enable: answered
            },
            {   //check answer state
                $el: $subELs.check,
                show: showCheck,
                enable: answered
            },
            {   //Done state
                $el: $subELs.done,
                show: showDone,
                enable: answered
            },
            {   //Move on state
                $el: $subELs.moveOn,
                show: showMoveon && !showDone,
                enable: completed || (!isExercise && answered)
            },
            {   //retry state
                $el: $subELs.retry,
                show: (!isLearning || savable) && completed && !(savable && isExercise),
                enable: completed
            },
            {   //next question state
                $el: $subELs.nextQues,
                show: !showCheck && length > 1 && index < length - 1,
                enable: answered || isLearning
            }
        ]);
    }

    function subElList($el, list) {
        Object.keys(list).forEach(function(key){
            $subELs[key] = $el.find("." + list[key]);
        });
    }

    return Widget.extend({
        "sig/start": function() {
            var me = this,
                $el = me[$EL];

            return me.html(tBottomBtn).then(function(){
                subElList($el, {
                    check: CLS_CHECK_ANSWER,
                    nextQues: CLS_NEXT,
                    save: CLS_SAVE,
                    submit: CLS_SUBMIT,
                    nextAct: CLS_NEXT_ACT,
                    prevAct: CLS_PREV_ACT,
                    done: CLS_DONE,
                    retry: CLS_RETRY,
                    moveOn: CLS_MOVE_ON
                });
            });
        },
        "sig/finalize":function(){
            jqueryInTroop1(this[$EL].find(".ets-asr-ob-bt")).remove();
        },
        "hub:memory/load/results":function(results){
            var me = this;
            results &&
                results.activity &&
                results.activity === "summary" ? me.hide() : me.show();
        },
        "hide": function hideBottomBar() {
            this.$element.addClass(CLS_HIDDEN);
        },
        "show": function showBottomBar() {
            this.$element.removeClass(CLS_HIDDEN);
        },
        "hub/activity/prop/changed/completed": function stateCompleted(state) {
            stateProxy(PROP.COMPLETED, state);
        },
        "hub/activity/prop/changed/index": function stateIndex(state) {
            stateProxy(PROP.INDEX, state);
        },
        "hub/activity/prop/changed/length": function stateLength(state) {
            stateProxy(PROP.LENGTH, state);
        },
        "hub/activity/prop/changed/type": function stateType(state) {
            stateProxy(PROP.TYPE, state);
        },
        "hub/activity/item/prop/changed/answered": function itemStateAnswered(state) {
            itemStateProxy(ITEM_PROP.ANSWERED, state);
        },
        "hub/activity/item/prop/changed/instantFeedback": function itemStateInstantFeedback(state) {
            itemStateProxy(ITEM_PROP.INSTANT_FEEDBACK, state);
        },
        "hub/activity/item/prop/changed/savable": function itemStateSavable(state) {
            itemStateProxy(ITEM_PROP.SAVABLE, state);
        },
        "hub/activity/item/prop/changed/completed": function itemStateCompleted(state) {
            itemStateProxy(ITEM_PROP.COMPLETED, state);
        },
        "dom:[data-action=check]/click": function checkAnswer() {
            publishProxy.call(this, $subELs.check, TOPIC_CHECK_ANSWERS);
        },
        "dom:[data-action=nextQues]/click": function nextQuestion() {
            publishProxy.call(this, $subELs.nextQues, TOPIC_NEXT_STEP);
        },
        "dom:[data-action=next]/click": function nextActivity() {
            publishProxy.call(this, $subELs.moveOn, TOPIC_MOVE_ON_ACT);
            publishProxy.call(this, $subELs.moveOn, TOPIC_CONTAINER_NEXT_ACT);
        },
        "dom:[data-action=save]/click": function saveContent() {
            publishProxy.call(this, $subELs.save, TOPIC_ITEM_COMPLETED, true, state_machine[PROP.INDEX]);
        },
        "dom:[data-action=submit]/click": function submitContent() {
            publishProxy.call(this, $subELs.submit, TOPIC_CHECK_ANSWERS);
        },
        "dom:[data-action=done]/click": function submitContent() {
            publishProxy.call(this, $subELs.done, TOPIC_ITEM_COMPLETED, true, state_machine[PROP.INDEX]);
        },
        "dom:[data-action=retry]/click": function submitContent() {
            publishProxy.call(this, $subELs.retry, TOPIC_RETRY_ACT);
        }
    });
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/activity/navigation/navigation.html',[],function() { return function template(data) { var o = "";
    var model = data || {},
        activities = model.activities || [],
        count = activities.length,
        act,
        passed,
        actNum;
    var activeIndex = model.index,
        currentType = model.currentType,
        summaryPassedClass = model.hasStepPassed ? " ets-ui-acc-act-nav-summary-green" : "",
        summaryArrowClass = model.hasStepPassed ? " ets-passed" : "",
        hasPassingNav = false,
        passedClass,
        activeClass;
o += "\n<ul class=\"ets-ui-acc-act-nav\"><!--\n    "; for(var i = 0; i < count; i++) {
        act = activities[i];
        passed = !!act.hasPassed,
        actNum = passed ? "&nbsp;" : i + 1;
        passedClass = passed ? " ets-ui-acc-act-nav-passed" : "",
        activeClass = i === activeIndex ? " ets-ui-acc-act-nav-active" : "";

        if(!hasPassingNav && act.hasPassing) {
            passedClass = " ets-ui-acc-act-nav-passing";
            hasPassingNav = true;
        }
    o += "\n    --><li class='ets-ui-acc-act-nav-act" +passedClass+ "' data-at-id=\"" +act.id+ "\">\n        <a class=\"" +activeClass+ "\" data-nav-index=\"" +i+ "\" data-act-id=\"" +act.id+ "\" data-action=\"route\" href=\"javascript:void(0)\">" +actNum+ "</a>\n    </li><!--\n    ";}o += "\n    --><li class=\"ets-ui-acc-act-nav-summary" +summaryPassedClass+ "\">\n        <a href=\"javascript:void(0)\" data-action=\"route\" class=\"" +(currentType === 'summary' ? 'ets-ui-acc-act-nav-active' : '')+ "" +summaryArrowClass+ "\">&nbsp;</a>\n    </li>\n</ul>"; return o; }; });
define('school-ui-activity-container/widget/activity/navigation/main',[
	"jquery",
	"when",
	"troopjs-ef/component/widget",
	"template!./navigation.html",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"poly/json"
], function ActivityNavigationModule($, when, Widget, tNav, progressState, typeidParser) {
	"use strict";
	var $ELEMENT = "$element";

	/*!
	 * widget constants
	 */
	var UNDEF;
	var ACTIVITY_ID = "_activity_id";
	var CURRENT_TYPE = "_current_type";
	var STEP_ID = "_step_id";
	var SUMMARY = "summary";
	var ACTIVITY = "activity";
	var RENDER_PROMISE = "_render_promise";

	var CLS_HIDE = "ets-none";
	var CLS_ACT_NAV_ACTIVE = "ets-ui-acc-act-nav-active";

	var HUB_SHOW_LOADING = "activity-container/show/loading";
	var HUB_SUBMIT_SCORE = 'activity/submit/score/proxy';

	function render(){
		var me = this;
		if(me[STEP_ID] && me[CURRENT_TYPE]){
			//to make sure render function to call me.show() or me.hide() in calling order
			//we use promise to keep this order
			me[RENDER_PROMISE] = me[RENDER_PROMISE].then(function () {
				return me.query(me[STEP_ID] + ".progress,.children").spread(function (step) {
					var activities = step.children || [];

					var hasStepPassed = progressState.hasPassed(step.progress.state);
					var activity_index;

					//check every activity pass state

					// The code query way is for at-preview optimizing
					var q_activity_progress = activities.map(function(activity) {
						return activity.progress.id;
					});

					return me.query(q_activity_progress).spread(function() {
						activities.forEach(function(activity, index) {
							activities[index].hasPassed = progressState.hasPassed(activity.progress.state);
						});
						if(me[CURRENT_TYPE] !== SUMMARY){
							activities.forEach(function(activity, index){
								if(activity.id === me[ACTIVITY_ID]){
									activity_index = index;
								}
							});
						}
						else{
							activity_index = activities.length;
						}

						return me.html(tNav, {
							"index": activity_index,
							"activities": activities,
							"currentType" : me[CURRENT_TYPE],
							"hasStepPassed": hasStepPassed
						})
							.then(function(){
								activity_index !== UNDEF ? me.show() : me.hide();
							});
					});
				});
			}).otherwise(function ignoreError() {
			});
		}
	}


	return Widget.extend({
		"sig/start": function () {
			this[RENDER_PROMISE] = when.resolve();
		},
		"hub:memory/load/step":function(step){
			var me = this;
			if(step){
				me[STEP_ID] = step.id;
				render.call(me);
			}
		},
		"hub:memory/load/results":function(results){
			var me = this;
			if(results){
				me[CURRENT_TYPE] =  results.activity === SUMMARY ?
										SUMMARY :
										ACTIVITY;
				me[ACTIVITY_ID] = results.activity && results.activity.id;
				render.call(me);
			}
		},
		"hide" : function(){
			this[$ELEMENT].addClass(CLS_HIDE);
		},
		"show" : function(){
			this[$ELEMENT].removeClass(CLS_HIDE);
		},
		"hub/activity/update/progress" : function(){
			render.call(this);
		},
		"dom:[data-action='route']/click": function onRouteActivity($event) {
			var me = this;
			var $target = $($event.target);
			var actId = $target.data("act-id");

			if(!$target.hasClass(CLS_ACT_NAV_ACTIVE)) {
				// If clicking navigation button also try to submit score
				me.publish(HUB_SUBMIT_SCORE);
				me.publish("load", {
					"activity" : actId ? typeidParser.parseId(actId) : SUMMARY
				});

				// navigate activity for good user experience
				//use for render this time
				me[ACTIVITY_ID] = actId;
				me[CURRENT_TYPE] = actId ? ACTIVITY : SUMMARY;
				actId && me.publish(HUB_SHOW_LOADING, actId);
				render.call(me);
			}

		}
	});
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/activity/step-summary/step-summary.html',[],function() { return function template(data) { var o = "";
    var pros = data.actPros,
        len = pros.length,
        bStepPassed = data.hasPassed,
        i= 0,
        stepPros = data.pros,
        numNotPassed = data.numNotPassed,
        isLastStep = data.isLastStep,
        isLessonPassed = data.isLessonPassed,
        isStepPerfect = data.isStepPerfect,
        isLessonPerfect = data.isLessonPerfect;
        
    var outBlurb = function(id,en){
        var res = "data-weave='troopjs-ef/blurb/widget' data-blurb-id='"+id+"' data-text-en='"+en+"'";

        return res;
    };
o += "\n<div class=\"ets-ui-step-summary-bd\">\n";if(bStepPassed){o += "\n    ";if(isLessonPassed){o += "\n        <h3 data-at-id=\"lbl-step-summary-title\">\n            <i class=\"ets-ui-icon-pass-l\"></i>\n            <span " + outBlurb(450041,"Step passed")+ " >&nbsp;</span>\n        </h3>\n        <div class=\"ets-cf\"></div>\n        <h3 data-at-id=\"lbl-step-summary-sub-title\">\n            <i class=\"ets-ui-icon-pass-l\"></i>\n            <span " + outBlurb(450040,"Lesson passed")+ " >&nbsp;</span>\n        </h3>\n        ";if(isLessonPerfect){o += "\n            <h4 data-at-id=\"lbl-step-summary-description\" " + outBlurb(450312,"Well done! You got everything correct and passed this lesson.")+ " ></h4>\n        ";}else{o += "\n            <h4 data-at-id=\"lbl-step-summary-description\" " + outBlurb(450042,"Well done! You passed this lesson.")+ " ></h4>\n        ";}o += "\n    ";}else{o += "\n        ";if(isStepPerfect){o += "\n            <h3 data-at-id=\"lbl-step-summary-title\" " + outBlurb(462934,"Perfect!")+ " ></h3>\n            <h4 data-at-id=\"lbl-step-summary-description\" " + outBlurb(450048,"Good work! You got everything correct and passed the step.")+ " ></h4>\n        ";}else{o += "\n            <h3 data-at-id=\"lbl-step-summary-title\" " + outBlurb(450041,"Step passed")+ " ></h3>\n            <h4 data-at-id=\"lbl-step-summary-description\" " + outBlurb(450315,"Good work! You passed the step.")+ " ></h4>\n        ";}o += "\n    ";}o += "\n";}else{o += "\n    ";if(stepPros<40){o += "\n        <h3 data-at-id=\"lbl-step-summary-title\" " + outBlurb(450045,"Keep trying")+ " ></h3>\n    ";}else if(stepPros>=40 && stepPros<60){o += "\n        <h3 data-at-id=\"lbl-step-summary-title\" " + outBlurb(450043,"Almost there")+ " ></h3>\n    ";}o += "\n    ";if(numNotPassed===1){o += "\n        <h4 data-at-id=\"lbl-step-summary-description\" " + outBlurb(450576,"You need to pass 1 more activities to move on.")+ " ></h4>\n    ";}else{o += "\n        <h4 data-at-id=\"lbl-step-summary-description\" " + outBlurb(450317,"You need to pass ^numberofactivities^ more activities to move on.")+ "  data-values='{\"numberofactivities\":" + numNotPassed+ "}'></h4>\n    ";}o += "\n";}o += "\n\n"; if(!bStepPassed){ o += "\n    <p>\n        <!--<span " + outBlurb(450046,"You need to pass 60% of the activities in a step.")+ " ></span>-->\n        <!--<br/>-->\n        <span data-at-id=\"lbl-step-summary-sub-description\" " + outBlurb(450047,"Your current progress will be saved.")+ " ></span>\n    </p>\n"; }o += "\n\n";if(!isLessonPassed){o += "\n<ul class=\"ets-ui-step-summary-acts\">\n    "; for(;i<len;i++){o += "\n        "; if(pros[i]) { o += "\n            <li class=\"ets-pass\" data-at-id=\"lbl-activity-status-" + ( i + 1 ) + "\"></li>\n        "; }else{ o += "\n            <li class=\"ets-fail\" data-at-id=\"lbl-activity-status-" + ( i + 1 ) + "\">" + ( i + 1 ) + "</li>\n        "; } o += "\n        <!--<li class=\"";if(pros[i]){o += "ets-pass";} else {o += "ets-fail";}o += "\"></li>-->\n    ";}o += "\n</ul>\n";}o += "\n\n<div class=\"ets-ui-step-summary-actions\">\n    <!--<div class=\"ets-btn-large ets-btn-shadowed ets-btn-white\" data-action=\"close\">-->\n        <!--<span " + outBlurb(450015,"Back to the unit")+ " ></span>-->\n    <!--</div> -->\n    ";if(isStepPerfect){o += "\n        ";if(!isLessonPassed && !isLastStep){o += "\n            <div class=\"ets-btn-large ets-btn-shadowed ets-btn-white\" data-action=\"nextstep\" data-at-id=\"btn-start-the-next-step\">\n    <span " + outBlurb(450053,"Start the next step")+ " ></span>\n</div>\n        ";}else{o += "\n            <div class=\"ets-btn-large ets-btn-shadowed ets-btn-white\" data-action=\"close\" data-at-id=\"btn-back-to-the-unit\">\n                <span " + outBlurb(450015,"Back to the unit")+ " ></span>\n            </div>\n        ";}o += "\n    ";}else if(bStepPassed){o += "\n        <div class=\"ets-btn-large ets-btn-shadowed ets-btn-white\" data-action=\"tryagain\" data-at-id=\"btn-try-the-step-again\">\n            <span " + outBlurb(450050,"Try the step again")+ " ></span>\n        </div>\n        ";if(!isLessonPassed && !isLastStep){o += "\n            <div class=\"ets-btn-large ets-btn-shadowed ets-btn-white\" data-action=\"nextstep\" data-at-id=\"btn-start-the-next-step\">\n                <span " + outBlurb(450053,"Start the next step")+ " ></span>\n            </div>\n        ";}else{o += "\n            <div class=\"ets-btn-large ets-btn-shadowed ets-btn-white\" data-action=\"close\" data-at-id=\"btn-back-to-the-unit\">\n                <span " + outBlurb(450015,"Back to the unit")+ " ></span>\n            </div>\n        ";}o += "\n    ";}else{o += " \n        <div class=\"ets-btn-large ets-btn-shadowed ets-btn-white\" data-action=\"tryagain\" data-at-id=\"btn-try-the-step-again\">\n            <span " + outBlurb(450050,"Try the step again")+ " ></span>\n        </div>  \n    ";}o += "\n</div>\n</div>\n";if(bStepPassed){o += "\n<div class=\"ets-acc-sharing\" data-ccl=\"Facebook.School.Share\" data-weave=\"troopjs-ef/ccl/placeholder('school-ui-activity-container/widget/plugin/sharing/main')\"></div>\n";} return o; }; });
define('school-ui-activity-container/widget/activity/step-summary/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"when",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"template!./step-summary.html",
	"poly/array",
	"poly/object"
], function StepSummaryModule($, Widget, when, progressState, parser, tStepSum) {
	"use strict";
	var $ELE = "$element",

		SEL_STEP_PASSED = "ets-ui-acc-step-status-pass",
		SEL_STEP_FAIL = "ets-ui-acc-step-status-fail",

		PROP_ID = "id",
		PROP_NOT_PASSED = "numNotPassed",
		PROP_HAS_PASSED = "hasPassed",
		PROP_PROGRESS = "pros",
		PROP_ACT_PROGRESS = "actPros",
		PROP_STEP = "step",

		IS_LAST_STEP = "isLastStep",
		IS_LESSON_PERFECT = "isLessonPerfect",
		IS_STEP_PERFECT = "isStepPerfect",
		IS_LESSON_PASSED = "isLessonPassed",

		PERFECT_SCORE = 100,
		PASS_RATE = 0.6;


	function onRender(step){
		var me = this;

		if(!step) {
			return;
		}

		return me.query(step.id + ".progress,.parent.progress,.parent.children,.children.progress").spread(function (step) {

			var ite = 0, //stat how many acts not passed in current step
				perfectScore = PERFECT_SCORE,
				actPros = [],
				isPassed,
				isLessonPerfect = true,
				stepLen,
				noop = {state: 0, children: []},
				stepId = step.id,
				steps = step.parent.children,
				lessonPros,
				passRate = PASS_RATE;

			// Is the last step of current lesson or not
			step[IS_LAST_STEP] = steps[steps.length - 1][PROP_ID] === stepId;


			// fetch current lesson progresses
			lessonPros = $.extend({}, noop, step.parent.progress);

			// for the step summary of the last step in current lesson
			step[IS_LESSON_PASSED] = progressState.hasPassed(lessonPros.state);

			// if scores of all steps in current lesson get to max score, this lesson has passed perfectly.
			steps.every(function (steps) {
				if (steps.progress.score && steps.progress.score < perfectScore) {
					isLessonPerfect = false;
					return false;
				}
				else {
					return true;
				}
			});

			// pass of fail layout showing
			me[$ELE]
				.removeClass(SEL_STEP_PASSED + " " + SEL_STEP_FAIL)
				.addClass(
					(step[PROP_HAS_PASSED] = progressState.hasPassed(step.progress.state))
						? SEL_STEP_PASSED
						: SEL_STEP_FAIL
				);

			//cached data
			stepLen = (step.children || []).length;
			if (stepLen) {
				step.children.forEach(function(act){
					if (!(isPassed = progressState.hasPassed(act.progress.state))) {
						ite++;
					}
					actPros.push(isPassed);
				});

				/*
				 Why do we use PassRate at frontend code?
				 Because we need to calculate how much activities does user finish,
				 and backend just send back state of step, frontend only know is this step pass or not.
				*/
				step[PROP_PROGRESS] = Math.floor((stepLen - ite) / stepLen * 100);
				step[PROP_NOT_PASSED] = Math.ceil(stepLen * passRate) - (stepLen - ite);
			} else {
				step[PROP_NOT_PASSED] = Math.ceil(step.children.length * passRate);
				step[PROP_PROGRESS] = step.children.length;
				isLessonPerfect = false;
			}

			step[IS_LESSON_PERFECT] = isLessonPerfect;

			//If there is no act progress,we need to build it
			if (!actPros.length) {
				stepLen = step.children.length;
				while (stepLen--) {
					actPros.push(0);
				}
			}

			step[PROP_ACT_PROGRESS] = actPros;
			step[IS_STEP_PERFECT] = step[PROP_PROGRESS] === 100;
			return me.html(tStepSum, step);
		});
	}

	return Widget.extend({
		"hub:memory/load/step": function onStep(step) {
			var me = this;
			if(step){
				onRender.call(me, me[PROP_STEP] = step);
			}
		},

		"hub/activity/update/progress" : function(){
			var me = this;
			onRender.call(me, me[PROP_STEP]);
		},

		"dom:[data-action=close]/click": function(){
			var me = this;
			me.publish("activity-container/close");
		},

		"dom:[data-action=tryagain]/click": function(){
			var me = this;
			me.publish("activity-container/tryAgain");
		},

		"dom:[data-action=nextstep]/click": function(){
			var me = this;
			me.publish("activity-container/nextStep");
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/activity/step-title/step-title.html',[],function() { return function template(data) { var o = "<span data-at-id=\"lbl-step-name\">" + data + "</span>"; return o; }; });
define('school-ui-activity-container/widget/activity/step-title/main',[
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/language-fixing",
	"template!./step-title.html"
], function (Widget, languageFixing, tStepTitle) {
	"use strict";

	var $ELEMENT = "$element";
	var PROP_CULTURE_CODE = "cultureCode";
	var PROP_DATA = "_data";

	function render() {
		var me = this;

		if (!me[PROP_DATA] || !me[PROP_CULTURE_CODE]) {
			return;
		}

		languageFixing(me[$ELEMENT], me[PROP_DATA], me[PROP_CULTURE_CODE]);

		me.html(tStepTitle, me[PROP_DATA]);
	}

	return Widget.extend({
		"hub:memory/load/step": function onLoadStep(step) {
			var me = this;
			step && (me[PROP_DATA] = step.stepName);
			render.call(me);
		},
		"hub:memory/context": function (context) {
			var me = this;
			context && context[PROP_CULTURE_CODE] && (me[PROP_CULTURE_CODE] = context[PROP_CULTURE_CODE]);
			render.call(me);
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/plugin/live-chat/button.html',[],function() { return function template(data) { var o = "<div class=\"ets-act-live-chat-when-online gud\">\n\t<button type=\"button\" class=\"ets-act-live-chat-button\"\n\t        data-weave=\"troopjs-ef/blurb/widget\"\n\t        data-blurb-id=\"702070\" data-text-en=\"I need help\"\n\t        data-toggle=\"tooltip\" data-placement=\"bottom\"></button>\n</div>"; return o; }; });

define('troopjs-requirejs/template!school-ui-activity-container/widget/plugin/live-chat/tooltip-title.html',[],function() { return function template(data) { var o = ""; if(data.hasCloseBtn){ o += "\n\t<button type=\"button\" class=\"tooltip-close\">&#x2715;</button>\n"; } o += "\n<div class=\"tooltip-text\">" + data.title + "</div>"; return o; }; });
define('school-ui-activity-container/widget/plugin/live-chat/main',[
	"when",
	"jquery",
	"jquery.gudstrap",
	"troopjs-ef/component/widget",
	"livechat-ui/livechat-button",
	"template!./button.html",
	"template!./tooltip-title.html"
], function (when, $, $gudstrap, Widget, LiveChatBtn, tButton, tTooltipTitle) {
	var $ELEMENT = "$element";
	var SEL_LIVE_CHAT_BTN = '.ets-act-live-chat-button';
	var SF_LIVECHAT_ORG_ID = "00D300000000Ys3";
	var BLURB_TOOLTIP_TITLE = "blurb!702072";

	var TOOLTIP_SHOWN_ON_INCORRECT_ANSWER_KEY = 'activityLivechatTooltipShownOnIncorrectAnswer';

	function createTooltipOptions(options) {
		var _options = $.extend({
			trigger: "hover focus"
		}, options);
		return {
			html: true,
			trigger: _options.trigger,
			title: function () {
				return tTooltipTitle({
					hasCloseBtn: _options.hasCloseBtn,
					title: _options.title
				});
			}
		};
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			me.liveChatChecked = when.all([
				me.query(BLURB_TOOLTIP_TITLE),
				me.getLiveChatOptions(),
				me.getButtonIds()
			]).spread(function (tooltipTitle, liveChatOptions, buttonIds) {
				if (!buttonIds || !liveChatOptions) {
					return when.resolve();
				}

				return me.html(tButton).then(function () {
					var $element = me[$ELEMENT];
					var button;

					me.$button = $element.find(SEL_LIVE_CHAT_BTN);
					me.tooltipTitle = tooltipTitle && tooltipTitle[0] && tooltipTitle[0].translation;

					me.$button.tooltip(createTooltipOptions({
						title: me.tooltipTitle
					}));

					button = new LiveChatBtn(
						me.$button,
						buttonIds,
						liveChatOptions,
						$element.data("delegate") || null
					);

					return when.promise(function (resolve) {
						me.$button.on('statuschange', function () {
							resolve(button);
						});
					});
				});
			});
		},

		"dom:.tooltip-close/click": function () {
			var me = this;
			me.$button.tooltip("destroy");
			me.$button.tooltip(createTooltipOptions({
				title: me.tooltipTitle
			}));
		},

		// Manually trigger a tooltip
		// when an answer is incorrect for the first time
		"hub/activity/interaction": function (iteraction) {
			var me = this;

			if (iteraction && iteraction.correct) {
				return;
			}

			me.liveChatChecked.then(function (button) {
				if (!button || !button.isOnline) {
					return;
				}

				if (localStorage.getItem(TOOLTIP_SHOWN_ON_INCORRECT_ANSWER_KEY)) {
					return;
				}

				localStorage.setItem(TOOLTIP_SHOWN_ON_INCORRECT_ANSWER_KEY, true);

				me.$button.tooltip("destroy");
				me.$button.tooltip(createTooltipOptions({
					hasCloseBtn: true,
					trigger: "manual",
					title: me.tooltipTitle
				}));
				me.$button.tooltip("show");
			});
		},

		getButtonIds: function () {
			var me = this;
			return me.query(
				"cms!CustomerService#Contactus#livechat-ui-language"
			).spread(function (buttonIds) {
				if (!buttonIds || !buttonIds.content || typeof buttonIds.content !== "string") {
					return undefined;
				}
				return buttonIds.content.split(",");
			});
		},

		getLiveChatOptions: function () {
			var me = this;
			return me.query(
				"context!current",
				"school_context!current.user",
				"cms!CustomerService#Contactus#livechat-teacher-deploymentId",
				"cms!CustomerService#Contactus#livechat-teacher-url"
			).spread(function (context, schoolContext, deploymentIdInfo, livechatUrlInfo) {
				if (!deploymentIdInfo || !deploymentIdInfo.content ||
					!livechatUrlInfo || !livechatUrlInfo.content) {
					return undefined;
				}
				var languageCode = context && context.values && context.values.languagecode;
				var user = schoolContext && schoolContext.user || {};
				return {
					"sf": {
						"url": livechatUrlInfo.content,
						"deploymentId": deploymentIdInfo.content,
						"orgId": SF_LIVECHAT_ORG_ID
					},
					"user": {
						"Email": user.email,
						"Division": user.divisionCode,
						"Partner": user.partnerCode,
						"Full name": user.firstName + " " + user.lastName,
						"MemberID": user.member_id,
						"Country": user.countryCode,
						"Browser language": languageCode && languageCode.value
					}
				};
			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-activity-container/widget/plugin/sharing/facebook.html',[],function() { return function template(data) { var o = "<div class=\"ets-acc-sharing-box\">\n\t<span class=\"ets-acc-sharing-text\" data-weave='troopjs-ef/blurb/widget' data-blurb-id='494918' data-text-en='Share'></span>\n\t<span class=\"ets-acc-sharing-icon\" data-action=\"share\"></span>\n\t<div class=\"ets-acc-sharing-container\">\n\t\t<div class=\"ets-acc-sharing-inner\">\n\t\t\t<div class=\"ets-acc-sharing-arrow\"></div>\n\t\t\t<span data-weave='troopjs-ef/blurb/widget' data-blurb-id='494870' data-text-en='Proud of Yourself? Share Your Progress With Friends'></span>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-activity-container/widget/plugin/sharing/main',[
	"when",
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"template!./facebook.html"
], function (when, $, Widget, typeIdParser, tFacebook) {

	var FACEBOOK_FEED = "https://www.facebook.com/dialog/feed",
		// params for facebook api, from ccl
		CCLS = {
			picture: "school.courseware.facebook.share.pic",
			app_id: "configuration.facebook.appid",
			link: "Facebook.School.Share.link",
			redirect_uri: "Facebook.School.Share.RedirectUrl"
		},
		// params for facebook api, load from blurb which loaded from ccl
		BLURBS_VIA_CCLS = {
			name: "Facebook.School.Share.Name",
			caption: "Facebook.School.Share.Caption"
		},
		// params for facebook api, from blurb
		BLURBS = {
			description: 494632
		},
		// static params for facebook api
		STATIC = {
			display: "popup"
		},
		POPUP_PARAM = "width=600,height=380",
		FEEDPARAM = "feedParam",
		STEP_ID = "stepId",
		CACHE_SERVER = "cacheServer",
		SEL_CONTAINER = ".ets-acc-sharing-container",
		CLASS_SHAKE = "ets-acc-sharing-shake",
		$ELEMENT = "$element";

	function getCCL(ccl) {
		return this.query("ccl!'" + ccl + "'")
			.spread(function (data) {
				return data.value;
			});
	}

	function getBlurb(id) {
		return this.query("blurb!'" + id + "'")
			.spread(function (data) {
				return data.translation;
			});
	}

	return Widget.extend(function ($element) {
		var me = this;
		me[$ELEMENT] = $element;
		me[FEEDPARAM] = {};
		me[CACHE_SERVER] = "";
	}, {
		"sig/start": function () {
			var me = this;
			var params = {};
			var promises = [];

			// loading parameters start

			// ccl params
			$.each(CCLS, function (key, ccl) {
				promises.push(
					getCCL.call(me, ccl)
						.then(function (cclValue) {
							params[key] = cclValue;
						})
				);
			});

			// blurb params
			$.each(BLURBS, function (key, blurbID) {
				promises.push(
					getBlurb.call(me, blurbID)
						.then(function (blurbText) {
							params[key] = blurbText;
						})
				);
			});

			// blurb inside ccl
			$.each(BLURBS_VIA_CCLS, function (key, ccl) {
				promises.push(
					getCCL.call(me, ccl)
						.then(function (cclValue) {
							// convert it to either NaN or number
							cclValue *= 1;

							// NaN != NaN return true
							if (cclValue != cclValue) {
								return;
							}

							return getBlurb.call(me, cclValue);
						})
						.then(function (blurbText) {
							params[key] = blurbText;
						})
				);
			});

			// loading parameters end

			when.all(promises)
				.then(function () {

					// parameter construction start

					// static params
					$.extend(params, STATIC);

					params.picture = me[CACHE_SERVER] + params.picture;

					me[FEEDPARAM] = params;

					// parameter construction end

					// do render
					me.html(tFacebook);
					me[$ELEMENT].find(SEL_CONTAINER)
						.addClass(CLASS_SHAKE)
						.fadeIn()
						.delay(10000)
						.fadeOut()
				});
		},
		"hub:memory/context": function (context) {
			this[CACHE_SERVER] = context.cacheServer;
			STATIC.ref = "Share_School_" + context.countryCode;
		},
		"hub:memory/load/step": function (step) {
			var me = this;
			if (step) {
				me[STEP_ID] = typeIdParser.parseId(step.id);
			}
		},
		"dom:[data-action=share]/click": function () {
			var me = this;
			window.open(FACEBOOK_FEED + "?" + $.param(this[FEEDPARAM]), "facebook", POPUP_PARAM);

			//use hub way to send useraction tracking
			//in studyplan, we will subscribe this hub to send the useraction data,
			//but in e12 or others, nothing will happen.
			me[STEP_ID] && me.publish("tracking/useraction", {
				"action.socialShare": me[STEP_ID]
			});
		}
	})
});


//# sourceMappingURL=app-built.js.map
