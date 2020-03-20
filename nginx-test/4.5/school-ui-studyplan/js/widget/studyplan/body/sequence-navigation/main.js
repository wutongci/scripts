define([
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
