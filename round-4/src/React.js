import { scheduler } from "./scheduler";
import { CurrentOwner } from "./CurrentOwner";
import { instanceMap } from "./instanceMap";
import { options } from "./util";
import { diffProps } from "./diffProps";
import { processFormElement } from "./ControlledComponent";

/**
 *  收集元素的孩子
 * @param {Node} dom
 */
function getNodes(dom) {
  const c = dom.childNodes || [];
  return [].slice.call(c);
}

function createDOMElement(vnode) {
  const { type } = vnode;

  if (type === "#text") {
    const node = recyclables[type].pop();
    if (node) {
      node.nodeValue = vnode.text;
      return node;
    }
    return document.createTextNode(vnode.text);
  } else if (type === "#comment") {
    return document.createComment(vnode.text);
  }

  return document.createElement(type);
}

function checkNull(vnode, type) {
  if (Array.isArray(vnode) && vnode.length === 1) {
    vnode = vnode[0];
  }
  if (!vnode) {
    return {
      type: "#comment",
      text: "empty"
    };
  } else if (!vnode.vtype) {
    throw new Error(`
        @${
          type.name
        }#render: You may have returned undefined, an array or some other invalid object
        `);
  }
  return vnode;
}

function renderComponent(instance, type, vnode, context) {
  CurrentOwner.cur = instance;
  let rendered = instance.render();
  instance._currentElement = vnode
  CurrentOwner.cur = null;
  rendered = checkNull(rendered, type);

  vnode._renderedVnode = rendered
  instance._childContext = getChildContext(instance, context)
  return rendered;
}

function getChildContext(instance, parentContext) {
  if (instance.getChildContext) {
    return { parentContext, ...instance.getChildContext() };
  }
  return { ...parentContext };
}

function genMountElement(vnode, type, prevRendered) {
  if (prevRendered && toLowerCase(prevRendered) === type) {
    return prevRendered;
  } else {
    const dom = document.createElement(vnode);
    if (prevRendered && dom !== prevRendered) {
      while (prevRendered.firstChild) {
        dom.appendChild(prevRendered.firstChild);
      }
    }
    return dom;
  }
}

function StateLess(render) {
    this.refs = {}
    this.type = render
    this.__collectRefs = noop
}

StateLess.prototype.render = function(vnode, context) {
    const props = genComponentProps(vnode)
    let rendered = this.type(props, context)
    rendered = checkNull(rendered, this.type)
    this.context = context
    this.props = props
    vnode._instance = this
    this._currentElement = vnode
    vnode._renderedVnode = rendered

    return rendered
}
function mountStateless(vnode, context, prevRendered, mountQueue) {

    const instance = new StateLess(vnode.type)
    let rendered = instance.render(vnode, context)
    let dom = mountVnode(rendered, context, prevRendered, mountQueue)
    return vnode._hostNode = dom
}

function mountChildren(vnode, parentNode, parentContext, mountQueue) {
  vnode.props.children.map(function mount(el) {
    el._hostParent = vnode;

    const curNode = mountVnode(el, parentContext, null, mountQueue);

    parentNode.appendChild(curNode);
  });
}
/**
 * 对齐 Children? 什么意思呢?
 *
 * 现在假设 所有的childNodes 与 mountVnode 生成的dom 没有 === 的
 * 那么 此时 dom 结构是这样的:
 * ```
 * <parentNode>
 * <vnode.props.children.map(mountVnode) />
 * <childNodes/>
 *
 * </parentNode>
 * ```
 * @param {VNode} vnode
 * @param {Node} parentNode
 * @param {Object} parentContext
 * @param {Node[]} childNodes
 */
function alignChildren(vnode, parentNode, parentContext, mountQueue) {
  const children = vnode.props.children;
  const childNodes = parentNode.childNodes
  let insertPoint = childNodes[0] || null;
  let j = 0;
  let n = children.length

  for (let i = 0, n = children.length; i < n; i++) {
    let el = children[i];

    el._hostParent = vnode;
    const prevDom = childNodes[j];

    const dom = mountVnode(el, parentContext, prevDom, mountQueue);

    if (dom === prevDom) {
      j++;
    }
    /**
     * 操作DOM
     */
    parentNode.insertBefore(dom, insertPoint);

    insertPoint = dom.nextSibling;
  }

  while(childNodes[n]) {
      parentNode.removeChild(childNodes[n])
  }
}

