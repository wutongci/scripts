define(function(){
    return {
        parseFlag : function(stateObj, stateCode){
            var parsed = {};
            if(stateObj){
                for (stateName in stateObj){
                    if(stateObj.hasOwnProperty(stateName)){
                        parsed[stateName] = (stateObj[stateName] & stateCode) === stateObj[stateName];
                    }
                }
            }
            return parsed;
        },
        map : function(stateObj, stateCode){
            if(stateObj){
                for (stateName in stateObj){
                    if(stateObj.hasOwnProperty(stateName) && stateObj[stateName] === stateCode){
                        return stateName;
                    }
                }
            }
        } 
    };
});
