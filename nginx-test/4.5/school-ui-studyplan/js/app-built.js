define('school-ui-studyplan/enum/client-storage-pair',{
	gl_tips: {
		keyName: "school_studyplan_gl_optional_tips",
		keyValue: ["closed"]
	},
	pl_tips: {
		keyName: "school_studyplan_pl_optional_tips",
		keyValue: ["closed"]
	},
	cp20_tips: {
		keyName: "school_studyplan_cp20_optional_tips",
		keyValue: ["closed"]
	},
	techcheck_state: {
		keyName: "school_studyplan_techcheck_state",
		keyValue: ["passed"]
	},
	legacy_techcheck_state: {
		keyName: "_TECHCHECK_PASSED",
		keyValue: [true]
	},
	shown_popover_ids: {
		keyName: "school_studyplan_item_shown_popover_ids"
	},
	shown_level_first: {
		keyName: "campus_studyplan_level_first_enter"
	}
});
define('school-ui-studyplan/enum/page-name',{
	"createSelectPace": "School:StudyPlan:Create:SelectPace",
	"createConfirm": "School:StudyPlan:Create:Confirm",
	"lesson1": "School:StudyPlan:Unit:Lesson1",
	"lesson2": "School:StudyPlan:Unit:Lesson2",
	"lesson3": "School:StudyPlan:Unit:Lesson3",
	"lesson4": "School:StudyPlan:Unit:Lesson4",
	"gl": "School:StudyPlan:Unit:GroupClass",
	"pl": "School:StudyPlan:Unit:PrivateClass",
	"goal": "School:StudyPlan:Unit:Goal"
});
define('school-ui-studyplan/enum/studyplan-item-state',{
	Completed: 1 << 0,
	Locked: 1 << 1
});
define('school-ui-studyplan/enum/studyplan-item-typecode',{
	lesson: "lesson",
	goal: "goal",
	gl: "gl",
	pl20: "sppl20",
	pl40: "pl",
	cp20: "cp20"
});
define('school-ui-studyplan/enum/studyplan-mode',{
	Create: 0,
	Locked: 1,
	Study: 2
});
define('school-ui-studyplan/enum/studyplan-state',{
	NotStarted : 0,
	Started : 1,
	Completed : 2
});
define('school-ui-studyplan/enum/studyplan-status',{
	"Completed" : {
		progressMsg: 656554,
		subMsg: 695052,
		tooltipMsg: '',
		customClass: 'cp-progress-complete'
	},
	"Nopace" : {
		progressMsg: 656581,
		subMsg: 695048,
		tooltipMsg: '',
		customClass: 'cp-progress-nopace'
	},
	"Fast" : {
		progressMsg: 694967,
		subMsg: 656562,
		tooltipMsg: '',
		customClass: 'cp-progress-fast'
	},
	"Normal" : {
		progressMsg: 694967,
		subMsg: 656561,
		tooltipMsg: '',
		customClass: 'cp-progress-normal'
	},
	"Slow" : {
		progressMsg: 694967,
		subMsg: 656563,
		tooltipMsg: '',
		customClass: 'cp-progress-slow'
	},
	"Crashing" : {
		progressMsg: 694967,
		subMsg: 656582,
		tooltipMsg: '',
		customClass: 'cp-progress-crashing'
	},
	"Crashed" : {
		progressMsg: 695050,
		subMsg: 695051,
		tooltipMsg: '',
		customClass: 'cp-progress-crashed'
	}
});
define('school-ui-studyplan/enum/studyplan-velocity',{
    Slow : 1,
    Normal : 2,
    Fast : 3,
    Crashing : 4,
    Crashed : 5
});
define('school-ui-studyplan/module',["module"], function(module){
    return module;
});
define('school-ui-studyplan/service/load-preview',[
	"troopjs-ef/component/service",
	"troopjs-browser/route/uri",
	"troopjs-utils/merge",
	"when/keys",
	"when",
	"poly",
	"school-ui-shared/utils/typeid-parser"
], function LoadModule(Service, URI, merge, when_keys, when, poly, Parser) {
	var UNDEFINED;
	var ROUTE = "_route";
	var CONTEXT = "_context";
	var CACHE = "_cache";
	var RE_TYPE = /^[^!]+!/;
	var PREFIX_TEMP_UNIT = "template_unit;";
	var PREFIX_TEMP_LESSON = "template_lesson;";
	var ARRAY_SLICE = Array.prototype.slice;
	var OBJECT_TOSTRING = Object.prototype.toString;

	function extend() {
		var me = this;
		ARRAY_SLICE.call(arguments).forEach(function (arg) {
			Object.keys(arg).forEach(function (key) {
				me[key] = arg[key];
			});
		});

		return me;
	}

	function all() {
		var args = ARRAY_SLICE.call(arguments);
		var count = args.length;

		while (args[--count] !== UNDEFINED);

		return count === -1;
	}

	function trim(array) {
		return array.slice(0, array.reduce(function (reduced, value, index) {
			return value !== UNDEFINED
				? index + 1
				: reduced;
		}, 0));
	}

	function first_value(array) {
		return array[0];
	}

	function strip_type(entity) {
		return entity && entity.id
			? entity.id.replace(RE_TYPE, "")
			: entity;
	}

	function uri2data(uri) {
		var data;

		var path = uri.path;
		var query = uri.query;

		switch (path ? path[0] : UNDEFINED) {
			case "preview" :
				data = {
					"prefix": path[0],
					"studyplan": path[1],
					"studyplan_item": path[2],
					"lesson": query.lesson_id
				};
				break;

			case "config" :
				data = {
					"prefix": path[0],
					"unit": query.unit_id
				};
				break;

			case "study" :
				data = {
					"prefix": path[0],
					"studyplan": path[1],
					"studyplan_item": path[2]
				};
				break;

			case "school" :
				data = {
					"prefix": path[0],
					"enrollment": path[1],
					"course": path[2],
					"level": path[3],
					"unit": path[4],
					"lesson": path[5],
					"step": path[6],
					"activity": path[7]
				};
				break;

			default :
				data = {};
		}

		merge.call(data, {
			"command" : (query && query.command) ? query.command.split("|") : UNDEFINED
		});

		return data;
	}

	function data2uri(data) {
		var uri = URI();

		//fixed new uri object don't need uri.path prop
		delete uri.path;

		switch (data["prefix"]) {
			case "preview" :
				uri.path = URI.Path(trim([
					data["prefix"],
					strip_type(data["studyplan"]),
					strip_type(data["studyplan_item"])
				]));
				uri.query = URI.Query({
					"lesson_id" : PREFIX_TEMP_LESSON + strip_type(data["lesson"].templateLessonId)
				});
				break;

			case "config" :
				uri.path = URI.Path(trim([ data["prefix"] ]));
				uri.query = URI.Query({
					"unit_id" : PREFIX_TEMP_UNIT + strip_type(data["unit"].templateUnitId)
				});
				break;

			case "study" :
				uri.path = URI.Path(trim([
					data["prefix"],
					strip_type(data["studyplan"]),
					strip_type(data["studyplan_item"])
				]));
				break;

			case "school" :
				uri.path = URI.Path(trim([
					data["prefix"],
					strip_type(data["enrollment"]),
					strip_type(data["course"]),
					strip_type(data["level"]),
					strip_type(data["unit"]),
					strip_type(data["lesson"]),
					strip_type(data["step"]),
					strip_type(data["activity"])
				]));
				break;
		}

		if(data.command) {
			merge.call(uri.query ? uri.query : uri.query = {}, URI.Query({
				"command" : data["command"].join("|")
			}));
		}

		return uri;
	}
	function load(requests, cache, results) {
		var me = this;
		var allRequests;
		//the requests need to load in next tick
		var deepRequests = [];

		//if there is a match cache data, use it.
		//return a array just because we use spread to get value after the promise resolved.
		function checkCache(key, value){
			return cache[key] && strip_type(cache[key]) == value && [cache[key]];
		}

		if(!requests) {
			return;
		}

		cache = cache || {};
		results = results || {};

		Object.keys(requests).forEach(function (key) {

			var value = requests[key];

			switch (OBJECT_TOSTRING.call(value)) {
				case "[object Object]":
					if(!value) {
						break;
					}

					if (value.load === false) {
						requests[key] = value.value;
						break;
					}

					value = value.value;

				case "[object String]":
				case "[object Number]":
					switch(key) {
						case "prefix":
							requests[key] = value;
							break;

						case "studyplan":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("campus_student_" + key + "!" + value + ".items")
								).spread(function (studyplan) {
									if(studyplan){
										deepRequests.push({
											"unit" : PREFIX_TEMP_UNIT + studyplan.properties.templateUnitId,
											"unit_studyplan": studyplan.properties.templateUnitId
										});
									}
									return studyplan;
								});
							break;

						case "studyplan_item":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("campus_student_" + key + "!" + value)
								).then(first_value);
							break;

						case "unit_studyplan":
							requests[key] = when(
								checkCache(key, value) ||
								me.query("campus_student_" + key + "!" + value + ".studyPlan.items,.studyPlan.progress")
							).then(first_value);
							break;

						case "unit":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("student_" + key + "!" + value + ".parent.parent")
								).spread(function (unit) {
									if(unit){
										deepRequests.push({
											"enrollment": Parser.parseId(unit.parent.parent.studentCourseId),
											"course": Parser.parseId(unit.parent.parent.id),
											"level": Parser.parseId(unit.parent.id),
											"unit_studyplan": unit.templateUnitId
										});
									}
									return unit;

								});

							break;
						case "level":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("student_" + key + "!" + value + ".levelName,.children")
								).then(first_value);
							break;

						case "lesson":
							requests[key] = when(
								checkCache(key, value) ||
								me.query("student_" + key + "!" + value + ".lessonImage")
							).then(first_value);
							break;

						case "activity":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("student_" + key + "!" + value + ".activityContent")
								).then(first_value);
							break;

						case "enrollment":
							requests[key] = when(
								checkCache(key, value) ||
								me.query("student_course_" + key + "!" + value)
							).then(first_value);
							break;

						default:
							requests[key] = when(
								checkCache(key, value) ||
								me.query("student_" + key + "!" + value)
							).then(first_value);
					}
					break;
				default :
					requests[key] = value;
			}
		});

		me.publish("school/spinner", allRequests = when_keys.all(requests));

		return allRequests
			.then(function (values) {
				Object.keys(values).forEach(function (key) {
					results[key] = values[key];
				});
				if(deepRequests.length){
					return load.call(me, extend.apply({}, deepRequests), cache, results);
				}
			})
			.yield(results);
	}

	return Service.extend({
		"displayName" : "school-ui-studyplan/service/load",

		"hub:memory/route" : function onRoute(uri) {
			var me = this;

			if (!(me[ROUTE] && uri && me[ROUTE].toString() === uri.toString())) {
				me.publish("load", uri2data(uri));
			}
		},

		"hub/load" : function onLoad(requests) {
			var me = this;
			var loadCache;
			var allRequests;

			if(!requests) {
				return;
			}
			me[CACHE] = me[CACHE] || {};
			me[ROUTE] = me[ROUTE] || data2uri({});

			// the cache which used in load function,
			// some key may be delete, so we clone here
			loadCache = extend.call({}, me[CACHE]);

			if(requests.prefix){
				allRequests = requests;
				loadCache = {};
			}
			else{
				allRequests = extend.call(uri2data(me[ROUTE]), requests);
				Object.keys(allRequests).forEach(function(key){
					if(key in requests){
						delete loadCache[key];
					}
				});
			}

			// do not merge when requesting a prefix, keep the allRequests data in a stable
			return me.publish("load/requests", allRequests)
				.spread(function (allRequests) {
					return me.publish("load/launcher", extend.call({}, allRequests))
						.then(function (){
							//just send the query requests not in cache
							return load.call(me, allRequests, loadCache)
								.then(function (results) {
									var updates = {};
									var cache = me[CACHE];
									var updated = Object.keys(results).reduce(function (update, key) {
										if ((key in results && !(key in cache))||
											cache[key] !== results[key]) {
											updates[key] = results[key];
											update = true;
										}
										cache[key] = results[key];
										return update;
									}, false);

									me[ROUTE] = data2uri(cache);

									return updated
										? me.publish("load/results", results)
										.then(function () {
											return me.publish("load/updates", updates)
												.then(function () {
													return me.publish("route/set", me[ROUTE])
														.then(function () {
															Object.keys(updates).map(function (key) {
																me.publish("load/" + key, updates[key]);
															});
														});
												});
										})
										.yield(updates)
										: me.publish("load/results", results)
										.yield(updates)
								});
						});
				});
		}
	});
});

define('school-ui-studyplan/service/load',[
	"troopjs-ef/component/service",
	"troopjs-browser/route/uri",
	"troopjs-utils/merge",
	"when/keys",
	"when",
	"poly",
	"school-ui-studyplan/enum/studyplan-mode",
	"school-ui-shared/utils/typeid-parser"
], function LoadModule(Service, URI, merge, when_keys, when, poly, studyplanMode, Parser) {
	var UNDEFINED;
	var ROUTE = "_route";
	var CONTEXT = "_context";
	var CACHE = "_cache";
	var RE_TYPE = /^[^!]+!/;
	var PREFIX_TEMP_UNIT = "template_unit;";
	var PREFIX_TEMP_LESSON = "template_lesson;";
	var ARRAY_SLICE = Array.prototype.slice;
	var OBJECT_TOSTRING = Object.prototype.toString;

	function extend() {
		var me = this;
		ARRAY_SLICE.call(arguments).forEach(function (arg) {
			Object.keys(arg).forEach(function (key) {
				me[key] = arg[key];
			});
		});

		return me;
	}

	function all() {
		var args = ARRAY_SLICE.call(arguments);
		var count = args.length;

		while (args[--count] !== UNDEFINED);

		return count === -1;
	}

	function trim(array) {
		return array.slice(0, array.reduce(function (reduced, value, index) {
			return value !== UNDEFINED
				? index + 1
				: reduced;
		}, 0));
	}

	function first_value(array) {
		return array[0];
	}

	function strip_type(entity) {
		return entity && entity.id
			? entity.id.replace(RE_TYPE, "")
			: entity;
	}

	function uri2data(uri) {
		var data;

		var path = uri.path;
		var query = uri.query;

		switch (path ? path[0] : UNDEFINED) {
			case "config" :
				data = {
					"prefix": path[0],
					"unit": query.unit_id
				};
				break;

			case "study" :
				data = {
					"prefix": path[0],
					"studyplan": path[1],
					"studyplan_item": path[2]
				};
				break;

			case "school" :
				data = {
					"prefix": path[0],
					"enrollment": path[1],
					"course": path[2],
					"level": path[3],
					"unit": path[4],
					"lesson": path[5],
					"step": path[6],
					"activity": path[7]
				};
				break;

			default :
				data = {};
		}

		merge.call(data, {
			"command" : (query && query.command) ? query.command.split("|") : UNDEFINED
		});

		return data;
	}

	function data2uri(data) {
		var uri = URI();

		//fixed new uri object don't need uri.path prop
		delete uri.path;

		switch (data["prefix"]) {
			case "config" :
				uri.path = URI.Path(trim([ data["prefix"] ]));
				uri.query = URI.Query({
					"unit_id" : PREFIX_TEMP_UNIT + strip_type(data["unit"].templateUnitId)
				});
				break;

			case "study" :
				uri.path = URI.Path(trim([
					data["prefix"],
					strip_type(data["studyplan"]),
					strip_type(data["studyplan_item"])
				]));
				break;

			case "school" :
				uri.path = URI.Path(trim([
					data["prefix"],
					strip_type(data["enrollment"]),
					strip_type(data["course"]),
					strip_type(data["level"]),
					strip_type(data["unit"]),
					strip_type(data["lesson"]),
					strip_type(data["step"]),
					strip_type(data["activity"])
				]));
				break;
		}

		if(data.command) {
			merge.call(uri.query ? uri.query : uri.query = {}, URI.Query({
				"command" : data["command"].join("|")
			}));
		}

		return uri;
	}
	function load(requests, cache, results) {
		var me = this;
		var allRequests;
		//the requests need to load in next tick
		var deepRequests = [];

		//if there is a match cache data, use it.
		//return a array just because we use spread to get value after the promise resolved.
		function checkCache(key, value){
			return cache[key] && strip_type(cache[key]) == value && [cache[key]];
		}

		if(!requests) {
			return;
		}

		cache = cache || {};
		results = results || {};

		Object.keys(requests).forEach(function (key) {

			var value = requests[key];

			switch (OBJECT_TOSTRING.call(value)) {
				case "[object Object]":
					if(!value) {
						break;
					}

					if (value.load === false) {
						requests[key] = value.value;
						break;
					}

					value = value.value;

				case "[object String]":
				case "[object Number]":
					switch(key) {
						case "prefix":
							requests[key] = value;
							break;

						case "studyplan":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("campus_student_" + key + "!" + value + ".items")
								).spread(function (studyplan) {
									if(studyplan){
										deepRequests.push({
											"unit" : PREFIX_TEMP_UNIT + studyplan.properties.templateUnitId,
											"unit_studyplan": studyplan.properties.templateUnitId
										});
									}
									return studyplan;
								});
							break;

						case "studyplan_item":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("campus_student_" + key + "!" + value)
								).spread(function (studyplan_item) {

									if(studyplan_item){
										switch (studyplan_item.typeCode) {
											case UNDEFINED:
												//if there is not typeCode in studyplan_item, return undefiend
												return UNDEFINED;
												break;
											case "lesson":
												return me.query("pc_student_lesson_map!" + studyplan_item.properties.templateLessonId).spread(function(lessonMap){
													deepRequests.push({
														"lesson": Parser.parseId(lessonMap.lesson.id)
													});

													return studyplan_item;
												});
												break;
											default:
												return studyplan_item;
												break;
										}
									}

								});
							break;

						case "unit_studyplan":
							var queryString = "campus_student_" + key + "!" + value + ".studyPlan";
							requests[key] = when(
								checkCache(key, value) ||
								me.query(queryString + ".items")
							).spread(function(unitStudyplan){
								if(unitStudyplan.mode === studyplanMode.Study){
									return me.query(queryString + ".progress").then(first_value);
								} else {
									return unitStudyplan;
								}
							});
							break;

						case "unit":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("student_" + key + "!" + value + ".parent.parent")
								).spread(function (unit) {
									if(unit){
										deepRequests.push({
											"enrollment": Parser.parseId(unit.parent.parent.studentCourseId),
											"course": Parser.parseId(unit.parent.parent.id),
											"level": Parser.parseId(unit.parent.id),
											"unit_studyplan": unit.templateUnitId
										});
									}
									return unit;

								});

							break;
						case "level":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("student_" + key + "!" + value + ".levelName,.children")
								).then(first_value);
							break;

						case "lesson":
							requests[key] = when(
								checkCache(key, value) ||
								me.query("student_" + key + "!" + value + ".lessonImage")
							).then(first_value);
							break;

						case "activity":
							requests[key] = when(
									checkCache(key, value) ||
									me.query("student_" + key + "!" + value + ".activityContent")
								).then(first_value);
							break;

						case "enrollment":
							requests[key] = when(
								checkCache(key, value) ||
								me.query("student_course_" + key + "!" + value)
							).then(first_value);
							break;

						default:
							requests[key] = when(
								checkCache(key, value) ||
								me.query("student_" + key + "!" + value)
							).then(first_value);
					}
					break;
				default :
					requests[key] = value;
			}
		});

		me.publish("school/spinner", allRequests = when_keys.all(requests));

		return allRequests
			.then(function (values) {
				Object.keys(values).forEach(function (key) {
					results[key] = values[key];
					cache[key] = results[key];
				});
				if(deepRequests.length){
					return load.call(me, extend.apply({}, deepRequests), cache, results);
				}
			})
			.yield(results);
	}

	return Service.extend({
		"displayName" : "school-ui-studyplan/service/load",

		"hub:memory/route" : function onRoute(uri) {
			var me = this;

			if (!(me[ROUTE] && uri && me[ROUTE].toString() === uri.toString())) {
				me.publish("load", uri2data(uri));
			}
		},

		"hub/load" : function onLoad(requests) {
			var me = this;
			var loadCache;
			var allRequests;

			if(!requests) {
				return;
			}
			me[CACHE] = me[CACHE] || {};
			me[ROUTE] = me[ROUTE] || data2uri({});

			// the cache which used in load function,
			// some key may be delete, so we clone here
			loadCache = extend.call({}, me[CACHE]);

			if(requests.prefix){
				allRequests = requests;
				loadCache = {};
			}
			else{
				allRequests = extend.call(uri2data(me[ROUTE]), requests);
				Object.keys(allRequests).forEach(function(key){
					if(key in requests){
						delete loadCache[key];
					}
				});
			}

			// do not merge when requesting a prefix, keep the allRequests data in a stable
			return me.publish("load/requests", allRequests)
				.spread(function (allRequests) {
					return me.publish("load/launcher", extend.call({}, allRequests))
						.then(function (){
							//just send the query requests not in cache
							return load.call(me, allRequests, loadCache)
								.then(function (results) {
									var updates = {};
									var cache = me[CACHE];
									var updated = Object.keys(results).reduce(function (update, key) {
										if ((key in results && !(key in cache))||
											cache[key] !== results[key]) {
											updates[key] = results[key];
											update = true;
										}
										cache[key] = results[key];
										return update;
									}, false);

									me[ROUTE] = data2uri(cache);

									return updated
										? me.publish("load/results", results)
										.then(function () {
											return me.publish("load/updates", updates)
												.then(function () {
													return me.publish("route/set", me[ROUTE])
														.then(function () {
															Object.keys(updates).map(function (key) {
																me.publish("load/" + key, updates[key]);
															});
														});
												});
										})
										.yield(updates)
										: me.publish("load/results", results)
										.yield(updates)
								});
						});
				});
		}
	});
});

define('school-ui-studyplan/service/republish',[
	"jquery",
	"troopjs-ef/component/service",
	"school-ui-shared/utils/typeid-parser",
	"poly"
], function studyplanRepublish($, Service, Parser, poly) {
	"use strict";

	return Service.extend({
		// hack for summary page of activity container
		"hub/load/requests": function (requests) {
			var _requests = {};

			if(!requests) {
				return;
			}

			Object.keys(requests).forEach(function (key) {
				var value = requests[key];
				_requests[key] = (key === "activity" && value === "summary")
					? {
					"value": value,
					"load": false
				}
					: value;
			});

			return [ _requests ];
		},

		// re-publish to start/load
		"hub/load/results": function(results){
			if(results.activity && results.activity.templateActivityId) {
				this.publish("start/load/activity", {id: results.activity.templateActivityId});
			}
		},

		// re-publish to load step summary
		"hub:memory/load/activity": function(activity){
			if(activity == "summary") {
				this.publish("load/step/summary");
			}
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/shared/cp-pace-config/pace-config.html',[],function() { return function template(data) { var o = "";
	var blurbIds = data.blurbIds;
o += "\n\n"; if(data.status.key === 'Completed'){o += "\n\t<div class=\"cp-pace-complete\">\n\t\t"; if(data.status.code === 'level_complete'){o += "\n\t\t\t<div class=\"complete-left\">\n\t\t\t\t<div class=\"cp-certificate\">\n\t\t\t\t\t<div class=\"cp-certificate-content\">\n\t\t\t\t\t\t<span class=\"cp-certificate-text\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695071\">You've already passed this level test</span>\n\t\t\t\t\t\t<i class=\"ets-icon-badge-checkmark\"></i>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"cp-certificate-action\">\n\t\t\t\t\t\t<a data-url=\"" +data.certUrl+ "\" class=\"cp-certificate-action-text\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695072\">view certificate</a>\n\t\t\t\t\t\t<i class=\"ets-icon-cp-arrow-right\"></i>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"cp-retake\">\n\t\t\t\t\t<a href=\"" +data.levelTestPath+ "?testid=" +data.levelTestId+ "\" class=\"btn cp-complete-next\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695073\">\n\t\t\t\t\t</a>\n\t\t\t\t\t<span class=\"ets-icon-cp-arrow-right\"></span>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"; } o += "\n\t\t<div class=\"complete-right\">\n\t\t\t<div>\n\t\t\t\t<img src=\"/_imgs/school/changecourse/pepper/ge/13.jpg\"/>\n\t\t\t</div>\n\t\t\t"; if(data.status.code === 'unit_complete'){o += "\n\t\t\t\t<a class=\"btn cp-complete-next cp-next-unit\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +blurbIds.cpNextUnit+ "\">\n\t\t\t\t</a>\n\t\t\t"; } else if(data.status.code === 'course_change'){ o += "\n\t\t\t\t<a class=\"btn cp-complete-next cp-course-change\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +blurbIds.cpCourseChange+ "\">\n\t\t\t\t</a>\n\t\t\t"; } else if(data.status.code === 'level_complete'){ o += "\n\t\t\t\t"; if(data.isLastLevel){o += "\n\t\t\t\t<a class=\"btn cp-complete-next cp-course-change\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +blurbIds.cpCourseChange+ "\">\n\t\t\t\t</a>\n\t\t\t\t";}else{o += "\n\t\t\t\t<a class=\"btn cp-complete-next cp-next-level\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695074\">\n\t\t\t\t</a>\n\t\t\t\t";}o += "\n\t\t\t";} else {o += "\n\t\t\t\t<a href=\"" +data.levelTestPath+ "?testid=" +data.levelTestId+ "\" class=\"btn cp-complete-next\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695076\">\n\t\t\t\t</a>\n\t\t\t"; } o += "\n\t\t</div>\n\t</div>\n"; }  return o; }; });
define('school-ui-studyplan/utils/widget-creator',[
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
define('school-ui-studyplan/shared/cp-pace-config/main',[
	"school-ui-studyplan/module",
	"jquery",
	"when",
	"moment",
	"poly",
	"lodash",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/moment-language",
	"template!./pace-config.html",
	"school-ui-studyplan/utils/widget-creator",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-shared/enum/course-type"
], function(module, $, when, Moment, Poly, _, Widget, momentLang, tPaceConfig, widgetCreator, typeidParser, CourseType){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var UNDEF;

	var MODULE_CONFIG = _.merge({
		changeCourseUrl: "/school/changecourse",
		certUrl: "/school/course/CertificateBoard.aspx?key=",
		levelTestPath: "/school/content/leveltest.aspx",
		blurbIds: {
			cpNextUnit: "695095",
			cpCourseChange: "656560",
		}
	}, module.config() || {});

	var $ELEMENT = "$element";

	var CULTURE_CODE = "_culture_code",
		STATUS = "_status";

	var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

	function convertToLegacyItem(certItem) {
		return {
			"date": Moment(certItem.certificateDate).lang("en").format("MMM DD, YYYY"),
			"course": certItem.courseName || "",
			"level": certItem.levelName,
			"Key": certItem.key,
			"levelCertificate": certItem.certificateName,
			"coursetype": 2,
			"name": certItem.studentName
		};
	}

	function initCertificateData(certItems, archiveCertItems) {
		var me = this;
		var certDataGE = [];
		var certDataSPIN = [];

		[certItems, archiveCertItems].forEach(function (items) {
			items.forEach(function (item) {
				var legacyItem = convertToLegacyItem(item);
				if (CourseType.isGECourse(item.courseTypeCode)) {
					certDataGE.push(legacyItem)
				}
				else {
					certDataSPIN.push(legacyItem);
				}
			});
		});

		window.generalCertificates = certDataGE;
		window.spinCertificates = certDataSPIN;
	}

	function render(){
		var me = this;

		return when.all([
			me.dfdResults.promise,
			me.levelTestVersionPromise,
			me.certPromise,
		]).spread(function (results, levelTestVersion, certficate) {
			var studentCert = certficate[0];
			var studentArchiveCert = certficate[1];
			var certItems = $.extend(true, [], studentCert.items);
			var archiveCertItems = $.extend(true, [], studentArchiveCert.items);
			var levelTestId = levelTestVersion === 1 ? results.level.legacyLevelId : results.level.templateLevelId;
			initCertificateData.call(me, certItems, archiveCertItems);

			return me.html(tPaceConfig, {
				isLastLevel: isLastLevel(results),
				status: me[STATUS],
				levelTestPath: MODULE_CONFIG.levelTestPath,
				levelTestId: levelTestId,
				certUrl: MODULE_CONFIG.certUrl + results.course.courseTypeCode + '_' + results.level.levelCode,
				blurbIds: MODULE_CONFIG.blurbIds
			});
		});
	}

	function isLastLevel(data){
		var isGE = CourseType.isGECourse((data.course || {}).courseTypeCode);
		var level = data.level;
		var levels = data.course.children;
		var levelLen = data.course.children.length;
		var isLastLevel = false;
		if(isGE) {
			if(level.templateLevelId === levels[levelLen-1].templateLevelId) {
				isLastLevel = true;
			}
		} else {
			// For SPIN course, alway let student select course
			isLastLevel = true;
		}

		return	isLastLevel;
	}

	return Widget.extend(function(){
		var me = this;

		me[STATUS] = me[$ELEMENT].data("status");
		me.dfdResults = when.defer();

		me.levelTestVersionPromise = me.query(MSS_LEVEL_TEST_VERSION).spread(function (mssLevelTestVersion) {
			return parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);
		});

		me.certPromise = me.query([
			"student_certificate!*",
			"student_archive_certificate!*"
		]);
	},{

		"hub:memory/common_context" : function(common_context){
			var me = this;
			common_context && render.call(me, me[CULTURE_CODE] = common_context.values.culturecode.value);
		},

		"hub:memory/load/results": function(data) {
			this.dfdResults.resolve(data);
		},

		"dom: .cp-next-unit/click": function(){
			var me = this;
			me.publish('ef/next/unit');
		},

		"dom: .cp-next-level/click": function(){
			var me = this;
			me.publish("enroll/next/level")
		},

		"dom: .cp-course-change/click": function(){
			window.location.href = MODULE_CONFIG.changeCourseUrl;
		},

		"dom: .cp-certificate-action/click": function(){
			var me = this;
			var resultURL = me.$element.find('.cp-certificate-action-text').data('url');
			window.open(resultURL);
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/shared/cp-pace-select/pace-select.html',[],function() { return function template(data) { var o = ""; for (var i = 0; i < data.paces.length; i++) { o += "\n\t";
		var selectedClass = data.paces[i].selected ? 'pace-item-selected' : '';
		var ownPace = data.paces[i].paceDays === 0 ? 'cp-goal-own-pace' : '';
		var paceValue = data.paces[i].paceDays === 0 ?
		'no-pace' : 'pace-value';
	o += "\n\t<div class=\"pace-item-edit " +selectedClass+ " " +ownPace+ "\" data-pacedays = \"" +data.paces[i].paceDays+ "\">\n\t\t<div class=\"ets-sp-cfg-item cp-pace-item cp-pace-left\">\n\t\t\t<div class=\"cp-pace-left-body\">\n\t\t\t\t<span class=\"pace-item-icon\"></span> \n\t\t\t\t<span class=\"" +paceValue+ "\">" +data.paces[i].text+ "</span>\n\t\t\t\t<span class=\"pace-name\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"694970\"\n\t\t\t\t>Hours Weekly</span>\n\t\t\t</div>\n\t\t</div><!--\n\t\t--><div class=\"ets-sp-cfg-item cp-pace-item cp-pace-right\">\n\t\t\t<p class=\"goal-date\">" +data.paces[i].targetDate+ "</p>\n\t\t\t<p class=\"goal-timezone\"></p>\n\t\t</div>\n\t</div>\n"; }  return o; }; });
define('school-ui-studyplan/shared/cp-pace-select/main',[
	"jquery",
	"lodash",
	"troopjs-ef/component/widget",
	"template!./pace-select.html"
], function($, _, Widget, tPaceSelect){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var UNDEF;

	var $ELEMENT = "$element";

	var PACES = "_paces";

	var EVT_MOUSEDOWN = "mousedown.pace";

	var SEL_CONFIG_CONTAINER = ".ets-studyplan",
		SEL_PACE = ".ets-sp-cfg-pace",
		SEL_PACELIST = ".ets-sp-cfg-paceList",
		SEL_PACEBUTTON = ".ets-sp-cfg-pace-button",
		SEL_PACELIST_WRAPPER = ".ets-sp-cfg-paceList-wrapper";

	var CLS_PACESELECT_VIEW = "ets-cfg-paceSelect-view";

	var HUB_PACESELECT = "config/pace-select";

	function open(){
		var me = this;
		var height = me[$ELEMENT].find(SEL_PACELIST).outerHeight();
		me[$ELEMENT].find(SEL_PACELIST_WRAPPER).height(height);
		me[$ELEMENT].attr("data-status", "open");
	}

	function close(){
		var me = this;
		me[$ELEMENT].find(SEL_PACELIST_WRAPPER).height(0);
		me[$ELEMENT].attr("data-status", "close");
	}

	return Widget.extend(function(){
		var me = this;
		me[PACES] = me[$ELEMENT].data("paces");
	},{
		"sig/start" : function(){
			var me = this;

			$(SEL_CONFIG_CONTAINER).off(EVT_MOUSEDOWN).on(EVT_MOUSEDOWN, function(event){
				if ($(event.target).parents(SEL_PACE).length == 0){
					close.call(me);
				}
			});

			return me.html(tPaceSelect, {
				paces: me[PACES]
			});
		},

		"sig/stop": function onStop() {
			$(SEL_CONFIG_CONTAINER).off(EVT_MOUSEDOWN);
		},

		"hub/config/pace-select/toggle": function(status){
			var me = this;
			if(status === "open") {
				open.call(me);
			}
			else if(status === "close") {
				close.call(me);
			}
		},

		"dom:.ets-sp-cfg-pace-button/click": function(evt){
			var me = this;

			if(!me[$ELEMENT].hasClass(CLS_PACESELECT_VIEW)){
				open.call(me);
			}
		},

		"dom:ul li .ets-sp-cfg-pace-item/click": function(evt){
			var me = this;
			var $currentTarget = $(evt.currentTarget);
			var days = parseInt($currentTarget.attr("data-days"));

			me.publish(HUB_PACESELECT, days);

			me[$ELEMENT].find(SEL_PACEBUTTON).find("div").html($currentTarget.html());

			close.call(me);
		},

		"dom:.pace-item-edit/click" : function(e){
			var me = this;
			var $element = $(e.currentTarget);
			$element
				.addClass('pace-item-selected')
				.siblings()
				.removeClass('pace-item-selected');

			me.publish(HUB_PACESELECT, $element.data('pacedays'));
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/shared/pace-config/pace-config.html',[],function() { return function template(data) { var o = "";
	var paces = data.paces;
	var targetDate = data.targetDate;
	var paceDays = data.paceDays;
	var leftDays = data.leftDays;
	var mode = data.paceSelectMode;
o += "\n<div class=\"ets-sp-cfg-item\">\n\t<div class=\"ets-sp-cfg-item-title\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656056\" data-text-en=\"My pace\"></span>\n\t</div>\n\t<div class=\"ets-sp-cfg-item-detail\">\n\t\t<div class=\"ets-cfg-paceSelect " + (mode === 'view'? 'ets-cfg-paceSelect-view' : '')+ "\" data-weave=\"school-ui-studyplan/shared/pace-select/main\" data-paces='" + JSON.stringify(paces).replace(/\'/g, "&#39;")+ "'></div>\n\t</div>\n</div>\n<div class=\"ets-sp-cfg-item\">\n\t<div class=\"ets-sp-cfg-item-title\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"569851\" data-text-en=\"Target date\"></span>\n\t</div>\n\t<div class=\"ets-sp-cfg-item-detail ets-sp-cfg-item-targetDate\">\n\t\t<h2>" + (targetDate ? targetDate : "&mdash;&mdash;" ) + "</h2>\n\t</div>\n</div>\n<div class=\"ets-sp-cfg-item\">\n\t<div class=\"ets-sp-cfg-item-title\">\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656057\" data-text-en=\"Remaining days\"></span>\n\t</div>\n\t<div class=\"ets-sp-cfg-item-detail ets-sp-cfg-item-days\">\n\t\t<h2>" + (leftDays === undefined ? (paceDays ? paceDays : "&mdash;&mdash;") : leftDays) + "</h2>\n\t\t<span class=\"" + (paceDays ? '' : 'ets-none') + "\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656058\" data-text-en=\"Days\">Days</span>\n\t</div>\n</div>"; return o; }; });
define('school-ui-studyplan/shared/pace-config/main',[
	"jquery",
	"when",
	"moment",
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/moment-language",
	"template!./pace-config.html"
], function($, when, Moment, Poly, Widget, momentLang, tPaceConfig){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var UNDEF;

	var $ELEMENT = "$element";

	var CULTURE_CODE = "_culture_code",
		PACES = "_paces",
		CONFIG = "_config",
		MODE = "_mode",
		CONFIG_ORIG = "_config_original";

	var LONG_DASH = "&mdash;&mdash;";

	var SEL_ITEM_TARGETDATE = ".ets-sp-cfg-item-targetDate",
		SEL_ITEM_DAYS = ".ets-sp-cfg-item-days",
		SEL_PACESELECT = ".ets-cfg-paceSelect";

	var CLS_NONE = "ets-none",
		CLS_PACESELECT_VIEW = "ets-cfg-paceSelect-view";

	var DOWNLIST_DURATION = 200;

	var MODE_VIEW = "view",
		MODE_EDIT = "edit";

	var HUB_PACESELECT_TOGGLE = "config/pace-select/toggle",
		HUB_PACECHANGE = "config/pace-change";

	function render(culturecode, pace_config){
		var me = this;
		var paceDays;
		var config = pace_config ? pace_config : me[CONFIG];
		var noSelectedInConfig;

		if(config.paceDays) {
			paceDays = parseInt(config.paceDays, 10);
		}
		else {
			noSelectedInConfig = config.paces.every(function(e, i){
				if(e.selected) {
					paceDays = e.paceDays;
					return false;
				}
				else {
					return true;
				}
			});
			// if there is not a selected pace, selecte the first one by default
			if(noSelectedInConfig){
				config.paces[0].selected = true;
				paceDays = config.paces[0].paceDays;
			}

		}

		return when(config.endDate ?
			localLang(culturecode, config.endDate).format("ll") :
			getTargetDate.call(me, culturecode, paceDays)).then(function(targetDate) {

				return me.html(tPaceConfig, {
					paces: config.paces,
					targetDate: paceDays ? targetDate : UNDEF,
					paceDays: paceDays,
					leftDays: config.leftDays,
					paceSelectMode: me[MODE]
				})
				.then(function(){
					// if there is not a selected pace, enter edit mode to open the pace list
					noSelectedInConfig && me.publish("config/pace-config/mode", MODE_EDIT);
				});
			});
	}

	function getTargetDate(culturecode, paceDays){
		var me = this;
		return me.publish("studyplan/get/serverTime").then(function(now){
			return localLang(culturecode, now).add("days", paceDays).format("ll");
		});
	}

	function localLang(culturecode, date) {
		var moment = Moment(date);
		moment.lang(momentLang[culturecode.toLowerCase()]);
		return moment;
	}

	return Widget.extend(function(){
		var me = this;
		var config = me[$ELEMENT].data("config");

		me[CONFIG] = config;
		me[CONFIG_ORIG] = $.extend(true, {}, config);
		me[PACES] = me[CONFIG].paces;
		me[MODE] = me[$ELEMENT].data("mode");
	},{

		"hub:memory/common_context" : function(common_context){
			var me = this;
			common_context && render.call(me, me[CULTURE_CODE] = common_context.values.culturecode.value);
		},

		"hub/config/pace-select": function(days){
			var me = this;
			var $targetDate = me[$ELEMENT].find(SEL_ITEM_TARGETDATE).find("h2");
			var $days = me[$ELEMENT].find(SEL_ITEM_DAYS).find("h2");

			getTargetDate.call(me, me[CULTURE_CODE], days).then(function(targetDate){
				if(days) {
					$targetDate.html(targetDate);
					$days.html(days);
					$days.siblings("span").removeClass(CLS_NONE);
				}
				else {
					$targetDate.html(LONG_DASH);
					$days.html(LONG_DASH);
					$days.siblings("span").addClass(CLS_NONE);
				}

				me[PACES].forEach(function(e, i){
					e.selected && delete e.selected;

					if(e.paceDays == days) {
						e.selected = true;
					}
				});

				me.publish(HUB_PACECHANGE, me[PACES]);
			});
		},

		"hub/config/pace-config/mode": function(mode) {
			var me = this;
			var $PACESELECT = me[$ELEMENT].find(SEL_PACESELECT);
			me[MODE] = mode;
			me[$ELEMENT].attr("data-mode", mode);

			switch (mode) {
				case MODE_EDIT:
					me.publish(HUB_PACESELECT_TOGGLE, "open");
					setTimeout(function(){
						$PACESELECT.removeClass(CLS_PACESELECT_VIEW);
					}, DOWNLIST_DURATION);

					//set default value, this hub means start change pace
					me.publish(HUB_PACECHANGE, me[PACES]);
					break;

				case MODE_VIEW:
					me.publish(HUB_PACESELECT_TOGGLE, "close");

					$PACESELECT.addClass(CLS_PACESELECT_VIEW);
					render.call(me, me[CULTURE_CODE], me[CONFIG_ORIG]);
					break;
			}

		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/shared/pace-select/pace-select.html',[],function() { return function template(data) { var o = "";
	var paces = data;
o += "\n<div class=\"ets-sp-cfg-pace\">\n\n\t";
		for (var i = 0; i < paces.length; i++) {
			findSelect(paces[i], i);
		}
	o += "\n\t<div class=\"ets-sp-cfg-paceList-wrapper\">\n\t\t<ul class=\"ets-sp-cfg-paceList\">\n\t\t\t";
				for (var i = 0; i < paces.length; i++) {
					render(paces[i], i);
				}
			o += "\n\t\t</ul>\n\t</div>\n</div>\n\n"; function findSelect(pace) { o += "\n\t"; if(pace.selected){ o += "\n\t\t<div class=\"ets-sp-cfg-pace-item ets-sp-cfg-pace-button\">\n\t\t\t<div>\n\t\t\t"; if(pace.paceDays){ o += "\n\t\t\t\t<h2>" + pace.text + "</h2><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"569848\" data-text-en=\"hours weekly\"></span>\n\t\t\t"; } else { o += "\n\t\t\t\t" + pace.text + "\n\t\t\t"; } o += "\n\t\t\t</div> <i class=\"glyphicon icon-caret-down\"></i>\n\t\t</div>\n\t"; } o += "\n"; } o += "\n\n"; function render(pace) { o += "\n\t<li>\n\t\t<div class=\"ets-sp-cfg-pace-item\" data-days=\"" + pace.paceDays + "\" data-points=\"" + pace.pacePoints + "\" data-text=\"" + pace.text + "\">\n\t\t\t"; if(pace.paceDays){ o += "\n\t\t\t\t<h2>" + pace.text + "</h2><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"569848\" data-text-en=\"hours weekly\"></span>\n\t\t\t"; } else {o += "\n\t\t\t\t" + pace.text + "\n\t\t\t"; } o += "\n\t\t</div>\n\t</li>\n"; }  return o; }; });
define('school-ui-studyplan/shared/pace-select/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"template!./pace-select.html"
], function($, Widget, tPaceSelect){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var UNDEF;

	var $ELEMENT = "$element";

	var PACES = "_paces";

	var EVT_MOUSEDOWN = "mousedown.pace";

	var SEL_CONFIG_CONTAINER = ".ets-studyplan",
		SEL_PACE = ".ets-sp-cfg-pace",
		SEL_PACELIST = ".ets-sp-cfg-paceList",
		SEL_PACEBUTTON = ".ets-sp-cfg-pace-button",
		SEL_PACELIST_WRAPPER = ".ets-sp-cfg-paceList-wrapper";

	var CLS_PACESELECT_VIEW = "ets-cfg-paceSelect-view";

	var HUB_PACESELECT = "config/pace-select";

	function open(){
		var me = this;
		var height = me[$ELEMENT].find(SEL_PACELIST).outerHeight();
		me[$ELEMENT].find(SEL_PACELIST_WRAPPER).height(height);
		me[$ELEMENT].attr("data-status", "open");
	}

	function close(){
		var me = this;
		me[$ELEMENT].find(SEL_PACELIST_WRAPPER).height(0);
		me[$ELEMENT].attr("data-status", "close");
	}

	return Widget.extend(function(){
		var me = this;
		me[PACES] = me[$ELEMENT].data("paces");
	},{
		"sig/start" : function(){
			var me = this;

			$(SEL_CONFIG_CONTAINER).off(EVT_MOUSEDOWN).on(EVT_MOUSEDOWN, function(event){
				if ($(event.target).parents(SEL_PACE).length == 0){
					close.call(me);
				}
			});

			return me.html(tPaceSelect, me[PACES]);
		},

		"sig/stop": function onStop() {
			$(SEL_CONFIG_CONTAINER).off(EVT_MOUSEDOWN);
		},

		"hub/config/pace-select/toggle": function(status){
			var me = this;
			if(status === "open") {
				open.call(me);
			}
			else if(status === "close") {
				close.call(me);
			}
		},

		"dom:.ets-sp-cfg-pace-button/click": function(evt){
			var me = this;

			if(!me[$ELEMENT].hasClass(CLS_PACESELECT_VIEW)){
				open.call(me);
			}
		},

		"dom:ul li .ets-sp-cfg-pace-item/click": function(evt){
			var me = this;
			var $currentTarget = $(evt.currentTarget);
			var days = parseInt($currentTarget.attr("data-days"));

			me.publish(HUB_PACESELECT, days);

			me[$ELEMENT].find(SEL_PACEBUTTON).find("div").html($currentTarget.html());

			close.call(me);
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/shared/tooltip/main.html',[],function() { return function template(data) { var o = "<div class=\"campus-tooltip " + data.customClass+ "\">\n\t<div class=\"tooltip-title\">\n\t\t<span class=\"title-text\"></span>\n\t\t<div class=\"title-icon\">\n\t\t\t<span class=\"ets-icon-mob-tip\"></span>\n\t\t\t<span class=\"ets-icon-cp-arrow-up " +data.expand+ "\"></span>\n\t\t</div>\n\t</div>\n\t<div class=\"tooltip-body " +data.expand+ "\">\n\t\t<p class=\"tooltip-content\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + data.content+ "\"></p>\n\t\t<span class=\"ets-icon-cp-close\"></span>\n\t</div>\n</div>"; return o; }; });
define('school-ui-studyplan/shared/tooltip/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"template!./main.html"
], function($, Widget, template){
	"use strict";
	return Widget.extend(function($element, displayName, options){
		var me = this;
		me.options = options;
	},{
		"sig/start" : function(){
			var me = this;
			return me.html(template, {
				content: me.options.content,
				customClass: me.options.customClass,
				expand: me.options.expand ? '' : 'ets-none'
			});
		},

		"dom:.campus-tooltip/click": function(e){
			e.stopPropagation();
		},

		"dom: .title-icon/click": function(){
			var me = this;
			me.$element.find('.ets-icon-cp-arrow-up').toggleClass('ets-none');
			me.$element.find('.tooltip-body').toggleClass('ets-none');
		},

		"dom:.ets-icon-cp-close/click": function(){
			var me = this;
			me.$element.find('.ets-icon-cp-arrow-up').addClass('ets-none');
			me.$element.find('.tooltip-body').addClass('ets-none');
			me.$element.trigger("tooltip/close");
		}
	});
});

define('school-ui-studyplan/utils/animation-helper',[
	"when",
	"poly/array",
	"poly/object",
	"troopjs-ef/component/gadget"
], function (when, polyArray, polyObject, Gadget) {
	"use strict";

	var UNDEF;

	var READY = "ready";
	var WAIT = "wait";
	var FINISHED = "finished";

	var CB = "cb";
	var STATE = "state";

	var DEPS = "deps";
	var SYNC = "sync";

	var ANIMATION_CB = {};

	var ALL_SYNC_CB = {};

	var DURATION_ZERO = 0;

	/**
	 * config animation in here
	 * "deps" means this animation need to depend on another one
	 * "sync" means this animation need to start with another one at the same time
	 */
	var CONFIG = {
		"unitNav_seqCon": {
			"deps": [],
			"sync": ["unitNav_seqNav"]
		},
		"unitNav_seqNav": {
			"deps": [],
			"sync": ["unitNav_seqCon"]
		},
		"itemChange_seqCon": {
			"deps": [],
			"sync": []
		},
		"goalEnter": {
			"deps": ["itemChange_seqCon", "unitNav_seqNav", "unitNav_seqCon"],
			"sync": []
		}
	};

	function checkDeps(){
		var deps = [];
		Object.keys(CONFIG).forEach(function (e, i) {
			if (CONFIG[e][DEPS].length > 0) {
				/**
				 * Figure out dependence form config object
				 *
				 * check animation self callback is existing or not?
				 * if self is existing, it means animation did't run yet, we need to continue to confirm dependent item.
				 *
				 * if dependent item is existing, we need to check item state is "finished" or not
				 * if dependent item isn't existing, it means animation didn't initialize.
				 * if animation state isn't "wait"
				 *
				 * both these three cases, we will return true and we will run this animation.
				 */
				var isReady = CONFIG[e][DEPS].reduce(function (prev, current) {
					if ((ANIMATION_CB[e] && ANIMATION_CB[e][CB]) &&
						(ANIMATION_CB[e][STATE] != WAIT) &&
						((ANIMATION_CB[current] && ANIMATION_CB[current][STATE] === FINISHED) ||
						ANIMATION_CB[current] === UNDEF)) {
						return prev && true;
					}
					else {
						return prev && false;
					}
				}, true);

				if(isReady) {
					if(CONFIG[e][SYNC].length > 0) {
						checkSync(e);
					}
					else {
						deps.push(e) && (ANIMATION_CB[e][STATE] = WAIT);
					}
				}
			}
		});

		/**
		 * Because we have a case like two animation depand on the same one.
		 * We need to collect these animation and after all of that is finished, then we can clean their callback to avoid second running.
		 * Otherwise, if we run these separately, after fisrt one finished and we clean the callback, the second one will be failed.
		 */
		if(deps.length > 0){
			/**
			 * Sometimes, Firefox can't run the animation because browser process.
			 * We can use ZERO timeout and move callback function into a new queue to fixed that.
			 */
			setTimeout(function(){
				when.map(deps, function(e, i){
					return ANIMATION_CB[e][CB]();
				}).then(function(){
					deps.forEach(function(e, i){
						ANIMATION_CB[e]["state"] = FINISHED;
						checkSync(e);
					});
				});
			}, DURATION_ZERO);
		}
	}

	function checkSync(name){
		var syncName = [name];

		/**
		 * collect all sync item name
		 */
		CONFIG[name][SYNC].forEach(function(e, i) {
			syncName.push(e);
		});

		/**
		 * if we have two sync animation A and B, we will combin these two into one property like A^B
		 */
		var syncNameCombin = syncName.sort().join("^");
		if(!ALL_SYNC_CB[syncNameCombin]) {
			ALL_SYNC_CB[syncNameCombin] = [];
		}
		ALL_SYNC_CB[syncNameCombin].push(name);

		/**
		 * check all sync items already initialize
		 */
		if(Object.keys(ALL_SYNC_CB[syncNameCombin]).length === syncName.length) {
			/**
			 * Check all sync running items are "ready"
			 */
			var isReady = Object.keys(syncName).reduce(function (prev, current) {
				return prev && (ANIMATION_CB[syncName[current]][STATE] === READY);
			}, true);

			if(isReady){
				syncName.forEach(function(e, i){
					run(e);
				});

				delete ALL_SYNC_CB[syncNameCombin];
			}
		}
	}

	function run(name){
		/**
		 * Sometimes, Firefox can't run the animation because browser process.
		 * We can use ZERO timeout and move callback function into a new queue to fixed that.
		 */
		setTimeout(function(){
			ANIMATION_CB[name][CB] && ANIMATION_CB[name][CB]().then(function(){
				ANIMATION_CB[name]["state"] = FINISHED;
				checkDeps();
			});
		}, DURATION_ZERO);
	}

	/**
	 * initialize animation object into share object
	 * @param name
	 * @param cb
	 */
	function init(name, cb) {
		ANIMATION_CB[name] = {
			"cb": cb,
			"state": READY
		};
	}

	return Gadget.create({
		/**
		 * request support animation of config object
		 * @param name
		 * @param cb
		 */
		request: function (name, cb) {
			if(!cb) {
				return;
			}

			init(name, cb);

			if(CONFIG[name]) {
				if(CONFIG[name][DEPS] && CONFIG[name][DEPS].length === 0) {
					if(CONFIG[name][SYNC] && CONFIG[name][SYNC].length === 0) {
						//animation_A : {deps:[/], sync:[/]}
						run(name);
					}
					else {
						//animation_A : {deps:[/], sync:[*]}
						checkSync(name);
					}
				}
				else {
					//animation_A : {deps:[*], sync:[* || /]}
					checkDeps();
				}
			}
		}
	});
});

define('school-ui-studyplan/utils/client-storage',["school-ui-studyplan/enum/client-storage-pair", "poly"], function (pair, poly) {
		var localStorage = window.localStorage;
		var sessionStorage = window.sessionStorage;

		return {
			setLocalStorage: function (pairKey, pairValue) {
				if (pair[pairKey] && (!pair[pairKey]["keyValue"] || pair[pairKey]["keyValue"].indexOf(pairValue) > -1)) {
					localStorage && localStorage.setItem(pair[pairKey]["keyName"], JSON.stringify(pairValue));
				}
			},
			getLocalStorage: function (pairKey) {
				var storageData = 	localStorage && pair[pairKey] &&
									localStorage.getItem(pair[pairKey]["keyName"]);
				return storageData && JSON.parse(storageData);
			},
			setSessionStorage: function (pairKey, pairValue) {
				if (pair[pairKey] && (!pair[pairKey]["keyValue"] || pair[pairKey]["keyValue"].indexOf(pairValue) > -1)) {
					sessionStorage && sessionStorage.setItem(pair[pairKey]["keyName"], JSON.stringify(pairValue));
				}
			},
			getSessionStorage: function (pairKey) {
				var storageData = 	sessionStorage && pair[pairKey] &&
									sessionStorage.getItem(pair[pairKey]["keyName"]);
				return storageData && JSON.parse(storageData);
			}
		};
	}
);

define('school-ui-studyplan/utils/server-time',[
    "when",
    "troopjs-ef/component/gadget"
], function (when, Gadget) {
    "use strict";

    var DEFER_CONTEXT = "_defer_context";
    var CLIENT_START_TIME = "_client_start_time";


    var serverTimeService = Gadget.create(function(){
        this[DEFER_CONTEXT] = when.defer();
    },{
        "hub/studyplan/get/serverTime": function() {
            var me = this;
            return when(me[DEFER_CONTEXT].promise).then(function(context){
                return context.serverTime + new Date().getTime() - me[CLIENT_START_TIME];
            });
        },

        "hub:memory/context": function onContext(context) {
            var me = this;
            if(context){
                me[CLIENT_START_TIME] = new Date().getTime();
                me[DEFER_CONTEXT].resolve(context);                
            }
        }
    });

    serverTimeService.start();

    return serverTimeService;
});

define('school-ui-studyplan/utils/state-parser',[],function(){
    return {
        parseFlag : function(stateObj, stateCode){
            var parsed = {};
            if(stateObj){
                for (stateName in stateObj){
                    if(stateObj.hasOwnProperty(stateName)){
                        parsed[stateName] = (stateObj[stateName] & stateCode) === stateObj[stateName];
                    }
                }
            }
            return parsed;
        },
        map : function(stateObj, stateCode){
            if(stateObj){
                for (stateName in stateObj){
                    if(stateObj.hasOwnProperty(stateName) && stateObj[stateName] === stateCode){
                        return stateName;
                    }
                }
            }
        } 
    };
});
define('school-ui-studyplan/utils/studyplan-update-helper',[
	"school-ui-shared/utils/update-command"
], function UpdateHelperUtilModule(UpdateCommand) {
	"use strict";

	var API_STUDYPLAN_CTEATE = "campusstudyplan/campus_student_unit_studyplan/CreateStudyPlan";
	var API_STUDYPLAN_RESTART = "campusstudyplan/campus_student_unit_studyplan/RestartCurrentStudyPlan";

	return {
		createStudyplan: function onCreateStudyplan(data) {
			return UpdateCommand.update(API_STUDYPLAN_CTEATE, data);
		},
		restartStudyplan: function onCancelStudyplan(data) {
			return UpdateCommand.update(API_STUDYPLAN_RESTART, data);
		}
	};
});

define('school-ui-studyplan/utils/time-parser',[
	"troopjs-ef/component/gadget",
	"moment"
], function(
	Gagdet,
	moment
){
	"use strict";

	var timeParser = Gagdet.create({
		toLocalTime: function(time, offset){
			var me = this;
			var momentTime;

			// use local timezone if there is no timezone information
			if(offset === undefined){
				momentTime = moment(time);
			} else {
				momentTime = moment.utc(time).zone(0 - offset);
			}

			return {
				"dayOfWeek": momentTime.day(),
				"year": momentTime.year(),
				"month": momentTime.month() + 1,
				"day": momentTime.date(),
				"hour": momentTime.hour(),
				"minute": momentTime.minute(),
				"second": momentTime.second(),
				"timezone": momentTime.format('Z')
			};
		}
	});

	timeParser.start();

	return timeParser;
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/announcement/index.html',[],function() { return function template(data) { var o = "<div class=\"sp-evc-announcement-container\">\n    " + data + "\n</div>\n\n<style type=\"text/css\">\n    .sp-evc-announcement-container{\n        width: 680px;\n        margin: 0 auto;\n        padding: 15px 0;\n    }\n    .sp-evc-announcement-main{\n        padding: 20px 50px;\n    }\n    .sp-evc-announcement-container p{\n        margin: 10px 0 0 0;\n    }\n    .sp-evc-announcement-container .sp-evc-announcement-toggle\n    {\n        cursor: pointer;\n        margin-left: 5px;\n        color: #4a4a4a;\n        top: -1px;\n    }\n    .sp-evc-announcement-container .sp-evc-announcement-toggle:hover\n    {\n        text-decoration: none;\n        color: #4a4a4a;\n    }\n    .sp-evc-announcement-container .sp-evc-announcement-content\n    {\n        margin-top: 10px;\n    }\n    .sp-evc-announcement-content > p:last-child\n    {\n        margin-bottom: 0;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/announcement/main',["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    'use strict';

    var htmlToggleOn = "<small><a data-action=\"toggle\" class=\"glyphicon icon-chevron-sign-down sp-evc-announcement-toggle\" style=\"display: none;\"></a></small>";
    var htmlToggleOff = "<small><a data-action=\"toggle\" class=\"glyphicon icon-chevron-sign-up sp-evc-announcement-toggle\"></a></small>";
    var SELECTOR_TITLE = ".sp-evc-announcement-title";
    var SELECTOR_CONTENT = ".sp-evc-announcement-content";

    return Widget.extend({
        "render": function(data) {
            var me = this;
            var $me = me.$element;
            if (!data) {
                return;
            }
            // Templating
            me.html(template, data).then(function(){
                var $title = $me.find(SELECTOR_TITLE);
                if($title.length <= 0){
                    return;
                }
                $title.append(htmlToggleOn).append(htmlToggleOff);
            });
        },
        "dom:[data-action=toggle]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;
            var $e = $(e.currentTarget);
            var $content = $me.find(SELECTOR_CONTENT);
            if ($content.length <= 0) {
                return;
            }
            $content.toggle("slow");
            $me.find("[data-action=toggle]").toggle();
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/credit/service',["troopjs-core/component/gadget",
    "jquery",
    "when"
], function(Gadget, $, when) {
    'use strict';

    return Gadget.extend(function() {}, {
        "get": function(feature) {
            var me = this;
            var deferred = when.defer();
            if (!feature) {
                deferred.reject();
            }
            // Get credit data by eTroop
            me.publish("query", ["evcmember!current"]).spread(function(data) {
                if (!data || !data.features || !data.courseInfo) {
                    deferred.reject();
                }
                // Generate a new object to resolve
                var courseInfo = data.courseInfo;
                var features = data.features;
                var memberInfo = {};
                var credit = {};

                // Read & find GL credit
                $.each(features, function(i, e) {
                    if (e.featureType.toUpperCase() === feature.toUpperCase()) {
                        credit.buyUrl = e.buyUrl;
                        credit.canAccess = e.canAccess;
                        credit.canBuyMore = e.canBuyMore;
                        credit.couponLeft = e.couponLeft;
                        credit.isUnlimitedAccess = e.isUnlimitedAccess;
                        return false;
                    }
                });

                memberInfo.courseInfo = courseInfo;
                memberInfo.credit = credit;

                // Resolve generated credit
                deferred.resolve(memberInfo);
            });
            // Return a promise
            return deferred.promise;
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/announcement/cp20',["./main",
    "jquery",
    "../credit/service"
], function(AnnouncementBase, $, Credit) {
    'use strict';

    var CMS_ANNOUNCEMENT = "cms!School#EVC#studyPlanAnnouncement#PL_";

    return AnnouncementBase.extend({
        "sig/start": function() {
            // Check Announcement
            var me = this;
            new Credit().get("PL").then(function(dataCredit) {
                if (!dataCredit) {
                    return;
                }
                var courseInfo = dataCredit.courseInfo;
                var level = courseInfo.academicLevel;
                me.publish("query", [CMS_ANNOUNCEMENT + level]).spread(function(data) {
                    if (data.content) {
                        me.render(data.content);
                    } else {
                        me.publish("studyplan/evc/cp20/announcement/disable");
                    }
                });
            });
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/announcement/gl',["./main",
    "jquery",
    "../credit/service"
], function(AnnouncementBase, $, Credit) {
    'use strict';

    var CMS_ANNOUNCEMENT = "cms!School#EVC#studyPlanAnnouncement#GL_";

    return AnnouncementBase.extend({
        "sig/start": function() {
            // Check Announcement
            var me = this;
            new Credit().get("GL").then(function(dataCredit) {
                if (!dataCredit) {
                    return;
                }
                var courseInfo = dataCredit.courseInfo;
                var level = courseInfo.academicLevel;
                me.publish("query", [CMS_ANNOUNCEMENT + level]).spread(function(data) {
                    if (data.content) {
                        me.render(data.content);
                    } else {
                        me.publish("studyplan/evc/gl/announcement/disable");
                    }
                });
            });
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/announcement/pl',["./main",
    "jquery",
    "../credit/service"
], function(AnnouncementBase, $, Credit) {
    'use strict';

    var CMS_ANNOUNCEMENT = "cms!School#EVC#studyPlanAnnouncement#PL_";

    return AnnouncementBase.extend({
        "sig/start": function() {
            // Check Announcement
            var me = this;
            new Credit().get("PL").then(function(dataCredit) {
                if (!dataCredit) {
                    return;
                }
                var courseInfo = dataCredit.courseInfo;
                var level = courseInfo.academicLevel;
                me.publish("query", [CMS_ANNOUNCEMENT + level]).spread(function(data) {
                    if (data.content) {
                        me.render(data.content);
                    } else {
                        me.publish("studyplan/evc/pl/announcement/disable");
                    }
                });
            });
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/book-cp20/index.html',[],function() { return function template(data) { var o = "";
	var bookUrl = data.bookUrl;
o += "\n<div class=\"evc-studyplan-btn-book\">\n\t<h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639505\" data-text-en=\"Welcome to your private lesson\"></h2>\n\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639506\" data-text-en=\"Review what you’ve learned in this unit in your private lesson. This live session with a teacher takes 20 minutes and is included with your subscription.\"></p>\n\t<div class=\"evc-studyplan-btn-warp\">\n\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639507\" data-text-en=\"Your private lesson must be booked 24 hours in advance.\"></p>\n\t\t<button class=\"btn btn-default\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639508\" data-text-en=\"Skip your private lesson\"></button>\n\t\t<a href=\"" + bookUrl + "\" class=\"btn btn-primary\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639509\" data-text-en=\"Book your private lesson\"><i class=\"glyphicon icon-caret-right\"></i></a>\n\t</div>\n</div>\n<p class=\"text-muted\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639510\" data-text-en=\"You can skip your private lesson, but we strongly recommend you book it.\"></p>\n<style type=\"text/css\">\n\t.evc-studyplan-activity-container .evc-studyplan-gap-2x {\n\t\tpadding: 0;\n\t\tmargin: 0;\n\t\twidth: 660px;\n\t}\n\t.evc-studyplan-btn-book{\n\t\tpadding: 30px 20px;\n\t\tcolor: #555555;\n\t\tbackground-color: #f0f0f0;\n\t}\n\t.evc-studyplan-btn-book h2 {\n\t\tmargin-bottom: 10px;\n\t}\n\t.evc-studyplan-btn-book .btn{\n\t\tdisplay: inline-block;\n\t\tmargin: 10px 8px;\n\t}\n\t.evc-studyplan-btn-book p {\n\t\tfont-size: 1.3em;\n\t}\n\t.evc-studyplan-btn-warp {\n\t\tmargin-top: 20px;\n\t}\n\tp.text-muted{\n\t\tmargin-top: 8px;\n\t}\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/book-cp20/main',["troopjs-ef/component/widget",
	"jquery",
	"template!./index.html"
], function(Widget, $, template) {
	"use strict";

	var CP20_BOOK_URL = "/school/evc/pl/cp20/";

	return Widget.extend(function($element, widgetName, unitId) {
		var me = this;
		// get parameters
		me.unitId = unitId;
	}, {
		"hub:memory/studyplan/evc/cp20/enter-token": function(token) {
			var me = this;
			var tempData = {};

			if (!me.unitId) {
				return;
			}

			me.query("evc_url_resource!current").spread(function(data){
				tempData.bookUrl = data.studyPlanUrls.CP20Booking.replace("{unitId}", me.unitId)
					.replace("{source}", window.encodeURIComponent(window.location.href))
					.replace("{token}", (token ? token : ""));

				me.html(template, tempData);
			});
		},

		"dom:.btn-default/click": function skipCp(){
			var me = this;
			me.publish("studyplan/sequence/navigate/goal");
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/book-pl/index.html',[],function() { return function template(data) { var o = "";
    var bookUrl = data.bookUrl;
    var credit = data.credit;
o += "\n<div class=\"evc-studyplan-btn-book\">\n    "; if(credit.couponLeft <= 0){ o += "\n        <a class=\"btn btn-default disabled\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568596\"></a>\n    "; }else{ o += "\n        <p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568597\"></p>\n        <a href=\"" + bookUrl + "\" class=\"btn btn-primary\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568596\"></a>\n    "; } o += "\n</div>\n<style type=\"text/css\">\n    .evc-studyplan-btn-book{\n    }\n    .evc-studyplan-btn-book > a{\n        display: inline-block;\n    }\n    .evc-studyplan-btn-book > p{\n        font-size: 1.3em;\n        font-weight: bold;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/book-pl/main',["troopjs-ef/component/widget",
    "jquery",
    "../credit/service",
    "school-ui-studyplan/enum/studyplan-item-typecode",
    "template!./index.html"
], function(Widget, $, Credit, spItemTypeCode, template) {
    "use strict";

    var PL_BOOK_URL = "/school/evc/pl/unitaligned";
    var KEY = "SP";

    return Widget.extend(function($element, widgetName, unitId, spTypeCode) {
        var me = this;
        // get parameters
        me.unitId = unitId;
        me.spTypeCode = spTypeCode;
    }, {
        "sig/start": function() {
            var me = this;

            if (!me.unitId) {
                return;
            }

            me.query("evc_url_resource!current").spread(function(data){
                var isPL20 = Boolean(me.spTypeCode === spItemTypeCode.pl20);

                var tempData = {};
                tempData.bookUrl =
                    (isPL20 ? data.studyPlanUrls.SPPL20Booking : data.studyPlanUrls.SPPL40Booking)
                    .replace("{unitid}", me.unitId)
                    .replace("{source}", window.encodeURIComponent(window.location.href));

                new Credit().get(isPL20 ? "PL20" : "PL").then(function(dataCredit) {
                    if (!dataCredit) {
                        return;
                    }
                    tempData.credit = dataCredit.credit;
                    me.html(template, tempData);
                });
            });

        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/popupbox/index.html',[],function() { return function template(data) { var o = "<div class=\"popupbox-cover\" style=\"\n    z-index: " + (data.zIndex || 1) + ";\n    background-color: " + (data.bgColor || "#000") + ";\n    opacity: " + (data.opacity || 0.8) + ";\n    filter: alpha(opacity=" + (data.opacity || 0.8) * 100 + ");\n    margin-top: " + (data.top || 0) + "px;\n\">\n    "; if (data.keySupport) { o += "\n        <style>\n            input.popupbox-keysupport\n            {\n                width: 1px;\n                height: 1px;\n                border-width: 0;\n                overflow: hidden;\n                float: right;\n                background-color: transparent;\n                outline: none;\n                position: absolute;\n                top: -1px;\n            }\n        </style>\n        <input class=\"popupbox-keysupport\" type=\"text\" />\n    "; } o += "\n</div>\n<div class=\"popupbox\" style=\"\n    z-index: " + (data.zIndex || 1) + ";\n    margin-top: " + (data.top || 0) + "px;\n\">\n    <div class=\"popupbox-main\" style=\"\n        height: 100%;\n        "; if(!data.fullSize) { o += "\n            text-align: center;\n        "; } o += "\n    \">\n        "; if(!data.isInnerClose) { closeButton(data.hasCloseButton); } o += "\n        <div class=\"popupbox-content popupbox-out\" style=\"\n            "; if(!data.fullSize) { o += "\n                text-align: left;\n                display: inline-block;\n                *display: inline;\n                *zoom: 1;\n            "; } o += "\n        \">\n            "; if(data.isInnerClose) { closeButton(data.hasCloseButton); } o += "\n        </div>\n    </div>\n</div>\n\n"; function closeButton(exist) { o += "\n    "; if (exist) { o += "\n        <style>\n            .popupbox a.popupbox-close\n            {\n                width: 34px;\n                height: 35px;\n                overflow: hidden;\n                background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAABICAYAAAB86kzAAAAIr0lEQVRo3s1Ye0zVdRSXx8UJjmxRJqQUjtu8XFils41YZsMs70TBVpmi4iuZlDpzqOQqkpmFky0DX6MmSpbT1cz8yzZHtdncaD4XJbNF8iydDxTMTuf8Ot9f5/7e9/qo73bg3t/vfM/3c7/n8f2ez4ABLmPBggVKHkGpQDmIchTlT5aj/KyCdeScAV4HALgrocFilFYU8Cit8+fPn4VTY1huHgwaLUD5KQIQRvkZQU0RoGKiAoOGXjcaX7FiBTQ2NsKJEyfg7NmzcOPGDU3oMz2jd6RjnDdv3rxyNBnnBsgSDBrYJo0tX74cDh8+rC3sNkiHdGmOAVA9mo5HibUDZAKDE1dLIzU1NXDt2jWIdNAcmittlZSUvIlL+OwAhYHBCSE5effu3XCzg2xImzNnzizCpRKsABnB6BmzadMmT27x4jaypexiQJ/FpRKtdkgHQ6koA7W3txdu1SBbMrBnzJjxCi45iGNID2odDCr9opQpAI2jubkZcnJyYO7cuXDlypWwd/SdntN70rMaZFPsThsumYwyUGTZP2BQIU8plpeXm9xz7Ngx8Pv9MGzYMCgrK4MtW7boQU3/S0tLwefzQWFhIVRWVsKpU6cs3UW21TqoG8L1k4S7dDBvK6W9e/eaDLW1tcGUKVNg6dKlsHbtWk02b94MHR0dsHjxYoiPj4eCggLt+Y4dO+DChQuWu0O2hauqcf0hvDta7Cgwh5TS6dOnLQ2dO3cOqqurdTAkS5YsgcGDB8PkyZO17w0NDXDx4kXb2Dl58qQOZs6cOU0I4F7enXgJpk0pnT9/3tZYZ2cnbNiwIQwQ7Qz9p+p7+fJlx0Am26IIdiKAVI6dBAmmTyldv37d0WBLS4vmewmotrYWenp6XLOKbIua048A0lHuVq6KCExfX5+2E0OHDoVly5bpYKqqqrR4oPcRghmJksJpHuvZTVevXoWFCxdCXFycFiOUNRs3btQB0XcqbqTnxU1YCroQgB/lPi6CcQrM104BTHUEa4OWNZRVKkYoy+rr68NcRoCMdcgqgIuLi79HAA+jDOUg/gcMLlTplNo0qI5MnTrVFKzd3d2mLLMbMrWLioq2W4LBLXtSKa1atcr2TKKFdu7cCZcuXQp73t7eDuvXr3cEQjbJtlonNzd3kaWbKHhQ4Ten40ANuzpCdchpyOMArxI9uObjlgFMH1ChRB6U0dxhnO428qDMz89/H9d8zDK1+aBKoONdXiFu1ZBXCKy8VOyeQsmyLHoMJh7Pixdu9+UqLy/vHVxrLLvIfBwwGDqsBs6ePbtSTqZfFe21U+4IyaRJkxpxjXEoQZQHLA9KHrF8nCfhVjYYu4KmpibPF3LSNXYJ06ZNO4S2J3CsZHDgmq8QPGL4okNIk9Fl69xaFTXcWhXckU/Q5kR2D6Xz/baXKwEmhv1HqTYEL0AleLr+Gm0ThzvchfXkXd6RsVzk0tg99tdOAUi5K5HTLg1BrcTC2BYJiPHjx9fi3BDHyGO8I2ls0/lCbgEogScN4W19CH/l81jG67DdOIKB3iLOmTPTp09vDoVCu4LB4BJ2yTjeDQrWh9jGELbp3qrY7NAg9m8KZwClZADlUV4sF+UJllx+9ijrjOQ5KWxjkOcmzgZQPAcaRf5dXBuoWI3gxTLZBX7+PJLfpbLuXTx3YMTtrQUglWU+ASqZfX8PH3RS7uF3yQKEL+rG3waQ3KkEXmQQx0ASSyI/G8g6cieip0SsmCsLYLH8i6XERgLABIb+/F/k/wfGaezJyZHyCEoFykGUoyh/shzlZxWso8+JaLiBofdotBilFQU8Suun2dkRk4yOYNBoAcpPEYAIk89ycn5GUJ5JRlswaOx1o/Ev8/Ohed06aP/mG/gDW4+/8MpAQp/pGb0jHeO8T7KzPZGMlmDQwDZpbP/TT8OZPXu0hd0G6ZAuzZE2dmdnu5KMJjA4cbU00lRaCtdtGjPHdhbn0Fxpa2cw6EgyhoHBCSE5+Qfsh252kA1pc3sgYEsyGsHoGfPta695cosXt5EtEdS2JKMOhlJRBmq/oXO8mUG2ZGBvHTXKkmTUwaDSL0qZAvBWk4xkU9nHH25JMqqilqcUD0ycaHKPIhkfSEyEiqws+OiNN0wkY0JsLMx88EHYGArBabygW7mLbKt11mdmmkhGBeZtpXS8psaSZCyaMAHeCgahdswYTerXrPmXZIyJgZfS07Xnn+NV9GJnp+XukG3hKhPJqMAcUkqdR45YGmrH5r521iwdDEn5s89Css8HL44YoX3/YtEiuNzVZRs7Hd99p4NpCAZNJKMC06aUem1+lUYy4k7UYWxIQKsDAe3//rIy6P39d2e2HG2LImgiGRWYPqV0o7/fmWT88UeoRJdJQLsKC+G8aOxsO060LVLcRDJGBEaRjKlJSWHxUzd2LByoqoJ+F5LRAkwYR+PZTYpkpGClGNk0ejR89MwzOiD6vnXlSkeSUbqpMTvbRDJqYBDl104BrEhGH6bvy5w1FCMdx4/Dp5jW0mXbysttSUYZwPWBgIlkVGAqnVKbBtWRGVhHjMHag9nzoSGo7YZM7fcyM7dbgsEte1IpffXcc7Znkpa+uBNXurtNaf8Bp73TGUW21Trz0tIWWbqJggd35zen40ANuzrS7kIyyuMAm3JLklEHg3eNEnlQRnOHcbrbyINyeXq6JcmowGgkIx3v8gpxq4a8QmDltSUZJZj4bYHAC7f7crUwLc2WZJRgNJLx46ysSjmZflW01065IyRrMjIcSUZ509NJxh3BYIOxK2jdt8/zhZx0jV1Ctd/vSjJKMGEkIx7x69xaFTXcWhXcEU8koxFMGMmIF6AS7Hl+jbaJwx3umpua6plkNLYqliQjglqJhbEtEhCvDh8eMclo1cTZkoz4K59/3++vw3bjCAZ6izhnztSNGtX8ZkbGrkkpKVGTjHbt7X9CMjo1/necZHSjRO4oyeiF2LtjJGNEzNXtJhn/BkNB/ubmupeRAAAAAElFTkSuQmCC) left top no-repeat;\n                *background-image: url(/_imgs/evc/block/high/btn_close.png);\n                position: absolute;\n                right: -15px;\n                top: -10px;\n                cursor: pointer;\n                text-indent: -5000px;\n            }\n        </style>\n        <a class=\"popupbox-close\" title=\"Close\">Close</a>\n    "; } o += "\n"; } o += "\n<style>\n    style\n    {\n        display: none;\n    }\n    /*\n    * Animation for pop effect\n    */\n    /* No animation */\n    .popupbox-in\n    {\n        visibility: visible;\n    }\n    .popupbox-out\n    {\n        visibility: hidden;\n    }\n    /* With animation */\n    .popupbox-pop {\n        -webkit-transform-origin: 50% 50%;\n        -moz-transform-origin: 50% 50%;\n    }\n    .popupbox-pop.popupbox-in {\n        visibility: visible;\n        opacity: 1;\n        -webkit-transform: scale(1);\n\n        -webkit-animation-name: popin;\n        -moz-animation-name: popin;\n        -webkit-animation-duration: 200ms;\n        -moz-animation-duration: 200ms;\n        -webkit-animation-timing-function: ease-out;\n        -moz-animation-timing-function: ease-out;\n    }\n    .popupbox-pop.popupbox-out {\n        visibility: visible;\n        opacity: 0;\n        -webkit-transform: scale(.8);\n\n        -webkit-animation-name: popout;\n        -moz-animation-name: popout;\n        -webkit-animation-duration: 100ms;\n        -moz-animation-duration: 100ms;\n        -webkit-animation-timing-function: ease-in;\n        -moz-animation-timing-function: ease-in;\n    }\n    @-webkit-keyframes popin {\n        from {\n            -webkit-transform: scale(.8);\n            opacity: 0;\n        }\n        to {\n            -webkit-transform: scale(1);\n            opacity: 1;\n        }\n    }\n    @-webkit-keyframes popout {\n        from {\n            -webkit-transform: scale(1);\n            opacity: 1;\n        }\n        to {\n            -webkit-transform: scale(.8);\n            opacity: 0;\n        }\n    }\n    /* evc style */\n    .popupbox-cover,\n    .popupbox\n    {\n        position: " + (data.position || "fixed") + ";\n        left: 0;\n        top: 0;\n        width: 100%;\n        height: 100%;\n        overflow: hidden;\n    }\n    .popupbox-main,\n    .popupbox-content\n    {\n        position: relative;\n    }\n    .popupbox-main\n    {\n        overflow-y: auto;\n        overflow-x: hidden;\n    }\n    .popupbox-content\n    {\n        -webkit-transition: margin-top .3s ease-out;\n        -moz-transition: margin-top .3s ease-out;\n        -o-transition: margin-top .3s ease-out;\n        transition: margin-top .3s ease-out;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/popupbox/main',["module", "jquery", "template!./index.html"], function(module, $, template) {
    'use strict';

    function keySupport() {
        var ua = navigator.userAgent;
        return ua.indexOf("Windows NT") >= 0 || ua.indexOf("Macintosh") >= 0;
    }

    function cssAnimate($el, noAnimation) {
        if (!$el || $el.length <= 0) {
            return {
                "popIn": $.noop,
                "popOut": $.noop
            };
        }
        // Add animate CSS?
        if (noAnimation) {
            $el.removeClass("popupbox-pop");
        } else {
            $el.addClass("popupbox-pop");
        }
        return {
            "popIn": function() {
                $el.removeClass("popupbox-out").addClass("popupbox-in");
            },
            "popOut": function() {
                $el.removeClass("popupbox-in").addClass("popupbox-out");
            }
        };
    }

    var Popupbox = function(args) {
        this.el = args.el || "body";
        this.body = this.el === "body" ? true : false;
        this.msg = args.msg || "";
        // overLap: "cancel"/"replace"/"overlap"
        this.overLap = args.overLap || "replace";
        // stick at top of the popup
        this.stick = args.stick || false;
        // In stick mode, keep a gap to top
        this.stickTop = args.stickTop || 0;
        // Gap between object element & popup box(e.g. Show Header while popup)
        this.top = args.top || 0;
        // Support animation?
        this.noAnimation = args.noAnimation || false;
        // styling
        this.bgColor = args.bgColor || "#000";
        this.opacity = args.opacity || 0.6;
        this.zIndex = args.zIndex || 1;
        this.fullSize = args.fullSize || false;
        // button options
        this.closeble = args.closeble || false;
        this.closeButtonHide = args.closeButtonHide || false;
        this.closeButtonList = args.closeButtonList || [];
        this.closeInner = args.closeInner || false;
        this.closeCallback = args.closeCallback || $.noop;
    };

    Popupbox.prototype = {
        "open": function() {
            var me = this;
            var deferred = $.Deferred();
            var $container = $(me.el);

            function evClose() {
                // Attach close buttons events
                if (me.closeButtonList.length > 0) {
                    // Read all the buttons
                    $.each(me.closeButtonList, function(i, el) {
                        // Events
                        me.$popupBox.on("click", el, function(e) {
                            e.preventDefault();
                            me.close();
                        });
                    });
                }
            }

            function escClose() {
                var $keySupportInput = me.$popupBoxCover.find("input.popupbox-keysupport");
                if ($keySupportInput.length > 0) {
                    $keySupportInput.focus().keydown(function(e) {
                        if (e.which == 27) {
                            me.close();
                        }
                        e.preventDefault();
                    });
                }
            }

            function resize() {
                $(window).resize(function(e) {
                    me.centralize();
                });
            }

            // If the container doesn't exist, use body instead.
            if ($container.length <= 0) {
                $container = $("body");
            }
            // overlap
            var $existPopupBox = $container.find(" > div.popupbox, > div.popupbox-cover");
            if ($existPopupBox.length > 0) {
                if (me.overLap === "cancel") {
                    deferred.reject();
                    return deferred.promise();
                } else if (me.overLap === "replace") {
                    $existPopupBox.remove();
                }
            }
            // Generate the html
            me.$popupBoxWrapper = $(template({
                "position": me.body ? "fixed" : "absolute",
                "bgColor": me.bgColor,
                "opacity": me.opacity,
                "zIndex": me.zIndex,
                "top": me.top,
                "fullSize": me.fullSize,
                "keySupport": keySupport(),
                "hasCloseButton": (me.closeble && !me.closeButtonHide),
                "isInnerClose": me.closeInner
            }));
            me.$popupBoxCover = me.$popupBoxWrapper.filter(".popupbox-cover");
            me.$popupBox = me.$popupBoxWrapper.filter(".popupbox");
            me.$popupBoxMain = me.$popupBox.find(".popupbox-main");
            me.$popupBoxContent = me.$popupBox.find(".popupbox-content");

            // Register window resize event
            if (!me.stick) {
                resize();
            }
            // Append Content, use 'prepend' to make 'close button' render at the end.
            me.$popupBoxContent.prepend(me.msg);
            // Append to DOM
            me.$popupBoxWrapper.appendTo($container);
            // Append close button
            if (me.closeble) {
                me.closeButtonList.push("a.popupbox-close");
                // Attach close events
                evClose();
                // Attach ESC key event
                escClose();
            }
            // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ //
            // Centralize the content
            me.centralize();
            // Show popup box
            if (me.noAnimation) {
                // Show Cover
                me.$popupBoxCover.show();
                // Show Content
                cssAnimate(me.$popupBoxContent, true).popIn();
                // Resolve
                deferred.resolve(me.$popupBoxContent);
            } else {
                // Show Cover
                me.$popupBoxCover.fadeIn(400, function() {
                    // Show Content after Cover showed
                    cssAnimate(me.$popupBoxContent).popIn();
                    // Resolve
                    deferred.resolve(me.$popupBoxContent);
                });
            }
            return deferred.promise();
        },
        "close": function(noCallback) {
            var me = this;
            var deferred = $.Deferred();

            function callback() {
                if (!noCallback) {
                    me.closeCallback();
                }
            }
            if (me.noAnimation) {
                // Hide Content
                cssAnimate(me.$popupBoxContent, true).popOut();
                // Hide Cover
                me.$popupBoxCover.hide();
                // Run close callback
                callback();
                // Remove popup elements
                me.$popupBoxWrapper.remove();
                // Resolve
                deferred.resolve($);
            } else {
                // Hide Content
                cssAnimate(me.$popupBoxContent).popOut();
                window.setTimeout(function() {
                    // Hide Cover after Content hid
                    me.$popupBoxCover.fadeOut(200, function() {
                        // Run close callback after cover hid
                        callback();
                        // Remove popup elements
                        me.$popupBoxWrapper.remove();
                        // Resolve
                        deferred.resolve($);
                    });
                }, 100);
            }
            return deferred.promise();
        },
        "centralize": function() {
            var me = this;
            // $out: Cover
            var $out = me.$popupBox;
            // $in: Content
            var $in = me.$popupBoxContent;
            // Get height of both container & content
            var hOut = $out.height();
            var hIn = $in.outerHeight();
            // calculate: keep top while stick, otherwise centralize the content in vertical
            var mTop = me.stick ? me.stickTop : Math.floor((hOut - hIn) / 2);
            // Never hide or be cut
            mTop = mTop < 0 ? 0 : mTop;
            // Apply to dom
            $in.css("margin-top", mTop);
            return me;
        }
    };
    return Popupbox;
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/cancel-cp20/index.html',[],function() { return function template(data) { var o = "<div class=\"studyplan-cancel-action clearfix\">\n    <button class=\"evc-studyplan-cancel-btn\" role=\"button\" data-action=\"cancelBooking\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568585\" data-toggle=\"tooltip\" data-placement=\"bottom\" title=\"Cancel Class\"></button>\n</div>\n<div class=\"gud studyplan-cancel-confirm clearfix\">\n    <div class=\"gud studyplan-cancel-confirm-content\">\n        <p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"18748\"></p>\n        <button class=\"btn btn-default btn-sm\" role=\"button\" data-action=\"confirmCancel\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568588\"></button>\n        <button class=\"btn btn-secondary btn-sm\" role=\"button\" data-action=\"keepBooking\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568589\"></button>\n    </div>\n</div>\n<style type=\"text/css\">\n.studyplan-cancel-action .tooltip-arrow{\n    border-bottom-color:#000;\n    border-bottom-color: rgba(0, 0, 0, 0.9);\n}\n.studyplan-cancel-action .tooltip-inner{\n    padding: 10px;\n    max-width: 260px;\n    background: #000;\n    background: rgba(0, 0, 0, 0.9);\n}\n.studyplan-cancel-confirm {\n    display: none;\n}\n.studyplan-cancel-confirm-content {\n    display: inline-block;\n    border: 1px solid #4a4a4a;\n    padding: 30px 40px;\n    background-color: #fff;\n    background-color: rgba(255, 255, 255, 0.8);\n    text-align: center;\n}\n.studyplan-cancel-confirm-content button {\n    margin: 0 10px;\n}\n.studyplan-cancel-confirm-content p {\n    font-size: 1.4em;\n    font-weight: bold;\n    text-align: center;\n}\n.evc-studyplan-cancel-btn{\n    border:none;\n    border-bottom: 1px solid #000;\n    background: none;\n    padding: 0;\n}\n.evc-studyplan-cancel-btn:hover{\n    color:#333;\n    border-bottom: 1px solid #333;\n}\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/cancel-cp20/main',["troopjs-browser/component/widget",
    "jquery",
    "troopjs-ef/command/service",
    "troopjs-data/cache/component",
    "school-ui-studyplan/widget/gl-pl/popupbox/main",
    "template!./index.html"
], function(Widget, $, CommandService, Cache, Popupbox, template) {
    "use strict";

    var STATUS_START_STARTED = "started";

    var CSS_CLASS_POPUP_CONTAINER = ".ets-sp-init";
    var COMMAND;

    var DAYOFWEEK_ARR = [
        ["Sunday", "78946"],
        ["Monday", "78940"],
        ["Tuesday", "78941"],
        ["Wednesday", "78942"],
        ["Thusday", "78943"],
        ["Friday", "78944"],
        ["Saterday", "78945"]
    ];
    var MONTH_ARR = [
        ["January", "77396"],
        ["February", "77397"],
        ["March", "77398"],
        ["April", "77399"],
        ["May", "77400"],
        ["June", "77401"],
        ["July", "77402"],
        ["August", "77403"],
        ["September", "77404"],
        ["October", "77405"],
        ["November", "77406"],
        ["December", "77407"]
    ];

    function eventsHandling($el, eType, callback) {
        var hooked = false;
        return {
            'unhook': function() {
                $el.unbind(eType);
                hooked = false;
            },
            'hook': function() {
                if (hooked) {
                    return;
                }
                $el.bind(eType, callback);
                hooked = true;
            }
        };
    }

    return Widget.extend(function() {
        
    }, {
        "hub:memory/studyplan/evc/cp20/status": function(dataLesson) {
            var me = this;

            if (!dataLesson || !dataLesson.bookedClass || !dataLesson.bookedClass.classId) {
                return;
            }

            me.classId = dataLesson.bookedClass.classId;

            // Return while class already open.
            if(dataLesson.countdown.timeIn <= 0){
                return;
            }
            // Render
            me.html(template);
            me.showNotice(dataLesson);
        },
        "showNotice": function(dataLesson) {
            var me = this;
            var $me = me.$element;
            var $cancel = $me.find(".evc-studyplan-cancel-btn");

            var cancelTime = dataLesson.suggestedCancelTime;
            var timezone = "UTC " + cancelTime.timezone;

            var strTime;

            if (cancelTime.minute > 9) {
                strTime = cancelTime.hour + ":" + cancelTime.minute;
            } else {
                strTime = cancelTime.hour + ":0" + cancelTime.minute;
            }

            me.publish("query", [
                "blurb!" + DAYOFWEEK_ARR[cancelTime.dayOfWeek][1],
                "blurb!" + MONTH_ARR[(cancelTime.month - 1)][1],
                "blurb!" + "639584"
            ]).spread(function(cancelWeek, cancelMonth, cancelContext) {

                var _cancelWeek = cancelWeek.translation;
                var _cancelMonth = cancelMonth.translation;
                var notice = cancelContext.translation;

                // show the cancel notice (start time > 1 day)
                var canceltime = strTime + ", " + _cancelWeek + " " + _cancelMonth + " " + cancelTime.day;
                notice = notice.replace("%%Canceltime%%", canceltime).replace("%%timezone%%", timezone);

                // init tooltips
                $cancel.attr("title", notice);
                $cancel.tooltip();

            });
        },
        "hub:memory/studyplan/evc/cp20/start-status": function(status) {
            var me = this;
            var $me = me.$element;
            status === STATUS_START_STARTED && $me.remove();
        },
        "dom:[data-action=cancelBooking]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;
            var msg = $me.find(".studyplan-cancel-confirm").html();

            // Popup form init
            me.popupbox = new Popupbox({
                el: CSS_CLASS_POPUP_CONTAINER,
                zIndex: 160,
                msg: msg,
                bgColor: "#fff",
                closeble: true,
                closeButtonHide: true
            });
            me.popupbox.open().then(function($popup) {
                // Event Handling
                var $keepBooking = $popup.find("button[data-action='keepBooking']");
                eventsHandling($keepBooking, 'click', function(e) {
                    e.preventDefault();
                    me.popupbox.close();
                }).hook();

                var $confirmCancel = $popup.find("button[data-action='confirmCancel']");
                eventsHandling($confirmCancel, 'click', function(e) {
                    e.preventDefault();
                    me.popupbox.close();
                    var args = {
                        "classId": me.classId
                    };
                    me.publish("/commands/classes/cancel", args).then(function() {
                        // Publish cancel status to school
                        me.publish("studyplan/sequence/update");
                        // Reload current studyplan content
                        me.publish("studyplan/sequence-container/reload");
                    });
                }).hook();
            });
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/cancel-pl/index.html',[],function() { return function template(data) { var o = "<div class=\"studyplan-cancel-action clearfix\">\n    <button class=\"evc-studyplan-cancel-btn\" role=\"button\" data-action=\"cancelBooking\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568585\" data-toggle=\"tooltip\" data-placement=\"bottom\" title=\"Cancel Class\"></button>\n</div>\n<div class=\"gud studyplan-cancel-confirm clearfix\">\n    <div class=\"gud studyplan-cancel-confirm-content\">\n        <p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"18748\"></p>\n        <button class=\"btn btn-default btn-sm\" role=\"button\" data-action=\"confirmCancel\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568588\"></button>\n        <button class=\"btn btn-secondary btn-sm\" role=\"button\" data-action=\"keepBooking\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568589\"></button>\n    </div>\n</div>\n<style type=\"text/css\">\n.studyplan-cancel-action .tooltip-arrow{\n    border-bottom-color:#000;\n    border-bottom-color: rgba(0, 0, 0, 0.9);\n}\n.studyplan-cancel-action .tooltip-inner{\n    padding: 10px;\n    max-width: 260px;\n    background: #000;\n    background: rgba(0, 0, 0, 0.9);\n}\n.studyplan-cancel-confirm {\n    display: none;\n}\n.studyplan-cancel-confirm-content {\n    display: inline-block;\n    border: 1px solid #4a4a4a;\n    padding: 30px 40px;\n    background-color: #fff;\n    background-color: rgba(255, 255, 255, 0.8);\n    text-align: center;\n}\n.studyplan-cancel-confirm-content button {\n    margin: 0 10px;\n}\n.studyplan-cancel-confirm-content p {\n    font-size: 1.4em;\n    font-weight: bold;\n    text-align: center;\n}\n.evc-studyplan-cancel-btn{\n    border:none;\n    border-bottom: 1px solid #000;\n    background: none;\n    padding: 0;\n}\n.evc-studyplan-cancel-btn:hover{\n    color:#333;\n    border-bottom: 1px solid #333;\n}\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/cancel-pl/main',["troopjs-browser/component/widget",
    "jquery",
    "troopjs-ef/command/service",
    "troopjs-data/cache/component",
    "school-ui-studyplan/widget/gl-pl/popupbox/main",
    "template!./index.html"
], function(Widget, $, CommandService, Cache, Popupbox, template) {
    "use strict";

    var STATUS_START_STARTED = "started";

    var CSS_CLASS_POPUP_CONTAINER = ".ets-sp-init";
    var COMMAND;

    var DAYOFWEEK_ARR = [
        ["Sunday", "78946"],
        ["Monday", "78940"],
        ["Tuesday", "78941"],
        ["Wednesday", "78942"],
        ["Thusday", "78943"],
        ["Friday", "78944"],
        ["Saterday", "78945"]
    ];
    var MONTH_ARR = [
        ["January", "77396"],
        ["February", "77397"],
        ["March", "77398"],
        ["April", "77399"],
        ["May", "77400"],
        ["June", "77401"],
        ["July", "77402"],
        ["August", "77403"],
        ["September", "77404"],
        ["October", "77405"],
        ["November", "77406"],
        ["December", "77407"]
    ];

    function eventsHandling($el, eType, callback) {
        var hooked = false;
        return {
            'unhook': function() {
                $el.unbind(eType);
                hooked = false;
            },
            'hook': function() {
                if (hooked) {
                    return;
                }
                $el.bind(eType, callback);
                hooked = true;
            }
        };
    }

    return Widget.extend(function() {
    }, {
        "hub:memory/studyplan/evc/pl/status": function(dataLesson) {
            var me = this;

            if (!dataLesson || !dataLesson.bookedClass || !dataLesson.bookedClass.classId) {
                return;
            }

            me.classId = dataLesson.bookedClass.classId;

            // Return while class already open.
            if(dataLesson.countdown.timeIn <= 0){
                return;
            }
            // Render
            me.html(template);
            me.showNotice(dataLesson);
        },
        "showNotice": function(dataLesson) {
            var me = this;
            var $me = me.$element;
            var $cancel = $me.find(".evc-studyplan-cancel-btn");

            var cancelTime = dataLesson.suggestedCancelTime;
            var timezone = "UTC " + cancelTime.timezone;

            var strTime;

            if (cancelTime.minute > 9) {
                strTime = cancelTime.hour + ":" + cancelTime.minute;
            } else {
                strTime = cancelTime.hour + ":0" + cancelTime.minute;
            }

            me.publish("query", [
                "blurb!" + DAYOFWEEK_ARR[cancelTime.dayOfWeek][1],
                "blurb!" + MONTH_ARR[(cancelTime.month - 1)][1],
                "blurb!" + "568586"
            ]).spread(function(cancelWeek, cancelMonth, cancelContext) {

                var _cancelWeek = cancelWeek.translation;
                var _cancelMonth = cancelMonth.translation;
                var notice = cancelContext.translation;

                // show the cancel notice (start time > 1 day)
                var canceltime = strTime + ", " + _cancelWeek + " " + _cancelMonth + " " + cancelTime.day;
                notice = notice.replace("%%Canceltime%%", canceltime).replace("%%timezone%%", timezone);

                // init tooltips
                $cancel.attr("title", notice);
                $cancel.tooltip();

            });
        },
        "hub:memory/studyplan/evc/pl/start-status": function(status) {
            var me = this;
            var $me = me.$element;
            status === STATUS_START_STARTED && $me.remove();
        },
        "dom:[data-action=cancelBooking]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;
            var msg = $me.find(".studyplan-cancel-confirm").html();

            // Popup form init
            me.popupbox = new Popupbox({
                el: CSS_CLASS_POPUP_CONTAINER,
                zIndex: 160,
                msg: msg,
                bgColor: "#fff",
                closeble: true,
                closeButtonHide: true
            });
            me.popupbox.open().then(function($popup) {
                // Event Handling
                var $keepBooking = $popup.find("button[data-action='keepBooking']");
                eventsHandling($keepBooking, 'click', function(e) {
                    e.preventDefault();
                    me.popupbox.close();
                }).hook();

                var $confirmCancel = $popup.find("button[data-action='confirmCancel']");
                eventsHandling($confirmCancel, 'click', function(e) {
                    e.preventDefault();
                    me.popupbox.close();
                    var args = {
                        "classId": me.classId
                    };
                    me.publish("/commands/classes/cancel", args).then(function() {
                        // Publish cancel status to school
                        me.publish("studyplan/sequence/update");
                        // Reload current studyplan content
                        me.publish("studyplan/sequence-container/reload");
                    });
                }).hook();
            });
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/checkpoint20/index.html',[],function() { return function template(data) { var o = "";
var statusCode = data.statusCode;
var unitId = data.unitId;

var STATUS_WELCOME = "welcome";
var STATUS_NEVERTAKE = "nevertake";
var STATUS_BOOKED = "booked";
var STATUS_DROPOUT = "dropout";
var STATUS_PENDING = "pending";
var STATUS_ATTENDED = "attended";
o += "\n<div class=\"st-evc-status\" data-weave=\"school-ui-studyplan/widget/gl-pl/announcement/cp20\"></div>\n<div class=\"st-evc-status\" data-weave=\"school-ui-studyplan/widget/gl-pl/statusbar/cp20\"></div>\n<div class=\"evc-studyplan-wrapper\">\n\t"; if(statusCode === STATUS_WELCOME) { o += "\n\t\t<div class=\"evc-studyplan-column-single evc-studyplan-welcome\" data-weave=\"school-ui-studyplan/widget/gl-pl/welcome-cp20/main\"></div>\n\t"; } else { o += "\n\t\t<div class=\"evc-studyplan-column-full\"></div>\n\t\t"; if(statusCode !== STATUS_NEVERTAKE && statusCode !== STATUS_DROPOUT) {o += "\n\t\t\t<div class=\"evc-studyplan-column-single\">\n\t\t\t\t<div class=\"evc-studyplan-gap-2x\" data-weave=\"school-ui-studyplan/widget/gl-pl/lesson/cp20\"></div>\n\t\t\t\t"; if(statusCode !== STATUS_PENDING && statusCode !== STATUS_ATTENDED){ o += "\n\t\t\t\t\t<div class=\"evc-studyplan-gap-1x evc-studyplan-class-info\"></div>\n\t\t\t\t"; } o += "\n\t\t\t</div>\n\t\t"; } o += "\n\t\t<div class=\"evc-studyplan-activity-container\">\n\t\t</div>\n\t"; } o += "\n</div>\n\n<style type=\"text/css\">\n\t.evc-studyplan-wrapper{\n\t\ttext-align: center;\n\t\tpadding: 30px 0 50px;\n\t\tcolor: #4a4a4a;\n\t}\n\t.evc-studyplan-column-full{\n\t\tdisplay: inline-block;\n\t}\n\t.evc-studyplan-column-single{\n\t\tdisplay: inline-block;\n\t\twidth: 980px;\n\t}\n\t.evc-studyplan-column-single hr{\n\t\tmargin-bottom: 0;\n\t}\n\t.evc-studyplan-gap-2x{\n\t\ttext-align: left;\n\t\twidth: 620px;\n\t\tpadding-left: 35px;\n\t\tpadding-right: 35px;\n\t\tvertical-align: top;\n\t\tdisplay: inline-block;\n\t\tmargin: 20px auto;\n\t}\n\t.evc-studyplan-gap-1x{\n\t\ttext-align: left;\n\t\twidth: 330px;\n\t\tvertical-align: top;\n\t\tmargin: auto;\n\t\tpadding-left: 30px;\n\t\tdisplay: inline-block;\n\t\tborder-left:1px #eee solid;\n\t}\n\t.evc-studyplan-gap-1x .evc-studyplan-gap-block{\n\t\tmargin-bottom: 15px;\n\t}\n\t.st-evc-status{\n\t\tcolor: #4a4a4a;\n\t\tbackground-color: #e6e6e6;\n\t}\n\t.evc-studyplan-gray{\n\t\tcolor:#999999;\n\t}\n\t.evc-studyplan-green{\n\t\tcolor:#87c600;\n\t}\n\t.evc-studyplan-blue{\n\t\tcolor: #00bee3;\n\t}\n\t.evc-none{\n\t\tdisplay: none;\n\t}\n\t.evc-studyplan-activity-container {\n\t\twidth:880px;\n\t\tmargin:0 auto;\n\t}\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/checkpoint20/main',[
	"when",
	"jquery",
	"troopjs-browser/component/widget",
	"school-ui-studyplan/module",
	"school-ui-studyplan/utils/client-storage",
	"school-ui-studyplan/utils/time-parser",
	"template!./index.html"
], function (when, $, Widget, module, clientStorage, timeParser, template) {
	"use strict";

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
		useLegacyUnitId: true
	}, module.config() || {});

	var $ELEMENT = "$element";
	var ITEM = "_item";

	var STATUS_NEVERTAKE = "nevertake";
	var STATUS_BOOKED = "booked";
	var STATUS_DROPOUT = "dropout";
	var STATUS_PENDING = "pending";
	var STATUS_ATTENDED = "attended";

	var STATUS_WELCOME = "welcome";
	//use the same code as PL
	var STATUS_OPTIONAL_MSG_CP20 = "optional_msg_pl";

	var STATUS_START_NOT_YET = "notyet";
	var STATUS_START_IN_COUNTDOWN = "incountdown";
	var STATUS_START_STARTED = "started";

	var WIDGET_COUNTDOWN = "school-ui-studyplan/widget/gl-pl/countdown/cp20",
		WIDGET_CLASS_STATUS = "school-ui-studyplan/widget/gl-pl/class-status/cp20",
		WIDGET_FEEDBACK = "school-ui-studyplan/widget/gl-pl/feedback/cp20",
		WIDGET_FEEDBACK_PENDING = "school-ui-studyplan/widget/gl-pl/feedback-pending/main",
		WIDGET_ENTER_CLASS = "school-ui-studyplan/widget/gl-pl/enter-class/cp20",
		WIDGET_BOOKED = "school-ui-studyplan/widget/gl-pl/book-cp20/main",
		WIDGET_DROPOUT = "school-ui-studyplan/widget/gl-pl/dropout-cp20/main",
		WIDGET_CANCEL = "school-ui-studyplan/widget/gl-pl/cancel-cp20/main";

	var SEL_ACTIVITY_CONTAINER = ".evc-studyplan-activity-container",
		SEL_INFO_CONTAINER = ".evc-studyplan-class-info",
		SEL_ENTER_CLASS = ".ets-sp-glpl-enter-class";

	var CLS_GAP_2X = "evc-studyplan-gap-2x text-center",
		CLS_GAP = "evc-studyplan-gap-block",
		CLS_ENTER_CLASS = "ets-sp-glpl-enter-class",
		CLS_NONE = "ets-none";

	var UNIT_ID = "_unit_id";
	var CLASS_ID = "_class_id";

	var UNIT_ID_KEY = MODULE_CONFIG.useLegacyUnitId ? "legacyUnitId" : "templateUnitId"

	var TOPIC_PIC_PATH = MODULE_CONFIG.cacheServer + "/_imgs/evc/pl/topic/100x100/";
	var PL_DEFAULT_PIC = MODULE_CONFIG.cacheServer + "/_imgs/evc/pl/pl_default_100x100.png";

	var DURATION_WAITING = 3000;

	var TIMER_WAITING = "_timer_waiting";

	function createWidget(widgetName, appendToContainer, classNames) {
		var me = this;
		var $widgetElement = $("<div>");

		if (widgetName === WIDGET_ENTER_CLASS) {
			$widgetElement.attr("data-weave", widgetName + "(unitId, classId)")
				.data("classId", me[CLASS_ID]);
		} else {
			$widgetElement.attr("data-weave", widgetName + "(unitId)");
		}
		return $widgetElement
			.addClass(classNames || "")
			.data("unitId", me[UNIT_ID])
			.appendTo(me.$element.find(appendToContainer))
			.weave();
	}

	return Widget.extend(function ($element, name, item) {
		var me = this;

		if (!item && !item.properties) {
			return;
		}

		me[ITEM] = item;

		// Show Optional Msg
		me.closeOptionalTips = clientStorage.getLocalStorage("cp20_tips") === "closed";
		// A defer for pl status, for hide skip link
		me.cpStatusDeferred = when.defer();
	}, {
		"hub:memory/load/unit": function (unit) {
			var me = this;
			if (!unit || !unit[UNIT_ID_KEY]) {
				return;
			}
			me.unitId = unit[UNIT_ID_KEY];

			me.publish("query", ["member_site_setting!evc;FirstTimeStudyPlanCP20"]).spread(function (data) {
				if (!data) {
					return;
				}
				if (data.value.toString() === "true") {
					me.publish("studyplan/evc/cp20/load");
				} else {
					me.html(template, {
						"unitId": me.unitId,
						"statusCode": STATUS_WELCOME
					});
				}
			});
		},
		"hub:memory/studyplan/evc/cp20/start-status": function (status) {
			var me = this;
			switch (status) {
				case STATUS_START_NOT_YET:
					me.$element.find(SEL_ENTER_CLASS).addClass(CLS_NONE);
					break;
				case STATUS_START_IN_COUNTDOWN:
					me.$element.find(SEL_ENTER_CLASS).addClass(CLS_NONE);
					break;
				case STATUS_START_STARTED:
					me.$element.find(SEL_ENTER_CLASS).removeClass(CLS_NONE);
					break;
			}
		},
		"hub/studyplan/evc/cp20/load": function () {
			var me = this;
			me[UNIT_ID] = me.unitId;

			when.all([
				me.publish("query", ["checkpointstate!cp20;" + me.unitId]),
				me.publish("query", [me[ITEM].id + ".progress"])
			]).spread(function success(cpStateData, itemData) {

				var cpState = cpStateData[0];
				var item = itemData[0];

				if (!cpState || !cpState.topic || !cpState.statusCode) {
					return;
				}

				var content = {};
				var topic = cpState.topic;
				var statusCode = cpState.statusCode.toLowerCase();
				// Resolve pl status
				me.cpStatusDeferred.resolver.notify(statusCode);

				// Copy & package own/customize PL class Info
				content.status = {
					"statusCode": statusCode
				};

				content.lessonInfo = {
					"topic": topic.topicBlurbId,
					"description": topic.descBlurbId,
					"image": topic.imageUrl ? (TOPIC_PIC_PATH + topic.imageUrl) : PL_DEFAULT_PIC
				};
				if (statusCode === STATUS_BOOKED ||
					statusCode === STATUS_ATTENDED ||
					statusCode === STATUS_PENDING ||
					statusCode === STATUS_NEVERTAKE ||
					statusCode === STATUS_DROPOUT) {


					var bookedClass = cpState.bookedClass || cpState.pastClass;
					if (bookedClass && bookedClass.easternStartTime) {
						me[CLASS_ID] = bookedClass.classId;
						// Copy cpState
						content.timezoneId = bookedClass.timezoneId;
						content.bookedClass = {
							"classId": bookedClass.classId,
							"teacherId": bookedClass.teacherId
						};
						content.customizedStartTime = timeParser.toLocalTime(
							bookedClass.easternStartTime,
							bookedClass.timeZoneOffset
						);
					}

					if (statusCode === STATUS_BOOKED) {
						if (!bookedClass || !bookedClass.easternSuggestedCancelTime || !cpState.countdown) {
							return;
						}
						var countdown = cpState.countdown;

						content.countdown = {
							"timeIn": countdown.secondsLeftForStart,
							"timeOut": countdown.secondsLeftForEnter
						};
						content.suggestedCancelTime = timeParser.toLocalTime(
							bookedClass.easternSuggestedCancelTime,
							bookedClass.timeZoneOffset
						);
					} else if (statusCode === STATUS_PENDING) {
						if (!cpState.feedback) {
							return;
						}

						content.feedback = {
							"teacherId": cpState.feedback.teacherId
						};
					}
					else if (statusCode === STATUS_ATTENDED) {
						if (!cpState.feedback) {
							return;
						}
						var feedback = cpState.feedback;
						content.feedback = {
							"feedbackId": feedback.feedbackId,
							"teacherId": feedback.teacherId
						};
					}

					var evcServerCode = bookedClass && bookedClass.evcServerCode || '';
					// Adobe classroom: "cn1" or "us1", otherwise "EvcCN1" or "EvcUS1"
					var isAdobeClassroom = evcServerCode.toLowerCase().indexOf('evc') < 0;
					if (!isAdobeClassroom) {
						// simulate techcheck passed
						clientStorage.setSessionStorage("techcheck_state", "passed");
					}

					// Render
					me.html(template, {
						"unitId": me.unitId,
						"statusCode": statusCode
					}).then(function () {
						me[$ELEMENT].find(SEL_INFO_CONTAINER).empty();
						me[$ELEMENT].find(SEL_ACTIVITY_CONTAINER).empty();

					// Publish status
					me.publish("studyplan/evc/cp20/status", content);
					// clear the class status as not yet
					me.publish("studyplan/evc/cp20/start-status", STATUS_START_NOT_YET);
					// publish token
					me.publish("studyplan/evc/cp20/enter-token", item.progress.properties.token);

						// Publish status to show optional msg
						if (!me.closeOptionalTips) {
							me.publish("studyplan/evc/cp20/notification", {
								"statusCode": STATUS_OPTIONAL_MSG_CP20
							});
						}

						switch (statusCode.toLowerCase()) {
							case STATUS_NEVERTAKE:
								createWidget.call(me, WIDGET_BOOKED, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
								break;
							case STATUS_DROPOUT:
								createWidget.call(me, WIDGET_DROPOUT, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
								break;
							case STATUS_BOOKED:
								createWidget.call(me, WIDGET_COUNTDOWN, SEL_INFO_CONTAINER, CLS_GAP);
								createWidget.call(me, WIDGET_CLASS_STATUS, SEL_INFO_CONTAINER, CLS_GAP);
								createWidget.call(me, WIDGET_ENTER_CLASS, SEL_INFO_CONTAINER, CLS_GAP + " " + CLS_ENTER_CLASS + " " + CLS_NONE);
								createWidget.call(me, WIDGET_CANCEL, SEL_INFO_CONTAINER, CLS_GAP);
								break;
							case STATUS_ATTENDED:
								createWidget.call(me, WIDGET_FEEDBACK, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
								break;
							case STATUS_PENDING:
								createWidget.call(me, WIDGET_FEEDBACK_PENDING, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
								break;
							default:
								break;
						}
					});
				}

			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/class-status/class-status.html',[],function() { return function template(data) { var o = "<div class=\"evc-studyplan-class-tips " + (data.classname ? data.classname : "") + "\">\n    <i class=\"" + (data.icon ? data.icon : "glyphicon icon-comment") + "\"></i>\n    <span   data-weave=\"troopjs-ef/blurb/widget\" \n            data-text-en=\"" +data.en+ "\" \n            data-blurb-id=\"" +data.blurbId+ "\" >\n    </span>\n</div>\n<style>\n    .evc-studyplan-class-tips{\n        font-family: \"roboto_condensedbold\", \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n        text-transform: uppercase;\n        font-size: 18px;\n    }\n    .evc-studyplan-class-tips .glyphicon {\n\t    margin-right: 10px;\n    }\n    .evc-studyplan-class-tips *{\n        vertical-align: middle;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/class-status/cp20',[
	"troopjs-ef/component/widget",
	"school-ui-studyplan/utils/client-storage",
	"template!./class-status.html"
	], function(Widget, clientStorage, tClassStatus){

	var UNITID = "_unitId";
	var STATUS = "_statusCode";
    var STATUS_BOOKED = "booked";
    var STATUS_START_IN_COUNTDOWN = "incountdown";
    var STATUS_START_STARTED = "started";

	var CASE = {
		tckNoPass: {
			"BOOKED" : {blurbId : "568587", en : "Class booked", classname : "evc-studyplan-green"},
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "656134", en : "Classroom is open but you cannot enter", classname : "evc-studyplan-blue"}
		},
		tckPassed: {
			"BOOKED" : {blurbId : "568587", en : "Class booked", classname : "evc-studyplan-green"},
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "568579", en : "Classroom is open", classname : "evc-studyplan-blue"}
		}
	};


	return Widget.extend(function(element, path, unitId){
		var me = this;
		me[UNITID] = unitId;
	},{
		"sig/initialize" : function(){
			var me = this;
			return me.query("checkpointstate!cp20;" + me[UNITID]).spread(function(data){
				me[STATUS] = data.statusCode.toLowerCase();
				if(me[STATUS] === STATUS_BOOKED){
					return me.render("BOOKED");
				}
			});
		},
		"hub:memory/studyplan/evc/cp20/start-status" : function(status){
			var me = this;
			if(me[STATUS] === STATUS_BOOKED){
				if(status === STATUS_START_STARTED){
					me.render("OPEN");
				}
				else if(status === STATUS_START_IN_COUNTDOWN){
					me.render("CLOSED");
				}
			}
		},
		"render" : function(type){
			var subCase = clientStorage.getSessionStorage("techcheck_state") === "passed" ? CASE.tckPassed : CASE.tckNoPass;
			if(subCase[type]){
				return this.html(tClassStatus, subCase[type]);
			}
		}
	});
});

define('school-ui-studyplan/widget/gl-pl/class-status/gl',[
	"troopjs-ef/component/widget",
	"school-ui-studyplan/utils/client-storage",
	"template!./class-status.html"
], function (Widget, clientStorage, tClassStatus) {

	var CASE = {
		tckNoPass: {
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "656134", en : "Classroom is open but you cannot enter", classname : "evc-studyplan-blue"}
		},
		tckPassed: {
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "568579", en : "Classroom is open", classname : "evc-studyplan-blue"}
		}
	};

	var STATUS_START_STARTED = "started";

	return Widget.extend({
		"hub:memory/studyplan/evc/gl/start-status": function (status) {
			var me = this;
			var subCase = clientStorage.getSessionStorage("techcheck_state") === "passed" ? CASE.tckPassed : CASE.tckNoPass;
			if (status === STATUS_START_STARTED) {
				me.html(tClassStatus, subCase.OPEN);
			}
			else {
				me.html(tClassStatus, subCase.CLOSED);
			}
		}
	});
});

define('school-ui-studyplan/widget/gl-pl/class-status/pl',[
	"troopjs-ef/component/widget",
	"school-ui-studyplan/utils/client-storage",
	"template!./class-status.html"
	], function(Widget, clientStorage, tClassStatus){

	var UNITID = "_unitId";
	var STATUS = "_statusCode";

    var STATUS_BOOKED = "booked";
    var STATUS_START_IN_COUNTDOWN = "incountdown";
    var STATUS_START_STARTED = "started";

	var CASE = {
		tckNoPass: {
			"BOOKED" : {blurbId : "568587", en : "Class booked", classname : "evc-studyplan-green"},
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "656134", en : "Classroom is open but you cannot enter", classname : "evc-studyplan-blue"}
		},
		tckPassed: {
			"BOOKED" : {blurbId : "568587", en : "Class booked", classname : "evc-studyplan-green"},
			"CLOSED" : {blurbId : "656133", en : "Classroom not open", classname : "evc-studyplan-gray"},
			"OPEN" : {blurbId : "568579", en : "Classroom is open", classname : "evc-studyplan-blue"}
		}
	};


	return Widget.extend(function(element, path, unitId){
		var me = this;
		me[UNITID] = unitId;
	},{
		"sig/initialize" : function(){
			var me = this;
			return me.query("plclass!" + me[UNITID]).spread(function(data){
				me[STATUS] = data.statusCode.toLowerCase();
				if(me[STATUS] === STATUS_BOOKED){
					return me.render("BOOKED");
				}
			});
		},
		"hub:memory/studyplan/evc/pl/start-status" : function(status){
			var me = this;
			if(me[STATUS] === STATUS_BOOKED){
				if(status === STATUS_START_STARTED){
					me.render("OPEN");
				}
				else if(status === STATUS_START_IN_COUNTDOWN){
					me.render("CLOSED");
				}
			}
		},
		"render" : function(type){
			var subCase = clientStorage.getSessionStorage("techcheck_state") === "passed" ? CASE.tckPassed : CASE.tckNoPass;
			if(subCase[type]){
				return this.html(tClassStatus, subCase[type]);
			}
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/countdown-scoreboard/index.html',[],function() { return function template(data) { var o = "<div class=\"countdown-scoreboard text-center clearfix\">\n    <div class=\"countdown-scoreboard-boards pull-left\">\n        <ol class=\"boards-container\">\n            <li class=\"countdown-scoreboard-board hh\">\n                <div class=\"top\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"bottom\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"top-animation\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"bottom-animation\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <span class=\"hh\">HOUR</span>\n            </li>\n            <li class=\"board-separator\"></li>\n            <li class=\"countdown-scoreboard-board mm\">\n                <div class=\"top\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"bottom\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"top-animation\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"bottom-animation\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <span class=\"mm\">MIN</span>\n            </li>\n            <li class=\"board-separator\"></li>\n            <li class=\"countdown-scoreboard-board ss\">\n                <div class=\"top\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"bottom\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"top-animation\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <div class=\"bottom-animation\">\n                    <span class=\"tens disabled\">0</span>\n                    <span class=\"ones disabled\">0</span>\n                </div>\n                <span class=\"ss\">SEC</span>\n            </li>\n        </ol>\n    </div>\n</div>\n\n<style type=\"text/css\">\n.countdown-scoreboard, .countdown-scoreboard .countdown-scoreboard-boards li, .countdown-scoreboard .countdown-scoreboard-labels li {\n    display: inline-block;\n    *display: inline;\n    *zoom: 1;\n}\n.countdown-scoreboard {\n    position: relative;\n    font-family: Arial;\n    text-align: center;\n}\n.countdown-scoreboard .countdown-scoreboard-boards {\n    position: relative;\n}\n.countdown-scoreboard ol, .countdown-scoreboard ul {\n    margin: 0;\n    list-style: none;\n}\n.countdown-scoreboard .boards-container {\n    border-radius: 4px;\n    position: relative;\n}\n.countdown-scoreboard .countdown-scoreboard-boards li {\n    font-size: 0px;\n    text-align: center;\n    vertical-align: middle;\n}\n.countdown-scoreboard .countdown-scoreboard-board,\n.countdown-scoreboard .countdown-scoreboard-board div,\n.countdown-scoreboard .countdown-scoreboard-board span {\n    width: 38px;\n    height: 31px;\n    line-height: 29px;\n    margin-bottom: 10px;\n}\n.countdown-scoreboard .countdown-scoreboard-board {\n    position:relative;\n    -webkit-perspective: 5em;\n    -moz-perspective: 5em;\n    -ms-perspective: 5em;\n    -o-perspective: 5em;\n    perspective: 5em;\n    text-align:center;\n}\n.countdown-scoreboard .countdown-scoreboard-board div {\n    height: 50%;\n    overflow: hidden;\n    position:absolute;\n    left:0;\n}\n.countdown-scoreboard .countdown-scoreboard-board span {\n    width: auto;\n    color: #000;\n    font-size : 18px;\n    font-family: \"roboto_condensedbold\", \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n    font-weight: bold;\n}\n.countdown-scoreboard .board-separator {\n    width: 0px;\n    border-right: 1px solid #828275;\n    height: 32px;\n    vertical-align: middle;\n}\n.countdown-scoreboard .top,\n.countdown-scoreboard .top-animation {\n    border-top-left-radius: 4px;\n    border-top-right-radius: 4px;\n    top: 0;\n}\n.countdown-scoreboard .bottom,\n.countdown-scoreboard .bottom-animation {\n    border-bottom-left-radius: 4px;\n    border-bottom-right-radius: 4px;\n    top: 50%;\n}\n.countdown-scoreboard .top span,\n.countdown-scoreboard .top-animation span,\n.countdown-scoreboard .bottom span,\n.countdown-scoreboard .bottom-animation span {\n    height: 200%;\n    position: relative;\n}\n.countdown-scoreboard .bottom span,\n.countdown-scoreboard .bottom-animation span {\n    top: -100%;\n}\n.countdown-scoreboard .top-animation,\n.countdown-scoreboard .bottom-animation {\n    visibility: hidden;\n}\n.countdown-scoreboard .top-animation.animation,\n.countdown-scoreboard .bottom-animation.animation {\n    visibility: visible;\n}\n@keyframes countdownScoreboardBottom {\n    from {\n        transform: rotateX(0);\n    }\n    to {\n        transform: rotateX(90deg);\n    }\n}\n@-webkit-keyframes countdownScoreboardBottom {\n    from {\n        -webkit-transform: rotateX(0);\n    }\n    to {\n        -webkit-transform: rotateX(90deg);\n    }\n}\n@-moz-keyframes countdownScoreboardBottom {\n    from {\n        -moz-transform: rotateX(0);\n    }\n    to {\n        -moz-transform: rotateX(90deg);\n    }\n}\n@-ms-keyframes countdownScoreboardBottom {\n    from {\n        -ms-transform: rotateX(0);\n    }\n    to {\n        -ms-transform: rotateX(90deg);\n    }\n}\n@-o-keyframes countdownScoreboardBottom {\n    from {\n        -o-transform: rotateX(0);\n    }\n    to {\n        -o-transform: rotateX(90deg);\n    }\n}\n@keyframes countdownScoreboardTop {\n    from {\n        transform: rotateX(-90deg);\n    }\n    to {\n        transform: rotateX(0);\n    }\n}\n@-webkit-keyframes countdownScoreboardTop {\n    from {\n        -webkit-transform: rotateX(-90deg);\n    }\n    to {\n        -webkit-transform: rotateX(0);\n    }\n}\n@-ms-keyframes countdownScoreboardTop {\n    from {\n        -ms-transform: rotateX(-90deg);\n    }\n    to {\n        -ms-transform: rotateX(0);\n    }\n}\n@-o-keyframes countdownScoreboardTop {\n    from {\n        -o-transform: rotateX(-90deg);\n    }\n    to {\n        -o-transform: rotateX(0);\n    }\n}\n.countdown-scoreboard .bottom-animation.animation {\n    -webkit-animation: countdownScoreboardBottom 0.2s linear 0s forwards 1;\n    -moz-animation: countdownScoreboardBottom 0.2s linear 0s forwards 1;\n    -ms-animation: countdownScoreboardBottom 0.2s linear 0s forwards 1;\n    -o-animation: countdownScoreboardBottom 0.2s linear 0s forwards 1;\n    animation: countdownScoreboardBottom 0.2s linear 0s forwards 1;\n    -webkit-transform-origin: 0 top;\n    -moz-transform-origin: 0 top;\n    -ms-transform-origin: 0 top;\n    -o-transform-origin: 0 top;\n    transform-origin: 0 top;\n}\n.countdown-scoreboard .top-animation {\n    -webkit-transform: rotateX(-90deg);\n    -moz-transform: rotateX(-90deg);\n    -ms-transform: rotateX(-90deg);\n    -o-transform: rotateX(-90deg);\n    transform: rotateX(-90deg);\n}\n.countdown-scoreboard .top-animation.animation {\n    -webkit-animation: countdownScoreboardTop 0.3s ease-out 0.2s forwards 1;\n    -moz-animation: countdownScoreboardTop 0.3s ease-out 0.2s forwards 1;\n    -ms-animation: countdownScoreboardTop 0.3s ease-out 0.2s forwards 1;\n    -o-animation: countdownScoreboardTop 0.3s ease-out 0.2s forwards 1;\n    animation: countdownScoreboardTop 0.3s ease-out 0.2s forwards 1;\n    -webkit-transform-origin: 0 bottom;\n    -moz-transform-origin: 0 bottom;\n    -mstransform-origin: 0 bottom;\n    -o-transform-origin: 0 bottom;\n    transform-origin: 0 bottom;\n}\n.countdown-scoreboard .boards-axis {\n    width: 149px;\n    height: 1px;\n    position: absolute;\n    left: 3px;\n    top: 17px;\n    background: #eee;\n    opacity: 0.5;\n}\n.countdown-scoreboard .countdown-scoreboard-labels li {\n    font-size: 9px;\n}\n.countdown-scoreboard .countdown-scoreboard-board .hh,\n.countdown-scoreboard .countdown-scoreboard-board .ss,\n.countdown-scoreboard .countdown-scoreboard-board .mm {\n    font-size : 10px;\n    width: 38px;\n    position: relative;\n    bottom:-18px;\n    margin-bottom: 0;\n}\n/*.countdown-scoreboard .button,*/\n.countdown-scoreboard div.countdown-scoreboard-action {\n    position: relative;\n}\n.countdown-scoreboard div.countdown-scoreboard-action button.countdown-scoreboard-tips {\n    display: none;\n    color: #56c2d5;\n    background-color: #fff;\n    cursor: default;\n}\n.countdown-scoreboard .countdown-scoreboard-tips-icon {\n    transform: scaleX(-1);\n    -o-transform: scaleX(-1);\n    -moz-transform: scaleX(-1);\n    -webkit-transform: scaleX(-1);\n}\n.countdown-scoreboard .countdown-scoreboard-tips-txt {\n    white-space: nowrap;\n    text-transform: uppercase;\n}\n.countdown-scoreboard div.countdown-scoreboard-action button.countdown-scoreboard-enter {\n    display: none;\n    position: absolute;\n    top: 0;\n    left: 0;\n}\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/countdown-scoreboard/main',['jquery',
    'template!./index.html'
], function($, template) {
    'use strict';

    var UNDEF;

    var DAY_MAX_SECONDS = 24 * 60 * 60;
    var timeProcessor = {
        convertToObject: function(seconds) {
            return {
                hh: this.extractDigits((seconds / 3600) >>> 0),
                mm: this.extractDigits(((seconds % 3600) / 60) >>> 0),
                ss: this.extractDigits(seconds % 60)
            };
        },
        extractDigits: function(number) {
            if (number < 10) {
                return {
                    ones: number,
                    tens: 0
                };
            }
            var digits = ('' + number).split('');
            return {
                ones: digits[1] >>> 0,
                tens: digits[0] >>> 0
            };
        },
        updateDigits: function(seconds) {

        }
    };

    function animationSupport($el) {
        var animation = false,
            animationstring = 'animation',
            keyframeprefix = '',
            domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
            pfx = '';
        var elm = $el[0];

        if (elm.style.animationName) {
            animation = true;
        }

        if (animation === false) {
            for (var i = 0; i < domPrefixes.length; i++) {
                if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                    pfx = domPrefixes[i];
                    animationstring = pfx + 'Animation';
                    keyframeprefix = '-' + pfx.toLowerCase() + '-';
                    animation = true;
                    break;
                }
            }
        }
        return animation;
    }

    function scoreboard(options) {
        options = $.extend({
            finished: false,
            paused: false
        }, options);

        // fix width and position for different languages
        var $el = options.$el;
        var removeNeeded = false;
        if (!$.contains(document.body, $el[0])) {
            removeNeeded = true;
            $el.appendTo('body');
        }

        var $boards = $el.find('.countdown-scoreboard-boards');
        var $enter = $el.find('.countdown-scoreboard-enter');
        var $waitting = $el.find('.countdown-scoreboard-waitting');
        $enter.css('left', 0);

        if (removeNeeded) {
            $el.remove();
        }

        // ATEAM-873 - study plan bar shaking when count down is counting
        var animationSupported = false; //animationSupport($el);
        if (animationSupported) {
            $el.on('animationend webkitAnimationEnd msAnimationend oAnimationEnd', '.animation', function() {
                var $this = $(this).removeClass('animation');
                if ($this.is('.bottom-animation')) {
                    $this.siblings('.top-animation').html($this.siblings('.bottom').html());
                }
                if ($this.is('.top-animation')) {
                    $this.siblings('.top').html($this.html());
                }
            });
        } else {
            $el.find('.top-animation, .bottom-animation').remove();
        }

        return {
            $el: $el,
            disabled: false,

            checkPoints: {
                afterEnd: {},
                beforeEnd: {}
            },
            secondTimer : UNDEF,
            afterEndTimer : [],
            timeoutTimer : UNDEF,
            timeIn: options.timeIn,
            enterClickHandler: $.noop,
            secondsLeft: options.timeIn,
            timeOut: options.timeOut,
            timeOutHandler: $.noop,
            startHandler : $.noop,

            afterEnd: function(seconds, f) {
                var me = this;
                me.checkPoints.afterEnd[seconds] = f;
                return me;
            },
            beforeEnd: function(seconds, f) {
                var me = this;
                me.checkPoints.beforeEnd[seconds] = f;
                return me;
            },
            disableEnter: function() {
                var me = this;
                me.disabled = true;
                me.$el.find('.countdown-scoreboard-enter')
                    .addClass('disabled');
                return me;
            },
            onDurationEnd: function() {
                var me = this;
                me.finished = true;
                var $el = me.$el;

                if (me.timeOut) {
                    me.timeoutTimer && clearTimeout(timeoutTimer);
                    me.timeoutTimer = setTimeout(me.timeOutHandler, 1000 * (me.timeOut - me.timeIn));
                }
                $.each(me.checkPoints.afterEnd, function(seconds, f) {
                    me.afterEndTimer.push(
                        setTimeout(function() {
                            f.apply(me);
                        }, 1000 * seconds)
                    );
                });
                return me;
            },
            onEnterClick: function(f) {
                var me = this;
                me.enterClickHandler = f;
                return me;
            },
            onTimeout: function(f) {
                var me = this;
                me.timeOutHandler = f;
                return me;
            },
            onStart : function(f){
                var me = this;
                me.startHandler = f;
                return me;
            },
            pause: function() {
                var me = this;
                me.paused = true;
                return me;
            },
            start: function() {
                var me = this;
                var $el = me.$el;

                if(me.secondsLeft){
                    // resotre the state of html and css
                    // Initialize scoreboard UI
                    me.updateBoards(0, me.secondsLeft);
                    // Flip loop
                    (function flipScoreboard() {
                        if (me.finished || me.paused) {
                            return;
                        }
                        if (me.secondsLeft === 0) {
                            me.onDurationEnd();
                            return;
                        }

                        var oldTime = me.secondsLeft;
                        var newTime = --me.secondsLeft;
                        me.updateBoards(oldTime, newTime);
                        if (me.checkPoints.beforeEnd[me.secondsLeft]) {
                            me.checkPoints.beforeEnd[me.secondsLeft]();
                        }
                        me.secondTimer = setTimeout(flipScoreboard, 1000);
                    })();     
                    me.startHandler();               
                }
                else{
                    me.checkPoints.beforeEnd[0] && me.checkPoints.beforeEnd[0]();
                    me.onDurationEnd();
                }


                return me;
            },
            updateBoard: function(boardName, digits) {
                var me = this;
                var $board = me.$el.find('.' + boardName);
                var oldDigits = digits.oldDigits;
                var newDigits = digits.newDigits;

                $board
                    .find('.tens').text(newDigits.tens)
                    .end()
                    .find('.ones').text(newDigits.ones);
                if (animationSupported) {
                    $board
                        .find('.top .tens, .top-animation .tens, .bottom-animation .tens').text(oldDigits.tens)
                        .end()
                        .find('.top .ones, .top-animation .ones, .bottom-animation .ones').text(oldDigits.ones)
                        .end()
                        .find('.bottom-animation, .top-animation').addClass('animation');
                }
                return me;
            },
            updateBoards: function(oldTime, newTime) {
                var me = this;
                var boards = ['hh', 'mm', 'ss'];
                var digitsStateCheckNeeded = true;
                oldTime = timeProcessor.convertToObject(oldTime);
                newTime = timeProcessor.convertToObject(newTime);
                for (var i = 0; i < boards.length; i++) {
                    var board = boards[i];
                    var oldDigits = oldTime[board];
                    var newDigits = newTime[board];
                    if (newDigits.tens !== oldDigits.tens || newDigits.ones !== oldDigits.ones) {
                        me.updateBoard(boards[i], {
                            oldDigits: oldDigits,
                            newDigits: newDigits
                        });
                    }

                    // TODO: improve performance
                    // disabled preceding zeros
                    var digits = ['tens', 'ones'];
                    var $digit;
                    for (var j = 0; j < digits.length; j++) {
                        $digit = me.$el.find('.' + board + ' .' + digits[j]);
                        if (digitsStateCheckNeeded) {
                            if (!newDigits[digits[j]]) {
                                $digit.removeClass('enabled').addClass('disabled');
                            } else {
                                $digit.removeClass('disabled').addClass('enabled');
                                digitsStateCheckNeeded = false;
                            }
                        } else {
                            $digit.removeClass('disabled').addClass('enabled');
                        }
                    }
                }
                return me;
            }
        };
    }

    var w = function() {
        var $template = $(template());

        var o = {};
        o.$el = $template.appendTo('body').remove();
        o.init = function(options) {
            var me = this;

            if (!options) {
                options = {};
                throw ("Init should have an input object.");
            }

            var timeIn = options.timeIn;
            var timeOut = options.timeOut;
            if (isNaN(timeIn)) {
                options.timeIn = DAY_MAX_SECONDS - 1;
                throw ("timeIn should be a number.");
            } else if (timeIn >= DAY_MAX_SECONDS) {
                options.timeIn = DAY_MAX_SECONDS - 1;
                throw ("timeIn should little than 24 * 60 * 60.");
            } else if (timeIn < 0) {
                options.timeIn = 0;
                //throw ("timeIn can't be a minus.");
            } else if (typeof timeOut === "number" && timeOut <= timeIn) {
                // timeOut should greater than timeIn,
                // or timeOut === 0
                options.timeOut = 0;
            }
            // Reset timeIn to 1s
            // Slow render Enter, waiting for blurbs
            // if (options.timeIn === 0) {
            //     options.timeIn = 1;
            // }

            var countdown = scoreboard($.extend(options, {
                $el: me.$el
            }));

            //wait a single tick for onTimeout/onStart execute
            setTimeout(function(){
                countdown.start();
            }, 0);

            return {
                afterEnd: function(seconds, f) {
                    var me = this;
                    if (seconds >= 0) {
                        countdown.afterEnd(seconds, f);
                    }
                    return me;
                },
                beforeEnd: function(seconds, f) {
                    var me = this;
                    if (0 <= seconds) {
                        if(seconds <= countdown.secondsLeft){
                            countdown.beforeEnd(seconds, f);
                        }
                        else{
                            f && f();
                        }
                    }
                    return me;
                },
                disableEnter: function() {
                    var me = this;
                    countdown.disableEnter();
                    return me;
                },
                onEnd: function(f) {
                    var me = this;
                    this.afterEnd(0, f);
                    return me;
                },
                onEnterClick: function(f) {
                    var me = this;
                    countdown.onEnterClick(f);
                    return me;
                },
                onTimeout: function(f) {
                    var me = this;
                    countdown.onTimeout(f);
                    return me;
                },
                onStart: function(f) {
                    var me = this;
                    countdown.onStart(f);
                    return me;
                },
                // TODO: to be continued
                restart: function() {
                    countdown.start();
                },
                //stop all the timeout
                stop : function(){
                    countdown.secondTimer && clearTimeout(countdown.secondTimer);
                    countdown.timeoutTimer && clearTimeout(countdown.timeoutTimer);
                    countdown.afterEndTimer.forEach(function(timer){
                        clearTimeout(timer);
                    });
                    return this;
                }
            };
        };
        return o;
    };
    return w;
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/countdown/index.html',[],function() { return function template(data) { var o = "";
    var time = data.time;
    var day = data.day;
    var timezone = data.timezone;
o += "\n<div class=\"evc-studyplan-countdown\">\n    <div class=\"evc-studyplan-countdown-block\">\n        <strong><span>" + time + "</span></strong><span>,</span>&nbsp;<span>" + day + "</span>&nbsp;<span>UTC&nbsp;" + timezone + "</span>\n    </div>\n</div>\n\n<style type=\"text/css\">\n    .evc-studyplan-countdown{\n        font-size: 14px;\n        display: inline-block;\n\t    background:#eee;\n    }\n    .evc-studyplan-countdown-block{\n        display: inline-block;\n        padding: 10px 18px;\n    }\n    .evc-studyplan-countdown-status{\n        color: #fff;\n        background-color: #bbb;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/countdown/main',["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    "use strict";

    var DAYOFWEEK_ARR = [
        ["Sunday", "78946"],
        ["Monday", "78940"],
        ["Tuesday", "78941"],
        ["Wednesday", "78942"],
        ["Thusday", "78943"],
        ["Friday", "78944"],
        ["Saterday", "78945"]
    ];
    var MONTH_ARR = [
        ["January", "77396"],
        ["February", "77397"],
        ["March", "77398"],
        ["April", "77399"],
        ["May", "77400"],
        ["June", "77401"],
        ["July", "77402"],
        ["August", "77403"],
        ["September", "77404"],
        ["October", "77405"],
        ["November", "77406"],
        ["December", "77407"]
    ];

    return Widget.extend({
        "disableEnter": function() {
            var me = this;
            if (me.countdownScoreboard) {
                me.countdownScoreboard.disableEnter();
            }
        },
        "renderDate": function(startTime, isDay) {
            var me = this;
            if (!startTime) {
                return;
            }

            var strTime;
            var strDay;

            if (startTime.minute > 9) {
                strTime = startTime.hour + ":" + startTime.minute;
            } else {
                strTime = startTime.hour + ":0" + startTime.minute;
            }

            if(isDay){
                // Display full date
                me.publish("query", [
                    "blurb!" + DAYOFWEEK_ARR[startTime.dayOfWeek][1],
                    "blurb!" + MONTH_ARR[(startTime.month - 1)][1]
                ]).spread(function(startWeek, startMonth) {
                    var _startWeek = startWeek.translation;
                    var _startMonth = startMonth.translation;
                    strDay = _startWeek + " " + _startMonth + " " + startTime.day;
                    // Render Template
                    me.html(template, {
                        time: strTime,
                        day: strDay,
                        timezone: startTime.timezone
                    });
                });
            }
            else{
                me.publish("query", ["blurb!103048"]).spread(function(day) {
                    // Render
                    strDay = day.translation || "Today";
                    me.html(template, {
                        time: strTime,
                        day: strDay,
                        timezone: startTime.timezone
                    });
                });
            }

        }
    });
});
define('school-ui-studyplan/widget/gl-pl/countdown/cp20',["jquery",
    "./main",
    "school-ui-studyplan/widget/gl-pl/countdown-scoreboard/main"
], function($, CountdownBase, CountdownScoreboard) {
    "use strict";

    var HOUR_SECONDES = 1 * 60 * 60; // 1hr

    var STATUS_START_NOT_YET = "notyet";
    var STATUS_START_IN_COUNTDOWN = "incountdown";
    var STATUS_START_STARTED = "started";

    return CountdownBase.extend({
        "sig/stop" : function(){
            var me = this;
            me.countdownScoreboard && me.countdownScoreboard.stop();
        },
        "render": function(data) {
            var me = this;
            if (!data) {
                return;
            }
            var countdownScoreboard = new CountdownScoreboard();
            me.html(countdownScoreboard.$el);

            var timeIn = data.countdown.timeIn;
            var timeOut = data.countdown.timeOut;

            me.publish("studyplan/evc/cp20/start-status", STATUS_START_IN_COUNTDOWN);

            //detect need to show or not
            me.$element.toggleClass("evc-none", timeIn === 0);

            // Init countdown
            me.countdownScoreboard = countdownScoreboard.init({
                "timeIn": timeIn,
                "timeOut": timeOut
            }).onTimeout(function() {
                me.publish("studyplan/evc/cp20/load");
            }).onEnd(function() {
                me.$element.addClass("evc-none");
                // Publish class started.
                me.publish("studyplan/evc/cp20/start-status", STATUS_START_STARTED);
            });

        },
        "hub:memory/studyplan/evc/cp20/status": function(dataLesson) {
            var me = this;
            if (!dataLesson || !dataLesson.customizedStartTime || !dataLesson.suggestedCancelTime) {
                return;
            }
            // Properties
            me.lesson = dataLesson;
            me.customizedStartTime = dataLesson.customizedStartTime;
            me.suggestedCancelTime = dataLesson.suggestedCancelTime;
            me.timezoneId = dataLesson.timezoneId;
            me.lessonMinutesOfDay = me.customizedStartTime.hour * 60 + me.customizedStartTime.minute;
            me.lessonSecondsOfDay = me.lessonMinutesOfDay * 60;
            // Is Today?
            // All time caculation in PL in seconds
            if (dataLesson.countdown.timeIn > me.lessonSecondsOfDay) {
                me.onemoreDayLesson();
            } else if (dataLesson.countdown.timeIn > HOUR_SECONDES) {
                me.onemoreHourLesson();
            } else {
                me.render(dataLesson);
            }
        },
        "onemoreDayLesson": function() {
            var me = this;
            // Render in full-date view
            me.renderDate(me.customizedStartTime, true);
        },
        "onemoreHourLesson": function(seconds) {
            var me = this;
            seconds = seconds || me.lesson.countdown.timeIn - HOUR_SECONDES;

            // Reset timein & render as "Countdown-Scoreboard"...
            window.setTimeout(function() {
                me.render($.extend(true, me.lesson, {
                    countdown: {
                        timeIn: HOUR_SECONDES
                    }
                }));
            }, seconds * 1000);

            // Render as "Today xxx"
            me.renderDate(me.customizedStartTime);
        }
    });
});

define('school-ui-studyplan/widget/gl-pl/grouplesson/service',["troopjs-core/component/gadget",
    "jquery",
    "when",
    "moment",
    "school-ui-studyplan/module"
], function(Gadget, $, when, Moment, module) {
    'use strict';

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
	}, module.config() || {});

    // TODO: Cache Server
    var TOPIC_PIC_PATH = MODULE_CONFIG.cacheServer + "/_imgs/evc/gl/topic/100x100/"

    return Gadget.extend(function(unitId) {
        var me = this;
        me.unitId = unitId;
    }, {
        "get": function() {
            var me = this;
            var deferred = when.defer();
            // Get lesson data by eTroop
            me.publish("query", ["glclass!" + me.unitId]).spread(function(data) {
                if (!data) {
                    deferred.reject();
                }
                var topic = data.topic;
                var countDown = data.countDown;
                var room = data.room;

                // Generate a new object to resolve
                var lesson = {};
                // Read & find GL lesson
                lesson.lessonInfo = {
                    "topic": topic.topicBlurb,
                    "description": topic.descriptionBlurb,
                    "image": TOPIC_PIC_PATH + topic.topicImageUrl
                };
                lesson.countdown = {
                    "timeIn": countDown.secondsLeftForStart,
                    "timeOut": countDown.secondsLeftForEnter,
                    "startTime": Moment(countDown.classStartTime).valueOf(),
                    "hasClassScheduled": countDown.hasClassScheduled
                };
                // TODO:
                lesson.classroom = {
                    "global": room.global,
                    "local": room.local
                };

				lesson.topicId = data.topic.topicId;

                // Resolve generated lesson
                deferred.resolve(lesson);
            });
            // Return a promise
            return deferred.promise;
        }
    });
});

define('school-ui-studyplan/widget/gl-pl/countdown/gl',["jquery",
    "when",
    "./main",
    "../grouplesson/service",
    "school-ui-studyplan/widget/gl-pl/countdown-scoreboard/main",
    "template!./index.html"
], function($, when, CountdownBase, LessonService, CountdownScoreboard, template) {
    "use strict";

    var STATUS_START_NOT_YET = "notyet";
    var STATUS_START_IN_COUNTDOWN = "incountdown";
    var STATUS_START_STARTED = "started";

    return CountdownBase.extend(function($element, name, unitId) {
        var me = this;
        me.unitId = unitId;
        me.creditDeferred = when.defer();
    }, {
        "sig/start": function() {
            var me = this;
            new LessonService(me.unitId).get().then(function(dataLesson) {
                if (!dataLesson) {
                    return;
                }
                me.render(dataLesson);
            });
        },
        "sig/stop" : function(){
            var me = this;
            me.countdownScoreboard && me.countdownScoreboard.stop();
        },
        "render": function(data) {
            var me = this;
            if (!data) {
                return;
            }
            var countdownScoreboard = new CountdownScoreboard();
            var timeIn = data.countdown.timeIn;
            var timeOut = data.countdown.timeOut;
            var startTime = data.countdown.startTime;

            me.publish("studyplan/evc/gl/start-time", startTime);
            me.publish("studyplan/evc/gl/start-status", STATUS_START_IN_COUNTDOWN);

            // NO: Do not show countdown
            if (data.countdown.hasClassScheduled) {
                //detect need to show or not
                me.$element.toggleClass("evc-none", timeIn === 0);

                me.html(countdownScoreboard.$el);
                me.countdownScoreboard = countdownScoreboard.init({
                    "timeIn": timeIn,
                    "timeOut": timeOut
                }).onTimeout(function() {
                    me.publish("studyplan/evc/gl/load");
                }).onEnd(function() {
                    me.$element.addClass("evc-none");
                    me.publish("studyplan/evc/gl/start-status", STATUS_START_STARTED);
                });

            }

        }
    });
});

define('school-ui-studyplan/widget/gl-pl/countdown/pl',["jquery",
    "./main",
    "school-ui-studyplan/widget/gl-pl/countdown-scoreboard/main"
], function($, CountdownBase, CountdownScoreboard) {
    "use strict";

    var HOUR_SECONDES = 1 * 60 * 60; // 1hr

    var STATUS_START_NOT_YET = "notyet";
    var STATUS_START_IN_COUNTDOWN = "incountdown";
    var STATUS_START_STARTED = "started";

    return CountdownBase.extend({
        "sig/stop" : function(){
            var me = this;
            me.countdownScoreboard && me.countdownScoreboard.stop();
        },
        "render": function(data) {
            var me = this;
            if (!data) {
                return;
            }
            var countdownScoreboard = new CountdownScoreboard();
            me.html(countdownScoreboard.$el);

            var timeIn = data.countdown.timeIn;
            var timeOut = data.countdown.timeOut;

            me.publish("studyplan/evc/pl/start-status", STATUS_START_IN_COUNTDOWN);

            //detect need to show or not
            me.$element.toggleClass("evc-none", timeIn === 0);

            // Init countdown
            me.countdownScoreboard = countdownScoreboard.init({
                "timeIn": timeIn,
                "timeOut": timeOut
            }).onTimeout(function() {
                me.publish("studyplan/evc/pl/load");
            }).onEnd(function() {
                me.$element.addClass("evc-none");
                // Publish class started.
                me.publish("studyplan/evc/pl/start-status", STATUS_START_STARTED);
            });

        },
        "hub:memory/studyplan/evc/pl/status": function(dataLesson) {
            var me = this;
            if (!dataLesson || !dataLesson.customizedStartTime || !dataLesson.suggestedCancelTime) {
                return;
            }
            // Properties
            me.lesson = dataLesson;
            me.customizedStartTime = dataLesson.customizedStartTime;
            me.suggestedCancelTime = dataLesson.suggestedCancelTime;
            me.timezoneId = dataLesson.timezoneId;
            me.lessonMinutesOfDay = me.customizedStartTime.hour * 60 + me.customizedStartTime.minute;
            me.lessonSecondsOfDay = me.lessonMinutesOfDay * 60;
            // Is Today?
            // All time caculation in PL in seconds
            if (dataLesson.countdown.timeIn > me.lessonSecondsOfDay) {
                me.onemoreDayLesson();
            } else if (dataLesson.countdown.timeIn > HOUR_SECONDES) {
                me.onemoreHourLesson();
            } else {
                me.render(dataLesson);
            }
        },
        "onemoreDayLesson": function() {
            var me = this;
            // Render in full-date view
            me.renderDate(me.customizedStartTime, true);
        },
        "onemoreHourLesson": function(seconds) {
            var me = this;
            seconds = seconds || me.lesson.countdown.timeIn - HOUR_SECONDES;

            // Reset timein & render as "Countdown-Scoreboard"...
            window.setTimeout(function() {
                me.render($.extend(true, me.lesson, {
                    countdown: {
                        timeIn: HOUR_SECONDES
                    }
                }));
            }, seconds * 1000);

            // Render as "Today xxx"
            me.renderDate(me.customizedStartTime);
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/credit/index.html',[],function() { return function template(data) { var o = "<p class=\"evc-studyplan-coupon\">\n    <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568613\"></span>&nbsp;<span>" + data.couponLeft + "</span>\n    "; if(data.canBuyMore) { o += "\n        <a class=\"evc-studyplan-coupon-buymore\" href=\"" + data.buyUrl + "\">\n            <span class=\"evc-studyplan-coupon-plus\">+</span>\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"176459\"></span>\n        </a>\n    "; } o += "\n</p>\n<style type=\"text/css\">\n    .evc-studyplan-gap-block .evc-studyplan-coupon{\n        margin: 20px 0 0 0;\n    }\n    .evc-studyplan-gap-block:first-child .evc-studyplan-coupon{\n        margin: 20px 0 20px 0;\n    }\n    .evc-studyplan-coupon{\n        font-weight: bold;\n        margin-bottom: 0;\n        line-height: 24px;\n\t    text-align: left;\n    }\n    a.evc-studyplan-coupon-buymore, /*add \"a\" tag to increase css priority*/\n    a.evc-studyplan-coupon-buymore:hover {\n        text-decoration: none;\n        color: #333;\n        margin-left: 10px;\n    }\n    .evc-studyplan-coupon-plus {\n        width: 18px;\n        height: 18px;\n        line-height: 18px;\n        vertical-align: baseline;\n        text-align: center;\n        color: #fff;\n        font-weight: bold;\n        font-family: arial;\n        font-size: 14px;\n        display: inline-block;\n        background-color: #81ba1a;\n        margin-right: 5px;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/credit/main',["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    "use strict";

    function updateURLSearch(url, key, val) {
        if(!url){
            return;
        }
        var urlNew = "";
        // Get url path with query string
        if (url.indexOf("#") !== -1) {
            url = url.substr(0, url.indexOf("#"));
        }
        // Update query string
        if (url.indexOf("?") !== -1) {
            var str = url.substr(1),
                strs = str.split("&");
            for (var i = 0, l = strs.length; i < l; i++) {
                if (strs[i].split("=")[0] === key) {
                    urlNew = url.replace(strs[i].split("=")[1], val);
                }
            }
            if (!urlNew) {
                urlNew = url + "&" + key + "=" + val;
            }
        }
        if (!urlNew) {
            urlNew = url + "?" + key + "=" + val;
        }
        return urlNew;
    }

    return Widget.extend({
        "render": function onRender(dataCredit) {
            var me = this;
            if (!dataCredit) {
                return;
            }
            // update upsell url with current path
            var currentPath = location.pathname + location.search + location.hash;
            dataCredit.buyUrl = updateURLSearch(dataCredit.buyUrl, "upurl", encodeURIComponent(currentPath));
            me.html(template, dataCredit);
        },
        "generateBuyMoreUrl": function (dataCredit){
            if(!dataCredit.buyUrl){
                return;
            }
            var currentPath = location.pathname + location.search + location.hash;
            var url = updateURLSearch(dataCredit.buyUrl, "upurl", encodeURIComponent(currentPath));
            return url;
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/credit/gl',["jquery",
    "./main",
    "./service"
], function($, CreditBase, Credit) {
    "use strict";

    var STATUS_NO_COUPON_GL = "no_coupon_gl";

    return CreditBase.extend({
        "sig/start": function() {
            var me = this;
            new Credit().get("GL").then(function(dataCredit) {
                var credit = dataCredit.credit;
                if (credit) {
                    if(!credit.isUnlimitedAccess){
                        var hasCredit = credit.couponLeft > 0 ? true : false;
                        var link;
                        if (!hasCredit) {
                            // Show notice to student on the status bar
                            if(credit.canBuyMore && credit.buyUrl){
                                link = me.generateBuyMoreUrl(credit);
                            }
                            me.publish("studyplan/evc/gl/notification", {
                                "statusCode": STATUS_NO_COUPON_GL,
                                "link": link
                            });
                        }
                        me.publish("studyplan/evc/gl/credit", hasCredit);

                        me.render(credit);
                    }
                    else{
                        me.publish("studyplan/evc/gl/credit", true);
                    }
                }
            });

        }
    });
});
define('school-ui-studyplan/widget/gl-pl/credit/pl',["jquery",
    "./main",
    "./service"
], function($, CreditBase, Credit) {
    "use strict";

    var STATUS_NO_COUPON_PL = "no_coupon_pl";

    return CreditBase.extend({
        "sig/start": function() {
            var me = this;

            new Credit().get("PL").then(function(dataCredit) {
                if (!dataCredit) {
                    return;
                }
                var credit = dataCredit.credit;
                var link;
                if(credit.couponLeft <= 0){
                    if(credit.canBuyMore && credit.buyUrl){
                        link = me.generateBuyMoreUrl(credit);
                    }
                    me.publish("studyplan/evc/pl/notification", {
                        "statusCode": STATUS_NO_COUPON_PL,
                        "link": link
                    });
                }
                me.render(credit);
            });
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/credit/sppl20',["jquery",
    "./main",
    "./service"
], function($, CreditBase, Credit) {
    "use strict";

    var STATUS_NO_COUPON_PL = "no_coupon_pl";

    return CreditBase.extend({
        "sig/start": function() {
            var me = this;

            new Credit().get("PL20").then(function(dataCredit) {
                if (!dataCredit) {
                    return;
                }
                var credit = dataCredit.credit;
                var link;
                if(credit.couponLeft <= 0){
                    if(credit.canBuyMore && credit.buyUrl){
                        link = me.generateBuyMoreUrl(credit);
                    }
                    me.publish("studyplan/evc/pl/notification", {
                        "statusCode": STATUS_NO_COUPON_PL,
                        "link": link
                    });
                }
                me.render(credit);
            });
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/dropout-cp20/index.html',[],function() { return function template(data) { var o = "";
	var bookUrl = data.bookUrl;
o += "\n<div class=\"evc-studyplan-btn-book\">\n\t<h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639519\" data-text-en=\"You missed your private lesson\"></h2>\n\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639583\" data-text-en=\"Either you didn't show up or you canceled your Private Class too late.\"></p>\n\t<div class=\"evc-studyplan-btn-warp\">\n\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639513\" data-text-en=\"Unfortunately, you cannot book a private lesson again. If you believe this was a mistake, please get in touch with us.\"></p>\n\t\t<button class=\"btn btn-default\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"639514\" data-text-en=\"Continue\"></button>\n\t</div>\n</div>\n<style type=\"text/css\">\n\t.evc-studyplan-activity-container .evc-studyplan-gap-2x {\n\t\tpadding: 0;\n\t\tmargin: 0;\n\t\twidth: 660px;\n\t}\n\t.evc-studyplan-btn-book{\n\t\tpadding: 30px 20px;\n\t\tcolor: #555555;\n\t\tbackground-color: #f0f0f0;\n\t}\n\t.evc-studyplan-btn-book h2 {\n\t\tmargin-bottom: 10px;\n\t}\n\t.evc-studyplan-btn-book .btn{\n\t\tdisplay: inline-block;\n\t\tmargin: 10px 8px;\n\t}\n\t.evc-studyplan-btn-book p {\n\t\tfont-size: 1.3em;\n\t}\n\t.evc-studyplan-btn-warp {\n\t\tmargin-top: 20px;\n\t}\n\tp.text-muted {\n\t\tmargin-top: 8px;\n\t}\n\t.text-muted a {\n\t\tcolor: #999;\n\t\ttext-decoration: underline;\n\t}\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/dropout-cp20/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"template!./index.html"
], function($, Widget, template) {
	"use strict";

	var PL_BOOK_URL = "/school/evc/pl/unitaligned";
	var KEY = "SP";
	return Widget.extend(function($element, widgetName, unitId) {
		var me = this;
		// get parameters
		me.unitId = unitId;
	}, {
		"sig/start": function() {
			var me = this;

			if (!me.unitId) {
				return;
			}

			var tempData = {};
			tempData.bookUrl = PL_BOOK_URL +
				"/" + me.unitId +
				"?source=" + encodeURIComponent(location.href) +
				"&key=" + KEY +
				"#booking";

			me.html(template, tempData);
		},
		"dom:.btn-default/click": function skipCp(){
			var me = this;
			me.publish("studyplan/sequence/navigate/goal");
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/enter-class/enter-class.html',[],function() { return function template(data) { var o = "";
  var data = data || {};
o += "\n<div class=\"evc-studyplan-enter\">\n\t<button class=\"btn btn-primary countdown-scoreboard-enter\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"78907\">Enter class</button>\n</div>\n";if (data.hasRecord) { o += "\n<label class=\"evc-studyplan-record " +(data.recordDisabled ? 'evc-studyplan-record-disabled' : '')+ "\">\n\t<input type=\"checkbox\" class=\"evc-studyplan-record-check\" " +(data.recordChecked ? 'checked="checked"' : '')+ " " +(data.recordDisabled ? 'disabled="disabled"' : '')+ "/>\n\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"708472\" data-text-en=\"Send me class video\"></span>\n\t<span class=\"glyphicon glyphicon-exclamation-sign\" data-toggle=\"popover\" data-trigger=\"hover\" data-placement=\"bottom\" data-content=\"" +data.recordHint+ "\"></span>\n</label>\n"; } o += "\n<style>\n\t.evc-studyplan-enter{\n\t\tmargin:20px 0;\n\t}\n\t.evc-studyplan-enter .btn {\n\t\tfont-family: \"roboto_condensedbold\", \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n\t\ttext-transform: uppercase;\n\t\tpadding:10px 30px;\n\t}\n\tlabel.evc-studyplan-record {\n\t\tfont-weight: normal;\n\t}\n\tlabel.evc-studyplan-record-disabled {\n\t\tcolor: #ccc;\n\t}\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/enter-class/cp20',[
	"troopjs-ef/component/widget",
	"template!./enter-class.html"
], function(Widget, tEnterClass){

	var UNIT_ID = "_unitId",
		CLASS_ID = "_classId",
		MODE = "_mode";

	var CP20_ENTER_URL = "_cp20_enter_url";

	var STATUS_START_STARTED = "started";

	function getCP20Action(unitId, classId) {
		var me = this;
		return me[CP20_ENTER_URL]
			.replace('?', '?showcontentonly=y&') // add search key 'showcontentonly' to skip new PL booking page redirect logic
			.replace("{unitId}", unitId)
			.replace("{source}", window.encodeURIComponent(window.location.href))
			.replace("{classId}", classId);
	}

	return Widget.extend(function(element, path, unitId, classId){
		var me = this;
		me[UNIT_ID] = unitId;
		me[CLASS_ID] = classId;
	}, {
		"sig/start": function(){
			var me = this;
			return me.query("evc_url_resource!current").spread(function(data){
				me[CP20_ENTER_URL] = data.studyPlanUrls.CP20Entering;
			});
		},
		"hub:memory/studyplan/evc/cp20/start-status": function(status){
			var me = this;
			if(status === STATUS_START_STARTED){
				me.html(tEnterClass);
			}
		},

		"dom:.countdown-scoreboard-enter/click": function enterClass() {
			var me = this;
			window.open(getCP20Action.call(me, me[UNIT_ID], me[CLASS_ID]), '_self');
		}
	});
});

define('school-ui-studyplan/widget/gl-pl/enter-class/gl',[
	"jquery.gudstrap",
	"troopjs-ef/component/widget",
	"client-tracking",
	"template!./enter-class.html"
], function($GUD, Widget, ct, tEnterClass){

	var UNIT_ID = "_unitId",
		MODE = "_mode",
		GL_CREDIT = "_gl_credit";

	var STARTED = "_started";
	var TOPICID = "_topicID";
	var START_TIME = "_class_start_time";
	var MEMBER_ID = "_member_id";
	var GL_HAS_RECORD = "_has_gl_record";
	var GL_RECORD_CHECKED = "_user_gl_record";
	var GL_ENTER_URL = "_gl_enter_url";
	var RECORD_HINT = "_record_hint";

	var STATUS_START_STARTED = "started";

	function getGLAction(unitId) {
		var me = this;

		var enterUrl = me[GL_ENTER_URL]
			.replace("{unitId}", unitId)
			.replace("{source}", window.encodeURIComponent(window.location.href));

		if (me[GL_HAS_RECORD]) {
			enterUrl += ';glRecordChecked=' + me[GL_RECORD_CHECKED];
		}

		return enterUrl;
	}

	function getRecordFlagKey() {
		return 'gl_record_checked_' + this[MEMBER_ID];
	}

	function getRecordFlag() {
		var flag;
		try {
			flag = localStorage.getItem(getRecordFlagKey.call(this));
		}
		catch (ex) {
			flag = null;
		}

		return flag;
	}

	function setRecordFlag(flag) {
		try {
			localStorage.setItem(getRecordFlagKey.call(this), flag);
		}
		catch (ex) {
			//noop
		}
	}

	return Widget.extend(function(element, path, unitId){
		var me = this;
		me[UNIT_ID] = unitId;
	}, {
		"sig/start": function () {
			var me = this;
			return me.query([
				"user!current",
				"evc_url_resource!current",
				"evcmember!current",
				"blurb!708473"
			]).spread(function (user, evcUrlResource, evcMember, blurbRecordHint) {
				me[MEMBER_ID] = user.member_id;
				me[GL_ENTER_URL] = evcUrlResource.studyPlanUrls.SPGL;
				me[GL_HAS_RECORD] = evcMember.enableGLRecord;   //feature
				me[GL_RECORD_CHECKED] = evcMember.defaultGLRecordOption; //user checked
				me[RECORD_HINT] = blurbRecordHint && blurbRecordHint.translation || '';

				me.render();
			});
		},
		"render" : function(type){
			var me = this;
			if (!me[STARTED] || !me[GL_CREDIT] || !me[START_TIME] || !me[MEMBER_ID]) {
				return;
			}

			var recordFlag = getRecordFlag.call(me);
			var recordFlagPrefix = me[START_TIME] + '_';

			var recordDisabled = (recordFlag !== null && recordFlag.substr(0, recordFlagPrefix.length) === recordFlagPrefix);

			return me.html(tEnterClass, {
				hasRecord: me[GL_HAS_RECORD],
				recordChecked: me[GL_RECORD_CHECKED],
				recordDisabled: recordDisabled,
				recordHint: me[RECORD_HINT]
			}).then(function () {
				var $iconHint = me.$element.find('.glyphicon-exclamation-sign');
				$iconHint.popover();
			});
		},
		"hub:memory/studyplan/evc/gl/credit" : function(credit){
			var me = this;
			me[GL_CREDIT] = credit;
			me.render();
		},
		"hub:memory/studyplan/evc/gl/start-time": function (startTime) {
			var me = this;
			me[START_TIME] = startTime;
			me.render();
		},
		"hub:memory/studyplan/evc/gl/start-status": function(status){
			var me = this;
			me[STARTED] = (status === STATUS_START_STARTED);
			me.render();
		},

		"hub:memory/studyplan/evc/gl/topicId": function(topicId){
			var me = this;
			me[TOPICID] = topicId;
		},

		"dom:.countdown-scoreboard-enter/click": function enterClass() {
			var me = this;
			ct.useraction({
				"action.joinGL": me[TOPICID]
			});

			setRecordFlag.call(me, me[START_TIME] + '_' + me[GL_RECORD_CHECKED]);

			window.open(getGLAction.call(me, me[UNIT_ID]), '_self');
		},

		"dom:.evc-studyplan-record-check/change":function(evt){
			this[GL_RECORD_CHECKED] = evt.currentTarget.checked;
		}
	});
});

define('school-ui-studyplan/widget/gl-pl/enter-class/pl',[
	"troopjs-ef/component/widget",
	"client-tracking",
	"school-ui-studyplan/enum/studyplan-item-typecode",
	"template!./enter-class.html"
], function (Widget, ct, spItemTypeCode, tEnterClass) {

	var UNIT_ID = "_unitId",
		CLASS_ID = "_classId",
		SP_TYPECODE = "_spTypeCode";

	var PL_ENTER_URL = "_pl_enter_url";
	var KEY = "SP";
	var TOPICID = "_topicId";

	var STATUS_START_STARTED = "started";

	function getPLAction(classId) {
		var me = this;
		return me[PL_ENTER_URL]
			.replace('?', '?showcontentonly=y&') // add search key 'showcontentonly' to skip new PL booking page redirect logic
			.replace("{source}", window.encodeURIComponent(window.location.href))
			.replace("{classId}", classId);
	}

	return Widget.extend(function(element, path, unitId, classId, spTypeCode){
		var me = this;
		me[UNIT_ID] = unitId;
		me[CLASS_ID] = classId;
		me[SP_TYPECODE] = spTypeCode;
	}, {
		"sig/start": function(){
			var me = this;
			return me.query("evc_url_resource!current").spread(function(data){
				me[PL_ENTER_URL] = me[SP_TYPECODE] === spItemTypeCode.pl20 ?
					data.studyPlanUrls.SPPL20Entering :
					data.studyPlanUrls.SPPL40Entering;
			});
		},
		"hub:memory/studyplan/evc/pl/start-status": function(status){
			var me = this;
			if(status === STATUS_START_STARTED){
				me.html(tEnterClass);
			}
		},

		"hub:memory/studyplan/evc/pl/status": function(data){
			var me = this;
			me[TOPICID] = data.topicId;
		},

		"dom:.countdown-scoreboard-enter/click": function enterClass() {
			var me = this;
			ct.useraction({
				"action.joinPL": me[TOPICID]
			});
			window.open(getPLAction.call(me, me[CLASS_ID]), '_self');
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/feedback-pending/index.html',[],function() { return function template(data) { var o = "";
    var topic = data;
o += "\n<div class=\"text-center\">\n    <p class=\"evc-studyplan-pedding-status\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568580\"></p>\n    <p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568582\"></p>\n    <p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568606\"></p>\n</div>\n<style type=\"text/css\">\n    .evc-studyplan-pedding-status{\n        font-size: 1.3em;\n        font-weight: bold;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/feedback-pending/main',["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    "use strict";

    return Widget.extend({
        "sig/start": function() {
            var me = this;

            me.html(template);
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/feedback/index.html',[],function() { return function template(data) { var o = "";
    var feedbackUrl = data.url;
    var date = data.date;
o += "\n<div class=\"evc-studyplan-btn-feedback text-center\">\n    <p class=\"evc-studyplan-feedback-status\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568590\"></p>\n    <p>\n        <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568591\"></span>\n        <span>" + date+ "</span>\n    </p>\n    <a href=\"" + feedbackUrl + "\" class=\"btn btn-primary\" role=\"button\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568592\"></a>\n</div>\n<style type=\"text/css\">\n    .evc-studyplan-btn-feedback{\n        margin-top: 20px;\n    }\n    .evc-studyplan-btn-feedback > a{\n        display: inline-block;\n    }\n    .evc-studyplan-feedback-status{\n        font-size: 1.3em;\n        font-weight: bold;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/feedback/main',[
    "when",
    "jquery",
    "moment",
    "school-ui-shared/enum/moment-language",
    "troopjs-ef/component/widget",
    "template!./index.html"
], function (when, $, Moment, momentLang, Widget, template) {
    "use strict";

    var CONTEXT_DEFER = "_context_promise";

    return Widget.extend({
        "sig/start": function () {
            this[CONTEXT_DEFER] = when.defer();
        },
        "hub:memory/context": function (context) {
            context && this[CONTEXT_DEFER].resolve([context]);
        },
        "render": function onRender(data) {
            var me = this;
            if (!data) {
                return;
            }

            me[CONTEXT_DEFER].promise.spread(function (context) {
                var moment = Moment(new Date(data.year, data.month - 1, data.day));
                moment.lang(momentLang[context.cultureCode.toLowerCase()]);
                me.html(template, {
                    url: data.url,
                    date: moment.format("LL")
                });
            });
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/feedback/cp20',["jquery",
    "./main",
    "school-ui-studyplan/module"
], function($, FeedbackBase, module) {
    "use strict";

    // Use () because it doesn't need URI encoding
    var FEEDBACK_ID_PLACEHOLDER = '(FEEDBACK_ID)';

    var CP20 = 'detail/cp20';

	var MODULE_CONFIG = $.extend(true, {
		progressReportUrl: "/school/progressreport",
		teacherFeedbackHash: "#teacher-feedback?fb_id=EVC_" + FEEDBACK_ID_PLACEHOLDER,
	}, module.config() || {});

    return FeedbackBase.extend({
        "hub:memory/studyplan/evc/cp20/status": function(lesson) {
            var me = this;

            if (!lesson || !lesson.feedback || !lesson.customizedStartTime) {
                return;
            }

            var feedback = lesson.feedback;
            var customizedStartTime = lesson.customizedStartTime;
            var year = customizedStartTime.year;
            var month = customizedStartTime.month;
            var day = customizedStartTime.day;

            var url = MODULE_CONFIG.progressGoals + CP20;
            // Render
            me.render({
                url: url,
                year: year,
                month: month,
                day: day
            });
        }
    });
});

define('school-ui-studyplan/widget/gl-pl/feedback/gl',["jquery",
    "./main",
    "school-ui-studyplan/module"
], function($, FeedbackBase, module) {
    "use strict";

	// Use () because it doesn't need URI encoding
	var FEEDBACK_ID_PLACEHOLDER = '(FEEDBACK_ID)';
    var GL = 'detail/gl';

	var MODULE_CONFIG = $.extend(true, {
		progressReportUrl: "/school/progressreport",
		teacherFeedbackHash: "#teacher-feedback?fb_id=EVC_" + FEEDBACK_ID_PLACEHOLDER,
	}, module.config() || {});

	return FeedbackBase.extend({
        "hub:memory/studyplan/evc/gl/status": function(status) {
            var me = this;

            if(!status || !status.feedback){
                return;
            }
            var feedback = status.feedback;
            var customizedEntryDate = feedback.customizedEntryDate;

	        var url = MODULE_CONFIG.progressGoals + GL;
            var year = customizedEntryDate.year;
            var month = customizedEntryDate.month;
            var day = customizedEntryDate.day;

            // Render
            me.render({
                url: url,
                year: year,
                month: month,
                day: day
            });
        }
    });
});

define('school-ui-studyplan/widget/gl-pl/feedback/pl',["jquery",
    "./main",
    "school-ui-studyplan/module"
], function($, FeedbackBase, module) {
    "use strict";

	// Use () because it doesn't need URI encoding
	var FEEDBACK_ID_PLACEHOLDER = '(FEEDBACK_ID)';

	var MODULE_CONFIG = $.extend(true, {
		progressReportUrl: "/school/progressreport",
		teacherFeedbackHash: "#teacher-feedback?fb_id=EVC_" + FEEDBACK_ID_PLACEHOLDER,
	}, module.config() || {});

	return FeedbackBase.extend({
        "hub:memory/studyplan/evc/pl/status": function(lesson) {
            var me = this;

            if (!lesson || !lesson.feedback || !lesson.customizedStartTime) {
                return;
            }

            var feedback = lesson.feedback;
            var customizedStartTime = lesson.customizedStartTime;
            var year = customizedStartTime.year;
            var month = customizedStartTime.month;
            var day = customizedStartTime.day;

	        var url = MODULE_CONFIG.progressReportUrl +
		        MODULE_CONFIG.teacherFeedbackHash.replace(FEEDBACK_ID_PLACEHOLDER, feedback.feedbackId);
            // Render
            me.render({
                url: url,
                year: year,
                month: month,
                day: day
            });
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/grouplesson/index.html',[],function() { return function template(data) { var o = "<div class=\"st-evc-status\" data-weave=\"school-ui-studyplan/widget/gl-pl/announcement/gl\"></div>\n<div class=\"st-evc-status\" data-weave=\"school-ui-studyplan/widget/gl-pl/statusbar/gl\"></div>\n<div class=\"evc-studyplan-wrapper\">\n    "; if( data.statusCode === "welcome"){ o += "\n        <div class=\"evc-studyplan-column-single evc-studyplan-welcome\" data-weave=\"school-ui-studyplan/widget/gl-pl/welcome-gl/main\"></div>\n    "; }else{ o += "\n        <div class=\"evc-studyplan-column-single\">\n            <div class=\"evc-studyplan-gap-2x\" data-weave=\"school-ui-studyplan/widget/gl-pl/lesson/gl\"></div>\n            <div class=\"evc-studyplan-gap-1x evc-studyplan-class-info\">\n            </div>\n        </div>\n        <div class=\"evc-studyplan-activity-container\">\n        </div>\n    "; } o += "\n</div>\n<style type=\"text/css\">\n    .evc-studyplan-wrapper{\n        text-align: center;\n        padding: 30px 0 50px;\n        color: #4a4a4a;\n    }\n    .evc-studyplan-column-full{\n        display: inline-block;\n    }\n    .evc-studyplan-column-single{\n        display: inline-block;\n        width: 980px;\n    }\n    .evc-studyplan-column-single hr{\n        margin-bottom: 0;\n    }\n    .evc-studyplan-welcome{\n        width: 900px;\n        padding-top: 50px;\n    }\n    .evc-studyplan-gap-2x{\n        text-align: left;\n        width: 620px;\n        padding-left: 35px;\n        padding-right: 35px;\n        vertical-align: top;\n        display: inline-block;\n        margin: 20px auto;\n    }\n    .evc-studyplan-gap-1x{\n        text-align: left;\n        width: 330px;\n        vertical-align: top;\n        margin: auto;\n        padding-left: 30px;\n        display: inline-block;\n        border-left:1px #eee solid;\n    }\n    .evc-studyplan-gap-1x .evc-studyplan-gap-block{\n        margin-bottom: 15px;\n    }\n    .st-evc-status{\n        color: #4a4a4a;\n        background-color: #e6e6e6;\n    }\n    .evc-studyplan-gray{\n        color:#999999;\n    }\n    .evc-studyplan-green{\n        color:#87c600;\n    }\n    .evc-studyplan-blue{\n        color: #00bee3;\n    }\n    .evc-none{\n        display: none;\n    }\n    .evc-studyplan-activity-container {\n        width:880px;\n        margin:0 auto;\n    }\n    .evc-studyplan-activity-tc {\n        text-align: left;\n        padding-right: 330px;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/grouplesson/main',[
	"when",
	"jquery",
	"moment",
	"troopjs-ef/component/widget",
	"school-ui-shared/enum/moment-language",
	"school-ui-studyplan/module",
	"school-ui-studyplan/utils/client-storage",
	"template!./index.html"
], function (when, $, Moment, Widget, momentLang, module, clientStorage, template) {
	"use strict";

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
		useLegacyUnitId: true
	}, module.config() || {});

	var $ELEMENT = "$element";

	var STATUS_DROPOUT = "dropout";
	var STATUS_NEVERTAKE = "nevertake";
	var STATUS_PENDING = "pending";
	var STATUS_ATTENDED = "attended";

	var STATUS_WELCOME = "welcome";
	var STATUS_OPTIONAL_MSG_GL = "optional_msg_gl";

	var STATUS_LEFT_EARLY = "leftearly";

	var STATUS_START_NOT_YET = "notyet";
	var STATUS_START_IN_COUNTDOWN = "incountdown";
	var STATUS_START_STARTED = "started";

	var TOPIC_PIC_PATH = MODULE_CONFIG.cacheServer + "/_imgs/evc/gl/topic/100x100/";
	var GL_DEFAULT_PIC = MODULE_CONFIG.cacheServer + "/_imgs/evc/gl/gl_default_100x100.jpg";

	var CONTEXT_DEFER = "_context_promise";

	var WIDGET_COUNTDOWN = "school-ui-studyplan/widget/gl-pl/countdown/gl",
		WIDGET_CLASS_STATUS = "school-ui-studyplan/widget/gl-pl/class-status/gl",
		WIDGET_CREDIT = "school-ui-studyplan/widget/gl-pl/credit/gl",
		WIDGET_FEEDBACK_GL = "school-ui-studyplan/widget/gl-pl/feedback/gl",
		WIDGET_FEEDBACK_PENDING = "school-ui-studyplan/widget/gl-pl/feedback-pending/main",
		WIDGET_ENTER_CLASS = "school-ui-studyplan/widget/gl-pl/enter-class/gl",
		WIDGET_TERMS_CONDITIONS = "school-ui-studyplan/widget/gl-pl/terms-and-conditions/main";

	var SEL_ACTIVITY_CONTAINER = ".evc-studyplan-activity-container",
		SEL_INFO_CONTAINER = ".evc-studyplan-class-info",
		SEL_ENTER_CLASS = ".ets-sp-glpl-enter-class";

	var CLS_GAP_2X = "evc-studyplan-gap-2x text-center",
		CLS_GAP = "evc-studyplan-gap-block",
		CLS_ENTER_CLASS = "ets-sp-glpl-enter-class",
		CLS_NONE = "ets-none",
		CLS_TC = "evc-studyplan-activity-tc";

	var UNIT_ID = "_unit_id";

	var UNIT_ID_KEY = MODULE_CONFIG.useLegacyUnitId ? "legacyUnitId" : "templateUnitId"

	function createWidget(widgetName, appendToContainer, classNames) {
		var me = this;
		return $("<div>").attr("data-weave", widgetName + "(unitId)")
			.addClass(classNames || "")
			.data("unitId", me[UNIT_ID])
			.appendTo(me[$ELEMENT].find(appendToContainer))
			.weave();
	}

	return Widget.extend(function ($element, name, item) {
		if (!item && !item.properties) {
			return;
		}
		var me = this;
		me.closeOptionalTips = clientStorage.getLocalStorage("gl_tips") === "closed";
		me[CONTEXT_DEFER] = when.defer();
	}, {
		"hub:memory/load/unit": function (unit) {
			var me = this;
			if (!unit || !unit[UNIT_ID_KEY]) {
				return;
			}
			me.unitId = unit[UNIT_ID_KEY];

			// Check the student whether is first come or not
			me.publish("query", ["member_site_setting!evc;FirstTimeStudyPlanGL"]).spread(function (data) {
				if (!data) {
					return;
				}
				if (data.value.toString() === "true") {
					me.publish("studyplan/evc/gl/load");
				} else {
					me.html(template, { statusCode: STATUS_WELCOME });
				}
			});

		},
		"hub:memory/studyplan/evc/gl/start-status": function (status) {
			var me = this;
			switch (status) {
				case STATUS_START_NOT_YET:
					me.$element.find(SEL_ENTER_CLASS).addClass(CLS_NONE);
					break;
				case STATUS_START_IN_COUNTDOWN:
					me.$element.find(SEL_ENTER_CLASS).addClass(CLS_NONE);
					break;
				case STATUS_START_STARTED:
					me.$element.find(SEL_ENTER_CLASS).removeClass(CLS_NONE);
					break;
			}
		},
		"hub/studyplan/evc/gl/load": function () {
			var me = this;
			me[UNIT_ID] = me.unitId;
			me.publish("query", ["glstatus!" + me.unitId, "glclass!" + me.unitId]).spread(function success(statusData, glClass) {
				if (!statusData) {
					return;
				}

				var statusCode = statusData.statusCode.toLowerCase();
				var feedback = statusData.feedback;
				// nevertake
				// dropout
				// pending
				// attended
				var status = {
					"unitId": me.unitId,
					"statusCode": statusCode,
					"teacherId": feedback.teacherId || "",
					"feedbackId": feedback.feedbackId || "",
					"topic": {},
					"feedback": feedback || {}
				};

				if (statusCode === STATUS_PENDING || statusCode === STATUS_ATTENDED) {
					var topic = feedback.topic;
					if (topic) {
						status.topic = {
							"topic": topic.topicBlurb,
							"description": topic.descriptionBlurb,
							"image": (TOPIC_PIC_PATH + topic.topicImageUrl) || GL_DEFAULT_PIC
						};
					}
				}

				var evcServerCode = glClass && glClass.evcServerCode || '';
				// Adobe classroom: "cn1" or "us1", otherwise "EvcCN1" or "EvcUS1"
				var isAdobeClassroom = evcServerCode.toLowerCase().indexOf('evc') < 0;
				if (!isAdobeClassroom) {
					// simulate techcheck passed
					clientStorage.setSessionStorage("techcheck_state", "passed");
				}

				// Render
				var renderData = statusData;
				$.extend(true, renderData, { unitId: me.unitId });
				me.html(template, renderData).then(function () {

					me[$ELEMENT].find(SEL_INFO_CONTAINER).empty();
					me[$ELEMENT].find(SEL_ACTIVITY_CONTAINER).empty();

					//start time
					me.publish("studyplan/evc/gl/start-time", new Date(glClass.countDown.classStartTime || 0).getTime());

					// Publish status
					me.publish("studyplan/evc/gl/status", status);

					//clear the class status as not yet
					me.publish("studyplan/evc/gl/start-status", STATUS_START_NOT_YET);

					// Publish status to show optional msg
					if (!me.closeOptionalTips) {
						me.publish("studyplan/evc/gl/notification", {
							"statusCode": STATUS_OPTIONAL_MSG_GL
						});
					}

					// Publish status to show msg in the status bar
					if (statusCode === STATUS_DROPOUT) {
						if (!feedback.entryDate) {
							return;
						}
						when.all([
							me[CONTEXT_DEFER].promise,
							me.query("blurb!568599")
						]).spread(function (contextResults, queryResults) {
							var context = contextResults[0];
							var moment = Moment(feedback.entryDate);
							moment.lang(momentLang[context.cultureCode.toLowerCase()]);

							var blurbDropout = queryResults[0];
							var msg = blurbDropout.translation;
							msg = msg.replace("%%date%%", moment.format("YYYY-MM-DD")).replace("%%time%%", moment.format("HH:mm"));

							me.publish("studyplan/evc/gl/notification", {
								"statusCode": STATUS_LEFT_EARLY,
								"link": "http://www.ef.com",
								"msg": msg
							});
						});
					}

					switch (statusCode.toLowerCase()) {
						case STATUS_NEVERTAKE:
						case STATUS_DROPOUT:
							createWidget.call(me, WIDGET_COUNTDOWN, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_CLASS_STATUS, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_ENTER_CLASS, SEL_INFO_CONTAINER, CLS_GAP + " " + CLS_ENTER_CLASS + " " + CLS_NONE);
							createWidget.call(me, WIDGET_CREDIT, SEL_ACTIVITY_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_TERMS_CONDITIONS, SEL_ACTIVITY_CONTAINER, CLS_TC);
							break;
						case STATUS_PENDING:
							createWidget.call(me, WIDGET_FEEDBACK_PENDING, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
							createWidget.call(me, WIDGET_CREDIT, SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						case STATUS_ATTENDED:
							createWidget.call(me, WIDGET_FEEDBACK_GL, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
							createWidget.call(me, WIDGET_CREDIT, SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						default:
							break;
					}

				});

			});
		},
		"hub:memory/context": function (context) {
			context && this[CONTEXT_DEFER].resolve([context]);
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/lesson/index.html',[],function() { return function template(data) { var o = "";
    var lessonInfo = data.lessonInfo;
    var profile = data.profile;
o += "\n<div class=\"clearfix "; if(profile) { o += "evc-studyplan-withteacher"; } o += "\" >\n    <div class=\"pull-left evc-studyplan-topic-pic\">\n        <img src=\"" + lessonInfo.image + "\" width=\"100\" height=\"100\" alt=\"\" />\n        "; if(profile) { o += "\n            <div class=\"evc-studyplan-teacher\">\n                "; if (profile.link) {o += "\n                    <a href=\"" + profile.link + "\" target=\"_blank\">\n                        <img class=\"img-circle\" src=\"" + profile.imageUrl + "\" width=\"42\" height=\"42\" alt=\"" + profile.nickname + "\">\n                    </a>\n                "; } else { o += "\n                    <img class=\"img-circle\" src=\"" + profile.imageUrl + "\" width=\"42\" height=\"42\" alt=\"" + profile.nickname + "\">\n                "; } o += "\n            </div>\n        "; } o += "\n    </div>\n    <div class=\"pull-left evc-studyplan-topic\">\n        "; if(data.changeTopicTitle) { o += "\n            <h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"490207\"></h5>\n        "; }else{ o += "\n            <h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"80310\"></h5>\n        "; } o += "\n        <h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + lessonInfo.topic+ "\"></h2>\n        "; if(profile) { o += "\n            <p><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"78910\"></span>&nbsp;<span>" + profile.nickname + "</span></p>\n        "; } o += "\n    </div>\n</div>\n<div class=\"evc-studyplan-description\">\n    <p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" + lessonInfo.description+ "\"></p>\n</div>\n\n<style type=\"text/css\">\n    .evc-studyplan-withteacher {\n        padding-bottom: 14px;\n    }\n    .evc-studyplan-topic-pic {\n        position: relative;\n        width: 100px;\n        height: 100px;\n        margin-right: 20px;\n    }\n    .evc-studyplan-teacher {\n        position: absolute;\n        left: 72px;\n        top: 72px;\n        white-space: nowrap;\n    }\n    .evc-studyplan-teacher a {\n        display: inline-block;\n        text-decoration: none;\n    }\n    .evc-studyplan-teacher a:hover {\n        text-decoration: none;\n    }\n    .evc-studyplan-topic {\n        width: 420px;\n    }\n    .evc-studyplan-topic h5 {\n        margin-bottom: 5px;\n    }\n    .evc-studyplan-topic h2 {\n        margin-top: 0;\n        line-height: 1em;\n    }\n    .evc-studyplan-topic p {\n        font-size: 112%;\n        font-weight: bold;\n        vertical-align: middle;\n        margin-bottom: 0;\n        margin-top: 6px;\n    }\n    .evc-studyplan-description {\n        margin-top: 10px;\n        clear: both;\n        line-height: 1.55em;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/lesson/main',["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    "use strict";

    var DEFAULT_TEACHER_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NkEzNzkzNzJDRDQ1MTFFNEJCQTBDRTQ3OUEzNjM5OEEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NkEzNzkzNzNDRDQ1MTFFNEJCQTBDRTQ3OUEzNjM5OEEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2QTM3OTM3MENENDUxMUU0QkJBMENFNDc5QTM2Mzk4QSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2QTM3OTM3MUNENDUxMUU0QkJBMENFNDc5QTM2Mzk4QSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjsNI60AAA0mSURBVHja7F13UBXdFT82sDcQRVBQ1LGh2AKxgY4ysYx+xjJGU4wmlomS2AI6g04yo/LpKH5YJrH9gX3sjkOinyYSO9bRUexYsKBYERvqzflddnfe46O899i3u5Qz85sH7+3e3fvbu+eec+6591YQQpCFpAqjHSOY0YYRyAhgeCnwZNRifGJkM14zspS/7zPuMVIZVxhXGTlWqVgFk4muxPgZ4xeMCEY3RjWdyv7AOMs4yvg3I4XxtSwRXYHRm/ErxnCGt0HXzWTsYmxjJDNEaSW6LuOPjEmMIJPf5NuMNYy1ivopFUQ3ZEQz/qDoVysJ9Ps6xmLG05JKdE3GXMafGdXJ2vKekcBYwHhXUoiGDv4NI47hSyVLnjBiGBv11uF6Ex2o6L7+VLLlR8ZExVy0HNG/Zqxi1KbSIW8Zf2JssgrRcCJWKp1daRR0llMVJ8k0ohsx9jJCqXTLGcZ3xbFMikN0a0YSoxmVDUljDGRcN5LoTopb60NlS54p4YKLRhAdrLiw9ahsymslhHDFnUQ3YZxk+FPZlnRGD8YDR0+o6EThDRj/MYrkN2/eUMuWLalnz56Unp5uNaLBwRGFE8cELdoBeDBOCQPlwIEDQvHORN26dcXSpUtFdna2sJicUrgpkkNHW/T3jDAjm8yjR4/kZ0REhPycOXMmBQQE0IwZMyglJYUsMmARpgSkdGnR3zG+Gd1UFi1aJFvzzp07xfPnz8X06dNF/fr1tVbeuHFjMWnSJLFr1y6RmZlpZqv+pnBUKI9FkRzIeGnG3UdFRUlCT5w4oX338eNHsXnzZjF8+HBRp04djfSKFSuKrl27ijlz5oiLFy+acbsvFa5cIhoWyY9G3/GrV6/EvHnzRM2aNUXlypVla85PcnJyxLFjx0RsbKzo1q2bJFslntWNOHv2rNG3fkjhzGmif2f0nUINNGrUSOsAExISHD4XD2TTpk2CrRStlaOFf/361cgqjHOW6NqMJ0bdHciYPXu2JKhKlSoiOjpatmxXZf/+/cLPz0+WN3LkSPHlyxejqvJE4c5hor83shlMmTJFktKsWTNx4cIFfWr85IkICQmR5bLFYmR14hwluiHDMIM1MTFRkhEcHCwyMjJ0LfvZs2eiefPmokKFCuL48eNGVSlb4bBIouONuqP379+LBg0aiGrVqolr16655RrJycnyQfbu3dvIVh1fFNF1GVlG3c3atWslCbCRC5Lbt2+L1atXS7vaVV3br18/eZ3Lly8bVbUshcsCiZ5l5GMfNWqUJCA/vXz9+nUxePBg+drjGHzevHnTpevgQaGMuLg4I6s3uyCiYQPeMvJOOnXqJCpVqmRngn369EkSAnWi2sXFJQktGWWMGTPGyOrdsrWrbYmOMNpuhpUBx0Q18eBut23bVpICzy8+Pl46LejQimMPw0VHmVAhBkuEym9lm7DHaKMjMuyUUFpaGm3ZsoXmz59PrI/l98OGDaMVK1bQu3fviPU3denSRX5/6NAh4odB7PUROyjk4eFBDRs2pBYtWlC7du2oTZs2xA4PsS0uy2LPUZYRGpo7pMlvj9FVBKdHbYNKleBcGf248Srbxiugs8+dO6f9/vjxY/kbEyg6duyoHYtW7uPjYxfvcARjx441uorPFW61Fo1wn7fRj3vAgAGyNUOOHj1KvXr1svvd19eXWrVqRampqcSdIQ0dOpTYuZHHVa+em2XGOp3YNJTHcAcqW3pOTg75+/tT9+7diVUTDRkyhF68eEHcJxhdRXD6c8ZxtUX/zZT44rdvIjIyUra2rVu35nsMPwgRFhYm+EG4dI1t27bJlo835s6dO2ZU8++2nWGyWcHciRMnSqLx6Q6Bo4Lyw8PDzapisko0hmLem3EHCHOCBFYP4unTp265BjxOLy8v4enpKdLT082oJrj1gI5uS/pNZ3Au/efMGfkZExMjrQdVsrOzadasWVKv2goGaqOiorT/Y2Nj6caNG3bHNG3alBYvXkysKuT/sETGjx9PS5YsoUuXLpGfn5/R1QS3bSsreRqmCDslWodmK/fv36c1a9YQ63C770GUSvTnz58pISGB3r59a3dM1apVae7cuVS/fn3tO7UcmH0mSTAeexuzrt6kSRP5effuXbvv2WmRg7MgFrZycHAwcUdGbPppx+B72OBo0Xhg7PzIYx4+fGhHMgTfQ2DBmCRtoaO3mtVLIGaMGAaGogoSJrLI8CmsCdjc+QlcegzqAgaPttjKVhB9QpgobOvKDtFV860oWbVqlVutGgflBIi+YeYdsFstWzXGCE+fPq1r2bChMTTGzo24deuWmdW8QWa43j8Z+4mLk61u2rRpupbLnqcsd9++fWZXMRNEvzX7LtjKkITAS9Q7OlijRg0zdbM2EEDCIuLv7y9DpkiS0UPYkpEPr0+fPpaoH8y7z1ZIYkOACSHNpKQkXcrbvn27/Bw4cKA18k+hP6zwxGF14HZGjBihS3kYVUcgie1xK1RPqo40K9wJInkBAQGCHZECbWJH5dSpU/Kh9e/f3yqaMROqI8sKbxbizWzrStd62bJlxSorPj5efk6dOtUqiesvTA2R5hWkgaFDRPzY1ZQw2MsYgcHYI94Si8hxtOj7VnnsGENEq8a0CkTvvnz54tT5Hz58kK0Y50VHR8u3xCJyFy16jrCQIH6sjvFBx7586Vh6NuImGInBedDziHFYSOaA6BFWuiM28ewGVIOCgorMm9uxY4fw9vbWzsHfFpPhILq9le7o6tWrkiy4z6wGtBHyyZMnyygd8qBTUlLEvXv3xMmTJ7WhKsQ0FixYoJl1r1+/tlK12ps6lJVfSBOEgjhE3SCYnQWzzzYtIW8aAVSGmlY2Y8YM+d3ChQvlrAALiBzKUid0JiuzQQ0VdF5Hjhyhw4cPE6sHunLlijTvfHx8ZFBfTSlgt5wSExNl8gxGVDp06CAHC5AQg/QDpCGoHR9GZzB8hbIx2oJBhB49elB4eLj0EtVRHQPlf4xwU9INmFiZzIKAj23LROoX0njRajFNwhXBfER11hYGfW3fAFxv9OjRYu/evUbOArBLN+hhxBUPHjwoQkNDtYpj1AMB+d27d0urAYKYdK1ateTvEyZMEGzqOVQ2dDemUaidoZqiy2+ASEpKkioF0Tzbh7p+/XojIns9bYl2a0oYOi5E0dT020GDBsl5Jqwm8j0eU9jat2+vPQx1WlteUvA/dDPmvGDgQE0fS01NLdDNR2I6WjWcGhzfuXNnd06Z01LCbLNJ/+GOK2FeoJojh2lp58+fd+g8hEsxta127dpaK0RLh1WB4S/W01rLV3/D8ZhF4KgHOWTIEM1iWblypTuq/09hRNqumgAOtxqvqSsuMVTHhg0bZFQPrz5IUa2PwMBAObkTZbtqzq1bt07rK5YvX643BX2EEYnomIKGhHK9pzTAqdHbGwXZvr6+ehZrl4huO+keT3WNnnZNZmYmccckTSw9hUnRtTwsV1GvXj3it0LPYteSzdp5lfP5cR7lrsJYbIHdumfPHurbty9xZygTYUJCQmSyi5qyZYbAVr958yaxF0rcEUpbHmuCjBkzRq9LvMvbaPNbgQbB3L/ocbWMjAxik0tm3udNBUMrCgoKkktDsK6VTgrAdrR8CwBkIzkryNtDjjSujTcKAIlwgODk4BPZTGyx2MXCIyMjaePGjfL6OsgPeTnMj2gssYYcKt3WE1XTuZDihVaEhHE2+WTCeGHClgR5enoSWx7yf7zetoKcPbYyZG4dQqvwBuFFFiZsARHb0NS6dWvq2LGj9DLxliHpXSfBOqdYTfhpUUSrC6H81Z2vL0h+8OCBhrytEEA2KcjMysrSyMw7KoMYtvqJNwV5d3gbbN8OkAh1BYK9vLzcrZmwUEr0T0aQCiAaTeiG0rrLxQltiVxKyl1u004K6pFw4Jxy3pyWmPxILqxFy98Yhxj9yvlzSA4zIqmA5ZCLWvcukHJXLaxbzmOh8orRmQpZBrkoYxYn/p4M3nighAm4GU9FrDXtiNeA1XRXlPNZoKxQOCpUHF0y00MZhQkr59VOTsvREwfyF51ZmxQuU4qit8sld13Sroznjhzs7CKwiA4dJWfW5CydAnIjGNccPcGVZY1DGP8tw5YIQnx9yck1pIuzUPfBMtiyMxVb2ZCFulXB/ESsit60DOlkrIae6srJxd1MoTFjD+Xu4FaaBbvIYTOFx64WUNzo+2PFvFlfikneQLnJRY+LU4ieG978VjHeS9OGN9MYiXoUpvcWTtgqZJ3SK5dkwRL72MAnTa8C9R64w40h2jeOcrfSKIn28TilDml6FuzObfZgZ2ObPUwkqWZxgrFtKrahWkhu2kjSiI0jMUoTo7yKNSxGcLai6rAlYIndODKvYGQVW6Fi+zqzt0LF4LO6FeorIy5o1ua+iBNgc99fUu421EYI1g3azdhKufGaUru5b36iblc9QCG/K+m7XfU5hdR/URncrrowKWgDdm+l5eMhqPkm7xUyXygxCEtvwP5/AQYA45MVlK+fMKMAAAAASUVORK5CYII=";

    return Widget.extend({
        "render": function onRender(data) {
            var me = this;
            if(!data){
                return;
            }
            // teacherProfile imageUrl cannot yet be migrated to HTTPS, use fake image instead. (from Progress Report)
            if (window.location.protocol === 'https:') {
                if (data.profile && data.profile.imageUrl
                    && data.profile.imageUrl.indexOf('http://') === 0) {
                    data.profile.imageUrl = DEFAULT_TEACHER_IMAGE;
                }
            }
            me.html(template, data);
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/lesson/cp20',["jquery",
    "./main",
    "template!./index.html"
], function($, LessonBase, template) {
    "use strict";

    var STATUS_NEVERTAKE = "nevertake";
    var STATUS_BOOKED = "booked";
    var STATUS_DROPOUT = "dropout";
    var STATUS_PENDING = "pending";
    var STATUS_ATTENDED = "attended";

    return LessonBase.extend({
        "hub/studyplan/evc/cp20/status": function(lesson) {
            var me = this;

            if (!lesson) {
                return;
            }

            var status = lesson.status;
            var statusCode = status.statusCode;
            var teacherId = "";
            var renderData = {};

            renderData.lessonInfo = lesson.lessonInfo;
            renderData.changeTopicTitle = false;

            if (statusCode === STATUS_ATTENDED || statusCode === STATUS_PENDING) {
                if (!lesson.feedback) {
                    return;
                }
                teacherId = lesson.feedback.teacherId;
                renderData.changeTopicTitle = true;

            } else if (statusCode === STATUS_BOOKED) {
                if (!lesson.bookedClass) {
                    return;
                }
                teacherId = lesson.bookedClass.teacherId;
            }

            // Show the teacher profile when student booked the class
            if (teacherId && teacherId > 0) {
                // Load teacher profile
                me.publish("query", ["teacherprofile!" + teacherId]).spread(function(dataProfile) {
                    if (!dataProfile) {
                        return;
                    }
                    // Append to template data
                    renderData.profile = {
                        "imageUrl": dataProfile.imageUrl,
                        "link": "",   //dataProfile.pageUrl not work for some partners, see SPC-5951
                        "nickname": dataProfile.displayName
                    };
                    // Render
                    me.render(renderData);
                });
            } else {
                me.render(renderData);
            }
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/lesson/gl',["jquery",
    "./main",
    "../grouplesson/service"
], function($, LessonBase, LessonService) {
    "use strict";

    var STATUS_NEVERTAKE = "nevertake";
    var STATUS_DROPOUT = "dropout";
    var STATUS_PENDING = "pending";
    var STATUS_ATTENDED = "attended";

    return LessonBase.extend({
        "hub/studyplan/evc/gl/status": function(status) {
            var me = this;
            if (!status || !status.statusCode || !status.unitId) {
                return;
            }
            var statusCode = status.statusCode;
            var unitId = status.unitId;
            var renderData = {};
            var lessonInfo;
            var teacherId;

            // Set Default value
            renderData.changeTopicTitle = false;

            // The student entered into the GL
            if (statusCode === STATUS_PENDING || statusCode === STATUS_ATTENDED) {
                if (!status.topic) {
                    return;
                }

                lessonInfo = status.topic;
                teacherId = status.teacherId;

                renderData.lessonInfo = lessonInfo;

                // Change topic title from "Next Class" to "Class Topic"
                renderData.changeTopicTitle = true;

                if(teacherId){
                    // Load teacher profile
                    me.publish("query", ["teacherprofile!" + teacherId]).spread(function(dataProfile) {
                        if (!dataProfile) {
                            return;
                        }
                        renderData.profile = {
                            "imageUrl": dataProfile.imageUrl,
                            "link": dataProfile.pageUrl,
                            "nickname": dataProfile.displayName
                        };
                        // Render
                        me.render(renderData);
                    });
                }
                else{
                    // Render
                    me.render(renderData);
                }

            } else {
                // Load Current GL
                new LessonService(unitId).get().then(function(dataLesson) {
                    if (!dataLesson || !dataLesson.lessonInfo) {
                        return;
                    }
                    renderData.lessonInfo = dataLesson.lessonInfo;
                    // Render
                    me.render(renderData);

					// Publish topic ID for omniture enter class tracking
					me.publish("studyplan/evc/gl/topicId", dataLesson.topicId);
                });
            }
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/lesson/pl',["jquery",
    "./main",
    "template!./index.html"
], function($, LessonBase, template) {
    "use strict";

    var STATUS_NEVERTAKE = "nevertake";
    var STATUS_BOOKED = "booked";
    var STATUS_DROPOUT = "dropout";
    var STATUS_PENDING = "pending";
    var STATUS_ATTENDED = "attended";

    return LessonBase.extend({
        "hub/studyplan/evc/pl/status": function(lesson) {
            var me = this;

            if (!lesson) {
                return;
            }

            var status = lesson.status;
            var statusCode = status.statusCode;
            var teacherId = "";
            var renderData = {};

            renderData.lessonInfo = lesson.lessonInfo;
            renderData.changeTopicTitle = false;

            if (statusCode === STATUS_ATTENDED || statusCode === STATUS_PENDING) {
                if (!lesson.feedback) {
                    return;
                }
                teacherId = lesson.feedback.teacherId;
                renderData.changeTopicTitle = true;

            } else if (statusCode === STATUS_BOOKED) {
                if (!lesson.bookedClass) {
                    return;
                }
                teacherId = lesson.bookedClass.teacherId;
            }

            // Show the teacher profile when student booked the class
            if (teacherId && teacherId > 0) {
                // Load teacher profile
                me.publish("query", ["teacherprofile!" + teacherId]).spread(function(dataProfile) {
                    if (!dataProfile) {
                        return;
                    }
                    // Append to template data
                    renderData.profile = {
                        "imageUrl": dataProfile.imageUrl,
                        "link": dataProfile.pageUrl,
                        "nickname": dataProfile.displayName
                    };
                    // Render
                    me.render(renderData);
                });
            } else {
                me.render(renderData);
            }
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/mark/booked.html',[],function() { return function template(data) { var o = "<span class=\"badge evc-studyplan-mark evc-studyplan-mark-booked\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Booked\" data-blurb-id=\"78918\"></span>\n<style type=\"text/css\">\n    .evc-studyplan-mark-booked,\n    .gud .evc-studyplan-mark-booked\n    {\n        background-color: #232c33;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/mark/cp20',[
    "troopjs-ef/component/widget",
    "when",
    "jquery",
    "school-ui-studyplan/module",
    "school-ui-shared/utils/console",
    "template!./booked.html"
], function(Widget, when, $, module, Console, template) {

	var MODULE_CONFIG = $.extend(true, {
		useLegacyUnitId: true
	}, module.config() || {});

    var STATUS_BOOKED = "booked";

    var UNIT_ID_KEY = MODULE_CONFIG.useLegacyUnitId ? "legacyUnitId" : "templateUnitId"

    return Widget.extend(function($element, name, item) {
        var me = this;
        me.getUnit = when.defer();

        function unitFn(unit) {
            if (!unit || !unit[UNIT_ID_KEY]) {
                return;
            }
            // Resolve unit
            me.getUnit.resolver.resolve(unit[UNIT_ID_KEY]);
            me.unsubscribe("load/unit", unitFn);
        }
        me.subscribe("load/unit", unitFn);
        me.republish("load/unit", false, unitFn);
    }, {
        "sig/start": function() {
            var me = this;

            return me.getUnit.promise.then(function(unitId) {
                return me.publish("query", ["checkpointstate!cp20;" + unitId]).spread(function success(data) {
                    if (!data || !data.statusCode) {
                        return when.reject("skip CP20 mark, CP20 status query failed.");
                    }
                    var statusCode = data.statusCode.toLowerCase();

                    if (statusCode === STATUS_BOOKED) {
                        me.html(template);
                    } else {
                        return when.reject("skip CP20 mark, CP20 not booked.");
                    }
                });
            });
        }
    });
});

define('school-ui-studyplan/widget/gl-pl/mark/pl',[
    "troopjs-ef/component/widget",
    "when",
    "jquery",
    "school-ui-studyplan/module",
    "school-ui-shared/utils/console",
    "template!./booked.html"
], function(Widget, when, $, module, Console, template) {

    var MODULE_CONFIG = $.extend({
		useLegacyUnitId: true
    }, module.config() || {});

    var STATUS_BOOKED = "booked";

    var UNIT_ID_KEY = MODULE_CONFIG.useLegacyUnitId ? "legacyUnitId" : "templateUnitId"

    return Widget.extend(function($element, name, item) {
        var me = this;
        me.getUnit = when.defer();

        function unitFn(unit) {
            if (!unit || !unit[UNIT_ID_KEY]) {
                return;
            }
            // Resolve unit
            me.getUnit.resolver.resolve(unit[UNIT_ID_KEY]);
            me.unsubscribe("load/unit", unitFn);
        }
        me.subscribe("load/unit", unitFn);
        me.republish("load/unit", false, unitFn);
    }, {
        "sig/start": function() {
            var me = this;

            return me.getUnit.promise.then(function(unitId) {
                return me.publish("query", ["plclass!" + unitId]).spread(function success(data) {
                    if (!data || !data.statusCode) {
                        return when.reject("skip PL mark, PL status query failed.");
                    }
                    var statusCode = data.statusCode.toLowerCase();

                    if (statusCode === STATUS_BOOKED) {
                        me.html(template);
                    } else {
                        return when.reject("skip PL mark, PL not booked.");
                    }
                });
            });
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/popupvideo/index.html',[],function() { return function template(data) { var o = "<div class=\"evc-studyplan-popup-video modal\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content\">\n\t\t</div>\n\t\t<div class=\"close\" data-dismiss=\"modal\"></div>\n\t</div>\n</div>\n\n<style type=\"text/css\">\n\t.evc-studyplan-popup-video .modal-dialog {\n\t\tpadding:0;\n\t\twidth:640px;\n\t\theight: 400px;\n\t}\n\t.evc-studyplan-popup-video .close {\n\t\tposition: absolute;\n\t\ttop: -14px;\n\t\tright: -24px;\n\t\twidth:35px;\n\t\theight:35px;\n\t\tbackground: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAABICAYAAAB86kzAAAAIr0lEQVRo3s1Ye0zVdRSXx8UJjmxRJqQUjtu8XFils41YZsMs70TBVpmi4iuZlDpzqOQqkpmFky0DX6MmSpbT1cz8yzZHtdncaD4XJbNF8iydDxTMTuf8Ot9f5/7e9/qo73bg3t/vfM/3c7/n8f2ez4ABLmPBggVKHkGpQDmIchTlT5aj/KyCdeScAV4HALgrocFilFYU8Cit8+fPn4VTY1huHgwaLUD5KQIQRvkZQU0RoGKiAoOGXjcaX7FiBTQ2NsKJEyfg7NmzcOPGDU3oMz2jd6RjnDdv3rxyNBnnBsgSDBrYJo0tX74cDh8+rC3sNkiHdGmOAVA9mo5HibUDZAKDE1dLIzU1NXDt2jWIdNAcmittlZSUvIlL+OwAhYHBCSE5effu3XCzg2xImzNnzizCpRKsABnB6BmzadMmT27x4jaypexiQJ/FpRKtdkgHQ6koA7W3txdu1SBbMrBnzJjxCi45iGNID2odDCr9opQpAI2jubkZcnJyYO7cuXDlypWwd/SdntN70rMaZFPsThsumYwyUGTZP2BQIU8plpeXm9xz7Ngx8Pv9MGzYMCgrK4MtW7boQU3/S0tLwefzQWFhIVRWVsKpU6cs3UW21TqoG8L1k4S7dDBvK6W9e/eaDLW1tcGUKVNg6dKlsHbtWk02b94MHR0dsHjxYoiPj4eCggLt+Y4dO+DChQuWu0O2hauqcf0hvDta7Cgwh5TS6dOnLQ2dO3cOqqurdTAkS5YsgcGDB8PkyZO17w0NDXDx4kXb2Dl58qQOZs6cOU0I4F7enXgJpk0pnT9/3tZYZ2cnbNiwIQwQ7Qz9p+p7+fJlx0Am26IIdiKAVI6dBAmmTyldv37d0WBLS4vmewmotrYWenp6XLOKbIua048A0lHuVq6KCExfX5+2E0OHDoVly5bpYKqqqrR4oPcRghmJksJpHuvZTVevXoWFCxdCXFycFiOUNRs3btQB0XcqbqTnxU1YCroQgB/lPi6CcQrM104BTHUEa4OWNZRVKkYoy+rr68NcRoCMdcgqgIuLi79HAA+jDOUg/gcMLlTplNo0qI5MnTrVFKzd3d2mLLMbMrWLioq2W4LBLXtSKa1atcr2TKKFdu7cCZcuXQp73t7eDuvXr3cEQjbJtlonNzd3kaWbKHhQ4Ten40ANuzpCdchpyOMArxI9uObjlgFMH1ChRB6U0dxhnO428qDMz89/H9d8zDK1+aBKoONdXiFu1ZBXCKy8VOyeQsmyLHoMJh7Pixdu9+UqLy/vHVxrLLvIfBwwGDqsBs6ePbtSTqZfFe21U+4IyaRJkxpxjXEoQZQHLA9KHrF8nCfhVjYYu4KmpibPF3LSNXYJ06ZNO4S2J3CsZHDgmq8QPGL4okNIk9Fl69xaFTXcWhXckU/Q5kR2D6Xz/baXKwEmhv1HqTYEL0AleLr+Gm0ThzvchfXkXd6RsVzk0tg99tdOAUi5K5HTLg1BrcTC2BYJiPHjx9fi3BDHyGO8I2ls0/lCbgEogScN4W19CH/l81jG67DdOIKB3iLOmTPTp09vDoVCu4LB4BJ2yTjeDQrWh9jGELbp3qrY7NAg9m8KZwClZADlUV4sF+UJllx+9ijrjOQ5KWxjkOcmzgZQPAcaRf5dXBuoWI3gxTLZBX7+PJLfpbLuXTx3YMTtrQUglWU+ASqZfX8PH3RS7uF3yQKEL+rG3waQ3KkEXmQQx0ASSyI/G8g6cieip0SsmCsLYLH8i6XERgLABIb+/F/k/wfGaezJyZHyCEoFykGUoyh/shzlZxWso8+JaLiBofdotBilFQU8Suun2dkRk4yOYNBoAcpPEYAIk89ycn5GUJ5JRlswaOx1o/Ev8/Ohed06aP/mG/gDW4+/8MpAQp/pGb0jHeO8T7KzPZGMlmDQwDZpbP/TT8OZPXu0hd0G6ZAuzZE2dmdnu5KMJjA4cbU00lRaCtdtGjPHdhbn0Fxpa2cw6EgyhoHBCSE5+Qfsh252kA1pc3sgYEsyGsHoGfPta695cosXt5EtEdS2JKMOhlJRBmq/oXO8mUG2ZGBvHTXKkmTUwaDSL0qZAvBWk4xkU9nHH25JMqqilqcUD0ycaHKPIhkfSEyEiqws+OiNN0wkY0JsLMx88EHYGArBabygW7mLbKt11mdmmkhGBeZtpXS8psaSZCyaMAHeCgahdswYTerXrPmXZIyJgZfS07Xnn+NV9GJnp+XukG3hKhPJqMAcUkqdR45YGmrH5r521iwdDEn5s89Css8HL44YoX3/YtEiuNzVZRs7Hd99p4NpCAZNJKMC06aUem1+lUYy4k7UYWxIQKsDAe3//rIy6P39d2e2HG2LImgiGRWYPqV0o7/fmWT88UeoRJdJQLsKC+G8aOxsO060LVLcRDJGBEaRjKlJSWHxUzd2LByoqoJ+F5LRAkwYR+PZTYpkpGClGNk0ejR89MwzOiD6vnXlSkeSUbqpMTvbRDJqYBDl104BrEhGH6bvy5w1FCMdx4/Dp5jW0mXbysttSUYZwPWBgIlkVGAqnVKbBtWRGVhHjMHag9nzoSGo7YZM7fcyM7dbgsEte1IpffXcc7Znkpa+uBNXurtNaf8Bp73TGUW21Trz0tIWWbqJggd35zen40ANuzrS7kIyyuMAm3JLklEHg3eNEnlQRnOHcbrbyINyeXq6JcmowGgkIx3v8gpxq4a8QmDltSUZJZj4bYHAC7f7crUwLc2WZJRgNJLx46ysSjmZflW01065IyRrMjIcSUZ509NJxh3BYIOxK2jdt8/zhZx0jV1Ctd/vSjJKMGEkIx7x69xaFTXcWhXcEU8koxFMGMmIF6AS7Hl+jbaJwx3umpua6plkNLYqliQjglqJhbEtEhCvDh8eMclo1cTZkoz4K59/3++vw3bjCAZ6izhnztSNGtX8ZkbGrkkpKVGTjHbt7X9CMjo1/necZHSjRO4oyeiF2LtjJGNEzNXtJhn/BkNB/ubmupeRAAAAAElFTkSuQmCC) center top no-repeat;\n\t\t*background-image: url(/_imgs/evc/block/high/btn_close.png);\n\t\tfilter:none;\n\t}\n\t.evc-studyplan-popup-video .close:hover {\n\t\topacity: 1;\n\t\tfilter:none;\n\t}\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/popupvideo/main',[
	"jquery",
	"jquery.gudstrap",
	"jquery.mediaelement",
	"troopjs-ef/component/widget",
	"template!./index.html"
], function ($, GUD, mejs, Widget, template) {
	"use strict";

	var $ELEMENT = "$element";
	var VIDEO_URL = "_video_url";
	var MEDIA_ELEMENT = "_media_element";
	var SEL_POPUP_VIDEO = ".evc-studyplan-popup-video";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			me[VIDEO_URL] = me[$ELEMENT].data("videoUrl");

			return me.html(template).then(function () {
				var $modalContent = me[$ELEMENT].find(".modal-content");

				$(SEL_POPUP_VIDEO).on("shown.bs.modal", function () {
					var $video = $("<video/>", {
						"class": "ets-vp",
						"width": "100%",
						"height": "100%",
						"type": "video/mp4",
						"controls": "controls",
						"src": me[VIDEO_URL]
					});
					$video.appendTo($modalContent.empty());

					mejs.MediaElementPlayer($video, {
						pauseOtherPlayers: true,
						alwaysShowControls: true,
						startVolume: 0.8,
						features: ["playpause", "progress", "current", "duration", "tracks", "volume"],
						videoWidth: 640,
						videoHeight: 360,
						success: function (mediaElement, domObject, player) {
							mediaElement.play();
							me[MEDIA_ELEMENT] = mediaElement;
						}
					});
				});

				$(SEL_POPUP_VIDEO).on("hide.bs.modal", function () {
					me[MEDIA_ELEMENT].pause();
					$modalContent.find("video")[0].player.remove();
				});
			});
		},
		"hub/studyplan/evc/welcome-video/show": function () {
			this[$ELEMENT].find(SEL_POPUP_VIDEO).modal();
		},
		"dom:.mejs-cover/click": function () {
			var me = this;
			!me[MEDIA_ELEMENT].paused && me[MEDIA_ELEMENT].pause();
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/privatelesson/index.html',[],function() { return function template(data) { var o = "";
    var STATUS_WELCOME = "welcome";

    var statusCode = data.statusCode;
    var unitId = data.unitId;
o += "\n<div class=\"st-evc-status\" data-weave=\"school-ui-studyplan/widget/gl-pl/announcement/pl\"></div>\n<div class=\"st-evc-status\" data-weave=\"school-ui-studyplan/widget/gl-pl/statusbar/pl\"></div>\n<div class=\"evc-studyplan-wrapper\">\n    "; if( statusCode === STATUS_WELCOME){ o += "\n        <div class=\"evc-studyplan-column-single evc-studyplan-welcome\" data-weave=\"school-ui-studyplan/widget/gl-pl/welcome-pl/main\"></div>\n    "; }else{ o += "\n        <div class=\"evc-studyplan-column-single\">\n            <div class=\"evc-studyplan-gap-2x\" data-weave=\"school-ui-studyplan/widget/gl-pl/lesson/pl\"></div>\n            <div class=\"evc-studyplan-gap-1x evc-studyplan-class-info\">\n            </div>\n        </div>\n        <div class=\"evc-studyplan-activity-container\">\n        </div>\n    "; } o += "\n</div>\n\n<style type=\"text/css\">\n\n    .evc-studyplan-wrapper{\n        text-align: center;\n        padding: 30px 0 50px;\n        color: #4a4a4a;\n    }\n    .evc-studyplan-column-full{\n        display: inline-block;\n    }\n    .evc-studyplan-column-single{\n        display: inline-block;\n        width: 980px;\n    }\n    .evc-studyplan-column-single hr{\n        margin-bottom: 0;\n    }\n    .evc-studyplan-welcome{\n        width: 900px;\n        padding-top: 50px;\n    }\n    .evc-studyplan-gap-2x{\n        text-align: left;\n        width: 620px;\n        padding-left: 35px;\n        padding-right: 35px;\n        vertical-align: top;\n        display: inline-block;\n\t\tmargin: 20px auto;\n    }\n    .evc-studyplan-gap-1x{\n        text-align: left;\n        width: 330px;\n        vertical-align: top;\n        margin: auto;\n\t    padding-left: 30px;\n        display: inline-block;\n\t    border-left:1px #eee solid;\n    }\n    .evc-studyplan-gap-1x .evc-studyplan-gap-block{\n\t    margin-bottom: 15px;\n    }\n    .st-evc-status{\n        color: #4a4a4a;\n        background-color: #e6e6e6;\n    }\n    .evc-studyplan-gray{\n        color:#999999;\n    }\n    .evc-studyplan-green{\n        color:#87c600;\n    }\n    .evc-studyplan-blue{\n        color: #00bee3;\n    }\n    .evc-none{\n        display: none;\n    }\n    .evc-studyplan-activity-container {\n\t    width:880px;\n\t    margin:0 auto;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/privatelesson/main',["troopjs-browser/component/widget",
	"when",
	"jquery",
	"school-ui-studyplan/module",
	"school-ui-studyplan/utils/client-storage",
	"school-ui-studyplan/utils/time-parser",
	"school-ui-studyplan/enum/studyplan-item-typecode",
	"template!./index.html"
], function (Widget, when, $, module, clientStorage, timeParser, spItemTypeCode, template) {
	"use strict";

    var MODULE_CONFIG = $.extend(true, {
        cacheServer: "",
        useLegacyUnitId: true
    }, module.config() || {});

    var $ELEMENT = "$element";

	var STATUS_NEVERTAKE = "nevertake";
	var STATUS_BOOKED = "booked";
	var STATUS_DROPOUT = "dropout";
	var STATUS_PENDING = "pending";
	var STATUS_ATTENDED = "attended";

	var STATUS_WELCOME = "welcome";
	var STATUS_OPTIONAL_MSG_PL = "optional_msg_pl";

	var STATUS_MISSING_CLASS = "missingclass";

	var STATUS_START_NOT_YET = "notyet";
	var STATUS_START_IN_COUNTDOWN = "incountdown";
	var STATUS_START_STARTED = "started";

	var WIDGET_COUNTDOWN = "school-ui-studyplan/widget/gl-pl/countdown/pl",
		WIDGET_CLASS_STATUS = "school-ui-studyplan/widget/gl-pl/class-status/pl",
		WIDGET_CREDIT_PL = "school-ui-studyplan/widget/gl-pl/credit/pl",
		WIDGET_CREDIT_SPPL20 = "school-ui-studyplan/widget/gl-pl/credit/sppl20",
		WIDGET_FEEDBACK_PL = "school-ui-studyplan/widget/gl-pl/feedback/pl",
		WIDGET_FEEDBACK_PENDING = "school-ui-studyplan/widget/gl-pl/feedback-pending/main",
		WIDGET_ENTER_CLASS = "school-ui-studyplan/widget/gl-pl/enter-class/pl",
		WIDGET_BOOKED = "school-ui-studyplan/widget/gl-pl/book-pl/main",
		WIDGET_CANCEL = "school-ui-studyplan/widget/gl-pl/cancel-pl/main";

	var SEL_ACTIVITY_CONTAINER = ".evc-studyplan-activity-container",
		SEL_INFO_CONTAINER = ".evc-studyplan-class-info",
		SEL_ENTER_CLASS = ".ets-sp-glpl-enter-class";

	var CLS_GAP_2X = "evc-studyplan-gap-2x text-center",
		CLS_GAP = "evc-studyplan-gap-block",
		CLS_ENTER_CLASS = "ets-sp-glpl-enter-class",
		CLS_NONE = "ets-none";

	var UNIT_ID = "_unit_id";
	var CLASS_ID = "_class_id";

	var UNIT_ID_KEY = MODULE_CONFIG.useLegacyUnitId ? "legacyUnitId" : "templateUnitId"

	var TOPIC_PIC_PATH = MODULE_CONFIG.cacheServer + "/_imgs/evc/pl/topic/100x100/";
	var PL_DEFAULT_PIC = MODULE_CONFIG.cacheServer + "/_imgs/evc/pl/pl_default_100x100.png";

	var DURATION_WAITING = 3000;

	var TIMER_WAITING = "_timer_waiting";

	var TYPE_CODE= "_type_code";
	var WIDGET_CREDIT = "_widget_credit";

	function createWidget(widgetName, appendToContainer, classNames) {
		var me = this;
		var $widgetElement = $("<div>");

		if (widgetName === WIDGET_ENTER_CLASS) {
			$widgetElement.attr("data-weave", widgetName + "(unitId, classId, spTypeCode)")
				.data("classId", me[CLASS_ID]);
		} else {
			$widgetElement.attr("data-weave", widgetName + "(unitId, spTypeCode)");
		}
		return $widgetElement
			.addClass(classNames || "")
			.data("unitId", me[UNIT_ID])
			.data('spTypeCode', me[TYPE_CODE])
			.appendTo(me.$element.find(appendToContainer))
			.weave();
	}

	return Widget.extend(function ($element, name, item) {
		var me = this;

		if (!item && !item.properties) {
			return;
		}

		me[TYPE_CODE] = item.typeCode;
		me[WIDGET_CREDIT] = me[TYPE_CODE] === spItemTypeCode.pl20 ? WIDGET_CREDIT_SPPL20 : WIDGET_CREDIT_PL;

		// Show Optional Msg
		me.closeOptionalTips = clientStorage.getLocalStorage("pl_tips") === "closed";

	}, {
		"hub:memory/load/unit": function (unit) {
			var me = this;
			if (!unit || !unit[UNIT_ID_KEY]) {
				return;
			}
			me.unitId = unit[UNIT_ID_KEY];

			// Check the student whether is first come or not
			me.publish("query", ["member_site_setting!evc;FirstTimeStudyPlanPL"]).spread(function (data) {
				if (!data) {
					return;
				}
				if (data.value.toString() === "true") {
					me.publish("studyplan/evc/pl/load");
				} else {
					me.html(template, {
						"unitId": me.unitId,
						"statusCode": STATUS_WELCOME
					});
				}
			});

		},
		"hub:memory/studyplan/evc/pl/start-status": function (status) {
			var me = this;
			switch (status) {
				case STATUS_START_NOT_YET:
					me.$element.find(SEL_ENTER_CLASS).addClass(CLS_NONE);
					break;
				case STATUS_START_IN_COUNTDOWN:
					me.$element.find(SEL_ENTER_CLASS).addClass(CLS_NONE);
					break;
				case STATUS_START_STARTED:
					me.$element.find(SEL_ENTER_CLASS).removeClass(CLS_NONE);
					break;
			}
		},
		"hub/studyplan/evc/pl/load": function () {
			var me = this;
			me[UNIT_ID] = me.unitId;

			me.publish("query", ["plclass!" + me.unitId]).spread(function success(data) {
				if (!data || !data.topic || !data.statusCode) {
					return;
				}
				var content = {};
				var topic = data.topic;
				var statusCode = data.statusCode.toLowerCase();

				// Copy & package own/customize PL class Info
				content.status = {
					"statusCode": statusCode
				};

				content.lessonInfo = {
					"topic": topic.topicBlurb,
					"description": topic.descriptionBlurb,
					"image": topic.topicImageUrl ? (TOPIC_PIC_PATH + topic.topicImageUrl) : PL_DEFAULT_PIC
				};

				content.topicId = data.topic.topicId;

				if (statusCode === STATUS_BOOKED || statusCode === STATUS_ATTENDED || statusCode === STATUS_PENDING) {
					if (!data.bookedClass || !data.bookedClass.easternStartTime) {
						return;
					}

					// Copy data
					var bookedClass = data.bookedClass;

					me[CLASS_ID] = bookedClass.classId;

					content.timezoneId = bookedClass.timezoneId;
					content.bookedClass = {
						"classId": bookedClass.classId,
						"teacherId": bookedClass.teacherId
					};
					content.customizedStartTime = timeParser.toLocalTime(
						bookedClass.easternStartTime,
						bookedClass.timeZoneOffset
					);

					if (statusCode === STATUS_BOOKED) {
						if (!bookedClass.easternSuggestedCancelTime || !data.countDown) {
							return;
						}
						var countDown = data.countDown;

						content.countdown = {
							"timeIn": countDown.secondsLeftForStart,
							"timeOut": countDown.secondsLeftForEnter
						};
						content.suggestedCancelTime = timeParser.toLocalTime(
							bookedClass.easternSuggestedCancelTime,
							bookedClass.timeZoneOffset
						);
					} else if (statusCode === STATUS_ATTENDED || statusCode === STATUS_PENDING) {
						if (!data.feedback) {
							return;
						}
						var feedback = data.feedback;
						content.feedback = {
							"feedbackId": feedback.feedbackId,
							"teacherId": feedback.teacherId,
							"entryDate": feedback.entryDate
						};
					}
				}

				// Render
				me.html(template, {
					"unitId": me.unitId,
					"statusCode": statusCode
				}).then(function () {
					me[$ELEMENT].find(SEL_INFO_CONTAINER).empty();
					me[$ELEMENT].find(SEL_ACTIVITY_CONTAINER).empty();

                    // Publish status
                    me.publish("studyplan/evc/pl/status", content);
                    // clear the class status as not yet
                    me.publish("studyplan/evc/pl/start-status", STATUS_START_NOT_YET);

					// Publish status to show optional msg
					if (!me.closeOptionalTips) {
						me.publish("studyplan/evc/pl/notification", {
							"statusCode": STATUS_OPTIONAL_MSG_PL
						});
					}

					// Publish status to show status bar
					if (statusCode === STATUS_DROPOUT) {
						me.publish("studyplan/evc/pl/notification", {
							"statusCode": STATUS_MISSING_CLASS
						});
					}

					var evcServerCode = data.bookedClass && data.bookedClass.evcServerCode || '';
					// Adobe classroom: "cn1" or "us1", otherwise "EvcCN1" or "EvcUS1"
					var isAdobeClassroom = evcServerCode.toLowerCase().indexOf('evc') < 0;
					if (!isAdobeClassroom) {
						// simulate techcheck passed
						clientStorage.setSessionStorage("techcheck_state", "passed");
					}

					switch (statusCode.toLowerCase()) {
						case STATUS_NEVERTAKE:
						case STATUS_DROPOUT:
							createWidget.call(me, WIDGET_BOOKED, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, me[WIDGET_CREDIT], SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						case STATUS_BOOKED:
							createWidget.call(me, WIDGET_COUNTDOWN, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_CLASS_STATUS, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, WIDGET_ENTER_CLASS, SEL_INFO_CONTAINER, CLS_GAP + " " + CLS_ENTER_CLASS + " " + CLS_NONE);
							createWidget.call(me, WIDGET_CANCEL, SEL_INFO_CONTAINER, CLS_GAP);
							createWidget.call(me, me[WIDGET_CREDIT], SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						case STATUS_PENDING:
							createWidget.call(me, WIDGET_FEEDBACK_PENDING, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
							createWidget.call(me, me[WIDGET_CREDIT], SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						case STATUS_ATTENDED:
							createWidget.call(me, WIDGET_FEEDBACK_PL, SEL_ACTIVITY_CONTAINER, CLS_GAP_2X);
							createWidget.call(me, me[WIDGET_CREDIT], SEL_ACTIVITY_CONTAINER, CLS_GAP);
							break;
						default:
							break;
					}
				});

			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/statusbar/index.html',[],function() { return function template(data) { var o = "";
    var STATUS_LEFT_EARLY = "leftearly";
    var STATUS_MISSING_CLASS = "missingclass";
    var STATUS_NO_COUPON_PL = "no_coupon_pl";
    var STATUS_NO_COUPON_GL = "no_coupon_gl";
    var STATUS_OPTIONAL_MSG_GL = "optional_msg_gl";
    var STATUS_OPTIONAL_MSG_PL = "optional_msg_pl";

    var statusCode = data.statusCode;
    var link = data.link || "";
o += "\n"; if(statusCode === STATUS_OPTIONAL_MSG_GL){ o += "\n    <div class=\"evc-studyplan-status-container evc-studyplan-status-optional-gl-container clearfix\">\n"; }else if(statusCode === STATUS_OPTIONAL_MSG_PL){ o += "\n    <div class=\"evc-studyplan-status-container evc-studyplan-status-optional-pl-container clearfix\">\n"; }else{ o += "\n    <div class=\"evc-studyplan-status-container clearfix\">\n"; } o += "\n    <hr>\n    <div class=\"evc-studyplan-status-tips\">\n        "; 
            switch(statusCode){ 
                case STATUS_LEFT_EARLY:
                    showLeftEarly();
                    break;
                case STATUS_MISSING_CLASS:
                    showMissingClass();
                    break;
                case STATUS_NO_COUPON_PL:
                    showNoCouponPL();
                    break;
                case STATUS_NO_COUPON_GL:
                    showNoCouponGL();
                    break;
                case STATUS_OPTIONAL_MSG_GL:
                    showOptionalMsgGL();
                    break;
                case STATUS_OPTIONAL_MSG_PL:
                    showOptionalMsgPL();
                    break;
                default:
                    break;
            }
        o += "\n    </div>\n</div>\n\n"; function showLeftEarly() { o += "\n    <h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568598\"></h4>\n    <p class=\"evc-studyplan-status-subline\">\n        <span>" + data.msg + "</span><br>\n        <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568602\"></span>\n    </p>\n"; } o += "\n\n"; function showMissingClass() {o += "\n    <h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568621\"></h4>\n    <p class=\"evc-studyplan-status-subline\">\n        <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568622\"></span>\n        <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568602\"></span>\n    </p>\n"; } o += "\n\n"; function showNoCouponPL() { o += "\n    <h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568594\"></h4>\n    "; if (link) { o += "\n        <p class=\"evc-studyplan-status-subline\">\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568593\"></span>\n            <strong>\n                <a href=\"" + link + "\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568595\"></a>\n            </strong>\n<!--             "; if(data.showSkip) { o += "\n                <span data-blurb-id=\"101321\" data-weave=\"troopjs-ef/blurb/widget\">or</span>\n                <strong data-weave=\"school-ui-studyplan/widget/gl-pl/skip-pl/main\"></strong>\n            "; } o += " -->\n        </p>\n    "; } o += "\n"; } o += "\n\n"; function showNoCouponGL() { o += "\n    <h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"570577\"></h4>\n    "; if (link) { o += "\n        <p class=\"evc-studyplan-status-subline\">\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"570578\"></span>\n            <strong>\n                <a href=\"" + link + "\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568595\"></a>\n            </strong>\n        </p>\n    "; } o += "\n"; } o += "\n\n"; function showOptionalMsgGL() { o += "\n    <button type=\"button\" class=\"close\" aria-hidden=\"true\" data-action=\"closeGLOptionalMsg\">&times;</button>\n    <h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"629827\"></h4>\n    <p class=\"evc-studyplan-status-subline\">\n        <span data-weave=\"school-ui-shared/widget/blurb\" data-blurb-ccl=\"school.courseware.blurb.629828\" data-blurb-id=\"629828\" data-text-en=\"The Group Class is a great opportunity to practice your English, meet other students and get answers to your questions from one of our experienced teachers.\"></span>\n    </p>\n"; } o += "\n\n"; function showOptionalMsgPL() { o += "\n    <button type=\"button\" class=\"close\" aria-hidden=\"true\" data-action=\"closePLOptionalMsg\">&times;</button>\n    <h4 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"629827\"></h4>\n    <p class=\"evc-studyplan-status-subline\">\n        <span data-weave=\"school-ui-shared/widget/blurb\" data-blurb-ccl=\"school.courseware.blurb.629829\" data-blurb-id=\"629829\" data-text-en=\"The Private Class is a great opportunity for you to practice and get feedback from one of our experienced teachers on what you’ve just learned.\"></span>\n    </p>\n"; } o += "\n\n<style type=\"text/css\">\n    .evc-studyplan-status-container{\n        text-align: left;\n        width: 680px;\n        margin: 0 auto;\n    }\n    .evc-studyplan-status-container hr{\n        border-top-color: #bdbdbd;\n        margin: 0;\n    }\n    .evc-studyplan-status-tips{\n        margin: 15px 0;\n    }\n    .evc-studyplan-status-tips .evc-studyplan-status-subline {\n        font-size: 12px;\n        margin-top: 6px;\n    }\n    .evc-studyplan-status-tips .evc-studyplan-status-subline strong {\n        white-space: nowrap;\n        font-style: italic;\n    }\n    .evc-studyplan-status-tips .evc-studyplan-status-subline strong a{\n        cursor: pointer;\n    }\n    .evc-studyplan-status-tips button.close {\n        float: right;\n        padding: 0;\n        cursor: pointer;\n        background: transparent;\n        border: 0;\n        -webkit-appearance: none;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/statusbar/main',["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html"
], function(Widget, $, template) {
    'use strict';

    return Widget.extend({
        "render": function(data){
            var me = this;
            if (!data) {
                return;
            }
            me.append(template, data);
        },
        "hideSeparateLine": function() {
            var me = this;
            var $me = me.$element;
            var $hr = $me.find("hr").eq(0);
            if ($hr.length > 0) {
                $hr.hide();
            }
        }
    });
});
define('school-ui-studyplan/widget/gl-pl/statusbar/cp20',["./main",
	"jquery",
	"school-ui-studyplan/utils/client-storage",
	"template!./index.html"
], function (StatusBarBase, $, clientStorage, template) {
	'use strict';

	var SEL_CONTAINER = ".evc-studyplan-status-optional-pl-container";

	return StatusBarBase.extend({
		"hub/studyplan/evc/cp20/notification": function (data) {
			var me = this;
			me.render(data);
		},
		"hub/studyplan/evc/cp20/announcement/disable": function () {
			var me = this;
			me.hideSeparateLine();
		},
		"dom:[data-action = closePLOptionalMsg]/click": function (e) {
			var me = this;
			var $el = me.$element;

			clientStorage.setLocalStorage("cp20_tips", "closed");
			$el.find(SEL_CONTAINER).remove();
			me.hideSeparateLine();
		}
	});
});

define('school-ui-studyplan/widget/gl-pl/statusbar/gl',["./main",
	"jquery",
	"school-ui-studyplan/utils/client-storage",
	"template!./index.html"
], function (StatusBarBase, $, clientStorage, template) {
	'use strict';

	var SEL_CONTAINER = ".evc-studyplan-status-optional-gl-container";

	return StatusBarBase.extend({
		"hub/studyplan/evc/gl/notification": function (data) {
			var me = this;
			me.render(data);
		},
		"hub/studyplan/evc/gl/announcement/disable": function () {
			var me = this;
			me.hideSeparateLine();
		},
		"dom:[data-action = closeGLOptionalMsg]/click": function (e) {
			var me = this;
			var $el = me.$element;

			clientStorage.setLocalStorage("gl_tips", "closed");
			$el.find(SEL_CONTAINER).remove();
			me.hideSeparateLine();
		}
	});
});

define('school-ui-studyplan/widget/gl-pl/statusbar/pl',["./main",
	"jquery",
	"school-ui-studyplan/utils/client-storage",
	"template!./index.html"
], function (StatusBarBase, $, clientStorage, template) {
	'use strict';

	var SEL_CONTAINER = ".evc-studyplan-status-optional-pl-container";

	return StatusBarBase.extend({
		"hub/studyplan/evc/pl/notification": function (data) {
			var me = this;
			me.render(data);
		},
		"hub/studyplan/evc/pl/announcement/disable": function () {
			var me = this;
			me.hideSeparateLine();
		},
		"dom:[data-action = closePLOptionalMsg]/click": function (e) {
			var me = this;
			var $el = me.$element;

			clientStorage.setLocalStorage("pl_tips", "closed");
			$el.find(SEL_CONTAINER).remove();
			me.hideSeparateLine();
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/terms-and-conditions/main.html',[],function() { return function template(data) { var o = "<p data-blurb-id=\"708942\" data-text-en=\"\"\n\tdata-pattern=\"\\*{3}([^*]+)\\*{3}\"\n\tdata-weave=\"troopjs-ef/blurb/widget\">\n\t<a href=\"javascript:void(0);\" data-value-name=\"Terms and Conditions\"\n\t\tdata-blurb-id=\"685505\"\n\t\tdata-weave-delay=\"troopjs-ef/blurb/widget\"\n\t\tdata-toggle=\"modal\" data-target=\"#teamsAndConditions\"></a>\n</p>\n<!-- Modal -->\n<div class=\"ets-sp-modal-tc modal fade\" id=\"teamsAndConditions\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"teamsAndConditionsLabel\" aria-hidden=\"true\">\n\t<div class=\"modal-dialog\" role=\"document\">\n\t\t<div class=\"modal-content\">\n\t\t\t<div class=\"modal-header\">\n\t\t\t\t<h5 class=\"modal-title\"\n\t\t\t\t\tid=\"teamsAndConditionsLabel\"\n\t\t\t\t\tdata-weave=\"troopjs-ef/blurb/widget\"\n\t\t\t\t\tdata-blurb-id=\"685505\"\n\t\t\t\t\tdata-value-name=\"Terms and Conditions\"\n\t\t\t\t></h5>\n\t\t\t\t<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n\t\t\t\t\t<span aria-hidden=\"true\">&times;</span>\n\t\t\t\t</button>\n\t\t\t</div>\n\t\t\t<div class=\"modal-body\"\n\t\t\t\tdata-blurb-id=\"708943\"\n\t\t\t\tdata-weave=\"troopjs-ef/blurb/widget\">\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/terms-and-conditions/main',[
    "troopjs-ef/component/widget",
    "template!./main.html",
	"jquery.gudstrap"
], function (Widget, template) {
    return Widget.extend({
		"sig/start": function () {
            this.html(template);
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/welcome-cp20/index.html',[],function() { return function template(data) { var o = "<div class=\"clearfix row\">\n    <div class=\"evc-studyplan-welcome-content\">\n        <h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568614\"></h2>\n        <p class=\"evc-studyplan-welcome-content-des\">\n            <span data-weave=\"school-ui-shared/widget/blurb\" data-blurb-ccl=\"school.courseware.blurb.568615\" data-blurb-id=\"568615\" data-text-en=\"In the private class you learn English with your own private teacher.\"></span><br>\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568616\"></span>\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568617\"></span><br>\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568618\"></span>\n        </p>\n        <p>\n            <button type=\"button\" class=\"btn btn-primary\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568611\" data-action=\"getStart\"></button>\n        </p>\n    </div>\n    <div class=\"evc-studyplan-welcome-image\">\n        "; if (data.video) { o += "\n            <a href=\"\" data-action=\"showVideo\">\n                <img src=\"" + data.cacheServer+ "/_imgs/evc/pl/studyplan/video.jpg\">\n            </a>\n            <p class=\"evc-studyplan-welcome-video-description\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"569775\"></p>\n            <div data-weave=\"school-ui-studyplan/widget/gl-pl/popupvideo/main\" data-video-url=\"" + data.video+ "\"></div>\n        "; } else if (data.image) { o += "\n            <img src=\"" + data.image+ "\">\n        "; } o += "\n    </div>\n</div>\n\n<style type=\"text/css\">\n    .evc-studyplan-welcome-content{\n        text-align: left;\n        float: left;\n        width: 510px;\n        padding: 0 15px;\n    }\n    .evc-studyplan-welcome-content > p{\n        margin-top: 30px;\n    }\n    .evc-studyplan-welcome-content-des{\n        line-height: 1.7em;\n    }\n    .evc-studyplan-welcome-image{\n        float: right;\n        padding: 0 30px 0 15px;\n        width: 375px;\n    }\n    .evc-studyplan-welcome-image > a{\n        display: inline-block;\n        margin-top: 7px;\n        margin-bottom: 10px;\n    }\n    .evc-studyplan-welcome-video-description {\n        font-style: italic;\n        text-align: center;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/welcome-cp20/main',[
    "jquery",
    "troopjs-ef/component/widget",
    "school-ui-studyplan/module",
    "template!./index.html"
], function ($, Widget, module, template) {
    "use strict";

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
	}, module.config() || {});

    var CCL_MEDIA = "ccl!'school.studyplan.cp20.intro.media'";

    return Widget.extend({
        "sig/start": function() {
            var me = this;

            me.query(CCL_MEDIA).spread(function (cclMediaResult) {
                me.query(cclMediaResult.value).spread(function (data) {
                    var customizeImage = /\.jpg$|\.png$|\.gif$/i.test(data.url);
                    me.html(template, {
                        cacheServer: MODULE_CONFIG.cacheServer,
                        image: customizeImage && data.url,
                        video: !customizeImage && data.url
                    });
                });
            });
        },
        "dom:[data-action = getStart]/click": function(e) {
            e.preventDefault();
            var me = this;
            me.publish("school/member_site_setting/Save", {
                "siteArea": "evc",
                "keyCode": "FirstTimeStudyPlanCP20",
                "keyValue": "true"
            }).spread(function() {
                // reload
                me.publish("studyplan/evc/cp20/load");
            });
        },
        "dom:[data-action = showVideo]/click": function(e) {
            e.preventDefault();
            this.publish("studyplan/evc/welcome-video/show");
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/welcome-gl/index.html',[],function() { return function template(data) { var o = "<div class=\"clearfix row\">\n    <div class=\"evc-studyplan-welcome-content\">\n        <h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568607\"></h2>\n        <p class=\"evc-studyplan-welcome-content-des\">\n            <span data-weave=\"school-ui-shared/widget/blurb\" data-blurb-ccl=\"school.courseware.blurb.568608\" data-blurb-id=\"568608\" data-text-en=\"In the conversation class you practice your spoken English together with other students.\"></span><br>\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568609\"></span>\n        </p>\n        <p>\n            <button type=\"button\" class=\"btn btn-primary\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568611\" data-action=\"getStart\"></button>\n        </p>\n    </div>\n    <div class=\"evc-studyplan-welcome-image\">\n        "; if (data.video) { o += "\n            <a href=\"\" data-action=\"showVideo\">\n                <img src=\"" + data.cacheServer+ "/_imgs/evc/gl/studyplan/video.jpg\">\n            </a>\n            <p class=\"evc-studyplan-welcome-video-description\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"569776\"></p>\n            <div data-weave=\"school-ui-studyplan/widget/gl-pl/popupvideo/main\" data-video-url=\"" + data.video+ "\"></div>\n        "; } else if (data.image) { o += "\n            <img src=\"" + data.image+ "\">\n        "; } o += "\n    </div>\n</div>\n\n<style type=\"text/css\">\n    .evc-studyplan-welcome-content{\n        text-align: left;\n        float: left;\n        width: 510px;\n        padding: 0 15px;\n    }\n    .evc-studyplan-welcome-content > p{\n        margin-top: 30px;\n    }\n    .evc-studyplan-welcome-content-des{\n        line-height: 1.7em;\n    }\n    .evc-studyplan-welcome-image{\n        float: right;\n        padding: 0 30px 0 15px;\n        width: 375px;\n    }\n    .evc-studyplan-welcome-image > a{\n        display: inline-block;\n        margin-top: 7px;\n        margin-bottom: 10px;\n    }\n    .evc-studyplan-welcome-video-description {\n        font-style: italic;\n        text-align: center;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/welcome-gl/main',[
    "jquery",
    "troopjs-ef/component/widget",
    "school-ui-studyplan/module",
    "template!./index.html"
], function ($, Widget, module, template) {
    "use strict";

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
	}, module.config() || {});

    var CCL_MEDIA = "ccl!'school.studyplan.gl.intro.media'";

    return Widget.extend({
        "sig/start": function() {
            var me = this;

            me.query(CCL_MEDIA).spread(function (cclMediaResult) {
                me.query(cclMediaResult.value).spread(function (data) {
                    var customizeImage = /\.jpg$|\.png$|\.gif$/i.test(data.url);
                    me.html(template, {
                        cacheServer: MODULE_CONFIG.cacheServer,
                        image: customizeImage && data.url,
                        video: !customizeImage && data.url
                    });
                });
            });
        },
        "dom:[data-action = getStart]/click": function(e) {
            e.preventDefault();
            var me = this;
            me.publish("school/member_site_setting/Save", {
                "siteArea": "evc",
                "keyCode": "FirstTimeStudyPlanGL",
                "keyValue": "true"
            }).spread(function() {
                // reload
                me.publish("studyplan/evc/gl/load");
            });
        },
        "dom:[data-action = showVideo]/click": function(e) {
            e.preventDefault();
            this.publish("studyplan/evc/welcome-video/show");
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/gl-pl/welcome-pl/index.html',[],function() { return function template(data) { var o = "<div class=\"clearfix row\">\n    <div class=\"evc-studyplan-welcome-content\">\n        <h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568614\"></h2>\n        <p class=\"evc-studyplan-welcome-content-des\">\n            <span data-weave=\"school-ui-shared/widget/blurb\" data-blurb-ccl=\"school.courseware.blurb.568615\" data-blurb-id=\"568615\" data-text-en=\"In the private class you learn English with your own private teacher.\"></span><br>\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568616\"></span>\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568617\"></span><br>\n            <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568618\"></span>\n        </p>\n        <p>\n            <button type=\"button\" class=\"btn btn-primary\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"568611\" data-action=\"getStart\"></button>\n        </p>\n    </div>\n    <div class=\"evc-studyplan-welcome-image\">\n        "; if (data.video) { o += "\n            <a href=\"\" data-action=\"showVideo\">\n                <img src=\"" + data.cacheServer+ "/_imgs/evc/pl/studyplan/video.jpg\">\n            </a>\n            <p class=\"evc-studyplan-welcome-video-description\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"569775\"></p>\n            <div data-weave=\"school-ui-studyplan/widget/gl-pl/popupvideo/main\" data-video-url=\"" + data.video+ "\"></div>\n        "; } else if (data.image) { o += "\n            <img src=\"" + data.image+ "\">\n        "; } o += "\n    </div>\n</div>\n\n<style type=\"text/css\">\n    .evc-studyplan-welcome-content{\n        text-align: left;\n        float: left;\n        width: 510px;\n        padding: 0 15px;\n    }\n    .evc-studyplan-welcome-content > p{\n        margin-top: 30px;\n    }\n    .evc-studyplan-welcome-content-des{\n        line-height: 1.7em;\n    }\n    .evc-studyplan-welcome-image{\n        float: right;\n        padding: 0 30px 0 15px;\n        width: 375px;\n    }\n    .evc-studyplan-welcome-image > a{\n        display: inline-block;\n        margin-top: 7px;\n        margin-bottom: 10px;\n    }\n    .evc-studyplan-welcome-video-description {\n        font-style: italic;\n        text-align: center;\n    }\n</style>"; return o; }; });
define('school-ui-studyplan/widget/gl-pl/welcome-pl/main',[
    "jquery",
    "troopjs-ef/component/widget",
    "school-ui-studyplan/module",
    "template!./index.html"
], function ($, Widget, module, template) {
    "use strict";

	var MODULE_CONFIG = $.extend(true, {
		cacheServer: "",
	}, module.config() || {});

    var CCL_MEDIA = "ccl!'school.studyplan.pl.intro.media'";

    return Widget.extend({
        "sig/start": function() {
            var me = this;

            me.query(CCL_MEDIA).spread(function (cclMediaResult) {
                me.query(cclMediaResult.value).spread(function (data) {
                    var customizeImage = /\.jpg$|\.png$|\.gif$/i.test(data.url);
                    me.html(template, {
                        cacheServer: MODULE_CONFIG.cacheServer,
                        image: customizeImage && data.url,
                        video: !customizeImage && data.url
                    });
                });
            });
        },
        "dom:[data-action = getStart]/click": function(e) {
            e.preventDefault();
            var me = this;
            me.publish("school/member_site_setting/Save", {
                "siteArea": "evc",
                "keyCode": "FirstTimeStudyPlanPL",
                "keyValue": "true"
            }).spread(function() {
                // reload
                me.publish("studyplan/evc/pl/load");
            });
        },
        "dom:[data-action = showVideo]/click": function(e) {
            e.preventDefault();
            this.publish("studyplan/evc/welcome-video/show");
        }
    });
});

define('school-ui-studyplan/widget/initialization/hash-preview',[
	"jquery",
	"when",
	"troopjs-ef/component/widget",
	"poly"
], function studyplanHashHandle($, when, Widget, poly) {
	"use strict";

	var UNDEF;

	return Widget.extend({
		"hub/school/interface/get/activity-container/closeHash": function(){
			var me = this;

			return [{
				"prefix": "preview",
				"studyplan": 0,
				"studyplan_item": 0
			}]
		}
	});
});
define('school-ui-studyplan/widget/initialization/hash',[
	"jquery",
	"when",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/enum/studyplan-mode",
	"school-ui-studyplan/enum/studyplan-velocity",
	"poly"
], function studyplanHashHandle($, when, Widget, Parser, stateParser, studyplanMode, velocityState, poly) {
	"use strict";

	var UNDEF;

	var UNIT_ID = "unit_id",
		TEMPLATE_UNIT_ID = "template_unit_id",
		LESSON_ID = "lesson_id",
		TEMPLATE_LESSON_ID = "template_lesson_id",
		STEP_ID = "step_id",
		ACTIVITY_ID = "activity_id",
		PREFIX = "prefix",
		STUDYPLAN_ID = "studyplan_id",
		STUDYPLAN_ITEM_ID = "studyplan_item_id",
		RESULTS = "results",
		PLATFORM_VERSION = "platformVersion";

	var CONFIG = "config",
		STUDY = "study",
		PREFIX_TEMP = "template_unit;";

	function activityContainerToStudyplanHash(){
		var me = this;

		if(me[TEMPLATE_UNIT_ID] && me[TEMPLATE_LESSON_ID] && me[PREFIX] == "school") {
			me.query("campus_student_unit_studyplan!" + me[TEMPLATE_UNIT_ID] + ".studyPlan.items,.studyPlan.progress").spread(function(unitStudyplan){

				var studyplan_id = unitStudyplan.studyPlan.id;
				var studyplan = unitStudyplan.studyPlan;
				var studyplanItem_id;
				var expandLessonQ = [];

				if (unitStudyplan.mode === studyplanMode.Study) {
					studyplan.items.forEach(function(e, i){
						if(e.typeCode == "lesson") {
							expandLessonQ.push("pc_student_lesson_map!" + e.properties.templateLessonId);
						}
						else {
							expandLessonQ.push(UNDEF);
						}
					});

					me.query(expandLessonQ).spread(function(){
						Array.prototype.forEach.call(arguments, function (result, index) {
							if(result && result.lesson && (result.lesson.templateLessonId === me[TEMPLATE_LESSON_ID])){
								studyplanItem_id = studyplan.items[index].id;
							}
						});

						if(studyplanItem_id) {
							if(me[ACTIVITY_ID] || me[STEP_ID]) {
								me[STUDYPLAN_ID] = Parser.parseId(studyplan_id);
								me[STUDYPLAN_ITEM_ID] = Parser.parseId(studyplanItem_id);
							}
							else if(me[TEMPLATE_LESSON_ID]) {
								me.publish("load", {
									"prefix": STUDY,
									"studyplan": Parser.parseId(studyplan_id),
									"studyplan_item": Parser.parseId(studyplanItem_id)
								});
							}
						}
						else {
							loadConfig.call(me, PREFIX_TEMP + me[TEMPLATE_UNIT_ID]);
						}
					});

				}
				// other states (close activity container and use config flow)
				else {
					// for auto test tools
					if(window.location.search.indexOf("unlock") < 0) {
						loadConfig.call(me, PREFIX_TEMP + me[TEMPLATE_UNIT_ID]);
					}
				}

			});
		}
	}

	function findStudyplanItem (unitId) {
		var me = this;
		var queryString = "campus_student_unit_studyplan!" + unitId + ".studyPlan";

		me.query(queryString + ".items").spread(function(data){
			return data.mode === studyplanMode.Study ?
				me.query(queryString + ".progress") : [data];
		}).spread(function(data){
			var studyplan = data.studyPlan;
			var studyplanID =  Parser.parseId(studyplan.id);
			switch(data.mode) {
				case studyplanMode.Create: //create
					me.publish("load", {
						"prefix": CONFIG,
						"unit": PREFIX_TEMP + studyplan.properties.templateUnitId
					});
					break;
				case studyplanMode.Locked: //locked
					me.publish("load", {
						"prefix" : STUDY,
						"studyplan" : studyplanID,
						"studyplan_item" : UNDEF
					});
					break;
				case studyplanMode.Study: //study
					var suggestedItems = studyplan.items.filter(function (item) {
						return studyplan.progress && item.itemIndex === studyplan.progress.properties.suggestedItemIndex;
					});
					var suggestedItem = suggestedItems.length ? suggestedItems[0] : studyplan.items[0];
					var studyplanItemID = Parser.parseId(suggestedItem.id);

					me.publish("load", {
						"prefix" : STUDY,
						"studyplan" : studyplanID,
						"studyplan_item" : studyplanItemID
					});
					break;
			}
		});
	}

	function loadConfig(unitID) {
		this.publish("load", {
			"prefix": CONFIG,
			"unit": unitID,
			"step": UNDEF // close activity
		});
	}

	function hashExceptionHandle(platformVersion, prefix, results) {
		var me = this;

		if(prefix && results && platformVersion && platformVersion.version === "2.0") {
			switch (prefix) {
				case CONFIG:
					me.query("campus_student_unit_studyplan!" + results.unit.templateUnitId + ".studyPlan.items,.studyPlan.progress").spread(function(data){
						var studyplan = data.studyPlan;

						if (data.mode !== studyplanMode.Create) {
							var suggestedItems = studyplan.items.filter(function (item) {
								return studyplan.progress && studyplan.progress.properties && item.itemIndex === studyplan.progress.properties.suggestedItemIndex;
							});
							var suggestedItem = suggestedItems.length ? suggestedItems[0] : studyplan.items[0];

							me.publish("load", {
								"prefix": "study",
								"studyplan": Parser.parseId(studyplan.id),
								"studyplan_item": data.mode === studyplanMode.Locked ?
									UNDEF :
									Parser.parseId(suggestedItem.id)
							});
						}
					});
					break;
				case STUDY:
					if(!results.studyplan) {
						findStudyplanItem.call(me, "current");
					}
					else if(results.studyplan && !results.studyplan_item){
						if(results.unit_studyplan.mode === studyplanMode.Study){
							findStudyplanItem.call(me, results.studyplan.properties.templateUnitId);
						}
					}
					else if(results.studyplan && results.studyplan_item) {
						if(results.studyplan_item.typeCode !== "goal") {
							me.query(results.studyplan.id + ".progress").spread(function(studyplan){
								if(velocityState.Crashed === studyplan.progress.properties.velocity){
									var goalId;
									studyplan.items.forEach(function(item){
										if(item.typeCode === "goal"){
											goalId = Parser.parseId(item.id);
										}
									});
									//check the goal crashed to change hash to goal
									me.publish("load", {
										"studyplan_item": goalId
									});
								}
							});

						}
						else if(me[RESULTS] && me[RESULTS].studyplan && me[RESULTS].studyplan.id === results.studyplan.id){
							//when load goal item
							//update the sequence to catch the "Crshed" state and lock the sequence
							me.publish("studyplan/sequence/update");
						}
					}
					break;
			}
		}

		me[RESULTS] = results;
	}

	return Widget.extend({
		"hub:memory/context": function(context, courseEnroll, platformVersion){
			var me = this;
			hashExceptionHandle.call(me, me[PLATFORM_VERSION] = platformVersion, me[PREFIX], me[RESULTS]);
		},

		"hub:memory/load/prefix": function(prefix) {
			var me = this;
			me[PREFIX] = prefix;
			activityContainerToStudyplanHash.call(me);
		},

		"hub:memory/load/unit": function(unit){
			var me = this;
			if(!unit) {
				return;
			}
			me[UNIT_ID] = Parser.parseId(unit.id);
			me[TEMPLATE_UNIT_ID] = unit.templateUnitId;
			activityContainerToStudyplanHash.call(me);
		},

		"hub:memory/load/lesson": function(lesson){
			var me = this;
			if(!lesson) {
				return;
			}
			me[LESSON_ID] = Parser.parseId(lesson.id);
			me[TEMPLATE_LESSON_ID] = lesson.templateLessonId;
			activityContainerToStudyplanHash.call(me);
		},

		"hub:memory/load/step": function(step){
			var me = this;
			if(!step) {
				return;
			}
			me[STEP_ID] = Parser.parseId(step.id);
		},

		"hub:memory/load/activity": function(activity){
			var me = this;
			if(!activity) {
				return;
			}
			me[ACTIVITY_ID] = Parser.parseId(activity.id);
		},

		"hub:memory/load/studyplan": function(studyplan){
			var me = this;
			if(!studyplan){
				return;
			}
			me[STUDYPLAN_ID] = Parser.parseId(studyplan.id);
		},

		"hub:memory/load/studyplan_item": function(studyplan_item){
			var me = this;
			if(!studyplan_item){
				return;
			}
			me[STUDYPLAN_ITEM_ID] = Parser.parseId(studyplan_item.id);
		},

		"hub:memory/route": function(uri){
			var me = this;
			var _prefix = me[PREFIX];

			me[PREFIX] = uri.path ? uri.path[0] : STUDY;
			if(_prefix !== me[PREFIX]){
				hashExceptionHandle.call(me, me[PLATFORM_VERSION], me[PREFIX], me[RESULTS]);
			}
		},

		"hub/enrollment/update": function() {
			var me = this;

			return me.publish("load", {
                "studyplan": UNDEF,
                "studyplan_item": UNDEF,
				"command": UNDEF,
				"prefix" : UNDEF,
				"unit" : UNDEF
            });
		},

		"hub:memory/load/results": function(results) {
			var me = this;

			if (!results) {
				return;
			}

			hashExceptionHandle.call(me, me[PLATFORM_VERSION], me[PREFIX] = results.prefix, results);
		},

		"hub:memory/load/config" : function(unitID) {
			var me = this;
			findStudyplanItem.call(me, unitID);
		},

		"hub/school/interface/get/activity-container/closeHash": function(){
			var me = this;

			return [{
				"prefix": STUDY,
				"studyplan": me[STUDYPLAN_ID],
				"studyplan_item": me[STUDYPLAN_ITEM_ID]
			}]
		}
	});
});

/**
 * TroopJS requirejs/multiversion
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
define('troopjs-requirejs/multiversion',[],function MultiversionModule() {
	"use strict";

	var RE = /(.+?)#(.+)$/;
	var CONTEXTS = require.s.contexts;

	return {
		"load" : function (name, parentRequire, onload) {
			var context;
			var matches;

			// if name matches RE
			// matches[0] : module name with context - "module/name#context"
			// matches[1] : module name - "module/name"
			// matches[2] : context name - "context"
			if ((matches = RE.exec(name)) !== null) {
				name = matches[1];
				context = matches[2];

				if (context in CONTEXTS) {
					parentRequire = CONTEXTS[context].require;
				}
			}

			parentRequire([ name ], function (module) {
				onload(module);
			}, onload.error);
		}
	};
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/initialization/initialization.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-init-container\">\n\t<div class=\"ets-sp-study\" data-weave=\"school-ui-studyplan/widget/studyplan/main\"></div>\n</div>\n<div class=\"ets-sp-loading ets-none\">\n\t<div class=\"ets-inner\">\n\t\t<div class=\"ets-inner-cell\">\n\t\t\t<div class=\"ets-icon\">\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"ets-backdrop\"></div>\n</div>\n<div data-weave=\"school-ui-shared/plugins/http-request-handling/main\"></div>"; return o; }; });
define('school-ui-studyplan/widget/initialization/main',[
	"when",
	"logger",
	"poly",
	"jquery",
	"client-tracking",
	"mv!jquery#troopjs-1.0",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-shared/enum/course-type",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/server-time",
	"school-ui-shared/plugins/techcheck/techcheck-render",
	"template!./initialization.html"
], function SchoolModule(
	when,
	Logger,
	polyArray,
	$,
	ct,
	jqueryInTroop1,
	Widget,
	loom,
	weave,
	courseType,
	Parser,
	serverTime,
	techcheckRender,
	tInit
) {
	"use strict";

	var UNDEF;

	var $ELEMENT = "$element";

	var SEL_HTML = "html";

	var PAGE_CONTEXT_DATA = "_page_context_data";
	var RENDERED = "_rendered";


	return Widget.extend(function(){
		//tracking context data
		this[PAGE_CONTEXT_DATA] = {};
	},{
		"hub:memory/context" : function (context, courseEnroll, platformVersion){
			var me = this;

			if(platformVersion.version === "2.0") {
				if(!me[RENDERED]) {
					me.query("ccl!'school.activity.interaction.sampleRate'").spread(function(data){
						//FOR ACT_INTERACTION TRACKING/////////////
						var rate = parseFloat(data.value);
						me["_isSample"] = (context.user.member_id % 100 < (rate * 100));
						////////////////////////////////////////////
						me.html(tInit).then(function(){
							me[RENDERED] = true;
							jqueryInTroop1("[data-weave-1]").each(function(entryIndex, entry){
								var $e = jqueryInTroop1(entry);
								$e.attr("data-weave", $e.attr("data-weave-1")).weave();
							});
						});
					});
				}
			}
		},

		//FOR ACT_INTERACTION TRACKING/////////////
		"hub:memory/logger/troopjs1": function (msg) {
			this["_isSample"] && Logger.log(msg);
		},
		////////////////////////////////////////////

		"hub:memory/load/results": function (results) {
			var NULL = "null";
			var me = this;
			var updated;
			var pageData = {
				"unitID" : NULL,
				"levelID" : NULL,
				"lessonID" : NULL
			};

			//set pageData for tracking
			Object.keys(results).forEach(function(name){
				var data = results[name];
				if(data){
					switch (name){
						case "level":
							data.templateLevelId && (pageData.levelID = data.templateLevelId);
							break;
						case "unit":
							data.templateUnitId && (pageData.unitID = data.templateUnitId);
							break;
						case "lesson":
							data.templateLessonId && (pageData.lessonID = data.templateLessonId);
							break;
					}
				}
			});

			Object.keys(pageData).forEach(function(name){
				updated = updated || pageData[name] !== me[PAGE_CONTEXT_DATA]["page." + name];
				me[PAGE_CONTEXT_DATA]["page." + name] = pageData[name];
			});

			updated && ct.usercontext(me[PAGE_CONTEXT_DATA]);
		},

		"hub/school/toggle/overflow":function toggleOverflow(style){
			$(SEL_HTML).css('overflow',style);
		},

		"hub:memory/school/spinner": function showSpinner(promise){
			var me = this;

			me.task(function (resolve, reject, progress) {
				return promise
					.then(resolve, reject, progress);
			});
		},

		"hub/tracking/useraction" : function onTrackingUserAction(data){
			ct.useraction(data);
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/migration/main.html',[],function() { return function template(data) { var o = "<div class=\"modal fade ets-sp-migration-progress-modal\" data-backdrop=\"static\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content\">\n\t\t\t<div class=\"modal-body\">\n\t\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"660194\" data-text-en=\"We are upgrading your school to the latest version, this might take a few seconds. Please don't leave this page until the upgrade is complated.\"></p>\n\t\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"660195\" data-text-en=\"Thank you for your patience!\"></p>\n\t\t\t\t<div class=\"progress progress-striped active\">\n\t\t\t\t\t<div class=\"progress-bar\" role=\"progressbar\">\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n<div class=\"modal fade ets-sp-migration-fail-modal\" data-backdrop=\"static\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content\">\n\t\t\t<div class=\"modal-body\">\n\t\t\t\t<p><span class=\"glyphicon glyphicon-remove\"></span></p>\n\t\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"660196\" data-text-en=\"Oops! Something went wrong during the upgrade of your school. We apologise for the inconvenience, please contact customer support.\"></p>\n\t\t\t\t<p><a href=\"/customerservice/contactus/inschool\"><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"660199\" data-text-en=\"contact customer support\"></span></a></p>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n<div class=\"modal-backdrop fade in hidden\"></div>"; return o; }; });
define('school-ui-studyplan/widget/migration/main',[
	"jquery",
	"jquery.gudstrap",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/update-helper",
	"template!./main.html"
], function($, $GUD, Widget, UpdateHelper, tMain){
	"use strict";

	var $ELEMENT = "$element";

	var RETRY = "_retry";

	var CHECK_STATUS_DURATION = 100;

	var RETRY_TIMES = 3;

	var URL_SCHOOL_HANDLE = "/school/course/currentcourse/handler.aspx";

	var SEL_MODAL = ".modal",
		SEL_PROGRESS_BAR = ".progress-bar",
		SEL_MIGRATION_PROGRESS_MODAL = ".ets-sp-migration-progress-modal",
		SEL_MIGRATION_FAIL_MODAL = ".ets-sp-migration-fail-modal";

	function hideModal(){
		var me = this;
		me[$ELEMENT].find(SEL_MODAL).modal('hide');
	}

	function showProgressModal(progress) {
		var me = this;
		showModal.call(me, SEL_MIGRATION_PROGRESS_MODAL)
			.find(SEL_PROGRESS_BAR).width(progress - 5 + "%").text(progress + "%");

		(progress === 100) && gotoSchoolHandle();
	}

	function showFailModal() {
		var me = this;
		showModal.call(me, SEL_MIGRATION_FAIL_MODAL);
	}

	function showModal(modal){
		var me = this;
		var $modal = me[$ELEMENT].find(modal);

		$modal.on('show.bs.modal', function($event) {
			me[$ELEMENT].find(".modal-backdrop").removeClass("hidden");
		}).on('hidden.bs.modal', function($event) {
			me[$ELEMENT].find(".modal-backdrop").addClass("hidden");
		});

		if(!$modal.hasClass("in")) {
			hideModal.call(me);

			$modal.modal({
				keyboard: false
			});
		}

		return $modal;
	}

	function gotoSchoolHandle(){
		window.open(URL_SCHOOL_HANDLE, '_self');
	}

	function execMigrate(){
		var me = this;

		if(me[RETRY] >= RETRY_TIMES) {
			showFailModal.call(me)
		}
		else {
			UpdateHelper.platformMigrate().then(function(data){
				me[RETRY]++;
				switch (data.response) {
					case "DONE":
						gotoSchoolHandle();
						break;
					case "OK":
						checkStatus.call(me);
						break;
					case "ERROR":
						showFailModal.call(me);
						break;
					case "RETRY":
						execMigrate.call(me);
						break;
					default:
						showFailModal.call(me);
						break;
				}
			});
		}
	}

	function checkStatus(){
		var me = this;

		var checkAgain = function(){
			window.setTimeout(function(){
				checkStatus.call(me);
			}, CHECK_STATUS_DURATION);
		};

		me.query("platform_migration!current").spread(function(mig_status){
			switch (mig_status.status) {
				case "":
					execMigrate.call(me);
					break;
				case "QUEUED":
				case "STARTED":
					showProgressModal.call(me, mig_status.progress);
					checkAgain();
					break;
				case "TIMEOUT":
				case "CONFLICTED":
				case "ERROR":
					showFailModal.call(me);
					break;
				case "DONE":
					// Cause backend service have some unknown issue here
					// Sometime service will return "DONE" state but progress isn't 100
					// So we fake the progress is 100 to work around the issue.
					showProgressModal.call(me, 100);
					break;
				case "CANCELLED":
				case "RESET":
					execMigrate.call(me);
					break;
				default:
					showFailModal.call(me);
					break;
			}
		});
	}

	return Widget.extend({
		"hub:memory/context" : function(context, courseEnroll, platformVersion){
			var me = this;

			if(platformVersion.version === "1.0") {
				return me.html(tMain).then(function(){
					me[RETRY] = 0;
					checkStatus.call(me);
				});
			}
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/config/config.html',[],function() { return function template(data) { var o = "";
	var unit = data.unit;
o += "\n<div class=\"ets-sp-cfg\">\n\t<div class=\"ets-sp-cfg-hd\">\n\t\t<h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656054\" data-text-en=\"set up unit plan\"></h2>\n\t\t<h5 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656055\" data-text-en=\"Estimated 6 hours to complete the unit\"></h5>\n\t</div>\n\t<div class=\"ets-sp-cfg-bd\">\n        <div data-weave=\"school-ui-studyplan/shared/pace-config/main\" data-mode=\"" +data.mode+ "\" data-config='" + JSON.stringify(data.properties).replace(/\'/g, "&#39;")+ "'></div>\n\t</div>\n\t<div class=\"ets-sp-cfg-ft\">\n\t\t<button type=\"button\" class=\"btn btn-primary btn-m btn-block ets-sp-cfg-create\"><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656059\" data-text-en=\"Let's go\"></span> <i class=\"glyphicon icon-caret-right\"></i></button>\n\t</div>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/config/main',[
	"jquery",
	"poly",
	"json2",
	"moment",
	"when",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/studyplan-update-helper",
	"school-ui-studyplan/enum/studyplan-mode",
	"school-ui-shared/enum/moment-language",
	"template!./config.html"
], function ($, Poly, JSON, Moment, when, Widget, Parser, UpdateHelper, studyplanMode, momentLang, tConfig) {
	"use strict";

	var UNIT = "_unit";
	var UNIT_STUDYPLAN = "_unit_studyplan";
	var SP_TEMPLATE = "_studyplan_template";
	var GOAL = "_goal";
	var SELECTED = 'selected';

	function render(unit, unit_studyplan) {
		var me = this;
		var renderData = {};

		if (!unit || !unit_studyplan) {
			return;
		}

		renderData.unit = unit;

		var studyplan = me[SP_TEMPLATE] = $.extend(true, {}, unit_studyplan.studyPlan);

		if (unit_studyplan.mode === studyplanMode.Create) {
			studyplan.items.forEach(function (e) {
				if (e.typeCode === "goal") {
					me[GOAL] = e;
					renderData.properties = e.properties;
				}
			});
			return me.query('ccl!"school.studyplan.pace.mode"', 'member_site_setting!"school;studyplan.newui.enabled"').spread(function (
				ccl,
				newuiEnable
			) {
				renderData.mode = ccl.value;
				if (ccl.value === 'view') {
					setViewModeForPaces(renderData.properties.paces);
				}

				if (newuiEnable.value === 'true') {
					return UpdateHelper.createStudyplan({
						"studentStudyPlanTemplate": studyplan
					})
						.then(function (data) {
							var studyplanId = data.id;
							return me.publish("school/clearCache", unit_studyplan.id) // SPC-7224
								.then(function () {
									me.publish("load", {
										"prefix": "study",
										"studyplan": Parser.parseId(studyplanId)
									});
								});
						});
				} else {
					return me.html(tConfig, renderData);
				}
			});
		}
	}

	function setViewModeForPaces(paces) {
		for (var i = 0, ii = paces.length; i < ii; i++) {
			var pace = paces[i];
			if (SELECTED in pace) {
				pace[SELECTED] = false;
			}
		}
		paces[ii - 1][SELECTED] = true;
		return paces;
	}

	return Widget.extend({
		"hub:memory/load/unit": function (unit) {
			var me = this;
			if (!unit) {
				return;
			}

			render.call(me, me[UNIT] = unit, me[UNIT_STUDYPLAN]);
		},

		"hub:memory/load/unit_studyplan": function (unit_studyplan) {
			var me = this;
			if (!unit_studyplan) {
				return;
			}

			render.call(me, me[UNIT], me[UNIT_STUDYPLAN] = unit_studyplan);
		},

		"hub/config/pace-change": function (paces) {
			var me = this;
			me[GOAL].properties.paces = paces;
		},

		"dom:.ets-sp-cfg-create/click": function (evt) {
			var me = this;
			var noSelectedInConfig = me[GOAL].properties.paces.every(function (e) {
				return !e.selected;
			});

			// if there is not any selected pace, for prevent unexpected result after creation.
			// we select the first pace by default. and send a front-end event log
			if (noSelectedInConfig) {
				me.log("Studyplan exception when creating, goal properties is : " + JSON.stringify(me[GOAL].properties));
				me[GOAL].properties.paces[0].selected = true;
			}

			$(evt.currentTarget).prop("disabled", true);

			var unit_studyplan = me[UNIT_STUDYPLAN];

			UpdateHelper.createStudyplan({
				"studentStudyPlanTemplate": me[SP_TEMPLATE]
			}).then(function (data) {

				var studyplanId = data.id;

				// make sure update context first and jump page
				me.publish("context/update/context")
					.then(function () {
						return me.publish("school/clearCache", unit_studyplan.id); // SPC-7224
					})
					.then(function () {
						me.publish("load", {
							"prefix": "study",
							"studyplan": Parser.parseId(studyplanId)
						});
					});

			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/goal.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-cfg cp-cfg " +data.status+ "\">\n\t<div class=\"ets-sp-cfg-hd\">\n\t\t<!--\n\t\tthe progress widget will render here\n\t\t-->\n\t</div>\n\t<div class=\"ets-sp-cfg-bd cp-pace-bd\">\n\t\t<!--\n\t\tthe pace config widget will render here\n\t\t-->\n\t</div>\n\t<div class=\"ets-sp-cfg-ft\">\n\t\t<!--\n\t\tthe restart & moveon widget will render here\n\t\t-->\n\t</div>\n\t"; if(!data.isUnitCompleted) { o += "\n\t\t<div class=\"ets-sp-goal-locked\">\n\t\t\t<h1><i class=\"ets-icon-lock\"></i></h1>\n\t\t\t<h1 data-text-en=\"THE GOAL IS LOCKED\" data-blurb-id=\"724606\" data-weave=\"troopjs-ef/blurb/widget\"></h1>\n\t\t\t<p class=\"ets-sp-goal-tips\" data-text-en=\"You must complete all lessons in this unit before continuing on.\" data-blurb-id=\"724607\" data-weave=\"troopjs-ef/blurb/widget\"></p>\n\t\t</div>\n\t"; } o += "\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/main',[
	"when",
	"jquery",
	"json2",
	"lodash",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-shared/utils/progress-state",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/enum/studyplan-state",
	"school-ui-studyplan/enum/studyplan-item-state",
	"school-ui-studyplan/enum/studyplan-velocity",
	"template!./goal.html"
], function (when, $, JSON, _, Widget, loom, weave, progressState, stateParser, studyplanState, itemState, velocityState, tGoal) {
	"use strict";

	var $ELEMENT = "$element";

	var WIDGET_PACE = "school-ui-studyplan/shared/cp-pace-config/main";
	var WIDGET_PROGRESS = "school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/progress/main";
	var WIDGET_MOVEON = "school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/moveon/main";

	var SEL_PROGRESS_HOLDER = ".ets-sp-cfg-hd";
	var SEL_ACTIVITY_HOLDER = ".ets-sp-cfg-ft";
	var SEL_PACE_HOLDER = ".ets-sp-cfg-bd";
	var SEL_CONTAINER = ".ets-sp-cfg";

	var DATA_GOAL = "_data_goal";

	var CCL_ENABLE_LEVELTEST = 'ccl!"school.courseware.enableleveltest"';
	var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

	function hasState(state) {
		return this & state;
	}

	function isLessonItem(item) {
		return item.typeCode === 'lesson';
	}

	function completedItem(item) {
		return hasState.call(item.progress.state, itemState.Completed);
	}

	function isUnitComplete(unitStudyPlan, studyplanState){
		return unitStudyPlan.progress.state === studyplanState.Completed
	}

	return Widget.extend(function ($element, path, itemData) {
		var me = this;
		me[DATA_GOAL] = itemData;
	}, {
		"hub:memory/load/results": function (results) {
			var studyplan = results.studyplan;
			if (studyplan) {
				var me = this;
				var isNopace;
				me[DATA_GOAL].properties.paces.forEach(function (e) {
					if (e.pacePoints === 0) {
						isNopace = e.selected;
					}
				});

				return when.all([
					me.query(studyplan.id + ".progress,.items.progress"),
					me.query('campus_student_unit_studyplan!current.studyPlan.progress,.studyPlan.items.progress,.studentUnit.children.progress.detail,.studentUnit.children.lessonImage,.studentUnit.parent.parent')
				]).spread(function (studyplanData, unit_studyplan) {
					var statusPromise = me.getStatusKey(studyplan, isNopace, results, unit_studyplan[0]);
					var isUnitCompleted = isUnitComplete(studyplan, studyplanState);
					statusPromise.then(function (status) {
						me.html(tGoal, {
							status: "cp-cfg-" + status.key.toLowerCase(),
							isUnitCompleted: isUnitCompleted
						}).then(function () {
							var $moveon;
							var $progress;
							var $pace;

							var studyplan = studyplanData[0];
							var goal;
							if(!isUnitCompleted){
								return;
							}

							studyplan.items.forEach(function (item) {
								if (item.typeCode === "goal") {
									goal = item;
								}
							});

							//weave progress widget
							me[$ELEMENT].find(SEL_PROGRESS_HOLDER).append(
								$progress = $("<div></div>")
									.attr(loom.weave, WIDGET_PROGRESS)
									.data("studyplan", studyplan)
									.data("status", status)
									.data("config", $.extend({}, goal && goal.properties, goal && goal.progress.properties))
							);
							$progress.weave();

							// pace and end status content
							me[$ELEMENT].find(SEL_PACE_HOLDER).append(
								$pace = $("<div></div>")
									.attr(loom.weave, WIDGET_PACE)
									.data("mode", "view")
									.data("status", status)
									.data("studyplan", studyplan)
									.data("config", $.extend({}, goal && goal.properties, goal && goal.progress.properties))
							);
							$pace.weave();

							// action
							me[$ELEMENT].find(SEL_ACTIVITY_HOLDER).append(
								$moveon = $("<div></div>")
									.attr(loom.weave, WIDGET_MOVEON)
									.data("studyplan", studyplan)
									.data("status", status)
							);
							$moveon.weave();
						});
					});
				});
			}
		},

		'hub/studyplan/goal/body/status/update': function (stauts) {
			var me = this;
			if (stauts.action === 0) {
				me[$ELEMENT].find(SEL_CONTAINER).removeClass(stauts.class);
			} else {
				me[$ELEMENT].find(SEL_CONTAINER).addClass(stauts.class);
			}
		},

		"getStatusKey": function (studyplan, isNopace, results, unit_studyplan) {
			var me = this;

			return me.checkIfTestIsAvailable({
				studyPlan: unit_studyplan.studyPlan,
				course: unit_studyplan.studentUnit.parent.parent,
				level: unit_studyplan.studentUnit.parent,
				unit: unit_studyplan.studentUnit
			}).then(function (testResult) {

				var unit = results.unit;
				var units = unit.parent.children;
				var unitLen = units.length;

				var completed = isUnitComplete(studyplan, studyplanState) ? 'Completed' : '';
				var nopace = isNopace ? 'Nopace' : '';
				var stateCollection = stateParser.parseFlag(velocityState, studyplan.progress.properties.velocity);
				var velocity = '';
				_.find(stateCollection, function (value, key) {
					if (value) {
						velocity = key;
					}
				});

				var key = completed || nopace || velocity;
				var code = key.toLowerCase();

				if (completed) {
					code = "unit_complete";

					if (unit.templateUnitId === units[unitLen - 1].templateUnitId) {
						code = "all_unit_complete";
					}

					if (unit.templateUnitId === units[unitLen - 1].templateUnitId &&
						testResult.levelTestIsDone) {
						code = "level_complete";
					}

					// for spin course
					if (unit.templateUnitId === units[unitLen - 1].templateUnitId &&
						results.course.courseTypeCode !== 'GE') {
						code = "course_change";
					}
				}

				return {
					key: key,
					code: code
				};
			});
		},

		checkLevelIsCompleted: _.memoize(function (data) {
			var studyPlan = data.studyPlan;
			var level = data.level;
			var unit = data.unit;

			var lessons = _.filter(studyPlan.items, isLessonItem);
			var completedLessons = _.filter(lessons, completedItem);
			var allLessonsAreCompleted = lessons.length === completedLessons.length;
			var unitIsCompleted = studyPlan.progress && hasState.call(studyPlan.progress.state, studyplanState.Completed);
			var isLastUnit = (level.children.length - 1) === _.indexOf(level.children, unit);

			return isLastUnit && unitIsCompleted && allLessonsAreCompleted;
		}),

		checkIfTestIsAvailable: function (data) {
			var me = this;
			var level = data.level;
			var resultDefer = when.defer();
			var result = {};
			if (me.checkLevelIsCompleted(data)) {
				me.query(CCL_ENABLE_LEVELTEST, MSS_LEVEL_TEST_VERSION).spread(function (cclEnableLevelTest, mssLevelTestVersion) {
					var enableLevelTest = cclEnableLevelTest.value.toLowerCase() === 'true';
					var levelTestVersion = parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);

					result.canDoLevelTest = enableLevelTest;
					if (enableLevelTest) {
						return levelTestVersion === 1 ?
							me.query('leveltest_overview!' + level.levelCode).spread(function (leveltest) {
								result.levelTestIsDone = leveltest.hasPassed;
								resultDefer.resolve(result);
							}) :
							me.query(level.id + '.levelTest.progress').spread(function (level) {
								result.levelTestIsDone = Boolean(level.levelTest && progressState.hasPassed(level.levelTest.progress.state));
								resultDefer.resolve(result);
							});
					}
					resultDefer.resolve(result);
				});
			} else {
				resultDefer.resolve({
					canDoLevelTest: false,
					levelTestIsDone: false
				});
			}
			return resultDefer.promise;
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/moveon/moveon.html',[],function() { return function template(data) { var o = ""; if(data.status.code === 'all_unit_complete'){o += "\n<div class=\"cp-studyplan-action\">\n\t<p class=\"cp-studyplan-or\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695094\"></p>\n\t<div class=\"cp-action-move\">\n\t\t"; if(data.isLastLevel) {o += "\n\t\t<span class=\"cp-select-course\" data-weave=\"troopjs-ef/blurb/widget\" data-link=\"" +data.changeCourseLink+ "\" data-blurb-id=\"" +data.blurbIds.cpSelectCourse+ "\" data-action=\"select/course\">\n\t\t</span>\n\t\t";}else{o += "\n\t\t<span class=\"cp-next-level\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695074\" data-action=\"next/level\">\n\t\t</span>\n\t\t";}o += "\n\t\t<span class=\"ets-icon-cp-arrow-right\"></span>\n\t</div>\n</div>\n"; }  return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/moveon/main',[
    "school-ui-studyplan/module",
    "jquery",
    "when",
    "poly",
    "lodash",
    "troopjs-ef/component/widget",
    "client-tracking",
    "school-ui-shared/enum/course-type",
    "school-ui-shared/utils/typeid-parser",
    "school-ui-shared/utils/progress-state",
    "school-ui-shared/utils/update-helper",
    "school-ui-studyplan/enum/studyplan-item-state",
    "school-ui-studyplan/utils/state-parser",
    "template!./moveon.html"
], function (module, $, when, poly, _, Widget, ct, CourseType, typeidParser, progressState, updateHelper, itemState, stateParser, tMoveon) {
    "use strict";

    var UNDEF;
    var CCL_ENABLE_LEVELTEST = 'ccl!"school.courseware.enableleveltest"';
    var CCL_ENABLE_GOTO_NEXT_LEVEL = 'ccl!"school.courseware.enableSelectNextLevel"';
    var CCL_ENABLE_SELECT_COURSE = 'ccl!"school.menu.changecourse.display"';
    var CCL_CHANGE_COURSE_LINK = "ccl!'school.studyplan.changeCourse.link'";
    var Q_CURRENT_STUDYPLAN = "campus_student_unit_studyplan!current.studyPlan.items,.studyPlan.progress";
    var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

    var DATA_STUDYPLAN = "_data_studyplan";
    var $ELEMENT = "$element";
    var STATUS = "_data_status";

    var HUB_SHOW_TIPS = "studyplan/goal/moveon-tips/show";

    var MODULE_CONFIG = _.merge({
        blurbIds: {
            cpSelectCourse: "656560"
        },
	    changeCourseUrl: undefined
    }, module.config() || {});

    function isDemoAndNeedToLimit (common_context, courseTypeCode) {
        return common_context.partnercode.value.toLowerCase() === "demo" &&
                (CourseType.isGECourse(courseTypeCode) || CourseType.isBECourse(courseTypeCode))
    }

    function filterData() {
        var me = this;
        var levels = me.course.children;
        var level  = me.level;
        var levelLen = levels.length;
        var unit = me.unit;
        var units = unit.parent.children;
        var unitLen = units.length;
        var config = {};

        // INDB2B SPECIAL LOGIC
        if(unit.templateUnitId === units[unitLen-1].templateUnitId) {
            config.isLastUnit = true;

            if(me.isGE) {
                config.levelTestId = (me.levelTestVersion === 1 ? level.legacyLevelId : level.templateLevelId);
                if(level.templateLevelId === levels[levelLen-1].templateLevelId) {
                    config.isLastLevel = true;
                }
            } else {
                // For SPIN course, alway let student select course
                config.isLastLevel = true;
            }
        } else {
            units.every(function(v, i) {
                if(v.templateUnitId === unit.templateUnitId) {
                    config.nextUnitIndex = i+2;
                    me.nextUnitId = units[i+1].templateUnitId;
                    return false;
                }
               return true;
            });

        }

        //for demo, only show the select course button
        if(isDemoAndNeedToLimit(me.common_context, me.course.courseTypeCode)){
          config.isLastUnit = true;
          config.isLastLevel = true;
        }

        return config;
    }

    function render() {
        var me = this;
        var studyplan = me[DATA_STUDYPLAN];
        if(!me.course || !me.level || !me.unit || !me.common_context || !me.levelTestVersion) return;

        me.query(
            CCL_ENABLE_LEVELTEST,
            CCL_ENABLE_GOTO_NEXT_LEVEL,
            CCL_ENABLE_SELECT_COURSE,
            CCL_CHANGE_COURSE_LINK,
            Q_CURRENT_STUDYPLAN,
            me.level.id + ".children"
        )
        .spread(function(
            enableLevelTest,
            enableChangeLevel,
            enableSelectCourse,
            changeCourseLink,
            currentStudyPlan,
            navgationUnits
            ) {
            var goalItem;

            var data = filterData.call(me);
            data.isGE = me.isGE;
            data.enableLevelTest = enableLevelTest && enableLevelTest.value.toLowerCase() === "true";
            data.enableChangeLevel = enableChangeLevel && enableChangeLevel.value.toLowerCase() === "true";
            data.enableSelectCourse = enableSelectCourse && enableSelectCourse.value.toLowerCase() === "true";
            data.changeCourseLink = MODULE_CONFIG.changeCourseUrl || changeCourseLink.value;
            data.status = me[STATUS];
            data.blurbIds = MODULE_CONFIG.blurbIds;

            data.optionalItems = [];

            //check items status
            studyplan.items.forEach(function(item){
                var state;
                if(item.typeCode !== "goal" && item.isOptional){
                    state = stateParser.parseFlag(itemState, item.progress.state);
                    if(!state.Completed){
                        data.optionalItems.push({itemData:item, locked:state.Locked});
                    }
                }
                else{
                    goalItem = item;
                }
            });

            if(stateParser.parseFlag(itemState, goalItem.progress.state).Completed){
                if(data.isLastLevel && data.isLastUnit){
                    //blurb en : You've completed the level.
                    me.query("blurb!656580").spread(function(blurb){
                        blurb && me.publish(HUB_SHOW_TIPS, blurb.translation);
                    });
                }
                else if(data.isLastUnit){
                    //blurb en : You've unlocked the next level
                    me.query("blurb!656556").spread(function(blurb){
                        blurb && me.publish(HUB_SHOW_TIPS, blurb.translation);
                    });
                }
                else{
                    //blurb en : You've unlocked the next unit
                    me.query("blurb!656555").spread(function(blurb){
                        blurb && me.publish(HUB_SHOW_TIPS, blurb.translation);
                    });
                }
            }

            data.hasActiveSPInCurrentLevel = navgationUnits.children.reduce(function(prev, curr){
                return prev || (curr.templateUnitId === currentStudyPlan.studyPlan.properties.templateUnitId);
            }, false);

            me.html(tMoveon, data);

        });
    }

    function route(unitId) {
        return this.publish("load/config", typeidParser.parseId(unitId));
    }

    function patchEnrollment() {    //SPC-7718 send additional update enrollment if backend auto moveon failed
        var me = this;
        return me.query('student_course_enrollment!current', me.unit.progress.id).spread(function (currentEnrollment, currentUnitProgress) {
            if (me.nextUnitId && currentEnrollment.studentUnitId === me.unit.studentUnitId && progressState.hasPassed(currentUnitProgress.state)) {
                return updateHelper.updateEnrollment({templateId: me.nextUnitId});
            }
        });
    }

    return Widget.extend(function(){
        var me = this;
        me[DATA_STUDYPLAN] = me[$ELEMENT].data("studyplan");
        me[STATUS] = me[$ELEMENT].data("status");

        me.query(MSS_LEVEL_TEST_VERSION).spread(function (mssLevelTestVersion) {
            me.levelTestVersion = parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);
            render.call(me);
        });
    }, {
        "hub:memory/common_context" : function(common_context){
          var me = this;
          if(common_context){
            me.common_context = common_context.values;
            render.call(me);
          }
        },
        "hub:memory/load/results": function(data) {
            var me = this;
            if( data && (   me.course !== data.course ||
                            me.level !== data.level ||
                            me.unit !== data.unit )
                ){
                me.studyplan = data.studyplan;
                me.isGE = CourseType.isGECourse((data.course || {}).courseTypeCode);
                me.course = data.course;
                me.level = data.level;
                me.unit = data.unit;
                render.call(me);
            }
        },
        "hub/ef/update/progress":function(progress){
            var me = this;
            me.query(me.studyplan.id + ".items.progress").spread(function(studyplan){
                me[DATA_STUDYPLAN] = studyplan;
                render.call(me);
            });
        },
        "hub/ef/next/unit": function (progress) {
            var me = this;
            patchEnrollment.call(me).then(function () {
                route.call(me, me.nextUnitId);
            });
        },
        "dom:[data-action='next/unit']/click": function (event) {
            var me = this;
            patchEnrollment.call(me).then(function () {
                route.call(me, me.nextUnitId);
            });
        },
        //TODO: need to test this case
        "dom:[data-action='next/level']/click": function(event) {
            this.publish("enroll/next/level");
        },
        //TODO: need to test this case
        "dom:[data-action='select/course']/click": function (event) {
            var changeCourseLink = $(event.currentTarget).data("link");
            if (changeCourseLink) {
                window.location = changeCourseLink;
            }
            else {
                this.publish("show/course/list");
            }
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/progress/progress.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-goal-progress cp-goal-progress " +data.customClass+ "\">\n\t<p class=\"cp-progres-title\">\n\t\t<span class=\"ets-icon-badge-goal-poly\"></span>\n\t</p>\n\t<p class=\"cp-progress-msg\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +data.progressMsg+ "\">LEFT TO COMPLETE THIS UNIT</p>\n\t<p class=\"cp-progress-msg-goal-set\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695058\">Set a new study goal</p>\n\t<div class=\"cp-progress-sub-msg\">\n\t\t<h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"" +data.subMsg+ "\"></h2>\n\t\t"; if(data.tooltipMsg){ o += "\n\t\t<div class=\"msg-tooltip\">\n\t\t\t<div data-weave=\"school-ui-studyplan/shared/tooltip/main(option)\" data-option='{\"content\": " +data.tooltipMsg+ ", \"customClass\": \"message\"}'>\n\t\t\t</div>\n\t\t</div>\n\t\t"; } o += "\n\t</div>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/progress/main',[
	"when",
	"lodash",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/animation-helper",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/enum/studyplan-velocity",
	"school-ui-studyplan/enum/studyplan-state",
	"school-ui-studyplan/enum/studyplan-item-state",
	"school-ui-studyplan/enum/studyplan-status",
	"template!./progress.html"
], function(when, _, Widget, typeidParser, animationHelper, stateParser, velocityState, studyplanState, itemState, cpStatus, tProgress){

	var UNDEF;
	var $ELEMENT = "$element";

	var DATA_STUDYPLAN = "_data_studyplan";
	var CONFIG = "_config";
	var STATUS = "_status";

	var SEL_OPTIONAL_POPOVER = ".ets-sp-optional-popover";
	var SEL_POPOVER_HOLDER = ".ets-sp-optional-holder";
	var SEL_RATE_NUM = ".ets-sp-rate-num";
	var SEL_MANDATORY_FINISHED = ".ets-sp-mandatory .ets-sp-finished";
	var SEL_OPTIONAL_FINISHED = ".ets-sp-optional .ets-sp-finished";
	var SEL_MOVEON_TIPS = ".ets-sp-moveon-tips";

	var CLS_NONE = "ets-none";

	var DURATION_RATE = 800;

	return Widget.extend(function(){
		var me = this;
		me[DATA_STUDYPLAN] = me[$ELEMENT].data("studyplan");
		me[CONFIG] = me[$ELEMENT].data("config");
		me[STATUS] = me[$ELEMENT].data("status");
	},{
		"velocityState" : velocityState,
		"sig/start" : function(){
			var me = this;
			var studyplan = me[DATA_STUDYPLAN];

			var mandatoryCount = optionalCount = mandatoryFinished = optionalFinished = 0;
			var goalItem;
			var optionalItems = [];
			var mandatoryRate;
			var optionalRate;
			var isNopace;

			//check items status
			studyplan.items.forEach(function(item){
				var state;
				if(item.typeCode !== "goal"){
					state = stateParser.parseFlag(itemState, item.progress.state);
					if(item.isOptional){
						optionalCount++;
						state.Completed && optionalFinished++;
						optionalItems.push({itemData:item, locked:state.Locked});
					}
					else{
						mandatoryCount++;
						state.Completed && mandatoryFinished++;
					}
				}
				else{
					goalItem = item;
				}
			});

			mandatoryRate = mandatoryCount ?
				(parseInt(mandatoryFinished / mandatoryCount * 100, 10) + "%") : UNDEF;
			optionalRate = optionalCount ?
				(parseInt(optionalFinished / optionalCount * 100, 10) + "%") : UNDEF;

			if(goalItem){
				goalItem.properties.paces.forEach(function(e){
					if(e.pacePoints === 0){
						isNopace = e.selected;
					}
				});
			}

			var msgKey = me[STATUS].key;
			return me.html(tProgress, {
				completed : studyplan.progress.state === studyplanState.Completed,
				goal : goalItem,
				isNopace: isNopace,
				mandatoryRate : mandatoryRate,
				optionalRate : optionalRate,
				optionalItems : optionalItems,
				velocity : studyplan.progress.properties.velocity,
				subMsg: cpStatus[msgKey].subMsg,
				progressMsg: cpStatus[msgKey].progressMsg,
				tooltipMsg: cpStatus[msgKey].tooltipMsg,
				customClass: cpStatus[msgKey].customClass
			}).then(function(){
				var $optionalBar = me[$ELEMENT].find(SEL_OPTIONAL_POPOVER);
				var $mandatoryProgress = me[$ELEMENT].find(SEL_MANDATORY_FINISHED);
				var $optionalProgress = me[$ELEMENT].find(SEL_OPTIONAL_FINISHED);


				//init popover for optional items
				$optionalBar.data({
					"content": me[$ELEMENT].find(SEL_POPOVER_HOLDER).html(),
					"trigger" : "hover",
					"placement":"bottom",
					"html" : true
				});
				$optionalBar.popover();


				//start animation
				$mandatoryProgress.css("width", 0);
				$optionalProgress.css("width", 0);
				setTimeout(function(){
					animationHelper.request("goalEnter", function(){
						return when.promise(function(resolve){
							$mandatoryProgress.css("width", mandatoryRate);
							$optionalProgress.css("width", optionalRate);
							setTimeout(function(){
								resolve();
							}, DURATION_RATE);
						});
					});
				}, 0);
			});

		},
		"hub/studyplan/goal/moveon-tips/show" : function(text){
			text && this[$ELEMENT].find(SEL_MOVEON_TIPS).removeClass(CLS_NONE).text(text);
		},

		"hub/studyplan/goal/progress/edit/show" : function(isShow){
			var $element = this[$ELEMENT].find('.cp-goal-progress');
			isShow ? $element.addClass('cp-progress-goal-edit') :
				$element.removeClass('cp-progress-goal-edit');
		},

		"getStatusKey" : function(studyplan, isNopace){
			var completed = studyplan.progress.state === studyplanState.Completed ? 'Completed' : '';
			var nopace = isNopace ? 'Nopace' : '';
			var stateCollection = stateParser.parseFlag(velocityState, studyplan.progress.properties.velocity);
			var velocity = '';
			_.find(stateCollection, function(value, key){
				if(value){
					velocity = key;
					return;
				}
			});

			return completed || nopace || velocity;
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/restart/restart.html',[],function() { return function template(data) { var o = "";
	var mailHidden = data.emailEnable === 'true' ? '' : 'hidden';
o += "\n<div class=\"ets-sp-goal-restart cp-goal-restart\">\n\t<div class=\"goal-mail " +mailHidden+ "\">\n\t\t";if(data.isSubscribed){o += "\n\t\t<input type=\"checkbox\" name=\"motivation-mail\" checked>\n\t\t";}else{o += "\n\t\t<input type=\"checkbox\" name=\"motivation-mail\" >\n\t\t";}o += "\n\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"695969\">Send me motivation emails to help me reach my study goal</span>\n\t</div>\n\t<div class=\"ets-sp-goal-restart-confirm-wrapper\">\n\t\t<button type=\"button\" class=\"btn  btn-m btn-block cp-goal-change\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"694971\">change your goal\n\t\t</button>\n\t</div>\n\t<div class=\"ets-sp-goal-restart-confirm-wrapper\">\n\t\t<button type=\"button\" class=\"btn  btn-m btn-block cp-goal-set\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"694972\">Set new Goal\n\t\t</button>\n\t</div>\n\t<p class=\"cp-goal-cancel\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"694973\">\n\t\tCancel\n\t</p>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/cp-goal/restart/main',[
	"jquery",
	"poly",
	"when",
	"troopjs-ef/command/service",
	"troopjs-data/cache/component",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/studyplan-update-helper",
    "school-ui-studyplan/enum/studyplan-velocity",
	"template!./restart.html"
],function($, Poly, when, CommandService, Cache, Widget, typeidParser, updateHelper, studyplanVelocity, tRestart){
	"use strict";

	var UNDEF;

	var DATA_STUDYPLAN = "_data_studyplan";
	var $ELEMENT = "$element";

	var PACE_POINTS = "_pacePoints";

	var SEL_CONFIRM_WRAPPER = ".ets-sp-goal-restart-confirm-wrapper",
		SEL_RESTART_LINK = ".ets-sp-goal-restart-link";

	var CLS_PRIMARY = "btn-primary btn-m btn";
	var CLS_NONE = "ets-none";

	var SUBSCRIBE_COMMAND = 'campus_student_studyplan_email_subscrib/SubscribStudyPlanEmail';
	var UNSUBSCRIBE_COMMAND = "campus_student_studyplan_email_subscrib/UnsubscribStudyPlanEmail";

	return Widget.extend(function(){
		var me = this;
		me[DATA_STUDYPLAN] = me[$ELEMENT].data("studyplan");
	},{
		"sig/start" : function(){
			var me = this;
			var subscriptionPromise = me.query('campus_student_studyplan_email_subscription!current','ccl!"CoachingEmail.enabled"');
			return when(subscriptionPromise)
				.then(function(data){
					return me.html(tRestart, {
						isSubscribed : data[0].isSubscribed,
						emailEnable: data[1].value,
					});
				})
				.then(function(){
					if(me[DATA_STUDYPLAN] && me[DATA_STUDYPLAN].progress.properties.velocity === studyplanVelocity.Crashed){
						me[$ELEMENT].find(SEL_RESTART_LINK).addClass(CLS_PRIMARY);
					}
				});

		},

		"hub/config/pace-change": function(paces){
			var me = this;
			var t = paces.every(function(e, i){
				if (e.selected) {
					me[PACE_POINTS] = e.pacePoints;
					return false;
				} else {
					return true;
				}
			});
		},

		"dom:.ets-sp-goal-restart-link/click": function(){
			var me = this;

			me[$ELEMENT].find(SEL_RESTART_LINK).addClass(CLS_NONE);
			me[$ELEMENT].find(SEL_CONFIRM_WRAPPER).removeClass(CLS_NONE);
			me.publish("config/pace-config/mode", "edit");
		},

		"dom:.ets-sp-goal-restart-confirm/click": function(){
			var me = this;

			updateHelper.restartStudyplan({
				reason : "",
				pacePoints : me[PACE_POINTS]
			}).then(function(goalItem){
				me.publish("load", {
					studyplan_item : typeidParser.parseId(goalItem.id)
				});
			});
		},

		"dom:.ets-sp-goal-restart-cancel/click": function(){
			var me = this;

			me.publish("config/pace-config/mode", "view");
			me[$ELEMENT].find(SEL_RESTART_LINK).removeClass(CLS_NONE);
			me[$ELEMENT].find(SEL_CONFIRM_WRAPPER).addClass(CLS_NONE);
		},

		"dom:.cp-goal-change/click": function(){
			var me = this;
			me[$ELEMENT].find('.ets-sp-goal-restart').addClass('goal-changing');
			me.publish("config/pace-config/mode", "edit");
			me.publish("studyplan/goal/progress/edit/show" ,true);
			me.publish("studyplan/goal/body/status/update" , {
				action: 1,
				class: 'cp-cfg-edit'
			});
		},

		"dom:.cp-goal-set/click": function(){
			var me = this;
			me[$ELEMENT].find('.ets-sp-goal-restart').removeClass('goal-changing');
			updateHelper.restartStudyplan({
				reason : "",
				pacePoints : me[PACE_POINTS]
			}).then(function(goalItem){
				me.publish("load", {
					studyplan_item : typeidParser.parseId(goalItem.id)
				});
			});
		},

		"dom:.cp-goal-cancel/click": function(){
			var me = this;
			me[$ELEMENT].find('.ets-sp-goal-restart').removeClass('goal-changing');
			me.publish("config/pace-config/mode", "view");
			me.publish("studyplan/goal/progress/edit/show" ,false);
			me.publish("studyplan/goal/body/status/update" ,  {
				action: 0,
				class: 'cp-cfg-edit'
			});
		},

		"dom:.goal-mail input/click": function(){
			var me = this;
			var $input = me[$ELEMENT].find('input');
			var command = $input.is(':checked') ? SUBSCRIBE_COMMAND : UNSUBSCRIBE_COMMAND;
			me.publish(command);
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/cp20/locked.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-cp20-locked\">\n    <h1><i class=\"ets-icon-lock\"></i></h1>\n    <h1 data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"The private lesson Is Locked\" data-blurb-id=\"639500\"></h1>\n    <p class=\"ets-sp-cp20-tips\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"You must complete the unit lessons before reviewing what you’ve learned with a teacher.\" data-blurb-id=\"639501\"></p>\n    <p class=\"ets-sp-cp20-purpose\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"The purpose of the private lesson is to review what you've learned in this unit with a live teacher. This live session takes 20 minutes and is included with your subscription.\" data-blurb-id=\"639502\"></p>\n    <p class=\"ets-sp-cp20-btn-tips\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"You must complete your lessons before booking the private lesson.\" data-blurb-id=\"639503\"></p>\n    <div class=\"ets-sp-cp20-next\">\n    \t<button type=\"button\" data-action=\"takeNext\" class=\"btn btn-primary btn-ml ets-sp-btn-next-lesson\">\n    \t\t<span data-blurb-id=\"639504\" data-text-en=\"Take your next lesson\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n    \t\t<i class=\"glyphicon icon-caret-right\"></i>\n    \t</button>\n    </div>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/cp20/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/enum/studyplan-item-state",
	"template!./locked.html"
], function ($, Widget, stateParser, stduyplanItemState, tLocked) {
	"use strict";
	var ITEM_DATA = "_item_data";

	return Widget.extend(function ($element, path, itemData) {
		this[ITEM_DATA] = itemData;
	}, {
		"sig/start": function () {
			var me = this;
			if (!me[ITEM_DATA] && !me[ITEM_DATA].progress) return;
			return me.query(me[ITEM_DATA].progress.id).spread(function (data) {
				var state = stateParser.parseFlag(stduyplanItemState, data.state);
				if (state.Locked) {
					return me.publish("school/interface/studyplan/cp20-locked-widget").spread(function (widgetPath) {
						if (widgetPath) {
							$("<div></div>", {
								"data-weave": widgetPath + "(itemData)",
								data: {
									itemData: me[ITEM_DATA]
								}
							}).appendTo(me.$element).weave();
						} else {
							return me.html(tLocked, {
								itemData: me[ITEM_DATA]
							});
						}
					});
				}
				else {

					return me.publish("school/interface/studyplan/cp20-container-widget",
						"school-ui-studyplan/widget/gl-pl/checkpoint20/main").spread(function (widgetPath) {

						$("<div></div>", {
							"data-weave": widgetPath + "(itemData)",
							data: {
								itemData: me[ITEM_DATA]
							}
						}).appendTo(me.$element).weave();
					});
				}

			});
		},
		//next lesson on locked page
		"dom:[data-action=takeNext]/click": function () {
			this.publish("studyplan/sequence/navigate/suggest-item");
		}
	});
});

define('school-ui-studyplan/widget/studyplan/body/sequence-container/gl/main',[
	"jquery",
	"troopjs-ef/component/widget"
], function ($, Widget, tGl) {
	"use strict";
	var ITEM_DATA = "_item_data";

	return Widget.extend(function ($element, path, itemData) {
		this[ITEM_DATA] = itemData;
	}, {
		"sig/start": function () {
			var me = this;

			return me.publish("school/interface/studyplan/gl-container-widget",
				"school-ui-studyplan/widget/gl-pl/grouplesson/main").spread(function (widgetPath) {

				$("<div></div>", {
					"data-weave": widgetPath + "(itemData)",
					data: {
						itemData: me[ITEM_DATA]
					}
				}).appendTo(me.$element).weave();
			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/goal/goal.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-cfg\">\n\t<div class=\"ets-sp-cfg-hd\">\n\t\t<!--\n\t\tthe progress widget will render here\n\t\t-->\n\t</div>\n\t<div class=\"ets-sp-cfg-bd\">\n\t\t<!--\n\t\tthe pace config widget will render here\n\t\t-->\n\t</div>\n\t<div class=\"ets-sp-cfg-ft\">\n\t\t<!--\n\t\tthe restart & moveon widget will render here\n\t\t-->\n\t</div>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/goal/main',[
	"when",
	"jquery",
	"json2",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
    "school-ui-studyplan/utils/state-parser",
    "school-ui-studyplan/enum/studyplan-state",
    "school-ui-studyplan/enum/studyplan-item-state",
	"template!./goal.html"
	],function(when, $, JSON, Widget, loom, weave, stateParser, studyplanState, itemState, tGoal){
	"use strict";

	var UNDEF;

	var $ELEMENT = "$element";

	var WIDGET_PACE = "school-ui-studyplan/shared/pace-config/main";
	var WIDGET_PROGRESS = "school-ui-studyplan/widget/studyplan/body/sequence-container/goal/progress/main";
	var WIDGET_MOVEON = "school-ui-studyplan/widget/studyplan/body/sequence-container/goal/moveon/main";
	var WIDGET_RESTART = "school-ui-studyplan/widget/studyplan/body/sequence-container/goal/restart/main";

	var SEL_PROGRESS_HOLDER = ".ets-sp-cfg-hd";
	var SEL_ACTIVITY_HOLDER = ".ets-sp-cfg-ft";
	var SEL_PACE_HOLDER = ".ets-sp-cfg-bd";
	var CLS_BLANK = "ets-sp-blank";

	var DATA_GOAL = "_data_goal";

	return Widget.extend(function($element, path, itemData){
		var me = this;
		me[DATA_GOAL] = itemData;
	},{
		"hub:memory/load/studyplan" : function(studyplan){
			if(studyplan){
				var me = this;
				var isNopace;

				me[DATA_GOAL].properties.paces.forEach(function (e) {
					if(e.pacePoints === 0){
						isNopace = e.selected;
					}
				});

				return when.all([
					me.html(tGoal),
					me.query(studyplan.id + ".progress,.items.progress")
				]).spread(function (templateArray, studyplanData) {
					var $moveon;
					var $progress;
					var $pace;
					var $restart;

					var studyplan = studyplanData[0];
					var goal;

					studyplan.items.forEach(function(item){
						if(item.typeCode === "goal"){
							goal = item;
						}
					});

					//weave progress widget
					me[$ELEMENT].find(SEL_PROGRESS_HOLDER).append(
							$progress = $("<div></div>")
								.attr(loom.weave, WIDGET_PROGRESS)
								.data("studyplan", studyplan)
						);
					$progress.weave();

					//check state
					if(studyplan.progress.state === studyplanState.Completed){

						me[$ELEMENT].find(SEL_ACTIVITY_HOLDER).append(
							$moveon = $("<div></div>")
								.attr(loom.weave, WIDGET_MOVEON)
								.data("studyplan", studyplan)
						);
						$moveon.weave();
					}
					else{
						me[$ELEMENT].find(SEL_PACE_HOLDER).append(
							$pace = $("<div></div>")
								.attr(loom.weave, WIDGET_PACE)
								.data("mode", "view")
								.data("config", $.extend({}, goal && goal.properties, goal && goal.progress.properties))
						);
						$pace.weave();
						// when studyplan is no-pace, there is 'no pace', and can not restart
						if(isNopace){
							me[$ELEMENT].find(SEL_ACTIVITY_HOLDER).addClass(CLS_BLANK);
						}
						else{
							me[$ELEMENT].find(SEL_ACTIVITY_HOLDER).append(
								$moveon = $("<div></div>")
									.attr(loom.weave, WIDGET_RESTART)
									.data("studyplan", studyplan)
							);
							$moveon.weave();
						}
					}
				});
			}
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/goal/moveon/moveon.html',[],function() { return function template(data) { var o = "";
	function getBlurbHTML() {
		var classPrimary = 'btn btn-m btn-primary';
		var classDefault = 'btn btn-m btn-default';
		var prefix = ' <button class=';
		var suffix = ' <i class="glyphicon icon-caret-right"></i></button>';
		var result;

		if(data.isLastLevel) {
			if(data.isLastUnit) {
                if(data.enableLevelTest && data.isGE) {
                    prefix = '<a href="' + data.levelTestPath + '?testid='
                    + data.levelTestId + '" target="_blank"><span class="' + classDefault + '" data-weave="troopjs-ef/blurb/widget" data-blurb-id="450035" data-text-en="Take the level test"></span></a>' + prefix;
                }

				if(data.enableSelectCourse) {
					prefix += '"' + classPrimary + '" data-action="select/course" data-link="' + data.changeCourseLink + '">';
					result = '<span data-blurb-id="' + data.blurbIds.cpSelectCourse + '" data-text-en="Select the next course you want to do" data-weave="troopjs-ef/blurb/widget"></span>';
				}
			}
		} else if(data.isLastUnit) {
			prefix += '"' + classPrimary + ' ' + (data.enableChangeLevel ? '' : 'hide') + '" data-action="next/level">';

			if(data.enableLevelTest && data.isGE) {
				prefix = '<a href="' + data.levelTestPath + '?testid='
					+ data.levelTestId + '" target="_blank"><span class="' + classDefault + '" data-weave="troopjs-ef/blurb/widget" data-blurb-id="450035" data-text-en="Take the level test"></span></a>' + prefix;
			}

			result = '<span data-blurb-id="569912" data-text-en="Move to the next level" data-weave="troopjs-ef/blurb/widget"></span> '
		} else {
			prefix += '"' + classPrimary + '" data-action="next/unit">';

			result = '<span data-blurb-id="569911" data-text-en="Go to Unit ^number^" data-weave="troopjs-ef/blurb/widget" data-values=\'{"number":' + data.nextUnitIndex + '}\'></span>';
		}

		return result ? (prefix + result + suffix) : "";
	}
o += "\n\n<div class=\"ets-sp-goal-moveon\">\n\t\t";
		if(data.hasActiveSPInCurrentLevel){
		o += "\n\t\t<!--\n\t\tif not, we cann't render the move on button. because case SPC-4998\n\t\t-->\n\t\t\t<div class=\"ets-sp-goal-moveon-main\">\n\t\t\t\t\t" + getBlurbHTML()+ "\n\t\t\t</div>\n\t\t";
		}
		o += "\n\n\t\t";
		if(data.optionalItems.length){
		o += "\n\t\t<div class=\"ets-sp-moveon-items\">\n\t\t\t<div class=\"ets-sp-optional-title\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656559\" data-text-en=\"We recommend you to take optional lessons before you move on\"></div>\n\t\t\t<div class=\"ets-sp-optional-items\">\n\t\t\t";
			for (var n=0; n<data.optionalItems.length; n++){
				switch(data.optionalItems[n].itemData.typeCode){
					case "cp20":
			o += "\n\t\t\t\t\t\t<div class=\"ets-sp-item-small\">\n\t\t\t\t\t\t\t<i class=\"ets-sp-icon\">\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-badge ets-icon-badge-check-point\"></i>\n\t\t\t\t\t\t\t\t"; if (data.optionalItems[n].locked) { o += "\n\t\t\t\t\t\t\t\t\t<i class=\"ets-icon-badge-locked\">\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-icon ets-icon-lock\"></i>\n\t\t\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t<span class=\"ets-sp-name\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Private Class\" data-blurb-id=\"639494\"></span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t";
						break;
					case "pl":
						o += "\n\t\t\t\t\t\t<div class=\"ets-sp-item-small\">\n\t\t\t\t\t\t\t<i class=\"ets-sp-icon\">\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-badge ets-icon-badge-private-lesson\"></i>\n\t\t\t\t\t\t\t\t"; if (data.optionalItems[n].locked) { o += "\n\t\t\t\t\t\t\t\t\t<i class=\"ets-icon-badge-locked\">\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-icon ets-icon-lock\"></i>\n\t\t\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t<span class=\"ets-sp-name\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Private Class\" data-blurb-id=\"569833\"></span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t";
						break;
					case "gl":
						o += "\n\t\t\t\t\t\t<div class=\"ets-sp-item-small\">\n\t\t\t\t\t\t\t<i class=\"ets-sp-icon\">\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-badge ets-icon-badge-group-lesson\"></i>\n\t\t\t\t\t\t\t\t"; if (data.optionalItems[n].locked) { o += "\n\t\t\t\t\t\t\t\t\t<i class=\"ets-icon-badge-locked\">\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-icon ets-icon-lock\"></i>\n\t\t\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t<span class=\"ets-sp-name\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Private Class\" data-blurb-id=\"638118\"></span>\n\t\t\t\t\t\t</div>\n\t\t\t";
				}
			}
			o += "\n\t\t\t</div>\n\t\t</div>\n\t\t";
		}
		o += "\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/goal/moveon/main',[
    "school-ui-studyplan/module",
    "jquery",
    "when",
    "poly",
    "lodash",
    "troopjs-ef/component/widget",
    "school-ui-shared/enum/course-type",
    "school-ui-shared/utils/typeid-parser",
    "school-ui-shared/utils/progress-state",
    "school-ui-shared/utils/update-helper",
    "school-ui-studyplan/enum/studyplan-item-state",
    "school-ui-studyplan/utils/state-parser",
    "template!./moveon.html"
], function (module, $, when, poly, _, Widget, CourseType, typeidParser, progressState, updateHelper, itemState, stateParser, tMoveon) {
    "use strict";

    var UNDEF;
    var CCL_ENABLE_LEVELTEST = 'ccl!"school.courseware.enableleveltest"';
    var CCL_ENABLE_GOTO_NEXT_LEVEL = 'ccl!"school.courseware.enableSelectNextLevel"';
    var CCL_ENABLE_SELECT_COURSE = 'ccl!"school.menu.changecourse.display"';
    var CCL_CHANGE_COURSE_LINK = "ccl!'school.studyplan.changeCourse.link'";
    var Q_CURRENT_STUDYPLAN = "campus_student_unit_studyplan!current.studyPlan.items,.studyPlan.progress";
    var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

    var DATA_STUDYPLAN = "_data_studyplan";
    var $ELEMENT = "$element";

    var HUB_SHOW_TIPS = "studyplan/goal/moveon-tips/show";

    var MODULE_CONFIG = _.merge({
        blurbIds: {
            cpSelectCourse: "656560"
        },
	    changeCourseUrl: undefined,
	    levelTestPath: "/school/content/leveltest.aspx"
    }, module.config() || {});

    function isDemoAndNeedToLimit (common_context, courseTypeCode) {
        return common_context.partnercode.value.toLowerCase() === "demo" &&
                (CourseType.isGECourse(courseTypeCode) || CourseType.isBECourse(courseTypeCode))
    }

    function filterData() {
        var me = this;
        var levels = me.course.children;
        var level  = me.level;
        var levelLen = levels.length;
        var unit = me.unit;
        var units = unit.parent.children;
        var unitLen = units.length;
        var config = {};

        // INDB2B SPECIAL LOGIC
        if(unit.templateUnitId === units[unitLen-1].templateUnitId || me.course.courseTypeCode === "INDB2B") {
            config.isLastUnit = true;

            if(me.isGE) {
                config.levelTestId = (me.levelTestVersion === 1 ? level.legacyLevelId : level.templateLevelId);
                if(level.templateLevelId === levels[levelLen-1].templateLevelId) {
                    config.isLastLevel = true;
                }
            } else {
                // For SPIN course, alway let student select course
                config.isLastLevel = true;
            }
        } else {
            units.every(function(v, i) {
                if(v.templateUnitId === unit.templateUnitId) {
                    config.nextUnitIndex = i+2;
                    me.nextUnitId = units[i+1].templateUnitId;
                    return false;
                }
               return true;
            });

        }

        //for demo, only show the select course button
        if(isDemoAndNeedToLimit(me.common_context, me.course.courseTypeCode)){
          config.isLastUnit = true;
          config.isLastLevel = true;
        }

        return config;
    }

    function render() {
        var me = this;
        var studyplan = me[DATA_STUDYPLAN];
        if(!me.course || !me.level || !me.unit || !me.common_context || !me.levelTestVersion) return;

        me.query(
            CCL_ENABLE_LEVELTEST,
            CCL_ENABLE_GOTO_NEXT_LEVEL,
            CCL_ENABLE_SELECT_COURSE,
            CCL_CHANGE_COURSE_LINK,
            Q_CURRENT_STUDYPLAN,
            me.level.id + ".children"
        )
        .spread(function(
            enableLevelTest,
            enableChangeLevel,
            enableSelectCourse,
            changeCourseLink,
            currentStudyPlan,
            navgationUnits
            ) {
            var goalItem;

            var data = filterData.call(me);
            data.isGE = me.isGE;
            data.enableLevelTest = enableLevelTest && enableLevelTest.value.toLowerCase() === "true";
            data.enableChangeLevel = enableChangeLevel && enableChangeLevel.value.toLowerCase() === "true";
            data.enableSelectCourse = enableSelectCourse && enableSelectCourse.value.toLowerCase() === "true";
            data.changeCourseLink = MODULE_CONFIG.changeCourseUrl || changeCourseLink.value;
            data.blurbIds = MODULE_CONFIG.blurbIds;
	        data.levelTestPath = MODULE_CONFIG.levelTestPath;

            data.optionalItems = [];

            //check items status
            studyplan.items.forEach(function(item){
                var state;
                if(item.typeCode !== "goal" && item.isOptional){
                    state = stateParser.parseFlag(itemState, item.progress.state);
                    if(!state.Completed){
                        data.optionalItems.push({itemData:item, locked:state.Locked});
                    }
                }
                else{
                    goalItem = item;
                }
            });

            if(stateParser.parseFlag(itemState, goalItem.progress.state).Completed){
                if(data.isLastLevel && data.isLastUnit){
                    //blurb en : You've completed the level.
                    me.query("blurb!656580").spread(function(blurb){
                        blurb && me.publish(HUB_SHOW_TIPS, blurb.translation);
                    });
                }
                else if(data.isLastUnit){
                    //blurb en : You've unlocked the next level
                    me.query("blurb!656556").spread(function(blurb){
                        blurb && me.publish(HUB_SHOW_TIPS, blurb.translation);
                    });
                }
                else{
                    //blurb en : You've unlocked the next unit
                    me.query("blurb!656555").spread(function(blurb){
                        blurb && me.publish(HUB_SHOW_TIPS, blurb.translation);
                    });
                }
            }

            data.hasActiveSPInCurrentLevel = navgationUnits.children.reduce(function(prev, curr){
                return prev || (curr.templateUnitId === currentStudyPlan.studyPlan.properties.templateUnitId);
            }, false);

            me.html(tMoveon, data);

        });
    }

    function route(unitId) {
        return this.publish("load/config", typeidParser.parseId(unitId));
    }

    function patchEnrollment() {    //SPC-7718 send additional update enrollment if backend auto moveon failed
        var me = this;
        return me.query('student_course_enrollment!current', me.unit.progress.id).spread(function (currentEnrollment, currentUnitProgress) {
            if (me.nextUnitId && currentEnrollment.studentUnitId === me.unit.studentUnitId && progressState.hasPassed(currentUnitProgress.state)) {
                return updateHelper.updateEnrollment({templateId: me.nextUnitId});
            }
        });
    }

    return Widget.extend(function(){
        var me = this;
        me[DATA_STUDYPLAN] = me[$ELEMENT].data("studyplan");

        me.query(MSS_LEVEL_TEST_VERSION).spread(function (mssLevelTestVersion) {
            me.levelTestVersion = parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);
            render.call(me);
        });
    },{
        "hub:memory/common_context" : function(common_context){
          var me = this;
          if(common_context){
            me.common_context = common_context.values;
            render.call(me);
          }
        },
        "hub:memory/load/results": function(data) {
            var me = this;
            if( data && (   me.course !== data.course ||
                            me.level !== data.level ||
                            me.unit !== data.unit )
                ){
                me.studyplan = data.studyplan;
                me.isGE = CourseType.isGECourse((data.course || {}).courseTypeCode);
                me.course = data.course;
                me.level = data.level;
                me.unit = data.unit;
                render.call(me);
            }
        },
        "hub/ef/update/progress":function(progress){
            var me = this;
            me.query(me.studyplan.id + ".items.progress").spread(function(studyplan){
                me[DATA_STUDYPLAN] = studyplan;
                render.call(me);
            });
        },
        "dom:[data-action='next/unit']/click": function (event) {
            var me = this;
            patchEnrollment.call(me).then(function () {
                route.call(me, me.nextUnitId);
            });
        },
        //TODO: need to test this case
        "dom:[data-action='next/level']/click": function(event) {
            this.publish("enroll/next/level");
        },
        //TODO: need to test this case
        "dom:[data-action='select/course']/click": function (event) {
            var changeCourseLink = $(event.currentTarget).data("link");
            if (changeCourseLink) {
                window.open(changeCourseLink, '_self');
            }
            else {
                this.publish("show/course/list");
            }
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/goal/progress/progress.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-goal-progress\">\n\t"; 
	if(data.completed){
		o += "\n\t\t<h2 class=\"ets-sp-velocity\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656554\" data-text-en=\"Congratulations!\"></h2>\n\t\t";
	}
	else if(data.isNopace){
		o += "\n\t\t<h2 class=\"ets-sp-velocity\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656581\" data-text-en=\"You are studying at your own pace.\"></h2>\n\t\t";
	}
	else{
		switch (data.velocity){
			case this.velocityState.Fast:
				o += "\n\t\t\t\t<h2 class=\"ets-sp-velocity\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656562\" data-text-en=\"Fantastic. You are running ahead.\"></h2>\n\t\t\t\t";
			break;
			case this.velocityState.Normal:
				o += "\n\t\t\t\t<h2 class=\"ets-sp-velocity\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656561\" data-text-en=\"Thumbs up. You are right on track.\"></h2>\n\t\t\t\t";
			break;
			case this.velocityState.Slow:
				o += "\n\t\t\t\t<h2 class=\"ets-sp-velocity\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656563\" data-text-en=\"You are falling behind. Let’s get back on track.\"></h2>\n\t\t\t\t";
			break;
			case this.velocityState.Crashing:
				o += "\n\t\t\t\t<h2 class=\"ets-sp-velocity\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656582\" data-text-en=\"Your unit plan will expire soon. Let’s get back on track.\"></h2>\n\t\t\t\t";
			break;
			case this.velocityState.Crashed:
				o += "\n\t\t\t\t<h2 class=\"ets-sp-velocity\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656564\" data-text-en=\"Your study plan has expired. Set a new one.\"></h2>\n\t\t\t\t";
			break;
		}
	}
	o += "\n\t\n\t<div class=\"ets-sp-moveon-tips ets-none\"></div>\n\t<div class=\"ets-sp-bar\">\n\t\t<span class=\"ets-sp-complete-rate\">\n\t\t\t<span class=\"ets-sp-rate-num\">" + data.mandatoryRate+ "</span>\n\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656557\" data-text-en=\"completed\"></span>\n\t\t</span>\n\t\t\n\t\t<div class=\"ets-sp-mandatory\">\n\t\t\t<div class=\"ets-sp-progress-border\"></div>\n\t\t\t<span class=\"ets-sp-finished\"></span>\n\t\t</div>\t\t\n\t\t";
		if(data.optionalItems.length){
		o += "\n\t\t\t<div class=\"ets-sp-optional-popover\">\n\t\t\t\t<div class=\"ets-sp-optional\">\n\t\t\t\t\t<div class=\"ets-sp-progress-border\"></div>\n\t\t\t\t\t<span class=\"ets-sp-finished\"></span>\n\t\t\t\t\t<span class=\"ets-sp-dots\">\n\t\t\t\t\t\t<span class=\"ets-sp-dot\"></span>\n\t\t\t\t\t\t<span class=\"ets-sp-dot\"></span>\n\t\t\t\t\t\t<span class=\"ets-sp-dot\"></span>\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t";
		}
		o += "\n\n\n\t</div>\n</div>\n<!-- use in gubstrap popover plugin -->\n<div class=\"ets-sp-optional-holder ets-none\">\n\t<div class=\"ets-sp-optional-lessons\">\n\t\t<div class=\"ets-sp-optional-title\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"656558\" data-text-en=\"Optional lessons\"></div>\n\t\t<div class=\"ets-sp-optional-items\">\n\t\t";
		if(data.optionalItems && data.optionalItems.length){
			for (var n=0; n<data.optionalItems.length; n++){
				switch(data.optionalItems[n].itemData.typeCode){
					case "cp20":
			o += "\n\t\t\t\t\t\t<div class=\"ets-sp-item-small\">\n\t\t\t\t\t\t\t<i class=\"ets-sp-icon\">\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-badge ets-icon-badge-check-point\"></i>\n\t\t\t\t\t\t\t\t";
								 if (data.optionalItems[n].locked) { o += "\n\t\t\t\t\t\t\t\t\t<i class=\"ets-icon-badge-locked\">\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-icon ets-icon-lock\"></i>\n\t\t\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t<span class=\"ets-sp-name\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Private Class\" data-blurb-id=\"639494\"></span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t"; 
						break;
					case "pl":
						o += "\n\t\t\t\t\t\t<div class=\"ets-sp-item-small\">\n\t\t\t\t\t\t\t<i class=\"ets-sp-icon\">\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-badge ets-icon-badge-private-lesson\"></i>\n\t\t\t\t\t\t\t\t"; if (data.optionalItems[n].locked) { o += "\n\t\t\t\t\t\t\t\t\t<i class=\"ets-icon-badge-locked\">\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-icon ets-icon-lock\"></i>\n\t\t\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t<span class=\"ets-sp-name\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Private Class\" data-blurb-id=\"569833\"></span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t"; 
						break;
					case "gl":
						o += "\n\t\t\t\t\t\t<div class=\"ets-sp-item-small\">\n\t\t\t\t\t\t\t<i class=\"ets-sp-icon\">\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t<i class=\"ets-sp-icon-badge ets-icon-badge-group-lesson\"></i>\n\t\t\t\t\t\t\t\t"; if (data.optionalItems[n].locked) { o += "\n\t\t\t\t\t\t\t\t\t<i class=\"ets-icon-badge-locked\">\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-bg glyphicon icon-circle\"></i>\n\t\t\t\t\t\t\t\t\t\t<i class=\"ets-sp-locked-mark-icon ets-icon-lock\"></i>\n\t\t\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t\t"; } o += "\n\t\t\t\t\t\t\t</i>\n\t\t\t\t\t\t\t<span class=\"ets-sp-name\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Private Class\" data-blurb-id=\"638118\"></span>\n\t\t\t\t\t\t</div>\n\t\t\t";
				}
			}
		}
		o += "\n\t\t</div>\t\n\t</div>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/goal/progress/main',[
	"when",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/animation-helper",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/enum/studyplan-velocity",
	"school-ui-studyplan/enum/studyplan-state",
	"school-ui-studyplan/enum/studyplan-item-state",
	"template!./progress.html"
], function(when, Widget, typeidParser, animationHelper, stateParser, velocityState, studyplanState, itemState, tProgress){

	var UNDEF;
	var $ELEMENT = "$element";

	var DATA_STUDYPLAN = "_data_studyplan";

	var SEL_OPTIONAL_POPOVER = ".ets-sp-optional-popover";
	var SEL_POPOVER_HOLDER = ".ets-sp-optional-holder";
	var SEL_RATE_NUM = ".ets-sp-rate-num";
	var SEL_MANDATORY_FINISHED = ".ets-sp-mandatory .ets-sp-finished";
	var SEL_OPTIONAL_FINISHED = ".ets-sp-optional .ets-sp-finished";
	var SEL_MOVEON_TIPS = ".ets-sp-moveon-tips";

	var CLS_NONE = "ets-none";

	var DURATION_RATE = 800;

	return Widget.extend(function(){
		var me = this;
		me[DATA_STUDYPLAN] = me[$ELEMENT].data("studyplan");
	},{
		"velocityState" : velocityState,
		"sig/start" : function(){
			var me = this;
			var studyplan = me[DATA_STUDYPLAN];

			var mandatoryCount = optionalCount = mandatoryFinished = optionalFinished = 0;
			var goalItem;
			var optionalItems = [];
			var mandatoryRate;
			var optionalRate;
			var isNopace;


			//check items status
			studyplan.items.forEach(function(item){
				var state;
				if(item.typeCode !== "goal"){
					state = stateParser.parseFlag(itemState, item.progress.state);
					if(item.isOptional){
						optionalCount++;
						state.Completed && optionalFinished++;
						optionalItems.push({itemData:item, locked:state.Locked});
					}
					else{
						mandatoryCount++;
						state.Completed && mandatoryFinished++;
					}
				}
				else{
					goalItem = item;
				}
			});

			mandatoryRate = mandatoryCount ?
				(parseInt(mandatoryFinished / mandatoryCount * 100, 10) + "%") : UNDEF;
			optionalRate = optionalCount ?
				(parseInt(optionalFinished / optionalCount * 100, 10) + "%") : UNDEF;

			if(goalItem){
				goalItem.properties.paces.forEach(function(e){
					if(e.pacePoints === 0){
						isNopace = e.selected;
					}
				});
			}

			return me.html(tProgress, {
				completed : studyplan.progress.state === studyplanState.Completed,
				goal : goalItem,
				isNopace: isNopace,
				mandatoryRate : mandatoryRate,
				optionalRate : optionalRate,
				optionalItems : optionalItems,
				velocity : studyplan.progress.properties.velocity
			}).then(function(){
				var $optionalBar = me[$ELEMENT].find(SEL_OPTIONAL_POPOVER);
				var $mandatoryProgress = me[$ELEMENT].find(SEL_MANDATORY_FINISHED);
				var $optionalProgress = me[$ELEMENT].find(SEL_OPTIONAL_FINISHED);


				//init popover for optional items
				$optionalBar.data({
					"content": me[$ELEMENT].find(SEL_POPOVER_HOLDER).html(),
					"trigger" : "hover",
					"placement":"bottom",
					"html" : true
				});
				$optionalBar.popover();


				//start animation
				$mandatoryProgress.css("width", 0);
				$optionalProgress.css("width", 0);
				setTimeout(function(){
					animationHelper.request("goalEnter", function(){
						return when.promise(function(resolve){
							$mandatoryProgress.css("width", mandatoryRate);
							$optionalProgress.css("width", optionalRate);
							setTimeout(function(){
								resolve();
							}, DURATION_RATE);
						});
					});
				}, 0);
			});

		},
		"hub/studyplan/goal/moveon-tips/show" : function(text){
			text && this[$ELEMENT].find(SEL_MOVEON_TIPS).removeClass(CLS_NONE).text(text);
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/goal/restart/restart.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-goal-restart\">\n\t<span class=\"ets-sp-goal-restart-link\" data-blurb-id=\"569840\" data-text-en=\"Restart\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t<div class=\"ets-sp-goal-restart-confirm-wrapper ets-none\">\n\t\t<button type=\"button\" class=\"btn btn-primary btn-m btn-block ets-sp-goal-restart-confirm\" data-blurb-id=\"450019\" data-text-en=\"Confirm\" data-weave=\"troopjs-ef/blurb/widget\"><span></span></button>\n\t\t<span class=\"ets-sp-goal-restart-cancel\" data-blurb-id=\"450018\" data-text-en=\"Cancel\" data-weave=\"troopjs-ef/blurb/widget\"></span>\n\t</div>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/goal/restart/main',[
	"jquery",
	"poly",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/studyplan-update-helper",
    "school-ui-studyplan/enum/studyplan-velocity",
	"template!./restart.html"
],function($, Poly, Widget, typeidParser, updateHelper, studyplanVelocity, tRestart){
	"use strict";

	var UNDEF;

	var DATA_STUDYPLAN = "_data_studyplan";
	var $ELEMENT = "$element";

	var PACE_POINTS = "_pacePoints";

	var SEL_CONFIRM_WRAPPER = ".ets-sp-goal-restart-confirm-wrapper",
		SEL_RESTART_LINK = ".ets-sp-goal-restart-link";

	var CLS_PRIMARY = "btn-primary btn-m btn";
	var CLS_NONE = "ets-none";

	return Widget.extend(function(){
		var me = this;
		me[DATA_STUDYPLAN] = me[$ELEMENT].data("studyplan");
	},{
		"sig/start" : function(){
			var me = this;
			return me.html(tRestart).then(function(){
				if(me[DATA_STUDYPLAN] && me[DATA_STUDYPLAN].progress.properties.velocity === studyplanVelocity.Crashed){
					me[$ELEMENT].find(SEL_RESTART_LINK).addClass(CLS_PRIMARY);
				}
			});;
		},

		"hub/config/pace-change": function(paces){
			var me = this;

			paces.every(function(e, i){
				if (e.selected) {
					me[PACE_POINTS] = e.pacePoints;
					return false;
				} else {
					return true;
				}
			});
		},

		"dom:.ets-sp-goal-restart-link/click": function(){
			var me = this;

			me[$ELEMENT].find(SEL_RESTART_LINK).addClass(CLS_NONE);
			me[$ELEMENT].find(SEL_CONFIRM_WRAPPER).removeClass(CLS_NONE);
			me.publish("config/pace-config/mode", "edit");
		},

		"dom:.ets-sp-goal-restart-confirm/click": function(){
			var me = this;

			updateHelper.restartStudyplan({
				reason : "",
				pacePoints : me[PACE_POINTS]
			}).then(function(goalItem){
				me.publish("load", {
					studyplan_item : typeidParser.parseId(goalItem.id)
				});
			});
		},

		"dom:.ets-sp-goal-restart-cancel/click": function(){
			var me = this;

			me.publish("config/pace-config/mode", "view");
			me[$ELEMENT].find(SEL_RESTART_LINK).removeClass(CLS_NONE);
			me[$ELEMENT].find(SEL_CONFIRM_WRAPPER).addClass(CLS_NONE);
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/lesson/lesson.html',[],function() { return function template(data) { var o = "";
	var lesson = data.lesson;
	var pcScore = data.pcScore;
	var pcHasPassed = data.pcHasPassed;
	var mobHasPassed = data.mobHasPassed;
	var mobHasStarted = data.mobHasStarted;
	var physicalLesson = data.physicalLesson;
o += "\n<div class=\"ets-sp-lsn\">\n\t<div class=\"ets-sp-lsn-main\">\n\t\t<div class=\"ets-sp-lsn-hd clearfix\">\n\t\t\t<img src=\"" + (lesson.lessonImage ? lesson.lessonImage.url : '') + "\" width=\"260\" height=\"160\">\n\t\t\t<div class=\"ets-sp-lsn-info\">\n\t\t\t\t<h4><span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"490238\" data-text-en=\"Lesson\"></span> " + lesson.lessonNo + "</h4>\n\t\t\t\t<h1>" + lesson.lessonName + "</h1>\n\t\t\t\t";if (pcHasPassed) {o += "\n\t\t\t\t<div class=\"ets-sp-lsn-status ets-pass\">\n\t\t\t\t\t<h3>\n\t\t\t\t\t\t<i class=\"ets-icon-badge-checkmark\"></i>\n\t\t\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"569854\" data-text-en=\"PASSED\"></span> / " + pcScore + "%\n\t\t\t\t\t</h3>\n\t\t\t\t</div>\n\t\t\t\t"; } else { o += "\n\t\t\t\t\t"; if(mobHasStarted){ o += "\n\t\t\t\t\t<div class=\"ets-sp-lsn-status ets-start\">\n\t\t\t\t\t\t<h3>\n\t\t\t\t\t\t\t<i class=\"ets-mob-icon ets-icon-mob-started\"></i>\n\t\t\t\t\t\t\t<span class=\"ets-mob-status\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"661846\" data-text-en=\"Started on mobile\"></span>\n\t\t\t\t\t\t\t<i class=\"ets-icon-mob-tip ets-mob-tip-started\"></i>\n\t\t\t\t\t\t</h3>\n\t\t\t\t\t</div>\n\t\t\t\t\t"; } o += "\n\t\t\t\t\t"; if(mobHasPassed){ o += "\n\t\t\t\t\t<div class=\"ets-sp-lsn-status ets-pass\">\n\t\t\t\t\t\t<h3>\n\t\t\t\t\t\t\t<i class=\"ets-mob-icon ets-icon-mob-passed\"></i>\n\t\t\t\t\t\t\t<span class=\"ets-mob-status\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"661847\" data-text-en=\"Passed on mobile\"></span>\n\t\t\t\t\t\t\t<i class=\"ets-icon-mob-tip ets-mob-tip-passed\"></i>\n\t\t\t\t\t\t</h3>\n\t\t\t\t\t</div>\n\t\t\t\t\t"; } o += "\n\t\t\t\t"; } o += "\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"ets-sp-lsn-bd\">\n\t\t\t<div data-weave=\"school-ui-studyplan/widget/studyplan/body/sequence-container/lesson/step-list/main\" data-physical-lesson-id=\"" + physicalLesson+ "\"></div>\n\t\t</div>\n\t</div>\n</div>\n<div class=\"modal fade ets-mob-modal ets-mob-modal-started\" role=\"dialog\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content ets-mob-modal-tip\">\n\t\t\t<div class=\"ets-tip-icon\">\n\t\t\t\t<i class=\"ets-icon-mob-started\"></i>\n\t\t\t</div>\n\t\t\t<h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"661846\" data-text-en=\"Started on mobile\"></h2>\n\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"661848\" data-text-en=\"You have started this lesson on your mobile.\"></p>\n\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"663229\" data-text-en=\"You can choose to study the lesson on the web as well, or continue on your mobile device.\"></p>\n\t\t\t<div class=\"ets-tip-button\">\n\t\t\t\t<button class=\"btn btn-default ets-btn-modal-close\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"661850\" data-text-en=\"Got it\"></button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n<div class=\"modal fade ets-mob-modal ets-mob-modal-passed\" role=\"dialog\">\n\t<div class=\"modal-dialog\">\n\t\t<div class=\"modal-content ets-mob-modal-tip\">\n\t\t\t<div class=\"ets-tip-icon\">\n\t\t\t\t<i class=\"ets-icon-mob-passed\"></i>\n\t\t\t</div>\n\t\t\t<h2 data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"661847\" data-text-en=\"Passed on mobile\"></h2>\n\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"663228\" data-text-en=\"You have passed this lesson on your mobile.\"></p>\n\t\t\t<p data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"661849\" data-text-en=\"You might see more new content herebut don't worry, all good!\"></p>\n\t\t\t<div class=\"ets-tip-button\">\n\t\t\t\t<button class=\"btn btn-default ets-btn-modal-close\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"661850\" data-text-en=\"Got it\"></button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>"; return o; }; });
/**
 * A widget that contains a lesson
 *
 * @class lesson
 */
define('school-ui-studyplan/widget/studyplan/body/sequence-container/lesson/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"jquery.gudstrap",
	"poly",
	"template!./lesson.html"
], function LessonModule($, Widget, progressState, Parser, $GUD, poly, tLesson) {
	"use strict";

	var $ELEMENT = "$element";

	var STUDYPLAN_ITEM = "_studyplan_item";
	var LESSON = "_lesson";

	var SEL_MOB_MODAL_STARTED = ".ets-mob-modal-started",
		SEL_MOB_MODAL_PASSED = ".ets-mob-modal-passed",
		SEL_MOB_MODAL = ".ets-mob-modal";

	/**
	 * Render the widget UI
	 *
	 * @api private
	 */
	function doRender(lesson) {
		var me = this;

		if (!lesson) {
			return;
		}

		var renderData = {
			lesson: lesson,
			physicalLesson: me[STUDYPLAN_ITEM].properties.templateLessonId,
			pcScore: 0,
			pcHasPassed: false,
			mobHasStarted: false,
			mobHasPassed: false
		};

		return me.query("student_lesson_progress!template_lesson;" + me[STUDYPLAN_ITEM].properties.templateLessonId + ".detail").spread(function (lessonDetail) {
			lessonDetail.detail.items.forEach(function (e, i) {
				switch (e.sourceTypeCode) {
					case "PCLesson":
						renderData.pcScore = e.score;
						renderData.pcHasPassed = progressState.hasPassed(e.state);
						break;

					case "MOBLesson":
						renderData.mobHasStarted = progressState.hasStarted(e.state);
						renderData.mobHasPassed = progressState.hasPassed(e.state);
						break;
				}
			});

			return me.html(tLesson, renderData);
		});
	}

	return Widget.extend(function($element, path, itemData){
		var me = this;
		me[STUDYPLAN_ITEM] = itemData;
	},{
		"hub:memory/load/lesson": function onLesson(lesson) {
			var me = this;

			if(lesson) {
				me.query("pc_student_lesson_map!" + me[STUDYPLAN_ITEM].properties.templateLessonId + ".lesson").spread(function(lessonMap){
					// make sure the widget listen from just correct lessonId
					if(lessonMap.lesson.templateLessonId === lesson.templateLessonId) {
						doRender.call(me, me[LESSON] = lesson);
					}
				});
			}

		},

		"hub/lesson/renderer": function onLessonRerender(){
			var me = this;

			doRender.call(me, me[LESSON]);
		},

		"hub/activity/update/progress": function () {
			var me = this;

			me.publish("lesson/renderer");
		},
		"dom:.ets-mob-tip-started/click": function () {
			var me = this;
			me[$ELEMENT].find(SEL_MOB_MODAL_STARTED).modal("show");
		},
		"dom:.ets-mob-tip-passed/click": function () {
			var me = this;
			me[$ELEMENT].find(SEL_MOB_MODAL_PASSED).modal("show");
		},
		"dom:.ets-btn-modal-close/click": function () {
			var me = this;
			me[$ELEMENT].find(SEL_MOB_MODAL).modal("hide");
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/lesson/step-list/step-list.html',[],function() { return function template(data) { var o = "";
	var steps = data.steps;
o += "\n<div class=\"ets-sp-steps\">\n\t";
		for (var i = 0; i < steps.length; i++) {
			var step = steps[i];
			writeStep(step);
		}
	o += "\n</div>\n\n"; function writeStep(step) { o += "\n\t<!-- Step Start -->\n\t<div data-weave=\"school-ui-studyplan/widget/studyplan/body/sequence-container/lesson/step/main\" data-id=\"" + step.id + "\" data-physical-lesson-id=\"" + data.physicalLesson+ "\" data-show-button=\"" + (step._showButton ? true : false) + "\" data-has-continue=\"" + (step._hasContinue ? true : false) + "\"></div>\n\t<!-- Step End -->\n"; }  return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/lesson/step-list/main',[
	"jquery",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"template!./step-list.html",
	"poly"
],function($, Widget, progressState, Parser, tStepList){
	"use strict";

	var $ELEMENT = "$element";

	var HAS_PASSED = "_hasPassed",
		HAS_STARTED = "_hasStarted",
		SHOW_BUTTON = "_showButton",
		HAS_CONTINUE = "_hasContinue";

	function doRender(lesson){
		var me = this;

		if(!lesson) {
			return;
		}

		var lessonId = lesson.id;

		return me.query(lessonId + ".children.progress").spread(function(lesson) {
			var steps = lesson.children;

			steps.every(function(e, i) {
				if(!progressState.hasPassed(e.progress.state)) {
					e[SHOW_BUTTON] = true;
					return false;
				}
				else {
					return true;
				}
			});

			steps.forEach(function(e, i) {
				if(progressState.hasStarted(e.progress.state)) {
					e[SHOW_BUTTON] = true;
					e[HAS_CONTINUE] = true;
				}
			});

			return me.html(tStepList, {
				steps: steps,
				physicalLesson: me["physicalLessonId"]
			});
		});
	}

	return Widget.extend(function(){
		var me = this;
		me["physicalLessonId"] = me[$ELEMENT].data("physical-lesson-id");
	},{
		"hub:memory/load/lesson": function onLesson(lesson) {
			var me = this;

			if(!lesson) {
				return;
			}

			doRender.call(me, me.lesson = lesson);
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/lesson/step/step.html',[],function() { return function template(data) { var o = "";
	var step = data.step;
o += "\n<ul class=\"ets-sp-step " + (data._hasPassed ? 'ets-pass' : '') + " " + (data._showButton ? 'ets-showButton' : '') + "\" data-hash='" + step._hash + "'>\n\t<li class=\"ets-sp-step-no\">" + step.stepNo + "</li>\n\t<li class=\"ets-sp-step-type\">" + step.stepTypeName + "</li>\n\t<li class=\"ets-sp-step-title ets-overflow\" title=\"" + step.stepName + "\">" + step.stepName + "</li>\n\t<li class=\"ets-sp-step-action\">\n\t\t"; if (data._hasPassed) {o += "\n\t\t\t"; if (data._isPerfect) {o += "\n\t\t\t\t<span class=\"badge pull-right\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"462935\" data-text-en=\"Perfect\"><i class=\"glyphicon glyphicon-ok\"></i></span>\n\t\t\t"; } else {o += "\n\t\t\t\t<i class=\"ets-icon-badge-checkmark\"></i>\n\t\t\t"; } o += "\n\t\t"; } else {o += "\n\t\t\t<button class=\"btn btn-primary btn-block btn-sm ets-sp-step-start\">\n\t\t\t\t"; if (data._hasContinue) { o += "\n\t\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"450010\" data-text-en=\"Continue\"></span>\n\t\t\t\t"; } else { o += "\n\t\t\t\t\t<span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"450009\" data-text-en=\"Start\"></span>\n\t\t\t\t"; } o += "\n\t\t\t</button>\n\t\t"; } o += "\n\t</li>\n</ul>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/lesson/step/main',[
	"jquery",
	"poly",
	"json2",
	"troopjs-ef/component/widget",
	"school-ui-shared/utils/progress-state",
	"school-ui-shared/utils/typeid-parser",
	"template!./step.html"
],function($, Poly, JSON, Widget, progressState, Parser, tStep){
	"use strict";

	/**
	 * Private variables declaration
	 */
	var $ELEMENT = "$element";

	function doRender(stepId){
		var me = this;

		if(!stepId) {
			return;
		}

		var stepQ = stepId + ".progress";
		var lessonQ = "student_lesson!template_lessson;" + me["physicalLessonId"] + ".parent.parent.parent";

		return me.query(stepQ, lessonQ).spread(function(step, lesson){

			step._hash = JSON.stringify({
				"prefix": "school",
				"enrollment": Parser.parseId(lesson.parent.parent.parent.studentCourseId),
				"course": Parser.parseId(lesson.parent.parent.parent.id),
				"level": Parser.parseId(lesson.parent.parent.id),
				"unit": Parser.parseId(lesson.parent.id),
				"lesson": Parser.parseId(step.parent.id),
				"step": Parser.parseId(step.id)
			});

			return me.html(tStep, {
				step: step,
				_showButton: !!(me["showButton"] == true),
				_hasContinue: !!(me["hasContinue"] == true),
				_isPerfect: !!(step.progress.score == 100),
				_hasPassed: progressState.hasPassed(step.progress.state)
			});
		});
	}

	return Widget.extend(function(){
		var me = this;
		me["stepId"] = me[$ELEMENT].data("id");
		me["showButton"] = me[$ELEMENT].data("show-button");
		me["hasContinue"] = me[$ELEMENT].data("has-continue");
		me["physicalLessonId"] = me[$ELEMENT].data("physical-lesson-id");
	},{
		"sig/start" : function(){
			var me = this;
			doRender.call(me, me.stepId);
		},

		"dom:.ets-sp-step/click": function routeStep(event) {
			var me = this,
				$step = $(event.currentTarget);

			me.publish("load", $.parseJSON($step.attr("data-hash")));

			return false;
		}
	});
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/lock/lock.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-unit-locked\">\n    <h1><i class=\"ets-icon-lock\"></i></h1>\n    <h1 data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"UNIT ^currentunit^ IS LOCKED\" data-blurb-id=\"569834\" data-values='" + JSON.stringify(data.blurbValues)+ "'></h1>\n    "; if(data.blurbValues.previousunit){ o += "\n        <h5 data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Complete Unit ^previousunit^ to unlock this unit\" data-blurb-id=\"569835\" data-values='" + JSON.stringify(data.blurbValues)+ "'></h5>\n    "; } o += "\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/lock/main',[
	"when",
	"poly",
	"troopjs-ef/component/widget",
	"template!./lock.html"
	],function(when, poly, Widget, tLock){
	"use strict";

	return Widget.extend({
		"hub:memory/load/unit" : function(unit){
			var me = this;
			var previousUnit;
			var currentUnit = unit && unit.unitNo;
			if(unit) {
				unit.parent.children.every(function(e, i){
					if(unit.id === e.id) {
						previousUnit = (i == 0 ? undefined : unit.parent.children[i - 1].unitNo);
						return false;
					}
					else {
						return true;
					}
				});

				me.html(tLock, {
					blurbValues : {
						currentunit : currentUnit,
						previousunit : previousUnit
					}
				});
			}
		}
	});
});
define('school-ui-studyplan/widget/studyplan/body/sequence-container/main',[
	"jquery",
	"when",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"client-tracking",
	"school-ui-studyplan/enum/studyplan-mode",
	"school-ui-studyplan/enum/studyplan-item-state",
	"school-ui-studyplan/enum/page-name",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/animation-helper",
	"poly/array"
], function ($, when, Widget, loom, weave, ct, studyplanMode, studyplanItemState, pageName, typeidParser, animationHelper, polyArray) {
	"use strict";

	var UNDEF;

	var $ELEMENT = "$element";

	var PREFIX_TEMP_UNIT = "template_unit;";

	var PROP_STUDYPLAN_ID = "_studyplan_id";
	var PROP_STUDYPLAN_ITEM_ID = "_studyplan_item_id";
	var PROP_STUDYPLAN_ITEM_INDEX = "_studyplan_item_index";
	var PROP_UNIT_ID = "_unit_id";
	var PROP_UNIT_TEMPLATE_ID = "_unit_template_id";
	var PROP_TYPE_CODE = "_type_code";

	var ANIMATION_UNITCHANGE = "unitNav_seqCon";
	var ANIMATION_ITEMCHANGE = "itemChange_seqCon";

	var CLS_CONTAINER = "ets-sp-sequence-container";
	var CLS_CONTAINER_ITEM = "ets-sp-sequence-item";
	var CLS_ITEM_ANIMATION = "ets-sp-item-animation";
	var CLS_CONTAINER_PREPEND_ITEM = "ets-sp-prepend-item";
	var CLS_ITEM_ANIMATION_LT_INDEX = "ets-sp-lt-index";
	var CLS_ITEM_ANIMATION_GT_INDEX = "ets-sp-gt-index";

	var WIDGET_PATH = "school-ui-studyplan/widget/studyplan/body/sequence-container/";
	var DURATION_ITEM_ANIMATION = 600;

	var ANIMATION_DIR = {
		L : "<--",
		R : "-->"
	};

	var CAMPUS_ENABLE = 'campus_enable';

	function doAnimation(typecode, studyplan_item, animationName, animationDir) {
		var me = this;

		// for campus release, goal will point to cp-goal widget
		var _typecode = me[CAMPUS_ENABLE] === 'true' && typecode === 'goal' ? 'cp-' + typecode : typecode;
		var $newItem = $("<div></div>")
			.addClass(CLS_CONTAINER_ITEM)
			.data("itemData", studyplan_item)
			.attr(loom.weave, WIDGET_PATH + _typecode + "/main(itemData)");
		studyplan_item && $newItem.attr("data-at-page-id", "sp-sequence-item-" + typeidParser.parseId(studyplan_item.id));

		var $wrapper = me[$ELEMENT];
		var $container = $wrapper.find("." + CLS_CONTAINER);
		var $oldItem = $container.find("." + CLS_CONTAINER_ITEM);

		if (animationDir && $oldItem.length) {

			$wrapper.addClass(CLS_ITEM_ANIMATION);
			$container.addClass(CLS_ITEM_ANIMATION);

			if (animationDir === ANIMATION_DIR.L) {
				$container.prepend($newItem);
				$container.addClass(CLS_CONTAINER_PREPEND_ITEM);
			} else {
				$container.append($newItem);
			}
		} else {
			$container = $("<div></div>").addClass(CLS_CONTAINER).html($newItem);
			$wrapper.html($container);
		}

		//start weave after the queue executed.
		//because we render in load/results, but load/xxx may publish immediately
		setTimeout(function () {
			$newItem.weave().then(function () {
				if(animationDir && $oldItem.length){
					animationHelper.request(animationName, function () {
						return when.promise(function (resolve) {
							$container.addClass(animationDir === ANIMATION_DIR.L ? CLS_ITEM_ANIMATION_LT_INDEX : CLS_ITEM_ANIMATION_GT_INDEX);

							setTimeout(function () {
								$container
									.removeClass([
										CLS_ITEM_ANIMATION,
										CLS_CONTAINER_PREPEND_ITEM,
										CLS_ITEM_ANIMATION_LT_INDEX,
										CLS_ITEM_ANIMATION_GT_INDEX
									].join(" "));

								$oldItem.remove();
								$wrapper.removeClass(CLS_ITEM_ANIMATION);

								resolve();

							}, DURATION_ITEM_ANIMATION);
						});
					});
				}
			});
		}, 0);


	}

	function doRender(unit_studyplan, studyplan, studyplan_item, animationName, animationDir) {
		var me = this;
		var typeCode;

		if (studyplan && unit_studyplan.mode !== UNDEF) {
			switch(unit_studyplan.mode) {
				case studyplanMode.Create: //create
					typeCode = "config";
					me[PROP_STUDYPLAN_ITEM_INDEX] = -1;
					break;
				case studyplanMode.Locked: //locked
					typeCode = "lock";
					break;
				case studyplanMode.Study: //study
					typeCode = studyplan_item && studyplan_item.typeCode;
					me[PROP_STUDYPLAN_ITEM_INDEX] = studyplan_item && studyplan_item.itemIndex;
					break;
			}

			if (typeCode) {
				me[PROP_TYPE_CODE] = typeCode;
				me.query('member_site_setting!"school;studyplan.newui.enabled"').spread(function(campusEnable){
					me[CAMPUS_ENABLE] = campusEnable.value;
					doAnimation.call(me, typeCode, studyplan_item, animationName, animationDir);
				});
				// for omniture track
				var isItemInStudyplan;
				studyplan.items.every(function (e, i) {
					if (studyplan_item && e.id === studyplan_item.id) {
						isItemInStudyplan = true;
						return false;
					}
					else {
						return true;
					}
				});
				isItemInStudyplan && track.call(me, typeCode, studyplan_item);
			}
		}
	}

	/**
	 * omniture track function
	 * @param typecode
	 * @param item
	 */
	function track(typecode, item) {
		var me = this;

		switch (typecode) {
			case "lesson":
				me.query("pc_student_lesson_map!" + item.properties.templateLessonId).spread(function (lessonMap) {
					ct.pagename(pageName["lesson" + lessonMap.lesson.lessonNo]);
				});
				break;
			case "gl":
				ct.pagename(pageName.gl);
				break;
			case "pl":
				ct.pagename(pageName.pl);
				break;
			case "goal":
				ct.pagename(pageName.goal);
				break;
		}
	}

	return Widget.extend({
		"hub/studyplan/sequence-container/reload": function () {
			var me = this;
			if(me[PROP_STUDYPLAN_ITEM_ID]){
				when.all(
					[
						me.query(me[PROP_STUDYPLAN_ITEM_ID]),
						me.query('member_site_setting!"school;studyplan.newui.enabled"'),
						me[$ELEMENT].find("[" + loom.woven + "]").unweave()
					]).spread(function (item, campusEnable) {
						me[CAMPUS_ENABLE] = campusEnable[0].value;
						me[$ELEMENT].find("." + CLS_CONTAINER_ITEM).remove();
						doAnimation.call(me, me[PROP_TYPE_CODE], item[0]);
					});
			}

		},

		"hub:memory/load/results": function (results) {
			var me = this;

			var animationDir;
			var currentIndex;
			var preIndex;

			if(results.unit){
				// When the unit or studyplan is different, start to render a new sequence-container.
				// and the sequence navigation will render either (please check code in /js/widget/studyplan/body/sequence-naviagtion/main.js)

				// So, sequence-navigation and sequence-container will be animated at the same time.
				if (( results.studyplan && me[PROP_STUDYPLAN_ID] !== results.studyplan.id) ||
					(!results.studyplan && me[PROP_UNIT_TEMPLATE_ID] !== results.unit.templateUnitId)
					){
					// exclude create studyplan case
					if(me[PROP_UNIT_TEMPLATE_ID] !== results.unit.templateUnitId){
						// Compare current unit with prev unit, to ensure animate slide direction.
						// If change unit at the same level, animationDir will be a direction String.
						// If change unit at the different level, animationDir will be UNDEF and animation will not be run.
						results.unit.parent.children.forEach(function (e, i) {
							switch(e.templateUnitId){
								case results.unit.templateUnitId:
									currentIndex = i;
								break;
								case me[PROP_UNIT_TEMPLATE_ID]:
									preIndex = i;
								break;
							}
						});
						if(currentIndex !== UNDEF && preIndex !== UNDEF){
							animationDir = ANIMATION_DIR[currentIndex < preIndex ? "L" : "R"];
						}
					}

					var unit_studyplan = results.unit_studyplan;

					/**
					 * When the results contain studyplan data.
					 *  *** --> #study/xxx/yyy
					 *      case 1 :
					 *          #config?unit_id=xxx --> #study/xxx     (create studyplan -> not animated)
					 *      case 2 :
					 *          #study/aaa/bbb      --> #study/xxx/yyy (unit navigation  -> animated
					 *                                                  change level     -> not animated)
					 *      case 3 :
					 *          EMPTY               --> #study/xxx/yyy (Landing          -> not animated)
					 */
					var studyplan = results.studyplan

					/**
					 * when the results do not contain studyplan data.
					 *  *** --> #config?unit_id=xxx
					 *      case 4 :
					 *          #config?unit_id=aaa --> #config?unit_id=xxx (change level    -> not animated)
					 *      case 5 :
					 *          #study/aaa/bbb      --> #config?unit_id=xxx (unit navigation -> animated
					 *                                                       change level    -> not animated)
					 *      case 6 :
					 *          EMPTY               --> #config?unit_id=xxx (Landing         -> not animated)
					 */
									|| results.unit_studyplan.studyPlan;

					me[PROP_UNIT_ID] = results.unit && results.unit.studentUnitId;
					me[PROP_UNIT_TEMPLATE_ID] = results.unit && results.unit.templateUnitId;
					me[PROP_STUDYPLAN_ID] = studyplan.id;
					me[PROP_STUDYPLAN_ITEM_ID] = results.studyplan_item && results.studyplan_item.id;

					doRender.call(me,
						unit_studyplan,
						studyplan,
						results.studyplan_item,
						ANIMATION_UNITCHANGE,
						animationDir
					);
				}
				// when the same studyplan, different item, only render a new sequence-container.
				// So, sequence-navigation will not be animated, only sequence-container will be animated.
				/**
				 * case 1 :
				 *      #study/aaa/bbb --> #study/aaa/ccc (change studyplan item -> animate)
				 * case 2 :
				 *      #study/aaa     --> #study/aaa/bbb (create studyplan      -> animate)
				 */
				else if (	results.studyplan && results.studyplan_item && results.unit_studyplan &&
							me[PROP_STUDYPLAN_ID] === results.studyplan.id &&
							me[PROP_STUDYPLAN_ITEM_ID] !== (results.studyplan_item && results.studyplan_item.id)) {

					if (me[PROP_STUDYPLAN_ITEM_INDEX] !== results.studyplan_item.itemIndex) {
						animationDir = ANIMATION_DIR[me[PROP_STUDYPLAN_ITEM_INDEX] > results.studyplan_item.itemIndex ? "L" : "R"];
					}

					me[PROP_UNIT_ID] = results.unit && results.unit.studentUnitId;
					me[PROP_UNIT_TEMPLATE_ID] = results.unit && results.unit.templateUnitId;
					me[PROP_STUDYPLAN_ID] = results.studyplan && results.studyplan.id;
					me[PROP_STUDYPLAN_ITEM_ID] = results.studyplan_item && results.studyplan_item.id;

					doRender.call(me,
						results.unit_studyplan,
						results.studyplan,
						results.studyplan_item,
						ANIMATION_ITEMCHANGE,
						animationDir
					);
				}
			}
			else{
				me[PROP_UNIT_ID] =
					me[PROP_UNIT_TEMPLATE_ID] =
					me[PROP_STUDYPLAN_ID] =
					me[PROP_STUDYPLAN_ITEM_ID] = UNDEF;
			}
		},

		"hub/load/launcher": function (requests) {
			var me = this;

			//for activity container
			if(requests.prefix === "school") {
				return;
			}

			//the same if condition with load/results
			if (( requests.studyplan &&
					requests.studyplan !== typeidParser.parseId(me[PROP_STUDYPLAN_ID])) ||

				(!requests.studyplan && requests.unit &&
					requests.unit !== (PREFIX_TEMP_UNIT + me[PROP_UNIT_TEMPLATE_ID])) ||

				( requests.studyplan && requests.studyplan_item &&
					requests.studyplan_item !== typeidParser.parseId(me[PROP_STUDYPLAN_ITEM_ID]))
				) {
				return when.promise(function (resolve) {
					me[$ELEMENT].find("[" + loom.woven + "]").unweave().then(function () {
						resolve();
					});
				});
			}
		}
	});
});

define('school-ui-studyplan/widget/studyplan/body/sequence-container/pl/main',[
	"jquery",
	"troopjs-ef/component/widget"
], function ($, Widget) {
	"use strict";
	var ITEM_DATA = "_item_data";

	return Widget.extend(function ($element, path, itemData) {
		this[ITEM_DATA] = itemData;
	}, {
		"sig/start": function () {
			var me = this;

			return me.publish("school/interface/studyplan/pl-container-widget",
				"school-ui-studyplan/widget/gl-pl/privatelesson/main").spread(function (widgetPath) {

				$("<div></div>", {
					"data-weave": widgetPath + "(itemData)",
					data: {
						itemData: me[ITEM_DATA]
					}
				}).appendTo(me.$element).weave();
			});
		}
	});
});

define('school-ui-studyplan/widget/studyplan/body/sequence-container/sppl20/main',[
	"jquery",
	"troopjs-ef/component/widget"
], function ($, Widget) {
	"use strict";
	var ITEM_DATA = "_item_data";

	return Widget.extend(function ($element, path, itemData) {
		this[ITEM_DATA] = itemData;
	}, {
		"sig/start": function () {
			var me = this;

			return me.publish("school/interface/studyplan/pl20-container-widget",
				"school-ui-studyplan/widget/gl-pl/privatelesson/main").spread(function (widgetPath) {

				$("<div></div>", {
					"data-weave": widgetPath + "(itemData)",
					data: {
						itemData: me[ITEM_DATA]
					}
				}).appendTo(me.$element).weave();
			});
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-container/unavailable/unavailable.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-chrysalis-unit\">\n    <h3><i class=\"glyphicon glyphicon-info-sign\"></i></h3>\n    <h5 data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"This unit was completed with an earlier version of the school.\" data-blurb-id=\"632524\"></h5>\n    <p data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"All your progress have been stored, but unfortunately the activities done cannot be reviewed.\" data-blurb-id=\"632525\"></p>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-container/unavailable/main',[
    "troopjs-ef/component/widget",
    "template!./unavailable.html"
    ],function(Widget, tUnavailable){
    "use strict";
    return Widget.extend({
        "sig/start" : function(){
            return this.html(tUnavailable);
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/item.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-sqn-item-badge\">\n\t<i class=\"ets-sp-sqn-item-icon\">\n\t\t<i class=\"ets-sp-sqn-icon-bg " + data.itemBackgroundClass+ "\"></i>\n\t\t<i class=\"ets-sp-sqn-icon-badge " + data.itemClass+ "\"></i>\n\t</i>\n</div>\n<div class=\"ets-sp-sqn-item-title\">" + data.topic+ "</div>\n<i class=\"ets-icon-arrow-up\"></i>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/base',[
	"jquery",
	"jquery.gudstrap",
	"when",
	"troopjs-ef/component/widget",
	"troopjs-browser/loom/config",
	"troopjs-browser/loom/weave",
	"school-ui-studyplan/enum/studyplan-mode",
	"school-ui-studyplan/enum/studyplan-state",
	"school-ui-studyplan/enum/studyplan-item-state",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/utils/state-parser",
	"school-ui-studyplan/utils/client-storage",
	"school-ui-shared/utils/update-helper",
	"school-ui-shared/utils/console",
	"template!./item.html"
], function (
	$,
	$GUD,
	when,
	Widget,
	loom,
	weave,
	studyplanMode,
	studyPlanState,
	itemState,
	typeidParser,
	stateParser,
	clientStorage,
	updateHelper,
	Console,
	tItem
) {

	var UNDEF;
	var $ELEMENT = "$element";
	var ID = "_id";
	var UNIT_STUDYPLAN_MODE = "_unit_studyplan_mode";
	var DATA = "_data";
	var ITEM_UI_STATUS = "_item_ui_status";
	var CLS_ITEM_BADGE = "ets-sp-sqn-item-badge";
	var CLS_CUSTOM_MARK = "ets-badge-custommark";
	var CLS_STATUS_PASS = "ets-pass";
	var CLS_STATUS_SUGGEST = "ets-suggest";
	var CLS_STATUS_SELECTED = "ets-active";
	var CLS_STATUS_LOCKED = "ets-locked";
	var CLS_STATUS_UNAVAILABLE = "ets-unavailable";
	var RENDER_DATA = "_render_data";
	var DFD_POPOVER = "_dfd_popover";
	var SHOWN_POPOVER_ITEMS = "shown_popover_ids";
	var ID_SEPARATOR = ",";
	var DURATION_POPOVER_SHOW = 5000;
	var DELAY_HIDE_POPOVER_TIMER = "_delay_hide_popover_timer";
	var STORE_SHOWN_POPOVER_ID = "_store_shown_popover_id";
	var WIDGET_MARK_PATH = "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/";
	var WIDGET_GOAL_PATH = "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/cp-goal";

	function getLockedState(normalizeState, studyPlan, widgetPath){
		if(!studyPlan){
			return false;
		}
		var goalLocked = studyPlan.progress.state !== studyPlanState.Completed;
		if (widgetPath === WIDGET_GOAL_PATH) {
			return goalLocked;
		}
		return normalizeState.Locked;
	}

	function getProgressQuery(query, mode) {
		return mode === studyplanMode.Study ? query + ".progress" : query;
	}

	function render(itemId) {

		var me = this;
		var query = "campus_student_studyplan_item!" + itemId;

		return when(
			(me[DATA] && [me[DATA]]) ||
			me.query(getProgressQuery(query, me[UNIT_STUDYPLAN_MODE]))
		).spread(function (studyPlanItem) {
			//wait for topic promise resolve
			return when.all([
				me[RENDER_DATA].topic,
				me[RENDER_DATA].popoverTitle,
				me[RENDER_DATA].popoverContent
			]).spread(function (topic, popoverTitle, popoverContent) {
				me[RENDER_DATA].topic = topic;
				me[RENDER_DATA].popoverTitle = popoverTitle;
				me[RENDER_DATA].popoverContent = popoverContent;

				if (me[RENDER_DATA].popoverTitle || me[RENDER_DATA].popoverContent) {
					if (me[DFD_POPOVER].promise.inspect().state !== "fulfilled") {
						me[$ELEMENT].popover({
							trigger: "manual",
							title: me[RENDER_DATA].popoverTitle,
							content: me[RENDER_DATA].popoverContent,
							placement: "bottom"
						});
						me[DFD_POPOVER].resolve();
					}
				}
				return [studyPlanItem];
			});
		})
			.spread(function (studyplanItem) {

				// use hub to sync item state, for other party
				// if there is not any values return. the state keep original.
				// otherwise, return a state value in array to replace it.
				// make sure that use "if" to filter beside ids

				// e.g:
				// "hub/studyplan/sequence-item/sync/state" : function(id, state){
				//      if(id==="8912") return [1];
				// },

				//the last argument
				var state = studyplanItem.progress.state;
				var renderData = me[RENDER_DATA];
				var markWidget = renderData.customMark.slice();
				var hasBeenRender = !!me[$ELEMENT].find("." + CLS_ITEM_BADGE).length;
				var normalizeState = stateParser.parseFlag(itemState, state);

				var lockedState = getLockedState(normalizeState, me.studyPlan,  markWidget[0]);
				//reset rander data
				normalizeState.Completed && markWidget.push(WIDGET_MARK_PATH + "check");
				lockedState && markWidget.push(WIDGET_MARK_PATH + "locked");

				var renderPromise = (hasBeenRender ?
					when.resolve() :
					//if there is a template specify
					me.html(renderData.template || tItem, renderData));
				return renderPromise.then(function () {
					me[$ELEMENT].toggleClass(CLS_STATUS_PASS, normalizeState.Completed);
					me[$ELEMENT].toggleClass(CLS_STATUS_LOCKED, lockedState);
					renderCustomMark.call(me, markWidget, studyplanItem);
				});
			});
	}

	function renderCustomMark(markWidget, studyplanItem) {
		var me = this;
		var $badge = me[$ELEMENT].find("." + CLS_ITEM_BADGE);
		var $marks = me[$ELEMENT].find("." + CLS_CUSTOM_MARK);

		if (markWidget.length) {
			markWidget.reduce(function (promise, markWidgetPath) {
				return promise.then(function (woven) {
					if (woven) {
						return true;
					}

					// markWidgetPath may be a promise
					when.resolve(markWidgetPath)
						.then(function (resolvedMarkWidgetPath) {
							var newMark = $("<div></div>")
								.addClass(CLS_CUSTOM_MARK)
								.attr(loom.weave, resolvedMarkWidgetPath + "(itemData)")
								.attr("data-item-data", JSON.stringify(studyplanItem))
								.appendTo($badge);
							return newMark.weave()
								.then(function () {
									return true; //woven
								}, function () {
									newMark.unweave().catch(function (reason) {
										Console.info(reason);
									}).then(function () {
										newMark.remove();
									});
									return false; //not woven
								});
						});
				});
			}, when.resolve(false/*not woven*/))
				.then(function () {
					$marks.remove();
				});
		}
		else {
			$marks.remove();
		}
	}


	return Widget.extend(function () {
		var me = this;
		me[ID] = me[$ELEMENT].data("itemId");
		me[UNIT_STUDYPLAN_MODE] = me[$ELEMENT].data("unitStudyplanMode");
		me[ITEM_UI_STATUS] = {
			selected: UNDEF,
			suggest: UNDEF
		};
		me[RENDER_DATA] = me[RENDER_DATA] || {
			template: "",
			//push by subclass
			customMark: [],
			//provided by subclass
			topic: "",
			//provided by subclass
			itemClass: "",
			//provided by subclass
			itemBackgroundClass: ""
		};
	}, {
		"sig/start": function () {
			var me = this;
			me[DFD_POPOVER] = when.defer();
			me[STORE_SHOWN_POPOVER_ID] = true;
			return render.call(me, me[ID]);
		},
		"hub/studyplan/sequence-item/update": function (id) {
			var me = this;
			if (!id || typeidParser.parseId(id) === me[ID]) {
				render.call(me, me[ID]);
			}
		},
		"hub:memory/load/studyplan": function (data) {
			var me = this;
			if (data) {
				me.studyplanId = typeidParser.parseId(data.id);
				me.studyPlan = data;
				render.call(me, me[ID]);
			}
		},
		"dom/click": function () {
			this.clickHandler();
		},
		"clickHandler": function () {
			var me = this;
			if (!me[ITEM_UI_STATUS].selected && !me[ITEM_UI_STATUS].unavailable) {
				me.publish("load", {
					"studyplan_item": me[ID]
				});
				//hub way
				me.publish("studyplan/sequence-item/selected", me[ID]);
				//css way : set the css first
				// me[ITEM_UI_STATUS].selected = true;
				// me.resetStatusClass();

			}
		},
		//triggle active item by hub
		"hub/studyplan/sequence-item/trigger/click": function (id) {
			if (typeidParser.parseId(id) === this[ID]) {
				this.clickHandler();
			}
		},
		"hub:memory/studyplan/sequence-item/unavailable": function (unavailable, onlyEnableId) {
			var me = this;
			me[ITEM_UI_STATUS].unavailable = unavailable && (onlyEnableId !== me[ID]);
			me.resetStatusClass();
			me.unavailable && me.unavailable(me[ITEM_UI_STATUS].unavailable);
		},
		"hub:memory/studyplan/sequence-item/selected": function (id) {
			var me = this;
			id = typeidParser.parseId(id);
			me[ITEM_UI_STATUS].selected = (id === me[ID]);
			me.resetStatusClass();
			me.selected && me.selected(me[ITEM_UI_STATUS].selected, id);
		},
		"hub:memory/studyplan/sequence-item/suggest": function (id) {
			var me = this;
			id = typeidParser.parseId(id);
			me[ITEM_UI_STATUS].suggest = (id === me[ID]);
			me.resetStatusClass();
			me.suggest && me.suggest(me[ITEM_UI_STATUS].suggest, id);
		},
		"resetStatusClass": function () {
			var me = this;
			me[$ELEMENT].toggleClass(CLS_STATUS_SUGGEST, me[ITEM_UI_STATUS].suggest);
			me[$ELEMENT].toggleClass(CLS_STATUS_SELECTED, me[ITEM_UI_STATUS].selected);
			me[$ELEMENT].toggleClass(CLS_STATUS_UNAVAILABLE, me[ITEM_UI_STATUS].unavailable);
		},
		"showPopover": function () {
			var me = this;
			me[DFD_POPOVER].promise.then(function () {
				me[$ELEMENT].data("popoverStatus") !== "show" &&
				me[$ELEMENT].popover("show") &&
				me[$ELEMENT].data("popoverStatus", "show");
			});
		},
		"hidePopover": function () {
			var me = this;
			me[DFD_POPOVER].promise.then(function () {
				me[$ELEMENT].data("popoverStatus") !== "hide" &&
				me[$ELEMENT].popover("hide") &&
				me[$ELEMENT].data("popoverStatus", "hide");
			});
		},
		"delayHidePopover": function () {
			var me = this;
			me[DELAY_HIDE_POPOVER_TIMER] && clearTimeout(me[DELAY_HIDE_POPOVER_TIMER]);
			me[DELAY_HIDE_POPOVER_TIMER] = setTimeout(function () {
				clearTimeout(me[DELAY_HIDE_POPOVER_TIMER]);
				me.hidePopover();
			}, DURATION_POPOVER_SHOW);
		},
		"canShowPopover": function () {
			var me = this;
			return me[ITEM_UI_STATUS].suggest && me[ITEM_UI_STATUS].selected === false && me[ITEM_UI_STATUS].unavailable === false && !me.isShownIdStored();
		},
		"tryShowPopover": function () {
			var me = this;
			if (me.canShowPopover()) {
				me.showPopover();
				me.delayHidePopover();
				me[STORE_SHOWN_POPOVER_ID] && me.storeShownId();
			}
		},
		"isStoreShownId": function () {
			return this[STORE_SHOWN_POPOVER_ID];
		},
		"setStoreShownId": function (value) {
			return this[STORE_SHOWN_POPOVER_ID] = value;
		},
		"isShownIdStored": function () {
			var me = this;
			var ids = clientStorage.getLocalStorage(SHOWN_POPOVER_ITEMS) || ID_SEPARATOR;
			return ids.indexOf(ID_SEPARATOR + me[ID] + ID_SEPARATOR) > -1;
		},
		"storeShownId": function () {
			var me = this;
			if (!me.isShownIdStored()) {
				var shownIds = clientStorage.getLocalStorage(SHOWN_POPOVER_ITEMS) || ID_SEPARATOR;
				shownIds += me[ID] + ID_SEPARATOR;
				clientStorage.setLocalStorage(SHOWN_POPOVER_ITEMS, shownIds);
			}
		}
	});
});

define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/config',[
	"./base"
], function (Widget) {

	var ID = "_id";
	var DATA = "_data";
	var RENDER_DATA = "_render_data";

	return Widget.extend(function ($element, path, itemID) {
		var me = this;
		me[DATA] = {
			id: "config",
			typeCode: "config",
			progress: {
				state: 0
			}
		};
		me[ID] = me[DATA].id;
	}, {
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-setup";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				me[RENDER_DATA].topic = me.query("blurb!656053").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		}
	})
});
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/cp-goal',[
	"./base"
], function (Widget) {

	var ID = "_id";
	var $ELEMENT = "$element";
	var RENDER_DATA = "_render_data";
	var ITEM_UI_STATUS = "_item_ui_status";
	var CLS_GOAL = "ets-sp-sqn-item-goal";
	var PREVIOUS_SELECTED_ID = "_previous_selected_id";
	var WIDGET_MARK_PATH = "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/";

	return Widget.extend(function ($element, path, itemID) {
		var me = this;
		me[$ELEMENT].addClass(CLS_GOAL);
	}, {
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-goal-poly";
				me[RENDER_DATA].itemBackgroundClass = "ets-icon-goal-bg";
				me[RENDER_DATA].customMark.push(WIDGET_MARK_PATH + "cp-goal");
				me[RENDER_DATA].topic = me.query("blurb!568667").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverTitle = me.query("blurb!571166").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverContent = me.query("blurb!571167").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		},
		"hub/studyplan/sequence/update": function () {
			var me = this;
			me.tryShowPopover();
		},
		"suggest": function () {
			var me = this;
			me.tryShowPopover();
		},
		"unavailable": function () {
			var me = this;
			me.tryShowPopover();
		},
		"selected": function (selected, id) {
			var me = this;

			//for continuously trigged "selected" callback
			//from clickHandler() and hub:memory/load/studyplan_item
			//make sure that process same id only once
			//otherwise notification will be shown and hidden immediately
			if (id !== me[PREVIOUS_SELECTED_ID]) {
				if (me.canShowPopover()) {
					me.tryShowPopover();
				} else {
					me.hidePopover();
				}
				me[PREVIOUS_SELECTED_ID] = id;
			}
		},
		"hub/activity/opened": function () {
			var me = this;
			me.setStoreShownId(false);
		},
		"hub/activity/closed": function () {
			var me = this;
			me.setStoreShownId(true);
			me.tryShowPopover();
		}
	})
});

define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/cp20',[
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";
	var ITEM_UI_STATUS = "_item_ui_status";
	var PREVIOUS_SELECTED_ID = "_previous_selected_id";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-check-point";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				// if we use custom mark in PL, add this code
				me[RENDER_DATA].customMark.push(
					me.publish("school/interface/studyplan/cp20-mark-widget",
						"school-ui-studyplan/widget/gl-pl/mark/cp20").spread(function (widgetPath) {
							return widgetPath;
						})
				);
				me[RENDER_DATA].topic = me.query("blurb!639494").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverTitle = me.query("blurb!639496").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverContent = me.query("blurb!639497").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		},
		"hub/studyplan/sequence/update": function () {
			var me = this;
			me.tryShowPopover();
		},
		"suggest": function () {
			var me = this;
			me.tryShowPopover();
		},
		"unavailable": function () {
			var me = this;
			me.tryShowPopover();
		},
		"selected": function (selected, id) {
			var me = this;

			//for continuously trigged "selected" callback
			//from clickHandler() and hub:memory/load/studyplan_item
			//make sure that process same id only once
			//otherwise notification will be shown and hidden immediately
			if (id !== me[PREVIOUS_SELECTED_ID]) {
				if (me.canShowPopover()) {
					me.tryShowPopover();
				} else {
					me.hidePopover();
				}
				me[PREVIOUS_SELECTED_ID] = id;
			}
		},
		"hub/activity/opened": function () {
			var me = this;
			me.setStoreShownId(false);
		},
		"hub/activity/closed": function () {
			var me = this;
			me.setStoreShownId(true);
			me.tryShowPopover();
		}
	})
});

define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/gl',[
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-group-lesson";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				// if we use custom mark in PL, add this code
				//me[RENDER_DATA].customMark.push("...");
				me[RENDER_DATA].topic = me.query("blurb!638118").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		}
	})
});
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/goal',[
	"./base"
], function (Widget) {

	var ID = "_id";
	var $ELEMENT = "$element";
	var RENDER_DATA = "_render_data";
	var ITEM_UI_STATUS = "_item_ui_status";
	var CLS_GOAL = "ets-sp-sqn-item-goal";
	var PREVIOUS_SELECTED_ID = "_previous_selected_id";
	var WIDGET_MARK_PATH = "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/";

	return Widget.extend(function ($element, path, itemID) {
		var me = this;
		me[$ELEMENT].addClass(CLS_GOAL);
	}, {
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-goal-poly";
				me[RENDER_DATA].itemBackgroundClass = "ets-icon-goal-bg";
				me[RENDER_DATA].customMark.push(WIDGET_MARK_PATH + "goal");
				me[RENDER_DATA].topic = me.query("blurb!568667").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverTitle = me.query("blurb!571166").spread(function (blurb) {
					return blurb && blurb.translation;
				});
				me[RENDER_DATA].popoverContent = me.query("blurb!571167").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		},
		"hub/studyplan/sequence/update": function () {
			var me = this;
			me.tryShowPopover();
		},
		"suggest": function () {
			var me = this;
			me.tryShowPopover();
		},
		"unavailable": function () {
			var me = this;
			me.tryShowPopover();
		},
		"selected": function (selected, id) {
			var me = this;

			//for continuously trigged "selected" callback
			//from clickHandler() and hub:memory/load/studyplan_item
			//make sure that process same id only once
			//otherwise notification will be shown and hidden immediately
			if (id !== me[PREVIOUS_SELECTED_ID]) {
				if (me.canShowPopover()) {
					me.tryShowPopover();
				} else {
					me.hidePopover();
				}
				me[PREVIOUS_SELECTED_ID] = id;
			}
		},
		"hub/activity/opened": function () {
			var me = this;
			me.setStoreShownId(false);
		},
		"hub/activity/closed": function () {
			var me = this;
			me.setStoreShownId(true);
			me.tryShowPopover();
		}
	})
});

define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/lesson',[
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[ID] && me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-lesson";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				me[RENDER_DATA].topic = me.query("campus_student_studyplan_item!" + me[ID] + ".properties").spread(function (studyPlanItem) {
					return me.query("student_lesson!template_lesson;" + studyPlanItem.properties.templateLessonId);
				}).spread(function (studentLesson) {
					return studentLesson.lessonName;
				});
			}
		}
	})
});
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/pl',[
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-private-lesson";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				// if we use custom mark in PL, add this code
				me[RENDER_DATA].customMark.push(
                    me.publish( "school/interface/studyplan/pl-mark-widget",
                                "school-ui-studyplan/widget/gl-pl/mark/pl").spread(function(widgetPath){
                                    return widgetPath;
                                })
                );
				me[RENDER_DATA].topic = me.query("blurb!569833").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		}
	})
});

define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/sppl20',[
	"./base"
], function (Widget) {

	var ID = "_id";
	var RENDER_DATA = "_render_data";

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			if (me[RENDER_DATA]) {
				me[RENDER_DATA].itemClass = "ets-icon-badge-private-lesson";
				me[RENDER_DATA].itemBackgroundClass = "glyphicon icon-circle";
				// if we use custom mark in PL, add this code
				me[RENDER_DATA].customMark.push(
					me.publish("school/interface/studyplan/pl20-mark-widget",
						"school-ui-studyplan/widget/gl-pl/mark/pl").spread(function (widgetPath) {
						return widgetPath;
					})
				);
				me[RENDER_DATA].topic = me.query("blurb!569833").spread(function (blurb) {
					return blurb && blurb.translation;
				});
			}
		}
	})
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-navigation/sequence-nav.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-sqn ets-sp-sequence-item\">\n\t<!-- Sequence Navigation Start -->\n\t<div class=\"ets-sp-sqn-main\">\n\t\t<ul class=\"ets-sp-sqn-container\">\n            <div class=\"ets-sp-sqn-line\"></div>\n        </ul>\n\t</div>\n\t<!-- Sequence Navigation End -->\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/main',[
	"when",
	"jquery",
	"troopjs-ef/component/widget",
	"template!./sequence-nav.html",
	"school-ui-shared/utils/typeid-parser",
	"school-ui-studyplan/enum/studyplan-mode",
	"school-ui-studyplan/enum/studyplan-state",
	"school-ui-studyplan/enum/studyplan-item-state",
	"school-ui-studyplan/enum/studyplan-velocity",
	"school-ui-studyplan/utils/state-parser",
	"troopjs-browser/loom/config",
	"school-ui-studyplan/utils/animation-helper",
	"jquery.gudstrap",
	"lodash"
], function (when, $, Widget, tSequence, typeidParser, studyplanMode, studyplanState, itemState, velocityState, stateParser, loom, animationHelper, $gudstrap, _) {

	var UNDEF;
	var DATA_UNIT_STUDYPLAN = "_data_unit_studyplan";
	var DATA_STUDYPLAN = "_data_studyplan";

	var PREFIX_TEMP_UNIT = "template_unit;";

	var CLS_CONTAINER = "ets-sp-sequence-navigation-container";
	var CLS_ITEM_CONTENT = "ets-sp-sqn-container";
	var CLS_PATH_COMPLETE = "ets-complete";
	var CLS_ITEM = "ets-sp-sqn-item";
	var CLS_REMOVEABLE = "ets-sp-sqn-removeable";
	var CLS_ITEM_CONTAINER = "ets-sp-sequence-item";
	var CLS_ITEM_ANIMATION = "ets-sp-item-animation";
	var CLS_CONTENT_PREPEND_ITEM = "ets-sp-prepend-item";
	var CLS_ITEM_ANIMATION_LT_INDEX = "ets-sp-lt-index";
	var CLS_ITEM_ANIMATION_GT_INDEX = "ets-sp-gt-index";

	var CONFIG_ID = "config";
	var $ELEMENT = "$element";
	var PATH_ITEM = "school-ui-studyplan/widget/studyplan/body/sequence-navigation/item/";

	var PROP_STUDYPLAN_ID = "_studyplan_id";
	var PROP_UNIT_STUDYPLAN_ID = "_unit_studyplan_id";
	var PROP_UNIT_ID = "_unit_id";
	var PROP_UNIT_TEMPLATE_ID = "_unit_template_id";
	var ANIMATION_CHANGE = "unitNav_seqNav";
	var DURATION_ITEM_ANIMATION = 600;

	var PROMISE_RENDER = "_promise_render";

	var ANIMATION_DIR = {
		L : "<--",
		R : "-->"
	};

	var CAMPUS_ENABLE = 'campus_enable';

	function getProgressQuery(query, mode){
		return mode === studyplanMode.Study ? query + ".progress" : query;
	}

	function doRender(unit_studyplan, studyplan, animationDir) {
		var me = this;
		var $wrapper = me[$ELEMENT];
		var $container = $wrapper.find("." + CLS_CONTAINER);
		var $oldNavi = $container.find("." + CLS_ITEM_CONTAINER);
		var $itemContent;

		return me.query(
			getProgressQuery(studyplan.id, unit_studyplan.mode),
			'member_site_setting!"school;studyplan.newui.enabled"'
		).spread(function(studyplan, campusEnable){

			me[DATA_UNIT_STUDYPLAN] = unit_studyplan;
			me[DATA_STUDYPLAN] = studyplan;
			me[CAMPUS_ENABLE] = campusEnable.value;

			if (animationDir && $oldNavi.length) {
				var ltItemIndex = animationDir === ANIMATION_DIR.L;
				var $newNavi = $(tSequence());

				$wrapper.addClass(CLS_ITEM_ANIMATION);
				$container.addClass(CLS_ITEM_ANIMATION);

				if (ltItemIndex) {
					$container.prepend($newNavi);
					$container.addClass(CLS_CONTENT_PREPEND_ITEM);
				} else {
					$container.append($newNavi);
				}

				$itemContent = $newNavi.find("." + CLS_ITEM_CONTENT);

				return when.all(doRenderItems.call(me, $itemContent)).then(function () {
					var animateDefer = when.defer();
					animationHelper.request(ANIMATION_CHANGE, function () {
						return when.promise(function (resolve) {
							$container.addClass(ltItemIndex ? CLS_ITEM_ANIMATION_LT_INDEX : CLS_ITEM_ANIMATION_GT_INDEX);
							setTimeout(function () {
								$container
									.removeClass([
										CLS_ITEM_ANIMATION,
										CLS_CONTENT_PREPEND_ITEM,
										CLS_ITEM_ANIMATION_LT_INDEX,
										CLS_ITEM_ANIMATION_GT_INDEX
									].join(" "));

								$oldNavi.remove();
								$wrapper.removeClass(CLS_ITEM_ANIMATION);
								resolve();
							}, DURATION_ITEM_ANIMATION);
						})
						.then(animateDefer.resolve, animateDefer.reject);
					});
					return animateDefer.promise;
				});

			} else {
				$itemContent = $wrapper.find("." + CLS_ITEM_CONTENT);
				if (!$itemContent.length) {
					$container = $("<div></div>").addClass(CLS_CONTAINER).html(tSequence()).appendTo($wrapper);
					$itemContent = $container.find("." + CLS_ITEM_CONTENT);
				}
				return when.all(doRenderItems.call(me, $itemContent));
			}

		});
	}

	function doRenderItems($itemContent) {
		var me = this;

		var mode = me[DATA_UNIT_STUDYPLAN].mode;
		var crashedState;
		var renderItems;
		var itemPromise = [];
		var onlyEnableId;

		var data = me[DATA_STUDYPLAN];
		//mark ready to remove
		$itemContent.find("." + CLS_ITEM).addClass(CLS_REMOVEABLE);

		//if studyplan is template
		//means we need to setup this studyplan, add a setup item to the beginning
		if (mode === studyplanMode.Create) {
			me.publish("studyplan/sequence-item/selected", CONFIG_ID);
			renderItems = [{
				typeCode: "config"
			}].concat(data.items);
			onlyEnableId = CONFIG_ID;
		}
		else {
			renderItems = data.items;
		}

		//check if this item had been render
		renderItems.forEach(function (item) {
			var $item = item.id && $itemContent.find("[data-item-id='" + typeidParser.parseId(item.id) + "']");

			if($item && $item.data("woven")){
				//reorder the item element
				$item.appendTo($itemContent);
				$item.removeClass(CLS_REMOVEABLE);
				me.publish("studyplan/sequence-item/update", typeidParser.parseId(item.id));
			}
			else{
				//create a new one element
				// for campus release, goal will point to cp-goal widget
				var _typeCode = me[CAMPUS_ENABLE] === 'true' && item.typeCode === 'goal' ? 'cp-' + item.typeCode : item.typeCode;
				var velocity = '';
				if(data.progress){
					velocity = _.findKey(velocityState, function(value){
						return value === data.progress.properties.velocity;
					}).toLowerCase();
				}

				$item = $("<li class='ets-sp-sqn-item'></li>")
					.attr("data-item-id", typeidParser.parseId(item.id) || "")
					.attr("data-type-code", item.typeCode)
					.attr("data-unit-studyplan-mode", me[DATA_UNIT_STUDYPLAN].mode)
					.attr(loom.weave, PATH_ITEM + _typeCode + "(itemID)")
					.attr('data-velocity', velocity)
					.appendTo($itemContent);
				itemPromise.push($item.weave());
			}

			//check the velocity if it is Crashed and lock the sequence
			if(	item.typeCode === "goal" &&
				(crashedState = data.progress && data.progress.properties.velocity === velocityState.Crashed)){
				onlyEnableId = typeidParser.parseId(item.id);
			}

		});

		//notice this goal is completed
		$itemContent.toggleClass(
			CLS_PATH_COMPLETE,
			!!(data.progress && data.progress.state === studyplanState.Completed)
		);


		//remove unuse item
		$itemContent.find("." + CLS_REMOVEABLE)
			.each(function (index, elem) {
				//remove the popover
				$(elem).popover("destroy");
			})
			.remove();

		//check studyplan state for lock state
		me.publish(
			"studyplan/sequence-item/unavailable",
			mode === studyplanMode.Create || mode === studyplanMode.Locked || crashedState,
			onlyEnableId);

		//suggested item
		var suggestedItems = data.items.filter(function (item) {
			return data.progress && item.itemIndex === data.progress.properties.suggestedItemIndex;
		});
		var suggestedItem = suggestedItems.length ? suggestedItems[0] : data.items[0];
		me.publish("studyplan/sequence-item/suggest", typeidParser.parseId(suggestedItem.id));

		return itemPromise;
	}


	return Widget.extend({
		"hub/load/launcher": function (requests) {
			var me = this;

			//for activity container
			if(requests.prefix === "school") {
				return;
			}

			//the same if condition with load/results
			if (( requests.studyplan &&
					requests.studyplan !== typeidParser.parseId(me[PROP_STUDYPLAN_ID]) ) ||

				(!requests.studyplan &&
					requests.unit !== (PREFIX_TEMP_UNIT + me[PROP_UNIT_TEMPLATE_ID]))
				) {
				return when.promise(function (resolve) {
					me[$ELEMENT].find("[" + loom.woven + "]").unweave().then(function () {
						resolve();
					});
				});
			}
		},
		"hub:memory/load/results": function (results) {
			var me = this;
			var animationDir;
			var currentIndex;
			var preIndex;

			if (results.unit) {

				// When the unit or studyplan is different, start to render a new sequence-navigation.
				// and the sequence container will render either (please check code in /js/widget/studyplan/body/sequence-container/main.js)

				// So, sequence-navigation and sequence-container will be animated at the same time.
				if(	( results.studyplan && me[PROP_STUDYPLAN_ID] !== results.studyplan.id) ||
					(!results.studyplan && me[PROP_UNIT_TEMPLATE_ID] !== results.unit.templateUnitId )
					){
					// exclude create studyplan case
					if(me[PROP_UNIT_TEMPLATE_ID] !== results.unit.templateUnitId){
						// Compare current unit with prev unit, to ensure animate slide direction.
						// If change unit at the same level, animationDir will be a direction String.
						// If change unit at the different level, animationDir will be UNDEF and animation will not be run.
						results.unit.parent.children.forEach(function (e, i) {
							switch(e.templateUnitId){
								case results.unit.templateUnitId:
									currentIndex = i;
								break;
								case me[PROP_UNIT_TEMPLATE_ID]:
									preIndex = i;
								break;
							}
						});

						if(currentIndex !== UNDEF && preIndex !== UNDEF){
							animationDir = ANIMATION_DIR[currentIndex < preIndex ? "L" : "R"];
						}
					}

					var unit_studyplan = results.unit_studyplan;

						/**
						 * When the results contain studyplan data.
						 *  *** --> #study/xxx/yyy
						 *      case 1 :
						 *          #config?unit_id=xxx --> #study/xxx     (create studyplan -> not animated)
						 *      case 2 :
						 *          #study/aaa/bbb      --> #study/xxx/yyy (unit navigation  -> animated
						 *                                                  change level     -> not animated)
						 *      case 3 :
						 *          EMPTY               --> #study/xxx/yyy (Landing          -> not animated)
						 */
						var studyplan = results.studyplan
						/**
						 * when the results do not contain studyplan data.
						 *  *** --> #config?unit_id=xxx
						 *      case 4 :
						 *          #config?unit_id=aaa --> #config?unit_id=xxx (change level    -> not animated)
						 *      case 5 :
						 *          #study/aaa/bbb      --> #config?unit_id=xxx (unit navigation -> animated
						 *                                                       change level    -> not animated)
						 *      case 6 :
						 *          EMPTY               --> #config?unit_id=xxx (Landing         -> not animated)
						 */
							|| results.unit_studyplan.studyPlan;

							me[PROP_UNIT_STUDYPLAN_ID] = unit_studyplan.id;
							me[PROP_STUDYPLAN_ID] = studyplan.id;
							me[PROP_UNIT_TEMPLATE_ID] = results.unit && results.unit.templateUnitId;
							me[PROP_UNIT_ID] = results.unit && results.unit.studentUnitId;

							me[PROMISE_RENDER] = doRender.call(me, unit_studyplan, studyplan, animationDir);
				}
			}
			else{
				me[PROP_UNIT_STUDYPLAN_ID] =
					me[PROP_STUDYPLAN_ID] =
					me[PROP_UNIT_TEMPLATE_ID] =
					me[PROP_UNIT_ID] = UNDEF;
			}
		},
		"hub:memory/load/studyplan_item": function (data) {
			var me = this;
			var id = data ? typeidParser.parseId(data.id) : null;

			me.publish("studyplan/sequence-item/selected", id);
		},
		"hub/studyplan/sequence/navigate/suggest-item": function () {
			var me = this;
			var suggestedItems = me[DATA_STUDYPLAN].items.filter(function (item) {
				return me[DATA_STUDYPLAN].progress && item.itemIndex === me[DATA_STUDYPLAN].progress.properties.suggestedItemIndex;
			});
			var suggestedItem = suggestedItems.length ? suggestedItems[0] : UNDEF;

			if (suggestedItem) {
				me.publish("load", {
					"prefix": "study",
					"studyplan": typeidParser.parseId(me[DATA_STUDYPLAN].id),
					"studyplan_item": typeidParser.parseId(suggestedItem.id)
				});
			}
		},
		"hub/studyplan/sequence/navigate/goal": function () {
			var me = this;
			var itemIndex;
			if (me[DATA_STUDYPLAN] && me[DATA_STUDYPLAN].items.length > 0) {
				me[DATA_STUDYPLAN].items.forEach(function (entry) {
					if (entry.typeCode == "goal") {
						itemIndex = entry.itemIndex;
					}
				});

				me.publish("load", {
					"prefix": "study",
					"studyplan": typeidParser.parseId(me[DATA_STUDYPLAN].id),
					"studyplan_item": typeidParser.parseId(me[DATA_STUDYPLAN].items[itemIndex].id)
				});
			}
		},
		//this will update the whold sequence.
		"hub/studyplan/sequence/update": function () {
			var me = this;
			me[PROP_STUDYPLAN_ID] && me[PROMISE_RENDER] &&
			me[PROMISE_RENDER].inspect().state === "fulfilled" &&
			(me[PROMISE_RENDER] = doRender.call(me, me[DATA_UNIT_STUDYPLAN], me[DATA_UNIT_STUDYPLAN].studyPlan));
		},
		"hub/activity/update/progress": function () {
			this.publish("studyplan/sequence/update");
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/check.html',[],function() { return function template(data) { var o = "<i class=\"ets-icon-badge-checkmark\"></i>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/check',[
    "when",
    "troopjs-ef/component/widget",
    "school-ui-shared/utils/typeid-parser",
    "template!./check.html"
],function(when, Widget, typeidParser, tCheck){
    
    var ID = "_id";
    var ITEM = "_item";

    return Widget.extend(function($element, path, itemData){
        this[ID] = typeidParser.parseId(itemData.id);
        this[ITEM] = itemData;
    },{
        "sig/start":function(){
            if(this[ITEM].typeCode === "goal"){
                return when.reject("skip check mark, goal item has no check mark");
            }
            return this.html(tCheck);
        },
        "hub:memory/studyplan/sequence-item/selected" : function(id){
            var me = this;
            var thisId = me[ID];
            me.$element.toggleClass("ets-none", id == thisId);
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/cp-goal.html',[],function() { return function template(data) { var o = "<span class=\"badge ets-sp-badge-normal campus-badge-normal\"></span>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/cp-goal',[
	"jquery",
	"troopjs-ef/component/widget",
	"template!./cp-goal.html"
], function ($, Widget, tGoalMark) {

	return Widget.extend(function ($element, path, data) {
	}, {
		"displayName": "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/goal",
		"sig/start": function () {
			var me = this;
			me.html(tGoalMark);
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/goal.html',[],function() { return function template(data) { var o = "<span class=\"badge ets-sp-badge-normal\">" +data + "</span>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/goal',[
    "jquery",
    "when",
    "moment",
    "troopjs-ef/component/widget",
    "school-ui-shared/enum/moment-language",
    "school-ui-studyplan/enum/studyplan-item-state",
    "school-ui-studyplan/utils/state-parser",
    "template!./goal.html"
],function($, when, Moment, Widget, momentLang, itemState, stateParser, tGoalMark){
    var DATA = "_data";
    var CONTEXT_DEFER = "_context_defer";

    return Widget.extend(function($element, path, data){
        this[DATA] = data;
        this[CONTEXT_DEFER] = when.defer();
    },{
        "displayName" : "school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/goal",
        "sig/start":function(){
            var me = this;
            var data = me[DATA];
            if(stateParser.parseFlag(itemState, data.progress.state).Completed){
                return when.reject("skip target date mark, studyplan is completed");
            }
            if(data && data.progress && data.progress.properties && data.progress.properties.endDate){
                me[CONTEXT_DEFER].promise.spread(function(context){
                    var localLang = Moment(data.progress.properties.endDate);
                    if(context) {
                        localLang.lang(momentLang[context.cultureCode.toLowerCase()]);
                        me.html(tGoalMark, localLang.format("ll"));
                    }
                });
            }
            else{
                return when.reject("skip target date mark, no endDate in goal");
            }
        },
        "hub:memory/context": function(context) {
            if(context){
                this[CONTEXT_DEFER].resolve([context]);
            }
        }
    });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/locked.html',[],function() { return function template(data) { var o = "<i class=\"ets-icon-badge-locked\">\n\t<i class=\"ets-sp-locked-mark-bg glyphicon icon-circle\"></i>\n\t<i class=\"ets-sp-locked-mark-icon ets-icon-lock\"></i>\n</i>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/locked',[
    "troopjs-ef/component/widget",
    "template!./locked.html"
],function(Widget, tCheck){

    return Widget.extend({
        "sig/start":function(){
            return this.html(tCheck);
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/skipped.html',[],function() { return function template(data) { var o = "<span class=\"badge ets-sp-badge-skipped\" data-weave=\"troopjs-ef/blurb/widget\" data-text-en=\"Skipped\" data-blurb-id=\"568736\"></span>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/body/sequence-navigation/mark/skipped',[
    "troopjs-ef/component/widget",
    "template!./skipped.html"
], function(Widget, tSkipped){
    return Widget.extend({
        "sig/start":function(){
            return this.html(tSkipped);
        }
    });
});

define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/header/change-course/course.html',[],function() { return function template(data) { var o = "";if(data.enableShowCourseName) {o += "\n<div class=\"ets-sp-chc-hd\">\n    ";if(data.changeCourseLink && data.enableChangeCourse) {o += "\n    <div class=\"ets-sp-chc-widget ets-sp-chc-link\">\n        <h3>" + data.courseName + "</h3>\n        <h4>" + data.levelName + "</h4>\n        <a class=\"ets-sp-chc-link-url\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"668938\" data-text-en=\"Change course\" href=\"" +data.changeCourseLink+ "\"></a>\n    </div>\n    ";}else{o += "\n    <div class=\"ets-sp-chc-widget ets-sp-chc-switch " + (data.enableChangeCourse ? "ets-sp-chc-hand": "")+ "\" ";if(data.enableChangeCourse) {o += "data-action='switch' ";}o += " >\n        ";if(data.enableChangeCourse) {o += "\n            <div class=\"ets-sp-chc-switch-arrow\">\n                <i class=\"glyphicon icon-caret-down\"></i>\n            </div>\n        ";}o += "\n        <div class=\"ets-sp-chc-switch-main\">\n            <h3>" + data.courseName + "</h3>\n            <h4>" + data.levelName + "</h4>\n        </div>\n    </div>\n    ";}o += "\n</div>\n";} return o; }; });
define('school-ui-studyplan/widget/studyplan/header/change-course/main',[
		"school-ui-studyplan/module",
		"jquery",
		"when",
		"school-ui-shared/utils/ccl",
		"troopjs-browser/loom/config",
		"troopjs-ef/component/widget",
		"template!./course.html"
	],
	function(module, $, When, CCL, LoomConfig, Widget, tCourse) {
		"use strict";

		var CCL_ENABLE_CHANGECOURSE = "ccl!\"school.menu.changecourse.display\"";
		var CCL_ENABLE_SHOW_COURSE_NAME = "ccl!\"school.courseware.showCourseName.enable\"";
		var CCL_CHANGE_COURSE_LINK = "ccl!\"school.studyplan.changeCourse.link\"";
		var MEMBER_SETTING_CHANGE_COURSE_ENABLE = 'member_site_setting!"CampusCore;Campus.ChangeCourse.Enable"';

		var UNDEF;
		var $ELEMENT = "$element";
		var SEL_CHC_WIDGET = ".ets-sp-chc-widget";
		var SEL_UNIT_HEADER=".ets-sp-unit-hd";
		var SEL_UNIT_NAV=".ets-sp-unn";

		var MODULE_CONFIG = $.extend({
			changeCourseUrl: undefined
		}, module.config() || {});

		function render(course, level, unit) {
			var me = this;
			if(!course || !level || !unit) return;

			return me.query(
					CCL_ENABLE_CHANGECOURSE,
					CCL_ENABLE_SHOW_COURSE_NAME,
					CCL_CHANGE_COURSE_LINK,
					MEMBER_SETTING_CHANGE_COURSE_ENABLE
				).spread(function(enableChangeCourse, enableShowCourseName, changeCourseLink, memberChangeCourseEnable){
				return me.html(tCourse, {
						courseName: course.courseName,
						levelName: level.levelName,
						enableChangeCourse: CCL.indicateCCLStringValue(memberChangeCourseEnable) || CCL.indicateCCLStringValue(enableChangeCourse),
						enableShowCourseName: CCL.indicateCCLStringValue(enableShowCourseName),
						changeCourseLink: MODULE_CONFIG.changeCourseUrl || changeCourseLink.value
				}).then(function () {
					var $widget = me[$ELEMENT].find(SEL_CHC_WIDGET);
					var requiredWidth = $widget[0].scrollWidth;
					$widget.width(requiredWidth);
					me[$ELEMENT].closest(SEL_UNIT_HEADER).find(SEL_UNIT_NAV).css("padding-left", requiredWidth);
				});
			});
		}

		return Widget.extend({
			"hub:memory/load/results": function(data) {
				var me =  this;

				if( me.course === data.course
					&& me.level === data.level
					&& me.unit === data.unit) {
					return;
				}

				render.call(me, (me.course = data.course), (me.level = data.level), (me.unit = data.unit));
			},

			"dom:[data-action='switch']/click": function() {
				this.publish("toggle/course/list");
			}
		});
	});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/header/course-list/course-list.html',[],function() { return function template(data) { var o = "";

function buildRowHeader() {
    var header = "<div class='ets-sp-chc-courses-row'>";

    return header;
}

function buildRowBody(group, cols) {
    return buildCols(group, group.unit_children || group.children, cols);
}

function buildRowTail() {
    return "</div>";
}

function buildCols (group, items, cols) {
    var header = "<div class='ets-sp-chc-course ets-" + cols + "-col clearfix' data-course-type='" + group.courseTypeCode + "'>";
    var sectionName = "<h3>" + group.courseName + "</h3>";
    var section = buildSection(items);
    var tail = "</div>";

    return header + sectionName +  section + tail;
}

function buildSection(items) {
    var length = items.length;
    var i = 0;
    var out = "";
    var cls = "";
    var bHasPassed;
    var item;
    var iColItems = 8;
    var CLS_ACTIVE = "ets-active";
    var CLS_PASS = "ets-pass";
    var dataAttr =  " data-template-id='{templateId}'";

    while(i < length) {
        if( i % iColItems === 0)  out += "<ul>";
        item = items[i];
        bHasPassed = data.hasPassed(item.progress.state);
        cls = (bHasPassed ? ("class='" +  CLS_PASS + "' ") : "");

        out += "<li data-action='select-level' " + cls + dataAttr.replace("{templateId}", item.templateUnitId || item.templateLevelId) + ">";
        out += (item.unitName || item.levelName );
        out += bHasPassed ? '<i class="ets-icon-badge-checkmark"></i></li>' : '</li>';

        if( ++i % iColItems === 0)  out += "</ul>";
    }

    return out;
}

function buildAllHtml(groups) {
    var length = groups.length;
    var i = 0;
    var j = 0;
    var iLimitCols = 4;
    var iColItems = 8;
    var items;
    var out = "";
    var cols;
    var rows;
    var iRestCols = 0;
    var group;

    while(i < length) {
        group = groups[i];
        if(group){
            this[group.courseTypeCode] = this[group.courseTypeCode] || group;

            items = group.unit_children || group.children;
            cols = Math.ceil(items.length / iColItems);
            rows = Math.ceil(cols / iLimitCols);

            if(iRestCols < cols) {
                out += (i !== 0) ? buildRowTail() : "";
                out += buildRowHeader();
                out += buildRowBody(group, cols);

                iRestCols = (iLimitCols - cols % iLimitCols) % iLimitCols;
            } else {
                out += buildRowBody(group, cols);
                iRestCols -= cols;
            }

            if( ++i === length) out += buildRowTail();
        }
    }

    return out;
}

o += "\n\n<div class=\"ets-sp-chc-bd ets-none\">\n    <div class=\"ets-sp-chc-courses clearfix\">\n        <button class=\"btn btn-default btn-sm ets-sp-chc-close\" data-action=\"close\">\n        <i class=\"glyphicon glyphicon-remove\"></i> <span data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"450020\" data-text-en=\"close\"></span></button>\n        <div data-action='change-level'>" + buildAllHtml.call(this, data.groups) + "</div>\n    </div>\n</div>\n\n\n<!--\n <div class=\"ets-sp-chc-courses-row\">\n    <div class=\"ets-sp-chc-course ets-2-col clearfix\">\n        <h3>Level Name</h3>\n        <ul>\n            <li class=\"ets-pass\"> Level Item<i class=\"ets-icon-badge-checkmark\"></i></li>\n            <li class=\"ets-active\">Actived Item</li>\n            <li>Normal Item</li>\n        </ul>\n        ...\n    </div>\n</div>\n-->"; return o; }; });
define('school-ui-studyplan/widget/studyplan/header/course-list/main',[
        "jquery",
        "when",
        "client-tracking",
        "troopjs-ef/component/widget",
        "school-ui-shared/utils/console",
        "school-ui-shared/utils/update-helper",
        "school-ui-shared/utils/progress-state",
        "school-ui-shared/utils/typeid-parser",
        "school-ui-shared/enum/course-type",
        "school-ui-studyplan/enum/studyplan-state",
        "school-ui-studyplan/enum/studyplan-mode",
        "template!./course-list.html",
        "poly"
    ],
    function($, when, ct, Widget, Console, UpdateHelper, ProgressState, TypeIDPaser, CourseType, studyplanState, studyplanMode,tCourse, poly) {
        "use strict";

        var UNDEF;

        var SEL_COURSE_BD = ".ets-sp-chc-bd";
        var SEL_COURSE_CONT = ".ets-sp-chc-course";
        var SEL_COURSE = ".ets-sp-chc-course li";
        var SEL_COURSE_ARRAW = ".ets-sp-chc-switch-arrow i";
        var SEL_ACTIVE = ".ets-active";
        var CLS_ACTIVE = "ets-active";
        var CLS_NONE = "ets-none";
        var CLS_ARRAW_UP = "icon-caret-up";

        var Q_ENROLLABLE_COURSES = "student_enrollable_courses!*.items.children.progress";
        var Q_CCL_MINIM_LEVEL = "ccl!\"school.changecourse.minimum.levelno\"";
        var Q_STUDYPLAN_CURR = "campus_student_unit_studyplan!current.studyPlan.items,.studyPlan.progress";

        var CONFIRM = "confirm";
        var ALERT = "alert";
        var OK = "ok";
        var LEVEL = "_level";
        var UNIT = "_unit";
        var COURSE_TYPE_CODE = "_course_type_code";
        var SHOW = "_show";

        var CHG_LEVEL_GE2GE_TITLE = "_GE2GE_Title";
        var CHG_LEVEL_GE2GE_BODY = "_GE2GE_Body";

        var CHG_LEVEL_GE2GE_BELOW_MINI_LEVEL_TITLE = "_GE2GE_Below_Title";
        var CHG_LEVEL_GE2GE_BELOW_MINI_LEVEL_BODY = "_GE2GE_Below_Body";
        var TOPIC_UNABLE_TO_CHANGE = "_topic_unable_to_change";
        var TEXT_UNABLE_TO_CHANGE = "_text_unable_to_change";
        var TOPIC_WANT_CHANGE = "_topic_want_change";
        var TEXT_WANT_CHANGE = "_text_want_change";
        var OPTION_WANT_CHANGE = "_option_want_change";
        var TOPIC_UNABLE_TO_CHANGE_COURSE = "_topic_unable_to_change_course";
        var TEXT_UNABLE_TO_CHANGE_COURSE = "_text_unable_to_change_course";
        var TOPIC_SURE_WANT_TO_CHANGE = "_topic_sure_want_to_change";
        var TEXT_SURE_WANT_TO_CHANGE = "_text_sure_want_to_change";

        var CHG_LEVEL_TITLE = "_Title";
        var CHG_LEVEL_BODY = "_Body";

        var CHG_LEVEL_SP_TITLE = "_sp_Title";
        var CHG_LEVEL_SP_BODY = "_sp_Body";

        var Blurb_IDS =[
            {
                "_name" : OK,
                "_id" : "150652",
                "en": "OK"
            },
            {
                "_name": CHG_LEVEL_GE2GE_TITLE,
                "_id": "450016",
                "en": "Are you sure you want to change the level?"
            },
            {
                "_name": CHG_LEVEL_GE2GE_BODY,
                "_id": "450311",
                "en": "Your progress in this level will be saved, but we recommend that you complete the levels in order."
            },
            {
                "_name": CHG_LEVEL_GE2GE_BELOW_MINI_LEVEL_TITLE,
                "_id": "458008",
                "en": "This course is for Level 6 or higher."
            },
            {
                "_name": CHG_LEVEL_GE2GE_BELOW_MINI_LEVEL_BODY,
                "_id": "458009",
                "en": "You need to be studying at General English Level 6 or above to take advantage of this course."
            },
            {
                "_name": CHG_LEVEL_TITLE,
                "_id": "461321",
                "en": "Do you want to change courses?"
            },
            {
                "_name": CHG_LEVEL_BODY,
                "_id": "461322",
                "en": "Don't worry. Your progress in this course will be saved."
            },
            {
                "_name": CHG_LEVEL_SP_TITLE,
                "_id": "569826",
                "en": "Are you sure you want to change the level?"
            },
            {
                "_name": CHG_LEVEL_SP_BODY,
                "_id": "569827",
                "en": "If you change your level your current study plan will be discarded."
            },
            {
                "_name" : TOPIC_UNABLE_TO_CHANGE,
                "_id" : "634432",
                "en" : "Unable to change level"
            },
            {
                "_name" : TEXT_UNABLE_TO_CHANGE,
                "_id" : "634433",
                "en" : "You can not change to this level as you have completed it in an older version of the online school. Please select another one."
            },
            {
                "_name" : TOPIC_WANT_CHANGE,
                "_id" : "634434",
                "en" : "Are you sure you want to change level?"
            },
            {
                "_name" : TEXT_WANT_CHANGE,
                "_id" : "634435",
                "en" : "Your progress in this level will be saved, but we recommend that you complete the levels in order."
            },
            {
                "_name" : OPTION_WANT_CHANGE,
                "_id" : "634436",
                "en" : "I want to make a fresh start! Please enrol me at the beginnng of the course and remove my old study progress."
            },
            {
                "_name" : TOPIC_UNABLE_TO_CHANGE_COURSE,
                "_id" : "634437",
                "en" : "Unable to change course"
            },
            {
                "_name" : TEXT_UNABLE_TO_CHANGE_COURSE,
                "_id" : "634438",
                "en" : "You can not change to this course as you have completed it in an older version of the online school."
            },
            {
                "_name" : TOPIC_SURE_WANT_TO_CHANGE,
                "_id" : "634439",
                "en" : "Are you sure you want to change course?"
            },
            {
                "_name" : TEXT_SURE_WANT_TO_CHANGE,
                "_id" : "634440",
                "en" : "Your progress in this course will be saved."
            }
        ];

        var BLURBS = {};

        function initBlurb() {
            var me = this;
            var Keys = [];
            var Ids = [];

            Blurb_IDS.forEach(function(val, key){
                Keys.push(val["_name"]);
                Ids.push('blurb!' + val["_id"]);
            });

            return me.query(Ids).then(function(results) {
                results.forEach(function(val, idx) {
                    BLURBS[Keys[idx]] = val ? val.translation : Blurb_IDS[idx].en;
                });
            });
        }

        function sort(prev, next) {
            if(prev.courseTypeCode === "GE"){
                return -1;
            }
            else if(next.courseTypeCode === "GE"){
                return 1;
            }
            else{
                return prev.children.length > next.children.length ? 1 : -1;
            }
        }

        function render() {
            var me = this;

            return when.all([
                me.query(Q_ENROLLABLE_COURSES),
                initBlurb.call(me)
            ]).spread(function(enrollableCourses){
                me.courseInfo = enrollableCourses[0];
                if(me.courseInfo) {
                    return me.html(tCourse,
                        {
                            groups: me.courseInfo.items ? me.courseInfo.items.sort(sort) : [],
                            hasPassed: ProgressState.hasPassed
                        }).then(function() {
                            me.$allCourses = me.$element.find(SEL_COURSE);
                            me.$courseBody = me.$element.find(SEL_COURSE_BD);
                            me.$arraw = me.$element.find(SEL_COURSE_ARRAW);
                            toggleShow.call(me, me[SHOW]);
                            highlightLevelElement.call(me, me[LEVEL] && me[LEVEL].templateLevelId, me[UNIT] && me[UNIT].templateUnitId);
                        });
                }
            });

        }

        function highlightLevelElement() {
            var me = this;
            var ids = Array.prototype.slice.call(arguments);

            if(ids.length) {
                me.$allCourses && me.$allCourses.removeClass(CLS_ACTIVE);
                ids.forEach(function(id){
                    me.$element.find("[data-template-id='" + id + "']").addClass(CLS_ACTIVE);
                });
            };
        }

        function showModelBox(config) {
            config.type = config.type || ALERT;
            var me = this;

            return this.publish("enable/show/" + config.type + "-box", true).spread(function(enableShow) {
                if(enableShow){
                    return me.publish("show/"+ config.type +"-modal-box", config);
                }
                else{
                    return when.reject("disable show modal box");
                }
            });
        }

        function changeCourse(enrollInfo, courseType) {
            var me = this;
            var demoPromise = when.resolve();
            var changeToGE = CourseType.isGECourse(courseType);
            var changeToBE = CourseType.isBECourse(courseType);

            //for 'demo'
            if(me.common_context.partnercode.value.toLowerCase() === "demo"){
                demoPromise = when.all(when.map(me.courseInfo.items, function(item){
                    if(changeToGE && item.courseTypeCode === "GE"){
                        //for GE, demo student always enroll to level 7, unit 3
                        return me.query(item.children[6].children[2].id).spread(function(unit){
                            enrollInfo.templateId = unit.templateUnitId;
                        });
                    }
                    else if(changeToBE && item.courseTypeCode === "BE"){
                        //for SPINs, demo student always enroll to level 5, unit 2
                        return me.query(item.children[4].children[1].id).spread(function(unit){
                            enrollInfo.templateId = unit.templateUnitId;
                        });
                    }
                }));
            }

            return demoPromise.then(function(){
                return UpdateHelper.updateEnrollment(enrollInfo);
            }).then(function(enroll){
                return me.publish("enrollment/update").then(function(){
                    return me.publish("context/update/context");
                });
            });
        }

        function getNextEnrollableLevelInfo() {
            //TODO: whether need to consider legacy progress?
            var me = this;

            if(!me[LEVEL]) return;

            var templateLevelId = me[LEVEL].templateLevelId;
            var groups;
            var items;
            var enrollInfo;

            if(!me.courseInfo || me.isSPIN) return;

            groups = me.courseInfo.items;
            groups.every(function(items) {
                return items.children.every(function(item, i) {
                    if(items.children[i+1] && item.templateLevelId === templateLevelId) {
                        enrollInfo = {
                            templateId: items.children[i+1].templateLevelId
                        };

                        return false;
                    }
                    return true;
                });
            });

            return enrollInfo;
        }


        function showChangeLevelModelBox(courseType, levelInfo, defer) {
            var me = this;
            var isGotoGE = CourseType.isGECourse(courseType);
            var isFromGE2GE = me.isGE && isGotoGE;

            var title = isFromGE2GE
                ? BLURBS[CHG_LEVEL_GE2GE_TITLE]
                : BLURBS[CHG_LEVEL_TITLE];

            var body = isFromGE2GE
                ? BLURBS[CHG_LEVEL_GE2GE_BODY]
                : BLURBS[CHG_LEVEL_BODY];

            return showModelBox.call(me, {
                type: CONFIRM,
                title: title,
                body: body
            });
        }


        function toggleShow(show) {
            var me = this;

            if (show) {
                me.$courseBody && me.$courseBody.removeClass(CLS_NONE);
                me.$arraw && me.$arraw.addClass(CLS_ARRAW_UP);
            }
            else {
                me.$courseBody && me.$courseBody.addClass(CLS_NONE);
                me.$arraw && me.$arraw.removeClass(CLS_ARRAW_UP);
            }
        }

        // INDB2B SPECIAL LOGIC
        function b2bFilter(courseInfo) {
            var me = this;
            var hasINDB2B;

            if(courseInfo.items) {
                for (var i = 0; i < courseInfo.items.length; i++) {
                    if(courseInfo.items[i].courseTypeCode === "INDB2B") {
                        hasINDB2B = true;

                        return me.query(courseInfo.items[i].id + ".children.children.progress").spread(function(course) {
                            var unit_children = [];
                            course.children.forEach(function(entry, index){
                                entry.children.forEach(function(entry, index) {
                                    unit_children.push(entry);
                                });
                            });

                            course.unit_children = unit_children;
                        });
                    }
                }
            }

            if(!hasINDB2B) {
                return when.resolve();
            }
        }

        return Widget.extend({
            "hub:memory/common_context": function onCourseListStart(common_context) {
                var me = this;

                if(common_context){
                    me.common_context = common_context.values;
                    render.call(me);
                }
            },
            "hub:memory/load/results": function(data) {
                var me = this;

                if(!data.course){
                    return;
                }

                me.isGE = CourseType.isGECourse(me[COURSE_TYPE_CODE] = (data.course || {}).courseTypeCode);
                me.isSPIN = CourseType.isSpinCourse(me[COURSE_TYPE_CODE]);

                highlightLevelElement.call(me, (me[LEVEL] = data.level).templateLevelId, (me[UNIT] = data.unit).templateUnitId);
            },

            "hub/enroll/next/level": function() {
                var me = this;

                return changeCourse.call(me, getNextEnrollableLevelInfo.call(me),  me[COURSE_TYPE_CODE]);
            },

            "hub/ef/update/progress":function(progress){
                var me = this;
                render.call(me);
            },

            "hub/show/course/list": function() {
                this.publish("load", {
                    "command": ["changecourse"]
                });
            },
            "hub/toggle/course/list": function() {
                var me = this;
                if(me.$courseBody.hasClass(CLS_NONE)){
                    me.publish("load", {
                        "command": ["changecourse"]
                    });
                }
                else{
                    me.publish("load", {
                        "command": UNDEF
                    });
                }
            },

            "dom:[data-action='close']/click": function(){
                this.publish("load", {
                    "command": UNDEF
                });
            },

            "hub:memory/load/command" : function(data) {
                var me = this;
                if(data && data.indexOf("changecourse") >= 0) {
                    toggleShow.call(this, me[SHOW] = true);
                    ct.useraction({
                        "action.changeCourseInitiated": 1
                    });
                }
                else {
                    toggleShow.call(this, me[SHOW] = false);
                }
            },

            "dom:[data-action='select-level']/click": function onChangeLevelClick($event){
                var me = this;
                var $el = $($event.target);
                var templateId = $el.data("templateId");
                var isPassed = $el.hasClass("ets-pass");
                var courseType = $el.parents(SEL_COURSE_CONT).data("courseType");
                var enrollInfo = {
                    templateId: templateId
                };

                if($el.hasClass(CLS_ACTIVE)) return;

                // for tracking
                // var currentNode = me.$element.find(SEL_ACTIVE).data("nodeTypeId");
                // var targetNode = $el.data("nodeTypeId");
                // var levelID = TypeIDPaser.parseId(me.level.id);
                // ct.useraction({
                //     "action.changeCourseSelected": levelID + " change to " + targetNode + " & " + currentNode
                // });

                return me.query(
                        Q_STUDYPLAN_CURR,
                        Q_CCL_MINIM_LEVEL
                    ).spread(function getLevelLimitation(studyPlanInfo, levelInfo){
                        var isGotoGE = CourseType.isGECourse(courseType);
                        var isGotoBE = CourseType.isBECourse(courseType);
                        var isBelowGEMiniumLevel = me[LEVEL].levelNo < levelInfo.value;

                        if(me.isGE && !isGotoGE && isBelowGEMiniumLevel) {
                            showModelBox.call(me, {
                                type : ALERT,
                                title : BLURBS[CHG_LEVEL_GE2GE_BELOW_MINI_LEVEL_TITLE],
                                body : BLURBS[CHG_LEVEL_GE2GE_BELOW_MINI_LEVEL_BODY]
                            });
                            return when.reject("change level when below minimum level control, forbidden");
                        }


                        if( studyPlanInfo.mode === studyplanMode.Study &&
                            studyPlanInfo.studyPlan.progress.state === studyplanState.Started) {
                            return showModelBox.call(me, {
                                type: CONFIRM,
                                title: BLURBS[CHG_LEVEL_SP_TITLE],
                                body: BLURBS[CHG_LEVEL_SP_BODY]
                            });
                        }
                        else {
                            return showChangeLevelModelBox.call(me, courseType, levelInfo);
                        }

                })
                .then(function() {
                    return changeCourse.call(me, enrollInfo, courseType)
                        .then(function(){
                            // for tracking
                            // ct.useraction({
                            //     "action.changeCourseCompleted": levelID + " change to " + targetNode + " & " + currentNode
                            // });
                        });
                })
                .catch(function(reason){
                    Console.info(reason);
                });
            }
        });
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/header/unit-navigation/main.html',[],function() { return function template(data) { var o = "";
 function outputBody() {
 	var unitNo = data.isGE ? '<strong data-weave="troopjs-ef/blurb/widget" data-blurb-id="105267" data-text-en="Unit"></strong><strong>'+ data.unit.unitNo +'</strong> ' : '';
 	var unitNameTag = '<span title="' + data.unit.unitName + '">' + data.unit.unitName + '</span>';
	return '<div class="ets-sp-unn-title"> ' + unitNo + unitNameTag + ' </div>';
 }
o += "\n\n<div class=\"ets-sp-unn-main\">\n\t";if (data.enableNavUnit && data.enableShowCourseName) { o += "\n\t    <div class=\"ets-sp-unn-prev ets-disabled\" data-action=\"navigate/prev/unit\"><i class=\"glyphicon icon-angle-left\"></i></div>\n\t    " + outputBody()+ "\n\t    <div class=\"ets-sp-unn-next ets-disabled\" data-action=\"navigate/next/unit\"><i class=\"glyphicon icon-angle-right\"></i></div>\n    "; } else {o += "\n\t\t" + outputBody()+ "\n    "; } o += "\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/header/unit-navigation/main',[
        "jquery",
        "when",
		"client-tracking",
        "school-ui-shared/utils/ccl",
        "troopjs-ef/component/widget",
        "school-ui-shared/utils/typeid-parser",
        "school-ui-shared/enum/course-type",
        "template!./main.html"
    ],
    function($, When, ct, CCL, Widget, TypeIdPaser, CourseType, template) {
        "use strict";

        var SEL_PREV = ".ets-sp-unn-prev";
        var SEL_NEXT = ".ets-sp-unn-next";

        var CLS_DISABLED = "ets-disabled";

        var CCL_ENABLE_NAV_UINT = "ccl!\"school.courseware.enable.navigateUnit\"";
        var CCL_ENABLE_SHOW_COURSE_NAME = "ccl!\"school.courseware.showCourseName.enable\"";

        function isDemoAndNeedToLimit (common_context, courseTypeCode) {
            return common_context.partnercode.value.toLowerCase() === "demo" &&
                (CourseType.isGECourse(courseTypeCode) || CourseType.isBECourse(courseTypeCode) || courseTypeCode === "INDB2B");
        }

        function checkStatus(currUnitId, units) {
            var me = this;

            me.$prev.toggleClass(CLS_DISABLED, currUnitId === units[0].templateUnitId);
            me.$next.toggleClass(CLS_DISABLED, currUnitId === units[units.length-1].templateUnitId);
        }

        function changeUnit(prev, next) {
            var me = this;
            var currUnitId = me.unit.templateUnitId;
            var units = me.units;
            var i = 0;
            var len = units.length;
            var idx = 0;

            checkStatus.call(me, currUnitId, units);

            for(;i < len; i++) {
                if(currUnitId === units[i].templateUnitId) {
                    if((i === 0 && prev) || (i === len -1 && next)) return;

                    idx = i + (prev ? -1: (next ? 1 : 0));
                    break;
                }
            }

            units[idx].templateUnitId && me.publish("load/config", units[idx].templateUnitId);
        }

        function render(course, level, unit, units, common_context) {
            var me = this;

            if(!level || !course || !unit || !units || !common_context) return;

            return me.query([
                    CCL_ENABLE_NAV_UINT,
                    CCL_ENABLE_SHOW_COURSE_NAME
                ]).spread(function(enableNavUnit, enableShowCourseName) {

                return me.html(template, {
                    isGE: me.isGE,
                    unit: unit,
                    enableNavUnit: CCL.indicateCCLStringValue(enableNavUnit),
                    enableShowCourseName : CCL.indicateCCLStringValue(enableShowCourseName)
                }).then(function(){
                    var $el = me.$element;
                    me.$prev = $el.find(SEL_PREV);
                    me.$next = $el.find(SEL_NEXT);
                    //for 'demo'
                    // INDB2B SPECIAL LOGIC
                    if(!isDemoAndNeedToLimit(common_context, course.courseTypeCode)){
                        checkStatus.call(me, unit.templateUnitId, units);
                    }
                });
            });
        };

        return Widget.extend(function() {

        }, {
            "hub:memory/common_context" : function(common_context){
              var me = this;
              if(common_context){
                render.call(me, me.course, me.level, me.unit, me.units, me.common_context = common_context.values);
              }
            },
            "hub:memory/load/results": function(data) {
                var me = this;

                if(me.course === data.course
                    && me.level === data.level
                    && me.unit === data.unit) {
                    return;
                }

                me.isGE = CourseType.isGECourse(me.courseTypeCode = (data.course || {}).courseTypeCode);
                me.course = data.course;
                me.level = data.level;
                me.unit = data.unit;
	            me.units = data.level && data.level.children;

	            render.call(me, me.course, me.level, me.unit, me.units, me.common_context);
            },
            "hub/ef/update/progress":function(progress){
                var me = this;
                if(progress && me.unit){
                    me.query(me.level.id + ".children")
                        .spread(function(student_level){
                            if(student_level){
                                me.units = student_level.children;
                            }
                            render.call(me, me.course, me.level, me.unit, me.units);
                        });
                }
            },
            "dom:[data-action='navigate/prev/unit']/click": function($event) {
                var disable = $($event.currentTarget).hasClass(CLS_DISABLED);
                if(!disable) {
                    changeUnit.call(this, true, false);
                    ct.useraction({
                        "action.unitNavigation": "Previous"
                    });
                }
            },
            "dom:[data-action='navigate/next/unit']/click": function($event) {
                var disable = $($event.currentTarget).hasClass(CLS_DISABLED);
                if(!disable) {
                    changeUnit.call(this, false, true);
                    ct.useraction({
                        "action.unitNavigation": "Next"
                    });
                }
            }
        });
    });


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/header/unit-overview/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-sp-uno-main\">\n    <button class=\"btn btn-default btn-sm ets-sp-uno-btn\" data-weave=\"troopjs-ef/blurb/widget\" data-blurb-id=\"450055\" data-text-en=\"Unit Overview\"></button>\n</div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/header/unit-overview/main',[
	"when",
	"jquery",
	"client-tracking",
	"troopjs-ef/component/widget",
	"template!./main.html"
], function (when, $, ct, Widget, tButton) {
	"use strict";

	var SEL_SP = ".ets-sp-study";
	var CLS_UO_WIDGET = "ets-uo-widget";

	function showUnitOverview() {
		var me = this;

		$("." + CLS_UO_WIDGET).remove();
		var $widgetUniOverview = $('<div></div>', {
			"class": CLS_UO_WIDGET,
			"data-weave": "school-ui-shared/widget/unit-overview/modal-container/main(templateUnitid)"
		});

		return me._dfdUnit.promise.then(function (unit) {
			return $widgetUniOverview
				.data('templateUnitid', unit.templateUnitId)
				.insertAfter($(SEL_SP))
				.weave();
		});
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			me._dfdUnit = when.defer();
			me.html(tButton);
		},
		"hub:memory/load/unit": function (unit) {
			var me = this;

			//if switched to another unit, need to generate a new defer for unit data
			if (me._dfdUnit.promise.inspect().state !== "pending") {
				me._dfdUnit = when.defer();
			}

			me._dfdUnit.resolve(unit);
		},
		"dom:button/click": function () {
			ct.useraction({
				"action.unitOverviewClick": "1"
			});

			var me = this;
			showUnitOverview.call(me);
		}
	});
});


define('troopjs-requirejs/template!school-ui-studyplan/widget/studyplan/main.html',[],function() { return function template(data) { var o = "<div class=\"ets-theme-daylight ets-studyplan\" data-at-page-id=\"sp-course-page\">\n    <div class=\"ets-sp-main\">\n        <!-- Unit Start -->\n        <div class=\"ets-sp-unit\">\n            <!-- Unit Header Start -->\n            <div class=\"ets-sp-unit-hd\">\n                <!-- Change Course Start -->\n                <div class=\"ets-sp-chc\" data-weave=\"school-ui-studyplan/widget/studyplan/header/change-course/main\"></div>\n                <div data-weave=\"school-ui-studyplan/widget/studyplan/header/course-list/main\"></div>\n                <!-- Change Course End -->\n\n                <!-- Unit Navigation Start -->\n                <div class=\"ets-sp-unn\" data-weave=\"school-ui-studyplan/widget/studyplan/header/unit-navigation/main\"></div>\n                <!-- Unit Navigation End -->\n\n                <!-- Unit Overview Start -->\n                <div class=\"ets-sp-uno\"  data-weave=\"troopjs-ef/ccl/placeholder('school-ui-studyplan/widget/studyplan/header/unit-overview/main')\" data-ccl=\"school.e12.showUnitOverview\"></div>\n                <!-- Unit Overview End -->\n            </div>\n            <!-- Unit Header End -->\n\n            <!-- Unit Body Start -->\n            <div class=\"ets-sp-unit-bd\">\n                <!-- Sequence Navigation Start -->\n                <div class=\"ets-sp-sequence-wrapper\" data-weave=\"school-ui-studyplan/widget/studyplan/body/sequence-navigation/main\" data-at-page-id=\"sp-sequence-navigation-container\"></div>\n                <div class=\"ets-sp-sequence-wrapper\" data-weave=\"school-ui-studyplan/widget/studyplan/body/sequence-container/main\"></div>\n            </div>\n            <!-- Unit Body End -->\n        </div>\n        <!-- Unit End -->\n\n    </div>\n</div>\n<div data-weave=\"school-ui-shared/plugins/confirm-box/main\"></div>\n<div data-weave=\"school-ui-shared/plugins/alert-box/main\"></div>"; return o; }; });
define('school-ui-studyplan/widget/studyplan/main',[
	"troopjs-ef/component/widget",
	"template!./main.html"
], function(Widget, tMain){
	"use strict";

	return Widget.extend({
		'sig/start' : function(){
			return this.html(tMain);
		}
	});
});

//# sourceMappingURL=app-built.js.map