function mountElement(vnode, parentContext, prevRendered, mountQueue) {
  const { type, props, _owner, ref } = vnode;
  const dom = genMountElement(vnode, type, prevRendered);
  vnode._hostNode = dom;
  const method = prevRendered ? alignChildren : mountChildren;
  method.call(0, vnode, dom, parentContext, mountQueue);

  if (vnode.checkProps) {
    diffProps(props, {}, vnode, {}, dom);
  }

  if (ref && _owner) {
    _owner.__collectRefs(ref.bind(vnode, dom));
  }
  if (formElements[type]) {
    processFormElement(vnode, dom, props);
  }

  return dom;
}

function mountComponent(vnode, context, prevRendered, mountQueue) {
  const { type, ref } = vnode;
  let props = getComponentProps(vnode);

  const instance = new type(props, parentContext);

  vnode._instance = instance;
  instance.props = instance.props || props;
  instance.context = instance.context || parentContext;

  if (instance.componentWillMount) {
    instance.componentWillMount();
    instance.state = instance.__mergeStates(props, context);
  }

  const rendered = renderComponent(instance, type);
  
  instance.__dirty = false
  instance.__hasRendered = true;

  let dom = mountVnode(
    rendered,
    getChildContext(instance, parentContext),
    prevRendered,
    mountQueue
  );

  vnode_hostNode = dom;
  mountQueue.push(instance)
  if (ref) {
      instance.__collectRefs(ref.bind(vnode, instance))
  }
  options.afterMount(instance);
  return dom;
}

let patchAdapter = {
  0: mountText,
  1: mountElement,
  2: mountComponent,
  4: mountStateless,
  10: updateText,
  11: updateElement,
  12: updateComponent,
  14: updateStateless
};
function mountText(vnode, context, prevRendered) {
  let node =
    prevRendered && prevRendered.nodeName === vnode.type
      ? prevRendered
      : createDOMElement(vnode);
  vnode._hostNode = node;
  return node;
}

function mountVnode(vnode, parentContext, prevRendered, mountQueue) {
  return patchAdapter[vnode.vtype](vnode, context, prevRendered, mountQueue);
}

options.refreshComponent = refreshComponent;

function refreshComponent(instance, mountQueue) {
  const dom = instance._currentElement._hostNode;

  dom = _refreshComponent(instance, dom, mountQueue);

  instance.__forceUpdate = false;

  clearArray(instance.__pendingCallbacks).forEach(function(fn) {
    fn.call(instance);
  });

  if (instance.__reRender) {
    instance.__pendingCallbacks = instance.__tempUpdateCbs;

    instance.__reRender = instance.__tempUpdateCbs = null;

    return refreshComponent(instance, []);
  }

  return dom;
}

function _refreshComponent(instance, dom, mountQueue) {
  let {
    lastProps,
    lastContext,
    state: lastState,
    context: nextContext,
    _currentElement: vnode,
    props: nextProps,
    constructor: type
  } = instance;
  lastProps = lastProps || nextProps;
  // 所有的 setState 中的 state, 在真正渲染前合并
  let nextState = instance.__mergeStates(nextProps, nextContext);
  instance.props = lastProps;

  if (
    !instance.__forceUpdate &&
    instanceeshouldComponentUpdate &&
    instance.shouldComponentUpdate(nextProps, nextStatem, context) === false
  ) {
    instance.__dirty = false;
    return dom;
  }

  if (instance.componentWillUpdate) {
    instance.componentWillUpdate(nextProps, nextState, nextContext);
  }

  instance.__updating = true;

  instance.props = props;
  instance.state = nextState;

  let lastRendered = vnode._renderedVnode;
  let nextElement = instance._nextElement || vnode;

  if (!lastRendered._hostNode) {
    lastRendered._hostNode = dom;
  }

  let rendered = renderComponent(instance, type, nextElement, nextContext);
  delete instance._nextElement;

  dom = alignVnodes(
    lastRendered,
    rendered,
    dom,
    instance._childContext,
    mountQueue
  );

  nextElement._hostNode = dom;
  if (instance.componentDidUpdate) {
    instance.componentDidUpdate(lastProps, lastState, lastContext);
  }
  instance.__updating = false;
  instance.__dirty = false;
  instance.__reRender = instance.__rerender;

  delete instance.__rerender;
  options.afterUpdate(instance);
  return dom;
}

