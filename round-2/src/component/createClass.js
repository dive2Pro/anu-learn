import {createEmptyShape} from '../shapes'
import Component from './Component'

/**
 * 初始化 继承自 Component 的对象, 处理 function 和 object
 * 将传入的 非 null subject 包装成 Component, 实际上也是一个 shape
 * 
 * @param {object} props
 * @returns {vnode} shape;
 */
export default function createClass(subject, props) {
  if (subject == null) {
    return createEmptyShape()
  }
  // component cache
  // ...

  const func = typeof subject === 'function'

  //  如果是 function 则执行一次得到 的结果既是 shape
  let shape = func ? (subject(createElement) || createEmptyShape()) : subject
  // 返回的是不是还是一个 'function', 是的话 这是一个 Component
  //  不是  检查他 是否是 一个 Element

  const type = func && typeof shape === 'function' ? 2 : (shape.Type != null ? 1: 0)

  let construct = false

  let vnode
  let constructor
  let render

  // numbers , strings , arrays
  if(type !== 2 && shape.constructor !== Object && shape.render === void 0 ) {
    shape = extractVirtualNode(shape, { props })
  }

  if (type !== 0) {
    render = type === 1 ? (vnode = shape, function() { return vnode }) : shape

    shape = { render }
  } else {
    if (construct = shape.hasOwnProperty('constructor')) {
      constructor = shape.constructor
    }

    if (typeof shape.render !== 'function') {
      shape.render = function () {
        return createEmptyShape()
      }
    }
  }

  function component(props) {
    if (constructor) {
      constructor.call(this, props)
    }
    Component.call(this, props)
  }

  shape.setState = Component.prototype.setState
  shape.forUpdate = Component.prototype.forceUpdate

  if (func) {
    shape.constructor = subject
    subject.COMPCache = component
  }

  if (func || shape.stylesheet !== void 0 ) {
    shape.displayName = (
      shape.displayName ||
      (func ? subject.name : false) ||
      ((Math.random() + 1).toString(36).substr(2, 5))
    )
  }
  return component
}