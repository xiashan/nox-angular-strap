'use strict';

angular.module('mgcrea.ngStrapDocs')

  .controller('PaginationDemoCtrl', function($scope, $timeout) {
    $scope.pageInfo = {
      totalItems: -1,
      itemsPerPage: 2,
      currentPage: 5,
      pageLength: 10,
      changePage: function () {
        $scope.pageInfo.totalItems = 1;
        console.log('changePage');
      }
    };

    console.log($scope);

    $timeout(function () {
      $scope.pageInfo.totalItems = 1000;
      $scope.pageInfo.currentPage = 1;
    }, 20000)

  });
