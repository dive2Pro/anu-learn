import {applyComponentHook} from './component/lifecycle'
import { createEmptyShape, createComponentShape, createElementShape,
  createNodeShape
} from './shapes'
/**
 * 将 nextNode  拼接到 parentNode 中,
 * invoke newNode 的 lifeCycle methods
 * @param {vnode Type} nodeType 
 * @param {vnode} newNode 
 * @param {Node} parentNode 
 * @param {Node} nextNode 
 */
function appendNode(nodeType, newNode, parentNode, nextNode ) {
  var instance = newNode.instance
  applyComponentHook(instance, 0, nextNode)

  parentNode.appendChild(nextNode)

  applyComponentHook(instance, 1, nextNode)
}



/**
 * 
 * @param {vnode} subject 
 * @param {type} component 
 * @param {string} namespace 
 * @returns {Node} element 真实 DOM 节点
 */
function createNode(subject, component, namespace) {
  var nodeType = subject.Type

  // create text node

  if (nodeType === 3) {
    return subject.DOMNode = document.createTextNode(subject)
  }

  var vnode 
  var element
  
  vnode = nodeType === 2 ? extractComponentNode(subject, null, null) : subject

  // element
  var Type = vnode.Type
  var children = vnode.children

  if (Type === 3) {
    return vnode.DOMNode = subject.DOMNode = document.createTextNode(children)
  }

  var type = vnode.type
  var props = vnode.props
  var length = children.length

  var instance = vnode.instance != null
  var thrown = 0


  // TODO :  弄清楚 instance , ['--thrown']  和  ['--vnode'] 在哪里处理的
  if (instance) {
    component = subject.instance
    thrown = component['--thrown']
  }

  element = createDOMNode(type, component)
  vnode.DOMNode = subject.DOMNode = element

  if (instance) {
    // TODO throw
    // 子 vnode
    vnode = component['--vnode']

    // 添加到 子 vnode 中
    if (vnode.DOMNode === null) {
      vnode.DOMNode = element
    }
  }

  if (length > 0) {
    for (var i = 0; i < length ; i ++) {
      var newChild = children[i]

      if(newChild.DOMNode !== null) {
        newChild = children[i] = cloneNode(newChild)
      }
      appendNode(newChild.Type, newChild, element, createNode(newChild, component, namespace))
    }
  }

  if (props !== objEmpty) {
    // TODO: until Component finished
    // assignProps(element, props, false, component)
  }

  return element
}
/**
 * 
 * @param {string} type 
 * @param {Component} component 
 */
function createDOMNode(type, component) {
  try{
    return document.createElement(type)
  } catch(e) {
    reutrn document.createComment('create dom node failed , dom type was : ' + type)
  }
}


export function cloneNode(subject) {
  return createNodeShape(
      subject.Type,
      subject.type,
      subject.props,
      subject.children,
      subject.DOMNode,
      null,
      0,
      null,
      void 0
  );
}
