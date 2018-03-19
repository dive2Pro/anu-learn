import { getInstances, isComponent, extend } from './utils'
import { applyComponentHook } from './lifecycle'
function Component(props, context) {
  this.props = props
  this.context = context
  if(!this.state) {
    this.state = {}
  }
}

Component.prototype = {
  setState: function (state, cb) {
    const s = this.state
    this.prevState = this.prevState || clone(s)

    extend(s, state)
    updateComponent(this)
  },
  forceUpdate: function() {
    updateComponent(this)
  },
  // TODO: Stateless Component
  render: function() {

  }
}

function updateComponent(instance) {
  let {state, props, prevState, prevProps, vnode, context} = instance
  let dom = vnode.dom
  prevProps = prevProps || props
  prevState = prevState || state
  const nextProps = props
  const nextState = state
  instance.props = prevProps
  instance.state = prevState

  if (applyComponentHook(instance, 4, nextProps, nextState, context) === false) {
    return dom
  }

  applyComponentHook(instance, 5, nextProps, nextState, context);
  
  instance.props = nextProps
  instance.state = nextState
  

}
/**
 * 
 * @param {VNode} vnode 
 * @param {Object} context 
 * @return {type: render().type, props: }
 */
export function toVnode(vnode, context) {

  const Type = vnode.type
  if(isComponent(Type)) {
    const newProps = clone(vnode.props)
    const props = Type.defaultProps || applyComponentHook(Type, -2) || {}

    extend(props, newProps)

    const instance = new Type(props)

    Component.call(instance, props, context) // turn it to Component

    applyComponentHook(instance, 0)

    const renderer = instance.render() // Vnode {type, props}

    // 建立 vnode 之间的层级关系
    if (vnode.instance) {
      instance.parentInstance = vnode.instance
      vnode.instance.childInstance= instance
    }

    extend(vnode, renderer)
    instance.vnode = vnode
    vnode.instance = instance
    
    return toVnode(vnode, context)
  } else {
    return vnode
  }

}
/**
 * 
 * @param {VNode} vnode 
 * @param {Object} context 
 * @param {Node?} parentNode 
 * @param {DOM?} replaced 
 */
export function toDOM(vnode, context, parentNode, replaced) {
  vnode = toVnode(vnode, context)
  let dom 
  if (vnode.type === '@text') {
    dom = document.createTextNode(dom.text)
  }else {
    dom = document.createElement(dom.type)
    dom.__type = vnode.type
    // diff props? 
    // diff children

  }

  const instance = vnode.instance
  // !vnode.dom  表示尚未 mount 到 DOM 中
  const canComponentDidMount = instance && !vnode.dom

  vnode.dom = dom

  if (parentNode) {
    // 收集它的父组件的 instance
    // TODO:  那会不会一个 Parent Component 多次执行这个方法呢?
    let instances 
    if (canComponentDidMount) {
      instances = getInstances(instance)
    }

    if(replaced) {
      parentNode.replaceChild(dom, replaced)
    } else {
      parentNode.appendChild(dom)
    }

    if (instances) {
      while(instance = instances.shift()) {
        applyComponentHook(instance, 2)
      }
    }
  }

  return dom
}