define([
	"jquery",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"when"
], function($, Widget, loom, when){

	"use strict";

	var $ELEMENT = "$element";

	return Widget.extend({
		// controller
		// {
		//  "value1": "widgetA",
		//  "value2": "widgetB"
		// }
		"sig/start": function onSingle() {
			var me = this;
			var $data = me[$ELEMENT].data();

			if($data.query && $data.controller) {
				return me.query($data.query).spread(function(data){
					if(typeof $data.controller == "string") {
						$data.controller = $.parseJSON($data.controller);
					}
					var widget = $data.controller[data.value];

					if(widget) {
						me[$ELEMENT].html($("<div>").attr(loom.weave, widget).attr("data-abtest", data.value));
						return me.weave();
					}
				});
			}
			else {
				return when.resolve();
			}
		}
	});
});
