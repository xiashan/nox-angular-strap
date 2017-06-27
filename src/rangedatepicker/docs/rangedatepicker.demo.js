'use strict';

angular.module('mgcrea.ngStrapDocs')

  .config(function($rangedatepickerProvider) {
    angular.extend($rangedatepickerProvider.defaults, {
      // dateFormat: 'dd/MM/yyyy',
      startWeek: 1
    });
  })

  .controller('RangeDatepickerDemoCtrl', function ($scope, $http) {

    $scope.selectedDate = {
      // startDate: new Date('2017/04/05'),
      // endDate: new Date('2017/05/12'),
      dateRange: '-2d'
    };
    $scope.maxDate = new Date();
    $scope.minDate = new Date('2017/03/01');
    // number
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
