define([
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
