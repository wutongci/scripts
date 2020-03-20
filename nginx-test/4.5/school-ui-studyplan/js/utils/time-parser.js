define([
	"troopjs-ef/component/gadget",
	"moment"
], function(
	Gagdet,
	moment
){
	"use strict";

	var timeParser = Gagdet.create({
		toLocalTime: function(time, offset){
			var me = this;
			var momentTime;

			// use local timezone if there is no timezone information
			if(offset === undefined){
				momentTime = moment(time);
			} else {
				momentTime = moment.utc(time).zone(0 - offset);
			}

			return {
				"dayOfWeek": momentTime.day(),
				"year": momentTime.year(),
				"month": momentTime.month() + 1,
				"day": momentTime.date(),
				"hour": momentTime.hour(),
				"minute": momentTime.minute(),
				"second": momentTime.second(),
				"timezone": momentTime.format('Z')
			};
		}
	});

	timeParser.start();

	return timeParser;
});
