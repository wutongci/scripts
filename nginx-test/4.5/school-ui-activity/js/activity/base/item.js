define([
	'when',
	"troopjs-core/component/factory",
	'troopjs-core/pubsub/hub'
], function (when, Factory, hub) {

	var TOPIC_ITEMPROP = "activity/item/prop/changed/";
	var PROMISE_SUFFIX = 'Promise';

	var PROP = {
		/* Return true or false, indicates if current answer is intact so that it can be checked by scoring.compute */
		ANSWERED: 'answered',
		/* indicates if current activity enabled instance feedback */
		INSTANT_FEEDBACK: 'instantFeedback',
		/* indicates if current activity is savable */
		SAVABLE: 'savable',
		/* indicates if current activity is completed */
		COMPLETED: 'completed'
	};

	var methods = {
		_pubProps: function () {
			var me = this;
			var promises = [];
			for (var key in PROP) {
				if (!PROP.hasOwnProperty(key)) {
					return;
				}

				// compulsory publish the change
				var currentValue = methods[PROP[key]].call(me);
				var promise = methods[PROP[key] + PROMISE_SUFFIX].call(me, currentValue, false);
				promises.push(promise);
			}
			return when.all(promises);
		}
	};

	// setup state APIs
	for (var key in PROP) {
		if (!PROP.hasOwnProperty(key)) {
			return;
		}

		methods[PROP[key]] = (function (key) {
			/*
			 * @param silent true to not publishing, false to force publishing, undefined
			 * indicates that the publishing happen only when the value is updated.
			 */
			return function (value, silent) {
				var _key = this['_' + key];

				if (arguments.length >= 1 && (silent === false || value !== _key)) {
					this['_' + key] = value;
					if (silent !== true) {
						hub.publish(TOPIC_ITEMPROP + PROP[key], value, this._index, this);
					}
				}

				return _key;
			};
		})(key);

		methods[PROP[key] + PROMISE_SUFFIX] = (function (key) {
			/*
			 * @param silent true to not publishing, false to force publishing, undefined
			 * indicates that the publishing happen only when the value is updated.
			 */
			return function (value, silent) {
				var previousValue = this['_' + key];

				if (arguments.length >= 1 && (silent === false || value !== previousValue)) {
					this['_' + key] = value;
					if (silent !== true) {
						return hub.publish(TOPIC_ITEMPROP + PROP[key], value, this._index, this)
								.then(function() {
									return previousValue;
								}, function() {
									//ignore error
									return previousValue;
								});
					}
				}

				return when.resolve(previousValue);
			};
		})(key);

	}

	return Factory(function (index/*, json*/) {

		this._index = index;

		this[PROP.ANSWERED](false, true);
		this[PROP.INSTANT_FEEDBACK](false, true);
		this[PROP.SAVABLE](false, true);
		this[PROP.COMPLETED](false, true);

	}, methods);
});
