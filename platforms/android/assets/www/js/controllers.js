angular.module('starter.controllers', ['ionic', 'starter.services'])

.controller('MainCtrl',
    ['$scope', 'DBService', '$ionicPopup', '$state', 'UserService',
      function($scope, DBService, $ionicPopup, $state, UserService) {
        "use strict";

        var popupLogin;

        var isBrowser = false;

        var showPopup = function() {
          console.debug('vai chamar para exibir a popup ' + $ionicPopup);
          console.debug($ionicPopup);

          if(!isBrowser) {
            $ionicPopup.show({
              templateUrl: 'templates/loginPopup.html',
              scope: $scope
            })
                .then(
                function (res) {

                },
                function (err) {

                },
                function (popup) {
                  popupLogin = popup;
                }
            );
          }
        };

        $scope.$on('eventEfetuarLogin', function (e) {
          console.debug('pegou o evento');
          showPopup();
        });

        window.addEventListener('storage', function(e) {
          console.log('começando');
          console.log(e);
          console.log('inicializado do storage '+ window.localStorage.getItem('id'));
          inicializar();
        });
        var userid;
        var inicializar = function () {
          DBService.inicializar(
              function () {
                DBService.executarSelect('SELECT ID, BODY FROM usuario', [], preencherUsuario, function(err) { alert('erro'); });
              }
          );
          //console.log('meusCarros inicializar ' + window.localStorage);
          //userid = window.localStorage.getItem('userid');
          //console.log('o q achou no storage: ' + userid);
          //preencherUsuario();
        };

        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
          document.addEventListener('deviceready', inicializar, false);
        } else {
          inicializar();
          isBrowser = true;
        }


        $scope.$on('eventLoginSuccess', function(e, data) {
          console.log('pegou o evento ' + JSON.stringify(data));
          UserService.setUsuario(data);
          if(popupLogin) {
            popupLogin.close();
          }
          console.log('indo para o state meusCarros');
          $state.go('meusCarros');
        });

        var preencherUsuario = function (tx, results) {
          console.log(results.rows.length);
          if (results.rows.length > 0) {
            userid = results.rows.item(0).id;
            console.log('carregou do database userid=' + userid);
          }
          console.log('preencherUsuario1');
          var userId = userid;

          console.log('userId ' + userId);
          //userId = 1;
          if (userId) {
            $scope.$broadcast('eventLoginSuccess', {_id: userId});
          } else {
            console.log('entrou');
            console.debug('vai enviar msg de evento');
            $scope.$broadcast('eventEfetuarLogin');
            console.debug('enviada msg de evento');
          }
        };
      }
    ]
)


// A simple controller that fetches a list of data from a service
.controller('MeusCarrosCtrl', function($scope, PetService) {
  // "Pets" is a service returning mock data (services.js)
  $scope.pets = PetService.all();
})


// A simple controller that shows a tapped item's data
.controller('PetDetailCtrl',
    ['$scope', '$stateParams', 'PetService',
      function($scope, $stateParams, PetService) {
        // "Pets" is a service rwieturning mock data (services.js)
        $scope.pet = PetService.get($stateParams.petId);
      }
    ]
)

.controller('CarroCtrl',
    ['$scope', '$ionicModal', 'CarroService', 'FabricanteService', 'UserService',
      function ($scope, $ionicModal, CarroService, FabricanteService, UserService) {
        console.log('entrou no carroCtrl');

        $scope.fabricanteSelecionado = 'Fabricantes';
        $scope.carros = CarroService.carros;

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

        $scope.selecionarFabricante = function() {
          "use strict";
          if ($scope.novoCarro.fabricanteTransient) {
            $scope.carros.splice(0, $scope.carros.length);
            $scope.fabricanteSelecionado = $scope.novoCarro.fabricanteTransient.nome;
          } else {
            $scope.fabricanteSelecionado = 'Fabricantes';
          }
          $scope.closeModalFabricantes();
        }

        $ionicModal.fromTemplateUrl('templates/selectCarro.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.modalCarro = modal;
        });
        $scope.openModalCarro = function() {
          $scope.modalCarro.show();
        };
        $scope.closeModalCarro = function() {
          $scope.modalCarro.hide();
        };

        $scope.selecionarCarro = function(carroSelecionado) {
          "use strict";
          if (carroSelecionado) {
            $scope.novoCarro.carroTransient = carroSelecionado;
            $scope.carroSelecionado = $scope.novoCarro.carroTransient.nome;
          } else {
            $scope.carroSelecionado = 'Carros';
          }
          $scope.closeModalCarro();
        }

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
          $scope.modalFabricantes.remove();
          $scope.modalCarro.remove();
        });

        $scope.meusCarros = CarroService.getMeusCarros();
        console.log($scope.meusCarros);

        $scope.novoCarro = CarroService.getNovoCarro();
        $scope.fabricantes = [];


        $scope.meusCarros.forEach(function(carro) {
          if (carro._id === 0) {
            $scope.carroSelecionado = carro;
            $scope.idCarroSelecionado = carro._id;
          }
        });

        $scope.adicionarAbastecimento = function () {
          $scope.novoAbastecimento = CarroService.getNovoAbastecimento();
        };

        $scope.salvarAbastecimento = function (carro, abastecimento) {
          CarroService.salvarAbastecimento(carro, abastecimento);
        };

        $scope.pesquisarCarros = function (nomeCarro) {
          "use strict";
          CarroService.getCarros($scope.novoCarro.fabricanteTransient._id, nomeCarro);
        }

        $scope.inserirCarro = function () {
          "use strict";
          var salvarPromise = CarroService.salvarNovoCarro($scope.novoCarro);
          salvarPromise.success(
              function (msg) {
                console.log(msg);
                $scope.novoCarro = CarroService.getNovoCarro();
              }
          )

        }


      }
    ]
);
