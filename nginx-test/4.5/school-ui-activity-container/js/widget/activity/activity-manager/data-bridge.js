define([
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
