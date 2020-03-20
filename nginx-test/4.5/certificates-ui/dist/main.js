/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);

var geList = null, spinList = null;

var params = {
  menu: "false",
  wmode: "transparent"
};

var attributes = {
  id: "myId",
  name: "myId"
};

var activeLevelKey1 = decodeURIComponent(window.location.search).match(/\?.*key=([^&]+)/)[1];
var CerList = {};

function getQueryString(){
  // datasource: url
  var list = decodeURIComponent(window.location.search.replace('?', '')).split('&');
  var queryStringObj = {};
  list.forEach(function(item){
     if(item) {
       var key = item.split('=')[0];
       var value = item.split('=')[1];
       queryStringObj[key] = value;
    }
  });
  return queryStringObj;
}

function renderHtml() {

  jQuery(".geitem").add(".spinitem").add(".legacyitem").click(function () {
    var level = null;

    jQuery(".geitem").add(".spinitem").add(".legacyitem").removeClass("selected");
    jQuery(this).addClass("selected");

    // Use data-level attribute replace text to fix double space issue.
    var levelName = jQuery(this).attr("data-level");

    for (var i = 0; i < geList.length; i++) {
      if (jQuery.trim(geList[i].level) == jQuery.trim(levelName)) {
        level = geList[i];
        break;
      }
    }

    if (level == null) {
      for (var i = 0; i < spinList.length; i++) {
        if (jQuery.trim(spinList[i].level) == jQuery.trim(levelName)) {
          level = spinList[i];
          break;
        }
      }
    }

    if (level == null) {
      return;
    }

    // clone level and replace level.level with level.certificate
    var flashvars = jQuery.extend({}, level);

    // Critter :: 33534 extented -- Flash will show TextResourceManager issue.
    if (flashvars.levelCertificate && flashvars.levelCertificate.indexOf("TextResourceManager")) {
      flashvars.level = flashvars.levelCertificate;
    }
    flashvars.level = jQuery.trim(flashvars.level);

    var $content = jQuery("#myContent");
    $content.find(".student-name").text(flashvars.name);
    $content.find(".course-name").text(flashvars.course);
    $content.find(".level-name").text(flashvars.level);
    $content.find(".cert-date").text(flashvars.date);
  });

  jQuery(".print").click(function () {
    document.execCommand("print", true, null) || (window.print && window.print());
  });
}

jQuery(document).ready(function () {

  var queryString = getQueryString();

  if (queryString['datasource'] !== 'url') {
    if (opener == null || typeof (opener.window.generalCertificates) == "undefined") {
      return;
    }
  }

  if (queryString['datasource'] === 'url') {
    var coursekey = queryString['key'];
    var isGE = coursekey.toUpperCase().indexOf('GE') > 0;
    var certiData = [{
      Key: queryString['key'],
      course: queryString['course'],
      coursetype: parseInt(queryString['coursetype']),
      date: queryString['date'],
      level: queryString['level'],
      levelCertificate: queryString['levelcertificate'],
      name: queryString['name']
    }];
    geList = isGE ? certiData : [];
    spinList = isGE ? [] : certiData;
  } else {
    geList = opener.window.generalCertificates;
    spinList = opener.window.spinCertificates;
  }

  if (typeof (geList) == "undefined" || typeof (spinList) == "undefined") {
    return;
  }

  for (var i = 0; i < geList.length; i++) {
    if (typeof (geList[i]) == "undefined" || typeof (geList[i].level) == "undefined") {
      continue;
    }
    if (geList[i].coursetype == 2) {
      jQuery("<div class='cer_item'><div class='geitem' id='" + geList[i].Key + "' data-level='" + geList[i].level + "'>" + geList[i].level +
        "</div><div class='date'>" + geList[i].date + "</div></div>").appendTo(jQuery(".left_frame"));
    }
  }

  for (var i = 0; i < spinList.length; i++) {
    if (typeof (spinList[i]) == "undefined" || typeof (spinList[i].level) == "undefined") {
      continue;
    }

    if (spinList[i].coursetype == 2) {
      jQuery("<div class='cer_item'><div class='legacyitem' id='" + spinList[i].Key + "' data-level='" + spinList[i].level + "'>" + spinList[i].level +
        "</div><div class='date'>" + spinList[i].date + "</div></div>").appendTo(jQuery(".left_frame"));
    }
  }

  for (var i = 0; i < geList.length; i++) {
    if (typeof (geList[i]) == "undefined" || typeof (geList[i].level) == "undefined") {
      continue;
    }

    if (geList[i].coursetype == 0) {
      jQuery("<div class='cer_item'><div class='legacyitem' id='" + geList[i].Key + "'data-level='" + geList[i].level + "'>" + geList[i].level +
        "</div><div class='date'>" + geList[i].date + "</div></div>").appendTo(jQuery(".left_frame"));
    }
  }

  for (var i = 0; i < spinList.length; i++) {
    if (typeof (spinList[i]) == "undefined" || typeof (spinList[i].level) == "undefined") {
      continue;
    }

    if (spinList[i].coursetype == 1) {
      jQuery("<div class='cer_item'><div class='legacyitem' id='" + spinList[i].Key + "' data-level='" + spinList[i].level + "'>" + spinList[i].level +
        "</div><div class='date'>" + spinList[i].date + "</div></div>").appendTo(jQuery(".left_frame"));
    }
  }

  renderHtml();


  var selected = false;

  if (activeLevelKey1 != '' && jQuery("#" + activeLevelKey1).size() > 0) {
    jQuery("#" + activeLevelKey1).trigger("click");
    selected = true;
  }
  else if (activeLevelKey2 != '' && jQuery("#" + activeLevelKey2).size() > 0) {
    jQuery("#" + activeLevelKey2).trigger("click");
    selected = true;
  }
  if (!selected) {
    if (jQuery(".cer_item").length > 0) {
      jQuery(".cer_item > div:first").trigger("click");
    }
  }
});


/***/ })
/******/ ]);
