import { scheduler } from "./scheduler";
import { isFn, noop } from "./util";

export var eventHooks = {}; //用于在元素上绑定特定的事件

export var isTouch = "ontouchstart" in document;
//根据onXXX得到其全小写的事件名, onClick --> click, onClickCapture --> click,
// onMouseMove --> mousemove

export var eventLowerCache = {
  onClick: "click",
  onChange: "change",
  onWheel: "wheel"
};

function collectPaths(e) {
  var target = e.target;
  var paths = [];
  do {
    var events = target.__events;
    if (events) {
      paths.push({ dom: target, events: events });
    }
  } while ((target = target.parentNode) && target.nodeType === 1);
  // target --> parentNode --> body --> html
  return paths;
}
function triggerEventFlow(paths, prop, e) {
  for (var i = paths.length; i--; ) {
    var path = paths[i];
    var fn = path.events[prop];
    if (isFn(fn)) {
      e.currentTarget = path.dom;
      fn.call(path.dom, e);
      if (e._stopPropagation) {
        break;
      }
    }
  }
}

export function dispatchEvent(e) {
  //__type__ 在injectTapEventPlugin里用到
  var bubble = e.__type__ || e.type;

  e = new SyntheticEvent(e);

  // 修复 ie 等事件传递的不同处
  var hook = eventPropHooks[bubble];

  if (hook && false === hook(e)) {
    return;
  }

  var paths = collectPaths(e);

  var captured = bubble + "capture";

  /**
   * 
   * 为什么在这里要 run 一次?
   * 
   */
  scheduler.run();
  triggerEventFlow(paths, captured, e);

  if (!e._stopPropagation) {
    triggerEventFlow(paths.reverse(), bubble, e);
  }
}

var ron = /^on/;
var rcapture = /Capture$/;
export function getBrowserName(onStr) {
  var lower = eventLowerCache[onStr];
  if (lower) {
    return lower;
  }
  var camel = onStr.replace(ron, "").replace(rcapture, "");
  lower = camel.toLowerCase();
  eventLowerCache[onStr] = lower;
  return lower;
}

"blur,focus,mouseenter,mouseleave".replace(/\w+/g, function(type) {
  eventHooks[type] = function(dom) {
    addEvent(
      dom,
      type,
      function(e) {
        dispatchEvent(e);
      },
      true
    );
  };
});

if (isTouch) {
  eventHooks.click = noop;
  eventHooks.clickcapture = noop;
}

export function addGlobalEventListener(name) {
  if (!globalEvents[name]) {
    globalEvents[name] = true;
    addEvent(document, name, dispatchEvent);
  }
}



var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, "passive", {
    get: function() {
      supportsPassive = true;
    }
  });
  document.addEventListener("test", null, opts);
} catch (e) {}



export function addEvent(el, type, fn, bool) {
  if (el.addEventListener) {
    // Unable to preventDefault inside passive event listener due to target being
    // treated as passive
    el.addEventListener(
      type,
      fn,
      /true|false/.test(bool)
        ? bool
        : supportsPassive
          ? {
              passive: false
            }
          : false
    );
  } else if (el.attachEvent) {
    el.attachEvent("on" + type, fn);
  }
}

export function SyntheticEvent(event) {
  if (event.originalEvent) {
    return event;
  }
  for (var i in event) {
    if (!eventProto[i]) {
      this[i] = event[i];
    }
  }
  if (!this.target) {
    this.target = event.srcElement;
  }
  var target = this.target;
  this.fixEvent();
  this.timeStamp = new Date() - 0;
  this.originalEvent = event;
}


var eventProto = (SyntheticEvent.prototype = {
  fixEvent: function() {}, //留给以后扩展用
  preventDefault: function() {
    var e = this.originalEvent || {};
    e.returnValue = this.returnValue = false;
    if (e.preventDefault) {
      e.preventDefault();
    }
  },
  fixHooks: function() {},
  stopPropagation: function() {
    var e = this.originalEvent || {};
    e.cancelBubble = this._stopPropagation = true;
    if (e.stopPropagation) {
      e.stopPropagation();
    }
  },
  stopImmediatePropagation: function() {
    this.stopPropagation();
    this.stopImmediate = true;
  },
  toString: function() {
    return "[object Event]";
  }
});

/* istanbul ignore next  */
//freeze_start
Object.freeze ||
  (Object.freeze = function(a) {
    return a;
  });
//freeze_end

