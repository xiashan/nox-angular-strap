'use strict';

angular.module('mgcrea.ngStrapDocs')

  .controller('SortDemoCtrl', function($scope, $templateCache) {


    $scope.changeSort = function (orderBy, sortBy) {
      console.log(orderBy + ':' + sortBy);
    }

  });
