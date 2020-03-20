define([
	'json2',
	"troopjs-ef/component/widget",
	"template!./automation-test.html"
], function (JSON, Widget, tAt) {

	return Widget.extend(function ($element, name, assets) {
		var assetsString = "{}";
		switch (typeof assets) {
			case "string":
				assetsString = assets;
				break;
			case "object":
				assetsString = JSON.stringify(assets);
				break;
		}
		this.html(tAt);
		$element.find("[data-at-id=assets]").val(assetsString);
	});

});
