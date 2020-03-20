define([
	'jquery',
	'lodash'
], function(
	$,
	_
){
	'use strict';

	function bindData($element, value, key){
		var paramName;
		if(_.isEmpty(value)) {
			return key;
		} else {
			paramName = 'data' + _.size($element.data());
			$element.data(paramName, value);
			return key + '(' + paramName + ')';
		}
	}

	return function(options){
		var $element = $('<div>');
		var widgets = _.mapKeys(options, _.partial(bindData, $element));
		return $element.attr('data-weave', _.keys(widgets).join(' '));
	};
});
