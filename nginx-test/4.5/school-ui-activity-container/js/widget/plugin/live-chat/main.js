define([
	"when",
	"jquery",
	"jquery.gudstrap",
	"troopjs-ef/component/widget",
	"livechat-ui/livechat-button",
	"template!./button.html",
	"template!./tooltip-title.html"
], function (when, $, $gudstrap, Widget, LiveChatBtn, tButton, tTooltipTitle) {
	var $ELEMENT = "$element";
	var SEL_LIVE_CHAT_BTN = '.ets-act-live-chat-button';
	var SF_LIVECHAT_ORG_ID = "00D300000000Ys3";
	var BLURB_TOOLTIP_TITLE = "blurb!702072";

	var TOOLTIP_SHOWN_ON_INCORRECT_ANSWER_KEY = 'activityLivechatTooltipShownOnIncorrectAnswer';

	function createTooltipOptions(options) {
		var _options = $.extend({
			trigger: "hover focus"
		}, options);
		return {
			html: true,
			trigger: _options.trigger,
			title: function () {
				return tTooltipTitle({
					hasCloseBtn: _options.hasCloseBtn,
					title: _options.title
				});
			}
		};
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			me.liveChatChecked = when.all([
				me.query(BLURB_TOOLTIP_TITLE),
				me.getLiveChatOptions(),
				me.getButtonIds()
			]).spread(function (tooltipTitle, liveChatOptions, buttonIds) {
				if (!buttonIds || !liveChatOptions) {
					return when.resolve();
				}

				return me.html(tButton).then(function () {
					var $element = me[$ELEMENT];
					var button;

					me.$button = $element.find(SEL_LIVE_CHAT_BTN);
					me.tooltipTitle = tooltipTitle && tooltipTitle[0] && tooltipTitle[0].translation;

					me.$button.tooltip(createTooltipOptions({
						title: me.tooltipTitle
					}));

					button = new LiveChatBtn(
						me.$button,
						buttonIds,
						liveChatOptions,
						$element.data("delegate") || null
					);

					return when.promise(function (resolve) {
						me.$button.on('statuschange', function () {
							resolve(button);
						});
					});
				});
			});
		},

		"dom:.tooltip-close/click": function () {
			var me = this;
			me.$button.tooltip("destroy");
			me.$button.tooltip(createTooltipOptions({
				title: me.tooltipTitle
			}));
		},

		// Manually trigger a tooltip
		// when an answer is incorrect for the first time
		"hub/activity/interaction": function (iteraction) {
			var me = this;

			if (iteraction && iteraction.correct) {
				return;
			}

			me.liveChatChecked.then(function (button) {
				if (!button || !button.isOnline) {
					return;
				}

				if (localStorage.getItem(TOOLTIP_SHOWN_ON_INCORRECT_ANSWER_KEY)) {
					return;
				}

				localStorage.setItem(TOOLTIP_SHOWN_ON_INCORRECT_ANSWER_KEY, true);

				me.$button.tooltip("destroy");
				me.$button.tooltip(createTooltipOptions({
					hasCloseBtn: true,
					trigger: "manual",
					title: me.tooltipTitle
				}));
				me.$button.tooltip("show");
			});
		},

		getButtonIds: function () {
			var me = this;
			return me.query(
				"cms!CustomerService#Contactus#livechat-ui-language"
			).spread(function (buttonIds) {
				if (!buttonIds || !buttonIds.content || typeof buttonIds.content !== "string") {
					return undefined;
				}
				return buttonIds.content.split(",");
			});
		},

		getLiveChatOptions: function () {
			var me = this;
			return me.query(
				"context!current",
				"school_context!current.user",
				"cms!CustomerService#Contactus#livechat-teacher-deploymentId",
				"cms!CustomerService#Contactus#livechat-teacher-url"
			).spread(function (context, schoolContext, deploymentIdInfo, livechatUrlInfo) {
				if (!deploymentIdInfo || !deploymentIdInfo.content ||
					!livechatUrlInfo || !livechatUrlInfo.content) {
					return undefined;
				}
				var languageCode = context && context.values && context.values.languagecode;
				var user = schoolContext && schoolContext.user || {};
				return {
					"sf": {
						"url": livechatUrlInfo.content,
						"deploymentId": deploymentIdInfo.content,
						"orgId": SF_LIVECHAT_ORG_ID
					},
					"user": {
						"Email": user.email,
						"Division": user.divisionCode,
						"Partner": user.partnerCode,
						"Full name": user.firstName + " " + user.lastName,
						"MemberID": user.member_id,
						"Country": user.countryCode,
						"Browser language": languageCode && languageCode.value
					}
				};
			});
		}
	});
});
