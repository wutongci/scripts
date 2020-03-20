define('hyphenate-Hyphenator', ["shadow!hyphenator#exports=Hyphenator"], function (Hyphenator) {
	return Hyphenator;
});

define([
	"require",
	"poly",
	"when",
	"troopjs-ef/component/gadget",
	"../enum/hyphenator-languages"
	//Don't depend on Hyphenator here, require the lib only if actually needed
], function (require, poly, when, Gadget, HyphenatorLanguages) {

	var loadedLanguages = {};

	function loadLanguage(hyphenatorLanguage) {
		if (hyphenatorLanguage in loadedLanguages) {
			return loadedLanguages[hyphenatorLanguage];
		}
		var promise = when.promise(function (resolve) {
			require([
				"shadow!hyphenator/patterns/" + hyphenatorLanguage + "#Hyphenator=hyphenate-Hyphenator&exports=Hyphenator"
			], resolve);
		});
		loadedLanguages[hyphenatorLanguage] = promise;
		return promise;
	}

	var currentLanguageDefer = when.defer();

	var gadget = Gadget.create({
		"hub:memory/context": function (context) {
			currentLanguageDefer.resolver.resolve(context.cultureCode);
		},
		"hyphenate": function (text) {
			var languagePromise = currentLanguageDefer.promise;
			return languagePromise.then(function (language) {
				var hyphenatorLanguage = HyphenatorLanguages[language.toLowerCase()];
				if (hyphenatorLanguage) {
					return loadLanguage(hyphenatorLanguage).then(function (Hyphenator) {
						text = Hyphenator.hyphenate(text, hyphenatorLanguage) || text;
						return [text];
					});
				} else {
					return [text];
				}
			});
		}
	});

	gadget.start();

	return gadget;
});
