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
  } else if (typeof === 'function') {
    return createComponentShape(type, props, children)
  } else if (type.Type != null) {
    return cloneElement(type, props, children)
  }
}
