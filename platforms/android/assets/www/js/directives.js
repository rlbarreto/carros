/**
 * Created by rafael on 14/03/14.
 */
angular.module('starter.directives', [])

.directive('popupLogin',
    function (){
      "use strict";

      var link = function(scope, element, $ionicPopup, $q) {

      }

      return {
        restrict: 'E',
        link: link
      }
    }
)

.directive('googleLogin',
    function($q, $http, DBService) {
      "use strict";

      function link(scope, element) {
        var logarBtn = angular.element(element[0]);


        //transformar a googleapi em um modulo
        var googleapi = {
          buscarDadosUsuario: function (accessToken) {
            var deferred = $q.defer();
            $http.get('https://www.googleapis.com/oauth2/v1/userinfo?access_token='+accessToken, {
              responseType : "json"}).success(
                function(data) {
                  console.log('sucesso ' + JSON.stringify(data));
                  console.log('sucesso ' + data.id);
                  deferred.resolve(data);
                //DBService.executarInsert('INSERT INTO usuario VALUES (?, ?)', [data.id, JSON.stringify(data)], function () { console.log('colocou no database ' + JSON.stringify(data));}, function (error) { console.log('insert failed'); });
                }
            ).error(
                function(err) {
                  deferred.reject(err);
                }
            );


            return deferred.promise;
          },
          authorize: function(options) {
            var deferred = $q.defer();

            //Build the OAuth consent page URL
            var authUrl = 'https://accounts.google.com/o/oauth2/auth?client_id='+
                options.client_id+'&redirect_uri=' + options.redirect_uri+'&response_type=code&scope='+ options.scope;

            //Open the OAuth consent page in the InAppBrowser
            var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');

            //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
            //which sets the authorization code in the browser's title. However, we can't
            //access the title of the InAppBrowser.
            //
            //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
            //authorization code will get set in the url. We can access the url in the
            //loadstart and loadstop events. So if we bind the loadstart event, we can
            //find the authorization code and close the InAppBrowser after the user
            //has granted us access to their data.
            authWindow.addEventListener('loadstop', function(event) {
              var url = event.url;
              console.log('loadstop ' + url);
              //$loginStatus.html('loadstart ' + url);
              var code = /\?code=(.+)$/.exec(url);
              var error = /\?error=(.+)$/.exec(url);

              var funcao = function (codigo) {
                code = codigo;
                if (code || error) {
                  //Always close the browser when match is found
                  authWindow.close();
                }

                console.log('chegou no teste do code ' + code);
                if (code) {
                  //Exchange the authorization code for an access token
                  console.log('pegou o code ' + code);
                  $http.post('https://accounts.google.com/o/oauth2/token', {
                    code: code,
                    client_id: options.client_id,
                    redirect_uri: options.redirect_uri,
                    grant_type: 'authorization_code'
                  }).success(function sucesso(data) {
                        googleapi.buscarDadosUsuario(data.access_token).then(
                            function (dadosUsuario) {
                              deferred.resolve(dadosUsuario);
                            },
                            function (err) {
                              deffered.reject(err);
                            }
                        )

                  }).error(function falha(data) {
                        console.log('reject ' + data);
                        deferred.reject(data);
                  });
                } else if (error) {
                  //The user denied access to the app
                  deferred.reject({
                    error: error[1]
                  });
                }
              }

              authWindow.executeScript({ code: "document.getElementsByTagName('title')[0].innerHTML" },
                  function extrairCodigoGoogle(value) {
                    var codigo = /code=(.+)$/.exec(value);
                    if (codigo) {
                      if (codigo[1]) {
                        funcao(codigo[1]);
                      }
                    }
                  }
              );

            });

            return deferred.promise;
          }

        };
        logarBtn.on('click',
          function (event) {
            googleapi.authorize({
              client_id: '415048123009-v08j7qufbc83dmvrtrjl1jsum8jk6r6h.apps.googleusercontent.com',
              redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
              scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
            })
            .then(
              function sucessoLoginGoogle(data) {

                console.log('vai enviar para ser gravado como usuário' + JSON.stringify(data));
                $http.post('http://meuscarros.jit.su/api/login', data)
                .success(
                    function(usuarioCadastrado) {
                      console.log(usuarioCadastrado);
                      DBService.executarInsert('INSERT INTO usuario VALUES (?, ?)', [usuarioCadastrado._id, JSON.stringify(usuarioCadastrado)], function () { console.log('colocou no database ' + JSON.stringify(data));}, function (error) { console.log('insert failed'); });
                      scope.$emit('eventLoginSuccess', usuarioCadastrado);
                    }
                ).error(
                    function(data, status) {
                      console.log('deu erro ' + status);

                      console.log(data);
                    }
                );
              },
              function erroLoginGoogle(data) {
              },
              function(data) {
              }
            );
          }
        );
      };

      return {
        restrict: 'A',
        link: link
      };
    }
)
.directive('focusOnShow',
    function() {
      "use strict";
      var link = function (scope, element) {

        scope.$on('OnShow',
            function() {
              element[0].focus();
            }
        );
      };

      return {
          restrict: 'A',
          link: link
      }
    }
);