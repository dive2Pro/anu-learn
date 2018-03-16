import {extractComponentNode} from './extract'
import {emptyNode, removeNode, createNode, replaceNode} from './vnode'
import { nodeEmpty } from './shapes';
/**
 * reconcile nodes 
 * 这里 要去渲染的是 children
 * 
 * newNode 是还没有挂载上 DOMNode 的, 所以在此中进行 DOM 操作的都是在 oldNode 中的 DOMNode 去操作
 * 这样的可以精确到 具体到 DOM 上面
 * 
 * @param {Vnode} newNode 
 * @param {Vnode} oldNode 
 * @param {number} newNodeType 
 * @param {number} oldNodeType 
 */
export function reconcileNodes(newNode, oldNode, newNodeType, oldNodeType) {
  if (newNode === oldNode) {
    return
  }
  // 根据 render 返回的 Vnode 从中 extract 出 Node
  var currentNode = newNodeType === 2 ? extractComponentNode(newNode, null, null) : newNode

  /**
   * 在 setState 中 oldNodeType always equals 1
   */
  if (oldNodeType === 2) {

    var oldComponent = oldNode.instance
    var newComponent = newNode.instance

    var newProps = newComponent.props
    var newState = newComponent.state

    if (!applyComponentHook(oldComponent, 3, newProps, newState )) {
      return
    }
    applyComponentHook(oldComponent, 4, newProps, newState )
  }
  // children
  var newChildren = currentNode.children;
  var oldChildren = oldNode.children;

  // children length
  var newLength = newChildren.length;
  var oldLength = oldChildren.length;

  if (newLength === 0) {
    if(oldLength !== 0 ) {
      emptyNode(oldNode, oldLength)
      oldNode.children = newChildren
    }
  } else {
    // 
    var parentNode = oldNode.DOMNode

    var length = newLength > oldLength ? newLength : oldLength

    var newChild
    var oldChild

    var newType
    var oldType
    var keyed


    for (var i = 0 ; i < length ; i ++ ) {
      newType = i < newLength ? (newChild = newChildren[i]).Type : (newChild = nodeEmpty, 0)
      oldType = i < oldLength ? (oldChild = oldChildren[i]).Type : (oldChild = nodeEmpty, 0)

      if (keyed) {
      } else if (newType === 0 ) {
        removeNode(oldType, oldChildren.pop(), parentNode)
        oldLength --
      } else if (oldType === 0 ) {
        appendNode(newNodeType, oldChildren[i] = newChild, parentNode, createNode(newChild, null, null))
      } else if (oldType === 3 && newType === 3) {
        if(newChild.children != oldChild.chilren) {
          oldChild.DOMNode.nodeValue = oldChild.children = newChild.children
        }
      } 
      // key
      // else if ()
      else if (newType !== oldType) {
        replaceNode( 
          newType,
          oldType,
          oldChildren[i] = newChild,
          oldChild,
          parentNode
          , createNode(newChild, null, null))
      } else {
        // re
        reconcileNodes(newChild, oldChild, newType, oldType);
      }
    }
  }

  applyComponentHook(oldComponent, 5, newProps, newState)
}