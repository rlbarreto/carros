angular.module('starter.controllers', ['ionic', 'starter.services', 'starter.constants'])

.controller('MainCtrl',
    ['$scope', '$state',  '$ionicSideMenuDelegate', '$ionicModal', '$ionicPlatform', '$log', '$cordovaNetwork', '$cordovaDialogs', 'UserService', 'CarroService', 'DBService', 'CarroConstantes',
      function($scope, $state, $ionicSideMenuDelegate, $ionicModal, $ionicPlatform, $log, $cordovaNetwork, $cordovaDialogs, UserService, CarroService, DBService, CarroConstantes) {
        "use strict";

        var logger = $log;

        var modalLogin;

        $scope.closeSideMenuMeusCarros = function() {
          $scope.toggleLeft();
          $state.go('meusCarros');
        };

        $scope.closeSideMenuCadastrar = function() {
          $scope.toggleLeft();
          $state.go('cadastrarCarro');
        };

        $scope.closeSideMenuMotoristas = function() {
          $scope.toggleLeft();
          $state.go('motoristas');
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
          if (navigator && navigator.splashscreen) {
            setTimeout(function () {
              navigator.splashscreen.hide();
            }, 100);
          }
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
          /*inicializar();*/
        });
        var userid;
        var inicializar = function () {
          //admob
            if( window.plugins && window.plugins.AdMob ) {
                var admob_ios_key = 'ca-app-pub-6869992474017983/4806197152';
                var admob_android_key = 'ca-app-pub-6869992474017983/9375997553';
//                var adId = (navigator.userAgent.indexOf('Android') >=0) ? admob_android_key : admob_ios_key;
                var adId = admob_android_key;
                var am = window.plugins.AdMob;

                am.createBannerView(
                    {
                        'publisherId': adId,
                        'adSize': am.AD_SIZE.SMART_BANNER,
                        'bannerAtTop': false
                    },
                    function() {
                        am.requestAd(
                            { 'isTesting':false },
                            function(){
                                am.showAd( true );
                            },
                            function(){ alert('failed to request ad'); }
                        );
                    },
                    function(){ alert('failed to create banner view'); }
                );
            } else {
                alert('AdMob plugin not available/ready.');
            }
          //fim do admob
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
              function (carros) {
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
                if (navigator && navigator.splashscreen) {
                  setTimeout(function () {
                    navigator.splashscreen.hide();
                  }, 100);
                }
              }
          );
        };

        $scope.$on('carros.timeoutToReload',
            function() {
              "use strict";
              if ($cordovaNetwork.isOnline()) {
                loadMeusCarros();
              }
            }
        );

        $scope.$on('eventLoginSuccess', function(e, data) {
          logger.debug('pegou o evento ' + JSON.stringify(data));
          UserService.setUsuario(data);
          DBService.atualizarVersaoApp();
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
            if (navigator && navigator.splashscreen) {
              setTimeout(function () {
                navigator.splashscreen.hide();
              }, 100);

            }
          }
        });

        var preencherUsuario = function (tx, results) {
          logger.debug(results.rows.length);
          var usuario = {};
          if (results.rows.length > 0) {
            usuario = JSON.parse(results.rows.item(0).body);
            logger.debug('carregou do database userid=' + usuario._id);

          }
          logger.debug('preencherUsuario1');
          var userId = usuario._id;

          logger.debug('userId ' + userId);
          //userId = 1;
          logger.debug('versao carregada ' + DBService.carregarVersaoAppArmazenada());
          if (userId && (DBService.carregarVersaoAppArmazenada() == CarroConstantes.versao)) {
            $scope.$broadcast('eventLoginSuccess', usuario);
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

      $scope.searchFabricante = {};
      $scope.searchCarro = {};

      //$scope.fabricanteSelecionado = 'Fabricante';
      //$scope.carroSelecionado = null;
      $scope.carros = CarroService.carros;
      $scope.nomeCarro = '';
      if (!$scope.novoCarro) {
        $scope.novoCarro = null;
      }

      $scope.inicializarCadastro = function() {
        "use strict";
        $scope.novoCarro = CarroService.getNovoCarro();
      };

      $ionicModal.fromTemplateUrl('templates/selectFabricantes.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.modalFabricantes = modal;
      });

      $scope.openModalFabricante = function() {
        /*if ($scope.fabricantes.length == 0) {
          $scope.fabricantes = FabricanteService.getFabricantes();
        }*/
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
          $scope.cadastro.carroSelecionado = carroSelecionado.nome;
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
      }

      logger.debug($scope.meusCarros);

      $scope.fabricantes = FabricanteService.fabricantes;

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

      $scope.cancelarPesquisaCarro = function () {
        "use strict";
        $scope.searchCarro.nomeCarro = '';
        CarroService.carros.splice(0, CarroService.carros.length);
      }

      $scope.cancelarPesquisaFabricante = function () {
          "use strict";
        $scope.searchFabricante.nome='';
        FabricanteService.fabricantes.splice(0);
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
      /*$scope.$on('carros.timeoutToReload',
          function() {
            "use strict";
            $scope.doRefresh();
          }
      )*/
    },
    ['$scope', '$ionicModal', '$state', '$log', '$ionicPopup', 'CarroService', 'FabricanteService', 'LoadingService'
    ]
)
.controller('MeuCarroSelecionadoCtrl',
    ['$scope', '$state', '$ionicTabsDelegate', '$log', '$ionicPopup', '$ionicScrollDelegate', 'CarroService',
      function($scope, $state, $ionicTabsDelegate, $log, $ionicPopup, $ionicScrollDelegate, CarroService) {
          "use strict";
        var logger = $log;

        $scope.novoAbastecimento = null;
        $scope.meuCarroSelecionado = CarroService.meuCarroSelecionado;

        $scope.abastecer = function() {
          $scope.novoAbastecimento = CarroService.criarNovoAbastecimento();
          $state.go('^.abastecer');
          $ionicScrollDelegate.scrollTop();
        }

        $scope.salvarAbastecimento = function (carro, abastecimento) {

          CarroService.salvarAbastecimento(carro, abastecimento).then(
              function() {
                $state.go('^.meuCarro');
              }
          ).catch(
              function(err) {
                $state.go('^.abastecer');
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
)
.controller('MotoristasController', ['$scope', '$log', '$ionicPopup', '$state', '$ionicActionSheet', 'MotoristaService', 'UserService',
        function($scope, $log, $ionicPopup, $state, $ionicActionSheet, MotoristaService, UserService) {
          "use strict";

          $scope.usuario = UserService.getUsuario();
          $scope.carregarMotoristas = function () {
            MotoristaService.listaMotoristasAssociados($scope.usuario._id).then(
                function (motoristasAssociados) {
                  $scope.motoristasAssociados = motoristasAssociados;
                }
            ).catch(
                function(err) {
                  $log.error(err.msg);
                  $ionicPopup.alert({
                    title: 'Ops...',
                    template: err.msgErro
                  });
                }
            );
          };

          $scope.adicionar = function () {
            $state.go('motoristasCadastrar');
          }



          $scope.showActionSheet = function (motorista) {
            // Show the action sheet
            var hideSheet = $ionicActionSheet.show({
              titleText: '<h4>Opções para motorista <b>' + motorista.nome + '</b></h4>',
              /*buttons: [
                { text: 'Share <i class="icon ion-share"></i>' },
                { text: 'Move <i class="icon ion-arrow-move"></i>' },
              ],*/
              destructiveText: 'Delete',
              cancelText: 'Cancel',
              cancel: function() {
                return true;
              },
              buttonClicked: function(index) {
                console.log('BUTTON CLICKED', index);
                return true;
              },
              destructiveButtonClicked: function() {
                MotoristaService.removerMotorista($scope.usuario._id, motorista);
                return true;
              }
            });

          }
        }
    ]
)
.controller('CadastrarMotoristaController', ['$scope', '$ionicPopup', '$log', '$cordovaDialogs', '$state', 'MotoristaService', 'UserService',
        function ($scope, $ionicPopup, $log, $cordovaDialogs, $state, MotoristaService, UserService) {
          "use strict";

          var logger = $log;
          var usuario = UserService.getUsuario();

          $scope.search = {};

          $scope.motoristas = [];

          $scope.pesquisar = function(dadosPesquisar) {
            MotoristaService.pesquisarMotoristas(dadosPesquisar.emailMotorista).then(
                function(motoristas) {
                  $scope.motoristas = motoristas;
                }
            ).catch(
                function(err) {
                  logger.error('Ocorreu um erro ao salvar o carro: ' + err);
                  $ionicPopup.alert({
                    title: 'Ops...',
                    template: err.msgErro
                  });
                }
            );
          };

          $scope.cancelarPesquisa = function () {
            $scope.search = {};
            $scope.motoristas = [];
          }

          var motoristaAdicionado = function() {
            $log.debug('motorista adicionado');
            $state.go('motoristas');
          }

          $scope.selecionarMotorista = function (motorista) {
            $cordovaDialogs.confirm('Confirmar a adicição do motorista ' + motorista.nome + ' aos seus carros?',
                function (buttonIndex) {
                  if(buttonIndex === 1) {
                    MotoristaService.adicionarMotorista(usuario._id, motorista).then(motoristaAdicionado).catch(
                        function(err) {
                          logger.error(err.msgErro, err);
                          $ionicPopup.alert({
                            title: 'Ops...',
                            template: err.msgErro
                          });
                        }
                    );

                  }
                },
                '',
                'Sim,Não'
            );
          };
        }
    ]
);
