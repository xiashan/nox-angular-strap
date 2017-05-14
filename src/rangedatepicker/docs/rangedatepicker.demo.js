'use strict';

angular.module('mgcrea.ngStrapDocs')

  .config(function($rangedatepickerProvider) {
    angular.extend($rangedatepickerProvider.defaults, {
      // dateFormat: 'dd/MM/yyyy',
      startWeek: 1
    });
  })

  .controller('RangeDatepickerDemoCtrl', function($scope, $http) {

    $scope.selectedDate = new Date('1986-11-12');
    $scope.selectedDateAsNumber = Date.UTC(1986, 1, 22);
    // $scope.fromDate = new Date();
    // $scope.untilDate = new Date();
    $scope.getType = function(key) {
      return Object.prototype.toString.call($scope[key]);
    };

    $scope.clearDates = function() {
      $scope.selectedDate = null;
    };

  });
