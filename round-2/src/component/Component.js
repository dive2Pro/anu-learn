import { objEmpty } from "../shapes";
import {applyComponentHook} from './lifecycle';
import {assignDefaultProps} from '../props'
import {extractRenderNode} from '../extract'
import { reconcileNodes } from '../reconcile'
import {replaceRootNode} from '../vnode'
export default function Component(props) {
  // getDefaultProps

  // componentWillReceiveProps

  // assign state

  // 在 Component 的 constructor 之中 初始化 props , state
  // 这个方法先于 subclass 的 constructor

  if (props === objEmpty) {
    props = {}
  }

  if (props !== objEmpty) {
    if (this.getDefaultProps) {
      assignDefaultProps(applyComponentHook(this, -2,), props)
    }

    // TODO ? 这里需要 call componentWillReceiveProps ?
    applyComponentHook(this, 2, props)
    this.props = props

  } 
  this.state = this.state || applyComponentHook(this, -1, props)

  this.refs = null
  this['--vnode'] = null
}


Component.prototype = {
  constructor : Component,
  setState : setState,
  forceUpdate : forceUpdate
}



function updateState(state, newState) {
  if (!state) {
    return
  }
  for (var name in newState) {
    state[name] = newState[name]
  }
}
/**
 * 
 * @param {Object|(prevState) => newState } partialstate 
 * @param {Function} callback 
 */
function setState(partialstate, callback) {

  if(applyComponentHook(this, 3, this.props, partialstate) === false ) {
    return
  }
  
  updateState(this.state, partialstate)

  if (callback !== void 0 && typeof callback === 'function') {
    callback.call(this)
  }
  this.forceUpdate()
}

/**
 * 组件进入更新流程
 * componentWillUpdate
 * render
 * 比较 Type
 *  - 同 : Patch
 *  - 否 : Replace
 *  
 */
function forceUpdate(callback) {
  applyComponentHook(this, 4, this.props, this.state)

  var oldNode = this['--vnode']
  var newNode = extractRenderNode(this)

  var newType = newNode.Type
  var oldType = oldNode.Type

  if (oldType !== newType) {
    replaceRootNode(newNode, oldNode, newType, oldType, this)
  } else {
    if (oldType !== 3) {
      // 重头戏 , diff 算法出现
      reconcileNodes(newNode, oldNode, newType, 1)
    } 
    // textShape
    else if (newNode.children !== oldNode.children) {
      oldNode.DOMNode.nodeValue = oldNode.children = newNode.children
    }
  }


  applyComponentHook(this, 5, this.props, this.state);

  if (callback !== void 0 && typeof callback === 'function') {
    callback.call(this)
  }
}