angular.module('ngCordova.plugins.dialogs', [])

.factory('$cordovaDialogs', [function() {

  return {
    alert: function(message, callback, title, buttonName) {
	    return navigator.notification.alert.apply(navigator.notification, arguments);
    },

    confirm: function(message, callback, title, buttonName) {
	    return navigator.notification.confirm.apply(navigator.notification, arguments);
    },

    prompt: function(message, promptCallback, title, buttonLabels, defaultText) {
	    return navigator.notification.prompt.apply(navigator.notification, arguments);
    },

    beep: function(times) {
	    return navigator.notification.beep(times);
    }
  }
}]);

angular.module('ngCordova.plugins.network', [])

.factory('$cordovaNetwork', [function () {

  return {

    getNetwork: function () {
      return navigator.connection.type;
    },

    isOnline: function () {
      var networkState = navigator.connection.type;
      return networkState !== Connection.UNKNOWN && networkState !== Connection.NONE;
    },

    isOffline: function () {
      var networkState = navigator.connection.type;
      return networkState === Connection.UNKNOWN || networkState === Connection.NONE;
    }
  }
}]);
angular.module('ngCordova.plugins.push', [])

.factory('$cordovaPush', ['$q', function ($q) {
    return {
        register: function (config) {
            var q = $q.defer();
            window.plugins.pushNotification.register(
            function (result) {
                q.resolve(result);
            },
            function (error) {
                q.reject(error);
            },
            config);
            
            return q.promise;
        },
        
        unregister: function (options) {
            var q = $q.defer();
            window.plugins.pushNotification.unregister(
            function (result) {
                q.resolve(result);
            },
            function (error) {
                q.reject(error);
            },
            options);
            
            return q.promise;
        },
        
        // iOS only
        setBadgeNumber: function(number) {
        	var q = $q.defer();
            window.plugins.pushNotification.setApplicationIconBadgeNumber(
            function (result) {
                q.resolve(result);
            },
            function (error) {
                q.reject(error);
            },
            number);
            return q.promise;
        }
    };
}]);

angular.module('ngCordova', ['ngCordova.plugins.dialogs', 'ngCordova.plugins.network', 'ngCordova.plugins.push']);