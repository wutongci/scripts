define([
	'jquery',
	'when',
	'../base/main',
	'template!./main.html'
], function ($, when, Widget, tTemplate) {
	"use strict";

	var $ELEMENT = '$element';

	var WID_CHOOSE_PIC = 'school-ui-activity/activity/sharing-pic-desc/choose-picture/main';
	var WID_DESCRIBE = "school-ui-activity/activity/sharing-pic-desc/describe/main";

	var SEL_PIC_SCREEN = '.ets-choose-picture-screen';
	var SEL_DESC_SCREEN = '.ets-share-and-describe-screen';
	var SEL_PIC_WALL = '.ets-picture-wall-screen';

	var CLS_NONE = 'ets-none';

	var HUB_DESCRIBE = "activity/sharing-pic-desc/describe/reload";
	var HUB_PICTURE_WALL = "activity/sharing-pic-desc/picture-wall/reload";
	var HUB_ENABLE_NEXT = "activity/sharing-pic-desc/enable/next";

	// Switch screen
	function switchScreen(sel, hub, data) {
		var me = this;
		me[$ELEMENT].find(sel).removeClass(CLS_NONE).siblings().addClass(CLS_NONE);

		if (hub) {
			me.publish(hub, data);
		}
	}

	function render() {
		var me = this;

		return me.html(tTemplate, me._json)
			.tap(onRendered.bind(me));
	}

	function onRendered() {
		var me = this;

		when.resolve()
			.then(function () {
				return me[$ELEMENT].find(SEL_PIC_SCREEN)
					.data('json', me._json)
					.attr('data-weave', WID_CHOOSE_PIC + "(json)")
					.weave()
			})
			.then(function () {
				return me[$ELEMENT].find(SEL_DESC_SCREEN)
					.data('json', me._json)
					.attr('data-weave', WID_DESCRIBE + '(json)')
					.weave();
			})
			.then(function () {
				// If this activity has bee passed,
				// then use the picture wall directly
				if (me.hasPassed) {
					switchScreen.call(me, SEL_PIC_WALL, HUB_PICTURE_WALL);
					me.publish(HUB_ENABLE_NEXT);
				} else {
					switchScreen.call(me, SEL_PIC_SCREEN);
				}
			});
	}

	// Methods
	var methods = {
		'sig/render': function () {
			return render.call(this);
		},
		'hub/activity/sharing-pic-desc/show/describe-srceen': function (data) {
			var me = this;
			switchScreen.call(me, SEL_DESC_SCREEN, HUB_DESCRIBE, data);
		},
		'hub/activity/sharing-pic-desc/show/choose-picture-screen': function () {
			var me = this;
			switchScreen.call(me, SEL_PIC_SCREEN)
		},
		'hub/activity/sharing-pic-desc/show/picture-wall-screen': function (data) {
			var me = this;
			switchScreen.call(me, SEL_PIC_WALL, HUB_PICTURE_WALL, data);
		},
		'hub/activity/sharing-pic-desc/enable/next': function () {
			// Enable NEXT button
			this.items().completed(true);
		}
	};

	return Widget.extend(methods);
});
