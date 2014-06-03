angular.module('starter.controllers', ['ionic', 'starter.services', 'starter.constants'])

.controller('MainCtrl',
    ['$scope', '$state',  '$ionicSideMenuDelegate', '$ionicModal', '$ionicPlatform', '$log', 'UserService', 'CarroService', 'DBService',
      function($scope, $state, $ionicSideMenuDelegate, $ionicModal, $ionicPlatform, $log, UserService, CarroService, DBService) {
        "use strict";

        var logger = $log;

        var modalLogin;

        var isBrowser = false;

        $scope.closeSideMenuMeusCarros = function() {
          $scope.toggleLeft();
          $state.go('meusCarros');
        }

        $scope.closeSideMenuCadastrar = function() {
          $scope.toggleLeft();
          $state.go('cadastrarCarro');
        }

        //criando a modal de login
        $ionicModal.fromTemplateUrl('templates/loginPopup.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          modalLogin = modal;
        });
        var openModalLogin = function() {
          modalLogin.show();
        };
        var closeModalLogin = function() {
          if (modalLogin) {
            modalLogin.hide();
          }
        };
        $scope.$on('$destroy', function() {
          modalLogin.remove();
        });

        $scope.$on('eventEfetuarLogin', function (e) {
          logger.debug('pegou o evento');
          openModalLogin();
        });

        window.addEventListener('storage', function(e) {
          logger.debug('começando');
          logger.debug(e);
          logger.debug('inicializado do storage '+ window.localStorage.getItem('id'));
          inicializar();
        });
        var userid;
        var inicializar = function () {
         // isBrowser = !$ionicPlatform.isWebView();
          DBService.inicializar(
              function () {
                DBService.executarSelect('SELECT ID, BODY FROM usuario', [], preencherUsuario,
                    function(err) {
                      logger.error(err);
                    }
                );
              }
          );
        };

        $ionicPlatform.ready(inicializar);

        var loadMeusCarros = function () {
          CarroService.getMeusCarros().then(
              function(carros) {
                logger.debug(carros);
                var irPara;
                if (carros.length > 0) {
                  logger.debug('indo para o state meusCarros');
                  irPara = 'meusCarros';
                } else {
                  logger.debug('indo para o state meusCarros pelo else');
                  irPara = 'cadastrarCarro';
                }
                $state.go(irPara, null, {location: "replace"});
              }
          );
        };

        $scope.$on('carros.timeoutToReload',
            function() {
              "use strict";
              loadMeusCarros();
            }
        )

        $scope.$on('eventLoginSuccess', function(e, data) {
          logger.debug('pegou o evento ' + JSON.stringify(data));
          UserService.setUsuario(data);
          //if(modalLogin) {
          closeModalLogin();
          //}
          var carros = CarroService.getMeusCarrosLocal();
          var irPara;
          if (carros) {
            if (carros.length > 0) {
              CarroService.getMeuCarroSelecionadoLocal().then(
                  function (carroSelecionado) {
                    if (carroSelecionado) {
                      $state.go('meuCarroSelecionado.meuCarro', null, {location:"replace"});
                    }
                  }
              );
              logger.debug('indo para o state meusCarros');
              irPara = 'meusCarros';
            } else {
              logger.debug('indo para o state meusCarros pelo else');
              irPara = 'cadastrarCarro';
            }
            $state.go(irPara, null, {location: "replace"});
          }
          /*CarroService.getMeusCarros().then(
              function(carros) {
                logger.debug(carros);
                var irPara;
                if (carros.length > 0) {
                  logger.debug('indo para o state meusCarros');
                  irPara = 'meusCarros';
                } else {
                  logger.debug('indo para o state meusCarros pelo else');
                  irPara = 'cadastrarCarro';
                }
                $state.go(irPara, {location: 'replace'});
              }
          );*/
        });

        var preencherUsuario = function (tx, results) {
          logger.debug(results.rows.length);
          if (results.rows.length > 0) {
            userid = results.rows.item(0).id;
            logger.debug('carregou do database userid=' + userid);
          }
          logger.debug('preencherUsuario1');
          var userId = userid;

          logger.debug('userId ' + userId);
          //userId = 1;
          if (userId) {
            $scope.$broadcast('eventLoginSuccess', {_id: userId});
          } else {
            logger.debug('entrou');
            logger.debug('vai enviar msg de evento');
            $scope.$broadcast('eventEfetuarLogin');
            logger.debug('enviada msg de evento');
          }
        };

        $scope.toggleLeft = function() {
          $ionicSideMenuDelegate.toggleLeft();
        };
      }
    ]
)

