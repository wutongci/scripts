define([
	'troopjs-core/pubsub/hub'
], function (Hub) {
	"use strict";
	/*
	 Current not supplied blurbs:
	 asrRecordTxt_noasr: "Select the correct answer",
	 asr_error_dictionary_error: "'DICTIONARY_ERROR'",
	 asr_error_not_recgnized: "'NOT_RECOGNIZED'",
	 asr_not_rec_result: "Your voice was not recognized.",

	 New Blurbs:
	 ASRConnErr, 467529
	 ASRSpeechErr, 467530
	 ASRConnErrTryAgain, 467531
	 ASRSwitchTyping, 467532
	 ASRWaitConn, 467533
	 ASRRecording, 467534
	 ASRWarning: "443588"

	 ASRAlterTitle:      "506850",
	 ASRAlterConfirm:    "506853",
	 ASRAlterCancel:     "506854",

	 Past Messages:
	 asr_RecordAgain:        "429405", // "Record again"
	 asrTryTxt:              "150671", // "Remaining attempts"
	 asr_VolumeHigh:         "429404", // "The volume is too high."
	 asr_VolumeLow:          "429403", // "The volume is too low."
	 asr_download_btn_txt:   "183275", // "Download"
	 asr_download_tooltip:   "183274", // "There is a new version of the speech recognition software which has many important updates that will improve your study experience. We strongly recommend you download the new software. Click on 'download' to install. If you don't have admin rights please contact your IT department."
	 asr_error_no_voice:     "183297", // "No voice is detected."

	 asr_error_unknown:          "151181", // "Sorry, your voice wasn't recognized. Please try again."
	 asr_error_voice_too_fast:   "178190", // "You're speaking too fast. Please try again more slowly."
	 asr_error_voice_too_high:   "151179", // "The recording is too loud. Try adjusting your distance from the microphone."
	 asr_error_voice_too_low:    "151180", // "Your voice is too low. Please check your microphone distance and make sure the microphone is not covered."
	 asr_error_voice_too_noisy:  "150929", // "We could not recognize your voice.  This may be due to background noise or a faulty microphone.  Please check your settings and try again, or skip this item."
	 asr_error_voice_too_slow:   "178191", // "You're speaking too slowly. Please try again a bit faster."
	 asr_failed:         "167401", // "The speech recognition software is not working right now. Click OK to complete the activity by typing, or skip this activity."
	 asr_sorry:          "433648", // "I'm sorry."
	 asr_repeat:         "433650", // "Please repeat that."

	 asr_preparing:      "151701", // "Prepare to start recording"
	 asr_processing:     "151687", // "Processing..."
	 asr_try_over_times: "150927", // "You have made three incorrect attempts.  Keep trying or skip this item?"

	 BtnCancel:          "468592", // "Cancel"
	 BtnInstallNow:      "150642", // "Install now"

	 asrDisabledContent:     "179626", // "This activity uses EF Advanced Speech Recognition Software. You are currently studying with Advanced Software Recognition turned off. Please click on “Next” to go to the next activity."
	 asrFailed:              "167401", // "The speech recognition software is not working right now. Click OK to complete the activity by typing, or skip this activity."
	 asrFailedWithoutTyping: "167512", // "We're very sorry, but this activity is not working now."
	 asrRecordTxt:           "150758", // "Record your answer"
	 */
	var blurbs = {

		/*E12 ASR blurbs*/
		ASRSwitchTyping: "467532", // "The speech recognition is not working now. Click OK to complete the activity by typing."
		ASRSwitchSelecting: "467436", // "The speech recognition software is not working right now. Click OK to complete the activity in a non-speaking mode."
		ASRSwitchNext: "467435", // "The speech recognition software is not working right now. Click NEXT to proceed to the next activity."

		ASRClientErrSkip: "468589", // "This activity uses Advanced Speech Recognition software. Install it now and relaunch your browser, or click Cancel to move on to the next activity."
		ASRClientErrType: "468590", // "This activity uses Advanced Speech Recognition software. Install it now and relaunch your browser, or click Cancel for an alternate mode."
		ASRClientErrSelect: "468591", // "This activity uses Advanced Speech Recognition software. Install now, or click Cancel for a non-speaking mode. When installed, please restart your browser."

		/*
		 *  ASR on-boarding related blurbs.
		 */
		IntroTitle: "492075", // "Time to practice speaking!"
		IntroDes: "492076", // "This activity requires you to record your voice. Make sure that you are in a quiet environment and use a headset with microphone. Let's take a few steps to setup your environment."
		IntroButton: "492077", // "GET STARTED"
		Checking: "492078", // "Checking …"
		CheckingDes: "492079", // "Please wait. We are analyzing your browser settings."
		MicFail: "492080", // "Check your microphone"
		MicFailDes: "492081", // "We can't detect your microphone. Please make sure it is plugged in, then click Check Again."
		MicFailCheckButton: "492082", // "CHECK AGAIN"
		SkipReason1: "492083", // "I don't have a microphone/headset."
		SkipReason2: "492084", // "I don't want to speak."
		SkipReason3: "492085", // "Other"
		PriSetDes: "492086", // "Allow access to your microphone."
		PriSetOpen: "492087", // "We just opened the Flash Player settings for you here."
		PriSetAllow: "492088", // "Check Allow"
		PriSetRem: "492089", // "Check Remember"
		PriSetClose: "492090", // "Click Close"
		PriSetBut: "492091", // "I HAVE CHECKED MY SETTINGS!"
		ReadyGo: "492092", // "You are ready to go!"
		ReadyGoDes: "492093", // "Your environment has been successfully set up! You are now ready to start practice speaking."
		ReadyGoBut: "492094", // "Done"
		Other: "450011", // "Skip"

		/*ASR Broken releted*/
		ASRAlterMsg: "626864", // "Do you want to try this activity in non-speaking mode instead?"
		ASRAlterSkipMsg: "626863", // "Do you want to skip this activity for now?"

		/* message blurb*/
		TOPIC_NOT_RECOGNIZE: "626843", // "Sorry, your voice wasn't recognized"
		TOPIC_TOO_HIGH: "626845", // "Your voice is too loud"
		TOPIC_TOO_LOW: "626847", // "Your voice is too soft"
		TOPIC_TOO_SLOWLY: "626849", // "You're speaking too slowly"
		TOPIC_TOO_FAST: "626851", // "You're speaking too fast"
		TOPIC_MIC_NO_VOICE: "626853", // "Sorry, we think there is a problem with your microphone"
		TOPIC_TECH_ERROR: "626855", // "Technical error"
		TOPIC_RETRY: "626859", // "Please try again"
		TOPIC_3_FAIL: "626862", // "Sorry, it seems that we have trouble recognizing your voice"
		MSG_NOT_RECOGNIZE: "626844", // "Check your settings and make sure you are in a quiet place before trying again."
		MSG_CHECK_MIC_HIGH: "626846", // "Please check your microphone settings and try again."
		MSG_CHECK_MIC_LOW: "626848", // "Please check your microphone settings and try again."
		MSG_TRY_FASTER: "626850", // "Please try again a bit faster."
		MSG_TRY_SLOWLY: "626852", // "Please try again more slowly."
		MSG_CHECK_NOT_MUTE: "626854", // "Please check that it is correctly installed and is not muted."
		MSG_TIMEOUT: "626856", // "The server timed out your request. Please try again."
		MSG_FLASH_ERROR: "626857", // "The speech recognition software was unable to connect. Please try again."
		MSG_SERVER_ERROR: "626858", // "The server cannot process your request right now. Please try again."
		MSG_INCORRECT_PRONUN: "626860", // "Pronounce the words more carefully."
		MSG_INCORRECT_ANSWER: "626861", // "That answer is Incorrect."
		MSG_SKIP: "626863", // "Do you want to skip this activity for now?"
		MSG_TRY_NON_SPEAKING: "626864"  // "Do you want to try this activity in non-speaking mode instead?"
	};

	var translations = {};

	var blurbKeys = Object.keys(blurbs);
	var queries = blurbKeys.map(function (key) {
		return 'blurb!' + blurbs[key];
	});
	translations.loadedPromise = Hub.publish('query', queries)
		.then(function (queriedBlurbs) {
			blurbKeys.forEach(function (key, index) {
				translations[key] = queriedBlurbs[index].translation;
			});
			return translations;
		});

	return translations;
});
