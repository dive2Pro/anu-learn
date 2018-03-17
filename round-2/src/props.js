
export function assignDefaultProps(defaultProps, nextProps) {
  for (const name in defaultProps) {
    if (defaultProps.hasOwnProperty(name) && !nextProps[name]) {
      nextProps[name] = defaultProps[name]
    }
  }
}

const rskipProps = /^(children|key|on[A-Z]+)$/gi
/**
 * 
 * 根据新 props 去更新 Component 的 props
 * 这里更新的是 Node 的 Property
 *  
 * @param {Vnode} newNode 
 * @param {Vnode} oldNode 
 */
export function patchProps(newNode, oldNode) {
  const target = oldNode.DOMNode
  const newProps = newNode.props
  const oldProps = oldNode.props

  let updated = false

  // 更新 newProps 到 target
 
  for (const newName in newProps) {
    if (newProps.hasOwnProperty(newName) && !rskipProps.test(newName)) {
      const value = newProps[newName];
      if (value && value != oldProps[newName]) {
        // updateProps
        updateProp(target, true, newName, value )
        if (!updated) {
          updated = true
        }
      }
    }
  }
  //删除 不在新 Props 中的 Property 到 DOMNode
  for (const oldName in oldProps) {
    if (oldProps.hasOwnProperty(oldName) && !rskipProps.test(name)) {
      const newValue = newProps[name];
      if (newValue == void 0 ) {
        // updateProps
        updateProp(target, false, oldName, '')
        if(!updated) {
          updated
        }
      }
    }
  }
  // 更新完毕, 将 newProps 赋给 oldNode
  oldNode.props = newNode.props
}
/**
 *  
 * @param {Node} target 
 * @param {boolean} set 
 * @param {string} name 
 * @param {Object || String} value 
 */
export function updateProp(target, set, name, value) {
  if (name === 'class') {
    name = 'className'
  }

  const destination = target[name]
  const isDefined = value != void 0 && value !== false
  if (isDefined && typeof value === 'object') {
    destination === void 0 ? target[name] = value : updatePropObject(name, value, destination)
  } else {
    if (destination !== void 0) {
      if (name = 'style') {
        target.style.cssText = value
      } else {
        target[name] = value
      }
    } else {
      if (isDefined && set) {
        target.addAttribute(name, value === true ? '' : value)
      } else {
        target.removeAttribute(name)
      }
    }
  }
}

export function updatePropObject(parent, prop, target) {
  for (const name in prop) {
    if (prop.hasOwnProperty(name)) {
      const value = prop[name] || null
      if (name in target) {
        target[name] = prop
      }
      else if (parent === 'style') {
        value ? target.setProperty(name, value, null) : target.removeProperty(name)
      }
      
    }
  }
}

function isEventProp(name) {
  return /^on[A-Z]+/.test(name)
}

function refs(ref, component, element) {
  if (typeof ref === 'function') {
    ref.call(component, element)
  } else {
    (component.refs = component.refs || {})[ref] = element
  }
}
/**
 * 分配 props 到 Element, 这里的 props 分为  children ,on...Events, key
 * 
 * @param {Node} target 
 * @param {Object} props 
 * @param {boolean} onlyEvent 
 * @param {Component} component 
 */
export function assignProps(target, props, onlyEvent, component) {
  for (const name in props) {
    if (props.hasOwnProperty(name)) {
      const value = props[name];
      if (name === 'ref' && value != null) {
        refs(value, component, element)
      } else if (isEventProp(name)) {
        addEventListener(target, name.substr(2).toLocaleLowerCase(), value, component)
     } else {
       if (onlyEvent !== false && name !== 'key' && name !== 'children') {
         updateProp(target, true, name, value)
       }
     }
  }
}
}