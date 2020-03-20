define(function () {
	return {
		// For DOM UI indicator
		START: 'START', // Shall only be used to indicate, DOM UI is ok to swtich to "recording" mode
		COMPLETE: 'COMPLETE', // Shall only be used to indicate, the recording is stopped, ASR evaluation follows.
		FEEDBACK: "FEEDBACK", // Shall only be used to indicate ASR evaluation is done, and <TPResult/> has been retrived from server.

		// For abnormal system error UI indicator
		FAILED: 'FAILED', // shall only be used to indicate server communication failure
		ERROR: "ERROR", // shall be used for any flash internal error, non-server communication related

		// For MIC status UI indicator
		NOMIC: 'NOMIC', // MIC status
		UNMUTED: 'UNMUTED', // MIC status
		MUTED: 'MUTED' // MIC status
	};
});
