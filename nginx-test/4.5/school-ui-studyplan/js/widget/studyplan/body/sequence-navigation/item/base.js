define([
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
