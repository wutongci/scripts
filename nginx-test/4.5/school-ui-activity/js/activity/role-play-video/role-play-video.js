// # Task Module
define([
	"jquery",
	"jquery.ui",
	"jquery.easing",
	"poly",
	"troopjs-ef/component/widget",
	'school-ui-activity/util/scoring',
	'school-ui-activity/util/interaction',
	"mediaelement-plugin-ef",
	"school-ui-activity/util/activity-util",
	"school-ui-shared/enum/rating-source-type",
	"school-ui-activity/shared/asr/asr-service-message-type",
	"school-ui-activity/shared/asr/asr-ui-states",
	"school-ui-activity/util/content-converter",
	"template!./role-play-video.html"
], function (
	$,
	ui$,
	easing,
	poly,
	Widget,
	Scoring,
	Interaction,
	mejs,
	Util,
	ratingSouceType,
	MSGType,
	ASRUIStatus,
	converter,
	tTemplate
) {
	"use strict";

	// Constants

	var EX_JSON_FORMAT = ": json format is incorrect.";

	var SEL_ACT_BODY = ".ets-act-rpv-bd";
	var SEL_MAIN = ".ets-act-rpv-main";
	var SEL_SIDE = ".ets-act-rpv-side";
	var SEL_QUESTION = ".ets-act-rpv-question";
	var SEL_ANSWER = ".ets-act-rpv-answer";
	var SEL_QUESTIONS = ".ets-act-rpv-questions";
	var SEL_QUESTION_NUMBER = ".ets-act-rpv-questions h4 strong";
	var SEL_ASR_CONTAINER = ".ets-act-rpv-mic > div";
	var SEL_RPV_MIC = ".ets-act-rpv-mic";
	var SEL_VIDEO_CONTROL = ".ets-act-rpv-video-control";
	var SEL_ACT_SUMMARY_PLACEHOLDER = ".ets-act-summary-wrap";
	var SEL_VIDEO_CONTAINER = ".ets-act-vp-wrap";

	var CLS_CORRECT = "ets-correct";
	var CLS_INCORRECT = "ets-incorrect";
	var CLS_DISABLED = "ets-disabled";
	var CLS_NONE = "ets-none";
	var CLS_ACTIVE = "ets-active";
	var CLS_SELECT_MODE = "ets-select-mode";
	var CLS_VP_PLAYED = "ets-vp-played";

	var FEEDBACK_DELAY = 1500;
	var MOVEON_DELAY = 500;
	var DURATION_ANIMATION = 300;

	var CCL_ASR_ENABLED = 'ccl!"school.asr.enabled"';

	var HUB_ASR_SET = "asr/ui/setting",
		HUB_REMOVE_INTRO_TITLE = "dispose/reference",
		asrMode = ratingSouceType["ASR_SPEAKING"];

	function Ctor() {
		var me = this;
		me.answerMode = {};
		me.questionShown = false;
		me.outOfLastQuestion = false;
		me.firstQuestionShown = false;
		me.questionCount = 0;
		me.currentQuestion = {};
		me.currentQuestionIndex = -1;
		me.$currentQuestion = {};
		me.correctCount = {};
		me.incorrectCount = {};
		me.correctRequired = {};
		me.mediaElement = {};
		me.asrDisabled = false;
		me.timeouts = [];
		me.actStarted = false;
	}

	// # Render
	function render() {
		var me = this;
		var data = this._json;

		this.questionCount = this._json.content.questions.length;

		if (!data) {
			throw this.toString() + EX_JSON_FORMAT;
		}

		me.correctRequired = Math.ceil(Scoring.ASR_MIN_PASSED_QUESTIONS_RATE * me.questionCount);
		me.correctCount = 0;
		me.incorrectCount = me.questionCount;

		return this.html(tTemplate, {data: data, correctRequired: me.correctRequired})
			.tap(onRendered.bind(me));
	}

	/**
	 * On activity rendered:
	 * 1. Enable droppable
	 * 2. Bind double click strip
	 * 3. Init media player
	 * @api private
	 */
	function onRendered() {
		var me = this,
			enableASRSwitch = !me.asrDisabled
				&& !me._json.asrDisabled
				&& window.location.search.indexOf("non-asr") < 0;

		me.publish(HUB_ASR_SET, onASRRecognized.bind(me), me._json.content.questions[0], {
			asrFallbackType: "SELECT",
			asrEnableSwitch: enableASRSwitch,
			asrFallbackCb: switchAnswerMode.bind(me, "SELECT"),
			needResetASRFailedTimes: true,
			asrEnableTip: true
		});

		initVideoPlayer.call(me);

		//Init Activity
		disableRecord.call(me);
		disableVideoControl.call(me);

		if (!enableASRSwitch) {
			switchAnswerMode.call(me, "SELECT");
			asrMode = ratingSouceType["ASR_SELECTION"];
		}

		pointToQuestion.call(me, 0);
	}

	function pointToQuestion(index) {
		var me = this;
		var $el = me.$element;

		me.currentQuestionIndex = index;
		me.currentQuestion = me._json.content.questions[index];
		me.$currentQuestion = $el.find(SEL_QUESTION + ":eq(" + index + ")");
		$el.find(SEL_QUESTION_NUMBER).text(index + 1);
	}

	function onASRRecognized(asrResult) {
		var me = this;

		if (asrResult && asrResult.length > 0) {
			var $selectedOption = $(me.$currentQuestion.find(SEL_ANSWER).filter(function () {
				return $(this).data('id').split('_')[1] == asrResult[0].index;
			})[0]);
			var optionId = $selectedOption.data('id');

			if (asrResult[0].score < 100) {
				//below threshold
				showASRMessage.call(me, "INCORRECT_PRONUN");
			} else {
				var correct = me.checkAnswer(me.currentQuestionIndex, optionId);
				me.displayInteractionResult(correct, $selectedOption, asrResult);
			}
		}
	}

	function switchAnswerMode(mode) {
		var me = this,
			$el = this.$element;

		switch (mode) {
			case 'ASR':
				me.answerMode = 'ASR';
				$el.find(SEL_ASR_CONTAINER).removeClass(CLS_NONE);
				$el.find(SEL_QUESTIONS).removeClass(CLS_SELECT_MODE);
				$el.find(SEL_QUESTIONS + " li").unbind('click');
				me._super.scoringType('asr');
				break;
			case 'SELECT':
			default:
				me.answerMode = 'SELECT';
				$el.find(SEL_ASR_CONTAINER).addClass(CLS_NONE);
				$el.find(SEL_QUESTIONS).addClass(CLS_SELECT_MODE);
				$el.find(SEL_QUESTIONS + " li").click(function () {
					onClickOption.call(me, $(this));
				});
				me._super.scoringType('default');
				break;
		}
	}

	function onClickOption($selectedOption) {
		var me = this;
		if ($selectedOption.hasClass(CLS_DISABLED) || me.optionFreezed) {
			return;
		}

		var optionId = $selectedOption.data("id");

		disableVideoControl.call(me);

		var correct = me.checkAnswer(me.currentQuestionIndex, optionId);
		me.displayInteractionResult(correct, $selectedOption);
	}

	function showQuestion() {
		var me = this,
			$el = this.$element;

		if (!me.questionShown) {
			me.questionShown = true;
			me.optionFreezed = false;
			me.$currentQuestion.addClass(CLS_ACTIVE).siblings().removeClass(CLS_ACTIVE);

			if (!me.firstQuestionShown) {
				me.firstQuestionShown = true;
				$el.find(SEL_MAIN).animate({left: "0"}, DURATION_ANIMATION);
				$el.find(SEL_SIDE).animate({right: "0"}, DURATION_ANIMATION);
			} else {
				$el.find(SEL_SIDE).fadeIn(DURATION_ANIMATION);
			}

			$el.find(SEL_RPV_MIC).show();
		}
	}

	function hideQuestion() {
		var me = this,
			$el = this.$element;

		if (me.questionShown) {
			me.questionShown = false;
			$el.find(SEL_SIDE).fadeOut(DURATION_ANIMATION);
			$el.find(SEL_RPV_MIC).hide();
		}
	}

	function initVideoPlayer() {
		var me = this;
		var $el = this.$element;
		var data = me._json.content || {};

		//video info
		var videoInfo = {
			video: data.video
		};

		//options
		var features = ['TimeRanges'];
		var timeRanges = converter.questionsToTimeRanges(data.questions);
		var options = {
			features: features,
			timeRanges: timeRanges,
			restrictPlayingTimeRange: true,
			allowPlayingBeforeRestrictRange: true,
			continueOnEndOfRestrictRange: true
		};

		//success callback
		var successCallback = function () {
			onVideoPlayerReady.apply(me, arguments);   //this: instance of widget "video-player/main"
		};

		//start to init
		var $video = $el.find(SEL_VIDEO_CONTAINER);
		$video.data({
			'videoInfo': videoInfo,
			'options': options,
			'successCallback': successCallback
		});
		$video.attr('data-weave', 'school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)');
		$video.weave();
	}

	function onVideoPlayerReady(mediaElement, domObject, player) {
		var me = this;
		var $el = me.$element;

		me.mediaElement = mediaElement;
		me.$mediaElement = mejs.$(mediaElement);
		me.player = player;

		me.$mediaElement.one("play", function () {
			me.actStarted = true;
			player.options.clickToPlayPause = false;
			$el.find(SEL_VIDEO_CONTAINER).addClass(CLS_VP_PLAYED);
		});

		me.$mediaElement.on("restrict_time_range_ended", function () {
			me.mediaElement.pause();
			onTimeRangeEnded.call(me);
		});
	}

	function onTimeRangeEnded() {
		var me = this;

		if (!me.outOfLastQuestion) {
			enableRecord.call(me);
			enableVideoControl.call(me);
			showQuestion.call(me);
			updateAutomationTestStatus.call(me);
		}
	}

	function updateAutomationTestStatus() {
		var me = this;
		//for automation test
		me.$element.find(SEL_QUESTION + "[data-order=" + (me.currentQuestionIndex + 1) + "]")
			.attr("data-at-status", "shown");
	}

	function enableVideoControl() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_VIDEO_CONTROL).removeClass(CLS_DISABLED);
		me.videoControlEnabled = true;
	}

	function disableVideoControl() {
		var me = this,
			$el = this.$element;

		$el.find(SEL_VIDEO_CONTROL).addClass(CLS_DISABLED);
		me.videoControlEnabled = false;
	}

	function enableRecord() {
		this.publish("asr/enable");
	}

	function disableRecord() {
		this.publish("asr/disable");
	}

	function replay() {
		var me = this;
		me.player.goToTimeRange(me.currentQuestionIndex, true);
		me.mediaElement.play();
		disableRecord.call(me);
		disableVideoControl.call(me);
	}

	function moveOn() {
		var me = this;

		disableRecord.call(me);
		disableVideoControl.call(me);
		hideQuestion.call(me);

		if (me.currentQuestionIndex + 1 < me.questionCount) {
			var nextQuestionTimeoutHandler = setTimeout(function () {   //wait for animation done
				pointToQuestion.call(me, me.currentQuestionIndex + 1);  //me.currentQuestionIndex will be increased

				me.publish(
					HUB_ASR_SET,
					onASRRecognized.bind(me),
					me.currentQuestion,
					{
						asrEnableTip: true
					}
				);

				me.player.goToTimeRange(me.currentQuestionIndex);
				me.mediaElement.play();
			}, MOVEON_DELAY);
			me.timeouts.push(nextQuestionTimeoutHandler);
		} else {
			me.outOfLastQuestion = true;
			if (me.mediaElement.currentTime === 0 || me.mediaElement.duration - me.mediaElement.currentTime < 1) {
				//View summary if video ends, or close to end
				activityComplete.call(me);
			} else {
				//otherwise play rest of the video
				me.$mediaElement.one('ended', function () {
					activityComplete.call(me);
				});

				var playRestTimeout = setTimeout(function () {
					hideQuestion.call(me);
					me.mediaElement.play();
				}, MOVEON_DELAY);
				me.timeouts.push(playRestTimeout);
			}
		}
	}

	function viewSummary(passed) {
		var me = this,
			$el = this.$element;
		$el.find(SEL_ACT_BODY).fadeOut(DURATION_ANIMATION, function () {
			$(this).addClass(CLS_NONE).removeAttr('style');

			//Render activity summary widget
			$el.find(SEL_ACT_SUMMARY_PLACEHOLDER)
				.data("settings",
				{
					passed: passed,
					correctNum: me.correctCount,
					skippedNum: me.incorrectCount,
					passNum: me.correctRequired
				})
				.attr("data-weave", "school-ui-activity/shared/summary/main(settings)")
				.weave();
		});

		//Remove instructions on feedback page
		me.publish(HUB_REMOVE_INTRO_TITLE);
	}

	function activityComplete() {
		var me = this;
		var passed = me.correctCount >= me.correctRequired;
		me._json.content._isCorrect = passed;
		viewSummary.call(me, passed);
		me._item.completed(true);
		me.actStarted = false;
	}

	function showASRMessage(msgType) {
		this.publish("asr/show/message", MSGType[msgType]);
	}

	var methods = {
		'sig/render': function onRender() {
			return render.call(this);
		},
		'sig/finalize': function onFinalize() {
			//Clear timeouts when finalize
			$.each(this.timeouts, function (i, timeout) {
				clearTimeout(timeout);
			});
		},
		"sig/start": function () {
			var me = this;

			return 	me.query(CCL_ASR_ENABLED).spread(function (asrEnabledCcl) {
				me.asrDisabled = !(asrEnabledCcl && asrEnabledCcl.value === 'true');
			});
		},
		"dom/destroy": function () {
			var me = this;
			// Clear video flash
			// See SPC-382, SU-2323 and SU-2316 for old issues relative to clearing video
			// See SPC-5835 for issue after migration to troopjs2
			Util.clearVideo(me.mediaElement);
		},
		/**
		 * End of clear video flash.
		 */
		"hub/asr/ui/states/changed": function (state) {
			var me = this;
			if (state && me.actStarted) {
				// this.state(state);
				switch (state) {
					case ASRUIStatus.RECORDING:
					case ASRUIStatus.PROCESSING:
					case ASRUIStatus.PREPARING:
					case ASRUIStatus.DISABLE:
						disableVideoControl.call(me);
						break;
					default:
						enableVideoControl.call(me);
						break;
				}
			}
		},

		"hub/rating/sourceType": function () {
			return [asrMode];
		},

		"dom:.ets-act-rpv-btn-replay/click": function () {
			var me = this;
			if (me.videoControlEnabled) {
				me.publish("asr/ui/playback", false);
				replay.call(me);
			}
		},
		"dom:.ets-act-rpv-btn-skip/click": function () {
			var me = this;
			if (me.videoControlEnabled) {
				me.publish("asr/ui/playback", false);
				me.publishSkipInteraction(me.currentQuestionIndex);
			}
		},
		"hub/activity/template/rpv/load": function (parent, options) {
			var me = this;

			me._json = options.json;
			me._item = options.item;
			me._interacted = false;

			me._super = parent;

			// set instant feedback off
			me._item.instantFeedback(true);

			return me.signal('render');
		},
		checkAnswer: function (questionIndex, optionId) {
			var me = this;
			var interaction = Interaction.makeChoiceInteraction(me._json, questionIndex, optionId);
			var promise = me._super.publishInteraction(interaction);

			if (interaction.correct) {
				me.correctCount++;
				me.incorrectCount--;

				var moveOnTimeout = setTimeout(function () {
					promise.then(function(){
						moveOn.call(me);
					});
				}, FEEDBACK_DELAY);

				me.timeouts.push(moveOnTimeout);
			}

			return interaction.correct;
		},
		publishSkipInteraction: function (questionIndex) {
			var me = this;
			var questionId = me._json.content.questions[questionIndex]._id;
			var interaction = Interaction.makeSkipInteraction(questionId);
			me._super.publishInteraction(interaction)
				.then(function () {
					moveOn.call(me);
				});
		},
		displayInteractionResult: function (correct, $selectedOption, asrResult) {
			var me = this;

			me.optionFreezed = true;

			if (correct) {
				$selectedOption.addClass(CLS_CORRECT);
				disableRecord.call(me);
			} else {
				$selectedOption.addClass(CLS_INCORRECT);

				if (asrResult && !asrResult._hasError) {
					showASRMessage.call(me, "INCORRECT_ANSWER");
				}

				var retryTimeout = setTimeout(function () {
					$selectedOption.removeClass(CLS_INCORRECT).addClass(CLS_DISABLED);
					me.optionFreezed = false;

					if (!asrResult) {
						enableVideoControl.call(me);
					}
				}, FEEDBACK_DELAY);

				me.timeouts.push(retryTimeout);
			}
		}
	};

	return Widget.extend(Ctor, methods);
});
