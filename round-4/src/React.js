/**
 *  收集元素的孩子
 * @param {Node} dom 
 */
function getNodes(dom) {
    const   c   =   dom.childNodes  ||  []
    return [].slice.call(c)
}

function createDOMElement(vnode) {
    const { type } = vnode

    if (type === '#text') {
        const node  =   recyclables[type].pop()
        if (node) {
            node.nodeValue = vnode.text
            return  node
        }
        return document.createTextNode(vnode.text)
    } else if (type === '#comment') {
        return document.createComment(vnode.text)
    }

    return document.createElement(type)
}

function mountElement(vnode, parentContext, prevRendered) {

}

function mountComponent(vnode, parentContext, prevRendered) {
    const { type } = vnode
    let props = getComponentProps(vnode)

    const instance = new type(props, parentContext)

    vnode._instance = instance
    instance._currentElement = vnode
    instance.context = instance.context || parentContext

    if (instance.componentWillMount) {
        instance._disableSetState = true
        instance.componentWillMount()
        instance.state = instance._processPendingState()
        instance._disableSetState = false
    } else {
        instance.componentWillMount = null
    }
    
}
function mountVnode(vnode, parentContext, prevRendered) {
    const { vtype } = vnode

    switch(vtype) {
        case 1:
            return mountElement(vnode, parentContext, prevRendered)
        case 2:
            return mountComponent(vnode, parentContext, prevRendered)
        case 4:
            return mountStateless(vnode, parentContext, prevRendered)
        default:
            const node = prevRendered && prevRendered.nodeName === vnode.type ?
                            prevRendered
                            :   createDOMElement(vnode)
            vnode._hostNode = node
            return node
    }
}

function genVnodes(vnode, container, hostParent, parentContext) {
    const nodes = getNodes(vnode)

    let prevRendered = null 
    /**
     * 重新生成 Vnodes, 会删除掉之前的 Node
     */
    for(let i = 0, el ; (el = nodes[i++]); ) {
        // TODO: 保留它的目的? 可能是 ssr?
        if (el.getAtribute && el.getAtribute('data-reactroot') != null) {
            prevRendered = el
        } else {
            el.parentNode.removeChild(el)
        }
    }

    vnode._hostParent = hostParent

    const rootNode = mountVnode(vnode, parentContext, prevRendered)

    container.appendChild(rootNode)

    return rootNode
}

function isValidElement(vnode) {
    return vnode && vnode.type   
}

function renderByAnu(vnode, container, callback, parentContext) {
    if (!isValidElement(vnode)) {
        throw new Err(`${vnode} 必须为组件或者元素节点， 现在传入的是 ${Object.prototype.toString.call(vnode)}`);
    }

    if (!container || container.nodeType !== 1) {
        console.warn(`${container} must be a dom node`);
        return;
    }

    const prevVnode = container._component;
    const hostParent = {
        _hostNode: container
    };
    let rootNode;

    if(!prevNode) {
        rootNode = genVnodes(vnode, container, hostParent, parentContext);
    } else {
        rootNode = alignVnodes(prevVnode, vnode, container.firstChild, parentContxt);
    }

}

/**  
  *
  */
function render(vnode, container, callback){
    return renderByAnu(vnode, container, callback, {});
};
const React = {
    render
};
