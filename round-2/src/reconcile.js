import {extractComponentNode} from './extract'
import {emptyNode, removeNode, createNode, replaceNode} from './vnode'
import { nodeEmpty } from './shapes';
import {patchProps} from './props'
import {applyComponentHook} from './component/lifecycle'
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

    var newKeys = {}
    var oldKeys = {}
    var newKey
    var oldKey
    for (var i = 0 ; i < length ; i ++ ) {
      newType = i < newLength ? (newChild = newChildren[i]).Type : (newChild = nodeEmpty, 0)
      oldType = i < oldLength ? (oldChild = oldChildren[i]).Type : (oldChild = nodeEmpty, 0)

      if (keyed) {
        if (newType !== 0) {
          newKeys[newChild.key] = (newChild.index = i , newChild)
        }

        if (oldType !== 0) {
          oldKeys[oldChild.key] = (oldChild.index = i, oldChild);
        }
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
      else if ((newKey = newChild.key) != (oldKey = oldChild.key)) {
        keyed = true
        newKeys = {}
        oldKeys = {}

        newKeys[newKey] = newChild
        oldKeys[oldKey] = oldChild
        position  = i
      }
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

  if (keyed) {
    reconcileKeys(newKeys, oldKeys, parentNode, newNode, oldNode, newLength, oldLength, position, length );
  }
  if (newNode.props != oldNode.props) {
    patchProps(currentNode, oldNode)
  }
  applyComponentHook(oldComponent, 5, newProps, newState)
}

/**
 * 
 * 理解 keys 在 React 中的 作用 , 在这里至关重要
 * keys 可以在 React 中 标识 组件, 决定一个组件是否 reconcile
 * 同是 Parent 下的 Children, 当 Parent setState 时, 虽然此时会 为所有的 children 重新根据 render 方法生成 vnode , 
 * 但是这是在 js 的 Object 的层面, 没有去浏览器中操作 DOM.
 * 而每一次的改变, 需要体现在 DOM 上面, 那么只有递归每一个 children, 也就是 children.forEach(reconcileNodes) 才能确保
 * parent 的 props 改变准确的反应在 DOM 上面
 * 
 * 如果 现在有一个非常大的列表, 这个时候 上面的操作就会变的可怕, 每一次 Parent 的任何改变都会将整颗 组件树 remove & build 一次
 * 
 * 所以, React 引入 keys 来 标识 组件
 * 
 * 处于 children 中同一位置的 Component, 如果它们否 key 值相同, React 就认为它们是同一个 Component, 更新的只是 该 child 
 * 挂载的 DOMNode 
 * 
 * @param {<String, *> []} newKeys 
 * @param {<String, *> []} oldKeys 
 * @param {Node} parentNode 
 * @param {VNode} newNode 
 * @param {VNode} oldNode 
 * @param {int} newLength 
 * @param {int} oldLength 
 * @param {int} position 
 * @param {int} length 
 */
function reconcileKeys(newKeys, oldKeys, parentNode, newNode, oldNode, newLength, oldLength, position, length) {
  const reconciled = []
  const oldChildren = oldNode.children
  const newChildren = newNode.children
  let newChild
  let oldChild
  let i = 0
  let index
  let nextNode

  let key 

  let added = 0 
  let removed = 0 
  let offset = 0
  //  没有遇到  设置 key  的 child 时, 这些 'oldChildren' 都是已经 reconciled
  if (position > 0 ) {
    for( ; i < position ; i ++) {
      reconciled[i] = oldChildren[i]
    }
  }

  for( i = 0 ; i < length ; i ++) {
    newChild = newChildren[(index = (newLength - 1) - i)]
    oldChild = oldChildren[oldLength - 1 - i]

    if (newChild.key === oldChild.key) {
      reconciled[index] = oldChild
      length -- 
    } else {
      break
    }
  }

  for( i = position; i < length; i ++ ) {
    // 此时都是剩下的 节点, 那些 "开始会不同" 的节点
    if ( i < oldLength) {
      oldChild = oldChildren[i]
      newChild = newKeys[oldChild.key]
      if (newChild === void 0 ) {
        removeNode(oldChild.Type, oldChild, parentNode)
      }
    }

    if ( i < newLength) {
      newChild = newChildren[i]
      oldChild = oldKeys[newChild.key]

      if (oldChild === void 0 ) {
        // add
        nextNode = createNode(newChild, null, null);

        if (i < length + added) {
          insertNode(
            newChild.Type,
            newChild,
            oldChildren[i - added].DOMNode,
            parentNode,
            nextNode
          )
        } else {
          // append
          appendNode(
            newChild.Type,
            newChild,
            parentNode,
            nextNode
          )
        }
        reconciled[i] = newChild;
        added ++ 
      } else {
        index = oldChild.index
        offset = index - removed

        // moved
        if (offset !== i) {
          key = oldChildren[offset].key
          if (newKeys[key] !== void 0 ) {
            // 在 newNodes 中的 offset
            offset = i - added
            if (newChild.key !== oldChildren[offset].key) {
              nextNode = oldChild.DOMNode;
              prevNode = oldChildren[offset - (moved++)].DOMNode;

              if (nextNode !== prevNode) {
                parentNode.insertBefore(nextNode, prevNode);
              }
            }
          }
        }
        reconciled[i] = oldChild
      }
    }
  }
  
  oldNode.children = reconciled;
}
