define([
	"poly",
	"when",
	"jquery",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"../utils/hyphenate"
], function (poly, when, $, Widget, loom, HyphenateGadget) {

	var $ELEMENT = "$element";
	var PROP_WIDGET_NAME = "_widgetName";
	var requestAnimationFrame = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 16);
		};

	return Widget.extend(function ($element, name, widgetName) {
		this[PROP_WIDGET_NAME] = widgetName;
	}, {
		"sig/start": function onStart() {
			var me = this;
			var $element = me[$ELEMENT];

			var promise;
			if (me[PROP_WIDGET_NAME]) {
				var $newWidget = $element.clone();
				$newWidget.attr(loom.weave, me[PROP_WIDGET_NAME]);
				$newWidget.removeAttr(loom.unweave);
				$newWidget.removeAttr(loom.woven);
				promise = me.html($newWidget);
			} else {
				promise = when.resolve();
			}

			return promise.then(function () {
				//wait next animation frame, content is likely to have been rendered so we can measure width
				// without blocking
				return when.promise(function (resolve) {
					requestAnimationFrame(resolve);
				});
			}).then(function () {
				if ($element.width() > $element.parent().width()) {
					//overflow, need to hyphenate texts

					//In case it contains DOM elements, hyphenate each text node one by one
					var hyphenatePromises = $element.find('*').andSelf().contents()
						.filter(function(){
							return this.nodeType === 3; //text node
						})
						.map(function(){
							//can't use this.textContent in IE8, use .text() and createTextNode() instead
							var $textNode = $(this);
							var text = $textNode.text() || '';
							return HyphenateGadget.hyphenate(text).spread(function (hyphenatedText) {
								$textNode.replaceWith(document.createTextNode(hyphenatedText));
							})
						})
						.get();

					return when.all(hyphenatePromises);
				}
			});
		}
	});
});
