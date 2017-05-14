/**
 * angular-strap
 * @version v2.3.10 - 2017-03-06
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes <olivier@mg-crea.com> (https://github.com/mgcrea)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
'use strict';

angular.module('mgcrea.ngStrap.pagination').run([ '$templateCache', function($templateCache) {
  $templateCache.put('pagination/pagination.tpl.html', '<div ng-class="$pageClass"><ul ng-show="totalItems > 0"><li ng-class="{disabled: noPrevious()}" ng-click="selectPrevious($event)"><span class="nox-sort-left"></span></li><li ng-repeat="item in pages track by $index" ng-class="{active: item.active, separate: item.text == \'...\'}" ng-click="selectPage(item.number, $event)"><span>{{ item.text }}</span></li><li ng-class="{disabled: noNext()}" ng-click="selectNext($event)"><span class="nox-sort-right"></span></li></ul><span class="ml-2x" ng-show="totalItems > 0">Total:{{ totalItems }}</span><div class="no-items text-primary" ng-show="totalItems == 0"><i class="nox-exclamation-circle-o"></i><p>no result</p></div><div class="loading" ng-show="totalItems < 0"><div class="ball-loading"><div></div></div><button class="btn btn-sm btn-default disabled">Loading...</button></div></div>');
} ]);