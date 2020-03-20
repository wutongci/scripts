define([
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
