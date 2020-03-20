define([
	"jquery",
	"poly",
	'when',
	'troopjs-ef/component/widget',
	'template!./main.html',
	'school-ui-shared/utils/typeid-parser',
	'jquery.ui'
], function DemoModule($, poly, when, Widget, template, idParser) {
	"use strict";

	var $ELEMENT = '$element';

	var SEL_ME = '.ets-profile-me';
	var SEL_ME_IMG = '.ets-profile-me img';
	var SEL_ME_LINK = '.ets-profile-me a';
	var SEL_PROFILE_WALL = '.ets-profile-wall';
	var SEL_PROFILES = '.ets-profile-wall li';
	var SEL_MSG = '.ets-msg-box';
	var SEL_DESC = '.ets-tooltip-content > p:eq(0)';
	var SEL_ST = '.ets-act-st';

	var CLS_NONE = 'ets-none';
	var CLS_ON = 'ets-on';
	var CLS_ACT = 'ets-act-sharing-pic-desc';

	var STARTED = '_started';

	var HUB_DESCRIBE_SHOW = "activity/sharing-pic-desc/show/describe-srceen";
	var HUB_NO_OTHERS = 'activity/sharing-pic-desc/describe/no/others';

	function loadProfiles() {
		var me = this;

		function loadSharedPictureDescrs() {
			return me._activityLoaded.promise
				.then(function () {
					var q = "sharing_picture_descr!" + me.activity_id;
					return me.query(q)
				})
				.spread(function (sharingData) {
					return sharingData;
				});
		}

		function loadUploadCacheServer() {
			return me.query('ccl!"school.sharingTemplate.upload.cacheServer"')
				.spread(function (cclUploadCacheServer) {
					return cclUploadCacheServer;
				});
		}

		return when.all([
			loadSharedPictureDescrs(),
			loadUploadCacheServer()
		]).spread(function (sharingData, cclUploadCacheServer) {
			if (!me[STARTED]) {
				return when.reject();
			}

			if (!sharingData || !sharingData.pictureWall || sharingData.pictureWall.length < 3) {
				me.publish(HUB_NO_OTHERS);
			}

			me._json.others = sharingData.pictureWall;
			me._json.myself = sharingData.studentSharing;
			me._json.uploadCacheServer = cclUploadCacheServer.value;
		});
	}

	function updateMyProfile(data) {
		var me = this;

		me[$ELEMENT].find(SEL_ME + " a > img").attr('src', data.imageUrl);
		me[$ELEMENT].find([SEL_ME, SEL_DESC].join(' ')).text(data.describe);

		me._json.myself.descr = data.describe;
		me._json.myself.isPrivate = data.isPrivate;

		if (!me[$ELEMENT].find(SEL_ME).hasClass(CLS_ON)) {
			showMySelf.call(me);
		}

		return when.resolve();
	}


	function closeCompleteMsg() {
		var me = this;
		me[$ELEMENT].find(SEL_MSG).fadeOut('fast', function () {
			$(this).remove();
		});
	}

	function showMySelf() {
		var me = this;

		me[$ELEMENT].find(SEL_ME_LINK).trigger('click');
	}

	function endingAnimation() {
		var me = this;
		me[$ELEMENT].addClass(CLS_NONE);
		return when.resolve();
	}

	function backToDescribScreen() {
		var me = this;
		me.publish(HUB_DESCRIBE_SHOW, {
			url: me[$ELEMENT].find(SEL_ME_IMG).attr('src'),
			isLibrary: me._json.myself.isFromLibrary,
			describe: me._json.myself.descr,
			isPrivate: me._json.myself.isPrivate,
			cropped: true
		});
	}

	function render() {
		var me = this;
		return me.html(template, me._json)
			.then(function () {
				me[$ELEMENT].find('.ets-tooltip-btns [data-blurb-id]')
					.attr('data-weave', 'troopjs-ef/blurb/widget')
					.weave();
				me.$profileWall = me[$ELEMENT].find(SEL_PROFILE_WALL);

				$(document.body).on('click.' + CLS_ACT, function (e) {
					me.$profileWall.css('zIndex', '');

					me[$ELEMENT].find(SEL_ME).removeClass(CLS_ON);
					me[$ELEMENT].find(SEL_PROFILES).removeClass(CLS_ON);
				});
			}).then(me._dfdRendered.resolve);
	}

	function ctor() {
		var me = this;
		me._json = {};
		me.edge = me[$ELEMENT].closest(SEL_ST).offset().left + 980;
		me._contextLoaded = when.defer();
		me._activityLoaded = when.defer();
		me._dfdRendered = when.defer();
	}

	// Log visit this picture's user
	// TODO: log api will be wrapped in etroop service later
	function logVisit($target) {
		var me = this;

		var studentId = $target.attr("student-id");
		me._contextLoaded.promise
			.then(function () {
				var params = {
					visitor_id: me._json.myself.studentId,
					activity_id: me.activity_id,
					student_id: studentId,
					'StudentId': me._StudentId
				};
				if (params.visitor_id && params.activity_id && params.student_id) {
					$.get("/services/school/social/SharingPictureDescr/picturevisit", params);
				}
			});
	}

	var methods = {
		"sig/start": function () {
			var me = this;

			me[STARTED] = true;

			//don't wait loadProfile to return so hub:memory/start/load/activity can be called
			loadProfiles.call(me)
				.then(render.bind(me));

			return when.resolve();
		},
		"sig/stop": function () {
			var me = this;
			me[STARTED] = false;
			$(document.body).off('click.' + CLS_ACT);
		},

		"hub/activity/sharing-pic-desc/picture-wall/reload": function (data) {
			var me = this;
			me._dfdRendered.promise.then(function () {
				if (!me._json.others.length) {
					me[$ELEMENT].addClass(CLS_NONE);
					backToDescribScreen.call(me);
				}

				if (data) {
					updateMyProfile.call(me, data);
				}
			});
		},

		'hub/st/picture-wall/show/myself': function () {
			var me = this;

			me.$element.find(SEL_ME_LINK).trigger('click');
		},
		'hub:memory/context': function (context) {
			var me = this;
			me._StudentId = idParser.parseId(context.user.id);
			me._json.cacheServer = context.cacheServer;
			me._contextLoaded.resolve();
		},
		'dom:.ets-profile-wall-item-placeholder/click': function (event) {
			event.preventDefault();
		},
		'dom:.ets-profile-wall-item/click': function ($e) {
			$e.preventDefault();
			$e.stopPropagation();
			var me = this;
			var $target = $($e.currentTarget);
			var $tooltip = $target.next();
			var isMe = $target.closest(SEL_ME).length ? true : false;
			var $parent = isMe ? $target.closest(SEL_ME) : $target.closest('li');

			closeCompleteMsg.call(this);

			if (isMe) {
				$parent.toggleClass(CLS_ON);
				me[$ELEMENT].find(SEL_PROFILES).removeClass(CLS_ON);
			} else {
				me.$profileWall.css('zIndex', 2);
				$parent.siblings().removeClass(CLS_ON).end()
					.toggleClass(CLS_ON);
				me[$ELEMENT].find(SEL_ME).removeClass(CLS_ON);
				//track click pciture event log
				logVisit.call(me, $target);
			}


			var height = $tooltip.height();
			var width = $tooltip.width();

			$tooltip.css('margin-top', -(height / 2));

			if (me.edge - $tooltip.offset().left < width) {
				$tooltip.addClass('ets-right-arrow');
			}
		},
		"dom:.ets-profile-edit-button/click": function ($e) {
			$e.preventDefault();
			$e.stopPropagation();
			var me = this;

			endingAnimation.call(me)
				.then(backToDescribScreen.bind(me));
		},
		'hub:memory/start/load/activity': function (activity) {
			this.activity_id = idParser.parseId(activity.id);
			this._activityLoaded.resolve();
		},
		'dom:.ets-msg-box-close-button/click': function ($e) {
			$e.preventDefault();
			$e.stopPropagation();
			var me = this;

			closeCompleteMsg.call(me);

			//show my profile
			showMySelf.call(me);
		}
	};


	return Widget.extend(ctor, methods);
});
