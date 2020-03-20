/*
 * Flow to add epaper:
 1. build a container with class named "ets-act-epaper"
 2. set epaper content
 */
define([
	'jquery',
	'jquery.mousewheel',
	'when',
	'troopjs-ef/component/widget',
	'school-ui-shared/utils/browser-check',
	'template!./epaper.html',
	'template!./epaper-fixed.html',
	'jquery.jscrollpane'
], function ($, $mouseWheel, when, Widget, browserCheck, tEpaper, tEpaperFixed) {
	"use strict";

	var IS_IE78 = browserCheck.browser === "msie" && parseInt(browserCheck.version, 10) <= 8;
	var $el = "$element",

		PROP_ANIMATING_TOGGLE = "_animatingToggle",

		SEL_EPAPER_CONTENT = ".ets-act-ep-content",
		SEL_EPAPER_BD = ".ets-act-ep-bd",

		CLS_EXPENDED = "ets-expanded",
		CLS_HIDDEN = "ets-hidden",

		AUTO_EXPAND_DELAY = 600,
		ANIMATE_DURATION = 400,
		REG_IMAGE_URL = /(?:(src\s*=\s*[\|'|"]*)(.*?\.(jpg|png)))/g,
		REG_LOOK_BEHIND = /src\s*[=|'|"]+|url\s*\(['|"]*/g,

		IMG_PAP = "imgPap",
		HTML_PAP = "htmlPap",
		$epBody,

		defaults = {
			expandWidth: 652,
			autoExpand: true
		},

		DEFAULT_CONTENT = "Failed loading content. Please try again later.",

		TOPIC_EPAPER_EXPAND = "activity/epaper/expanding",
		TOPIC_EPAPER_FOLD = "activity/epaper/folding";

	function toggleExpandContent() {
		var me = this;
		if (me[PROP_ANIMATING_TOGGLE]) return;

		var expWid = this._settings.expandWidth,
			operator = this.expanded ? '-=' : '+=',
			toggleOperate = this.expanded ? "removeClass" : "addClass";

		publishProxy.call(this, this.expanded);

		me[PROP_ANIMATING_TOGGLE] = true;
		when
			.promise(function (resolve, reject) {
				$epBody.animate({
					"width": operator + expWid
				}, ANIMATE_DURATION).promise().then(resolve, reject);
			})
			.then(function () {
				me[PROP_ANIMATING_TOGGLE] = false;
				$(this)[toggleOperate](CLS_EXPENDED);
				me.expanded = !me.expanded;

				if (!me.expanded) {
					me.publish('epaper/collapse');
				}
			});
	}

	function publishProxy(isExpand) {
		this.publish(isExpand ? TOPIC_EPAPER_FOLD : TOPIC_EPAPER_EXPAND);
	}

	function loadImg(src) {
		return when.promise(function (resolve) {
			var cachedImg = new Image();
			cachedImg.onload = function () {
				resolve({
					width: cachedImg.width,
					height: cachedImg.height
				});
			};
			cachedImg.onerror = function () {
				resolve({
					width: null,
					height: null
				});
			};
			cachedImg.src = src;
		});
	}

	function wrapImg(src) {
		return '<img src="' + src + ' " alt="" />';
	}

	function render(content) {
		var me = this,
			$ele = me[$el],
			template = me._refereces._epaperType === "fixed" ? tEpaperFixed : tEpaper;

		content = content || DEFAULT_CONTENT;

		this.expanded = false;

		// Cause JavaScript not consist 'look behind', like (?<:XX)SS
		//  To reach the same goal, here used two regexp
		var imgsUrlArr = (content.match(REG_IMAGE_URL) || []).map(function (src) {
			return src.replace(REG_LOOK_BEHIND, "");
		});

		return this.html(template, content)
			.then(function () {
				$epBody = $ele.find(SEL_EPAPER_BD);
				var imgPromises = imgsUrlArr.map(function (src) {
					src = src.replace(/'/g, '%27').replace(/"/g, '%34');

					// Fix <=IE8 cached image can't fire onload event properly
					if (IS_IE78) {
						src = src + "?_" + (new Date).getTime();
					}

					return loadImg(src)
						.then(function (size) {
							$ele.find('img[src="' + src + '"]').attr({
								height: size.height || "auto",
								width: size.width || "auto"
							});
						});
				});

				if (me._settings.autoExpand && template === tEpaper) {
					me._timeout = setTimeout(function () {
						toggleExpandContent.call(me);
					}, AUTO_EXPAND_DELAY);
				}

				return when.all(imgPromises);
			})
			.then(function () {
				$ele.find(SEL_EPAPER_CONTENT)
					.jScrollPane()
					.find("img")
					.removeAttr("height width")
					.end()
					.removeClass(CLS_HIDDEN);
			});
	}

	function checkAndReadyEpaper() {
		var me = this,
			ref = me._refereces;

		var content = (ref[HTML_PAP] && ref[HTML_PAP].content)
			? ref[HTML_PAP].content
			: ref[IMG_PAP] && ref[IMG_PAP].url && wrapImg(ref[IMG_PAP].url);

		//Resolve epaper render defer object
		me.renderDfd.resolve(content);
	}

	return Widget.extend(function (el, module, refereces, settings) {
		if (!refereces) {
			throw "You must supply epaper content!";
		}
		var me = this;

		me._refereces = refereces;
		me._settings = $.extend(true, defaults, settings);

		me[PROP_ANIMATING_TOGGLE] = false;

		this.renderDfd = when.defer();
		this.renderDfd.promise.then(function (content) {
			render.call(me, content);
		});
	}, {
		"hub:memory/course-property/load/courseTypeCode": function updateCourseCodeType() {
			checkAndReadyEpaper.call(this);
		},
		"sig/start": function epaperStart() {
			var me = this;
			checkAndReadyEpaper.call(me);
		},
		"sig/stop": function epaperStop() {
			clearTimeout(this._timeout);
			//Stop the currently-running animation on the matched elements.
			/*
			 *	.stop( [clearQueue ] [, jumpToEnd ] )
			 */
			$epBody && $epBody.stop(true, true);
		},
		"dom:.ets-act-ep-handler/touchstart": function handlerClick($event) {
			$event.preventDefault();
			toggleExpandContent.call(this, true);
		},
		"dom:.ets-act-ep-handler/click": function handlerClick($event) {
			$event.preventDefault();
			toggleExpandContent.call(this, true);
		}
	});
});
