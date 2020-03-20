define([
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
