angular.module('starter.services', ['ngResource'])

/**
 * A simple example service that returns some data.
 */
.factory('PetService', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var pets = [
    { id: 0, title: 'Cats', description: 'Furry little creatures. Obsessed with plotting assassination, but never following through on it.' },
    { id: 1, title: 'Dogs', description: 'Lovable. Loyal almost to a fault. Smarter than they let on.' },
    { id: 2, title: 'Turtles', description: 'Everyone likes turtles.' },
    { id: 3, title: 'Sharks', description: 'An advanced pet. Needs millions of gallons of salt water. Will happily eat you.' }
  ];

  return {
    all: function() {
      return pets;
    },
    get: function(petId) {
      // Simple index lookup
      return pets[petId];
    }
  }
})
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

.factory('DBService',
    function() {
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
        alert('DB error: ' + err.message + '\nCode: ' + err.code);
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
          isTableExists(tx, 'usuario', function (a) { alert('tabela existe? '+ a)});
          tx.executeSql(sqlInsert, params)
        }, callback, dbErrorHandler);
      };

      var executarSelect = function (sqlSelect, params, callback) {
        db.transaction(function (tx) {
          tx.executeSql(sqlSelect, params, callback, dbErrorHandler);
        }, dbErrorHandler);
      };


      var setValue = function (nome, valor) {
        alert('colocando ' + nome + ' '+ valor);
        window.localStorage.setItem( 'item_name', item_value);
        alert('colocou ');
      };

      var getValue = function (nome) {
        window.localStorage.getItem(nome);
      };

      return {
        setValue: setValue,
        getValue: getValue,
        inicializar: inicializar,
        executarInsert: executarInsert,
        executarSelect: executarSelect
      };

    }
)
.factory('CarroService',
    ['$http', '$resource', '$q', 'UserService','LoadingService',
      function CarroService($http, $resource, $q, UserService, LoadingService) {
        "use strict";
        console.log('userId ' + UserService.getUsuario()._id);
        var carroService = {
          TodosCarrosResource: $resource('https://meuscarros.jit.su/api/carros/:query', {query:'@query'}),
          CarroResource: $resource('https://meuscarros.jit.su/api/:userId/meusCarros/:id/:query', {userId: UserService.getUsuario()._id, id: '@id'}, {abastecer: {method: 'POST', params:{query:'adicionarAbastecimento'}}}),
          meusCarros: [],
          carros: [],
          meuCarroSelecionado: {},
          criarNovoAbastecimento: function() {
            var novoAbastecimento = {edicao: true};
            return novoAbastecimento;

          },
          getNovoCarro: function (userId) {
            return new carroService.CarroResource();
          },
          getMeusCarros: function () {
            /*$http.get('/api/1/meusCarros').success(function(carros) {
             $.merge(carroService.meusCarros, carros);
             });*/
            console.log(UserService.getUsuario());
            LoadingService.showLoading();
            var carrosPromise = carroService.CarroResource.query({userId: UserService.getUsuario()._id}).$promise;
            carrosPromise.then(
                function (carros) {
                  console.log('funcionou com o resource');
                  carroService.meusCarros.splice(0, carroService.meusCarros.length);
                  carros.forEach(
                      function (carro) {
                        carro.abastecimentos.forEach(
                            function formatarDataAbastecimento(abastecimento) {
                              var data = new Date(abastecimento.data);
                              abastecimento.dataExibicao = new Date( data.getTime() + ( data.getTimezoneOffset() * 60000 ) );
                            }
                        )
                        carroService.meusCarros.push(carro);
                      }
                  );
                }
            );
            carrosPromise.catch(
                function(err) {
                  if (err) {
                    console.log('erro')
                  };
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
            return carroService.meusCarros;
          },

          adicionarAbastecimento: function (carro) {
            if (!carro.abastecimentos) {
              carro.abastecimentos = [];
            }
            carro.abastecimentos.push({edicao: true});
          },
          salvarAbastecimento: function (carro, abastecimento) {
            abastecimento.edicao = false;
            abastecimento.dateOrdenacao = new Date(abastecimento.data);

            carroService.CarroResource.abastecer({id: carro._id}, {abastecimento: abastecimento},
                function (meuCarroSalvo) {
                  carro.odometroTotal = meuCarroSalvo.odometroTotal;
                  carro.ultimoAbastecimentoData = meuCarroSalvo.ultimoAbastecimentoData;
                  carro.consumoMedioGas = meuCarroSalvo.consumoMedioGas;
                  carro.consumoMedioEta = meuCarroSalvo.consumoMedioEta;

                  carro.abastecimentos.push(meuCarroSalvo.abastecimentos[meuCarroSalvo.abastecimentos.length - 1]);
                }
            );
          },
          salvarNovoCarro: function (novoCarro) {
            console.log('userId ' + UserService.getUsuario()._id);
            var deferred = $q.defer();
            if (novoCarro.carroTransient) {
              //var carroTransient = novoCarro.carroTransient;
              var fabricanteTransient = novoCarro.fabricanteTransient;
              novoCarro.carro = novoCarro.carroTransient._id;
              novoCarro.$save(function (err, carro) {
                if (err) {
                  deferred.reject(err);
                }
                //carroTransient.fabricanteTransient = fabricanteTransient;
                //carro.carroTransient = carroTransient;
                //carro.carroTransient.fabricanteTransient = fabricanteTransient;
                carroService.meusCarros.push(carro);
                deferred.resolve({sucesso: true});
                //$scope.selecionarCarro(carro._id);
              });
            } else {
              deferred.reject(new Error('Não foi selecionado um carro'));
            }
            return deferred.promise;
          },
          getCarros: function(fabricanteId, nomeCarro) {
            if (!nomeCarro || nomeCarro.length === 0) {
              carroService.carros.splice(0, carroService.carros.length);
            } else {
              var carroPromise = carroService.TodosCarrosResource.query({query: 'listarCarros', fabricanteId: fabricanteId, nomeCarro: nomeCarro}).$promise;
              carroPromise.then(
                  function getCarrosFabricante(result) {
                    result.forEach(
                        function (carro) {
                          carroService.carros.push(carro);
                        }
                    );
                  }
              );
            }
          }
        };

        return carroService;
      }
    ]
)
.service('FabricanteService',
    ['$resource', 'LoadingService',
      function FabricanteService($resource, LoadingService) {
        var fabricanteService = {
          FabricanteResource: $resource('http://meuscarros.jit.su/api/fabricantes/:id', {id:'@_id'}),
          fabricantes: [],
          getFabricantes: function () {
            LoadingService.showLoading();
            var fabricantes = fabricanteService.FabricanteResource.query(
                function getListaFabricantes() {
      //        console.log('Carregou os fabricantes');
                  fabricanteService.fabricantes.splice(0, fabricanteService.fabricantes.length);
                  fabricantes.forEach(function (f) {
                    "use strict";
                    fabricanteService.fabricantes.push(f);
                  });
                  LoadingService.hideLoading();
                }
            );
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
);
