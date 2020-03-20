/*! campus-studyplan-ui - v2018.17.1-1 - 2018-05-09 03:58:04
* Copyright (c) 2018 DLA_HAO Team; Licensed  */
define('campus-studyplan-ui/service/load',[
	'troopjs-ef/component/service'
], function(
	Service
){
	'use strict';

	return Service.extend({
		'displayName' : 'campus-studyplan-ui/service/load',

		'hub/school/interface/studyplan/cp20-container-widget': function(){
			var me = this;
			return me.query('ocb_context!curent', 'member_site_setting!"school;student.evc.version"').spread(function(result, evcVersion){
				if(result && result.enable){
					var isLegacy = !evcVersion || !evcVersion.value || parseFloat(evcVersion.value) < 2;
					if (isLegacy) {
						return ['campus-studyplan-ui/widget/pl-legacy/cp20'];
					} else {
						return ['campus-studyplan-ui/widget/pl/cp20'];
					}
				}
			});
		},

		'hub/school/interface/studyplan/cp20-locked-widget': function(){
			var me = this;
			return me.query('ocb_context!curent').spread(function(result){
				if(result && result.enable){
					return ['campus-studyplan-ui/widget/pl-locked/main'];
				}
			});
		},

		'hub/school/interface/studyplan/pl-container-widget': function(){
			var me = this;
			return me.query('ocb_context!curent', 'member_site_setting!"school;student.evc.version"').spread(function(result,evcVersion){
				if(result && result.enable){
					var isLegacy = !evcVersion || !evcVersion.value || parseFloat(evcVersion.value) < 2;
					if (isLegacy) {
						return ['campus-studyplan-ui/widget/pl-legacy/pl'];
					} else {
						return ['campus-studyplan-ui/widget/pl/pl'];
					}
				}
			});
		},
	});
});

/**
 * @license RequireJS text 2.0.9 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define('requirejs-text/text',['module'], function (module) {
    'use strict';

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.9',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.indexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1, name.length);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file.indexOf('\uFEFF') === 0) {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                errback(e);
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        errback(err);
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes,
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});

/**
* TroopJS requirejs/shadow
* @license MIT http://troopjs.mit-license.org/ © Tristan Guo mailto:tristanguo@outlook.com
*/
define('troopjs-requirejs/shadow',[ "text" ], function (text) {
	"use strict";

	var UNDEFINED;
	var EXPORTS = "exports";
	var EXTENSION = ".js";
	var PATTERN = /(.+?)#(.+)$/;
	var RE_EMPTY = /^empty:/;
	var REQUIRE_VERSION = require.version;
	var buildMap = {};

	function amdify (scriptText, hashVal) {
		var pattern = /([^=&]+)=([^&]+)/g;
		var m;
		var deps = [];
		var args = [];

		while (hashVal && (m = pattern.exec(hashVal))) {
			if (m[1] === EXPORTS) {
				scriptText += ";\nreturn " + m[2] + ";\n";
			}
			else {
				deps.push("'" + m[2] + "'");
				args.push(m[1]);
			}
		}

		return "define([ " + deps.join(", ") + " ], function (" + args.join(", ") + ") {\n"
			+ scriptText
			+ "});"
	}

	function cmpVersion(a, b) {
	    var result;
	    var len;
	    var i;

	    a = a.split(".");
	    b = b.split(".");
	    len = Math.min(a.length, b.length);

	    for (i = 0; i < len; i++) {
	        result = parseInt(a[i]) - parseInt(b[i]);
	        if (result !== 0) {
	            return result;
	        }
	    }
	    return a.length - b.length;
	}

	return {
		load : function (name, req, onLoad, config) {
			var m;
			var hashVal;
			var content;
			var url;

			// The name is like 'jquery.form#$=jquery&exports=$',
			// So, if macthed, m[1] is 'jquery.form', m[2] is '$=jquery&exports=$'
			if (m = PATTERN.exec(name)) {
				name = m[1];
				hashVal = m[2];
			}
			url = req.toUrl(name + EXTENSION);

			// For Optimization. The url is "empty:" if excluded.
			if (RE_EMPTY.test(url)) {
				onLoad(UNDEFINED);
			}
			else {
				text.get(url, function(data) {
					content = amdify(data, hashVal);
					if (config.isBuild) {
						buildMap[name] = content;
					}

					onLoad.fromText(name, content);  
					// On requirejs version below '2.1.0', 
					// need to manually require the module after the call to onLoad.fromText()
					if (cmpVersion(REQUIRE_VERSION, "2.1.0") < 0) {
						req([ name ], onLoad);
					}	
				});
			}
		},

		write : function (pluginName, moduleName, write) { 
			var m;
			var content;

			if (m = PATTERN.exec(moduleName)) {
				moduleName = m[1];
			}

			if (moduleName in buildMap) {
				content = text.jsEscape(buildMap[moduleName]);
				write.asModule(pluginName + "!" + moduleName, content);
			}
		}
	};
});


define('campus-studyplan-ui/utils/fancybox',[
	'lodash',
	'shadow!jquery.fancybox#$=jquery&jQuery=jquery&exports=jQuery'
], function(
	_,
	$
){
	'use strict';

	var defaultOptions = {
		wrapCSS: 'csu-fancybox',
		helpers: {
			overlay: {
				closeClick : false,
				css: {
					// background image: img/fancybox_overlay.png
					backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAI0lEQVQYGe3KMREAAAjDQMC/TmyEq4NOTM2Q6RvYMhrtDwYeQfQD9/w1y0kAAAAASUVORK5CYII=)'
				}
			}
		}
	};

	return {
		'open': function(options){
			$.fancybox.open(_.assign(defaultOptions, options));
		},

		'close': function(){
			$.fancybox.close();
		}
	};
});
// map ef language code to momentjs language code
define('campus-studyplan-ui/utils/language-code',{
	'ar':'ar',
	'ch':'zh-tw',
	'cs':'zh-cn',
	'en':'en',
	'es':'es',
	'fr':'fr',
	'ge':'de',
	'hk':'zh-tw',
	'in':'id',
	'it':'it',
	'ja':'ja',
	'ko':'ko',
	'pt':'pt',
	'ru':'ru',
	'sp':'es',
	'th':'th',
	'tr':'tr'
});
define('campus-studyplan-ui/utils/member-site-setting',[
	'troopjs-ef/component/widget',
	'lodash'
], function(
	Widget,
	_
){
	'use strict';

	var SETTINGS = {
		FirstTimeStudyPlanPL: {
			siteArea: 'evc',
			keyCode: 'FirstTimeStudyPlanPL'
		},		
		FirstTimeStudyPlanCP20: {
			siteArea: 'evc',
			keyCode: 'FirstTimeStudyPlanCP20'
		},
		UnlockedPLs : {
			siteArea: 'OCB',
			keyCode: 'UnlockedPLs'
		}
	};

	return Widget.extend(function($element, displayName, options){
	},{
		'getMemberSiteSetting': function(key){
			var me = this;
			var strQuery = 'member_site_setting!' + SETTINGS[key].siteArea + ';' + SETTINGS[key].keyCode;
			return me.query(strQuery).spread(function(data){
				return data;
			});
		},

		'saveMemberSiteSetting': function(key, value){
			var me = this;
			return me.publish('school/member_site_setting/Save', {
				'siteArea': SETTINGS[key].siteArea,
				'keyCode': SETTINGS[key].keyCode,
				'keyValue': value
			});
		}
	});
});
define('campus-studyplan-ui/utils/time-format',{
	START_TIME: 'dddd DD MMMM, HH:mm',
	CANCEL_TIME: 'HH:mm, dddd MMMM Do'
});
define('campus-studyplan-ui/utils/momentize',[
	'moment',
	'./language-code',
	'./time-format',
], function(
	moment,
	LANGUAGE_CODE,
	TIME_FORMAT
){
	'use strict';

	return function momentize(time, languageCode, format){
		var result;
		if(typeof time === 'object'){
			result = moment()
					.year(time.year)
					.month(time.month - 1)
					.date(time.day)
					.hour(time.hour)
					.minute(time.minute)
					.second(time.second);
		} else {
			result = moment(time);
		}

		if(languageCode){
			result.lang(LANGUAGE_CODE[languageCode]);
		}

		if(format){
			return result.format(TIME_FORMAT[format] || format);
		}

		return result;
	};
});
define('campus-studyplan-ui/utils/vml',[],function() {
	return document.namespaces &&
		!document.namespaces.vml &&
		document.namespaces.add('vml','urn:schemas-microsoft-com:vml');
});
define('campus-studyplan-ui/utils/widgetCreator',[
	'jquery',
	'lodash'
], function(
	$,
	_
){
	'use strict';

	function bindData($element, value, key){
		var paramName;
		if(_.isEmpty(value)) {
			return key;
		} else {
			paramName = 'data' + _.size($element.data());
			$element.data(paramName, value);
			return key + '(' + paramName + ')';
		}
	}

	return function(options){
		var $element = $('<div>');
		var widgets = _.mapKeys(options, _.partial(bindData, $element));
		return $element.attr('data-weave', _.keys(widgets).join(' '));
	};
});
define('campus-studyplan-ui/widget/blurb',[ "troopjs-ef/blurb/widget" ], function (Widget) {
  "use strict";

  return Widget.extend({
      text: Widget.prototype.html
  });
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/attended/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-attended\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"csu-pl-lead csu-pl-lead-with-time text-center\">\n\t\t\t<div>\n\t\t\t\t<span class=\"glyphicon glyphicon-passed\"></span>\n\t\t\t</div><!--\n\t\t\t--><div>\n\t\t\t\t<div class=\"h4\" data-blurb-id=\"676306\" data-weave=\"troopjs-ef/blurb/widget\"></div>\n\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"csu-pl-class-panel tabulation\">\n\t\t\t<div class=\"row\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"csu-pl-class-media media\">\n\t\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t\t<div class=\"csu-pl-profile\" data-weave=\"campus-studyplan-ui/widget/shared/pl-profile/main(options)\" data-options='" + JSON.stringify(data.bookedClass) + "'></div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"csu-pl-status-info\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<p class=\"csu-pl-status-info-title h4 csu-pl-status-info-title-highlight\" data-blurb-id=\"675996\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t\t<div>\n\t\t\t\t\t\t\t<a class=\"btn btn-primary btn-feedback-details\" data-blurb-id=\"675997\" data-weave=\"troopjs-ef/blurb/widget\"></a>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div><span>&nbsp;</span><!-- for vertical alignment -->\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/attended/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../../../utils/momentize',
	'lodash',
	'client-tracking'
], function(
	Widget,
	template,
	momentize,
	_,
	ct
){
	'use strict';

	var URL_FEEDBACK = {
		'cp20': '/school/progressreport#teacher-feedback?fb_id=CP20_',
		'pl': '/school/progressreport#teacher-feedback?fb_id=PL_'
	};

	function getFeedbackUrl(type, id){
		return URL_FEEDBACK[type] + id;
	}

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
		},

		'hub:memory/common_context': function(context) {
			var me = this;
			var languageCode;
			var startTime = '';

			if(context && context.values && me.options.bookedClass){
				languageCode = context.values.languagecode.value.toLowerCase();
				startTime = momentize(me.options.bookedClass.customizedStartTime, languageCode, 'START_TIME');
			}

			me.html(template(_.assign({
				startTime: startTime
			}, me.options)));
		},

		'dom:.btn-feedback-details/click': function(){
			var me = this;

			ct.useraction({
				'action.viewFeedBack': 1
			});

			window.open(getFeedbackUrl(me.options.topic.classType, me.options.feedback.feedbackId));
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/main.html',[],function() { return function template(data) { var o = "<div class=\"campus-studyplan-ui\">\n\t<div class=\"csu-notification\" data-weave=\"school-ui-studyplan/widget/gl-pl/announcement/" + data.topic.classType + "\"></div>\n\t<div data-weave=\"campus-studyplan-ui/widget/pl-legacy/" + data.statusCode + "/main(options) campus-studyplan-ui/widget/tracking\" data-options='" + JSON.stringify(data).replace(/\'/g, "&#39;") + "'></div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/base',[
	'troopjs-ef/component/widget',
	'template!./main.html',
    'school-ui-studyplan/module',
	'jquery',
	'lodash',
	'when',
	'../../utils/member-site-setting',
	'client-tracking',
	'../../utils/vml'
], function(
	Widget,
	template,
	module,
	$,
	_,
	when,
	MemberSiteSetting,
	ct
){
	'use strict';

	var SETTINGS_KEYS = {
		UNLOCKED: 'UnlockedPLs'
	};

	var URL_KEYS = {
		pl: {
			BOOKING: 'SPPL40BookingV2',
			ENTERING: 'SPPL40Entering'
		},
		cp20: {
			BOOKING: 'CP20BookingV2',
			ENTERING: 'CP20Entering'
		}
	};

	var CLASS_STATUS = {
		WELCOME: 'welcome',
		UNLOCKED: 'unlocked',
		NEVER_TAKE: 'nevertake',
		NO_COUPON_LEFT: 'nocouponleft'
	};

	function createEvcUrl(url, unitId, classId){
		url = (url || '').replace(/{unitId}/i, unitId);
		if (classId) {
			url = url.replace(/{classId}/i, classId);
		}
		return url;
	}

	function getEvcUrls(urls, type, unitId, classId){
		var KEYS = URL_KEYS[type];
		if(urls) {
			return {
				booking: createEvcUrl(urls[KEYS.BOOKING], unitId),
				entering: createEvcUrl(urls[KEYS.ENTERING], unitId, classId)
			};
		}
	}

	function isUnlocked(unlockedUnit, currentUnit){
		var arrUnlocked = unlockedUnit && unlockedUnit.split(',');
		return _.contains(arrUnlocked, currentUnit + '');
	}

	function getTopicImageUrl(url){
		var cacheServer = module.config().cacheServer;
		if(!url){
			return cacheServer + '/_imgs/evc/pl/pl_default_100x100.png';
		}
		return cacheServer + '/_imgs/evc/pl/topic/238x238/' + url;
	}

	return Widget.extend(function($element, displayName, options){
			var me = this;
			me.deferredFeature = when.defer();
	},{
		'sig/start': function(){
			ct.pagename('One-Click PL');
		},

		'hub:memory/load/unit': function(unit) {
			var me = this;
			var data;
			var isCP20 = me.options.classType === 'cp20';

			if(unit && unit.legacyUnitId){
				me.query(me.options.serviceAPI + unit.legacyUnitId,
					'evc_url_resource!current',
					me.deferredFeature.promise,
					isCP20 ? me.getMemberSiteSetting(SETTINGS_KEYS.UNLOCKED) : undefined,
					'campus_mypage_isf2fstudent!current'
				).spread(function(plclass, urls, feature, unlocked, f2f) {
					var bookedClassId = plclass &&
						plclass.bookedClass &&
						plclass.bookedClass.classId;

					if(!plclass || !plclass.topic) {
						return;
					}

					data = _.clone(plclass, true);

					data.statusCode = data.statusCode.toLowerCase();
					data.feature = feature;
					data.evcUrls = getEvcUrls(urls && urls.studyPlanUrls, me.options.classType, unit.legacyUnitId, bookedClassId);
					data.topic = {
						courseUnitId: unit.legacyUnitId,
						title: plclass.topic.topicBlurbId || plclass.topic.topicBlurb,
						description: plclass.topic.descBlurbId || plclass.topic.descriptionBlurb,
						image: getTopicImageUrl(plclass.topic.imageUrl || plclass.topic.topicImageUrl),
						classType: me.options.classType
					};
					if(data.pastClass){
						data.bookedClass = data.pastClass;
					}
					_.assign(data.bookedClass, {
						durationForStudent: me.options.durationMinutes
					});

					// reset class status
					if(data.statusCode === CLASS_STATUS.NEVER_TAKE) {
						if(data.feature && data.feature.couponLeft < 1){
							data.statusCode = CLASS_STATUS.NO_COUPON_LEFT;
						}
						if(unlocked && !isUnlocked(unlocked.value, data.topic.courseUnitId)&&!f2f.isF2fStudent){
							data.statusCode = CLASS_STATUS.UNLOCKED;
						}
                    } else if (data.statusCode === CLASS_STATUS.WELCOME) {
						data.statusCode = CLASS_STATUS.NEVER_TAKE;
                    }

					me.html(template(data));
				});
			}
		}
	}, MemberSiteSetting);
});


define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/booked/class-entrance/main.html',[],function() { return function template(data) { var o = "";
	function getStatus(){
		if(data.disabled){
			return "btn-disabled";
		} else {
			return "btn-primary";
		}
	}
