/**
 * Created by rafael on 29/03/14.
 */

angular.module('starter.filters', [])
.filter('iif',
    function () {
      return
        function iif(input, trueValue, falseValue) {
          return input ? trueValue : falseValue;
        };
    }
);