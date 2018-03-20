import {toDom, Component} from 'Component'
import {extend} from './utils'

/**
 * 
 * @param {Vnode[]} children 
 * @param {[]} ret 
 */
function flatChildren(children, ret = []) {
  let el
  let type
  /**
   * 从后向前 flat
   * 此时 ret[0] 是队尾 , 每一次只要是 number 或者 string type 的一段 children, 通过
   * ret.merge 来标识, ret[0] 收集合并这一段的简单数据类型
   */
  for(let i = children.length; i -- ;) {
      el = children[i]
      if (!el) {
        el = ''
      }
      type = typeof el

      if (el  === '' || type === 'boolean') {
        continue
      }
      if (/number|string/.test(type) || type === '@text') {
        if (el === '' || el.text == '') {
          continue
        }

        if (ret.merge) {
          ret[0] = (el.type ? el.text : el) + ret[0]
        } else {
          ret.unshift(el.type ? el : {type: el.type, text: String(el)})
          ret.merge = true
        }
      } else if (Array.isArray(el)) {
        flatChildren(el, ret)
      } else {
        ret.unshift(el)
        ret.merge = false
      }

  }
  
  return ret;
}
/**
 * 创建虚拟 DOM
 * 
 * @param {VNode} type 
 * @param {Object} configs 
 * @param {any[]} children 
 */
function createElement(type, configs = {}, ...children) {
  const props = {}
  extend(props, configs)

  const c = flatChildren(props.children || children)

  delete c.merge
  props.children = Object.freeze(c)
  Object.freeze(props)

  return {
    type,
    props
  }
}
/**
 * 
 * @param {VNode} vnode 
 * @param {Node} container 
 */
function render(vnode, container) {
  container.textContent = ''
  while(container.firstChild) {
    container.removeChild(container.firstChild)
  }
  const context = {}
  toDOM(vnode, context, container)
}
const React = {
  render,
  createElement,
  Component
}
window.ReactDOM = React
window.React = React