angular.module('starter.services', ['ngResource'])
/*.config(
    function (RestangularProvider) {
      "use strict";
      RestangularProvider.addElementTransformer('meusCarros', true, function(user) {
        // This will add a method called login that will do a POST to the path login
        // signature is (name, operation, path, params, headers, elementToPost)


        user.addRestangularMethod('login', 'post', 'login');

        return user;
      });

    }
)*/
.factory('UserService', function() {
      "use strict";
      var usuario;

      var setUsuario = function (user) {
        usuario = user;
      };

      var getUsuario = function () {
        return usuario;
      };

      return {
        setUsuario: setUsuario,
        getUsuario: getUsuario
      }
    })

.factory('DBService', ['$q',
    function($q) {
      "use strict";
      var db;

      var setupTable = function (tx) {
        /*console.log('vai dropar a tabela');
        tx.executeSql("DROP TABLE IF EXISTS usuario");
        console.log('DROPOU SE EXISTIA');*/
        console.log('setupTable');
        isTableExists(tx, 'usuario', function (tableExist) {
          console.log('tabela existe? ' + tableExist);
          if (!tableExist) {

            console.log('vai criar a tabela');
            tx.executeSql("CREATE TABLE IF NOT EXISTS usuario(id INTEGER,body VARCHAR(255))", null,
                function() {
                  console.log('tabela criada?');
                  console.log('setupTable2');
                  isTableExists(tx, 'usuario', function(tableExist) {
                    console.log('tabela existe? ' + tableExist);
                  });
                }, dbErrorHandler);

          }
        });

      };

      function isTableExists(tx, tableName, callback) {
        console.log('vai verificar se tabela existe');
        tx.executeSql('SELECT * FROM ' + tableName, [], function(tx, resultSet) {
          callback(true);
        }, function(tx, err) {
          console.log('tabela não existe');
          //dbErrorHandler(tx, err);
          callback(false);
        });
      };

      var dbErrorHandler = function (tx, err) {
        console.log(JSON.stringify(err));
        //alert('DB error: ' + err + '\nCode: ' + err);
      };

      var inicializar = function (callback) {
        if (!db) {
          console.log('abrindo dataBase');
          db = window.openDatabase("meusCarros", "1.0", "Cordova", 200000);
          console.log('abriu. '+ db + ' Criando tabela');
          db.transaction(setupTable, dbErrorHandler, callback);
        }
      };

      var executarInsert = function (sqlInsert, params, callback) {
        db.transaction(function (tx) {
          console.log('executarInsert');
          //isTableExists(tx, 'usuario', function (a) { alert('tabela existe? '+ a)});
          tx.executeSql(sqlInsert, params)
        }, callback, dbErrorHandler);
      };

      var executarSelect = function (sqlSelect, params, callback) {
        db.transaction(function (tx) {
          tx.executeSql(sqlSelect, params, callback, dbErrorHandler);
        }, dbErrorHandler);
      };


      var setValue = function (nome, valor) {
        //alert('colocando ' + nome + ' '+ valor);
        window.localStorage.setItem( 'item_name', item_value);
        //alert('colocou ');
      };

      var getValue = function (nome) {
        window.localStorage.getItem(nome);
      };

      var armazenarListaCarrosLocal = function(listaCarros, idUsuario) {
        var dadosArmazenar = {};
        dadosArmazenar.milliseconds = Date.now();
        dadosArmazenar.listaCarros = listaCarros;
        window.localStorage.setItem('listaCarros_' + idUsuario, JSON.stringify(dadosArmazenar));
      };

      var carregarListaCarrosLocal = function(idUsuario) {
        return window.localStorage.getItem('listaCarros_' + idUsuario);
      };

      var armazenarMeuCarroSelecionadoLocal = function(idCarroSelecionado, idUsuario) {
        window.localStorage.setItem('idCarroSelecionado_' + idUsuario, idCarroSelecionado);
      };

      var carregarMeuCarroSelecionadoLocal = function(idUsuario) {
        return window.localStorage.getItem('idCarroSelecionado_' + idUsuario);
      };

      return {
        setValue: setValue,
        getValue: getValue,
        inicializar: inicializar,
        executarInsert: executarInsert,
        executarSelect: executarSelect,
        carregarListaCarrosLocal: carregarListaCarrosLocal,
        armazenarListaCarrosLocal: armazenarListaCarrosLocal,
        armazenarMeuCarroSelecionadoLocal: armazenarMeuCarroSelecionadoLocal,
        carregarMeuCarroSelecionadoLocal: carregarMeuCarroSelecionadoLocal
      };

    }
  ]
)
.factory('CarroService',
    ['$http', '$resource', '$q', '$rootScope', '$log', 'UserService', 'DBService','LoadingService',
      function CarroService($http, $resource, $q, $rootScope, $log, UserService, DBService, LoadingService) {
        "use strict";

        var logger = $log;
        //console.log('userId ' + UserService.getUsuario()._id);

        //var api = Restangular.allUrl('api', 'https://meuscarros.jit.su/api');
        //var todosCarros = api.all('carros');

        var TodosCarrosResource = $resource('https://meuscarros.jit.su/api/carros/:query', {query:'@query'});
        //var TodosCarrosResource = todosCarros;
        var CarroResource;
        var getCarroResource = function (){
          if (!CarroResource) {
            try {
              CarroResource = $resource('https://meuscarros.jit.su/api/:userId/meusCarros/:id/:query', {userId: UserService.getUsuario()._id, id: '@id'}, {abastecer: {method: 'POST', params: {query: 'adicionarAbastecimento'}}});
            } catch (err) {
              logger.error(err)
              $ionicPopup.alert({
                title: 'Ops...',
                template: err.msgErro
              });
            }
          }
          return CarroResource;
        }

        var formatarDadosCarro = function (carro) {
          if (carro.abastecimentos) {
            carro.abastecimentos.forEach(
                function formatarDataAbastecimento(abastecimento) {
                  var data = new Date(abastecimento.data);
                  abastecimento.dataExibicao = new Date(data.getTime() + ( data.getTimezoneOffset() * 60000 ));
                }
            )
          }
        };

        var carroService = {

          meusCarros: [],
          carros: [],
          meuCarroSelecionado: {},
          setMeuCarroSelecionado: function(meuCarro) {
            DBService.armazenarMeuCarroSelecionadoLocal(meuCarro._id, UserService.getUsuario()._id);
            carroService.meuCarroSelecionado = meuCarro;
          },
          criarNovoAbastecimento: function() {
            var novoAbastecimento = {edicao: true};
            return novoAbastecimento;

          },
          getNovoCarro: function (userId) {
            getCarroResource();
            return new CarroResource();
          },
          getMeuCarroSelecionadoLocal: function() {
            var deferred = $q.defer();
            var idCarroSelecionado = DBService.carregarMeuCarroSelecionadoLocal(UserService.getUsuario()._id);
            if (idCarroSelecionado) {
              carroService.meusCarros.forEach(function (carro) {
                if (carro._id === idCarroSelecionado) {
                  carroService.meuCarroSelecionado = carro;
                  deferred.resolve(carro);
                }
              });
            } else {
              deferred.resolve(null);
            }
            return deferred.promise;
          },
          getMeusCarrosLocal: function() {
            var dadosArmazenados = JSON.parse(DBService.carregarListaCarrosLocal(UserService.getUsuario()._id));
            if (!dadosArmazenados || (Date.now() - dadosArmazenados.milliseconds >= 300000)) {
              $rootScope.$broadcast('carros.timeoutToReload');
              return null;
            } else {
              carroService.meusCarros = dadosArmazenados.listaCarros;
            }
            return carroService.meusCarros;
          },
          getMeusCarros: function (force) {
            LoadingService.showLoading();
            var deferred = $q.defer();
            console.log(UserService.getUsuario());
            if(!force && carroService.meusCarros && carroService.meusCarros.length > 0) {
              deferred.resolve(carroService.meusCarros);
              return deferred.promise;
            }

            var carrosPromise = getCarroResource().query({userId: UserService.getUsuario()._id}).$promise;
            //var carrosPromise = getCarroResource().$promise;
            carrosPromise.then(
                function (carros) {
                  console.log('funcionou com o resource');
                  carroService.meusCarros = carros;
                  carroService.meusCarros.forEach(formatarDadosCarro);
                  DBService.armazenarListaCarrosLocal(carros, UserService.getUsuario()._id);
                  deferred.resolve(carroService.meusCarros);
                  return carroService.meusCarros;
                }
            );
            carrosPromise.catch(
                function(err) {
                  deferred.reject(err);
                }
            );
            carrosPromise.finally(
                function() {
                  LoadingService.hideLoading();
                }
            );
            /*var carros = carroService.CarroResource.query({userId: UserService.getUsuario()._id},
                function getListaCarros() {
                  console.log('funcionou com o resource');
                  $.merge(carroService.meusCarros, carros);
                  LodingService.hideLoading();
                }
            );*/
            //carroService.meusCarros = deferred.promise;
            return deferred.promise;
          },

          adicionarAbastecimento: function (carro) {
            if (!carro.abastecimentos) {
              carro.abastecimentos = [];
            }
            carro.abastecimentos.push({edicao: true});
          },
          salvarAbastecimento: function (carro, abastecimento) {
            var deferred = $q.defer();
            abastecimento.edicao = false;
            abastecimento.dateOrdenacao = new Date(abastecimento.data);

            if (carro.odometroTotal < abastecimento.odometro) {

                getCarroResource().abastecer({id: carro._id}, {abastecimento: abastecimento}).$promise.then(
                    function (meuCarroSalvo) {
                        carro.odometroTotal = meuCarroSalvo.odometroTotal;
                        carro.ultimoAbastecimentoData = meuCarroSalvo.ultimoAbastecimentoData;
                        carro.consumoMedioGas = meuCarroSalvo.consumoMedioGas;
                        carro.consumoMedioEta = meuCarroSalvo.consumoMedioEta;
                        var abastecimentoSalvo = meuCarroSalvo.abastecimentos[meuCarroSalvo.abastecimentos.length - 1]
                        var data = new Date(abastecimentoSalvo.data);
                        abastecimentoSalvo.dataExibicao = new Date(data.getTime() + ( data.getTimezoneOffset() * 60000 ));
                        carro.abastecimentos.push(abastecimentoSalvo);
                        deferred.resolve(carro);
                        return carro;
                    }
                ).catch(
                    function (err) {
                        deferred.reject({msgErro: 'Ocorreu um erro ao abastecer ', erro: err});
                    }
                );
            } else {
                deferred.reject({msgErro: 'O odometro total do carro maior que o informado no abastecimento'});
            }

            return deferred.promise;
          },
          salvarNovoCarro: function (novoCarro) {
            console.log('userId ' + UserService.getUsuario()._id);
            var deferred = $q.defer();
            if (novoCarro.carroTransient) {
              //var carroTransient = novoCarro.carroTransient;
              var fabricanteTransient = novoCarro.fabricanteTransient;
              novoCarro.carro = novoCarro.carroTransient._id;
              novoCarro.$save().then(
                  function (carro) {
                  //carroTransient.fabricanteTransient = fabricanteTransient;
                  //carro.carroTransient = carroTransient;
                  //carro.carroTransient.fabricanteTransient = fabricanteTransient;
                  formatarDadosCarro(carro);
                  carroService.meusCarros.push(carro);
                  deferred.resolve({sucesso: true});
                  //$scope.selecionarCarro(carro._id);
                  }
              );
              //var novoCarroPromise = novoCarroSave.$promise;
              //novoCarroPromise.then(
                  //,
                  //function (err) {
                  //  deferred.reject(err);
                 // }
              //);
            } else {
              deferred.reject(new Error('Não foi selecionado um carro'));
            }
            return deferred.promise;
          },
          getCarros: function(fabricanteId, nomeCarro) {
            LoadingService.showLoading();
            carroService.carros.splice(0, carroService.carros.length);
            if (nomeCarro && nomeCarro.length > 0) {
              var carroPromise = TodosCarrosResource.query({query: 'listarCarros', fabricanteId: fabricanteId, nomeCarro: nomeCarro}).$promise;
              carroPromise.then(
                  function getCarrosFabricante(result) {
                    result.forEach(
                        function (carro) {
                          carroService.carros.push(carro);
                        }
                    );
                  }
              );
              carroPromise.finally(
                  function () {
                    LoadingService.hideLoading();
                  }
              )
            }
          }
        };

        return carroService;
      }
    ]
)
.service('FabricanteService',
    ['$resource', '$log', 'LoadingService',
      function FabricanteService($resource, $log, LoadingService) {
        var fabricanteService = {
          FabricanteResource: $resource('http://meuscarros.jit.su/api/fabricantes/:query', {query:'@query'}),
          fabricantes: [],
          getFabricantes: function (nomeFabricante) {
            LoadingService.showLoading();
            $log.debug(nomeFabricante);
            var fabricantesPromise = fabricanteService.FabricanteResource.query({nomeFabricante: nomeFabricante}).$promise;
            fabricantesPromise.then(
                function getListaFabricantes(fabricantes) {
      //        console.log('Carregou os fabricantes');
                  fabricanteService.fabricantes.splice(0, fabricanteService.fabricantes.length);
                  fabricantes.forEach(function (f) {
                    "use strict";
                    fabricanteService.fabricantes.push(f);
                  });
                  /*LoadingService.hideLoading();*/
                }
            );
            fabricantesPromise.finally(function () {
                "use strict";
                LoadingService.hideLoading();
            })
            return fabricanteService.fabricantes;

          }
        };

        return fabricanteService;
      }
    ]
)
.service('LoadingService',
    ['$ionicLoading',
    function ($ionicLoading) {
      "use strict";

      var loading;
      var showLoading = function () {
        if (loading) {
          loading.show();
        } else {
          loading = $ionicLoading.show({
            content: 'Loading',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
          });
        }
      };

      var hide = function () {
        if (loading) {
          loading.hide();
        }
      }

      return {
        showLoading : showLoading,
        hideLoading: hide
      };

    }]
)
.service('CadastrarMotoristaService',
    ['$resource', '$q', '$filter', 'LoadingService',
        function ($resource, $q, $filter, LoadingService) {
          "use strict";

          var motoristasResource = $resource('https://meuscarros.jit.su/api/usuarios/:email', {email:'@email'});

          var pesquisarMotoristas = function (email) {
            LoadingService.showLoading();
            var deferred = $q.defer();
            var emailEncoded = $filter('encodeUri')(email);

            var motoristasPromise = motoristasResource.query({email: emailEncoded}).$promise;
            motoristasPromise.then(
                function(motoristas) {
                  deferred.resolve(motoristas);
                }
            ).catch(
                function(err) {
                  deferred.reject({msgErro: 'Ocorreu um erro ao pesquisar pelo motorista', erro: err});
                }
            ).finally(
                function () {
                  LoadingService.hideLoading();
                }
            );

            return deferred.promise;
          };

          return {
            pesquisarMotoristas: pesquisarMotoristas
          }
        }
    ]
);
