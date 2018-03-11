import {createComponentShape, createElement, createEmptyShape} from './createElement'
function appendNode(newType, newNode, parentNode, nextNode) {
	// TODO: **instance 是什么?**
	let instance = newNode.instance
	let ok = newType === 2 && instance

	if (ok && instance.componentWillMount) {
		// 不是应该传递 props 吗
		// 答: 否, React 中不传递任何东西
		// TODO: 为何要传递 nextNode?
		instance.componentWillMount(nextNode)
	}

	parentNode.appendChild(nextNode)

	if (ok && instance.componentDidMount) {
		instance.componentDidMount(nextNode)
	}
}

function updatePropObject(parent, prop, target) {
	for (let name in prop) {
		const value = prop[name] || null

		if (name in target ) {
			target[name] = value
		}
		// style properties that don't exist on CSSStyleDeclaration
		else if (parent === 'style') {
			value ? target.setProperty(name, value, null) : target.removeProperty(name)
		}
	}
}

function updateProp(target, set, name, value, namespace) {
	if ( (value === nsSvg || value === nsMath)) {
		return
	}

	if (name === 'xlink:href') {
		target[(set ? 'set' : 'remove') + 'AttributeNS'] (nsXlink, 'href', value)
		return
	}
	let svg = false
	// svg element , default to class instead of className
	if (namespace === nsSvg) {
		svg = true

		if (name === 'className') {
			name = 'class'
		} else {
		}
	}
	// html element , default to className instead of class
	else {
		if (name === 'class') {
			name = 'className'
		}
	}
	let destination = target[name]
	let defined = value != null && value !== false

	if (defined && typeof defined === 'object') {
		destination === void 0 ? target[name] = value : updatePropObject(name, value, destination)
	}
	// primitives `string, number, boolean`
	else {
		if (destination !== void 0 && svg === false) {
			/**
			 * ** Oh ho ~ **
			 */
			if (name === 'style') {
				target.style.cssText = value
			} else {
				target[name] = value
			}
		}
		// set / remove Attribute
		else {
			if (defined && set ) {
				target.setAttribute(name, value === true ? '' : value)
			} else {
				target.removeAttribute(name)
			}
		}
	}
}

const ron = /^on[A-Z]\w+$/
function isEventProp(name) {
	return ron.test(name)
}

function assignProps(target, props, onlyEvents, component) {
	for (let name in props) {
		let value = props[name]
		if (name === 'refs' && value != null) {
			refs(value, component, target)
		}
		else if (isEventProp(name)) {
			addEventListener(target, name.substring(2).toLocaleLowerCase(), value, component)
		}
		else if (onlyEvents === false && name !== 'key' && name !== 'children') {
			updateProp(target, true, name, value, props.xmlns)
		}
	}
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
	if (subject == null) {
		subject = createEmptyShape()
	}

	// TODO: component cache
	if (subject.COMPCache !== void 0 ) {
		return subject.COMPCache
	}

	const func = typeof subject === 'function'

	// TODO: subject(createElement) ? 做了什么
	// 如果是 func 传递的 createElement 作为 props 返回的是正确的 shape 吗?
	// 这里是已经将这个 function 展开了吗?
	let shape = func ? (subject(createElement) || createEmptyShape()) : subject
	const type = func && typeof shape === 'function' ? 2 : (shape.Type != null ? 1: 0)

	let vnode
	let constructor
	let render

	if (type !== 2 && shape.constructor !== Object && shape.render === void 0) {
		shape = extractVirtualNode(shape, {props})
	}

	// elements / functions
	if( type !== 0) {
		// 这里 将 function component 转换成 class Component
		render = type === 1 ? (vnode = shape, function() { return vnode }) : shape

		shape = { render }
	} else {
		if (constructor = shape.hasOwnProperty('constructor')) {
			constructor = shape.constructor
		}

		if ( typeof shape.render !== 'function') {
			shape.render = function() { return createEmptyShape() }
		}
	}

	function component(props) {
		if (constructor) {
			constructor.call(this, props)
		}
		Component.call(this, props)
	}

	component.prototype = shape

	// extends Component class
	shape.setState = Component.prototype.setState
	shape.forceUpdate = Component.prototype.forceUpdate
	component.constructor = component

	if (func) {
		shape.constructor = subject
		subject.COMPCache = component
	}

	if (func || shape.styleSheet !== void 0) {
		shape.displayName = (
			shape.displayName ||
			(func ? subject.name : false) ||
			((Math.random() + 1).toString(36).substr(2, 5))
		)
	}

	return component

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
			appendNode(nodeType, vnode, element, createNode(vnode, null ,null))

			initial = false
			component = vnode.instance
		}

		return renderer;
	}
}