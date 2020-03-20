/**
 * class TrackerBase
 * The base tracker class, allows you to inherit to implement customized tracking logic
 * It does:
 *    Getting the tracking data from server according to this.scope (which specified in sub class)
 *    Monitor the hash uri change,
 *    Check if uri match the regex in tracking data.
 */
define([
	'jquery',
	'when',
	'troopjs-ef/component/widget',
	'./mock-data'
], function BaseTrackerModule(
	$,
	when,
	Widget,
	MOCK_DATA
) {
	"use strict";

	var URI = 'uri';
	var ON_SEND = '_onSend';
	var EX_BOUND_ERR = 'Tracker widget must be bound to top-most element';

	/**
	 * Try to see if current uri is matched, if matched, send out the event.
	 * @param uri the uri to be matched and tracked.
	 */
	function sendURI(uri) {
		if (!uri) {
			return;
		}

		var me = this, data = me._data.tracking, l;

		me[URI] = uri;

		for (l = data.length; l--;) {
			if (data[l].props && data[l].regex != null && new RegExp(data[l].regex).test(uri)) {
				// this[ON_HASH_MATCH](data[l], uri);
				me[ON_SEND](data[l], {
					uri: uri
				});
			}
		}

	}

	function sendBehavior(behavior) {
		if (!behavior) {
			return;
		}

		var me = this, data = me._data.tracking, l, lb, behaviorItem, uri = me[URI];

		for (l = data.length; l--;) {

			behaviorItem = data[l].behavior;

			if (!behaviorItem ||
				// check the constrains of uri if available
				(data[l].regex && !(new RegExp(data[l].regex).test(uri)))
			) {
				continue;
			}

			for (lb = behaviorItem.length; lb--;) {
				if (behaviorItem[lb].props && behaviorItem[lb].name === behavior) {

					// this[ON_HASH_MATCH](data[l], uri);
					me[ON_SEND](behaviorItem[lb], {
						behavior: behavior
					});
				}
			}
		}

	}

	function filter(track) {
		var me = this;

		me._dfdTrackingInfo.then(function(){
			sendURI.call(me, track.uri);
			sendBehavior.call(me, track.behavior);
		});
	}

	return Widget.extend(function () {
		var me = this;

		me._dfdTrackingInfo = me.getTracking();

		me._dfdFirstRoute = when.defer();
	}, {
		'sig/start': function () {
			// check if current element is top most element
			// if its not, this widget cannot work
			var tag = this.$element[0].tagName.toUpperCase();
			if (tag !== 'BODY' && tag !== 'HTML') {
				throw EX_BOUND_ERR;
			}
		},

		'hub:memory/route': function onRoute(uri) {
			var me = this;

			filter.call(me, {
				uri: uri
			});

			me._dfdFirstRoute.resolve();
		},
		'hub:memory/tracking/track': function onTrack(track) {
			var me = this;
			var behavior = track.toString();

			if (track.name) {
				behavior = track.name;
			}

			me._dfdFirstRoute.promise.then(function () {
				filter.call(me, {
					behavior: behavior
				});
			});
		},

		'dom:[data-action="track"]/click': function (event, behavior) {
			var me = this;
			var $target = $(event.currentTarget);

			me.publish('tracking/track', behavior || $target.data('behavior'));
		},
		/**
		 * Get tracking info from remote server
		 */
		getTracking: function onGetTracking() {
			var me = this;
			var id = 'tracking!' + me.scope;

			// Check if required data is in mocking data
			for (var l = MOCK_DATA.length; l--;) {
				if (MOCK_DATA[l].id === id) {
					// if there is, resolve with the mock data
					me._data = MOCK_DATA[l];
					return when.resolve();
				}
			}

			return me.query('tracking!' + me.scope)
				.spread(function (trackingData) {
					me._data =trackingData;
				});
		},
	});
});
