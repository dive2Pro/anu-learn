import {createComponentShape, createTextShape} from '../shapes'

export function createChild(child, children, index) {
  if (!child) {
    // 证明他已经是 vnode
    if (child.Type !== void 0) {
      children[index ++ ] = child
    } else if (child.nodeType !== void 0) {
      // portal
    } else {
      var type = typeof child
      if (type === 'function') {
        children[index ++] = createComponentShape(child, objEmpty, arrEmpty)
      }

      else if ( type === 'object') {
        // array
        for (var i = 0, len = child.length; i < len; i ++) {
          index = createChild(child[i], children, index)
        }
      } else {
        // element
        children[index ++ ] = createTextShape(type !== 'boolean' ? child : '')
      }
    }
  }

  return index
}