/*
    Responsibility of this module:

    1. go to prev activity
    2. go to next activity
    3. 'check my answer' btn status change 
    4. save and submit content for writing challenge

    Notes: 
        Instance feedback
            show next Ques or next Act button
        Practice
            show check my answer
        Learning
            no grade
        Exercise
            grade
*/
define([
    "jquery",
    "mv!jquery#troopjs-1.0",
    "troopjs-ef/component/widget",
    "when",
    "template!./bottom-bar.html",
    "poly/array",
    "poly/object"
], function ActivityBottomButton($, jqueryInTroop1, Widget, when, tBottomBtn) {
    "use strict";
    var $EL = "$element",
        CLS_CHECK_ANSWER = "ets-btn-fn-check",
        CLS_NEXT = "ets-btn-fn-next",
        CLS_SAVE = "ets-btn-fn-save",
        CLS_SUBMIT = "ets-btn-fn-submit",
        CLS_MOVE_ON = "ets-btn-fn-move",
        CLS_DONE = "ets-btn-fn-done",
        CLS_RETRY = "ets-btn-fn-retry",

        CLS_NEXT_ACT = "ets-ui-acc-btn-next",
        CLS_PREV_ACT = "ets-ui-acc-btn-prev",
        CLS_HIDDEN = "ets-hidden",
        CLS_SHOW = "ets-show",
        CLS_DISABLE = "ets-disabled",

        PROP = {
            /* indicates if current activity is completed */
            COMPLETED: 'completed',
            /* indicates current sub question index */
            INDEX: 'index',
            /* indicates how many sub question does current activity has */
            LENGTH: 'length',
            /* indicates activity type */
            TYPE: 'type'
        },
        ITEM_PROP = {
            /* Return true or false, indicates if current answer is intact so that it can be checked by scoring.compute */
            ANSWERED: 'answered',
            /* indicates if current activity enabled instance feedback */
            INSTANT_FEEDBACK: 'instantFeedback',
            /* indicates if current activity is savable */
            SAVABLE: 'savable',
            /* indicates if current activity is completed */
            COMPLETED: 'completed'
        },
        ITEM_PREFIX = 'item_',

        ACT_TYPE = {
            /* indicates current activity is a 'LEARNING' activity or not  */
            LEARNING: 2,
            /* indicates current activity is a 'EXERCISE' activity or not */
            EXERCISE: 1,
            /* indicates current activity is a 'PRACTICE' activity or not */
            PRACTICE: 3
        },

        TOPIC_CHECK_ANSWERS = "activity/check/answer",
        TOPIC_NEXT_STEP = "activity/next/step",
        TOPIC_MOVE_ON_ACT = "activity/submit/score/proxy",
        TOPIC_CONTAINER_NEXT_ACT = "activity-container/nextActivity",
        TOPIC_ITEM_COMPLETED = "activity-container/bottom-bar/item/completed",
        TOPIC_RETRY_ACT = "activity/retry",

        state_machine = {},
        $subELs = {};


    function toggleLayout(states) {
        // Show or hide, enable or disable button
        states.forEach(function (state) {
            var $el = state.$el;
            if (!$el) return;
            state.show ? $el.addClass(CLS_SHOW) : $el.removeClass(CLS_SHOW);
            state.enable ? $el.removeClass(CLS_DISABLE) : $el.addClass(CLS_DISABLE);
            //for automation test
            state.enable ? $el.attr("data-at-enable", "true") : $el.attr("data-at-enable", "false");
        });
    }

    function stateProxy(state_name, state, itemPrefix) {
        if(itemPrefix) state_name = itemPrefix + state_name;
        state_machine[state_name] = state;
        check_button_state(state_machine);
    }

    function itemStateProxy(state_name, state) {
        stateProxy(state_name, state, ITEM_PREFIX);
    }

    function publishProxy($el) {
        if(!$el) return;
        
        if (!$el.hasClass(CLS_DISABLE)) {           
            var args = [].slice.call(arguments, 1);
            this.publish.apply(this, args);
        }
    }

    function check_button_state(states) {
        // Button states conditions
        var answered = states[ITEM_PREFIX + ITEM_PROP.ANSWERED],
            instantFeedback = states[ITEM_PREFIX + ITEM_PROP.INSTANT_FEEDBACK],
            savable = states[ITEM_PREFIX + ITEM_PROP.SAVABLE],
            isPractice= states[PROP.TYPE] === ACT_TYPE.PRACTICE,
            isLearning = states[PROP.TYPE] === ACT_TYPE.LEARNING,
            isExercise = states[PROP.TYPE] === ACT_TYPE.EXERCISE,     

            itemCompleted = states[ITEM_PREFIX + ITEM_PROP.COMPLETED],

            completed = states[PROP.COMPLETED],
            index = states[PROP.INDEX],
            length = states[PROP.LENGTH],

            isLastItem = index >= length - 1;

        var showCheck = !completed && (!instantFeedback && !savable && isExercise && !itemCompleted),
            showDone = isPractice && isLastItem && !savable && !completed,
            showMoveon = completed || ((!isExercise || instantFeedback) && !savable && isLastItem);

        toggleLayout([
            {   //Save state
                $el: $subELs.save,
                show: savable && !isExercise && !completed,
                enable: answered
            },
            {   //Submit state
                $el: $subELs.submit,
                show: savable && isExercise && !completed,
                enable: answered
            },
            {   //check answer state
                $el: $subELs.check,
                show: showCheck,
                enable: answered
            },
            {   //Done state
                $el: $subELs.done,
                show: showDone,
                enable: answered
            },
            {   //Move on state
                $el: $subELs.moveOn,
                show: showMoveon && !showDone,
                enable: completed || (!isExercise && answered)
            },
            {   //retry state
                $el: $subELs.retry,
                show: (!isLearning || savable) && completed && !(savable && isExercise),
                enable: completed
            },
            {   //next question state
                $el: $subELs.nextQues,
                show: !showCheck && length > 1 && index < length - 1,
                enable: answered || isLearning
            }
        ]);
    }

    function subElList($el, list) {
        Object.keys(list).forEach(function(key){
            $subELs[key] = $el.find("." + list[key]);
        });
    }

    return Widget.extend({
        "sig/start": function() {
            var me = this,
                $el = me[$EL];

            return me.html(tBottomBtn).then(function(){
                subElList($el, {
                    check: CLS_CHECK_ANSWER,
                    nextQues: CLS_NEXT,
                    save: CLS_SAVE,
                    submit: CLS_SUBMIT,
                    nextAct: CLS_NEXT_ACT,
                    prevAct: CLS_PREV_ACT,
                    done: CLS_DONE,
                    retry: CLS_RETRY,
                    moveOn: CLS_MOVE_ON
                });
            });
        },
        "sig/finalize":function(){
            jqueryInTroop1(this[$EL].find(".ets-asr-ob-bt")).remove();
        },
        "hub:memory/load/results":function(results){
            var me = this;
            results &&
                results.activity &&
                results.activity === "summary" ? me.hide() : me.show();
        },
        "hide": function hideBottomBar() {
            this.$element.addClass(CLS_HIDDEN);
        },
        "show": function showBottomBar() {
            this.$element.removeClass(CLS_HIDDEN);
        },
        "hub/activity/prop/changed/completed": function stateCompleted(state) {
            stateProxy(PROP.COMPLETED, state);
        },
        "hub/activity/prop/changed/index": function stateIndex(state) {
            stateProxy(PROP.INDEX, state);
        },
        "hub/activity/prop/changed/length": function stateLength(state) {
            stateProxy(PROP.LENGTH, state);
        },
        "hub/activity/prop/changed/type": function stateType(state) {
            stateProxy(PROP.TYPE, state);
        },
        "hub/activity/item/prop/changed/answered": function itemStateAnswered(state) {
            itemStateProxy(ITEM_PROP.ANSWERED, state);
        },
        "hub/activity/item/prop/changed/instantFeedback": function itemStateInstantFeedback(state) {
            itemStateProxy(ITEM_PROP.INSTANT_FEEDBACK, state);
        },
        "hub/activity/item/prop/changed/savable": function itemStateSavable(state) {
            itemStateProxy(ITEM_PROP.SAVABLE, state);
        },
        "hub/activity/item/prop/changed/completed": function itemStateCompleted(state) {
            itemStateProxy(ITEM_PROP.COMPLETED, state);
        },
        "dom:[data-action=check]/click": function checkAnswer() {
            publishProxy.call(this, $subELs.check, TOPIC_CHECK_ANSWERS);
        },
        "dom:[data-action=nextQues]/click": function nextQuestion() {
            publishProxy.call(this, $subELs.nextQues, TOPIC_NEXT_STEP);
        },
        "dom:[data-action=next]/click": function nextActivity() {
            publishProxy.call(this, $subELs.moveOn, TOPIC_MOVE_ON_ACT);
            publishProxy.call(this, $subELs.moveOn, TOPIC_CONTAINER_NEXT_ACT);
        },
        "dom:[data-action=save]/click": function saveContent() {
            publishProxy.call(this, $subELs.save, TOPIC_ITEM_COMPLETED, true, state_machine[PROP.INDEX]);
        },
        "dom:[data-action=submit]/click": function submitContent() {
            publishProxy.call(this, $subELs.submit, TOPIC_CHECK_ANSWERS);
        },
        "dom:[data-action=done]/click": function submitContent() {
            publishProxy.call(this, $subELs.done, TOPIC_ITEM_COMPLETED, true, state_machine[PROP.INDEX]);
        },
        "dom:[data-action=retry]/click": function submitContent() {
            publishProxy.call(this, $subELs.retry, TOPIC_RETRY_ACT);
        }
    });
});