.controller('CarroCtrl',
    function ($scope, $ionicModal, $state, $log, $ionicPopup, CarroService, FabricanteService, LoadingService, CarroConstantes) {

      var logger = $log;

      logger.debug('entrou no carroCtrl');

      $scope.cadastro = {
        fabricanteSelecionado: CarroConstantes.labelSelecionarFabricante,
        labelSelecionarCarro: CarroConstantes.labelSelecionarCarro,
        carroSelecionado: null,
        nomeCarro: null,
        isExibirBotaoSelecionarCarro: function () {
          "use strict";
          return !$scope.cadastro.carroSelecionado && ($scope.cadastro.fabricanteSelecionado !== CarroConstantes.labelSelecionarFabricante);
        }
      };


      //$scope.fabricanteSelecionado = 'Fabricante';
      //$scope.carroSelecionado = null;
      $scope.carros = CarroService.carros;
      $scope.nomeCarro = '';

      $ionicModal.fromTemplateUrl('templates/selectFabricantes.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.modalFabricantes = modal;
      });

      $scope.openModalFabricante = function() {
        if ($scope.fabricantes.length == 0) {
          $scope.fabricantes = FabricanteService.getFabricantes();
        }
        $scope.modalFabricantes.show();
      };
      $scope.closeModalFabricantes = function() {
        $scope.modalFabricantes.hide();
      };

      $scope.selecionarFabricante = function(fabricante) {
        "use strict";
        if (fabricante) {
          if ($scope.cadastro.fabricanteSelecionado != fabricante.nome) {
            $scope.carros.splice(0, $scope.carros.length);
            $scope.cadastro.carroSelecionado = null;
            $scope.cadastro.fabricanteSelecionado = fabricante.nome;
          }
        } else {
          $scope.cadastro.fabricanteSelecionado = 'Fabricante';
        }
        $scope.closeModalFabricantes();
      };

      $ionicModal.fromTemplateUrl('templates/selectCarro.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.modalCarro = modal;
      });

      $scope.openModalCarro = function(fabricanteSelecionado) {
        if (fabricanteSelecionado) {
          $scope.modalCarro.show();
        }
      };
      $scope.closeModalCarro = function() {
        $scope.modalCarro.hide();
      };

      $scope.selecionarCarro = function(carroSelecionado) {
        "use strict";
        if (carroSelecionado) {
          $scope.novoCarro.carroTransient = carroSelecionado;
          $scope.cadastro.carroSelecionado = $scope.novoCarro.carroTransient.nome;
        }
        $scope.closeModalCarro();
      }

      //Cleanup the modal when we're done with it!
      $scope.$on('$destroy', function() {
        $scope.modalFabricantes.remove();
        $scope.modalCarro.remove();
      });

      $scope.carregarMeusCarros = function () {
        $scope.meusCarros = CarroService.getMeusCarrosLocal();
        /*CarroService.getMeusCarros().then(function (meusCarros) {
         "use strict";
         $scope.meusCarros = meusCarros;
         }).catch(function (err) {
         "use strict";
         console.log('ocorreu um erro ' + err);
         }).finally(function () {
         "use strict";
         logger.debug('carregou meus carros');
         });*/
      }

      logger.debug($scope.meusCarros);

      $scope.novoCarro = CarroService.getNovoCarro();
      $scope.fabricantes = [];

      $scope.pesquisarCarros = function (nomeCarro) {
        "use strict";
        CarroService.getCarros($scope.novoCarro.fabricanteTransient._id, nomeCarro);
      };

      $scope.pesquisarFabricante = function (nomeFabricante) {
        "use strict";
        FabricanteService.getFabricantes(nomeFabricante);
      };

      $scope.inserirCarro = function () {
        "use strict";

        LoadingService.showLoading();

        var salvarPromise = CarroService.salvarNovoCarro($scope.novoCarro);
        salvarPromise.then(
            function (msg) {
              logger.debug(msg);
              $scope.novoCarro = CarroService.getNovoCarro();
              //LoadingService.hideLoading();
              $state.go('^.meusCarros')

            },
            function(err) {
              //LoadingService.hideLoading();
              logger.error('Ocorreu um erro ao salvar o carro: ' + err);
              $ionicPopup.alert({
                title: 'Ops...',
                template: err.msgErro
              });

            }

        );
        salvarPromise.finally(LoadingService.hideLoading);

      }

      $scope.exibirMeuCarro = function (meuCarro) {
        "use strict";
        CarroService.setMeuCarroSelecionado(meuCarro);
        $state.go('meuCarroSelecionado.meuCarro');
      }

      $scope.cancelarPesquisa = function () {
        "use strict";
        CarroService.carros.splice(0, CarroService.carros.length);
      }

      $scope.doRefresh = function() {
        "use strict";
        CarroService.getMeusCarros(true).then(function (meusCarros) {
          "use strict";
          $scope.meusCarros = meusCarros;
        }).catch(function (err) {
          "use strict";
          logger.error('ocorreu um erro ' + err.msgErro);
          $ionicPopup.alert({
            title: 'Ops...',
            template: err.msgErro
          });
        }).finally(function () {
          "use strict";
          $scope.$broadcast('scroll.refreshComplete');
        });

      }
      $scope.$on('carros.timeoutToReload',
          function() {
            "use strict";
            $scope.doRefresh();
          }
      )
    },
    ['$scope', '$ionicModal', '$state', '$log', '$ionicPopup', 'CarroService', 'FabricanteService', 'LoadingService'
    ]
)
.controller('MeuCarroSelecionadoCtrl',
    ['$scope', '$state', '$ionicTabsDelegate', '$log', '$ionicPopup', 'CarroService',
      function($scope, $state, $ionicTabsDelegate, $log, $ionicPopup, CarroService) {
          "use strict";
        var logger = $log;


          $scope.novoAbastecimento = null;
          $scope.meuCarroSelecionado = CarroService.meuCarroSelecionado;

          $scope.abastecer = function() {
            $scope.novoAbastecimento = CarroService.criarNovoAbastecimento();
            $state.go('^.abastecer');
          }

          $scope.salvarAbastecimento = function (carro, abastecimento) {

            CarroService.salvarAbastecimento(carro, abastecimento).then(
                function() {
                  $state.go('^.meuCarro');
                }
            ).catch(
                function(err) {
                  logger.error(err.msg);
                  $ionicPopup.alert({
                    title: 'Ops...',
                    template: err.msgErro
                  });
                }
            )
          };

          $scope.cancelarAbastecimento = function() {
            $scope.novoAbastecimento = {};
            $state.go('^.meuCarro');
          }

          //$state.go('meuCarroSelecionado.meuCarro')
        }

    ]
);