function alignVnodes(lastVnode, nextVnode, node, context, mountQueue) {
  let dom = node;

  if (nextVnode == null) {
    removeDOMElement(node);
    disposeVnode(lastVnode);
  } else if (
    !(lastVnode.type == nextVnode.type && lastVnode.key === nextVnode.key)
  ) {
    disposeVnode(lastVnode);

    let innerMountQueue = mountQueue.mountAll ? mountQueue : [];

    dom = mountVnode(nextVnode, context, null, innerMountQueue);
    let p = node.parentNode;
    if (p) {
      p.replaceChild(dom, node);
      removeDOMElement(node);
    }
    if (innerMountQueue !== mountQueue) {
      clearRefsAndMounts(innerMountQueue);
    }
  } else if (lastVnode !== nextVnode) {
    dom = updateVnode(
      lastVnode,
      nextVnode,
      node || lastVnode._hostNode,
      context,
      mountQueue
    );
  }
  return dom;
}
function genVnodes(vnode, container, hostParent, parentContext) {
  const nodes = getNodes(vnode);

  let prevRendered = null;
  /**
   * 重新生成 Vnodes, 会删除掉之前的 Node
   */
  for (let i = 0, el; (el = nodes[i++]); ) {
    // TODO: 保留它的目的? 可能是 ssr?
    if (el.getAtribute && el.getAtribute("data-reactroot") != null) {
      prevRendered = el;
    } else {
      el.parentNode.removeChild(el);
    }
  }

  const rootNode = mountVnode(vnode, parentContext, prevRendered);
  container.appendChild(rootNode);

  return rootNode;
}

function isValidElement(vnode) {
  return vnode && vnode.type;
}

function renderByAnu(vnode, container, callback, parentContext = []) {
  if (!isValidElement(vnode)) {
    throw new Err(
      `${vnode} 必须为组件或者元素节点， 现在传入的是 ${Object.prototype.toString.call(
        vnode
      )}`
    );
  }

  if (!container || container.nodeType !== 1) {
    console.warn(`${container} must be a dom node`);
    return;
  }
  let mountQueue = [];
  const lastVnode = container._component;
  mountQueue.mountAll = true;

  let rootNode;

  if (!lastVnode) {
    rootNode = genVnodes(vnode, container, parentContext, mountQueue);
  } else {
    rootNode = alignVnodes(
      lastVnode,
      vnode,
      container.firstChild,
      parentContxt,
      mountQueue
    );
  }

  // 如果存在后端渲染的对象（打包进去），那么在ReactDOM.render这个方法里，它就会判定容器的第一个孩子是否元素节点
    // 并且它有data-reactroot与data-react-checksum，有就根据数据生成字符串，得到比较数

    if (rootNode.setAttribute) {
        rootNode.setAttribute("data-reactroot", "");
    }

    const instance = vnode._instance
    container._component = vnode
    if(callback) {
        callback()
    }

    clearRefsAndMounts(mountQueue)
    return instance || rootNode
}
/**
 * 
 * @param {instance[]} mountQueue 
 */
function clearRefsAndMounts(mountQueue) {
    mountQueue.forEach(function(el) {
        let refFns = el.__pendingRefs

        if (refFns) {
            refFns.forEach( refFn => {
                refFn()
            })
        }

        if (el.componentDidMount) {
            el.componentDidMount()
            el.componentDidMount = null
        }

        clearArray(el.__pendingCallbacks).forEach(function(fn) {
            fn.call(el)
        })
        el._hasDidMount = true
    })
    mountQueue = 0
}
/**
 *
 */
function render(vnode, container, callback) {
  return renderByAnu(vnode, container, callback, {});
}
const React = {
  render
};
