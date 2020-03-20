define([
    "compose",
    "jquery",
    "troopjs-utils/deferred",
    "troopjs-utils/when",
    "troopjs-utils/tr",
    "troopjs-utils/grep",
    "troopjs-utils/uri",
    "troopjs-ef/widget/application",
    "troopjs-ef/data/cache",
    "troopjs-core/route/router",
    "troopjs-core/remote/ajax",
    "troopjs-ef/service/query",
    "school-ui-study/service/config",
    "school-ui-study/service/context",
    "school-ui-study/service/load"
], function ApplicationModule(Compose, $, Deferred, when, tr, grep, URI, Application, Cache, Router, Ajax, Query, Config, Context, Load) {
    "use strict";

    var RE = /^\w+!/;
    var _URI = "uri";
    var CONTEXT = "context";
    var CURRENT_ENROLLMENT = "currentEnrollment";
    var SERVICES = "services";
    var ENROLLMENTS = "enrollments";
    var REQ_ENROLLMENT = "reqEnrollment";

    /**
     * Forwards signals to services
     * @param signal Signal
     * @param deferred Deferred
     * @returns me
     */
    function forward(signal, deferred) {
        var me = this;

        var services = tr.call(me[SERVICES], function (service, index) {
            return Deferred(function (dfd) {
                service.signal(signal, dfd);
            });
        });

        if (deferred) {
            when.apply($, services).then(deferred.resolve, deferred.reject, deferred.notify);
        }

        me.publish("application/signal/" + signal, deferred);

        return me;
    }

     /*!
     * validate if request enrollment belongs to the student
     * if false, use student current context enrollment
     *
     * @param {void}
     * @return {void}
     */
    function validateEnrollment() {
        var me = this,
            context = me[CONTEXT],
            reqEnrollment = me[REQ_ENROLLMENT];

        if(!context || !reqEnrollment ||
            (context[CURRENT_ENROLLMENT] || {}).id === reqEnrollment.id  ||
            !context[ENROLLMENTS]) {
            return;
        }
        
        // check request enrollment
        var isValidEnrollment = false;
        $.each(context[ENROLLMENTS], function(index, enrollment) {
            if(reqEnrollment.id === enrollment.id) {
                isValidEnrollment = true;
                return false;
            }
        });

        if(!isValidEnrollment) {
            // refresh no hash page to load student context
            window.location.hash = "";
            window.location.reload();
        }
    }

    return Application.extend(function ($element, name) {
        var $window = $(window);
        var cache = Cache();

        this[SERVICES] = [ Router($window), Ajax(), Query(cache), Config(cache), Context(), Load() ];
    }, {
        "sig/initialize" : forward,
        "sig/finalize" : forward,
        "sig/start" : forward,
        "sig/stop" : forward,


        "hub:memory/route" : function onRoute(topic, uri) {
            var me = this;

            me.update(me[CONTEXT], me[_URI] = uri);
        },

         /**
         * subscription: hub:memory/context
         * save context, update context and
         * validate enrollment if isUpdate is not true
         *
         * @param {String} topic
         * @param {Object} context
         * @param {Boolean} isUpdate
         * @return {void}
         */
        "hub:memory/context" : function onContext(topic, context) {
            var me = this;
            var isUpdate = arguments[arguments.length-1];

            me.update(me[CONTEXT] = context, me[_URI], isUpdate);

            if(!isUpdate) {
                validateEnrollment.call(me);
            }
        },

        /**
         * subscription: hub:memory/load/enrollment
         * save request enrollment and validate
         *
         * @param {String} topic
         * @param {Object} enrollment
         * @return {void}
         */
        "hub:memory/load/enrollment" : function onEnrollment(topic, enrollment) {
            var me = this;

            me[REQ_ENROLLMENT] = enrollment;

            validateEnrollment.call(me);
        },

        /**
         * update context
         *
         * @param {Object} context
         * @param {Object} uri
         * @param {Boolean} isUpdate
         * @return {void}
         */
        "update" : function update(context, uri, isUpdate) {
            var me = this;

            if (!context || !uri || (!isUpdate && uri.path) || !(CURRENT_ENROLLMENT in context)) {
                return;
            }

            // Deferred query
            Deferred(function deferredQuery(dfdQuery) {
                me.query(context[CURRENT_ENROLLMENT].id, dfdQuery);
            })
            .done(function doneQuery(enrollment) {
                // Route to school with all parts of the path set
                uri.path = URI.Path(tr.call([ "school", enrollment, enrollment.course, enrollment.level, enrollment.unit ], function (element, i) {
                    element = element || "";
                    return element.id
                        ? element.id.replace(RE, "")
                        : element;
                }));

                me.route(uri);
            });
        }
    });
});
