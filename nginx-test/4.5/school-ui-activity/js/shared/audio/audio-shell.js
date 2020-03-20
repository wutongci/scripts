define([
	'jquery',
	'troopjs-ef/component/widget',
	'template!./audio-shell.html'
], function ActivityBaseModule($, Widget, tAudioShell) {
	"use strict";

	var SEL_AP_SHELL = ".ets-ap-shell",
		SEL_AP = ".ets-ap",
		CLS_DISABLED = "ets-disabled",
		CLS_PAUSE = "ets-pause",
		HANDLER_PLAY = "_playHandler",
		HANDLER_PAUSE = "_pauseHandler";

	var ENUM_STATES = {
		NORMAL: "NORMAL",
		PLAYING: "PLAYING"
	};

	function updateCls(needPauseCls) {
		if (!this.$apShell) {
			this.$apShell = this.$element.find(SEL_AP_SHELL);
		}
		if (!needPauseCls) {
			this.$apShell.removeClass(CLS_PAUSE);
		} else {
			this.$apShell.addClass(CLS_PAUSE);
		}
	}

	return Widget.extend(function (el, module, setting) {
		if (setting) {
			this[HANDLER_PLAY] = setting[HANDLER_PLAY];
			this[HANDLER_PAUSE] = setting[HANDLER_PAUSE];
			this._guid = setting.guid;
		} else {
			this[HANDLER_PLAY] = this[HANDLER_PAUSE] = $.noop;
		}
	}, {
		"sig/initialize": function onStart() {
			var me = this;
			return me.html(tAudioShell);
		},
		state: function (s) {
			if (s && this._state != s) {
				this._state = s;
			}
			return this._state || ENUM_STATES.NORMAL;
		},
		'dom:button/click': function ($e) {
			var $target = $($e.currentTarget);
			// If audio is disabled, then don't play audio just return
			if ($target.closest(SEL_AP).hasClass(CLS_DISABLED)) {
				return;
			}
			switch (this.state()) {
				case ENUM_STATES.NORMAL:
					this[HANDLER_PLAY]();
					this.state(ENUM_STATES.PLAYING);
					updateCls.call(this, true);
					break;
				case ENUM_STATES.PLAYING:
					this[HANDLER_PAUSE]();
					this.state(ENUM_STATES.NORMAL);
					updateCls.call(this);
					break;
			}
		},
		"hub/audio/shell/play/complete": function (/*guid*/) {
			var me = this;
			// if(guid !== this._guid) return;
			me.state(ENUM_STATES.NORMAL);

			// Becasue sometimes the callback will get immediately, so this can be let javascript delay run in queue
			setTimeout(function () {
				updateCls.call(me);
			}, 0);
		},
		'hub/asr/start/record': function () {
			var me = this;
			me.$element.find(SEL_AP).addClass(CLS_DISABLED);
		},
		'hub/asr/recording/stopped': function () {
			var me = this;
			me.$element.find(SEL_AP).removeClass(CLS_DISABLED);
		}
	});
});
