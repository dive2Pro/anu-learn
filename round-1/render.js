import {createComponentShape, createElement} from './createElement'
function appendNode(newType, newNode, parentNode, nextNode) {

}
function createNode(subject, component, namespace) {
	let nodeType = subject.Type

	// text
	if (nodeType === 3) {
		return subject.DOMNode = document.createTextNode(subject.children)
	}

	let vnode
	let element

	let portal = false

	if (subject.DOMNode !== null) {
		element = subject.DOMNode

		/**
		 * TODO: 复制
		 */
		if (portal = (nodeType === 4 || nodeType === 5)) {
			element = (vnode = subject).DOMNode = (nodeType === 4 ? element.cloneNode(true): element)
		}
	}
	// create DOMNode
	else {
		vnode = nodeType === 2 ? extractComponentNode(subject, null, null) : subject
	}
	let Type = vnode.type
	let children = vnode.children

	if (portal === false) {
		if (Type === 3) {
			return vnode.DOMNode = subject.DOMNode = document.createTextNode(children)
		}

		else if (Type === 4 || Type === 5) {
			element = vnode.DOMNode
			portal = true
		}
	}

	let type = vnode.type
	let props = vnode.props
	let length = children.length

	// TODO : 哪里赋值 instance ?
	let instance = subject.instance !== null
	let thrown = 0

	// has a component instance , hydrate component instance
	if( instance ) {
		component = subject.instance
		// TODO: 哪里赋值给  '--throw' ?
		thrown = component['--throw']
	}

	if (portal === false) {
		//
		if (namespace !== null) {
			// TODO: ...
		}
		else {
			element = createDOMNode(type, component)
		}
		vnode.DOMNode = subject.DOMNode = element
	}
	/**
	 * TODO: 为什么 这一段要在 createDOMNode 之后执行?
	 */
	if (instance) {
		// avoid appending children if an error was thrown while creating a DOMNode
		if(thrown !== component['--throw']) {
			return vnode.DOMNode = subject.DOMNode = element
		}

		vnode = component['--vnode']

		if (vnode.DOMNode === null) {
			vnode.DOMNode = element
		}

		// stylesheets
		if(nodeType === 2 && component.styleSheet !== void 0 && type !== 'noscript' && type !== '#text') {
			createScopedStyleSheet(component, subject.type, element)
		}
	}

	if (length !== 0) {
		for (var i = 0 ; i < length ; i++) {
			let newChild = children[i]
			if (newChild.DOMNode !== null) {
				newChild = children[i] = cloneNode(newChild)
			}

			appendNode(newChild.Type, newChild, element, createNode(newChild, component, namespace))
		}
	}

	if (props !== objEmpty) {
		assignProps(element, props, false, component)
	}

	// 返回的是真实的 DOM reference
	return element
}
/**
 * 初始化 inherit class
 * @param subject
 * @param props
 * @returns {*}
 */
function createClass (subject, props) {
	return new subject(props)
}
/**
 * subject 可以是 <MyComponent/>
 * 				 也可以是 <div/> 这样实际的 DOM
 * 				 区别在于 首字母 的 大小写 (重要!)
 * Component 的 返回的 element 会被 渲染更新到真实 dom
 * @param subject
 * @param target
 * @param callback
 * @param hydration
 */
function render(subject, target, callback, hydration) {
	/**
	 * 全局参数, 用来指示是否是初次渲染
	 * @type {boolean}
	 */
	let initial = true;
	let nodeType = 2

	let component
	let vnode
	let element

	/**
	 * TODO: 表示是一个 Component object, 不是 function component?
	 *
	 */
	if (subject.render !== void 0) {
		vnode = createComponentShape(createClass(subject, null), objEmpty, arrEmpty);
	}
	// array / component / function
	else if (subject.Type === void 0) {
		if (subject.constructor === Array) {
			vnode = createElement('@', null, subject)
		}
		// component / function
		else {
			vnode = createComponentShape(subject, objEmpty, arrEmpty)
		}
	}
	// 传入的是一个 element / component  (vnode)
	else {
		vnode = subject
	}

	// element
	/**
	 * 这里 表示 传入的 subject 没有 render 方法, 是 element!
	 */
	if (vnode.Type !== 2) {
		vnode = createComponentShape(createClass(vnode, null), objEmpty, arrEmpty)
	}

	if (target != null && target.nodeType != null) {
		element = target === document ? document.body : target
	} else {
		// 支持 传入 container 的 selector
		target = document.querySelector(target)

		element = (target === null  || target === document) ? document.body : target
	}

	// hydration
	if (hydration != null && hydration !== false) {
		// TODO : server side render
	} else {
		// 清空 container
		hydration === false && (element.textContent = '')

		renderer()
	}
	/**
	 * 同步渲染完毕后的回调
	 */
	if (callback && typeof callback === 'function') {
		callback.call(component, vnode.DOMNode || target)
	}
	return renderer

	function renderer(newProps)	 {
		if (initial) {
			// appendNode 就是将 true dom 更新
			apeendNode(nodeType, vnode, element, createNode(vnode, null ,null))

			initial = false
			component = vnode.instance
		}
	}
}