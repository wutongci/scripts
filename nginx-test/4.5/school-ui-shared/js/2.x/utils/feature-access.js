define(["school-ui-shared/enum/feature-access-id"], function(FeatureAccessId){
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
