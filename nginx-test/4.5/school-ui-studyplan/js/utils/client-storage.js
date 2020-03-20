define(["school-ui-studyplan/enum/client-storage-pair", "poly"], function (pair, poly) {
		var localStorage = window.localStorage;
		var sessionStorage = window.sessionStorage;

		return {
			setLocalStorage: function (pairKey, pairValue) {
				if (pair[pairKey] && (!pair[pairKey]["keyValue"] || pair[pairKey]["keyValue"].indexOf(pairValue) > -1)) {
					localStorage && localStorage.setItem(pair[pairKey]["keyName"], JSON.stringify(pairValue));
				}
			},
			getLocalStorage: function (pairKey) {
				var storageData = 	localStorage && pair[pairKey] &&
									localStorage.getItem(pair[pairKey]["keyName"]);
				return storageData && JSON.parse(storageData);
			},
			setSessionStorage: function (pairKey, pairValue) {
				if (pair[pairKey] && (!pair[pairKey]["keyValue"] || pair[pairKey]["keyValue"].indexOf(pairValue) > -1)) {
					sessionStorage && sessionStorage.setItem(pair[pairKey]["keyName"], JSON.stringify(pairValue));
				}
			},
			getSessionStorage: function (pairKey) {
				var storageData = 	sessionStorage && pair[pairKey] &&
									sessionStorage.getItem(pair[pairKey]["keyName"]);
				return storageData && JSON.parse(storageData);
			}
		};
	}
);
