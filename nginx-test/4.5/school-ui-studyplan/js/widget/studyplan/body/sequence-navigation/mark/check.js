define([
    "when",
    "troopjs-ef/component/widget",
    "school-ui-shared/utils/typeid-parser",
    "template!./check.html"
],function(when, Widget, typeidParser, tCheck){
    
    var ID = "_id";
    var ITEM = "_item";

    return Widget.extend(function($element, path, itemData){
        this[ID] = typeidParser.parseId(itemData.id);
        this[ITEM] = itemData;
    },{
        "sig/start":function(){
            if(this[ITEM].typeCode === "goal"){
                return when.reject("skip check mark, goal item has no check mark");
            }
            return this.html(tCheck);
        },
        "hub:memory/studyplan/sequence-item/selected" : function(id){
            var me = this;
            var thisId = me[ID];
            me.$element.toggleClass("ets-none", id == thisId);
        }
    });
});
