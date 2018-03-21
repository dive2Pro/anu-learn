const hasOwnProperty = Object.prototype.hasOwnProperty

function is(x, y) {
  if (x === y) { // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    return x !== 0 || 1 / x === 1 / y;
  } else {
   // Step 6.a: NaN == NaN
   return x !== x && y !== y;
  }
}

export function shallowEqual(obj, nextObj) {
  if (is(obj, nextObj)) {
    return
  }
  if(typeof obj !== 'object' || obj === null || typeof nextObj !== 'object' || nextObj === null) {
    return false
  }
  const keysA = Object.keys(obj)
  const keysB = Object.keys(nextObj)

  if (keysA.length != keysB.length) {
    return false
  }

  for(let i = 0 ; i < keysA.length ; i ++) {
    if (!hasOwnProperty.call(obj, keysB[i]) ||
        !is(obj[keysA[i]], nextObj[keysB[i]])) {
      return false
    }
  }

  return true
}