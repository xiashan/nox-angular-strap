/**
 * angular-strap
 * @version v2.3.10 - 2018-04-17
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes <olivier@mg-crea.com> (https://github.com/mgcrea)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
'use strict';

angular.module('mgcrea.ngStrap.datetimepicker', [ 'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'mgcrea.ngStrap.tooltip' ]).provider('datetimepickerViews', function() {
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
    function DatetimepickerViewsFactory(picker) {
      var scope = picker.$scope;
      var options = picker.$options;
      var lang = options.lang;
      var formatDate = function(date, format) {
        return $dateFormatter.formatDate(date, format, lang);
      };
      var format = $dateFormatter.getDatetimeFormat(options.dateFormat, lang);
      var timeSeparator = $dateFormatter.timeSeparator(format);
      var showSeconds = $dateFormatter.showSeconds(format);
      scope.$iconUp = options.iconUp;
      scope.$iconDown = options.iconDown;
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
        date: startDate.getDate(),
        hour: startDate.getHours(),
        minute: startDate.getMinutes(),
        second: startDate.getSeconds(),
        millisecond: startDate.getMilliseconds()
      };
      var views = [ {
        hourFormat: options.hourFormat,
        minuteFormat: options.minuteFormat,
        secondFormat: options.secondFormat,
        split: 7,
        steps: {
          date: 1
        },
        update: function(date, force) {
          if (angular.isDate(date) && !isNaN(date.getTime())) {
            angular.extend(viewDate, {
              year: picker.$date.getFullYear(),
              month: picker.$date.getMonth(),
              date: picker.$date.getDate(),
              hour: picker.$date.getHours(),
              minute: picker.$date.getMinutes(),
              second: picker.$date.getSeconds(),
              millisecond: picker.$date.getMilliseconds()
            });
            picker.$build();
          } else if (!this.built || force) {
            picker.$build();
          }
        },
        build: function() {
          var i;
          var midIndex = scope.midIndex = parseInt(options.length / 2, 10);
          var hours = [];
          var hour;
          var step;
          for (i = 0; i < options.length; i++) {
            step = viewDate.hour - (midIndex - i) * options.hourStep;
            step = step < 0 ? 24 + step : step;
            hour = new Date(viewDate.year, viewDate.month, viewDate.date, step, viewDate.minute, viewDate.second);
            hours.push({
              date: hour,
              label: formatDate(hour, this.hourFormat),
              selected: picker.$date && this.isSelected(hour, 0),
              disabled: this.isDisabled(hour, 0)
            });
          }
          var minutes = [];
          var minute;
          for (i = 0; i < options.length; i++) {
            step = viewDate.minute - (midIndex - i) * options.minuteStep;
            step = step < 0 ? 60 + step : step;
            minute = new Date(viewDate.year, viewDate.month, viewDate.date, viewDate.hour, step, viewDate.second);
            minutes.push({
              date: minute,
              label: formatDate(minute, this.minuteFormat),
              selected: picker.$date && this.isSelected(minute, 1),
              disabled: this.isDisabled(minute, 1)
            });
          }
          var seconds = [];
          var second;
          for (i = 0; i < options.length; i++) {
            step = viewDate.second - (midIndex - i) * options.secondStep;
            step = step < 0 ? 60 + step : step;
            second = new Date(viewDate.year, viewDate.month, viewDate.date, viewDate.hour, viewDate.minute, step);
            seconds.push({
              date: second,
              label: formatDate(second, this.secondFormat),
              selected: picker.$date && this.isSelected(second, 2),
              disabled: this.isDisabled(second, 2)
            });
          }
          var rows = [];
          for (i = 0; i < options.length; i++) {
            if (showSeconds) {
              rows.push([ hours[i], minutes[i], seconds[i] ]);
            } else {
              rows.push([ hours[i], minutes[i] ]);
            }
          }
          scope.title = formatDate(new Date(viewDate.year, viewDate.month, viewDate.date), options.timeTitleFormat);
          scope.rows = rows;
          scope.showSeconds = showSeconds;
          scope.timeSeparator = timeSeparator;
          this.built = true;
        },
        isSelected: function(date, index) {
          if (!picker.$date) {
            return false;
          } else if (index === 0) {
            return date.getHours() === picker.$date.getHours();
          } else if (index === 1) {
            return date.getMinutes() === picker.$date.getMinutes();
          } else if (index === 2) {
            return date.getSeconds() === picker.$date.getSeconds();
          }
          return false;
        },
        isDisabled: function(date, index) {
          var time = date.getTime();
          return options.minDate && angular.isDate(options.minDate) && time < options.minDate.getTime() || options.maxDate && angular.isDate(options.maxDate) && time > options.maxDate.getTime();
        },
        onKeyDown: function(evt) {
          if (!picker.$date) {
            return;
          }
        }
      }, {
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
          var firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1);
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
          if (options.minDate && angular.isDate(options.minDate)) {
            var minDate = new Date(options.minDate.getFullYear(), options.minDate.getMonth(), options.minDate.getDate(), 0, 0, 0);
            if (time < Date.parse(minDate)) {
              return true;
            }
          }
          if (options.maxDate && angular.isDate(options.maxDate)) {
            var maxDate = new Date(options.maxDate.getFullYear(), options.maxDate.getMonth(), options.maxDate.getDate() + 1, 0, 0, 0);
            if (time >= Date.parse(maxDate)) {
              return true;
            }
          }
          if (options.daysOfWeekDisabled.indexOf(date.getDay()) !== -1) return true;
          if (options.disabledDateRanges) {
            for (var i = 0; i < options.disabledDateRanges.length; i++) {
              if (time >= options.disabledDateRanges[i].start && time <= options.disabledDateRanges[i].end) {
                return true;
              }
            }
          }
          return false;
        },
        onKeyDown: function(evt) {
          if (!picker.$date) {
            return;
          }
          var actualTime = picker.$date.getTime();
          var newDate;
          if (evt.keyCode === 37) {
            newDate = new Date(actualTime - 1 * 864e5);
          } else if (evt.keyCode === 38) {
            newDate = new Date(actualTime - 7 * 864e5);
          } else if (evt.keyCode === 39) {
            newDate = new Date(actualTime + 1 * 864e5);
          } else if (evt.keyCode === 40) {
            newDate = new Date(actualTime + 7 * 864e5);
          }
          if (!this.isDisabled(newDate)) {
            picker.select(newDate, true);
          }
        }
      }, {
        name: 'month',
        format: options.monthFormat,
        split: 4,
        steps: {
          year: 1
        },
        update: function(date, force) {
          if (!this.built || date.getFullYear() !== viewDate.year) {
            angular.extend(viewDate, {
              year: picker.$date.getFullYear(),
              month: picker.$date.getMonth(),
              date: picker.$date.getDate()
            });
            picker.$build();
          } else if (date.getMonth() !== viewDate.month) {
            angular.extend(viewDate, {
              month: picker.$date.getMonth(),
              date: picker.$date.getDate()
            });
            picker.$updateSelected();
          }
        },
        build: function() {
          var months = [];
          var month;
          for (var i = 0; i < 12; i++) {
            month = new Date(viewDate.year, i, 1);
            months.push({
              date: month,
              label: formatDate(month, this.format),
              selected: picker.$isSelected(month),
              disabled: this.isDisabled(month)
            });
          }
          scope.title = formatDate(month, options.yearTitleFormat);
          scope.showLabels = false;
          scope.rows = split(months, this.split);
          this.built = true;
        },
        isSelected: function(date) {
          return picker.$date && date.getFullYear() === picker.$date.getFullYear() && date.getMonth() === picker.$date.getMonth();
        },
        isDisabled: function(date) {
          var lastDate = +new Date(date.getFullYear(), date.getMonth() + 1, 0);
          return lastDate < options.minDate || date.getTime() > options.maxDate;
        },
        onKeyDown: function(evt) {
          if (!picker.$date) {
            return;
          }
          var actualMonth = picker.$date.getMonth();
          var newDate = new Date(picker.$date);
          if (evt.keyCode === 37) {
            newDate.setMonth(actualMonth - 1);
          } else if (evt.keyCode === 38) {
            newDate.setMonth(actualMonth - 4);
          } else if (evt.keyCode === 39) {
            newDate.setMonth(actualMonth + 1);
          } else if (evt.keyCode === 40) {
            newDate.setMonth(actualMonth + 4);
          }
          if (!this.isDisabled(newDate)) {
            picker.select(newDate, true);
          }
        }
      }, {
        name: 'year',
        format: options.yearFormat,
        split: 4,
        steps: {
          year: 12
        },
        update: function(date, force) {
          if (!this.built || force || parseInt(date.getFullYear() / 20, 10) !== parseInt(viewDate.year / 20, 10)) {
            angular.extend(viewDate, {
              year: picker.$date.getFullYear(),
              month: picker.$date.getMonth(),
              date: picker.$date.getDate()
            });
            picker.$build();
          } else if (date.getFullYear() !== viewDate.year) {
            angular.extend(viewDate, {
              year: picker.$date.getFullYear(),
              month: picker.$date.getMonth(),
              date: picker.$date.getDate()
            });
            picker.$updateSelected();
          }
        },
        build: function() {
          var firstYear = viewDate.year - viewDate.year % (this.split * 3);
          var years = [];
          var year;
          for (var i = 0; i < 12; i++) {
            year = new Date(firstYear + i, 0, 1);
            years.push({
              date: year,
              label: formatDate(year, this.format),
              selected: picker.$isSelected(year),
              disabled: this.isDisabled(year)
            });
          }
          scope.title = years[0].label + '-' + years[years.length - 1].label;
          scope.showLabels = false;
          scope.rows = split(years, this.split);
          this.built = true;
        },
        isSelected: function(date) {
          return picker.$date && date.getFullYear() === picker.$date.getFullYear();
        },
        isDisabled: function(date) {
          var lastDate = +new Date(date.getFullYear() + 1, 0, 0);
          return lastDate < options.minDate || date.getTime() > options.maxDate;
        },
        onKeyDown: function(evt) {
          if (!picker.$date) {
            return;
          }
          var actualYear = picker.$date.getFullYear();
          var newDate = new Date(picker.$date);
          if (evt.keyCode === 37) {
            newDate.setYear(actualYear - 1);
          } else if (evt.keyCode === 38) {
            newDate.setYear(actualYear - 4);
          } else if (evt.keyCode === 39) {
            newDate.setYear(actualYear + 1);
          } else if (evt.keyCode === 40) {
            newDate.setYear(actualYear + 4);
          }
          if (!this.isDisabled(newDate)) {
            picker.select(newDate, true);
          }
        }
      } ];
      return {
        views: options.minView ? Array.prototype.slice.call(views, options.minView) : views,
        viewDate: viewDate
      };
    }
    return DatetimepickerViewsFactory;
  } ];
}).provider('$datetimepicker', function() {
  var defaults = this.defaults = {
    animation: 'am-fade',
    prefixClass: 'datepicker',
    placement: 'bottom-left',
    templateUrl: 'datetimepicker/datetimepicker.tpl.html',
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
    hourFormat: 'HH',
    minuteFormat: 'mm',
    secondFormat: 'ss',
    dayFormat: 'dd',
    monthFormat: 'MMM',
    yearFormat: 'yyyy',
    monthTitleFormat: 'MMMM yyyy',
    timeTitleFormat: 'dd MMM',
    yearTitleFormat: 'yyyy',
    strictFormat: false,
    autoclose: false,
    minDate: -Infinity,
    maxDate: +Infinity,
    startView: 1,
    minView: 0,
    startWeek: 0,
    daysOfWeekDisabled: '',
    hasToday: false,
    hasClear: false,
    length: 5,
    hourStep: 1,
    minuteStep: 5,
    secondStep: 5,
    roundDisplay: false,
    iconUp: 'nox-sort-up',
    iconDown: 'nox-sort-down',
    iconLeft: 'nox-sort-left',
    iconRight: 'nox-sort-right',
    arrowBehavior: 'pager'
  };
  this.$get = [ '$window', '$document', '$rootScope', '$sce', '$dateFormatter', 'datetimepickerViews', '$tooltip', '$timeout', function($window, $document, $rootScope, $sce, $dateFormatter, datetimepickerViews, $tooltip, $timeout) {
    var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
    var isTouch = 'createTouch' in $window.document && isNative;
    if (!defaults.lang) defaults.lang = $dateFormatter.getDefaultLocale();
    function DatetimepickerFactory(element, controller, config) {
      var $datepicker = $tooltip(element, angular.extend({}, defaults, config));
      var parentScope = config.scope;
      var options = $datepicker.$options;
      var scope = $datepicker.$scope;
      if (options.startView) options.startView -= options.minView;
      var pickerViews = datetimepickerViews($datepicker);
      $datepicker.$views = pickerViews.views;
      var viewDate = pickerViews.viewDate;
      scope.$mode = options.startView;
      scope.$iconLeft = options.iconLeft;
      scope.$iconRight = options.iconRight;
      scope.$hasToday = options.hasToday;
      scope.$hasClear = options.hasClear;
      var $picker = $datepicker.$views[scope.$mode];
      scope.$select = function(date) {
        $datepicker.select(date);
      };
      scope.$selectPane = function(value) {
        $datepicker.$selectPane(value);
      };
      scope.$selectTime = function(date, index) {
        $datepicker.selectTime(date, index);
      };
      scope.$arrowAction = function(value, index) {
        if (options.arrowBehavior === 'picker') {
          $datepicker.$setTimeByStep(value, index);
        } else {
          $datepicker.$moveIndex(value, index);
        }
      };
      scope.$toggleMode = function() {
        $datepicker.setMode((scope.$mode + 1) % $datepicker.$views.length);
      };
      scope.$setToday = function() {
        if (options.autoclose) {
          $datepicker.setMode(0);
          $datepicker.select(new Date());
        } else {
          $datepicker.select(new Date(), true);
        }
      };
      scope.$clear = function() {
        if (options.autoclose) {
          $datepicker.setMode(0);
          $datepicker.select(null);
        } else {
          $datepicker.select(null, true);
        }
      };
      $datepicker.update = function(date) {
        if (angular.isDate(date) && !isNaN(date.getTime())) {
          $datepicker.$date = date;
          $picker.update.call($picker, date);
        }
        $datepicker.$build(true);
      };
      $datepicker.updateDisabledDates = function(dateRanges) {
        options.disabledDateRanges = dateRanges;
        for (var i = 0, l = scope.rows.length; i < l; i++) {
          angular.forEach(scope.rows[i], $datepicker.$setDisabledEl);
        }
      };
      $datepicker.select = function(date, keep) {
        if (angular.isDate(date)) {
          if (!angular.isDate(controller.$dateValue) || isNaN(controller.$dateValue.getTime())) {
            controller.$dateValue = new Date(date);
          }
        } else {
          controller.$dateValue = null;
        }
        if (!scope.$mode || keep) {
          controller.$setViewValue(angular.copy(date));
          controller.$render();
          if (options.autoclose && !keep) {
            $timeout(function() {
              $datepicker.hide(true);
            });
          }
        } else {
          angular.extend(viewDate, {
            year: date.getFullYear(),
            month: date.getMonth(),
            date: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            millisecond: date.getMilliseconds()
          });
          $datepicker.setMode(scope.$mode - 1);
          $datepicker.$build();
        }
      };
      $datepicker.selectTime = function(date, index, keep) {
        if (!controller.$dateValue || isNaN(controller.$dateValue.getTime())) {
          controller.$dateValue = new Date();
        }
        if (!angular.isDate(date)) {
          date = new Date(date);
        }
        controller.$dateValue.setFullYear(date.getFullYear());
        controller.$dateValue.setMonth(date.getMonth());
        controller.$dateValue.setDate(date.getDate());
        if (index === 0) {
          controller.$dateValue.setHours(date.getHours());
        } else if (index === 1) {
          controller.$dateValue.setMinutes(date.getMinutes());
        } else if (index === 2) {
          controller.$dateValue.setSeconds(date.getSeconds());
        }
        controller.$setViewValue(angular.copy(controller.$dateValue));
        controller.$render();
        if (options.autoclose && !keep) {
          $timeout(function() {
            $datepicker.hide(true);
          });
        }
      };
      $datepicker.setMode = function(mode) {
        scope.$mode = mode;
        $picker = $datepicker.$views[scope.$mode];
        $datepicker.$build();
      };
      $datepicker.$build = function(pristine) {
        if (pristine === true && $picker.built) return;
        if (pristine === false && !$picker.built) return;
        $picker.build.call($picker);
      };
      function updateSelected(el) {
        el.selected = $datepicker.$isSelected(el.date);
      }
      $datepicker.$updateSelected = function() {
        for (var i = 0, l = scope.rows.length; i < l; i++) {
          angular.forEach(scope.rows[i], updateSelected);
        }
      };
      $datepicker.$isSelected = function(date) {
        return $picker.isSelected(date);
      };
      $datepicker.$setDisabledEl = function(el) {
        el.disabled = $picker.isDisabled(el.date);
      };
      $datepicker.$selectPane = function(value) {
        var steps = $picker.steps;
        var targetDate = new Date(Date.UTC(viewDate.year + (steps.year || 0) * value, viewDate.month + (steps.month || 0) * value, steps.date ? viewDate.date + steps.date * value : 1));
        angular.extend(viewDate, {
          year: targetDate.getUTCFullYear(),
          month: targetDate.getUTCMonth(),
          date: targetDate.getUTCDate()
        });
        $datepicker.$build();
      };
      $datepicker.$setTimeByStep = function(value, index) {
        var newDate = new Date($datepicker.$date);
        var hours = newDate.getHours();
        var minutes = newDate.getMinutes();
        var seconds = newDate.getSeconds();
        if (index === 0) {
          newDate.setHours(hours - parseInt(options.hourStep, 10) * value);
        } else if (index === 1) {
          newDate.setMinutes(minutes - parseInt(options.minuteStep, 10) * value);
        } else if (index === 2) {
          newDate.setSeconds(seconds - parseInt(options.secondStep, 10) * value);
        }
        $datepicker.selectTime(newDate, index, true);
      };
      $datepicker.$moveIndex = function(value, index) {
        var targetDate;
        if (index === 0) {
          targetDate = new Date(viewDate.year, viewDate.month, viewDate.date, viewDate.hour + value * options.length, viewDate.minute, viewDate.second);
          angular.extend(viewDate, {
            hour: targetDate.getHours()
          });
        } else if (index === 1) {
          targetDate = new Date(viewDate.year, viewDate.month, viewDate.date, viewDate.hour, viewDate.minute + value * options.length * options.minuteStep, viewDate.second);
          angular.extend(viewDate, {
            minute: targetDate.getMinutes()
          });
        } else if (index === 2) {
          targetDate = new Date(viewDate.year, viewDate.month, viewDate.date, viewDate.hour, viewDate.minute, viewDate.second + value * options.length * options.secondStep);
          angular.extend(viewDate, {
            second: targetDate.getSeconds()
          });
        }
        $datepicker.$build();
      };
      $datepicker.$onMouseDown = function(evt) {
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
      $datepicker.$onKeyDown = function(evt) {
        if (!/(38|37|39|40|13)/.test(evt.keyCode) || evt.shiftKey || evt.altKey) return;
        evt.preventDefault();
        evt.stopPropagation();
        if (evt.keyCode === 13) {
          if (!scope.$mode) {
            $datepicker.hide(true);
          } else {
            scope.$apply(function() {
              $datepicker.setMode(scope.$mode - 1);
            });
          }
          return;
        }
        $picker.onKeyDown(evt);
        parentScope.$digest();
      };
      function focusElement() {
        element[0].focus();
      }
      var _init = $datepicker.init;
      $datepicker.init = function() {
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
      var _destroy = $datepicker.destroy;
      $datepicker.destroy = function() {
        if (isNative && options.useNative) {
          element.off('click', focusElement);
        }
        _destroy();
      };
      var _show = $datepicker.show;
      $datepicker.show = function() {
        if (!isTouch && element.attr('readonly') || element.attr('disabled')) return;
        _show();
        $timeout(function() {
          if (!$datepicker.$isShown) return;
          $datepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $datepicker.$onMouseDown);
          if (options.keyboard) {
            element.on('keydown', $datepicker.$onKeyDown);
          }
        }, 0, false);
      };
      var _hide = $datepicker.hide;
      $datepicker.hide = function(blur) {
        if (!$datepicker.$isShown) return;
        $datepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $datepicker.$onMouseDown);
        if (options.keyboard) {
          element.off('keydown', $datepicker.$onKeyDown);
        }
        _hide(blur);
      };
      return $datepicker;
    }
    DatetimepickerFactory.defaults = defaults;
    return DatetimepickerFactory;
  } ];
}).directive('bsDatetimepicker', [ '$window', '$parse', '$q', '$dateFormatter', '$dateParser', '$datetimepicker', function($window, $parse, $q, $dateFormatter, $dateParser, $datetimepicker) {
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
      var datepicker = $datetimepicker(element, controller, options);
      options = datepicker.$options;
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
      if (attr.bsShow) {
        scope.$watch(attr.bsShow, function(newValue, oldValue) {
          if (!datepicker || !angular.isDefined(newValue)) return;
          if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(datepicker),?/i);
          if (newValue === true) {
            datepicker.show();
          } else {
            datepicker.hide();
          }
        });
      }
      angular.forEach([ 'minDate', 'maxDate' ], function(key) {
        if (angular.isDefined(attr[key])) {
          attr.$observe(key, function(newValue) {
            datepicker.$options[key] = dateParser.getDateForAttribute(key, newValue);
            if (!isNaN(datepicker.$options[key])) datepicker.$build(false);
            validateAgainstMinMaxDate(controller.$dateValue);
          });
        }
      });
      if (angular.isDefined(attr.dateFormat)) {
        attr.$observe('dateFormat', function(newValue) {
          datepicker.$options.dateFormat = newValue;
        });
      }
      scope.$watch(attr.ngModel, function(newValue, oldValue) {
        datepicker.update(controller.$dateValue);
      }, true);
      function normalizeDateRanges(ranges) {
        if (!ranges || !ranges.length) return null;
        return ranges;
      }
      if (angular.isDefined(attr.disabledDates)) {
        scope.$watch(attr.disabledDates, function(disabledRanges, previousValue) {
          disabledRanges = normalizeDateRanges(disabledRanges);
          previousValue = normalizeDateRanges(previousValue);
          if (disabledRanges) {
            datepicker.updateDisabledDates(disabledRanges);
          }
        });
      }
      function validateAgainstMinMaxDate(parsedDate) {
        if (!angular.isDate(parsedDate)) return;
        var isMinValid = isNaN(datepicker.$options.minDate) || parsedDate.getTime() >= datepicker.$options.minDate;
        var isMaxValid = isNaN(datepicker.$options.maxDate) || parsedDate.getTime() <= datepicker.$options.maxDate;
        var isValid = isMinValid && isMaxValid;
        controller.$setValidity('date', isValid);
        controller.$setValidity('min', isMinValid);
        controller.$setValidity('max', isMaxValid);
        if (isValid) controller.$dateValue = parsedDate;
      }
      controller.$parsers.unshift(function(viewValue) {
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
        return getDateFormattedString();
      });
      controller.$render = function() {
        element.val(getDateFormattedString());
      };
      function getDateFormattedString() {
        return !controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : formatDate(controller.$dateValue, options.dateFormat);
      }
      scope.$on('$destroy', function() {
        if (datepicker) datepicker.destroy();
        options = null;
        datepicker = null;
      });
    }
  };
} ]);