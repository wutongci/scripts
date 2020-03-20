define([
	"when",
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"template!./facebook.html"
], function (when, $, Widget, typeIdParser, tFacebook) {

	var FACEBOOK_FEED = "https://www.facebook.com/dialog/feed",
		// params for facebook api, from ccl
		CCLS = {
			picture: "school.courseware.facebook.share.pic",
			app_id: "configuration.facebook.appid",
			link: "Facebook.School.Share.link",
			redirect_uri: "Facebook.School.Share.RedirectUrl"
		},
		// params for facebook api, load from blurb which loaded from ccl
		BLURBS_VIA_CCLS = {
			name: "Facebook.School.Share.Name",
			caption: "Facebook.School.Share.Caption"
		},
		// params for facebook api, from blurb
		BLURBS = {
			description: 494632
		},
		// static params for facebook api
		STATIC = {
			display: "popup"
		},
		POPUP_PARAM = "width=600,height=380",
		FEEDPARAM = "feedParam",
		STEP_ID = "stepId",
		CACHE_SERVER = "cacheServer",
		SEL_CONTAINER = ".ets-acc-sharing-container",
		CLASS_SHAKE = "ets-acc-sharing-shake",
		$ELEMENT = "$element";

	function getCCL(ccl) {
		return this.query("ccl!'" + ccl + "'")
			.spread(function (data) {
				return data.value;
			});
	}

	function getBlurb(id) {
		return this.query("blurb!'" + id + "'")
			.spread(function (data) {
				return data.translation;
			});
	}

	return Widget.extend(function ($element) {
		var me = this;
		me[$ELEMENT] = $element;
		me[FEEDPARAM] = {};
		me[CACHE_SERVER] = "";
	}, {
		"sig/start": function () {
			var me = this;
			var params = {};
			var promises = [];

			// loading parameters start

			// ccl params
			$.each(CCLS, function (key, ccl) {
				promises.push(
					getCCL.call(me, ccl)
						.then(function (cclValue) {
							params[key] = cclValue;
						})
				);
			});

			// blurb params
			$.each(BLURBS, function (key, blurbID) {
				promises.push(
					getBlurb.call(me, blurbID)
						.then(function (blurbText) {
							params[key] = blurbText;
						})
				);
			});

			// blurb inside ccl
			$.each(BLURBS_VIA_CCLS, function (key, ccl) {
				promises.push(
					getCCL.call(me, ccl)
						.then(function (cclValue) {
							// convert it to either NaN or number
							cclValue *= 1;

							// NaN != NaN return true
							if (cclValue != cclValue) {
								return;
							}

							return getBlurb.call(me, cclValue);
						})
						.then(function (blurbText) {
							params[key] = blurbText;
						})
				);
			});

			// loading parameters end

			when.all(promises)
				.then(function () {

					// parameter construction start

					// static params
					$.extend(params, STATIC);

					params.picture = me[CACHE_SERVER] + params.picture;

					me[FEEDPARAM] = params;

					// parameter construction end

					// do render
					me.html(tFacebook);
					me[$ELEMENT].find(SEL_CONTAINER)
						.addClass(CLASS_SHAKE)
						.fadeIn()
						.delay(10000)
						.fadeOut()
				});
		},
		"hub:memory/context": function (context) {
			this[CACHE_SERVER] = context.cacheServer;
			STATIC.ref = "Share_School_" + context.countryCode;
		},
		"hub:memory/load/step": function (step) {
			var me = this;
			if (step) {
				me[STEP_ID] = typeIdParser.parseId(step.id);
			}
		},
		"dom:[data-action=share]/click": function () {
			var me = this;
			window.open(FACEBOOK_FEED + "?" + $.param(this[FEEDPARAM]), "facebook", POPUP_PARAM);

			//use hub way to send useraction tracking
			//in studyplan, we will subscribe this hub to send the useraction data,
			//but in e12 or others, nothing will happen.
			me[STEP_ID] && me.publish("tracking/useraction", {
				"action.socialShare": me[STEP_ID]
			});
		}
	})
});
