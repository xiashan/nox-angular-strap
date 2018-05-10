/**
 * angular-strap
 * @version v2.3.10 - 2018-05-10
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes <olivier@mg-crea.com> (https://github.com/mgcrea)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
'use strict';

angular.module('mgcrea.ngStrap.pagination', []).provider('$pagination', function() {
  var defaults = this.defaults = {
    animation: 'am-fade',
    pageClass: 'pagination',
    pagesLength: 5,
    itemsPerPage: 20,
    templateUrl: 'pagination/pagination.tpl.html'
  };
  var controller = this.controller = function($scope, $element, $attrs) {
    this.calculateTotalPages = function(itemsPerPage, totalItems) {
      var totalPages = itemsPerPage < 1 ? 1 : Math.ceil(totalItems / itemsPerPage);
      return Math.max(totalPages || 0, 1);
    };
    this.makePage = function(number, text, isActive) {
      return {
        number: number,
        text: text,
        active: isActive
      };
    };
    this.getPages = function(currentPage, totalPages, pagesLength) {
      currentPage = currentPage < 1 ? 1 : totalPages > 0 && currentPage > totalPages ? totalPages : currentPage;
      var pages = [];
      var i;
      if (totalPages <= pagesLength) {
        for (i = 1; i <= totalPages; i++) {
          pages.push(this.makePage(i, i, i === currentPage));
        }
      } else {
        var offset = (pagesLength - 1) / 2;
        if (currentPage <= offset) {
          for (i = 1; i <= offset + 1; i++) {
            pages.push(this.makePage(i, i, i === currentPage));
          }
          pages.push(this.makePage(i + 1, '...', false));
          pages.push(this.makePage(totalPages, totalPages, false));
        } else if (currentPage > totalPages - offset) {
          pages.push(this.makePage(1, 1, false));
          pages.push(this.makePage(totalPages - offset - 1, '...', false));
          for (i = offset; i >= 0; i--) {
            var p = totalPages - i;
            pages.push(this.makePage(p, p, p === currentPage));
          }
        } else {
          pages.push(this.makePage(1, 1, false));
          var half = Math.ceil(offset / 2);
          pages.push(this.makePage(currentPage - half - 1, '...', false));
          for (i = half; i >= 1; i--) {
            pages.push(this.makePage(currentPage - i, currentPage - i, false));
          }
          pages.push(this.makePage(currentPage, currentPage, true));
          for (i = 1; i <= half; i++) {
            pages.push(this.makePage(currentPage + i, currentPage + i, false));
          }
          pages.push(this.makePage(currentPage + half + 1, '...', false));
          pages.push(this.makePage(totalPages, totalPages, false));
        }
      }
      return pages;
    };
  };
  this.$get = function() {
    var $pagination = {};
    $pagination.defaults = defaults;
    $pagination.controller = controller;
    return $pagination;
  };
}).directive('bsPagination', [ '$window', '$sce', '$parse', '$pagination', function($window, $sce, $parse, $pagination) {
  var defaults = $pagination.defaults;
  return {
    restrict: 'E',
    require: [ '?ngModel', 'bsPagination' ],
    scope: true,
    replace: true,
    controller: [ '$scope', '$element', '$attrs', $pagination.controller ],
    templateUrl: function(element, attr) {
      return attr.template || defaults.templateUrl;
    },
    link: function postLink(scope, element, attrs, controllers) {
      var ngModelCtrl = controllers[0];
      var bsPaginationCtrl = controllers[1];
      if (!ngModelCtrl) {
        return;
      }
      var options = angular.copy(defaults);
      angular.forEach([ 'pageClass', 'pagesLength', 'itemsPerPage' ], function(key) {
        if (angular.isDefined(attrs[key])) {
          options[key] = scope.$eval(attrs[key]);
        }
      });
      angular.forEach([ 'onChange' ], function(key) {
        var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
        if (angular.isDefined(attrs[bsKey])) {
          options[key] = scope.$eval(attrs[bsKey]);
        }
      });
      if (attrs['totalItems']) {
        attrs.$observe('totalItems', function(newValue, oldValue) {
          scope.totalItems = newValue;
          scope.totalPages = bsPaginationCtrl.calculateTotalPages(options.itemsPerPage, scope.totalItems);
          ngModelCtrl.$render();
        });
      }
      scope.$pageClass = options.pageClass;
      if (options.pagesLength % 2 === 0) {
        options.pagesLength = options.pagesLength + 1;
      }
      ngModelCtrl.$render = function() {
        scope.page = (scope.page = parseInt(ngModelCtrl.$viewValue, 10) || 1) > scope.totalPages ? scope.totalPages : scope.page;
        if (scope.page > 0 && scope.page <= scope.totalPages) {
          scope.pages = bsPaginationCtrl.getPages(scope.page, scope.totalPages, options.pagesLength);
        }
      };
      scope.selectPage = function(page, evt) {
        if (evt) {
          evt.preventDefault();
        }
        if (scope.page !== page && page > 0 && page <= scope.totalPages) {
          if (evt && evt.target) {
            evt.target.blur();
          }
          ngModelCtrl.$setViewValue(page);
          ngModelCtrl.$render();
          if (angular.isDefined(options.onChange) && angular.isFunction(options.onChange)) {
            options.onChange();
          }
        }
      };
      scope.noPrevious = function() {
        return scope.page === 1;
      };
      scope.noNext = function() {
        return scope.page === scope.totalPages;
      };
      scope.selectPrevious = function(evt) {
        scope.selectPage(scope.page - 1, evt);
      };
      scope.selectNext = function(evt) {
        scope.selectPage(scope.page + 1, evt);
      };
    }
  };
} ]);