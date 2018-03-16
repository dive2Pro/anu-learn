import {Component} from './component/index'
import createClass from './component/createClass'
import {createEmptyShape, createComponentShape, createTextShape} from './shapes'
import {assignDefaultProps} from './props'
import {createElement} from './element/index'
/**
 * 
 * @param {(element | Function | vnode)} subject 
 * @param {Component} component 
 */
function extractVirtualNode(subject, component) {
  if (!subject) {
    return createEmptyShape()
  }

  if (subject.Type !== void 0) {
    return subject
  }

  // portal
  // ...
  switch(subject.constructor) {
    case Component : {
      return createComponentShape(subject, objEmpty, arrEmpty)
    }
    case Boolean: 
      return createEmptyShape()
    case String:
    case Number:
      return createTextShape(subject)
    case Array:
      return createElementShape('@', null, subject)
    case Function:
      // stream ? 
      if (subject.then !== null && typeof subject.then === 'function') {
        // 为什么不 传递 Component.props
        return extractVirtualNode(subject(), component)
      } else if (subject.prototype !== void 0 && subject.prototype.render !== void 0) {
        return createComponentShape(subject, objEmpty, arrEmpty)
      } else {
        return extractVirtualNode(subject( component ? component.props : {}), component)
      }
  }

  if (typeof subject.render === 'function') {
    return (
      subject.DOMCache ||
      createComponentShape(subject.DOMCache = createClass(subject, null), objEmpty, arrEmpty)
    )
  }
}

/**
 * 重新 执行 render 方法
 * 
 * @param {Component} component 
 * @return {Vnode} Vnode
 */
export function extractRenderNode(component) {
  try{

    return extractVirtualNode(
      component.render(component.props, component.state, component),
      component
    )
  } catch(e) {
    return createEmptyShape()
  }
}
/**
 * 
 * @param {vnode} subject 
 * @param {component} instance 
 * @param {vnode} parent 
 */
export function extractComponentNode(subject, instance, parent) {
  // @type {Component}
  var owner
  var vnode

  var type = subject.type

  var props = subject.props

  if (subject.defaultProps !== void 0 ) {
    props === objEmpty ? (props = subject.defaultProps) : assignDefaultProps( subject.defaultProps , props)

  }

  if (subject.children.length) {
    if (props === objEmpty) {
      props = { children: subject.children}
    } else {
      props.children = subject.children
    }
  }

  if (type.COMPCache !== void 0) {
    owner = type.COMPCache
  }
  // function component
  else if (type.constructor === Function && (type.prototype === void 0 || type.prototype.render === void 0)) {
    vnode = extractFunctionNode(type, props)

    if (vnode.Type === void 0) {
      vnode = createClass(vnode, props)
    } else {
      return vnode
    }
  } else {
    // component / createClass component
    owner = type
  }

  // create component instance
  var component = subject.instance = new owner(props)

  var vnode = extractRenderNode(component)

  if (vnode.Type === 2) {
    vnode = extractComponentNode(vnode, component, parent || subject)
  }
  // 到这里, 已经生成了新的 vnode,  所以要把之前 key 

  if (subject.key !== void 0 && vnode.key === void 0) {
    vnode.key = subject.key
  }

  subject.props = vnode.props
  subject.children = vnode.children

  // 这里是 recursive component
  if(instance !== null) {
    component['--vnode'] = parent
  } else {
    component['--vnode'] = subject
    subject.nodeName = vnode.type
  }

  return vnode
}

/**
 * 
 * 从 function 中拿到 Element
 * @param {type} type 
 * @param {object} props 
 */
function extractFunctionNode (type, props) {
  try{
    var vnode 
    var func  = type['--func'] !== void 0

    if (func === false) {
      vnode = type(createElement)
    }

    if (func || vnode.Type !== void 0) {
      try {
        // call to invoke function component
        vnode = type(props)

        if (func === false) {
          type['--func'] = true
        }
      } catch(e) {
        vnode = createEmptyShape()
      }
    }
    return vnode
  } catch(e) {
    return createEmptyShape()
  }
}