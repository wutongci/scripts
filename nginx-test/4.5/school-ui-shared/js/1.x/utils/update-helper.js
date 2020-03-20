/**
 * # util/update-help.js
 *
 * Update service wrapper
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
    "troopjs-core/component/service",
    "troopjs-utils/deferred",
    "troopjs-utils/merge",
    "json2"
], function UpdateHelperUtilModule(Service, Deferred, merge, JSON) {
    "use strict";
    var DEBUG = true;

    /*!
     * api name
     */
    var API_SUBMIT_SCORE = "school/progress/SubmitActivityScore",
        API_MOVE_ON_UNIT = "school/enrollment/MoveOnUnit",
        API_UPDATE_ENROLLMENT = "school/enrollment/Enroll",
        API_SAVE_MEMBER_SITE = "school/member_site_setting/Save",
        API_SUBMIT_RATING = "school/rating/SubmitRating",
        API_FEATURE_LOG = "school/featuresupport/Log",
        API_ACT_EVENT_LOG = "school/school_event_log/LogActivityEvent";

    /*!
     * hub name
     */
    var HUB_UPDATE_PROGRESS = "ef/update/progress";

    /*!
     * constants
     */
    var ID = "id",
        FAULT = "fault!",
        FAULT_CODE = "faultCode",
        FAULT_MSG = "faultMessage";

    /*!
     * get error status and status text from ajax error
     *
     * TODO: For ajax error we need a framework layer process?
     *
     * @param {Object} ex
     * @return {String} error
     */
    function errorOf(ex) {
        var error = "Sorry! Error occurred, please contact Administrator.";
        if(!DEBUG) {
            return error;
        }
        
        if(ex && ex.status) {
            error = ex.status + " " + ex.statusText;
        } else {
            error = ex || "unknown error";
        }
        return error;
    }

    /*!
     * verify results
     *
     * @param {Array} results
     * @return {Object} verified
     */
    function verify(results) {
        var result = results && (results[0] || results),
            verified = { success: true, data: result };
        
        if(!result || result[ID] === FAULT) {
            verified.success = false;
            verified.data = result ? result[FAULT_MSG] : "verify failed, unknown error";
        }
        return verified;
    }

    function getIframeWindow() {
        var doc = window.frames[0].document;
        var win = 'defaultView' in doc? doc.defaultView : doc.parentWindow;
        return win;
    }

    /*!
     * call update service by api
     *
     * @param {String} apiName
     * @param {Object} context Optional
     * @param {Object} data
     * @param {Object} deferred
     * @param {String} topic
     */
    function update(apiName, context, data, deferred, topic) {
        var me = this;

        if(!context || !context.constructor || !context.constructor._getBases) {
            deferred = data;
            data = context;
            context = me;
        }

        deferred = deferred || Deferred();
        Deferred(function deferredUpdate(dfdUpdate) {

            me.publish(apiName,
                data, dfdUpdate);

        })
        .done(function doneUpdate(results) {
            var verified = verify.call(me, results),
                result  = verified.data;

            if(verified.success) {
                deferred.resolve(result);
                if(topic) {
                    me.publish(topic, result);
                }
            } else {
                deferred.reject(result);
            }
        })
        .fail(function failUpdate(ex) {
            deferred.reject(errorOf.call(me, ex));
        });
    }

    return Service.extend({
        submitScore: function onSubmitScore(context, data, deferred) {
            update.call(this, API_SUBMIT_SCORE, context, data, deferred, HUB_UPDATE_PROGRESS);
        },

        moveOnUnit: function onMoveOnUnit(context, data, deferred) {
            update.call(this, API_MOVE_ON_UNIT, context, data, deferred, HUB_UPDATE_PROGRESS);
        },

        updateEnrollment: function onUpdateEnrollment(context, data, deferred) {
            update.call(this, API_UPDATE_ENROLLMENT, context, data, deferred);
        },

        submitRating: function onSubmitRating(context, data, deferred) {
            update.call(this, API_SUBMIT_RATING, context, data, deferred);
        },

        saveMemberSite: function onSubmitRating(context, data, deferred) {
            update.call(this, API_SAVE_MEMBER_SITE, context, data, deferred);
        },

        logFeature: function onLogFeature(context, data, deferred){
            update.call(this, API_FEATURE_LOG, context, data, deferred);  
        },

        logActEvent: function onLogActEvent(context, data, deferred) {
            update.call(this, API_ACT_EVENT_LOG, context, data, deferred);
        }
    }).apply(Service).start();
});