o += "\n\n<button type=\"button\" class=\"btn btn-entrance " + getStatus() + "\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675337\">Enter class</button>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/booked/class-status',{
	NOT_YET: 'notyet',
    IN_COUNTDOWN: 'incountdown',
    OPEN_SOON: 'opensoon',
    STARTED: 'started'
});
define('campus-studyplan-ui/widget/pl-legacy/booked/class-entrance/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../class-status'
], function(
	Widget,
	template,
	CLASS_STATUS
){
	'use strict';

	function createEvcEnteringUrl(url) {
		return url
			.replace('?', '?showcontentonly=y&') // add search key 'showcontentonly' to skip new PL booking page redirect logic
			.replace('{source}', window.encodeURIComponent(window.location.href));
	}


	return Widget.extend(function($element, displayName, url){
		var me = this;
		me.url = url;
	},{
		'sig/start': function(){
		},

		'hub/campus/studyplan/pl/status': function(classStatus){
			var me = this;

			switch(classStatus){
				case CLASS_STATUS.OPEN_SOON:
					me.html(template({
						disabled: true
					}));
					break;
				case CLASS_STATUS.STARTED:
					me.html(template({
						disabled: false
					}));
					break;
			}
		},

		'dom:.btn-primary.btn-entrance/click': function(){
			var me = this;
			window.open(createEvcEnteringUrl(me.url), '_self');
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/booked/class-status/main.html',[],function() { return function template(data) { var o = "<p data-blurb-id=\"" + data.blurbId + "\" data-weave=\"troopjs-ef/blurb/widget\" class=\"csu-pl-status-info-title h4 " + data.className + "\"></p>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/booked/class-status/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../class-status'
], function(
	Widget,
	template,
	CLASS_STATUS
){
	'use strict';

	function getClassStatusBlurbId(status){
		switch(status) {
			case CLASS_STATUS.STARTED:
				return 674823;
			case CLASS_STATUS.OPEN_SOON:
				return 674824;
			default:
				return 674825;
		}
	}

	function getClassName(status){
		switch(status) {
			case CLASS_STATUS.STARTED:
			case CLASS_STATUS.OPEN_SOON:
				return 'csu-pl-status-info-title-highlight';
			default:
				return '';
		}
	}


	return Widget.extend(function($element, displayName, options){
	},{
		'sig/start': function(){
		},

		'hub/campus/studyplan/pl/status': function(status){
			var me = this;
			me.html(template({
				blurbId: getClassStatusBlurbId(status),
				className: getClassName(status)
			}));
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/booked/countdown/main.html',[],function() { return function template(data) { var o = "<div>\n\t<div>%H<span>|</span></div>\n\t<div>hour</div>\n</div><!--\n--><div>\n\t<div>%M<span>|</span></div>\n\t<div>min</div>\n</div><!--\n--><div>\n\t<div>%S</div>\n\t<div>sec</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/booked/countdown/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../class-status',
	'jquery',
	'moment',
	'jquery.countdown'
], function(
	Widget,
	template,
	CLASS_STATUS,
	$,
	moment
){
	'use strict';

	var HOURS_PER_DAY = 24;
	var MINUTES_PER_HOUR = 60;
	var SECONDS_PER_MINUTE = 60;

	var strTemplate = template();

	function getCurrentStatus(secondsLeft){
		if(secondsLeft > 30 * SECONDS_PER_MINUTE) {
			return CLASS_STATUS.NOT_YET;
		} else if(secondsLeft < 1) {
			return CLASS_STATUS.STARTED;
		} else if(secondsLeft < 10 * SECONDS_PER_MINUTE){
			return CLASS_STATUS.OPEN_SOON;
		} else {
			return CLASS_STATUS.IN_COUNTDOWN;
		}
	}

	return Widget.extend(function($element, displayName, service){
		var me = this;
		me.service = service;
	},{
		'sig/start': function(){
			var me = this;
			me.checkClassStatus().then(function(currentStatus){
				me.updateStatus(currentStatus);
				me.render();
			});
		},

		'checkClassStatus': function(){
			var me = this;
			var countdown;
			var secondsLeft = 0;
			return me.query(me.service).spread(function(plclass){
				countdown = plclass && (plclass.countdown || plclass.countDown);
				if(countdown){
					secondsLeft = countdown.secondsLeftForStart;
					me.finalDate = moment()
						.add(secondsLeft, 'seconds')
						.format('YYYY/MM/DD HH:mm:ss');
				}
				return getCurrentStatus(secondsLeft);
			});
		},

		'updateStatus': function(currentStatus){
			var me = this;
			me.currentStatus = currentStatus;
			me.publish('campus/studyplan/pl/status', me.currentStatus);
		},

		'render': function(){
			var me = this;
			if(me.currentStatus === CLASS_STATUS.STARTED) {
				me.$element.remove();
			} else {
				me.countdown();
			}
		},

		'countdown': function(){
			var me = this;
			me.$element.countdown(me.finalDate)
				.on('update.countdown', function(event){
					var secondsLeft = ((event.offset.totalDays *
						HOURS_PER_DAY + event.offset.hours) *
						MINUTES_PER_HOUR + event.offset.minutes) *
						SECONDS_PER_MINUTE + event.offset.seconds;
					var currentStatus = getCurrentStatus(secondsLeft);
					var statusChanged = currentStatus !== me.currentStatus;
					var hasVisibleCountdown = currentStatus === CLASS_STATUS.IN_COUNTDOWN || 
												currentStatus === CLASS_STATUS.OPEN_SOON;
					if(statusChanged && 
						// will double check status 'started' in event 'finish.countdown'
						currentStatus !== CLASS_STATUS.STARTED) {
						me.updateStatus(currentStatus);
					}

					if(hasVisibleCountdown){
						me.$element.html(event.strftime(strTemplate));
					}					
				})
				.on('finish.countdown', function(){
					// handle time difference
					// between client side and server side
					me.checkClassStatus().then(function(currentStatus){
						me.updateStatus(currentStatus);
						me.render();
					});
				});				
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/booked/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-booked\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"h4 csu-pl-lead text-center\">\n\t\t\t<span class=\"glyphicon glyphicon-booked\"></span>\n\t\t\t<span data-blurb-id=\"568587\" data-weave=\"troopjs-ef/blurb/widget\">Class Booked</span>\n\t\t</div>\n\t\t<div class=\"csu-pl-class-panel tabulation\">\n\t\t\t<div class=\"row\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"csu-pl-class-media media\">\n\t\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t\t<div class=\"media-body-inner-wrapper\">\n\t\t\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t\t\t\t\t\t<div class=\"csu-pl-profile\" data-weave=\"campus-studyplan-ui/widget/shared/pl-profile/main(options)\" data-options='" + JSON.stringify(data.bookedClass).replace(/\'/g, "&#39;") + "'></div>\n\t\t\t\t\t\t\t\t<ul class=\"csu-pl-booked-links clearfix\">\n\t\t\t\t\t\t\t\t\t<li>\n\t\t\t\t\t\t\t\t\t\t<a class=\"csu-pl-link csu-pl-link-cancel\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568585\" data-toggle=\"tooltip\" data-placement=\"bottom\" title=\"" + data.notice + "\">Cancel you booking</a>\n\t\t\t\t\t\t\t\t\t</li>\n\t\t\t\t\t\t\t\t\t"; if(data.calendarReminderEnabled){ o += "\n\t\t\t\t\t\t\t\t\t\t<li>\n\t\t\t\t\t\t\t\t\t\t\t<a class=\"csu-pl-link csu-pl-link-reminder\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675993\">SAVE TO CALENDAR</a>\n\t\t\t\t\t\t\t\t\t\t</li>\n\t\t\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"csu-pl-status-info\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<div data-weave=\"campus-studyplan-ui/widget/pl-legacy/booked/countdown/main(" + data.id + ")\" class=\"csu-pl-booked-countdown\"></div>\n\t\t\t\t\t\t<div data-weave=\"campus-studyplan-ui/widget/pl-legacy/booked/class-status/main\"></div>\n\t\t\t\t\t\t<div data-weave=\"campus-studyplan-ui/widget/pl-legacy/booked/class-entrance/main(url)\" data-url=\"" + data.evcUrls.entering + "\"></div>\n\t\t\t\t\t</div><span>&nbsp;</span><!-- for vertical alignment -->\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"row\">\n\t\t\t<div class=\"col-xs-6 col-xs-offset-3\">\n\t\t\t\t<div class=\"csu-pl-sms-reminder\" data-weave=\"campus-studyplan-ui/widget/pl-legacy/booked/sms-reminder/main(" + data.id + ")\"></div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"cpbc-inner-wrapper\">\n\t\t\t<div class=\"h4 csu-pl-lead text-center\">\n\t\t\t\t<span class=\"glyphicon glyphicon-booked\"></span>\n\t\t\t\t<span data-blurb-id=\"568587\" data-weave=\"troopjs-ef/blurb/widget\">Class Booked</span>\n\t\t\t</div>\n\t\t\t<div class=\"csu-pl-class-panel\">\n\t\t\t\t<div class=\"csu-pl-class-media media clearfix\">\n\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t\t\t\t<div class=\"csu-pl-booked-reminder\">\n\t\t\t\t\t\t\t<div data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"674463\">Are you sure you want to cancel the class?</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"csu-pl-booked-buttons\">\n\t\t\t\t\t\t\t<button type=\"button\" class=\"btn btn-primary btn-pl-keep\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"674464\">No, keep the class</button><!--\n\t\t\t\t\t\t\t--><button type=\"button\" class=\"btn btn-default btn-pl-cancel\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"674465\">Yes, cancel the class</button>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/booked/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'lodash',
	'when',
	'../../../utils/momentize',
    'troopjs-ef/command/service',
    'troopjs-data/cache/component',
    './class-status',
    '../../../utils/widgetCreator',
    '../../../utils/fancybox',
    'client-tracking',
    'moment'
], function(
	Widget,
	template,
	_,
	when,
	momentize,
	CommandService,
	Cache,
	CLASS_STATUS,
	widgetCreator,
	fancybox,
	ct,
	moment
){
	'use strict';

	var COMMAND;
	var MEMBER_SITE_SETTING = {
		'SUBBED_OUT_MESSAGE': {
			'SITEAREA': 'OCB',
			'KEYCODE': 'PLTeacherCancellationMessages'
		}
	};
	var REMINDER_LINK = '/school/evc/pl/outlook?class_id=';
	var STYLE_CANCELLATION = 'csu-pl-booked-cancellation';

	var CANCEL_KEY = 'bookingCancelledBy_';
	var storage = window.localStorage;
	var contextDeferred = when.defer();
	var userDeferred = when.defer();

	function removeElement(array, element){
		var temp = array.slice(0);
		_.remove(temp, function(val){
			return val === element + '';
		});
		return temp;
	}

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;

        if (!COMMAND) {
            // Create new CommandService
            COMMAND = new CommandService('plbooking/cancel', new Cache());
            // Configure
            COMMAND.configure({
                'url': '/services/school/command/plbooking/cancel',
                'contentType': 'application/json; charset=UTF-8',
                'type': 'post'
            });
            COMMAND.start();
        }
	},{
		'sig/start': function(){
			var me = this;
			var languageCode;
			var startTime;
			var cancelTime;
			var notice;
			me.query(contextDeferred.promise, userDeferred.promise,
				'blurb!639584',
				'member_site_setting!' +
					MEMBER_SITE_SETTING.SUBBED_OUT_MESSAGE.SITEAREA + ';' +
					MEMBER_SITE_SETTING.SUBBED_OUT_MESSAGE.KEYCODE,
				'ccl!"School.EVC.Reminder.Switch"')
			.spread(function(context, user, blurb, setting, ccl){
				if(user && user.member_id){
					me.member_id = user.member_id;
				}
				languageCode = context.languagecode.value.toLowerCase();
				startTime = momentize(me.options.bookedClass.customizedStartTime, languageCode, 'START_TIME');
				cancelTime = momentize(me.options.bookedClass.suggestedCancelTime, languageCode, 'CANCEL_TIME');
				notice = blurb.translation
					.replace('%%Canceltime%%', cancelTime)
					.replace('%%timezone%%', me.options.bookedClass.timezoneId);
				me.html(template(_.assign({
					startTime: startTime,
					notice: notice,
					calendarReminderEnabled: ccl && ccl.value === 'true'
				}, me.options))).then(function(){
					me.$element.find('.csu-pl-link-cancel').tooltip();
					me.$content = me.$element.find('.csu-pl-booked');

					// for subbed out message when the class was cancelled by teacher
					me.isSubbedOut = me.options.bookedClass.teacherId === -1;
					if(me.isSubbedOut) {
						me.readMessages = setting && setting.value ? setting.value.split(',') : [];
						me.messageIsRead = _.contains(me.readMessages, me.options.bookedClass.classId + '');
						if(!me.messageIsRead) {
							me.showTeacherCancellationMessage();
						}
					}
				});
			});
		},

		'hub:memory/common_context': function(context) {
			contextDeferred.resolve(context && context.values);
		},

		'hub:memory/context': function(context) {
			userDeferred.resolve(context && context.user);
		},

		'hub/campus/studyplan/pl/status': function(status){
			var me = this;
			if(status === CLASS_STATUS.STARTED) {
				me.$element.find('.csu-pl-booked-links').remove();
			}
		},

		'dom:.csu-pl-link-cancel/click': function(){
			var me = this;
			me.toggleCancellation();
		},

		'dom:.csu-pl-link-reminder/click': function(){
			var me = this;
			window.open(REMINDER_LINK + me.options.bookedClass.classId, '_self');
		},

		'dom:.btn-pl-keep/click': function(){
			var me = this;
			me.toggleCancellation();
		},

		'dom:.btn-pl-cancel/click': function(){
			var me = this;

			ct.useraction({
				'action.cancelClass': 1
			});

			me.$element.trigger('task',me.publish('plbooking/cancel', {
				'class_id': me.options.bookedClass.classId
			}).spread(function(result){
				if(result[0].isSuccess) {
					if(me.isSubbedOut && me.messageIsRead){
						me.saveSetting(removeElement(me.readMessages, me.options.bookedClass.classId));
					}

					// Publish cancel status to school
					me.publish('studyplan/sequence/update');
					// Reload current studyplan content
					me.publish('studyplan/sequence-container/reload');
					// Set operation flag , 1 reprents booking class is canceled by student
					storage.setItem(CANCEL_KEY + me.options.topic.courseUnitId + me.member_id, 1 + '#' + moment().utc().format('YYYY-MM-DD HH:mm:ss'));
				}
			}));
		},

		'showTeacherCancellationMessage': function(){
			var me = this;
			var $message = widgetCreator({
				'campus-studyplan-ui/widget/shared/alert/main': {
					'title': 677631,
					'content': 677503,
					'action': 677505
				}
			});
			$message.weave().then(function(){
				fancybox.open({
					content: $message,
					afterClose: function(){
						me.saveSetting(me.readMessages.concat(me.options.bookedClass.classId));
					}
				});
			});
		},

		'saveSetting': function(readMessages){
			var me = this;
			return me.publish('school/member_site_setting/Save', {
				siteArea: MEMBER_SITE_SETTING.SUBBED_OUT_MESSAGE.SITEAREA,
				keyCode: MEMBER_SITE_SETTING.SUBBED_OUT_MESSAGE.KEYCODE,
				keyValue: readMessages.join(',')
			}).then(function(){
				me.readMessages = readMessages;
			});
		},

		'toggleCancellation': function(){
			var me = this;
			me.$content.toggleClass(STYLE_CANCELLATION);
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/booked/sms-reminder/main.html',[],function() { return function template(data) { var o = "<form class=\"cpsr-input-form\">\n\t<p class=\"cpsr-notice\">\n\t\t<span data-blurb-id=\"677499\" data-weave=\"troopjs-ef/blurb/widget\" data-values='{ \"hours\": " + data.sendMsgXHoursBeforeClass + "}'></span> <a data-blurb-id=\"132214\" data-weave=\"troopjs-ef/blurb/widget\" class=\"cpsr-privacy-policy\" href=\"\"></a>\n\t</p>\n\t<div>\n\t\t<p class=\"cpsr-lead\" data-blurb-id=\"677501\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t<div class=\"clearfix\">\n\t\t\t<div class=\"cpsr-mobile-number\">\n\t\t\t\t<input class=\"cpsr-mobile-number-input\" style=\"padding-left: " + (data.phoneNumberCountryCode.length+2)/2 + "em;\" type=\"text\" id=\"phoneNumber\" name=\"phoneNumber\">\n\t\t\t\t<span class=\"cpsr-country-code\">+" + data.phoneNumberCountryCode + "</span>\n\t\t\t</div>\n\t\t\t<div class=\"cpsr-request-reminder\">\n\t\t\t\t<button class=\"btn-link btn-link-request\" type=\"submit\"><span data-blurb-id=\"677502\" data-weave=\"troopjs-ef/blurb/widget\"></span> <span class=\"glyphicon glyphicon-arrow-primary\"></span></button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</form>"; return o; }; });

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/booked/sms-reminder/filled-out.html',[],function() { return function template(data) { var o = "";
	function isChecked(){
		return data.hasSubscribed ? 'checked' : '';
	}
o += "\n<div class=\"cpsr-subscribe\">\n\t<div class=\"cpsr-subscribe-inner-wrapper\">\n\t\t<input class=\"cpsr-subscribe-checkbox\"  type=\"checkbox\" id=\"subscribe\" " + isChecked() + ">\n\t</div>\n\t<div class=\"cpsr-subscribe-inner-wrapper\">\n\t\t<label class=\"cpsr-subscribe-label\" data-blurb-id=\"680354\" data-weave=\"troopjs-ef/blurb/widget\" data-values='{ \"telephone\": \"+" + data.phoneNumber + "\" }'></label>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/booked/sms-reminder/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'template!./filled-out.html',
    'troopjs-ef/command/service',
    'troopjs-data/cache/component',
	'lodash',
	'jquery',
	'jquery.validate'
], function(
	Widget,
	template,
	templateFiiledOut,
	CommandService,
	Cache,
	_,
	$
){
	'use strict';

	var COMMAND;
	var REMINDER_HIDE_TIME = 5*60*60;

	function convertToObject(arr){
		var keys = _.pluck(arr, 'name');
		var values = _.pluck(arr, 'value');
		return _.zipObject(keys, values);
	}

	return Widget.extend(function($element, displayName, serivce){
		var me = this;
		me.serivce = serivce;
        if (!COMMAND) {
            // Create new CommandService
            COMMAND = new CommandService('sms_reminder/UpdateSetting', new Cache());
            // Configure
            COMMAND.configure({
                'url': '/services/api/campuscore/command/sms_reminder/UpdateSetting',
                'contentType': 'application/json; charset=UTF-8',
                'type': 'post'
            });
            COMMAND.start();
        }
	},{
		'sig/start': function(){
			var me = this;
			me.query('sms_reminder!current', me.serivce).spread(function(data, classes){
				me.reminder = data && data.studentInfo;
				var coundown = classes && (classes.countdown || classes.countDown);
				me.secondsLeftForStart = coundown.secondsLeftForStart;
				me.render();
			});
		},

		'dom/submit': function(e){
			var me = this;
			var param = convertToObject($(e.target).serializeArray());
			e.preventDefault();
			_.assign(param, {
				phoneNumber: me.reminder.phoneNumberCountryCode + param.phoneNumber,
				subscribe: true
			});
			me.publish('sms_reminder/UpdateSetting', param).spread(function(result){
				if(result && result[0] && result[0].isSuccess){
					_.assign(me.reminder, {
						phoneNumber: param.phoneNumber,
						hasSubscribed: true
					});
					me.render();
				}
			});
		},

		'dom:.cpsr-privacy-policy/click': function(e){
			e.preventDefault();
			window.open(
				'/partner/corp/privacy.aspx',
				'help',
				'width=640,height=600,resizable,scrollbars'
			);
		},

		'dom:.cpsr-subscribe-checkbox/change': function(e){
			var me = this;
			var checked = $(e.target).prop('checked');
			me.publish('sms_reminder/UpdateSetting', {
				subscribe: checked
			}).spread(function(result){
				if(result && result[0] && result[0].isSuccess){
					_.assign(me.reminder, {
						hasSubscribed: checked
					});
					me.render();
				}
			});
		},

		'render': function(){
			var me = this;
			var regex;
			if(me.secondsLeftForStart < REMINDER_HIDE_TIME){
				return;
			}
			if(me.reminder && me.reminder.enableSmsReminder){
				if(me.reminder.phoneNumber){
					return me.html(templateFiiledOut(me.reminder));
				}
				else {
					return me.query('blurb!680352', 'blurb!680353').spread(function(invalid, missing){						
						return me.html(template(me.reminder)).then(function(){
							regex = new RegExp(me.reminder.phoneNumberValidationRegex);

							$.validator.addMethod('campusSmsNumber', function (value, element) {
								return this.optional(element) || regex.test(value);
							}, 'Invalid phone number');

							me.$element.find('.cpsr-input-form').validate({
								rules: {
									phoneNumber: {
										required: true,
										campusSmsNumber: true
									}
								},
								messages: {
									phoneNumber: {
										required: missing && missing.translation,
										campusSmsNumber: invalid && invalid.translation
									}
								}
							});
						});
					});
				}
			}
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/booked/techcheck/main.html',[],function() { return function template(data) { var o = "<p class=\"csu-pl-status-info-description\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.notice + "\"></p>\n<button type=\"button\" class=\"btn btn-primary btn-tech-check\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675336\">Complete tech check</button>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/booked/techcheck/main',[
	'troopjs-ef/component/widget',
	'troopjs-core/pubsub/hub',
	'template!./main.html',
	'school-ui-studyplan/utils/client-storage',
	'../class-status',
	'when',
	'client-tracking'
], function(
	Widget,
	Hub,
	template,
	clientStorage,
	CLASS_STATUS,
	when,
	ct
){
	'use strict';

	var STATUS_PASSED = 'passed';

	var deferredCheckingEnabled = when.defer();

	function getNotice(currentStatus){
		switch (currentStatus) {
			case CLASS_STATUS.NOT_YET:
				return 675334;
			case CLASS_STATUS.STARTED:
				return 675335;
			default:
				return 675333;
		}
	}

	function checkTechCheckEnabled(enabled){
		deferredCheckingEnabled.resolve(enabled);
	}

	return Widget.extend(function($element, displayName, options){

	},{
		'sig/start': function(){
			// reemit(event, senile, context, callback)
			Hub.on('plugins/tech-check/enable', Hub, checkTechCheckEnabled);
			Hub.reemit('plugins/tech-check/enable', true, Hub, checkTechCheckEnabled);
			Hub.off('plugins/tech-check/enable', Hub, checkTechCheckEnabled);			
		},

		'hub/campus/studyplan/pl/status': function(classStatus){
			var me = this;
			var passed = clientStorage.getSessionStorage('techcheck_state') === STATUS_PASSED;

			me.classStatus = classStatus;

			deferredCheckingEnabled.promise.then(function(enabled){
				if(!enabled || passed) {
					me.publish('campus/studyplan/techcheck/passed', me.classStatus);
				} else {
					me.render();
				}
			});
		},

		'dom:.btn-tech-check/click': function(){
			var me = this;
			var host;

			ct.useraction({
				'action.techCheck': 1
			});

			me.query('ccl!"evc.classroom.host"').spread(function (ccl) {

				host = ccl && ccl.value;

				if(!host) {
					return;
				}

				me.publish('tech-check/request',[
						{
							id: 'flash-install'
						},
						{
							id: 'flash-setting',
							reload: false
						},
						{
							id: 'chrome-auth'
						},
						{
							id: 'check-audio'
						}
					],{
						flashPath: window.location.protocol + '//' + host + '/techcheck{version,-}/default/techcheck-{version}.swf'
					}
				).then(function success(config) {
					// save passed session
					clientStorage.setSessionStorage('techcheck_state', STATUS_PASSED);
					clientStorage.setSessionStorage('legacy_techcheck_state', true);

					// need continue to switch status of 'enter class' button
					// the element can't be removed
					me.$element.html('');

					me.publish('campus/studyplan/techcheck/passed', me.classStatus);
				});
			});
		},

		'render': function(){
			var me = this;
			me.html(template({
				notice: getNotice(me.classStatus)
			}));
		}
	});
});
define('campus-studyplan-ui/widget/pl-legacy/cp20',[
	'./base'
], function(
	PL
){
	'use strict';

	return PL.extend(function($element, displayName, options){
		var me = this;
		me.options = {
			serviceAPI: 'checkpointstate!cp20;',
			durationMinutes: 20,
			classType: 'cp20'
		};
		me.deferredFeature.resolve();
	},{
		'sig/start': function(){
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/dropout/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-dropout\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"h4 csu-pl-lead text-center\">\n\t\t\t<span class=\"glyphicon glyphicon-alert\"></span>\n\t\t\t<span data-blurb-id=\"675998\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t</div>\n\t\t<div class=\"csu-pl-class-panel tabulation\">\n\t\t\t<div class=\"row\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"csu-pl-class-media media\">\n\t\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t\t\t\t\t <div class=\"csu-pl-profile\" data-weave=\"campus-studyplan-ui/widget/shared/pl-profile/main(options)\" data-options='" + JSON.stringify(data.bookedClass) + "'></div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"csu-pl-status-info\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<p class=\"h4 csu-pl-status-info-title\" data-blurb-id=\"675999\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t\t<p class=\"csu-pl-status-info-description\">\n\t\t\t\t\t\t\t<span data-blurb-id=\"676422\" data-weave=\"campus-studyplan-ui/widget/blurb\"></span><br/><strong data-blurb-id=\"676000\" data-weave=\"campus-studyplan-ui/widget/blurb\"></strong>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<div>\n\t\t\t\t\t\t\t<a class=\"btn-link\" href=\"/customerservice/contactus/inschool\" target=\"_blank\" data-blurb-id=\"676423\" data-weave=\"troopjs-ef/blurb/widget\"></a>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div><span>&nbsp;</span><!-- for vertical alignment -->\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/dropout/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../../../utils/momentize',
	'lodash'
], function(
	Widget,
	template,
	momentize,
	_
){
	'use strict';

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
		},

		'hub:memory/common_context': function(context) {
			var me = this;
			var languageCode;
			var startTime = '';

			if(context && context.values && me.options.bookedClass){
				languageCode = context.values.languagecode.value.toLowerCase();
				startTime = momentize(me.options.bookedClass.customizedStartTime, languageCode, 'START_TIME');
			}

			me.html(template(_.assign({
				startTime: startTime
			}, me.options)));
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/nevertake/no-recommendation.html',[],function() { return function template(data) { var o = "";
	function getUrl(){
		return data.evcUrls.booking
			.replace('{source}', window.encodeURIComponent(window.location.href) || '')
			.replace('{token}', data.studyplanItemToken || '')
			.replace('{partner}', data.classRecommendation.classPartnerCode || '')
			.replace('{tid}', '');
	}
o += "\n<div class=\"csu-pl-msg-with-topic\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"csu-pl-topic\">\n\t\t\t<div class=\"media\">\n\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t<img class=\"media-object\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t</h4>\n\t\t\t\t\t<p data-blurb-id=\"" + data.topic.description + "\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t<p data-blurb-id=\"673773\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"text-center\">\n\t\t\t<p class=\"csu-pl-msg-lead\" data-blurb-id=\"681900\" data-weave=\"troopjs-ef/blurb/widget\">Unfortunately we were not able to recommend you a teacher within the next 7 days. Please visit the booking calendar to view further options.</p>\n\t\t\t<a class=\"btn btn-primary btn-calendar\" href=\"" + getUrl() + "\" data-blurb-id=\"681901\" data-weave=\"troopjs-ef/blurb/widget\">Go to calendar</a>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/nevertake/main',[
	'troopjs-ef/component/widget',
	'template!./no-recommendation.html',
	'when',
	'lodash',
	'jquery',
	'../../../utils/widgetCreator',
	'../../../utils/fancybox',
	'moment'
], function(
	Widget,
	template,
	when,
	_,
	$,
	widgetCreator,
	fancybox,
	moment
){
	'use strict';

	var SORT_KEY = 'Id';
	var REGEX_OFFSET = /UTC([+-]\d{2}:\d{2}){0,1}/;
	var CANCEL_KEY = 'bookingCancelledBy_';
	var MIN_DATE = '1900-01-01 00:00:00';
	var storage = window.localStorage;
	var userDeferred = when.defer();

	function getTimezoneList(){
		var listDeferred = when.defer();
		$.get('/school/evc/pl/gettimezonelist', function(data){
			if(data && data.TimeZone){
				listDeferred.resolve(data.TimeZone);
			}
		});
		return listDeferred.promise;
	}

	function createViewData(timezone){
		var arrOffset = REGEX_OFFSET.exec(timezone.DisplayName);
		return {
			id: timezone.Id,
			offset: timezone.Offset,
			displayOffset: arrOffset && arrOffset[0]
		};
	}

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
			var me = this;

			me.getTimezone().then(function(currentTimezone){
				me.render(currentTimezone);
			});
		},

		'hub:memory/load/studyplan_item': function(studyplanItem){
			var me = this;
			me.studyplanItem = studyplanItem;
			me.studyplanItemToken = me.studyplanItem &&
									me.studyplanItem.progress &&
									me.studyplanItem.progress.properties &&
									me.studyplanItem.progress.properties.token || '';
		},

		'hub:memory/context': function(context) {
			userDeferred.resolve(context && context.user);
		},

		'dom/timezoneChange': function(e, currentTimezone){
			var me = this;
			me.render(currentTimezone);
		},

		'getTimezone': function(){
			var me = this;
			var today;
			var offset;
			var currentTimezone;
			var deferred = when.defer();

			return me.query(
				'member_site_setting!EVC;TimeZone',
				getTimezoneList()
			).spread(function(setting, list){
				if(list && list.length) {
					me.timezoneList = _.map(_.sortBy(list, SORT_KEY), createViewData);

					// timezone in membersitesetting
					if(setting && setting.value){
						currentTimezone = _.find(me.timezoneList, {
							'id': setting.value
						});
						deferred.resolve(currentTimezone);
					}
					// local timezone
					else {
						today = new Date();
						offset = today.getTimezoneOffset() * -1;
						currentTimezone = _.find(me.timezoneList, {
							'offset': offset
						});
						me.saveTimezone(currentTimezone.id).then(function(){
							deferred.resolve(currentTimezone);
						});
					}
				}
				return deferred.promise;
			});
		},

		'saveTimezone': function(timezoneId){
			var me = this;
			return me.publish('school/member_site_setting/Save', {
				siteArea: 'EVC',
				keyCode: 'TimeZone',
				keyValue: timezoneId
			});
		},

		'render': function(currentTimezone){
			var me = this;
			var options;
			var $recommendation;

			if(currentTimezone) {
				me.currentTimezone = currentTimezone;
				me.query('ocb_recommendclass!\'' + me.options.topic.classType + ';' + me.currentTimezone.id + '\'', userDeferred.promise).spread(function(data, user){
					me.publish('ocb/recommendation/change', data && data.classRecommendation);

					if(user && user.member_id){
						me.member_id = user.member_id;
					}

					if(data && data.classRecommendation && data.classRecommendation.classes && data.classRecommendation.classes.length){
						options = _.assign(me.options, {
							studyplanItem: me.studyplanItem,
							studyplanItemToken: me.studyplanItemToken,
							classRecommendation: data.classRecommendation,
							currentTimezone: me.currentTimezone,
							timezoneList: me.timezoneList
						});
						$recommendation = widgetCreator({
							'campus-studyplan-ui/widget/pl-legacy/nevertake/recommendation/main': options
						});
						$recommendation.weave();
						me.html($recommendation);
					} else {
						options = _.assign(me.options, {
							studyplanItemToken: me.studyplanItemToken,
							classRecommendation: data.classRecommendation
						});
						me.html(template(options));
					}
					var cancelValue = storage.getItem(CANCEL_KEY + me.options.topic.courseUnitId + me.member_id);
					var cancelDate = cancelValue === null ? MIN_DATE : cancelValue.split('#')[1];
					var ocb_cancellation = 'ocb_cancellation!' + '\'' + me.options.topic.courseUnitId + ';' + cancelDate + '\'';
					me.query(ocb_cancellation).spread(function(ocbCancel){
						if(ocbCancel.hasCancelledLastBooking){
							me.showTeacherCancellationMessage();
						}
					});
				});
			}
		},

		'showTeacherCancellationMessage': function(){
			var me = this;
			var $message = widgetCreator({
				'campus-studyplan-ui/widget/shared/alert/main': {
					'title': 682008,
					'content': 682009,
					'action': 677505
				}
			});
			$message.weave().then(function(){
				fancybox.open({
					content: $message,
					afterClose: function(){
						// Set operation flag , 0 reprents cancellation message is read
						storage.setItem(CANCEL_KEY + me.options.topic.courseUnitId + me.member_id, 0 + '#' + moment().utc().format('YYYY-MM-DD HH:mm:ss'));
					}
				});
			});
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/nevertake/recommendation/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-nevertake\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"csu-pl-topic\">\n\t\t\t<div class=\"media\">\n\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t<img class=\"media-object\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t</h4>\n\t\t\t\t\t<p data-blurb-id=\"" + data.topic.description + "\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t<p data-blurb-id=\"673773\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"csu-pl-nevertake-booking\">\n\t\t\t<p class=\"csu-pl-nevertake-lead\" data-blurb-id=\"673774\" data-weave=\"troopjs-ef/blurb/widget\">Recommended class for you</p>\n\t\t\t<form class=\"csu-pl-nevertake-form tabulation\">\n\t\t\t\t<div class=\"row\">\n\t\t\t\t\t<div class=\"col-xs-4\">\n\t\t\t\t\t\t<div class=\"csu-pl-nevertake-teacher\" data-weave=\"campus-studyplan-ui/widget/pl-legacy/nevertake/teacher/main\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"col-xs-4\">\n\t\t\t\t\t\t<div class=\"csu-pl-nevertake-timeslot\" data-weave=\"campus-studyplan-ui/widget/pl-legacy/nevertake/timeslot/main(options, context)\" data-options='" + JSON.stringify(data.classRecommendation) + "' data-context='" + JSON.stringify(data.context) + "'></div>\n\t\t\t\t\t\t<div class=\"csu-pl-nevertake-timezone\" data-weave=\"campus-studyplan-ui/widget/pl-legacy/nevertake/timezone/main(options, list)\" data-options='" + JSON.stringify(data.currentTimezone) + "' data-list='" + JSON.stringify(data.timezoneList) + "'></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"col-xs-4\">\n\t\t\t\t\t\t<div class=\"csu-pl-nevertake-button\">\n\t\t\t\t\t\t\t"; if(data.videoEnabled === 'true') { o += "\n\t\t\t\t\t\t\t\t<div class=\"cpn-button-video-lesson\">\n\t\t\t\t\t\t\t\t\t<input type=\"checkbox\" id=\"videoLesson\" /><label for=\"videoLesson\" data-blurb-id=\"673775\" data-weave=\"troopjs-ef/blurb/widget\">Make it a video lesson</label>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t"; } o += "\n                            "; if (data.PLRecordFeature > 0 ) { o += "\n\t\t\t\t\t\t\t\t<div class=\"cpn-button-video-lesson gud\">\n                                    <input type=\"hidden\" value=\"" + (data.PLRecordFeature == 2 ? 'true' : 'false') + "\" name=\"NeedRecord\" />\n                                    <input type=\"checkbox\" id=\"NeedRecordBox\" " + (data.PLRecordFeature == 2 ? 'checked' : '') + " /><label for=\"NeedRecordBox\" data-blurb-id=\"708472\" data-weave=\"troopjs-ef/blurb/widget\">Send me class video</label>\n                                    <span class=\"tooltip-info\" data-toggle=\"tooltip\" data-placement=\"right\">i</span>\n                                    <span class=\"hide\" data-blurb-id=\"708473\" data-weave=\"campus-studyplan-ui/widget/blurb\" ></span>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t<div>\n\t\t\t\t\t\t\t\t<button type=\"submit\" class=\"btn btn-primary\"><span data-blurb-id=\"568596\" data-weave=\"troopjs-ef/blurb/widget\">Book this class</span></button>\n\t\t\t\t\t\t\t\t<p class=\"csu-pl-nevertake-tnc\" data-blurb-id=\"673780\" data-weave=\"campus-studyplan-ui/widget/blurb\" data-values='{\"termsAndConditions\": \"<a class=\\\"csu-pl-link csu-pl-link-tnc\\\">" + data.termsAndConditions + "</a>\"}'>By clicking the button above, you agree to the Terms And Conditions of the Private Lesson services.</p>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t"; if(data.studyplanItem.typeCode === 'cp20'){o += "\n\t\t\t\t\t<input type=\"hidden\" name=\"BookingToken\" value=\"" + data.studyplanItemToken + "\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"SubserviceType\" value=\"" + data.studyplanItem.typeCode.toUpperCase() + "\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"ClassTypeCode\" value=\"" + data.studyplanItem.typeCode.toUpperCase() + "\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"Flow\" value=\"\" />\n\t\t\t\t"; } else { o += "\n\t\t\t\t\t<input type=\"hidden\" name=\"BookingToken\" value=\"\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"SubserviceType\" value=\"\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"ClassTypeCode\" value=\"\" />\t\t\t\t\t\n\t\t\t\t\t<input type=\"hidden\" name=\"Flow\" value=\"UnitAligned\" />\n\t\t\t\t"; } o += "\n\t\t\t\t<input type=\"hidden\" name=\"Token\" value=\"" + data.bookingToken.token + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"TokenTime\" value=\"" + data.bookingToken.tokenTime + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"SchoolVersion\" value=\"" + data.studentCourse.schoolVersion + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"Course_id\" value=\"" + data.studentCourse.course_id + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"CourseUnit_id\" value=\"" + data.studentCourse.courseUnit_id + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"StudentCourse_id\" value=\"" + data.studentCourse.studentCourse_id + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"Member_id\" value=\"" + data.user.member_id + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"MarketCode\" value=\"" + data.context.countrycode.value + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"IsVideo\" value=\"false\" />\n\t\t\t\t<input type=\"hidden\" name=\"Gender\" value=\"\" />\n\t\t\t</form>\n\n\t\t\t<!-- links -->\n\t\t\t<div class=\"row\">\n\t\t\t\t<div class=\"col-xs-4 text-center\">\n\t\t\t\t\t<a class=\"btn-link csu-pl-link btn-link-change-teacher\"><span data-blurb-id=\"673776\" data-weave=\"troopjs-ef/blurb/widget\"></span><span class=\"glyphicon glyphicon-arrow\"></span></a>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"col-xs-4 text-center\">\n\t\t\t\t\t<a class=\"btn-link csu-pl-link btn-link-change-time\"><span data-blurb-id=\"673777\" data-weave=\"troopjs-ef/blurb/widget\"></span><span class=\"glyphicon glyphicon-arrow\"></span></a>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"col-xs-4\">\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/nevertake/recommendation/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'lodash',
	'jquery',
    '../../../../utils/widgetCreator',
    '../../../../utils/fancybox',
	'when',
	'client-tracking'
], function(
	Widget,
	template,
	_,
	$,
	widgetCreator,
	fancybox,
	when,
	ct
){
	'use strict';

	var contextDeferred = when.defer();
	var userDeferred = when.defer();
	var CANCEL_KEY = 'bookingCancelledBy_';
	var storage = window.localStorage;
    var PL_RECORDING_FEATURE = {
        DISABLED: 0,
        UNCHECKED: 1,
        CHECKED: 2
    };

	function getTeacherId(teacher){
		var arr = /[\?|&]id=(\S+)$/.exec(teacher && teacher.communityPageUrl);
		return arr && arr[1];
	}

	function createEvcBookingUrl(url, token, partner, tid){
		return url
			.replace('{source}', window.encodeURIComponent(window.location.href) || '')
			.replace('{token}', token || '')
			.replace('{partner}', partner || '')
			.replace('{tid}', tid || '');
	}

    function getPLRecordFeature(evcmember) {
        var bit;
        if (evcmember.enablePLRecord) {
            bit = evcmember.defaultPLRecordOption ? PL_RECORDING_FEATURE.CHECKED : PL_RECORDING_FEATURE.UNCHECKED;
        } else {
            bit = PL_RECORDING_FEATURE.DISABLED;
        }
        return bit;
    }

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
			var me = this;
			me.query(
				'ccl!"School.PrivateLesson.isVideoEnable"',
				'blurb!673781',
				contextDeferred.promise,
				userDeferred.promise,
				'evc_studentcourse!' + me.options.topic.courseUnitId,
                'bookingtoken!current',
                'evcmember!current'
			).spread(function(ccl, blurb, context, user, studentCourse, bookingToken, evcmember){
				if(user && user.member_id){
					me.member_id = user.member_id;
				}

				me.html(template, _.assign({
					videoEnabled: ccl && ccl.value,
					termsAndConditions: blurb && blurb.translation,
					context: context || {},
					user: user || {},
					studentCourse: studentCourse || {},
                    bookingToken: bookingToken && bookingToken.lessonBookingSecurityParams || {},
                    PLRecordFeature: getPLRecordFeature(evcmember)
				}, me.options)).then(function(){
					me.$timeslot = me.$element.find('.csu-pl-nevertake-timeslot');
					me.$videoLesson = me.$element.find('input[name=IsVideo]');
                    me.$element.find('[data-toggle="tooltip"]').each(function() {
                        var $this = $(this);
                        $this.tooltip({
                            title: $this.nextAll('.hide').text()
                        });
                    });
				});
			});
		},

		'dom:form.csu-pl-nevertake-form/submit': function(e){
			e.preventDefault();
			var me = this;
			var $error;
			var $form = $(e.target);
			var $startTime = $form.find('input[name=StartTime]');
			var $selectedStartTime = $form.find('input[name=StartTime]:checked');
			var selectedNumber = $startTime.index($selectedStartTime) + 1;
			var deferred = when.defer();

			ct.useraction({
				'action.booking': 1,
				'action.recommendTimeSlot': 1,
				'action.recommendTimeSlotChoice': 'Choice' + selectedNumber,
				'action.hasProfilePicture': me.selectedTeacher.isDefaultAvatar ? 'No' : 'Yes',
				'action.videoLessonClick': me.isVideoClass ? 'Yes' : 'No'
			});

			me.$element.trigger('task', deferred.promise);  // trigger loading spinner

			$.ajax({
				method: 'POST',
				url: '/school/evc/pl/book',
				data: $form.serialize(),
				success: function(result){
					if(result.IsSuccess) {
						// Publish cancel status to school
						me.publish('studyplan/sequence/update');
						// Reload current studyplan content
						me.publish('studyplan/sequence-container/reload');

						// one click booking tracking
						me.publish('ocb/recommendation/track', {
							status: 'Success',
							statusExtension: result.Class_id,
							isVideoClass: me.isVideoClass
						});
						// reset cancel flag
						storage.removeItem(CANCEL_KEY + me.options.topic.courseUnitId + me.member_id);
					}
					else {
						$error = widgetCreator({
							'campus-studyplan-ui/widget/shared/alert/main': {
								'glyphicon': true,
								'title': 674436,
								'content': 674437,
								'action': 674438
							}
						});
						$error.weave().then(function(){
							fancybox.open({
								content: $error,
								afterClose: function(){
									me.$timeslot.trigger('render');
								}
							});
						});

						// one click booking tracking
						me.publish('ocb/recommendation/track', {
							status: 'Fail',
							statusExtension: result.StatusCode,
							isVideoClass: me.isVideoClass
						});
					}
					deferred.resolve();
				}
			});
		},

		'dom:#videoLesson/change': function(e){
			var me = this;
			me.isVideoClass = e.target.checked;
			me.$videoLesson.val(me.isVideoClass);
		},

		'dom:#NeedRecordBox/click': function(e){
            var needRecord = e.target.form.elements.NeedRecord;
            needRecord.value = e.target.checked ? 'true' : 'false';
		},

		'dom:.csu-pl-link-tnc/click':function (e) {
			var me = this;
			var $termsAndConditions = widgetCreator({
				'campus-studyplan-ui/widget/pl-legacy/nevertake/tscs/main': {
					'classType' : me.options.topic.classType
				}
			});

			$termsAndConditions.weave().then(function(){
				fancybox.open({
					content: $termsAndConditions
				});
			});
		},

		'hub:memory/common_context': function(context) {
			contextDeferred.resolve(context && context.values);
		},

		'hub:memory/context': function(context) {
			userDeferred.resolve(context && context.user);
		},

		'hub/ocb/selectedClass/change': function(teacher){
			var me = this;
			me.selectedTeacher = teacher;
		},

		'dom:.btn-link-change-teacher/click': function(){
			var me = this;

			ct.useraction({
				'action.changeTeacher': 1
			});

			// one click booking tracking
			me.publish('ocb/recommendation/track', {
				status: 'Goto',
				statusExtension: 'ChangeTeacher',
				isVideoClass: false
			});

			var evcBookingUrl = createEvcBookingUrl(me.options.evcUrls.booking, me.options.studyplanItemToken, me.options.classRecommendation.classPartnerCode);
			window.open(evcBookingUrl, '_self');
		},

		'dom:.btn-link-change-time/click': function(){
			var me = this;

			ct.useraction({
				'action.viewOtherTime': 1
			});

			// one click booking tracking
			me.publish('ocb/recommendation/track', {
				status: 'Goto',
				statusExtension: 'ChangeTime',
				isVideoClass: false
			});

			var evcBookingUrl = createEvcBookingUrl(me.options.evcUrls.booking, me.options.studyplanItemToken, me.options.classRecommendation.classPartnerCode, getTeacherId(me.selectedTeacher));
			window.open(evcBookingUrl, '_self');
		}
	});
});


define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/nevertake/teacher/main.html',[],function() { return function template(data) { var o = "";
	function isStandalone(){
		var cls = '';
		if(!data.accent && !data.bilingual) {
			cls = 'cpn-teacher-name-standalone';
		}
		return cls;
	}

	function getInitialLetters(){
		var words = arguments;
		var str = '';
		for(var i = 0; i < words.length; i++){
			str += words[i].substring(0,1);
		}
		return str.toUpperCase();
	}
o += "\n<div class=\"cpn-title text-center\"><span class=\"glyphicon glyphicon-teacher-large\"></span><span data-blurb-id=\"673778\" data-weave=\"troopjs-ef/blurb/widget\">Teacher</span></div>\n<div class=\"cpn-teacher-profile text-center\">\n\t<div class=\"cpn-teacher-avatar\">\n\t\t\t<!--[if lte IE 8]>\n\t\t\t\t<vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n\t\t\t\t\t"; if(data.isDefaultAvatar){ o += "\n\t\t\t\t\t\t<vml:fill color=\"#c3c3c3\">\n\t\t\t\t\t\t\t<em>" + getInitialLetters(data.firstName, data.lastName) + "</em>\n\t\t\t\t\t\t</vml:fill>\n\t\t\t\t\t"; } else { o += "\n\t\t\t\t\t\t<vml:fill type=\"frame\" src=\"" + data.avatarUrl + "\"/>\n\t\t\t\t\t"; } o += "\n\t\t\t\t</vml:oval>\n\t\t\t<![endif]-->\n\t\t\t<span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n\t\t\t\t"; if(data.isDefaultAvatar){ o += "\n\t\t\t\t\t<em>" + getInitialLetters(data.firstName, data.lastName) + "</em>\n\t\t\t\t"; } else { o += "\n\t\t\t\t\t<img src=\"" + data.avatarUrl + "\" alt=\"" + data.nickName + "\">\n\t\t\t\t"; } o += "\n\t\t\t</span>\n\t\t</span>\n\t</div>\n\t<div class=\"cpn-teacher-name " + isStandalone() + "\">\n\t\t"; if(data.nickName){ o += "\n\t\t\t" + data.nickName + "\n\t\t"; } else { o += "\n\t\t\t" + data.firstName + ' ' + data.lastName + "\n\t\t"; } o += "\n\t</div>\n\t<ul class=\"cpn-teacher-language text-center\"><!--\n\t\t"; if(data.accent) { o += "\n\t\t\t--><li class=\"cpn-teacher-accent\">\n\t\t\t\t<div class=\"cpn-teacher-text\">\n\t\t\t\t\t<span class=\"glyphicon glyphicon-accent\"></span><span>" + data.accent + "</span>\n\t\t\t\t</div>\n\t\t\t</li><!--\n\t\t"; } o += "\n\t\t"; if(data.bilingual) { o += "\n\t\t\t--><li class=\"cpn-teacher-bilingual\">\n\t\t\t\t<div class=\"cpn-teacher-text\">\n\t\t\t\t\t<span class=\"glyphicon glyphicon-bilingual\"></span><span>" + data.bilingual + "</span>\n\t\t\t\t</div>\n\t\t\t</li><!--\n\t\t"; } o += "\n\t\t-->\n\t</ul>\n</div>\n<input type=\"hidden\" name=\"Teacher_id\" value=\"" + data.memberId + "\"/ >"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/nevertake/teacher/main',[
	'troopjs-ef/component/widget',
	'template!./main.html'
], function(
	Widget,
	template
){
	'use strict';

	return Widget.extend(function($element, displayName, options){

	},{
		'sig/start': function(){
		},

		'hub/ocb/selectedClass/change': function(teacher){
			var me = this;
			if(teacher.memberId !== me.memberId){
				me.render(teacher);
			}
		},

		'render': function(data){
			var me = this;
			me.memberId = data.memberId;
			me.html(template, data);
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/nevertake/timeslot/main.html',[],function() { return function template(data) { var o = ""; function check(num){ return num ? "" : "checked"; } o += "\n\n<div class=\"text-center\">\n\t<div class=\"cpn-title\"><span class=\"glyphicon glyphicon-timeslot\"></span><span data-blurb-id=\"673779\" data-weave=\"troopjs-ef/blurb/widget\">Time</span></div>\n\t<ul class=\"cpn-timeslot-list text-left\">\n\t\t"; for(var i = 0; i<data.classes.length; i++){ o += "\n\t\t\t<li data-teacher-member-id=\"" + data.classes[i].teacherMemberId + "\" data-end-time=\"" + data.classes[i].endTimeEst + "\" data-language-code=\"" + data.classes[i].languageCode + "\">\n\t\t\t\t<input type=\"radio\" name=\"StartTime\" id=\"timeslot" + data.classes[i].classId + "\" value=\"" + data.classes[i].startTimeEst + "\" " + check(i) + " /><label for=\"timeslot" + data.classes[i].classId + "\">" + data.classes[i].formattedTime + "</label>\n\t\t\t</li>\n\t\t"; } o += "\n\t\t<input type=\"hidden\" name=\"EndTime\" value=\"" + data.classes[0].endTimeEst + "\" />\n\t\t<input type=\"hidden\" name=\"LanguageCode\" value=\"" + data.classes[0].languageCode + "\" />\n\t</ul>\n</div>\n<input type=\"hidden\" name=\"PartnerCode\" value=\"" + data.classPartnerCode + "\" />"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/nevertake/timeslot/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'lodash',
	'jquery',
	'when',
	'../../../../utils/momentize',
	'client-tracking'
], function(
	Widget,
	template,
	_,
	$,
	when,
	momentize,
	ct
){
	'use strict';

	function formatTime(languageCode){
		return function(obj){
			var time = obj.startTime.substring(0,19);
			obj.formattedTime = momentize(time, languageCode, 'START_TIME');
			return obj;
		};
	}

	return Widget.extend(function($element, displayName, options, context){
		var me = this;
		me.options = options;
		me.context = context;
	},{
		'sig/start': function(){
			var me = this;
			me.render();
		},

		'dom/render': function(){
			var me = this;
			me.render();
		},

		'dom:input[name="StartTime"]/change': function(e){
			var me = this;
			var $time = $(e.currentTarget).parent();

			ct.useraction({
				'action.changeBookingTime': 1
			});

			// set attribute 'checked' for the selected element
			$time.siblings().find('input[checked]').removeAttr('checked');
			$time.find('input').attr('checked', 'checked');

			// set end time accordeing to the selected class
			me.$endTime.val($time.data('endTime'));

			// set language code accordeing to the selected class
			me.$languageCode.val($time.data('languageCode'));

			me.publish('ocb/selectedClass/change', _.find(me.teachers, {
				memberId: $time.data('teacherMemberId')
			}));
		},

		'render': function(){
			var me = this;
			var languageCode = me.context && me.context.languagecode.value.toLowerCase();
			me.teachers = me.options.teachers;
			me.html(template, {
				classes: _.map(me.options.classes, formatTime(languageCode)),
				classPartnerCode: me.options.classPartnerCode
			}).then(function(){
				me.$endTime = me.$element.find('input[name=EndTime]');
				me.$languageCode = me.$element.find('input[name=LanguageCode]');
				me.publish('ocb/selectedClass/change', _.find(me.teachers, {
					memberId: me.options.classes[0].teacherMemberId
				}));
			});
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/nevertake/timezone/main.html',[],function() { return function template(data) { var o = "<div class=\"cpn-timezone-readonly text-center\">\n\t<div>" + data.id + "</div>\n\t<div class=\"cpn-timezone-button-wrapper\">\n\t\t(" + data.displayOffset + ")\n\t\t<a class=\"csu-pl-link cpn-timezone-button-change\" data-blurb-id=\"676700\" data-weave=\"troopjs-ef/blurb/widget\">change</a>\n\t</div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/nevertake/timezone/editable.html',[],function() { return function template(data) { var o = "";
	function isSelected(id){
		return id === data.current.id ? 'selected' : '';
	}
o += "\n<div class=\"cpn-timezone-editable text-center\">\n\t<select class=\"cpn-timezone-select\">\n\t\t"; for(var i = 0; i < data.list.length; i++){ o += "\n\t\t\t<option " + isSelected(data.list[i].id) + " value=\"" + data.list[i].id + "\">" + '(' + data.list[i].displayOffset + ') ' + data.list[i].id + "</option>\n\t\t"; } o += "\n\t</select>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/nevertake/timezone/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'template!./editable.html',
	'when',
	'jquery',
	'lodash'
], function(
	Widget,
	template,
	templateEditable,
	when,
	$,
	_
){
	'use strict';

	return Widget.extend(function($element, displayName, options, list){
		var me = this;
		me.options = options;
		me.list = list;
	},{
		'sig/start': function(){
			var me = this;
			me.render().then(function(){
				$('body').click(function(e){
					me.cancel($(e.target));
				});
			});
		},

		'dom:.cpn-timezone-button-change/click': function(){
			var me = this;
			me.edit();
		},

		'dom:.cpn-timezone-select/change': function(e){
			var me = this;
			var changed = me.list[e.currentTarget.selectedIndex];
			me.save(changed.id).then(function(){
				me.$element.trigger('timezoneChange', changed); // rerender the whole widget nevertake
			});
		},

		'render': function(){
			var me = this;
			me.hide(me.$editableView);
			return me.html(template(me.options)).then(function(){
				me.editable = false;
				if(me.$readonlyView){
					me.$readonlyView.remove();
				}
				me.$readonlyView = me.$element.find('.cpn-timezone-readonly');
			});
		},

		'edit': function(){
			var me = this;
			me.hide(me.$readonlyView);
			if(!me.$editableView){
				me.html(templateEditable({
					list: me.list,
					current: me.options
				})).then(function(){
					me.editable = true;
					me.$editableView = me.$element.find('.cpn-timezone-editable');
				});
			} else {
				me.$element.html(me.$editableView);
				me.editable = true;
			}
		},

		'cancel': function($target){
			var me = this;
			if(me.editable &&
				!$target.hasClass('cpn-timezone-button-change') && 
				!$target.hasClass('cpn-timezone-select') &&
				!$target.parents('.cpn-timezone-select').length){
				me.hide(me.$editableView);
				me.$element.html(me.$readonlyView);
			}
		},

		'save': function(timezoneId){
			var me = this;
			return me.publish('school/member_site_setting/Save', {
				siteArea: 'EVC',
				keyCode: 'TimeZone',
				keyValue: timezoneId
			});
		},

		'hide': function($element){
			var me = this;
			if($element){
				me.$element.after($element);
			}
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/nevertake/tscs/main.html',[],function() { return function template(data) { var o = "<div class=\"campus-studyplan-ui\">\n\t<div class = \"csu-pl-nevertake-tscs\">\n\t\t<p class = \"csu-pl-nevertake-tscs-title\" data-weave = \"troopjs-ef/blurb/widget\" data-blurb-id = \"676103\"></p>\n\t\t<p class = \"csu-pl-nevertake-tscs-des\" data-weave = \"troopjs-ef/blurb/widget\" data-blurb-id = \"676112\"></p>\n\t\t<div class = \"csu-pl-nevertake-tscs-content\" data-weave = \"campus-studyplan-ui/widget/blurb\" data-blurb-id = \"" + data.blurbID + "\"></div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/nevertake/tscs/main',['troopjs-ef/component/widget',
	 'template!./main.html'
	 ], function (Widget, template) {

	 return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
			'sig/start': function () {
				var me = this;
				var blurbID = '708943';
				return me.html(template,{
					blurbID: blurbID
				});
			}
		});
	});


define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/nocouponleft/main.html',[],function() { return function template(data) { var o = "";
	function customizeBuyUrl(url){
		return url.replace(/upurl=\S*&?/, 'upurl=' + window.encodeURIComponent(window.location.href));
	}
o += "\n<div class=\"csu-pl-nocouponleft csu-pl-msg-with-topic\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"csu-pl-topic\">\n\t\t\t<div class=\"media\">\n\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t<img class=\"media-object\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t</h4>\n\t\t\t\t\t<p data-blurb-id=\"" + data.topic.description + "\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t<p data-blurb-id=\"673773\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"text-center\">\n\t\t\t<p class=\"csu-pl-msg-lead\" data-blurb-id=\"675885\" data-weave=\"troopjs-ef/blurb/widget\">You don't have any private classes left right now.</p>\n\t\t\t"; if(data.feature.canBuyMore){ o += "\n\t\t\t\t<a class=\"btn btn-primary\" href=\"" + customizeBuyUrl(data.feature.buyUrl) + "\" data-blurb-id=\"675886\" data-weave=\"troopjs-ef/blurb/widget\">Buy more classes</a>\n\t\t\t"; } o += "\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/nocouponleft/main',[
	'troopjs-ef/component/widget',
	'template!./main.html'
], function(
	Widget,
	template
){
	'use strict';

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
			var me = this;
			me.html(template(me.options));
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/pending/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-pending\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"h4 csu-pl-lead text-center\">\n\t\t\t<span data-blurb-id=\"675994\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t</div>\n\t\t<div class=\"csu-pl-class-panel tabulation\">\n\t\t\t<div class=\"row\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"csu-pl-class-media media\">\n\t\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t\t\t\t\t <div class=\"csu-pl-profile\" data-weave=\"campus-studyplan-ui/widget/shared/pl-profile/main(options)\" data-options='" + JSON.stringify(data.bookedClass) + "'></div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"csu-pl-status-info\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<p class=\"h4 csu-pl-status-info-title csu-pl-status-info-title-fullsize\" data-blurb-id=\"675995\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t</div><span>&nbsp;</span><!-- for vertical alignment -->\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/pending/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../../../utils/momentize',
	'lodash'
], function(
	Widget,
	template,
	momentize,
	_
){
	'use strict';

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
		},

		'hub:memory/common_context': function(context) {
			var me = this;
			var languageCode;
			var startTime = '';

			if(context && context.values && me.options.bookedClass){
				languageCode = context.values.languagecode.value.toLowerCase();
				startTime = momentize(me.options.bookedClass.customizedStartTime, languageCode, 'START_TIME');
			}

			me.html(template(_.assign({
				startTime: startTime
			}, me.options)));
		}
	});
});
define('campus-studyplan-ui/widget/pl-legacy/pl',[
	'./base',
	'lodash'
], function(
	PL,
	_
){
	'use strict';

	return PL.extend(function($element, displayName, options){
		var me = this;
		me.options = {
			serviceAPI: 'plclass!',
			durationMinutes: 40,
			classType: 'pl'
		};
		me.query('evcmember!current').spread(function(data){
			me.deferredFeature.resolve(_.find(data && data.features, {
				featureType: me.options.classType.toUpperCase()
			}));
		});
	},{
		'sig/start': function(){
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/unlocked/main.html',[],function() { return function template(data) { var o = "";
    function getContent(){
        return data.topic.classType === 'cp20' ? 675991 : 678952;
    }
o += "\n<div class = \"csu-pl-unlocked csu-pl-msg\">\n    <div class=\"csu-pl-container\">\n        <div class=\"h4 csu-pl-lead text-center\">\n            <span class=\"glyphicon glyphicon-unlock\"></span>\n            <span class=\"csu-pl-unlocked-status\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677341\"></span>\n        </div>\n        <div class=\"csu-pl-msg-details media\">\n            <div class=\"pull-left text-center\">\n                <div class=\"csu-pl-teacher-avatar-wrapper\">\n                    <!--[if lte IE 8]>\n                        <vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n                            <vml:fill type=\"frame\" src=\"" + data.recommendedTeacher.avatar + "\"/>\n                        </vml:oval>\n                    <![endif]-->\n                    <span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n                        <img src=\"" + data.recommendedTeacher.avatar + "\">\n                    </span>\n                </div>\n                <div>\n                    <span class=\"glyphicon glyphicon-teacher\"></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673778\"></span>\n                </div>\n                <div class=\"csu-pl-teacher-name\">\n                    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.recommendedTeacher.name + "\"></span>\n                </div>\n            </div>\n            <div class=\"media-body\">\n                <p class=\"h4\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675884\"></p>\n                <p data-weave=\"campus-studyplan-ui/widget/blurb\" data-blurb-id=\"" + getContent() + "\" data-values='{\"name\": \"" + data.user.firstName + "\"}'>\n                </p>\n            </div>\n        </div>\n        <div class=\"text-center\">\n            <button type=\"button\" class=\"btn btn-primary btn-start-booking\">\n                <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677342\"></span>\n            </button>\n        </div>\n    </div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/unlocked/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'school-ui-studyplan/module',
	'when',
	'lodash',
	'../../../utils/member-site-setting'
], function(
	Widget,
	template,
	module,
	when,
	_,
	MemberSiteSetting
){
	'use strict';

	var userDeferred = when.defer();

	function addUnlockedPL(unlockedUnit, currentUnit){
		var seperator = ',';
		var arrUnlocked = unlockedUnit && unlockedUnit.split(seperator) || [];
		if(!_.contains(arrUnlocked, currentUnit + '')) {
			arrUnlocked.push(currentUnit);
		}
		return arrUnlocked.join(seperator);
	}

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
		me.queries = [userDeferred.promise];
		me.template = template;
		me.cacheServer = module.config().cacheServer;
	},{
		'sig/start': function(){
			var me = this;
			return me.query(me.queries).spread(function(){
				me.render.apply(me, arguments);
			});
		},

		'dom:.btn-start-booking/click': function(){
			var me = this;
			me.unlock();
		},

		'hub:memory/context': function(context) {
			userDeferred.resolve({
				user: context && context.user
			});
		},

		'render': function(){
			var me = this;
			var data = {
				recommendedTeacher: {
					avatar: me.cacheServer + '/juno/18/80/21/v/188021/teacher.jpg',
					name: 677343
				},
				feature: me.options.feature,
				topic: me.options.topic
			};
			_.forEach(arguments, function(o){
				_.assign(data, o);
			});
			return me.html(me.template(data));
		},

		'unlock': function(){
			var me = this;
			var key = 'UnlockedPLs';
			var value;
			me.getMemberSiteSetting(key).then(function(data){
				value = addUnlockedPL(data && data.value, me.options.topic.courseUnitId);
				me.saveMemberSiteSetting(key, value).then(function(){
					me.publish('studyplan/sequence-container/reload');
				});
			});
		}
	}, MemberSiteSetting);
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/welcome/main.html',[],function() { return function template(data) { var o = "<div class = \"csu-pl-welcome csu-pl-msg\">\n    <div class=\"csu-pl-container\">\n        <div class=\"h4 csu-pl-lead text-center\">\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"679461\"></span>\n        </div>\n        <div class=\"csu-pl-msg-details-wrapper clearfix\">\n            <div class=\"csu-pl-msg-details media pull-left\">\n                <div class=\"pull-left text-center\">\n                    <div class=\"csu-pl-teacher-avatar-wrapper\">\n                        <!--[if lte IE 8]>\n                            <vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n                                <vml:fill type=\"frame\" src=\"" + data.recommendedTeacher.avatar + "\"/>\n                            </vml:oval>\n                        <![endif]-->\n                        <span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n                            <img src=\"" + data.recommendedTeacher.avatar + "\">\n                        </span>\n                    </div>\n                    <div>\n                        <span class=\"glyphicon glyphicon-teacher\"></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673778\"></span>\n                    </div>\n                    <div class=\"csu-pl-teacher-name\">\n                        <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.recommendedTeacher.name + "\"></span>\n                    </div>\n                </div>\n                <div class=\"media-body\">\n                    <p class=\"h4\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"679462\"></p>\n                    <p data-weave=\"campus-studyplan-ui/widget/blurb\" data-blurb-id=\"675883\" data-values='{\"name\": \"" + data.user.firstName + "\"}'>\n                    </p>\n                </div>\n            </div>\n            <div class=\"pull-right\">\n                <a class=\"csu-pl-tutorial-video\">\n                    <img src=\"" + data.video.post + "\">\n                </a>\n                <div data-weave=\"school-ui-studyplan/widget/gl-pl/popupvideo/main\" data-video-url=\"" + data.video.url + "\"></div>\n            </div>\n        </div>\n        <div class=\"text-center\">\n            <button type=\"button\" class=\"btn btn-primary btn-start-booking\">\n                <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677342\"></span>\n            </button>\n        </div>\n    </div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-legacy/welcome/no-coupon-left.html',[],function() { return function template(data) { var o = "";
	function customizeBuyUrl(url){
		return url.replace(/upurl=\S*&?/, 'upurl=' + window.encodeURIComponent(window.location.href));
	}
o += "\n<div class = \"csu-pl-msg\">\n    <div class=\"csu-pl-container\">\n        <div class=\"row\">\n            <div class=\"col-xs-4 col-xs-offset-4\">\n                <div class=\"h4 csu-pl-lead text-center\">\n                    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675885\"></span>\n                </div>\n            </div>\n        </div>\n        <div class=\"csu-pl-msg-details media\">\n            <div class=\"pull-left text-center\">\n                <div class=\"csu-pl-teacher-avatar-wrapper\">\n                    <!--[if lte IE 8]>\n                        <vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n                            <vml:fill type=\"frame\" src=\"" + data.recommendedTeacher.avatar + "\"/>\n                        </vml:oval>\n                    <![endif]-->\n                    <span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n                        <img src=\"" + data.recommendedTeacher.avatar + "\">\n                    </span>\n                </div>\n                <div>\n                    <span class=\"glyphicon glyphicon-teacher\"></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673778\"></span>\n                </div>\n                <div class=\"csu-pl-teacher-name\">\n                    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.recommendedTeacher.name + "\"></span>\n                </div>\n            </div>\n            <div class=\"media-body\">\n                <p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677495\" data-values='{\"name\": \"" + data.user.firstName + "\"}'>\n                <p>\n                    <span data-weave=\"campus-studyplan-ui/widget/blurb\" data-blurb-id=\"679490\" data-values='{\"title\": \"<strong>" + data.translation.title + "</strong>\"}'></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.topic.description + "\"></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677496\"></span>\n                </p>\n            </div>\n        </div>\n\t\t"; if(data.feature.canBuyMore){ o += "\n\t\t\t<div class=\"text-center\">\n\t\t\t\t<a class=\"btn btn-primary btn-buy-coupon\" href=\"" + customizeBuyUrl(data.feature.buyUrl) + "\" data-blurb-id=\"675886\" data-weave=\"troopjs-ef/blurb/widget\">Buy more classes</a>\n\t\t\t</div>\n\t\t"; } o += "\n    </div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-legacy/welcome/main',[
	'campus-studyplan-ui/widget/pl-legacy/unlocked/main',
	'template!./main.html',
	'template!./no-coupon-left.html'
], function(
	Unlocked,
	template,
	templateNoCouponLeft
){
	'use strict';

	return Unlocked.extend(function($element, displayName, options){
		var me = this;
		if(me.options.feature && me.options.feature.couponLeft < 1) {
			me.template = templateNoCouponLeft;
			me.queries.push(me.query('blurb!' + me.options.topic.title).spread(function(data){
				return {
					translation: {
						title: data && data.translation
					}
				};
			}));
		} else {
			me.template = template;
			me.queries.push(me.query('media!167835').spread(function(data){
				return {
					video: {
						url: data && data.url,
						post: me.cacheServer + '/_imgs/evc/pl/studyplan/video.jpg'
					}
				};
			}));
		}
	},{
		'dom:.btn-start-booking/click': function(e){
			var me = this;
			var isCP20 = me.options.topic.classType === 'cp20';

			e.stopImmediatePropagation();

			if(isCP20){
				me.saveMemberSiteSetting('FirstTimeStudyPlanCP20', true);
				me.unlock();
			} else {
				me.saveMemberSiteSetting('FirstTimeStudyPlanPL', true).then(function(){
					me.publish('studyplan/sequence-container/reload');
				});
			}
		},

		'dom:.csu-pl-tutorial-video/click': function(){
			var me = this;
			me.publish('studyplan/evc/welcome-video/show');
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl-locked/main.html',[],function() { return function template(data) { var o = "<div class=\"campus-studyplan-ui\">\n\t<div class=\"csu-notification\" data-weave=\"school-ui-studyplan/widget/gl-pl/announcement/cp20\"></div>\n\t<div class=\"csu-pl-locked\">\n\t\t<div class=\"csu-pl-container\">\n\t\t\t<h4 class=\"csu-pl-lead text-center\">\n\t\t\t\t<span class=\"glyphicon glyphicon-lock-slim\"></span><span data-blurb-id=\"675987\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t</h4>\n\t\t\t<div class=\"csu-pl-locked-message\">\n\t\t\t\t<p data-blurb-id=\"675988\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t</div>\n\t\t\t<div class=\"text-center\">\n\t\t\t\t<button type=\"button\" data-blurb-id=\"675989\" data-weave=\"troopjs-ef/blurb/widget\" class=\"btn btn-primary btn-next-lesson\"></button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl-locked/main',[
	'troopjs-ef/component/widget',
	'template!./main.html'
], function(
	Widget,
	template
){
	'use strict';

	return Widget.extend(function($element, displayName, options){

	},{
		'sig/start': function(){
			var me = this;
			me.html(template());
		},

		'dom:.btn-next-lesson/click': function(){
			var me = this;
			me.publish('studyplan/sequence/navigate/suggest-item');
		}
	});
});
define('campus-studyplan-ui/widget/pl/GLPLStatus',{
	NEVERTAKE: "nevertake",
	BOOKED: "booked",
	DROPOUT: "dropout",
	PENDING: "pending",
	ATTENDED: "attended"
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/attended/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-attended\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"csu-pl-lead csu-pl-lead-with-time text-center\">\n\t\t\t<div>\n\t\t\t\t<span class=\"glyphicon glyphicon-passed\"></span>\n\t\t\t</div><!--\n\t\t\t--><div>\n\t\t\t\t<div class=\"h4\" data-blurb-id=\"676306\" data-weave=\"troopjs-ef/blurb/widget\"></div>\n\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"csu-pl-class-panel tabulation\">\n\t\t\t<div class=\"row\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"csu-pl-class-media media\">\n\t\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t\t<div class=\"csu-pl-profile\" data-weave=\"campus-studyplan-ui/widget/shared/pl-profile/main(options)\" data-options='" + JSON.stringify(data.bookedClass) + "'></div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"csu-pl-status-info\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<p class=\"csu-pl-status-info-title h4 csu-pl-status-info-title-highlight\" data-blurb-id=\"675996\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t\t<div>\n\t\t\t\t\t\t\t<a class=\"btn btn-primary btn-feedback-details\" data-blurb-id=\"675997\" data-weave=\"troopjs-ef/blurb/widget\"></a>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div><span>&nbsp;</span><!-- for vertical alignment -->\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/attended/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../../../utils/momentize',
	'lodash',
	'client-tracking'
], function(
	Widget,
	template,
	momentize,
	_,
	ct
){
	'use strict';

	var URL_FEEDBACK = {
		'cp20': '/school/progressreport#teacher-feedback?fb_id=CP20_',
		'pl': '/school/progressreport#teacher-feedback?fb_id=PL_'
	};

	function getFeedbackUrl(type, id){
		return URL_FEEDBACK[type] + id;
	}

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
		},

		'hub:memory/common_context': function(context) {
			var me = this;
			var languageCode;
			var startTime = '';

			if(context && context.values && me.options.bookedClass){
				languageCode = context.values.languagecode.value.toLowerCase();
				startTime = momentize(me.options.bookedClass.customizedStartTime, languageCode, 'START_TIME');
			}

			me.html(template(_.assign({
				startTime: startTime
			}, me.options)));
		},

		'dom:.btn-feedback-details/click': function(){
			var me = this;

			ct.useraction({
				'action.viewFeedBack': 1
			});

			window.open(getFeedbackUrl(me.options.topic.classType, me.options.feedback.feedbackId));
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/main.html',[],function() { return function template(data) { var o = "<div class=\"campus-studyplan-ui\">\n\t<div class=\"csu-notification\" data-weave=\"school-ui-studyplan/widget/gl-pl/announcement/" + data.topic.classType + "\"></div>\n\t<div data-weave=\"campus-studyplan-ui/widget/pl/" + data.statusCode + "/main(options) campus-studyplan-ui/widget/tracking\" data-options='" + JSON.stringify(data).replace(/\'/g, "&#39;") + "'></div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/base',[
	'troopjs-ef/component/widget',
	'template!./main.html',
    'school-ui-studyplan/module',
	'jquery',
	'lodash',
	'when',
	'../../utils/member-site-setting',
	'client-tracking',
	'./GLPLStatus',
	'../../utils/vml'
], function(
	Widget,
	template,
	module,
	$,
	_,
	when,
	MemberSiteSetting,
	ct,
	GLPLStatus
){
	'use strict';

	var SETTINGS_KEYS = {
		UNLOCKED: 'UnlockedPLs'
	};

	var URL_KEYS = {
		pl: {
			BOOKING: 'SPPL40BookingV2',
			ENTERING: 'SPPL40Entering'
		},
		cp20: {
			BOOKING: 'CP20BookingV2',
			ENTERING: 'CP20Entering'
		}
	};

	var CLASS_STATUS = {
		WELCOME: 'welcome',
		UNLOCKED: 'unlocked',
		NEVER_TAKE: 'nevertake',
		NO_COUPON_LEFT: 'nocouponleft'
	};

	function createEvcUrl(url, unitId, classId){
		url = (url || '').replace(/{unitId}/i, unitId);
		if (classId) {
			url = url.replace(/{classId}/i, classId);
		}
		return url;
	}

	function getEvcUrls(urls, type, unitId, classId){
		var KEYS = URL_KEYS[type];
		if(urls) {
			return {
				booking: createEvcUrl(urls[KEYS.BOOKING], unitId),
				entering: createEvcUrl(urls[KEYS.ENTERING], unitId, classId)
			};
		}
	}

	function isUnlocked(unlockedUnit, currentUnit){
		var arrUnlocked = unlockedUnit && unlockedUnit.split(',');
		return _.contains(arrUnlocked, currentUnit + '');
	}

	function getTopicImageUrl(url){
		var cacheServer = module.config().cacheServer;
		if(!url){
			return cacheServer + '/_imgs/evc/pl/pl_default_100x100.png';
		}
		return cacheServer + '/_imgs/evc/pl/topic/238x238/' + url;
	}
	
	function isPast(easternEndTime) {
		if (!easternEndTime) {
			return;
		}
		return new Date() >= new Date(easternEndTime);
	}

	return Widget.extend(function($element, displayName, options){
			var me = this;
			me.deferredFeature = when.defer();
	},{
		'sig/start': function(){
			ct.pagename('One-Click PL');
		},

		'hub:memory/load/unit': function(unit) {
			var me = this;
			var data;
			var isCP20 = me.options.classType === 'cp20';
			var classQueryStr = 'studyplan_evc_class!' + unit.templateUnitId + ';' + me.options.classType;
			
			me.query(classQueryStr).spread(function(evcClass) {
				var result = {};

				if(typeof evcClass.state === 'string'){
					result.statusCode = evcClass.state.toLowerCase();
					result.classType = evcClass.classType;
				}

				switch(result.statusCode){
					case GLPLStatus.BOOKED:
						return me.query(classQueryStr + '.classDetail,.classDetail.teacher').spread(function(data) {
							result.classDetails = data && data.classDetail;

							// change status from 'booked' to 'pending' after class is past
							// because the status need time to sync from evc to school
							if (result.classDetails && isPast(result.classDetails.easternEndTime)) {
								result.statusCode = GLPLStatus.PENDING;
							}
							return result;
						});
					case GLPLStatus.PENDING:
					case GLPLStatus.ATTENDED:
						return me.query(classQueryStr + '.classDetail,.classDetail.teacher').spread(function(data){
							result.classDetails = data && data.classDetail;
							return result;
						});
					default:
						// PL/CP20
						if(evcClass.topic){
							return me.query(classQueryStr + '.topic,.classDetail').spread(function(data){
								result.classDetails = _.assign({}, data.topic, data.classDetail);
								return result;
							});
						}
				}
			}).then(function(plclass) {
				return me.query('evc_url_resource!current',
					me.deferredFeature.promise,
					isCP20 ? me.getMemberSiteSetting(SETTINGS_KEYS.UNLOCKED) : undefined,
					'campus_mypage_isf2fstudent!current'
				).spread(function(urls, feature, firstTimeStudy, unlocked, f2f) {
					if(!plclass || !plclass.classDetails) {
						return;
					}

					data = _.clone(plclass, true);

					data.statusCode = data.statusCode.toLowerCase();
					data.feature = feature;
					data.evcUrls = getEvcUrls(urls && urls.studyPlanUrls, me.options.classType, unit.legacyUnitId);
					data.topic = {
						courseUnitId: unit.legacyUnitId,
						title: plclass.classDetails.topic.topic,
						description: plclass.classDetails.topic.description,
						image: getTopicImageUrl(plclass.classDetails.topic.imageUrl || plclass.classDetails.topic.topicImageUrl),
						classType: me.options.classType
					};
					if(data.classDetails){
						data.bookedClass = data.classDetails;
					}
					_.assign(data.bookedClass, {
						durationForStudent: me.options.durationMinutes
					});

					// reset class status
					if(data.statusCode === CLASS_STATUS.NEVER_TAKE) {
						if(data.feature && data.feature.couponLeft < 1){
							data.statusCode = CLASS_STATUS.NO_COUPON_LEFT;
						}
						if(unlocked && !isUnlocked(unlocked.value, data.topic.courseUnitId)&&!f2f.isF2fStudent){
							data.statusCode = CLASS_STATUS.UNLOCKED;
						}
					} else if (data.statusCode === CLASS_STATUS.WELCOME) {
						data.statusCode = CLASS_STATUS.NEVER_TAKE;
					}

					me.html(template(data));
				});
			});
		}
	}, MemberSiteSetting);
});


define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/booked/class-entrance/main.html',[],function() { return function template(data) { var o = "";
	function getStatus(){
		if(data.disabled){
			return "btn-disabled";
		} else {
			return "btn-primary";
		}
	}
o += "\n\n<button type=\"button\" class=\"btn btn-entrance " + getStatus() + "\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675337\">Enter class</button>"; return o; }; });
define('campus-studyplan-ui/widget/pl/booked/class-status',{
	NOT_YET: 'notyet',
    IN_COUNTDOWN: 'incountdown',
    OPEN_SOON: 'opensoon',
    STARTED: 'started'
});
define('campus-studyplan-ui/widget/pl/booked/class-entrance/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../class-status'
], function(
	Widget,
	template,
	CLASS_STATUS
){
	'use strict';

	function createEvcEnteringUrl(url) {
		return url
			.replace('?', '?showcontentonly=y&') // add search key 'showcontentonly' to skip new PL booking page redirect logic
			.replace('{source}', window.encodeURIComponent(window.location.href));
	}


	return Widget.extend(function($element, displayName, url){
		var me = this;
		me.url = url;
	},{
		'sig/start': function(){
		},

		'hub/campus/studyplan/pl/status': function(classStatus){
			var me = this;

			switch(classStatus){
				case CLASS_STATUS.OPEN_SOON:
					me.html(template({
						disabled: true
					}));
					break;
				case CLASS_STATUS.STARTED:
					me.html(template({
						disabled: false
					}));
					break;
			}
		},

		'dom:.btn-primary.btn-entrance/click': function(){
			var me = this;
			window.open(createEvcEnteringUrl(me.url), '_self');
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/booked/class-status/main.html',[],function() { return function template(data) { var o = "<p data-blurb-id=\"" + data.blurbId + "\" data-weave=\"troopjs-ef/blurb/widget\" class=\"csu-pl-status-info-title h4 " + data.className + "\"></p>"; return o; }; });
define('campus-studyplan-ui/widget/pl/booked/class-status/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../class-status'
], function(
	Widget,
	template,
	CLASS_STATUS
){
	'use strict';

	function getClassStatusBlurbId(status){
		switch(status) {
			case CLASS_STATUS.STARTED:
				return 674823;
			case CLASS_STATUS.OPEN_SOON:
				return 674824;
			default:
				return 674825;
		}
	}

	function getClassName(status){
		switch(status) {
			case CLASS_STATUS.STARTED:
			case CLASS_STATUS.OPEN_SOON:
				return 'csu-pl-status-info-title-highlight';
			default:
				return '';
		}
	}


	return Widget.extend(function($element, displayName, options){
	},{
		'sig/start': function(){
		},

		'hub/campus/studyplan/pl/status': function(status){
			var me = this;
			me.html(template({
				blurbId: getClassStatusBlurbId(status),
				className: getClassName(status)
			}));
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/booked/countdown/main.html',[],function() { return function template(data) { var o = "<div>\n\t<div>%H<span>|</span></div>\n\t<div>hour</div>\n</div><!--\n--><div>\n\t<div>%M<span>|</span></div>\n\t<div>min</div>\n</div><!--\n--><div>\n\t<div>%S</div>\n\t<div>sec</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/booked/countdown/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../class-status',
	'jquery',
	'moment',
	'jquery.countdown'
], function(
	Widget,
	template,
	CLASS_STATUS,
	$,
	moment
){
	'use strict';

	var HOURS_PER_DAY = 24;
	var MINUTES_PER_HOUR = 60;
	var SECONDS_PER_MINUTE = 60;

	var strTemplate = template();

	function getCurrentStatus(secondsLeft){
		if(secondsLeft > 30 * SECONDS_PER_MINUTE) {
			return CLASS_STATUS.NOT_YET;
		} else if(secondsLeft < 1) {
			return CLASS_STATUS.STARTED;
		} else if(secondsLeft < 10 * SECONDS_PER_MINUTE){
			return CLASS_STATUS.OPEN_SOON;
		} else {
			return CLASS_STATUS.IN_COUNTDOWN;
		}
	}

	return Widget.extend(function($element, displayName, service){
		var me = this;
		me.service = service;
	},{
		'sig/start': function(){
			var me = this;
			me.checkClassStatus().then(function(currentStatus){
				me.updateStatus(currentStatus);
				me.render();
			});
		},

		'checkClassStatus': function(){
			var me = this;
			var countdown;
			var secondsLeft = 0;
			return me.query(me.service).spread(function(plclass){
				countdown = plclass && (plclass.countdown || plclass.countDown);
				if(countdown){
					secondsLeft = countdown.secondsLeftForStart;
					me.finalDate = moment()
						.add(secondsLeft, 'seconds')
						.format('YYYY/MM/DD HH:mm:ss');
				}
				return getCurrentStatus(secondsLeft);
			});
		},

		'updateStatus': function(currentStatus){
			var me = this;
			me.currentStatus = currentStatus;
			me.publish('campus/studyplan/pl/status', me.currentStatus);
		},

		'render': function(){
			var me = this;
			if(me.currentStatus === CLASS_STATUS.STARTED) {
				me.$element.remove();
			} else {
				me.countdown();
			}
		},

		'countdown': function(){
			var me = this;
			me.$element.countdown(me.finalDate)
				.on('update.countdown', function(event){
					var secondsLeft = ((event.offset.totalDays *
						HOURS_PER_DAY + event.offset.hours) *
						MINUTES_PER_HOUR + event.offset.minutes) *
						SECONDS_PER_MINUTE + event.offset.seconds;
					var currentStatus = getCurrentStatus(secondsLeft);
					var statusChanged = currentStatus !== me.currentStatus;
					var hasVisibleCountdown = currentStatus === CLASS_STATUS.IN_COUNTDOWN || 
												currentStatus === CLASS_STATUS.OPEN_SOON;
					if(statusChanged && 
						// will double check status 'started' in event 'finish.countdown'
						currentStatus !== CLASS_STATUS.STARTED) {
						me.updateStatus(currentStatus);
					}

					if(hasVisibleCountdown){
						me.$element.html(event.strftime(strTemplate));
					}					
				})
				.on('finish.countdown', function(){
					// handle time difference
					// between client side and server side
					me.checkClassStatus().then(function(currentStatus){
						me.updateStatus(currentStatus);
						me.render();
					});
				});				
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/booked/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-booked\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"h4 csu-pl-lead text-center\">\n\t\t\t<span class=\"glyphicon glyphicon-booked\"></span>\n\t\t\t<span data-blurb-id=\"568587\" data-weave=\"troopjs-ef/blurb/widget\">Class Booked</span>\n\t\t</div>\n\t\t<div class=\"csu-pl-class-panel tabulation\">\n\t\t\t<div class=\"row\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"csu-pl-class-media media\">\n\t\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t\t<div class=\"media-body-inner-wrapper\">\n\t\t\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t\t\t\t\t\t<div class=\"csu-pl-profile\" data-weave=\"campus-studyplan-ui/widget/shared/pl-profile/main(options)\" data-options='" + JSON.stringify(data.bookedClass).replace(/\'/g, "&#39;") + "'></div>\n\t\t\t\t\t\t\t\t<ul class=\"csu-pl-booked-links clearfix\">\n\t\t\t\t\t\t\t\t\t<li>\n\t\t\t\t\t\t\t\t\t\t<a class=\"csu-pl-link csu-pl-link-cancel\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568585\" data-toggle=\"tooltip\" data-placement=\"bottom\" title=\"" + data.notice + "\">Cancel you booking</a>\n\t\t\t\t\t\t\t\t\t</li>\n\t\t\t\t\t\t\t\t\t"; if(data.calendarReminderEnabled){ o += "\n\t\t\t\t\t\t\t\t\t\t<li>\n\t\t\t\t\t\t\t\t\t\t\t<a class=\"csu-pl-link csu-pl-link-reminder\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675993\">SAVE TO CALENDAR</a>\n\t\t\t\t\t\t\t\t\t\t</li>\n\t\t\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"csu-pl-status-info\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<div data-weave=\"campus-studyplan-ui/widget/pl/booked/countdown/main(" + data.id + ")\" class=\"csu-pl-booked-countdown\"></div>\n\t\t\t\t\t\t<div data-weave=\"campus-studyplan-ui/widget/pl/booked/class-status/main\"></div>\n\t\t\t\t\t\t<div data-weave=\"campus-studyplan-ui/widget/pl/booked/class-entrance/main(url)\" data-url=\"" + data.evcUrls.entering + "\"></div>\n\t\t\t\t\t</div><span>&nbsp;</span><!-- for vertical alignment -->\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"row\">\n\t\t\t<div class=\"col-xs-6 col-xs-offset-3\">\n\t\t\t\t<div class=\"csu-pl-sms-reminder\" data-weave=\"campus-studyplan-ui/widget/pl/booked/sms-reminder/main(" + data.id + ")\"></div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"cpbc-inner-wrapper\">\n\t\t\t<div class=\"h4 csu-pl-lead text-center\">\n\t\t\t\t<span class=\"glyphicon glyphicon-booked\"></span>\n\t\t\t\t<span data-blurb-id=\"568587\" data-weave=\"troopjs-ef/blurb/widget\">Class Booked</span>\n\t\t\t</div>\n\t\t\t<div class=\"csu-pl-class-panel\">\n\t\t\t\t<div class=\"csu-pl-class-media media clearfix\">\n\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t\t\t\t<div class=\"csu-pl-booked-reminder\">\n\t\t\t\t\t\t\t<div data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"674463\">Are you sure you want to cancel the class?</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"csu-pl-booked-buttons\">\n\t\t\t\t\t\t\t<button type=\"button\" class=\"btn btn-primary btn-pl-keep\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"674464\">No, keep the class</button><!--\n\t\t\t\t\t\t\t--><button type=\"button\" class=\"btn btn-default btn-pl-cancel\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"674465\">Yes, cancel the class</button>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/booked/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'lodash',
	'when',
	'../../../utils/momentize',
    'troopjs-ef/command/service',
    'troopjs-data/cache/component',
    './class-status',
    '../../../utils/widgetCreator',
    '../../../utils/fancybox',
    'client-tracking',
    'moment'
], function(
	Widget,
	template,
	_,
	when,
	momentize,
	CommandService,
	Cache,
	CLASS_STATUS,
	widgetCreator,
	fancybox,
	ct,
	moment
){
	'use strict';

	var COMMAND;
	var MEMBER_SITE_SETTING = {
		'SUBBED_OUT_MESSAGE': {
			'SITEAREA': 'OCB',
			'KEYCODE': 'PLTeacherCancellationMessages'
		}
	};
	var REMINDER_LINK = '/school/evc/pl/outlook?class_id=';
	var STYLE_CANCELLATION = 'csu-pl-booked-cancellation';

	var CANCEL_KEY = 'bookingCancelledBy_';
	var storage = window.localStorage;
	var contextDeferred = when.defer();
	var userDeferred = when.defer();

	function removeElement(array, element){
		var temp = array.slice(0);
		_.remove(temp, function(val){
			return val === element + '';
		});
		return temp;
	}

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;

        if (!COMMAND) {
            // Create new CommandService
            COMMAND = new CommandService('plbooking/cancel', new Cache());
            // Configure
            COMMAND.configure({
                'url': '/services/school/command/plbooking/cancel',
                'contentType': 'application/json; charset=UTF-8',
                'type': 'post'
            });
            COMMAND.start();
        }
	},{
		'sig/start': function(){
			var me = this;
			var languageCode;
			var startTime;
			var cancelTime;
			var notice;
			me.query(contextDeferred.promise, userDeferred.promise,
				'blurb!639584',
				'member_site_setting!' +
					MEMBER_SITE_SETTING.SUBBED_OUT_MESSAGE.SITEAREA + ';' +
					MEMBER_SITE_SETTING.SUBBED_OUT_MESSAGE.KEYCODE,
				'ccl!"School.EVC.Reminder.Switch"')
			.spread(function(context, user, blurb, setting, ccl){
				if(user && user.member_id){
					me.member_id = user.member_id;
				}
				languageCode = context.languagecode.value.toLowerCase();
				startTime = momentize(me.options.bookedClass.customizedStartTime, languageCode, 'START_TIME');
				cancelTime = momentize(me.options.bookedClass.suggestedCancelTime, languageCode, 'CANCEL_TIME');
				notice = blurb.translation
					.replace('%%Canceltime%%', cancelTime)
					.replace('%%timezone%%', me.options.bookedClass.timezoneId);
				me.html(template(_.assign({
					startTime: startTime,
					notice: notice,
					calendarReminderEnabled: ccl && ccl.value === 'true'
				}, me.options))).then(function(){
					me.$element.find('.csu-pl-link-cancel').tooltip();
					me.$content = me.$element.find('.csu-pl-booked');

					// for subbed out message when the class was cancelled by teacher
					me.isSubbedOut = me.options.bookedClass.teacherId === -1;
					if(me.isSubbedOut) {
						me.readMessages = setting && setting.value ? setting.value.split(',') : [];
						me.messageIsRead = _.contains(me.readMessages, me.options.bookedClass.classId + '');
						if(!me.messageIsRead) {
							me.showTeacherCancellationMessage();
						}
					}
				});
			});
		},

		'hub:memory/common_context': function(context) {
			contextDeferred.resolve(context && context.values);
		},

		'hub:memory/context': function(context) {
			userDeferred.resolve(context && context.user);
		},

		'hub/campus/studyplan/pl/status': function(status){
			var me = this;
			if(status === CLASS_STATUS.STARTED) {
				me.$element.find('.csu-pl-booked-links').remove();
			}
		},

		'dom:.csu-pl-link-cancel/click': function(){
			var me = this;
			me.toggleCancellation();
		},

		'dom:.csu-pl-link-reminder/click': function(){
			var me = this;
			window.open(REMINDER_LINK + me.options.bookedClass.classId, '_self');
		},

		'dom:.btn-pl-keep/click': function(){
			var me = this;
			me.toggleCancellation();
		},

		'dom:.btn-pl-cancel/click': function(){
			var me = this;

			ct.useraction({
				'action.cancelClass': 1
			});

			me.$element.trigger('task',me.publish('plbooking/cancel', {
				'class_id': me.options.bookedClass.classId
			}).spread(function(result){
				if(result[0].isSuccess) {
					if(me.isSubbedOut && me.messageIsRead){
						me.saveSetting(removeElement(me.readMessages, me.options.bookedClass.classId));
					}

					// Publish cancel status to school
					me.publish('studyplan/sequence/update');
					// Reload current studyplan content
					me.publish('studyplan/sequence-container/reload');
					// Set operation flag , 1 reprents booking class is canceled by student
					storage.setItem(CANCEL_KEY + me.options.topic.courseUnitId + me.member_id, 1 + '#' + moment().utc().format('YYYY-MM-DD HH:mm:ss'));
				}
			}));
		},

		'showTeacherCancellationMessage': function(){
			var me = this;
			var $message = widgetCreator({
				'campus-studyplan-ui/widget/shared/alert/main': {
					'title': 677631,
					'content': 677503,
					'action': 677505
				}
			});
			$message.weave().then(function(){
				fancybox.open({
					content: $message,
					afterClose: function(){
						me.saveSetting(me.readMessages.concat(me.options.bookedClass.classId));
					}
				});
			});
		},

		'saveSetting': function(readMessages){
			var me = this;
			return me.publish('school/member_site_setting/Save', {
				siteArea: MEMBER_SITE_SETTING.SUBBED_OUT_MESSAGE.SITEAREA,
				keyCode: MEMBER_SITE_SETTING.SUBBED_OUT_MESSAGE.KEYCODE,
				keyValue: readMessages.join(',')
			}).then(function(){
				me.readMessages = readMessages;
			});
		},

		'toggleCancellation': function(){
			var me = this;
			me.$content.toggleClass(STYLE_CANCELLATION);
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/booked/sms-reminder/main.html',[],function() { return function template(data) { var o = "<form class=\"cpsr-input-form\">\n\t<p class=\"cpsr-notice\">\n\t\t<span data-blurb-id=\"677499\" data-weave=\"troopjs-ef/blurb/widget\" data-values='{ \"hours\": " + data.sendMsgXHoursBeforeClass + "}'></span> <a data-blurb-id=\"132214\" data-weave=\"troopjs-ef/blurb/widget\" class=\"cpsr-privacy-policy\" href=\"\"></a>\n\t</p>\n\t<div>\n\t\t<p class=\"cpsr-lead\" data-blurb-id=\"677501\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t<div class=\"clearfix\">\n\t\t\t<div class=\"cpsr-mobile-number\">\n\t\t\t\t<input class=\"cpsr-mobile-number-input\" style=\"padding-left: " + (data.phoneNumberCountryCode.length+2)/2 + "em;\" type=\"text\" id=\"phoneNumber\" name=\"phoneNumber\">\n\t\t\t\t<span class=\"cpsr-country-code\">+" + data.phoneNumberCountryCode + "</span>\n\t\t\t</div>\n\t\t\t<div class=\"cpsr-request-reminder\">\n\t\t\t\t<button class=\"btn-link btn-link-request\" type=\"submit\"><span data-blurb-id=\"677502\" data-weave=\"troopjs-ef/blurb/widget\"></span> <span class=\"glyphicon glyphicon-arrow-primary\"></span></button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</form>"; return o; }; });

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/booked/sms-reminder/filled-out.html',[],function() { return function template(data) { var o = "";
	function isChecked(){
		return data.hasSubscribed ? 'checked' : '';
	}
o += "\n<div class=\"cpsr-subscribe\">\n\t<div class=\"cpsr-subscribe-inner-wrapper\">\n\t\t<input class=\"cpsr-subscribe-checkbox\"  type=\"checkbox\" id=\"subscribe\" " + isChecked() + ">\n\t</div>\n\t<div class=\"cpsr-subscribe-inner-wrapper\">\n\t\t<label class=\"cpsr-subscribe-label\" data-blurb-id=\"680354\" data-weave=\"troopjs-ef/blurb/widget\" data-values='{ \"telephone\": \"+" + data.phoneNumber + "\" }'></label>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/booked/sms-reminder/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'template!./filled-out.html',
    'troopjs-ef/command/service',
    'troopjs-data/cache/component',
	'lodash',
	'jquery',
	'jquery.validate'
], function(
	Widget,
	template,
	templateFiiledOut,
	CommandService,
	Cache,
	_,
	$
){
	'use strict';

	var COMMAND;
	var REMINDER_HIDE_TIME = 5*60*60;

	function convertToObject(arr){
		var keys = _.pluck(arr, 'name');
		var values = _.pluck(arr, 'value');
		return _.zipObject(keys, values);
	}

	return Widget.extend(function($element, displayName, serivce){
		var me = this;
		me.serivce = serivce;
        if (!COMMAND) {
            // Create new CommandService
            COMMAND = new CommandService('sms_reminder/UpdateSetting', new Cache());
            // Configure
            COMMAND.configure({
                'url': '/services/api/campuscore/command/sms_reminder/UpdateSetting',
                'contentType': 'application/json; charset=UTF-8',
                'type': 'post'
            });
            COMMAND.start();
        }
	},{
		'sig/start': function(){
			var me = this;
			me.query('sms_reminder!current', me.serivce).spread(function(data, classes){
				me.reminder = data && data.studentInfo;
				var coundown = classes && (classes.countdown || classes.countDown);
				me.secondsLeftForStart = coundown.secondsLeftForStart;
				me.render();
			});
		},

		'dom/submit': function(e){
			var me = this;
			var param = convertToObject($(e.target).serializeArray());
			e.preventDefault();
			_.assign(param, {
				phoneNumber: me.reminder.phoneNumberCountryCode + param.phoneNumber,
				subscribe: true
			});
			me.publish('sms_reminder/UpdateSetting', param).spread(function(result){
				if(result && result[0] && result[0].isSuccess){
					_.assign(me.reminder, {
						phoneNumber: param.phoneNumber,
						hasSubscribed: true
					});
					me.render();
				}
			});
		},

		'dom:.cpsr-privacy-policy/click': function(e){
			e.preventDefault();
			window.open(
				'/partner/corp/privacy.aspx',
				'help',
				'width=640,height=600,resizable,scrollbars'
			);
		},

		'dom:.cpsr-subscribe-checkbox/change': function(e){
			var me = this;
			var checked = $(e.target).prop('checked');
			me.publish('sms_reminder/UpdateSetting', {
				subscribe: checked
			}).spread(function(result){
				if(result && result[0] && result[0].isSuccess){
					_.assign(me.reminder, {
						hasSubscribed: checked
					});
					me.render();
				}
			});
		},

		'render': function(){
			var me = this;
			var regex;
			if(me.secondsLeftForStart < REMINDER_HIDE_TIME){
				return;
			}
			if(me.reminder && me.reminder.enableSmsReminder){
				if(me.reminder.phoneNumber){
					return me.html(templateFiiledOut(me.reminder));
				}
				else {
					return me.query('blurb!680352', 'blurb!680353').spread(function(invalid, missing){						
						return me.html(template(me.reminder)).then(function(){
							regex = new RegExp(me.reminder.phoneNumberValidationRegex);

							$.validator.addMethod('campusSmsNumber', function (value, element) {
								return this.optional(element) || regex.test(value);
							}, 'Invalid phone number');

							me.$element.find('.cpsr-input-form').validate({
								rules: {
									phoneNumber: {
										required: true,
										campusSmsNumber: true
									}
								},
								messages: {
									phoneNumber: {
										required: missing && missing.translation,
										campusSmsNumber: invalid && invalid.translation
									}
								}
							});
						});
					});
				}
			}
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/booked/techcheck/main.html',[],function() { return function template(data) { var o = "<p class=\"csu-pl-status-info-description\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.notice + "\"></p>\n<button type=\"button\" class=\"btn btn-primary btn-tech-check\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675336\">Complete tech check</button>"; return o; }; });
define('campus-studyplan-ui/widget/pl/booked/techcheck/main',[
	'troopjs-ef/component/widget',
	'troopjs-core/pubsub/hub',
	'template!./main.html',
	'school-ui-studyplan/utils/client-storage',
	'../class-status',
	'when',
	'client-tracking'
], function(
	Widget,
	Hub,
	template,
	clientStorage,
	CLASS_STATUS,
	when,
	ct
){
	'use strict';

	var STATUS_PASSED = 'passed';

	var deferredCheckingEnabled = when.defer();

	function getNotice(currentStatus){
		switch (currentStatus) {
			case CLASS_STATUS.NOT_YET:
				return 675334;
			case CLASS_STATUS.STARTED:
				return 675335;
			default:
				return 675333;
		}
	}

	function checkTechCheckEnabled(enabled){
		deferredCheckingEnabled.resolve(enabled);
	}

	return Widget.extend(function($element, displayName, options){

	},{
		'sig/start': function(){
			// reemit(event, senile, context, callback)
			Hub.on('plugins/tech-check/enable', Hub, checkTechCheckEnabled);
			Hub.reemit('plugins/tech-check/enable', true, Hub, checkTechCheckEnabled);
			Hub.off('plugins/tech-check/enable', Hub, checkTechCheckEnabled);			
		},

		'hub/campus/studyplan/pl/status': function(classStatus){
			var me = this;
			var passed = clientStorage.getSessionStorage('techcheck_state') === STATUS_PASSED;

			me.classStatus = classStatus;

			deferredCheckingEnabled.promise.then(function(enabled){
				if(!enabled || passed) {
					me.publish('campus/studyplan/techcheck/passed', me.classStatus);
				} else {
					me.render();
				}
			});
		},

		'dom:.btn-tech-check/click': function(){
			var me = this;
			var host;

			ct.useraction({
				'action.techCheck': 1
			});

			me.query('ccl!"evc.classroom.host"').spread(function (ccl) {

				host = ccl && ccl.value;

				if(!host) {
					return;
				}

				me.publish('tech-check/request',[
						{
							id: 'flash-install'
						},
						{
							id: 'flash-setting',
							reload: false
						},
						{
							id: 'chrome-auth'
						},
						{
							id: 'check-audio'
						}
					],{
						flashPath: window.location.protocol + '//' + host + '/techcheck{version,-}/default/techcheck-{version}.swf'
					}
				).then(function success(config) {
					// save passed session
					clientStorage.setSessionStorage('techcheck_state', STATUS_PASSED);
					clientStorage.setSessionStorage('legacy_techcheck_state', true);

					// need continue to switch status of 'enter class' button
					// the element can't be removed
					me.$element.html('');

					me.publish('campus/studyplan/techcheck/passed', me.classStatus);
				});
			});
		},

		'render': function(){
			var me = this;
			me.html(template({
				notice: getNotice(me.classStatus)
			}));
		}
	});
});
define('campus-studyplan-ui/widget/pl/cp20',[
	'./base'
], function(
	PL
){
	'use strict';

	return PL.extend(function($element, displayName, options){
		var me = this;
		me.options = {
			durationMinutes: 20,
			classType: 'cp20'
		};
		me.deferredFeature.resolve();
	},{
		'sig/start': function(){
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/dropout/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-dropout\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"h4 csu-pl-lead text-center\">\n\t\t\t<span class=\"glyphicon glyphicon-alert\"></span>\n\t\t\t<span data-blurb-id=\"675998\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t</div>\n\t\t<div class=\"csu-pl-class-panel tabulation\">\n\t\t\t<div class=\"row\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"csu-pl-class-media media\">\n\t\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span>" + data.topic.title + "</span>\n\t\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t\t\t\t\t <div class=\"csu-pl-profile\" data-weave=\"campus-studyplan-ui/widget/shared/pl-profile/main(options)\" data-options='" + JSON.stringify(data.bookedClass) + "'></div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"csu-pl-status-info\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<p class=\"h4 csu-pl-status-info-title\" data-blurb-id=\"675999\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t\t<p class=\"csu-pl-status-info-description\">\n\t\t\t\t\t\t\t<span data-blurb-id=\"676422\" data-weave=\"campus-studyplan-ui/widget/blurb\"></span><br/><strong data-blurb-id=\"676000\" data-weave=\"campus-studyplan-ui/widget/blurb\"></strong>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<div>\n\t\t\t\t\t\t\t<a class=\"btn-link\" href=\"/customerservice/contactus/inschool\" target=\"_blank\" data-blurb-id=\"676423\" data-weave=\"troopjs-ef/blurb/widget\"></a>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div><span>&nbsp;</span><!-- for vertical alignment -->\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/dropout/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../../../utils/momentize',
	'lodash'
], function(
	Widget,
	template,
	momentize,
	_
){
	'use strict';

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
		},

		'hub:memory/common_context': function(context) {
			var me = this;
			var languageCode;
			var startTime = '';

			if(context && context.values && me.options.classDetails){
				languageCode = context.values.languagecode.value.toLowerCase();
				startTime = momentize(me.options.classDetails.startTime, languageCode, 'START_TIME');
			}

			me.html(template(_.assign({
				startTime: startTime
			}, me.options)));
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/nevertake/no-recommendation.html',[],function() { return function template(data) { var o = "";
	function getUrl(){
		return data.evcUrls.booking
			.replace('{source}', window.encodeURIComponent(window.location.href) || '')
			.replace('{token}', data.studyplanItemToken || '')
			.replace('{partner}', data.classRecommendation.classPartnerCode || '')
			.replace('{tid}', '');
	}
o += "\n<div class=\"csu-pl-msg-with-topic\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"csu-pl-topic\">\n\t\t\t<div class=\"media\">\n\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t<img class=\"media-object\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t</h4>\n\t\t\t\t\t<p data-blurb-id=\"" + data.topic.description + "\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t<p data-blurb-id=\"673773\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"text-center\">\n\t\t\t<p class=\"csu-pl-msg-lead\" data-blurb-id=\"681900\" data-weave=\"troopjs-ef/blurb/widget\">Unfortunately we were not able to recommend you a teacher within the next 7 days. Please visit the booking calendar to view further options.</p>\n\t\t\t<a class=\"btn btn-primary btn-calendar\" href=\"" + getUrl() + "\" data-blurb-id=\"681901\" data-weave=\"troopjs-ef/blurb/widget\">Go to calendar</a>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/nevertake/main',[
	'troopjs-ef/component/widget',
	'template!./no-recommendation.html',
	'when',
	'lodash',
	'jquery',
	'../../../utils/widgetCreator',
	'../../../utils/fancybox',
	'moment'
], function(
	Widget,
	template,
	when,
	_,
	$,
	widgetCreator,
	fancybox,
	moment
){
	'use strict';

	var SORT_KEY = 'Id';
	var REGEX_OFFSET = /UTC([+-]\d{2}:\d{2}){0,1}/;
	var CANCEL_KEY = 'bookingCancelledBy_';
	var MIN_DATE = '1900-01-01 00:00:00';
	var storage = window.localStorage;
	var userDeferred = when.defer();

	function getTimezoneList(){
		var listDeferred = when.defer();
		$.get('/school/evc/pl/gettimezonelist', function(data){
			if(data && data.TimeZone){
				listDeferred.resolve(data.TimeZone);
			}
		});
		return listDeferred.promise;
	}

	function createViewData(timezone){
		var arrOffset = REGEX_OFFSET.exec(timezone.DisplayName);
		return {
			id: timezone.Id,
			offset: timezone.Offset,
			displayOffset: arrOffset && arrOffset[0]
		};
	}

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
			var me = this;

			me.getTimezone().then(function(currentTimezone){
				me.render(currentTimezone);
			});
		},

		'hub:memory/load/studyplan_item': function(studyplanItem){
			var me = this;
			me.studyplanItem = studyplanItem;
			me.studyplanItemToken = me.studyplanItem &&
									me.studyplanItem.progress &&
									me.studyplanItem.progress.properties &&
									me.studyplanItem.progress.properties.token || '';
		},

		'hub:memory/context': function(context) {
			userDeferred.resolve(context && context.user);
		},

		'dom/timezoneChange': function(e, currentTimezone){
			var me = this;
			me.render(currentTimezone);
		},

		'getTimezone': function(){
			var me = this;
			var today;
			var offset;
			var currentTimezone;
			var deferred = when.defer();

			return me.query(
				'member_site_setting!EVC;TimeZone',
				getTimezoneList()
			).spread(function(setting, list){
				if(list && list.length) {
					me.timezoneList = _.map(_.sortBy(list, SORT_KEY), createViewData);

					// timezone in membersitesetting
					if(setting && setting.value){
						currentTimezone = _.find(me.timezoneList, {
							'id': setting.value
						});
						deferred.resolve(currentTimezone);
					}
					// local timezone
					else {
						today = new Date();
						offset = today.getTimezoneOffset() * -1;
						currentTimezone = _.find(me.timezoneList, {
							'offset': offset
						});
						me.saveTimezone(currentTimezone.id).then(function(){
							deferred.resolve(currentTimezone);
						});
					}
				}
				return deferred.promise;
			});
		},

		'saveTimezone': function(timezoneId){
			var me = this;
			return me.publish('school/member_site_setting/Save', {
				siteArea: 'EVC',
				keyCode: 'TimeZone',
				keyValue: timezoneId
			});
		},

		'render': function(currentTimezone){
			var me = this;
			var options;
			var $recommendation;

			if(currentTimezone) {
				me.currentTimezone = currentTimezone;
				me.query('ocb_recommendclass!\'' + me.options.topic.classType + ';' + me.currentTimezone.id + '\'', userDeferred.promise).spread(function(data, user){
					me.publish('ocb/recommendation/change', data && data.classRecommendation);

					if(user && user.member_id){
						me.member_id = user.member_id;
					}

					if(data && data.classRecommendation && data.classRecommendation.classes && data.classRecommendation.classes.length){
						options = _.assign(me.options, {
							studyplanItem: me.studyplanItem,
							studyplanItemToken: me.studyplanItemToken,
							classRecommendation: data.classRecommendation,
							currentTimezone: me.currentTimezone,
							timezoneList: me.timezoneList
						});
						$recommendation = widgetCreator({
							'campus-studyplan-ui/widget/pl/nevertake/recommendation/main': options
						});
						$recommendation.weave();
						me.html($recommendation);
					} else {
						options = _.assign(me.options, {
							studyplanItemToken: me.studyplanItemToken,
							classRecommendation: data.classRecommendation
						});
						me.html(template(options));
					}
					var cancelValue = storage.getItem(CANCEL_KEY + me.options.topic.courseUnitId + me.member_id);
					var cancelDate = cancelValue === null ? MIN_DATE : cancelValue.split('#')[1];
					var ocb_cancellation = 'ocb_cancellation!' + '\'' + me.options.topic.courseUnitId + ';' + cancelDate + '\'';
					me.query(ocb_cancellation).spread(function(ocbCancel){
						if(ocbCancel.hasCancelledLastBooking){
							me.showTeacherCancellationMessage();
						}
					});
				});
			}
		},

		'showTeacherCancellationMessage': function(){
			var me = this;
			var $message = widgetCreator({
				'campus-studyplan-ui/widget/shared/alert/main': {
					'title': 682008,
					'content': 682009,
					'action': 677505
				}
			});
			$message.weave().then(function(){
				fancybox.open({
					content: $message,
					afterClose: function(){
						// Set operation flag , 0 reprents cancellation message is read
						storage.setItem(CANCEL_KEY + me.options.topic.courseUnitId + me.member_id, 0 + '#' + moment().utc().format('YYYY-MM-DD HH:mm:ss'));
					}
				});
			});
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/nevertake/recommendation/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-nevertake\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"csu-pl-topic\">\n\t\t\t<div class=\"media\">\n\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t<img class=\"media-object\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t</h4>\n\t\t\t\t\t<p data-blurb-id=\"" + data.topic.description + "\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t<p data-blurb-id=\"673773\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"csu-pl-nevertake-booking\">\n\t\t\t<p class=\"csu-pl-nevertake-lead\" data-blurb-id=\"673774\" data-weave=\"troopjs-ef/blurb/widget\">Recommended class for you</p>\n\t\t\t<form class=\"csu-pl-nevertake-form tabulation\">\n\t\t\t\t<div class=\"row\">\n\t\t\t\t\t<div class=\"col-xs-4\">\n\t\t\t\t\t\t<div class=\"csu-pl-nevertake-teacher\" data-weave=\"campus-studyplan-ui/widget/pl/nevertake/teacher/main\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"col-xs-4\">\n\t\t\t\t\t\t<div class=\"csu-pl-nevertake-timeslot\" data-weave=\"campus-studyplan-ui/widget/pl/nevertake/timeslot/main(options, context)\" data-options='" + JSON.stringify(data.classRecommendation) + "' data-context='" + JSON.stringify(data.context) + "'></div>\n\t\t\t\t\t\t<div class=\"csu-pl-nevertake-timezone\" data-weave=\"campus-studyplan-ui/widget/pl/nevertake/timezone/main(options, list)\" data-options='" + JSON.stringify(data.currentTimezone) + "' data-list='" + JSON.stringify(data.timezoneList) + "'></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"col-xs-4\">\n\t\t\t\t\t\t<div class=\"csu-pl-nevertake-button\">\n\t\t\t\t\t\t\t"; if(data.videoEnabled === 'true') { o += "\n\t\t\t\t\t\t\t\t<div class=\"cpn-button-video-lesson\">\n\t\t\t\t\t\t\t\t\t<input type=\"checkbox\" id=\"videoLesson\" /><label for=\"videoLesson\" data-blurb-id=\"673775\" data-weave=\"troopjs-ef/blurb/widget\">Make it a video lesson</label>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t"; } o += "\n                            "; if (data.PLRecordFeature > 0 ) { o += "\n\t\t\t\t\t\t\t\t<div class=\"cpn-button-video-lesson gud\">\n                                    <input type=\"hidden\" value=\"" + (data.PLRecordFeature == 2 ? 'true' : 'false') + "\" name=\"NeedRecord\" />\n                                    <input type=\"checkbox\" id=\"NeedRecordBox\" " + (data.PLRecordFeature == 2 ? 'checked' : '') + " /><label for=\"NeedRecordBox\" data-blurb-id=\"708472\" data-weave=\"troopjs-ef/blurb/widget\">Send me class video</label>\n                                    <span class=\"tooltip-info\" data-toggle=\"tooltip\" data-placement=\"right\">i</span>\n                                    <span class=\"hide\" data-blurb-id=\"708473\" data-weave=\"campus-studyplan-ui/widget/blurb\" ></span>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t<div>\n\t\t\t\t\t\t\t\t<button type=\"submit\" class=\"btn btn-primary\"><span data-blurb-id=\"568596\" data-weave=\"troopjs-ef/blurb/widget\">Book this class</span></button>\n\t\t\t\t\t\t\t\t<p class=\"csu-pl-nevertake-tnc\" data-blurb-id=\"673780\" data-weave=\"campus-studyplan-ui/widget/blurb\" data-values='{\"termsAndConditions\": \"<a class=\\\"csu-pl-link csu-pl-link-tnc\\\">" + data.termsAndConditions + "</a>\"}'>By clicking the button above, you agree to the Terms And Conditions of the Private Lesson services.</p>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t"; if(data.studyplanItem.typeCode === 'cp20'){o += "\n\t\t\t\t\t<input type=\"hidden\" name=\"BookingToken\" value=\"" + data.studyplanItemToken + "\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"SubserviceType\" value=\"" + data.studyplanItem.typeCode.toUpperCase() + "\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"ClassTypeCode\" value=\"" + data.studyplanItem.typeCode.toUpperCase() + "\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"Flow\" value=\"\" />\n\t\t\t\t"; } else { o += "\n\t\t\t\t\t<input type=\"hidden\" name=\"BookingToken\" value=\"\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"SubserviceType\" value=\"\" />\n\t\t\t\t\t<input type=\"hidden\" name=\"ClassTypeCode\" value=\"\" />\t\t\t\t\t\n\t\t\t\t\t<input type=\"hidden\" name=\"Flow\" value=\"UnitAligned\" />\n\t\t\t\t"; } o += "\n\t\t\t\t<input type=\"hidden\" name=\"Token\" value=\"" + data.bookingToken.token + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"TokenTime\" value=\"" + data.bookingToken.tokenTime + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"SchoolVersion\" value=\"" + data.studentCourse.schoolVersion + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"Course_id\" value=\"" + data.studentCourse.course_id + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"CourseUnit_id\" value=\"" + data.studentCourse.courseUnit_id + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"StudentCourse_id\" value=\"" + data.studentCourse.studentCourse_id + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"Member_id\" value=\"" + data.user.member_id + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"MarketCode\" value=\"" + data.context.countrycode.value + "\" />\n\t\t\t\t<input type=\"hidden\" name=\"IsVideo\" value=\"false\" />\n\t\t\t\t<input type=\"hidden\" name=\"Gender\" value=\"\" />\n\t\t\t</form>\n\n\t\t\t<!-- links -->\n\t\t\t<div class=\"row\">\n\t\t\t\t<div class=\"col-xs-4 text-center\">\n\t\t\t\t\t<a class=\"btn-link csu-pl-link btn-link-change-teacher\"><span data-blurb-id=\"673776\" data-weave=\"troopjs-ef/blurb/widget\"></span><span class=\"glyphicon glyphicon-arrow\"></span></a>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"col-xs-4 text-center\">\n\t\t\t\t\t<a class=\"btn-link csu-pl-link btn-link-change-time\"><span data-blurb-id=\"673777\" data-weave=\"troopjs-ef/blurb/widget\"></span><span class=\"glyphicon glyphicon-arrow\"></span></a>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"col-xs-4\">\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/nevertake/recommendation/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'lodash',
	'jquery',
    '../../../../utils/widgetCreator',
    '../../../../utils/fancybox',
	'when',
	'client-tracking'
], function(
	Widget,
	template,
	_,
	$,
	widgetCreator,
	fancybox,
	when,
	ct
){
	'use strict';

	var contextDeferred = when.defer();
	var userDeferred = when.defer();
	var CANCEL_KEY = 'bookingCancelledBy_';
	var storage = window.localStorage;
    var PL_RECORDING_FEATURE = {
        DISABLED: 0,
        UNCHECKED: 1,
        CHECKED: 2
    };

	function getTeacherId(teacher){
		var arr = /[\?|&]id=(\S+)$/.exec(teacher && teacher.communityPageUrl);
		return arr && arr[1];
	}

	function createEvcBookingUrl(url, token, partner, tid){
		return url
			.replace('{source}', window.encodeURIComponent(window.location.href) || '')
			.replace('{token}', token || '')
			.replace('{partner}', partner || '')
			.replace('{tid}', tid || '');
	}

    function getPLRecordFeature(evcmember) {
        var bit;
        if (evcmember.enablePLRecord) {
            bit = evcmember.defaultPLRecordOption ? PL_RECORDING_FEATURE.CHECKED : PL_RECORDING_FEATURE.UNCHECKED;
        } else {
            bit = PL_RECORDING_FEATURE.DISABLED;
        }
        return bit;
    }

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
			var me = this;
			me.query(
				'ccl!"School.PrivateLesson.isVideoEnable"',
				'blurb!673781',
				contextDeferred.promise,
				userDeferred.promise,
				'evc_studentcourse!' + me.options.topic.courseUnitId,
				'bookingtoken!current',
                'evcmember!current'
			).spread(function(ccl, blurb, context, user, studentCourse, bookingToken, evcmember){
				if(user && user.member_id){
					me.member_id = user.member_id;
				}

				me.html(template, _.assign({
					videoEnabled: ccl && ccl.value,
					termsAndConditions: blurb && blurb.translation,
					context: context || {},
					user: user || {},
					studentCourse: studentCourse || {},
                    bookingToken: bookingToken && bookingToken.lessonBookingSecurityParams || {},
                    PLRecordFeature: getPLRecordFeature(evcmember)
				}, me.options)).then(function(){
					me.$timeslot = me.$element.find('.csu-pl-nevertake-timeslot');
					me.$videoLesson = me.$element.find('input[name=IsVideo]');
                    me.$element.find('[data-toggle="tooltip"]').each(function() {
                        var $this = $(this);
                        $this.tooltip({
                            title: $this.nextAll('.hide').text()
                        });
                    });
				});
			});
		},

		'dom:form.csu-pl-nevertake-form/submit': function(e){
			e.preventDefault();
			var me = this;
			var $error;
			var $form = $(e.target);
			var $startTime = $form.find('input[name=StartTime]');
			var $selectedStartTime = $form.find('input[name=StartTime]:checked');
			var selectedNumber = $startTime.index($selectedStartTime) + 1;
			var deferred = when.defer();

			ct.useraction({
				'action.booking': 1,
				'action.recommendTimeSlot': 1,
				'action.recommendTimeSlotChoice': 'Choice' + selectedNumber,
				'action.hasProfilePicture': me.selectedTeacher.isDefaultAvatar ? 'No' : 'Yes',
				'action.videoLessonClick': me.isVideoClass ? 'Yes' : 'No'
			});

			me.$element.trigger('task', deferred.promise);  // trigger loading spinner

			$.ajax({
				method: 'POST',
				url: '/school/evc/pl/book',
				data: $form.serialize(),
				success: function(result){
					if(result.IsSuccess) {
						// Publish cancel status to school
						me.publish('studyplan/sequence/update');
						// Reload current studyplan content
						me.publish('studyplan/sequence-container/reload');

						// one click booking tracking
						me.publish('ocb/recommendation/track', {
							status: 'Success',
							statusExtension: result.Class_id,
							isVideoClass: me.isVideoClass
						});
						// reset cancel flag
						storage.removeItem(CANCEL_KEY + me.options.topic.courseUnitId + me.member_id);
					}
					else {
						$error = widgetCreator({
							'campus-studyplan-ui/widget/shared/alert/main': {
								'glyphicon': true,
								'title': 674436,
								'content': 674437,
								'action': 674438
							}
						});
						$error.weave().then(function(){
							fancybox.open({
								content: $error,
								afterClose: function(){
									me.$timeslot.trigger('render');
								}
							});
						});

						// one click booking tracking
						me.publish('ocb/recommendation/track', {
							status: 'Fail',
							statusExtension: result.StatusCode,
							isVideoClass: me.isVideoClass
						});
					}
					deferred.resolve();
				}
			});
		},

		'dom:#videoLesson/change': function(e){
			var me = this;
			me.isVideoClass = e.target.checked;
			me.$videoLesson.val(me.isVideoClass);
		},

		'dom:#NeedRecordBox/click': function(e){
            var needRecord = e.target.form.elements.NeedRecord;
            needRecord.value = e.target.checked ? 'true' : 'false';
		},

		'dom:.csu-pl-link-tnc/click':function (e) {
			var me = this;
			var $termsAndConditions = widgetCreator({
				'campus-studyplan-ui/widget/pl/nevertake/tscs/main': {
					'classType' : me.options.topic.classType
				}
			});

			$termsAndConditions.weave().then(function(){
				fancybox.open({
					content: $termsAndConditions
				});
			});
		},

		'hub:memory/common_context': function(context) {
			contextDeferred.resolve(context && context.values);
		},

		'hub:memory/context': function(context) {
			userDeferred.resolve(context && context.user);
		},

		'hub/ocb/selectedClass/change': function(teacher){
			var me = this;
			me.selectedTeacher = teacher;
		},

		'dom:.btn-link-change-teacher/click': function(){
			var me = this;

			ct.useraction({
				'action.changeTeacher': 1
			});

			// one click booking tracking
			me.publish('ocb/recommendation/track', {
				status: 'Goto',
				statusExtension: 'ChangeTeacher',
				isVideoClass: false
			});

			var evcBookingUrl = createEvcBookingUrl(me.options.evcUrls.booking, me.options.studyplanItemToken, me.options.classRecommendation.classPartnerCode);
			window.open(evcBookingUrl, '_self');
		},

		'dom:.btn-link-change-time/click': function(){
			var me = this;

			ct.useraction({
				'action.viewOtherTime': 1
			});

			// one click booking tracking
			me.publish('ocb/recommendation/track', {
				status: 'Goto',
				statusExtension: 'ChangeTime',
				isVideoClass: false
			});

			var evcBookingUrl = createEvcBookingUrl(me.options.evcUrls.booking, me.options.studyplanItemToken, me.options.classRecommendation.classPartnerCode, getTeacherId(me.selectedTeacher));
			window.open(evcBookingUrl, '_self');
		}
	});
});


define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/nevertake/teacher/main.html',[],function() { return function template(data) { var o = "";
	function isStandalone(){
		var cls = '';
		if(!data.accent && !data.bilingual) {
			cls = 'cpn-teacher-name-standalone';
		}
		return cls;
	}

	function getInitialLetters(){
		var words = arguments;
		var str = '';
		for(var i = 0; i < words.length; i++){
			str += words[i].substring(0,1);
		}
		return str.toUpperCase();
	}
o += "\n<div class=\"cpn-title text-center\"><span class=\"glyphicon glyphicon-teacher-large\"></span><span data-blurb-id=\"673778\" data-weave=\"troopjs-ef/blurb/widget\">Teacher</span></div>\n<div class=\"cpn-teacher-profile text-center\">\n\t<div class=\"cpn-teacher-avatar\">\n\t\t\t<!--[if lte IE 8]>\n\t\t\t\t<vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n\t\t\t\t\t"; if(data.isDefaultAvatar){ o += "\n\t\t\t\t\t\t<vml:fill color=\"#c3c3c3\">\n\t\t\t\t\t\t\t<em>" + getInitialLetters(data.firstName, data.lastName) + "</em>\n\t\t\t\t\t\t</vml:fill>\n\t\t\t\t\t"; } else { o += "\n\t\t\t\t\t\t<vml:fill type=\"frame\" src=\"" + data.avatarUrl + "\"/>\n\t\t\t\t\t"; } o += "\n\t\t\t\t</vml:oval>\n\t\t\t<![endif]-->\n\t\t\t<span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n\t\t\t\t"; if(data.isDefaultAvatar){ o += "\n\t\t\t\t\t<em>" + getInitialLetters(data.firstName, data.lastName) + "</em>\n\t\t\t\t"; } else { o += "\n\t\t\t\t\t<img src=\"" + data.avatarUrl + "\" alt=\"" + data.nickName + "\">\n\t\t\t\t"; } o += "\n\t\t\t</span>\n\t\t</span>\n\t</div>\n\t<div class=\"cpn-teacher-name " + isStandalone() + "\">\n\t\t"; if(data.nickName){ o += "\n\t\t\t" + data.nickName + "\n\t\t"; } else { o += "\n\t\t\t" + data.firstName + ' ' + data.lastName + "\n\t\t"; } o += "\n\t</div>\n\t<ul class=\"cpn-teacher-language text-center\"><!--\n\t\t"; if(data.accent) { o += "\n\t\t\t--><li class=\"cpn-teacher-accent\">\n\t\t\t\t<div class=\"cpn-teacher-text\">\n\t\t\t\t\t<span class=\"glyphicon glyphicon-accent\"></span><span>" + data.accent + "</span>\n\t\t\t\t</div>\n\t\t\t</li><!--\n\t\t"; } o += "\n\t\t"; if(data.bilingual) { o += "\n\t\t\t--><li class=\"cpn-teacher-bilingual\">\n\t\t\t\t<div class=\"cpn-teacher-text\">\n\t\t\t\t\t<span class=\"glyphicon glyphicon-bilingual\"></span><span>" + data.bilingual + "</span>\n\t\t\t\t</div>\n\t\t\t</li><!--\n\t\t"; } o += "\n\t\t-->\n\t</ul>\n</div>\n<input type=\"hidden\" name=\"Teacher_id\" value=\"" + data.memberId + "\"/ >"; return o; }; });
define('campus-studyplan-ui/widget/pl/nevertake/teacher/main',[
	'troopjs-ef/component/widget',
	'template!./main.html'
], function(
	Widget,
	template
){
	'use strict';

	return Widget.extend(function($element, displayName, options){

	},{
		'sig/start': function(){
		},

		'hub/ocb/selectedClass/change': function(teacher){
			var me = this;
			if(teacher.memberId !== me.memberId){
				me.render(teacher);
			}
		},

		'render': function(data){
			var me = this;
			me.memberId = data.memberId;
			me.html(template, data);
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/nevertake/timeslot/main.html',[],function() { return function template(data) { var o = ""; function check(num){ return num ? "" : "checked"; } o += "\n\n<div class=\"text-center\">\n\t<div class=\"cpn-title\"><span class=\"glyphicon glyphicon-timeslot\"></span><span data-blurb-id=\"673779\" data-weave=\"troopjs-ef/blurb/widget\">Time</span></div>\n\t<ul class=\"cpn-timeslot-list text-left\">\n\t\t"; for(var i = 0; i<data.classes.length; i++){ o += "\n\t\t\t<li data-teacher-member-id=\"" + data.classes[i].teacherMemberId + "\" data-end-time=\"" + data.classes[i].endTimeEst + "\" data-language-code=\"" + data.classes[i].languageCode + "\">\n\t\t\t\t<input type=\"radio\" name=\"StartTime\" id=\"timeslot" + data.classes[i].classId + "\" value=\"" + data.classes[i].startTimeEst + "\" " + check(i) + " /><label for=\"timeslot" + data.classes[i].classId + "\">" + data.classes[i].formattedTime + "</label>\n\t\t\t</li>\n\t\t"; } o += "\n\t\t<input type=\"hidden\" name=\"EndTime\" value=\"" + data.classes[0].endTimeEst + "\" />\n\t\t<input type=\"hidden\" name=\"LanguageCode\" value=\"" + data.classes[0].languageCode + "\" />\n\t</ul>\n</div>\n<input type=\"hidden\" name=\"PartnerCode\" value=\"" + data.classPartnerCode + "\" />"; return o; }; });
define('campus-studyplan-ui/widget/pl/nevertake/timeslot/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'lodash',
	'jquery',
	'when',
	'../../../../utils/momentize',
	'client-tracking'
], function(
	Widget,
	template,
	_,
	$,
	when,
	momentize,
	ct
){
	'use strict';

	function formatTime(languageCode){
		return function(obj){
			var time = obj.startTime.substring(0,19);
			obj.formattedTime = momentize(time, languageCode, 'START_TIME');
			return obj;
		};
	}

	return Widget.extend(function($element, displayName, options, context){
		var me = this;
		me.options = options;
		me.context = context;
	},{
		'sig/start': function(){
			var me = this;
			me.render();
		},

		'dom/render': function(){
			var me = this;
			me.render();
		},

		'dom:input[name="StartTime"]/change': function(e){
			var me = this;
			var $time = $(e.currentTarget).parent();

			ct.useraction({
				'action.changeBookingTime': 1
			});

			// set attribute 'checked' for the selected element
			$time.siblings().find('input[checked]').removeAttr('checked');
			$time.find('input').attr('checked', 'checked');

			// set end time accordeing to the selected class
			me.$endTime.val($time.data('endTime'));

			// set language code accordeing to the selected class
			me.$languageCode.val($time.data('languageCode'));

			me.publish('ocb/selectedClass/change', _.find(me.teachers, {
				memberId: $time.data('teacherMemberId')
			}));
		},

		'render': function(){
			var me = this;
			var languageCode = me.context && me.context.languagecode.value.toLowerCase();
			me.teachers = me.options.teachers;
			me.html(template, {
				classes: _.map(me.options.classes, formatTime(languageCode)),
				classPartnerCode: me.options.classPartnerCode
			}).then(function(){
				me.$endTime = me.$element.find('input[name=EndTime]');
				me.$languageCode = me.$element.find('input[name=LanguageCode]');
				me.publish('ocb/selectedClass/change', _.find(me.teachers, {
					memberId: me.options.classes[0].teacherMemberId
				}));
			});
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/nevertake/timezone/main.html',[],function() { return function template(data) { var o = "<div class=\"cpn-timezone-readonly text-center\">\n\t<div>" + data.id + "</div>\n\t<div class=\"cpn-timezone-button-wrapper\">\n\t\t(" + data.displayOffset + ")\n\t\t<a class=\"csu-pl-link cpn-timezone-button-change\" data-blurb-id=\"676700\" data-weave=\"troopjs-ef/blurb/widget\">change</a>\n\t</div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/nevertake/timezone/editable.html',[],function() { return function template(data) { var o = "";
	function isSelected(id){
		return id === data.current.id ? 'selected' : '';
	}
o += "\n<div class=\"cpn-timezone-editable text-center\">\n\t<select class=\"cpn-timezone-select\">\n\t\t"; for(var i = 0; i < data.list.length; i++){ o += "\n\t\t\t<option " + isSelected(data.list[i].id) + " value=\"" + data.list[i].id + "\">" + '(' + data.list[i].displayOffset + ') ' + data.list[i].id + "</option>\n\t\t"; } o += "\n\t</select>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/nevertake/timezone/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'template!./editable.html',
	'when',
	'jquery',
	'lodash'
], function(
	Widget,
	template,
	templateEditable,
	when,
	$,
	_
){
	'use strict';

	return Widget.extend(function($element, displayName, options, list){
		var me = this;
		me.options = options;
		me.list = list;
	},{
		'sig/start': function(){
			var me = this;
			me.render().then(function(){
				$('body').click(function(e){
					me.cancel($(e.target));
				});
			});
		},

		'dom:.cpn-timezone-button-change/click': function(){
			var me = this;
			me.edit();
		},

		'dom:.cpn-timezone-select/change': function(e){
			var me = this;
			var changed = me.list[e.currentTarget.selectedIndex];
			me.save(changed.id).then(function(){
				me.$element.trigger('timezoneChange', changed); // rerender the whole widget nevertake
			});
		},

		'render': function(){
			var me = this;
			me.hide(me.$editableView);
			return me.html(template(me.options)).then(function(){
				me.editable = false;
				if(me.$readonlyView){
					me.$readonlyView.remove();
				}
				me.$readonlyView = me.$element.find('.cpn-timezone-readonly');
			});
		},

		'edit': function(){
			var me = this;
			me.hide(me.$readonlyView);
			if(!me.$editableView){
				me.html(templateEditable({
					list: me.list,
					current: me.options
				})).then(function(){
					me.editable = true;
					me.$editableView = me.$element.find('.cpn-timezone-editable');
				});
			} else {
				me.$element.html(me.$editableView);
				me.editable = true;
			}
		},

		'cancel': function($target){
			var me = this;
			if(me.editable &&
				!$target.hasClass('cpn-timezone-button-change') && 
				!$target.hasClass('cpn-timezone-select') &&
				!$target.parents('.cpn-timezone-select').length){
				me.hide(me.$editableView);
				me.$element.html(me.$readonlyView);
			}
		},

		'save': function(timezoneId){
			var me = this;
			return me.publish('school/member_site_setting/Save', {
				siteArea: 'EVC',
				keyCode: 'TimeZone',
				keyValue: timezoneId
			});
		},

		'hide': function($element){
			var me = this;
			if($element){
				me.$element.after($element);
			}
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/nevertake/tscs/main.html',[],function() { return function template(data) { var o = "<div class=\"campus-studyplan-ui\">\n\t<div class = \"csu-pl-nevertake-tscs\">\n\t\t<p class = \"csu-pl-nevertake-tscs-title\" data-weave = \"troopjs-ef/blurb/widget\" data-blurb-id = \"676103\"></p>\n\t\t<p class = \"csu-pl-nevertake-tscs-des\" data-weave = \"troopjs-ef/blurb/widget\" data-blurb-id = \"676112\"></p>\n\t\t<div class = \"csu-pl-nevertake-tscs-content\" data-weave = \"campus-studyplan-ui/widget/blurb\" data-blurb-id = \"" + data.blurbID + "\"></div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/nevertake/tscs/main',['troopjs-ef/component/widget',
	 'template!./main.html'
	 ], function (Widget, template) {

	 return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
			'sig/start': function () {
				var me = this;
				var blurbID = '708943';
				return me.html(template,{
					blurbID: blurbID
				});
			}
		});
	});


define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/nocouponleft/main.html',[],function() { return function template(data) { var o = "";
	function customizeBuyUrl(url){
		return url.replace(/upurl=\S*&?/, 'upurl=' + window.encodeURIComponent(window.location.href));
	}
o += "\n<div class=\"csu-pl-nocouponleft csu-pl-msg-with-topic\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"csu-pl-topic\">\n\t\t\t<div class=\"media\">\n\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t<img class=\"media-object\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t</h4>\n\t\t\t\t\t<p data-blurb-id=\"" + data.topic.description + "\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t<p data-blurb-id=\"673773\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"text-center\">\n\t\t\t<p class=\"csu-pl-msg-lead\" data-blurb-id=\"675885\" data-weave=\"troopjs-ef/blurb/widget\">You don't have any private classes left right now.</p>\n\t\t\t"; if(data.feature.canBuyMore){ o += "\n\t\t\t\t<a class=\"btn btn-primary\" href=\"" + customizeBuyUrl(data.feature.buyUrl) + "\" data-blurb-id=\"675886\" data-weave=\"troopjs-ef/blurb/widget\">Buy more classes</a>\n\t\t\t"; } o += "\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/nocouponleft/main',[
	'troopjs-ef/component/widget',
	'template!./main.html'
], function(
	Widget,
	template
){
	'use strict';

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
			var me = this;
			me.html(template(me.options));
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/pending/main.html',[],function() { return function template(data) { var o = "<div class=\"csu-pl-pending\">\n\t<div class=\"csu-pl-container\">\n\t\t<div class=\"h4 csu-pl-lead text-center\">\n\t\t\t<span data-blurb-id=\"675994\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t</div>\n\t\t<div class=\"csu-pl-class-panel tabulation\">\n\t\t\t<div class=\"row\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"csu-pl-class-media media\">\n\t\t\t\t\t\t<div class=\"pull-left\">\n\t\t\t\t\t\t\t<img class=\"csu-pl-class-topic-image\" src=\"" + data.topic.image + "\" alt=\"\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"media-body\">\n\t\t\t\t\t\t\t<h4 class=\"media-heading text-uppercase\">\n\t\t\t\t\t\t\t\t<span data-blurb-id=\"674720\" data-weave=\"troopjs-ef/blurb/widget\"></span>: <span data-blurb-id=\"" + data.topic.title + "\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t\t\t\t\t\t</h4>\n\t\t\t\t\t\t\t<div class=\"csu-pl-class-time\">" + data.startTime + "</div>\n\t\t\t\t\t\t\t <div class=\"csu-pl-profile\" data-weave=\"campus-studyplan-ui/widget/shared/pl-profile/main(options)\" data-options='" + JSON.stringify(data.bookedClass) + "'></div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"csu-pl-status-info\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<p class=\"h4 csu-pl-status-info-title csu-pl-status-info-title-fullsize\" data-blurb-id=\"675995\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t\t\t\t</div><span>&nbsp;</span><!-- for vertical alignment -->\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/pending/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../../../utils/momentize',
	'lodash'
], function(
	Widget,
	template,
	momentize,
	_
){
	'use strict';

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
		},

		'hub:memory/common_context': function(context) {
			var me = this;
			var languageCode;
			var startTime = '';

			if(context && context.values && me.options.bookedClass){
				languageCode = context.values.languagecode.value.toLowerCase();
				startTime = momentize(me.options.bookedClass.customizedStartTime, languageCode, 'START_TIME');
			}

			me.html(template(_.assign({
				startTime: startTime
			}, me.options)));
		}
	});
});
define('campus-studyplan-ui/widget/pl/pl',[
	'./base',
	'lodash'
], function(
	PL,
	_
){
	'use strict';

	return PL.extend(function($element, displayName, options){
		var me = this;
		me.options = {
			durationMinutes: 40,
			classType: 'pl'
		};
		me.query('evcmember!current').spread(function(data){
			me.deferredFeature.resolve(_.find(data && data.features, {
				featureType: me.options.classType.toUpperCase()
			}));
		});
	},{
		'sig/start': function(){
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/unlocked/main.html',[],function() { return function template(data) { var o = "";
    function getContent(){
        return data.topic.classType === 'cp20' ? 675991 : 678952;
    }
o += "\n<div class = \"csu-pl-unlocked csu-pl-msg\">\n    <div class=\"csu-pl-container\">\n        <div class=\"h4 csu-pl-lead text-center\">\n            <span class=\"glyphicon glyphicon-unlock\"></span>\n            <span class=\"csu-pl-unlocked-status\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677341\"></span>\n        </div>\n        <div class=\"csu-pl-msg-details media\">\n            <div class=\"pull-left text-center\">\n                <div class=\"csu-pl-teacher-avatar-wrapper\">\n                    <!--[if lte IE 8]>\n                        <vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n                            <vml:fill type=\"frame\" src=\"" + data.recommendedTeacher.avatar + "\"/>\n                        </vml:oval>\n                    <![endif]-->\n                    <span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n                        <img src=\"" + data.recommendedTeacher.avatar + "\">\n                    </span>\n                </div>\n                <div>\n                    <span class=\"glyphicon glyphicon-teacher\"></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673778\"></span>\n                </div>\n                <div class=\"csu-pl-teacher-name\">\n                    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.recommendedTeacher.name + "\"></span>\n                </div>\n            </div>\n            <div class=\"media-body\">\n                <p class=\"h4\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675884\"></p>\n                <p data-weave=\"campus-studyplan-ui/widget/blurb\" data-blurb-id=\"" + getContent() + "\" data-values='{\"name\": \"" + data.user.firstName + "\"}'>\n                </p>\n            </div>\n        </div>\n        <div class=\"text-center\">\n            <button type=\"button\" class=\"btn btn-primary btn-start-booking\">\n                <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677342\"></span>\n            </button>\n        </div>\n    </div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/unlocked/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'school-ui-studyplan/module',
	'when',
	'lodash',
	'../../../utils/member-site-setting'
], function(
	Widget,
	template,
	module,
	when,
	_,
	MemberSiteSetting
){
	'use strict';

	var userDeferred = when.defer();

	function addUnlockedPL(unlockedUnit, currentUnit){
		var seperator = ',';
		var arrUnlocked = unlockedUnit && unlockedUnit.split(seperator) || [];
		if(!_.contains(arrUnlocked, currentUnit + '')) {
			arrUnlocked.push(currentUnit);
		}
		return arrUnlocked.join(seperator);
	}

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
		me.queries = [userDeferred.promise];
		me.template = template;
		me.cacheServer = module.config().cacheServer;
	},{
		'sig/start': function(){
			var me = this;
			return me.query(me.queries).spread(function(){
				me.render.apply(me, arguments);
			});
		},

		'dom:.btn-start-booking/click': function(){
			var me = this;
			me.unlock();
		},

		'hub:memory/context': function(context) {
			userDeferred.resolve({
				user: context && context.user
			});
		},

		'render': function(){
			var me = this;
			var data = {
				recommendedTeacher: {
					avatar: me.cacheServer + '/juno/18/80/21/v/188021/teacher.jpg',
					name: 677343
				},
				feature: me.options.feature,
				topic: me.options.topic
			};
			_.forEach(arguments, function(o){
				_.assign(data, o);
			});
			return me.html(me.template(data));
		},

		'unlock': function(){
			var me = this;
			var key = 'UnlockedPLs';
			var value;
			me.getMemberSiteSetting(key).then(function(data){
				value = addUnlockedPL(data && data.value, me.options.topic.courseUnitId);
				me.saveMemberSiteSetting(key, value).then(function(){
					me.publish('studyplan/sequence-container/reload');
				});
			});
		}
	}, MemberSiteSetting);
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/welcome/main.html',[],function() { return function template(data) { var o = "<div class = \"csu-pl-welcome csu-pl-msg\">\n    <div class=\"csu-pl-container\">\n        <div class=\"h4 csu-pl-lead text-center\">\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"679461\"></span>\n        </div>\n        <div class=\"csu-pl-msg-details-wrapper clearfix\">\n            <div class=\"csu-pl-msg-details media pull-left\">\n                <div class=\"pull-left text-center\">\n                    <div class=\"csu-pl-teacher-avatar-wrapper\">\n                        <!--[if lte IE 8]>\n                            <vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n                                <vml:fill type=\"frame\" src=\"" + data.recommendedTeacher.avatar + "\"/>\n                            </vml:oval>\n                        <![endif]-->\n                        <span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n                            <img src=\"" + data.recommendedTeacher.avatar + "\">\n                        </span>\n                    </div>\n                    <div>\n                        <span class=\"glyphicon glyphicon-teacher\"></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673778\"></span>\n                    </div>\n                    <div class=\"csu-pl-teacher-name\">\n                        <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.recommendedTeacher.name + "\"></span>\n                    </div>\n                </div>\n                <div class=\"media-body\">\n                    <p class=\"h4\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"679462\"></p>\n                    <p data-weave=\"campus-studyplan-ui/widget/blurb\" data-blurb-id=\"675883\" data-values='{\"name\": \"" + data.user.firstName + "\"}'>\n                    </p>\n                </div>\n            </div>\n            <div class=\"pull-right\">\n                <a class=\"csu-pl-tutorial-video\">\n                    <img src=\"" + data.video.post + "\">\n                </a>\n                <div data-weave=\"school-ui-studyplan/widget/gl-pl/popupvideo/main\" data-video-url=\"" + data.video.url + "\"></div>\n            </div>\n        </div>\n        <div class=\"text-center\">\n            <button type=\"button\" class=\"btn btn-primary btn-start-booking\">\n                <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677342\"></span>\n            </button>\n        </div>\n    </div>\n</div>"; return o; }; });

define('troopjs-requirejs/template!campus-studyplan-ui/widget/pl/welcome/no-coupon-left.html',[],function() { return function template(data) { var o = "";
	function customizeBuyUrl(url){
		return url.replace(/upurl=\S*&?/, 'upurl=' + window.encodeURIComponent(window.location.href));
	}
o += "\n<div class = \"csu-pl-msg\">\n    <div class=\"csu-pl-container\">\n        <div class=\"row\">\n            <div class=\"col-xs-4 col-xs-offset-4\">\n                <div class=\"h4 csu-pl-lead text-center\">\n                    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"675885\"></span>\n                </div>\n            </div>\n        </div>\n        <div class=\"csu-pl-msg-details media\">\n            <div class=\"pull-left text-center\">\n                <div class=\"csu-pl-teacher-avatar-wrapper\">\n                    <!--[if lte IE 8]>\n                        <vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n                            <vml:fill type=\"frame\" src=\"" + data.recommendedTeacher.avatar + "\"/>\n                        </vml:oval>\n                    <![endif]-->\n                    <span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n                        <img src=\"" + data.recommendedTeacher.avatar + "\">\n                    </span>\n                </div>\n                <div>\n                    <span class=\"glyphicon glyphicon-teacher\"></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"673778\"></span>\n                </div>\n                <div class=\"csu-pl-teacher-name\">\n                    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.recommendedTeacher.name + "\"></span>\n                </div>\n            </div>\n            <div class=\"media-body\">\n                <p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677495\" data-values='{\"name\": \"" + data.user.firstName + "\"}'>\n                <p>\n                    <span data-weave=\"campus-studyplan-ui/widget/blurb\" data-blurb-id=\"679490\" data-values='{\"title\": \"<strong>" + data.translation.title + "</strong>\"}'></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.topic.description + "\"></span> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"677496\"></span>\n                </p>\n            </div>\n        </div>\n\t\t"; if(data.feature.canBuyMore){ o += "\n\t\t\t<div class=\"text-center\">\n\t\t\t\t<a class=\"btn btn-primary btn-buy-coupon\" href=\"" + customizeBuyUrl(data.feature.buyUrl) + "\" data-blurb-id=\"675886\" data-weave=\"troopjs-ef/blurb/widget\">Buy more classes</a>\n\t\t\t</div>\n\t\t"; } o += "\n    </div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/pl/welcome/main',[
	'campus-studyplan-ui/widget/pl/unlocked/main',
	'template!./main.html',
	'template!./no-coupon-left.html'
], function(
	Unlocked,
	template,
	templateNoCouponLeft
){
	'use strict';

	return Unlocked.extend(function($element, displayName, options){
		var me = this;
		if(me.options.feature && me.options.feature.couponLeft < 1) {
			me.template = templateNoCouponLeft;
			me.queries.push(me.query('blurb!' + me.options.topic.title).spread(function(data){
				return {
					translation: {
						title: data && data.translation
					}
				};
			}));
		} else {
			me.template = template;
			me.queries.push(me.query('media!167835').spread(function(data){
				return {
					video: {
						url: data && data.url,
						post: me.cacheServer + '/_imgs/evc/pl/studyplan/video.jpg'
					}
				};
			}));
		}
	},{
		'dom:.btn-start-booking/click': function(e){
			var me = this;
			var isCP20 = me.options.topic.classType === 'cp20';

			e.stopImmediatePropagation();

			if(isCP20){
				me.saveMemberSiteSetting('FirstTimeStudyPlanCP20', true);
				me.unlock();
			} else {
				me.saveMemberSiteSetting('FirstTimeStudyPlanPL', true).then(function(){
					me.publish('studyplan/sequence-container/reload');
				});
			}
		},

		'dom:.csu-pl-tutorial-video/click': function(){
			var me = this;
			me.publish('studyplan/evc/welcome-video/show');
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/shared/alert/main.html',[],function() { return function template(data) { var o = "<div class=\"gud\">\n\t<div class=\"campus-studyplan-ui\">\n\t\t<div class=\"csu-fancybox-small csu-fancybox-alert\">\n\t\t\t<div class=\"csu-fancybox-alert-header clearfix\">\n\t\t\t\t"; if(data.glyphicon){ o += "\n\t\t\t\t\t<div class=\"csu-fancybox-alert-icon\">\n\t\t\t\t\t\t<span class=\"glyphicon glyphicon-error\"></span>\n\t\t\t\t\t</div>\n\t\t\t\t"; } o += "\n\t\t\t\t<div class=\"csu-fancybox-alert-title\">\n\t\t\t\t\t<span class=\"\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.title + "\"></span>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div class=\"csu-fancybox-alert-content\">\n\t\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.content + "\"></p>\n\t\t\t</div>\n\t\t\t<div class=\"text-center\">\n\t\t\t\t<a class=\"btn-link\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.action + "\"></a>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('campus-studyplan-ui/widget/shared/alert/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'../../../utils/fancybox'
], function(
	Widget,
	template,
	fancybox
){
	'use strict';

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
			var me = this;
			return me.html(template(me.options));
		},

		'dom:.btn-link/click': function(){
			fancybox.close();
		}
	});
});

define('troopjs-requirejs/template!campus-studyplan-ui/widget/shared/pl-profile/main.html',[],function() { return function template(data) { var o = "";
	function getInitialLetters(){
		var words = arguments;
		var str = '';
		for(var i = 0; i < words.length; i++){
			str += words[i].substring(0,1);
		}
		return str.toUpperCase();
	}
o += "\n<!--[if lte IE 8]>\n\t<vml:oval class=\"csu-pl-teacher-avatar\" style=\"height: 81px; width: 81px; background: transparent;\" stroked=\"false\">\n\t\t"; if(data.teacherprofile){ o += "\n\t\t\t"; if(data.teacherprofile.isDefaultImage){ o += "\n\t\t\t\t<vml:fill color=\"#c3c3c3\">\n\t\t\t\t\t<em>" + getInitialLetters(data.teacherprofile.firstName, data.teacherprofile.lastName) + "</em>\n\t\t\t\t</vml:fill>\n\t\t\t"; } else { o += "\n\t\t\t\t<vml:fill type=\"frame\" src=\"" + data.teacherprofile.imageUrl + "\"/>\n\t\t\t"; } o += "\n\t\t"; } else { o += "\n\t\t\t<vml:fill color=\"#c3c3c3\">\n\t\t\t\t<em>?</em>\n\t\t\t</vml:fill>\n\t\t"; } o += "\n\t</vml:oval>\n<![endif]-->\n<span class=\"csu-pl-teacher-avatar hide-in-ie8\">\n\t"; if(data.teacherprofile){ o += "\n\t\t"; if(data.teacherprofile.isDefaultImage){ o += "\n\t\t\t<em>" + getInitialLetters(data.teacherprofile.firstName, data.teacherprofile.lastName) + "</em>\n\t\t"; } else { o += "\n\t\t\t<img src=\"" + data.teacherprofile.imageUrl + "\" alt=\"" + data.teacherprofile.displayName + "\">\n\t\t"; } o += "\n\t"; } else { o += "\n\t\t<em>?</em>\n\t"; } o += "\n</span><!--\n--><ul>\n\t<li>\n\t\t<span class=\"glyphicon glyphicon-teacher\"></span><!--\n\t\t"; if(data.teacherprofile){ o += "\n\t\t\t--><span>" + data.teacherprofile.displayName + "</span>\n\t\t"; } else { o += "\n\t\t\t--><span data-blurb-id=\"677504\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t\t"; } o += "\n\t</li>\n\t"; if(data.isBilingual){ o += "\n\t\t<li>\n\t\t\t<span class=\"glyphicon glyphicon-bilingual\"></span><span data-blurb-id=\"673783\" data-weave=\"troopjs-ef/blurb/widget\">Bilingual</span>\n\t\t</li>\n\t"; } o += "\n\t<li>\n\t\t<span class=\"csu-pl-profile-duration\">" + data.durationForStudent + "</span><span data-blurb-id=\"673782\" data-weave=\"troopjs-ef/blurb/widget\">Minutes</span>\n\t</li>\n\t"; if(data.isVideo){ o += "\n\t\t<li>\n\t\t\t<span class=\"glyphicon glyphicon-video-lesson\"></span><span data-blurb-id=\"673784\" data-weave=\"troopjs-ef/blurb/widget\">Video lesson</span>\n\t\t</li>\n\t"; } o += "\n</ul>"; return o; }; });
define('campus-studyplan-ui/widget/shared/pl-profile/main',[
	'troopjs-ef/component/widget',
	'template!./main.html',
	'lodash',
	'when'
], function(
	Widget,
	template,
	_,
	when
){
	'use strict';

	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		'sig/start': function(){
			var me = this;
			var deferred = when.defer();

			if(!me.options || (!me.options.teacherId && !me.options.teacherMember_id)) {
				return;
			}
			var teacherId = me.options.teacherId || me.options.teacherMember_id;

			if(teacherId > 0) {
				me.query('teacherprofile!' + teacherId).spread(function(data){
					deferred.resolve(data);
				});
			} else {
				deferred.resolve();
			}

			deferred.promise.then(function(data){
				me.html(template(_.assign({
					teacherprofile: data
				}, me.options)));
			});
		}
	});
});
define('campus-studyplan-ui/widget/tracking',[
	'troopjs-ef/component/widget',
    'troopjs-ef/command/service',
    'troopjs-data/cache/component',
    'lodash',
    'jquery'
], function(
	Widget,
	CommandService,
	Cache,
	_,
	$
){
	'use strict';

	var COMMAND;

	return Widget.extend(function($element, displayName, options){
        if (!COMMAND) {
            // Create new CommandService
            COMMAND = new CommandService('campuscore/ocb_tracking/update', new Cache());
            // Configure
            COMMAND.configure({
                'url': '/services/api/proxy/commandproxy/campuscore/ocb_tracking/update',
                'contentType': 'application/json; charset=UTF-8',
                'type': 'post'
            });
            COMMAND.start();
        }
	},{
		'hub/ocb/recommendation/change': function(recommendation){
			var me = this;
			me.id = recommendation && recommendation.id;
		},

		'hub/ocb/recommendation/track': function(data){
			var me = this;
			me.track(data);
		},

		'track': function(data){
			var me = this;
			if(!me.id || !data) {
				return;
			}
			me.publish('campuscore/ocb_tracking/update', _.assign({
				id: me.id
			}, data));
		}
	});
});
define(["campus-studyplan-ui/service/load"], function (main) { return main; });
