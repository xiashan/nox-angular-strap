/**
 * angular-strap
 * @version v2.3.10 - 2017-10-13
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes <olivier@mg-crea.com> (https://github.com/mgcrea)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
'use strict';

angular.module('mgcrea.ngStrap.rangedatepicker').run([ '$templateCache', function($templateCache) {
  $templateCache.put('rangedatepicker/rangedatepicker.tpl.html', '<div class="dropdown-menu rangedatepicker" style="width: 840px"><div class="clearfix"><div class="narrow range"><p class="text-center">Range</p><div ng-repeat="item in rangeList"><button class="btn btn-sm btn-block" ng-class="{\'btn-ghost\': ctrl.rangeType == item.value && !ctrl.compare, \'btn-default\': ctrl.rangeType != item.value || ctrl.compare, \'disabled\': ctrl.compare}" ng-click="$selectRange(item.value)" ng-bind="item.name"></button></div></div><div class="datepicker"><p class="text-center">Start Date</p><div><table style="table-layout: fixed; height: 100%; width: 100%"><thead><tr class="text-center"><th><a class="pull-left arrow" ng-click="$selectPane(-1, 0)"><i class="{{$iconLeft}}"></i></a></th><th colspan="5"><div class="text-center"><strong style="text-transform: capitalize" ng-bind="title[0]"></strong></div></th><th><a class="pull-right arrow" ng-click="$selectPane(+1, 0)"><i class="{{$iconRight}}"></i></a></th></tr><tr ng-if="showLabels" ng-bind-html="labels"></tr></thead><tbody><tr ng-repeat="(i, row) in rows[0]" height="{{ 100 / rows[0].length }}%"><td class="text-center" ng-repeat="(j, el) in row"><button tabindex="-1" type="button" class="btn btn-sm btn-default" ng-class="{\'btn-primary\': el.selected, \'btn-info btn-today\': el.isToday && !el.selected, \'invisible\': el.muted, \'btn-success\': el.compareSelect, \'btn-both\': el.selected && el.compareSelect, \'btn-range\': el.inRange && !el.selected}" ng-click="$select(el.date, 0)" ng-disabled="el.disabled"><span ng-class="{\'text-muted\': el.muted}" ng-bind="el.label"></span></button></td></tr></tbody></table></div></div><div class="datepicker"><p class="text-center">End Date</p><div><table style="table-layout: fixed; height: 100%; width: 100%"><thead><tr class="text-center"><th><a class="pull-left arrow" ng-click="$selectPane(-1, 1)"><i class="{{$iconLeft}}"></i></a></th><th colspan="5"><div class="text-center"><strong style="text-transform: capitalize" ng-bind="title[1]"></strong></div></th><th><a class="pull-right arrow" ng-click="$selectPane(+1, 1)"><i class="{{$iconRight}}"></i></a></th></tr><tr ng-if="showLabels" ng-bind-html="labels"></tr></thead><tbody><tr ng-repeat="(i, row) in rows[1]" height="{{ 100 / rows[1].length }}%"><td class="text-center" ng-repeat="(j, el) in row"><button tabindex="-1" type="button" class="btn btn-sm btn-default" ng-class="{\'btn-primary\': el.selected, \'btn-info btn-today\': el.isToday && !el.selected, \'invisible\': el.muted, \'btn-success\': el.compareSelect, \'btn-both\': el.selected && el.compareSelect, \'btn-range\': el.inRange && !el.selected}" ng-click="$select(el.date, 1)" ng-disabled="el.disabled"><span ng-class="{\'text-muted\': el.muted}" ng-bind="el.label"></span></button></td></tr></tbody></table></div></div></div><div class="form-horizontal mt-2x"><label class="checkbox-inline" ng-class="{\'hide\': !$compare}"><input type="checkbox" ng-model="ctrl.compare" ng-true-value="\'compare\'" ng-false-value="\'\'" ng-change="$toggleCompare()">compare</label><div class="pull-right"><button class="btn btn-default btn-primary btn-sm" ng-click="$closePicker()">close</button></div></div></div>');
} ]);