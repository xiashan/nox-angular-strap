/**
 * angular-strap
 * @version v2.3.10 - 2018-05-10
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes <olivier@mg-crea.com> (https://github.com/mgcrea)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, document, undefined) {
  'use strict';
  bsCompilerService.$inject = ["$q", "$http", "$injector", "$compile", "$controller", "$templateCache"];
  angular.module('mgcrea.ngStrap.tooltip', [ 'mgcrea.ngStrap.core', 'mgcrea.ngStrap.helpers.dimensions' ]).provider('$bsTooltip', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      customClass: '',
      prefixClass: 'tooltip',
      prefixEvent: 'tooltip',
      container: false,
      target: false,
      placement: 'top',
      templateUrl: 'tooltip/tooltip.tpl.html',
      template: '',
      titleTemplate: false,
      trigger: 'hover focus',
      keyboard: false,
      html: false,
      show: false,
      title: '',
      type: '',
      delay: 0,
      autoClose: false,
      bsEnabled: true,
      mouseDownPreventDefault: true,
      mouseDownStopPropagation: true,
      viewport: {
        selector: 'body',
        padding: 0
      }
    };
    this.$get = ["$window", "$rootScope", "$bsCompiler", "$q", "$templateCache", "$http", "$animate", "$sce", "bsDimensions", "$$rAF", "$timeout", function($window, $rootScope, $bsCompiler, $q, $templateCache, $http, $animate, $sce, dimensions, $$rAF, $timeout) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      var isTouch = 'createTouch' in $window.document && isNative;
      var $body = angular.element($window.document);
      function TooltipFactory(element, config) {
        var $tooltip = {};
        var options = $tooltip.$options = angular.extend({}, defaults, config);
        var promise = $tooltip.$promise = $bsCompiler.compile(options);
        var scope = $tooltip.$scope = options.scope && options.scope.$new() || $rootScope.$new();
        var nodeName = element[0].nodeName.toLowerCase();
        if (options.delay && angular.isString(options.delay)) {
          var split = options.delay.split(',').map(parseFloat);
          options.delay = split.length > 1 ? {
            show: split[0],
            hide: split[1]
          } : split[0];
        }
        $tooltip.$id = options.id || element.attr('id') || '';
        if (options.title) {
          scope.title = $sce.trustAsHtml(options.title);
        }
        scope.$setEnabled = function(isEnabled) {
          scope.$$postDigest(function() {
            $tooltip.setEnabled(isEnabled);
          });
        };
        scope.$hide = function() {
          scope.$$postDigest(function() {
            $tooltip.hide();
          });
        };
        scope.$show = function() {
          scope.$$postDigest(function() {
            $tooltip.show();
          });
        };
        scope.$toggle = function() {
          scope.$$postDigest(function() {
            $tooltip.toggle();
          });
        };
        $tooltip.$isShown = scope.$isShown = false;
        var timeout;
        var hoverState;
        var compileData;
        var tipElement;
        var tipContainer;
        var tipScope;
        promise.then(function(data) {
          compileData = data;
          $tooltip.init();
        });
        $tooltip.init = function() {
          if (options.delay && angular.isNumber(options.delay)) {
            options.delay = {
              show: options.delay,
              hide: options.delay
            };
          }
          if (options.container === 'self') {
            tipContainer = element;
          } else if (angular.isElement(options.container)) {
            tipContainer = options.container;
          } else if (options.container) {
            tipContainer = findElement(options.container);
          }
          bindTriggerEvents();
          if (options.target) {
            options.target = angular.isElement(options.target) ? options.target : findElement(options.target);
          }
          if (options.show) {
            scope.$$postDigest(function() {
              if (options.trigger === 'focus') {
                element[0].focus();
              } else {
                $tooltip.show();
              }
            });
          }
        };
        $tooltip.destroy = function() {
          unbindTriggerEvents();
          destroyTipElement();
          scope.$destroy();
        };
        $tooltip.enter = function() {
          clearTimeout(timeout);
          hoverState = 'in';
          if (!options.delay || !options.delay.show) {
            return $tooltip.show();
          }
          timeout = setTimeout(function() {
            if (hoverState === 'in') $tooltip.show();
          }, options.delay.show);
        };
        $tooltip.show = function() {
          if (!options.bsEnabled || $tooltip.$isShown) return;
          scope.$emit(options.prefixEvent + '.show.before', $tooltip);
          if (angular.isDefined(options.onBeforeShow) && angular.isFunction(options.onBeforeShow)) {
            options.onBeforeShow($tooltip);
          }
          var parent;
          var after;
          if (options.container) {
            parent = tipContainer;
            if (tipContainer[0].lastChild) {
              after = angular.element(tipContainer[0].lastChild);
            } else {
              after = null;
            }
          } else {
            parent = null;
            after = element;
          }
          if (tipElement) destroyTipElement();
          tipScope = $tooltip.$scope.$new();
          tipElement = $tooltip.$element = compileData.link(tipScope, function(clonedElement, scope) {});
          tipElement.css({
            top: '-9999px',
            left: '-9999px',
            right: 'auto',
            display: 'block',
            visibility: 'hidden'
          });
          if (options.animation) tipElement.addClass(options.animation);
          if (options.type) tipElement.addClass(options.prefixClass + '-' + options.type);
          if (options.customClass) tipElement.addClass(options.customClass);
          if (after) {
            after.after(tipElement);
          } else {
            parent.prepend(tipElement);
          }
          $tooltip.$isShown = scope.$isShown = true;
          safeDigest(scope);
          $tooltip.$applyPlacement();
          if (angular.version.minor <= 2) {
            $animate.enter(tipElement, parent, after, enterAnimateCallback);
          } else {
            $animate.enter(tipElement, parent, after).then(enterAnimateCallback);
          }
          safeDigest(scope);
          $$rAF(function() {
            if (tipElement) tipElement.css({
              visibility: 'visible'
            });
            if (options.keyboard) {
              if (options.trigger !== 'focus') {
                $tooltip.focus();
              }
              bindKeyboardEvents();
            }
          });
          if (options.autoClose) {
            bindAutoCloseEvents();
          }
        };
        function enterAnimateCallback() {
          scope.$emit(options.prefixEvent + '.show', $tooltip);
          if (angular.isDefined(options.onShow) && angular.isFunction(options.onShow)) {
            options.onShow($tooltip);
          }
        }
        $tooltip.leave = function() {
          clearTimeout(timeout);
          hoverState = 'out';
          if (!options.delay || !options.delay.hide) {
            return $tooltip.hide();
          }
          timeout = setTimeout(function() {
            if (hoverState === 'out') {
              $tooltip.hide();
            }
          }, options.delay.hide);
        };
        var _blur;
        var _tipToHide;
        $tooltip.hide = function(blur) {
          if (!$tooltip.$isShown) return;
          scope.$emit(options.prefixEvent + '.hide.before', $tooltip);
          if (angular.isDefined(options.onBeforeHide) && angular.isFunction(options.onBeforeHide)) {
            options.onBeforeHide($tooltip);
          }
          _blur = blur;
          _tipToHide = tipElement;
          if (angular.version.minor <= 2) {
            $animate.leave(tipElement, leaveAnimateCallback);
          } else {
            $animate.leave(tipElement).then(leaveAnimateCallback);
          }
          $tooltip.$isShown = scope.$isShown = false;
          safeDigest(scope);
          if (options.keyboard && tipElement !== null) {
            unbindKeyboardEvents();
          }
          if (options.autoClose && tipElement !== null) {
            unbindAutoCloseEvents();
          }
        };
        function leaveAnimateCallback() {
          scope.$emit(options.prefixEvent + '.hide', $tooltip);
          if (angular.isDefined(options.onHide) && angular.isFunction(options.onHide)) {
            options.onHide($tooltip);
          }
          if (tipElement === _tipToHide) {
            if (_blur && options.trigger === 'focus') {
              return element[0].blur();
            }
            destroyTipElement();
          }
        }
        $tooltip.toggle = function(evt) {
          if (evt) {
            evt.preventDefault();
          }
          if ($tooltip.$isShown) {
            $tooltip.leave();
          } else {
            $tooltip.enter();
          }
        };
        $tooltip.focus = function() {
          tipElement[0].focus();
        };
        $tooltip.setEnabled = function(isEnabled) {
          options.bsEnabled = isEnabled;
        };
        $tooltip.setViewport = function(viewport) {
          options.viewport = viewport;
        };
        $tooltip.$applyPlacement = function() {
          if (!tipElement) return;
          var placement = options.placement;
          var autoToken = /\s?auto?\s?/i;
          var autoPlace = autoToken.test(placement);
          if (autoPlace) {
            placement = placement.replace(autoToken, '') || defaults.placement;
          }
          tipElement.addClass(options.placement);
          var elementPosition = getPosition();
          var tipWidth = tipElement.prop('offsetWidth');
          var tipHeight = tipElement.prop('offsetHeight');
          $tooltip.$viewport = options.viewport && findElement(options.viewport.selector || options.viewport);
          if (autoPlace) {
            var originalPlacement = placement;
            var viewportPosition = getPosition($tooltip.$viewport);
            if (/bottom/.test(originalPlacement) && elementPosition.bottom + tipHeight > viewportPosition.bottom) {
              placement = originalPlacement.replace('bottom', 'top');
            } else if (/top/.test(originalPlacement) && elementPosition.top - tipHeight < viewportPosition.top) {
              placement = originalPlacement.replace('top', 'bottom');
            }
            if (/left/.test(originalPlacement) && elementPosition.left - tipWidth < viewportPosition.left) {
              placement = placement.replace('left', 'right');
            } else if (/right/.test(originalPlacement) && elementPosition.right + tipWidth > viewportPosition.width) {
              placement = placement.replace('right', 'left');
            }
            tipElement.removeClass(originalPlacement).addClass(placement);
          }
          var tipPosition = getCalculatedOffset(placement, elementPosition, tipWidth, tipHeight);
          applyPlacement(tipPosition, placement);
        };
        $tooltip.$onKeyUp = function(evt) {
          if (evt.which === 27 && $tooltip.$isShown) {
            $tooltip.hide();
            evt.stopPropagation();
          }
        };
        $tooltip.$onFocusKeyUp = function(evt) {
          if (evt.which === 27) {
            element[0].blur();
            evt.stopPropagation();
          }
        };
        $tooltip.$onFocusElementMouseDown = function(evt) {
          if (options.mouseDownPreventDefault) {
            evt.preventDefault();
          }
          if (options.mouseDownStopPropagation) {
            evt.stopPropagation();
          }
          if ($tooltip.$isShown) {
            element[0].focus();
            element[0].blur();
          } else {
            element[0].focus();
          }
        };
        function bindTriggerEvents() {
          var triggers = options.trigger.split(' ');
          angular.forEach(triggers, function(trigger) {
            if (trigger === 'click' || trigger === 'contextmenu') {
              element.on(trigger, $tooltip.toggle);
            } else if (trigger !== 'manual') {
              element.on(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enter);
              element.on(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
              if (nodeName === 'button' && trigger !== 'hover' || nodeName === 'input') {
                element.on(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
              }
            }
          });
        }
        function unbindTriggerEvents() {
          var triggers = options.trigger.split(' ');
          for (var i = triggers.length; i--; ) {
            var trigger = triggers[i];
            if (trigger === 'click' || trigger === 'contextmenu') {
              element.off(trigger, $tooltip.toggle);
            } else if (trigger !== 'manual') {
              element.off(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enter);
              element.off(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
              if (nodeName === 'button' && trigger !== 'hover' || nodeName === 'input') {
                element.off(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
              }
            }
          }
        }
        function bindKeyboardEvents() {
          if (options.trigger !== 'focus') {
            tipElement.on('keyup', $tooltip.$onKeyUp);
          } else {
            element.on('keyup', $tooltip.$onFocusKeyUp);
          }
        }
        function unbindKeyboardEvents() {
          if (options.trigger !== 'focus') {
            tipElement.off('keyup', $tooltip.$onKeyUp);
          } else {
            element.off('keyup', $tooltip.$onFocusKeyUp);
          }
        }
        var _autoCloseEventsBinded = false;
        function bindAutoCloseEvents() {
          $timeout(function() {
            tipElement.on('click', stopEventPropagation);
            $body.on('click', $tooltip.hide);
            _autoCloseEventsBinded = true;
          }, 0, false);
        }
        function unbindAutoCloseEvents() {
          if (_autoCloseEventsBinded) {
            tipElement.off('click', stopEventPropagation);
            $body.off('click', $tooltip.hide);
            _autoCloseEventsBinded = false;
          }
        }
        function stopEventPropagation(event) {
          event.stopPropagation();
        }
        function getPosition($element) {
          $element = $element || (options.target || element);
          var el = $element[0];
          var isBody = el.tagName === 'BODY';
          var elRect = el.getBoundingClientRect();
          var rect = {};
          for (var p in elRect) {
            rect[p] = elRect[p];
          }
          if (rect.width === null) {
            rect = angular.extend({}, rect, {
              width: elRect.right - elRect.left,
              height: elRect.bottom - elRect.top
            });
          }
          var elOffset = isBody ? {
            top: 0,
            left: 0
          } : dimensions.offset(el);
          var scroll = {
            scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.prop('scrollTop') || 0
          };
          var outerDims = isBody ? {
            width: document.documentElement.clientWidth,
            height: $window.innerHeight
          } : null;
          return angular.extend({}, rect, scroll, outerDims, elOffset);
        }
        function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
          var offset;
          var split = placement.split('-');
          switch (split[0]) {
           case 'right':
            offset = {
              top: position.top + position.height / 2 - actualHeight / 2,
              left: position.left + position.width
            };
            break;

           case 'bottom':
            offset = {
              top: position.top + position.height,
              left: position.left + position.width / 2 - actualWidth / 2
            };
            break;

           case 'left':
            offset = {
              top: position.top + position.height / 2 - actualHeight / 2,
              left: position.left - actualWidth
            };
            break;

           default:
            offset = {
              top: position.top - actualHeight,
              left: position.left + position.width / 2 - actualWidth / 2
            };
            break;
          }
          if (!split[1]) {
            return offset;
          }
          if (split[0] === 'top' || split[0] === 'bottom') {
            switch (split[1]) {
             case 'left':
              offset.left = position.left;
              break;

             case 'right':
              offset.left = position.left + position.width - actualWidth;
              break;

             default:
              break;
            }
          } else if (split[0] === 'left' || split[0] === 'right') {
            switch (split[1]) {
             case 'top':
              offset.top = position.top - actualHeight + position.height;
              break;

             case 'bottom':
              offset.top = position.top;
              break;

             default:
              break;
            }
          }
          return offset;
        }
        function applyPlacement(offset, placement) {
          var tip = tipElement[0];
          var width = tip.offsetWidth;
          var height = tip.offsetHeight;
          var marginTop = parseInt(dimensions.css(tip, 'margin-top'), 10);
          var marginLeft = parseInt(dimensions.css(tip, 'margin-left'), 10);
          if (isNaN(marginTop)) marginTop = 0;
          if (isNaN(marginLeft)) marginLeft = 0;
          offset.top = offset.top + marginTop;
          offset.left = offset.left + marginLeft;
          dimensions.setOffset(tip, angular.extend({
            using: function(props) {
              tipElement.css({
                top: Math.round(props.top) + 'px',
                left: Math.round(props.left) + 'px',
                right: ''
              });
            }
          }, offset), 0);
          var actualWidth = tip.offsetWidth;
          var actualHeight = tip.offsetHeight;
          if (placement === 'top' && actualHeight !== height) {
            offset.top = offset.top + height - actualHeight;
          }
          if (/top-left|top-right|bottom-left|bottom-right/.test(placement)) return;
          var delta = getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);
          if (delta.left) {
            offset.left += delta.left;
          } else {
            offset.top += delta.top;
          }
          dimensions.setOffset(tip, offset);
          if (/top|right|bottom|left/.test(placement)) {
            var isVertical = /top|bottom/.test(placement);
            var arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
            var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';
            replaceArrow(arrowDelta, tip[arrowOffsetPosition], isVertical);
          }
        }
        function getViewportAdjustedDelta(placement, position, actualWidth, actualHeight) {
          var delta = {
            top: 0,
            left: 0
          };
          if (!$tooltip.$viewport) return delta;
          var viewportPadding = options.viewport && options.viewport.padding || 0;
          var viewportDimensions = getPosition($tooltip.$viewport);
          if (/right|left/.test(placement)) {
            var topEdgeOffset = position.top - viewportPadding - viewportDimensions.scroll;
            var bottomEdgeOffset = position.top + viewportPadding - viewportDimensions.scroll + actualHeight;
            if (topEdgeOffset < viewportDimensions.top) {
              delta.top = viewportDimensions.top - topEdgeOffset;
            } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) {
              delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
            }
          } else {
            var leftEdgeOffset = position.left - viewportPadding;
            var rightEdgeOffset = position.left + viewportPadding + actualWidth;
            if (leftEdgeOffset < viewportDimensions.left) {
              delta.left = viewportDimensions.left - leftEdgeOffset;
            } else if (rightEdgeOffset > viewportDimensions.right) {
              delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
            }
          }
          return delta;
        }
        function replaceArrow(delta, dimension, isHorizontal) {
          var $arrow = findElement('.tooltip-arrow, .arrow', tipElement[0]);
          $arrow.css(isHorizontal ? 'left' : 'top', 50 * (1 - delta / dimension) + '%').css(isHorizontal ? 'top' : 'left', '');
        }
        function destroyTipElement() {
          clearTimeout(timeout);
          if ($tooltip.$isShown && tipElement !== null) {
            if (options.autoClose) {
              unbindAutoCloseEvents();
            }
            if (options.keyboard) {
              unbindKeyboardEvents();
            }
          }
          if (tipScope) {
            tipScope.$destroy();
            tipScope = null;
          }
          if (tipElement) {
            tipElement.remove();
            tipElement = $tooltip.$element = null;
          }
        }
        return $tooltip;
      }
      function safeDigest(scope) {
        scope.$$phase || scope.$root && scope.$root.$$phase || scope.$digest();
      }
      function findElement(query, element) {
        return angular.element((element || document).querySelectorAll(query));
      }
      return TooltipFactory;
    } ];
  }).directive('bsTooltip', ["$window", "$location", "$sce", "$parse", "$bsTooltip", "$$rAF", function($window, $location, $sce, $parse, $tooltip, $$rAF) {
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {
        var tooltip;
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'titleTemplate', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'backdropAnimation', 'type', 'customClass', 'id' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container' ], function(key) {
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
        var dataTarget = element.attr('data-target');
        if (angular.isDefined(dataTarget)) {
          if (falseValueRegExp.test(dataTarget)) {
            options.target = false;
          } else {
            options.target = dataTarget;
          }
        }
        if (!scope.hasOwnProperty('title')) {
          scope.title = '';
        }
        attr.$observe('title', function(newValue) {
          if (angular.isDefined(newValue) || !scope.hasOwnProperty('title')) {
            var oldValue = scope.title;
            scope.title = $sce.trustAsHtml(newValue);
            if (angular.isDefined(oldValue)) {
              $$rAF(function() {
                if (tooltip) tooltip.$applyPlacement();
              });
            }
          }
        });
        attr.$observe('disabled', function(newValue) {
          if (newValue && tooltip.$isShown) {
            tooltip.hide();
          }
        });
        if (attr.bsTooltip) {
          scope.$watch(attr.bsTooltip, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.title = newValue;
            }
            if (angular.isDefined(oldValue)) {
              $$rAF(function() {
                if (tooltip) tooltip.$applyPlacement();
              });
            }
          }, true);
        }
        if (attr.bsShow) {
          scope.$watch(attr.bsShow, function(newValue, oldValue) {
            if (!tooltip || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(tooltip),?/i);
            if (newValue === true) {
              tooltip.show();
            } else {
              tooltip.hide();
            }
          });
        }
        if (attr.bsEnabled) {
          scope.$watch(attr.bsEnabled, function(newValue, oldValue) {
            if (!tooltip || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|1|,?(tooltip),?/i);
            if (newValue === false) {
              tooltip.setEnabled(false);
            } else {
              tooltip.setEnabled(true);
            }
          });
        }
        if (attr.viewport) {
          scope.$watch(attr.viewport, function(newValue) {
            if (!tooltip || !angular.isDefined(newValue)) return;
            tooltip.setViewport(newValue);
          });
        }
        tooltip = $tooltip(element, options);
        scope.$on('$destroy', function() {
          if (tooltip) tooltip.destroy();
          options = null;
          tooltip = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.timepicker', [ 'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'mgcrea.ngStrap.tooltip' ]).provider('$bsTimepicker', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      defaultDate: 'auto',
      prefixClass: 'timepicker',
      placement: 'bottom-left',
      templateUrl: 'timepicker/timepicker.tpl.html',
      trigger: 'focus',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      useNative: true,
      timeType: 'date',
      timeFormat: 'shortTime',
      timezone: null,
      modelTimeFormat: null,
      autoclose: false,
      minTime: -Infinity,
      maxTime: +Infinity,
      length: 5,
      hourStep: 1,
      minuteStep: 5,
      secondStep: 5,
      roundDisplay: false,
      iconUp: 'nox-sort-up',
      iconDown: 'nox-sort-down',
      arrowBehavior: 'pager'
    };
    this.$get = ["$window", "$document", "$rootScope", "$sce", "$bsDateFormatter", "$bsTooltip", "$timeout", function($window, $document, $rootScope, $sce, $dateFormatter, $tooltip, $timeout) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      var isTouch = 'createTouch' in $window.document && isNative;
      if (!defaults.lang) {
        defaults.lang = $dateFormatter.getDefaultLocale();
      }
      function timepickerFactory(element, controller, config) {
        var $timepicker = $tooltip(element, angular.extend({}, defaults, config));
        var parentScope = config.scope;
        var options = $timepicker.$options;
        var scope = $timepicker.$scope;
        var lang = options.lang;
        var formatDate = function(date, format, timezone) {
          return $dateFormatter.formatDate(date, format, lang, timezone);
        };
        function floorMinutes(time) {
          var coeff = 1e3 * 60 * options.minuteStep;
          return new Date(Math.floor(time.getTime() / coeff) * coeff);
        }
        var selectedIndex = 0;
        var defaultDate = options.roundDisplay ? floorMinutes(new Date()) : new Date();
        var startDate = controller.$dateValue || defaultDate;
        var viewDate = {
          hour: startDate.getHours(),
          meridian: startDate.getHours() < 12,
          minute: startDate.getMinutes(),
          second: startDate.getSeconds(),
          millisecond: startDate.getMilliseconds()
        };
        var format = $dateFormatter.getDatetimeFormat(options.timeFormat, lang);
        var hoursFormat = $dateFormatter.hoursFormat(format);
        var timeSeparator = $dateFormatter.timeSeparator(format);
        var minutesFormat = $dateFormatter.minutesFormat(format);
        var secondsFormat = $dateFormatter.secondsFormat(format);
        var showSeconds = $dateFormatter.showSeconds(format);
        var showAM = $dateFormatter.showAM(format);
        scope.$iconUp = options.iconUp;
        scope.$iconDown = options.iconDown;
        scope.$select = function(date, index) {
          $timepicker.select(date, index);
        };
        scope.$moveIndex = function(value, index) {
          $timepicker.$moveIndex(value, index);
        };
        scope.$switchMeridian = function(date) {
          $timepicker.switchMeridian(date);
        };
        $timepicker.update = function(date) {
          if (angular.isDate(date) && !isNaN(date.getTime())) {
            $timepicker.$date = date;
            angular.extend(viewDate, {
              hour: date.getHours(),
              minute: date.getMinutes(),
              second: date.getSeconds(),
              millisecond: date.getMilliseconds()
            });
            $timepicker.$build();
          } else if (!$timepicker.$isBuilt) {
            $timepicker.$build();
          }
        };
        $timepicker.select = function(date, index, keep) {
          if (!controller.$dateValue || isNaN(controller.$dateValue.getTime())) {
            controller.$dateValue = options.defaultDate === 'today' ? new Date() : new Date(1970, 0, 1);
          }
          if (!angular.isDate(date)) date = new Date(date);
          if (index === 0) controller.$dateValue.setHours(date.getHours()); else if (index === 1) controller.$dateValue.setMinutes(date.getMinutes()); else if (index === 2) controller.$dateValue.setSeconds(date.getSeconds());
          controller.$setViewValue(angular.copy(controller.$dateValue));
          controller.$render();
          if (options.autoclose && !keep) {
            $timeout(function() {
              $timepicker.hide(true);
            });
          }
        };
        $timepicker.switchMeridian = function(date) {
          if (!controller.$dateValue || isNaN(controller.$dateValue.getTime())) {
            return;
          }
          var hours = (date || controller.$dateValue).getHours();
          controller.$dateValue.setHours(hours < 12 ? hours + 12 : hours - 12);
          controller.$setViewValue(angular.copy(controller.$dateValue));
          controller.$render();
        };
        $timepicker.$build = function() {
          var i;
          var midIndex = scope.midIndex = parseInt(options.length / 2, 10);
          var hours = [];
          var hour;
          for (i = 0; i < options.length; i++) {
            hour = new Date(1970, 0, 1, viewDate.hour - (midIndex - i) * options.hourStep);
            hours.push({
              date: hour,
              label: formatDate(hour, hoursFormat),
              selected: $timepicker.$date && $timepicker.$isSelected(hour, 0),
              disabled: $timepicker.$isDisabled(hour, 0)
            });
          }
          var minutes = [];
          var minute;
          for (i = 0; i < options.length; i++) {
            minute = new Date(1970, 0, 1, 0, viewDate.minute - (midIndex - i) * options.minuteStep);
            minutes.push({
              date: minute,
              label: formatDate(minute, minutesFormat),
              selected: $timepicker.$date && $timepicker.$isSelected(minute, 1),
              disabled: $timepicker.$isDisabled(minute, 1)
            });
          }
          var seconds = [];
          var second;
          for (i = 0; i < options.length; i++) {
            second = new Date(1970, 0, 1, 0, 0, viewDate.second - (midIndex - i) * options.secondStep);
            seconds.push({
              date: second,
              label: formatDate(second, secondsFormat),
              selected: $timepicker.$date && $timepicker.$isSelected(second, 2),
              disabled: $timepicker.$isDisabled(second, 2)
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
          scope.rows = rows;
          scope.showSeconds = showSeconds;
          scope.showAM = showAM;
          scope.isAM = ($timepicker.$date || hours[midIndex].date).getHours() < 12;
          scope.timeSeparator = timeSeparator;
          $timepicker.$isBuilt = true;
        };
        $timepicker.$isSelected = function(date, index) {
          if (!$timepicker.$date) return false; else if (index === 0) {
            return date.getHours() === $timepicker.$date.getHours();
          } else if (index === 1) {
            return date.getMinutes() === $timepicker.$date.getMinutes();
          } else if (index === 2) {
            return date.getSeconds() === $timepicker.$date.getSeconds();
          }
        };
        $timepicker.$isDisabled = function(date, index) {
          var selectedTime;
          if (index === 0) {
            selectedTime = date.getTime() + viewDate.minute * 6e4 + viewDate.second * 1e3;
          } else if (index === 1) {
            selectedTime = date.getTime() + viewDate.hour * 36e5 + viewDate.second * 1e3;
          } else if (index === 2) {
            selectedTime = date.getTime() + viewDate.hour * 36e5 + viewDate.minute * 6e4;
          }
          return selectedTime < options.minTime * 1 || selectedTime > options.maxTime * 1;
        };
        scope.$arrowAction = function(value, index) {
          if (options.arrowBehavior === 'picker') {
            $timepicker.$setTimeByStep(value, index);
          } else {
            $timepicker.$moveIndex(value, index);
          }
        };
        $timepicker.$setTimeByStep = function(value, index) {
          var newDate = new Date($timepicker.$date || startDate);
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
          $timepicker.select(newDate, index, true);
        };
        $timepicker.$moveIndex = function(value, index) {
          var targetDate;
          if (index === 0) {
            targetDate = new Date(1970, 0, 1, viewDate.hour + value * options.length, viewDate.minute, viewDate.second);
            angular.extend(viewDate, {
              hour: targetDate.getHours()
            });
          } else if (index === 1) {
            targetDate = new Date(1970, 0, 1, viewDate.hour, viewDate.minute + value * options.length * options.minuteStep, viewDate.second);
            angular.extend(viewDate, {
              minute: targetDate.getMinutes()
            });
          } else if (index === 2) {
            targetDate = new Date(1970, 0, 1, viewDate.hour, viewDate.minute, viewDate.second + value * options.length * options.secondStep);
            angular.extend(viewDate, {
              second: targetDate.getSeconds()
            });
          }
          $timepicker.$build();
        };
        $timepicker.$onMouseDown = function(evt) {
          if (evt.target.nodeName.toLowerCase() !== 'input') evt.preventDefault();
          evt.stopPropagation();
          if (isTouch) {
            var targetEl = angular.element(evt.target);
            if (targetEl[0].nodeName.toLowerCase() !== 'button') {
              targetEl = targetEl.parent();
            }
            targetEl.triggerHandler('click');
          }
        };
        $timepicker.$onKeyDown = function(evt) {
          if (!/(38|37|39|40|13)/.test(evt.keyCode) || evt.shiftKey || evt.altKey) return;
          evt.preventDefault();
          evt.stopPropagation();
          if (evt.keyCode === 13) {
            $timepicker.hide(true);
            return;
          }
          var newDate = new Date($timepicker.$date);
          var hours = newDate.getHours();
          var hoursLength = formatDate(newDate, hoursFormat).length;
          var minutes = newDate.getMinutes();
          var minutesLength = formatDate(newDate, minutesFormat).length;
          var seconds = newDate.getSeconds();
          var secondsLength = formatDate(newDate, secondsFormat).length;
          var sepLength = 1;
          var lateralMove = /(37|39)/.test(evt.keyCode);
          var count = 2 + showSeconds * 1 + showAM * 1;
          if (lateralMove) {
            if (evt.keyCode === 37) selectedIndex = selectedIndex < 1 ? count - 1 : selectedIndex - 1; else if (evt.keyCode === 39) selectedIndex = selectedIndex < count - 1 ? selectedIndex + 1 : 0;
          }
          var selectRange = [ 0, hoursLength ];
          var incr = 0;
          if (evt.keyCode === 38) incr = -1;
          if (evt.keyCode === 40) incr = +1;
          var isSeconds = selectedIndex === 2 && showSeconds;
          var isMeridian = selectedIndex === 2 && !showSeconds || selectedIndex === 3 && showSeconds;
          if (selectedIndex === 0) {
            newDate.setHours(hours + incr * parseInt(options.hourStep, 10));
            hoursLength = formatDate(newDate, hoursFormat).length;
            selectRange = [ 0, hoursLength ];
          } else if (selectedIndex === 1) {
            newDate.setMinutes(minutes + incr * parseInt(options.minuteStep, 10));
            minutesLength = formatDate(newDate, minutesFormat).length;
            selectRange = [ hoursLength + sepLength, minutesLength ];
          } else if (isSeconds) {
            newDate.setSeconds(seconds + incr * parseInt(options.secondStep, 10));
            secondsLength = formatDate(newDate, secondsFormat).length;
            selectRange = [ hoursLength + sepLength + minutesLength + sepLength, secondsLength ];
          } else if (isMeridian) {
            if (!lateralMove) $timepicker.switchMeridian();
            selectRange = [ hoursLength + sepLength + minutesLength + sepLength + (secondsLength + sepLength) * showSeconds, 2 ];
          }
          $timepicker.select(newDate, selectedIndex, true);
          createSelection(selectRange[0], selectRange[1]);
          parentScope.$digest();
        };
        function createSelection(start, length) {
          var end = start + length;
          if (element[0].createTextRange) {
            var selRange = element[0].createTextRange();
            selRange.collapse(true);
            selRange.moveStart('character', start);
            selRange.moveEnd('character', end);
            selRange.select();
          } else if (element[0].setSelectionRange) {
            element[0].setSelectionRange(start, end);
          } else if (angular.isUndefined(element[0].selectionStart)) {
            element[0].selectionStart = start;
            element[0].selectionEnd = end;
          }
        }
        function focusElement() {
          element[0].focus();
        }
        var _init = $timepicker.init;
        $timepicker.init = function() {
          if (isNative && options.useNative) {
            element.prop('type', 'time');
            element.css('-webkit-appearance', 'textfield');
            return;
          } else if (isTouch) {
            element.prop('type', 'text');
            element.attr('readonly', 'true');
            element.on('click', focusElement);
          }
          _init();
        };
        var _destroy = $timepicker.destroy;
        $timepicker.destroy = function() {
          if (isNative && options.useNative) {
            element.off('click', focusElement);
          }
          _destroy();
        };
        var _show = $timepicker.show;
        $timepicker.show = function() {
          if (!isTouch && element.attr('readonly') || element.attr('disabled')) return;
          _show();
          $timeout(function() {
            if ($timepicker.$element) $timepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
            if (options.keyboard) {
              if (element) element.on('keydown', $timepicker.$onKeyDown);
            }
          }, 0, false);
        };
        var _hide = $timepicker.hide;
        $timepicker.hide = function(blur) {
          if (!$timepicker.$isShown) return;
          if ($timepicker.$element) $timepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
          if (options.keyboard) {
            if (element) element.off('keydown', $timepicker.$onKeyDown);
          }
          _hide(blur);
        };
        return $timepicker;
      }
      timepickerFactory.defaults = defaults;
      return timepickerFactory;
    } ];
  }).directive('bsTimepicker', ["$window", "$parse", "$q", "$bsDateFormatter", "$bsDateParser", "$bsTimepicker", function($window, $parse, $q, $dateFormatter, $dateParser, $timepicker) {
    var defaults = $timepicker.defaults;
    var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'autoclose', 'timeType', 'timeFormat', 'timezone', 'modelTimeFormat', 'useNative', 'hourStep', 'minuteStep', 'secondStep', 'length', 'arrowBehavior', 'iconUp', 'iconDown', 'roundDisplay', 'id', 'prefixClass', 'prefixEvent', 'defaultDate' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'autoclose', 'useNative', 'roundDisplay' ], function(key) {
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
        if (isNative && (options.useNative || defaults.useNative)) options.timeFormat = 'HH:mm';
        var timepicker = $timepicker(element, controller, options);
        options = timepicker.$options;
        var lang = options.lang;
        var formatDate = function(date, format, timezone) {
          return $dateFormatter.formatDate(date, format, lang, timezone);
        };
        if (attr.bsShow) {
          scope.$watch(attr.bsShow, function(newValue, oldValue) {
            if (!timepicker || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(timepicker),?/i);
            if (newValue === true) {
              timepicker.show();
            } else {
              timepicker.hide();
            }
          });
        }
        var dateParser = $dateParser({
          format: options.timeFormat,
          lang: lang
        });
        angular.forEach([ 'minTime', 'maxTime' ], function(key) {
          if (angular.isDefined(attr[key])) {
            attr.$observe(key, function(newValue) {
              timepicker.$options[key] = dateParser.getTimeForAttribute(key, newValue);
              if (!isNaN(timepicker.$options[key])) timepicker.$build();
              validateAgainstMinMaxTime(controller.$dateValue);
            });
          }
        });
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          timepicker.update(controller.$dateValue);
        }, true);
        function validateAgainstMinMaxTime(parsedTime) {
          if (!angular.isDate(parsedTime)) return;
          var isMinValid = isNaN(options.minTime) || new Date(parsedTime.getTime()).setFullYear(1970, 0, 1) >= options.minTime;
          var isMaxValid = isNaN(options.maxTime) || new Date(parsedTime.getTime()).setFullYear(1970, 0, 1) <= options.maxTime;
          var isValid = isMinValid && isMaxValid;
          controller.$setValidity('date', isValid);
          controller.$setValidity('min', isMinValid);
          controller.$setValidity('max', isMaxValid);
          if (!isValid) {
            return;
          }
          controller.$dateValue = parsedTime;
        }
        controller.$parsers.unshift(function(viewValue) {
          var date;
          if (!viewValue) {
            controller.$setValidity('date', true);
            return null;
          }
          var parsedTime = angular.isDate(viewValue) ? viewValue : dateParser.parse(viewValue, controller.$dateValue);
          if (!parsedTime || isNaN(parsedTime.getTime())) {
            controller.$setValidity('date', false);
            return undefined;
          }
          validateAgainstMinMaxTime(parsedTime);
          if (options.timeType === 'string') {
            date = dateParser.timezoneOffsetAdjust(parsedTime, options.timezone, true);
            return formatDate(date, options.modelTimeFormat || options.timeFormat);
          }
          date = dateParser.timezoneOffsetAdjust(controller.$dateValue, options.timezone, true);
          if (options.timeType === 'number') {
            return date.getTime();
          } else if (options.timeType === 'unix') {
            return date.getTime() / 1e3;
          } else if (options.timeType === 'iso') {
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
          } else if (options.timeType === 'string') {
            date = dateParser.parse(modelValue, null, options.modelTimeFormat);
          } else if (options.timeType === 'unix') {
            date = new Date(modelValue * 1e3);
          } else {
            date = new Date(modelValue);
          }
          controller.$dateValue = dateParser.timezoneOffsetAdjust(date, options.timezone);
          return getTimeFormattedString();
        });
        controller.$render = function() {
          element.val(getTimeFormattedString());
        };
        function getTimeFormattedString() {
          return !controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : formatDate(controller.$dateValue, options.timeFormat);
        }
        scope.$on('$destroy', function() {
          if (timepicker) timepicker.destroy();
          options = null;
          timepicker = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.tab', []).provider('$bsTab', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      template: 'tab/tab.tpl.html',
      navClass: 'nav-tabs',
      activeClass: 'active'
    };
    var controller = this.controller = function($scope, $element, $attrs) {
      var self = this;
      self.$options = angular.copy(defaults);
      angular.forEach([ 'animation', 'navClass', 'activeClass' ], function(key) {
        if (angular.isDefined($attrs[key])) self.$options[key] = $attrs[key];
      });
      $scope.$navClass = self.$options.navClass;
      $scope.$activeClass = self.$options.activeClass;
      self.$panes = $scope.$panes = [];
      self.$activePaneChangeListeners = self.$viewChangeListeners = [];
      self.$push = function(pane) {
        if (angular.isUndefined(self.$panes.$active)) {
          $scope.$setActive(pane.name || 0);
        }
        self.$panes.push(pane);
      };
      self.$remove = function(pane) {
        var index = self.$panes.indexOf(pane);
        var active = self.$panes.$active;
        var activeIndex;
        if (angular.isString(active)) {
          activeIndex = self.$panes.map(function(pane) {
            return pane.name;
          }).indexOf(active);
        } else {
          activeIndex = self.$panes.$active;
        }
        self.$panes.splice(index, 1);
        if (index < activeIndex) {
          activeIndex--;
        } else if (index === activeIndex && activeIndex === self.$panes.length) {
          activeIndex--;
        }
        if (activeIndex >= 0 && activeIndex < self.$panes.length) {
          self.$setActive(self.$panes[activeIndex].name || activeIndex);
        } else {
          self.$setActive();
        }
      };
      self.$setActive = $scope.$setActive = function(value) {
        self.$panes.$active = value;
        self.$activePaneChangeListeners.forEach(function(fn) {
          fn();
        });
      };
      self.$isActive = $scope.$isActive = function($pane, $index) {
        return self.$panes.$active === $pane.name || self.$panes.$active === $index;
      };
    };
    this.$get = function() {
      var $tab = {};
      $tab.defaults = defaults;
      $tab.controller = controller;
      return $tab;
    };
  }).directive('bsTabs', ["$window", "$animate", "$bsTab", "$parse", function($window, $animate, $tab, $parse) {
    var defaults = $tab.defaults;
    return {
      require: [ '?ngModel', 'bsTabs' ],
      transclude: true,
      scope: true,
      controller: [ '$scope', '$element', '$attrs', $tab.controller ],
      templateUrl: function(element, attr) {
        return attr.template || defaults.template;
      },
      link: function postLink(scope, element, attrs, controllers) {
        var ngModelCtrl = controllers[0];
        var bsTabsCtrl = controllers[1];
        if (ngModelCtrl) {
          bsTabsCtrl.$activePaneChangeListeners.push(function() {
            ngModelCtrl.$setViewValue(bsTabsCtrl.$panes.$active);
          });
          ngModelCtrl.$formatters.push(function(modelValue) {
            bsTabsCtrl.$setActive(modelValue);
            return modelValue;
          });
        }
        if (attrs.bsActivePane) {
          var parsedBsActivePane = $parse(attrs.bsActivePane);
          bsTabsCtrl.$activePaneChangeListeners.push(function() {
            parsedBsActivePane.assign(scope, bsTabsCtrl.$panes.$active);
          });
          scope.$watch(attrs.bsActivePane, function(newValue, oldValue) {
            bsTabsCtrl.$setActive(newValue);
          }, true);
        }
      }
    };
  } ]).directive('bsPane', ["$window", "$animate", "$sce", function($window, $animate, $sce) {
    return {
      require: [ '^?ngModel', '^bsTabs' ],
      scope: true,
      link: function postLink(scope, element, attrs, controllers) {
        var bsTabsCtrl = controllers[1];
        element.addClass('tab-pane');
        attrs.$observe('title', function(newValue, oldValue) {
          scope.title = $sce.trustAsHtml(newValue);
        });
        scope.name = attrs.name;
        scope.link = attrs.link ? attrs.link : false;
        if (bsTabsCtrl.$options.animation) {
          element.addClass(bsTabsCtrl.$options.animation);
        }
        attrs.$observe('disabled', function(newValue, oldValue) {
          scope.disabled = scope.$eval(newValue);
        });
        bsTabsCtrl.$push(scope);
        scope.$on('$destroy', function() {
          bsTabsCtrl.$remove(scope);
        });
        function render() {
          var index = bsTabsCtrl.$panes.indexOf(scope);
          $animate[bsTabsCtrl.$isActive(scope, index) ? 'addClass' : 'removeClass'](element, bsTabsCtrl.$options.activeClass);
        }
        bsTabsCtrl.$activePaneChangeListeners.push(function() {
          render();
        });
        render();
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.sort', []).directive('bsSort', function() {
    return {
      scope: true,
      compile: function(element, attrs) {
        var list = element[0].querySelectorAll('th');
        for (var i = 0, len = list.length; i < len; i++) {
          var item = list[i];
          item = angular.element(item);
          var sortable = item.attr('data-sortable');
          if (sortable && sortable !== 'false') {
            var dataName = item.attr('data-name');
            item.append('<div class="sorter"><i class="nox-sort-up sort-asc" ng-class="{active: orderBy == \'' + dataName + '\' && sortBy == \'asc\'}"></i><i class="nox-sort-down sort-desc" ng-class="{active: orderBy == \'' + dataName + '\' && sortBy == \'desc\'}"></i></div>');
          }
        }
        return function postLink(scope, element, attrs) {
          var options = {
            scope: scope,
            element: element,
            show: false
          };
          angular.forEach([ 'onSort' ], function(key) {
            var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
            if (angular.isDefined(attrs[bsKey])) {
              options[key] = scope.$eval(attrs[bsKey]);
            }
          });
          if (angular.isDefined(attrs.totalItems)) {
            attrs.$observe('totalItems', function(newValue) {
              options.totalItems = newValue;
            });
          }
          angular.forEach([ 'orderBy', 'sortBy' ], function(key) {
            if (angular.isDefined(attrs[key])) {
              scope[key] = scope.$eval(attrs[key]);
            }
          });
          element.on('click', 'th', function(event) {
            var target = angular.element(event.currentTarget);
            var sortable = target.attr('data-sortable');
            if (sortable && sortable !== 'false') {
              clickColumn(event);
            }
          });
          function clickColumn(event) {
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
  });
  angular.module('mgcrea.ngStrap.select', [ 'mgcrea.ngStrap.tooltip', 'mgcrea.ngStrap.helpers.parseOptions' ]).provider('$bsSelect', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'select',
      prefixEvent: '$select',
      placement: 'bottom-left',
      templateUrl: 'select/select.tpl.html',
      trigger: 'focus',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      multiple: false,
      allNoneButtons: false,
      autoClose: false,
      search: false,
      sort: true,
      caretHtml: '&nbsp;<span class="select-arrow"><i class="nox-sort-down"></i></span>',
      placeholder: 'Choose among the following...',
      allText: 'All',
      noneText: 'None',
      maxLength: 3,
      maxLengthHtml: 'selected',
      iconCheckmark: 'glyphicon glyphicon-ok',
      toggle: false
    };
    this.$get = ["$window", "$document", "$rootScope", "$bsTooltip", "$timeout", function($window, $document, $rootScope, $tooltip, $timeout) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      var isTouch = 'createTouch' in $window.document && isNative;
      function SelectFactory(element, controller, config) {
        var $select = {};
        var options = angular.extend({}, defaults, config);
        $select = $tooltip(element, options);
        var scope = $select.$scope;
        scope.$matches = [];
        if (options.multiple) {
          scope.$activeIndex = [];
        } else {
          scope.$activeIndex = -1;
        }
        scope.$isMultiple = options.multiple;
        scope.$showAllNoneButtons = options.allNoneButtons && options.multiple;
        scope.$showSearch = options.search;
        scope.$iconCheckmark = options.iconCheckmark;
        scope.$allText = options.allText;
        scope.$noneText = options.noneText;
        scope.$searchText = '';
        scope.$changeSearchText = function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
        };
        scope.$close = function() {
          scope.$$postDigest(function() {
            $select.hide(true);
          });
        };
        scope.$searchTextChange = function(evt) {
          scope.searchText = evt.searchText;
        };
        scope.$activate = function(index) {
          scope.$$postDigest(function() {
            $select.activate(index);
          });
        };
        scope.$select = function(index, evt) {
          scope.$$postDigest(function() {
            $select.select(index, evt);
          });
        };
        scope.$isVisible = function() {
          return $select.$isVisible();
        };
        scope.$isActive = function(index) {
          return $select.$isActive(index);
        };
        scope.$selectAll = function() {
          for (var i = 0; i < scope.$matches.length; i++) {
            if (!scope.$isActive(i)) {
              scope.$select(i);
            }
          }
        };
        scope.$selectNone = function() {
          for (var i = 0; i < scope.$matches.length; i++) {
            if (scope.$isActive(i)) {
              scope.$select(i);
            }
          }
        };
        $select.update = function(matches) {
          scope.$matches = matches;
          $select.$updateActiveIndex();
        };
        $select.activate = function(index) {
          if (options.multiple) {
            if ($select.$isActive(index)) {
              scope.$activeIndex.splice(scope.$activeIndex.indexOf(index), 1);
            } else {
              scope.$activeIndex.push(index);
            }
            if (options.sort) scope.$activeIndex.sort(function(a, b) {
              return a - b;
            });
          } else {
            scope.$activeIndex = index;
          }
          return scope.$activeIndex;
        };
        $select.select = function(index, evt) {
          if (angular.isUndefined(index) || index < 0 || index >= scope.$matches.length) {
            return;
          }
          var value = scope.$matches[index].value;
          scope.$apply(function() {
            $select.activate(index);
            if (options.multiple) {
              controller.$setViewValue(scope.$activeIndex.map(function(index) {
                if (angular.isUndefined(scope.$matches[index])) {
                  return null;
                }
                return scope.$matches[index].value;
              }));
            } else {
              if (options.toggle) {
                controller.$setViewValue(value === controller.$modelValue ? undefined : value);
              } else {
                controller.$setViewValue(value);
              }
              $select.hide();
            }
          });
          scope.$emit(options.prefixEvent + '.select', value, index, $select);
          if (angular.isDefined(options.onSelect) && angular.isFunction(options.onSelect)) {
            options.onSelect(value, index, $select);
          }
        };
        $select.$updateActiveIndex = function() {
          if (options.multiple) {
            if (angular.isArray(controller.$modelValue)) {
              scope.$activeIndex = controller.$modelValue.map(function(value) {
                return $select.$getIndex(value);
              });
            } else {
              scope.$activeIndex = [];
            }
          } else {
            if (angular.isDefined(controller.$modelValue) && scope.$matches.length) {
              scope.$activeIndex = $select.$getIndex(controller.$modelValue);
            } else {
              scope.$activeIndex = -1;
            }
          }
        };
        $select.$isVisible = function() {
          if (!options.minLength || !controller) {
            return scope.$matches.length;
          }
          return scope.$matches.length && controller.$viewValue.length >= options.minLength;
        };
        $select.$isActive = function(index) {
          if (options.multiple) {
            return scope.$activeIndex.indexOf(index) !== -1;
          }
          return scope.$activeIndex === index;
        };
        $select.$getIndex = function(value) {
          var index;
          for (index = scope.$matches.length; index--; ) {
            if (angular.equals(scope.$matches[index].value, value)) break;
          }
          return index;
        };
        $select.$onMouseDown = function(evt) {
          evt.preventDefault(true);
          evt.stopPropagation(true);
          if (evt.target.getAttribute('role') === 'search') {
            evt.target.focus();
            scope.searchText = '';
          }
          if (isTouch) {
            var targetEl = angular.element(evt.target);
            var anchor;
            if (evt.target.nodeName !== 'A') {
              var anchorCandidate = targetEl.parent();
              while (!anchor && anchorCandidate.length > 0) {
                if (anchorCandidate[0].nodeName === 'A') {
                  anchor = anchorCandidate;
                }
                anchorCandidate = anchorCandidate.parent();
              }
            }
            if (anchor) {
              angular.element(anchor).triggerHandler('click');
            } else {
              targetEl.triggerHandler('click');
            }
          } else {}
        };
        $select.$onKeyDown = function(evt) {
          if (!/(9|13|38|40)/.test(evt.keyCode)) return;
          if (evt.keyCode !== 9) {
            evt.preventDefault();
            evt.stopPropagation();
          }
          if (options.multiple && evt.keyCode === 9) {
            return $select.hide();
          }
          if (!options.multiple && (evt.keyCode === 13 || evt.keyCode === 9)) {
            return $select.select(scope.$activeIndex);
          }
          if (!options.multiple) {
            if (evt.keyCode === 38 && scope.$activeIndex > 0) scope.$activeIndex--; else if (evt.keyCode === 38 && scope.$activeIndex < 0) scope.$activeIndex = scope.$matches.length - 1; else if (evt.keyCode === 40 && scope.$activeIndex < scope.$matches.length - 1) scope.$activeIndex++; else if (angular.isUndefined(scope.$activeIndex)) scope.$activeIndex = 0;
            scope.$digest();
          }
        };
        $select.$isIE = function() {
          var ua = $window.navigator.userAgent;
          return ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/') > 0;
        };
        $select.$selectScrollFix = function(e) {
          if ($document[0].activeElement.tagName === 'UL') {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.target.focus();
          }
        };
        var _show = $select.show;
        $select.show = function() {
          _show();
          if (options.multiple) {
            $select.$element.addClass('select-multiple');
            if (options.trigger === 'focus') {
              $select.$element.find('input').on('blur', function() {
                $select.hide();
              });
            }
          }
          $timeout(function() {
            $select.$element.on(isTouch ? 'touchstart' : 'mousedown', $select.$onMouseDown);
            if (options.keyboard) {
              element.on('keydown', $select.$onKeyDown);
            }
          }, 0, false);
        };
        var _hide = $select.hide;
        $select.hide = function(blur) {
          $timeout(function() {
            if (!blur && options.trigger === 'focus' && document.activeElement.getAttribute('role') === 'search') {
              return;
            }
            if (!options.multiple && angular.isUndefined(controller.$modelValue)) {
              scope.$activeIndex = -1;
            }
            if (options.search) {
              scope.searchText = '';
            }
            $select.$element.off(isTouch ? 'touchstart' : 'mousedown', $select.$onMouseDown);
            if (options.keyboard) {
              element.off('keydown', $select.$onKeyDown);
            }
            _hide(true);
          });
        };
        return $select;
      }
      SelectFactory.defaults = defaults;
      return SelectFactory;
    } ];
  }).directive('bsSelect', ["$window", "$parse", "$q", "$bsSelect", "$bsParseOptions", function($window, $parse, $q, $select, $parseOptions) {
    var defaults = $select.defaults;
    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        var options = {
          scope: scope,
          placeholder: defaults.placeholder
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'placeholder', 'allNoneButtons', 'maxLength', 'maxLengthHtml', 'allText', 'noneText', 'iconCheckmark', 'autoClose', 'id', 'sort', 'search', 'caretHtml', 'prefixClass', 'prefixEvent', 'toggle' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'allNoneButtons', 'sort', 'search' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) {
            options[key] = false;
          }
        });
        angular.forEach([ 'onBeforeShow', 'onShow', 'onBeforeHide', 'onHide', 'onSelect' ], function(key) {
          var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
          if (angular.isDefined(attr[bsKey])) {
            options[key] = scope.$eval(attr[bsKey]);
          }
        });
        var dataMultiple = element.attr('data-multiple');
        if (angular.isDefined(dataMultiple)) {
          if (falseValueRegExp.test(dataMultiple)) {
            options.multiple = false;
          } else {
            options.multiple = dataMultiple;
          }
        }
        var dataSearch = element.attr('data-search');
        if (angular.isDefined(dataSearch)) {
          if (falseValueRegExp.test(dataSearch)) {
            options.search = false;
          } else {
            options.search = dataSearch;
            scope.searchText = '';
          }
        }
        if (element[0].nodeName.toLowerCase() === 'select') {
          var inputEl = element;
          inputEl.css('display', 'none');
          element = angular.element('<button type="button" class="btn btn-default"></button>');
          inputEl.after(element);
        }
        var parsedOptions = $parseOptions(attr.bsOptions);
        var select = $select(element, controller, options);
        if (select.$isIE()) {
          element[0].addEventListener('blur', select.$selectScrollFix);
        }
        var watchedOptions = parsedOptions.$match[7].replace(/\|.+/, '').trim();
        scope.$watch(watchedOptions, function(newValue, oldValue) {
          parsedOptions.valuesFn(scope, controller).then(function(values) {
            select.update(values);
            controller.$render();
          });
        }, true);
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          select.$updateActiveIndex();
          controller.$render();
        }, true);
        controller.$render = function() {
          var selected;
          var index;
          if (options.multiple && angular.isArray(controller.$modelValue)) {
            selected = controller.$modelValue.map(function(value) {
              index = select.$getIndex(value);
              return index !== -1 ? select.$scope.$matches[index].label : false;
            }).filter(angular.isDefined);
            if (selected.length > (options.maxLength || defaults.maxLength)) {
              selected = selected.length + ' ' + (options.maxLengthHtml || defaults.maxLengthHtml);
            } else {
              selected = selected.join(', ');
            }
          } else {
            index = select.$getIndex(controller.$modelValue);
            selected = index !== -1 ? select.$scope.$matches[index].label : false;
          }
          element.html((selected || options.placeholder) + (options.caretHtml || defaults.caretHtml));
        };
        if (options.multiple) {
          controller.$isEmpty = function(value) {
            return !value || value.length === 0;
          };
        }
        scope.$on('$destroy', function() {
          if (select) select.destroy();
          options = null;
          select = null;
        });
      }
    };
  } ]).filter('searchFilter', function() {
    return function(collection, keyname, value) {
      var output = [];
      angular.forEach(collection, function(item) {
        if (item[keyname].toLowerCase().indexOf(value.toLowerCase()) > -1) {
          output.push(item);
        }
      });
      return output;
    };
  });
  angular.module('mgcrea.ngStrap.rangedatepicker', [ 'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'mgcrea.ngStrap.tooltip' ]).provider('$rangedatepicker', function() {
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
    this.$get = ["$window", "$document", "$rootScope", "$sce", "$bsDateFormatter", "rangedatepickerViews", "$bsTooltip", "$timeout", function($window, $document, $rootScope, $sce, $dateFormatter, rangedatepickerViews, $tooltip, $timeout) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      var isTouch = 'createTouch' in $window.document && isNative;
      if (!defaults.lang) defaults.lang = $dateFormatter.getDefaultLocale();
      function RangeDatepickerFactory(element, controller, config) {
        var $rangedatepicker = $tooltip(element, angular.extend({}, defaults, config));
        var options = $rangedatepicker.$options;
        var scope = $rangedatepicker.$scope;
        var pickerViews = rangedatepickerViews($rangedatepicker);
        $rangedatepicker.$views = pickerViews.views;
        var viewDate = pickerViews.viewDate;
        scope.$mode = options.minView;
        scope.$iconLeft = options.iconLeft;
        scope.$iconRight = options.iconRight;
        scope.$compare = options.compare;
        var $picker = $rangedatepicker.$views[0];
        scope.rangeList = $picker.rangeList;
        var today = new Date();
        $rangedatepicker.$today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        scope.ctrl = {
          rangeType: '',
          compare: ''
        };
        scope.$select = function(date, index) {
          if (scope.ctrl.compare && index) {
            return;
          }
          $rangedatepicker.select(date, index);
        };
        scope.$selectPane = function(value, index) {
          if (scope.ctrl.compare && index) {
            return;
          }
          $rangedatepicker.$selectPane(value, index);
        };
        scope.$selectRange = function(type) {
          if (type === scope.ctrl.rangeType || scope.ctrl.compare) {
            return;
          }
          $rangedatepicker.$selectRange(type);
          $rangedatepicker.hide(true);
        };
        scope.$toggleCompare = function() {
          var modelValue = controller.$modelValue ? angular.copy(controller.$modelValue) : {};
          modelValue.compare = scope.ctrl.compare;
          modelValue.onlyCompare = true;
          controller.$setViewValue(modelValue);
          controller.$render();
        };
        scope.$closePicker = function() {
          $rangedatepicker.hide();
        };
        scope.$stopPropagation = function(evt) {
          evt.stopPropagation();
        };
        $rangedatepicker.update = function(sDate, eDate, force) {
          if (angular.isDate(sDate) && !isNaN(sDate.getTime()) && angular.isDate(eDate) && !isNaN(eDate.getTime())) {
            if (!scope.ctrl.compare) {
              $rangedatepicker.$date = [ sDate, eDate ];
            } else {
              $rangedatepicker.$compareDate = [ sDate, eDate ];
            }
            $picker.update.call($picker, sDate, eDate);
          } else {
            $rangedatepicker.$build(!force);
          }
        };
        $rangedatepicker.updateDisabledDates = function(dateRanges) {
          options.disabledDateRanges = dateRanges;
          for (var i = 0, l = scope.rows.length; i < l; i++) {
            angular.forEach(scope.rows[i], $rangedatepicker.$setDisabledEl);
          }
        };
        $rangedatepicker.select = function(date, index, keep) {
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
            $timeout(function() {
              $rangedatepicker.hide(true);
            });
          }
        };
        $rangedatepicker.$getCompare = function() {
          return scope.ctrl && scope.ctrl.compare;
        };
        $rangedatepicker.$setCompare = function() {
          scope.ctrl && (scope.ctrl.compare = 'compare');
        };
        $rangedatepicker.$build = function(pristine) {
          if (pristine === true && $picker.built) return;
          if (pristine === false && !$picker.built) return;
          $picker.build.call($picker, $rangedatepicker.$date);
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
        $rangedatepicker.$selectPane = function(value, index) {
          var steps = $picker.steps;
          var key = index === 0 ? 'startDate' : 'endDate';
          var targetDate = new Date(Date.UTC(viewDate[key].year + (steps.year || 0) * value, viewDate[key].month + (steps.month || 0) * value, 1));
          angular.extend(viewDate[key], {
            year: targetDate.getUTCFullYear(),
            month: targetDate.getUTCMonth(),
            date: targetDate.getUTCDate()
          });
          $rangedatepicker.$build();
        };
        $rangedatepicker.$selectRange = function(type) {
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
              endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + day * -1);
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
              endDate = new Date(endDate.getFullYear(), endDate.getMonth() + value + 1, 0);
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
        $rangedatepicker.$onMouseDown = function(evt) {
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
          if (element.attr('disabled')) return;
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
  }).directive('bsRangedatepicker', ["$window", "$parse", "$q", "$bsDateFormatter", "$bsDateParser", "$rangedatepicker", function($window, $parse, $q, $dateFormatter, $dateParser, $rangedatepicker) {
    var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'autoclose', 'dateType', 'connector', 'dateFormat', 'timezone', 'modelDateFormat', 'dayFormat', 'strictFormat', 'startWeek', 'startDate', 'useNative', 'lang', 'minView', 'iconLeft', 'iconRight', 'daysOfWeekDisabled', 'id', 'prefixClass', 'prefixEvent', 'compare' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'autoclose', 'useNative', 'compare' ], function(key) {
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
        angular.forEach([ 'minDate', 'maxDate' ], function(key) {
          if (angular.isDefined(attr[key])) {
            attr.$observe(key, function(newValue) {
              rangedatepicker.$options[key] = dateParser.getDateForAttribute(key, newValue);
              if (!isNaN(rangedatepicker.$options[key])) {
                rangedatepicker.$build(false);
              }
            });
          }
        });
        if (angular.isDefined(attr.dateFormat)) {
          attr.$observe('dateFormat', function(newValue) {
            rangedatepicker.$options.dateFormat = newValue;
          });
        }
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          if (newValue && newValue.onlyCompare) {
            rangedatepicker.update(null, null, true);
          } else if (rangedatepicker.$getCompare()) {
            rangedatepicker.$date = [ controller.$dateValue[0], controller.$dateValue[1] ];
            rangedatepicker.update(controller.$compareDateValue[0], controller.$compareDateValue[1]);
          } else {
            rangedatepicker.update(controller.$dateValue[0], controller.$dateValue[1]);
          }
        }, true);
        function getFormattedDate(modelValue) {
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
        function validateAgainstMinMaxDate(parsedDate1, parsedDate2) {
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
        controller.$parsers.unshift(function(viewValue) {
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
        controller.$formatters.push(function(modelValue) {
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
              controller.$dateValue = [ dateParser.timezoneOffsetAdjust(startDate, options.timezone), dateParser.timezoneOffsetAdjust(endDate, options.timezone) ];
            }
            if (modelValue.compareStartDate && modelValue.compareEndDate) {
              var compareStartDate = getFormattedDate(modelValue.compareStartDate);
              var compareEndDate = getFormattedDate(modelValue.compareEndDate);
              controller.$compareDateValue = [ dateParser.timezoneOffsetAdjust(compareStartDate, options.timezone), dateParser.timezoneOffsetAdjust(compareEndDate, options.timezone) ];
              if (modelValue.compare) {
                rangedatepicker.$setCompare();
              }
            }
          }
          return getDateFormattedString();
        });
        controller.$render = function() {
          element.val(getDateFormattedString());
        };
        function getDateFormattedString() {
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
        scope.$on('$destroy', function() {
          if (rangedatepicker) rangedatepicker.destroy();
          options = null;
          rangedatepicker = null;
        });
      }
    };
  } ]).provider('rangedatepickerViews', function() {
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
    this.$get = ["$bsDateFormatter", "$bsDateParser", "$sce", function($dateFormatter, $dateParser, $sce) {
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
        var startDate = picker.$date && picker.$date[0] || (options.startDate ? dateParser.getDateForAttribute('startDate', options.startDate) : new Date());
        var endDate = picker.$date && picker.$date[1] || (options.endDate ? dateParser.getDateForAttribute('endDate', options.endDate) : new Date());
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
        var today = new Date();
        var t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        var d = today.getDay();
        var views = [ {
          format: options.dayFormat,
          split: 7,
          steps: {
            month: 1
          },
          rangeList: [ {
            name: 'Today',
            value: '0d',
            date: {
              start: t,
              end: t
            }
          }, {
            name: 'Yesterday',
            value: '-2d',
            date: {
              start: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1),
              end: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1)
            }
          }, {
            name: 'Last 7 Days',
            value: '-7d',
            date: {
              start: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 6),
              end: t
            }
          }, {
            name: 'Last Week',
            value: '-1w',
            date: {
              start: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 6 - d),
              end: new Date(t.getFullYear(), t.getMonth(), t.getDate() - d)
            }
          }, {
            name: 'This Month',
            value: '0m',
            date: {
              start: new Date(t.getFullYear(), t.getMonth(), 1),
              end: t
            }
          }, {
            name: 'Last Month',
            value: '-1m',
            date: {
              start: new Date(t.getFullYear(), t.getMonth() - 1, 1),
              end: new Date(t.getFullYear(), t.getMonth(), 0)
            }
          } ],
          update: function(sDate, eDate, force) {
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
          build: function() {
            var that = this;
            scope.title = [];
            scope.rows = [];
            [ 'startDate', 'endDate' ].forEach(function(value, index) {
              var item = viewDate[value];
              var firstDayOfMonth = new Date(item.year, item.month, 1);
              var firstDayOfMonthOffset = firstDayOfMonth.getTimezoneOffset();
              var firstDate = new Date(+firstDayOfMonth - mod(firstDayOfMonth.getDay() - options.startWeek, 7) * 864e5);
              var firstDateOffset = firstDate.getTimezoneOffset();
              var currentDate = dateParser.timezoneOffsetAdjust(new Date(), options.timezone).toDateString();
              if (firstDateOffset !== firstDayOfMonthOffset) firstDate = new Date(+firstDate + (firstDateOffset - firstDayOfMonthOffset) * 6e4);
              var days = [];
              var day;
              for (var i = 0; i < 42; i++) {
                day = dateParser.daylightSavingAdjust(new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + i));
                days.push({
                  date: day,
                  isToday: day.toDateString() === currentDate,
                  label: formatDate(day, that.format),
                  selected: picker.$date && picker.$date[index] && (!picker.$getCompare() || picker.$getCompare() && !index) && that.isSelected(picker.$date[index], day),
                  inRange: that.isInRange(day),
                  muted: day.getMonth() !== item.month,
                  disabled: index === 1 && scope.ctrl.compare || that.isDisabled(day, index),
                  compareSelect: index === 0 && scope.ctrl.compare && picker.$compareDate && picker.$compareDate[index] && that.isSelected(picker.$compareDate[index], day)
                });
              }
              scope.title[index] = formatDate(firstDayOfMonth, options.monthTitleFormat);
              scope.rows[index] = split(days, that.split);
            });
            scope.showLabels = true;
            scope.labels = weekDaysLabelsHtml;
            scope.isTodayDisabled = this.isDisabled(new Date());
            if (!scope.ctrl.compare) {
              var flag = false;
              that.rangeList.forEach(function(item) {
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
          isSelected: function(currentDate, date) {
            return currentDate && date.getFullYear() === currentDate.getFullYear() && date.getMonth() === currentDate.getMonth() && date.getDate() === currentDate.getDate();
          },
          isInRange: function(date) {
            if (!picker.$date || picker.$getCompare()) {
              return false;
            }
            var minDate = picker.$date[0];
            var maxDate = picker.$date[1];
            if (!angular.isDate(minDate) || !angular.isDate(maxDate) || !angular.isDate(date)) {
              return false;
            }
            return date.getTime() >= minDate.getTime() && date.getTime() <= maxDate.getTime();
          },
          isDisabled: function(date, index) {
            var time = date.getTime();
            if (time < Date.parse(options.minDate) || time > Date.parse(options.maxDate)) {
              return true;
            }
            if (!scope.ctrl.compare && picker.$date && (index && time < picker.$date[index - 1] || time > picker.$date[index + 1])) {
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
        }, {
          name: 'month',
          format: options.monthFormat,
          split: 4,
          steps: {
            year: 1
          },
          rangeList: [ {
            name: 'This Month',
            value: '0m',
            date: {
              start: new Date(t.getFullYear(), t.getMonth(), 1),
              end: t
            }
          }, {
            name: 'Last Month',
            value: '-1m',
            date: {
              start: new Date(t.getFullYear(), t.getMonth() - 1, 1),
              end: new Date(t.getFullYear(), t.getMonth(), 0)
            }
          }, {
            name: 'Two Months Ago',
            value: '-2m',
            date: {
              start: new Date(t.getFullYear(), t.getMonth() - 2, 1),
              end: new Date(t.getFullYear(), t.getMonth() - 1, 0)
            }
          } ],
          update: function(sDate, eDate, force) {
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
          build: function() {
            var that = this;
            scope.title = [];
            scope.rows = [];
            [ 'startDate', 'endDate' ].forEach(function(value, index) {
              var months = [];
              var month;
              for (var i = 0; i < 12; i++) {
                month = new Date(viewDate[value].year, i, 1);
                months.push({
                  date: month,
                  label: formatDate(month, that.format),
                  selected: picker.$date && picker.$date[index] && (!picker.$getCompare() || picker.$getCompare() && !index) && that.isSelected(picker.$date[index], month),
                  inRange: that.isInRange(month),
                  disabled: index === 1 && scope.ctrl.compare || that.isDisabled(month, index),
                  compareSelect: index === 0 && scope.ctrl.compare && picker.$compareDate && picker.$compareDate[index] && that.isSelected(picker.$compareDate[index], month)
                });
              }
              scope.title[index] = formatDate(month, options.yearTitleFormat);
              scope.rows[index] = split(months, that.split);
            });
            scope.showLabels = false;
            if (!scope.ctrl.compare) {
              var flag = false;
              that.rangeList.forEach(function(item) {
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
          isSelected: function(currentDate, date) {
            return currentDate && date.getFullYear() === currentDate.getFullYear() && date.getMonth() === currentDate.getMonth();
          },
          isInRange: function(date) {
            if (!picker.$date || picker.$getCompare()) {
              return false;
            }
            var minDate = picker.$date[0];
            var maxDate = picker.$date[1];
            if (!angular.isDate(minDate) || !angular.isDate(maxDate) || !angular.isDate(date)) {
              return false;
            }
            return date.getTime() >= minDate.getTime() && date.getTime() <= maxDate.getTime();
          },
          isDisabled: function(date, index) {
            var time = date.getTime();
            var lastDate = +new Date(date.getFullYear(), date.getMonth() + 1, 0);
            if (lastDate < options.minDate || date.getTime() > options.maxDate) {
              return true;
            }
            return !scope.ctrl.compare && picker.$date && (index && time < picker.$date[index - 1] || time > picker.$date[index + 1]);
          }
        } ];
        return {
          views: Array.prototype.slice.call(views, options.minView, options.minView + 1),
          viewDate: viewDate
        };
      };
    } ];
  });
  angular.module('mgcrea.ngStrap.popover', [ 'mgcrea.ngStrap.tooltip' ]).provider('$bsPopover', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      customClass: '',
      container: false,
      target: false,
      placement: 'right',
      templateUrl: 'popover/popover.tpl.html',
      contentTemplate: false,
      trigger: 'click',
      keyboard: true,
      html: false,
      title: '',
      content: '',
      delay: 0,
      autoClose: false
    };
    this.$get = ["$bsTooltip", function($tooltip) {
      function PopoverFactory(element, config) {
        var options = angular.extend({}, defaults, config);
        var $popover = $tooltip(element, options);
        if (options.content) {
          $popover.$scope.content = options.content;
        }
        return $popover;
      }
      return PopoverFactory;
    } ];
  }).directive('bsPopover', ["$window", "$sce", "$bsPopover", function($window, $sce, $popover) {
    var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr) {
        var popover;
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'contentTemplate', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'customClass', 'autoClose', 'id', 'prefixClass', 'prefixEvent', 'bsEnabled' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'autoClose' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });
        angular.forEach([ 'onBeforeShow', 'onShow', 'onBeforeHide', 'onHide' ], function(key) {
          var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
          if (angular.isDefined(attr[bsKey])) {
            options[key] = scope.$eval(attr[bsKey]);
          }
        });
        var dataTarget = element.attr('data-target');
        if (angular.isDefined(dataTarget)) {
          if (falseValueRegExp.test(dataTarget)) {
            options.target = false;
          } else {
            options.target = dataTarget;
          }
        }
        angular.forEach([ 'title', 'content' ], function(key) {
          if (attr[key]) {
            attr.$observe(key, function(newValue, oldValue) {
              scope[key] = $sce.trustAsHtml(newValue);
              if (angular.isDefined(oldValue)) {
                requestAnimationFrame(function() {
                  if (popover) popover.$applyPlacement();
                });
              }
            });
          }
        });
        if (attr.bsPopover) {
          scope.$watch(attr.bsPopover, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.content = newValue;
            }
            if (angular.isDefined(oldValue)) {
              requestAnimationFrame(function() {
                if (popover) popover.$applyPlacement();
              });
            }
          }, true);
        }
        if (attr.bsShow) {
          scope.$watch(attr.bsShow, function(newValue, oldValue) {
            if (!popover || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(popover),?/i);
            if (newValue === true) {
              popover.show();
            } else {
              popover.hide();
            }
          });
        }
        if (attr.bsEnabled) {
          scope.$watch(attr.bsEnabled, function(newValue) {
            if (!popover || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|1|,?(popover),?/i);
            if (newValue === false) {
              popover.setEnabled(false);
            } else {
              popover.setEnabled(true);
            }
          });
        }
        if (attr.viewport) {
          scope.$watch(attr.viewport, function(newValue) {
            if (!popover || !angular.isDefined(newValue)) return;
            popover.setViewport(newValue);
          });
        }
        popover = $popover(element, options);
        scope.$on('$destroy', function() {
          if (popover) popover.destroy();
          options = null;
          popover = null;
        });
      }
    };
  } ]);
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
  }).directive('bsPagination', ["$window", "$sce", "$parse", "$pagination", function($window, $sce, $parse, $pagination) {
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
  angular.module('mgcrea.ngStrap.modal', [ 'mgcrea.ngStrap.core', 'mgcrea.ngStrap.helpers.dimensions' ]).provider('$bsModal', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      backdropAnimation: 'am-fade',
      customClass: '',
      prefixClass: 'modal',
      prefixEvent: 'modal',
      placement: 'top',
      templateUrl: 'modal/modal.tpl.html',
      template: '',
      contentTemplate: false,
      container: false,
      element: null,
      backdrop: true,
      keyboard: true,
      html: false,
      show: true,
      size: null,
      zIndex: null
    };
    this.$get = ["$window", "$rootScope", "$bsCompiler", "$animate", "$timeout", "$sce", "bsDimensions", function($window, $rootScope, $bsCompiler, $animate, $timeout, $sce, dimensions) {
      var forEach = angular.forEach;
      var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;
      var bodyElement = angular.element($window.document.body);
      var backdropCount = 0;
      var dialogBaseZindex = 1050;
      var backdropBaseZindex = 1040;
      var validSizes = {
        lg: 'modal-dialog-lg',
        sm: 'modal-dialog-sm'
      };
      function ModalFactory(config) {
        var $modal = {};
        var options = $modal.$options = angular.extend({}, defaults, config);
        var promise = $modal.$promise = $bsCompiler.compile(options);
        var scope = $modal.$scope = options.scope && options.scope.$new() || $rootScope.$new();
        if (!options.element && !options.container) {
          options.container = 'body';
        }
        if (options.zIndex) {
          dialogBaseZindex = parseInt(options.zIndex, 10);
          backdropBaseZindex = dialogBaseZindex - 10;
        }
        $modal.$id = options.id || options.element && options.element.attr('id') || '';
        forEach([ 'title', 'content' ], function(key) {
          if (options[key]) scope[key] = $sce.trustAsHtml(options[key]);
        });
        scope.$hide = function() {
          scope.$$postDigest(function() {
            $modal.hide();
          });
        };
        scope.$show = function() {
          scope.$$postDigest(function() {
            $modal.show();
          });
        };
        scope.$toggle = function() {
          scope.$$postDigest(function() {
            $modal.toggle();
          });
        };
        $modal.$isShown = scope.$isShown = false;
        var compileData;
        var modalElement;
        var modalScope;
        var backdropElement = angular.element('<div class="' + options.prefixClass + '-backdrop"/>');
        promise.then(function(data) {
          compileData = data;
          $modal.init();
        });
        $modal.init = function() {
          if (options.show) {
            scope.$$postDigest(function() {
              $modal.show();
            });
          }
        };
        $modal.destroy = function() {
          destroyModalElement();
          if (backdropElement) {
            backdropElement.remove();
            backdropElement = null;
          }
          scope.$destroy();
        };
        $modal.show = function() {
          if ($modal.$isShown) return;
          var parent;
          var after;
          if (angular.isElement(options.container)) {
            parent = options.container;
            after = options.container[0].lastChild ? angular.element(options.container[0].lastChild) : null;
          } else {
            if (options.container) {
              parent = findElement(options.container);
              after = parent[0] && parent[0].lastChild ? angular.element(parent[0].lastChild) : null;
            } else {
              parent = null;
              after = options.element;
            }
          }
          if (options.backdrop) {
            setScrollBar();
          }
          if (modalElement) {
            destroyModalElement();
          }
          modalScope = $modal.$scope.$new();
          modalElement = $modal.$element = compileData.link(modalScope, function(clonedElement, scope) {});
          if (options.backdrop) {
            modalElement.css({
              'z-index': dialogBaseZindex + backdropCount * 20
            });
            backdropElement.css({
              'z-index': backdropBaseZindex + backdropCount * 20
            });
            backdropCount++;
          }
          if (scope.$emit(options.prefixEvent + '.show.before', $modal).defaultPrevented) {
            return;
          }
          if (angular.isDefined(options.onBeforeShow) && angular.isFunction(options.onBeforeShow)) {
            options.onBeforeShow($modal);
          }
          modalElement.css({
            display: 'block'
          }).addClass(options.placement);
          if (options.customClass) {
            modalElement.addClass(options.customClass);
          }
          if (options.size && validSizes[options.size]) {
            angular.element(findElement('.modal-dialog', modalElement[0])).addClass(validSizes[options.size]);
          }
          if (options.animation) {
            if (options.backdrop) {
              backdropElement.addClass(options.backdropAnimation);
            }
            modalElement.addClass(options.animation);
          }
          if (options.backdrop) {
            $animate.enter(backdropElement, bodyElement, null);
          }
          if (angular.version.minor <= 2) {
            $animate.enter(modalElement, parent, after, enterAnimateCallback);
          } else {
            $animate.enter(modalElement, parent, after).then(enterAnimateCallback);
          }
          $modal.$isShown = scope.$isShown = true;
          safeDigest(scope);
          var el = modalElement[0];
          requestAnimationFrame(function() {
            el.focus();
          });
          bodyElement.addClass(options.prefixClass + '-open');
          if (options.animation) {
            bodyElement.addClass(options.prefixClass + '-with-' + options.animation);
          }
          bindBackdropEvents();
          bindKeyboardEvents();
        };
        function enterAnimateCallback() {
          scope.$emit(options.prefixEvent + '.show', $modal);
          if (angular.isDefined(options.onShow) && angular.isFunction(options.onShow)) {
            options.onShow($modal);
          }
        }
        $modal.hide = function() {
          if (!$modal.$isShown) return;
          if (scope.$emit(options.prefixEvent + '.hide.before', $modal).defaultPrevented) {
            return;
          }
          if (angular.isDefined(options.onBeforeHide) && angular.isFunction(options.onBeforeHide)) {
            options.onBeforeHide($modal);
          }
          if (angular.version.minor <= 2) {
            $animate.leave(modalElement, leaveAnimateCallback);
          } else {
            $animate.leave(modalElement).then(leaveAnimateCallback);
          }
          if (options.backdrop) {
            backdropCount--;
            $animate.leave(backdropElement);
          }
          $modal.$isShown = scope.$isShown = false;
          safeDigest(scope);
          unbindBackdropEvents();
          unbindKeyboardEvents();
        };
        function leaveAnimateCallback() {
          if (options.backdrop) {
            resetScrollBar();
          }
          scope.$emit(options.prefixEvent + '.hide', $modal);
          if (angular.isDefined(options.onHide) && angular.isFunction(options.onHide)) {
            options.onHide($modal);
          }
          if (findElement('.modal').length <= 0) {
            bodyElement.removeClass(options.prefixClass + '-open');
          }
          if (options.animation) {
            bodyElement.removeClass(options.prefixClass + '-with-' + options.animation);
          }
        }
        $modal.toggle = function() {
          if ($modal.$isShown) {
            $modal.hide();
          } else {
            $modal.show();
          }
        };
        $modal.focus = function() {
          modalElement[0].focus();
        };
        $modal.$onKeyUp = function(evt) {
          if (evt.which === 27 && $modal.$isShown) {
            $modal.hide();
            evt.stopPropagation();
          }
        };
        function bindBackdropEvents() {
          if (options.backdrop) {
            modalElement.on('click', hideOnBackdropClick);
            backdropElement.on('click', hideOnBackdropClick);
            backdropElement.on('wheel', preventEventDefault);
          }
        }
        function unbindBackdropEvents() {
          if (options.backdrop) {
            modalElement.off('click', hideOnBackdropClick);
            backdropElement.off('click', hideOnBackdropClick);
            backdropElement.off('wheel', preventEventDefault);
          }
        }
        function bindKeyboardEvents() {
          if (options.keyboard) {
            modalElement.on('keyup', $modal.$onKeyUp);
          }
        }
        function unbindKeyboardEvents() {
          if (options.keyboard) {
            modalElement.off('keyup', $modal.$onKeyUp);
          }
        }
        function hideOnBackdropClick(evt) {
          if (evt.target !== evt.currentTarget) return;
          if (options.backdrop === 'static') {
            $modal.focus();
          } else {
            $modal.hide();
          }
        }
        function preventEventDefault(evt) {
          evt.preventDefault();
        }
        function destroyModalElement() {
          if ($modal.$isShown && modalElement !== null) {
            unbindBackdropEvents();
            unbindKeyboardEvents();
          }
          if (modalScope) {
            modalScope.$destroy();
            modalScope = null;
          }
          if (modalElement) {
            modalElement.remove();
            modalElement = $modal.$element = null;
          }
        }
        function setScrollBar() {
          var scrollDiv = document.createElement('div');
          scrollDiv.className = 'modal-scrollbar-measure';
          bodyElement.append(scrollDiv);
          var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
          bodyElement[0].removeChild(scrollDiv);
          var fullWindowWidth = window.innerWidth;
          if (!fullWindowWidth) {
            var documentElementRect = document.documentElement.getBoundingClientRect();
            fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
          }
          var bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
          if (bodyIsOverflowing) bodyElement.css('padding-right', scrollbarWidth + 'px');
        }
        function resetScrollBar() {
          bodyElement.css('padding-right', 0);
        }
        return $modal;
      }
      function safeDigest(scope) {
        scope.$$phase || scope.$root && scope.$root.$$phase || scope.$digest();
      }
      function findElement(query, element) {
        return angular.element((element || document).querySelectorAll(query));
      }
      return ModalFactory;
    } ];
  }).directive('bsModal', ["$window", "$sce", "$parse", "$bsModal", function($window, $sce, $parse, $modal) {
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {
        var options = {
          scope: scope,
          element: element,
          show: false
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'contentTemplate', 'placement', 'backdrop', 'keyboard', 'html', 'container', 'animation', 'backdropAnimation', 'id', 'prefixEvent', 'prefixClass', 'customClass', 'modalClass', 'size', 'zIndex' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        if (options.modalClass) {
          options.customClass = options.modalClass;
        }
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'backdrop', 'keyboard', 'html', 'container' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });
        angular.forEach([ 'onBeforeShow', 'onShow', 'onBeforeHide', 'onHide' ], function(key) {
          var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
          if (angular.isDefined(attr[bsKey])) {
            options[key] = scope.$eval(attr[bsKey]);
          }
        });
        angular.forEach([ 'title', 'content' ], function(key) {
          if (attr[key]) {
            attr.$observe(key, function(newValue, oldValue) {
              scope[key] = $sce.trustAsHtml(newValue);
            });
          }
        });
        if (attr.bsModal) {
          scope.$watch(attr.bsModal, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.content = newValue;
            }
          }, true);
        }
        var modal = $modal(options);
        element.on(attr.trigger || 'click', modal.toggle);
        scope.$on('$destroy', function() {
          if (modal) modal.destroy();
          options = null;
          modal = null;
        });
      }
    };
  } ]);
  if (angular.version.minor < 3 && angular.version.dot < 14) {
    angular.module('ng').factory('$$rAF', ["$window", "$timeout", function($window, $timeout) {
      var requestAnimationFrame = $window.requestAnimationFrame || $window.webkitRequestAnimationFrame || $window.mozRequestAnimationFrame;
      var cancelAnimationFrame = $window.cancelAnimationFrame || $window.webkitCancelAnimationFrame || $window.mozCancelAnimationFrame || $window.webkitCancelRequestAnimationFrame;
      var rafSupported = !!requestAnimationFrame;
      var raf = rafSupported ? function(fn) {
        var id = requestAnimationFrame(fn);
        return function() {
          cancelAnimationFrame(id);
        };
      } : function(fn) {
        var timer = $timeout(fn, 16.66, false);
        return function() {
          $timeout.cancel(timer);
        };
      };
      raf.supported = rafSupported;
      return raf;
    } ]);
  }
  angular.module('mgcrea.ngStrap.helpers.parseOptions', []).provider('$bsParseOptions', function() {
    var defaults = this.defaults = {
      regexp: /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/
    };
    this.$get = ["$parse", "$q", function($parse, $q) {
      function ParseOptionsFactory(attr, config) {
        var $parseOptions = {};
        var options = angular.extend({}, defaults, config);
        $parseOptions.$values = [];
        var match;
        var displayFn;
        var valueName;
        var keyName;
        var groupByFn;
        var valueFn;
        var valuesFn;
        $parseOptions.init = function() {
          $parseOptions.$match = match = attr.match(options.regexp);
          displayFn = $parse(match[2] || match[1]);
          valueName = match[4] || match[6];
          keyName = match[5];
          groupByFn = $parse(match[3] || '');
          valueFn = $parse(match[2] ? match[1] : valueName);
          valuesFn = $parse(match[7]);
        };
        $parseOptions.valuesFn = function(scope, controller) {
          return $q.when(valuesFn(scope, controller)).then(function(values) {
            if (!angular.isArray(values)) {
              values = [];
            }
            $parseOptions.$values = values.length ? parseValues(values, scope) : [];
            return $parseOptions.$values;
          });
        };
        $parseOptions.displayValue = function(modelValue) {
          var scope = {};
          scope[valueName] = modelValue;
          return displayFn(scope);
        };
        function parseValues(values, scope) {
          return values.map(function(match, index) {
            var locals = {};
            var label;
            var value;
            locals[valueName] = match;
            label = displayFn(scope, locals);
            value = valueFn(scope, locals);
            return {
              label: label,
              value: value,
              index: index
            };
          });
        }
        $parseOptions.init();
        return $parseOptions;
      }
      return ParseOptionsFactory;
    } ];
  });
  angular.module('mgcrea.ngStrap.helpers.dimensions', []).factory('bsDimensions', function() {
    var fn = {};
    var nodeName = fn.nodeName = function(element, name) {
      return element.nodeName && element.nodeName.toLowerCase() === name.toLowerCase();
    };
    fn.css = function(element, prop, extra) {
      var value;
      if (element.currentStyle) {
        value = element.currentStyle[prop];
      } else if (window.getComputedStyle) {
        value = window.getComputedStyle(element)[prop];
      } else {
        value = element.style[prop];
      }
      return extra === true ? parseFloat(value) || 0 : value;
    };
    fn.offset = function(element) {
      var boxRect = element.getBoundingClientRect();
      var docElement = element.ownerDocument;
      return {
        width: boxRect.width || element.offsetWidth,
        height: boxRect.height || element.offsetHeight,
        top: boxRect.top + (window.pageYOffset || docElement.documentElement.scrollTop) - (docElement.documentElement.clientTop || 0),
        left: boxRect.left + (window.pageXOffset || docElement.documentElement.scrollLeft) - (docElement.documentElement.clientLeft || 0)
      };
    };
    fn.setOffset = function(element, options, i) {
      var curPosition;
      var curLeft;
      var curCSSTop;
      var curTop;
      var curOffset;
      var curCSSLeft;
      var calculatePosition;
      var position = fn.css(element, 'position');
      var curElem = angular.element(element);
      var props = {};
      if (position === 'static') {
        element.style.position = 'relative';
      }
      curOffset = fn.offset(element);
      curCSSTop = fn.css(element, 'top');
      curCSSLeft = fn.css(element, 'left');
      calculatePosition = (position === 'absolute' || position === 'fixed') && (curCSSTop + curCSSLeft).indexOf('auto') > -1;
      if (calculatePosition) {
        curPosition = fn.position(element);
        curTop = curPosition.top;
        curLeft = curPosition.left;
      } else {
        curTop = parseFloat(curCSSTop) || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
      }
      if (angular.isFunction(options)) {
        options = options.call(element, i, curOffset);
      }
      if (options.top !== null) {
        props.top = options.top - curOffset.top + curTop;
      }
      if (options.left !== null) {
        props.left = options.left - curOffset.left + curLeft;
      }
      if ('using' in options) {
        options.using.call(curElem, props);
      } else {
        curElem.css({
          top: props.top + 'px',
          left: props.left + 'px'
        });
      }
    };
    fn.position = function(element) {
      var offsetParentRect = {
        top: 0,
        left: 0
      };
      var offsetParentEl;
      var offset;
      if (fn.css(element, 'position') === 'fixed') {
        offset = element.getBoundingClientRect();
      } else {
        offsetParentEl = offsetParentElement(element);
        offset = fn.offset(element);
        if (!nodeName(offsetParentEl, 'html')) {
          offsetParentRect = fn.offset(offsetParentEl);
        }
        offsetParentRect.top += fn.css(offsetParentEl, 'borderTopWidth', true);
        offsetParentRect.left += fn.css(offsetParentEl, 'borderLeftWidth', true);
      }
      return {
        width: element.offsetWidth,
        height: element.offsetHeight,
        top: offset.top - offsetParentRect.top - fn.css(element, 'marginTop', true),
        left: offset.left - offsetParentRect.left - fn.css(element, 'marginLeft', true)
      };
    };
    function offsetParentElement(element) {
      var docElement = element.ownerDocument;
      var offsetParent = element.offsetParent || docElement;
      if (nodeName(offsetParent, '#document')) return docElement.documentElement;
      while (offsetParent && !nodeName(offsetParent, 'html') && fn.css(offsetParent, 'position') === 'static') {
        offsetParent = offsetParent.offsetParent;
      }
      return offsetParent || docElement.documentElement;
    }
    fn.height = function(element, outer) {
      var value = element.offsetHeight;
      if (outer) {
        value += fn.css(element, 'marginTop', true) + fn.css(element, 'marginBottom', true);
      } else {
        value -= fn.css(element, 'paddingTop', true) + fn.css(element, 'paddingBottom', true) + fn.css(element, 'borderTopWidth', true) + fn.css(element, 'borderBottomWidth', true);
      }
      return value;
    };
    fn.width = function(element, outer) {
      var value = element.offsetWidth;
      if (outer) {
        value += fn.css(element, 'marginLeft', true) + fn.css(element, 'marginRight', true);
      } else {
        value -= fn.css(element, 'paddingLeft', true) + fn.css(element, 'paddingRight', true) + fn.css(element, 'borderLeftWidth', true) + fn.css(element, 'borderRightWidth', true);
      }
      return value;
    };
    return fn;
  });
  angular.module('mgcrea.ngStrap.helpers.debounce', []).factory('bsDebounce', ["$timeout", function($timeout) {
    return function(func, wait, immediate) {
      var timeout = null;
      return function() {
        var context = this;
        var args = arguments;
        var callNow = immediate && !timeout;
        if (timeout) {
          $timeout.cancel(timeout);
        }
        timeout = $timeout(function later() {
          timeout = null;
          if (!immediate) {
            func.apply(context, args);
          }
        }, wait, false);
        if (callNow) {
          func.apply(context, args);
        }
        return timeout;
      };
    };
  } ]).factory('bsThrottle', ["$timeout", function($timeout) {
    return function(func, wait, options) {
      var timeout = null;
      if (!options) options = {};
      return function() {
        var context = this;
        var args = arguments;
        if (!timeout) {
          if (options.leading !== false) {
            func.apply(context, args);
          }
          timeout = $timeout(function later() {
            timeout = null;
            if (options.trailing !== false) {
              func.apply(context, args);
            }
          }, wait, false);
        }
      };
    };
  } ]);
  angular.module('mgcrea.ngStrap.helpers.dateParser', []).provider('$bsDateParser', ["$localeProvider", function($localeProvider) {
    function ParseDate() {
      this.year = 1970;
      this.month = 0;
      this.day = 1;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.milliseconds = 0;
    }
    ParseDate.prototype.setMilliseconds = function(value) {
      this.milliseconds = value;
    };
    ParseDate.prototype.setSeconds = function(value) {
      this.seconds = value;
    };
    ParseDate.prototype.setMinutes = function(value) {
      this.minutes = value;
    };
    ParseDate.prototype.setHours = function(value) {
      this.hours = value;
    };
    ParseDate.prototype.getHours = function() {
      return this.hours;
    };
    ParseDate.prototype.setDate = function(value) {
      this.day = value;
    };
    ParseDate.prototype.setMonth = function(value) {
      this.month = value;
    };
    ParseDate.prototype.setFullYear = function(value) {
      this.year = value;
    };
    ParseDate.prototype.fromDate = function(value) {
      this.year = value.getFullYear();
      this.month = value.getMonth();
      this.day = value.getDate();
      this.hours = value.getHours();
      this.minutes = value.getMinutes();
      this.seconds = value.getSeconds();
      this.milliseconds = value.getMilliseconds();
      return this;
    };
    ParseDate.prototype.toDate = function() {
      return new Date(this.year, this.month, this.day, this.hours, this.minutes, this.seconds, this.milliseconds);
    };
    var proto = ParseDate.prototype;
    function noop() {}
    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function indexOfCaseInsensitive(array, value) {
      var len = array.length;
      var str = value.toString().toLowerCase();
      for (var i = 0; i < len; i++) {
        if (array[i].toLowerCase() === str) {
          return i;
        }
      }
      return -1;
    }
    var defaults = this.defaults = {
      format: 'shortDate',
      strict: false
    };
    this.$get = ["$locale", "dateFilter", function($locale, dateFilter) {
      var DateParserFactory = function(config) {
        var options = angular.extend({}, defaults, config);
        var $dateParser = {};
        var regExpMap = {
          sss: '[0-9]{3}',
          ss: '[0-5][0-9]',
          s: options.strict ? '[1-5]?[0-9]' : '[0-9]|[0-5][0-9]',
          mm: '[0-5][0-9]',
          m: options.strict ? '[1-5]?[0-9]' : '[0-9]|[0-5][0-9]',
          HH: '[01][0-9]|2[0-3]',
          H: options.strict ? '1?[0-9]|2[0-3]' : '[01]?[0-9]|2[0-3]',
          hh: '[0][1-9]|[1][012]',
          h: options.strict ? '[1-9]|1[012]' : '0?[1-9]|1[012]',
          a: 'AM|PM',
          EEEE: $locale.DATETIME_FORMATS.DAY.join('|'),
          EEE: $locale.DATETIME_FORMATS.SHORTDAY.join('|'),
          dd: '0[1-9]|[12][0-9]|3[01]',
          d: options.strict ? '[1-9]|[1-2][0-9]|3[01]' : '0?[1-9]|[1-2][0-9]|3[01]',
          MMMM: $locale.DATETIME_FORMATS.MONTH.join('|'),
          MMM: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
          MM: '0[1-9]|1[012]',
          M: options.strict ? '[1-9]|1[012]' : '0?[1-9]|1[012]',
          yyyy: '[1]{1}[0-9]{3}|[2]{1}[0-9]{3}',
          yy: '[0-9]{2}',
          y: options.strict ? '-?(0|[1-9][0-9]{0,3})' : '-?0*[0-9]{1,4}'
        };
        var setFnMap = {
          sss: proto.setMilliseconds,
          ss: proto.setSeconds,
          s: proto.setSeconds,
          mm: proto.setMinutes,
          m: proto.setMinutes,
          HH: proto.setHours,
          H: proto.setHours,
          hh: proto.setHours,
          h: proto.setHours,
          EEEE: noop,
          EEE: noop,
          dd: proto.setDate,
          d: proto.setDate,
          a: function(value) {
            var hours = this.getHours() % 12;
            return this.setHours(value.match(/pm/i) ? hours + 12 : hours);
          },
          MMMM: function(value) {
            return this.setMonth(indexOfCaseInsensitive($locale.DATETIME_FORMATS.MONTH, value));
          },
          MMM: function(value) {
            return this.setMonth(indexOfCaseInsensitive($locale.DATETIME_FORMATS.SHORTMONTH, value));
          },
          MM: function(value) {
            return this.setMonth(1 * value - 1);
          },
          M: function(value) {
            return this.setMonth(1 * value - 1);
          },
          yyyy: proto.setFullYear,
          yy: function(value) {
            return this.setFullYear(2e3 + 1 * value);
          },
          y: function(value) {
            return 1 * value <= 50 && value.length === 2 ? this.setFullYear(2e3 + 1 * value) : this.setFullYear(1 * value);
          }
        };
        var regex;
        var setMap;
        $dateParser.init = function() {
          $dateParser.$format = $locale.DATETIME_FORMATS[options.format] || options.format;
          regex = regExpForFormat($dateParser.$format);
          setMap = setMapForFormat($dateParser.$format);
        };
        $dateParser.isValid = function(date) {
          if (angular.isDate(date)) return !isNaN(date.getTime());
          return regex.test(date);
        };
        $dateParser.parse = function(value, baseDate, format, timezone) {
          if (format) format = $locale.DATETIME_FORMATS[format] || format;
          if (angular.isDate(value)) value = dateFilter(value, format || $dateParser.$format, timezone);
          var formatRegex = format ? regExpForFormat(format) : regex;
          var formatSetMap = format ? setMapForFormat(format) : setMap;
          var matches = formatRegex.exec(value);
          if (!matches) return false;
          var date = baseDate && !isNaN(baseDate.getTime()) ? new ParseDate().fromDate(baseDate) : new ParseDate().fromDate(new Date(1970, 0, 1, 0));
          for (var i = 0; i < matches.length - 1; i++) {
            if (formatSetMap[i]) formatSetMap[i].call(date, matches[i + 1]);
          }
          var newDate = date.toDate();
          if (parseInt(date.day, 10) !== newDate.getDate()) {
            return false;
          }
          return newDate;
        };
        $dateParser.getDateForAttribute = function(key, value) {
          var date;
          if (value === 'today') {
            var today = new Date();
            date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (key === 'maxDate' ? 1 : 0), 0, 0, 0, key === 'minDate' ? 0 : -1);
          } else if (angular.isString(value) && value.match(/^".+"$/)) {
            date = new Date(value.substr(1, value.length - 2));
          } else if (isNumeric(value)) {
            date = new Date(parseInt(value, 10));
          } else if (angular.isString(value) && value.length === 0) {
            date = key === 'minDate' ? -Infinity : +Infinity;
          } else {
            date = new Date(value);
          }
          return date;
        };
        $dateParser.getTimeForAttribute = function(key, value) {
          var time;
          if (value === 'now') {
            time = new Date().setFullYear(1970, 0, 1);
          } else if (angular.isString(value) && value.match(/^".+"$/)) {
            time = new Date(value.substr(1, value.length - 2)).setFullYear(1970, 0, 1);
          } else if (isNumeric(value)) {
            time = new Date(parseInt(value, 10)).setFullYear(1970, 0, 1);
          } else if (angular.isString(value) && value.length === 0) {
            time = key === 'minTime' ? -Infinity : +Infinity;
          } else {
            time = $dateParser.parse(value, new Date(1970, 0, 1, 0));
          }
          return time;
        };
        $dateParser.daylightSavingAdjust = function(date) {
          if (!date) {
            return null;
          }
          date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
          return date;
        };
        $dateParser.timezoneOffsetAdjust = function(date, timezone, undo) {
          if (!date) {
            return null;
          }
          if (timezone && timezone === 'UTC') {
            date = new Date(date.getTime());
            date.setMinutes(date.getMinutes() + (undo ? -1 : 1) * date.getTimezoneOffset());
          }
          return date;
        };
        function regExpForFormat(format) {
          var re = buildDateAbstractRegex(format);
          return buildDateParseRegex(re);
        }
        function buildDateAbstractRegex(format) {
          var escapedFormat = escapeReservedSymbols(format);
          var escapedLiteralFormat = escapedFormat.replace(/''/g, '\\\'');
          var literalRegex = /('(?:\\'|.)*?')/;
          var formatParts = escapedLiteralFormat.split(literalRegex);
          var dateElements = Object.keys(regExpMap);
          var dateRegexParts = [];
          angular.forEach(formatParts, function(part) {
            if (isFormatStringLiteral(part)) {
              part = trimLiteralEscapeChars(part);
            } else {
              for (var i = 0; i < dateElements.length; i++) {
                part = part.split(dateElements[i]).join('${' + i + '}');
              }
            }
            dateRegexParts.push(part);
          });
          return dateRegexParts.join('');
        }
        function escapeReservedSymbols(text) {
          return text.replace(/\\/g, '[\\\\]').replace(/-/g, '[-]').replace(/\./g, '[.]').replace(/\*/g, '[*]').replace(/\+/g, '[+]').replace(/\?/g, '[?]').replace(/\$/g, '[$]').replace(/\^/g, '[^]').replace(/\//g, '[/]').replace(/\\s/g, '[\\s]');
        }
        function isFormatStringLiteral(text) {
          return /^'.*'$/.test(text);
        }
        function trimLiteralEscapeChars(text) {
          return text.replace(/^'(.*)'$/, '$1');
        }
        function buildDateParseRegex(abstractRegex) {
          var dateElements = Object.keys(regExpMap);
          var re = abstractRegex;
          for (var i = 0; i < dateElements.length; i++) {
            re = re.split('${' + i + '}').join('(' + regExpMap[dateElements[i]] + ')');
          }
          return new RegExp('^' + re + '$', [ 'i' ]);
        }
        function setMapForFormat(format) {
          var re = buildDateAbstractRegex(format);
          return buildDateParseValuesMap(re);
        }
        function buildDateParseValuesMap(abstractRegex) {
          var dateElements = Object.keys(regExpMap);
          var valuesRegex = new RegExp('\\${(\\d+)}', 'g');
          var valuesMatch;
          var keyIndex;
          var valueKey;
          var valueFunction;
          var valuesFunctionMap = [];
          while ((valuesMatch = valuesRegex.exec(abstractRegex)) !== null) {
            keyIndex = valuesMatch[1];
            valueKey = dateElements[keyIndex];
            valueFunction = setFnMap[valueKey];
            valuesFunctionMap.push(valueFunction);
          }
          return valuesFunctionMap;
        }
        $dateParser.init();
        return $dateParser;
      };
      return DateParserFactory;
    } ];
  } ]);
  angular.module('mgcrea.ngStrap.helpers.dateFormatter', []).service('$bsDateFormatter', ["$locale", "dateFilter", function($locale, dateFilter) {
    this.getDefaultLocale = function() {
      return $locale.id;
    };
    this.getDatetimeFormat = function(format, lang) {
      return $locale.DATETIME_FORMATS[format] || format;
    };
    this.weekdaysShort = function(lang) {
      return $locale.DATETIME_FORMATS.SHORTDAY;
    };
    function splitTimeFormat(format) {
      return /(h+)([:\.])?(m+)([:\.])?(s*)[ ]?(a?)/i.exec(format).slice(1);
    }
    this.hoursFormat = function(timeFormat) {
      return splitTimeFormat(timeFormat)[0];
    };
    this.minutesFormat = function(timeFormat) {
      return splitTimeFormat(timeFormat)[2];
    };
    this.secondsFormat = function(timeFormat) {
      return splitTimeFormat(timeFormat)[4];
    };
    this.timeSeparator = function(timeFormat) {
      return splitTimeFormat(timeFormat)[1];
    };
    this.showSeconds = function(timeFormat) {
      return !!splitTimeFormat(timeFormat)[4];
    };
    this.showAM = function(timeFormat) {
      return !!splitTimeFormat(timeFormat)[5];
    };
    this.formatDate = function(date, format, lang, timezone) {
      return dateFilter(date, format, timezone);
    };
  } ]);
  angular.module('mgcrea.ngStrap.core', []).service('$bsCompiler', bsCompilerService);
  function bsCompilerService($q, $http, $injector, $compile, $controller, $templateCache) {
    this.compile = function(options) {
      if (options.template && /\.html$/.test(options.template)) {
        console.warn('Deprecated use of `template` option to pass a file. Please use the `templateUrl` option instead.');
        options.templateUrl = options.template;
        options.template = '';
      }
      var templateUrl = options.templateUrl;
      var template = options.template || '';
      var controller = options.controller;
      var controllerAs = options.controllerAs;
      var resolve = angular.copy(options.resolve || {});
      var locals = angular.copy(options.locals || {});
      var transformTemplate = options.transformTemplate || angular.identity;
      var bindToController = options.bindToController;
      angular.forEach(resolve, function(value, key) {
        if (angular.isString(value)) {
          resolve[key] = $injector.get(value);
        } else {
          resolve[key] = $injector.invoke(value);
        }
      });
      angular.extend(resolve, locals);
      if (template) {
        resolve.$template = $q.when(template);
      } else if (templateUrl) {
        resolve.$template = fetchTemplate(templateUrl);
      } else {
        throw new Error('Missing `template` / `templateUrl` option.');
      }
      if (options.titleTemplate) {
        resolve.$template = $q.all([ resolve.$template, fetchTemplate(options.titleTemplate) ]).then(function(templates) {
          var templateEl = angular.element(templates[0]);
          findElement('[ng-bind="title"]', templateEl[0]).removeAttr('ng-bind').html(templates[1]);
          return templateEl[0].outerHTML;
        });
      }
      if (options.contentTemplate) {
        resolve.$template = $q.all([ resolve.$template, fetchTemplate(options.contentTemplate) ]).then(function(templates) {
          var templateEl = angular.element(templates[0]);
          var contentEl = findElement('[ng-bind="content"]', templateEl[0]).removeAttr('ng-bind').html(templates[1]);
          if (!options.templateUrl) contentEl.next().remove();
          return templateEl[0].outerHTML;
        });
      }
      return $q.all(resolve).then(function(locals) {
        var template = transformTemplate(locals.$template);
        if (options.html) {
          template = template.replace(/ng-bind="/gi, 'ng-bind-html="');
        }
        var element = angular.element('<div>').html(template.trim()).contents();
        var linkFn = $compile(element);
        return {
          locals: locals,
          element: element,
          link: function link(scope) {
            locals.$scope = scope;
            if (controller) {
              var invokeCtrl = $controller(controller, locals, true);
              if (bindToController) {
                angular.extend(invokeCtrl.instance, locals);
              }
              var ctrl = angular.isObject(invokeCtrl) ? invokeCtrl : invokeCtrl();
              element.data('$ngControllerController', ctrl);
              element.children().data('$ngControllerController', ctrl);
              if (controllerAs) {
                scope[controllerAs] = ctrl;
              }
            }
            return linkFn.apply(null, arguments);
          }
        };
      });
    };
    function findElement(query, element) {
      return angular.element((element || document).querySelectorAll(query));
    }
    var fetchPromises = {};
    function fetchTemplate(template) {
      if (fetchPromises[template]) return fetchPromises[template];
      return fetchPromises[template] = $http.get(template, {
        cache: $templateCache
      }).then(function(res) {
        return res.data;
      });
    }
  }
  angular.module('mgcrea.ngStrap.dropdown', [ 'mgcrea.ngStrap.tooltip' ]).provider('$bsDropdown', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'dropdown',
      prefixEvent: 'dropdown',
      placement: 'bottom-left',
      templateUrl: 'dropdown/dropdown.tpl.html',
      trigger: 'click',
      container: false,
      keyboard: true,
      html: false,
      delay: 0
    };
    this.$get = ["$window", "$rootScope", "$bsTooltip", "$timeout", function($window, $rootScope, $tooltip, $timeout) {
      var bodyEl = angular.element($window.document.body);
      var matchesSelector = Element.prototype.matchesSelector || Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector;
      function DropdownFactory(element, config) {
        var $dropdown = {};
        var options = angular.extend({}, defaults, config);
        $dropdown.$scope = options.scope && options.scope.$new() || $rootScope.$new();
        $dropdown = $tooltip(element, options);
        var parentEl = element.parent();
        $dropdown.$onKeyDown = function(evt) {
          if (!/(38|40)/.test(evt.keyCode)) return;
          evt.preventDefault();
          evt.stopPropagation();
          var items = angular.element($dropdown.$element[0].querySelectorAll('li:not(.divider) a'));
          if (!items.length) return;
          var index;
          angular.forEach(items, function(el, i) {
            if (matchesSelector && matchesSelector.call(el, ':focus')) index = i;
          });
          if (evt.keyCode === 38 && index > 0) index--; else if (evt.keyCode === 40 && index < items.length - 1) index++; else if (angular.isUndefined(index)) index = 0;
          items.eq(index)[0].focus();
        };
        var show = $dropdown.show;
        $dropdown.show = function() {
          show();
          $timeout(function() {
            if (options.keyboard && $dropdown.$element) $dropdown.$element.on('keydown', $dropdown.$onKeyDown);
            bodyEl.on('click', onBodyClick);
          }, 0, false);
          if (parentEl.hasClass('dropdown')) parentEl.addClass('open');
        };
        var hide = $dropdown.hide;
        $dropdown.hide = function() {
          if (!$dropdown.$isShown) return;
          if (options.keyboard && $dropdown.$element) $dropdown.$element.off('keydown', $dropdown.$onKeyDown);
          bodyEl.off('click', onBodyClick);
          if (parentEl.hasClass('dropdown')) parentEl.removeClass('open');
          hide();
        };
        var destroy = $dropdown.destroy;
        $dropdown.destroy = function() {
          bodyEl.off('click', onBodyClick);
          destroy();
        };
        function onBodyClick(evt) {
          if (evt.target === element[0]) return;
          return evt.target !== element[0] && $dropdown.hide();
        }
        return $dropdown;
      }
      return DropdownFactory;
    } ];
  }).directive('bsDropdown', ["$window", "$sce", "$bsDropdown", function($window, $sce, $dropdown) {
    return {
      restrict: 'EAC',
      scope: true,
      compile: function(tElement, tAttrs) {
        if (!tAttrs.bsDropdown) {
          var nextSibling = tElement[0].nextSibling;
          while (nextSibling && nextSibling.nodeType !== 1) {
            nextSibling = nextSibling.nextSibling;
          }
          if (nextSibling && nextSibling.className.split(' ').indexOf('dropdown-menu') >= 0) {
            tAttrs.template = nextSibling.outerHTML;
            tAttrs.templateUrl = undefined;
            nextSibling.parentNode.removeChild(nextSibling);
          }
        }
        return function postLink(scope, element, attr) {
          var options = {
            scope: scope
          };
          angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'id', 'autoClose' ], function(key) {
            if (angular.isDefined(tAttrs[key])) options[key] = tAttrs[key];
          });
          var falseValueRegExp = /^(false|0|)$/i;
          angular.forEach([ 'html', 'container' ], function(key) {
            if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
          });
          angular.forEach([ 'onBeforeShow', 'onShow', 'onBeforeHide', 'onHide' ], function(key) {
            var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
            if (angular.isDefined(attr[bsKey])) {
              options[key] = scope.$eval(attr[bsKey]);
            }
          });
          if (attr.bsDropdown) {
            scope.$watch(attr.bsDropdown, function(newValue, oldValue) {
              scope.content = newValue;
            }, true);
          }
          var dropdown = $dropdown(element, options);
          if (attr.bsShow) {
            scope.$watch(attr.bsShow, function(newValue, oldValue) {
              if (!dropdown || !angular.isDefined(newValue)) return;
              if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(dropdown),?/i);
              if (newValue === true) {
                dropdown.show();
              } else {
                dropdown.hide();
              }
            });
          }
          scope.$on('$destroy', function() {
            if (dropdown) dropdown.destroy();
            options = null;
            dropdown = null;
          });
        };
      }
    };
  } ]);
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
    this.$get = ["$bsDateFormatter", "$bsDateParser", "$sce", function($dateFormatter, $dateParser, $sce) {
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
    this.$get = ["$window", "$document", "$rootScope", "$sce", "$bsDateFormatter", "datetimepickerViews", "$bsTooltip", "$timeout", function($window, $document, $rootScope, $sce, $dateFormatter, datetimepickerViews, $tooltip, $timeout) {
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
  }).directive('bsDatetimepicker', ["$window", "$parse", "$q", "$bsDateFormatter", "$bsDateParser", "$datetimepicker", function($window, $parse, $q, $dateFormatter, $dateParser, $datetimepicker) {
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
  angular.module('mgcrea.ngStrap.datepicker', [ 'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'mgcrea.ngStrap.tooltip' ]).provider('$bsDatepicker', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'datepicker',
      placement: 'bottom-left',
      templateUrl: 'datepicker/datepicker.tpl.html',
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
    this.$get = ["$window", "$document", "$rootScope", "$sce", "$bsDateFormatter", "bsDatepickerViews", "$bsTooltip", "$timeout", function($window, $document, $rootScope, $sce, $dateFormatter, datepickerViews, $tooltip, $timeout) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      var isTouch = 'createTouch' in $window.document && isNative;
      if (!defaults.lang) defaults.lang = $dateFormatter.getDefaultLocale();
      function DatepickerFactory(element, controller, config) {
        var $datepicker = $tooltip(element, angular.extend({}, defaults, config));
        var parentScope = config.scope;
        var options = $datepicker.$options;
        var scope = $datepicker.$scope;
        if (options.startView) options.startView -= options.minView;
        var pickerViews = datepickerViews($datepicker);
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
              date: date.getDate()
            });
            $datepicker.setMode(scope.$mode - 1);
            $datepicker.$build();
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
          var targetDate = new Date(Date.UTC(viewDate.year + (steps.year || 0) * value, viewDate.month + (steps.month || 0) * value, 1));
          angular.extend(viewDate, {
            year: targetDate.getUTCFullYear(),
            month: targetDate.getUTCMonth(),
            date: targetDate.getUTCDate()
          });
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
        function updateSelected(el) {
          el.selected = $datepicker.$isSelected(el.date);
        }
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
      DatepickerFactory.defaults = defaults;
      return DatepickerFactory;
    } ];
  }).directive('bsDatepicker', ["$window", "$parse", "$q", "$bsDateFormatter", "$bsDateParser", "$bsDatepicker", function($window, $parse, $q, $dateFormatter, $dateParser, $datepicker) {
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
        var datepicker = $datepicker(element, controller, options);
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
  } ]).provider('bsDatepickerViews', function() {
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
    this.$get = ["$bsDateFormatter", "$bsDateParser", "$sce", function($dateFormatter, $dateParser, $sce) {
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
          },
          onKeyDown: function(evt) {
            if (!picker.$date) {
              return;
            }
            var actualTime = picker.$date.getTime();
            var newDate;
            if (evt.keyCode === 37) newDate = new Date(actualTime - 1 * 864e5); else if (evt.keyCode === 38) newDate = new Date(actualTime - 7 * 864e5); else if (evt.keyCode === 39) newDate = new Date(actualTime + 1 * 864e5); else if (evt.keyCode === 40) newDate = new Date(actualTime + 7 * 864e5);
            if (!this.isDisabled(newDate)) picker.select(newDate, true);
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
            if (evt.keyCode === 37) newDate.setMonth(actualMonth - 1); else if (evt.keyCode === 38) newDate.setMonth(actualMonth - 4); else if (evt.keyCode === 39) newDate.setMonth(actualMonth + 1); else if (evt.keyCode === 40) newDate.setMonth(actualMonth + 4);
            if (!this.isDisabled(newDate)) picker.select(newDate, true);
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
            if (evt.keyCode === 37) newDate.setYear(actualYear - 1); else if (evt.keyCode === 38) newDate.setYear(actualYear - 4); else if (evt.keyCode === 39) newDate.setYear(actualYear + 1); else if (evt.keyCode === 40) newDate.setYear(actualYear + 4);
            if (!this.isDisabled(newDate)) picker.select(newDate, true);
          }
        } ];
        return {
          views: options.minView ? Array.prototype.slice.call(views, options.minView) : views,
          viewDate: viewDate
        };
      };
    } ];
  });
  angular.module('mgcrea.ngStrap.alert', [ 'mgcrea.ngStrap.modal' ]).provider('$bsAlert', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'alert',
      prefixEvent: 'alert',
      placement: null,
      templateUrl: 'alert/alert.tpl.html',
      container: false,
      element: null,
      backdrop: false,
      keyboard: true,
      show: true,
      duration: false,
      type: false,
      dismissible: true
    };
    this.$get = ["$bsModal", "$timeout", function($modal, $timeout) {
      function AlertFactory(config) {
        var $alert = {};
        var options = angular.extend({}, defaults, config);
        $alert = $modal(options);
        $alert.$scope.dismissible = !!options.dismissible;
        if (options.type) {
          $alert.$scope.type = options.type;
        }
        var show = $alert.show;
        if (options.duration) {
          $alert.show = function() {
            show();
            $timeout(function() {
              $alert.hide();
            }, options.duration * 1e3);
          };
        }
        return $alert;
      }
      return AlertFactory;
    } ];
  }).directive('bsAlert', ["$window", "$sce", "$bsAlert", function($window, $sce, $alert) {
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {
        var options = {
          scope: scope,
          element: element,
          show: false
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'keyboard', 'html', 'container', 'animation', 'duration', 'dismissible' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'keyboard', 'html', 'container', 'dismissible' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });
        angular.forEach([ 'onBeforeShow', 'onShow', 'onBeforeHide', 'onHide' ], function(key) {
          var bsKey = 'bs' + key.charAt(0).toUpperCase() + key.slice(1);
          if (angular.isDefined(attr[bsKey])) {
            options[key] = scope.$eval(attr[bsKey]);
          }
        });
        if (!scope.hasOwnProperty('title')) {
          scope.title = '';
        }
        angular.forEach([ 'title', 'content', 'type' ], function(key) {
          if (attr[key]) {
            attr.$observe(key, function(newValue, oldValue) {
              scope[key] = $sce.trustAsHtml(newValue);
            });
          }
        });
        if (attr.bsAlert) {
          scope.$watch(attr.bsAlert, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.content = newValue;
            }
          }, true);
        }
        var alert = $alert(options);
        element.on(attr.trigger || 'click', alert.toggle);
        scope.$on('$destroy', function() {
          if (alert) alert.destroy();
          options = null;
          alert = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap', [ 'mgcrea.ngStrap.modal', 'mgcrea.ngStrap.alert', 'mgcrea.ngStrap.select', 'mgcrea.ngStrap.datepicker', 'mgcrea.ngStrap.rangedatepicker', 'mgcrea.ngStrap.timepicker', 'mgcrea.ngStrap.datetimepicker', 'mgcrea.ngStrap.tooltip', 'mgcrea.ngStrap.popover', 'mgcrea.ngStrap.dropdown', 'mgcrea.ngStrap.tab', 'mgcrea.ngStrap.pagination', 'mgcrea.ngStrap.sort' ]);
})(window, document);