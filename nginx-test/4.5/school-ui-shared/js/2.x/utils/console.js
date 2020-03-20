define([
	"school-ui-shared/module"
],	function(module){
	var config = module.config();

	function EMPTY(){}

	function wraper(name){
		return config.debug ?
					window.console &&
						typeof window.console[name] === "function" &&
						function(){
							window.console[name].apply(window.console, arguments)
						}
						||
						EMPTY
					:
					EMPTY;
	}

	return {
		log : wraper("log"),
		warn : wraper("warn"),
		error : wraper("error"),
		info : wraper("info"),
		dir : wraper("dir"),
		time : wraper("time"),
		timeEnd : wraper("timeEnd")
	}
});
