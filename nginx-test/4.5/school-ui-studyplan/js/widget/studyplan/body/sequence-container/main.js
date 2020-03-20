define([
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
