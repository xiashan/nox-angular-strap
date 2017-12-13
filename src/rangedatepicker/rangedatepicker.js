/**
 * Created by xiashan on 17/5/12.
 */

'use strict';

angular.module('mgcrea.ngStrap.rangedatepicker', [ 'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'mgcrea.ngStrap.tooltip' ])
  .provider('$rangedatepicker', function () {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'rangedatepicker',
      placement: 'bottom-left',
      templateUrl: 'rangedatepicker/rangedatepicker.tpl.html',
      trigger: 'click',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      useNative: false,
      connector: ' / ',
      dateType: 'date',
      dateFormat: 'yyyy-MM-dd',
      timezone: null,
      modelDateFormat: null,
      dayFormat: 'dd',
      monthFormat: 'MMM',
      yearFormat: 'yyyy',
      monthTitleFormat: 'MMMM yyyy',
      yearTitleFormat: 'yyyy',
      strictFormat: false,
      autoclose: false,
      minDate: -Infinity,
      maxDate: +Infinity,
      minView: 0,
      startWeek: 0,
      daysOfWeekDisabled: '',
      iconLeft: 'nox-sort-left',
      iconRight: 'nox-sort-right',
      compare: true
    };
    this.$get = ['$window', '$document', '$rootScope', '$sce', '$dateFormatter', 'rangedatepickerViews', '$tooltip', '$timeout',
      function ($window, $document, $rootScope, $sce, $dateFormatter, rangedatepickerViews, $tooltip, $timeout) {
        var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
        var isTouch = 'createTouch' in $window.document && isNative;
        if (!defaults.lang) defaults.lang = $dateFormatter.getDefaultLocale();
        function RangeDatepickerFactory (element, controller, config) {
          var $rangedatepicker = $tooltip(element, angular.extend({}, defaults, config));
          var options = $rangedatepicker.$options;
          var scope = $rangedatepicker.$scope;
          var pickerViews = rangedatepickerViews($rangedatepicker);
          $rangedatepicker.$view = pickerViews.view;
          var viewDate = pickerViews.viewDate;
          scope.$iconLeft = options.iconLeft;
          scope.$iconRight = options.iconRight;
          scope.$compare = options.compare;
          var $picker = $rangedatepicker.$view;

          var today = new Date();
          var t = $rangedatepicker.$today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          var d = today.getDay();

          scope.rangeList = [
            {name: 'Today', value: '0d', date: {start: t, end: t}},
            {name: 'Yesterday', value: '-2d', date: {start: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1), end: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1)}},
            {name: 'Last 7 Days', value: '-7d', date: {start: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 6), end: t}},
            {name: 'Last Week', value: '-1w', date: {start: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 6 - d), end: new Date(t.getFullYear(), t.getMonth(), t.getDate() - d)}},
            {name: 'This Month', value: '0m', date: {start: new Date(t.getFullYear(), t.getMonth(), 1), end: t}},
            {name: 'Last Month', value: '-1m', date: {start: new Date(t.getFullYear(), t.getMonth() - 1, 1), end: new Date(t.getFullYear(), t.getMonth(), 0)}}
          ];

          // 区间
          scope.ctrl = {
            rangeType: '',
            compare: ''
          };

          scope.$select = function (date, index) {
            // compare只支持选择开始时间
            if (scope.ctrl.compare && index) {
              return;
            }
            $rangedatepicker.select(date, index);
          };
          scope.$selectPane = function (value, index) {
            // compare只支持选择开始时间
            if (scope.ctrl.compare && index) {
              return;
            }
            $rangedatepicker.$selectPane(value, index);
          };
          scope.$selectRange = function (type) {
            if (type === scope.ctrl.rangeType || scope.ctrl.compare) {
              return;
            }
            $rangedatepicker.$selectRange(type);
            $rangedatepicker.hide(true);
          };
          scope.$toggleCompare = function () {
            var modelValue = controller.$modelValue ? angular.copy(controller.$modelValue) : {};
            modelValue.compare = scope.ctrl.compare;
            // 只变更了勾选compare
            modelValue.onlyCompare = true;
            controller.$setViewValue(modelValue);
            controller.$render();
          };
          scope.$closePicker = function () {
            $rangedatepicker.hide();
          };
          scope.$stopPropagation = function (evt) {
            evt.stopPropagation();
          };

          $rangedatepicker.update = function (sDate, eDate, force) {
            if (angular.isDate(sDate) && !isNaN(sDate.getTime()) && angular.isDate(eDate) && !isNaN(eDate.getTime())) {
              if (!scope.ctrl.compare) {
                $rangedatepicker.$date = [sDate, eDate];
              } else {
                $rangedatepicker.$compareDate = [sDate, eDate];
              }
              $picker.update.call($picker, sDate, eDate);
            } else {
              $rangedatepicker.$build(!force);
            }
          };
          $rangedatepicker.updateDisabledDates = function (dateRanges) {
            options.disabledDateRanges = dateRanges;
            for (var i = 0, l = scope.rows.length; i < l; i++) {
              angular.forEach(scope.rows[i], $rangedatepicker.$setDisabledEl);
            }
          };
          $rangedatepicker.select = function (date, index, keep) {
            var modelValue = controller.$modelValue ? angular.copy(controller.$modelValue) : {};
            modelValue.compare = scope.ctrl.compare;
            if (!scope.ctrl.compare) {
              if (angular.isDate(date)) {
                if (!angular.isDate(controller.$dateValue[index]) || isNaN(controller.$dateValue[index].getTime())) {
                  controller.$dateValue[index] = new Date(date);
                }
              } else {
                controller.$dateValue[index] = null;
              }
              if (index === 0) {
                modelValue.startDate = angular.copy(date);
              } else {
                modelValue.endDate = angular.copy(date);
              }
            } else {
              controller.$compareDateValue = !controller.$compareDateValue ? [] : controller.$compareDateValue;
              if (angular.isDate(date)) {
                if (!angular.isDate(controller.$compareDateValue[index]) || isNaN(controller.$compareDateValue[index].getTime())) {
                  controller.$compareDateValue[index] = new Date(date);
                }
              } else {
                controller.$compareDateValue[index] = null;
              }
              if (index === 0) {
                modelValue.compareStartDate = angular.copy(date);
              } else {
                modelValue.compareEndDate = angular.copy(date);
              }
            }
            modelValue.onlyCompare = false;
            controller.$setViewValue(modelValue);
            controller.$render();
            if (options.autoclose && !keep) {
              $timeout(function () {
                $rangedatepicker.hide(true);
              });
            }
          };
          $rangedatepicker.$getCompare = function () {
            return scope.ctrl && scope.ctrl.compare;
          };
          $rangedatepicker.$setCompare = function () {
            scope.ctrl && (scope.ctrl.compare = 'compare');
          };
          $rangedatepicker.$build = function (pristine) {
            if (pristine === true && $picker.built) return;
            if (pristine === false && !$picker.built) return;
            $picker.build.call($picker, $rangedatepicker.$date);
          };
          $rangedatepicker.$updateSelected = function () {
            for (var i = 0, l = scope.rows.length; i < l; i++) {
              angular.forEach(scope.rows[i], updateSelected);
            }
          };
          $rangedatepicker.$isSelected = function (date) {
            return $picker.isSelected(date);
          };
          $rangedatepicker.$setDisabledEl = function (el) {
            el.disabled = $picker.isDisabled(el.date);
          };
          $rangedatepicker.$selectPane = function (value, index) {
            var steps = $picker.steps;
            var key = (index === 0) ? 'startDate' : 'endDate';
            var targetDate = new Date(Date.UTC(viewDate[key].year + (steps.year || 0) * value, viewDate[key].month + (steps.month || 0) * value, 1));
            angular.extend(viewDate[key], {
              year: targetDate.getUTCFullYear(),
              month: targetDate.getUTCMonth(),
              date: targetDate.getUTCDate()
            });
            $rangedatepicker.$build();
          };
          $rangedatepicker.$selectRange = function (type) {
            var cate = type.substr(-1);
            var value = parseInt(type.substr(0, type.length - 1), 10);
            var endDate = $rangedatepicker.$today;
            var startDate;
            switch (cate) {
              case 'd':
                if (value < 0) {
                  startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + value + 1);
                  if (value === -2) {
                    endDate = startDate;
                  }
                } else {
                  startDate = endDate;
                  endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + value);
                }
                break;
              case 'w':
                var day = endDate.getDay();
                if (value <= 0) {
                  startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + value * 7 + (day * -1 + 1));
                  endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + (day * -1));
                } else {
                  startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 7 - day + 1);
                  endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + value * 7 + (7 - day));
                }
                break;
              case 'm':
                if (value === 0) {
                  startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                } else if (value < 0) {
                  startDate = new Date(endDate.getFullYear(), endDate.getMonth() + value, 1);
                  endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
                } else {
                  startDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1);
                  endDate = new Date(endDate.getFullYear(), endDate.getMonth() + value + 1, 0);
                }
                break;
              default:
                break;
            }
            if (angular.isDate(startDate) && angular.isDate(endDate)) {
              controller.$dateValue[0] = angular.copy(startDate);
              controller.$dateValue[1] = angular.copy(endDate);
              var modelValue = controller.$modelValue ? angular.copy(controller.$modelValue) : {};
              modelValue.startDate = angular.copy(startDate);
              modelValue.endDate = angular.copy(endDate);
              modelValue.onlyCompare = false;
              controller.$setViewValue(modelValue);
              controller.$render();
              scope.ctrl.rangeType = type;
            }
          };
          $rangedatepicker.$onMouseDown = function (evt) {
            evt.preventDefault(true);
            evt.stopPropagation(true);
            var targetEl = angular.element(evt.target);
            if (isTouch) {
              if (targetEl[0].nodeName.toLowerCase() !== 'button') {
                targetEl = targetEl.parent();
              }
              targetEl.triggerHandler('click');
            }
          };
          function updateSelected (el) {
            el.selected = $rangedatepicker.$isSelected(el.date);
          }
          function focusElement () {
            element[0].focus();
          }
          var _init = $rangedatepicker.init;
          $rangedatepicker.init = function () {
            if (isNative && options.useNative) {
              element.prop('type', 'date');
              element.css('-webkit-appearance', 'textfield');
              return;
            } else if (isTouch) {
              element.prop('type', 'text');
              element.attr('readonly', 'true');
              element.on('click', focusElement);
            }
            _init();
          };
          var _destroy = $rangedatepicker.destroy;
          $rangedatepicker.destroy = function () {
            if (isNative && options.useNative) {
              element.off('click', focusElement);
            }
            _destroy();
          };
          var _show = $rangedatepicker.show;
          $rangedatepicker.show = function () {
            // if (!isTouch && element.attr('readonly') || element.attr('disabled')) return;
            if (element.attr('disabled')) return;
            _show();
            $timeout(function () {
              if (!$rangedatepicker.$isShown) return;
              $rangedatepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $rangedatepicker.$onMouseDown);
            }, 0, false);
          };
          var _hide = $rangedatepicker.hide;
          $rangedatepicker.hide = function (blur) {
            if (!$rangedatepicker.$isShown) return;
            $rangedatepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $rangedatepicker.$onMouseDown);
            _hide(blur);
          };
          return $rangedatepicker;
        }
        RangeDatepickerFactory.defaults = defaults;
        return RangeDatepickerFactory;
      }];
  })
  .directive('bsRangedatepicker', ['$window', '$parse', '$q', '$dateFormatter', '$dateParser', '$rangedatepicker',
    function ($window, $parse, $q, $dateFormatter, $dateParser, $rangedatepicker) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      return {
        restrict: 'EAC',
        require: 'ngModel',
        link: function postLink (scope, element, attr, controller) {
          var options = {
            scope: scope
          };
          angular.forEach(['template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'autoclose', 'dateType', 'connector', 'dateFormat', 'timezone', 'modelDateFormat', 'dayFormat', 'strictFormat', 'startWeek', 'startDate', 'useNative', 'lang', 'minView', 'iconLeft', 'iconRight', 'daysOfWeekDisabled', 'id', 'prefixClass', 'prefixEvent', 'compare'], function (key) {
            if (angular.isDefined(attr[key])) options[key] = attr[key];
          });
          var falseValueRegExp = /^(false|0|)$/i;
          angular.forEach(['html', 'container', 'autoclose', 'useNative', 'compare'], function (key) {
            if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) {
              options[key] = false;
            }
          });
          angular.forEach(['onBeforeShow', 'onShow', 'onBeforeHide', 'onHide'], function (key) {
            var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
            if (angular.isDefined(attr[bsKey])) {
              options[key] = scope.$eval(attr[bsKey]);
            }
          });
          var rangedatepicker = $rangedatepicker(element, controller, options);
          options = rangedatepicker.$options;
          if (isNative && options.useNative) options.dateFormat = 'yyyy-MM-dd';
          var lang = options.lang;
          var formatDate = function (date, format) {
            return $dateFormatter.formatDate(date, format, lang);
          };
          var dateParser = $dateParser({
            format: options.dateFormat,
            lang: lang,
            strict: options.strictFormat
          });
          angular.forEach(['minDate', 'maxDate'], function (key) {
            if (angular.isDefined(attr[key])) {
              attr.$observe(key, function (newValue) {
                rangedatepicker.$options[key] = dateParser.getDateForAttribute(key, newValue);
                if (!isNaN(rangedatepicker.$options[key])) {
                  rangedatepicker.$build(false);
                }
                // if (controller.$dateValue) {
                //   validateAgainstMinMaxDate(controller.$dateValue[0], controller.$dateValue[1]);
                // }
              });
            }
          });
          if (angular.isDefined(attr.dateFormat)) {
            attr.$observe('dateFormat', function (newValue) {
              rangedatepicker.$options.dateFormat = newValue;
            });
          }
          scope.$watch(attr.ngModel, function (newValue, oldValue) {
            if (newValue && newValue.onlyCompare) {
              rangedatepicker.update(null, null, true);
            } else if (rangedatepicker.$getCompare()) {
              rangedatepicker.$date = [controller.$dateValue[0], controller.$dateValue[1]];
              rangedatepicker.update(controller.$compareDateValue[0], controller.$compareDateValue[1]);
            } else {
              rangedatepicker.update(controller.$dateValue[0], controller.$dateValue[1]);
            }
          }, true);

          function getFormattedDate (modelValue) {
            var date;
            if (angular.isDate(modelValue)) {
              date = modelValue;
            } else if (options.dateType === 'string') {
              date = dateParser.parse(modelValue, null, options.modelDateFormat);
            } else if (options.dateType === 'unix') {
              date = new Date(modelValue * 1e3);
            } else {
              date = new Date(modelValue);
            }
            return date;
          }
          function validateAgainstMinMaxDate (parsedDate1, parsedDate2) {
            if (!angular.isDate(parsedDate1) || !angular.isDate(parsedDate2)) {
              return false;
            }
            var isMinValid = isNaN(rangedatepicker.$options.minDate) || parsedDate1.getTime() >= rangedatepicker.$options.minDate;
            var isMaxValid = isNaN(rangedatepicker.$options.maxDate) || parsedDate2.getTime() <= rangedatepicker.$options.maxDate;
            var isValid = isMinValid && isMaxValid;
            controller.$setValidity('date', isValid);
            controller.$setValidity('min', isMinValid);
            controller.$setValidity('max', isMaxValid);
            var compare = rangedatepicker.$getCompare();
            if (isValid) {
              if (compare) {
                controller.$compareDateValue[0] = parsedDate1;
                controller.$compareDateValue[1] = parsedDate2;
              } else {
                controller.$dateValue[0] = parsedDate1;
                controller.$dateValue[1] = parsedDate2;
              }
            }
            return true;
          }
          controller.$parsers.unshift(function (viewValue) {
            var compare = rangedatepicker.$getCompare();
            if (!viewValue) {
              controller.$setValidity('date', true);
              return null;
            }
            if (viewValue.onlyCompare) {
              viewValue.compare = compare;
              return viewValue;
            }
            var parsedDate1;
            var parsedDate2;
            if (compare) {
              parsedDate1 = dateParser.parse(viewValue.compareStartDate, controller.$compareDateValue[0]);
              parsedDate2 = dateParser.parse(viewValue.compareEndDate, controller.$compareDateValue[1]);
            } else {
              parsedDate1 = dateParser.parse(viewValue.startDate, controller.$dateValue[0]);
              parsedDate2 = dateParser.parse(viewValue.endDate, controller.$dateValue[1]);
            }
            if (parsedDate1 && !parsedDate2) {
              parsedDate2 = angular.copy(parsedDate1);
            }
            if (!parsedDate1 && parsedDate2) {
              parsedDate1 = angular.copy(parsedDate2);
            }
            if (!parsedDate1 || isNaN(parsedDate1.getTime()) || !parsedDate2 || isNaN(parsedDate2.getTime())) {
              controller.$setValidity('date', false);
              return false;
            }
            validateAgainstMinMaxDate(parsedDate1, parsedDate2);
            var obj = {
              dateRange: viewValue.dateRange,
              compare: compare
            };
            var skey = '';
            var ekey = '';
            if (compare) {
              // 原对比日期需要显示，因此这里还是要赋值
              obj.startDate = viewValue.startDate;
              obj.endDate = viewValue.endDate;
              skey = 'compareStartDate';
              ekey = 'compareEndDate';
            } else {
              obj.compareStartDate = viewValue.compareStartDate;
              obj.compareEndDate = viewValue.compareEndDate;
              skey = 'startDate';
              ekey = 'endDate';
            }
            if (options.dateType === 'string') {
              obj[skey] = formatDate(dateParser.timezoneOffsetAdjust(parsedDate1, options.timezone, true), options.modelDateFormat || options.dateFormat);
              obj[ekey] = formatDate(dateParser.timezoneOffsetAdjust(parsedDate2, options.timezone, true), options.modelDateFormat || options.dateFormat);
              return obj;
            }
            var date1;
            var date2;
            if (compare) {
              date1 = dateParser.timezoneOffsetAdjust(controller.$compareDateValue[0], options.timezone, true);
              date2 = dateParser.timezoneOffsetAdjust(controller.$compareDateValue[1], options.timezone, true);
            } else {
              date1 = dateParser.timezoneOffsetAdjust(controller.$dateValue[0], options.timezone, true);
              date2 = dateParser.timezoneOffsetAdjust(controller.$dateValue[1], options.timezone, true);
            }
            if (options.dateType === 'number') {
              obj[skey] = date1.getTime();
              obj[ekey] = date2.getTime();
            } else if (options.dateType === 'unix') {
              obj[skey] = date1.getTime() / 1e3;
              obj[ekey] = date2.getTime() / 1e3;
            } else if (options.dateType === 'iso') {
              obj[skey] = date1.toISOString();
              obj[ekey] = date2.toISOString();
            } else {
              obj[skey] = new Date(date1);
              obj[ekey] = new Date(date2);
            }
            return obj;
          });
          controller.$formatters.push(function (modelValue) {
            if (angular.isUndefined(modelValue) || modelValue === null) {
              return '';
            }
            if (modelValue.dateRange) {
              controller.$dateRange = modelValue.dateRange;
              controller.$dateValue = !controller.$dateValue ? [] : controller.$dateValue;
              rangedatepicker.$selectRange(controller.$dateRange);
            } else {
              controller.$dateValue = [];
              controller.$compareDateValue = [];
              if (modelValue.startDate && modelValue.endDate) {
                var startDate = getFormattedDate(modelValue.startDate);
                var endDate = getFormattedDate(modelValue.endDate);
                controller.$dateValue = [dateParser.timezoneOffsetAdjust(startDate, options.timezone), dateParser.timezoneOffsetAdjust(endDate, options.timezone)];
              }
              if (modelValue.compareStartDate && modelValue.compareEndDate) {
                var compareStartDate = getFormattedDate(modelValue.compareStartDate);
                var compareEndDate = getFormattedDate(modelValue.compareEndDate);
                controller.$compareDateValue = [dateParser.timezoneOffsetAdjust(compareStartDate, options.timezone), dateParser.timezoneOffsetAdjust(compareEndDate, options.timezone)];
                if (modelValue.compare) {
                  rangedatepicker.$setCompare();
                }
              }
            }
            return getDateFormattedString();
          });
          controller.$render = function () {
            element.val(getDateFormattedString());
          };
          function getDateFormattedString () {
            if (!controller.$modelValue || !controller.$modelValue.startDate || isNaN(controller.$modelValue.startDate.getTime())) {
              return '';
            }
            var html = formatDate(controller.$modelValue.startDate, options.dateFormat);
            if (controller.$modelValue.compare && controller.$modelValue.compareStartDate && !isNaN(controller.$modelValue.compareStartDate.getTime())) {
              html += ' vs ' + formatDate(controller.$modelValue.compareStartDate, options.dateFormat);
            } else if (!controller.$modelValue.compare && controller.$modelValue.endDate && !isNaN(controller.$modelValue.endDate.getTime())) {
              html += ' / ' + formatDate(controller.$modelValue.endDate, options.dateFormat);
            }
            return html;
          }
          scope.$on('$destroy', function () {
            if (rangedatepicker) rangedatepicker.destroy();
            options = null;
            rangedatepicker = null;
          });
        }
      };
    }])
  .provider('rangedatepickerViews', function () {
    function split (arr, size) {
      var arrays = [];
      while (arr.length > 0) {
        arrays.push(arr.splice(0, size));
      }
      return arrays;
    }
    function mod (n, m) {
      return (n % m + m) % m;
    }
    this.$get = ['$dateFormatter', '$dateParser', '$sce', function ($dateFormatter, $dateParser, $sce) {
      return function (picker) {
        var scope = picker.$scope;
        var options = picker.$options;
        var lang = options.lang;
        var formatDate = function (date, format) {
          return $dateFormatter.formatDate(date, format, lang);
        };
        var dateParser = $dateParser({
          format: options.dateFormat,
          lang: lang,
          strict: options.strictFormat
        });
        var weekDaysMin = $dateFormatter.weekdaysShort(lang);
        var weekDaysLabels = weekDaysMin.slice(options.startWeek).concat(weekDaysMin.slice(0, options.startWeek));
        var weekDaysLabelsHtml = $sce.trustAsHtml('<th class="dow text-center">' + weekDaysLabels.join('</th><th class="dow text-center">') + '</th>');

        var startDate = (picker.$date && picker.$date[0]) || (options.startDate ? dateParser.getDateForAttribute('startDate', options.startDate) : new Date());
        var endDate = (picker.$date && picker.$date[1]) || (options.endDate ? dateParser.getDateForAttribute('endDate', options.endDate) : new Date());
        var viewDate = {
          startDate: {
            year: startDate.getFullYear(),
            month: startDate.getMonth(),
            date: startDate.getDate()
          },
          endDate: {
            year: endDate.getFullYear(),
            month: endDate.getMonth(),
            date: endDate.getDate()
          }
        };
        var view = {
          format: options.dayFormat,
          split: 7,
          steps: {
            month: 1
          },
          update: function (sDate, eDate, force) {
            viewDate.startDate = {
              year: sDate.getFullYear(),
              month: sDate.getMonth(),
              date: sDate.getDate()
            };
            viewDate.endDate = {
              year: eDate.getFullYear(),
              month: eDate.getMonth(),
              date: eDate.getDate()
            };
            picker.$build();
          },
          build: function () {
            var that = this;
            scope.title = [];
            scope.rows = [];
            ['startDate', 'endDate'].forEach(function (value, index) {
              var item = viewDate[value];
              var firstDayOfMonth = new Date(item.year, item.month, 1);
              var firstDayOfMonthOffset = firstDayOfMonth.getTimezoneOffset();
              var firstDate = new Date(+firstDayOfMonth - mod(firstDayOfMonth.getDay() - options.startWeek, 7) * 864e5);
              var firstDateOffset = firstDate.getTimezoneOffset();
              var today = dateParser.timezoneOffsetAdjust(new Date(), options.timezone).toDateString();
              if (firstDateOffset !== firstDayOfMonthOffset) firstDate = new Date(+firstDate + (firstDateOffset - firstDayOfMonthOffset) * 6e4);
              var days = [];
              var day;
              for (var i = 0; i < 42; i++) {
                day = dateParser.daylightSavingAdjust(new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + i));
                days.push({
                  date: day,
                  isToday: day.toDateString() === today,
                  label: formatDate(day, that.format),
                  selected: picker.$date && picker.$date[index] && (!picker.$getCompare() || (picker.$getCompare() && !index)) && that.isSelected(picker.$date[index], day),
                  inRange: that.isInRange(day),
                  muted: day.getMonth() !== item.month,
                  disabled: (index === 1 && scope.ctrl.compare) || that.isDisabled(day, index),
                  compareSelect: index === 0 && scope.ctrl.compare && picker.$compareDate && picker.$compareDate[index] && that.isSelected(picker.$compareDate[index], day)
                });
              }
              scope.title[index] = formatDate(firstDayOfMonth, options.monthTitleFormat);
              scope.rows[index] = split(days, that.split);
            });
            scope.showLabels = true;
            scope.labels = weekDaysLabelsHtml;
            scope.isTodayDisabled = this.isDisabled(new Date());
            // set range
            if (!scope.ctrl.compare) {
              var flag = false;
              scope.rangeList.forEach(function (item) {
                if (item.date.start.toDateString() === picker.$date[0].toDateString() && item.date.end.toDateString() === picker.$date[1].toDateString()) {
                  scope.ctrl.rangeType = item.value;
                  flag = true;
                }
              });
              if (!flag) {
                scope.ctrl.rangeType = '';
              }
            }
            this.built = true;
          },
          isSelected: function (currentDate, date) {
            return currentDate &&
              date.getFullYear() === currentDate.getFullYear() &&
              date.getMonth() === currentDate.getMonth() &&
              date.getDate() === currentDate.getDate();
          },
          isInRange: function (date) {
            if (!picker.$date || picker.$getCompare()) {
              return false;
            }
            var minDate = picker.$date[0];
            var maxDate = picker.$date[1];
            if (!angular.isDate(minDate) || !angular.isDate(maxDate) || !angular.isDate(date)) {
              return false;
            }
            return (date.getTime() >= minDate.getTime() && date.getTime() <= maxDate.getTime());
          },
          isDisabled: function (date, index) {
            var time = date.getTime();
            if (time < Date.parse(options.minDate) || time > Date.parse(options.maxDate)) {
              return true;
            }
            // 开始时间不能选择大于结束时间的事件
            if (!scope.ctrl.compare && picker.$date && ((index && time < picker.$date[index - 1]) || (time > picker.$date[index + 1]))) {
              return true;
            }
            if (options.daysOfWeekDisabled.indexOf(date.getDay()) !== -1) {
              return true;
            }
            if (options.disabledDateRanges) {
              for (var i = 0; i < options.disabledDateRanges.length; i++) {
                if (time >= options.disabledDateRanges[i].start && time <= options.disabledDateRanges[i].end) {
                  return true;
                }
              }
            }
            return false;
          }
        };
        return {
          view: view,
          viewDate: viewDate
        };
      };
    } ];
  });
