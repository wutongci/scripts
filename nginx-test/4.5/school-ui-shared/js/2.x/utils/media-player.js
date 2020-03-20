define([
	"jquery",
	"when",
	"troopjs-core/component/factory",
	 "./browser-check",
	"./ccl",
	"../enum/ccl"
], function ($, when, Factory, BROWSERCHECK, CCL, ENUM) {
    var VALUE = "value";
    var SHIM = "shim";
    var AUTO = "auto";
    var TYPE = "type";
    var BROWSER = "browser";
    var VERSION = "version";
    var PLAYER = "player";
    var AUDIO = "audio";
    var VIDEO = "video";

    function player(type) {
        // Quick fail if required parameter were not provided
        if (!type) {
            return when.reject(new Error("required parameters not provided"));
        }

		// Query CCL for rules
		return CCL
			.getCCLByKey(ENUM.playerRules)
            .spread(function (rules) {
                // Parse rules
                rules = rules
                    && $.parseJSON(rules[VALUE]);

                // Get browser and version from BROWSERCHECK
                var browser = BROWSERCHECK[BROWSER];
                var version = BROWSERCHECK[VERSION];

                // Map players for combined rules
                var players = $.map(rules || false, function (rule) {
                    return rule
                        && (!(TYPE in rule) || type === rule[TYPE])
                        && (!(BROWSER in rule) || browser === rule[BROWSER])
                        && (!(VERSION in rule) || version >= rule[VERSION])
                        && rule[PLAYER];
                });

                // Resolve with last matched rule or SHIM
                return players.pop() || SHIM;
            });
    }

    var MediaPlayer = Factory.create({
        "videoPlayer" : function () {
            return player.call(this, VIDEO);
        },

        "audioPlayer" : function () {
            return player.call(this, AUDIO);
        }
    });

    MediaPlayer[SHIM] = SHIM;
    MediaPlayer[AUTO] = AUTO;

    return MediaPlayer;
});
