define([
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
