define([
	"school-ui-progress-report/enum/feedback-typecode",
	"school-ui-progress-report/enum/feedback-category"
], function (fbType, fbCategory) {
	function getCategoryCode(fbTypeCode) {
		switch (fbTypeCode) {
			case fbType.writing:
				return fbCategory.writing;
			case fbType.gl:
			case fbType.pl:
			case fbType.cp20:
			case fbType.eftv:
				return fbCategory.evc;
			default:
				return fbCategory.none;
		}
	}

	return {
		getCategoryCode: getCategoryCode
	};
});
