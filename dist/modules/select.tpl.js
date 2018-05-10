/**
 * angular-strap
 * @version v2.3.10 - 2018-05-10
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes <olivier@mg-crea.com> (https://github.com/mgcrea)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
'use strict';

angular.module('mgcrea.ngStrap.select').run([ '$templateCache', function($templateCache) {
  $templateCache.put('select/select.tpl.html', '<ul tabindex="-1" class="select dropdown-menu" ng-show="$isVisible()" role="select"><li ng-if="$showSearch" role="presentation"><div class="select-search-container pl-1x pr-1x mb-1x"><input role="search" type="search" class="form-control input-sm" ng-model="searchText" ng-change="$searchTextChange(this)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div></li><li ng-if="$showAllNoneButtons"><div class="btn-group" style="margin-bottom: 5px; margin-left: 5px"><button type="button" class="btn btn-default btn-xs" ng-click="$selectAll()">{{$allText}}</button> <button type="button" class="btn btn-default btn-xs" ng-click="$selectNone()">{{$noneText}}</button></div></li><li ng-if="$showSearch" role="presentation" ng-repeat="match in $matches | searchFilter:\'label\':searchText" ng-class="{active: $isActive($index)}"><a style="cursor: default" role="menuitem" tabindex="-1" ng-click="$select($index, $event)"><i class="{{$iconCheckmark}} pull-right" ng-if="$isMultiple && $isActive($index)"></i> <span ng-bind="match.label"></span></a></li><li ng-if="!$showSearch" role="presentation" ng-repeat="match in $matches" ng-class="{active: $isActive($index)}"><a style="cursor: default" role="menuitem" tabindex="-1" ng-click="$select($index, $event)"><i class="{{$iconCheckmark}} pull-right" ng-if="$isMultiple && $isActive($index)"></i> <span ng-bind="match.label"></span></a></li><li ng-if="$showSearch" class="select-close-container pl-1x pr-1x mt-1x"><button class="btn btn-default btn-sm btn-close btn-block" ng-click="$close()">Close</button></li></ul>');
} ]);