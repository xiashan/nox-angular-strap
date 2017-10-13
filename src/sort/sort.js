'use strict';

angular.module('mgcrea.ngStrap.sort', []).directive('bsSort', [function() {
  return {
    scope: true,
    compile: function (element, attrs) {
      var list = element[0].querySelectorAll('th');
      for (var i = 0, len = list.length; i < len; i++) {
        var item = list[i];
        item = angular.element(item);
        if (item.attr('data-sortable')) {
          var dataName = item.attr('data-name');
          item.append('<div class="sorter"><i class="nox-sort-up sort-asc" ng-class="{active: orderBy == \'' + dataName + '\' && sortBy == \'asc\'}"></i><i class="nox-sort-down sort-desc" ng-class="{active: orderBy == \'' + dataName + '\' && sortBy == \'desc\'}"></i></div>');
        }
      }

      return function postLink (scope, element, attrs) {
        var options = {
          scope: scope,
          element: element,
          show: false
        };
        angular.forEach(['onSort'], function(key) {
          var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
          if (angular.isDefined(attrs[bsKey])) {
            options[key] = scope.$eval(attrs[bsKey]);
          }
        });
        if (angular.isDefined(attrs.totalItems)) {
          attrs.$observe('totalItems', function (newValue) {
            options.totalItems = newValue;
          });
        }
        // 初始化排序
        angular.forEach([ 'orderBy', 'sortBy' ], function(key) {
          if (angular.isDefined(attrs[key])) {
            scope[key] = scope.$eval(attrs[key]);
          }
        });
        var list = element[0].querySelectorAll('th');
        for (var i = 0, len = list.length; i < len; i++) {
          var item = list[i];
          item = angular.element(item);
          if (item.attr('data-sortable')) {
            item.on('click', clickColumn);
          }
        }

        function clickColumn (event) {
          if (options.totalItems === -1) {
            return;
          }
          var target = angular.element(event.currentTarget);
          var dataName = target.attr('data-name');
          if (dataName === scope.orderBy) {
            scope.sortBy = scope.sortBy === 'asc' ? 'desc' : 'asc';
          } else {
            scope.orderBy = dataName;
            scope.sortBy = 'desc';
          }
          scope.$apply();

          if (angular.isDefined(options.onSort) && angular.isFunction(options.onSort)) {
            options.onSort(scope.orderBy, scope.sortBy);
          }
        }
      };
    }
  };
}]);
