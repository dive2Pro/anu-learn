import {scheduler} from './scheduler'
import {CurrentOwner} from './CurrentOwner'
import {instanceMap} from './instanceMap'
import {options} from './util'
import {diffProps} from './diffProps'
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


function checkNull(vnode, type) {
    if (Array.isArray(vnode) && vnode.length === 1) {
        vnode = vnode[0]
    }
    if (!vnode) {
        return {
            type: '#comment',
            text: 'empty'
        }
    } else if(!vnode.vtype) {
        throw new Error(`
        @${type.name}#render: You may have returned undefined, an array or some other invalid object
        `)
    }
    return vnode
}

function safeRenderComponent(instance, type) {
    CurrentOwner.cur = instance
    let rendered = instance.render()
    rendered = checkNull(rendered, type)

    CurrentOwner.cur = null
    return rendered
}

function getChildContext(instance, parentContext) {
    if (instance.getChildContext) {
        return { parentContext, ...instance.getChildContext()}
    }
    return {...parentContext}
}

function genMountElement(vnode, type, prevRendered) {
    if (prevRendered && toLowerCase(prevRendered) === type) {
        return prevRendered
    } else {
        const dom = document.createElement(vnode)
        if (prevRendered && dom !== prevRendered) {
            while(prevRendered.firstChild) {
                dom.appendChild(prevRendered.firstChild)
            }
        }
        return dom
    }
}




function mountChildren(vnode, parentNode, parentContext) {
    vnode.props.children.map(function mount(el) {
        el._hostParent = vnode

        const curNode = mountVnode(el, parentContext)

        parentNode.appendChild(curNode)
    })
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
function  alignChildren(vnode, parentNode , parentContext, childNodes) {
    const children = vnode.props.children
    let    insertPoint = childNodes[0] || null
    let j = 0 

    for (let i = 0, n = children.length ; i < n ; i ++) {
        let el = children[i]

        el._hostParent = vnode
        const prevDom = childNodes[j]

        const dom = mountVnode(el , parentContext, prevDom)

        if (dom === prevDom) {
            j ++
        }
        /**
         * 操作DOM
         */
        parentNode.insertBefore(dom, insertPoint)

        insertPoint = dom.nextSibling
    }

}

function mountElement(vnode, parentContext, prevRendered) {
    const {type, props} = vnode
    const dom = genMountElement(vnode, type, prevRendered)

    vnode._hostNode = dom

    if(prevRendered) {
        alignChildren(vnode, dom, parentContext, prevRendered.childNodes)
    } else {
        mountChildren(vnode, dom, parentContext)
    }

    if(vnode.checkProps) {
        diffProps(props, {}, vnode, {}, dom)
    }

    if(vnode.ref) {
        scheduler.add(function() {
            vnode.ref(dom)
        })
    }
    if(formElements[type]) {
        processFormElement(vnode, dom, props)
    }

    return dom;
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

    const rendered = safeRenderComponent(instance, type)

    instance._rendered =  rendered
    rendered._hostParent = vnode._hostParent

    let dom = mountVnode(rendered, getChildContext(instance, parentContext), prevRendered)

    instanceMap.set(instance, dom)
    vnode_hostNode = dom

    instance._disableSetState =false

    if (instance.componentDidMount) {
        scheduler.add(instance)
    } else {
        instance._hasDidMount = true
        if (instance._pendingCallbacks.length) {
            scheduler.add(instance)
        }
    }

    if (vnode.ref) {
        scheduler.add(function() {
            vnode.ref(instance)
        })
    }

    options.afterMount(instance)
    vnode._hostNode = dom

    return dom
}

function mountStateless(vnode, parentContext, prevRendered) {
    const { type } = vnode
    let props = getComponentProps(vnode)

    let rendered = type(props, parentContext)
    rendered = checkNull(rendered, type)
   
    const dom = mountVnode(rendered, getChildContext(type, parentContext), prevRendered)

    vnode._instance = {
        _currentElement: vnode,
        _rendered: rendered
    }

    vnode._hostNode = dom
    rendered._hostParent = vnode._hostParent

    return dom
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
