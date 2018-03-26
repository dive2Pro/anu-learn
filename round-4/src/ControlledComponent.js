import { typeNumber } from "./util";

export function processFormElement(vnode, dom, props) {
  const domType = dom.type;
  const duplexType = duplexMap[domType];
  if (duplexType) {
    const data = duplexData[duplexType];
    const [duplexProp, keys, eventName] = data;

    if (duplexProp in props && !hasOtherControlleProperty(props, keys)) {
      // eslint-disable-next-line
      console.warn(`你为${
        vnode.type
      }[type=${domType}]元素指定了${duplexProp}属性，但是没有提供另外的${Object.keys(
        keys
      )}等用于控制${duplexProp}\n
            变化的属性，那么它是一个非受控组件，用户无法通过输入改变元素的${duplexProp}值`);
      // preventEvent
      dom[eventName] = data[3];
    }
    if (duplexType === 3) {
      postUpdateSelectedOptions(vnode);
    }
  }
}
function hasOtherControllProperty(props, keys) {
  for (var key in props) {
    if (keys[key]) {
      return true;
    }
  }
}

var duplexMap = {
  color: 1,
  date: 1,
  datetime: 1,
  "datetime-local": 1,
  email: 1,
  month: 1,
  number: 1,
  password: 1,
  range: 1,
  search: 1,
  tel: 1,
  text: 1,
  time: 1,
  url: 1,
  week: 1,
  textarea: 1,
  checkbox: 2,
  radio: 2,
  "select-one": 3,
  "select-multiple": 3
};

var duplexData = {
  1: [
    "value",
    {
      onChange: 1,
      onInput: 1,
      readOnly: 1,
      disabled: 1
    },
    "oninput",
    preventUserInput
  ],
  2: [
    "checked",
    {
      onChange: 1,
      onClick: 1,
      readOnly: 1,
      disabled: 1
    },
    "onclick",
    preventUserClick
  ],
  3: [
    "value",
    {
      onChange: 1,
      disabled: 1
    },
    "onchange",
    preventUserChange
  ]
};

export function postUpdateSelectedOptions(vnode) {
  var props = vnode.props,
    multiple = !!props.multiple,
    value =
      typeNumber(props.value) > 1
        ? props.value
        : typeNumber(props.defaultValue) > 1
          ? props.defaultValue
          : multiple ? [] : "",
    options = [];
  collectOptions(vnode, props, options);
  if (multiple) {
    updateOptionsMore(options, options.length, value);
  } else {
    updateOptionsOne(options, options.length, value);
  }
}

function collectOptions(vnode, props, ret) {
  const arr = props.children;
  for (let i = 0, n = arr.length; i < n; i++) {
    let el = arr[i];
    if (el.type === "option") {
      ret.push(el);
    } else if (el.type === "optgroup") {
      collectOptions(el, el.props, ret);
    }
  }
}

function updateOptionsMore(options, n, propValue) {
  var selectedValue = {};
  try {
    for (let i = 0; i < propValue.length; i++) {
      selectedValue["&" + propValue[i]] = true;
    }
  } catch (e) {
    /* istanbul ignore next */
    console.warn('<select multiple="true"> 的value应该对应一个字符串数组'); // eslint-disable-line
  }

  for (let i = 0; i < n; i++) {
    let option = options[i];
    let value = getOptionValue(option, option.props);
    let selected = selectedValue.hasOwnProperty("&" + value);
    getOptionSelected(option, selected);
  }
}
function getOptionValue(option, props) {
  if (!props) {
    return getDOMOptionValue(option);
  }
  return props.value === undefined ? props.children[0].text : props.value;
}

function updateOptionsOne(options, n, propValue) {
  var selectedValue = "" + propValue;
  for (let i = 0; i < n; i++) {
    let option = options[i];
    let value = getOptionValue(option, option.props);
    if (value === selectedValue) {
      getOptionSelected(option, true);
      return;
    }
  }
  if (n) {
    getOptionSelected(options[0], true);
  }
}
function getOptionSelected(option, selected) {
  var dom = option._hostNode || option;
  dom.selected = selected;
}
