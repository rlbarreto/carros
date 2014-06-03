// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngAnimate', 'starter.controllers', 'starter.directives', 'starter.filters'],
    function ($httpProvider) {
      // Use x-www-form-urlencoded Content-Type
      $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

      /**
       * The workhorse; converts an object to x-www-form-urlencoded serialization.
       * @param {Object} obj
       * @return {String}
       */
      var param = function(obj) {
        var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

        for(name in obj) {
          value = obj[name];

          if(value instanceof Array) {
            for(i=0; i<value.length; ++i) {
              subValue = value[i];
              fullSubName = name + '[' + i + ']';
              innerObj = {};
              innerObj[fullSubName] = subValue;
              query += param(innerObj) + '&';
            }
          }
          else if(value instanceof Object) {
            for(subName in value) {
              subValue = value[subName];
              fullSubName = name + '[' + subName + ']';
              innerObj = {};
              innerObj[fullSubName] = subValue;
              query += param(innerObj) + '&';
            }
          }
          else if(value !== undefined && value !== null)
            query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }

        return query.length ? query.substr(0, query.length - 1) : query;
      };

      // Override $http service's default transformRequest
      $httpProvider.defaults.transformRequest = function(data) {
        return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
      };
    }
)
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('splash', {
        url: "/",
        templateUrl: "templates/splashScreen.html"
      }
    )

    .state('meusCarros', {
      url: "/meusCarros",
      templateUrl: 'templates/meus-carros.html',
      controller: 'CarroCtrl'
    })

    .state('cadastrarCarro', {
      url: "/cadastrarCarro",
      templateUrl: 'templates/cadastrar.html',
      controller: 'CarroCtrl'
    })
    .state('meuCarroSelecionado', {
        url:"/meuCarroSelecionado",
        templateUrl: 'templates/meuCarroSelecionado.html',
        abstract:true,
        controller: 'MeuCarroSelecionadoCtrl'
    })
    .state('meuCarroSelecionado.meuCarro', {
        url:'/meuCarro',
        controller: function($scope) {
          "use strict";
          if (!$scope.novoAbastecimento) {
            $scope.novoAbastecimento = {};
          }

          $scope.novoAbastecimento.edicao = false;
        }
      }
    )
    .state('meuCarroSelecionado.abastecer', {
        url:'/abastecer',
        controller: function($scope) {
          "use strict";
          if (!$scope.novoAbastecimento) {
            $scope.novoAbastecimento = {};
          }

          $scope.novoAbastecimento.edicao = true;
        }
      }
    );


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

});

