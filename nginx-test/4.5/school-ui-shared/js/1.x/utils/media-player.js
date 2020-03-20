define(["compose", "jquery", "./browser-check", "./ccl", "../enum/ccl"], function (Compose, $, BROWSERCHECK, CCL, ENUM) {
    var VALUE = "value";
    var SHIM = "shim";
    var AUTO = "auto";
    var TYPE = "type";
    var BROWSER = "browser";
    var VERSION = "version";
    var PLAYER = "player";
    var AUDIO = "audio";
    var VIDEO = "video";

    function player(type, deferred) {
        // Quick fail if required parameter were not provided
        if (!type || !deferred) {
            throw new Error("required parameters not provided");
        }

        $.Deferred(function (dfd) {
            // Query CCL for rules
            CCL.getCCLByKey(ENUM.playerRules, dfd);
        })
            .done(function (rules) {
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
                deferred.resolve(players.pop() || SHIM);
            })
            .fail(deferred.reject);
    }

    var MediaPlayer = Compose.create({
        "videoPlayer" : function (deferred) {
            return player.call(this, VIDEO, deferred);
        },

        "audioPlayer" : function (deferred) {
            return player.call(this, AUDIO, deferred);
        }
    });

    MediaPlayer[SHIM] = SHIM;
    MediaPlayer[AUTO] = AUTO;

    return MediaPlayer;
});
