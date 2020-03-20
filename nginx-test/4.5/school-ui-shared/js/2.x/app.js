require({
	"paths" : {
		// school apps submodules
		"school-ui-shared":".",
		"school-ui-activity-container": "../../../school-ui-activity-container/src/js",
		"school-ui-study": "../../../school-ui-study/src/js",
		"school-ui-activity": "../../../school-ui-activity/src/js"
	},
	"shim" : {
		"jquery.fancybox" : {
			deps :[ "jquery", "jquery.easing", "jquery.mousewheel" ],
			exports : function ($, easing, mousewheel) {
				return $;
			}
		},
		"jquery.easing" : {
			deps :[ "jquery" ],
			exports : function ($) {
				return $;
			}
		},
		"jquery.mousewheel" : {
			deps :[ "jquery" ],
			exports : function ($) {
				return $;
			}
		},
		"jquery.mediaelement" : {
			deps :[ "jquery", "jquery.mediaelement.player" ],
			exports : function ($) {
				return $;
			}
		},
		"jquery.ui": [ "jquery" ],
		"jquery.transit" : ["jquery"],
		"jquery.flip" : {
			deps :[ "jquery" ],
			exports : function ($) {
				return $;
			}
		},
		"swfobject": {
			exports: function () {
				return window.swfobject;
			}
		}
	},
	"map" : {
		"*" : {
			"template" : "troopjs-requirejs/template"
		}
	},
	"pragmas": {
		"release": true
	}
}, [ "require", "jquery", "troopjs-bundle", "troopjs-ef" ], function Deps(parentRequire, jQuery) {
	parentRequire([
		"school-ui-study/widget/application",
		"school-ui-study/widget/shared/init-loader/main",
		"troopjs-jquery/weave",
		"troopjs-jquery/destroy",
		"troopjs-jquery/action",
		"troopjs-jquery/resize",
		"troopjs-jquery/dimensions",
		"troopjs-jquery/hashchange"
	], function App(Application, initLoader) {

		jQuery(function ready($) {
			Application($(this.documentElement), "app/school").start();

			// instantiate a loader that hides the spinning icon on body
			new initLoader($(this.documentElement)).start();
		});
	});
});
