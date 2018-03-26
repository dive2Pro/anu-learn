import {noop, typeNumber} from './util'
import {addGlobalEventListener, getBrowserName} from './event'
var globalEvents = {};

function getHookType(name, val, type, dom) {
  if (specialProps[name]) return name;
  if (boolAttributes[name] && booleanTag[type]) {
    return "boolean";
  }
  if (isEventName(name)) {
    return "__event__";
  }
  if (typeNumber(val) < 3 && !val) {
    return "removeAttribute";
  }
  return name.indexOf("data-") === 0 || dom[name] === void 666
    ? "setAttribute"
    : "property";
}

/**
 * 
 * 修改 DOM 的事件和属性
 * 
 * @param {object} nextProps 
 * @param {object} lastProps 
 * @param {Vnode} vnode 
 * @param {Vnode} lastVnode 
 * @param {Node} dom 
 */
export function diffProps(nextProps, lastProps, vnode, lastVnode, dom){
  for (let name in nextProps) {
      let val = nextProps[name];
      if (val !== lastProps[name]) {
        var hookName = getHookType(name, val, vnode.type, dom);
        propHooks[hookName](dom, name, val, lastProps);
      }
    }
    //如果旧属性在新属性对象不存在，那么移除DOM eslint-disable-next-line
    for (let name in lastProps) {
      if (!nextProps.hasOwnProperty(name)) {
        var hookName2 = getHookType(name, false, vnode.type, dom);
        propHooks[hookName2](
          dom,
          name,
          builtIdProperties[name] ? "" : false,
          lastProps
        );
      }
    }
}




var svgprops = {
  xlinkActuate: "xlink:actuate",
  xlinkArcrole: "xlink:arcrole",
  xlinkHref: "xlink:href",
  xlinkRole: "xlink:role",
  xlinkShow: "xlink:show"
};
var emptyStyle = {};
var propHooks = {
  boolean: function(dom, name, val, lastProp) {
    // 布尔属性必须使用el.xxx = true|false方式设值 如果为false, IE全系列下相当于setAttribute(xxx,''),
    // 会影响到样式,需要进一步处理 eslint-disable-next-line
    dom[name] = !!val;
    if (!val) {
      dom.removeAttribute(name);
    }
  },
  removeAttribute: function(dom, name) {
    dom.removeAttribute(name);
  },
  setAttribute: function(dom, name, val) {
    try {
      dom.setAttribute(name, val);
    } catch (e) {
      console.log("setAttribute error", name, val);
    }
  },
  svgClass: function(dom, name, val, lastProp) {
    if (!val) {
      dom.removeAttribute("class");
    } else {
      dom.setAttribute("class", val);
    }
  },
  svgAttr: function(dom, name, val) {
    var method =
      typeNumber(val) < 3 && !val ? "removeAttribute" : "setAttribute";
    if (svgprops[name]) {
      dom[method + "NS"](xlink, svgprops[name], val || "");
    } else {
      dom[method](toLowerCase(name), val || "");
    }
  },
  property: function(dom, name, val) {
    if (name !== "value" || dom[name] !== val) {
      dom[name] = val;
      if (controlled[name]) {
        dom._lastValue = val;
      }
    }
  },
  children: noop,
  className: function(dom, _, val, lastProps) {
    dom.className = val;
  },
  style: function(dom, _, val, lastProps) {
    patchStyle(dom, lastProps.style || emptyStyle, val || emptyStyle);
  },
  __event__: function(dom, name, val, lastProps) {
    let events = dom.__events || (dom.__events = {});

    if (val === false) {
      delete events[toLowerCase(name.slice(2))];
    } else {
      if (!lastProps[name]) {
        //添加全局监听事件
        var _name = getBrowserName(name);
        addGlobalEventListener(_name);
        var hook = eventHooks[_name];
        if (hook) {
          hook(dom, name);
        }
      }
      //onClick --> click, onClickCapture --> clickcapture
      events[toLowerCase(name.slice(2))] = val;
    }
  },

  dangerouslySetInnerHTML: function(dom, name, val, lastProps) {
    var oldhtml = lastProps[name] && lastProps[name].__html;
    if (val && val.__html !== oldhtml) {
      dom.innerHTML = val.__html;
    }
  }
};