define(["jquery", "poly/array"],
	function ($) {
		var CLS_ARABIC_FIX = "ets-ui-arabic-fix";

		// This arabic fixing is different with 2.x
		// because only activity use 1.x
		// and this html fragment was provided by database dynamically
		// not a static html element
		function arabicFix(data) {
			data.content.presentations.forEach(function (v) {
				var $html = $("<div>" + v.text + "</div>");
				$html.find("p,td,strong").each(function () {
					var $this = $(this);
					var fixText = $this.text();
					Array.prototype.every.call(fixText, function (e, i) {
						if (e.charCodeAt(0) > 160) {
							$this.addClass(CLS_ARABIC_FIX);
							return false;
						}
						return true;
					});
				});
				v.text = $html.html();
			});

			return data;
		}

		return function (data, cultureCode) {
			if (/^ar/.test(cultureCode)) {
				data = arabicFix(data);
			}
			return data;
		}
	});
