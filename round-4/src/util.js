export function noop() {}
export const options = {
  beforeUnmount: noop,
  afterMount: noop,
  afterUpdate: noop
};

var numberMap = {
  "[object Null]": 1,
  "[object Boolean]": 2,
  "[object Number]": 3,
  "[object String]": 4,
  "[object Function]": 5,
  "[object Symbol]": 6,
  "[object Array]": 7
};

// undefined: 0, null: 1, boolean:2, number: 3, string: 4, function: 5, array: 6, object:7
export function typeNumber(data) {
  if (data === void 666) {
    return 0;
  }
  var a = numberMap[__type.call(data)];
  return a || 8;
}

/**
 * 小写化的优化
 *
 * @export
 * @param {any} s
 * @returns
 */
export function toLowerCase(s) {
  return lowerCache[s] || (lowerCache[s] = s.toLowerCase());
}

/**
 *
 * @param {any[]} ary
 * @return 返回清除的 data
 */
export function clearArray(ary) {
  return ary.splice(0, ary.length);
}

export function extend(target, source) {
  if (source) {
    for (const name in source) {
      if (source.hasOwnProperty(name)) {
        const value = source[name];
        target[name] = value;
      }
    }
  }
  return target;
}
function isFn(obj) {
  return typeNumber(obj) === 5;
}
