define([
    "compose"
], function TypeidParserUtilModule(Compose) {
    "use strict";
    var RE_TYPEID = /^(?:(\w+)!)?!?([;\-\w]+)?/, /* format like "course!201" */
        RE_LAST_TYPEID=/(?:(\w+)[!|;])?(\d+)$/, /* format like "course!201;activity;345" */
        TYPE = "type",
        ID = "id",
        UNDEF;

    return Compose.create({
        // eg: "course!201" -> {type: "course", id: 201}
        // eg: "course!" -> {type: "course", id: undefined}
        // eg: "234234" -> {type: "", id: 234234}
        // eg: "!234234" -> {type: "", id: 234234}
        // eg: "course!sdfsdf" -> {type: "course", id: "sdfsdf"}
        // eg: "sdfsdf" -> {type: "", id: "sdfsdf"}
        // eg: "!sdfsdf" -> {type: "", id: "sdfsdf"}
        parse: function parse(typeid) {
            var matches = RE_TYPEID.exec(typeid);
            if(!matches) {
                matches = ["", "", UNDEF];
                //throw Error("invalid format of typeid, parse failed!");
            }
            var result = {};
            result[TYPE] = matches[1] || "";
            result[ID] = matches[2];
            return result;
        },

        /*
         input : "course!201;activity;345"
         output: {type:'activity',id:345}
         */
        parseLastType: function parseLastType(typeid){
            var rs=RE_LAST_TYPEID.exec(typeid)||[];
            return {
                type: rs[1],
                id  : rs[2]
            };
        },

        /*
         input : "course!201;activity;345"
         output: "activity!345"
         */
        parseLastTypeAndId: function parseLastTypeAndId(typeid){
            var rs = RE_LAST_TYPEID.exec(typeid)||[];
            return rs[1] + "!" + rs[2];
        },

        // eg: "course!201" -> "course"
        parseType: function parseType(typeid) {
            var result = this.parse(typeid);
            return result[TYPE];
        },

        // eg: "course!201" -> 201
        parseId: function parseId(typeid) {
            var result = this.parse(typeid);
            return result[ID];
        },

        // eg: "activity!1234.activityContent" -> "activity!1234"
        parseTypeid: function parseTypeid(str) {
            var result = this.parse(str);
            return result[TYPE] + "!" + result[ID];
        },

        // if input looks like a id, it returns true, otherwise false
        // eg: "course!23423" -> true
        // eg: "course!" -> true
        // eg: "course" -> false
        isId: function isId(str) {
            return ('' + str).indexOf('!') >= 0;
        }
    });
});
