import { getInstances, isComponent, extend, isSameType, matchInstance, isEvent, clone } from './utils'
import { applyComponentHook } from './lifeCycle'
export function Component(props, context) {
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
  // shouldComponentUpdate
  if (applyComponentHook(instance, 4, nextProps, nextState, context) === false) {
    return dom
  }
  // componentWillUpdate
  applyComponentHook(instance, 5, nextProps, nextState, context);
  // 此时 props 更新到 instance
  instance.props = nextProps
  instance.state = nextState
  const rendered = instance.render()
  
  if(instance.getChildContext) {
    context = extend(clone(context), instance.getChildContext())
  }
  /**
   * 在 diff 中会去操作 dom
   * 
   */
  dom = diff(dom, rendered, context, dom.parentNode, instance.vnode)
  instance.vnode = rendered

  rendered.dom = dom

  delete instance.prevProps
  delete instance.prevState

  applyComponentHook(instance, 6, nextProps, nextState, context)

  return dom
}
/**
 * diff 算法
 * vnode 是刚刚 通过 render 方法生成的 但是没有 递归去 得到 简单数据类型的 type, 所以这是 Component 的 render
 * eg: 
 * render() {
 *  return <A/>
 * }
 * 那么 vnode = { type : A , props : anything }
 * prevVnode 已经 经过 toVnode , 它被打薄了, 所以 如果在 Component A 中是这样的
 * 
 * function A () {
 *  return <h2>Hello</h2>
 * }
 * prevVnode 就会 =  {
 *  type: h2,
 *  props : {
 *    children: [
 *        {type: '@text', text: "Hello"}
 *    ]
 *  }
 * }
 * 
 * @param {Node} oldDom 
 * @param {VNode} vnode 
 * @param {Object} context 
 * @param {Node} parentNode 
 * @param {VNode} prevVnode 
 */
function diff(oldDom, vnode, context, parentNode, prevVnode) {
  const prevProps = prevVnode.props
  const prevChildren = prevProps.children
  const Type = vnode.type
  /**
   * 证明这是个需要 重新 生成新的 dom 的 vnode
   */
  if (!oldDom || !isSameType(oldDom, vnode)) {
    if (typeof Type === 'function') {
      let instance = prevVnode.instance
      if (instance) {
        // 从 打薄的 vnode 的 instance 往上找 符合  Type 的 instance
        instance = matchInstance(instance, Type)
       
        if (instance) {
          vnode.instance = instance
          instance.prevProps = instance.prevProps || prevProps
          applyComponentHook(instance, 3, vnode.props)

          instance.props = vnode.props

          return updateComponent(instance)
        } else {
          removeComponent(prevVnode)
        }
      }

      return toDOM(vnode, context, parentNode, prevVnode.dom)

    }
    // 普通节点
    const nextDom = document.createElement(Type)
    if(oldDom) {
      while(oldDom.firstChild) {
        nextDom.appendChild(oldDom.firstChild)
      }
    }

    if (parentNode) {
      parentNode.replaceChild(nextDom, oldDom)
    }
    oldDom = nextDom
  }
  diffProps(oldDom, prevProps, vnode.props)
  diffChildren(oldDom, vnode.props.children, context, prevChildren)

  return oldDom
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
    // flat Component vnode to normal vnode
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
 * @param {Node} dom 
 * @param {Object} props 
 * @param {Object} nextProps 
 */
function diffProps(dom, props, nextProps) {
  for(const name in nextProps) {
    if (name === 'children') {
      continue
    }
    const value = nextProps[name]
    if (isEvent(name, value)) {
      if (!props[name]) {
        dom.addEventListener(name.slice(2).toLocaleLowerCase(), value)
        props[name] = value
      }
      continue
    }

    if(value !== props[name]) {
      if (!value) {
        dom.removeAttribute(name)
        delete props[name]
      } else {
        dom.setAttribute(name, value)
        props[name] = value
      }
    }
  }

  for(const name in props) {
    if(!nextProps[name]) {
      if(isEvent(name, props[name])) {
        dom.removeEventListener(name)
      } else {
        dom.removeAttribute(name)
      }
      delete props[name]
    }
  }
}

function removeComponent(vnode) {
  var instance = vnode.instance
  applyComponentHook(instance, 7) //7
  if (instance) {
      instance.vnode = instance.props = instance.context = vnode.instance = vnode.dom = void 666
  }
  vnode.props.children.forEach(el => {
    el.props && removeComponent(el)
  })
}
/**
 * 指导思想: 
 *  遍历 newChildren, 如果 和 oldChildren 在同位置上是相同的类型 则进行 尝试替换操作
 *  否则 createDom 给 newChildren[i].dom
 *  oldChildren 中 额外的 child 需要 remove
 * @param {Node} parentNode 
 * @param {VNode[]} newChildren 
 * @param {Object} context 
 * @param {VNode[]} oldChildren 
 */
function diffChildren(parentNode, newChildren, context, oldChildren) {
  newChildren.forEach((vnode, i) => {
    const old = oldChildren[i]

    if (old && vnode) {
      if (old.type === vnode.type) {
        if (vnode.type === '#text') {
          if (vnode.text !== old.text) {
            vnode.dom = old.dom
            vnode.dom.nodeValue = vnode.text
          }
        } else {
          vnode.dom = diff(old.dom, vnode, context, parentNode, old)
        }
      } else if (vnode.type === '#text') {
        vnode.dom = document.createTextNode(vnode.text)
        parentNode.replaceChild(vnode.dom, old.dom)

        removeComponent(old, parentNode)
      } else {
        vnode.dom = diff(old.dom, vnode, context, parentNode, old)
      }
      delete old.dom
    } else if (!old){
      vnode.dom = toDOM(vnode, context, parentNode, false)
    }
  })

  if (oldChildren.length > newChildren.length) {
    for(const i = newChildren.length -1 ; i < oldChildren.length; i ++ ) {
      const old = oldChildren[i]
      parentNode.removeChild(old.dom)
      delete old.dom
      old.props && removeComponent(old)
    }
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
  if (vnode.type === '#text') {
    dom = document.createTextNode(vnode.text)
  }else {
    dom = document.createElement(vnode.type)
    dom.__type = vnode.type
    // diff props? 
    diffProps(dom, {}, vnode.props)
    // diff children
    diffChildren(dom, vnode.props.children, context, [])

  }

  let instance = vnode.instance
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