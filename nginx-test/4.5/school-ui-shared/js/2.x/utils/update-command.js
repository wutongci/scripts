define([
	"when",
	"troopjs-ef/component/gadget"
], function (when, Gadget) {
	"use strict";
	var DEBUG = true;

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
		return when.reject(error);
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

	/*!
	 * call update service by api
	 *
	 * @param {String} apiName
	 * @param {Object} data
	 * @param {String} topic
	 */
	function update(apiName, data, topic) {
		var me = this;
		var promise;
		me.publish("school/spinner", promise = me.publish(apiName, data));
		return promise.spread(function doneUpdate(results) {
			var verified = verify.call(me, results),
				result  = verified.data;

			if(verified.success && results !== data) {
				if(topic) {
					me.publish(topic, result);
				}
				return result;
			} else {
				throw result;
			}
		}).otherwise(function(ex){
			return errorOf.call(me, ex);
		});
	}

	return Gadget.create({
		update: update
	});
});
