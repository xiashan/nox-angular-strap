/**
 * Created by xiashan on 17/5/12.
 */

'use strict';

angular.module('mgcrea.ngStrap.rangedatepicker', [ 'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'mgcrea.ngStrap.tooltip' ])
  .provider('$rangedatepicker', function() {
  var defaults = this.defaults = {
    animation: 'am-fade',
    prefixClass: 'rangedatepicker',
    placement: 'bottom-left',
    templateUrl: 'rangedatepicker/rangedatepicker.tpl.html',
    trigger: 'focus',
    container: false,
    keyboard: true,
    html: false,
    delay: 0,
    useNative: false,
    dateType: 'date',
    dateFormat: 'shortDate',
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
    startView: 0,
    minView: 0,
    startWeek: 0,
    daysOfWeekDisabled: '',
    hasToday: false,
    hasClear: false,
    iconLeft: 'nox-sort-left',
    iconRight: 'nox-sort-right'
  };
  this.$get = [ '$window', '$document', '$rootScope', '$sce', '$dateFormatter', 'rangedatepickerViews', '$tooltip', '$timeout', function($window, $document, $rootScope, $sce, $dateFormatter, rangedatepickerViews, $tooltip, $timeout) {
    var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
    var isTouch = 'createTouch' in $window.document && isNative;
    if (!defaults.lang) defaults.lang = $dateFormatter.getDefaultLocale();
    function RangeDatepickerFactory(element, controller, config) {
      var $rangedatepicker = $tooltip(element, angular.extend({}, defaults, config));
      var options = $rangedatepicker.$options;
      var scope = $rangedatepicker.$scope;
      if (options.startView) options.startView -= options.minView;
      var pickerViews = rangedatepickerViews($rangedatepicker);
      $rangedatepicker.$views = pickerViews.views;
      var viewDate = pickerViews.viewDate;
      scope.$mode = options.startView;
      scope.$iconLeft = options.iconLeft;
      scope.$iconRight = options.iconRight;
      scope.$hasToday = options.hasToday;
      scope.$hasClear = options.hasClear;
      var $picker = $rangedatepicker.$views[scope.$mode];

      scope.$select = function(date) {
        $rangedatepicker.select(date);
      };
      scope.$selectPane = function(value) {
        $rangedatepicker.$selectPane(value);
      };
      scope.$setToday = function() {
        if (options.autoclose) {
          $rangedatepicker.select(new Date());
        } else {
          $rangedatepicker.select(new Date(), true);
        }
      };


      $rangedatepicker.update = function(date) {
        if (angular.isDate(date) && !isNaN(date.getTime())) {
          $rangedatepicker.$date = date;
          $picker.update.call($picker, date);
        }
        $rangedatepicker.$build(true);
      };
      $rangedatepicker.updateDisabledDates = function(dateRanges) {
        options.disabledDateRanges = dateRanges;
        for (var i = 0, l = scope.rows.length; i < l; i++) {
          angular.forEach(scope.rows[i], $rangedatepicker.$setDisabledEl);
        }
      };
      $rangedatepicker.select = function(date, keep) {
        if (angular.isDate(date)) {
          if (!angular.isDate(controller.$dateValue) || isNaN(controller.$dateValue.getTime())) {
            controller.$dateValue = new Date(date);
          }
        } else {
          controller.$dateValue = null;
        }
        controller.$setViewValue(angular.copy(date));
        controller.$render();
        if (options.autoclose && !keep) {
          $timeout(function() {
            $rangedatepicker.hide(true);
          });
        }
      };
      $rangedatepicker.$build = function(pristine) {
        if (pristine === true && $picker.built) return;
        if (pristine === false && !$picker.built) return;
        $picker.build.call($picker);
      };
      $rangedatepicker.$updateSelected = function() {
        for (var i = 0, l = scope.rows.length; i < l; i++) {
          angular.forEach(scope.rows[i], updateSelected);
        }
      };
      $rangedatepicker.$isSelected = function(date) {
        return $picker.isSelected(date);
      };
      $rangedatepicker.$setDisabledEl = function(el) {
        el.disabled = $picker.isDisabled(el.date);
      };
      $rangedatepicker.$selectPane = function(value) {
        var steps = $picker.steps;
        var targetDate = new Date(Date.UTC(viewDate.year + (steps.year || 0) * value, viewDate.month + (steps.month || 0) * value, 1));
        angular.extend(viewDate, {
          year: targetDate.getUTCFullYear(),
          month: targetDate.getUTCMonth(),
          date: targetDate.getUTCDate()
        });
        $rangedatepicker.$build();
      };
      $rangedatepicker.$onMouseDown = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        if (isTouch) {
          var targetEl = angular.element(evt.target);
          if (targetEl[0].nodeName.toLowerCase() !== 'button') {
            targetEl = targetEl.parent();
          }
          targetEl.triggerHandler('click');
        }
      };
      function updateSelected(el) {
        el.selected = $rangedatepicker.$isSelected(el.date);
      }
      function focusElement() {
        element[0].focus();
      }
      var _init = $rangedatepicker.init;
      $rangedatepicker.init = function() {
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
      $rangedatepicker.destroy = function() {
        if (isNative && options.useNative) {
          element.off('click', focusElement);
        }
        _destroy();
      };
      var _show = $rangedatepicker.show;
      $rangedatepicker.show = function() {
        if (!isTouch && element.attr('readonly') || element.attr('disabled')) return;
        _show();
        $timeout(function() {
          if (!$rangedatepicker.$isShown) return;
          $rangedatepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $rangedatepicker.$onMouseDown);
        }, 0, false);
      };
      var _hide = $rangedatepicker.hide;
      $rangedatepicker.hide = function(blur) {
        if (!$rangedatepicker.$isShown) return;
        $rangedatepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $rangedatepicker.$onMouseDown);
        _hide(blur);
      };
      return $rangedatepicker;
    }
    RangeDatepickerFactory.defaults = defaults;
    return RangeDatepickerFactory;
  } ];
})
  .directive('bsRangedatepicker', [ '$window', '$parse', '$q', '$dateFormatter', '$dateParser', '$rangedatepicker', function($window, $parse, $q, $dateFormatter, $dateParser, $rangedatepicker) {
  var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
  return {
    restrict: 'EAC',
    require: 'ngModel',
    link: function postLink(scope, element, attr, controller) {
      var options = {
        scope: scope
      };
      angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'autoclose', 'dateType', 'dateFormat', 'timezone', 'modelDateFormat', 'dayFormat', 'strictFormat', 'startWeek', 'startDate', 'useNative', 'lang', 'startView', 'minView', 'iconLeft', 'iconRight', 'daysOfWeekDisabled', 'id', 'prefixClass', 'prefixEvent', 'hasToday', 'hasClear' ], function(key) {
        if (angular.isDefined(attr[key])) options[key] = attr[key];
      });
      var falseValueRegExp = /^(false|0|)$/i;
      angular.forEach([ 'html', 'container', 'autoclose', 'useNative', 'hasToday', 'hasClear' ], function(key) {
        if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) {
          options[key] = false;
        }
      });
      angular.forEach([ 'onBeforeShow', 'onShow', 'onBeforeHide', 'onHide' ], function(key) {
        var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
        if (angular.isDefined(attr[bsKey])) {
          options[key] = scope.$eval(attr[bsKey]);
        }
      });
      var rangedatepicker = $rangedatepicker(element, controller, options);
      options = rangedatepicker.$options;
      if (isNative && options.useNative) options.dateFormat = 'yyyy-MM-dd';
      var lang = options.lang;
      var formatDate = function(date, format) {
        return $dateFormatter.formatDate(date, format, lang);
      };
      var dateParser = $dateParser({
        format: options.dateFormat,
        lang: lang,
        strict: options.strictFormat
      });
      if (angular.isDefined(attr.dateFormat)) {
        attr.$observe('dateFormat', function(newValue) {
          rangedatepicker.$options.dateFormat = newValue;
        });
      }
      scope.$watch(attr.ngModel, function(newValue, oldValue) {
        console.log('aa:' + newValue);
        console.log(controller.$dateValue);
        console.log('bb:' + oldValue);
        rangedatepicker.update(controller.$dateValue);
      }, true);
      function validateAgainstMinMaxDate(parsedDate) {
        if (!angular.isDate(parsedDate)) return;
        var isMinValid = isNaN(rangedatepicker.$options.minDate) || parsedDate.getTime() >= rangedatepicker.$options.minDate;
        var isMaxValid = isNaN(rangedatepicker.$options.maxDate) || parsedDate.getTime() <= rangedatepicker.$options.maxDate;
        var isValid = isMinValid && isMaxValid;
        controller.$setValidity('date', isValid);
        controller.$setValidity('min', isMinValid);
        controller.$setValidity('max', isMaxValid);
        if (isValid) controller.$dateValue = parsedDate;
      }
      controller.$parsers.unshift(function(viewValue) {
        console.log('$parsers');
        var date;
        if (!viewValue) {
          controller.$setValidity('date', true);
          return null;
        }
        var parsedDate = dateParser.parse(viewValue, controller.$dateValue);
        if (!parsedDate || isNaN(parsedDate.getTime())) {
          controller.$setValidity('date', false);
          return;
        }
        validateAgainstMinMaxDate(parsedDate);
        if (options.dateType === 'string') {
          date = dateParser.timezoneOffsetAdjust(parsedDate, options.timezone, true);
          return formatDate(date, options.modelDateFormat || options.dateFormat);
        }
        date = dateParser.timezoneOffsetAdjust(controller.$dateValue, options.timezone, true);
        if (options.dateType === 'number') {
          return date.getTime();
        } else if (options.dateType === 'unix') {
          return date.getTime() / 1e3;
        } else if (options.dateType === 'iso') {
          return date.toISOString();
        }
        return new Date(date);
      });
      controller.$formatters.push(function(modelValue) {
        console.log('$formatters');
        var date;
        if (angular.isUndefined(modelValue) || modelValue === null) {
          date = NaN;
        } else if (angular.isDate(modelValue)) {
          date = modelValue;
        } else if (options.dateType === 'string') {
          date = dateParser.parse(modelValue, null, options.modelDateFormat);
        } else if (options.dateType === 'unix') {
          date = new Date(modelValue * 1e3);
        } else {
          date = new Date(modelValue);
        }
        controller.$dateValue = dateParser.timezoneOffsetAdjust(date, options.timezone);
        console.log(controller.$dateValue);
        return getDateFormattedString();
      });
      controller.$render = function() {
        console.log('$render');
        element.val(getDateFormattedString());
      };
      function getDateFormattedString() {
        return !controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : formatDate(controller.$dateValue, options.dateFormat);
      }
      scope.$on('$destroy', function() {
        if (rangedatepicker) rangedatepicker.destroy();
        options = null;
        rangedatepicker = null;
      });
    }
  };
} ])
  .provider('rangedatepickerViews', function() {
  function split(arr, size) {
    var arrays = [];
    while (arr.length > 0) {
      arrays.push(arr.splice(0, size));
    }
    return arrays;
  }
  function mod(n, m) {
    return (n % m + m) % m;
  }
  this.$get = [ '$dateFormatter', '$dateParser', '$sce', function($dateFormatter, $dateParser, $sce) {
    return function(picker) {
      var scope = picker.$scope;
      var options = picker.$options;
      var lang = options.lang;
      var formatDate = function(date, format) {
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
      var startDate = picker.$date || (options.startDate ? dateParser.getDateForAttribute('startDate', options.startDate) : new Date());
      var viewDate = {
        year: startDate.getFullYear(),
        month: startDate.getMonth(),
        date: startDate.getDate()
      };
      var views = [ {
        format: options.dayFormat,
        split: 7,
        steps: {
          month: 1
        },
        update: function(date, force) {
          if (!this.built || force || date.getFullYear() !== viewDate.year || date.getMonth() !== viewDate.month) {
            angular.extend(viewDate, {
              year: picker.$date.getFullYear(),
              month: picker.$date.getMonth(),
              date: picker.$date.getDate()
            });
            picker.$build();
          } else if (date.getDate() !== viewDate.date || date.getDate() === 1) {
            viewDate.date = picker.$date.getDate();
            picker.$updateSelected();
          }
        },
        build: function() {
          console.log('in build');
          var firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1);
          var firstDayOfMonthOffset = firstDayOfMonth.getTimezoneOffset();
          console.log(firstDayOfMonthOffset);
          var firstDate = new Date(+firstDayOfMonth - mod(firstDayOfMonth.getDay() - options.startWeek, 7) * 864e5);
          var firstDateOffset = firstDate.getTimezoneOffset();
          console.log(firstDateOffset);
          var today = dateParser.timezoneOffsetAdjust(new Date(), options.timezone).toDateString();
          if (firstDateOffset !== firstDayOfMonthOffset) firstDate = new Date(+firstDate + (firstDateOffset - firstDayOfMonthOffset) * 6e4);
          var days = [];
          var day;
          for (var i = 0; i < 42; i++) {
            day = dateParser.daylightSavingAdjust(new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + i));
            days.push({
              date: day,
              isToday: day.toDateString() === today,
              label: formatDate(day, this.format),
              selected: picker.$date && this.isSelected(day),
              muted: day.getMonth() !== viewDate.month,
              disabled: this.isDisabled(day)
            });
          }
          scope.title = formatDate(firstDayOfMonth, options.monthTitleFormat);
          scope.showLabels = true;
          scope.labels = weekDaysLabelsHtml;
          scope.rows = split(days, this.split);
          scope.isTodayDisabled = this.isDisabled(new Date());
          this.built = true;
        },
        isSelected: function(date) {
          return picker.$date && date.getFullYear() === picker.$date.getFullYear() && date.getMonth() === picker.$date.getMonth() && date.getDate() === picker.$date.getDate();
        },
        isDisabled: function(date) {
          var time = date.getTime();
          if (time < Date.parse(options.minDate) || time > Date.parse(options.maxDate)) return true;
          if (options.daysOfWeekDisabled.indexOf(date.getDay()) !== -1) return true;
          if (options.disabledDateRanges) {
            for (var i = 0; i < options.disabledDateRanges.length; i++) {
              if (time >= options.disabledDateRanges[i].start && time <= options.disabledDateRanges[i].end) {
                return true;
              }
            }
          }
          return false;
        }
      } ];
      return {
        views: options.minView ? Array.prototype.slice.call(views, options.minView) : views,
        viewDate: viewDate
      };
    };
  } ];
});
