define([
	"when",
	"troopjs-ef/component/widget"
	], function(when, Widget){

		var RE = /(?:\^(\w+)\^)/g;
		var PATTERNS = {
			"default" : RE
		};

		return Widget.extend({
			"sig/start" : function cclBlurbStart () {
				var me = this;
				var data = me.$element.data();
				//if there is a blurb-ccl in data, we try to use the ccl value as the blurb id
				return when(data.blurbCcl && me.query("ccl!'" + data.blurbCcl + "'"))
					.then(function(cclValue){
						//if the ccl value is undefined, we use origin blurb id in data
						var id = cclValue && cclValue[0] && cclValue[0].value || data.blurbId;
						if(id){
							// Query for blurb
							return me.query("blurb!" + id).spread(function doneQuery(blurb) {
								var pattern = data.pattern;
								var values = data.values;
								var translation = blurb && blurb.translation || "";

								if (translation && values) {
									pattern = pattern
										? PATTERNS[pattern] || RegExp(pattern, "g")
										: RE;

										translation = translation.replace(pattern, function (match, key, position, original) {
											return values[key] || key;
										});
								}
								// Set html, pass deferred
								return me.html(translation);
							});						
						}
					});
			}

		});
	});
