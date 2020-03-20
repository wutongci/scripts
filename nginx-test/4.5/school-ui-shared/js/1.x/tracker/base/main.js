/**
 * class TrackerBase
 * The base tracker class, allows you to inherit to implement customized tracking logic
 * It does:
 *    Getting the tracking data from server according to this.scope (which specified in sub class)
 *    Monitor the hash uri change,
 *    Check if uri match the regex in tracking data.
 */
define(['compose', 'troopjs-core/component/widget', 'troopjs-utils/deferred', './mock-data'], 
    function BaseTrackerModule(Compose, Widget, Deferred, MOCK_DATA){
    "use strict";

    var URI = 'uri';
    var ON_SEND = '_onSend';
    var ON_HASH_MATCH = '_onHashMatch';
    var EX_BOUND_ERR = 'Tracker widget must be bound to top-most element';

    var routingQueue = [];

    function begatQueuedItem(uri){
        return {
            uri: uri,
            behaviors: []
        };
    }

    function filter(track){
        var me = this;

        if (me._dfdTrackingInfo.isResolved()){

            sendURI.call(me, track.uri);
            sendBehavior.call(me, track.behavior);

        }
        else{

            if (track.uri){
                routingQueue(begatQueuedItem(uri))
            }

            var item = routingQueue[routingQueue.length - 1];
            
            if (track.behavior){
                item.behaviors.push(track.behaviors);
            }
        }
    }

    /**
     * Try to see if current uri is matched, if matched, send out the event.
     * @param uri the uri to be matched and tracked. 
     */
    function sendURI(uri){
        if (!uri || uri == false){
            return;
        }

        var me = this, data = me._data.tracking, l;

        me[URI] = uri;

        for(l = data.length; l--;){
            if (data[l].props && data[l].regex != null && new RegExp(data[l].regex).test(uri)){
                // this[ON_HASH_MATCH](data[l], uri);
                me[ON_SEND](data[l], {
                    uri: uri
                });
            }
        }

    }

    function sendBehavior(behavior){
        if (!behavior || behavior == false){
            return;
        }

        var me = this, data = me._data.tracking, l, lb, behaviorItem, uri = me[URI]

        for(l = data.length; l--;){

            behaviorItem = data[l].behavior;

            if (!behaviorItem || 
                // check the constrains of uri if available 
                (data[l].regex && !(new RegExp(data[l].regex).test(uri)))
                ){
                continue;
            }
            
            for(lb = behaviorItem.length; lb--;){
                if (behaviorItem[lb].props && behaviorItem[lb].name == behavior){

                    // this[ON_HASH_MATCH](data[l], uri);
                    me[ON_SEND](behaviorItem[lb], {
                        behavior: behavior
                    });
                }
            }
        }
        
    }

    function onRoute(topic, uri){

        var me = this, data, l;
        
        filter.call(me, {
            uri: uri
        })

        me._dfdFirstRoute.resolve();

    }

    function onTrack(topic, track){
        var me = this;
        var behavior = track.toString();
        
        if (track.name){
            behavior = track.name;
        }

        me._dfdFirstRoute.done(function(){

            filter.call(me, {
                behavior: behavior
            });

        });

    }

    return Widget.extend(function(){

        var me = this;

        // Try to get the tracking info, and queue those routing signal if it is 
        // happened before tracking info is loaded, and re-signal them once data 
        // is loaded.
        me._dfdTrackingInfo = me.getTracking()
            .done(function(trackingData){

                var item, i, j;

                me._data = trackingData;

                for(i = 0; i < routingQueue.length; i++){

                    item = routingQueue[i];

                    // re-trigger cached events
                    sendURI.call(me, item.uri);

                    for(j = 0; j < item.behaviors.length; j++){

                        sendBehavior.call(me, item.behaviors[j]);

                    }
                }

                routingQueue.length = 0;
            });

        me._dfdFirstRoute = Deferred();

    }, {
        'sig/start': function(signal, deferred){

            // check if current element is top most element
            // if its not, this widget cannot work
            var tag = this.$element[0].tagName.toUpperCase();
            if (tag != 'BODY' && tag != 'HTML'){
                throw EX_BOUND_ERR;
                deferred.reject();
                return;
            }

            if (deferred){
                deferred.resolve();
            }
        },

        'hub:memory/route': onRoute,
        'hub:memory/tracking/track': onTrack,

        'dom/action': $.noop,
        'dom/action/track': function(topic, $event, behavior){
            var me = this;

            me.publish('tracking/track', behavior);
        },
        /**
         * Get tracking info from remote server
         */
        getTracking: function onGetTracking(deferred){

            var ret = Deferred();
            var id = 'tracking!' + this.scope;
            var foundInMock = false;

            if (deferred){
                ret.then(deferred.resolve, deferred.reject);
            }

            // Check if required data is in mocking data
            for(var l = MOCK_DATA.length; l--;){
                if (MOCK_DATA[l].id == id){
                    // if there is, resolve with the mock data
                    ret.resolve(MOCK_DATA[l]);
                    foundInMock = true;
                    break;
                }
            }

            if (!foundInMock){
                // Otherwise, send a request for the data.
                this.query('tracking!' + this.scope, ret);
            }

            return ret;
        },
        _onSend: Compose.required
    });
});
