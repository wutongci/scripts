define([
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
