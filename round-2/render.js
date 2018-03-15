import {createClass} from './component/createClass';

/**
 * 摒弃一切 非第一次渲染时的代码!
 * @param {Component | Class | Function} subject
 * @param {selector | DOMElement} element 
 * @param {null | function} callback 
 * @param {undefined | boolean} hydration 
 */
export default function render(subject, target, callback, hydration) {
  let initial = true
  let vnode
  let element

  if (subject.render !== void 0 ) {
    vnode = createComponentShape(createClass(subject, null), objEmpty, arrEmpty)
  }
  // array / component / function 
  // TODO : 此时在 render 是 undefined 时 subject 还会是 component 吗?
   else if (subject.Type === void 0) {
    if (Array.isArray(subject)) {
      throw `The first argument can't be an array`
    }

    vnode = createComponentShape(subject, objEmpty, arrEmpty)
  } 
  // component / function 
  else {
    vnode = subject
  }

  if (vnode.Type !== 2) {
    vnode = createComponentShape(createClass(vnode, null), objEmpty, arrEmpty)
  }

  // 到这里, vnode 一定是 ComponentShape

  // -----------------------

  if(target!==null && target.nodeType !== null) {
    element = target === document ? document.body : target
  }

  if (hydration !== null && hydration !== false) {

  } else {
    renderer()
  }

  if (callback && typeof callback === 'function') {
    callback.call(component, vnode.DOMNode || target)
  }

  return renderer;

  function renderer(newProps) {
    if (initial) {
      appendNode(nodeType, vnode, element, createNode(vnode, null, null))
      initial = false
      component = vnode.instance
    }
    return renderer;
  }
}
