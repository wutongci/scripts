define(["poly/array"],
	function () {
		var CLS_ARABIC_FIX = "ets-ui-arabic-fix";

		function arabicFix(el, data) {
			// Add rtl direction in Arabic-English mixing layout
			Array.prototype.every.call(data, function (e, i) {
				if (e.charCodeAt(0) > 160) {
					el.addClass(CLS_ARABIC_FIX);
					return false;
				}
				return true;
			});
		}

		return function (el, data, cultureCode) {
			if (/^ar/.test(cultureCode)) {
				arabicFix(el, data);
			}
		}
	});
