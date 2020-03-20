define([
	"jquery",
	"poly",
	"when",
	"mediaelement-plugin-ef",
	"school-ui-activity/util/content-converter",
	'school-ui-activity/util/interaction',
	"school-ui-activity/activity/base/main",
	"template!./movie-question.html"
], function MultipleChoiceModule($, poly, when, mejs, converter, Interaction, Widget, tTemplate) {
	"use strict";

	var $ELEMENT = "$element";

	// declaire variables
	var CLS_ACTIVE = "ets-active";
	var CLS_NONE = "ets-none";
	var CLS_WRONG = "ets-wrong";
	var CLS_CORRECT = "ets-correct";
	var CLS_DISABLED = "ets-disabled";
	var CLS_MOVIE_REPLAY = "ets-movie-replay";

	var SEL_MOVIE_CONTAINER = ".ets-act-mvq-movie";
	var SEL_MOVIE = ".ets-movie";
	var SEL_MEJS_OVERLAY_PLAY = ".mejs-overlay-play";
	var SEL_MEJS_TIME_SEPARATOR = ".mejs-time-separator-item";
	var SEL_QUESTION_CONTAINER = ".ets-act-mvq-ques";
	var SEL_QUESTION = ".ets-act-mvq-que";
	var SEL_ANSWER_CONTAINER = ".ets-act-mvq-answers";
	var SEL_REPLAY_BLURB = ".ets-act-mvq-replay-blurb";

	var DURATION_ANIMATION = 500;
	var DURATION_ANSWER_CORRECT = 1500;
	var DURATION_ANSWER_WRONG = 1000;

	function updateToPlayState() {
		var me = this;
		me.needReplay = false;

		var $movie = me[$ELEMENT].find(SEL_MOVIE);
		$movie.removeClass(CLS_MOVIE_REPLAY);
	}

	function updateToReplayState() {
		var me = this;
		me.needReplay = true;

		var $movie = me[$ELEMENT].find(SEL_MOVIE);
		$movie.addClass(CLS_MOVIE_REPLAY);
	}

	/**
	 * Added custom callback when video is ready
	 * @api private
	 */
	function onVPSuccess(mediaElement, domObject, player) {
		var me = this;

		me.player = player;
		me.mediaElement = mediaElement;

		me[$ELEMENT].find(SEL_REPLAY_BLURB).appendTo(me[$ELEMENT].find(SEL_MEJS_OVERLAY_PLAY));
		updateToPlayState.call(me);

		var $mediaElement = mejs.$(mediaElement);
		$mediaElement.on("restrict_time_range_ended", function (evt, rangeInfo) {
			if (!rangeInfo.continueOnEnd) {
				var $currentTimeSeparator = me[$ELEMENT].find(SEL_MEJS_TIME_SEPARATOR + ":eq(" + me.currentQuestionIndex + ")");
				if (!$currentTimeSeparator.hasClass(CLS_ACTIVE)) {
					$currentTimeSeparator.addClass(CLS_ACTIVE);
					showQuestion.call(me, me.currentQuestionIndex);
				}
				updateToReplayState.call(me);
			}
		});

		$mediaElement.on("play", function () {
			if (me.needReplay) {
				me.needReplay = false;
				player.restartCurrentTimeRange();
				mediaElement.play();
				updateToPlayState.call(me);
			}
		});

		$mediaElement.one("ended", function () {
			player.pause();
			player.disableRestrictPlayingTimeRange();
			mediaElement.setCurrentTime(0);
			updateToPlayState.call(me);
		});
	}

	/**
	 * show question when time point reach to the cube point
	 * @api private
	 */
	function showQuestion(index) {
		var me = this;
		var $movieContainer = me[$ELEMENT].find(SEL_MOVIE_CONTAINER);

		var $questionContainer = me[$ELEMENT].find(SEL_QUESTION_CONTAINER);
		$questionContainer.addClass(CLS_ACTIVE);
		var $currentQuestion = $questionContainer.find(SEL_QUESTION + ":eq(" + index + ")");

		if (me.currentQuestionIndex === 0) {
			$currentQuestion.removeClass(CLS_NONE);
			$movieContainer.animate({right: "150"}, DURATION_ANIMATION);
			$questionContainer.animate({marginLeft: "180"}, DURATION_ANIMATION);
		} else {
			$currentQuestion.fadeIn();
		}

		$currentQuestion.find(SEL_ANSWER_CONTAINER).attr("data-at-status", "shown");

		//only left current question data in scoring node of json data which benefit for scoring logic
		var scoreQuestions = me._json.scoring.questions;
		scoreQuestions.splice(index + 1);
		scoreQuestions.slice(0, index);
	}

	/**
	 * close question when answer correct
	 * @api private
	 */
	function closeQuestion(index) {
		var me = this;

		//recover scoring data of original data
		me._json.scoring.questions = me._source.scoring.questions.slice();

		return me[$ELEMENT]
			.find(SEL_QUESTION + ":eq(" + index + ")").fadeOut()
			.promise()
			.then(function () {
				closeQuestionDone.call(me);
			});
	}

	function closeQuestionDone() {
		var me = this;

		var previousQuestionIndex = me.currentQuestionIndex;
		me.currentQuestionIndex++;

		var isComplete;
		var isSameStopAsPrevious;
		if (me.currentQuestionIndex === me._json.content.questions.length) {
			me._json.content._isCorrect = true;
			isComplete = true;
		}
		else if (me.timeRangeSeparators[previousQuestionIndex] === me.timeRangeSeparators[me.currentQuestionIndex]) {
			isSameStopAsPrevious = true;
		}

		if (isSameStopAsPrevious) {
			showQuestion.call(me, me.currentQuestionIndex, me);
			me.player.nextTimeRange();
		}
		else {
			updateToPlayState.call(me);
			if (Math.abs(me.mediaElement.currentTime - me.timeRangeSeparators[previousQuestionIndex]) < 0.1) {
				me.player.nextTimeRange();
			}
			else {
				mejs.$(me.mediaElement).one("time_range_changed", function () {
					me.player.disableContinueOnEndOfRestrictRange();
				});
				me.player.enableContinueOnEndOfRestrictRange();
			}
			me.mediaElement.play();

			//if last quesiton answer correct, bottom button changes to be next and try again
			isComplete && me.items().completed(true);
		}
	}

	function onAnswerSelected(evt) {
		var me = this;

		var $currentAnswer = $(evt.currentTarget);
		if ($currentAnswer.hasClass(CLS_WRONG) || $currentAnswer.hasClass(CLS_CORRECT) ||
			$currentAnswer.hasClass(CLS_DISABLED) || me.answerTimeoutHandler) {
			return;
		}

		var currentQuestion = me._json.content.questions[me.currentQuestionIndex];
		var optionId = $currentAnswer.data('option-id');
		var checkResult = me.checkAnswer(me.currentQuestionIndex, optionId);
		if (checkResult.correct) {
			currentQuestion.pass = true;
			$currentAnswer.addClass(CLS_CORRECT);
			me.answerTimeoutHandler = setTimeout(function () {
				checkResult.promise.then(function () {
					return closeQuestion.call(me, me.currentQuestionIndex);
				}).then(function () {
					me.answerTimeoutHandler = 0;
				});
			}, DURATION_ANSWER_CORRECT);
		} else {
			$currentAnswer.addClass(CLS_WRONG);
			me.answerTimeoutHandler = setTimeout(function () {
				$currentAnswer.removeClass(CLS_WRONG).addClass(CLS_DISABLED);
				me.answerTimeoutHandler = 0;
			}, DURATION_ANSWER_WRONG);
		}
	}

	/**
	 * Shuffle origin json data
	 * # Templating and render
	 * @api private
	 */
	function render() {
		var me = this;

		return me.html(tTemplate, me._json)
			.tap(initVideoPlayer.bind(me));
	}

	function initVideoPlayer() {
		var me = this;
		var data = me._json.content;

		//video info
		var videoInfo = {
			video: data.video
		};

		//options
		var features = ["TimeRanges", "Subtitles", "SwitchQuality"];
		var subtitles = converter.scriptsToSubtitles(data.scripts);
		var timeRangeSeparators = converter.questionsToEndTimes(data.questions);
		me.timeRangeSeparators = timeRangeSeparators;

		var options = {
			features: features,
			subtitles: subtitles,
			timeRangeSeparators: timeRangeSeparators,
			restrictPlayingTimeRange: true,
			allowPlayingBeforeRestrictRange: true,
			continueOnEndOfRestrictRange: false
		};

		//success callback
		var successCallback = function () {
			onVPSuccess.apply(me, arguments);
		};

		//start to init
		var $video = me[$ELEMENT].find(SEL_MOVIE);
		$video.data({
			"videoInfo": videoInfo,
			"options": options,
			"successCallback": successCallback
		});
		$video.attr("data-weave", "school-ui-shared/widget/video-player/main(videoInfo, options, successCallback)");
		$video.weave();
	}

	return Widget.extend(function () {
		var me = this;
		me.currentQuestionIndex = 0;
		me.answerTimeoutHandler = 0;
		me.player = null;
		me.mediaElement = null;
		me.needReplay = false;
	}, {
		"sig/initialize": function onInitialize() {
			var me = this;
			me.items().instantFeedback(true);
		},
		"sig/render": function onRender() {
			return render.call(this);
		},
		"sig/finalize": function onFinalize() {
			var me = this;
			clearTimeout(me.answerTimeoutHandler);
		},
		"checkAnswer": function (questionIndex, optionId) {
			var me = this;
			var json = me._json;
			var interaction = Interaction.makeChoiceInteraction(json, questionIndex, optionId);
			var promise = me.publishInteraction(interaction);
			return {
				correct: interaction.correct,
				promise: promise
			};
		},
		"dom:.ets-act-mvq-answer/click": function (/*evt*/) {
			onAnswerSelected.apply(this, arguments);
		}
	});
});
