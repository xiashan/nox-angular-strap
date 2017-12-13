/**
 * Created by xiashan on 17/12/8.
 */
'use strict';

angular.module('mgcrea.ngStrapDocs')

  .config(function($datetimepickerProvider) {
    angular.extend($datetimepickerProvider.defaults, {
      dateFormat: 'yyyy-MM-dd HH:mm:ss',
      startWeek: 1,
      autoclose: true
    })
  })

  .controller('DateTimePickerDemoCtrl', function ($scope, $http) {

    $scope.selectedDate = new Date();
    $scope.selectedDate.setHours(0);
    $scope.selectedDate.setMinutes(0);
    $scope.selectedDate.setSeconds(0);

    $scope.startDate = new Date();
    $scope.endDate = new Date();
    $scope.startDate.setHours(0);
    $scope.startDate.setMinutes(0);
    $scope.startDate.setSeconds(0);
    // $scope.endDate.setMonth($scope.endDate.getMonth() + 3);
    $scope.endDate.setHours($scope.endDate.getHours() + 1);
    $scope.endDate.setMinutes(0);
    $scope.endDate.setSeconds(0);

    $scope.maxDate = new Date();
    $scope.minDate = new Date('2017/03/01');

    $scope.getType = function(key) {
      return Object.prototype.toString.call($scope[key]);
    };

    $scope.clearDates = function() {
      $scope.selectedDate = null;
    };

  });
