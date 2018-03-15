import {createComponentShape, createElementShape, createEmptyShape} from '../shapes'
import {createChild} from './createChild'
export function createElement(type, props) {
  if(type == null) {
    return createEmptyShape()
  }

  var length = arguments.length
  var children = []

  var index = 0

  for(var i = 2 ; i < length ; i++ ) {
    var child = arguments[i]
    if(child !=null) {

      if (child.constructor === Array) {
        for(var j = 0, len = child.length ; j < len; j ++) {
          index = createChild(child[j], children, index)
        }
      } else {
        index = createChild(child, children, index)
      }
    }
  }

  var typeOf = typeof type

  if (typeOf === 'string') {
    if(props === null) {
      props = {}
    }

    return createElementShape(type, props, children)
  } else if (typeOf === 'function') {
    return createComponentShape(type, props, children)
  } else if (type.Type != null) {
    return cloneElement(type, props, children)
  }
}
/**
 * ``` cloneElement(<MyComponent />, props, children) ```
 * having original element's props
 * new children replacing exiting ones
 * @param {vnode} subject 
 * @param {object} props 
 * @param {any[]} children 
 * @return {Vnode}
 */
export function cloneElement(subject, newProps, newChildren) {
    var type = subject.type
    var oldProps = subject.props
    var children = subject.children

    newProps = newProps = {}
    for (const name in oldProps) {
      if(newProps[name] === void 0) {
        newProps[name] = oldProps[name]
      }
    }

    if (newChildren) {
      var length = newChildren.length

      if (length > 0) {
        children  = []
        var index = 0
        for( var i = 0; i < length ; i ++) {
          var child = newChildren[i]
          index = createChild(child, children, index)
        }
      }
    }

    return createElement(type, newProps, children)
}