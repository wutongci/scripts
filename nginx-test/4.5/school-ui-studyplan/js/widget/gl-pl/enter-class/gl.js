define([
	"jquery.gudstrap",
	"troopjs-ef/component/widget",
	"client-tracking",
	"template!./enter-class.html"
], function($GUD, Widget, ct, tEnterClass){

	var UNIT_ID = "_unitId",
		MODE = "_mode",
		GL_CREDIT = "_gl_credit";

	var STARTED = "_started";
	var TOPICID = "_topicID";
	var START_TIME = "_class_start_time";
	var MEMBER_ID = "_member_id";
	var GL_HAS_RECORD = "_has_gl_record";
	var GL_RECORD_CHECKED = "_user_gl_record";
	var GL_ENTER_URL = "_gl_enter_url";
	var RECORD_HINT = "_record_hint";

	var STATUS_START_STARTED = "started";

	function getGLAction(unitId) {
		var me = this;

		var enterUrl = me[GL_ENTER_URL]
			.replace("{unitId}", unitId)
			.replace("{source}", window.encodeURIComponent(window.location.href));

		if (me[GL_HAS_RECORD]) {
			enterUrl += ';glRecordChecked=' + me[GL_RECORD_CHECKED];
		}

		return enterUrl;
	}

	function getRecordFlagKey() {
		return 'gl_record_checked_' + this[MEMBER_ID];
	}

	function getRecordFlag() {
		var flag;
		try {
			flag = localStorage.getItem(getRecordFlagKey.call(this));
		}
		catch (ex) {
			flag = null;
		}

		return flag;
	}

	function setRecordFlag(flag) {
		try {
			localStorage.setItem(getRecordFlagKey.call(this), flag);
		}
		catch (ex) {
			//noop
		}
	}

	return Widget.extend(function(element, path, unitId){
		var me = this;
		me[UNIT_ID] = unitId;
	}, {
		"sig/start": function () {
			var me = this;
			return me.query([
				"user!current",
				"evc_url_resource!current",
				"evcmember!current",
				"blurb!708473"
			]).spread(function (user, evcUrlResource, evcMember, blurbRecordHint) {
				me[MEMBER_ID] = user.member_id;
				me[GL_ENTER_URL] = evcUrlResource.studyPlanUrls.SPGL;
				me[GL_HAS_RECORD] = evcMember.enableGLRecord;   //feature
				me[GL_RECORD_CHECKED] = evcMember.defaultGLRecordOption; //user checked
				me[RECORD_HINT] = blurbRecordHint && blurbRecordHint.translation || '';

				me.render();
			});
		},
		"render" : function(type){
			var me = this;
			if (!me[STARTED] || !me[GL_CREDIT] || !me[START_TIME] || !me[MEMBER_ID]) {
				return;
			}

			var recordFlag = getRecordFlag.call(me);
			var recordFlagPrefix = me[START_TIME] + '_';

			var recordDisabled = (recordFlag !== null && recordFlag.substr(0, recordFlagPrefix.length) === recordFlagPrefix);

			return me.html(tEnterClass, {
				hasRecord: me[GL_HAS_RECORD],
				recordChecked: me[GL_RECORD_CHECKED],
				recordDisabled: recordDisabled,
				recordHint: me[RECORD_HINT]
			}).then(function () {
				var $iconHint = me.$element.find('.glyphicon-exclamation-sign');
				$iconHint.popover();
			});
		},
		"hub:memory/studyplan/evc/gl/credit" : function(credit){
			var me = this;
			me[GL_CREDIT] = credit;
			me.render();
		},
		"hub:memory/studyplan/evc/gl/start-time": function (startTime) {
			var me = this;
			me[START_TIME] = startTime;
			me.render();
		},
		"hub:memory/studyplan/evc/gl/start-status": function(status){
			var me = this;
			me[STARTED] = (status === STATUS_START_STARTED);
			me.render();
		},

		"hub:memory/studyplan/evc/gl/topicId": function(topicId){
			var me = this;
			me[TOPICID] = topicId;
		},

		"dom:.countdown-scoreboard-enter/click": function enterClass() {
			var me = this;
			ct.useraction({
				"action.joinGL": me[TOPICID]
			});

			setRecordFlag.call(me, me[START_TIME] + '_' + me[GL_RECORD_CHECKED]);

			window.open(getGLAction.call(me, me[UNIT_ID]), '_self');
		},

		"dom:.evc-studyplan-record-check/change":function(evt){
			this[GL_RECORD_CHECKED] = evt.currentTarget.checked;
		}
	});
});
