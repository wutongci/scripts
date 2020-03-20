define([
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
