 /**
  * check text if can be recognized by TTS
  */
 define([
    "compose"
], function TextHelperModule(Compose) {
    "use strict";
    var RE_TEXT_CAN_TTS = /[A-Za-z0-9\+\\]+/;
    var TEXT_ONLY_ONE_CAN_TTS = {
        "~": 1,
        "`": 1,
        "!": 1,
        "#": 1,
        "^": 1,
        "*": 1,
        "(": 1,
        ")": 1,
        "_": 1,
        "-": 1,
        "[": 1,
        "]": 1,
        "{": 1,
        "}": 1,
        "|": 1,
        ";": 1,
        ":": 1,
        "'": 1,
        ",": 1,
        ".": 1,
        "<": 1,
        ">": 1,
        "?": 1,

        "$": 1,
        "%": 1,
        "&": 1,
        "@": 1,
        "/": 1,
        "=": 1
    };

    return Compose.create({
        "canTTS": function onCheckText(text) {
            text = text || "";
            if(text.search(RE_TEXT_CAN_TTS) >= 0) {
                return true;
            } else if(text.length === 1) {
                return !!TEXT_ONLY_ONE_CAN_TTS[text];
            } else {
                return false;
            }
        }
    });
});
