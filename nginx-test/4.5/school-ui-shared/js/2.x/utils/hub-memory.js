define([
	"troopjs-core/pubsub/hub"
], function (Hub) {

	return {
		readMemory: function (topic) {
			var result;
			var callback = function (value) {
				result = value;
			};
			// Use "callback" as context to ensure it doesn't conflict with another subscription
			Hub.subscribe(topic, callback, callback);
			Hub.reemit(topic, false, callback, callback);
			Hub.unsubscribe(topic, callback, callback);
			return result;
		}
	}

});
