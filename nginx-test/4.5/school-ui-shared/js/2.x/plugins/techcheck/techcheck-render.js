define([
	"jquery",
	"when",
	"poly/array"
], function ($, when, polyArray) {

	var CLS_WIDGET = "ets-ui-techcheck-container",
		CLS_OVERLAY = "ets-ui-techcheck-overlay";
	var SEL_BODY = "body",
		SEL_WIDGET = "." + CLS_WIDGET,
		SEL_OVERLAY = "." + CLS_OVERLAY;

	function renderPrependTo($container, widgetName) {
		if ($container.children(SEL_WIDGET).size() === 0) {
			return $("<div></div>")
				.addClass(CLS_WIDGET)
				.attr("data-weave", widgetName)
				.prependTo($container)
				.weave();
		}
		else {
			return when.resolve();
		}
	}

	function removeOverlay() {
		$(SEL_BODY).children(SEL_OVERLAY).remove();
	}

	function renderOverlay(widgetName) {
		removeOverlay();

		return $("<div></div>")
			.addClass(CLS_OVERLAY)
			.attr("data-weave", widgetName)
			.appendTo($(SEL_BODY))
			.weave();
	}

	return {
		"renderFlashInstallBanner": function ($container, results) {
			results.some(function (result) {
				if (result.id === "flash-install" && result.passed === false) {
					renderPrependTo($container, result.widgets["banner"]);
					return true;
				}
			});
		},
		"renderFlashInstallOverlay": function (results) {
			results.some(function (result) {
				if (result.id === "flash-install" && result.passed === false) {
					renderOverlay(result.widgets["overlay"]);
					return true;
				}
			});
		},
		"removeOverlay": removeOverlay
	};
});
