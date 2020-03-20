define(["troopjs-ef/component/gadget", "./typeid-parser"], function(Gadget, typeIdParser){

	var UNDEF;
	var URI = "URI";
	var NUMBER_ANY = '234';

	var EXPAND = [ , "enrollment!$2", "course!$2", "level!$2", "unit!$2", "lesson!$2", "step!$2", "activity!$2.activityContent" ];
	var PLACEHOLDER_ID = '$2';
	var PREFIX = [];
	var PREFIX_POSITION = {};
	var inited = false;

	/**
	 * update uri according to the IDs that passed in.
	 * @param IDs
	 */
	function routeUri() {
		var me = this;
		var uri = me[URI];
		var path = uri.path || [];
		var length = 0;

		$.each(arguments, function (i, entity) {
			var matches = typeIdParser.parse(entity);
			var type;
			var id;
			var position;

			// Is this an entity
			if (matches) {
				type = matches.type;
				id = matches.id || "";

				// Do we know where to change
				if (type in PREFIX_POSITION) {
					// Get position
					position = PREFIX_POSITION[type];

					// Update path
					path[position] = id;

					// Update length
					length = Math.max(length, position);
				}
			}
		});

		// Did we modify anything?
		if (++length > 1) {
			// Remove trailing part of path
			path.length = length;
			// Reroute
			me.route(uri);
		}
	}

	/**
	 * remove some id value in url hash
	 * @param id id or type
	 */
	function unrouteUri(id) {
		var me = this;

		var uri = me[URI];

		var path = uri.path || [];
		var type = id;

		if (typeIdParser.isId(id)){
			type = typeIdParser.parseType(id);
		}

		var pos = PREFIX_POSITION[type];

		if (!pos){
			throw "pathFormatter: no such type";
		}

		while(path.length > pos) {
			path.pop();
		}

		me.route(uri);
	}

	var pathFormatter = Gadget.create(function(){
		var expand, type, l;

		init : {

			if (inited){
				break init;
			}

			// get prefixes and prefix positions
			for(var l = EXPAND.length; l--;){

				type = UNDEF;

				expand = EXPAND[l];

				if (expand){
					type = typeIdParser.parseType(expand.replace(PLACEHOLDER_ID, NUMBER_ANY));

					PREFIX_POSITION[type] = l;
				}

				PREFIX.unshift(type);

			}

			inited = true;
		}

	}, {
		PREFIX: PREFIX,
		EXPAND: EXPAND,
		POSITION: PREFIX_POSITION,
		"displayName" : "school-ui-shared/utils/path-formatter",
		"hub:memory/route" : function onRoute(uri) {
			this[URI] = uri;
		},
		/**
		 * update uri according to the IDs that passed in.
		 * @param IDs
		 */
		expand: routeUri,

		/**
		 * remove some id value in url hash
		 * @param id id or type
		 */
		collapse: unrouteUri
	});

	pathFormatter.start();
	return pathFormatter;
});
