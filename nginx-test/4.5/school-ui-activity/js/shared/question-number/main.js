define([
	'jquery',
	'troopjs-ef/component/widget',
	"template!./main.html"
], function mpaMain($, Widget, tQn) {
    "use strict";
    var SEL_MAIN = '.ets-wgt-qs',
        SEL_LEFT_NUM = '.ets-wgt-qs-index-left',
        SEL_RIGHT_NUM = '.ets-wgt-qs-index-right',
        STR_MASK = '0';

	function render() {
        var me = this,
            $ROOT = me.$element;
        $ROOT.find(SEL_MAIN).hide();
		return me
			.html(tQn, me._json)
			.tap(onRendered.bind(me));
    }
    function hideQuestionNumber() {
        var me = this,
            $ROOT = me.$element;
        if($ROOT == null || $ROOT.length === 0){
            return;
        }
        $ROOT.find(SEL_MAIN).stop().delay(800).fadeOut();
    }
    function onRendered() {
        var me = this,
            $ROOT = me.$element;
        $ROOT.stop().fadeIn(500,function () {
			var rightNumbers = $ROOT.find(SEL_RIGHT_NUM).find('li');
                if (rightNumbers.length > 1) {
                    rightNumbers.eq(0).delay(100).animate({
                        marginTop : -rightNumbers.eq(0).height()
                    }, function () {
                        var leftNumbers = $ROOT.find(SEL_LEFT_NUM).find('li');
                        if (leftNumbers.length > 1) {
                            leftNumbers.eq(0).delay(100).animate({
                                marginTop : -leftNumbers.eq(0).height()
                            }, function () {
                                hideQuestionNumber.call(me);
                            });
                        } else {
                            hideQuestionNumber.call(me);
                        }
                    });
                }
        });
	}
    return Widget.extend({
		"sig/render": function onRender() {
			return render.call(this);
        },
		'hub/activity/step/render': function onQuestionNumberLoad(currentIndex, total) {
            if(!(total > 1)){
                return;
            }
            currentIndex++;
            var me = this;
            me._json = me._json || {};
            var data = me._json;
            data._total = total;
            data._total = data._total < 10 ? (data._total = STR_MASK + data._total):(data._total = data._total.toString());
            data._preIndex = currentIndex - 1;
            data._preIndex < 10 ? (data._preIndex = STR_MASK + data._preIndex) : (data._preIndex = data._preIndex.toString());
            currentIndex < 10 ? (data._curIndex = STR_MASK + currentIndex) : (data._curIndex = currentIndex.toString());
			return me.signal('render');
        }
    });
});
