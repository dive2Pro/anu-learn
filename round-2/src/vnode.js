import {applyComponentHook} from './component/lifecycle'
import { createEmptyShape, createComponentShape, createElementShape,
  createNodeShape, objEmpty
} from './shapes'
import {extractComponentNode} from './extract'
import {assignProps} from './props'
/**
 * 将 nextNode  拼接到 parentNode 中,
 * invoke newNode 的 lifeCycle methods
 * @param {vnode Type} nodeType 
 * @param {vnode} newNode 
 * @param {Node} parentNode 
 * @param {Node} nextNode 
 */
export function appendNode(nodeType, newNode, parentNode, nextNode ) {
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
export function createNode(subject, component, namespace) {
  var nodeType = subject.Type

  // create text node

  if (nodeType === 3) {
    return subject.DOMNode = document.createTextNode(subject.children)
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
    assignProps(element, props, false, component)
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
    return document.createComment('create dom node failed , dom type was : ' + type)
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


function replaceRootNode(newNode, oldNode, newType, oldType, component) {
  var refDOMNode = oldNode.DOMNode
  var newProps = newNode.props

  refDOMNode.parentNode.replaceChild(createNode(newNode, component, null), oldNode)
  
  // hydrate new node
  oldNode.props = newProps;
  oldNode.nodeName = newNode.nodeName || newNode.type;
  oldNode.children = newNode.children;
  oldNode.DOMNode = newNode.DOMNode;

}

export function emptyNode(node, length) {
  var parentNode = node.DOMNode
  var children = node.children
  var child 

  for (var i = 0 ; i < children.length ; i ++ ) {
    child = children [i]
    var instance = child.instance 
    applyComponentHook(instance, 6, child.DOMNode)
    child.DOMNode = null
  }


  parentNode.textContent = ''
}
/**
 * 
 * @param {number} oldType 
 * @param {Vnode} oldNode 
 * @param {Node} parentNode 
 */
export function removeNode(oldType, oldNode, parentNode) {
  var instance = child.instance
  applyComponentHook(instance, 6, oldNode.DOMNode)
  parentNode.removeChild(oldNode.DOMNode)
  // 防止内存泄漏
  oldNode.DOMNode = null
}

/**
 * 
 * @param {number} newType 
 * @param {number} oldType 
 * @param {Vnode} newNode 
 * @param {Vnode} oldNode 
 * @param {Node} parentNode 
 * @param {Vnode} nextNode 
 */
export function replaceNode(newType, oldType, newNode, oldNode, parentNode, nextNode ) {
  // lifecycle invoke

  var instance = oldNode.instance

  applyComponentHook(instance, 6, oldNode.DOMNode)

  instance = newNode.instance

  applyComponentHook(instance, 0, nextNode)

  parentNode.replaceChild(nextNode, oldNode.DOMNode)

  applyComponentHook(instance, 1, nextNode)

  oldNode.DOMNode = null
}