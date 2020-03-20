define([
	"troopjs-ef/component/service",
	"school-ui-shared/utils/console",
	"jquery",
	"json2"
], function CacheFillerService(EFService, Console, $, JSON) {
	"use strict";

	/**
	 * Try out all possible ways to populate troop cache. Used for pre-fill data cache before any query that
	 * eliminates network requests.
	 */
	var CACHE = "cache";

	return EFService.extend(function CacheFillerService(cache) {
		if (!cache) {
			throw new Error("no cache provided");
		}
		this[CACHE] = cache;
	}, {
		"sig/start": function onStart() {
			var cache = this[CACHE];
			$("script[type='application/json'][data-query]").each(function(i, el) {
				var data;

				try{ 
					data = JSON.parse($(el).html());
				}
				catch(e){
					Console.info(e);
				}

				data && cache.put(data);
			});
		},

		"hub/school/clearCache": function(key) {
			var cache = this[CACHE];

			cache[key] && delete cache[key];
		}
	});
});
