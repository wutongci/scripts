define(function(){
    return [{
        'id': 'tracking!e12_omniture',
        'tracking': [{
            'id': 'tracking_item!001',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/?$",
            'props': {
                'pageName': "School:Courseware:UnitMainMenu"
            },
            'events': [{
                'id': 'tracking_events!001',
                'click': [{
                    'id': 'tracking_event_click!001',
                    'selector': ' .ets-overview',
                    'props': {
                        'pageName': "School:Courseware:Test"
                    }
                }]
            }]
        },
        // {
        //     'id': 'tracking_item!002',
        //     'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
        //     'props': {
        //         'pageName': "School:Courseware:UnitBox"
        //     }
        // },
        {
            'id': 'tracking_item!003',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'props':{
                'pageName': "School:Courseware:Lessons"
            }
        },
        {
            'id': 'tracking_item!004',
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/unit-overview/open',
                'props': {
                    'pageName': "School:Courseware:UnitOverview"
                }
            }]   
        },
        {
            'id': 'tracking_item!005',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/lesson/expand/0',
                'props': {
                    'pageName': "School:Courseware:UnitBox1"
                }
            }]
        },
        {
            'id': 'tracking_item!006',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/lesson/expand/1',
                'props': {
                    'pageName': "School:Courseware:UnitBox2"
                }
            }]
        },
        {
            'id': 'tracking_item!007',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/lesson/expand/2',
                'props': {
                    'pageName': "School:Courseware:UnitBox3"
                }
            }]
        },
        {
            'id': 'tracking_item!008',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/?$",
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/lesson/expand/3',
                'props': {
                    'pageName': "School:Courseware:UnitBox4"
                }
            }]
        },
        {
            'id': 'tracking_item!009',
            'behavior': [{
                'id': 'tracking_behaviors!001',
                'name': 'study/change-course/expand',
                'props': {
                    'pageName': "School:Courseware:EnglishCategories"
                }
            }]
        },
        {
            'id': 'tracking_item!010',
            'regex': "^school/\\d+/\\d+/\\d+/\\d+/\\d+/\\d+/summary$",
            'props':{
                'pageName': "School:Courseware:ActivityResults"
            }
        }
        ]
    },{
        'id': 'tracking!e12_etvt',
        'tracking':[{
            'id': 'tracking_item!001',
            'regex': "",
            'props': {}
        }]
    }];
});
