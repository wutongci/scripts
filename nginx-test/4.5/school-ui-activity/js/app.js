require({
    "paths": {
        "troopjs-bundle": "/_shared/troopjs-bundle/1.0.4-39/troopjs-bundle.min",
        "troopjs-ef" : "/_shared/troopjs-ef/1.0.0-52/troopjs-ef.min", 

        "jquery": "/_shared/jquery/1.7.2/jquery.min",
        "jquery.fancybox": "/_shared/fancybox/1.3.4/jquery.fancybox.min",
        "jquery.easing": "/_shared/jquery-easing/1.3/jquery.easing.min",
        "jquery.mousewheel": "/_shared/jquery-mousewheel/3.0.6/jquery.mousewheel.min",
        "jquery.mediaelement": "/_shared/mecleaner/1.0.0-6/mecleaner.min",
        "jquery.mediaelement.player": "/_shared/mediaelement/2.8.2-ef.1/mediaelement-and-player.min",
        "jquery.ui": "/_shared/jquery-ui/1.8.22/jquery-ui.min",
        "jquery.transit": "/_shared/jquery-transit/0.1.3/jquery.transit.min",
        "jquery.jscrollpane": "/_shared/jquery-jscrollpane/2.0.0b12/jquery.jscrollpane.min",
        "jquery.scrollto": "/_shared/jquery-scrollto/1.4.2/jquery.scrollto.min",
        "jquery.viewport": "/_shared/jquery-viewport/1.0/jquery.viewport",
        "jquery.flip": "/_shared/jquery-flip/0.9.9/jquery.flip",
        "jquery.form": "/_shared/jquery-form/3.20/jquery.form.min",
        "swfobject": "/_shared/swfobject/2.2/swfobject",
        "base64": "/_shared/ScriptSharp/0.5.6/base64-amd.min",
        "underscore": "/_shared/underscore.js/1.3.3/underscore.min",
        "gollum": "/_shared/gollum/1.0.0-2/gollum.min",
        "string.split": "/_shared/string-split/string-split.min",
        "json2": "/_shared/json2/20111019/json2.min",
	    "school-ui-activity":".",
	    "school-ui-study": "../../../school-ui-study/src/js",
	    "school-ui-shared": "../../../school-ui-shared/src/js",
	    "school-ui-activity-container": "../../../school-ui-activity-container/src/js"
    },
    "shim": {
        "json2" : {
            exports : function () {
                return window.JSON;
            }
        },

        "jquery.ui": {
            deps: ["jquery"],
            exports: function($) {
                return $;
            }
        },

        "jquery.fancybox": {
            deps: ["jquery", "jquery.easing", "jquery.mousewheel"],
            exports: function($, easing, mousewheel) {
                return $;
            }
        },
        
        "jquery.easing": {
            deps: ["jquery"],
            exports: function($) {
                return $;
            }
        },
        "jquery.mousewheel": {
            deps: ["jquery"],
            exports: function($) {
                return $;
            }
        },
        "jquery.scrollto": {
            deps: ["jquery"],
            exports: function($) {
                return $;
            }
        },
        "jquery.viewport": {
            deps: ["jquery"],
            exports: function($) {
                return $;
            }
        },
        "jquery.mediaelement" : {
            deps :[ "jquery.mediaelement.player" ],
            exports : function ($) {
                return $;
            }
        },
        "jquery.mediaelement.player" : {
            deps :[ "jquery" ],
            exports : function ($) {
                return $;
            }
        },

        "jquery.transit": ["jquery"],
        "jquery.flip": {
            deps: ["jquery"],
            exports: function($) {
                return $;
            }
        },
        "jquery.form": {
            deps: ['jquery'],
            exports: function ($) {
                return $;
            }
        },
        "underscore": {
            exports: function(){
                return _;
            }
        },
    },
    "map": {
        "*": {
            "template": "troopjs-requirejs/template"
        }
    },
    "pragmas": {
        "asrExclude": true,
        "release": true
    }
}, ["require", "jquery", "jquery.ui", "troopjs-bundle", "troopjs-ef"], function Deps(parentRequire, jQuery) {
    parentRequire(["application",
    // "widget/shared/init-loader/main",
    "troopjs-jquery/weave", "troopjs-jquery/destroy", "troopjs-jquery/action", "troopjs-jquery/resize", "troopjs-jquery/dimensions", "troopjs-jquery/hashchange"], function App(Application) {

        jQuery(function ready($) {
            Application($(this.documentElement), "app/school").start();


            // instantiate a loader that hides the spinning icon on body
            // new initLoader($(this.documentElement)).start();
        });
    });
});
