define([
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
